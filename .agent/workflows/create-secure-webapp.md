# Create Secure Webapp

**Description:** Standardized process for creating new educational labs with secure Firebase Authentication and systematic progress tracking (Dual-Path Sync).
**Usage:** Use this workflow via `/create-secure-webapp` whenever you are spinning up a new HTML or React-based lab in the repository.

## Step 1: Inject Standard Firebase Initialization
Every new webapp must include the core Firebase libraries and initialization script.
Do not use `firebase-admin` or unauthenticated references.

```html
<!-- Firebase Core -->
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>

<script>
    const firebaseConfig = {
        // [Inject Site-6e500 Config Here]
    };
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();
    const auth = firebase.auth();
</script>
```

## Step 2: Implement the Secure Auth Gateway
Instead of asking the student to type their ID, the app MUST force a Google Sign-In and extract the ID from the `@orangeusd.org` email.

```javascript
// // turbo
// 1. Force Authentication State
auth.onAuthStateChanged((user) => {
    if (user) {
        // Enforce Domain Security
        if (!user.email.endsWith('@orangeusd.org')) {
            alert("Security Error: Must use an Orange USD email.");
            auth.signOut();
            return;
        }
        
        // Extract 6-digit ID from email (e.g., 123456@orangeusd.org)
        const studentId = user.email.split('@')[0];
        const studentName = user.displayName;
        
        // Initialize App State
        initializeAppTracking(studentId, studentName);
    } else {
        // Trigger Login Popup if not logged in
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ hd: 'orangeusd.org' });
        auth.signInWithPopup(provider);
    }
});
```

## Step 3: Implement Dual-Path Sync Tracking
All data must be written using the standardized schema to ensure the Roster Manager, Proctor Dashboard, and Report Generators can automatically see it.

```javascript
const ASSIGNMENT_ID = "New_Lab_Name";

function saveProgress(studentId, progressData, isFinalSubmission = false) {
    // 1. Live Proctoring Sync (Always updating)
    db.collection('student_results')
      .doc(ASSIGNMENT_ID)
      .collection('students')
      .doc(studentId)
      .set(progressData, { merge: true });

    // 2. Final Gradebook Archive (Only on completion)
    if (isFinalSubmission) {
        const archiveId = `${studentId}_${ASSIGNMENT_ID}`;
        db.collection('student_results_archive')
          .doc(archiveId)
          .set({
              ...progressData,
              timestamp: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
    }
}
```

## Step 4: Verify Firestore Rules
Ensure that the `firestore.rules` document has not been altered to allow unauthenticated writes. The security rule for the app should rely on `request.auth != null` and ID validation matching the logged-in user.
