// Mechanical Work Studio — the moving track and hoist, and the pages of the Direction Check:
// an ungraded prediction, two hoist tests (hold still, then lift), and four scenes where the student aims the force
// and the motion on a free-body diagram, then decides whether the work is +W, −W or 0 J.

(function () {
  const A = window.FLApp, { $ } = A, FL = window.FL, Scene = window.Scene;
  const calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- The motion. Pictures are drawn from sim, so a redraw never makes the crate jump. ----------
  // mode: 'pull' (crate along the track), 'hold' (hoist, still), 'lift' (hoist, rising)
  const S = A.sim = { d: 0, goal: 0, Fshow: 0, F: 0, W: 0, hy: 0, on: false, hold: false, mode: null, raf: 0, last: 0, t: 0, tick: null };
  A.stopAnim = () => { if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0; S.gen = (S.gen || 0) + 1; if (S.mode === 'dir') { S.on = false; S.tick = null; } };   // a redraw ends a preview or a Play run
  A.resetSim = () => { A.stopAnim(); Object.assign(S, { d: 0, goal: 0, Fshow: 0, F: 0, W: 0, hy: 0, on: false, hold: false, mode: null, t: 0, tick: null, set: null }); A.rec = {}; };
  const SPEED = calm ? 4 : 1.4;        // meters per second on screen
  const LIFT_TIME = calm ? 0.5 : 4;   // seconds for the 1.5 m lift
  const HOIST_F = 100;                 // the 10 kg demo crate: 10 kg × 10 m/s²

  function place() {
    const set = (id, attr, v) => { const el = $(id); if (el) el.setAttribute(attr, v); };
    set('mover', 'transform', Scene.moverTransform(S.d));
    set('tapeUse', 'transform', Scene.tapeTransform(S.d));
    set('needle', 'transform', `rotate(${Scene.dialAngle(S.Fshow).toFixed(2)} ${112} ${410})`);
    set('loupeUse', 'transform', Scene.loupeTransform(S.Fshow));
    const mv = $('meterVal');
    if (mv) mv.textContent = Scene.meterText(S.W);
    if (S.mode === 'hold' || S.mode === 'lift') {
      const live = $('hoistLive');
      if (live) live.innerHTML = Scene.hoistLive({ y: S.hy, t: S.t, mode: S.on ? S.mode : 'done' });
      const bh = $('boxH'); if (bh) bh.textContent = `${S.hy.toFixed(2)} m`;
      const bt = $('boxT'); if (bt) bt.textContent = `${Math.min(5, S.t).toFixed(1)} s`;
    }
  }
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - S.last) / 1000));
    S.last = now;
    if (S.on) {
      S.t += dt;
      if (S.mode === 'pull') {
        S.d = Math.min(S.goal, S.d + SPEED * dt);
        S.W = A.state.rig ? FL.work(A.state.rig, S.d) : 0;
        if (S.d >= S.goal - 1e-9) { S.on = false; S.hold = true; S.W = FL.meter(A.state.rig, S.goal); S.Fshow = S.F; }   // the needle is exact when the crate stops
      } else if (S.mode === 'lift') {
        // Eases in and out: a slow start, a steady pull, a gentle stop level with the shelf
        const f = Math.min(1, S.t / LIFT_TIME), ease = f * f * (3 - 2 * f);
        S.hy = 1.5 * ease;
        S.W = HOIST_F * S.hy;
        if (f >= 1) { S.on = false; S.hy = 1.5; S.W = 150; }
      } else if (S.mode === 'hold' && S.t >= 5) S.on = false;
    }
    const target = S.on || S.hold ? S.F : 0;
    S.Fshow += (target - S.Fshow) * (calm ? 1 : 1 - Math.exp(-dt / 0.06));   // the scale springs to the pull in about a fifth of a second
    place();
    const gen = S.gen;
    if (S.tick) S.tick(dt);
    if (gen !== S.gen) return;   // the page was redrawn from inside tick
    S.raf = S.on || Math.abs(target - S.Fshow) > 0.02 ? requestAnimationFrame(frame) : 0;
    if (!S.raf) { S.Fshow = target; place(); }
  }
  A.startAnim = () => { if (S.raf) cancelAnimationFrame(S.raf); S.gen = (S.gen || 0) + 1; S.last = performance.now(); S.raf = requestAnimationFrame(frame); };   // restarts the frame loop without ending a preview or Play run
  // Pull the crate from 0 to dist with this student's rope
  A.pull = (dist, o = {}) => {
    Object.assign(S, { mode: 'pull', on: true, hold: false, d: 0, goal: dist, W: 0, t: 0, F: A.state.rig.F, tick: o.tick || null });
    A.startAnim();
  };
  // Show a finished pull at once (after a reload, or for a recorded trial)
  A.showPulled = dist => { A.stopAnim(); Object.assign(S, { mode: 'pull', on: false, hold: true, d: dist, goal: dist, F: A.state.rig.F, Fshow: A.state.rig.F, W: FL.meter(A.state.rig, dist), tick: null }); };
  A.inject = (svg, extra) => svg.replace(/<\/svg>\s*$/, `${extra}</svg>`);

  // ---------- The track picture, with this student's own crate and rope ----------
  A.labScene = (o = {}) => Scene.lab(Object.assign({ rig: A.state.rig, d: S.d, F: S.Fshow, W: S.W }, o));

  // Distance slider + Run button, under the picture. Periods 1–3 see whole meters; the others place a stop cone and read the tape.
  const R = () => FL.D_RANGE[A.tier];
  const labelOf = v => (A.tier === 'conceptual' ? `Pull ${v} m` : 'Stop cone');
  A.distCtl = (o = {}) => {
    const r = R(), val = S.set === null || S.set === undefined ? r.min : S.set;
    return `<span class="ctl-label" id="setLabel">${labelOf(val)}</span>
      ${A.tier === 'conceptual' ? '' : '<span class="ctl-note">shorter</span>'}
      <input type="range" class="ctl-range" id="setRange" min="${r.min}" max="${r.max}" step="${r.step}" value="${val}" ${S.on || o.locked ? 'disabled' : ''} aria-label="Pull distance">
      ${A.tier === 'conceptual' ? '' : '<span class="ctl-note">longer</span>'}
      <button type="button" class="btn-step" id="btnRun" ${S.on || o.locked ? 'disabled' : ''}>▶ Pull</button>`;
  };
  A.bindDistCtl = onRun => {
    const range = $('setRange');
    if ((S.set === null || S.set === undefined) && range) S.set = Number(range.value);
    if (range) range.addEventListener('input', () => {
      S.set = FL.round(Number(range.value), 1);
      $('setLabel').textContent = labelOf(S.set);
      const cone = $('stopCone');
      if (cone) cone.setAttribute('transform', `translate(${Scene.xAt(S.set).toFixed(1)} 0)`);
    });
    A.on('btnRun', () => onRun(S.set));
  };

  // ---------- Page 1: an ungraded prediction ----------
  const CHOICES = [
    { id: 'hold', t: '✋ Holding the crate still, high in the air' },
    { id: 'carry', t: '🚶 Carrying the crate across a flat floor' },
    { id: 'lift', t: '⬆ Hoisting the crate up onto a shelf' }
  ];
  A.kinds.choose = {
    scene: () => { S.mode = 'hold'; return Scene.hoist({ y: 0, W: 0 }); },
    task(pg, d) {
      const opts = `<div class="opts">${CHOICES.map(c => `<button type="button" class="opt ${d.pick === c.id ? 'opt-picked' : ''}" data-pick="${c.id}" ${d.ok ? 'disabled' : ''}>${c.t}</button>`).join('')}</div>`;
      const s = A.title(pg.title) + '<p class="task-body">In physics, <strong>work</strong> is done when a force moves something. All three take effort. Which one does <strong>mechanical work</strong> on the crate? This one is not graded.</p>' + opts;
      if (d.ok) return s + A.note('fb-ok', 'Your prediction is locked in. Next you will test it with the hoist and the work meter.') + A.actions(A.nextBtn());
      return s + A.fbHTML() + A.actions('<button type="button" class="btn-primary" id="btnLock">Lock in my prediction</button>');
    },
    bindTask(pg, d) {
      document.querySelectorAll('#taskCard [data-pick]').forEach(b => b.addEventListener('click', () => { d.pick = b.dataset.pick; A.ui.fb = null; A.renderTask(); }));
      A.on('btnLock', () => {
        if (!d.pick) { A.ui.fb = { retry: true, msg: 'Pick one first.' }; return A.renderTask(); }
        A.state.prediction = d.pick; d.ok = true; A.advance();
      });
    }
  };

  // ---------- Pages 2–3: test it on the hoist, and read the work meter ----------
  const DEMO = {
    hold: { btn: '✋ Hold for 5 s', want: 0, y0: 1, text: 'The crate hangs 1 m above the floor. Press <strong>✋ Hold for 5 s</strong> under the picture. The worker holds the rope still. Watch the work meter.',
      done: 'The rope pulled up with 100 N the whole time, but the crate moved 0 m. No distance means <strong>no work: W = 0 J</strong>. Holding still takes effort, but it does no mechanical work.' },
    lift: { btn: '⬆ Lift to the shelf', want: 150, y0: 0, text: 'The crate sits on the floor. Press <strong>⬆ Lift to the shelf</strong> under the picture. Watch the work meter.',
      done: 'The rope pulled <strong>up</strong> and the crate moved <strong>up</strong>. Force along the motion does work. 100 N × 1.5 m = 150 J. This is the one that does mechanical work.' }
  };
  A.kinds.demo = {
    enter(pg, d) {
      const D = DEMO[pg.act];
      Object.assign(S, { mode: pg.act, hy: d.step ? (pg.act === 'lift' ? 1.5 : 1) : D.y0, W: d.step && pg.act === 'lift' ? 150 : 0, t: d.step ? 5 : 0 });
    },
    scene(pg, d) {
      const boxes = pg.act === 'hold' ? [{ label: 'Holding for', value: `${Math.min(5, S.t).toFixed(1)} s`, id: 'boxT' }, { label: 'Rope pull', value: '100 N' }]
        : [{ label: 'Height lifted', value: `${S.hy.toFixed(2)} m`, id: 'boxH' }, { label: 'Rope pull', value: '100 N' }];
      return Scene.hoist({ y: S.hy, W: S.W, boxes });
    },
    ctl: (pg, d) => (d.step ? '<span class="ctl-note">Done. Read the work meter.</span>' : `<button type="button" class="btn-step" id="btnDemo" ${S.on ? 'disabled' : ''}>${DEMO[pg.act].btn}</button>`),
    bindStage(pg, d) {
      A.on('btnDemo', () => {
        Object.assign(S, { on: true, t: 0, tick: () => { if (!S.on && !d.step) { d.step = 'read'; S.tick = null; A.save(); A.render(); } } });
        if (pg.act === 'lift') S.hy = 0;
        A.startAnim();
        $('btnDemo').disabled = true;
      });
    },
    task(pg, d) {
      const D = DEMO[pg.act];
      const s = A.title(pg.title) + `<p class="task-body">${D.text}</p>`;
      if (!d.step) return s + (S.on ? A.note('fb-retry', 'Watch the work meter.') : '') + A.actions();
      if (!d.ok) {
        return s + `<div class="rec-row">${A.recInput('W', 'The work meter reads', 'J')}</div>` + A.fbHTML() + A.actions(A.btn('btnRecord', 'Check my reading', 'btn-primary', d.until));
      }
      const pred = A.state.prediction, cmp = pg.act === 'lift' ? (pred === 'lift' ? ' Your prediction was right.' : pred ? ' Compare that with your prediction.' : '') : '';
      return s + A.note('fb-ok', D.done + cmp) + A.actions(A.nextBtn());
    },
    bindTask(pg, d) {
      const record = () => {
        if (A.left(d.until)) return;
        const x = FL.parseNum(A.rec.W || '');
        if (x === null) { A.ui.fb = { retry: true, msg: 'Type the number on the work meter.' }; return A.renderTask(); }
        const ok = Math.abs(x - DEMO[pg.act].want) <= 0.5;
        A.recordTry(pg.id, ok);
        if (!ok) {
          A.recordMistake(x === 100 ? 'demo_gave_force' : 'demo_misread');
          d.miss = (d.miss || 0) + 1; d.until = A.wait(Math.min(12, 3 + 3 * d.miss));
          A.ui.fb = { retry: true, msg: x === 100 ? 'That is the rope pull in newtons. The work meter is the box on the right, in joules.' : 'That does not match. Read the big number on the work meter.' };
          A.save(); return A.render();
        }
        d.ok = true; A.rec = {}; A.ui.fb = null; A.save(); A.render();
      };
      A.on('btnRecord', record);
      A.bindRec(record);
    }
  };

  // ---------- Pages 4–6: show the motion, drag out each force, predict its work meter, then play it ----------
  // d = { sc, seen, d (motion), arrows [], preds [], played, need, streak, bad, until, more, ok }
  const PLAY_TIME = calm ? 0.4 : 3;   // seconds
  const answered = d => d.ok || d.bad || d.more;
  const ARROW = { up: '↑', down: '↓', left: '←', right: '→', none: 'does not move' };
  // Where the student is: watch the scene, predict the work on the meter, then Play
  function stageOf(d) {
    const n = FL.SCENES[d.sc].track.length;
    for (let i = 0; i < n; i++) if (!(d.preds || [])[i]) return { k: 'meter', i };
    return { k: 'play' };
  }
  A.dirStage = stageOf;

  // Taps on the work meter's +W / 0 J / −W buttons
  A.bindPicks = fn => document.querySelectorAll('#stage [data-pred]').forEach(g => g.addEventListener('click', () => { const [i, cat] = g.dataset.pred.split(':'); fn(Number(i), cat); }));
  A.meterButtons = (picked, cls, locked) => `<div class="meter-picks">${FL.CATS.map(c => `<button type="button" class="opt meter-pick meter-${c.id} ${picked === c.id ? cls || 'opt-picked' : ''}" data-cat="${c.id}" ${locked ? 'disabled' : ''}><span class="meter-icon" aria-hidden="true">${c.icon}</span>${c.t}</button>`).join('')}</div>`;

  // Watch it first: the scene plays its motion once (no meters), pauses, then returns to the start for the question.
  const PREVIEW_TIME = calm ? 0.4 : 2.4;
  A.previewDir = (id, done) => {
    let rest = 0;
    Object.assign(S, { mode: 'dir', on: true, t: 0, p: 0 });
    S.tick = dt => {
      if (S.p < 1) S.p = Math.min(1, S.p + dt / PREVIEW_TIME); else if ((rest += dt) > 0.7) { S.on = false; S.tick = null; done(); return; }
      const pic = $('dirPic');
      if (pic) pic.innerHTML = Scene.dirPic({ id, p: S.p });
    };
    A.startAnim();
  };
  A.seenMove = id => !!(A.ui.seen && A.ui.seen[id]);
  A.markSeen = id => { A.ui.seen = Object.assign({}, A.ui.seen, { [id]: true }); };

  // Play the scene: the object moves and every meter counts up (or down) as it goes
  function play(d, onDone) {
    const s0 = FL.SCENES[d.sc], W = s0.track.map(t => FL.workOf(s0, t));
    Object.assign(S, { mode: 'dir', on: true, t: 0, p: 0, tick: null });
    const step = () => {
      const pic = $('dirPic'), met = $('dirMeters');
      if (pic) pic.innerHTML = Scene.dirPic({ id: d.sc, p: S.p });
      if (met) met.innerHTML = Scene.dirMeters({ id: d.sc, preds: d.preds, locked: true, values: W.map(w => w * Scene.fracOf(d.sc, S.p)) });
    };
    S.tick = dt => {
      S.p = Math.min(1, S.p + dt / PLAY_TIME);
      step();
      if (S.p >= 1) { S.on = false; S.tick = null; onDone(); }
    };
    A.startAnim();
  }

  A.kinds.dir = {
    enter(pg, d) {
      if (!d.sc) { d.sc = pg.sc; d.seen = [pg.sc]; }
      if (!d.preds) d.preds = [];
      if (d.bad && !d.ok) A.ui.fb = { bad: true, msg: d.bad };
    },
    scene(pg, d) {
      const s0 = FL.SCENES[d.sc], done = !!d.played;
      const res = done ? FL.checkPreds(d.sc, d.preds).results.map(r => r.ok) : null;
      return Scene.dirScene({ id: d.sc, p: done ? 1 : 0, preds: d.preds, locked: done, waiting: !done && !A.seenMove(d.sc), results: res, values: done ? s0.track.map(t => FL.workOf(s0, t)) : null });
    },
    bindStage(pg, d) {
      if (d.played || S.on) return;
      if (!A.seenMove(d.sc)) { A.previewDir(d.sc, () => { A.markSeen(d.sc); A.renderStage(); A.renderTask(); }); return; }
      A.bindPicks((i, cat) => { d.preds[i] = cat; A.ui.fb = null; A.save(); A.renderStage(); A.renderTask(); });
    },
    task(pg, d) {
      const s0 = FL.SCENES[d.sc], st = stageOf(d), t = s0.track[0];
      const tag = d.need ? `<p class="launch-tag">Right in a row: ${d.streak || 0} of ${d.need}</p>` : `<p class="launch-tag">${s0.title}</p>`;
      if (d.played) {
        const res = FL.checkPreds(d.sc, d.preds), r = res.results[0], want = FL.categoryOf(t.dir, s0.d);
        const short = c => FL.CATS.find(x => x.id === c).short;
        const line = r.ok ? `✓ ${FL.ruleOf(s0, t)}` : `✗ You predicted ${short(d.preds[0])}. The meter showed ${short(want)}. ${FL.ruleOf(s0, t)}`;
        const box = `<ul class="dir-results"><li class="${r.ok ? 'r-ok' : 'r-bad'}">${line}</li></ul>`;
        if (d.ok) return tag + A.title('The meter agrees with you.') + box + A.actions(A.nextBtn());
        if (d.more) return tag + A.title('The meter agrees with you.') + box + A.note('fb-ok', 'Now show it on a new one.') + A.actions('<button type="button" class="btn-primary" id="btnNew">Next one ▶</button>');
        return tag + A.title('Not yet. Look at the meter.') + box + A.actions(A.btn('btnNew', 'Try a new one ▶', 'btn-primary', d.until));
      }
      if (S.on && !A.seenMove(d.sc)) return tag + A.title(`Watch the ${s0.obj} and the arrow for ${t.label}.`) + A.actions();
      if (S.on) return tag + A.title('Watch the work meter.') + A.actions();
      const watch = '<button type="button" class="btn-ghost" id="btnWatch">↻ Watch again</button>';
      if (st.k === 'meter') return tag + A.title(`What work does ${t.label} do on the ${s0.obj}?`) + '<p class="task-body">Tap <strong>+W</strong>, <strong>0 J</strong> or <strong>−W</strong> on the work meter under the picture.</p>' + A.actions(watch) + A.fbHTML();
      return tag + A.title('Press ▶ Play.') + '<p class="task-body">Watch the work meter.</p>' + A.actions('<button type="button" class="btn-primary" id="btnPlay">▶ Play</button>' + watch) + A.fbHTML();
    },
    bindTask(pg, d) {
      A.on('btnWatch', () => { A.ui.seen = Object.assign({}, A.ui.seen, { [d.sc]: false }); A.renderStage(); A.renderTask(); });
      A.on('btnPlay', () => {
        A.renderStage();
        play(d, () => {
          const res = FL.checkPreds(d.sc, d.preds);
          d.played = true;
          A.recordTry(`${pg.id}_${d.seen.length}`, res.ok);
          if (res.ok) {
            d.streak = (d.streak || 0) + 1;
            if (d.streak >= (d.need || 1)) d.ok = true; else d.more = true;
          } else {
            A.recordMistake(res.mistake);
            Object.assign(d, { need: 2, streak: 0, bad: res.msg, until: A.wait(6) });
          }
          A.save(); A.render();
        });
        A.renderTask();
      });
      A.on('btnNew', () => {
        if (A.left(d.until)) return;
        d.sc = FL.nextScene(d.seen, d.sc); d.seen.push(d.sc);
        d.preds = []; d.played = false; d.bad = null; d.more = false; A.ui.fb = null;
        A.save(); A.render();
      });
    }
  };
})();
