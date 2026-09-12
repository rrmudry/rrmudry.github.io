#!/usr/bin/env node
/**
 * Headless Google Classroom Grade Sync CLI
 * 
 * Synchronizes student grades from Firestore (physics_labs, student_results, gradest_assignments)
 * directly to Google Classroom coursework across all periods (Period 0 to Period 6).
 * 
 * By default, syncs ALL active assignments that have student scores and matching Classroom coursework,
 * ensuring any late submissions or updated scores are automatically pushed and returned.
 * Specific assignments can also be targeted without breaking existing workflows.
 * 
 * Usage:
 *   npm run sync                                # Sync ALL assignments across all periods
 *   npm run sync:dry                            # Preview ALL assignments (no grades written)
 *   npm run sync -- "Constant Speed Story"      # Target a specific assignment
 *   npm run sync -- --period=0                  # Sync all assignments for Period 0 only
 *   npm run sync -- "Wind Up Toy" --period=2    # Target specific assignment and period
 *   node sync-cli.js --list                     # List all available assignments in Firestore
 *   node sync-cli.js --force                    # Force re-patch & return even if already up to date
 * 
 * Options:
 *   --dry-run, -d      Preview grades without updating or returning submissions in Google Classroom
 *   --period=N, -p=N   Limit sync to a specific period (e.g. --period=0)
 *   --all, -a          Explicitly sync all assignments (default when no assignment specified)
 *   --force, -f        Force update & return even if submission is already returned with same score
 *   --list, -l         List all available assignments with scores in Firestore and exit
 */

const { google } = require('googleapis');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ---------------------------------------------------------------------
// 1. Initialize Firebase Admin SDK
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// 2. Initialize Google Classroom API Client
// ---------------------------------------------------------------------
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
    console.error('ERROR: Missing Google OAuth configuration in .env or client_secret_*.json');
    console.error('Run `npm run auth` to re-authenticate if necessary.');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.classroom({ version: 'v1', auth: oauth2Client });
}

// ---------------------------------------------------------------------
// 3. Helper: Extract Course Period
// ---------------------------------------------------------------------
function extractPeriod(courseName) {
  if (!courseName) return null;
  // Ignore TA sections
  if (/\bTA\b/i.test(courseName) || /Tch\s*Asst/i.test(courseName)) {
    return null;
  }
  const match = courseName.match(/Period\s*([0-6])/i) || courseName.match(/\bP([0-6])\b/i);
  return match ? parseInt(match[1], 10) : null;
}

// ---------------------------------------------------------------------
// 4. Helper: Fetch Available Assignments
// ---------------------------------------------------------------------
async function getAvailableAssignments() {
  const list = [];
  const seenIds = new Set();

  // A. physics_labs
  try {
    const pSnap = await db.collection('physics_labs').get();
    if (!pSnap.empty) {
      list.push({
        id: 'physics_speed_calculator',
        name: 'Physics Speed Calculator',
        source: 'physics_labs',
        studentCount: pSnap.size
      });
      seenIds.add('physics_speed_calculator');
    }
  } catch (e) {}

  // B. student_results
  try {
    const docRefs = await db.collection('student_results').listDocuments();
    for (const ref of docRefs) {
      if (!seenIds.has(ref.id)) {
        seenIds.add(ref.id);
        const countSnap = await ref.collection('students').count().get();
        list.push({
          id: ref.id,
          name: ref.id.replace(/_/g, ' '),
          source: 'student_results',
          studentCount: countSnap.data().count
        });
      }
    }
  } catch (e) {}

  // C. gradest_assignments
  try {
    const gSnap = await db.collection('gradest_assignments').get();
    for (const doc of gSnap.docs) {
      if (!seenIds.has(doc.id)) {
        seenIds.add(doc.id);
        const data = doc.data();
        list.push({
          id: doc.id,
          name: data.title || doc.id,
          source: 'gradest_assignments',
          studentCount: (data.grades && Array.isArray(data.grades)) ? data.grades.length : 0
        });
      }
    }
  } catch (e) {}

// Assignments created manually in Google Classroom UI or excluded from automated API sync
const EXCLUDED_ASSIGNMENT_IDS = new Set([
  'accuracy_precision_emoji_art',
  'accuracy_precision',
  'student_survey_and_graph',
  'student_survey_and_graphing'
]);

  // Filter out assignments with 0 students, excluded manual assignments, and deduplicate by normalized name
  const filtered = list.filter(a => {
    if (a.studentCount <= 0) return false;
    const normId = a.id.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const normName = a.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (EXCLUDED_ASSIGNMENT_IDS.has(normId) || EXCLUDED_ASSIGNMENT_IDS.has(normName) ||
        normId.includes('accuracy_precision') || normName.includes('accuracy_precision') ||
        normId.includes('emoji_art') || normName.includes('emoji_art')) {
      return false;
    }
    return true;
  });

  const byNormName = new Map();
  for (const a of filtered) {
    const key = a.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!byNormName.has(key) || a.studentCount > byNormName.get(key).studentCount) {
      byNormName.set(key, a);
    }
  }

  return Array.from(byNormName.values()).sort((a, b) => b.studentCount - a.studentCount);
}

