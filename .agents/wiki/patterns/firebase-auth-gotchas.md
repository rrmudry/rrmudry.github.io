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

## Physics Labs Collection Pattern (`physics_labs`)
For multi-level scaffolded interactive webapps (e.g. `Physics Speed Calculator`):
- **Collection**: `physics_labs/{studentId}` (keyed directly by the student's 6-digit ID / email prefix).
- **Structure**: Contains root-level progression (`currentLevel`, `unlockedLevels`, `answered`, `score`, `completed`, `certificateId`, `lastUpdated`) and a namespaced sub-object for the specific tool (e.g., `speed_calculator`).
- **Data Export Integration**: `admin/data_export.html` includes a dedicated **🚀 Physics Labs & WebApps** tab that loads `physics_labs`, joins it with `roster/{studentId}` to display class periods, and provides filtered views and one-click gradebook CSV exports.
- **Rule for Future Interactive Webapps**: Any new multi-level physics tool should either save its progress under `physics_labs/{studentId}` (with a unique tool key) or follow the `student_results/{ASSIGNMENT_ID}/students/{studentId}` standard so that it is automatically visible in `admin/data_export.html`. After deploying the webapp, use `deploy-assignment.js` to create the Google Classroom coursework and register the `ASSIGNMENT_ID` in `assignment_registry` (see [`assignment-registry.md`](patterns/assignment-registry.md)).

## Known Pitfalls
- **Compat vs Modular imports**: Never mix `firebase-app-compat.js` with modular `import { getFirestore } from 'firebase/firestore'`. The entire codebase uses compat mode.
- **ASSIGNMENT_ID collision**: Each webapp MUST use a globally unique `ASSIGNMENT_ID` string. If two apps share the same ID, scores will overwrite each other.
- **signInWithPopup blocking**: Mobile Safari sometimes blocks the popup. For mobile-heavy apps, consider `signInWithRedirect` as a fallback.
- **Firestore rules require auth**: All reads/writes to `student_results` require `request.auth != null`. If a user somehow bypasses the frontend auth check, Firestore rules will reject the write.
- **Roster lookup**: The Bell-Ringer system cross-references `roster/{studentId}` to verify class period. Not all apps do this — only period-gated apps need it.

## 🚨 Admin/Teacher Testing Hides Rule Failures (2026-10-16)
- `firebase-admin` **bypasses security rules**, and the teacher account matches `isAdmin()` (global `match /{document=**}`). Neither one can catch a student `PERMISSION_DENIED`. Because of this, Period 0 lost work.
- **Fix**: `sync-classroom/student-rules-check.js` (Step 6 of `npm run verify`) mints a custom token with `email=<id>@orangeusd.org, email_verified=true`, swaps it for an ID token through the Identity Toolkit REST API, and calls the Firestore REST API, so the **deployed** rules are enforced.
- It scans the app source for every `.collection(...)` (including const names) and replays student reads/writes on each one. It impersonates a real P0 student and a real standard-period student for the `roster` GET, runs a privacy negative control, and warns if local `firestore.rules` ≠ deployed.
- Static red flags: writing the parent `student_results/{assignment}` doc (admin-only), using `user.uid` as the doc ID (rules need the email prefix), and literal `undefined` in payloads.
- **Any new collection needs a student `match` block** in `firestore.rules`, deployed with `firebase deploy --only firestore:rules`, or the global admin rule makes it work for the teacher only.
- Usage: `npm run verify -- --id <ASSIGNMENT_ID> --app <app_folder>`.

## Evidence
- Auth pattern from `create-secure-webapp.md` workflow
- Score submission from `create-student-webapp.md` workflow
- Dual-path sync from Bell-Ringer README and teacher.html
- Popup vs login screen pattern observed across skydiving-game and Bell-Ringer

### Enforcement gates (2026-10-16)
1. Pre-commit: `scripts/audit-firestore-rules-coverage.js --staged` (static; opt-out marker `firestore-audit: teacher-only`).
2. `npm run verify -- --id <ID> --app <folder>` Step 6 (live student token).
3. `deploy-assignment.js` blocks Classroom posting unless the live student test passes.
