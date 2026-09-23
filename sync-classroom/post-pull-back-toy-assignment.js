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
  id: 'unit2_day18_pull_back_toy_lab',
  title: 'Pull-Back Toy Motion Lab',
  description: 'Complete the Graphing Pull-Back Toy Motion Lab. Record video and time data as the pull-back car accelerates from rest across 1.0 meter (20 cm, 40 cm, 60 cm, 80 cm, 100 cm). Plot the distance vs. time graph and calculate average speed, final speed, and uniform acceleration.\n\nActivity Link: https://rrmudry.github.io/Unit_2/pull_back_toy_lab/index.html',
  maxPoints: 10,
  dueDate: { year: 2026, month: 9, day: 24 }, // Sep 23 6:00 PM PDT is Sep 24 01:00 UTC
  dueTime: { hours: 1, minutes: 0 },
  activityUrl: 'https://rrmudry.github.io/Unit_2/pull_back_toy_lab/index.html'
};

const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

async function postAssignments() {
  console.log('====================================================');
  console.log(`🚀 ${isDryRun ? '[DRY-RUN] ' : ''}Deploying Assignment: "${ASSIGNMENT.title}"`);
  console.log(`📊 Points: ${ASSIGNMENT.maxPoints} pts | Due: Wednesday (9/23) at 6:00 PM PDT`);
  console.log(`🔗 Link: ${ASSIGNMENT.activityUrl}`);
  console.log('====================================================\n');

  const classroom = getClassroomClient();
  const deployments = [];
  const courseworkMap = {};

  for (const p of PERIODS) {
    console.log(`⏳ [Period ${p.period}] Checking "${p.name}" (Course: ${p.courseId})...`);
    try {
      // Check existing coursework to prevent duplicates
      const listRes = await classroom.courses.courseWork.list({
        courseId: p.courseId,
        pageSize: 30
      });
      const existing = (listRes.data.courseWork || []).find(cw => 
        cw.title && cw.title.trim().toLowerCase() === ASSIGNMENT.title.toLowerCase()
      );

      if (existing) {
        console.log(`   ✓ Coursework already exists! (ID: ${existing.id})`);
        deployments.push({
          period: p.period,
          courseId: p.courseId,
          courseName: p.name,
          courseWorkId: existing.id,
          success: true,
          action: 'existed'
        });
        courseworkMap[p.courseId] = existing.id;
        continue;
      }

      if (isDryRun) {
        console.log(`   [DRY-RUN] Would create coursework: "${ASSIGNMENT.title}" (10 pts) in topic ${p.topicId}`);
        deployments.push({
          period: p.period,
          courseId: p.courseId,
          courseName: p.name,
          courseWorkId: 'mock-cw-id',
          success: true,
          action: 'dry-run'
        });
        courseworkMap[p.courseId] = 'mock-cw-id';
        continue;
      }

      // Create CourseWork
      const createRes = await classroom.courses.courseWork.create({
        courseId: p.courseId,
        requestBody: {
          title: ASSIGNMENT.title,
          description: ASSIGNMENT.description,
          workType: 'ASSIGNMENT',
          state: 'PUBLISHED',
          maxPoints: ASSIGNMENT.maxPoints,
          topicId: p.topicId,
          dueDate: ASSIGNMENT.dueDate,
          dueTime: ASSIGNMENT.dueTime,
          materials: [
            {
              link: {
                url: ASSIGNMENT.activityUrl,
                title: 'Graphing Pull-Back Toy Motion Lab Companion'
              }
            }
          ]
        }
      });

      console.log(`   ✅ Created successfully! CourseWork ID: ${createRes.data.id}`);
      deployments.push({
        period: p.period,
        courseId: p.courseId,
        courseName: p.name,
        courseWorkId: createRes.data.id,
        success: true,
        action: 'created'
      });
      courseworkMap[p.courseId] = createRes.data.id;

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

    await new Promise(r => setTimeout(r, 600));
  }

  // Save to Firestore assignment_registry and gradest_assignments
  if (db && !isDryRun) {
    try {
      // 1. assignment_registry (for headless sync-cli.js)
      await db.collection('assignment_registry').doc(ASSIGNMENT.id).set({
        assignmentId: ASSIGNMENT.id,
        title: ASSIGNMENT.title,
        points: ASSIGNMENT.maxPoints,
        topic: 'Unit 2: Motion',
        activityUrl: ASSIGNMENT.activityUrl,
        firestorePath: 'student_results',
        coursework: courseworkMap,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log(`💾 Saved to Firestore "assignment_registry/${ASSIGNMENT.id}"`);

      // 2. gradest_assignments (legacy compatibility)
      const docNames = [
        ASSIGNMENT.title.trim(),
        'Pull-Back Toy Motion Lab',
        ASSIGNMENT.id
      ];

      for (const docName of docNames) {
        await db.collection('gradest_assignments').doc(docName).set({
          assignmentName: ASSIGNMENT.title,
          title: ASSIGNMENT.title,
          description: ASSIGNMENT.description,
          maxScore: ASSIGNMENT.maxPoints,
          maxPoints: ASSIGNMENT.maxPoints,
          topic: 'Unit 2: Motion',
          activityUrl: ASSIGNMENT.activityUrl,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          classroomDeployments: deployments.filter(d => d.success)
        }, { merge: true });
        console.log(`💾 Saved metadata to Firestore "gradest_assignments/${docName}"`);
      }
    } catch (dbErr) {
      console.warn('⚠️ Could not save to Firestore registry:', dbErr.message);
    }
  }

  console.log('\n====================================================');
  console.log(`🎉 Deployment finished! ${deployments.filter(d => d.success).length}/${PERIODS.length} periods active.`);
  console.log('====================================================');
}

postAssignments().catch(err => {
  console.error('Fatal deployment error:', err);
  process.exit(1);
});
