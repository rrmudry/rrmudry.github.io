#!/usr/bin/env node
/**
 * Headless Google Classroom Grade Sync CLI
 * 
 * Synchronizes student grades from Firestore (physics_labs, student_results, gradest_assignments)
 * directly to Google Classroom coursework across all periods (Period 0 to Period 6) in one command.
 * 
 * Usage:
 *   node sync-cli.js [assignment_keyword] [options]
 *   npm run sync
 *   npm run sync:dry
 * 
 * Options:
 *   --dry-run, -d      Preview grades without updating or returning submissions in Google Classroom
 *   --period=N, -p N   Limit sync to a specific period (e.g. --period=0)
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
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
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

  return list;
}

// ---------------------------------------------------------------------
// 5. Helper: Fetch Student Scores Joined With Roster
// ---------------------------------------------------------------------
async function fetchAssignmentScores(assignmentId) {
  const students = [];
  const seenIds = new Set();

  // Prefetch roster map
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
// 6. Main Sync Execution
// ---------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || args.includes('-d');
  const isListOnly = args.includes('--list') || args.includes('-l');

  const periodArg = args.find(a => a.startsWith('--period=') || a.startsWith('-p='));
  let filterPeriod = null;
  if (periodArg) {
    filterPeriod = parseInt(periodArg.split('=')[1], 10);
  }

  const queryArgs = args.filter(a => !a.startsWith('--') && !a.startsWith('-'));
  const targetQuery = queryArgs.join(' ').trim();

  console.log('\n========================================================================');
  console.log('       MUDRY GOOGLE CLASSROOM GRADEBOOK HEADLESS SYNC');
  console.log('========================================================================');

  // List mode
  if (isListOnly) {
    console.log('\n🔍 Discovering Firestore activities with scored sessions...');
    const assignments = await getAvailableAssignments();
    console.log('\nAvailable Activities:');
    assignments.forEach((a, idx) => {
      console.log(` [${idx + 1}] ${a.name} (${a.studentCount} students) -> ID: "${a.id}"`);
    });
    console.log('\nTo sync, run: npm run sync -- "<Assignment Name>"');
    process.exit(0);
  }

  // Find assignment to sync
  const assignments = await getAvailableAssignments();
  if (assignments.length === 0) {
    console.error('No graded assignments found in Firestore.');
    process.exit(1);
  }

  let selectedAssignment = null;
  if (targetQuery) {
    // Prioritize assignments with recorded student scores
    const matches = assignments.filter(a => 
      a.id.toLowerCase().includes(targetQuery.toLowerCase()) || 
      a.name.toLowerCase().includes(targetQuery.toLowerCase())
    ).sort((a, b) => b.studentCount - a.studentCount);
    
    if (matches.length > 0) {
      selectedAssignment = matches[0];
    } else {
      console.warn(`No exact match for query "${targetQuery}". Checking available assignments...`);
    }
  }

  if (!selectedAssignment) {
    // Default to Physics Speed Calculator or the first one with the highest student count
    selectedAssignment = assignments.find(a => a.id === 'physics_speed_calculator') ||
                         assignments.sort((a, b) => b.studentCount - a.studentCount)[0];
  }

  console.log(`\n📌 Target Activity:  ${selectedAssignment.name} (${selectedAssignment.id})`);
  console.log(`⚙️  Execution Mode:   ${isDryRun ? '🧪 DRY-RUN (Preview Only, No Grades Written)' : '🚀 LIVE SYNC & RETURN (Submissions Returned)'}`);
  if (filterPeriod !== null) {
    console.log(`🎯 Period Filter:    Period ${filterPeriod} Only`);
  } else {
    console.log(`🎯 Period Filter:    All Periods (Period 0 to Period 6)`);
  }

  const classroom = getClassroomClient();

  // 1. Fetch Student Scores from Firestore
  process.stdout.write('\n⏳ Fetching student scores from Firestore...');
  const studentScores = await fetchAssignmentScores(selectedAssignment.id);
  console.log(` Done! Loaded ${studentScores.length} student records.`);

  // 2. Fetch Google Classroom Courses
  process.stdout.write('⏳ Fetching Google Classroom courses...');
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
    if (p !== null) {
      if (!periodCourses.has(p)) {
        periodCourses.set(p, c);
      }
    }
  }

  const periodsToSync = (filterPeriod !== null) 
    ? [filterPeriod] 
    : [0, 1, 2, 3, 4, 5, 6];

  const summaryRows = [];

  for (const p of periodsToSync) {
    const course = periodCourses.get(p);
    if (!course) {
      summaryRows.push({
        period: `P${p}`,
        courseName: 'Not Found / Missing Course',
        cwId: '---',
        students: 0,
        synced: 0,
        errors: 0,
        avgScore: '---',
        status: 'SKIPPED'
      });
      continue;
    }

    // Filter students for this period
    const pStudents = studentScores.filter(s => String(s.period) === String(p));
    if (pStudents.length === 0) {
      summaryRows.push({
        period: `P${p}`,
        courseName: course.name,
        cwId: '---',
        students: 0,
        synced: 0,
        errors: 0,
        avgScore: '---',
        status: 'NO STUDENTS'
      });
      continue;
    }

    // Find matching coursework in this course
    let matchingCw = null;
    try {
      const cwRes = await classroom.courses.courseWork.list({
        courseId: course.id,
        pageSize: 100
      });
      const cwList = cwRes.data.courseWork || [];
      // Match by title
      matchingCw = cwList.find(cw => 
        cw.title.toLowerCase().trim() === selectedAssignment.name.toLowerCase().trim() ||
        cw.title.toLowerCase().includes(selectedAssignment.name.toLowerCase()) ||
        selectedAssignment.name.toLowerCase().includes(cw.title.toLowerCase())
      );
    } catch (e) {
      console.warn(`Warning: Could not list coursework for Period ${p}:`, e.message);
    }

    if (!matchingCw) {
      summaryRows.push({
        period: `P${p}`,
        courseName: course.name,
        cwId: 'Not Deployed',
        students: pStudents.length,
        synced: 0,
        errors: pStudents.length,
        avgScore: '---',
        status: 'CW NOT FOUND'
      });
      continue;
    }

    const maxPts = matchingCw.maxPoints || 10;
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`📁 Period ${p}: ${course.name}`);
    console.log(`   Coursework: "${matchingCw.title}" (ID: ${matchingCw.id}, Max Points: ${maxPts})`);
    console.log(`   Students to sync: ${pStudents.length}`);

    // Pre-cache enrolled students in Classroom course to resolve IDs instantly
    const classroomStudentMap = new Map();
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
    } catch (e) {}

    let successCount = 0;
    let errorCount = 0;
    let totalScore = 0;

    for (const student of pStudents) {
      // Calculate scaled score
      let scaledScore = student.rawPercentage;
      if (maxPts && maxPts > 0 && maxPts !== 100) {
        scaledScore = Math.round((student.rawPercentage / 100) * maxPts * 10) / 10;
      }
      totalScore += scaledScore;

      const email = student.email.toLowerCase().trim();
      const sId = student.studentId;
      const lookupKey = classroomStudentMap.get(email) || 
                        classroomStudentMap.get(`${sId}@orangeusd.org`) || 
                        email;

      if (isDryRun) {
        console.log(`   [DRY-RUN] ${student.name.padEnd(26)} | ID: ${sId.padEnd(8)} | Score: ${student.rawPercentage}% -> ${scaledScore}/${maxPts} pts`);
        successCount++;
        continue;
      }

      // Live push to Google Classroom
      try {
        // 1. Fetch submission
        let subRes;
        try {
          subRes = await classroom.courses.courseWork.studentSubmissions.list({
            courseId: course.id,
            courseWorkId: matchingCw.id,
            userId: lookupKey
          });
        } catch (subErr) {
          // Fallback: list submissions by email or studentId directly
          subRes = await classroom.courses.courseWork.studentSubmissions.list({
            courseId: course.id,
            courseWorkId: matchingCw.id,
            userId: `${sId}@orangeusd.org`
          });
        }

        const subs = subRes.data.studentSubmissions || [];
        if (subs.length === 0) {
          console.warn(`   ⚠️  No submission found for ${student.name} (${sId}) in Classroom.`);
          errorCount++;
          continue;
        }

        const subId = subs[0].id;

        // 2. Patch draft and assigned grade
        await classroom.courses.courseWork.studentSubmissions.patch({
          courseId: course.id,
          courseWorkId: matchingCw.id,
          id: subId,
          updateMask: 'draftGrade,assignedGrade',
          requestBody: {
            draftGrade: scaledScore,
            assignedGrade: scaledScore
          }
        });

        // 3. Return submission to student
        try {
          await classroom.courses.courseWork.studentSubmissions.return({
            courseId: course.id,
            courseWorkId: matchingCw.id,
            id: subId,
            requestBody: {}
          });
        } catch (rErr) {}

        console.log(`   ✅ Synced: ${student.name.padEnd(24)} -> ${scaledScore}/${maxPts} pts (Returned)`);
        successCount++;
      } catch (err) {
        console.error(`   ❌ Failed: ${student.name} (${sId}): ${err.message}`);
        errorCount++;
      }
    }

    const avg = pStudents.length > 0 ? (totalScore / pStudents.length).toFixed(1) : 0;
    summaryRows.push({
      period: `P${p}`,
      courseName: course.name.length > 30 ? course.name.slice(0, 27) + '...' : course.name,
      cwId: matchingCw.id,
      students: pStudents.length,
      synced: successCount,
      errors: errorCount,
      avgScore: `${avg}/${maxPts}`,
      status: errorCount === 0 ? 'COMPLETE' : 'PARTIAL'
    });
  }

  // ---------------------------------------------------------------------
  // Summary Table Output
  // ---------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log('                      DAILY SYNC EXECUTIVE SUMMARY');
  console.log('========================================================================');
  console.log(`Assignment: ${selectedAssignment.name}`);
  console.log(`Mode:       ${isDryRun ? 'DRY RUN (Preview Only)' : 'LIVE CLASSROOM SYNC'}\n`);

  console.log(
    'Period'.padEnd(8) +
    'Course Name'.padEnd(32) +
    'Coursework ID'.padEnd(16) +
    'Synced'.padEnd(12) +
    'Avg Score'.padEnd(12) +
    'Status'
  );
  console.log('-'.repeat(88));

  let totalSynced = 0;
  let totalErrors = 0;
  let totalEligible = 0;

  summaryRows.forEach(r => {
    totalSynced += r.synced;
    totalErrors += r.errors;
    totalEligible += r.students;

    console.log(
      r.period.padEnd(8) +
      r.courseName.padEnd(32) +
      r.cwId.padEnd(16) +
      `${r.synced}/${r.students}`.padEnd(12) +
      r.avgScore.padEnd(12) +
      r.status
    );
  });

  console.log('-'.repeat(88));
  console.log(
    'TOTALS'.padEnd(40) +
    `${totalSynced}/${totalEligible} Students`.padEnd(28) +
    (totalErrors === 0 ? 'ALL SUCCESS' : `${totalErrors} ERRORS`)
  );
  console.log('========================================================================\n');
  
  if (isDryRun) {
    console.log('💡 To perform the actual live sync and return grades to students, run:');
    console.log(`   npm run sync -- "${selectedAssignment.name}"\n`);
  }
}

main().catch(err => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
