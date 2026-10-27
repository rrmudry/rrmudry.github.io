// Firebase Auth, Roster Period Lookup & Firestore Score Sync for Projectile Target Range
// Collection: student_results/unit2_day42_projectile_target_range/students/{studentId}
// Student doc ID = email prefix (e.g. jsmith123). Parent doc is never written.

const ASSIGNMENT_ID = 'unit2_day42_projectile_target_range';
const MAX_POINTS = 10;
const TEACHER_EMAILS = ['rmudry@orangeusd.org', 'ryan.mudry@gmail.com', 'ryanmudry@gmail.com'];
const GUEST_STORAGE_KEY = 'ptr_guest_progress';

class AuthManager {
  constructor(onUserReady) {
    this.onUserReady = onUserReady;
    this.user = null;
    this.studentId = null;
    this.studentPeriod = null;
    this.isGuest = false;
    this.saveTimeout = null;

    this.gateEl = document.getElementById('loginGate');
    this.btnGoogle = document.getElementById('btnGoogleSignIn');
    this.btnGuest = document.getElementById('btnGuestMode');
    this.statusEl = document.getElementById('gateStatus');
    this.userChip = document.getElementById('userChip');
    this.userDisplay = document.getElementById('userDisplay');
    this.btnSignOut = document.getElementById('btnSignOut');

    this.init();
  }

