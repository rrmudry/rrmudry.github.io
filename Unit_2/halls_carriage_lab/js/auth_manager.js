/**
 * AuthManager - Google Sign-In & Gradebook Sync for Modified Atwood Hall's Carriage Lab
 * Enforces @orangeusd.org school domain & submits verified grades to Firestore.
 */
const ASSIGNMENT_ID = "unit2_day28_halls_carriage_lab";

class LabAuthManager {
  constructor() {
    this.currentUser = null;
    this.studentId = null;
    this.studentName = "Student Investigator";
    this.classPeriod = null;
    this.isCompleted = false;

    this.initAuth();
  }

  isTeacher() {
    if (!this.currentUser || !this.currentUser.email) return false;
    const email = this.currentUser.email.toLowerCase();
    return email === 'rmudry@orangeusd.org' || email === 'ryan.mudry@gmail.com';
  }

  initAuth() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      console.warn("Firebase Auth not loaded.");
      return;
    }

    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        const email = (user.email || "").toLowerCase();
        if (email.endsWith('@orangeusd.org') || email === 'ryan.mudry@gmail.com') {
          this.currentUser = user;
          this.studentId = email.split('@')[0];
          this.studentName = user.displayName || this.studentId;
          await this.lookupPeriod();
          this.updateUserUI(true);
          this.loadStudentLabData();
        } else {
          alert('Access restricted. Please sign in using your official school @orangeusd.org account.');
          firebase.auth().signOut();
        }
      } else {
        this.currentUser = null;
        this.studentId = null;
        this.classPeriod = null;
        this.updateUserUI(false);
      }
    });

    if (window.location.protocol.startsWith('http')) {
      firebase.auth().getRedirectResult().then((result) => {
        if (result && result.user) {
          console.log("Redirect login successful:", result.user.email);
        }
      }).catch((err) => {
        console.error("Redirect sign-in error:", err);
      });
    }

    const loginBtn = document.getElementById('btn-google-login');
    if (loginBtn) {
      loginBtn.onclick = () => this.signIn();
    }
  }

  async lookupPeriod() {
    if (!this.studentId || typeof firebase === 'undefined' || !firebase.firestore) return;
    if (this.isTeacher()) {
      this.classPeriod = 'T';
      return;
    }
    try {
      const db = firebase.firestore();
      const doc = await db.collection('roster').doc(this.studentId).get();
      if (doc.exists) {
        const data = doc.data();
        this.classPeriod = data.class_period !== undefined ? data.class_period : (data.period !== undefined ? data.period : null);
      }
    } catch (err) {
      console.warn("Roster lookup non-blocking error:", err);
    }
  }

  signIn() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      alert("Firebase Authentication service is loading. Please try again in a moment.");
      return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ hd: 'orangeusd.org', prompt: 'select_account' });
    firebase.auth().signInWithPopup(provider).catch((err) => {
      console.error("Sign-in popup error:", err);
      if (err.code === 'auth/popup-blocked') {
        alert("Sign-in popup was blocked by your browser. Attempting redirect sign-in...");
        firebase.auth().signInWithRedirect(provider);
      } else if (err.code !== 'auth/popup-closed-by-user') {
        alert("Google Sign-In error: " + (err.message || err.code));
      }
    });
  }

  signOut() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().signOut();
    }
  }

  updateUserUI(isSignedIn) {
    const container = document.getElementById('auth-user-status');
    if (!container) return;

    if (isSignedIn) {
      const periodBadge = this.classPeriod !== null ? ` <span class="text-[10px] text-sky-400 font-mono">P${this.classPeriod}</span>` : '';
      container.innerHTML = `
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/15 text-xs text-slate-800 dark:text-slate-200">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="font-bold max-w-[130px] truncate" title="${this.studentName}">${this.studentName}</span>
          ${periodBadge}
          <button id="btn-sign-out" class="text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 ml-1 font-bold text-xs" title="Sign Out">&times;</button>
        </div>
      `;
      const signOutBtn = document.getElementById('btn-sign-out');
      if (signOutBtn) signOutBtn.onclick = () => this.signOut();
    } else {
      container.innerHTML = `
        <button id="btn-google-login" class="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-3.5 h-3.5 bg-white rounded-full p-0.5" alt="Google">
          <span>Sign In</span>
        </button>
      `;
      const loginBtn = document.getElementById('btn-google-login');
      if (loginBtn) loginBtn.onclick = () => this.signIn();
    }
  }

  async loadStudentLabData() {
    if (!this.studentId || typeof firebase === 'undefined' || !firebase.firestore) return;
    try {
      const db = firebase.firestore();
      const docRef = db.collection('student_results')
                       .doc(ASSIGNMENT_ID)
                       .collection('students')
                       .doc(this.studentId);
      const doc = await docRef.get();
      if (doc.exists) {
        const data = doc.data();
        if (data.labReport && window.labEngine) {
          window.labEngine.restoreSavedState(data.labReport);
        }
        if (data.isCompleted) {
          this.isCompleted = true;
          this.setSubmittedStatusUI();
        }
      }
    } catch (e) {
      console.warn("Could not load cloud student lab data:", e);
    }
  }

  setSubmittedStatusUI() {
    const badge = document.getElementById('badge-lab-status');
    if (badge) {
      badge.textContent = "✅ Completed (10/10)";
      badge.className = "px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap";
    }
    const btnSubmit = document.getElementById('btn-submit-lab');
    if (btnSubmit) {
      btnSubmit.textContent = "✓ Lab Score Recorded (10/10)";
      btnSubmit.classList.add('bg-emerald-700', 'pointer-events-none');
    }
    const btnViewCert = document.getElementById('btn-view-certificate');
    if (btnViewCert) {
      btnViewCert.classList.remove('hidden');
      btnViewCert.onclick = () => {
        if (window.labEngine) window.labEngine.openCertificateModal();
      };
    }
  }

  sanitizePayload(val) {
    if (val === undefined) return null;
    if (val === null || typeof val !== 'object') return val;
    if (Array.isArray(val)) return val.map(item => this.sanitizePayload(item));
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = v === undefined ? null : this.sanitizePayload(v);
    }
    return out;
  }

  async ensureMetadata(db) {
    // Only teacher accounts have write permission to root collections in firestore.rules
    if (!this.isTeacher()) return;
    try {
      await db.collection('student_results').doc(ASSIGNMENT_ID).set({
        assignment_id: ASSIGNMENT_ID,
        title: "Modified Atwood Machine: Hall's Carriage Lab",
        topic: "Newton's Second Law (Mass vs. Acceleration)",
        max_score: 10,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      await db.collection('assignment_registry').doc(ASSIGNMENT_ID).set({
        assignment_id: ASSIGNMENT_ID,
        title: "Modified Atwood Machine: Hall's Carriage Lab",
        points: 10,
        topic: "Unit 2: Motion & Newton's Laws",
        url: "https://rrmudry.github.io/Unit_2/halls_carriage_lab/index.html",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("Non-blocking metadata write note:", err);
    }
  }

  autoSaveDraft(draftData) {
    if (!this.studentId || typeof firebase === 'undefined' || !firebase.firestore) return;
    const saveDot = document.getElementById('save-status-dot');
    const saveText = document.getElementById('save-status-text');
    if (saveDot) saveDot.className = 'w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse';
    if (saveText) saveText.textContent = 'Saving...';

    const db = firebase.firestore();
    const docRef = db.collection('student_results')
                     .doc(ASSIGNMENT_ID)
                     .collection('students')
                     .doc(this.studentId);

    const safePeriod = this.classPeriod !== undefined && this.classPeriod !== null ? this.classPeriod : null;

    const payload = this.sanitizePayload({
      student_id: this.studentId,
      student_name: this.studentName || this.studentId,
      class_period: safePeriod,
      period: safePeriod,
      email: (this.currentUser && this.currentUser.email) || null,
      labReport: draftData,
      lastDraftSavedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    docRef.set(payload, { merge: true }).then(() => {
      if (saveDot) saveDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-400';
      if (saveText) saveText.textContent = 'Saved to Cloud';
    }).catch(err => {
      console.warn("Auto-save draft error:", err);
      if (saveDot) saveDot.className = 'w-1.5 h-1.5 rounded-full bg-rose-400';
      if (saveText) saveText.textContent = 'Local Only';
    });
  }

  async submitLabGrade(labReport) {
    if (!this.currentUser) {
      alert("Please sign in with your school Google account before submitting your lab score.");
      this.signIn();
      return false;
    }

    const db = firebase.firestore();
    const safePeriod = this.classPeriod !== undefined && this.classPeriod !== null ? this.classPeriod : null;

    try {
      // 1. Metadata check (non-blocking, teacher only)
      await this.ensureMetadata(db);

      // 2. Write student result subcollection
      const studentDocRef = db.collection('student_results')
                              .doc(ASSIGNMENT_ID)
                              .collection('students')
                              .doc(this.studentId);

      const existingDoc = await studentDocRef.get();
      const existingScore = existingDoc.exists ? (existingDoc.data().score || 0) : 0;
      const newScore = 100; // 10/10 points = 100%

      const studentPayload = this.sanitizePayload({
        student_id: this.studentId,
        student_name: this.studentName || this.studentId,
        student_email: (this.currentUser && this.currentUser.email) || null,
        email: (this.currentUser && this.currentUser.email) || null,
        class_period: safePeriod,
        period: safePeriod,
        score: Math.max(existingScore, newScore),
        rawPoints: 10,
        maxPoints: 10,
        percentage: Math.max(existingScore, newScore),
        isCompleted: true,
        submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
        labReport: labReport
      });

      await studentDocRef.set(studentPayload, { merge: true });

      this.isCompleted = true;
      this.setSubmittedStatusUI();
      return true;
    } catch (err) {
      console.error("Error submitting lab score:", err);
      alert("There was an error saving your score to the cloud. Your answers remain saved locally. Please try again.");
      return false;
    }
  }
}

window.labAuth = new LabAuthManager();
