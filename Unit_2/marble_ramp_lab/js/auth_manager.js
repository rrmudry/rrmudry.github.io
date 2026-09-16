/**
 * AuthManager - Google Sign-In & Gradebook Sync for Marble Ramp Motion & Graphing Lab
 * Restricts access to Orange USD accounts and submits lab results to Firestore.
 */
const ASSIGNMENT_ID = "Marble_Ramp_Lab";

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

          this.loadStudentLabData();
          if (window.labEngine && window.labEngine.currentStep === 2) {
            window.labEngine.renderStep2DataCollection();
          }
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
        if (window.labEngine && window.labEngine.currentStep === 2) {
          window.labEngine.renderStep2DataCollection();
        }
      }
    });

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
            statusBadge.classList.remove('hidden');
            statusBadge.innerHTML = `✓ Completed (${data.score || 100}%)`;
          }
        }
        if (window.labEngine && typeof window.labEngine.loadExternalState === 'function') {
          window.labEngine.loadExternalState(data);
        }
      }
    } catch (e) {
      console.warn("Unable to load cloud student lab data:", e);
    }
  }

  async ensureParentDocument(db) {
    try {
      const parentRef = db.collection('student_results').doc(ASSIGNMENT_ID);
      await parentRef.set({
        assignment_name: "Marble Ramp Motion & Graphing Lab",
        unit: "Unit 2: Linear Motion & Forces",
        standards: ["HS-PS2-1"],
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn("Parent document metadata update note:", e);
    }
  }

  /**
   * autoSaveDraft - called on every meaningful state change (trial capture,
   * calculation verification, graph point placement, CER text edits).
   * Writes incremental progress to Firestore so student work is never lost.
   */
  async autoSaveDraft(draftData) {
    if (!this.studentId) {
      // Not logged in — persist locally only
      try {
        localStorage.setItem('marble_ramp_draft_guest', JSON.stringify(draftData));
      } catch (e) {
        console.warn("Draft local save error:", e);
      }
      return;
    }

    try {
      // Local backup alongside Firestore
      localStorage.setItem(`marble_ramp_draft_${this.studentId}`, JSON.stringify(draftData));

      if (typeof firebase !== 'undefined' && firebase.firestore) {
        const db = firebase.firestore();
        await this.ensureParentDocument(db);

        const docRef = db.collection('student_results')
                         .doc(ASSIGNMENT_ID)
                         .collection('students')
                         .doc(this.studentId);

        const draftPayload = {
          studentId: this.studentId,
          studentName: this.studentName,
          email: this.currentUser ? this.currentUser.email : "",
          last_saved_at: firebase.firestore.FieldValue.serverTimestamp(),
          isCompleted: this.isCompleted || false,
          labState: draftData
        };

        // Lift key student fields to top level for instant gradebook & console preview
        if (draftData.levels) {
          draftPayload.levels = draftData.levels.map(lvl => ({
            id: lvl.id,
            label: lvl.label,
            stackHeightCm: lvl.stackHeightCm,
            trials: lvl.trials,
            avgTime: lvl.studentAvgTime || lvl.correctAvgTime || null,
            speedCmPerSec: lvl.studentSpeed || lvl.correctSpeed || null,
            avgVerified: !!lvl.avgTimeVerified,
            speedVerified: !!lvl.speedVerified
          }));
        }
        if (draftData.cer) {
          draftPayload.cer = draftData.cer;
        }
        if (draftData.currentStep) {
          draftPayload.currentStep = draftData.currentStep;
        }
        if (draftData.distanceCm) {
          draftPayload.distanceCm = draftData.distanceCm;
        }

        await docRef.set(draftPayload, { merge: true });
        this.updateSaveIndicator("Saved ✓");
      }
    } catch (e) {
      console.warn("Autosave draft to Firestore failed:", e);
      this.updateSaveIndicator("Saved locally");
    }
  }

  updateSaveIndicator(statusText) {
    let indicator = document.getElementById('firestore-save-indicator');
    if (!indicator) {
      const container = document.getElementById('auth-user-status');
      if (container && container.parentElement) {
        indicator = document.createElement('span');
        indicator.id = 'firestore-save-indicator';
        indicator.className = 'text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold transition-opacity';
        container.parentElement.insertBefore(indicator, container);
      }
    }
    if (indicator) {
      indicator.textContent = statusText;
      indicator.style.opacity = '1';
      setTimeout(() => {
        if (indicator) indicator.style.opacity = '0.6';
      }, 2500);
    }
  }

  async saveLabProgress(labData, isFinalSubmission = false) {
    if (!this.studentId) {
      alert("Please sign in with your @orangeusd.org Google account before submitting your lab!");
      this.signIn();
      return false;
    }

    if (typeof firebase === 'undefined' || !firebase.firestore) {
      console.warn("Firestore not available; saving to localStorage.");
      localStorage.setItem(`marble_ramp_results_${this.studentId}`, JSON.stringify(labData));
      return true;
    }

    try {
      const db = firebase.firestore();
      await this.ensureParentDocument(db);

      const studentDocRef = db.collection('student_results')
                              .doc(ASSIGNMENT_ID)
                              .collection('students')
                              .doc(this.studentId);

      const payload = {
        studentId: this.studentId,
        studentName: this.studentName,
        email: this.currentUser ? this.currentUser.email : "",
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        last_saved_at: firebase.firestore.FieldValue.serverTimestamp(),
        isCompleted: true,
        score: 100,
        distanceCm: labData.distanceCm || 60.0,
        rampLengthCm: labData.rampLengthCm || 30.0,
        levels: labData.levels || [],
        cer: labData.cer || {},
        labState: labData
      };

      await studentDocRef.set(payload, { merge: true });
      this.isCompleted = true;
      this.updateSaveIndicator("Submitted ✓");
      console.log("Final lab results saved to Firestore.");
      return true;
    } catch (err) {
      console.error("Error saving lab progress to Firestore:", err);
      localStorage.setItem(`marble_ramp_results_${this.studentId}`, JSON.stringify(labData));
      return true;
    }
  }
}

window.labAuth = new LabAuthManager();
