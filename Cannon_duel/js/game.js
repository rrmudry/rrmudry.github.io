// Cannon Duel: menus, the aiming dock, the turn-based Duel, Cannonbot, and the menu demo.
// Online play (js/online.js) reuses Duel with the network deciding whose turn it is.
(function () {
  'use strict';
  const E = window.CannonEngine;
  const $ = (id) => document.getElementById(id);
  const sound = new E.Sound();
  const renderer = new E.Renderer($('cv'), sound);
  const AMMO_START = () => ({ heavy: E.AMMO.heavy.count, triple: E.AMMO.triple.count });
  const colorOf = (t) => (E.TEAM_COLORS[t.color] || E.TEAM_COLORS.blue).main;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------------------------------------------------------------- small UI helpers
  const UI = {
    show(id) { $(id).hidden = false; },
    hide(id) { $(id).hidden = true; },
    bannerTimer: null,
    banner(text, sub = '', ms = 1500) {
      const b = $('banner');
      b.innerHTML = esc(text) + (sub ? `<small>${esc(sub)}</small>` : '');
      b.classList.add('show');
      clearTimeout(this.bannerTimer);
      this.bannerTimer = setTimeout(() => b.classList.remove('show'), ms);
    },
    toastTimer: null,
    toast(text, ms = 2600) {
      const t = $('toast');
      t.textContent = text; t.classList.add('show');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => t.classList.remove('show'), ms);
    },
    hud(teams, hp, turn, mid = 'VS') {
      [0, 1].forEach((i) => {
        const el = $('hud' + i), t = teams[i];
        el.querySelector('.chip').style.background = colorOf(t);
        el.querySelector('.nm').textContent = t.name;
        const f = Math.max(0, hp[i]) / E.HP_MAX;
        const bar = el.querySelector('.hp i');
        bar.style.width = (f * 100) + '%';
        bar.style.background = f > 0.5 ? '#22c55e' : f > 0.25 ? '#facc15' : '#ef4444';
        el.querySelector('.hpn').textContent = Math.max(0, hp[i]);
        el.classList.toggle('turn', turn === i);
      });
      $('hudMid').textContent = mid;
      $('hud').style.visibility = 'visible';
    },
    hideHud() { $('hud').style.visibility = 'hidden'; },
    // Color swatches; returns a getter for the chosen color
    colorPicker(container, initial, exclude) {
      container.innerHTML = '';
      let chosen = initial;
      Object.entries(E.TEAM_COLORS).forEach(([key, c]) => {
        if (exclude && exclude === key) return;
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'swatch' + (key === initial ? ' sel' : '');
        b.style.background = c.main; b.title = key; b.dataset.c = key;
        b.addEventListener('click', () => {
          chosen = key; sound.click();
          container.querySelectorAll('.swatch').forEach((s) => s.classList.toggle('sel', s === b));
        });
        container.appendChild(b);
      });
      return () => chosen;
    },
  };

  // ---------------------------------------------------------------- aiming dock
  const Dock = {
    el: $('dock'),
    duel: null,
    idx: 0,          // team whose controls/recon are shown
    enabled: false,
    ammoSel: 'std',
    saboArmed: false,
    attach(duel) { this.duel = duel; this.el.hidden = false; renderer.resize(); },
    detach() { this.duel = null; this.el.hidden = true; this.setTimer(null); renderer.resize(); },
    show(idx, enabled, sub) {
      const d = this.duel; if (!d) return;
      this.idx = idx; this.enabled = enabled;
      const t = d.teams[idx];
      $('whoChip').style.background = colorOf(t);
      $('whoName').textContent = t.name;
      $('whoSub').textContent = sub;
      this.el.classList.toggle('locked', !enabled);
      const aim = d.aims[idx];
      this.writeInputs(aim.angle, aim.speed);
      if (!d.ammo[idx][this.ammoSel] && this.ammoSel !== 'std') this.ammoSel = 'std';
      this.saboArmed = false;
      this.renderAmmo();
      this.renderIntel();
      this.renderJam();
    },
    // The sabotage on this team right now, if it is their turn
    jam() { const d = this.duel; return d && d.turn === this.idx ? E.jamFor(d.shots, this.idx) : null; },
    renderJam() {
      const d = this.duel; if (!d) return;
      const jam = this.jam(), angle = d.aims[this.idx].angle, blocked = E.isJammed(jam, angle);
      const ctl = document.querySelector('.ctl-angle');
      ctl.classList.toggle('has-jam', !!jam);
      ctl.classList.toggle('blocked', blocked);
      $('jamNote').hidden = !jam;
      if (jam) {
        $('jamNote').textContent = `🔧 jammed: ${E.jamAllowed(jam)}`;
        $('jamZone').style.left = `calc(8px + (100% - 16px) * ${jam.lo / 90})`;
        $('jamZone').style.width = `calc((100% - 16px) * ${(jam.hi - jam.lo) / 90})`;
      }
      const fire = $('btnFire');
      fire.disabled = !this.enabled || blocked;
      fire.textContent = blocked && this.enabled ? 'JAMMED' : this.saboArmed ? 'FIRE + 🔧' : 'FIRE!';
      fire.classList.toggle('armed', this.saboArmed);
    },
    writeInputs(angle, speed) {
      $('angleRange').value = angle; $('angleNum').value = angle.toFixed(1);
      $('speedRange').value = speed; $('speedNum').value = speed.toFixed(1);
    },
    set(key, value, fromNum) {
      if (!this.enabled || !this.duel) return;
      const lim = key === 'angle' ? [0, 90] : [5, 80];
      if (!isFinite(value)) return;
      value = Math.round(Math.min(lim[1], Math.max(lim[0], value)) * 10) / 10;
      this.duel.aims[this.idx][key] = value;
      $(key + 'Range').value = value;
      if (!fromNum) $(key + 'Num').value = value.toFixed(1);
      if (key === 'angle') this.renderJam();
    },
    renderAmmo() {
      const counts = this.duel.ammo[this.idx];
      document.querySelectorAll('.ammo-btn').forEach((b) => {
        const k = b.dataset.ammo, n = k === 'std' ? '∞' : counts[k];
        b.querySelector('b').textContent = n;
        b.disabled = k !== 'std' && !counts[k];
        b.classList.toggle('sel', k === this.ammoSel);
      });
      const d = this.duel, sb = $('btnSabo');
      sb.hidden = !d.saboOn;
      const used = d.saboUsed(this.idx), why = d.saboBlocker(this.idx);
      sb.querySelector('b').textContent = used ? 0 : 1;
      sb.disabled = !!why;
      sb.title = why || `Send a jam with this shot: next turn, ${d.teams[1 - this.idx].name} can't fire within ${E.JAM_DEG}° of their last launch angle.`;
      sb.classList.toggle('sel', this.saboArmed && !why);
      if (why) this.saboArmed = false;
    },
    renderIntel() {
      const d = this.duel, rec = d.world.recon(this.idx);
      const dy = rec.dy === 0 ? '0.0 m (level)' : `${rec.dy > 0 ? '+' : '−'}${Math.abs(rec.dy).toFixed(1)} m (${rec.dy > 0 ? 'higher' : 'lower'})`;
      $('recon').innerHTML = `<b>Recon: enemy pivot</b><br>Δx = ${rec.dx.toFixed(1)} m<br class="wide"><span class="sep"></span>Δy = ${dy}<br>g = 10 m/s²`;
      const mine = d.shots.filter((s) => s.by === this.idx).slice(-3).reverse();
      $('shotLog').querySelector('tbody').innerHTML = mine.length ? mine.map((s) => {
        let cls = '', txt;
        if (s.skipped) txt = 'time ran out';
        else if (s.direct) { cls = 'hit'; txt = 'DIRECT HIT'; }
        else if (s.offset === null) txt = 'off the map';
        else { cls = s.offset > 0 ? 'long' : 'short'; txt = `${Math.abs(s.offset).toFixed(1)} m ${s.offset > 0 ? 'long' : 'short'}`; }
        if (!s.skipped && !s.direct && s.dmg[1 - this.idx] > 0) txt += ` (−${s.dmg[1 - this.idx]})`;
        if (s.sabotage) txt += ' 🔧';
        return `<tr><td>${s.skipped ? '—' : s.angle.toFixed(1) + '°'}</td><td>${s.skipped ? '—' : s.speed.toFixed(1)}</td><td class="${cls}">${txt}</td></tr>`;
      }).join('') : '<tr><td colspan="3" class="muted">No shots yet</td></tr>';
    },
    setTimer(sec) {
      const t = $('timer');
      if (sec === null) { t.hidden = true; return; }
      t.hidden = false;
      const s = Math.max(0, Math.ceil(sec));
      t.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      t.classList.toggle('low', s <= 10);
    },
    fire() {
      if (!this.enabled || !this.duel) return;
      const a = this.duel.aims[this.idx], jam = this.jam();
      if (E.isJammed(jam, a.angle)) {
        sound.jam();
        UI.toast(`🔧 Your cannon is jammed near ${jam.angle.toFixed(1)}°. Pick ${E.jamAllowed(jam)}.`);
        return;
      }
      this.duel.humanFire(a.angle, a.speed, this.ammoSel, this.saboArmed);
    },
  };

  $('angleRange').addEventListener('input', (e) => Dock.set('angle', +e.target.value));
  $('speedRange').addEventListener('input', (e) => Dock.set('speed', +e.target.value));
  ['angle', 'speed'].forEach((k) => {
    const num = $(k + 'Num');
    num.addEventListener('input', () => { if (num.value !== '') Dock.set(k, +num.value, true); });
    num.addEventListener('change', () => Dock.set(k, +num.value));
    num.addEventListener('keydown', (e) => { if (e.key === 'Enter') { num.blur(); } });
  });
  document.querySelectorAll('.nudge').forEach((b) => b.addEventListener('click', (e) => {
    if (!Dock.duel) return;
    const k = b.dataset.k, step = +b.dataset.d * (e.shiftKey ? 0.2 : 1);
    Dock.set(k, Dock.duel.aims[Dock.idx][k] + step); sound.click();
  }));
  document.querySelectorAll('.ammo-btn').forEach((b) => b.addEventListener('click', () => {
    if (!Dock.enabled) return;
    Dock.ammoSel = b.dataset.ammo; Dock.renderAmmo(); sound.click();
  }));
  $('btnSabo').addEventListener('click', () => {
    if (!Dock.enabled || !Dock.duel || Dock.duel.saboBlocker(Dock.idx)) return;
    Dock.saboArmed = !Dock.saboArmed; Dock.renderAmmo(); Dock.renderJam(); sound.click();
  });
  $('btnFire').addEventListener('click', () => Dock.fire());
  document.addEventListener('keydown', (e) => {
    if (!Dock.enabled || !Dock.duel || document.querySelector('.overlay:not([hidden])')) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' && e.target.type !== 'range') return;
    const step = e.shiftKey ? 0.1 : 0.5, aim = Dock.duel.aims[Dock.idx];
    const map = { ArrowLeft: ['angle', -step], ArrowRight: ['angle', step], ArrowUp: ['speed', step], ArrowDown: ['speed', -step] };
    if (map[e.key]) {
      e.preventDefault();
      const [k, d] = map[e.key];
      Dock.set(k, aim[k] + d);
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault(); Dock.fire();
    }
  });

  // ---------------------------------------------------------------- Duel
  // controls[i]: 'human' (this device aims), 'cpu', or 'remote' (shots arrive from the network)
  class Duel {
    constructor(o) {
      this.o = o;
      this.world = new E.World(o.seed);
      this.teams = o.teams;
      this.controls = o.controls;
      this.hp = [E.HP_MAX, E.HP_MAX];
      this.ammo = [AMMO_START(), AMMO_START()];
      this.aims = [{ angle: 45, speed: 40 }, { angle: 45, speed: 40 }];
      this.shots = [];
      this.stats = [0, 1].map(() => ({ shots: 0, direct: 0, dmg: 0, closest: null }));
      this.turn = -1;
      this.busy = false;
      this.over = false;
      this.cpuShots = [0, 0];
      this.demo = !!o.demo;
      this.saboOn = o.sabotage !== false;
      this.me = o.me !== undefined ? o.me : this.controls.indexOf('human');
      renderer.setWorld(this.world, this.teams);
      renderer.aim = this.aims;
      renderer.hp = this.hp.slice();
      renderer.showAimGuide = o.guide !== false;
      if (!this.demo) { Dock.attach(this); this.updateHud(); }
    }

    destroy() {
      this.over = true;
      clearTimeout(this.cpuTimer);
      cancelAnimationFrame(this.cpuAnim);
    }

    updateHud() {
      if (this.demo) return;
      UI.hud(this.teams, this.hp, this.turn, this.o.midLabel ? this.o.midLabel(this) : 'VS');
    }

    // Sabotage rules. saboBlocker says why a team can't arm it right now ('' = it can).
    saboUsed(idx) { return this.shots.some((s) => s.by === idx && s.sabotage); }
    saboBlocker(idx) {
      const opp = 1 - idx;
      if (!this.saboOn) return 'Sabotage is off for this battle.';
      if (this.saboUsed(idx)) return 'Already used: one sabotage per battle.';
      if (!this.shots.some((s) => s.by === opp && !s.skipped)) return `${this.teams[opp].name} hasn't fired yet, so there's no angle to jam.`;
      if (this.o.turnsLeft && this.o.turnsLeft(opp) <= 0) return `${this.teams[opp].name} has no shots left to jam.`;
      return '';
    }
    // Cannonbot jams you when you're getting close
    cpuWantsSabo(idx) {
      if (this.saboBlocker(idx)) return false;
      const last = this.shots.filter((s) => s.by === 1 - idx && !s.skipped).pop();
      const close = last.direct || last.dmg[idx] > 0 || (last.offset !== null && Math.abs(last.offset) < 15);
      const eager = { easy: 0.4, medium: 0.75, hard: 0.95 }[this.teams[idx].diff] || 0.75;
      return Math.random() < (close ? eager : 0.08);
    }

    beginTurn(idx, opts = {}) {
      if (this.over) return;
      this.turn = idx;
      const ctl = this.controls[idx];
      const jam = E.jamFor(this.shots, idx);
      renderer.active = idx;
      renderer.jam = jam;
      if (!this.demo) {
        this.updateHud();
        const viewIdx = ctl === 'human' ? idx : (this.me >= 0 ? this.me : idx);
        const sub = ctl === 'human' ? (jam ? 'Sabotaged! Aim outside the red zone.' : 'Your turn: aim and fire!')
          : ctl === 'cpu' ? `${this.teams[idx].name} is calculating…` : `${this.teams[idx].name} is aiming…`;
        Dock.show(viewIdx, ctl === 'human', sub);
        if (!opts.quiet) {
          sound.turn();
          UI.banner(ctl === 'human' && this.controls.filter((c) => c === 'human').length === 1 ? 'Your turn!' : `${this.teams[idx].name}`,
            jam ? `🔧 jammed: ${E.jamAllowed(jam)}` : ctl === 'human' ? 'Aim and fire!' : 'is taking aim…', jam ? 2200 : 1300);
        }
        if (jam && ctl === 'human') {
          UI.toast(`🔧 Sabotaged! No launch angles within ${E.JAM_DEG}° of your last one (${jam.angle.toFixed(1)}°). Tip: on level ground, θ and 90° − θ land at the same range.`, 6500);
        }
      }
      if (ctl === 'cpu') this.cpuTurn(idx);
    }

    cpuTurn(idx) {
      const diff = this.teams[idx].diff || 'medium';
      const target = E.cpuAim(this.world, idx, diff, this.cpuShots[idx]++, E.jamFor(this.shots, idx));
      const sabo = this.cpuWantsSabo(idx);
      const from = { ...this.aims[idx] };
      const start = performance.now(), dur = 1300;
      const think = this.demo ? 700 : 900;
      const anim = (now) => {
        if (this.over) return;
        const t = Math.min(1, (now - start - think) / dur);
        if (t > 0) {
          const e = t * t * (3 - 2 * t);
          this.aims[idx].angle = from.angle + (target.angle - from.angle) * e;
          this.aims[idx].speed = from.speed + (target.speed - from.speed) * e;
        }
        if (t < 1) this.cpuAnim = requestAnimationFrame(anim);
        else {
          this.aims[idx] = { ...target }; renderer.aim = this.aims;
          let ammo = 'std';
          const a = this.ammo[idx], r = Math.random();
          if (a.heavy && r < 0.3) ammo = 'heavy'; else if (a.triple && r > 0.85) ammo = 'triple';
          this.cpuTimer = setTimeout(() => this.fire(idx, target.angle, target.speed, ammo, sabo), 250);
        }
      };
      this.cpuAnim = requestAnimationFrame(anim);
    }

    humanFire(angle, speed, ammo, sabo) {
      if (this.busy || this.over || this.controls[this.turn] !== 'human') return;
      if (E.isJammed(E.jamFor(this.shots, this.turn), angle)) return;
      this.fire(this.turn, angle, speed, ammo, sabo && !this.saboBlocker(this.turn));
    }

    fire(idx, angle, speed, ammo, sabo) {
      // Online: the controller resolves the shot, stores it, then calls play()
      if (this.o.onFire) { this.o.onFire(idx, angle, speed, ammo, !!sabo); return; }
      const shot = this.world.resolveShot(idx, angle, speed, ammo);
      if (sabo) shot.sabotage = true;
      this.play(idx, shot);
    }

    // Animate a shot (local or from the network), then apply its result.
    play(idx, shot, after) {
      this.busy = true;
      this.aims[idx] = { angle: shot.angle, speed: shot.speed };
      renderer.aim = this.aims;
      renderer.jam = null;
      if (shot.ammo !== 'std') this.ammo[idx][shot.ammo] = Math.max(0, this.ammo[idx][shot.ammo] - 1);
      if (!this.demo) Dock.show(Dock.idx, false, `${this.teams[idx].name} fired!`);
      renderer.playShot(idx, shot, () => {
        this.apply(idx, shot);
        this.busy = false;
        if (after) after();
        else this.next(idx);
      });
    }

    // Shot log + stats only (online rebuilds use this for shots that happened earlier)
    record(idx, shot) {
      shot.by = idx;
      this.shots.push(shot);
      if (shot.skipped) return;
      const st = this.stats[idx];
      st.shots++;
      if (shot.direct) st.direct++;
      st.dmg += shot.dmg[1 - idx];
      if (shot.offset !== null && (st.closest === null || Math.abs(shot.offset) < Math.abs(st.closest))) st.closest = shot.offset;
    }

    apply(idx, shot) {
      this.record(idx, shot);
      const st = this.stats[idx];
      this.hp = this.hp.map((h, j) => Math.max(0, h - shot.dmg[j]));
      renderer.hp = this.hp.slice();
      if (!this.demo) {
        this.updateHud();
      }
      if (shot.sabotage && this.hp[0] > 0 && this.hp[1] > 0) {
        const c = this.world.cannons[1 - idx];
        renderer.texts.push({ x: c.x, y: c.y + 22, text: '🔧 JAMMED!', color: '#fca5a5', life: 2.2, max: 2.2, big: true });
        sound.jam();
      }
      if (!this.demo && this.controls[idx] === 'human') {
        if (shot.direct && st.shots === 1) UI.toast('🎯 First-shot direct hit! That was calculated.');
        else if (shot.dmg[idx] > 0) UI.toast('😬 Ouch: some of that blast hit your own fort!');
      }
    }

    next(idx) {
      const dead = [0, 1].filter((j) => this.hp[j] <= 0);
      if (dead.length) {
        const winner = dead.length === 2 ? -1 : 1 - dead[0];
        this.finish(winner);
        return;
      }
      this.beginTurn(1 - idx);
    }

    finish(winner) {
      this.over = true;
      this.turn = -1;
      renderer.active = -1;
      renderer.winner = winner;
      [0, 1].forEach((j) => { if (this.hp[j] <= 0) renderer.burst(j); });
      if (this.demo) { this.o.onOver && this.o.onOver(winner); return; }
      Dock.show(Dock.idx, false, 'Battle over!');
      this.updateHud();
      setTimeout(() => {
        renderer.confetti();
        const iWon = this.me >= 0 && winner === this.me;
        const humans = this.controls.filter((c) => c === 'human').length;
        if (winner < 0) sound.lose(); else if (humans === 1 && !iWon) sound.lose(); else sound.win();
        this.o.onOver && this.o.onOver(winner);
      }, 1100);
    }
  }

  // ---------------------------------------------------------------- results
  function showResult(duel, { title, sub, trophy, buttons }) {
    $('resTrophy').textContent = trophy;
    $('resTitle').textContent = title;
    $('resSub').textContent = sub || '';
    $('resStats').innerHTML = [0, 1].map((i) => {
      const t = duel.teams[i], s = duel.stats[i];
      const closest = s.direct ? 'direct hit' : s.closest === null ? '—' : `${Math.abs(s.closest).toFixed(1)} m`;
      return `<div class="team" style="--c:${colorOf(t)}"><h4>${esc(t.name)}</h4><dl>
        <dt>Health left</dt><dd>${duel.hp[i]}</dd>
        <dt>Shots fired</dt><dd>${s.shots}</dd>
        <dt>Direct hits</dt><dd>${s.direct}</dd>
        <dt>Damage dealt</dt><dd>${s.dmg}</dd>
        <dt>Closest landing</dt><dd>${closest}</dd></dl></div>`;
    }).join('');
    const row = $('resBtns'); row.innerHTML = '';
    buttons.forEach(([label, cls, fn]) => {
      const b = document.createElement('button');
      b.className = 'btn ' + cls; b.textContent = label;
      b.addEventListener('click', () => { UI.hide('result'); fn(); });
      row.appendChild(b);
    });
    UI.show('result');
  }

  // ---------------------------------------------------------------- modes
  const App = {
    duel: null,
    leaveHook: null,       // online.js sets this so leaving cleans up listeners
    series: [0, 0],
    setupMode: 'cpu',
    setupTeams: [],

    newSeed() { return (Math.random() * 2 ** 32) >>> 0; },

    endDuel() {
      if (this.duel) this.duel.destroy();
      this.duel = null;
      Dock.detach();
      sound.stopWhistle();
    },

    goMenu() {
      if (this.leaveHook) { const h = this.leaveHook; this.leaveHook = null; h(); }
      this.endDuel();
      ['setup', 'result', 'help', 'online', 'hostView'].forEach((id) => UI.hide(id));
      $('btnHostPanel').hidden = true;
      UI.show('menu');
      this.startDemo();
    },

    startDemo() {
      this.endDuel();
      UI.hideHud();
      sound.quiet = true;
      const run = () => {
        if ($('menu').hidden) return;
        this.duel = new Duel({
          seed: this.newSeed(), demo: true, controls: ['cpu', 'cpu'],
          teams: [{ name: 'Blue Barons', color: 'blue', diff: 'medium' }, { name: 'Red Raiders', color: 'red', diff: 'medium' }],
          onOver: () => setTimeout(run, 2500),
        });
        this.duel.beginTurn(Math.random() < 0.5 ? 0 : 1);
      };
      run();
    },

    stopDemo() {
      sound.quiet = false;
      this.endDuel();
    },

    openSetup(mode) {
      this.setupMode = mode;
      $('setupTitle').textContent = mode === 'cpu' ? '🤖 Single Player' : '👥 Two Players';
      $('diffField').hidden = mode !== 'cpu';
      const wrap = $('setupTeams'); wrap.innerHTML = '';
      let saved = {};
      try { saved = JSON.parse(localStorage.getItem('cd_setup') || '{}'); } catch (e) { /* storage blocked */ }
      const defs = mode === 'cpu'
        ? [{ name: saved.n0 || 'Blue Barons', color: saved.c0 || 'blue', label: 'Your team' }]
        : [{ name: saved.n0 || 'Blue Barons', color: saved.c0 || 'blue', label: 'Player 1 (left fort)' },
           { name: saved.n1 || 'Red Raiders', color: saved.c1 || 'red', label: 'Player 2 (right fort)' }];
      this.setupTeams = defs.map((d) => {
        const box = document.createElement('div'); box.className = 'team';
        box.innerHTML = `<div class="field"><span class="lbl">${d.label}</span><input type="text" maxlength="22" value="${esc(d.name)}"></div><div class="colors"></div>`;
        wrap.appendChild(box);
        const getColor = UI.colorPicker(box.querySelector('.colors'), d.color);
        return { input: box.querySelector('input'), getColor };
      });
      UI.hide('menu');
      UI.show('setup');
    },

    startFromSetup() {
      const t = this.setupTeams.map((s, i) => ({ name: s.input.value.trim() || (i ? 'Red Raiders' : 'Blue Barons'), color: s.getColor() }));
      try { localStorage.setItem('cd_setup', JSON.stringify({ n0: t[0].name, c0: t[0].color, n1: t[1] && t[1].name, c1: t[1] && t[1].color })); } catch (e) { /* storage blocked */ }
      const diff = document.querySelector('#diffSeg .sel').dataset.v;
      const guide = $('optGuide').checked, sabotage = $('optSabo').checked;
      if (this.setupMode === 'cpu') {
        const botColor = t[0].color === 'red' ? 'orange' : 'red';
        const botName = { easy: 'Cannonbot Jr.', medium: 'Cannonbot', hard: 'Cannonbot 9000' }[diff];
        t.push({ name: botName, color: botColor, diff });
      } else if (t[0].color === t[1].color) {
        t[1].color = t[0].color === 'red' ? 'blue' : 'red';
      }
      this.series = [0, 0];
      this.localConfig = { teams: t, guide, sabotage, mode: this.setupMode };
      UI.hide('setup');
      this.startLocal();
    },

    startLocal() {
      this.stopDemo();
      const c = this.localConfig;
      const controls = c.mode === 'cpu' ? ['human', 'cpu'] : ['human', 'human'];
      const first = c.mode === 'cpu' ? 0 : (this.series[0] + this.series[1]) % 2;
      this.duel = new Duel({
        seed: this.newSeed(), teams: c.teams, controls, guide: c.guide, sabotage: c.sabotage,
        midLabel: () => c.mode === 'local' || this.series[0] + this.series[1] ? `${this.series[0]} – ${this.series[1]}` : 'VS',
        onOver: (w) => this.localOver(w),
      });
      const d = this.duel;
      setTimeout(() => { if (this.duel === d) d.beginTurn(first); }, 400);
    },

    localOver(w) {
      const d = this.duel, c = this.localConfig;
      if (w >= 0) this.series[w]++;
      d.updateHud();
      let title, sub, trophy;
      if (w < 0) { title = 'Double knockout!'; sub = 'Both forts went down. Call it a draw.'; trophy = '🤝'; }
      else if (c.mode === 'cpu') {
        const won = w === 0;
        title = won ? 'Victory!' : `${d.teams[1].name} wins…`;
        sub = won ? `You beat ${d.teams[1].name}!` : 'Use your landing distances to adjust, then try again.';
        trophy = won ? '🏆' : '💥';
      } else { title = `${d.teams[w].name} win!`; sub = 'Swap who goes first and play again.'; trophy = '🏆'; }
      if (c.mode === 'local' || this.series[0] + this.series[1] > 1) sub += `  Series: ${d.teams[0].name} ${this.series[0]} – ${this.series[1]} ${d.teams[1].name}`;
      showResult(d, { title, sub, trophy, buttons: [['Main menu', 'ghost', () => this.goMenu()], ['Rematch (new valley)', 'primary', () => this.startLocal()]] });
    },
  };

  // ---------------------------------------------------------------- wiring
  $('modeCpu').addEventListener('click', () => { sound.click(); App.openSetup('cpu'); });
  $('modeLocal').addEventListener('click', () => { sound.click(); App.openSetup('local'); });
  $('btnStart').addEventListener('click', () => { sound.quiet = false; sound.click(); App.startFromSetup(); });
  document.querySelectorAll('#diffSeg button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#diffSeg button').forEach((x) => x.classList.toggle('sel', x === b)); sound.click();
  }));
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => {
    const ov = b.closest('.overlay');
    ov.hidden = true;
    if (ov.id === 'setup' || ov.id === 'online') UI.show('menu');
  }));
  const openHelp = () => UI.show('help');
  $('btnHelp').addEventListener('click', openHelp);
  $('menuHelp').addEventListener('click', openHelp);
  $('btnLogo').addEventListener('click', () => {
    if (App.duel && !App.duel.demo && !App.duel.over && !confirm('Leave this battle and go back to the menu?')) return;
    if (App.leaveHook && !App.duel && !confirm('Leave the online lobby?')) return;
    App.goMenu();
  });
  const soundBtn = $('btnSound');
  const paintSound = () => { soundBtn.textContent = sound.muted ? '🔇' : '🔊'; };
  soundBtn.addEventListener('click', () => { sound.toggle(); paintSound(); });
  paintSound();
  $('btnMeasure').addEventListener('click', () => {
    renderer.measure = !renderer.measure;
    $('btnMeasure').classList.toggle('on', renderer.measure);
  });

  window.CannonApp = { E, $, esc, sound, renderer, UI, Dock, Duel, App, showResult, colorOf };
  App.goMenu();
})();
