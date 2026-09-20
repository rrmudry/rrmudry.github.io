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
    const btnClose = document.getElementById('btnGateClose');
    if (btnClose) {
      btnClose.onclick = () => this.continueAsGuest();
    }
    const gateModal = document.getElementById('loginGateModal');
    if (gateModal) {
      gateModal.addEventListener('click', (e) => {
        if (e.target === gateModal) {
          this.continueAsGuest();
        }
      });
    }
  }

  hideLoginModal() {
    const gateModal = document.getElementById('loginGateModal');
    if (gateModal) {
      gateModal.classList.add('hidden');
      gateModal.style.setProperty('display', 'none', 'important');
    }
    const gateError = document.getElementById('loginGateError');
    if (gateError) {
      gateError.classList.add('hidden');
      gateError.style.setProperty('display', 'none', 'important');
    }
  }

  showLoginModal() {
    const gateModal = document.getElementById('loginGateModal');
    if (gateModal) {
      gateModal.classList.remove('hidden');
      gateModal.style.removeProperty('display');
      gateModal.style.display = 'flex';
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
      const gateError = document.getElementById('loginGateError');

      if (user) {
        const email = (user.email || "").toLowerCase();
        if (this.isAuthorizedEmail(email)) {
          this.currentUser = user;
          this.studentId = email.split('@')[0];
          this.studentName = user.displayName || this.studentId;
          this.isGuest = false;

          this.hideLoginModal();
          this.updateAuthUI();
          this.loadStudentData().catch(e => console.warn("Failed to load student cloud data:", e));
        } else {
          if (gateError) {
            gateError.textContent = `Access restricted: ${email} is not an official school account. Please sign in with your @orangeusd.org Google account.`;
            gateError.classList.remove('hidden');
            gateError.style.removeProperty('display');
          } else {
            alert('Please sign in using your official school @orangeusd.org account.');
          }
          this.showLoginModal();
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
          this.hideLoginModal();
        } else {
          this.showLoginModal();
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
      firebase.auth().signOut().then(() => {
        this.showLoginModal();
      });
    }
  }

  continueAsGuest() {
    this.isGuest = true;
    sessionStorage.setItem('ratrod_guest_mode', 'true');
    this.hideLoginModal();
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
      if (loginBtn) loginBtn.onclick = () => this.showLoginModal();
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
      driverScore: inventory ? (inventory.driverScore || 1000) : 1000,
      winStreak: inventory ? (inventory.winStreak || 0) : 0,
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
        cdA: playerCar.cdA,
        pi: playerCar.pi || 350,
        carClass: playerCar.carClass || 'D'
      } : null,
      carPi: playerCar ? (playerCar.pi || 350) : 350,
      carClass: playerCar ? (playerCar.carClass || 'D') : 'D',
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

  // Fetch all student records & merge with benchmark ghosts for leaderboard
  async fetchLeaderboard() {
    const list = [];
    const seenIds = new Set();

    // 1. Fetch real student records from Cloud Firestore
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      try {
        const db = firebase.firestore();
        const snap = await db.collection('student_results')
                             .doc(RAT_ROD_ASSIGNMENT_ID)
                             .collection('students')
                             .get();

        snap.forEach(doc => {
          const d = doc.data();
          const studentId = doc.id;
          seenIds.add(studentId);
          list.push({
            id: studentId,
            name: d.studentName || studentId,
            driver: d.studentName || studentId,
            carName: d.car ? d.car.name : "Custom Rod",
            driverScore: typeof d.driverScore === 'number' ? d.driverScore : (typeof d.score === 'number' ? d.score : 1000),
            winStreak: d.winStreak || 0,
            racesWon: d.racesWon || 0,
            racesTotal: d.racesTotal || 0,
            bestEt: typeof d.bestEt === 'number' ? d.bestEt : null,
            bestTrapSpeed: typeof d.bestTrapSpeed === 'number' ? d.bestTrapSpeed : null,
            carPi: typeof d.carPi === 'number' ? d.carPi : (d.car?.pi || 350),
            carClass: d.carClass || d.car?.carClass || 'D',
            shareCode: d.shareCode || "",
            carData: d.car,
            isCurrentPlayer: (this.studentId === studentId),
            isGhost: false
          });
        });
      } catch (e) {
        console.warn("Error fetching cloud leaderboard records:", e);
      }
    }

    // 2. Ensure current player's latest unsaved/local score is present if not in snap
    const myId = this.studentId || 'local_racer';
    const hasMyRecord = list.find(r => r.id === myId || (this.studentId && r.id === this.studentId));
    if (!hasMyRecord && this.game && this.game.inventory) {
      const inv = this.game.inventory;
      const pc = this.game.playerCar;
      list.push({
        id: myId,
        name: (this.studentName || "You") + " (You)",
        driver: this.studentName || "You",
        carName: pc ? pc.name : "Your Rat Rod",
        driverScore: inv.driverScore || 1000,
        winStreak: inv.winStreak || 0,
        racesWon: inv.racesWon || 0,
        racesTotal: inv.racesTotal || 0,
        bestEt: inv.bestEt,
        bestTrapSpeed: inv.bestTrapSpeed,
        carPi: pc ? pc.pi : 350,
        carClass: pc ? pc.carClass : 'D',
        shareCode: pc ? pc.toShareCode() : "",
        carData: pc ? pc.toJSON() : null,
        isCurrentPlayer: true,
        isGhost: false
      });
    }

    // 3. Blend in benchmark ghost roster for a vibrant, competitive field
    if (typeof STUDENT_GHOST_ROSTER !== 'undefined') {
      STUDENT_GHOST_ROSTER.forEach((g, idx) => {
        const ghostId = `ghost_${idx}`;
        const simET = g.car.pi >= 900 ? 9.24 : (g.car.pi >= 750 ? 11.45 : (g.car.pi >= 600 ? 13.82 : (g.car.pi >= 450 ? 15.60 : 17.95)));
        const simSpeed = g.car.pi >= 900 ? 71.5 : (g.car.pi >= 750 ? 59.2 : (g.car.pi >= 600 ? 49.5 : (g.car.pi >= 450 ? 43.1 : 38.0)));
        const simScore = g.car.pi >= 900 ? 3200 : (g.car.pi >= 750 ? 2450 : (g.car.pi >= 600 ? 1850 : (g.car.pi >= 450 ? 1420 : 1100)));
        const simWins = g.car.pi >= 900 ? 28 : (g.car.pi >= 750 ? 19 : (g.car.pi >= 600 ? 12 : (g.car.pi >= 450 ? 7 : 3)));

        list.push({
          id: ghostId,
          name: g.driver,
          driver: g.driver,
          carName: g.name,
          driverScore: simScore,
          winStreak: Math.floor(simWins / 4),
          racesWon: simWins,
          racesTotal: simWins + 3,
          bestEt: simET,
          bestTrapSpeed: simSpeed,
          carPi: g.car.pi,
          carClass: g.car.carClass,
          shareCode: g.car.toShareCode(),
          carObj: g.car,
          isCurrentPlayer: false,
          isGhost: true
        });
      });
    }

    return list;
  }
}

window.RatRodAuthManager = RatRodAuthManager;