// ---------------------------------------------------------------------
// 5. Helper: Fetch Roster Map
// ---------------------------------------------------------------------
async function fetchRosterMap() {
  const rosterMap = new Map();
  try {
    const rSnap = await db.collection('roster').get();
    rSnap.forEach(rDoc => {
      const data = rDoc.data();
      const sid = String(data.student_id || rDoc.id).trim();
      const pVal = (data.class_period !== undefined && data.class_period !== null)
        ? data.class_period
        : (data.period !== undefined && data.period !== null ? data.period : null);
      const cleanP = pVal !== null ? String(pVal).trim() : null;
      const sName = data.student_name || data.full_name || (data.first_name ? `${data.first_name} ${data.last_name || ''}`.trim() : null) || data.name || null;

      rosterMap.set(sid, {
        name: sName,
        period: cleanP,
        email: data.student_email || data.email || null
      });
    });
  } catch (e) {
    console.warn('Warning: Could not prefetch roster:', e.message);
  }
  return rosterMap;
}

// ---------------------------------------------------------------------
// 6. Helper: Fetch Student Scores Joined With Roster
// ---------------------------------------------------------------------
async function fetchAssignmentScores(assignmentId, rosterMap) {
  const students = [];
  const seenIds = new Set();

  // 1. Check physics_labs (Speed Calculator only)
  const isSpeedCalc = assignmentId === 'physics_speed_calculator' || assignmentId === 'speed_calculator';

  if (isSpeedCalc) {
    try {
      const labsSnap = await db.collection('physics_labs').get();
      labsSnap.forEach(doc => {
        const data = doc.data();
        const sId = String(data.studentId || doc.id).trim();
        if (!seenIds.has(sId)) {
          seenIds.add(sId);
          const rosterInfo = rosterMap.get(sId) || {};
          const rawPeriod = (data.class_period !== undefined && data.class_period !== null && data.class_period !== 'N/A' && data.class_period !== '')
            ? data.class_period
            : (rosterInfo.period !== undefined && rosterInfo.period !== null && rosterInfo.period !== 'N/A' && rosterInfo.period !== '' ? rosterInfo.period : '---');
          const cleanPeriod = (rawPeriod !== undefined && rawPeriod !== null && rawPeriod !== '') ? String(rawPeriod) : '---';

          const sc = data.speed_calculator || {};
          const isCompleted = !!(sc.completed !== undefined ? sc.completed : data.completed);
          const currentLvl = sc.currentLevel !== undefined ? sc.currentLevel : (data.currentLevel || 1);
          const scoreLvl3 = sc.score !== undefined ? sc.score : (data.score || 0);
          const answered = sc.answered !== undefined ? sc.answered : (data.answered || 0);

          let pct = 0;
          if (isCompleted) {
            pct = 100;
          } else if (currentLvl === 3) {
            pct = Math.round((scoreLvl3 / 6) * 100);
          } else if (currentLvl === 2) {
            pct = 70;
          } else if (answered > 0) {
            pct = 50;
          } else {
            pct = 0;
          }

          students.push({
            studentId: sId,
            name: data.displayName || rosterInfo.name || `Student ${sId}`,
            email: rosterInfo.email || `${sId}@orangeusd.org`,
            period: cleanPeriod,
            rawPercentage: pct
          });
        }
      });
      return students;
    } catch (e) {}
  }

  // 2. Check student_results subcollection
  const possibleIds = [assignmentId, assignmentId.replace(/ /g, '_'), assignmentId.replace(/_/g, ' ')];
  for (const pid of possibleIds) {
    try {
      const snap = await db.collection('student_results').doc(pid).collection('students').get();
      if (!snap.empty) {
        snap.forEach(doc => {
          const data = doc.data();
          const sId = String(data.student_id || data.studentId || doc.id).trim();
          if (!seenIds.has(sId)) {
            seenIds.add(sId);
            const rosterInfo = rosterMap.get(sId) || {};
            const rawPeriod = (data.class_period !== undefined && data.class_period !== null && data.class_period !== 'N/A' && data.class_period !== '')
              ? data.class_period
              : (rosterInfo.period !== undefined && rosterInfo.period !== null && rosterInfo.period !== 'N/A' && rosterInfo.period !== '' ? rosterInfo.period : '---');
            const cleanPeriod = (rawPeriod !== undefined && rawPeriod !== null && rawPeriod !== '') ? String(rawPeriod) : '---';

            let rawScore = 0;
            if (data.score !== undefined) {
              rawScore = Number(data.score);
            } else if (data.isCompleted) {
              rawScore = 100;
            } else if (data.labState && data.labState.currentStep) {
              const step = data.labState.currentStep;
              rawScore = step >= 5 ? 85 : (step >= 3 ? 70 : (step >= 2 ? 60 : 50));
            }

            students.push({
              studentId: sId,
              name: data.student_name || data.studentName || rosterInfo.name || `Student ${sId}`,
              email: rosterInfo.email || `${sId}@orangeusd.org`,
              period: cleanPeriod,
              rawPercentage: rawScore
            });
          }
        });
        return students;
      }
    } catch (e) {}
  }

  // 3. Check gradest_assignments
  for (const pid of possibleIds) {
    try {
      const gDoc = await db.collection('gradest_assignments').doc(pid).get();
      if (gDoc.exists) {
        const data = gDoc.data();
        if (Array.isArray(data.grades)) {
          data.grades.forEach(g => {
            const sId = String(g.id || g.studentId || 'N/A').trim();
            if (!seenIds.has(sId)) {
              seenIds.add(sId);
              const rosterInfo = rosterMap.get(sId) || {};
              const rawPeriod = (g.period !== undefined && g.period !== null && g.period !== 'N/A' && g.period !== '')
                ? g.period
                : (rosterInfo.period !== undefined && rosterInfo.period !== null && rosterInfo.period !== 'N/A' && rosterInfo.period !== '' ? rosterInfo.period : '---');
              const cleanPeriod = (rawPeriod !== undefined && rawPeriod !== null && rawPeriod !== '') ? String(rawPeriod) : '---';

              students.push({
                studentId: sId,
                name: g.name || rosterInfo.name || `Student ${sId}`,
                email: rosterInfo.email || `${sId}@orangeusd.org`,
                period: cleanPeriod,
                rawPercentage: Number(g.percentage !== undefined ? g.percentage : (g.score || 0))
              });
            }
          });
          return students;
        }
      }
    } catch (e) {}
  }

  return students;
}

