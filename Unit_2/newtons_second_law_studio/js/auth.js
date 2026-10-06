// Newton's 2nd Law Studio — Google Sign-In gate, roster lookup, and Firestore progress + score sync
// Path: student_results/{ASSIGNMENT_ID}/students/{studentId}  (owner-only per firestore.rules)
// Grade (10 pts, best ever, never lowered): 2 pts each for finishing Steps 1–3 + 4 pts Mastery Arena (0.8 per tier).
// Differentiation: roster/{studentId}.period === 0 → Honors parts required. Everyone else may opt in.
// Guest mode: no sign-in, progress saved only on this device and never graded. If a guest later
// signs in and has no saved account progress, the guest progress carries over.
// Modeled on Unit_2/mass_weight_studio/js/auth.js.

const ASSIGNMENT_ID = 'unit2_day27_newtons_second_law_studio';
const MAX_POINTS = 10;
const HONORS_PERIODS = [0];
const TEACHER_EMAILS = ['rmudry@orangeusd.org', 'ryan.mudry@gmail.com', 'ryanmudry@gmail.com'];
const GUEST_KEY = 'nsl_state_guest';

class StudioAuth {
  constructor(onReady) {
    this.onReady = onReady;
    this.started = false;
    this.user = null;
    this.studentId = null;
    this.saveTimer = null;
    this.saving = false;
    this.pending = false;
    this.state = null;
    this.guest = false;
    this.stalled = false;
    this.profile = null;

    this.gate = document.getElementById('loginGate');
    this.gateError = document.getElementById('gateError');
    this.gateBtn = document.getElementById('btnGateSignIn');
    this.gateStatus = document.getElementById('gateStatus');
    this.indicator = document.getElementById('saveIndicator');

    this.gateBtn.addEventListener('click', () => this.signIn());
    document.getElementById('btnGateGuest').addEventListener('click', () => this.startGuest());
    document.getElementById('btnSignOut').addEventListener('click', () => this.signOut());
    document.getElementById('btnChipSignIn').addEventListener('click', () => this.signIn());
    // Chromebook lid closed, tab switched, or page closing: save right away
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.saveTimer) this.flush();
    });
    window.addEventListener('pagehide', () => { if (this.saveTimer) this.flush(); });
    window.addEventListener('beforeunload', (e) => {
      if (this.saveTimer || this.saving) {
        this.flush();
        e.preventDefault();
        e.returnValue = '';
      }
    });

    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) {
      this.showError('Could not load Google Sign-In. Check your internet connection and refresh, or continue as a guest.');
      this.gateBtn.disabled = true;
      return;
    }
    this.db = firebase.firestore();
    firebase.auth().getRedirectResult().catch(err => this.showError(`Sign-in error: ${err.message || err.code}`));
    firebase.auth().onAuthStateChanged(user => this.handleUser(user));
  }

  showError(msg) {
    this.gateError.textContent = msg;
    this.gateError.hidden = !msg;
  }

  setGateBusy(text) {
    this.gateStatus.textContent = text || '';
    this.gateBtn.hidden = !!text;
  }

  signIn() {
    if (!this.db) return;
    this.showError('');
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ hd: 'orangeusd.org', prompt: 'select_account' });
    this.gateBtn.disabled = true;
    firebase.auth().signInWithPopup(provider)
      .catch(err => {
        if (err.code === 'auth/popup-blocked') {
          firebase.auth().signInWithRedirect(provider);
        } else if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
          this.showError(`Google Sign-In error: ${err.message || err.code}`);
        }
      })
      .finally(() => { this.gateBtn.disabled = false; });
  }

  async signOut() {
    if (!window.confirm('Sign out? Your progress is saved to your school account.')) return;
    await this.flush();
    await firebase.auth().signOut();
    window.location.reload();
  }

  docRef() {
    return this.db.collection('student_results').doc(ASSIGNMENT_ID).collection('students').doc(this.studentId);
  }

  localKey() {
    return this.guest ? GUEST_KEY : `nsl_state_${this.studentId}`;
  }

  static readLocal(key) {
    try {
      const s = JSON.parse(localStorage.getItem(key));
      return NSLApp.validState(s) ? s : null;
    } catch (e) {
      return null;
    }
  }

  showChip(name, track) {
    document.getElementById('userName').textContent = name;
    document.getElementById('userTrack').textContent = track || '';
    document.getElementById('userChip').hidden = false;
  }

  startGuest() {
    if (this.started) return;
    this.guest = true;
    const state = StudioAuth.readLocal(GUEST_KEY) || NSLApp.newState();
    this.state = state;
    this.profile = { guest: true, period: null, honorsRequired: false, name: 'Guest' };
    this.started = true;
    this.gate.hidden = true;
    this.showChip('👤 Guest', '');
    document.getElementById('btnSignOut').hidden = true;
    document.getElementById('btnChipSignIn').hidden = !this.db;
    this.onReady({ state, cloud: this, profile: this.profile });
    this.setIndicator('guest', '💾 This device only');
  }

  // Class period from the roster decides whether the Honors parts are required.
  async lookupPeriod(email) {
    if (TEACHER_EMAILS.includes(email)) return { period: 'T', teacher: true };
    try {
      const snap = await this.db.collection('roster').doc(this.studentId).get();
      if (snap.exists) {
        const d = snap.data();
        const p = (d.class_period !== undefined && d.class_period !== null)
          ? d.class_period
          : (d.period !== undefined && d.period !== null ? d.period : null);
        if (p !== null) {
          const num = parseInt(p, 10);
          return { period: Number.isNaN(num) ? p : num };
        }
      }
    } catch (e) {
      console.warn('Roster lookup failed; treating as a standard class with opt-in Honors:', e);
    }
    return { period: null };
  }

  async handleUser(user) {
    if (!user) {
      if (this.started && !this.guest) window.location.reload();
      if (this.started) return;
      this.gate.hidden = false;
      this.setGateBusy('');
      return;
    }
    const email = (user.email || '').toLowerCase();
    if (!email.endsWith('@orangeusd.org') && !TEACHER_EMAILS.includes(email)) {
      this.showError(`${email} is not a school account. Sign in with your @orangeusd.org Google account.`);
      firebase.auth().signOut();
      return;
    }
    // A guest who signs in mid-activity: reload so the studio boots on their account
    if (this.started && this.guest) {
      this.flushLocal();
      window.location.reload();
      return;
    }
    if (this.started) return;

    this.user = user;
    this.studentId = email.split('@')[0];
    this.setGateBusy('Loading your saved progress…');

    let cloudDoc = null;
    for (let tryNum = 1; ; tryNum++) {
      try {
        const snap = await this.docRef().get();
        cloudDoc = snap.exists ? snap.data() : null;
        break;
      } catch (e) {
        // Starting without the saved copy would let the next save overwrite real progress,
        // so keep the gate up and retry until the read succeeds.
        console.warn(`Could not load Firestore progress (try ${tryNum}):`, e);
        this.setGateBusy(`Can't reach the server to load your saved work. Retrying… (try ${tryNum})`);
        await new Promise(r => setTimeout(r, Math.min(10000, 2000 * tryNum)));
      }
    }
    const roster = await this.lookupPeriod(email);

    const cloudState = cloudDoc && NSLApp.validState(cloudDoc.studioState) ? cloudDoc.studioState : null;
    const localState = StudioAuth.readLocal(this.localKey());
    let state = cloudState;
    // Prefer an unsynced local copy if it is newer (e.g. the connection dropped mid-class)
    if (localState && (!state || (localState.savedAt || 0) > (state.savedAt || 0))) state = localState;
    // No account progress yet: carry over work done in guest mode on this device
    const guestState = StudioAuth.readLocal(GUEST_KEY);
    if (!state && guestState) {
      state = guestState;
      try { localStorage.removeItem(GUEST_KEY); } catch (e) { /* ignore */ }
    }
    if (!state) state = NSLApp.newState();
    // Never let the gradebook score drop below what is already recorded
    if (cloudDoc) state.bestPoints = Math.max(state.bestPoints || 0, cloudDoc.score || 0);
    this.state = state;

    const honorsRequired = roster.teacher || HONORS_PERIODS.includes(roster.period);
    this.profile = {
      guest: false,
      period: roster.period,
      teacher: !!roster.teacher,
      honorsRequired,
      name: user.displayName || this.studentId
    };

    this.started = true;
    this.gate.hidden = true;
    const track = roster.teacher ? 'Teacher view' : roster.period === null ? '' : `Period ${roster.period}${honorsRequired ? ' · Honors' : ''}`;
    this.showChip(this.profile.name, track);
    this.onReady({ state, cloud: this, profile: this.profile });

    if (state !== cloudState) this.queueSave(true);
    else this.setIndicator('ok', '☁️ Saved');
  }

  setIndicator(kind, text) {
    this.indicator.textContent = text;
    this.indicator.className = `save-indicator save-${kind}`;
  }

  flushLocal() {
    if (!this.state) return;
    try { localStorage.setItem(this.localKey(), JSON.stringify(this.state)); } catch (e) { /* storage blocked */ }
  }

  // Debounced save: every answer lands in Firestore within ~1.5 s
  queueSave(immediate = false) {
    if (!this.state) return;
    this.state.savedAt = Date.now();
    this.flushLocal();
    if (this.guest) return;
    clearTimeout(this.saveTimer);
    if (!this.stalled) this.setIndicator('busy', '⏳ Saving…');
    this.saveTimer = setTimeout(() => this.flush(), immediate ? 0 : 1500);
  }

  async flush() {
    clearTimeout(this.saveTimer);
    this.saveTimer = null;
    if (!this.state || !this.studentId || this.guest) return;
    if (this.saving) {
      this.pending = true;
      return;
    }
    this.saving = true;
    const s = NSLApp.scoreState(this.state);
    const periodVal = (this.profile && this.profile.period !== undefined && this.profile.period !== null)
      ? this.profile.period
      : null;
    const payload = {
      student_id: this.studentId,
      student_name: (this.profile && this.profile.name) || this.studentId || 'Student',
      email: (this.user && this.user.email) || `${this.studentId}@orangeusd.org`,
      score: s.points,
      maxScore: MAX_POINTS,
      maxPoints: MAX_POINTS,
      percentage: s.percentage,
      steps_done: s.stepsDone,
      arena_best_tiers: s.arenaBest,
      class_period: periodVal,
      honors_required: !!(this.profile && this.profile.honorsRequired),
      honors_opt_in: this.state.optIn || {},   // { step1: true/false, ... } for standard-class students
      honors_done_steps: s.honorsDone || [],   // e.g. ['step1', 'step2']
      certificate_code: this.state.certCode || null,
      isCompleted: s.points >= MAX_POINTS,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      // JSON round-trip strips undefined values, which Firestore rejects
      studioState: JSON.parse(JSON.stringify(this.state))
    };
    const slow = setTimeout(() => {
      this.stalled = true;
      this.setIndicator('error', '⚠️ No connection: kept on this device, will sync');
    }, 6000);
    try {
      // mergeFields replaces each listed field wholesale while leaving fields other tools add.
      await this.docRef().set(payload, { mergeFields: Object.keys(payload) });
      this.stalled = false;
      this.setIndicator('ok', '☁️ Saved');
    } catch (e) {
      console.error('Firestore save failed:', e);
      this.setIndicator('error', '⚠️ Not saved: retrying');
      this.saveTimer = setTimeout(() => this.flush(), 8000);
    } finally {
      clearTimeout(slow);
      this.saving = false;
      if (this.pending) {
        this.pending = false;
        this.flush();
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.studioAuth = new StudioAuth(({ state, cloud, profile }) => NSLApp.start(state, cloud, profile));
});
