#!/usr/bin/env node
/**
 * apply-transfer-baseline.js
 * 
 * Sets a 59% baseline score for transfer student 397817 (Antonio Herrera, Period 1)
 * across all existing Firestore assignment stores so reports, grade syncs, and webapps
 * recognize the transfer benefit-of-the-doubt grade.
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'site-6e500-firebase-adminsdk-fbsvc-407ccb8f99.json');
const serviceAccount = require(serviceAccountPath);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

const STUDENT_ID = '397817';
const STUDENT_NAME = 'Antonio Herrera';
const STUDENT_EMAIL = '397817@orangeusd.org';
const PERIOD = 1;
const BASELINE_PCT = 59;

async function run() {
  console.log(`Setting 59% transfer baseline for ${STUDENT_NAME} (${STUDENT_ID}) [Period ${PERIOD}]...\n`);

  // 1. Update Roster Document
  console.log('1. Updating Firestore roster record...');
  await db.collection('roster').doc(STUDENT_ID).set({
    student_id: STUDENT_ID,
    studentId: STUDENT_ID,
    first_name: 'Antonio',
    last_name: 'Herrera',
    full_name: STUDENT_NAME,
    name: STUDENT_NAME,
    email: STUDENT_EMAIL,
    student_email: STUDENT_EMAIL,
    class_period: PERIOD,
    period: PERIOD,
    transfer_student: true,
    isTransferBaseline: true,
    transfer_baseline_pct: BASELINE_PCT,
    transfer_note: "Transferred from another school with an F in Conceptual Physics; granted 59% baseline benefit of the doubt on prior assignments.",
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log('   ✓ Roster doc updated.');

  // 2. Update student_results collections
  console.log('\n2. Updating student_results collections...');
  const studentResultsAssignments = [
    { id: 'bell_ringer_weeks_1_5', maxPts: 80, score: 47.2, title: 'Bell-Ringer Check-In: Weeks 1–5' },
    { id: 'bell_ringer_week_6', maxPts: 20, score: 11.8, title: 'Bell-Ringer: Week 6 (2026-09-21 to 2026-09-25)' },
    { id: 'bell_ringer_week_7', maxPts: 20, score: 11.8, title: 'Bell-Ringer: Week 7 (2026-09-28 to 2026-10-02)' },
    { id: 'Unit_Conversion_Practice', maxPts: 10, score: 5.9, title: 'Unit Conversion Practice' },
    { id: 'Constant_Speed_Story', maxPts: 10, score: 5.9, title: 'Constant Speed Story: Author & Solve' },
    { id: 'Graphing_Speed_Story', maxPts: 10, score: 5.9, title: 'Graphing Speed Story' },
    { id: 'Wind_Up_Toy_Speed_Lab', maxPts: 10, score: 5.9, title: 'Wind Up Toy Speed Lab' },
    { id: 'Marble_Ramp_Lab', maxPts: 10, score: 5.9, title: 'Marble Ramp Motion & Graphing Lab' },
    { id: 'Dual_Graph_Studio', maxPts: 10, score: 5.9, title: 'Dual-Graph Velocity vs Time Practice' },
    { id: 'Position_Time_Graph_Studio', maxPts: 10, score: 5.9, title: 'Position vs. Time Graphing Practice' },
    { id: 'kinematic_velocity_calculator', maxPts: 10, score: 5.9, title: 'Kinematic Velocity Calculator' },
    { id: 'unit2_day16_acceleration_studio', maxPts: 10, score: 5.9, title: 'Acceleration Studio Practice' },
    { id: 'unit2_day18_pull_back_toy_lab', maxPts: 10, score: 5.9, title: 'Pull-Back Toy Motion Lab' },
    { id: 'unit2_day24_mass_weight_studio', maxPts: 10, score: 5.9, title: 'Mass, Weight & Zero-G Inertia Studio' },
    { id: 'newtons_second_law_calculator', maxPts: 10, score: 5.9, title: "Newton's 2nd Law Calculator" },
    { id: 'unit2_day27_newtons_second_law_studio', maxPts: 10, score: 5.9, title: "Newton's 2nd Law Studio" }
  ];

  for (const item of studentResultsAssignments) {
    const docRef = db.collection('student_results').doc(item.id).collection('students').doc(STUDENT_ID);
    await docRef.set({
      student_id: STUDENT_ID,
      studentId: STUDENT_ID,
      student_name: STUDENT_NAME,
      studentName: STUDENT_NAME,
      displayName: STUDENT_NAME,
      email: STUDENT_EMAIL,
      studentEmail: STUDENT_EMAIL,
      class_period: PERIOD,
      period: PERIOD,
      score: item.score,
      maxScore: item.maxPts,
      maxPoints: item.maxPts,
      percentage: BASELINE_PCT,
      percent: BASELINE_PCT,
      isTransferBaseline: true,
      transferNote: '59% baseline benefit of the doubt',
      assignmentTitle: item.title,
      timestamp: new Date().toISOString(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`   ✓ ${item.title}: ${item.score}/${item.maxPts} pts (59%) recorded in student_results/${item.id}`);
  }

  // 3. Update physics_labs (Speed Calculator)
  console.log('\n3. Updating physics_labs (Physics Speed Calculator)...');
  await db.collection('physics_labs').doc(STUDENT_ID).set({
    displayName: STUDENT_NAME,
    studentId: STUDENT_ID,
    student_id: STUDENT_ID,
    class_period: PERIOD,
    score: 5.9,
    highScore: 5.9,
    percentage: BASELINE_PCT,
    isTransferBaseline: true,
    transferNote: '59% baseline benefit of the doubt',
    speed_calculator: {
      score: 5.9,
      completed: true,
      percentage: BASELINE_PCT,
      transferNote: '59% baseline'
    },
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log('   ✓ physics_labs updated.');

  console.log('\n🎉 Finished! All Firestore assignments updated with 59% transfer baseline.');
}

run().catch(err => {
  console.error('Error applying transfer baseline:', err);
  process.exit(1);
});
