// Pulleys and Ramps Lab — Google sign-in, roster lookup, and Firestore saving.
// Path: student_results/{ASSIGNMENT_ID}/students/{emailPrefix} (owner-only in firestore.rules; the admin-only parent
// doc is written by sync-classroom/deploy-assignment.js). Guest: saved on this device only, never graded.
// Preview (?preview): nothing saved. Based on Unit_3/work_studio/js/auth.js.

const ASSIGNMENT_ID = 'unit3_day3_tradeoff_lab';
const MAX_POINTS = 10;
const TEACHER_EMAILS = ['rmudry@orangeusd.org', 'ryan.mudry@gmail.com', 'ryanmudry@gmail.com'];
const GUEST_KEY = 'tol2_state_guest';
const tierForPeriod = p => (p === 0 ? 'honors' : [1, 2, 3].includes(p) ? 'conceptual' : 'cp');

class LabAuth {
  constructor(onReady) {
    this.onReady = onReady;
    this.started = false; this.guest = false; this.preview = false; this.stalled = false;
    this.saving = false; this.pending = false; this.saveTimer = null;
    this.gate = document.getElementById('loginGate');
    this.gateBtn = document.getElementById('btnGateSignIn');
    this.indicator = document.getElementById('saveIndicator');
    this.gateBtn.addEventListener('click', () => this.signIn());
    document.getElementById('btnGateGuest').addEventListener('click', () => this.startGuest());
    document.getElementById('btnSignOut').addEventListener('click', () => this.signOut());
    // In a preview there is no sign-in on this page: reload without ?preview / ?teacher so the Google sign-in card appears
    document.getElementById('btnChipSignIn').addEventListener('click', () => { if (this.preview) location.href = location.pathname; else this.signIn(); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && this.saveTimer) this.flush(); });
    window.addEventListener('pagehide', () => { if (this.saveTimer) this.flush(); });

