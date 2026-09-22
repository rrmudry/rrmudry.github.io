#!/usr/bin/env node
/**
 * Unified Assignment Deployment Script
 * 
 * Creates Google Classroom coursework across all periods and registers the
 * assignment in Firestore's `assignment_registry` collection — the single
 * source of truth linking webapp ASSIGNMENT_IDs to Classroom coursework IDs.
 * 
 * Also writes backwards-compatible entries to `gradest_assignments` and
 * `student_results` parent docs.
 * 
 * Usage:
 *   node deploy-assignment.js \
 *     --id "unit2_day16_acceleration_studio" \
 *     --title "Acceleration Studio Practice" \
 *     --points 10 \
 *     --topic "Unit 2: Motion" \
 *     --url "https://rrmudry.github.io/Unit_2/acceleration_studio/index.html" \
 *     --due "2026-09-21T18:00:00-07:00"
 * 
 *   node deploy-assignment.js --config assignments/acceleration-studio.json
 *   node deploy-assignment.js --config assignments/acceleration-studio.json --dry-run
 * 
 * Options:
 *   --id           Firestore ASSIGNMENT_ID (must match the webapp constant)
 *   --title        Human-readable title for Google Classroom
 *   --description  Assignment description (optional)
 *   --points       Max points (default: 10)
 *   --topic        Google Classroom topic name (e.g. "Unit 2: Motion")
 *   --url          Activity URL to include as a material link
 *   --due          Due date/time in ISO 8601 format (e.g. "2026-09-21T18:00:00-07:00")
 *   --config       Path to a JSON config file (overrides CLI args)
 *   --dry-run      Preview what would be created without actually creating
 *   --unit         Unit name for Firestore metadata (e.g. "Unit 2: Kinematics in 1D")
 *   --standards    Comma-separated NGSS standard codes (e.g. "HS-PS2-1,HS-PS2-5")
 */

const { google } = require('googleapis');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// =====================================================================
// 1. Firebase Admin Init
// =====================================================================
let db = null;
try {
  const serviceAccountPath = path.join(__dirname, '..', 'site-6e500-firebase-adminsdk-fbsvc-407ccb8f99.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    db = admin.firestore();
  } else {
    console.error('ERROR: Firebase service account key not found at:', serviceAccountPath);
    process.exit(1);
  }
} catch (error) {
  console.error('Firebase Admin SDK Initialization Error:', error.message);
  process.exit(1);
}

// =====================================================================
// 2. Google Classroom Client
// =====================================================================
function getCredentials() {
  try {
    const files = fs.readdirSync(__dirname);
    const secretFile = files.find(f => f.startsWith('client_secret_') && f.endsWith('.json'));
    if (secretFile) {
      const raw = fs.readFileSync(path.join(__dirname, secretFile), 'utf8');
      const data = JSON.parse(raw);
      const credentials = data.web || data.installed;
      if (credentials) {
        return {
          clientId: credentials.client_id,
          clientSecret: credentials.client_secret
        };
      }
    }
  } catch (e) {}
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
  };
}

function getClassroomClient() {
  const { clientId, clientSecret } = getCredentials();
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google Classroom OAuth credentials. Run `npm run auth` to authenticate.');
  }
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.classroom({ version: 'v1', auth: oauth2Client });
}

// =====================================================================
// 3. Course Period Configuration
// =====================================================================
const COURSES = [
  { period: 0, courseId: '875053343151', name: 'Period 0 - Physics H - 26/27' },
  { period: 1, courseId: '875053274185', name: 'Period 1 - Concept Phys - 26/27' },
  { period: 2, courseId: '819978306673', name: 'Period 2 - Concept Phys - 26/27' },
  { period: 3, courseId: '875053206741', name: 'Period 3 - Concept Phys - 26/27' },
  { period: 4, courseId: '875053292931', name: 'Period 4 - Physics - 26/27' },
  { period: 5, courseId: '819978427488', name: 'Period 5 - Physics - 26/27' },
  { period: 6, courseId: '875047683865', name: 'Period 6 - Physics - 26/27' }
];

