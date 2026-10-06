/**
 * Redeploy Newton's 2nd Law Calculator to Google Classroom
 * 1. Finds and removes any existing "Newton's 2nd Law Calculator" coursework to clear stale 404 preview cache.
 * 2. Creates clean coursework items with:
 *    - Due Date: Oct 6, 2026 at 6:00 PM PDT (UTC: 2026-10-07T01:00:00Z)
 *    - URL: https://rrmudry.github.io/newtons_second_law_calculator/
 *    - Topic: Unit 2: Motion
 *    - Max Points: 10
 * 3. Updates assignment_registry/newtons_second_law_calculator and gradest_assignments.
 */

const { google } = require('googleapis');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// 1. Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'site-6e500-firebase-adminsdk-fbsvc-407ccb8f99.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath))
  });
}
const db = admin.firestore();

// 2. Classroom Client
function getClassroomClient() {
  const files = fs.readdirSync(__dirname);
  const secretFile = files.find(f => f.startsWith('client_secret_') && f.endsWith('.json'));
  let clientId = process.env.GOOGLE_CLIENT_ID;
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (secretFile) {
    const raw = fs.readFileSync(path.join(__dirname, secretFile), 'utf8');
    const data = JSON.parse(raw);
    const creds = data.web || data.installed;
    if (creds) { clientId = creds.client_id; clientSecret = creds.client_secret; }
  }
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.classroom({ version: 'v1', auth: oauth2Client });
}

// 3. Courses Configuration
const COURSES = [
  { period: 0, courseId: '875053343151', name: 'Period 0 - Physics H - 26/27', topicId: '877400159312' },
  { period: 1, courseId: '875053274185', name: 'Period 1 - Concept Phys - 26/27', topicId: '877404382173' },
  { period: 2, courseId: '819978306673', name: 'Period 2 - Concept Phys - 26/27', topicId: '869422033444' },
  { period: 3, courseId: '875053206741', name: 'Period 3 - Concept Phys - 26/27', topicId: '877401996863' },
  { period: 4, courseId: '875053292931', name: 'Period 4 - Physics - 26/27', topicId: '869421931323' },
  { period: 5, courseId: '819978427488', name: 'Period 5 - Physics - 26/27', topicId: '869421894720' },
  { period: 6, courseId: '875047683865', name: 'Period 6 - Physics - 26/27', topicId: '877404146356' }
];

const ASSIGNMENT_ID = 'newtons_second_law_calculator';
const TITLE = "Newton's 2nd Law Calculator";
const ACTIVITY_URL = 'https://rrmudry.github.io/newtons_second_law_calculator/';
const MAX_POINTS = 10;
// Oct 6, 2026 at 6:00 PM PDT (UTC-7) = Oct 7, 2026 at 01:00 UTC
const DUE_DATE = { year: 2026, month: 10, day: 7 };
const DUE_TIME = { hours: 1, minutes: 0 };

async function redeploy() {
  console.log('='.repeat(72));
  console.log('🚀 REDEPLOYING NEWTON\'S 2ND LAW CALCULATOR');
  console.log('='.repeat(72));
  console.log(`Title:       ${TITLE}`);
  console.log(`URL:         ${ACTIVITY_URL}`);
  console.log(`Due Date:    Oct 6, 2026, 6:00 PM PDT (${JSON.stringify(DUE_DATE)} ${JSON.stringify(DUE_TIME)} UTC)`);
  console.log(`Max Points:  ${MAX_POINTS}`);
  console.log('='.repeat(72) + '\n');

  const classroom = getClassroomClient();
  const courseworkMap = {};
  const deployments = [];

  for (const course of COURSES) {
    console.log(`\n📚 Processing P${course.period} (${course.name})...`);

    // Step A: Find and remove any existing coursework with matching title
    try {
      const listRes = await classroom.courses.courseWork.list({ courseId: course.courseId });
      const existing = (listRes.data.courseWork || []).filter(cw => cw.title.includes("Newton's 2nd Law Calculator"));
      for (const oldCw of existing) {
        process.stdout.write(`   🗑️  Deleting old coursework ${oldCw.id}...`);
        await classroom.courses.courseWork.delete({ courseId: course.courseId, id: oldCw.id });
        console.log(' Done.');
      }
    } catch (delErr) {
      console.warn(`   ⚠️  Error cleaning old coursework: ${delErr.message}`);
    }

    // Step B: Create clean coursework item
    try {
      process.stdout.write(`   ✨ Creating fresh coursework...`);
      const createRes = await classroom.courses.courseWork.create({
        courseId: course.courseId,
        requestBody: {
          title: TITLE,
          workType: 'ASSIGNMENT',
          state: 'PUBLISHED',
          maxPoints: MAX_POINTS,
          dueDate: DUE_DATE,
          dueTime: DUE_TIME,
          topicId: course.topicId,
          materials: [{
            link: { url: ACTIVITY_URL }
          }]
        }
      });

      const cwId = createRes.data.id;
      courseworkMap[course.courseId] = cwId;
      console.log(` Created! (CW ID: ${cwId})`);

      deployments.push({
        period: course.period,
        courseId: course.courseId,
        courseName: course.name,
        courseworkId: cwId,
        success: true
      });
    } catch (createErr) {
      console.error(` ❌ Failed to create coursework: ${createErr.message}`);
      deployments.push({
        period: course.period,
        courseId: course.courseId,
        courseName: course.name,
        success: false,
        error: createErr.message
      });
    }

    await new Promise(r => setTimeout(r, 600));
  }

  // Step C: Update Firestore Registry
  console.log('\n' + '='.repeat(72));
  console.log('📝 Updating Firestore Assignment Registry...');
  console.log('='.repeat(72));

  const registryDoc = {
    assignmentId: ASSIGNMENT_ID,
    title: TITLE,
    description: '',
    maxPoints: MAX_POINTS,
    firestorePath: 'student_results',
    coursework: courseworkMap,
    activityUrl: ACTIVITY_URL,
    unit: 'Unit 2: Dynamics & Newton\'s Laws',
    standards: ['HS-PS2-1'],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('assignment_registry').doc(ASSIGNMENT_ID).set(registryDoc, { merge: true });
  console.log(`  ✓ Updated assignment_registry/${ASSIGNMENT_ID}`);

  const backcompatPayload = {
    assignmentName: TITLE,
    title: TITLE,
    description: '',
    maxScore: MAX_POINTS,
    maxPoints: MAX_POINTS,
    topic: 'Unit 2: Dynamics & Newton\'s Laws',
    activityUrl: ACTIVITY_URL,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    classroomDeployments: deployments.filter(d => d.success),
    registryId: ASSIGNMENT_ID
  };

  for (const docName of [TITLE, ASSIGNMENT_ID]) {
    await db.collection('gradest_assignments').doc(docName).set(backcompatPayload, { merge: true });
    console.log(`  ✓ Updated gradest_assignments/${docName}`);
  }

  await db.collection('student_results').doc(ASSIGNMENT_ID).set({
    assignment_name: TITLE,
    unit: 'Unit 2: Dynamics & Newton\'s Laws',
    standards: ['HS-PS2-1'],
    registryId: ASSIGNMENT_ID,
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log(`  ✓ Updated student_results/${ASSIGNMENT_ID} parent document`);

  console.log('\n🎉 REDEPLOYMENT COMPLETE!\n');
}

redeploy().catch(err => {
  console.error('\n❌ Fatal Error:', err);
  process.exit(1);
});
