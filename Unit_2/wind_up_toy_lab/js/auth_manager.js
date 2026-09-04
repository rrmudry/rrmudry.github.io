/**
 * AuthManager - Google Sign-In & Gradebook Sync for Wind-Up Toy Speed Lab
 * Restricts access to Orange USD accounts and submits lab results to Firestore.
 */
const ASSIGNMENT_ID = "Wind_Up_Toy_Speed_Lab";

class LabAuthManager {
  constructor() {
    this.currentUser = null;
    this.studentId = null;
    this.studentName = "Student Investigator";
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

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        const email = (user.email || "").toLowerCase();
        // Domain enforcement: @orangeusd.org or teacher account
        if (email.endsWith('@orangeusd.org') || email === 'ryan.mudry@gmail.com') {
          this.currentUser = user;
          this.studentId = email.split('@')[0];
          this.studentName = user.displayName || this.studentId;
          this.updateUserUI(true);
          this.loadStudentLabData();
          if (window.labEngine && window.labEngine.currentStep === 1) {
            window.labEngine.renderStep1DataCollection();
          }
        } else {
          alert('Access restricted. Please sign in using your official school @orangeusd.org account.');
          firebase.auth().signOut();
        }
      } else {
        this.currentUser = null;
        this.studentId = null;
        this.updateUserUI(false);
        if (window.labEngine && window.labEngine.currentStep === 1) {
          window.labEngine.renderStep1DataCollection();
        }
      }
    });

    // Handle redirect result if popup fell back to redirect
    firebase.auth().getRedirectResult().then((result) => {
      if (result && result.user) {
        console.log("Redirect login successful:", result.user.email);
      }
    }).catch((err) => {
      console.error("Redirect sign-in error:", err);
    });

    const loginBtn = document.getElementById('btn-google-login');
    if (loginBtn) {
      loginBtn.onclick = () => this.signIn();
    }
  }

  signIn() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      alert("Firebase Authentication service is still loading. Please try again in a moment.");
      return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ hd: 'orangeusd.org', prompt: 'select_account' });
    firebase.auth().signInWithPopup(provider).catch((err) => {
      console.error("Sign-in popup error:", err);
      if (err.code === 'auth/popup-blocked') {
        alert("Sign-in popup was blocked by your browser. Please allow popups for this site or use redirect.");
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
      container.innerHTML = `
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/15 text-xs text-slate-800 dark:text-slate-200">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="font-bold max-w-[130px] truncate" title="${this.studentName}">${this.studentName}</span>
          <button id="btn-sign-out" class="text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 ml-1 font-bold text-xs" title="Sign Out">&times;</button>
        </div>
      `;
      const signOutBtn = document.getElementById('btn-sign-out');
      if (signOutBtn) {
        signOutBtn.onclick = () => this.signOut();
      }
    } else {
      container.innerHTML = `
        <button id="btn-google-login" class="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-3.5 h-3.5 bg-white rounded-full p-0.5" alt="Google">
          <span>Sign In</span>
        </button>
      `;
      const loginBtn = document.getElementById('btn-google-login');
      if (loginBtn) {
        loginBtn.onclick = () => this.signIn();
      }
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
        if (data.isCompleted) {
          this.isCompleted = true;
          const statusBadge = document.getElementById('badge-lab-status');
          if (statusBadge) {
            statusBadge.textContent = "Completed ✓";
            statusBadge.classList.remove('bg-amber-500/20', 'text-amber-300');
            statusBadge.classList.add('bg-emerald-500/20', 'text-emerald-300', 'border-emerald-500/30');
          }
        }
        if (window.labEngine && data.labState) {
          window.labEngine.restoreSavedState(data.labState);
        }
      }
    } catch (e) {
      console.warn("Could not load student lab data:", e);
    }
  }

  async saveLabResults(payload) {
    if (!this.studentId) {
      alert("Please sign in with your @orangeusd.org Google account before submitting your lab!");
      this.signIn();
      return false;
    }

    if (typeof firebase === 'undefined' || !firebase.firestore) {
      console.warn("Firestore not available; saving to localStorage.");
      localStorage.setItem(`lab_results_${this.studentId}`, JSON.stringify(payload));
      return true;
    }

    try {
      const db = firebase.firestore();
      const docRef = db.collection('student_results')
                       .doc(ASSIGNMENT_ID)
                       .collection('students')
                       .doc(this.studentId);

      const dataToSave = {
        studentId: this.studentId,
        studentName: this.studentName,
        email: this.currentUser ? this.currentUser.email : "",
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        isCompleted: true,
        score: 100,
        ...payload
      };

      await docRef.set(dataToSave, { merge: true });
      this.isCompleted = true;
      return true;
    } catch (e) {
      console.error("Firestore save error:", e);
      localStorage.setItem(`lab_results_${this.studentId}`, JSON.stringify(payload));
      return true;
    }
  }
}

window.labAuth = new LabAuthManager();
