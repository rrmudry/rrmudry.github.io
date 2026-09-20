/**
 * Rat Rod Racers - Google Authentication & Cloud Firestore Persistence
 * Backs up student bank cash, owned parts inventory, car customizer specs,
 * drag strip records, and dyno statistics to Cloud Firestore.
 */

const RAT_ROD_ASSIGNMENT_ID = "Rat_Rod_Racers";

const RAT_ROD_FIREBASE_CONFIG = {
  projectId: "site-6e500",
  appId: "1:591530758858:web:1996cdca7316ffc3781a33",
  storageBucket: "site-6e500.firebasestorage.app",
  apiKey: "AIzaSyAji2nTjD2dbmzgk8gySWCy-aiQyKvR1i4",
  authDomain: "site-6e500.firebaseapp.com",
  messagingSenderId: "591530758858"
};

class RatRodAuthManager {
  constructor(game) {
    this.game = game;
    this.currentUser = null;
    this.studentId = null;
    this.studentName = "Guest Racer";
    this.isSigningIn = false;
    this.autoSaveTimeout = null;
    this.isGuest = false;

    window.ratRodAuth = this;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.bindGateEvents());
    } else {
      this.bindGateEvents();
    }

    this.initFirebase();
  }

  bindGateEvents() {
    const btnSignIn = document.getElementById('btnGateSignIn');
    if (btnSignIn) {
      btnSignIn.onclick = () => this.signIn();
    }
    const btnGuest = document.getElementById('btnContinueGuest');
    if (btnGuest) {
      btnGuest.onclick = () => this.continueAsGuest();
    }
  }

  initFirebase() {
    if (typeof firebase === 'undefined') {
      console.warn("Firebase SDK not detected. Operating in local-only mode.");
      this.updateAuthUI();
      return;
    }

    if (!firebase.apps || !firebase.apps.length) {
      try {
        firebase.initializeApp(RAT_ROD_FIREBASE_CONFIG);
      } catch (e) {
        console.error("Firebase init error:", e);
      }
    }

    this.initAuth();
  }

  isAuthorizedEmail(email) {
    if (!email) return false;
    const lower = email.toLowerCase();
    return lower.endsWith('@orangeusd.org') || lower === 'ryan.mudry@gmail.com' || lower === 'rmudry@orangeusd.org';
  }

  initAuth() {
    if (!firebase.auth) return;

    firebase.auth().onAuthStateChanged(async (user) => {
      const gateModal = document.getElementById('loginGateModal');
      const gateError = document.getElementById('loginGateError');

      if (user) {
        const email = (user.email || "").toLowerCase();
        if (this.isAuthorizedEmail(email)) {
          this.currentUser = user;
          this.studentId = email.split('@')[0];
          this.studentName = user.displayName || this.studentId;
          this.isGuest = false;

          if (gateModal) gateModal.classList.add('hidden');
          if (gateError) gateError.classList.add('hidden');

          this.updateAuthUI();
          await this.loadStudentData();
        } else {
          if (gateError) {
            gateError.textContent = `Access restricted: ${email} is not an official school account. Please sign in with your @orangeusd.org Google account.`;
            gateError.classList.remove('hidden');
          } else {
            alert('Please sign in using your official school @orangeusd.org account.');
          }
          if (gateModal) gateModal.classList.remove('hidden');
          firebase.auth().signOut();
        }
      } else {
        this.currentUser = null;
        this.studentId = null;
        this.studentName = "Guest Racer";
        this.updateAuthUI();

        // Check if previously chosen guest mode in this session
        const isGuestSession = sessionStorage.getItem('ratrod_guest_mode') === 'true';
        if (isGuestSession) {
          this.isGuest = true;
          if (gateModal) gateModal.classList.add('hidden');
        } else if (gateModal) {
          gateModal.classList.remove('hidden');
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
      const gateError = document.getElementById('loginGateError');
      if (gateError) {
        gateError.textContent = `Sign-in error: ${err.message || err.code}`;
        gateError.classList.remove('hidden');
      }
    });
  }

  signIn() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      alert("Google Sign-In is initializing. Please try again in a moment.");
      return;
    }
    if (this.isSigningIn) return;
    this.isSigningIn = true;

    const gateError = document.getElementById('loginGateError');
    if (gateError) gateError.classList.add('hidden');

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ hd: 'orangeusd.org', prompt: 'select_account' });

    firebase.auth().signInWithPopup(provider)
      .catch((err) => {
        if (err.code === 'auth/cancelled-popup-request') return;
        console.error("Sign-in popup error:", err);
        if (err.code === 'auth/popup-blocked') {
          firebase.auth().signInWithRedirect(provider);
        } else if (err.code !== 'auth/popup-closed-by-user') {
          if (gateError) {
            gateError.textContent = `Sign-in error: ${err.message || err.code}`;
            gateError.classList.remove('hidden');
          } else {
            alert("Sign-in error: " + (err.message || err.code));
          }
        }
      })
      .finally(() => {
        setTimeout(() => {
          this.isSigningIn = false;
        }, 1000);
      });
  }

  signOut() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      sessionStorage.removeItem('ratrod_guest_mode');
      firebase.auth().signOut();
    }
  }

  continueAsGuest() {
    this.isGuest = true;
    sessionStorage.setItem('ratrod_guest_mode', 'true');
    const gateModal = document.getElementById('loginGateModal');
    if (gateModal) gateModal.classList.add('hidden');
    this.updateAuthUI();
  }

  updateAuthUI() {
    const container = document.getElementById('auth-user-status');
    if (!container) return;

    if (this.currentUser && this.studentId) {
      const photo = this.currentUser.photoURL;
      container.innerHTML = `
        <div class="auth-pill" title="Signed in as ${this.currentUser.email}">
          ${photo ? `<img src="${photo}" class="auth-avatar" alt="Avatar">` : `<span class="auth-icon">👤</span>`}
          <span class="auth-name">${this.studentName.split(' ')[0]}</span>
          <span id="cloud-sync-badge" class="sync-badge" title="Cloud status">☁️ Synced</span>
          <button id="btn-signout" class="btn btn-tiny" title="Sign Out">✕</button>
        </div>
      `;

      const signOutBtn = document.getElementById('btn-signout');
      if (signOutBtn) signOutBtn.onclick = () => this.signOut();
    } else {
      container.innerHTML = `
        <button id="btn-google-login" class="btn btn-login" title="Sign in with your school Google account to save progress">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="google-icon" alt="G">
          <span>Sign In</span>
        </button>
      `;
      const loginBtn = document.getElementById('btn-google-login');
      if (loginBtn) loginBtn.onclick = () => this.signIn();
    }
  }

  setSyncStatus(status) {
    const badge = document.getElementById('cloud-sync-badge');
    if (!badge) return;
    if (status === 'saving') {
      badge.textContent = '🔄 Saving...';
      badge.className = 'sync-badge sync-saving';
    } else if (status === 'synced') {
      badge.textContent = '☁️ Synced';
      badge.className = 'sync-badge sync-synced';
    } else if (status === 'error') {
      badge.textContent = '⚠️ Local Only';
      badge.className = 'sync-badge sync-error';
    }
  }

  async ensureParentDocument(db) {
    try {
      const parentRef = db.collection('student_results').doc(RAT_ROD_ASSIGNMENT_ID);
      await parentRef.set({
        assignment_name: "Rat Rod Racers - Physics Drag Strip & Dyno Lab",
        unit: "Unit 2: Linear Motion & Forces",
        standards: ["HS-PS2-1", "HS-PS2-2"],
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn("Parent document metadata update note:", e);
    }
  }

  // Load student progress from Cloud Firestore
  async loadStudentData() {
    if (!this.studentId || typeof firebase === 'undefined' || !firebase.firestore) return;

    this.setSyncStatus('saving');
    try {
      const db = firebase.firestore();
      const docRef = db.collection('student_results')
                       .doc(RAT_ROD_ASSIGNMENT_ID)
                       .collection('students')
                       .doc(this.studentId);

      const doc = await docRef.get();
      if (doc.exists) {
        const cloudData = doc.data();
        console.log("Loaded student cloud data for:", this.studentId, cloudData);

        // 1. Restore Inventory & Bank
        if (this.game && this.game.inventory) {
          this.game.inventory.loadFromCloud(cloudData);
        }

        // 2. Restore Player Car
        if (this.game && this.game.playerCar && cloudData.car) {
          if (cloudData.car.parts) this.game.playerCar.parts = cloudData.car.parts;
          if (cloudData.car.levels) this.game.playerCar.levels = cloudData.car.levels;
          if (cloudData.car.name) this.game.playerCar.name = cloudData.car.name;
          this.game.playerCar.driver = this.studentName;
          this.game.syncPlayerCarPhysics();
        }

        // 3. Restore Dyno Lab Stats
        if (this.game && this.game.challenges && typeof cloudData.dynoStreak === 'number') {
          this.game.challenges.streak = cloudData.dynoStreak;
        }

        // 4. Update Game Views
        if (this.game) {
          this.game.updateHUD();
          this.game.renderGarage();
        }

        this.setSyncStatus('synced');
      } else {
        // First-time player in cloud: save initial starter kit
        console.log("New student record in cloud. Initializing save for:", this.studentId);
        await this.autoSave(true);
      }
    } catch (e) {
      console.warn("Unable to load cloud student data:", e);
      this.setSyncStatus('error');
    }
  }

  // Auto-save student progress to Cloud Firestore (debounced or immediate)
  autoSave(immediate = false) {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }

    if (immediate) {
      return this._performSave();
    }

    this.setSyncStatus('saving');
    this.autoSaveTimeout = setTimeout(() => {
      this._performSave();
    }, 1200);
  }

  async _performSave() {
    if (!this.game) return;

    const inventory = this.game.inventory;
    const playerCar = this.game.playerCar;
    const challenges = this.game.challenges;

    // Compile payload
    const payload = {
      studentId: this.studentId || 'guest',
      studentName: this.studentName,
      email: this.currentUser ? this.currentUser.email : "",
      bankCash: inventory ? inventory.bankCash : 250,
      racesWon: inventory ? inventory.racesWon : 0,
      racesTotal: inventory ? inventory.racesTotal : 0,
      bestEt: inventory ? inventory.bestEt : null,
      bestTrapSpeed: inventory ? inventory.bestTrapSpeed : null,
      owned: inventory ? inventory.owned : {},
      car: playerCar ? {
        name: playerCar.name,
        parts: playerCar.parts,
        levels: playerCar.levels,
        mass: playerCar.mass,
        peakForce: playerCar.peakForce,
        mu: playerCar.mu,
        cdA: playerCar.cdA
      } : null,
      dynoStreak: challenges ? challenges.streak : 0,
      shareCode: playerCar ? playerCar.toShareCode() : "",
      last_saved_at: (typeof firebase !== 'undefined' && firebase.firestore)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date().toISOString()
    };

    // Always save locally with student key
    const localKey = this.studentId ? `rat_rod_save_${this.studentId}` : 'rat_rod_racers_v1';
    try {
      localStorage.setItem(localKey, JSON.stringify(payload));
    } catch (e) {
      console.warn("Local save error:", e);
    }

    // Save to Cloud Firestore if authenticated
    if (this.studentId && typeof firebase !== 'undefined' && firebase.firestore) {
      try {
        const db = firebase.firestore();
        await this.ensureParentDocument(db);

        const docRef = db.collection('student_results')
                         .doc(RAT_ROD_ASSIGNMENT_ID)
                         .collection('students')
                         .doc(this.studentId);

        await docRef.set(payload, { merge: true });
        this.setSyncStatus('synced');
      } catch (e) {
        console.warn("Firestore save error:", e);
        this.setSyncStatus('error');
      }
    } else {
      this.setSyncStatus('synced');
    }
  }
}

window.RatRodAuthManager = RatRodAuthManager;
