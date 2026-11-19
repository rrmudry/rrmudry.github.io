// Work & Simple Machines Practice — Google Sign-In gate (<dialog>), roster lookup, and Firestore sync.
// Path: student_results/{ASSIGNMENT_ID}/students/{studentId} (owner-only per firestore.rules; admin-only parent doc
// is written by sync-classroom/deploy-assignment.js). Class comes from roster/{studentId}: P0 Honors, P1–3 Conceptual, P4–6 CP.
// P1–6 students NEVER see any tier label. Guest: saved on this device only, never graded.

const ASSIGNMENT_ID = 'unit3_day4_machines_practice';
const MAX_POINTS = 10;
const TEACHER_EMAILS = ['rmudry@orangeusd.org', 'ryan.mudry@gmail.com', 'ryanmudry@gmail.com'];
const GUEST_KEY = 'smp_state_guest';

const tierForPeriod = p => (p === 0 ? 'honors' : [1, 2, 3].includes(p) ? 'conceptual' : 'cp');

class PracticeAuth {
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
    this.preview = false;
    this.stalled = false;
    this.profile = null;

    this.gate = document.getElementById('loginGate');
    this.gateError = document.getElementById('gateError');
    this.gateBtn = document.getElementById('btnGateSignIn');
    this.gateStatus = document.getElementById('gateStatus');
    this.indicator = document.getElementById('saveIndicator');

    // Keep mandatory sign-in modal open until user chooses Google Sign-In or Guest
    this.gate.addEventListener('cancel', e => e.preventDefault());

