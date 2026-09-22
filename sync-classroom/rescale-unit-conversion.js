const { google } = require('googleapis');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const isDryRun = process.argv.includes('--dry-run');

// 1. Firebase Admin Init
const serviceAccountPath = path.join(__dirname, '..', 'site-6e500-firebase-adminsdk-fbsvc-407ccb8f99.json');
const serviceAccount = require(serviceAccountPath);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// 2. Classroom Client
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
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.classroom({ version: 'v1', auth: oauth2Client });
}

const PERIODS = [
  { period: 0, courseId: '875053343151', name: 'Period 0' },
  { period: 1, courseId: '875053274185', name: 'Period 1' },
  { period: 2, courseId: '819978306673', name: 'Period 2' },
  { period: 3, courseId: '875053206741', name: 'Period 3' },
  { period: 4, courseId: '875053292931', name: 'Period 4' },
  { period: 5, courseId: '819978427488', name: 'Period 5' },
  { period: 6, courseId: '875047683865', name: 'Period 6' }
];

async function main() {
  console.log('========================================================================');
  console.log(`🔧 RESCALING UNIT CONVERSION PRACTICE TO 10 POINTS MAX`);
  console.log(`Execution Mode: ${isDryRun ? '🧪 DRY-RUN (Preview Only)' : '🚀 LIVE UPDATE'}`);
  console.log('========================================================================\n');

  // Step 1: Fix Firestore documents
  if (!isDryRun) {
    console.log('📝 Updating Firestore assignment_registry and gradest_assignments...');
    try {
      await db.collection('assignment_registry').doc('Unit_Conversion_Practice').set({
        maxPoints: 10
      }, { merge: true });
      console.log('   ✓ assignment_registry/Unit_Conversion_Practice -> maxPoints: 10');

      await db.collection('gradest_assignments').doc('Unit Conversion Practice').set({
        maxPoints: 10,
        maxScore: 10
      }, { merge: true });
      console.log('   ✓ gradest_assignments/Unit Conversion Practice -> maxPoints: 10, maxScore: 10');
    } catch (e) {
      console.warn('   ⚠️ Warning updating Firestore:', e.message);
    }
  }

  // Step 2: Fetch student raw scores from Firestore student_results
  console.log('\n📥 Fetching student records from Firestore student_results...');
  const studentRecords = new Map(); // studentId -> percentage (0-100)
  const studentEmailMap = new Map(); // email -> percentage

  const snap = await db.collection('student_results').doc('Unit_Conversion_Practice').collection('students').get();
  snap.forEach(doc => {
    const data = doc.data() || {};
    const sId = String(data.student_id || doc.id).trim();
    const email = (data.student_email || '').toLowerCase().trim();
    const pct = typeof data.score === 'number' ? data.score : 0;
    studentRecords.set(sId, pct);
    if (email) studentEmailMap.set(email, pct);
  });
  console.log(`   ✓ Loaded ${studentRecords.size} student results from Firestore.\n`);

  const classroom = getClassroomClient();
  let totalOversized = 0;
  let totalFixed = 0;

  for (const p of PERIODS) {
    console.log(`------------------------------------------------------------------------`);
    console.log(`📁 Period ${p.period} (${p.name}):`);

    // 1. Find coursework
    const cwRes = await classroom.courses.courseWork.list({
      courseId: p.courseId,
      pageSize: 100
    });
    const list = cwRes.data.courseWork || [];
    const cw = list.find(c => c.title.toLowerCase().includes('unit conversion'));
    if (!cw) {
      console.log(`   ⚠️ No "Unit Conversion Practice" coursework found.`);
      continue;
    }

    console.log(`   CourseWork: "${cw.title}" (ID: ${cw.id}, maxPoints: ${cw.maxPoints})`);

    // 2. Map enrolled students
    const studentMap = new Map(); // email/name/studentId -> userId
    const userToProfile = new Map(); // userId -> { email, name, studentId }
    let pageToken = null;
    do {
      const stRes = await classroom.courses.students.list({
        courseId: p.courseId,
        pageSize: 100,
        pageToken: pageToken || undefined
      });
      (stRes.data.students || []).forEach(st => {
        const prof = st.profile || {};
        const email = (prof.emailAddress || '').toLowerCase().trim();
        const fullName = prof.name ? prof.name.fullName : '';
        const matchId = email.match(/^(\d+)@/);
        const studentId = matchId ? matchId[1] : '';

        userToProfile.set(st.userId, { email, fullName, studentId });
        if (email) studentMap.set(email, st.userId);
        if (studentId) studentMap.set(studentId, st.userId);
      });
      pageToken = stRes.data.nextPageToken;
    } while (pageToken);

    // 3. Fetch submissions
    const subRes = await classroom.courses.courseWork.studentSubmissions.list({
      courseId: p.courseId,
      courseWorkId: cw.id,
      pageSize: 100
    });
    const submissions = subRes.data.studentSubmissions || [];
    let periodOversized = 0;

    for (const sub of submissions) {
      const currentAssigned = sub.assignedGrade;
      const currentDraft = sub.draftGrade;
      const hasOversized = (typeof currentAssigned === 'number' && currentAssigned > 10) ||
                           (typeof currentDraft === 'number' && currentDraft > 10);

      if (!hasOversized) continue;

      periodOversized++;
      totalOversized++;

      const prof = userToProfile.get(sub.userId) || {};
      const studentName = prof.fullName || sub.userId;
      const studentId = prof.studentId || '';

      // Determine correct scaled score out of 10
      let rawPct = null;
      if (studentId && studentRecords.has(studentId)) {
        rawPct = studentRecords.get(studentId);
      } else if (prof.email && studentEmailMap.has(prof.email)) {
        rawPct = studentEmailMap.get(prof.email);
      } else if (typeof currentAssigned === 'number') {
        // Fallback: the existing grade is the raw percentage (e.g. 100, 33, 17)
        rawPct = currentAssigned;
      }

      const correctScaled = Math.round((rawPct / 100) * 10 * 10) / 10;
      const oldGradeStr = `${currentAssigned !== undefined ? currentAssigned : currentDraft}/10`;
      const newGradeStr = `${correctScaled}/10`;

      if (isDryRun) {
        console.log(`   [DRY-RUN] ${studentName.padEnd(24)} (${studentId.padEnd(6)}) | ${oldGradeStr} -> ${newGradeStr} pts (state: ${sub.state})`);
      } else {
        try {
          // Patch grade
          await classroom.courses.courseWork.studentSubmissions.patch({
            courseId: p.courseId,
            courseWorkId: cw.id,
            id: sub.id,
            updateMask: 'draftGrade,assignedGrade',
            requestBody: {
              draftGrade: correctScaled,
              assignedGrade: correctScaled
            }
          });

          // Return submission if possible
          try {
            await classroom.courses.courseWork.studentSubmissions.return({
              courseId: p.courseId,
              courseWorkId: cw.id,
              id: sub.id
            });
          } catch (retErr) {
            // Already returned or not returned
          }

          console.log(`   ✓ RESCALED: ${studentName.padEnd(24)} (${studentId.padEnd(6)}) | ${oldGradeStr} -> ${newGradeStr} pts [RETURNED]`);
          totalFixed++;
        } catch (patchErr) {
          console.error(`   ❌ Failed to patch ${studentName}:`, patchErr.message);
        }
      }
    }

    if (periodOversized === 0) {
      console.log(`   ✓ All student grades in Period ${p.period} are already within 0-10 pts.`);
    }
  }

  console.log('\n========================================================================');
  if (isDryRun) {
    console.log(`🔍 DRY-RUN PREVIEW COMPLETE`);
    console.log(`Total oversized submissions found: ${totalOversized}`);
    console.log(`Run without --dry-run to apply the live rescaled grades.`);
  } else {
    console.log(`🎉 RESCALING COMPLETE`);
    console.log(`Total submissions rescaled: ${totalFixed}/${totalOversized}`);
  }
  console.log('========================================================================\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
