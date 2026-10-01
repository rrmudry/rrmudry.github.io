// Google Sign-In Gate & Firestore Progress Sync for the Mass, Weight & Zero-G Inertia Studio
// Path: student_results/{ASSIGNMENT_ID}/students/{studentId}  (owner-only per firestore.rules)
// Grade: 10 pts = 5 pts evidence data table + 5 pts Mythbusters questions (best ever, never lowered)
// Guest mode: no sign-in, progress saved only to this device's localStorage and never graded.
// If a guest later signs in and has no saved account progress, the guest progress carries over.

const ASSIGNMENT_ID = 'unit2_day24_mass_weight_studio';
const MAX_POINTS = 10;
const TEACHER_EMAILS = ['rmudry@orangeusd.org', 'ryan.mudry@gmail.com', 'ryanmudry@gmail.com'];
const GUEST_KEY = 'mws_state_guest';

// Measured columns in the evidence log (Mass is given, not measured, so it isn't graded)
MWS.DATA_KEYS = ['volume', 'earth', 'mars', 'space', 'nudge', 'dent'];

// Updates state.best (best-ever points) and returns the current grade breakdown
MWS.scoreState = function (state) {
  const objs = MWS.allObjects(state.crates);
  const total = objs.length * MWS.DATA_KEYS.length;
  let filled = 0;
  objs.forEach(o => {
    const r = state.log[o.id] || {};
    MWS.DATA_KEYS.forEach(k => {
      if (r[k] != null && r[k] !== 'lost') filled++;
    });
  });
  const dataNow = Math.round(((5 * filled) / total) * 10) / 10;
  const questionsNow = Object.values(state.answers || {}).filter(a => a.correct).length;
  if (!state.best) state.best = { data: 0, questions: 0 };
  state.best.data = Math.max(state.best.data || 0, dataNow);
  state.best.questions = Math.max(state.best.questions || 0, questionsNow);
  const points = Math.round((state.best.data + state.best.questions) * 10) / 10;
  return {
    filled,
    total,
    dataPoints: state.best.data,
    questionPoints: state.best.questions,
    questionsNow,
    points,
    percentage: Math.round((points / MAX_POINTS) * 100)
  };
};

MWS.newState = function () {
  return { crates: MWS.generateCrates(), attempt: 1, name: '', questions: null, answers: {}, completedAt: null, code: null, log: {}, best: { data: 0, questions: 0 }, savedAt: 0 };
};

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
    this.stalled = false; // a save is waiting on the network; keep the warning visible

    this.gate = document.getElementById('loginGate');
    this.gateError = document.getElementById('gateError');
    this.gateBtn = document.getElementById('btnGateSignIn');
    this.gateStatus = document.getElementById('gateStatus');
    this.indicator = document.getElementById('saveIndicator');

    this.gateBtn.addEventListener('click', () => this.signIn());
    document.getElementById('btnGateGuest').addEventListener('click', () => this.startGuest());
    document.getElementById('btnSignOut').addEventListener('click', () => this.signOut());
    document.getElementById('btnChipSignIn').addEventListener('click', () => this.signIn());
    // Chromebook lid closed, tab switched, or page closing: save right away instead of waiting
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
    return this.guest ? GUEST_KEY : `mws_state_${this.studentId}`;
  }

  static readLocal(key) {
    try {
      const s = JSON.parse(localStorage.getItem(key));
      return s && Array.isArray(s.crates) && s.crates.length === 3 ? s : null;
    } catch (e) {
      return null;
    }
  }

  startGuest() {
    if (this.started) return;
    this.guest = true;
    const state = StudioAuth.readLocal(GUEST_KEY) || MWS.newState();
    if (!state.log) state.log = {};
    if (!state.answers) state.answers = {};
    state.name = 'Guest Explorer';
    this.state = state;
    this.started = true;
    this.gate.hidden = true;
    document.getElementById('userName').textContent = '👤 Guest';
    document.getElementById('btnSignOut').hidden = true;
    document.getElementById('btnChipSignIn').hidden = !this.db;
    document.getElementById('userChip').hidden = false;
    this.onReady({ state, cloud: this, guest: true });
    this.setIndicator('guest', '💾 This device only');
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

    let cloudState = null;
    let cloudDoc = null;
    for (let tryNum = 1; ; tryNum++) {
      try {
        const snap = await this.docRef().get();
        cloudDoc = snap.exists ? snap.data() : null;
        if (cloudDoc && cloudDoc.studioState) cloudState = cloudDoc.studioState;
        break;
      } catch (e) {
        // Starting without the saved copy would let the next save overwrite real progress,
        // so keep the gate up and retry until the read succeeds.
        console.warn(`Could not load Firestore progress (try ${tryNum}):`, e);
        this.setGateBusy(`Can't reach the server to load your saved work. Retrying… (try ${tryNum})`);
        await new Promise(r => setTimeout(r, Math.min(10000, 2000 * tryNum)));
      }
    }
    const localState = StudioAuth.readLocal(this.localKey());
    const valid = s => s && Array.isArray(s.crates) && s.crates.length === 3;
    let state = valid(cloudState) ? cloudState : null;
    // Prefer an unsynced local copy if it is newer (e.g. the connection dropped mid-class)
    if (localState && (!state || (localState.savedAt || 0) > (state.savedAt || 0))) state = localState;
    // No account progress yet: carry over work done in guest mode on this device
    const guestState = StudioAuth.readLocal(GUEST_KEY);
    if (!state && guestState) {
      state = guestState;
      try { localStorage.removeItem(GUEST_KEY); } catch (e) { /* ignore */ }
    }
    if (!state) state = MWS.newState();
    if (!state.log) state.log = {};
    if (!state.answers) state.answers = {};
    // Never let the gradebook score drop below what is already recorded in Firestore
    if (cloudDoc) {
      if (!state.best) state.best = { data: 0, questions: 0 };
      state.best.data = Math.max(state.best.data || 0, cloudDoc.data_points || 0);
      state.best.questions = Math.max(state.best.questions || 0, cloudDoc.question_points || 0);
    }
    state.name = user.displayName || this.studentId;
    this.state = state;

    this.started = true;
    this.gate.hidden = true;
    document.getElementById('userName').textContent = state.name;
    document.getElementById('userChip').hidden = false;
    this.onReady({ state, cloud: this, guest: false });

    if (state !== cloudState) this.queueSave(true);
    else this.setIndicator('ok', '☁️ Saved');
  }

  setIndicator(kind, text) {
    this.indicator.textContent = text;
    this.indicator.className = `save-indicator save-${kind}`;
  }

  // Debounced save: every measurement and answer lands in Firestore within ~1.5 s
  flushLocal() {
    if (!this.state) return;
    try { localStorage.setItem(this.localKey(), JSON.stringify(this.state)); } catch (e) { /* storage blocked */ }
  }

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
    const s = MWS.scoreState(this.state);
    const payload = {
      student_id: this.studentId,
      student_name: this.state.name,
      email: this.user.email,
      score: s.points,
      maxScore: MAX_POINTS,
      maxPoints: MAX_POINTS,
      percentage: s.percentage,
      data_points: s.dataPoints,
      question_points: s.questionPoints,
      data_cells_filled: s.filled,
      data_cells_total: s.total,
      attempt: this.state.attempt,
      certificate_code: this.state.code || null,
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
      // mergeFields replaces each listed field wholesale (so a retake's emptied answers/log
      // really are emptied in the cloud) while leaving fields other tools add (e.g. class_period).
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