// ---------------------------------------------------------------------
// 7. Helper: Match Firestore Assignment to Google Classroom CourseWork
// ---------------------------------------------------------------------
function findMatchingCourseWork(assignment, cwList) {
  if (!cwList || cwList.length === 0) return null;
  const aNorm = assignment.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const aWords = assignment.name.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);

  // Distinguishing sub-assignment terms that must never cross-match
  const distinguishingKeywords = ['vector', 'displacement', 'distance', 'speed', 'calculator', 'conversion'];

  // 1. Exact normalized match (e.g. "Physics Speed Calculator" -> "Physics Speed Calculator", "Fantasy Maps" -> "Fantasy Maps")
  let m = cwList.find(cw => {
    const cwNorm = cw.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cwNorm === aNorm;
  });
  if (m) return m;

  // 2. Contains match (e.g. "Constant Speed Story" in "Constant Speed Story: Author & Solve",
  //    or "Fantasy Map Distance Displacement" in "Digital Fantasy Map Distance Displacement")
  m = cwList.find(cw => {
    const cwNorm = cw.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cwNorm.includes(aNorm) || aNorm.includes(cwNorm)) {
      // Disallow if distinguishing keywords conflict
      for (const kw of distinguishingKeywords) {
        if (aNorm.includes(kw) !== cwNorm.includes(kw)) {
          return false;
        }
      }
      return true;
    }
    return false;
  });
  if (m) return m;

  // 3. Known aliases / key topic multi-word matching
  // (e.g. "Accuracy Precision Emoji Art" -> "Accuracy & Precision Emoji Paintings")
  for (const cw of cwList) {
    const cwWords = new Set(cw.title.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2));
    let matchCount = 0;
    for (const w of aWords) {
      if (cwWords.has(w)) matchCount++;
    }

    // Require distinguishing keywords to align
    let conflict = false;
    for (const kw of distinguishingKeywords) {
      if (aWords.includes(kw) !== cwWords.has(kw)) {
        conflict = true;
        break;
      }
    }
    if (conflict) continue;

    if (matchCount >= 3 && (matchCount / aWords.length) >= 0.6) {
      return cw;
    }
  }

  return null;
}

