const { google } = require('googleapis');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// 1. Firebase Admin Init
const serviceAccountPath = path.join(__dirname, '..', 'site-6e500-firebase-adminsdk-fbsvc-407ccb8f99.json');
if (!admin.apps.length) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// 2. Google Classroom Client
function getCredentials() {
  const files = fs.readdirSync(__dirname);
  const secretFile = files.find(f => f.startsWith('client_secret_') && f.endsWith('.json'));
  if (secretFile) {
    const raw = fs.readFileSync(path.join(__dirname, secretFile), 'utf8');
    const data = JSON.parse(raw);
    const credentials = data.web || data.installed;
    if (credentials) return { clientId: credentials.client_id, clientSecret: credentials.client_secret };
  }
  return { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET };
}

function getClassroomClient() {
  const { clientId, clientSecret } = getCredentials();
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.classroom({ version: 'v1', auth: oauth2Client });
}

// Target courses and their Coursework IDs
const PERIODS = [
  { period: 0, courseId: '875053343151', cwId: '873261352229', name: 'Period 0 - Physics H' },
  { period: 1, courseId: '875053274185', cwId: '873261693561', name: 'Period 1 - Concept Phys' },
  { period: 2, courseId: '819978306673', cwId: '873260950910', name: 'Period 2 - Concept Phys' },
  { period: 3, courseId: '875053206741', cwId: '873261722446', name: 'Period 3 - Concept Phys' },
  { period: 4, courseId: '875053292931', cwId: '873261417591', name: 'Period 4 - Physics' },
  { period: 5, courseId: '819978427488', cwId: '873261189528', name: 'Period 5 - Physics' },
  { period: 6, courseId: '875047683865', cwId: '873259363140', name: 'Period 6 - Physics' }
];

const ASSIGNMENT_ID = 'unit2_day16_acceleration_studio';
const ASSIGNMENT_NAME = 'Acceleration Studio Practice';

async function creditTurnedInStudents() {
  console.log('========================================================================');
  console.log('🚀 OPTION 1: Batch Crediting All Turned-In Students (10/10 PTS)');
  console.log('========================================================================\n');

  const classroom = getClassroomClient();
  let totalProcessed = 0;
  let totalSucceeded = 0;

  for (const p of PERIODS) {
    console.log(`\n📂 Scanning ${p.name}...`);
    const subsRes = await classroom.courses.courseWork.studentSubmissions.list({
      courseId: p.courseId,
      courseWorkId: p.cwId
    });
    const subs = subsRes.data.studentSubmissions || [];
    const turnedIn = subs.filter(s => s.state === 'TURNED_IN');

    console.log(`   Found ${turnedIn.length} student(s) with TURNED_IN status.`);

    for (const sub of turnedIn) {
      totalProcessed++;
      try {
        // Fetch student user profile for name & email
        const userRes = await classroom.userProfiles.get({ userId: sub.userId });
        const studentName = userRes.data.name?.fullName || 'Student';
        const studentEmail = (userRes.data.emailAddress || '').toLowerCase();
        const studentId = studentEmail.split('@')[0] || sub.userId;

        console.log(`   👉 Processing [P${p.period}] ${studentName} (${studentEmail})...`);

        // 1. Grade in Google Classroom: Set assignedGrade to 10
        await classroom.courses.courseWork.studentSubmissions.patch({
          courseId: p.courseId,
          courseWorkId: p.cwId,
          id: sub.id,
          updateMask: 'assignedGrade,draftGrade',
          requestBody: {
            assignedGrade: 10,
            draftGrade: 10
          }
        });

        // 2. Return submission to student
        await classroom.courses.courseWork.studentSubmissions.return({
          courseId: p.courseId,
          courseWorkId: p.cwId,
          id: sub.id,
          requestBody: {}
        });

        // 3. Save official 100% record in Firestore
        const scoreRef = db.collection('student_results')
                           .doc(ASSIGNMENT_ID)
                           .collection('students')
                           .doc(studentId);

        await scoreRef.set({
          student_id: studentId,
          student_name: studentName,
          email: studentEmail,
          score: 100,
          last_attempt_score: 100,
          isCompleted: true,
          period: p.period,
          verifiedVia: 'turned_in_completion',
          studioState: {
            tier1Streak: 3,
            tier2Streak: 3,
            tier3Streak: 3,
            tierCompleted: { tier1: true, tier2: true, tier3: true, tier4: true },
            tierScores: { tier1: 25, tier2: 25, tier3: 25, tier4: 25 },
            totalScore: 100
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`      ✓ 10/10 pts assigned, returned in Classroom, and saved to Firestore!`);
        totalSucceeded++;
      } catch (err) {
        console.error(`      ❌ Error crediting student (sub ID ${sub.id}):`, err.message);
      }

      // Safe pacing delay for Google Classroom write limits
      await new Promise(r => setTimeout(r, 600));
    }
  }

  // Ensure parent document metadata exists
  try {
    await db.collection('student_results').doc(ASSIGNMENT_ID).set({
      assignment_name: 'Unit 2 Day 16: Acceleration Rate & Sign Studio',
      title: 'Acceleration Studio Practice',
      unit: 'Unit 2: Kinematics in 1D',
      standards: ['HS-PS2-1'],
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`\n💾 Parent metadata updated in Firestore student_results/${ASSIGNMENT_ID}`);
  } catch (e) {
    console.warn('Metadata note:', e.message);
  }

  console.log('\n========================================================================');
  console.log(`🎉 Finished! Successfully credited and returned ${totalSucceeded}/${totalProcessed} students.`);
  console.log('========================================================================');
}

creditTurnedInStudents().catch(err => {
  console.error('Fatal error during batch crediting:', err);
  process.exit(1);
});
