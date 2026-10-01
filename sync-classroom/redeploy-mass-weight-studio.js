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

const ASSIGNMENT_ID = 'unit2_day24_mass_weight_studio';
const TITLE = 'Mass, Weight & Zero-G Inertia Studio';
const ACTIVITY_URL = 'https://rrmudry.github.io/Unit_2/mass_weight_studio/?v=24';
const DESCRIPTION = `Isolate mass as the quantitative measure of inertia (Newton's First Law) and fundamentally distinguish it from gravitational weight and geometric volume.

1. Complete measurements in the Evidence Log across all 3 stations (Volume Chamber, Planetary Scale, and Zero-G Inertia Chamber).
2. Complete the 5 Deep Space Mythbusters questions.
3. Make sure you are signed in with your @orangeusd.org account so your 10 points save automatically.

Activity Link: ${ACTIVITY_URL}`;

// Due Oct 1, 6:00 PM PDT = Oct 2, 01:00 UTC
const DUE_DATE = { year: 2026, month: 10, day: 2 };
const DUE_TIME = { hours: 1, minutes: 0 };
const MAX_POINTS = 10;

async function redeploy() {
  const classroom = getClassroomClient();
  const courseworkMap = {};

  console.log('='.repeat(72));
  console.log('  🔄 REDEPLOYING MASS, WEIGHT & ZERO-G INERTIA STUDIO');
  console.log('='.repeat(72));
  console.log(`  Target URL: ${ACTIVITY_URL}`);
  console.log(`  Due Date:   October 1, 2026 at 6:00 PM PDT\n`);

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
        console.log(`   🗑️  Deleting stale coursework ${cw.id}...`);
        await classroom.courses.courseWork.delete({ courseId: c.courseId, id: cw.id });
      }
    } catch (delErr) {
      console.warn(`   ⚠️  Error checking/deleting old coursework: ${delErr.message}`);
    }

    // 2. Create fresh coursework with live cache-busted URL
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
      console.log(`   ✅ Created fresh coursework (CW ID: ${newCwId})`);

      // Verify material title
      const mat = (createRes.data.materials || [])[0]?.link;
      console.log(`   📎 Attached Link Title: "${mat?.title || '(unfurling...)'}"`);
    } catch (createErr) {
      console.error(`   ❌ Failed to create coursework: ${createErr.message}`);
    }

    // Pacing delay
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
      unit: 'Unit 2: Dynamics & Newton\'s First Law',
      standards: ['HS-PS2-1'],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await db.collection('student_results').doc(ASSIGNMENT_ID).set({
      assignment_name: TITLE,
      max_points: MAX_POINTS,
      coursework: courseworkMap,
      activity_url: ACTIVITY_URL,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('   ✅ Firestore registry & student_results parent doc updated.');
  }

  console.log('\n' + '='.repeat(72));
  console.log('  🎉 REDEPLOYMENT COMPLETE');
  console.log('='.repeat(72));
  COURSES.forEach(c => {
    console.log(`  Period ${c.period}: CW ID ${courseworkMap[c.courseId] || 'FAILED'}`);
  });
  console.log('='.repeat(72) + '\n');
}

redeploy().catch(console.error);