// Known topic IDs per course (keyed by courseId -> topicName -> topicId)
// These are cached from previous API lookups to avoid redundant topic list calls
const KNOWN_TOPICS = {
  '875053343151': { 'Unit 2: Motion': '877400159312' },
  '875053274185': { 'Unit 2: Motion': '877404382173' },
  '819978306673': { 'Unit 2: Motion': '869422033444' },
  '875053206741': { 'Unit 2: Motion': '877401996863' },
  '875053292931': { 'Unit 2: Motion': '869421931323' },
  '819978427488': { 'Unit 2: Motion': '869421894720' },
  '875047683865': { 'Unit 2: Motion': '877404146356' }
};

// =====================================================================
// 4. Topic Resolution (cached → live API fallback)
// =====================================================================
async function resolveTopicId(classroom, courseId, topicName) {
  if (!topicName) return null;

  // Check cached lookup
  const cached = KNOWN_TOPICS[courseId]?.[topicName];
  if (cached) return cached;

  // Fallback: live API topic search
  try {
    const res = await classroom.courses.topics.list({ courseId, pageSize: 100 });
    const topics = res.data.topic || [];
    const match = topics.find(t => t.name.toLowerCase().includes(topicName.toLowerCase()));
    if (match) {
      // Cache for future calls in this session
      if (!KNOWN_TOPICS[courseId]) KNOWN_TOPICS[courseId] = {};
      KNOWN_TOPICS[courseId][topicName] = match.topicId;
      return match.topicId;
    }
  } catch (e) {
    console.warn(`   ⚠️  Could not list topics for course ${courseId}:`, e.message);
  }
  return null;
}

// =====================================================================
// 5. Parse Due Date
// =====================================================================
function parseDueDate(isoString) {
  if (!isoString) return { dueDate: null, dueTime: null };

  const d = new Date(isoString);
  if (isNaN(d.getTime())) {
    console.warn(`   ⚠️  Invalid due date: "${isoString}". Skipping due date.`);
    return { dueDate: null, dueTime: null };
  }

  return {
    dueDate: {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate()
    },
    dueTime: {
      hours: d.getUTCHours(),
      minutes: d.getUTCMinutes()
    }
  };
}

// =====================================================================
// 6. Parse CLI Arguments or Config File
// =====================================================================
function parseConfig() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || args.includes('-d');

  // Check for config file
  const configIdx = args.indexOf('--config');
  if (configIdx !== -1 && args[configIdx + 1]) {
    const configPath = path.resolve(args[configIdx + 1]);
    if (!fs.existsSync(configPath)) {
      console.error(`ERROR: Config file not found: ${configPath}`);
      process.exit(1);
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.isDryRun = isDryRun;
    return config;
  }

  // Parse CLI flags
  function getArg(name) {
    const idx = args.indexOf(`--${name}`);
    return (idx !== -1 && args[idx + 1]) ? args[idx + 1] : null;
  }

  const id = getArg('id');
  const title = getArg('title');
  if (!id || !title) {
    console.error('ERROR: --id and --title are required.');
    console.error('Usage: node deploy-assignment.js --id "assignment_id" --title "Assignment Title" [options]');
    console.error('  Or:  node deploy-assignment.js --config path/to/config.json');
    process.exit(1);
  }

  return {
    assignmentId: id,
    title: title,
    description: getArg('description') || '',
    maxPoints: parseInt(getArg('points') || '10', 10),
    topic: getArg('topic') || null,
    activityUrl: getArg('url') || null,
    dueDate: getArg('due') || null,
    unit: getArg('unit') || null,
    standards: getArg('standards') ? getArg('standards').split(',').map(s => s.trim()) : [],
    isDryRun: isDryRun
  };
}

