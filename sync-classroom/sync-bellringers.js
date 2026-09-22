#!/usr/bin/env node
/**
 * Bell-Ringer Grading & Gradebook Sync CLI
 * 
 * Automatically aggregates student Bell-Ringer submissions from Firestore,
 * evaluates scientific quality using the "half-ass" filter, applies the fairness cushion,
 * records results in Firestore `student_results`, registers coursework in `assignment_registry`,
 * and syncs/returns grades in Google Classroom across all periods.
 * 
 * Modes:
 *   --retroactive       Grade cumulative Bell-Ringers (Weeks 1–5: Aug 26 – Sep 18, 80 pts max) [Default]
 *   --weekly            Grade weekly Bell-Ringers (Mon–Fri, 4 pts/day = 20 pts/week)
 *   --week=N            Target a specific school week for weekly grading (e.g. --week=6)
 *   --start=YYYY-MM-DD  Custom start date
 *   --end=YYYY-MM-DD    Custom end date
 *   --points=N          Override max points (e.g. --points=80)
 *   --target=N          Override genuine days needed for 100% (default: 10 for retroactive, 5 for weekly)
 * 
 * Flags:
 *   --dry-run, -d       Preview scores, grade distributions, and quality flags without writing to DB or Classroom
 *   --period=N, -p=N    Filter to a specific class period (0 to 6)
 *   --force, -f         Force update and return grades even if unchanged
 *   --help, -h          Show help menu
 * 
 * Examples:
 *   node sync-bellringers.js --retroactive --dry-run
 *   node sync-bellringers.js --retroactive
 *   node sync-bellringers.js --weekly --dry-run
 *   node sync-bellringers.js --weekly
 */

