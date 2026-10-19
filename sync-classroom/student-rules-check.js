/**
 * Live Student-Permission (Security Rules) Checker
 *
 * WHY THIS EXISTS:
 *   firebase-admin BYPASSES Firestore security rules. Any test that writes with the
 *   admin SDK (or with the teacher account, which matches isAdmin()) will "pass" even
 *   when every real student write is rejected with PERMISSION_DENIED. That is how
 *   Period 0 lost work.
 *
 * HOW IT WORKS:
 *   1. Mints a Firebase custom token whose claims look exactly like a real student's
 *      Google sign-in (email=<id>@orangeusd.org, email_verified=true).
 *   2. Exchanges it for a real ID token via the Identity Toolkit REST API.
 *   3. Hits the Firestore REST API with that ID token -> the DEPLOYED rules are enforced.
 *   4. Scans the webapp source for every collection it touches and replays a
 *      student-shaped read/write on each one.
 *   5. Cleans up test docs + the temporary auth users with the admin SDK.
 *
 * No extra npm deps (uses Node 18+ global fetch).
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'site-6e500';
const WEB_API_KEY = 'AIzaSyAji2nTjD2dbmzgk8gySWCy-aiQyKvR1i4'; // public web key (already in every webapp)
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const REPO_ROOT = path.join(__dirname, '..');
const SYNTHETIC_ID = 'zzpreflight' + Date.now().toString().slice(-6); // never collides with a 6-digit student ID

// ---------- helpers ----------
async function studentIdToken(admin, studentId) {
  const uid = `preflight-${studentId}`;
  const customToken = await admin.auth().createCustomToken(uid, {
    email: `${studentId}@orangeusd.org`,
    email_verified: true,
  });
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${WEB_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: customToken, returnSecureToken: true }) }
  );
  const json = await res.json();
  if (!json.idToken) throw new Error('Could not obtain student ID token: ' + JSON.stringify(json.error || json));
  return { uid, idToken: json.idToken };
}

function toFields(obj) {
  const f = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'number') f[k] = Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    else if (typeof v === 'boolean') f[k] = { booleanValue: v };
    else f[k] = { stringValue: String(v) };
  }
  return { fields: f };
}

async function fsRequest(idToken, method, docPath, body) {
  const res = await fetch(`${FS_BASE}/${docPath}`, {
    method,
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  // 404 on GET = rules allowed it, doc just doesn't exist -> still a pass
  if (res.ok || (method === 'GET' && res.status === 404)) return { ok: true, status: res.status };
  let msg = '';
  try { msg = (await res.json()).error?.message || ''; } catch (_) {}
  return { ok: false, status: res.status, msg };
}

// ---------- static source scan ----------
function findAppFiles(assignmentId, explicitApp) {
  if (explicitApp) {
    const p = path.resolve(REPO_ROOT, explicitApp);
    if (!fs.existsSync(p)) return [];
    if (fs.statSync(p).isFile()) return [p];
    return walk(p);
  }
  const needle1 = `'${assignmentId}'`, needle2 = `"${assignmentId}"`, needle3 = '`' + assignmentId + '`';
  return walk(REPO_ROOT).filter((f) => {
    const c = fs.readFileSync(f, 'utf8');
    return c.includes(needle1) || c.includes(needle2) || c.includes(needle3);
  });
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'sync-classroom', 'scripts', '.agents', '.agent', 'admin', 'dist'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(html|js|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

function scanSource(files) {
  const collections = new Set();
  const issues = [];
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const rel = path.relative(REPO_ROOT, f);
    const consts = {};
    for (const m of src.matchAll(/(?:const|let|var)\s+([A-Z_a-z$][\w$]*)\s*=\s*['"`]([\w-]+)['"`]/g)) consts[m[1]] = m[2];
    for (const m of src.matchAll(/collection\(\s*(?:(['"`])([\w-]+)\1|([A-Za-z_$][\w$]*))\s*\)/g)) {
      const name = m[2] || consts[m[3]];
      if (name) collections.add(name);
    }
    // Parent-doc writes on result collections are admin-only -> always rejected for students
    const parentWrite = /collection\(\s*['"`](student_results|practice_results)['"`]\s*\)\s*\.doc\([^)]*\)\s*\.(set|update)\s*\(/;
    if (parentWrite.test(src)) issues.push(`${rel}: writes the PARENT doc student_results/{assignment} (admin-only). Students will get PERMISSION_DENIED.`);
    // Doc ID must be email prefix, not uid
    if (/collection\(\s*['"`]students['"`]\s*\)\s*\.doc\(\s*[\w.]*\.uid\s*\)/.test(src)) issues.push(`${rel}: uses auth uid as the student doc ID. Rules require the email prefix (6-digit ID).`);
    // Undefined payload values crash writes
    if (/\.set\(\s*\{[^}]*:\s*undefined/.test(src)) issues.push(`${rel}: literal undefined in a Firestore payload.`);
  }
  return { collections, issues };
}

// ---------- live tests per collection ----------
function testsFor(collection, assignmentId, sid) {
  const payload = { student_id: sid, studentId: sid, score: 10, class_period: 0, preflight: true };
  switch (collection) {
    case 'roster':
    case 'student_accommodations':
      return []; // handled with a REAL roster student below
    case 'student_results':
    case 'practice_results':
      return [
        { label: `create ${collection}/${assignmentId}/students/{own}`, method: 'PATCH', path: `${collection}/${assignmentId}/students/${sid}`, body: payload, cleanup: true },
        { label: `update ${collection}/${assignmentId}/students/{own}`, method: 'PATCH', path: `${collection}/${assignmentId}/students/${sid}`, body: { ...payload, score: 9 } },
        { label: `read   ${collection}/${assignmentId}/students/{own}`, method: 'GET', path: `${collection}/${assignmentId}/students/${sid}` },
      ];
    case 'students':
      return []; // subcollection, covered above
    case 'student_results_archive':
      return [{ label: `create student_results_archive/{own}_${assignmentId}`, method: 'PATCH', path: `student_results_archive/${sid}_${assignmentId}`, body: payload, cleanup: true }];
    case 'practice_results_archive':
      return [{ label: `read   practice_results_archive/{own}_${assignmentId}`, method: 'GET', path: `practice_results_archive/${sid}_${assignmentId}` }];
    case 'bellringers':
      return [{ label: 'create bellringers/{own}_preflight', method: 'PATCH', path: `bellringers/${sid}_preflight`, body: payload, cleanup: true }];
    case 'system_config':
    case 'assessments':
    case 'questions':
      return [{ label: `read   ${collection} (list skipped)`, method: 'GET', path: `${collection}/__preflight_probe__` }];
    default:
      // physics_labs and ANY new/unknown collection: test a student-owned write
      return [
        { label: `create ${collection}/{own}`, method: 'PATCH', path: `${collection}/${sid}`, body: payload, cleanup: true },
        { label: `read   ${collection}/{own}`, method: 'GET', path: `${collection}/${sid}` },
      ];
  }
}

async function runStudentRulesCheck({ admin, db, assignmentId, appPath }) {
  let passed = true;
  const createdUids = [];
  const cleanupPaths = [];

  // A. Local rules vs deployed rules
  try {
    const deployed = await admin.securityRules().getFirestoreRuleset();
    const localPath = path.join(REPO_ROOT, 'firestore.rules');
    const norm = (s) => s.replace(/\r/g, '').replace(/\s+/g, ' ').trim();
    const local = fs.existsSync(localPath) ? fs.readFileSync(localPath, 'utf8') : '';
    const deployedSrc = deployed.source.map((s) => s.content).join('\n');
    if (norm(local) === norm(deployedSrc)) console.log('  ✓ Local firestore.rules matches the DEPLOYED ruleset.');
    else console.warn('  ⚠️ Local firestore.rules DIFFERS from deployed rules. Tests below run against DEPLOYED rules. Run `firebase deploy --only firestore:rules` if your local edits are needed.');
  } catch (e) {
    console.warn(`  ⚠️ Could not fetch deployed ruleset (${e.message}). Continuing with live tests.`);
  }

  // B. Static scan
  const files = findAppFiles(assignmentId, appPath);
  if (!files.length) {
    console.warn(`  ⚠️ No webapp source found referencing "${assignmentId}". Pass --app <folder> for a full scan. Testing default paths only.`);
  } else {
    console.log(`  ✓ Scanned ${files.length} source file(s): ${files.slice(0, 4).map((f) => path.relative(REPO_ROOT, f)).join(', ')}${files.length > 4 ? ' …' : ''}`);
  }
  const { collections, issues } = scanSource(files);
  collections.add('student_results');
  collections.add('roster');
  issues.forEach((i) => { console.error(`  ❌ ${i}`); passed = false; });
  console.log(`  • Collections used by app: ${[...collections].join(', ')}`);

  try {
    // C. Real roster students (Period 0 + a standard period): can they read their OWN roster doc?
    const rosterTargets = [];
    const p0 = await db.collection('roster').where('class_period', '==', 0).limit(1).get();
    if (!p0.empty) rosterTargets.push({ id: p0.docs[0].id, label: 'Period 0 (Honors)' });
    else { console.error('  ❌ No Period 0 student found in roster to impersonate.'); passed = false; }
    const std = await db.collection('roster').where('class_period', '>', 0).limit(1).get();
    if (!std.empty) rosterTargets.push({ id: std.docs[0].id, label: `Period ${std.docs[0].data().class_period}` });

    for (const t of rosterTargets) {
      const { uid, idToken } = await studentIdToken(admin, t.id);
      createdUids.push(uid);
      const r = await fsRequest(idToken, 'GET', `roster/${t.id}`);
      if (r.ok && r.status !== 404) console.log(`  ✓ ${t.label} student can read own roster entry.`);
      else if (r.ok) { console.error(`  ❌ ${t.label}: roster doc id "${t.id}" is not the email prefix — lookups by email will 404.`); passed = false; }
      else { console.error(`  ❌ ${t.label} student DENIED reading own roster (${r.status} ${r.msg}).`); passed = false; }
      if (collections.has('student_accommodations')) {
        const a = await fsRequest(idToken, 'GET', `student_accommodations/${t.id}`);
        if (!a.ok) { console.error(`  ❌ ${t.label} DENIED reading own accommodations (${a.status}).`); passed = false; }
      }
    }

    // D. Synthetic student: replay every write/read path the app uses
    const { uid, idToken } = await studentIdToken(admin, SYNTHETIC_ID);
    createdUids.push(uid);
    for (const c of collections) {
      for (const t of testsFor(c, assignmentId, SYNTHETIC_ID)) {
        const r = await fsRequest(idToken, t.method, t.path, t.body ? toFields(t.body) : null);
        if (t.cleanup) cleanupPaths.push(t.path);
        if (r.ok) console.log(`  ✓ STUDENT ${t.label}`);
        else {
          console.error(`  ❌ STUDENT ${t.label} -> DENIED (${r.status}) ${r.msg}`);
          if (!['student_results', 'practice_results', 'student_results_archive', 'physics_labs', 'bellringers', 'system_config', 'assessments', 'questions', 'practice_results_archive'].includes(c)) {
            console.error(`     ↳ "${c}" has no student rule in firestore.rules. Add a match block before deploying.`);
          }
          passed = false;
        }
      }
    }

    // E. Negative control: a student must NOT be able to read someone else's result
    if (rosterTargets[0]) {
      const r = await fsRequest(idToken, 'GET', `student_results/${assignmentId}/students/${rosterTargets[0].id}`);
      if (r.ok && r.status !== 404) { console.error('  ❌ SECURITY: a student could read ANOTHER student\'s result.'); passed = false; }
      else console.log('  ✓ Students cannot read other students\' results (privacy intact).');
    }
  } catch (e) {
    console.error(`  ❌ Student rules check crashed: ${e.message}`);
    passed = false;
  } finally {
    for (const p of cleanupPaths) { try { await db.doc(p).delete(); } catch (_) {} }
    for (const u of createdUids) { try { await admin.auth().deleteUser(u); } catch (_) {} }
    console.log(`  ✓ Cleaned up ${cleanupPaths.length} test doc(s) and ${createdUids.length} temporary auth user(s).`);
  }
  return passed;
}

module.exports = { runStudentRulesCheck };
