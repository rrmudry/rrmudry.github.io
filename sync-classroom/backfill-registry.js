#!/usr/bin/env node
/**
 * Backfill Assignment Registry
 * 
 * One-time migration script that:
 * 1. Reads existing `gradest_assignments` docs with `classroomDeployments`
 * 2. Cross-references with Google Classroom API to verify/fetch coursework IDs
 * 3. Creates `assignment_registry` docs for every existing assignment
 * 4. Reports which assignments are missing registry entries
 * 
 * Usage:
 *   node backfill-registry.js             # Live backfill
 *   node backfill-registry.js --dry-run   # Preview only
 */

const { google } = require('googleapis');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// =====================================================================
// 1. Firebase Admin Init
// =====================================================================
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
  } else {
    console.error('ERROR: Firebase service account key not found.');
    process.exit(1);
  }
} catch (error) {
  console.error('Firebase init error:', error.message);
  process.exit(1);
}

// =====================================================================
// 2. Google Classroom Client
// =====================================================================
function getCredentials() {
  try {
    const files = fs.readdirSync(__dirname);
    const secretFile = files.find(f => f.startsWith('client_secret_') && f.endsWith('.json'));
    if (secretFile) {
      const raw = fs.readFileSync(path.join(__dirname, secretFile), 'utf8');
      const data = JSON.parse(raw);
      const credentials = data.web || data.installed;
      if (credentials) return { clientId: credentials.client_id, clientSecret: credentials.client_secret };
    }
  } catch (e) {}
  return { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET };
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

// =====================================================================
// 3. Course Period Config
// =====================================================================
const COURSES = [
  { period: 0, courseId: '875053343151', name: 'Period 0 - Physics H - 26/27' },
  { period: 1, courseId: '875053274185', name: 'Period 1 - Concept Phys - 26/27' },
  { period: 2, courseId: '819978306673', name: 'Period 2 - Concept Phys - 26/27' },
  { period: 3, courseId: '875053206741', name: 'Period 3 - Concept Phys - 26/27' },
  { period: 4, courseId: '875053292931', name: 'Period 4 - Physics - 26/27' },
  { period: 5, courseId: '819978427488', name: 'Period 5 - Physics - 26/27' },
  { period: 6, courseId: '875047683865', name: 'Period 6 - Physics - 26/27' }
];

function extractPeriod(courseName) {
  if (!courseName) return null;
  if (/\bTA\b/i.test(courseName)) return null;
  const match = courseName.match(/Period\s*([0-6])/i) || courseName.match(/\bP([0-6])\b/i);
  return match ? parseInt(match[1], 10) : null;
}

// =====================================================================
// 4. Main Backfill Logic
// =====================================================================
async function backfill() {
  const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

  console.log('\n' + '='.repeat(72));
  console.log('  📦 ASSIGNMENT REGISTRY BACKFILL MIGRATION');
  console.log('='.repeat(72));
  console.log(`  Mode: ${isDryRun ? '🧪 DRY-RUN (preview only)' : '🚀 LIVE WRITE'}\n`);

  const classroom = getClassroomClient();

  // ---------------------------------------------------------------
  // Step 1: Fetch all coursework from Google Classroom (all periods)
  // ---------------------------------------------------------------
  console.log('⏳ Step 1: Fetching all Google Classroom coursework...');
  const allCoursework = new Map(); // courseId → [coursework items]

  for (const course of COURSES) {
    try {
      const res = await classroom.courses.courseWork.list({ courseId: course.courseId, pageSize: 100 });
      const cws = res.data.courseWork || [];
      allCoursework.set(course.courseId, cws);
      console.log(`  Period ${course.period}: ${cws.length} coursework items`);
    } catch (e) {
      console.warn(`  Period ${course.period}: ⚠️  ${e.message}`);
      allCoursework.set(course.courseId, []);
    }
  }

  // ---------------------------------------------------------------
  // Step 2: Read existing gradest_assignments with deployments
  // ---------------------------------------------------------------
  console.log('\n⏳ Step 2: Reading existing gradest_assignments...');
  const gSnap = await db.collection('gradest_assignments').get();
  const assignmentsByTitle = new Map(); // normalized title → best record

  for (const doc of gSnap.docs) {
    const data = doc.data();
    const title = data.title || data.assignmentName || doc.id;
    const key = title.toLowerCase().replace(/[^a-z0-9]/g, '');

    const existing = assignmentsByTitle.get(key);
    const hasDeployments = Array.isArray(data.classroomDeployments) && data.classroomDeployments.length > 0;

    // Prefer the entry that has classroomDeployments, or the one with an underscore ID (assignment_id style)
    if (!existing || (hasDeployments && !existing.hasDeployments) || doc.id.includes('_')) {
      assignmentsByTitle.set(key, {
        docId: doc.id,
        title: title,
        maxPoints: data.maxPoints || data.maxScore || 10,
        description: data.description || data.assignmentDetails || '',
        activityUrl: data.activityUrl || '',
        topic: data.topic || '',
        classroomDeployments: data.classroomDeployments || [],
        hasDeployments: hasDeployments
      });
    }
  }

  console.log(`  Found ${assignmentsByTitle.size} unique assignments (deduplicated)`);

  // ---------------------------------------------------------------
  // Step 3: Read existing student_results parent docs
  // ---------------------------------------------------------------
  console.log('\n⏳ Step 3: Reading existing student_results parent docs...');
  const srDocs = await db.collection('student_results').listDocuments();
  const studentResultIds = new Set();
  const srMetadata = new Map();

  for (const ref of srDocs) {
    studentResultIds.add(ref.id);
    const doc = await ref.get();
    if (doc.exists) {
      srMetadata.set(ref.id, doc.data());
    }
  }
  console.log(`  Found ${studentResultIds.size} student_results parent docs`);

  // ---------------------------------------------------------------
  // Step 4: Check existing assignment_registry entries
  // ---------------------------------------------------------------
  console.log('\n⏳ Step 4: Checking existing assignment_registry...');
  const regSnap = await db.collection('assignment_registry').get();
  const existingRegistry = new Set();
  regSnap.forEach(doc => existingRegistry.add(doc.id));
  console.log(`  Found ${existingRegistry.size} existing registry entries`);

  // ---------------------------------------------------------------
  // Step 5: Build registry entries
  // ---------------------------------------------------------------
  console.log('\n' + '─'.repeat(72));
  console.log('  📋 BUILDING REGISTRY ENTRIES');
  console.log('─'.repeat(72) + '\n');

  const results = [];

  for (const [key, assignment] of assignmentsByTitle.entries()) {
    // Determine the assignmentId (Firestore doc ID in student_results)
    // Priority: underscore-style doc ID from gradest_assignments → snake_case of title → find in student_results
    let assignmentId = null;

    // Check if the gradest_assignments doc ID looks like an assignment_id (has underscores, not spaces)
    if (assignment.docId.includes('_') && !assignment.docId.includes(' ')) {
      assignmentId = assignment.docId;
    }

    // If not found, try to match against student_results
    if (!assignmentId) {
      const snakeCase = assignment.title.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      if (studentResultIds.has(snakeCase)) {
        assignmentId = snakeCase;
      } else if (studentResultIds.has(assignment.docId)) {
        assignmentId = assignment.docId;
      } else {
        // Try fuzzy matching against student_results IDs
        for (const srId of studentResultIds) {
          const srNorm = srId.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (srNorm === key || key.includes(srNorm) || srNorm.includes(key)) {
            assignmentId = srId;
            break;
          }
        }
      }
    }

    if (!assignmentId) {
      // Last resort: use snake_case of title
      assignmentId = assignment.title.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    }

    // Skip if already in registry
    if (existingRegistry.has(assignmentId)) {
      console.log(`  ⏭  ${assignment.title} → already in registry as "${assignmentId}"`);
      results.push({ title: assignment.title, assignmentId, status: 'EXISTING' });
      continue;
    }

    // Build coursework map from classroomDeployments
    const courseworkMap = {};

    if (assignment.hasDeployments) {
      // Use the stored deployment data
      for (const dep of assignment.classroomDeployments) {
        if (dep.courseId && dep.courseworkId) {
          courseworkMap[dep.courseId] = dep.courseworkId;
        }
      }
    }

    // If we don't have deployments, try to match by title in Classroom API data
    if (Object.keys(courseworkMap).length === 0) {
      const searchTitle = assignment.title.toLowerCase().replace(/[^a-z0-9]/g, '');

      for (const course of COURSES) {
        const cws = allCoursework.get(course.courseId) || [];
        for (const cw of cws) {
          const cwNorm = cw.title.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cwNorm === searchTitle || cwNorm.includes(searchTitle) || searchTitle.includes(cwNorm)) {
            courseworkMap[course.courseId] = cw.id;
            break;
          }
        }
      }
    }

    const cwCount = Object.keys(courseworkMap).length;

    if (cwCount === 0) {
      console.log(`  ⚠️  ${assignment.title} → NO coursework matches found (may be manual-only)`);
      results.push({ title: assignment.title, assignmentId, status: 'NO_COURSEWORK' });
      continue;
    }

    // Write registry entry
    const registryDoc = {
      assignmentId: assignmentId,
      title: assignment.title,
      description: assignment.description,
      maxPoints: assignment.maxPoints,
      firestorePath: 'student_results',
      coursework: courseworkMap,
      activityUrl: assignment.activityUrl,
      unit: assignment.topic || '',
      standards: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (isDryRun) {
      console.log(`  🧪 [DRY-RUN] ${assignment.title} → assignment_registry/${assignmentId} (${cwCount} courses)`);
    } else {
      await db.collection('assignment_registry').doc(assignmentId).set(registryDoc, { merge: true });

      // Also update the student_results parent doc with registry cross-reference
      if (studentResultIds.has(assignmentId)) {
        await db.collection('student_results').doc(assignmentId).set({
          registryId: assignmentId,
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }

      console.log(`  ✅ ${assignment.title} → assignment_registry/${assignmentId} (${cwCount} coursework links)`);
    }

    results.push({ title: assignment.title, assignmentId, status: 'CREATED', courseworkCount: cwCount });
  }

  // ---------------------------------------------------------------
  // Step 6: Find orphaned student_results with no registry entry
  // ---------------------------------------------------------------
  console.log('\n' + '─'.repeat(72));
  console.log('  🔍 ORPHAN CHECK: student_results with no registry entry');
  console.log('─'.repeat(72) + '\n');

  const registeredIds = new Set(results.filter(r => r.status !== 'NO_COURSEWORK').map(r => r.assignmentId));
  const refreshedRegistry = new Set([...existingRegistry, ...registeredIds]);

  let orphanCount = 0;
  for (const srId of studentResultIds) {
    if (!refreshedRegistry.has(srId)) {
      const meta = srMetadata.get(srId) || {};
      const countSnap = await db.collection('student_results').doc(srId).collection('students').count().get();
      const count = countSnap.data().count;
      if (count > 0) {
        console.log(`  ⚠️  ORPHAN: student_results/${srId} (${count} students, name: "${meta.assignment_name || '?'}")`);
        orphanCount++;
      }
    }
  }

  if (orphanCount === 0) {
    console.log('  ✅ No orphaned student_results found. All scored assignments have registry entries.');
  }

  // ---------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------
  console.log('\n' + '='.repeat(72));
  console.log('  📊 BACKFILL SUMMARY');
  console.log('='.repeat(72));

  const created = results.filter(r => r.status === 'CREATED').length;
  const existing = results.filter(r => r.status === 'EXISTING').length;
  const noMatch = results.filter(r => r.status === 'NO_COURSEWORK').length;

  console.log(`  Created:       ${created} new registry entries`);
  console.log(`  Already Exist: ${existing}`);
  console.log(`  No Coursework: ${noMatch} (manual/offline only)`);
  console.log(`  Orphaned:      ${orphanCount} student_results without registry`);
  console.log('');

  if (isDryRun) {
    console.log('💡 To perform the live backfill, run: node backfill-registry.js\n');
  } else {
    console.log('🎉 Backfill complete! Run `npm run sync:dry` to verify registry-first lookups.\n');
  }
}

backfill().catch(err => {
  console.error('\n❌ Fatal backfill error:', err);
  process.exit(1);
});
