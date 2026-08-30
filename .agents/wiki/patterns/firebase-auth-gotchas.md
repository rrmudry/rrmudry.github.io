# Firebase Auth & Score Submission Patterns

## Auth Gateway Pattern
All student-facing webapps use Firebase Auth with Google Sign-In restricted to the `@orangeusd.org` domain:

```javascript
// Standard Auth Initialization
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        const email = user.email.toLowerCase();
        // Domain enforcement
        if (email.endsWith('@orangeusd.org') || email === 'ryan.mudry@gmail.com') {
            const studentId = email.split('@')[0];  // 6-digit student ID
            initializeApp(studentId, user.displayName);
        } else {
            alert('Access restricted. Please sign in using your school @orangeusd.org account.');
            firebase.auth().signOut();
        }
    } else {
        showLoginScreen();
        // OR trigger popup directly:
        // const provider = new firebase.auth.GoogleAuthProvider();
        // provider.setCustomParameters({ hd: 'orangeusd.org' });
        // firebase.auth().signInWithPopup(provider);
    }
});
```

## Known Approaches
- **Two auth patterns exist** in the codebase:
  1. **Popup-on-load** (used in Bell-Ringer, newer apps): Auto-triggers `signInWithPopup` if no user. No login button needed.
  2. **Login screen** (used in older apps): Shows a styled login card with a "Sign In" button. Requires explicit click.
- **Teacher override**: `ryan.mudry@gmail.com` is always whitelisted alongside `@orangeusd.org` emails.
- **Student ID extraction**: The student's 6-digit ID is the email prefix (e.g., `123456@orangeusd.org` → `123456`).

## Firebase SDK Versions
All apps use the **compat** CDN bundles (not modular):

```html
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
```

The project ID is `site-6e500`. Firebase config is typically embedded inline in the HTML.

## Score Submission Pattern: Highest Score Retention
Webapps submit percentage scores (0-100) and only overwrite if the new score is higher:

```javascript
const ASSIGNMENT_ID = "Unique_Lab_Name";  // Must match Firestore doc ID

async function submitScore(studentId, rawPoints, maxPoints) {
    const percentageScore = Math.round((rawPoints / maxPoints) * 100);
    const scoreRef = db.collection('student_results')
                       .doc(ASSIGNMENT_ID)
                       .collection('students')
                       .doc(studentId);
    const doc = await scoreRef.get();
    if (!doc.exists || percentageScore > (doc.data().score || 0)) {
        await scoreRef.set({
            student_id: studentId,
            student_name: firebase.auth().currentUser.displayName,
            score: percentageScore,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }
}
```

## Dual-Path Sync Pattern (Bell-Ringer / Live Proctoring)
Some apps write to TWO Firestore paths:

1. **Live proctoring** (`student_results/{ASSIGNMENT_ID}/students/{id}`): Updated continuously during the activity for real-time dashboard monitoring.
2. **Final archive** (`student_results_archive/{studentId}_{ASSIGNMENT_ID}`): Written only on final submission for permanent gradebook sync.

## Known Pitfalls
- **Compat vs Modular imports**: Never mix `firebase-app-compat.js` with modular `import { getFirestore } from 'firebase/firestore'`. The entire codebase uses compat mode.
- **ASSIGNMENT_ID collision**: Each webapp MUST use a globally unique `ASSIGNMENT_ID` string. If two apps share the same ID, scores will overwrite each other.
- **signInWithPopup blocking**: Mobile Safari sometimes blocks the popup. For mobile-heavy apps, consider `signInWithRedirect` as a fallback.
- **Firestore rules require auth**: All reads/writes to `student_results` require `request.auth != null`. If a user somehow bypasses the frontend auth check, Firestore rules will reject the write.
- **Roster lookup**: The Bell-Ringer system cross-references `roster/{studentId}` to verify class period. Not all apps do this — only period-gated apps need it.

## Evidence
- Auth pattern from `create-secure-webapp.md` workflow
- Score submission from `create-student-webapp.md` workflow
- Dual-path sync from Bell-Ringer README and teacher.html
- Popup vs login screen pattern observed across skydiving-game and Bell-Ringer
