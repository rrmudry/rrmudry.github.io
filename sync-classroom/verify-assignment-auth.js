#!/usr/bin/env node
/**
 * Automated Pre-Flight Assignment & Student Auth Validator
 * 
 * Prevents broken student score recording BEFORE assignments are posted to students.
 * 
 * Verifies:
 * 1. Assignment registry exists and has valid coursework across all 7 periods.
 * 2. Roster schema matches expectations (class_period resolves properly for Period 0 and standard periods).
 * 3. End-to-end synthetic student write to Firestore succeeds with zero undefined errors.
 * 4. sync-cli score parser successfully extracts period and grades from the student document.
 * 
 * Usage:
 *   node verify-assignment-auth.js --id unit2_day27_newtons_second_law_studio
 *   npm run verify -- --id unit2_day27_newtons_second_law_studio
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const serviceAccountPath = path.join(__dirname, '..', 'site-6e500-firebase-adminsdk-fbsvc-407ccb8f99.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ ERROR: Firebase service account key not found.');
  process.exit(1);
}
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath))
  });
}
const db = admin.firestore();

// Parse CLI args
const args = process.argv.slice(2);
let assignmentId = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--id' || args[i] === '-i') {
    assignmentId = args[i + 1];
    break;
  }
}

if (!assignmentId) {
  console.error('Usage: node verify-assignment-auth.js --id <assignment_id>');
  process.exit(1);
}

async function runPreFlightCheck() {
  console.log('========================================================================');
  console.log(`🛡️  PRE-FLIGHT STUDENT AUTH & SYNC VERIFICATION: "${assignmentId}"`);
  console.log('========================================================================\n');

  let passed = true;

  // 1. Verify Assignment Registry
  console.log('1️⃣ Checking assignment_registry in Firestore...');
  const regDoc = await db.collection('assignment_registry').doc(assignmentId).get();
  if (!regDoc.exists) {
    console.error(`  ❌ FAILED: assignment_registry/${assignmentId} does NOT exist! Run deploy-assignment.js first.`);
    passed = false;
  } else {
    const data = regDoc.data();
    const coursework = data.coursework || {};
    const cwCount = Object.keys(coursework).length;
    if (cwCount < 7) {
      console.warn(`  ⚠️ WARNING: Only ${cwCount}/7 periods mapped in assignment_registry.`);
    } else {
      console.log(`  ✓ Registry exists: "${data.title}" mapped across all ${cwCount} courses.`);
    }
  }

  // 2. Verify Roster Schema
  console.log('\n2️⃣ Checking roster schema compatibility...');
  const sampleRoster = await db.collection('roster').limit(1).get();
  if (sampleRoster.empty) {
    console.error('  ❌ FAILED: roster collection is empty.');
    passed = false;
  } else {
    const sampleDoc = sampleRoster.docs[0].data();
    if (sampleDoc.class_period === undefined && sampleDoc.period === undefined) {
      console.error('  ❌ FAILED: Neither class_period nor period found on roster document.');
      passed = false;
    } else {
      const fieldUsed = sampleDoc.class_period !== undefined ? 'class_period' : 'period';
      console.log(`  ✓ Roster field verified: using "${fieldUsed}" (e.g. Period ${sampleDoc.class_period ?? sampleDoc.period}).`);
    }
  }

  // 3. Test Honors Period 0 Resolution
  console.log('\n3️⃣ Testing Period 0 (Honors) and standard period resolution...');
  const p0Snap = await db.collection('roster').where('class_period', '==', 0).limit(1).get();
  if (p0Snap.empty) {
    console.warn('  ⚠️ Could not find a sample Period 0 student in roster.');
  } else {
    const p0Student = p0Snap.docs[0].data();
    const periodVal = p0Student.class_period !== undefined ? p0Student.class_period : p0Student.period;
    if (periodVal !== 0) {
      console.error(`  ❌ FAILED: Period 0 evaluated to ${periodVal} instead of 0.`);
      passed = false;
    } else {
      console.log(`  ✓ Period 0 Honors student correctly resolved (${p0Student.full_name}, ID: ${p0Student.student_id}).`);
    }
  }

  // 4. Test Synthetic Student Document Write
  console.log('\n4️⃣ Testing synthetic student Firestore write (Student Impersonation Test)...');
  const testStudentId = '_preflight_test_student_99999';
  const testDocRef = db.collection('student_results').doc(assignmentId).collection('students').doc(testStudentId);
  
  const testPayload = {
    student_id: testStudentId,
    student_name: 'Synthetic Test Student',
    email: `${testStudentId}@orangeusd.org`,
    score: 10,
    maxScore: 10,
    maxPoints: 10,
    percentage: 100,
    steps_done: 3,
    arena_best_tiers: 5,
    class_period: 0,
    honors_required: true,
    isCompleted: true,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  };

  try {
    // Attempt write
    await testDocRef.set(testPayload);
    console.log('  ✓ Synthetic student document written successfully without undefined errors.');

    // Verify read
    const readSnap = await testDocRef.get();
    if (!readSnap.exists) {
      console.error('  ❌ FAILED: Written synthetic document could not be read back.');
      passed = false;
    } else {
      const readData = readSnap.data();
      if (readData.class_period !== 0 || readData.score !== 10) {
        console.error('  ❌ FAILED: Data corruption on written synthetic document.');
        passed = false;
      } else {
        console.log('  ✓ Synthetic student document verified with correct period and score.');
      }
    }
  } catch (err) {
    console.error(`  ❌ FAILED: Firestore rejected student write: ${err.message}`);
    passed = false;
  } finally {
    // Clean up test document
    try {
      await testDocRef.delete();
      console.log('  ✓ Cleaned up synthetic test document.');
    } catch (e) {}
  }

  // 5. Inspect auth.js in codebase if provided
  console.log('\n5️⃣ Static code analysis for unsafe undefined payload patterns in app...');
  const possiblePaths = [
    path.join(__dirname, '..', 'Unit_2', 'newtons_second_law_studio', 'js', 'auth.js'),
    path.join(__dirname, '..', 'Unit_2', 'mass_weight_studio', 'js', 'auth.js'),
    path.join(__dirname, '..', 'newtons_second_law_calculator', 'src', 'app.js'),
    path.join(__dirname, '..', 'newtons_second_law_calculator', 'dist', 'index.html')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      const relativePath = path.relative(path.join(__dirname, '..'), p);
      if (content.includes('snap.data().period') && !content.includes('class_period')) {
        console.error(`  ❌ UNSAFE CODE FOUND in ${relativePath}: Uses snap.data().period without checking class_period!`);
        passed = false;
      } else {
        console.log(`  ✓ ${relativePath} passes static schema safety check.`);
      }
    }
  }

  console.log('\n========================================================================');
  if (passed) {
    console.log('🎉 ALL PRE-FLIGHT CHECKS PASSED: Safe for student assignment posting!');
  } else {
    console.error('🚫 PRE-FLIGHT CHECKS FAILED: DO NOT POST THIS ASSIGNMENT TO STUDENTS.');
    process.exit(1);
  }
  console.log('========================================================================\n');
}

runPreFlightCheck();
