#!/usr/bin/env node
/**
 * Post Assignment "9/28" to Google Classroom across all 7 periods
 * and link metadata to Firestore assignment_registry and gradest_assignments.
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
} catch (error) {
  console.error('Firebase Admin Error:', error.message);
}

// 2. Google Classroom Client
function getCredentials() {
  try {
    const files = fs.readdirSync(__dirname);
    const secretFile = files.find(f => f.startsWith('client_secret_') && f.endsWith('.json'));
    if (secretFile) {
      const raw = fs.readFileSync(path.join(__dirname, secretFile), 'utf8');
      const data = JSON.parse(raw);
      const creds = data.web || data.installed;
      if (creds) {
        return { clientId: creds.client_id, clientSecret: creds.client_secret };
      }
    }
  } catch (e) {}
  return { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET };
}

function getClassroomClient() {
  const { clientId, clientSecret } = getCredentials();
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google Classroom OAuth credentials. Run `npm run auth`.');
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

const TITLE = '9/28';
const MAX_POINTS = 20;
const DESCRIPTION = `Reaction Time Lab results and analysis
Annotated Reading: Unit 2 Newton's First Law of motion & Inertia

Handout PDF: https://rrmudry.github.io/Unit_2/worksheets/P031_Reaction_Time_2026.pdf`;
const ACTIVITY_URL = 'https://rrmudry.github.io/Unit_2/worksheets/P031_Reaction_Time_2026.pdf';
const DUE_DATE = { year: 2026, month: 9, day: 29 };
const DUE_TIME = { hours: 1, minutes: 0 };

async function deploy() {
  const classroom = getClassroomClient();
  const courseworkMap = {};
  const deployments = [];

  console.log('='.repeat(72));
  console.log(`  🚀 DEPLOYING "${TITLE}" (Max Points: ${MAX_POINTS})`);
  console.log('='.repeat(72));
  console.log(`  Target URL: ${ACTIVITY_URL}\n`);

  for (const c of COURSES) {
    console.log(`⏳ [Period ${c.period}] ${c.name}...`);

    // Check if coursework already exists with this title
    let existingCw = null;
    try {
      const listRes = await classroom.courses.courseWork.list({
        courseId: c.courseId,
        pageSize: 100
      });
      existingCw = (listRes.data.courseWork || []).find(cw => cw.title && cw.title.trim().toLowerCase() === TITLE.toLowerCase());
      if (existingCw) {
        console.log(`   ✓ Coursework already exists! (ID: ${existingCw.id})`);
        courseworkMap[c.courseId] = existingCw.id;
        deployments.push({
          period: c.period,
          courseId: c.courseId,
          courseName: c.name,
          courseworkId: existingCw.id,
          success: true,
          action: 'existed'
        });
        continue;
      }
    } catch (err) {
      console.warn(`   ⚠️ Error checking existing coursework: ${err.message}`);
    }

    // Create CourseWork
    try {
      const createRes = await classroom.courses.courseWork.create({
        courseId: c.courseId,
        requestBody: {
          title: TITLE,
          description: DESCRIPTION,
          workType: 'ASSIGNMENT',
          state: 'PUBLISHED',
          maxPoints: MAX_POINTS,
          topicId: c.topicId,
          materials: [
            {
              link: {
                url: ACTIVITY_URL,
                title: 'Reaction Time Lab Handout (PDF)'
              }
            }
          ]
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
        success: true,
        action: 'created'
      });
      console.log(`   ✅ Created coursework (CW ID: ${newCwId})`);
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

    await new Promise(r => setTimeout(r, 600));
  }

  // Update Firestore assignment_registry, gradest_assignments, and student_results
  if (db && Object.keys(courseworkMap).length > 0) {
    console.log('\n📝 Linking Firestore records...');

    // 1. Fetch existing grades from gradest_assignments/9%2F28
    let existingGrades = [];
    try {
      const gDoc = await db.collection('gradest_assignments').doc('9%2F28').get();
      if (gDoc.exists && Array.isArray(gDoc.data().grades)) {
        existingGrades = gDoc.data().grades;
        console.log(`📋 Found ${existingGrades.length} existing grades in gradest_assignments/9%2F28.`);
      }
    } catch (e) {
      console.warn('Could not read existing grades:', e.message);
    }

    // Prefetch roster for student periods
    const rosterMap = new Map();
    try {
      const rSnap = await db.collection('roster').get();
      rSnap.forEach(rDoc => {
        const d = rDoc.data();
        const sid = String(d.student_id || rDoc.id).trim();
        rosterMap.set(sid, {
          period: d.class_period !== undefined ? d.class_period : (d.period !== undefined ? d.period : null),
          name: d.student_name || d.name || null,
          email: d.email || `${sid}@orangeusd.org`
        });
      });
    } catch (e) {}

    // 2. assignment_registry (doc IDs: '9_28' and '9%2F28')
    const registryPayload = {
      assignmentId: '9/28',
      title: TITLE,
      points: MAX_POINTS,
      maxPoints: MAX_POINTS,
      maxScore: MAX_POINTS,
      topic: 'Unit 2: Motion',
      unit: 'Unit 2: Kinematics in 1D',
      activityUrl: ACTIVITY_URL,
      standards: ['HS-PS2-1', 'HS-PS2-2'],
      firestorePath: 'gradest_assignments',
      coursework: courseworkMap,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('assignment_registry').doc('9_28').set(registryPayload, { merge: true });
    await db.collection('assignment_registry').doc('9%2F28').set(registryPayload, { merge: true });
    console.log('   ✓ Saved to assignment_registry (9_28 & 9%2F28)');

    // 3. gradest_assignments metadata (preserves existing grades array!)
    const gradestPayload = {
      assignmentName: TITLE,
      title: TITLE,
      assignmentDetails: DESCRIPTION,
      description: DESCRIPTION,
      maxScore: MAX_POINTS,
      maxPoints: MAX_POINTS,
      topic: 'Unit 2: Motion',
      activityUrl: ACTIVITY_URL,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      classroomDeployments: deployments.filter(d => d.success),
      classroomCourseworkIds: courseworkMap,
      coursework: courseworkMap,
      registryId: '9_28'
    };

    await db.collection('gradest_assignments').doc('9%2F28').set(gradestPayload, { merge: true });
    await db.collection('gradest_assignments').doc('9_28').set(gradestPayload, { merge: true });
    console.log('   ✓ Saved to gradest_assignments (9%2F28 & 9_28)');

    // 4. student_results parent doc & subcollection for full dual-system redundancy
    const srDocKey = '9_28';
    await db.collection('student_results').doc(srDocKey).set({
      assignment_name: TITLE,
      title: TITLE,
      unit: 'Unit 2: Kinematics in 1D',
      standards: ['HS-PS2-1', 'HS-PS2-2'],
      maxScore: MAX_POINTS,
      maxPoints: MAX_POINTS,
      has_subcollection: true,
      total_submissions: existingGrades.length,
      registryId: '9_28',
      coursework: courseworkMap,
      activity_url: ACTIVITY_URL,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Backfill individual students to student_results/9_28/students subcollection
    let srCount = 0;
    const batchSize = 100;
    for (let i = 0; i < existingGrades.length; i += batchSize) {
      const batch = db.batch();
      const chunk = existingGrades.slice(i, i + batchSize);
      for (const g of chunk) {
        const sid = String(g.id).trim();
        const rInfo = rosterMap.get(sid) || {};
        const studentRef = db.collection('student_results').doc(srDocKey).collection('students').doc(sid);
        batch.set(studentRef, {
          student_id: sid,
          studentId: sid,
          student_name: g.name || rInfo.name || `Student ${sid}`,
          email: rInfo.email || `${sid}@orangeusd.org`,
          class_period: rInfo.period || null,
          score: g.score,
          percentage: g.percentage,
          maxScore: MAX_POINTS,
          status: g.status || 'Graded',
          timestamp: g.timestamp || admin.firestore.FieldValue.serverTimestamp(),
          syncedFrom: 'gradest_assignments/9%2F28'
        }, { merge: true });
        srCount++;
      }
      await batch.commit();
    }
    console.log(`   ✓ Wrote ${srCount} student records to student_results/${srDocKey}/students`);
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
