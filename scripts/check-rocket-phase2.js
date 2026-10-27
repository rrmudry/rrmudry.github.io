const path = require('path');
const admin = require('firebase-admin');
const sa = require(path.join(process.cwd(), 'site-6e500-firebase-adminsdk-fbsvc-407ccb8f99.json'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

(async () => {
  // 1. Get roster for Periods 0, 4, 5, 6
  const rosterSnap = await db.collection('roster').get();
  const rosterByPeriod = { '0': [], '4': [], '5': [], '6': [] };
  const studentMap = new Map();

  rosterSnap.forEach(doc => {
    const d = doc.data();
    const p = String(d.class_period !== undefined ? d.class_period : d.period);
    if (rosterByPeriod[p]) {
      const student = {
        id: doc.id,
        name: d.full_name || (d.first_name ? `${d.first_name} ${d.last_name || ''}`.trim() : doc.id),
        period: p
      };
      rosterByPeriod[p].push(student);
      studentMap.set(doc.id, student);
    }
  });

  // 2. Query unit2_day36_rocket_phase2
  const subSnap = await db.collection('student_results').doc('unit2_day36_rocket_phase2').collection('students').get();
  console.log('Total Phase 2 submissions across all periods:', subSnap.size);

  const subsByStudentId = new Map();
  subSnap.forEach(doc => {
    subsByStudentId.set(doc.id, doc.data());
  });

  // Sample submission keys & details
  if (subSnap.size > 0) {
    const firstDoc = subSnap.docs[0].data();
    console.log('Sample submission fields:', Object.keys(firstDoc));
  }

  for (const p of ['0', '4', '5', '6']) {
    const roster = rosterByPeriod[p];
    let completedCount = 0;
    let partialCount = 0;
    let notStartedCount = 0;

    const completedList = [];
    const partialList = [];
    const notStartedList = [];

    roster.forEach(s => {
      const sub = subsByStudentId.get(s.id);
      if (!sub) {
        notStartedCount++;
        notStartedList.push(s.name);
      } else {
        const score = sub.score !== undefined ? sub.score : (sub.points !== undefined ? sub.points : 0);
        const isCompleted = sub.isCompleted || (score >= 10);
        const stage = sub.stage || sub.currentStage || sub.activeStage;
        const variable = sub.independentVariable || sub.variable || (sub.specs ? sub.specs.variable : '');
        const partner = sub.partnerName || sub.partner || '';
        
        if (isCompleted || score >= 9.5) {
          completedCount++;
          completedList.push({ name: s.name, id: s.id, score, stage, variable, partner });
        } else {
          partialCount++;
          partialList.push({ name: s.name, id: s.id, score, stage, variable, partner, lastSaved: sub.lastSavedAt });
        }
      }
    });

    console.log(`\n================ PERIOD ${p} (Roster: ${roster.length}) ================`);
    console.log(`✅ Completed (10/10): ${completedCount} | ⏳ In Progress: ${partialCount} | ❌ Not Started: ${notStartedCount}`);
    
    if (completedList.length > 0) {
      console.log('  Completed:');
      completedList.forEach(s => console.log(`    ✅ ${s.name} (${s.id}) - ${s.score}/10`));
    }
    if (partialList.length > 0) {
      console.log('  In Progress:');
      partialList.forEach(s => console.log(`    ⏳ ${s.name} (${s.id}) - ${s.score}/10 (Stage: ${s.stage || 'Draft'}, Last: ${s.lastSaved || 'N/A'})`));
    }
    if (notStartedList.length > 0) {
      console.log('  Not Started:');
      notStartedList.forEach(name => console.log(`    ❌ ${name}`));
    }
  }
})();
