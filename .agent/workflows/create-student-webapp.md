---
description: Guidelines and checklist for creating new student-facing interactive webapps and unit dashboards with automatic NGSS standards alignment
---
# Student Webapp & Unit Creation Workflow

Follow these requirements and code patterns whenever creating or modifying interactive student-facing web applications (e.g. physics labs, quizzes, simulations, dashboards) that submit scores to your database and align with standards.

---

## 📋 Pre-Development Checklist

- [ ] **Google Sign-In**: Enforce Google Authentication using Firebase Auth.
- [ ] **Email Filtering**: Restrict sign-in to `@orangeusd.org` domain.
- [ ] **Unique Assignment ID**: Hardcode a unique constant `ASSIGNMENT_ID` in the webapp code. This must match the document ID in the Firestore `assignments` and `student_results` collections exactly.
- [ ] **Percentage-Based Scoring**: Design the scoring system to submit grades as a percentage (integer `0` to `100`).
- [ ] **Highest Score Retention**: Check Firestore for existing submissions and only save the score if it exceeds the student's previous attempt.
- [ ] **Automatic NGSS Standards Linking**: Include `data-ngss="STANDARD_CODES"` (e.g. `data-ngss="HS-PS2-1,HS-PS2-2"`) or `data-ngss-is="IS1"` in the HTML body to automatically pull and render interactive NGSS standard badges and popover details via `NGSSHelper`.

---

## 📚 Automatic NGSS Standards Integration

Adding NGSS standard alignment to any new unit dashboard, activity, or student webapp requires **zero custom JavaScript**:

### 1. HTML Declarative Auto-Integration
Simply place a `div` or `span` with the `data-ngss` or `data-ngss-is` attribute anywhere in your HTML:

```html
<!-- Option A: Link specific standard codes -->
<div data-ngss="HS-PS2-1, HS-PS2-2, HS-PS2-3"></div>

<!-- Option B: Link an entire CA Physics Instructional Segment -->
<div data-ngss-is="IS1"></div>

<!-- Option C: Inline Clickable Trigger Button -->
<button data-ngss-code="HS-PS2-1">View HS-PS2-1 Standard</button>
```

When the page loads, `assets/ngss-helper.js` automatically scans the DOM, loads `standards-data.js`, and renders styled interactive pill badges that open detailed modal popovers!

---

## 💻 Standard Code Blocks

### 1. Google Authentication & Email Filter
Always configure the Firebase Auth listener to verify the student's email domain:

```javascript
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    const email = user.email.toLowerCase();
    
    // Enforce Orange USD school account domain
    if (email.endsWith('@orangeusd.org') || email === 'ryan.mudry@gmail.com') {
      const emailPrefix = email.split('@')[0];
      initializeLab(emailPrefix, user.displayName);
    } else {
      // Sign out unauthorized domains
      alert('Access restricted. Please sign in using your school @orangeusd.org account.');
      firebase.auth().signOut();
    }
  } else {
    showLoginScreen();
  }
});
```

### 2. Firestore Score Submission (Highest Attempt Only)
Ensure student scores are written as a percentage (0 to 100) and only overwrite if the new attempt is higher than the previous record:

```javascript
async function submitScore(studentId, rawPoints, maxPoints) {
  const percentageScore = Math.round((rawPoints / maxPoints) * 100);
  
  // Reference target assignment results subcollection
  const scoreRef = db.collection('student_results')
                     .doc(ASSIGNMENT_ID)
                     .collection('students')
                     .doc(studentId);

  try {
    const doc = await scoreRef.get();
    
    if (!doc.exists || percentageScore > (doc.data().score || 0)) {
      await scoreRef.set({
        student_id: studentId,
        student_name: firebase.auth().currentUser.displayName,
        score: percentageScore, // Percentage integer from 0 to 100
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      console.log(`Successfully recorded new high score of ${percentageScore}%`);
    } else {
      console.log(`Attempt complete (${percentageScore}%). Previous high score of ${doc.data().score}% was kept.`);
    }
  } catch (error) {
    console.error("Error submitting grade to Firestore:", error);
  }
}
```

---

## 🔗 Gradebook Linking & Synchronization

To connect the new webapp grades to your Google Classroom gradebook:

1. **Deploy to Classroom**: Open your [Sync Dashboard](http://localhost:3000) and fill out the *Deploy Classroom Coursework* form using the exact `ASSIGNMENT_ID` as the title. This registers the assignment in the Firestore `assignments` collection and creates the coursework across your active Google Classroom courses.
2. **Grade Sync**: When the assignment window closes, select the assignment in the *Firestore Grade Synchronization* dropdown, enter the target Google Classroom Coursework ID, and click **Sync All Scores**. The tool automatically scales the Firestore percentage grades to match the Classroom assignment's `maxPoints`.
