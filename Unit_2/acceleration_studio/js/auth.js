/**
 * Acceleration Rate & Sign Studio - Authentication & Cloud Grading Manager
 * Handles Google Sign-In domain filtering (@orangeusd.org), Guest Mode,
 * Firestore progress backup/restoration, and gradebook synchronization.
 */

const ASSIGNMENT_ID = 'unit2_day16_acceleration_studio';
const ASSIGNMENT_NAME = 'Unit 2 Day 16: Acceleration Rate & Sign Studio';

class AuthManager {
  constructor() {
    this.user = null;
    this.studentId = null;
    this.studentName = 'Guest Physicist';
    this.highestScore = 0;
    this.isAuthorized = false;
    this.isGuest = false;
    this.isSigningIn = false;
    this.pendingRestoreState = null;
    this.saveTimeout = null;

    // Check if guest mode was already selected for this session
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('acceleration_guest_mode') === 'true') {
      this.isGuest = true;
    }

    this.init();
  }

  init() {
    // Setup login gate button handlers once DOM is interactive
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupGateButtons());
    } else {
      this.setupGateButtons();
    }

    if (typeof firebase === 'undefined' || !firebase.auth) {
      console.warn("Firebase SDK not loaded. Operating in offline/guest mode.");
      this.isGuest = true;
      this.hideLoginModal();
      this.updateUI();
      return;
    }

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        const email = (user.email || '').toLowerCase();
        // Strict domain enforcement: @orangeusd.org (or approved instructor overrides)
        const isOUSD = email.endsWith('@orangeusd.org') || email.endsWith('@student.orangeusd.org');
        const isInstructor = email === 'rmudry@orangeusd.org' || email === 'ryan.mudry@gmail.com';

        if (isOUSD || isInstructor) {
          this.user = user;
          this.studentId = email.split('@')[0];
          this.studentName = user.displayName || this.studentId;
          this.isAuthorized = true;
          this.isGuest = false;
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('acceleration_guest_mode');
          }
          this.hideLoginModal();
          this.updateUI();
          this.loadStudentProgress();
        } else {
          this.showDomainError(email);
          this.user = null;
          this.studentId = null;
          this.isAuthorized = false;
          firebase.auth().signOut();
        }
      } else {
        this.user = null;
        this.studentId = null;
        this.studentName = 'Guest Physicist';
        this.isAuthorized = false;

        if (this.isGuest) {
          this.hideLoginModal();
        } else {
          this.showLoginModal();
        }
        this.updateUI();
      }
    });

    // Handle redirect result if signInWithPopup fell back to redirect (HTTP/HTTPS only)
    if (typeof location !== 'undefined' && location.protocol.startsWith('http')) {
      firebase.auth().getRedirectResult().then((result) => {
        if (result && result.user) {
          console.log("Redirect login successful:", result.user.email);
        }
      }).catch((err) => {
        console.error("Redirect sign-in error:", err);
        const gateError = document.getElementById('loginGateError');
        if (gateError) {
          gateError.textContent = `Sign-in error: ${err.message || err.code}`;
          gateError.style.display = 'block';
        }
      });
    }
  }

  setupGateButtons() {
    const btnGoogle = document.getElementById('btnGateGoogleLogin');
    const btnGuest = document.getElementById('btnGateGuestLogin');

    if (btnGoogle) {
      btnGoogle.onclick = () => this.signIn();
    }
    if (btnGuest) {
      btnGuest.onclick = () => this.continueAsGuest();
    }

    // If already in guest mode or authorized, keep modal closed
    if (this.isGuest || this.isAuthorized) {
      this.hideLoginModal();
    } else if (!this.user) {
      this.showLoginModal();
    }
  }

  showLoginModal() {
    const modal = document.getElementById('loginGateModal');
    if (modal) {
      modal.classList.add('active');
    }
  }

  hideLoginModal() {
    const modal = document.getElementById('loginGateModal');
    if (modal) {
      modal.classList.remove('active');
    }
    const errBox = document.getElementById('loginGateError');
    if (errBox) {
      errBox.style.display = 'none';
      errBox.textContent = '';
    }
  }

  showDomainError(email) {
    const errBox = document.getElementById('loginGateError');
    if (errBox) {
      errBox.innerHTML = `<strong>Access Denied:</strong> ${email} is not an authorized school account. Please sign in using your official <strong>@orangeusd.org</strong> account.`;
      errBox.style.display = 'block';
    } else {
      alert(`Access Denied: ${email} is not an official school account. Please sign in with your @orangeusd.org Google account.`);
    }
    this.showLoginModal();
  }

  continueAsGuest() {
    this.isGuest = true;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('acceleration_guest_mode', 'true');
    }
    this.hideLoginModal();
    this.updateUI();

    if (window.app && window.app.showGlobalToast) {
      window.app.showGlobalToast('👤 Playing in Guest Mode. Progress will NOT be saved to the gradebook.');
    }
  }

  signIn() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      alert("Firebase service is offline. Please try again later.");
      return;
    }
    const errBox = document.getElementById('loginGateError');
    if (errBox) {
      errBox.style.display = 'none';
      errBox.textContent = '';
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ hd: 'orangeusd.org', prompt: 'select_account' });

    firebase.auth().signInWithPopup(provider).catch((err) => {
      console.warn("Popup blocked or failed, falling back to redirect:", err);
      if (err.code === 'auth/popup-blocked') {
        firebase.auth().signInWithRedirect(provider);
      } else if (err.code !== 'auth/popup-closed-by-user') {
        if (errBox) {
          errBox.textContent = `Sign-in error: ${err.message || err.code}`;
          errBox.style.display = 'block';
        }
      }
    });
  }

  signOut() {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('acceleration_guest_mode');
    }
    this.isGuest = false;
    this.isAuthorized = false;
    this.user = null;
    this.studentId = null;
    this.studentName = 'Guest Physicist';
    this.highestScore = 0;

    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().signOut().then(() => {
        this.showLoginModal();
        this.updateUI();
      });
    } else {
      this.showLoginModal();
      this.updateUI();
    }
  }

  async loadStudentProgress() {
    if (!this.studentId || typeof firebase === 'undefined' || !firebase.firestore) return;

    this.setSyncStatus('saving');

    try {
      const db = firebase.firestore();
      const docRef = db.collection('student_results')
                       .doc(ASSIGNMENT_ID)
                       .collection('students')
                       .doc(this.studentId);
      const snap = await docRef.get();

      if (snap.exists) {
        const data = snap.data();
        this.highestScore = data.score || 0;
        console.log(`Loaded student cloud progress: High Score ${this.highestScore}%, student ${this.studentId}`);

        if (data.studioState) {
          if (window.app && window.app.challenges) {
            window.app.challenges.restoreState(data.studioState, this.highestScore);
          } else {
            this.pendingRestoreState = { studioState: data.studioState, score: this.highestScore };
          }
        }

        if (window.app && window.app.showGlobalToast) {
          const firstName = this.studentName.split(' ')[0];
          window.app.showGlobalToast(`👋 Welcome back, ${firstName}! Progress restored (${this.highestScore} pts).`);
        }
        this.setSyncStatus('synced');
      } else {
        // New student on Firestore: check if they have progress in the current session to backup
        if (window.app && window.app.challenges) {
          const currentState = window.app.challenges.getState();
          if (currentState && currentState.totalScore > 0) {
            await this.saveProgress(currentState);
          }
        }
        this.setSyncStatus('synced');
      }
      this.updateUI();
    } catch (e) {
      console.error("Failed to load student progress:", e);
      this.setSyncStatus('error');
    }
  }

  saveProgress(studioState) {
    // If user is guest, explicitly DO NOT save to Firestore
    if (this.isGuest || !this.isAuthorized || !this.studentId) {
      return;
    }

    if (typeof firebase === 'undefined' || !firebase.firestore) {
      return;
    }

    // Debounce rapid writes
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.setSyncStatus('saving');

    this.saveTimeout = setTimeout(async () => {
      try {
        const db = firebase.firestore();

        // 1. Ensure parent document exists for gradebook discovery (isolated try/catch so student doc write is never blocked)
        try {
          await db.collection('student_results').doc(ASSIGNMENT_ID).set({
            assignment_name: ASSIGNMENT_NAME,
            unit: 'Unit 2: Kinematics in 1D',
            standards: ['HS-PS2-1'],
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        } catch (parentErr) {
          console.warn("Parent document metadata update note:", parentErr.message);
        }

        // 2. Write student progress document
        const currentScore = studioState ? (studioState.totalScore || 0) : 0;
        if (currentScore > this.highestScore) {
          this.highestScore = currentScore;
        }

        const scoreRef = db.collection('student_results')
                           .doc(ASSIGNMENT_ID)
                           .collection('students')
                           .doc(this.studentId);

        await scoreRef.set({
          student_id: this.studentId,
          student_name: this.studentName,
          email: this.user ? this.user.email : '',
          score: this.highestScore,
          last_attempt_score: currentScore,
          isCompleted: this.highestScore >= 80,
          studioState: studioState || null,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`Saved student progress to Firestore: ${this.highestScore}%`);
        this.setSyncStatus('synced');
      } catch (err) {
        console.error("Firestore progress save error:", err);
        this.setSyncStatus('error');
      }
    }, 400);
  }

  setSyncStatus(status) {
    const badge = document.getElementById('syncStatusBadge');
    if (!badge) return;

    if (status === 'saving') {
      badge.textContent = '🔄 Saving...';
      badge.className = 'sync-status-badge saving';
      badge.title = 'Saving progress to Firestore';
    } else if (status === 'synced') {
      badge.textContent = '☁️ Synced';
      badge.className = 'sync-status-badge synced';
      badge.title = 'Progress backed up to Firestore';
    } else if (status === 'error') {
      badge.textContent = '⚠️ Local';
      badge.className = 'sync-status-badge error';
      badge.title = 'Sync paused or offline';
    }
  }

  updateUI() {
    const authBox = document.getElementById('authWidget');
    const certName = document.getElementById('certStudentName');
    if (certName) certName.innerText = this.studentName;

    if (!authBox) return;

    if (this.isAuthorized && this.user) {
      const displayName = this.studentName.split(' ')[0];
      authBox.innerHTML = `
        <img src="${this.user.photoURL || 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg'}" class="auth-avatar" alt="Avatar">
        <span class="auth-name" title="${this.user.email}">${displayName}</span>
        <span id="syncStatusBadge" class="sync-status-badge synced" title="Progress backed up to Firestore">☁️ Synced</span>
        <button id="btnSignOut" class="btn-tool" style="padding: 0.2rem 0.5rem; font-size: 0.72rem;">Sign Out</button>
      `;
      document.getElementById('btnSignOut')?.addEventListener('click', () => this.signOut());
    } else if (this.isGuest) {
      authBox.innerHTML = `
        <div class="guest-mode-pill" title="Guest Mode: Progress will NOT be saved">
          <span class="guest-dot"></span>
          <span>Guest Mode (Unsaved)</span>
        </div>
        <button id="btnSignInHeader" class="btn-tool" style="background: rgba(14, 165, 233, 0.2); border-color: rgba(56, 189, 248, 0.4); padding: 0.22rem 0.6rem; font-size: 0.75rem;">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width: 13px; height: 13px; background: white; border-radius: 50%; padding: 1px;" alt="Google">
          <span>Sign In</span>
        </button>
      `;
      document.getElementById('btnSignInHeader')?.addEventListener('click', () => this.signIn());
    } else {
      authBox.innerHTML = `
        <button id="btnSignInHeader" class="btn-tool" style="background: rgba(14, 165, 233, 0.2); border-color: rgba(56, 189, 248, 0.4); padding: 0.22rem 0.6rem; font-size: 0.75rem;">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width: 13px; height: 13px; background: white; border-radius: 50%; padding: 1px;" alt="Google">
          <span>Sign In</span>
        </button>
      `;
      document.getElementById('btnSignInHeader')?.addEventListener('click', () => this.signIn());
    }
  }
}

window.AuthManager = new AuthManager();
