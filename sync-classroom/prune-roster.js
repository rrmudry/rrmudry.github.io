const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'site-6e500-firebase-adminsdk-fbsvc-407ccb8f99.json');
const serviceAccount = require(serviceAccountPath);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

const studentsToPrune = [
  { id: 'REDACTED', name: '[REDACTED]', period: 1 },
  { id: 'REDACTED', name: '[REDACTED]', period: 2 },
  { id: 'REDACTED', name: '[REDACTED]', period: 3 },
  { id: 'REDACTED', name: '[REDACTED]', period: 5 },
  { id: 'REDACTED', name: '[REDACTED]', period: 6 },
  { id: 'REDACTED', name: '[REDACTED]', period: 6 },
  { id: 'REDACTED', name: '[REDACTED]', period: 6 },
  { id: 'REDACTED', name: '[REDACTED]', period: 6 }
];

async function prune() {
  console.log('1. Fetching current records for backup...');
  const backupData = [];

  for (const s of studentsToPrune) {
    const docRef = db.collection('roster').doc(s.id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      backupData.push({
        id: docSnap.id,
        data: docSnap.data(),
        prunedAt: new Date().toISOString()
      });
      console.log(`  - Backed up: ${s.name} (${s.id}) [P${s.period}]`);
    } else {
      console.warn(`  - Warning: Doc ${s.id} not found in Firestore.`);
    }
  }

  const backupPath = path.join(__dirname, 'backup-pruned-students-2026-10-06.json');
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`\n✅ Backup successfully written to ${backupPath} (${backupData.length} records).\n`);

  console.log('2. Deleting records from Firestore collection "roster"...');
  const batch = db.batch();
  for (const item of backupData) {
    const ref = db.collection('roster').doc(item.id);
    batch.delete(ref);
  }
  await batch.commit();
  console.log(`✅ Successfully deleted ${backupData.length} students from "roster" collection.`);
}

prune().catch(err => {
  console.error('Prune failed:', err);
  process.exit(1);
});