  init() {
    this.btnGoogle.addEventListener('click', () => this.signInGoogle());
    this.btnGuest.addEventListener('click', () => this.startGuest());
    if (this.btnSignOut) {
      this.btnSignOut.addEventListener('click', () => this.signOut());
    }

    // Auto-flush on page hide / tab close
    window.addEventListener('beforeunload', () => this.flushSave());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flushSave();
    });

    // Check for ?preview parameter
    const params = new URLSearchParams(window.location.search);
    if (params.has('preview')) {
      const trackParam = params.get('track') || (params.get('view') === 'honors' ? 'honors' : 'conceptual');
      this.startPreview(trackParam);
      return;
    }

    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) {
      console.warn('Firebase SDK unavailable. Defaulting to Guest mode.');
      this.btnGoogle.disabled = true;
      this.statusEl.textContent = 'Network offline. You can continue as a Guest.';
      return;
    }

    this.db = firebase.firestore();
    firebase.auth().onAuthStateChanged(user => this.handleAuthState(user));
  }

  startPreview(track) {
    this.isGuest = true;
    this.studentId = 'preview_tester';
    this.studentPeriod = track === 'honors' ? 0 : 1;
    this.gateEl.hidden = true;
    this.userChip.hidden = false;
    this.userDisplay.textContent = `👁️ Preview Mode (${track})`;
    if (this.btnSignOut) this.btnSignOut.hidden = true;

    this.onUserReady({
      studentId: this.studentId,
      name: 'Preview User',
      period: this.studentPeriod,
      isGuest: true,
      defaultTrack: track
    });
  }

  startGuest() {
    this.isGuest = true;
    this.studentId = 'guest';
    this.studentPeriod = 1;
    this.gateEl.hidden = true;
    this.userChip.hidden = false;
    this.userDisplay.textContent = '👤 Guest (Ungraded)';
    if (this.btnSignOut) this.btnSignOut.hidden = true;

    this.onUserReady({
      studentId: 'guest',
      name: 'Guest',
      period: 1,
      isGuest: true,
      defaultTrack: 'conceptual'
    });
  }

  signInGoogle() {
    if (!this.db) return;
    this.statusEl.textContent = 'Connecting to Google…';
    this.btnGoogle.disabled = true;

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
      hd: 'orangeusd.org',
      prompt: 'select_account'
    });

    firebase.auth().signInWithPopup(provider)
      .catch(err => {
        if (err.code === 'auth/popup-blocked') {
          firebase.auth().signInWithRedirect(provider);
        } else if (err.code !== 'auth/popup-closed-by-user') {
          this.statusEl.textContent = `Sign-in error: ${err.message || err.code}`;
        }
      })
      .finally(() => {
        this.btnGoogle.disabled = false;
      });
  }

  async signOut() {
    if (confirm('Sign out of your school account?')) {
      await this.flushSave();
      if (typeof firebase !== 'undefined') await firebase.auth().signOut();
      window.location.reload();
    }
  }

  async handleAuthState(user) {
    if (!user) {
      this.gateEl.hidden = false;
      this.userChip.hidden = true;
      return;
    }

    const email = (user.email || '').toLowerCase();
    const isTeacher = TEACHER_EMAILS.includes(email);
    if (!isTeacher && !email.endsWith('@orangeusd.org')) {
      this.statusEl.textContent = 'Please sign in with your school @orangeusd.org Google account.';
      firebase.auth().signOut();
      return;
    }

    this.user = user;
    this.studentId = email.split('@')[0];
    this.statusEl.textContent = 'Loading your roster profile…';

    // Roster lookup for Period
    let period = null;
    if (isTeacher) {
      period = 'T';
    } else {
      try {
        const snap = await this.db.collection('roster').doc(this.studentId).get();
        if (snap.exists) {
          const d = snap.data();
          period = d.class_period !== undefined ? d.class_period : (d.period !== undefined ? d.period : null);
          if (period !== null) period = parseInt(period, 10);
        }
      } catch (e) {
        console.warn('Roster lookup failed; defaulting to standard class:', e);
      }
    }

    this.studentPeriod = period;
    this.gateEl.hidden = true;
    this.userChip.hidden = false;

    const isHonors = period === 0;
    const trackLabel = isTeacher ? 'Teacher' : isHonors ? 'Period 0 (Honors)' : `Period ${period || '1-6'}`;
    this.userDisplay.textContent = `${user.displayName || this.studentId} · ${trackLabel}`;

    // Load existing progress from Cloud
    const cloudProgress = await this.loadCloudProgress();

    this.onUserReady({
      studentId: this.studentId,
      name: user.displayName || this.studentId,
      email: user.email,
      period: this.studentPeriod,
      isTeacher,
      isHonors,
      isGuest: false,
      cloudProgress,
      defaultTrack: isHonors ? 'honors' : 'conceptual'
    });
  }

  async loadCloudProgress() {
    if (!this.db || !this.studentId || this.isGuest) return null;
    try {
      const docRef = this.db.collection('student_results').doc(ASSIGNMENT_ID).collection('students').doc(this.studentId);
      const snap = await docRef.get();
      if (snap.exists) {
        return snap.data();
      }
    } catch (e) {
      console.warn('Could not read saved cloud progress:', e);
    }
    return null;
  }

  queueSave(state) {
    if (this.isGuest) {
      try {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(state));
      } catch (e) { /* ignore */ }
      return;
    }

    this.lastState = state;
    clearTimeout(this.saveTimeout);
    this.updateSaveIndicator('saving');
    this.saveTimeout = setTimeout(() => this.flushSave(), 1200);
  }

  async flushSave() {
    if (this.isGuest || !this.db || !this.studentId || !this.lastState) return;
    const state = this.lastState;

    const totalMissions = 5;
    const completedCount = Object.keys(state.completedMissions || {}).length;
    const score = Math.min(MAX_POINTS, completedCount * 2);

    const payload = {
      student_id: this.studentId,
      student_name: (this.user && this.user.displayName) || this.studentId,
      email: (this.user && this.user.email) || `${this.studentId}@orangeusd.org`,
      score: score,
      maxScore: MAX_POINTS,
      completedTrials: completedCount,
      percentage: Math.round((score / MAX_POINTS) * 100),
      isCompleted: score >= MAX_POINTS,
      class_period: this.studentPeriod !== null && this.studentPeriod !== undefined ? this.studentPeriod : null,
      track: state.currentTrack || 'conceptual',
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      workbench_state: JSON.parse(JSON.stringify(state))
    };

    try {
      const docRef = this.db.collection('student_results').doc(ASSIGNMENT_ID).collection('students').doc(this.studentId);
      await docRef.set(payload, { merge: true });
      this.updateSaveIndicator('saved');
    } catch (err) {
      console.error('Firestore save error:', err);
      this.updateSaveIndicator('error');
    }
  }

  updateSaveIndicator(status) {
    const ind = document.getElementById('saveIndicator');
    if (!ind) return;
    if (status === 'saving') {
      ind.textContent = '⏳ Saving…';
      ind.className = 'save-status status-busy';
    } else if (status === 'saved') {
      ind.textContent = '☁️ Progress Saved';
      ind.className = 'save-status status-ok';
    } else if (status === 'error') {
      ind.textContent = '⚠️ Saved Locally (Offline)';
      ind.className = 'save-status status-warn';
    }
  }
}

window.AuthManager = AuthManager;
