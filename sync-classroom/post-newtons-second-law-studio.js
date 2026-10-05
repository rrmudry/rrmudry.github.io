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
  const files = fs.readdirSync(__dirname);
  const secretFile = files.find(f => f.startsWith('client_secret_') && f.endsWith('.json'));
  if (secretFile) {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, secretFile), 'utf8'));
    const credentials = data.web || data.installed;
    if (credentials) {
      return {
        clientId: credentials.client_id,
        clientSecret: credentials.client_secret
      };
    }
  }
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

const COURSES = [
  { period: 0, courseId: '875053343151', name: 'Period 0 - Physics H - 26/27', topicId: '877400159312' },
  { period: 1, courseId: '875053274185', name: 'Period 1 - Concept Phys - 26/27', topicId: '877404382173' },
  { period: 2, courseId: '819978306673', name: 'Period 2 - Concept Phys - 26/27', topicId: '869422033444' },
  { period: 3, courseId: '875053206741', name: 'Period 3 - Concept Phys - 26/27', topicId: '877401996863' },
  { period: 4, courseId: '875053292931', name: 'Period 4 - Physics - 26/27', topicId: '869421931323' },
  { period: 5, courseId: '819978427488', name: 'Period 5 - Physics - 26/27', topicId: '869421894720' },
  { period: 6, courseId: '875047683865', name: 'Period 6 - Physics - 26/27', topicId: '877404146356' }
];

const ASSIGNMENT_ID = 'unit2_day27_newtons_second_law_studio';
const TITLE = "Newton's 2nd Law Studio";
const ACTIVITY_URL = 'https://rrmudry.github.io/Unit_2/newtons_second_law_studio/index.html';
const DESCRIPTION = `Investigate Newton's 2nd Law of Motion (a = F_net / M_total) using an interactive dual-pulley horizontal Atwood machine.

1. Step 1 (Equilibrium & Balanced Forces): Discover that balanced forces (F_net = 0) mean zero acceleration (inertia in motion).
2. Step 2 (Isolate Force): Keep total system mass locked at 500 g while transferring mass tokens to prove acceleration is directly proportional to net force (a ∝ F_net).
3. Step 3 (Isolate Mass): Keep net force locked at 0.50 N while loading extra cargo to prove acceleration is inversely proportional to total mass (a ∝ 1/M_total).
4. Mastery Arena: Complete all 5 randomized challenge tiers to earn your mastery certificate and 4 arena points.
5. Period 0 Honors: Complete the required Honors sections on signed net forces, negative accelerations, and hidden mass calculation. (Optional for Periods 1–6).

Make sure to sign in with your @orangeusd.org Google account so your 10 points save automatically.

Activity Link: ${ACTIVITY_URL}`;

// Due Oct 6, 6:00 PM PDT = Oct 7, 01:00 UTC
const DUE_DATE = { year: 2026, month: 10, day: 7 };
const DUE_TIME = { hours: 1, minutes: 0 };
const MAX_POINTS = 10;

async function deploy() {
  const classroom = getClassroomClient();
  const courseworkMap = {};
  const deployments = [];

  console.log('='.repeat(72));
  console.log(`  🚀 DEPLOYING ${TITLE.toUpperCase()}`);
  console.log('='.repeat(72));
  console.log(`  Target URL: ${ACTIVITY_URL}`);
  console.log(`  Due Date:   October 6, 2026 at 6:00 PM PDT\n`);

  for (const c of COURSES) {
    console.log(`⏳ [Period ${c.period}] ${c.name}...`);

    // 1. Find and delete any existing coursework with this title in this course
    try {
      const listRes = await classroom.courses.courseWork.list({
        courseId: c.courseId,
        pageSize: 50
      });
      const existing = (listRes.data.courseWork || []).filter(cw => cw.title === TITLE);
      for (const cw of existing) {
        console.log(`   🗑️  Deleting existing coursework ${cw.id}...`);
        await classroom.courses.courseWork.delete({ courseId: c.courseId, id: cw.id });
      }
    } catch (delErr) {
      console.warn(`   ⚠️  Error checking/deleting old coursework: ${delErr.message}`);
    }

    // 2. Create fresh coursework with verified live URL
    try {
      const createRes = await classroom.courses.courseWork.create({
        courseId: c.courseId,
        requestBody: {
          title: TITLE,
          description: DESCRIPTION,
          workType: 'ASSIGNMENT',
          state: 'PUBLISHED',
          maxPoints: MAX_POINTS,
          dueDate: DUE_DATE,
          dueTime: DUE_TIME,
          topicId: c.topicId,
          materials: [{ link: { url: ACTIVITY_URL } }]
        }
      });

      const newCwId = createRes.data.id;
      courseworkMap[c.courseId] = newCwId;
      deployments.push({
        period: c.period,
        courseId: c.courseId,
        courseName: c.name,
        courseworkId: newCwId,
        alternateLink: createRes.data.alternateLink,
        topicId: c.topicId,
        success: true
      });
      console.log(`   ✅ Created coursework (CW ID: ${newCwId})`);

      // Verify material title
      const mat = (createRes.data.materials || [])[0]?.link;
      console.log(`   📎 Attached Link Title: "${mat?.title || '(unfurling...)'}"`);
    } catch (createErr) {
      console.error(`   ❌ Failed to create coursework: ${createErr.message}`);
      deployments.push({
        period: c.period,
        courseId: c.courseId,
        courseName: c.name,
        success: false,
        error: createErr.message
      });
    }

    // Pacing delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 600));
  }

  // 3. Update Firestore assignment_registry and parent docs
  if (db && Object.keys(courseworkMap).length > 0) {
    console.log('\n📝 Updating assignment_registry...');
    await db.collection('assignment_registry').doc(ASSIGNMENT_ID).set({
      assignmentId: ASSIGNMENT_ID,
      title: TITLE,
      description: DESCRIPTION,
      maxPoints: MAX_POINTS,
      firestorePath: 'student_results',
      coursework: courseworkMap,
      activityUrl: ACTIVITY_URL,
      unit: "Unit 2: Dynamics & Newton's Laws",
      standards: ['HS-PS2-1', 'HS-ETS1-2'],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('📝 Updating student_results parent document...');
    await db.collection('student_results').doc(ASSIGNMENT_ID).set({
      assignment_name: TITLE,
      max_points: MAX_POINTS,
      coursework: courseworkMap,
      activity_url: ACTIVITY_URL,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('📝 Updating gradest_assignments redundancy documents...');
    const docNames = [
      TITLE.trim(),
      ASSIGNMENT_ID
    ];
    for (const docName of docNames) {
      await db.collection('gradest_assignments').doc(docName).set({
        assignmentName: TITLE,
        title: TITLE,
        assignmentDetails: DESCRIPTION,
        description: DESCRIPTION,
        maxScore: MAX_POINTS,
        maxPoints: MAX_POINTS,
        topic: 'Unit 2: Motion',
        activityUrl: ACTIVITY_URL,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        classroomDeployments: deployments.filter(d => d.success)
      }, { merge: true });
    }

    console.log('   ✅ Firestore registry, student_results, & gradest_assignments updated.');
  }

  console.log('\n' + '='.repeat(72));
  console.log('  🎉 DEPLOYMENT COMPLETE');
  console.log('='.repeat(72));
  COURSES.forEach(c => {
    console.log(`  Period ${c.period}: CW ID ${courseworkMap[c.courseId] || 'FAILED'}`);
  });
  console.log('='.repeat(72) + '\n');
}

deploy().catch(console.error);