const { google } = require('googleapis');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// =====================================================================
// 1. Course Configuration
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
// 2. Firebase Admin Initialization
// =====================================================================
let db = null;
try {
  const serviceAccountPath = path.join(__dirname, '..', 'site-6e500-firebase-adminsdk-fbsvc-407ccb8f99.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
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
// 3. Google Classroom OAuth2 Client
// =====================================================================
function getCredentials() {
  try {
    const files = fs.readdirSync(__dirname);
    const secretFile = files.find(f => f.startsWith('client_secret_') && f.endsWith('.json'));
    if (secretFile) {
      const raw = fs.readFileSync(path.join(__dirname, secretFile), 'utf8');
      const data = JSON.parse(raw);
      const creds = data.web || data.installed;
      if (creds) return { clientId: creds.client_id, clientSecret: creds.client_secret };
    }
  } catch (e) {}
  return { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET };
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
// 4. Quality & Effort Evaluation Engine ("The Half-Ass Filter")
// =====================================================================
function evaluateSubmission(sub) {
  const type = sub.activityType || 
    (sub.solvedCategories ? 'connections' : 
    (sub.totalSteps ? 'cast_challenge' : 
    (sub.chatMessages ? 'concept_chat' : 'free_response')));

  if (type === 'cast_challenge') {
    const pct = sub.percentComplete !== undefined ? sub.percentComplete : 
      (sub.totalSteps && sub.completedSteps !== undefined ? (sub.completedSteps / sub.totalSteps) * 100 : 0);
    const steps = sub.completedSteps || 0;
    if (pct < 50 && steps < 2) {
      return { isGenuine: false, type, reason: `cast_low_progress (${pct}% completed, ${steps} steps)` };
    }
    return { isGenuine: true, type, reason: `cast_completed (${pct}%)` };
  }

  if (type === 'concept_chat') {
    const msgs = sub.chatMessages || [];
    const userMsgs = msgs.filter(m => m.sender === 'user' || m.role === 'user');
    const totalUserText = userMsgs.map(m => (m.text || '').trim()).join(' ');

    if (userMsgs.length === 0) {
      return { isGenuine: false, type, reason: 'chat_0_user_turns (bypassed to finish)' };
    }
    if (userMsgs.length === 1 && totalUserText.length < 15) {
      return { isGenuine: false, type, reason: `chat_single_terse_turn ("${totalUserText}")` };
    }
    return { isGenuine: true, type, reason: `chat_active (${userMsgs.length} turns)` };
  }

  if (type === 'connections') {
    const solved = (sub.solvedCategories || []).length;
    if (solved === 0 && (!sub.studentResponse || sub.studentResponse.length < 5)) {
      return { isGenuine: false, type, reason: 'connections_0_categories_solved' };
    }
    return { isGenuine: true, type, reason: `connections_solved (${solved} categories)` };
  }

  // free_response
  const resp = (sub.studentResponse || '').trim();
  const lower = resp.toLowerCase();
  const optOuts = ['idk', "i don't know", "i dont know", 'none', 'nothing', 'no', 'n/a', 'na'];
  const isZeroScore = sub.effortScore === '0' || sub.effortScore === 0;
  if (resp.length < 15 || optOuts.includes(lower) || isZeroScore) {
    return { isGenuine: false, type, reason: `free_response_low_effort ("${resp.substring(0, 25)}")` };
  }
  return { isGenuine: true, type, reason: 'free_response_genuine' };
}

// =====================================================================
// 5. CLI Options & Parameters
// =====================================================================
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: 'retroactive', // 'retroactive' or 'weekly'
    dryRun: false,
    force: false,
    period: null,
    startDate: null,
    endDate: null,
    maxPoints: null,
    targetGenuine: null,
    weekNumber: null,
    topic: 'Unit 2: Motion'
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      console.log(`
Bell-Ringer Grade Sync CLI

Usage:
  node sync-bellringers.js [options]

Modes:
  --retroactive       Grade cumulative Bell-Ringers (Weeks 1–5: Aug 26 – Sep 18, 80 pts max) [Default]
  --weekly            Grade weekly Bell-Ringers (Mon–Fri, 4 pts/day = 20 pts/week)
  --week=N            Specify a school week number for weekly mode (e.g. --week=6)

Date & Point Overrides:
  --start=YYYY-MM-DD  Custom start date (inclusive)
  --end=YYYY-MM-DD    Custom end date (inclusive)
  --points=N          Override total points (default: 80 for retroactive, 20 for weekly)
  --target=N          Override genuine bell-ringer count required for 100% (default: 10 for retroactive)

Flags:
  --dry-run, -d       Preview scores and flags without writing to Firestore or Classroom
  --period=N, -p=N    Filter to specific period (0–6)
  --force, -f         Force update and return grades even if already assigned
`);
      process.exit(0);
    }
    if (arg === '--dry-run' || arg === '-d') options.dryRun = true;
    else if (arg === '--force' || arg === '-f') options.force = true;
    else if (arg === '--retroactive') options.mode = 'retroactive';
    else if (arg === '--weekly') options.mode = 'weekly';
    else if (arg.startsWith('--period=')) options.period = parseInt(arg.split('=')[1], 10);
    else if (arg.startsWith('-p=')) options.period = parseInt(arg.split('=')[1], 10);
    else if (arg.startsWith('--week=')) options.weekNumber = parseInt(arg.split('=')[1], 10);
    else if (arg.startsWith('--start=')) options.startDate = arg.split('=')[1];
    else if (arg.startsWith('--end=')) options.endDate = arg.split('=')[1];
    else if (arg.startsWith('--points=')) options.maxPoints = parseFloat(arg.split('=')[1]);
    else if (arg.startsWith('--target=')) options.targetGenuine = parseInt(arg.split('=')[1], 10);
  }

  // Set defaults based on mode
  if (options.mode === 'retroactive') {
    if (!options.startDate) options.startDate = '2026-08-26';
    if (!options.endDate) options.endDate = '2026-09-18';
    if (!options.maxPoints) options.maxPoints = 80;
    if (!options.targetGenuine) options.targetGenuine = 10;
    options.assignmentId = 'bell_ringer_weeks_1_5';
    options.title = 'Bell-Ringer Check-In: Weeks 1–5';
    options.description = 
`This cumulative grade covers daily Bell-Ringer activities from Weeks 1–5 (Aug 26 – Sep 18).

SCORING & FAIRNESS CUSHION:
• Total Value: 80 Points (20 points per completed week × 4 weeks).
• Full Credit (80/80 points): Awarded for completing at least 10 genuine Bell-Ringer activities.
• Fairness Cushion: 3 to 5 "drop days" are built in to forgive excused absences, block scheduling variances, or technical glitches.
• Proportional Credit: Students with fewer than 10 genuine submissions receive 8 points per genuine activity (e.g. 8 days = 64/80 pts).

QUALITY POLICY:
Submissions flagged for zero effort (such as 0% completion on CAST challenges, 0 chat turns with the AI mentor, or typing "idk") receive 0 points.

Moving forward, Bell-Ringers will be graded weekly at 4 points per day (20 points per week).`;
  } else {
    // Weekly mode
    if (!options.startDate || !options.endDate) {
      if (options.weekNumber === 6 || !options.weekNumber) {
        options.startDate = '2026-09-21';
        options.endDate = '2026-09-25';
        options.weekNumber = 6;
      }
    }
    if (!options.maxPoints) options.maxPoints = 20;
    if (!options.targetGenuine) options.targetGenuine = 5;
    options.assignmentId = `bell_ringer_week_${options.weekNumber || 'curr'}`;
    options.title = `Bell-Ringer: Week ${options.weekNumber || ''} (${options.startDate} to ${options.endDate})`.replace('  ', ' ');
    options.description =
`Weekly Bell-Ringer grade for ${options.startDate} to ${options.endDate}.
Each day's genuine Bell-Ringer activity is worth 4 points (4 pts/day × 5 days = 20 points total).
Submissions flagged for zero effort or opt-outs receive 0 points.`;
  }

  return options;
}

