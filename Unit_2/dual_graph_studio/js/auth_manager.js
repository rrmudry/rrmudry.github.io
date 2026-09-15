/**
 * AuthManager - Google Sign-In & Gradebook Sync for Dual-Graph Motion Studio
 * Restricts access to Orange USD accounts and submits lab results to Firestore.
 */
const ASSIGNMENT_ID = "Dual_Graph_Studio";

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
          if (window.dualStudioApp) {
            window.dualStudioApp.onStudentLoggedIn(this.studentId);
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

    this.updateSaveIndicator("Loading Progress...", 'syncing');

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

        // Restore saved studio state
        if (window.studioApp && data.studioState) {
          window.studioApp.restoreSavedState(data.studioState, data.score);
        }
        this.updateSaveIndicator(`High Score: ${this.previousHighScore}%`, 'synced');
      } else {
        // First time on Firestore: check if there is local guest state to import
        const guestStateRaw = localStorage.getItem('pvt_studio_guest_state');
        const guestScore = parseInt(localStorage.getItem('pvt_studio_guest_score') || '0', 10);
        if (guestStateRaw && window.studioApp) {
          try {
            const guestState = JSON.parse(guestStateRaw);
            if (guestState) {
              window.studioApp.restoreSavedState(guestState, guestScore);
              // Immediately back up this imported progress to Firestore
              const total =
                (guestState.levelScores?.m1 || 0) +
                (guestState.levelScores?.m2 || 0) +
                (guestState.levelScores?.m3 || 0) +
                (guestState.levelScores?.m4 || 0) +
                (guestState.levelScores?.m5 || 0) +
                (guestState.levelScores?.m6 || 0);
              this.saveStudioGrade(total, guestState, true);
            }
          } catch (e) {
            console.warn("Guest state migration note:", e);
          }
        }
        this.updateSaveIndicator("Ready & Synced", 'synced');
      }
    } catch (e) {
      console.warn("Could not load student results:", e);
      // Fallback to local storage
      const localBackupRaw = localStorage.getItem(`pvt_studio_${this.studentId}`);
      if (localBackupRaw && window.studioApp) {
        try {
          const localData = JSON.parse(localBackupRaw);
          if (localData && localData.studioState) {
            window.studioApp.restoreSavedState(localData.studioState, localData.score);
          }
        } catch (err) {}
      }
      this.updateSaveIndicator("Offline Mode", 'error');
    }
  }

  updateSaveIndicator(statusText, state = 'synced') {
    const indicator = document.getElementById('firestore-save-indicator');
    const dot = document.getElementById('syncStatusDot');
    const txt = document.getElementById('syncStatusText');

    if (!indicator || !dot || !txt) return;

    indicator.classList.remove('hidden');
    txt.textContent = statusText;

    if (state === 'syncing') {
      dot.className = 'w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping';
      indicator.className = 'hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-950/40 border border-amber-500/40 font-mono text-[10px] text-amber-300 transition-all shadow-sm';
    } else if (state === 'synced') {
      dot.className = 'w-1.5 h-1.5 rounded-full bg-[#ccff00]';
      indicator.className = 'hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-lime-950/60 border border-lime-500/40 font-mono text-[10px] text-lime-300 transition-all shadow-sm';
    } else if (state === 'error') {
      dot.className = 'w-1.5 h-1.5 rounded-full bg-rose-400';
      indicator.className = 'hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-950/40 border border-rose-500/40 font-mono text-[10px] text-rose-300 transition-all shadow-sm';
    } else {
      dot.className = 'w-1.5 h-1.5 rounded-full bg-slate-400';
      indicator.className = 'hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-700/60 font-mono text-[10px] text-slate-300 transition-all shadow-sm';
    }
  }

  async saveStudioGrade(scorePercentage, studioState, isAutosave = false) {
    const percentage = Math.max(0, Math.min(100, Math.round(scorePercentage)));

    if (!this.studentId) {
      // Local storage fallback for guest mode
      try {
        localStorage.setItem(`pvt_studio_guest_score`, percentage);
        localStorage.setItem(`pvt_studio_guest_state`, JSON.stringify(studioState));
      } catch (e) {
        console.warn("Local storage write error:", e);
      }
      this.updateSaveIndicator(`Local ${percentage}%`, 'idle');
      if (!isAutosave) {
        alert(`Score of ${percentage}% saved locally. Please sign in with your @orangeusd.org account to sync your grade to the official gradebook!`);
        this.signIn();
      }
      return { success: true, isGuest: true, score: percentage };
    }

    this.updateSaveIndicator("Backing up...", 'syncing');

    if (typeof firebase === 'undefined' || !firebase.firestore) {
      localStorage.setItem(`pvt_studio_${this.studentId}`, JSON.stringify({ score: percentage, studioState }));
      this.updateSaveIndicator("Offline Backup", 'idle');
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
      this.updateSaveIndicator("Cloud Synced ✓", 'synced');
      return { success: true, score: bestScore, newRecord: percentage >= bestScore };
    } catch (e) {
      console.error("Firestore grade sync error:", e);
      try {
        localStorage.setItem(`pvt_studio_${this.studentId}`, JSON.stringify({ score: percentage, studioState }));
      } catch (err) {}
      this.updateSaveIndicator("Saved Offline", 'error');
      return { success: false, error: e };
    }
  }
}

window.studioAuth = new StudioAuthManager();