    const q = new URLSearchParams(location.search);
    if (q.has('preview') || (q.has('teacher') && /^(localhost|127\.0\.0\.1)$/.test(location.hostname))) { this.startPreview(); return; }
    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) {
      this.showError('Could not load Google Sign-In. Refresh, or continue as a guest.');
      this.gateBtn.disabled = true;
      return;
    }
    this.db = firebase.firestore();
    firebase.auth().getRedirectResult().catch(err => this.showError(`Sign-in error: ${err.message || err.code}`));
    firebase.auth().onAuthStateChanged(user => this.handleUser(user));
  }

  showError(msg) { const el = document.getElementById('gateError'); el.textContent = msg; el.hidden = !msg; }
  setGateBusy(text) { document.getElementById('gateStatus').textContent = text || ''; this.gateBtn.hidden = !!text; }
  setIndicator(text) { this.indicator.textContent = text; }

  signIn() {
    if (!this.db) return;
    this.showError('');
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ hd: 'orangeusd.org', prompt: 'select_account' });
    firebase.auth().signInWithPopup(provider).catch(err => {
      if (err.code === 'auth/popup-blocked') firebase.auth().signInWithRedirect(provider);
      else if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') this.showError(`Google Sign-In error: ${err.message || err.code}`);
    });
  }
  async signOut() {
    if (!window.confirm('Sign out? Your work is saved to your school account.')) return;
    await this.flush();
    await firebase.auth().signOut();
    location.reload();
  }
  docRef() { return this.db.collection('student_results').doc(ASSIGNMENT_ID).collection('students').doc(this.studentId); }
  localKey() { return this.guest ? GUEST_KEY : `tol2_state_${this.studentId}`; }
  static readLocal(key) { try { const s = JSON.parse(localStorage.getItem(key)); return TradeoffLab.validState(s) ? s : null; } catch (e) { return null; } }
  begin(state, name, profile) {
    this.state = state; this.profile = profile; this.started = true;
    this.gate.hidden = true;
    document.getElementById('userName').textContent = name;
    this.onReady({ state, cloud: this, profile });
  }

  startPreview() {
    this.preview = true; this.guest = true;
    // ?teacher on localhost: preview with the teacher tools, without signing in
    const teacherPreview = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).has('teacher');
    this.begin(TradeoffLab.newState(), teacherPreview ? '🧑‍🏫 Teacher preview' : '👁 Preview', { guest: true, preview: true, teacherPreview, tier: 'cp', period: null, name: 'Preview' });
    this.setIndicator('Nothing is saved');
    const chip = document.getElementById('btnChipSignIn');
    chip.hidden = false; chip.textContent = '🔑 Sign in with Google';
  }
  startGuest() {
    if (this.started) return;
    this.guest = true;
    this.begin(LabAuth.readLocal(GUEST_KEY) || TradeoffLab.newState(), '👤 Guest', { guest: true, tier: 'cp', period: null, name: 'Guest' });
    const chip = document.getElementById('btnChipSignIn');
    chip.hidden = !this.db; chip.textContent = '🔑 Sign in with Google';
    this.setIndicator('💾 This device only');
  }

  async lookupPeriod(email) {
    if (TEACHER_EMAILS.includes(email)) return { period: 'T', teacher: true };
    try {
      const snap = await this.db.collection('roster').doc(this.studentId).get();
      if (snap.exists) {
        const d = snap.data();
        const p = d.class_period !== undefined && d.class_period !== null ? d.class_period : d.period !== undefined && d.period !== null ? d.period : null;
        if (p !== null) { const num = parseInt(p, 10); return { period: Number.isNaN(num) ? p : num }; }
      }
    } catch (e) { console.warn('Roster lookup failed:', e); }
    return { period: null };
  }

  async handleUser(user) {
    if (!user) {
      if (this.started && !this.guest) location.reload();
      if (this.started) return;
      this.gate.hidden = false; this.setGateBusy('');
      return;
    }
    const email = (user.email || '').toLowerCase();
    if (!email.endsWith('@orangeusd.org') && !TEACHER_EMAILS.includes(email)) {
      this.showError(`${email} is not a school account. Use your @orangeusd.org account.`);
      firebase.auth().signOut();
      return;
    }
    if (this.started && this.guest) { this.flushLocal(); location.reload(); return; }
    if (this.started) return;
    this.user = user;
    this.studentId = email.split('@')[0];
    this.setGateBusy('Loading your saved work…');
    let cloudDoc = null;
    for (let tryNum = 1; ; tryNum++) {
      try { const snap = await this.docRef().get(); cloudDoc = snap.exists ? snap.data() : null; break; } catch (e) {
        // Starting without the saved copy would let the next save overwrite real work, so keep trying
        this.setGateBusy(`Can't reach the server. Retrying… (try ${tryNum})`);
        await new Promise(r => setTimeout(r, Math.min(10000, 2000 * tryNum)));
      }
    }
    const roster = await this.lookupPeriod(email);
    const cloudState = cloudDoc && TradeoffLab.validState(cloudDoc.labState) ? cloudDoc.labState : null;
    const localState = LabAuth.readLocal(this.localKey());
    let state = cloudState;
    if (localState && (!state || (localState.savedAt || 0) > (state.savedAt || 0))) state = localState;
    const guestState = LabAuth.readLocal(GUEST_KEY);
    if (!state && guestState) { state = guestState; try { localStorage.removeItem(GUEST_KEY); } catch (e) { /* ignore */ } }
    if (!state) state = TradeoffLab.newState();
    if (cloudDoc) state.bestPoints = Math.max(state.bestPoints || 0, cloudDoc.score || 0);   // never lower the grade
    document.getElementById('btnSignOut').hidden = false;
    this.begin(state, user.displayName || this.studentId, { guest: false, period: roster.period, teacher: !!roster.teacher, tier: tierForPeriod(roster.period), name: user.displayName || this.studentId });
    if (state !== cloudState) this.queueSave(true); else this.setIndicator('☁️ Saved');
  }

  flushLocal() { if (!this.state || this.preview) return; try { localStorage.setItem(this.localKey(), JSON.stringify(this.state)); } catch (e) { /* blocked */ } }
  queueSave(immediate = false) {
    if (!this.state || this.preview) return;
    this.state.savedAt = Date.now();
    this.flushLocal();
    if (this.guest) return;
    clearTimeout(this.saveTimer);
    if (!this.stalled) this.setIndicator('⏳ Saving…');
    this.saveTimer = setTimeout(() => this.flush(), immediate ? 0 : 1500);
  }
  async flush() {
    clearTimeout(this.saveTimer); this.saveTimer = null;
    if (!this.state || !this.studentId || this.guest) return;
    if (this.saving) { this.pending = true; return; }
    this.saving = true;
    const s = TradeoffLab.scoreState(this.state);
    const val = v => (v !== undefined && v !== null ? v : null);
    const payload = {
      student_id: this.studentId,
      student_name: this.profile.name || this.studentId,
      email: (this.user && this.user.email) || `${this.studentId}@orangeusd.org`,
      score: s.points, maxScore: MAX_POINTS, maxPoints: MAX_POINTS, percentage: s.percentage,
      parts_done: s.done,               // pulley, ramp, think, predict
      parts_progress: s.progress,
      trials: s.rows,                   // rows in their own data table
      first_try: val(s.firstTry),       // percent right on the first try
      questions: s.questions,
      minutes: s.minutes,
      mistakes: s.mistakes,
      load_kg: this.state.rig ? this.state.rig.m : null,
      certificate_code: this.state.cert ? this.state.cert.code : null,
      certificate_earned_at: this.state.cert ? this.state.cert.at : null,
      calc_unavailable: !!this.state.calcUnavailable,   // Desmos did not load, so W could be typed
      track: this.profile.tier,
      class_period: val(this.profile.period),
      isCompleted: s.points >= MAX_POINTS,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      labState: JSON.parse(JSON.stringify(this.state))   // strips undefined, which Firestore rejects
    };
    const slow = setTimeout(() => { this.stalled = true; this.setIndicator('⚠️ No connection: kept on this device'); }, 6000);
    try {
      await this.docRef().set(payload, { mergeFields: Object.keys(payload) });
      this.stalled = false; this.setIndicator('☁️ Saved');
    } catch (e) {
      console.error('Firestore save failed:', e);
      this.setIndicator('⚠️ Not saved: retrying');
      this.saveTimer = setTimeout(() => this.flush(), 8000);
    } finally {
      clearTimeout(slow); this.saving = false;
      if (this.pending) { this.pending = false; this.flush(); }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.labAuth = new LabAuth(({ state, cloud, profile }) => TradeoffLab.start(state, cloud, profile));
});
