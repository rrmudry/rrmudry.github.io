/**
 * AuthManager - Google Sign-In & Gradebook Sync for Position vs. Time Graphing Studio
 * Restricts access to Orange USD accounts and submits lab results to Firestore.
 */
const ASSIGNMENT_ID = "Position_Time_Graph_Studio";

class StudioAuthManager {
  constructor() {
    this.currentUser = null;
    this.studentId = null;
    this.studentName = "Student Investigator";
    this.previousHighScore = 0;
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
      const gateModal = document.getElementById('loginGateModal');
      const gateError = document.getElementById('loginGateError');

      if (user) {
        const email = (user.email || "").toLowerCase();
        // Domain enforcement: @orangeusd.org or teacher account
        if (email.endsWith('@orangeusd.org') || email === 'ryan.mudry@gmail.com' || email === 'rmudry@orangeusd.org') {
          this.currentUser = user;
          this.studentId = email.split('@')[0];
          this.studentName = user.displayName || this.studentId;
          this.updateUserUI(true);

          if (gateModal) gateModal.classList.add('hidden');
          if (gateError) gateError.classList.add('hidden');

          // Calibrate student-specific variants and restore progress
          if (window.studioApp) {
            window.studioApp.onStudentLoggedIn(this.studentId);
          }

          this.loadStudentResults();
        } else {
          if (gateError) {
            gateError.textContent = `Access restricted: ${email} is not an official school account. Please sign in with your @orangeusd.org Google account.`;
            gateError.classList.remove('hidden');
          } else {
            alert('Access restricted. Please sign in using your official school @orangeusd.org account.');
          }
          if (gateModal) gateModal.classList.remove('hidden');
          firebase.auth().signOut();
        }
      } else {
        this.currentUser = null;
        this.studentId = null;
        this.updateUserUI(false);
        if (gateModal) gateModal.classList.remove('hidden');
      }
    });

    // Handle redirect result if popup fell back to redirect
    firebase.auth().getRedirectResult().then((result) => {
      if (result && result.user) {
        console.log("Redirect login successful:", result.user.email);
      }
    }).catch((err) => {
      console.error("Redirect sign-in error:", err);
      const gateError = document.getElementById('loginGateError');
      if (gateError) {
        gateError.textContent = `Sign-in error: ${err.message || err.code}`;
        gateError.classList.remove('hidden');
      }
    });

    const loginBtn = document.getElementById('btn-google-login');
    if (loginBtn) {
      loginBtn.onclick = () => this.signIn();
    }

    const gateLoginBtn = document.getElementById('btn-gate-google-login');
    if (gateLoginBtn) {
      gateLoginBtn.onclick = () => this.signIn();
    }
  }

  signIn() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      alert("Firebase Authentication service is still loading. Please try again in a moment.");
      return;
    }
    const gateError = document.getElementById('loginGateError');
    if (gateError) gateError.classList.add('hidden');

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ hd: 'orangeusd.org', prompt: 'select_account' });
    firebase.auth().signInWithPopup(provider).catch((err) => {
      console.error("Sign-in popup error:", err);
      if (err.code === 'auth/popup-blocked') {
        alert("Sign-in popup was blocked by your browser. Redirecting to Google Sign-In...");
        firebase.auth().signInWithRedirect(provider);
      } else if (err.code !== 'auth/popup-closed-by-user') {
        if (gateError) {
          gateError.textContent = `Google Sign-In error: ${err.message || err.code}`;
          gateError.classList.remove('hidden');
        } else {
          alert("Google Sign-In error: " + (err.message || err.code));
        }
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
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-lime-500/30 text-xs text-slate-200">
          <span class="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse"></span>
          <span class="font-bold max-w-[130px] truncate" title="${this.studentName}">${this.studentName}</span>
          <button id="btn-sign-out" class="text-slate-400 hover:text-rose-400 ml-1 font-bold text-sm" title="Sign Out">&times;</button>
        </div>
      `;
      const signOutBtn = document.getElementById('btn-sign-out');
      if (signOutBtn) {
        signOutBtn.onclick = () => this.signOut();
      }
    } else {
      container.innerHTML = `
        <button id="btn-google-login" class="px-3 py-1.5 rounded-xl bg-[#ccff00] hover:bg-lime-300 text-slate-950 text-xs font-bold font-mono transition-all shadow-[0_0_12px_rgba(204,255,0,0.3)] active:scale-95 flex items-center gap-1.5">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-3.5 h-3.5 bg-white rounded-full p-0.5" alt="Google">
          <span>Sign In</span>
        </button>
      `;
      const loginBtn = document.getElementById('btn-google-login');
      if (loginBtn) {
        loginBtn.onclick = () => this.signIn();
      }
    }

    // Update certificate name if open
    const certStudentEl = document.getElementById('certStudentName');
    if (certStudentEl) {
      certStudentEl.textContent = this.studentName;
    }
  }

  async ensureParentDocument(db) {
    try {
      const parentRef = db.collection('student_results').doc(ASSIGNMENT_ID);
      await parentRef.set({
        assignment_name: "Position vs. Time Graphing Studio",
        unit: "Unit 2: 1D Kinematics & Newton's Laws",
        standards: ["HS-PS2-1"],
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn("Parent document metadata update note:", e);
    }
  }

  async loadStudentResults() {
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
        this.previousHighScore = data.score || 0;
        if (data.score >= 100) {
          this.isCompleted = true;
        }
        if (window.studioApp && data.studioState) {
          window.studioApp.restoreSavedState(data.studioState, data.score);
        }
        this.updateSaveIndicator(`High Score: ${this.previousHighScore}%`);
      }
    } catch (e) {
      console.warn("Could not load student results:", e);
    }
  }

  updateSaveIndicator(statusText) {
    let indicator = document.getElementById('firestore-save-indicator');
    if (!indicator) {
      const container = document.getElementById('auth-user-status');
      if (container && container.parentElement) {
        indicator = document.createElement('span');
        indicator.id = 'firestore-save-indicator';
        indicator.className = 'text-[11px] font-mono text-lime-400 font-semibold transition-opacity hidden sm:inline-block mr-2';
        container.parentElement.insertBefore(indicator, container);
      }
    }
    if (indicator) {
      indicator.textContent = statusText;
      indicator.style.opacity = '1';
      setTimeout(() => {
        if (indicator) indicator.style.opacity = '0.7';
      }, 3500);
    }
  }

  async saveStudioGrade(scorePercentage, studioState) {
    const percentage = Math.max(0, Math.min(100, Math.round(scorePercentage)));

    if (!this.studentId) {
      // Local storage fallback for guest/practice mode
      localStorage.setItem(`pvt_studio_guest_score`, percentage);
      localStorage.setItem(`pvt_studio_guest_state`, JSON.stringify(studioState));
      this.updateSaveIndicator(`Saved locally (${percentage}%)`);
      alert(`Score of ${percentage}% saved locally. Please sign in with your @orangeusd.org account to sync your grade to the official gradebook!`);
      this.signIn();
      return { success: true, isGuest: true, score: percentage };
    }

    if (typeof firebase === 'undefined' || !firebase.firestore) {
      localStorage.setItem(`pvt_studio_${this.studentId}`, JSON.stringify({ score: percentage, studioState }));
      return { success: true, localOnly: true, score: percentage };
    }

    try {
      const db = firebase.firestore();
      await this.ensureParentDocument(db);

      const docRef = db.collection('student_results')
                       .doc(ASSIGNMENT_ID)
                       .collection('students')
                       .doc(this.studentId);

      const existingDoc = await docRef.get();
      let bestScore = percentage;
      if (existingDoc.exists) {
        const existingScore = existingDoc.data().score || 0;
        bestScore = Math.max(existingScore, percentage);
      }

      const payload = {
        student_id: this.studentId,
        student_name: this.studentName,
        email: this.currentUser ? this.currentUser.email : "",
        score: bestScore,
        last_attempt_score: percentage,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        isCompleted: bestScore >= 100,
        studioState: studioState
      };

      await docRef.set(payload, { merge: true });
      this.previousHighScore = bestScore;
      this.updateSaveIndicator(`Grade Synced: ${bestScore}% ✓`);
      return { success: true, score: bestScore, newRecord: percentage >= bestScore };
    } catch (e) {
      console.error("Firestore grade sync error:", e);
      localStorage.setItem(`pvt_studio_${this.studentId}`, JSON.stringify({ score: percentage, studioState }));
      this.updateSaveIndicator("Saved locally (Offline)");
      return { success: false, error: e };
    }
  }
}

window.studioAuth = new StudioAuthManager();
