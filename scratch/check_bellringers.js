const admin = require('firebase-admin');

// Use the local service account json if present, else default adc
const serviceAccount = require('../site-6e500-firebase-adminsdk-fbsvc-407ccb8f99.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'site-6e500'
});

const db = admin.firestore();

async function checkBellringers() {
    try {
        console.log("Fetching documents from 'bellringers' collection...");
        const snap = await db.collection('bellringers').get();
        console.log(`Found ${snap.size} documents in 'bellringers'.`);
        
        snap.forEach(doc => {
            console.log(`Document ID: ${doc.id}`);
            console.log(JSON.stringify(doc.data(), null, 2));
            console.log("-----------------------------------------");
        });
        
    } catch (e) {
        console.error('Error:', e.message);
    }
}

checkBellringers();
