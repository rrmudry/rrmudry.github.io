const { google } = require('googleapis');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// 1. Firebase Admin Init
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
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google Classroom OAuth credentials.');
  }
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.classroom({ version: 'v1', auth: oauth2Client });
}

// Target courses and their Unit 2: Motion topic IDs
const PERIODS = [
  { period: 0, courseId: '875053343151', name: 'Period 0 - Physics H - 26/27', topicId: '877400159312' },
  { period: 1, courseId: '875053274185', name: 'Period 1 - Concept Phys - 26/27', topicId: '877404382173' },
  { period: 2, courseId: '819978306673', name: 'Period 2 - Concept Phys - 26/27', topicId: '869422033444' },
  { period: 3, courseId: '875053206741', name: 'Period 3 - Concept Phys - 26/27', topicId: '877401996863' },
  { period: 4, courseId: '875053292931', name: 'Period 4 - Physics - 26/27', topicId: '869421931323' },
  { period: 5, courseId: '819978427488', name: 'Period 5 - Physics - 26/27', topicId: '869421894720' },
  { period: 6, courseId: '875047683865', name: 'Period 6 - Physics - 26/27', topicId: '877404146356' }
];

const ASSIGNMENT = {
  title: 'Acceleration Studio Practice',
  description: 'Complete the Acceleration Rate & Sign Studio practice to master uniform 1D acceleration, vector signs (positive and negative acceleration), interpreting (m/s)/s, signed velocity changes (Δv = v - v₀), elapsed time (Δt), and directional reversals across all challenge tiers.\n\nActivity Link: https://rrmudry.github.io/Unit_2/acceleration_studio/index.html',
  maxPoints: 10,
  dueDate: { year: 2026, month: 9, day: 22 }, // Sep 21 6:00 PM PDT is Sep 22 01:00 UTC
  dueTime: { hours: 1, minutes: 0 },
  activityUrl: 'https://rrmudry.github.io/Unit_2/acceleration_studio/index.html'
};

async function postAssignments() {
  console.log('====================================================');
  console.log(`🚀 Posting Assignment: "${ASSIGNMENT.title}"`);
  console.log(`📊 Points: ${ASSIGNMENT.maxPoints} pts | Due: Today (9/21) at 6:00 PM PDT`);
  console.log(`🔗 Link: ${ASSIGNMENT.activityUrl}`);
  console.log('====================================================\n');

  const classroom = getClassroomClient();
  const deployments = [];

  for (const p of PERIODS) {
    console.log(`⏳ [Period ${p.period}] Creating in "${p.name}" (Course: ${p.courseId})...`);
    try {
      // 1. Create CourseWork
      const createRes = await classroom.courses.courseWork.create({
        courseId: p.courseId,
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
                url: ASSIGNMENT.activityUrl
              }
            }
          ]
        }
      });

      const cwId = createRes.data.id;
      const altLink = createRes.data.alternateLink;
      console.log(`   ✓ CourseWork created (ID: ${cwId})`);

      // 2. Patch Topic to "Unit 2: Motion"
      if (p.topicId) {
        try {
          await classroom.courses.courseWork.patch({
            courseId: p.courseId,
            id: cwId,
            updateMask: 'topicId',
            requestBody: {
              topicId: p.topicId
            }
          });
          console.log(`   ✓ Topic "Unit 2: Motion" assigned (Topic ID: ${p.topicId})`);
        } catch (topicErr) {
          console.warn(`   ⚠️ Warning: Could not patch topic for Period ${p.period}:`, topicErr.message);
        }
      }

      deployments.push({
        period: p.period,
        courseId: p.courseId,
        courseName: p.name,
        courseworkId: cwId,
        alternateLink: altLink,
        topicId: p.topicId,
        success: true
      });

      console.log(`   🌟 Period ${p.period} successfully published!\n`);
    } catch (err) {
      console.error(`   ❌ Failed to create in Period ${p.period}:`, err.message);
      deployments.push({
        period: p.period,
        courseId: p.courseId,
        courseName: p.name,
        success: false,
        error: err.message
      });
    }

    // Pacing delay between Classroom calls to prevent concurrency locks
    await new Promise(r => setTimeout(r, 600));
  }

  // Save to Firestore gradest_assignments for grade sync tracking
  if (db) {
    try {
      const docNames = [
        ASSIGNMENT.title.trim(),
        'Acceleration Studio Practice',
        'unit2_day16_acceleration_studio'
      ];

      for (const docName of docNames) {
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
          classroomDeployments: deployments.filter(d => d.success)
        }, { merge: true });
        console.log(`💾 Saved deployment metadata to Firestore collection "gradest_assignments/${docName}"`);
      }
    } catch (dbErr) {
      console.warn('⚠️ Could not save to Firestore gradest_assignments:', dbErr.message);
    }
  }

  console.log('\n====================================================');
  console.log(`🎉 Finished! Successfully deployed to ${deployments.filter(d => d.success).length}/${PERIODS.length} periods.`);
  console.log('====================================================');
}

postAssignments().catch(err => {
  console.error('Fatal error during deployment:', err);
  process.exit(1);
});