// =====================================================================
// 6. Main Grade Calculation & Sync Workflow
// =====================================================================
async function main() {
  const options = parseArgs();

  console.log('\n=================================================================');
  console.log('🔔  BELL-RINGER GRADE SYNC');
  console.log('=================================================================');
  console.log(` Mode:           ${options.mode.toUpperCase()}`);
  console.log(` Assignment ID:  ${options.assignmentId}`);
  console.log(` Title:          "${options.title}"`);
  console.log(` Date Window:    ${options.startDate} → ${options.endDate}`);
  console.log(` Max Points:     ${options.maxPoints} pts`);
  console.log(` 100% Target:    ${options.targetGenuine} genuine days`);
  console.log(` Period Filter:  ${options.period !== null ? `Period ${options.period}` : 'All Periods (0–6)'}`);
  console.log(` Dry Run:        ${options.dryRun ? 'YES (preview only, no modifications)' : 'NO (live database & classroom sync)'}`);
  console.log('=================================================================\n');

  // Step 1: Load Student Roster
  console.log('📋 Fetching student roster from Firestore...');
  const rosterSnap = await db.collection('roster').get();
  const students = {};
  rosterSnap.forEach(doc => {
    const data = doc.data();
    students[doc.id] = {
      id: doc.id,
      email: (data.email || `${doc.id}@orangeusd.org`).toLowerCase().trim(),
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      period: data.class_period !== undefined ? data.class_period : 99,
      genuineCount: 0,
      lowEffortCount: 0,
      totalSubmitted: 0,
      submissionsByDate: {},
      flaggedList: []
    };
  });
  console.log(`   Found ${Object.keys(students).length} enrolled students in roster.`);

  // Step 2: Fetch Bell-Ringer Submissions in Date Range
  console.log(`📥 Querying bellringers from ${options.startDate} to ${options.endDate}...`);
  const bellSnap = await db.collection('bellringers').get();
  let totalDocsProcessed = 0;
  const activeDates = new Set();

  bellSnap.forEach(doc => {
    const d = doc.data();
    let date = d.date;
    if (!date && d.timestamp && d.timestamp.toDate) {
      date = d.timestamp.toDate().toISOString().split('T')[0];
    }
    if (!date) {
      const parts = doc.id.split('_');
      if (parts[1] && parts[1].startsWith('2026')) date = parts[1];
    }
    if (!date || date < options.startDate || date > options.endDate) return;

    activeDates.add(date);
    totalDocsProcessed++;

    const studentId = d.studentId || doc.id.split('_')[0];
    const s = students[studentId];
    if (!s) return;

    // Filter by period if requested
    if (options.period !== null && s.period !== options.period) return;

    s.totalSubmitted++;

    const evalResult = evaluateSubmission(d);
    s.submissionsByDate[date] = {
      isGenuine: evalResult.isGenuine,
      type: evalResult.type,
      reason: evalResult.reason
    };

    if (evalResult.isGenuine) {
      s.genuineCount++;
    } else {
      s.lowEffortCount++;
      s.flaggedList.push({ date, type: evalResult.type, reason: evalResult.reason });
    }
  });

  console.log(`   Found ${totalDocsProcessed} submissions across ${activeDates.size} active school days.`);
  console.log(`   Active dates: ${Array.from(activeDates).sort().join(', ')}`);

  // Step 3: Compute Scores & Grade Distribution
  const studentList = Object.values(students).filter(s => {
    if (options.period !== null) return s.period === options.period;
    return true;
  });

  const ptsPerGenuine = options.maxPoints / options.targetGenuine;
  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0, Zero: 0 };
  let totalPointsAssigned = 0;
  let totalGenuineSubmissions = 0;
  let totalFlaggedSubmissions = 0;

  studentList.forEach(s => {
    totalGenuineSubmissions += s.genuineCount;
    totalFlaggedSubmissions += s.lowEffortCount;

    // Score calculation with fairness cushion
    let score = Math.min(options.maxPoints, Math.round(s.genuineCount * ptsPerGenuine * 10) / 10);
    // If no submissions at all
    if (s.totalSubmitted === 0) score = 0;

    const percent = Math.min(100, Math.round((score / options.maxPoints) * 100));
    s.score = score;
    s.percent = percent;

    if (s.totalSubmitted === 0) gradeDistribution.Zero++;
    else if (percent >= 90) gradeDistribution.A++;
    else if (percent >= 80) gradeDistribution.B++;
    else if (percent >= 70) gradeDistribution.C++;
    else if (percent >= 60) gradeDistribution.D++;
    else gradeDistribution.F++;

    totalPointsAssigned += score;
  });

  const avgPercent = studentList.length > 0 
    ? (studentList.reduce((acc, s) => acc + s.percent, 0) / studentList.length).toFixed(1) 
    : 0;

  console.log('\n-----------------------------------------------------------------');
  console.log('📊  SCORING & GRADE DISTRIBUTION SUMMARY');
  console.log('-----------------------------------------------------------------');
  console.log(` Total Evaluated Students: ${studentList.length}`);
  console.log(` Genuine Submissions:      ${totalGenuineSubmissions} (${Math.round((totalGenuineSubmissions / (totalGenuineSubmissions + totalFlaggedSubmissions || 1)) * 100)}%)`);
  console.log(` Flagged Half-Assed/Opt:   ${totalFlaggedSubmissions}`);
  console.log(` Class Average Score:      ${(totalPointsAssigned / studentList.length).toFixed(1)} / ${options.maxPoints} (${avgPercent}%)`);
  console.log('\n Grade Breakdown:');
  console.log(`   🟢 A (90–100%):   ${gradeDistribution.A} students`);
  console.log(`   🔵 B (80–89%):    ${gradeDistribution.B} students`);
  console.log(`   🟡 C (70–79%):    ${gradeDistribution.C} students`);
  console.log(`   🟠 D (60–69%):    ${gradeDistribution.D} students`);
  console.log(`   🔴 F (< 60%):     ${gradeDistribution.F} students`);
  console.log(`   ⚪ 0 Submissions: ${gradeDistribution.Zero} students`);

  // Breakdown by Period Table
  console.log('\n Period Breakdown:');
  const periodGroups = {};
  studentList.forEach(s => {
    if (!periodGroups[s.period]) periodGroups[s.period] = [];
    periodGroups[s.period].push(s);
  });

  console.log(' | Period | Enrolled | Avg Score | A  | B  | C  | D  | F  | 0 Subs |');
  console.log(' |--------|:--------:|:---------:|:--:|:--:|:--:|:--:|:--:|:------:|');
  for (let p = 0; p <= 6; p++) {
    const pStudents = periodGroups[p] || [];
    if (pStudents.length === 0) continue;
    const pAvg = (pStudents.reduce((acc, s) => acc + s.score, 0) / pStudents.length).toFixed(1);
    const pA = pStudents.filter(s => s.percent >= 90).length;
    const pB = pStudents.filter(s => s.percent >= 80 && s.percent < 90).length;
    const pC = pStudents.filter(s => s.percent >= 70 && s.percent < 80).length;
    const pD = pStudents.filter(s => s.percent >= 60 && s.percent < 70).length;
    const pF = pStudents.filter(s => s.totalSubmitted > 0 && s.percent < 60).length;
    const pZero = pStudents.filter(s => s.totalSubmitted === 0).length;
    console.log(` |   ${p}    |    ${pStudents.length.toString().padStart(2)}    |   ${pAvg.padStart(4)}/${options.maxPoints}  | ${pA.toString().padStart(2)} | ${pB.toString().padStart(2)} | ${pC.toString().padStart(2)} | ${pD.toString().padStart(2)} | ${pF.toString().padStart(2)} |   ${pZero.toString().padStart(2)}   |`);
  }

  // Sample Flagged Submissions Log
  console.log('\n Examples of Flagged Zero-Effort Submissions Filtered Out:');
  const allFlagged = [];
  studentList.forEach(s => s.flaggedList.forEach(f => allFlagged.push({ name: s.name, period: s.period, ...f })));
  allFlagged.slice(0, 6).forEach(f => {
    console.log(`   ⚠️  [P${f.period}] ${f.name} on ${f.date} (${f.type}): ${f.reason}`);
  });

  if (options.dryRun) {
    console.log('\n=================================================================');
    console.log('🔍  DRY-RUN COMPLETE — NO CHANGES WRITTEN TO FIRESTORE OR CLASSROOM');
    console.log('    To deploy coursework and sync grades, run without --dry-run:');
    console.log(`    node sync-bellringers.js --${options.mode}`);
    console.log('=================================================================\n');
    return;
  }

  // =====================================================================
  // Step 4: Write Aggregated Results to Firestore `student_results`
  // =====================================================================
  console.log('\n💾 Writing calculated scores to Firestore student_results...');
  const batchSize = 400;
  let batch = db.batch();
  let writeCount = 0;

  for (const s of studentList) {
    const docRef = db.collection('student_results')
      .doc(options.assignmentId)
      .collection('students')
      .doc(s.id);

    batch.set(docRef, {
      studentId: s.id,
      studentName: s.name,
      studentEmail: s.email,
      class_period: s.period,
      score: s.score,
      maxScore: options.maxPoints,
      percent: s.percent,
      genuineCount: s.genuineCount,
      lowEffortCount: s.lowEffortCount,
      totalSubmitted: s.totalSubmitted,
      targetGenuine: options.targetGenuine,
      assignmentTitle: options.title,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    writeCount++;
    if (writeCount % batchSize === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  if (writeCount % batchSize !== 0) {
    await batch.commit();
  }
  console.log(`   ✅ Wrote ${writeCount} student grade records to student_results/${options.assignmentId}`);

  // =====================================================================
  // Step 5: Check or Register Coursework in `assignment_registry` & Classroom
  // =====================================================================
  console.log('\n🏫 Checking Google Classroom coursework & assignment_registry...');
  const classroom = getClassroomClient();
  const registryRef = db.collection('assignment_registry').doc(options.assignmentId);
  const registryDoc = await registryRef.get();

  let courseworkIds = {};
  if (registryDoc.exists) {
    courseworkIds = registryDoc.data().courseworkIds || {};
    console.log(`   Found existing registry entry for "${options.assignmentId}".`);
  }

  // Verify or Create Coursework for each course
  for (const course of COURSES) {
    if (options.period !== null && course.period !== options.period) continue;

    let cwId = courseworkIds[course.courseId];

    // If registered, verify it still exists in Classroom
    if (cwId) {
      try {
        await classroom.courses.courseWork.get({
          courseId: course.courseId,
          id: cwId
        });
        console.log(`   Period ${course.period}: Coursework verified (ID: ${cwId})`);
      } catch (e) {
        console.warn(`   Period ${course.period}: Registered coursework ID not found, will search or create.`);
        cwId = null;
      }
    }

    // If not verified, search Classroom for existing assignment by title
    if (!cwId) {
      try {
        const listRes = await classroom.courses.courseWork.list({
          courseId: course.courseId,
          pageSize: 50
        });
        const existing = (listRes.data.courseWork || []).find(cw => cw.title === options.title);
        if (existing) {
          cwId = existing.id;
          courseworkIds[course.courseId] = cwId;
          console.log(`   Period ${course.period}: Found existing coursework by title (ID: ${cwId})`);
        }
      } catch (e) {
        console.warn(`   Period ${course.period}: Search failed:`, e.message);
      }
    }

    // If still missing, create the coursework
    if (!cwId) {
      console.log(`   Period ${course.period}: Creating coursework "${options.title}"...`);
      const topicId = KNOWN_TOPICS[course.courseId]?.[options.topic] || null;

      const cwPayload = {
        title: options.title,
        description: options.description,
        maxPoints: options.maxPoints,
        workType: 'ASSIGNMENT',
        state: 'PUBLISHED',
        submissionModificationMode: 'MODIFIABLE_UNTIL_TURNED_IN',
        materials: [
          {
            link: {
              url: 'https://rrmudry.github.io/Bell-Ringer/index.html',
              title: 'Student Bell-Ringer Portal'
            }
          }
        ]
      };
      if (topicId) cwPayload.topicId = topicId;

      try {
        const createRes = await classroom.courses.courseWork.create({
          courseId: course.courseId,
          requestBody: cwPayload
        });
        cwId = createRes.data.id;
        courseworkIds[course.courseId] = cwId;
        console.log(`   ✅ Period ${course.period}: Created coursework (ID: ${cwId})`);
      } catch (e) {
        console.error(`   ❌ Period ${course.period}: Failed to create coursework:`, e.message);
        continue;
      }
    }
  }

  // Update assignment_registry
  await registryRef.set({
    assignmentId: options.assignmentId,
    title: options.title,
    maxPoints: options.maxPoints,
    topic: options.topic,
    type: 'bell_ringer',
    courseworkIds: courseworkIds,
    lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log(`   ✅ assignment_registry updated for "${options.assignmentId}".`);

  // =====================================================================
  // Step 6: Push & Return Grades to Google Classroom
  // =====================================================================
  console.log('\n📤 Pushing grades to Google Classroom across all periods...');

  let totalPushed = 0;
  let totalUpToDate = 0;
  let totalErrors = 0;

  for (const course of COURSES) {
    if (options.period !== null && course.period !== options.period) continue;
    const cwId = courseworkIds[course.courseId];
    if (!cwId) {
      console.warn(`   ⚠️ Skipping Period ${course.period}: No coursework ID available.`);
      continue;
    }

    const pStudents = studentList.filter(s => s.period === course.period);
    if (pStudents.length === 0) continue;

    console.log(`\n▶ Period ${course.period} (${course.name}): Processing ${pStudents.length} students...`);

    // 1. Fetch course roster to build userId map (with pagination handling, max 30 per page)
    const studentUserMap = new Map();
    try {
      let pageToken = null;
      do {
        const rosterRes = await classroom.courses.students.list({
          courseId: course.courseId,
          pageSize: 100,
          pageToken: pageToken || undefined
        });
        (rosterRes.data.students || []).forEach(st => {
          const prof = st.profile || {};
          const email = (prof.emailAddress || '').toLowerCase().trim();
          const fullName = (prof.name ? prof.name.fullName : '').toLowerCase().trim();
          if (email) studentUserMap.set(email, st.userId);
          if (fullName) studentUserMap.set(fullName, st.userId);
        });
        pageToken = rosterRes.data.nextPageToken;
      } while (pageToken);
    } catch (e) {
      console.warn(`   Warning: Could not fetch Classroom roster for Period ${course.period}:`, e.message);
    }

    // 2. Fetch all student submissions for this coursework
    const submissionsByUserId = new Map();
    try {
      const subRes = await classroom.courses.courseWork.studentSubmissions.list({
        courseId: course.courseId,
        courseWorkId: cwId,
        pageSize: 100
      });
      (subRes.data.studentSubmissions || []).forEach(sub => {
        submissionsByUserId.set(sub.userId, sub);
      });
    } catch (e) {
      console.warn(`   Warning: Batch listing submissions failed for Period ${course.period}:`, e.message);
    }

    let pUpdated = 0;
    let pUpToDate = 0;
    let pErr = 0;

    for (const student of pStudents) {
      const targetScore = student.score;
      const lookupKey = studentUserMap.get(student.email) ||
                        studentUserMap.get(`${student.id}@orangeusd.org`) ||
                        studentUserMap.get(student.name.toLowerCase());

      let sub = submissionsByUserId.get(lookupKey);
      if (!sub && lookupKey) {
        try {
          const directRes = await classroom.courses.courseWork.studentSubmissions.list({
            courseId: course.courseId,
            courseWorkId: cwId,
            userId: lookupKey
          });
          const subs = directRes.data.studentSubmissions || [];
          if (subs.length > 0) sub = subs[0];
        } catch (e) {}
      }

      if (!sub) {
        pErr++;
        totalErrors++;
        continue;
      }

      // Check existing grade
      const existingGrade = sub.assignedGrade !== undefined && sub.assignedGrade !== null
        ? sub.assignedGrade
        : (sub.draftGrade !== undefined && sub.draftGrade !== null ? sub.draftGrade : null);

      const isReturned = sub.state === 'RETURNED';

      if (!options.force && isReturned && existingGrade === targetScore) {
        pUpToDate++;
        totalUpToDate++;
        continue;
      }

      // Higher score wins rule: never overwrite higher manual grade unless forced
      if (!options.force && existingGrade !== null && existingGrade > targetScore) {
        console.log(`   ℹ️ Preserving higher existing grade for ${student.name} (${existingGrade} > ${targetScore})`);
        pUpToDate++;
        totalUpToDate++;
        continue;
      }

      // Patch & Return
      try {
        await classroom.courses.courseWork.studentSubmissions.patch({
          courseId: course.courseId,
          courseWorkId: cwId,
          id: sub.id,
          updateMask: 'assignedGrade,draftGrade',
          requestBody: {
            assignedGrade: targetScore,
            draftGrade: targetScore
          }
        });

        // Only return if student has turned it in; otherwise draftGrade/assignedGrade is recorded
        if (sub.state === 'TURNED_IN') {
          try {
            await classroom.courses.courseWork.studentSubmissions.return({
              courseId: course.courseId,
              courseWorkId: cwId,
              id: sub.id,
              requestBody: {}
            });
          } catch (retErr) {
            // Ignore state transition error if return cannot be completed
          }
        }

        pUpdated++;
        totalPushed++;
      } catch (e) {
        console.warn(`   ❌ Error updating ${student.name}:`, e.message);
        pErr++;
        totalErrors++;
      }
    }

    console.log(`   Period ${course.period} Summary: ${pUpdated} updated & returned, ${pUpToDate} already up to date, ${pErr} errors/unmatched.`);
  }

  console.log('\n=================================================================');
  console.log('🏁  BELL-RINGER GRADE SYNC COMPLETE');
  console.log('=================================================================');
  console.log(` Total Grades Pushed & Returned: ${totalPushed}`);
  console.log(` Total Already Up To Date:       ${totalUpToDate}`);
  console.log(` Total Unmatched / Errors:       ${totalErrors}`);
  console.log('=================================================================\n');
}

main().catch(error => {
  console.error('\n❌ Fatal Error:', error);
  process.exit(1);
});
