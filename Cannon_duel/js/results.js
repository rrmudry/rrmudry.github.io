// Cannon Duel results for the teacher leaderboard (leaderboard.html).
//   cannon_results/{id}   one row per team per finished battle; only the teacher can read them
// Single player and two-player games are saved when someone is signed in on that device (guests
// can still play). Online battles are saved by each team's device and by the host panel, under
// the same doc id, so a battle still counts if one side closes the tab.
(function () {
  'use strict';
  const { $, esc, UI } = window.CannonApp;

  const RESULTS = 'cannon_results';
  const TEACHER_EMAILS = ['rmudry@orangeusd.org', 'ryan.mudry@gmail.com', 'ryanmudry@gmail.com'];
  const isAuthorized = (email) => !!email && (email.toLowerCase().endsWith('@orangeusd.org') || TEACHER_EMAILS.includes(email.toLowerCase()));
  const clean = (o) => JSON.parse(JSON.stringify(o));
  const r1 = (v) => Math.round(v * 10) / 10;

  let db = null, auth = null;

  // Shot stats for team idx, from the shot list both local and online games keep
  function statsFor(shots, idx) {
    const mine = shots.filter((s) => s.by === idx && !s.skipped);
    const miss = (s) => (s.direct ? 0 : s.offset === null || s.offset === undefined ? null : Math.abs(s.offset));
    const landed = mine.map(miss).filter((m) => m !== null);
    return {
      shots: mine.length,
      direct: mine.filter((s) => s.direct).length,
      dmgDealt: mine.reduce((a, s) => a + (s.dmg ? s.dmg[1 - idx] : 0), 0),
      firstMiss: mine.length && miss(mine[0]) !== null ? r1(miss(mine[0])) : null,     // null = first shot left the map
      closest: landed.length ? r1(Math.min(...landed)) : null,
      avgMiss: landed.length ? r1(landed.reduce((a, b) => a + b, 0) / landed.length) : null,
      sabotage: mine.some((s) => s.sabotage),
    };
  }
  const outcome = (winner, idx) => (winner === -1 ? 'draw' : winner === idx ? 'win' : 'loss');

  const Results = {
    user: null,
    profile: null,          // { studentId, email, name, period }

    signedIn() { return !!(this.user && this.profile); },

    async signIn() {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ hd: 'orangeusd.org', prompt: 'select_account' });
      return auth.signInWithPopup(provider);
    },

    // Class period from the roster (same lookup the labs use); 'T' for the teacher
    async lookupPeriod(user) {
      const email = user.email.toLowerCase(), studentId = email.split('@')[0];
      if (TEACHER_EMAILS.includes(email)) return 'T';
      try {
        let snap = await db.collection('roster').doc(studentId).get();
        if (!snap.exists) {
          const q = await db.collection('roster').where('email', '==', email).limit(1).get();
          if (!q.empty) snap = q.docs[0];
        }
        if (snap.exists) {
          const d = snap.data(), p = d.class_period !== undefined && d.class_period !== null ? d.class_period : d.period;
          if (p !== undefined && p !== null && p !== '') { const n = parseInt(p, 10); return Number.isNaN(n) ? String(p) : n; }
        }
      } catch (e) { console.warn('Roster lookup failed; results will have no period.', e); }
      return null;
    },

    async onUser(u) {
      this.user = u && isAuthorized(u.email) ? u : null;
      this.profile = null;
      this.paint();
      if (!this.user) return;
      const email = u.email.toLowerCase();
      const period = await this.lookupPeriod(u);
      if (this.user !== u) return;
      this.profile = { studentId: email.split('@')[0], email, name: u.displayName || email.split('@')[0], period };
      this.paint();
    },

    // The line on the setup screen that says whether this game will count
    paint() {
      const el = $('lbStatus'); if (!el) return;
      if (!db) { el.hidden = true; return; }
      el.hidden = false;
      if (this.profile) {
        const p = this.profile.period === 'T' ? 'teacher' : this.profile.period !== null ? `Period ${this.profile.period}` : 'no period found';
        el.innerHTML = `🏆 Signed in as <b>${esc(this.profile.name)}</b> (${esc(p)}). Your results count on the class leaderboard.`;
      } else if (this.user) {
        el.textContent = '🏆 Signing in…';
      } else {
        el.innerHTML = '🏆 Playing as a guest: results are not saved. <button class="link" id="lbSignIn" type="button">Sign in with Google</button> to get on the class leaderboard.';
        $('lbSignIn').addEventListener('click', () => this.signIn().catch((e) => {
          if (e && e.code !== 'auth/popup-closed-by-user') UI.toast('Sign-in did not finish. Try again.');
        }));
      }
    },

    async save(id, row) {
      if (!db) return;
      try { await db.collection(RESULTS).doc(id).set(clean(row)); } catch (e) { console.warn('Could not save the result.', e); }
    },

    // Single player (mode 'cpu') or two players on one device (mode 'local')
    recordLocal(duel, config, winner) {
      if (!this.signedIn()) return;
      const p = this.profile, at = Date.now();
      const sides = config.mode === 'cpu' ? [0] : [0, 1];
      sides.forEach((i) => {
        this.save(`${this.user.uid}_${at}_${i}`, {
          mode: config.mode, diff: config.mode === 'cpu' ? duel.teams[1].diff : null,
          uid: this.user.uid, studentId: p.studentId, name: p.name, period: p.period,
          team: duel.teams[i].name, opponent: duel.teams[1 - i].name,
          result: outcome(winner, i), hpLeft: duel.hp[i], ...statsFor(duel.shots, i), at,
        });
      });
    },

    // One row per human team in a finished online match. Built only from the match doc, so the
    // host and the team's own device write identical rows.
    onlineRows(code, id, m) {
      const rows = [];
      m.teams.forEach((t, i) => {
        if (t.uid === 'cpu') return;
        rows.push([`${code}_${id}_${t.uid}`, {
          mode: 'online', diff: null, uid: t.uid, studentId: t.studentId || null, name: t.player || t.studentId || t.name,
          period: t.period !== undefined ? t.period : null, members: t.members || '',
          team: t.name, opponent: m.teams[1 - i].name, result: outcome(m.winner, i), hpLeft: m.hp[i],
          ...statsFor(m.shots || [], i), code, round: m.round, endedBy: m.endedBy || null, at: m.updatedAt || Date.now(),
        }]);
      });
      return rows;
    },

    recordOnline(code, id, m, onlyUid) {
      if (!this.user || m.status !== 'done') return;
      this.onlineRows(code, id, m).forEach(([docId, row]) => { if (!onlyUid || row.uid === onlyUid) this.save(docId, row); });
    },
  };

  if (typeof firebase !== 'undefined' && firebase.firestore) {
    try {
      db = firebase.firestore();
      auth = firebase.auth();
      auth.onAuthStateChanged((u) => Results.onUser(u));
    } catch (e) { db = null; }
  }

  window.CannonResults = Results;
})();