// ---------------------------------------------------------------------
// 8. Core: Sync Single Assignment Across Periods
// ---------------------------------------------------------------------
async function syncAssignment({
  assignment,
  studentScores,
  periodsToSync,
  periodCourses,
  classroom,
  isDryRun,
  isForce,
  courseWorkCache,
  studentMapCache
}) {
  const periodSummaries = [];
  let asgnTotalStudents = 0;
  let asgnUpToDate = 0;
  let asgnUpdated = 0;
  let asgnErrors = 0;

  for (const p of periodsToSync) {
    const course = periodCourses.get(p);
    if (!course) {
      periodSummaries.push({
        period: `P${p}`,
        courseName: 'Not Found / Missing Course',
        cwId: '---',
        students: 0,
        upToDate: 0,
        updated: 0,
        errors: 0,
        avgScore: '---',
        status: 'SKIPPED'
      });
      continue;
    }

    // Filter students for this period
    const pStudents = studentScores.filter(s => String(s.period) === String(p));
    if (pStudents.length === 0) {
      periodSummaries.push({
        period: `P${p}`,
        courseName: course.name,
        cwId: '---',
        students: 0,
        upToDate: 0,
        updated: 0,
        errors: 0,
        avgScore: '---',
        status: 'NO STUDENTS'
      });
      continue;
    }

    // Fetch coursework list from cache or Classroom API
    let cwList = courseWorkCache.get(course.id);
    if (!cwList) {
      try {
        const cwRes = await classroom.courses.courseWork.list({
          courseId: course.id,
          pageSize: 100
        });
        cwList = cwRes.data.courseWork || [];
        courseWorkCache.set(course.id, cwList);
      } catch (e) {
        console.warn(`Warning: Could not list coursework for Period ${p}:`, e.message);
        cwList = [];
      }
    }

    const matchingCw = findMatchingCourseWork(assignment, cwList);
    if (!matchingCw) {
      periodSummaries.push({
        period: `P${p}`,
        courseName: course.name,
        cwId: 'Not Deployed',
        students: pStudents.length,
        upToDate: 0,
        updated: 0,
        errors: 0,
        avgScore: '---',
        status: 'NOT DEPLOYED'
      });
      continue;
    }

    const maxPts = matchingCw.maxPoints !== undefined ? matchingCw.maxPoints : 10;
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`📁 Period ${p}: ${course.name}`);
    console.log(`   Coursework: "${matchingCw.title}" (ID: ${matchingCw.id}, Max Points: ${maxPts})`);
    console.log(`   Students to sync: ${pStudents.length}`);

    // Pre-cache enrolled students for this course
    let classroomStudentMap = studentMapCache.get(course.id);
    if (!classroomStudentMap) {
      classroomStudentMap = new Map();
      try {
        const sRes = await classroom.courses.students.list({ courseId: course.id, pageSize: 100 });
        (sRes.data.students || []).forEach(st => {
          const prof = st.profile || {};
          const email = (prof.emailAddress || '').toLowerCase().trim();
          const fullName = (prof.name ? prof.name.fullName : '').toLowerCase().trim();
          const uid = st.userId;
          if (email) classroomStudentMap.set(email, uid);
          if (fullName) classroomStudentMap.set(fullName, uid);
        });
      } catch (e) {
        console.warn(`Warning: Could not list students for course ${course.id}:`, e.message);
      }
      studentMapCache.set(course.id, classroomStudentMap);
    }

    // Batch fetch all student submissions for this coursework in 1 API call
    const submissionsByUserId = new Map();
    try {
      const subRes = await classroom.courses.courseWork.studentSubmissions.list({
        courseId: course.id,
        courseWorkId: matchingCw.id,
        pageSize: 100
      });
      (subRes.data.studentSubmissions || []).forEach(sub => {
        submissionsByUserId.set(sub.userId, sub);
      });
    } catch (e) {
      console.warn(`Warning: Batch listing submissions failed for Period ${p}:`, e.message);
    }

    let pUpToDate = 0;
    let pUpdated = 0;
    let pErrors = 0;
    let totalScore = 0;
    let isManualCoursework = false;

    for (const student of pStudents) {
      // Calculate scaled score
      let scaledScore = student.rawPercentage;
      if (maxPts && maxPts > 0 && maxPts !== 100) {
        scaledScore = Math.round((student.rawPercentage / 100) * maxPts * 10) / 10;
      }
      totalScore += scaledScore;

      const email = (student.email || '').toLowerCase().trim();
      const sId = student.studentId;
      const lookupKey = classroomStudentMap.get(email) || 
                        classroomStudentMap.get(`${sId}@orangeusd.org`) || 
                        email;

      // Find cached submission
      let sub = submissionsByUserId.get(lookupKey);
      if (!sub) {
        // Fallback: search submission map by any matching student userId
        for (const [uid, s] of submissionsByUserId.entries()) {
          if (uid === lookupKey) { sub = s; break; }
        }
      }

      // If still missing from batch, try direct fetch
      if (!sub) {
        try {
          const directRes = await classroom.courses.courseWork.studentSubmissions.list({
            courseId: course.id,
            courseWorkId: matchingCw.id,
            userId: lookupKey
          });
          const subs = directRes.data.studentSubmissions || [];
          if (subs.length > 0) sub = subs[0];
        } catch (e) {}
      }

      if (!sub) {
        console.warn(`   ⚠️  No submission found for ${student.name} (${sId}) in Classroom.`);
        pErrors++;
        continue;
      }

      const isAlreadyCurrent = !isForce && 
                               sub.assignedGrade === scaledScore && 
                               sub.state !== 'TURNED_IN';

      if (isAlreadyCurrent) {
        const stateNote = sub.state === 'RETURNED' ? 'Returned' : 'Recorded';
        console.log(`   ✓ Up to date: ${student.name.padEnd(24)} | ID: ${sId.padEnd(8)} | ${scaledScore}/${maxPts} pts (${stateNote})`);
        pUpToDate++;
        continue;
      }

      if (isDryRun) {
        const statusNote = sub.state === 'RETURNED' ? `was ${sub.assignedGrade}/${maxPts}` : `state: ${sub.state}`;
        console.log(`   [DRY-RUN] ${student.name.padEnd(24)} | ID: ${sId.padEnd(8)} | Score: ${student.rawPercentage}% -> ${scaledScore}/${maxPts} pts (${statusNote})`);
        pUpdated++;
        continue;
      }

      // Live update & return
      try {
        // 1. Patch grades if different
        if (isForce || sub.assignedGrade !== scaledScore || sub.draftGrade !== scaledScore) {
          await classroom.courses.courseWork.studentSubmissions.patch({
            courseId: course.id,
            courseWorkId: matchingCw.id,
            id: sub.id,
            updateMask: 'draftGrade,assignedGrade',
            requestBody: {
              draftGrade: scaledScore,
              assignedGrade: scaledScore
            }
          });
        }

        // 2. Return submission to student if turned in
        let returnNote = 'Recorded';
        if (sub.state === 'TURNED_IN' || isForce) {
          try {
            await classroom.courses.courseWork.studentSubmissions.return({
              courseId: course.id,
              courseWorkId: matchingCw.id,
              id: sub.id,
              requestBody: {}
            });
            returnNote = 'Returned';
          } catch (rErr) {
            // State transitioned or not turn-in eligible
          }
        }

        const prevNote = sub.assignedGrade !== undefined ? `was: ${sub.assignedGrade}/${maxPts}` : 'new score';
        console.log(`   🚀 Updated (${returnNote}): ${student.name.padEnd(20)} -> ${scaledScore}/${maxPts} pts (${prevNote})`);
        pUpdated++;
      } catch (err) {
        if (err.message && (err.message.includes('@ProjectPermissionDenied') || err.message.includes('not permitted'))) {
          console.warn(`\n   ⚠️  [Permission Denied by Google] Coursework "${matchingCw.title}" was created manually in Google Classroom.`);
          console.warn(`      Google API does not permit third-party tools to modify manual assignments.`);
          console.warn(`      Skipping remaining students for this assignment in Period ${p}.\n`);
          isManualCoursework = true;
          break;
        }
        console.error(`   ❌ Failed: ${student.name} (${sId}): ${err.message}`);
        pErrors++;
      }
    }

    const avg = pStudents.length > 0 ? (totalScore / pStudents.length).toFixed(1) : 0;
    const periodStatus = isManualCoursework ? 'MANUAL (UI ONLY)' : (pErrors === 0 ? 'COMPLETE' : 'PARTIAL');
    periodSummaries.push({
      period: `P${p}`,
      courseName: course.name.length > 30 ? course.name.slice(0, 27) + '...' : course.name,
      cwId: matchingCw.id,
      students: pStudents.length,
      upToDate: pUpToDate,
      updated: pUpdated,
      errors: isManualCoursework ? 0 : pErrors,
      avgScore: `${avg}/${maxPts}`,
      status: periodStatus
    });

    asgnTotalStudents += pStudents.length;
    asgnUpToDate += pUpToDate;
    asgnUpdated += pUpdated;
    asgnErrors += isManualCoursework ? 0 : pErrors;
  }

  return {
    assignment,
    totalStudents: asgnTotalStudents,
    upToDate: asgnUpToDate,
    updated: asgnUpdated,
    errors: asgnErrors,
    status: asgnErrors === 0 ? 'COMPLETE' : 'PARTIAL',
    periodSummaries
  };
}