// =====================================================================
// 7. Main Deployment Logic
// =====================================================================
async function deploy() {
  const config = parseConfig();
  const { assignmentId, title, description, maxPoints, topic, activityUrl, dueDate, unit, standards, isDryRun } = config;

  const { dueDate: parsedDueDate, dueTime: parsedDueTime } = parseDueDate(dueDate);

  console.log('\n' + '='.repeat(72));
  console.log('  🚀 UNIFIED ASSIGNMENT DEPLOYMENT');
  console.log('='.repeat(72));
  console.log(`  Assignment ID:  ${assignmentId}`);
  console.log(`  Title:          ${title}`);
  console.log(`  Max Points:     ${maxPoints}`);
  console.log(`  Topic:          ${topic || '(none)'}`);
  console.log(`  Activity URL:   ${activityUrl || '(none)'}`);
  console.log(`  Due Date:       ${dueDate || '(none)'}`);
  console.log(`  Unit:           ${unit || '(none)'}`);
  console.log(`  Standards:      ${standards.length > 0 ? standards.join(', ') : '(none)'}`);
  console.log(`  Mode:           ${isDryRun ? '🧪 DRY-RUN (preview only)' : '🚀 LIVE DEPLOYMENT'}`);
  console.log('='.repeat(72) + '\n');

  if (isDryRun) {
    console.log('🧪 DRY-RUN: Would create coursework in the following courses:');
    COURSES.forEach(c => console.log(`   Period ${c.period}: ${c.name} (${c.courseId})`));
    console.log('\n🧪 DRY-RUN: Would write assignment_registry doc:', assignmentId);
    console.log('🧪 DRY-RUN complete. No changes made.\n');
    return;
  }

  const classroom = getClassroomClient();

  // ---------------------------------------------------------------
  // Phase 1: Create CourseWork in Google Classroom (all periods)
  // ---------------------------------------------------------------
  console.log('📤 Phase 1: Creating coursework in Google Classroom...\n');

  const courseworkMap = {};   // courseId → courseworkId
  const deployments = [];     // Full deployment records for backwards compat

  for (const course of COURSES) {
    process.stdout.write(`  ⏳ [Period ${course.period}] ${course.name}...`);

    try {
      // Build request body
      const requestBody = {
        title: title,
        description: description || undefined,
        workType: 'ASSIGNMENT',
        state: 'PUBLISHED',
        maxPoints: maxPoints
      };

      // Add due date if provided
      if (parsedDueDate) {
        requestBody.dueDate = parsedDueDate;
        requestBody.dueTime = parsedDueTime;
      }

      // Add activity URL as material
      if (activityUrl) {
        requestBody.materials = [{ link: { url: activityUrl } }];
      }

      // Create coursework
      const createRes = await classroom.courses.courseWork.create({
        courseId: course.courseId,
        requestBody
      });

      const cwId = createRes.data.id;
      courseworkMap[course.courseId] = cwId;
      console.log(` ✓ Created (CW ID: ${cwId})`);

      // Patch topic if specified
      if (topic) {
        const topicId = await resolveTopicId(classroom, course.courseId, topic);
        if (topicId) {
          try {
            await classroom.courses.courseWork.patch({
              courseId: course.courseId,
              id: cwId,
              updateMask: 'topicId',
              requestBody: { topicId }
            });
            console.log(`       ✓ Topic "${topic}" assigned`);
          } catch (topicErr) {
            console.warn(`       ⚠️  Could not patch topic: ${topicErr.message}`);
          }
        } else {
          console.warn(`       ⚠️  Topic "${topic}" not found in this course`);
        }
      }

      deployments.push({
        period: course.period,
        courseId: course.courseId,
        courseName: course.name,
        courseworkId: cwId,
        alternateLink: createRes.data.alternateLink,
        success: true
      });

    } catch (err) {
      console.log(` ❌ Failed: ${err.message}`);
      deployments.push({
        period: course.period,
        courseId: course.courseId,
        courseName: course.name,
        success: false,
        error: err.message
      });
    }

    // Pacing delay between API calls
    await new Promise(r => setTimeout(r, 500));
  }

  const successCount = deployments.filter(d => d.success).length;
  console.log(`\n  📊 Deployed to ${successCount}/${COURSES.length} periods.\n`);

  if (successCount === 0) {
    console.error('❌ No coursework was created. Aborting registry write.');
    process.exit(1);
  }

  // ---------------------------------------------------------------
  // Phase 2: Write assignment_registry (THE KEY DOCUMENT)
  // ---------------------------------------------------------------
  console.log('📝 Phase 2: Writing assignment_registry...');

  const registryDoc = {
    // Identity
    assignmentId: assignmentId,
    title: title,
    description: description || '',

    // Scoring
    maxPoints: maxPoints,
    firestorePath: 'student_results',

    // Google Classroom linkage — courseId → courseworkId map
    coursework: courseworkMap,

    // Metadata
    activityUrl: activityUrl || '',
    unit: unit || topic || '',
    standards: standards,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('assignment_registry').doc(assignmentId).set(registryDoc, { merge: true });
  console.log(`  ✓ assignment_registry/${assignmentId} written with ${Object.keys(courseworkMap).length} coursework links`);

  // ---------------------------------------------------------------
  // Phase 3: Backwards-compatible writes
  // ---------------------------------------------------------------
  console.log('\n📝 Phase 3: Writing backwards-compatible Firestore entries...');

  const backcompatPayload = {
    assignmentName: title,
    title: title,
    description: description || '',
    maxScore: maxPoints,
    maxPoints: maxPoints,
    topic: topic || '',
    activityUrl: activityUrl || '',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    classroomDeployments: deployments.filter(d => d.success),
    registryId: assignmentId  // Cross-reference to assignment_registry
  };

  // Write to gradest_assignments under both human-readable title and assignment ID
  const docNames = [title.trim(), assignmentId];
  for (const docName of docNames) {
    await db.collection('gradest_assignments').doc(docName).set(backcompatPayload, { merge: true });
    console.log(`  ✓ gradest_assignments/${docName}`);
  }

  // Ensure parent doc exists in student_results for admin tool discovery
  await db.collection('student_results').doc(assignmentId).set({
    assignment_name: title,
    unit: unit || topic || '',
    standards: standards,
    registryId: assignmentId,  // Cross-reference
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log(`  ✓ student_results/${assignmentId} parent doc`);

  // ---------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------
  console.log('\n' + '='.repeat(72));
  console.log('  🎉 DEPLOYMENT COMPLETE');
  console.log('='.repeat(72));
  console.log(`\n  Assignment ID:     ${assignmentId}`);
  console.log(`  Classroom Title:   ${title}`);
  console.log(`  Registry Doc:      assignment_registry/${assignmentId}`);
  console.log(`  Coursework Links:  ${Object.keys(courseworkMap).length} periods`);
  console.log(`  Sync Command:      npm run sync -- "${title}"`);
  console.log('');

  // Show period deployment table
  console.log('  ' + 'Period'.padEnd(10) + 'Course'.padEnd(35) + 'Coursework ID'.padEnd(18) + 'Status');
  console.log('  ' + '-'.repeat(68));
  deployments.forEach(d => {
    console.log(
      '  ' +
      `P${d.period}`.padEnd(10) +
      (d.courseName.length > 32 ? d.courseName.slice(0, 29) + '...' : d.courseName).padEnd(35) +
      (d.success ? d.courseworkId : 'N/A').padEnd(18) +
      (d.success ? '✓' : `❌ ${d.error}`)
    );
  });
  console.log('');
}

deploy().catch(err => {
  console.error('\n❌ Fatal deployment error:', err);
  process.exit(1);
});
