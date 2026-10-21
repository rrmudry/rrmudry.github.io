#!/usr/bin/env node
/**
 * Redeploy Word Search Quest Assignment across all 7 periods
 * Fixes:
 *  1. Link showing "Page not found · GitHub Pages" due to initial creation before site build finished
 *  2. Missing Due Date (adds Due Date: October 21, 2026, 11:59 PM PDT)
 *  3. Explicit link title and index.html URL
 *  4. Updates assignment_registry and Firestore metadata
 */

const { google } = require('googleapis');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// 1. Firebase Admin Init
const serviceAccountPath = path.join(__dirname, '..', 'site-6e500-firebase-adminsdk-fbsvc-407ccb8f99.json');
const serviceAccount = require(serviceAccountPath);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// 2. Google Classroom Client
function getCredentials() {
  const files = fs.readdirSync(__dirname);
  const secretFile = files.find(f => f.startsWith('client_secret_') && f.endsWith('.json'));
  const raw = fs.readFileSync(path.join(__dirname, secretFile), 'utf8');
  const data = JSON.parse(raw);
  const credentials = data.web || data.installed;
  return { clientId: credentials.client_id, clientSecret: credentials.client_secret };
}

function getClassroomClient() {
  const { clientId, clientSecret } = getCredentials();
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.classroom({ version: 'v1', auth: oauth2Client });
}

// 3. Courses & Topic configuration
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

const ASSIGNMENT_ID = 'unit2_day38_physics_word_search';
const TITLE = 'Unit 2 Physics Vocabulary & Concept Word Search Quest';
const DESCRIPTION = 'Substitute Activity for Wednesday, Oct 21: Log in with your school Google account, complete all 3 missions (Kinematics, Dynamics, and Aerospace), find all 30 physics terms using pointer/touch drag, and submit your score for 10 points in Google Classroom.';
const ACTIVITY_URL = 'https://rrmudry.github.io/Unit_2/physics_word_search/index.html';

// Due Oct 21, 11:59 PM PDT -> UTC Oct 22 06:59
const DUE_DATE = { year: 2026, month: 10, day: 22 };
const DUE_TIME = { hours: 6, minutes: 59 };

async function run() {
  console.log('='.repeat(72));
  console.log('🚀 Redeploying Word Search Assignment with Due Date & Clean Live URL');
  console.log('='.repeat(72));
  console.log(`Assignment ID: ${ASSIGNMENT_ID}`);
  console.log(`Title:         ${TITLE}`);
  console.log(`Activity URL:  ${ACTIVITY_URL}`);
  console.log(`Due Date:      Oct 21, 2026 (11:59 PM PDT)`);

  const classroom = getClassroomClient();
  const courseworkMap = {};
  const deployments = [];

  for (const course of COURSES) {
    console.log(`\nProcessing [Period ${course.period}] ${course.name}...`);

    try {
      // 1. Find and delete existing coursework for this assignment
      const listRes = await classroom.courses.courseWork.list({
        courseId: course.courseId,
        pageSize: 20
      });

      const existingCwList = (listRes.data.courseWork || []).filter(cw => 
        cw.title && cw.title.includes('Word Search')
      );

      for (const oldCw of existingCwList) {
        console.log(`  🗑️ Deleting previous coursework (ID: ${oldCw.id}, Title: "${oldCw.title}")...`);
        await classroom.courses.courseWork.delete({
          courseId: course.courseId,
          id: oldCw.id
        });
        console.log(`  ✓ Deleted ${oldCw.id}`);
      }

      // 2. Create fresh coursework
      console.log(`  ➕ Creating fresh coursework...`);
      const createRes = await classroom.courses.courseWork.create({
        courseId: course.courseId,
        requestBody: {
          title: TITLE,
          description: DESCRIPTION,
          workType: 'ASSIGNMENT',
          state: 'PUBLISHED',
          maxPoints: 10,
          dueDate: DUE_DATE,
          dueTime: DUE_TIME,
          materials: [
            {
              link: {
                url: ACTIVITY_URL,
                title: TITLE
              }
            }
          ]
        }
      });

      const newCwId = createRes.data.id;
      courseworkMap[course.courseId] = newCwId;
      console.log(`  ✓ Created new coursework ID: ${newCwId}`);

      // 3. Patch topic
      const topicId = KNOWN_TOPICS[course.courseId]?.['Unit 2: Motion'];
      if (topicId) {
        await classroom.courses.courseWork.patch({
          courseId: course.courseId,
          id: newCwId,
          updateMask: 'topicId',
          requestBody: { topicId }
        });
        console.log(`  ✓ Topic assigned: "Unit 2: Motion" (${topicId})`);
      }

      deployments.push({
        period: course.period,
        courseId: course.courseId,
        courseName: course.name,
        courseworkId: newCwId,
        alternateLink: createRes.data.alternateLink,
        success: true
      });

    } catch (err) {
      console.error(`  ❌ Failed for Period ${course.period}:`, err.message);
      deployments.push({
        period: course.period,
        courseId: course.courseId,
        courseName: course.name,
        success: false,
        error: err.message
      });
    }

    await new Promise(r => setTimeout(r, 600));
  }

  // 4. Update Firestore assignment_registry
  console.log('\n📝 Updating assignment_registry...');
  await db.collection('assignment_registry').doc(ASSIGNMENT_ID).set({
    assignmentId: ASSIGNMENT_ID,
    title: TITLE,
    description: DESCRIPTION,
    maxPoints: 10,
    firestorePath: 'student_results',
    coursework: courseworkMap,
    activityUrl: ACTIVITY_URL,
    unit: 'Unit 2: Motion',
    standards: ['HS-PS2-1', 'HS-PS2-2'],
    dueDate: '2026-10-21T23:59:00-07:00',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log('✓ Updated assignment_registry/' + ASSIGNMENT_ID);

  // 5. Backwards-compatible updates
  console.log('📝 Updating gradest_assignments & student_results...');
  const backcompatPayload = {
    assignmentName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    maxScore: 10,
    maxPoints: 10,
    topic: 'Unit 2: Motion',
    activityUrl: ACTIVITY_URL,
    dueDate: '2026-10-21T23:59:00-07:00',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    classroomDeployments: deployments.filter(d => d.success),
    registryId: ASSIGNMENT_ID
  };

  await db.collection('gradest_assignments').doc(ASSIGNMENT_ID).set(backcompatPayload, { merge: true });
  await db.collection('gradest_assignments').doc(TITLE.trim()).set(backcompatPayload, { merge: true });
  await db.collection('student_results').doc(ASSIGNMENT_ID).set({
    assignment_name: TITLE,
    unit: 'Unit 2: Motion',
    standards: ['HS-PS2-1', 'HS-PS2-2'],
    coursework: courseworkMap,
    registryId: ASSIGNMENT_ID,
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log('✓ Updated gradest_assignments and student_results');

  console.log('\n' + '='.repeat(72));
  console.log('🎉 WORD SEARCH REDEPLOYMENT COMPLETE');
  console.log('='.repeat(72));
}

run().catch(err => {
  console.error('Fatal error during redeployment:', err);
  process.exit(1);
});