    this.gateBtn.addEventListener('click', () => this.signIn());
    document.getElementById('btnGateGuest').addEventListener('click', () => this.startGuest());
    document.getElementById('btnSignOut').addEventListener('click', () => this.signOut());
    document.getElementById('btnChipSignIn').addEventListener('click', () => this.signIn());

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.saveTimer) this.flush();
    });
    window.addEventListener('pagehide', () => { if (this.saveTimer) this.flush(); });

    const params = new URLSearchParams(window.location.search);
    if (params.has('preview')) {
      this.startPreview(params.get('view') || 'cp');
      return;
    }

    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) {
      this.openGate();
      this.showError('Could not load Google Sign-In. Check your internet connection and refresh, or continue as a guest.');
      this.gateBtn.disabled = true;
      return;
    }
    this.db = firebase.firestore();
    firebase.auth().getRedirectResult().catch(err => this.showError(`Sign-in error: ${err.message || err.code}`));
    firebase.auth().onAuthStateChanged(user => this.handleUser(user));
  }

  openGate() { if (!this.gate.open) this.gate.showModal(); }
  closeGate() { if (this.gate.open) this.gate.close(); }

  showError(msg) { this.gateError.textContent = msg; this.gateError.hidden = !msg; }
  setGateBusy(text) { this.gateStatus.textContent = text || ''; this.gateBtn.hidden = !!text; }

  signIn() {
    if (!this.db) return;
    this.showError('');
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ hd: 'orangeusd.org', prompt: 'select_account' });
    this.gateBtn.disabled = true;
    firebase.auth().signInWithPopup(provider)
      .catch(err => {
        if (err.code === 'auth/popup-blocked') firebase.auth().signInWithRedirect(provider);
        else if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') this.showError(`Google Sign-In error: ${err.message || err.code}`);
      })
      .finally(() => { this.gateBtn.disabled = false; });
  }

  async signOut() {
    if (!window.confirm('Sign out? Your progress is saved to your school account.')) return;
    await this.flush();
    await firebase.auth().signOut();
    window.location.reload();
  }

  docRef() { return this.db.collection('student_results').doc(ASSIGNMENT_ID).collection('students').doc(this.studentId); }
  localKey() { return this.guest ? GUEST_KEY : `smp_state_${this.studentId}`; }
  static readLocal(key) {
    try { const s = JSON.parse(localStorage.getItem(key)); return MachinesPractice.validState(s) ? s : null; }
    catch (e) { return null; }
  }

  showChip(name, track) {
    document.getElementById('userName').textContent = name;
    document.getElementById('userTrack').textContent = track || '';
    document.getElementById('userChip').hidden = false;
  }

  startPreview(view) {
    const tier = ['conceptual', 'cp', 'honors'].includes(view) ? view : 'cp';
    this.preview = true; this.guest = true;
    this.state = MachinesPractice.newState();
    this.profile = { guest: true, preview: true, previewView: tier, tier, period: null, name: 'Preview' };
    this.started = true;
    this.closeGate();
    this.showChip('👁 Preview', '');
    document.getElementById('btnSignOut').hidden = true;
    this.onReady({ state: this.state, cloud: this, profile: this.profile });
    this.setIndicator('guest', 'Nothing is saved');
  }

  startGuest() {
    if (this.started) return;
    this.guest = true;
    const state = PracticeAuth.readLocal(GUEST_KEY) || MachinesPractice.newState();
    this.state = state;
    this.profile = { guest: true, tier: 'cp', period: null, name: 'Guest' };
    this.started = true;
    this.closeGate();
    this.showChip('👤 Guest', '');
    document.getElementById('btnSignOut').hidden = true;
    document.getElementById('btnChipSignIn').hidden = !this.db;
    this.onReady({ state, cloud: this, profile: this.profile });
    this.setIndicator('guest', '💾 This device only');
  }

  async lookupPeriod(email) {
    if (TEACHER_EMAILS.includes(email)) return { period: 'T', teacher: true };
    try {
      const snap = await this.db.collection('roster').doc(this.studentId).get();
      if (snap.exists) {
        const d = snap.data();
        const p = d.class_period !== undefined && d.class_period !== null ? d.class_period
          : d.period !== undefined && d.period !== null ? d.period : null;
        if (p !== null) { const num = parseInt(p, 10); return { period: Number.isNaN(num) ? p : num }; }
      }
    } catch (e) { console.warn('Roster lookup failed:', e); }
    return { period: null };
  }

  async handleUser(user) {
    if (!user) {
      if (this.started && !this.guest) window.location.reload();
      if (this.started) return;
      this.openGate();
      this.setGateBusy('');
      return;
    }
    const email = (user.email || '').toLowerCase();
    if (!email.endsWith('@orangeusd.org') && !TEACHER_EMAILS.includes(email)) {
      this.openGate();
      this.showError(`${email} is not a school account. Sign in with your @orangeusd.org Google account.`);
      firebase.auth().signOut();
      return;
    }
    if (this.started && this.guest) { this.flushLocal(); window.location.reload(); return; }
    if (this.started) return;

    this.user = user;
    this.studentId = email.split('@')[0];
    this.openGate();
    this.setGateBusy('Loading your saved progress…');

    let cloudDoc = null;
    for (let tryNum = 1; ; tryNum++) {
      try { const snap = await this.docRef().get(); cloudDoc = snap.exists ? snap.data() : null; break; }
      catch (e) {
        this.setGateBusy(`Can't reach the server to load your saved work. Retrying… (try ${tryNum})`);
        await new Promise(r => setTimeout(r, Math.min(10000, 2000 * tryNum)));
      }
    }
    const roster = await this.lookupPeriod(email);
    const cloudState = cloudDoc && MachinesPractice.validState(cloudDoc.studioState) ? cloudDoc.studioState : null;
    const localState = PracticeAuth.readLocal(this.localKey());
    let state = cloudState;
    if (localState && (!state || (localState.savedAt || 0) > (state.savedAt || 0))) state = localState;
    const guestState = PracticeAuth.readLocal(GUEST_KEY);
    if (!state && guestState) { state = guestState; try { localStorage.removeItem(GUEST_KEY); } catch (e) { /* ignore */ } }
    if (!state) state = MachinesPractice.newState();
    if (cloudDoc) state.bestPoints = Math.max(state.bestPoints || 0, cloudDoc.score || 0);
    this.state = state;

    this.profile = {
      guest: false, period: roster.period, teacher: !!roster.teacher,
      tier: tierForPeriod(roster.period), name: user.displayName || this.studentId
    };
    this.started = true;
    this.closeGate();
    // P1–6 students NEVER see any track label; only P0 sees Honors and Teacher sees Teacher.
    const track = roster.teacher ? 'Teacher'
      : roster.period === 0 ? 'Period 0 · Honors'
      : roster.period !== null ? `Period ${roster.period}`
      : '';
    this.showChip(this.profile.name, track);
    this.onReady({ state, cloud: this, profile: this.profile });
    if (state !== cloudState) this.queueSave(true);
    else this.setIndicator('ok', '☁️ Saved');
  }

  setIndicator(kind, text) { this.indicator.textContent = text; this.indicator.className = `save-indicator save-${kind}`; }
  flushLocal() { if (!this.state || this.preview) return; try { localStorage.setItem(this.localKey(), JSON.stringify(this.state)); } catch (e) { /* blocked */ } }

  queueSave(immediate = false) {
    if (!this.state || this.preview) return;
    this.state.savedAt = Date.now();
    this.flushLocal();
    if (this.guest) return;
    clearTimeout(this.saveTimer);
    if (!this.stalled) this.setIndicator('busy', '⏳ Saving…');
    this.saveTimer = setTimeout(() => this.flush(), immediate ? 0 : 1500);
  }

  async flush() {
    clearTimeout(this.saveTimer); this.saveTimer = null;
    if (!this.state || !this.studentId || this.guest) return;
    if (this.saving) { this.pending = true; return; }
    this.saving = true;
    const s = MachinesPractice.scoreState(this.state, this.profile.tier);
    const val = v => (v !== undefined && v !== null ? v : null);
    const partNow = this.state.parts[this.state.current];
    const payload = {
      student_id: this.studentId,
      student_name: this.profile.name || this.studentId,
      email: (this.user && this.user.email) || `${this.studentId}@orangeusd.org`,
      score: s.points, maxScore: MAX_POINTS, maxPoints: MAX_POINTS, percentage: s.percentage,
      parts_done: s.done, parts_progress: s.progress, parts_required: s.required,
      current_part: this.state.current, current_page: partNow ? partNow.i : null,
      prediction: val(this.state.prediction),
      first_try: val(s.firstTry), questions: s.questions, minutes: s.minutes,
      quiz_best: s.quizBest, quiz_history: s.quizHistory, quiz_skills: s.skills,
      mistakes: s.mistakes, calc_unavailable: s.calcUnavailable,
      certificate_code: s.cert ? s.cert.code : null, certificate_earned_at: s.cert ? s.cert.at : null,
      track: this.profile.tier, class_period: val(this.profile.period),
      honors_required: this.profile.tier === 'honors',
      isCompleted: s.points >= MAX_POINTS,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      studioState: JSON.parse(JSON.stringify(this.state))
    };
    const slow = setTimeout(() => { this.stalled = true; this.setIndicator('error', '⚠️ No connection: kept on this device'); }, 6000);
    try {
      await this.docRef().set(payload, { mergeFields: Object.keys(payload) });
      this.stalled = false; this.setIndicator('ok', '☁️ Saved');
    } catch (e) {
      console.error('Firestore save failed:', e);
      this.setIndicator('error', '⚠️ Not saved: retrying');
      this.saveTimer = setTimeout(() => this.flush(), 8000);
    } finally {
      clearTimeout(slow); this.saving = false;
      if (this.pending) { this.pending = false; this.flush(); }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.practiceAuth = new PracticeAuth(({ state, cloud, profile }) => MachinesPractice.start(state, cloud, profile));
});
