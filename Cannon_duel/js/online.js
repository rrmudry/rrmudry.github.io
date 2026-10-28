// Cannon Duel online class battles (Firestore).
//   cannon_lobbies/{CODE}                 lobby: round number, settings, status (host = teacher only)
//   cannon_lobbies/{CODE}/teams/{uid}     one doc per team device (each team writes only its own)
//   cannon_lobbies/{CODE}/matches/{id}    one doc per pairing; only its two teams may update it
// The shooter's computer resolves each shot (impacts, damage, craters) and stores it in a
// transaction that checks it is still that team's turn; everyone else replays the stored shot.
// Standings are computed from the match docs, so nothing depends on a losing team reporting in.
(function () {
  'use strict';
  const { E, $, esc, sound, renderer, UI, Dock, Duel, App, showResult, colorOf } = window.CannonApp;

  const TEACHER_EMAILS = ['rmudry@orangeusd.org', 'ryan.mudry@gmail.com', 'ryanmudry@gmail.com'];
  const LOBBIES = 'cannon_lobbies';
  const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const HEARTBEAT_MS = 20000;
  const AWAY_MS = 75000;
  const CLAIM_GRACE_S = 8;      // opponent may pass a stalled turn this long after the clock runs out
  const SAVE_KEY = 'cd_online';

  const isAuthorized = (email) => !!email && (email.toLowerCase().endsWith('@orangeusd.org') || TEACHER_EMAILS.includes(email.toLowerCase()));
  const isTeacher = (u) => !!u && TEACHER_EMAILS.includes((u.email || '').toLowerCase());
  const clean = (o) => JSON.parse(JSON.stringify(o));     // Firestore rejects undefined
  const loadSaved = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); } catch (e) { return {}; } };
  const save = (o) => { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...loadSaved(), ...o })); } catch (e) { /* storage blocked */ } };

  let db = null, auth = null, user = null;
  let pickColor = () => 'blue';

  // ---------------------------------------------------------------- standings
  function standings(teams, matches) {
    const rows = new Map();
    const row = (t) => {
      if (!rows.has(t.uid)) rows.set(t.uid, { uid: t.uid, name: t.name, color: t.color, w: 0, l: 0, d: 0, dmg: 0, hits: 0, pts: 0 });
      return rows.get(t.uid);
    };
    teams.forEach(row);
    for (const m of matches) {
      m.teams.forEach((t, i) => {
        if (t.uid === 'cpu') return;
        const r = row(t);
        for (const s of m.shots || []) if (s.by === i && !s.skipped) { r.dmg += s.dmg[1 - i]; if (s.direct) r.hits++; }
        if (m.status !== 'done') return;
        if (m.winner === i) r.w++; else if (m.winner === -1) r.d++; else r.l++;
      });
    }
    const list = [...rows.values()];
    list.forEach((r) => { r.pts = r.w * 3 + r.d; });
    return list.sort((a, b) => b.pts - a.pts || b.dmg - a.dmg || a.name.localeCompare(b.name));
  }

  function renderStandings(table, list, meUid) {
    table.innerHTML = '<tr><th>#</th><th>Team</th><th>W</th><th>L</th><th>D</th><th>Pts</th><th title="Damage dealt">Dmg</th></tr>' +
      (list.length ? list.map((r, i) => `<tr class="${r.uid === meUid ? 'me' : ''}"><td class="n">${i + 1}</td><td><span class="chip" style="display:inline-block;vertical-align:-2px;background:${colorOf(r)}"></span> ${esc(r.name)}</td>
        <td class="n">${r.w}</td><td class="n">${r.l}</td><td class="n">${r.d}</td><td class="n"><b>${r.pts}</b></td><td class="n">${r.dmg}</td></tr>`).join('')
        : '<tr><td colspan="7" class="muted">No teams yet</td></tr>');
  }

  const fresh = (t) => Date.now() - (t.lastSeen || 0) < AWAY_MS;

  // ---------------------------------------------------------------- one networked match
  class OnlineMatch {
    constructor(ref, data, myUid, { onExit }) {
      this.ref = ref;
      this.data = data;
      this.myUid = myUid;
      this.onExit = onExit;
      this.side = data.teams.findIndex((t) => t.uid === myUid);       // −1 = spectator (host)
      this.animating = false;
      this.firing = false;
      this.finished = false;
      this.turnKey = '';
      const controls = data.teams.map((t, i) => {
        if (i === this.side) return 'human';
        if (t.uid === 'cpu' && this.side >= 0) return 'cpu';          // bye round: this device runs Cannonbot
        return 'remote';
      });
      App.stopDemo();
      ['menu', 'online', 'hostView', 'result'].forEach((id) => UI.hide(id));
      this.duel = new Duel({
        seed: data.seed, teams: data.teams, controls, me: this.side,
        midLabel: () => this.midLabel(),
        onFire: (idx, angle, speed, ammo) => this.fire(idx, angle, speed, ammo),
        onOver: (w) => this.showOver(w),
      });
      App.duel = this.duel;
      // Catch up on everything that already happened
      for (const c of data.craters || []) this.duel.world.applyCrater(c);
      for (const s of data.shots || []) this.duel.record(s.by, s);
      this.playedSeq = data.seq || 0;
      this.applyState();
      this.unsub = ref.onSnapshot((snap) => { if (snap.exists) { this.data = snap.data(); this.pump(); } });
      this.tick = setInterval(() => this.clock(), 250);
    }

    destroy() {
      if (this.unsub) this.unsub();
      clearInterval(this.tick);
      Dock.setTimer(null);
    }

    midLabel() {
      const d = this.data, done = (d.shots || []).length;
      const n = Math.min(d.shotLimit * 2, done + 1);
      return d.status === 'done' ? `Round ${d.round}` : `Round ${d.round} · Shot ${Math.ceil(n / 2)}/${d.shotLimit}`;
    }

    // Replay any shots we haven't shown yet, one at a time, then match the stored state.
    pump() {
      if (this.animating) return;
      const next = (this.data.shots || []).find((s) => s.seq === this.playedSeq + 1);
      if (next) {
        if (next.skipped) {
          this.duel.record(next.by, next);
          this.playedSeq = next.seq;
          if (next.by === this.side) UI.toast('⏰ Time ran out, so your turn was skipped.');
          return this.pump();
        }
        this.animating = true;
        this.duel.play(next.by, { ...next }, () => {
          this.animating = false;
          this.playedSeq = next.seq;
          this.pump();
        });
        return;
      }
      this.applyState();
    }

    applyState() {
      const d = this.data, duel = this.duel;
      duel.hp = d.hp.slice();
      duel.ammo = d.ammo.map((a) => ({ ...a }));
      renderer.hp = duel.hp.slice();
      if (d.status === 'done') {
        if (!this.finished) { this.finished = true; duel.finish(d.winner); }
        return;
      }
      const key = `${d.seq}:${d.turn}`;
      if (key !== this.turnKey) {
        const firstLook = this.turnKey === '';
        this.turnKey = key;
        this.firing = false;
        duel.beginTurn(d.turn, { quiet: firstLook && d.turn !== this.side });
      } else duel.updateHud();
    }

    clock() {
      const d = this.data;
      if (d.status !== 'live' || this.animating) { if (d.status !== 'live') Dock.setTimer(null); return; }
      const left = d.turnSec - (Date.now() - d.turnStartedAt) / 1000;
      Dock.setTimer(left);
      const turnCtl = this.duel.controls[d.turn];
      if (this.firing) return;
      if ((turnCtl === 'human' && left <= 0) || (turnCtl === 'remote' && this.side >= 0 && left <= -CLAIM_GRACE_S)) this.skipTurn();
    }

    // Build the rest of the match doc after one more shot (or skip).
    nextState(d, rec) {
      const shots = [...(d.shots || []), rec];
      const hp = d.hp.map((h, j) => Math.max(0, h - (rec.dmg ? rec.dmg[j] : 0)));
      const taken = [0, 1].map((i) => shots.filter((s) => s.by === i).length);
      let status = 'live', winner = null;
      if (hp[0] <= 0 || hp[1] <= 0) {
        status = 'done';
        winner = hp[0] <= 0 && hp[1] <= 0 ? -1 : hp[0] <= 0 ? 1 : 0;
      } else if (taken[0] >= d.shotLimit && taken[1] >= d.shotLimit) {
        status = 'done';
        winner = hp[0] === hp[1] ? -1 : hp[0] > hp[1] ? 0 : 1;
      }
      // The next team's clock starts once the replay is over on their screen
      const flight = rec.skipped ? 0 : Math.max(...rec.impacts.map((im) => im.t));
      const startAt = Date.now() + Math.round((flight / E.PLAYBACK + 2) * 1000);
      return { seq: rec.seq, shots, hp, turn: 1 - rec.by, turnStartedAt: startAt, status, winner, updatedAt: Date.now() };
    }

    async commit(build) {
      const expectSeq = this.data.seq, expectTurn = this.data.turn;
      return db.runTransaction(async (tx) => {
        const snap = await tx.get(this.ref);
        const d = snap.data();
        if (!d || d.status !== 'live' || d.seq !== expectSeq || d.turn !== expectTurn) throw new Error('stale');
        const update = build(d);
        tx.update(this.ref, clean(update));
        return update;
      });
    }

    async fire(idx, angle, speed, ammo) {
      if (this.firing || this.animating || this.data.status !== 'live' || this.data.turn !== idx) return;
      this.firing = true;
      Dock.show(Dock.idx, false, 'Firing…');
      const shot = this.duel.world.resolveShot(idx, angle, speed, ammo);
      try {
        await this.commit((d) => {
          const rec = { ...shot, seq: d.seq + 1, by: idx, at: Date.now() };
          const ammoLeft = d.ammo.map((a) => ({ ...a }));
          if (ammo !== 'std') ammoLeft[idx][ammo] = Math.max(0, ammoLeft[idx][ammo] - 1);
          return { ...this.nextState(d, rec), ammo: ammoLeft, craters: [...(d.craters || []), ...shot.craters] };
        });
        // The snapshot listener replays our own stored shot, same as everyone else's.
      } catch (e) {
        this.firing = false;
        UI.toast(e.message === 'stale' ? 'Your turn ended before that shot went through.' : 'Could not send your shot. Check your connection and fire again.');
        this.turnKey = '';
        this.pump();
      }
    }

    async skipTurn() {
      this.firing = true;
      try {
        await this.commit((d) => this.nextState(d, { seq: d.seq + 1, by: d.turn, skipped: true, dmg: [0, 0], offset: null, at: Date.now() }));
      } catch (e) {
        this.firing = false;
      }
    }

    showOver(w) {
      const d = this.data, duel = this.duel;
      let title, sub, trophy;
      if (this.side < 0) {
        title = w < 0 ? 'Draw!' : `${d.teams[w].name} win!`; trophy = w < 0 ? '🤝' : '🏆'; sub = `Round ${d.round}`;
      } else if (w < 0) { title = 'Draw!'; sub = 'Dead even.'; trophy = '🤝'; }
      else if (w === this.side) { title = 'Victory!'; sub = `You beat ${d.teams[1 - this.side].name}. +3 points`; trophy = '🏆'; }
      else { title = `${d.teams[w].name} win`; sub = 'Study your landing distances: next round is yours.'; trophy = '💥'; }
      if (d.endedBy === 'host') sub += ' (round ended by the teacher; most health left wins)';
      showResult(duel, { title, sub, trophy, buttons: [[this.side < 0 ? 'Back to host panel' : 'Back to lobby', 'primary', () => this.onExit()]] });
    }
  }

  // ---------------------------------------------------------------- lobby (team + host)
  const Online = {
    code: null,
    role: null,             // 'team' | 'host'
    lobby: null,
    teams: [],
    matches: [],
    unsubs: [],
    match: null,
    seenDone: new Set(),

    lobbyRef(code = this.code) { return db.collection(LOBBIES).doc(code); },

    open(prefill) {
      if (!db) { UI.toast('Online play needs an internet connection.'); return; }
      App.stopDemo();
      UI.hide('menu');
      UI.show('online');
      if (prefill) $('joinCode').value = prefill;
      this.step(user ? 'onJoin' : 'onSignIn');
    },

    step(id) {
      ['onSignIn', 'onJoin', 'onLobby'].forEach((s) => { $(s).hidden = s !== id; });
      if (id === 'onJoin') {
        const saved = loadSaved();
        $('onWho').textContent = `Signed in as ${user.email}`;
        if (!$('joinName').value && saved.name) $('joinName').value = saved.name;
        if (!$('joinMembers').value && saved.members) $('joinMembers').value = saved.members;
        pickColor = UI.colorPicker($('joinColors'), saved.color || 'blue');
        $('btnHost').hidden = !isTeacher(user);
        $('joinErr').textContent = '';
      }
    },

    async signIn() {
      $('onErr').textContent = '';
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ hd: 'orangeusd.org', prompt: 'select_account' });
      try { await auth.signInWithPopup(provider); } catch (e) {
        if (e && e.code !== 'auth/popup-closed-by-user') $('onErr').textContent = 'Sign-in did not finish. Try again.';
      }
    },

    // ----- team side
    async join() {
      const code = $('joinCode').value.trim().toUpperCase();
      const name = $('joinName').value.trim();
      const members = $('joinMembers').value.trim();
      const err = $('joinErr');
      if (!/^[A-Z]{4}$/.test(code)) { err.textContent = 'Type the 4-letter code from the board.'; return; }
      if (!name) { err.textContent = 'Give your team a name.'; return; }
      $('btnJoin').disabled = true; err.textContent = '';
      try {
        const snap = await this.lobbyRef(code).get();
        if (!snap.exists || snap.data().status === 'closed') { err.textContent = `No open game with code ${code}. Check the board.`; return; }
        const color = pickColor();
        save({ name, members, color, code });
        await this.lobbyRef(code).collection('teams').doc(user.uid).set({
          uid: user.uid, name, members, color, studentId: user.email.split('@')[0], joinedAt: Date.now(), lastSeen: Date.now(),
        });
        this.enterTeam(code);
      } catch (e) {
        console.error(e);
        err.textContent = 'Could not join. Check the code and your connection.';
      } finally { $('btnJoin').disabled = false; }
    },

    enterTeam(code) {
      this.stopListening();
      this.code = code; this.role = 'team';
      this.seenDone = new Set();
      App.leaveHook = () => this.leave(true);
      $('lobbyCode').textContent = code;
      this.step('onLobby');
      const ref = this.lobbyRef();
      this.unsubs.push(ref.onSnapshot((s) => {
        if (!s.exists || s.data().status === 'closed') { this.kicked('The teacher closed this game. Thanks for playing!'); return; }
        this.lobby = s.data(); this.refreshTeam();
      }));
      this.unsubs.push(ref.collection('teams').onSnapshot((qs) => {
        this.teams = qs.docs.map((d) => d.data());
        if (this.lobby && !this.teams.some((t) => t.uid === user.uid) && this.joinedOnce) { this.kicked('Your team was removed from the lobby.'); return; }
        if (this.teams.some((t) => t.uid === user.uid)) this.joinedOnce = true;
        this.refreshTeam();
      }));
      this.unsubs.push(ref.collection('matches').onSnapshot((qs) => { this.matches = qs.docs.map((d) => ({ id: d.id, ...d.data() })); this.refreshTeam(); }));
      const beat = () => ref.collection('teams').doc(user.uid).update({ lastSeen: Date.now() }).catch(() => {});
      this.heartbeat = setInterval(beat, HEARTBEAT_MS);
    },

    refreshTeam() {
      if (this.role !== 'team' || !this.lobby) return;
      const L = this.lobby, me = user.uid;
      $('lobbyTitle').textContent = 'Lobby';
      const mine = this.matches.filter((m) => m.uids.includes(me)).sort((a, b) => b.round - a.round)[0];
      const current = mine && mine.round === L.round ? mine : null;

      if (current && current.status === 'live' && !this.match) { this.play(current); return; }

      let status;
      if (!L.round) status = '⏳ Waiting for your teacher to start Round 1…';
      else if (current && current.status === 'done') {
        const side = current.teams.findIndex((t) => t.uid === me);
        const res = current.winner === -1 ? 'a draw' : current.winner === side ? 'a WIN 🏆' : 'a loss';
        status = `Round ${L.round} done: ${res} vs ${esc(current.teams[1 - side].name)}. Waiting for Round ${L.round + 1}…`;
      } else if (!current) status = `Round ${L.round} is underway. You'll be paired next round.`;
      else status = `Round ${L.round}: get ready!`;
      $('lobbyStatus').innerHTML = status;

      $('lobbyTeams').innerHTML = this.teams.map((t) => `<li class="${t.uid === me ? 'me' : ''}"><span class="dot ${fresh(t) ? '' : 'away'}"></span><span class="chip" style="background:${colorOf(t)}"></span>
        <span>${esc(t.name)}</span><span class="members">${esc(t.members || '')}</span></li>`).join('');
      renderStandings($('lobbyStandings'), standings(this.teams, this.matches), me);
    },

    play(m) {
      const ref = this.lobbyRef().collection('matches').doc(m.id);
      this.match = new OnlineMatch(ref, m, user.uid, { onExit: () => this.backToLobby() });
    },

    backToLobby() {
      if (this.match) { this.match.destroy(); this.match = null; }
      App.endDuel();
      UI.hideHud();
      if (this.role === 'host') { this.showHost(); return; }
      UI.hide('menu');
      UI.show('online');
      this.step('onLobby');
      this.refreshTeam();
    },

    kicked(msg) {
      this.leave(false);
      App.goMenu();
      UI.toast(msg, 4000);
    },

    leave(removeTeam) {
      if (removeTeam && this.role === 'team' && this.code && user) this.lobbyRef().collection('teams').doc(user.uid).delete().catch(() => {});
      if (this.role === 'team') save({ code: null });
      this.stopListening();
      if (this.match) { this.match.destroy(); this.match = null; }
      this.role = null; this.code = null; this.lobby = null; this.teams = []; this.matches = []; this.joinedOnce = false;
      App.leaveHook = null;
      $('btnHostPanel').hidden = true;
    },

    stopListening() {
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
      clearInterval(this.heartbeat);
      clearInterval(this.hostTick);
    },

    // ----- host side
    async host() {
      const saved = loadSaved();
      if (saved.hostCode) {
        const s = await this.lobbyRef(saved.hostCode).get().catch(() => null);
        if (s && s.exists && s.data().status !== 'closed' && s.data().hostUid === user.uid &&
            confirm(`Resume your lobby ${saved.hostCode}? (Cancel starts a new one.)`)) { this.enterHost(saved.hostCode); return; }
      }
      let code;
      for (let k = 0; k < 8; k++) {
        code = Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
        const s = await this.lobbyRef(code).get();
        if (!s.exists || s.data().status === 'closed') break;
      }
      try {
        await this.lobbyRef(code).set({
          code, hostUid: user.uid, hostName: user.displayName || 'Teacher', createdAt: Date.now(),
          round: 0, status: 'open', shotLimit: +$('hostShots').value, turnSec: +$('hostTimer').value,
        });
      } catch (e) {
        console.error(e);
        $('joinErr').textContent = 'Could not create the lobby (only the teacher account can host).';
        return;
      }
      save({ hostCode: code });
      this.enterHost(code);
    },

    enterHost(code) {
      this.stopListening();
      this.code = code; this.role = 'host';
      App.leaveHook = () => this.leave(false);
      UI.hide('online');
      const url = `${location.origin}${location.pathname}`.replace(/index\.html$/, '');
      $('hostUrl').textContent = url.replace(/^https?:\/\//, '');
      $('hostCode').textContent = code;
      const ref = this.lobbyRef();
      this.unsubs.push(ref.onSnapshot((s) => {
        if (!s.exists) return;
        this.lobby = s.data();
        $('hostShots').value = String(this.lobby.shotLimit);
        $('hostTimer').value = String(this.lobby.turnSec);
        this.refreshHost();
      }));
      this.unsubs.push(ref.collection('teams').onSnapshot((qs) => { this.teams = qs.docs.map((d) => d.data()); this.refreshHost(); }));
      this.unsubs.push(ref.collection('matches').onSnapshot((qs) => {
        this.matches = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
        this.refreshHost();
      }));
      this.hostTick = setInterval(() => this.refreshHost(), 5000);      // keeps the away dots honest
      this.showHost();
    },

    showHost() {
      App.stopDemo();
      UI.hideHud();
      ['menu', 'online', 'result'].forEach((id) => UI.hide(id));
      $('btnHostPanel').hidden = true;
      UI.show('hostView');
      this.refreshHost();
    },

    refreshHost() {
      if (this.role !== 'host' || !this.lobby) return;
      const L = this.lobby;
      const roundMatches = this.matches.filter((m) => m.round === L.round);
      const live = roundMatches.filter((m) => m.status === 'live');
      $('hostRoundLbl').textContent = L.round ? `Round ${L.round}: ${live.length ? `${live.length} battle${live.length > 1 ? 's' : ''} in progress` : 'all battles finished'}` : 'Waiting for teams';
      $('btnRound').textContent = L.round && live.length ? `End round & start round ${L.round + 1}` : `Pair teams & start round ${L.round + 1}`;
      $('btnEndRound').hidden = !live.length;
      $('hostTeamCount').textContent = this.teams.length;
      const busy = new Set(live.flatMap((m) => m.uids));
      $('hostTeams').innerHTML = this.teams.length ? this.teams.map((t) => `<li><span class="dot ${fresh(t) ? '' : 'away'}" title="${fresh(t) ? 'Connected' : 'Not seen for a bit'}"></span>
        <span class="chip" style="background:${colorOf(t)}"></span><span>${esc(t.name)}${busy.has(t.uid) ? ' ⚔️' : ''}</span>
        <span class="members">${esc(t.members || t.studentId || '')}</span><button class="x" data-rm="${esc(t.uid)}" title="Remove team">✕</button></li>`).join('')
        : '<li class="muted">No teams yet. Share the code!</li>';
      $('hostTeams').querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => {
        const t = this.teams.find((x) => x.uid === b.dataset.rm);
        if (t && confirm(`Remove ${t.name} from the lobby?`)) this.lobbyRef().collection('teams').doc(t.uid).delete();
      }));

      const grid = $('hostMatches');
      if (!roundMatches.length) grid.innerHTML = '<p class="muted">Start a round to pair teams.</p>';
      else {
        grid.innerHTML = roundMatches.sort((a, b) => (a.status === b.status ? a.id.localeCompare(b.id) : a.status === 'live' ? -1 : 1)).map((m) => {
          const shots = (m.shots || []).length;
          const sides = m.teams.map((t, i) => `<div class="side ${m.status === 'live' && m.turn === i ? 'turn' : ''} ${m.status === 'done' && m.winner === i ? 'win' : ''}">
            <span class="chip" style="background:${colorOf(t)}"></span><span>${esc(t.name)}</span>
            <div class="hpbar"><i style="width:${m.hp[i]}%;background:${m.hp[i] > 50 ? '#22c55e' : m.hp[i] > 25 ? '#facc15' : '#ef4444'}"></i></div></div>`).join('');
          const meta = m.status === 'done' ? (m.winner === -1 ? 'Draw' : 'Finished') : `Shot ${Math.min(m.shotLimit, Math.ceil((shots + 1) / 2))}/${m.shotLimit}`;
          return `<div class="match ${m.status}">${sides}<div class="meta"><span>${meta}</span><button data-watch="${m.id}">👀 Watch</button></div></div>`;
        }).join('');
        grid.querySelectorAll('[data-watch]').forEach((b) => b.addEventListener('click', () => this.watch(b.dataset.watch)));
      }
      renderStandings($('hostStandings'), standings(this.teams, this.matches), null);
    },

    watch(id) {
      const m = this.matches.find((x) => x.id === id);
      if (!m) return;
      UI.hide('hostView');
      $('btnHostPanel').hidden = false;
      if (this.match) this.match.destroy();
      this.match = new OnlineMatch(this.lobbyRef().collection('matches').doc(id), m, user.uid, { onExit: () => this.backToLobby() });
    },

    // Pair teams that are connected and free, avoiding rematches where possible.
    // An odd team out plays Cannonbot (preferring a team that hasn't had a bye yet).
    pairUp(teams) {
      const met = new Set(), byes = new Map();
      for (const m of this.matches) {
        if (m.uids.length === 2) met.add(m.uids.slice().sort().join('|'));
        else byes.set(m.uids[0], (byes.get(m.uids[0]) || 0) + 1);
      }
      let best = null;
      for (let k = 0; k < 300; k++) {
        const arr = teams.slice();
        for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
        let cost = 0;
        const pairs = [];
        for (let i = 0; i + 1 < arr.length; i += 2) {
          if (met.has([arr[i].uid, arr[i + 1].uid].sort().join('|'))) cost += 10;
          pairs.push([arr[i], arr[i + 1]]);
        }
        const bye = arr.length % 2 ? arr[arr.length - 1] : null;
        if (bye) cost += (byes.get(bye.uid) || 0) * 4;
        if (!best || cost < best.cost) best = { cost, pairs, bye };
        if (cost === 0) break;
      }
      return best;
    },

    async endRound() {
      const live = this.matches.filter((m) => m.round === this.lobby.round && m.status === 'live');
      if (!live.length) return;
      const b = db.batch();
      for (const m of live) {
        b.update(this.lobbyRef().collection('matches').doc(m.id), {
          status: 'done', winner: m.hp[0] === m.hp[1] ? -1 : m.hp[0] > m.hp[1] ? 0 : 1, endedBy: 'host', updatedAt: Date.now(),
        });
      }
      await b.commit();
    },

    async startRound() {
      const L = this.lobby;
      const live = this.matches.filter((m) => m.round === L.round && m.status === 'live');
      if (live.length && !confirm(`${live.length} battle(s) are still going. End them now (most health left wins) and start the next round?`)) return;
      const ready = this.teams.filter(fresh);
      if (!ready.length) { UI.toast('No connected teams yet. Have them join with the code.'); return; }
      $('btnRound').disabled = true;
      try {
        if (live.length) await this.endRound();
        const round = L.round + 1;
        const shotLimit = +$('hostShots').value, turnSec = +$('hostTimer').value;
        const { pairs, bye } = this.pairUp(ready);
        const b = db.batch();
        const mk = (k, a, c, cpu) => {
          const teams = [a, c].map((t) => ({ uid: t.uid, name: t.name, color: t.color || 'blue', diff: t.diff }));
          if (teams[0].color === teams[1].color) teams[1].color = Object.keys(E.TEAM_COLORS).find((x) => x !== teams[0].color && x !== 'gold');
          const first = Math.random() < 0.5 ? 0 : 1;
          b.set(this.lobbyRef().collection('matches').doc(`r${round}_${k}`), clean({
            round, seed: (Math.random() * 2 ** 32) >>> 0, teams, uids: teams.map((t) => t.uid).filter((u) => u !== 'cpu'), cpu: !!cpu,
            hp: [E.HP_MAX, E.HP_MAX], ammo: [0, 1].map(() => ({ heavy: E.AMMO.heavy.count, triple: E.AMMO.triple.count })),
            craters: [], shots: [], seq: 0, turn: cpu ? 0 : first, turnStartedAt: Date.now() + 4000, shotLimit, turnSec,
            status: 'live', winner: null, createdAt: Date.now(), updatedAt: Date.now(),
          }));
        };
        pairs.forEach(([a, c], k) => mk(k + 1, a, c, false));
        if (bye) mk(pairs.length + 1, bye, { uid: 'cpu', name: 'Cannonbot', color: 'red', diff: 'medium' }, true);
        b.update(this.lobbyRef(), { round, status: 'playing', shotLimit, turnSec });
        await b.commit();
        UI.toast(`Round ${round} started: ${pairs.length} battle${pairs.length === 1 ? '' : 's'}${bye ? ` + ${bye.name} vs Cannonbot` : ''}.`);
      } catch (e) {
        console.error(e);
        UI.toast('Could not start the round. Check your connection.');
      } finally { $('btnRound').disabled = false; }
    },

    async closeLobby() {
      if (!confirm('Close this lobby? Teams will be sent back to the menu.')) return;
      await this.lobbyRef().update({ status: 'closed' }).catch(() => {});
      save({ hostCode: null });
      this.leave(false);
      UI.hide('hostView');
      App.goMenu();
    },
  };

  // ---------------------------------------------------------------- wiring
  $('modeOnline').addEventListener('click', () => { sound.click(); Online.open(); });
  $('btnOnSignIn').addEventListener('click', () => Online.signIn());
  $('btnOnSignOut').addEventListener('click', () => { if (auth) auth.signOut(); });
  $('btnJoin').addEventListener('click', () => Online.join());
  $('joinCode').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''); });
  $('btnHost').addEventListener('click', () => Online.host());
  $('btnLeave').addEventListener('click', () => { Online.leave(true); App.goMenu(); });
  $('btnRound').addEventListener('click', () => Online.startRound());
  $('btnEndRound').addEventListener('click', () => { if (confirm('End every battle in this round now? Most health left wins.')) Online.endRound(); });
  $('btnHostClose').addEventListener('click', () => Online.closeLobby());
  $('btnHostPanel').addEventListener('click', () => Online.backToLobby());
  ['hostShots', 'hostTimer'].forEach((id) => $(id).addEventListener('change', () => {
    if (Online.role === 'host') Online.lobbyRef().update({ shotLimit: +$('hostShots').value, turnSec: +$('hostTimer').value }).catch(() => {});
  }));

  if (typeof firebase !== 'undefined' && firebase.firestore) {
    try {
      db = firebase.firestore();
      auth = firebase.auth();
      let first = true;
      auth.onAuthStateChanged((u) => {
        if (u && !isAuthorized(u.email)) {
          $('onErr').textContent = 'Please sign in with your school @orangeusd.org account.';
          auth.signOut();
          return;
        }
        user = u || null;
        if (!$('online').hidden) Online.step(user ? 'onJoin' : 'onSignIn');
        // Links like …/Cannon_duel/?join=ABCD open the join screen; a reload drops you back in your lobby
        if (first) {
          first = false;
          const params = new URLSearchParams(location.search);
          const join = (params.get('join') || '').toUpperCase();
          const saved = loadSaved();
          if (user && saved.code && (!join || join === saved.code)) {
            Online.lobbyRef(saved.code).collection('teams').doc(user.uid).get().then((s) => {
              if (s.exists) { App.stopDemo(); UI.hide('menu'); UI.show('online'); Online.enterTeam(saved.code); }
              else if (join) Online.open(join);
            }).catch(() => {});
          } else if (join) Online.open(join);
        }
      });
    } catch (e) {
      console.warn('Firebase unavailable; online play is off.', e);
    }
  }

  window.CannonOnline = Online;
})();