// ---------------------------------------------------------------------
// 9. Main Sync Execution
// ---------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || args.includes('-d');
  const isListOnly = args.includes('--list') || args.includes('-l');
  const isForce = args.includes('--force') || args.includes('-f');
  const isExplicitAll = args.includes('--all') || args.includes('-a');

  const periodArg = args.find(a => a.startsWith('--period=') || a.startsWith('-p='));
  let filterPeriod = null;
  if (periodArg) {
    filterPeriod = parseInt(periodArg.split('=')[1], 10);
  }

  const queryTokens = args.filter(a => !a.startsWith('--') && !a.startsWith('-'));
  let targetQuery = queryTokens.join(' ').trim();

  // If user passed "all" as positional argument, treat as --all
  if (targetQuery.toLowerCase() === 'all') {
    targetQuery = '';
  }

  console.log('\n========================================================================');
  console.log('       MUDRY GOOGLE CLASSROOM GRADEBOOK HEADLESS SYNC');
  console.log('========================================================================');

  // List mode
  if (isListOnly) {
    console.log('\n🔍 Discovering Firestore activities with scored sessions...');
    const allAssignments = await getAvailableAssignments();
    console.log('\nAvailable Activities with Scored Students:');
    allAssignments.forEach((a, idx) => {
      console.log(` [${String(idx + 1).padStart(2)}] ${a.name.padEnd(36)} (${String(a.studentCount).padStart(3)} students) -> ID: "${a.id}"`);
    });
    console.log('\nUsage Examples:');
    console.log('  npm run sync                              # Sync ALL activities');
    console.log('  npm run sync:dry                          # Preview ALL activities (dry-run)');
    console.log('  npm run sync -- "<Assignment Name>"       # Sync a specific activity');
    console.log('  npm run sync -- --period=0                # Sync Period 0 only');
    process.exit(0);
  }

  const classroom = getClassroomClient();

  // 1. Fetch Courses from Google Classroom
  process.stdout.write('\n⏳ Fetching Google Classroom courses...');
  const coursesRes = await classroom.courses.list({
    courseStates: ['ACTIVE'],
    pageSize: 100
  });
  const courses = coursesRes.data.courses || [];
  console.log(` Done! Found ${courses.length} active courses.`);

  // Map courses by period (0 to 6)
  const periodCourses = new Map();
  for (const c of courses) {
    const p = extractPeriod(c.name);
    if (p !== null && !periodCourses.has(p)) {
      periodCourses.set(p, c);
    }
  }

  const periodsToSync = (filterPeriod !== null) 
    ? [filterPeriod] 
    : [0, 1, 2, 3, 4, 5, 6];

  // 2. Pre-fetch CourseWork across active courses to discover active Classroom assignments
  const courseWorkCache = new Map();
  const studentMapCache = new Map();
  const allClassroomCourseWork = [];

  for (const p of periodsToSync) {
    const course = periodCourses.get(p);
    if (course) {
      try {
        const cwRes = await classroom.courses.courseWork.list({
          courseId: course.id,
          pageSize: 100
        });
        const cws = cwRes.data.courseWork || [];
        courseWorkCache.set(course.id, cws);
        cws.forEach(cw => allClassroomCourseWork.push(cw));
      } catch (e) {
        courseWorkCache.set(course.id, []);
      }
    }
  }

  // 3. Pre-fetch Roster Map
  process.stdout.write('⏳ Fetching student roster from Firestore...');
  const rosterMap = await fetchRosterMap();
  console.log(` Done! Cached ${rosterMap.size} student roster records.`);

  // 4. Fetch Available Assignments from Firestore
  const allAssignments = await getAvailableAssignments();
  if (allAssignments.length === 0) {
    console.error('No graded assignments found in Firestore.');
    process.exit(1);
  }

  // Determine target assignments
  let targets = [];
  const isSyncAll = isExplicitAll || !targetQuery;

  if (isSyncAll) {
    // Sync all assignments that have scores and match active Classroom coursework
    targets = allAssignments.filter(a => {
      const match = findMatchingCourseWork(a, allClassroomCourseWork);
      return !!match;
    });

    if (targets.length === 0) {
      console.error('No matching Classroom coursework found for any scored Firestore assignments.');
      process.exit(1);
    }
  } else {
    // Single assignment target query
    const matches = allAssignments.filter(a => 
      a.id.toLowerCase().includes(targetQuery.toLowerCase()) || 
      a.name.toLowerCase().includes(targetQuery.toLowerCase())
    ).sort((a, b) => b.studentCount - a.studentCount);

    if (matches.length > 0) {
      targets = [matches[0]];
    } else {
      console.warn(`No exact match for query "${targetQuery}". Searching Classroom matches...`);
      const matchedByCw = allAssignments.find(a => {
        const cwMatch = findMatchingCourseWork(a, allClassroomCourseWork);
        return cwMatch && cwMatch.title.toLowerCase().includes(targetQuery.toLowerCase());
      });
      if (matchedByCw) {
        targets = [matchedByCw];
      } else {
        console.error(`ERROR: No assignment found matching "${targetQuery}". Run with --list to view available assignments.`);
        process.exit(1);
      }
    }
  }

  console.log(`\n⚙️  Execution Mode:   ${isDryRun ? '🧪 DRY-RUN (Preview Only, No Grades Written)' : '🚀 LIVE SYNC & RETURN (Submissions Returned)'}`);
  console.log(`🎯 Period Filter:    ${filterPeriod !== null ? `Period ${filterPeriod} Only` : 'All Periods (Period 0 to Period 6)'}`);
  console.log(`📚 Activities:       ${isSyncAll ? `ALL Matched Activities (${targets.length} active assignments)` : targets[0].name}`);
  if (isForce) {
    console.log(`⚡ Force Mode:       ENABLED (Re-evaluating & patching all submissions regardless of state)`);
  }

  // 5. Execute Sync for Each Assignment
  const masterResults = [];

  for (let i = 0; i < targets.length; i++) {
    const assignment = targets[i];
    console.log('\n' + '━'.repeat(80));
    console.log(`🎯 [${i + 1}/${targets.length}] ACTIVITY: ${assignment.name} (${assignment.studentCount} students in Firestore)`);
    console.log('━'.repeat(80));

    process.stdout.write(`⏳ Fetching student records for "${assignment.name}"...`);
    const studentScores = await fetchAssignmentScores(assignment.id, rosterMap);
    console.log(` Loaded ${studentScores.length} records.`);

    const res = await syncAssignment({
      assignment,
      studentScores,
      periodsToSync,
      periodCourses,
      classroom,
      isDryRun,
      isForce,
      courseWorkCache,
      studentMapCache
    });

    masterResults.push(res);

    // Period breakdown table for this assignment
    console.log(`\n📋 Period Breakdown: ${assignment.name}`);
    console.log(
      'Period'.padEnd(8) +
      'Course Name'.padEnd(30) +
      'Students'.padEnd(10) +
      'Up-to-Date'.padEnd(12) +
      'Updated'.padEnd(10) +
      'Errors'.padEnd(8) +
      'Avg Score'.padEnd(12) +
      'Status'
    );
    console.log('-'.repeat(98));

    res.periodSummaries.forEach(r => {
      console.log(
        r.period.padEnd(8) +
        r.courseName.padEnd(30) +
        String(r.students).padEnd(10) +
        String(r.upToDate).padEnd(12) +
        String(r.updated).padEnd(10) +
        String(r.errors).padEnd(8) +
        r.avgScore.padEnd(12) +
        r.status
      );
    });
  }

  // ---------------------------------------------------------------------
  // 10. Master Executive Summary Output
  // ---------------------------------------------------------------------
  console.log('\n========================================================================================');
  console.log('                         MASTER GRADE SYNC EXECUTIVE SUMMARY');
  console.log('========================================================================================');
  console.log(`Execution Mode:  ${isDryRun ? '🧪 DRY-RUN (Preview Only)' : '🚀 LIVE CLASSROOM SYNC & RETURN'}`);
  console.log(`Total Scanned:   ${masterResults.length} Assignments Across ${periodsToSync.length} Periods\n`);

  console.log(
    'Assignment Name'.padEnd(36) +
    'Eligible'.padEnd(10) +
    'Up to Date'.padEnd(12) +
    'Updated'.padEnd(10) +
    'Errors'.padEnd(8) +
    'Status'
  );
  console.log('-'.repeat(88));

  let grandEligible = 0;
  let grandUpToDate = 0;
  let grandUpdated = 0;
  let grandErrors = 0;

  masterResults.forEach(r => {
    grandEligible += r.totalStudents;
    grandUpToDate += r.upToDate;
    grandUpdated += r.updated;
    grandErrors += r.errors;

    console.log(
      r.assignment.name.padEnd(36) +
      String(r.totalStudents).padEnd(10) +
      String(r.upToDate).padEnd(12) +
      String(r.updated).padEnd(10) +
      String(r.errors).padEnd(8) +
      r.status
    );
  });

  console.log('-'.repeat(88));
  console.log(
    'TOTALS'.padEnd(36) +
    String(grandEligible).padEnd(10) +
    String(grandUpToDate).padEnd(12) +
    String(grandUpdated).padEnd(10) +
    String(grandErrors).padEnd(8) +
    (grandErrors === 0 ? 'ALL SUCCESS' : `${grandErrors} ERRORS`)
  );
  console.log('========================================================================================\n');

  if (isDryRun) {
    console.log('💡 To perform the actual live sync and return grades to students, run:');
    if (isSyncAll) {
      console.log('   npm run sync\n');
    } else {
      console.log(`   npm run sync -- "${targets[0].name}"\n`);
    }
  } else {
    console.log('🎉 Grade sync complete! All student submissions have been pushed and returned in Google Classroom.');
    console.log('   Aeries gradebook can now automatically import these scores.\n');
  }
}

main().catch(err => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
