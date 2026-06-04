const admin = require('firebase-admin');

admin.initializeApp({
    projectId: 'site-6e500'
});

const db = admin.firestore();

async function countDocs() {
    try {
        // In this architecture, assignments are docs in 'student_results'
        // and students are in a subcollection 'students'
        const assignmentsSnap = await db.collection('student_results').get();
        let totalStudents = 0;
        
        for (const doc of assignmentsSnap.docs) {
            const studentsSnap = await db.collection('student_results').doc(doc.id).collection('students').get();
            console.log(`Assignment: ${doc.id}, Count: ${studentsSnap.size}`);
            totalStudents += studentsSnap.size;
        }
        
        console.log('Total Student Records in Firestore (Live):', totalStudents);
        
        const archiveSnap = await db.collection('student_results_archive').get();
        console.log('Total Records in Firestore (Archive):', archiveSnap.size);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

countDocs();
