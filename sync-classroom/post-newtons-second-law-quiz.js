#!/usr/bin/env node
/**
 * Deployment script for "Newton's 2nd Law Quiz"
 * 
 * Creates Google Classroom coursework titled "Newton's 2nd Law Quiz" across all 7 periods:
 * - Periods 0, 4, 5, 6: Max Points = 20 (Newton's 2nd Law Quiz results)
 * - Periods 1, 2, 3:    Max Points = 12 (CP Newton's 2nd Law Quiz results)
 * 
 * Registers the coursework in:
 * 1. Firestore `assignment_registry`:
 *    - `newtons_second_law_quiz` (Periods 0, 4, 5, 6)
 *    - `cp_newtons_second_law_quiz` (Periods 1, 2, 3)
 *    - `Newton's 2nd Law Quiz` (Master 7-period mapping)
 * 2. Firestore `student_results` parent docs
 * 3. Firestore `gradest_assignments` docs
 */

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
  { period: 0, courseId: '875053343151', name: 'Period 0 - Physics H - 26/27', topicId: '877400159312', maxPoints: 20, isCP: false },
  { period: 1, courseId: '875053274185', name: 'Period 1 - Concept Phys - 26/27', topicId: '877404382173', maxPoints: 12, isCP: true },
  { period: 2, courseId: '819978306673', name: 'Period 2 - Concept Phys - 26/27', topicId: '869422033444', maxPoints: 12, isCP: true },
  { period: 3, courseId: '875053206741', name: 'Period 3 - Concept Phys - 26/27', topicId: '877401996863', maxPoints: 12, isCP: true },
  { period: 4, courseId: '875053292931', name: 'Period 4 - Physics - 26/27', topicId: '869421931323', maxPoints: 20, isCP: false },
  { period: 5, courseId: '819978427488', name: 'Period 5 - Physics - 26/27', topicId: '869421894720', maxPoints: 20, isCP: false },
  { period: 6, courseId: '875047683865', name: 'Period 6 - Physics - 26/27', topicId: '877404146356', maxPoints: 20, isCP: false }
];

const TITLE = "Newton's 2nd Law Quiz";
const ACTIVITY_URL = 'https://rrmudry.github.io/student_dashboard.html';

function getDescription(isCP, maxPoints) {
  const qCount = isCP ? 12 : 20;
  const courseLabel = isCP ? 'Conceptual Physics' : 'Physics';
  return `${courseLabel} Newton's 2nd Law Quiz (${qCount} questions, ${maxPoints} points possible) via THE_PROCTOR.

1. Sign in with your @orangeusd.org student account.
2. Follow all academic integrity requirements (webcam verification, focus tracking).
3. Complete all ${qCount} questions and click Submit to log your score.

Student Dashboard: ${ACTIVITY_URL}`;
}

