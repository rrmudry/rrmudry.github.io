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
  id: 'Graphing_Speed_Story',
  title: 'Graphing Speed Story',
  description: 'Invent an original character/vehicle journey across 3 distinct motion sections over 10.0 seconds (like the Dual-Graph Studio). Illustrate the scene, author your short story, calculate the velocities, and construct aligned Position-Time and Velocity-Time graphs on paper.\n\nWorksheet PDF: https://rrmudry.github.io/Unit_2/worksheets/Graphing_Speed_Story.pdf\nStudent Exemplar: https://rrmudry.github.io/assets/images/graphing_speed_story_exemplar.jpg',
  maxPoints: 10,
  dueDate: { year: 2026, month: 9, day: 19 }, // Friday Sep 18 6:00 PM PDT (Sep 19 01:00 UTC)
  dueTime: { hours: 1, minutes: 0 },
  activityUrl: 'https://rrmudry.github.io/Unit_2/worksheets/Graphing_Speed_Story.pdf',
  exemplarUrl: 'https://rrmudry.github.io/assets/images/graphing_speed_story_exemplar.jpg'
};

const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

async function postAssignments() {
  console.log('====================================================');
  console.log(`🚀 ${isDryRun ? '[DRY-RUN] ' : ''}Deploying Assignment: "${ASSIGNMENT.title}"`);
  console.log(`📊 Points: ${ASSIGNMENT.maxPoints} pts | Topic: Unit 2: Motion`);
  console.log(`🔗 Link: ${ASSIGNMENT.activityUrl}`);
  console.log(`🖼️ Exemplar: ${ASSIGNMENT.exemplarUrl}`);
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
        pageSize: 50
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
          materials: [
            {
              link: {
                url: ASSIGNMENT.activityUrl,
                title: 'Graphing Speed Story Worksheet (PDF)'
              }
            },
            {
              link: {
                url: ASSIGNMENT.exemplarUrl,
                title: 'Student Work Exemplar Guide (Leo Rodriguez)'
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

  // Save to Firestore assignment_registry, gradest_assignments, and student_results
  if (db && !isDryRun) {
    try {
      // 1. Fetch existing grades from gradest_assignments/Graphing Speed Story
      let existingGrades = [];
      try {
        const gDoc = await db.collection('gradest_assignments').doc('Graphing Speed Story').get();
        if (gDoc.exists && Array.isArray(gDoc.data().grades)) {
          existingGrades = gDoc.data().grades;
          console.log(`📋 Loaded ${existingGrades.length} existing student grades from gradest_assignments.`);
        }
      } catch (e) {
        console.warn('Could not read existing grades:', e.message);
      }

      // Prefetch roster map for student period resolution
      const rosterMap = new Map();
      try {
        const rSnap = await db.collection('roster').get();
        rSnap.forEach(rDoc => {
          const d = rDoc.data();
          const sid = String(d.student_id || rDoc.id).trim();
          rosterMap.set(sid, {
            period: d.class_period !== undefined ? d.class_period : (d.period !== undefined ? d.period : null),
            name: d.student_name || d.name || null
          });
        });
      } catch (e) {}

      // 2. assignment_registry (single source of truth for sync-cli.js)
      const registryPayload = {
        assignmentId: ASSIGNMENT.id,
        title: ASSIGNMENT.title,
        points: ASSIGNMENT.maxPoints,
        maxPoints: ASSIGNMENT.maxPoints,
        topic: 'Unit 2: Motion',
        unit: 'Unit 2: Kinematics in 1D',
        activityUrl: ASSIGNMENT.activityUrl,
        standards: ['HS-PS2-1'],
        firestorePath: 'gradest_assignments',
        coursework: courseworkMap,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('assignment_registry').doc(ASSIGNMENT.id).set(registryPayload, { merge: true });
      await db.collection('assignment_registry').doc('Graphing Speed Story').set(registryPayload, { merge: true });
      console.log(`💾 Saved to Firestore "assignment_registry/${ASSIGNMENT.id}"`);

      // 3. gradest_assignments metadata update (preserves existing grades array!)
      const gradestPayload = {
        assignmentName: ASSIGNMENT.title,
        title: ASSIGNMENT.title,
        description: ASSIGNMENT.description,
        maxScore: ASSIGNMENT.maxPoints,
        maxPoints: ASSIGNMENT.maxPoints,
        topic: 'Unit 2: Motion',
        activityUrl: ASSIGNMENT.activityUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        classroomDeployments: deployments.filter(d => d.success),
        coursework: courseworkMap,
        registryId: ASSIGNMENT.id
      };

      await db.collection('gradest_assignments').doc('Graphing Speed Story').set(gradestPayload, { merge: true });
      await db.collection('gradest_assignments').doc(ASSIGNMENT.id).set(gradestPayload, { merge: true });
      console.log(`💾 Saved metadata to Firestore "gradest_assignments/Graphing Speed Story"`);

      // 4. student_results parent doc & subcollection for full dual-system redundancy
      const srDocKey = 'Graphing_Speed_Story';
      await db.collection('student_results').doc(srDocKey).set({
        assignment_name: ASSIGNMENT.title,
        title: ASSIGNMENT.title,
        unit: 'Unit 2: Kinematics in 1D',
        standards: ['HS-PS2-1'],
        maxScore: ASSIGNMENT.maxPoints,
        maxPoints: ASSIGNMENT.maxPoints,
        has_subcollection: true,
        total_submissions: existingGrades.length,
        registryId: ASSIGNMENT.id,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      if (existingGrades.length > 0) {
        const batch = db.batch();
        existingGrades.forEach(g => {
          const sId = String(g.id || g.studentId || '').trim();
          if (!sId || sId === 'N/A' || sId === '681893' || sId === '420914' || sId === '447688') return; // skip non-roster placeholders
          const rInfo = rosterMap.get(sId) || {};
          const period = g.period || rInfo.period || '---';
          const sRef = db.collection('student_results').doc(srDocKey).collection('students').doc(sId);
          batch.set(sRef, {
            student_id: sId,
            student_name: g.name || rInfo.name || `Student ${sId}`,
            class_period: period,
            score: g.score !== undefined ? g.score : 10,
            maxScore: ASSIGNMENT.maxPoints,
            percentage: g.percentage !== undefined ? g.percentage : 100,
            isCompleted: true,
            status: g.status || 'Valid',
            timestamp: g.timestamp || new Date().toISOString()
          }, { merge: true });
        });
        await batch.commit();
        console.log(`💾 Mirrored ${existingGrades.length} student scores to student_results/${srDocKey}/students`);
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
