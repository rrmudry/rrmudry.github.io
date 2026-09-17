const { google } = require('googleapis');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// 1. Firebase Admin Init (Optional / Best Effort)
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
  }
} catch (err) {
  console.warn('Firebase init warning:', err.message);
}

// 2. Classroom Client Credentials
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
    throw new Error('Missing Google Classroom OAuth credentials.');
  }
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.classroom({ version: 'v1', auth: oauth2Client });
}

// Target: Period 0 Honors Physics
const COURSE_PERIOD_0 = {
  period: 0,
  courseId: '875053343151',
  name: 'Period 0 - Physics H - 26/27',
  topicId: '877400159312' // Unit 2: Motion
};

const ASSIGNMENT = {
  title: 'Honors Kinematics Graphing Challenges 1 & 2',
  description: `Complete the Honors Kinematics Graphing Challenges 1 & 2 worksheet (individual assignment).

Challenge 1: Oceanic Rendezvous (Research Ship & Emergency Courier Drone)
• Plot both 1D motions on the coordinate grid.
• Determine exact rendezvous time and position from graph intersection.
• Verify velocities using slope calculations (Δx / Δt).
• Conduct battery safety audit.

Challenge 2: Tactical Highway Intercept (Multi-Leg Journey & Patrol Options)
• Plot the 3-leg target motion (driving, rest stop interval where v = 0 m/s, and resumed highway travel).
• Graph intercept strategy lines from the patrol station (departure delay at t = 30 s).
• Calculate required intercept speeds and evaluate physically possible strategies against patrol speed limits.

Worksheet Link: https://rrmudry.github.io/Unit_2/honors_worksheets/Honors_Kinematics_Graphing_Challenges_1_and_2.pdf
Turn in your completed physical worksheet or upload photos of both sides here.`,
  maxPoints: 10,
  // Due 9/17 at 6:00 PM PDT = Sep 18, 2026 01:00 UTC
  dueDate: { year: 2026, month: 9, day: 18 },
  dueTime: { hours: 1, minutes: 0 },
  activityUrl: 'https://rrmudry.github.io/Unit_2/honors_worksheets/Honors_Kinematics_Graphing_Challenges_1_and_2.pdf'
};

async function postHonorsAssignment() {
  console.log('====================================================');
  console.log(`🚀 Posting Google Classroom Assignment for Period 0 Honors`);
  console.log(`📋 Title: "${ASSIGNMENT.title}"`);
  console.log(`📊 Points: ${ASSIGNMENT.maxPoints} pts`);
  console.log(`⏰ Due: Sep 17, 2026 at 6:00 PM PDT (Sep 18 01:00 UTC)`);
  console.log(`🏷️ Topic: Unit 2: Motion (ID: ${COURSE_PERIOD_0.topicId})`);
  console.log(`🔗 Link: ${ASSIGNMENT.activityUrl}`);
  console.log('====================================================\n');

  const classroom = getClassroomClient();

  // Check if assignment already exists
  console.log(`🔍 Checking existing coursework in "${COURSE_PERIOD_0.name}"...`);
  const listRes = await classroom.courses.courseWork.list({
    courseId: COURSE_PERIOD_0.courseId,
    pageSize: 20
  });

  const existing = (listRes.data.courseWork || []).find(
    cw => cw.title.toLowerCase().trim() === ASSIGNMENT.title.toLowerCase().trim()
  );

  if (existing) {
    console.log(`⚠️ Assignment already exists with ID: ${existing.id}`);
    console.log(`   Link: ${existing.alternateLink}`);
    return;
  }

  // 1. Create CourseWork
  console.log(`⏳ Creating CourseWork in Period 0...`);
  const createRes = await classroom.courses.courseWork.create({
    courseId: COURSE_PERIOD_0.courseId,
    requestBody: {
      title: ASSIGNMENT.title,
      description: ASSIGNMENT.description,
      workType: 'ASSIGNMENT',
      state: 'PUBLISHED',
      maxPoints: ASSIGNMENT.maxPoints,
      dueDate: ASSIGNMENT.dueDate,
      dueTime: ASSIGNMENT.dueTime,
      materials: [
        {
          link: {
            url: ASSIGNMENT.activityUrl,
            title: 'Honors Kinematics Graphing Challenges 1 & 2 (PDF)'
          }
        }
      ]
    }
  });

  const cwId = createRes.data.id;
  const altLink = createRes.data.alternateLink;
  console.log(`   ✓ CourseWork created successfully! ID: ${cwId}`);
  console.log(`   🔗 Classroom Link: ${altLink}`);

  // 2. Patch Topic to "Unit 2: Motion"
  if (COURSE_PERIOD_0.topicId) {
    try {
      await classroom.courses.courseWork.patch({
        courseId: COURSE_PERIOD_0.courseId,
        id: cwId,
        updateMask: 'topicId',
        requestBody: {
          topicId: COURSE_PERIOD_0.topicId
        }
      });
      console.log(`   ✓ Topic "Unit 2: Motion" assigned (Topic ID: ${COURSE_PERIOD_0.topicId})`);
    } catch (topicErr) {
      console.warn(`   ⚠️ Warning: Could not patch topic:`, topicErr.message);
    }
  }

  // 3. Save to Firestore gradest_assignments for tracking
  if (db) {
    try {
      const docName = 'Honors_Kinematics_Graphing_Challenges_1_and_2';
      await db.collection('gradest_assignments').doc(docName).set({
        assignmentName: ASSIGNMENT.title,
        title: ASSIGNMENT.title,
        assignmentDetails: ASSIGNMENT.description,
        description: ASSIGNMENT.description,
        maxScore: ASSIGNMENT.maxPoints,
        maxPoints: ASSIGNMENT.maxPoints,
        topic: 'Unit 2: Motion',
        activityUrl: ASSIGNMENT.activityUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        classroomDeployments: [
          {
            period: COURSE_PERIOD_0.period,
            courseId: COURSE_PERIOD_0.courseId,
            courseName: COURSE_PERIOD_0.name,
            courseworkId: cwId,
            alternateLink: altLink,
            topicId: COURSE_PERIOD_0.topicId,
            success: true
          }
        ]
      }, { merge: true });
      console.log(`💾 Saved assignment tracking to Firestore collection "gradest_assignments/${docName}"`);
    } catch (dbErr) {
      console.warn('⚠️ Could not save to Firestore gradest_assignments:', dbErr.message);
    }
  }

  console.log('\n====================================================');
  console.log('🎉 Period 0 Honors Physics assignment successfully posted!');
  console.log(`🔗 URL: ${altLink}`);
  console.log('====================================================');
}

postHonorsAssignment().catch(err => {
  console.error('❌ Deployment error:', err);
  process.exit(1);
});