async function deploy() {
  const classroom = getClassroomClient();
  const allCourseworkMap = {};
  const standardCourseworkMap = {};
  const cpCourseworkMap = {};
  const deployments = [];

  console.log('='.repeat(72));
  console.log(`  🚀 DEPLOYING "${TITLE.toUpperCase()}" ACROSS ALL PERIODS`);
  console.log('='.repeat(72));
  console.log(`  Periods 0, 4, 5, 6: 20 points possible (newtons_second_law_quiz)`);
  console.log(`  Periods 1, 2, 3:    12 points possible (cp_newtons_second_law_quiz)`);
  console.log(`  Target URL:         ${ACTIVITY_URL}\n`);

  for (const c of COURSES) {
    console.log(`⏳ [Period ${c.period}] ${c.name} (${c.maxPoints} pts)...`);

    // 1. Delete any existing coursework with exact same title in this course
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

    // 2. Create fresh coursework
    try {
      const desc = getDescription(c.isCP, c.maxPoints);
      const createRes = await classroom.courses.courseWork.create({
        courseId: c.courseId,
        requestBody: {
          title: TITLE,
          description: desc,
          workType: 'ASSIGNMENT',
          state: 'PUBLISHED',
          maxPoints: c.maxPoints,
          topicId: c.topicId,
          materials: [{ link: { url: ACTIVITY_URL } }]
        }
      });

      const newCwId = createRes.data.id;
      allCourseworkMap[c.courseId] = newCwId;
      if (c.isCP) {
        cpCourseworkMap[c.courseId] = newCwId;
      } else {
        standardCourseworkMap[c.courseId] = newCwId;
      }

      deployments.push({
        period: c.period,
        courseId: c.courseId,
        courseName: c.name,
        courseworkId: newCwId,
        maxPoints: c.maxPoints,
        isCP: c.isCP,
        alternateLink: createRes.data.alternateLink,
        topicId: c.topicId,
        success: true
      });
      console.log(`   ✅ Created coursework (CW ID: ${newCwId}, Max Points: ${c.maxPoints})`);
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

  // 3. Update Firestore assignment_registry, student_results, & gradest_assignments
  if (db && Object.keys(allCourseworkMap).length > 0) {
    console.log('\n📝 Updating assignment_registry for "newtons_second_law_quiz"...');
    await db.collection('assignment_registry').doc('newtons_second_law_quiz').set({
      assignmentId: 'newtons_second_law_quiz',
      title: TITLE,
      description: getDescription(false, 20),
      maxPoints: 20,
      firestorePath: 'student_results',
      coursework: standardCourseworkMap,
      activityUrl: ACTIVITY_URL,
      unit: "Unit 2: Dynamics & Newton's Laws",
      standards: ['HS-PS2-1'],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('📝 Updating assignment_registry for "cp_newtons_second_law_quiz"...');
    await db.collection('assignment_registry').doc('cp_newtons_second_law_quiz').set({
      assignmentId: 'cp_newtons_second_law_quiz',
      title: TITLE,
      description: getDescription(true, 12),
      maxPoints: 12,
      firestorePath: 'student_results',
      coursework: cpCourseworkMap,
      activityUrl: ACTIVITY_URL,
      unit: "Unit 2: Dynamics & Newton's Laws",
      standards: ['HS-PS2-1'],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('📝 Updating assignment_registry for "Newton\'s 2nd Law Quiz" (Master)...');
    await db.collection('assignment_registry').doc(TITLE).set({
      assignmentId: TITLE,
      title: TITLE,
      description: getDescription(false, 20),
      maxPoints: 20,
      firestorePath: 'student_results',
      coursework: allCourseworkMap,
      activityUrl: ACTIVITY_URL,
      unit: "Unit 2: Dynamics & Newton's Laws",
      standards: ['HS-PS2-1'],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('📝 Updating student_results parent documents...');
    await db.collection('student_results').doc('newtons_second_law_quiz').set({
      assignment_name: TITLE,
      max_points: 20,
      coursework: standardCourseworkMap,
      activity_url: ACTIVITY_URL,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await db.collection('student_results').doc('cp_newtons_second_law_quiz').set({
      assignment_name: TITLE,
      max_points: 12,
      coursework: cpCourseworkMap,
      activity_url: ACTIVITY_URL,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('📝 Updating gradest_assignments redundancy documents...');
    const gradestEntries = [
      { docId: 'newtons_second_law_quiz', maxPts: 20, isCP: false, cws: standardCourseworkMap },
      { docId: 'cp_newtons_second_law_quiz', maxPts: 12, isCP: true, cws: cpCourseworkMap },
      { docId: TITLE, maxPts: 20, isCP: false, cws: allCourseworkMap }
    ];

    for (const entry of gradestEntries) {
      await db.collection('gradest_assignments').doc(entry.docId).set({
        assignmentName: TITLE,
        title: TITLE,
        assignmentDetails: getDescription(entry.isCP, entry.maxPts),
        description: getDescription(entry.isCP, entry.maxPts),
        maxScore: entry.maxPts,
        maxPoints: entry.maxPts,
        topic: 'Unit 2: Motion',
        activityUrl: ACTIVITY_URL,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        classroomDeployments: deployments.filter(d => d.success && (entry.docId === TITLE || (entry.isCP ? d.isCP : !d.isCP)))
      }, { merge: true });
    }

    console.log('   ✅ Firestore registry, student_results, & gradest_assignments updated successfully.');
  }

  console.log('\n' + '='.repeat(72));
  console.log('  🎉 DEPLOYMENT COMPLETE');
  console.log('='.repeat(72));
  COURSES.forEach(c => {
    console.log(`  Period ${c.period}: CW ID ${allCourseworkMap[c.courseId] || 'FAILED'} (${c.maxPoints} pts)`);
  });
  console.log('='.repeat(72) + '\n');
}

deploy().catch(console.error);
