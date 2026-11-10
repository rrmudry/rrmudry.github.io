// Centripetal Force Lab — the moving air table, and the pages of Part 1: aim an arrow, run the table, cut the string.

(function () {
  const A = window.FLApp, { $ } = A, FL = window.FL, Scene = window.Scene;
  const calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- The motion. Pictures are drawn from sim, so a redraw never makes the puck jump. ----------
  const S = A.sim = { phi: 40, Fshow: 0, F: 0, v: 0, on: false, free: null, raf: 0, last: 0, t: 0, set: null, geo: null, turn: false, tick: null };
  A.stopAnim = () => { if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0; S.gen = (S.gen || 0) + 1; };
  A.resetSim = () => { A.stopAnim(); Object.assign(S, { phi: 40, Fshow: 0, F: 0, v: 0, on: false, free: null, t: 0, set: null, geo: null, turn: false, tick: null, rate: 0, hold: false, landed: false }); A.rec = {}; };
  const geo = () => S.geo || Scene.LAB;
  A.puckAt = () => S.free || Scene.at(S.phi, geo().R, geo().cx, geo().cy);

  function place() {
    const puck = $('puck');
    if (!puck) return;
    const p = A.puckAt();
    puck.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})${S.turn ? ` rotate(${(-S.phi).toFixed(1)})` : ''}`);
    const str = $('string');
    if (str) { str.setAttribute('x2', p.x.toFixed(1)); str.setAttribute('y2', p.y.toFixed(1)); if (S.free) str.style.display = 'none'; }
    const needle = $('needle'), loupe = $('loupeUse');
    if (needle) needle.setAttribute('transform', `rotate(${Scene.dialAngle(S.Fshow).toFixed(2)} ${Scene.DIALG.cx} ${Scene.DIALG.cy})`);
    if (loupe) loupe.setAttribute('transform', Scene.loupeTransform(S.Fshow));
  }
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - S.last) / 1000));
    S.last = now;
    if (S.free) {
      S.free.x += S.free.dx * dt; S.free.y += S.free.dy * dt;
      if (S.free.x < 18 || S.free.x > Scene.W - 18 || S.free.y < 18 || S.free.y > Scene.H - 18 || Math.hypot(S.free.x - geo().cx, S.free.y - geo().cy) > geo().R + 62) { S.on = false; S.landed = true; }
    } else if (S.on) S.phi = (S.phi + S.rate * dt) % 360;
    const target = S.on && !S.free ? S.F : S.hold ? S.F : 0;
    S.Fshow += (target - S.Fshow) * (calm ? 1 : 1 - Math.exp(-dt / 0.35));
    if (S.on) S.t += dt;
    place();
    const gen = S.gen;
    if (S.tick) S.tick(dt);
    if (gen !== S.gen) return;   // the page was redrawn from inside tick
    S.raf = S.on || Math.abs(target - S.Fshow) > 0.02 ? requestAnimationFrame(frame) : 0;
    if (!S.raf) { S.Fshow = target; place(); }
  }
  A.startAnim = () => { A.stopAnim(); S.last = performance.now(); S.raf = requestAnimationFrame(frame); };
  // degrees per second on screen: slower than real life, but faster speeds still look faster
  const rateOf = v => (calm ? 0.3 : 1) * 0.35 * (v / A.state.rig.r) * 180 / Math.PI;
  A.spin = (v, o = {}) => { Object.assign(S, { on: true, v, F: FL.force(A.state.rig.m, v, A.state.rig.r), rate: o.rate || rateOf(v), free: null, landed: false, hold: false, t: 0, tick: o.tick || null }); A.startAnim(); };
  A.stopSpin = hold => { S.on = false; S.hold = !!hold; S.tick = null; };
  // Let go: the object leaves along the tangent, the way it was already moving
  A.release = () => {
    const p = A.puckAt(), a = (S.phi + 90) * Math.PI / 180, speed = Math.max(140, S.rate * Math.PI / 180 * geo().R);
    S.free = { x: p.x, y: p.y, dx: Math.cos(a) * speed, dy: -Math.sin(a) * speed };
  };
  // Where a released puck ends up, for drawing the finished picture
  A.flightEnd = (phi, g = Scene.LAB) => {
    const p = Scene.at(phi, g.R, g.cx, g.cy), a = (phi + 90) * Math.PI / 180;
    let x = p.x, y = p.y;
    while (x > 18 && x < Scene.W - 18 && y > 18 && y < Scene.H - 18 && Math.hypot(x - g.cx, y - g.cy) <= g.R + 62) { x += Math.cos(a) * 4; y -= Math.sin(a) * 4; }
    return { from: p, to: { x, y } };
  };
  A.inject = (svg, extra) => svg.replace(/<\/svg>\s*$/, `${extra}</svg>`);
  const tangent = f => `<line x1="${f.from.x.toFixed(1)}" y1="${f.from.y.toFixed(1)}" x2="${f.to.x.toFixed(1)}" y2="${f.to.y.toFixed(1)}" class="fl-tangent"/>`;
  A.tangentLine = tangent;
  // The finished picture after the string is gone: the puck at the end of its straight path
  A.cutScene = (phi, o) => {
    const f = A.flightEnd(phi);
    S.Fshow = 0;
    return A.inject(A.labScene(Object.assign({ phi, F: 0, cut: true }, o)), tangent(f)).replace(/(<g id="puck" transform=")[^"]*/, `$1translate(${f.to.x.toFixed(1)} ${f.to.y.toFixed(1)})`);
  };

  // ---------- The air table picture, with this student's own puck ----------
  A.massText = () => (A.tier === 'conceptual' ? 'Same puck and same string on every trial' : A.state.weighed ? `m = ${FL.fmt(A.state.rig.m)} kg` : 'm = ? kg');
  A.labScene = (o = {}) => Scene.lab(Object.assign({ rig: A.state.rig, phi: S.phi, F: S.Fshow, massText: A.massText() }, o));
  const speedBox = v => ({ label: 'Speed', value: `${FL.fmt(v)} m/s`, id: 'boxSpeed' });
  A.speedBox = speedBox;

  // Speed slider + Run button, under the picture
  A.speedCtl = (o = {}) => {
    const list = o.list || FL.SPEEDS, val = S.set === null ? list[0] : S.set;
    const show = v => (o.level ? `Motor level ${v}` : `Speed ${v} m/s`);
    return `<span class="ctl-label" id="setLabel">${show(val)}</span>
      <input type="range" class="ctl-range" id="setRange" min="${list[0]}" max="${list[list.length - 1]}" step="1" value="${val}" ${S.on || o.locked ? 'disabled' : ''} aria-label="${o.level ? 'Motor level' : 'Speed'}">
      <button type="button" class="btn-step" id="btnRun" ${S.on || o.locked ? 'disabled' : ''}>▶ Run</button>${o.extra || ''}`;
  };
  A.bindSpeedCtl = (onRun, o = {}) => {
    const range = $('setRange');
    if (S.set === null && range) S.set = Number(range.value);
    if (range) range.addEventListener('input', () => { S.set = Number(range.value); $('setLabel').textContent = o.level ? `Motor level ${S.set}` : `Speed ${S.set} m/s`; });
    A.on('btnRun', () => onRun(S.set));
  };

  // ---------- Aim an arrow: the net force, or the path after the pull is gone ----------
  const OK_MSG = {
    force: 'The net force points to the center of the circle, along the string. A net force that points to the center has a name: <strong>centripetal force</strong>.',
    path: 'With the string cut there is no net force. The puck moves in a straight line along the tangent: the way it was already moving.'
  };
  const aimF = () => FL.force(A.state.rig.m, 4, A.state.rig.r);
  A.kinds.aim = {
    enter(pg, d) {
      if (typeof d.phi !== 'number') d.phi = FL.newSpot();
      if (pg.station && !d.st) d.st = FL.pick(FL.EXTRA_STATIONS);
      if (d.bad && !d.ok) A.ui.fb = { bad: true, msg: d.bad };
    },
    scene(pg, d) {
      const open = !d.ok && !d.bad && !d.more, aim = typeof d.angle === 'number' ? d.angle : null;
      const right = d.ok && !pg.ungraded;
      if (pg.station) return Scene.station({ id: d.st, phi: d.phi, aim, aimCls: right ? 'fl-force' : 'fl-aim', showV: true, clickable: open, note: open && aim === null ? 'Click anywhere to aim your arrow' : '' });
      S.phi = d.phi;
      if (pg.what === 'path') {
        const svg = A.labScene({ phi: d.phi, F: 0, cut: true, aim, aimCls: right ? 'fl-vel' : 'fl-aim', clickable: open, hint: open && aim === null ? 'Click anywhere to aim your arrow' : '' });
        return right ? A.inject(svg, tangent(A.flightEnd(d.phi))) : svg;
      }
      return A.labScene({ phi: d.phi, F: aimF(), showV: true, aim, aimCls: right ? 'fl-force' : 'fl-aim', boxes: [speedBox(4)], clickable: open, hint: open && aim === null ? 'Click anywhere to aim your arrow' : '' });
    },
    task(pg, d) {
      const has = typeof d.angle === 'number';
      let s = A.title(pg.title) + `<p class="task-body">${pg.text}</p>`;
      if (pg.ungraded) {
        if (d.ok) return s + A.note('fb-ok', 'Your prediction is locked in. Next you will test it.') + A.actions(A.nextBtn());
        return s + turnRow(has) + A.fbHTML() + A.actions('<button type="button" class="btn-primary" id="btnLock">Lock in my prediction</button>');
      }
      if (d.ok) return s + A.okNote(pg.station ? `${FL.STATIONS[d.st].why} The net force points to the center.` : OK_MSG[pg.what]) + A.actions(A.nextBtn());
      if (d.more) return s + A.note('fb-ok', '<strong>✓ Correct!</strong> Show it one more time at a new spot to be sure.') + A.actions('<button type="button" class="btn-primary" id="btnNew">One more ▶</button>');
      if (d.bad) return s + A.note('fb-bad', `<strong>✗ Not yet.</strong> ${d.bad}`) + A.actions(A.btn('btnNew', 'Try a new spot ▶', 'btn-primary', d.until));
      return s + turnRow(has) + A.fbHTML() + A.actions('<button type="button" class="btn-primary" id="btnCheck">Check</button>');
    },
    bindStage(pg, d) {
      if (d.ok || d.bad || d.more) return;
      A.onStageClick(p => {
        const from = pg.station ? Scene.at(d.phi, Scene.ST.R, Scene.ST.cx, Scene.ST.cy) : Scene.at(d.phi, Scene.LAB.R, Scene.LAB.cx, Scene.LAB.cy);
        if (Math.hypot(p.x - from.x, p.y - from.y) < 14) return;
        d.angle = Math.round(Scene.angleOf(from, p));
        A.ui.fb = null; A.renderStage(); A.renderTask();
      });
    },
    bindTask(pg, d) {
      const turn = by => { d.angle = Math.round(FL.norm(d.angle + by)); A.renderStage(); A.renderTask(); };
      A.on('btnTurnL', () => turn(15)); A.on('btnTurnR', () => turn(-15));
      const need = () => { if (typeof d.angle === 'number') return false; A.ui.fb = { retry: true, msg: 'Click the picture first to aim your arrow.' }; A.renderTask(); return true; };
      A.on('btnLock', () => {
        if (need()) return;
        A.state.prediction = { angle: d.angle, cat: FL.aimCategory(d.phi, d.angle) };
        d.ok = true; A.advance();
      });
      A.on('btnCheck', () => {
        if (need()) return;
        const res = FL.checkAim(pg.what, d.phi, d.angle);
        A.recordTry(`${pg.id}_${d.streak || 0}`, res.ok);
        if (res.ok) {
          d.streak = (d.streak || 0) + 1;
          if (d.streak >= (d.need || 1)) d.ok = true; else d.more = true;
        } else {
          A.recordMistake(res.mistake);
          Object.assign(d, { need: 2, streak: 0, bad: res.msg, until: A.wait(6) });
          A.ui.fb = { bad: true, msg: res.msg };
        }
        A.save(); A.render();
      });
      A.on('btnNew', () => {
        if (A.left(d.until)) return;
        d.phi = FL.newSpot(d.phi);
        if (pg.station) d.st = FL.nextStation([d.st], d.st);
        delete d.angle; d.bad = null; d.more = false; A.ui.fb = null;
        A.save(); A.render();
      });
    }
  };
  function turnRow(has) {
    return has ? '<div class="turn-row">Fine-tune your arrow: <button type="button" class="btn-ghost" id="btnTurnL">↺ turn</button><button type="button" class="btn-ghost" id="btnTurnR">↻ turn</button></div>' : '<div class="turn-row">No arrow yet. Click the picture.</div>';
  }

  // ---------- Run the table at 4 m/s and compare with the prediction ----------
  const SAID = { forward: 'the way the puck is moving', outward: 'away from the center', backward: 'backward', other: 'off to the side' };
  A.kinds.run = {
    scene(pg, d) {
      if (d.ok && !S.on) { S.Fshow = aimF(); return A.labScene({ F: aimF(), showV: true, showF: true, boxes: [speedBox(4)] }); }
      return A.labScene({ boxes: [speedBox(S.on ? S.v : 0)] });
    },
    ctl: (pg, d) => (d.ok ? '' : A.speedCtl()),
    bindStage(pg, d) {
      A.bindSpeedCtl(set => {
        if (set !== pg.need) { A.ui.fb = { retry: true, msg: `Slide the speed to ${pg.need} m/s first.` }; return A.renderTask(); }
        A.ui.fb = null;
        A.spin(set, { tick: () => { if (S.t > 4) { A.stopSpin(true); d.ok = true; A.save(); A.render(); } } });
        A.renderStage(); A.renderTask();
      });
    },
    live() { if (S.on) A.startAnim(); },
    task(pg, d) {
      const s = A.title(pg.title) + `<p class="task-body">${pg.text}</p>`;
      if (!d.ok) return s + (S.on ? A.note('fb-retry', 'Watch the string and the needle on the dial.') : A.fbHTML()) + A.actions();
      const pred = A.state.prediction, cat = pred && pred.cat;
      const cmp = cat === 'center' ? 'Your prediction was right.' : cat ? `You predicted ${SAID[cat] || SAID.other}. Look at the string: it can only pull along itself.` : '';
      return s + A.note('fb-ok', `The dial shows the string pulling the whole time. The pull points along the string, <strong>toward the center</strong>. ${cmp}`) + A.actions(A.nextBtn());
    }
  };

  // ---------- Cut the string while the puck is moving ----------
  A.kinds.cut = {
    scene(pg, d) {
      if (d.ok && !S.on && !S.free) return A.cutScene(d.phi, { boxes: [speedBox(d.v)] });
      return A.labScene({ boxes: [speedBox(S.on ? S.v : 0)] });
    },
    ctl: (pg, d) => (d.ok ? '' : A.speedCtl({ extra: `<button type="button" class="btn-step" id="btnCut" ${S.on && !S.free ? '' : 'disabled'}>✂ Cut the string</button>` })),
    bindStage(pg, d) {
      A.bindSpeedCtl(set => { A.ui.fb = null; A.spin(set); A.renderStage(); A.renderTask(); });
      A.on('btnCut', () => {
        if (!S.on || S.free) return;
        d.phi = Math.round(S.phi); d.v = S.v;
        A.release(); $('btnCut').disabled = true;
        S.tick = () => { if (S.landed) { S.tick = null; S.free = null; d.ok = true; A.save(); A.render(); } };
      });
    },
    live() { if (S.on) A.startAnim(); },
    task(pg, d) {
      const s = A.title(pg.title) + `<p class="task-body">${pg.text}</p>`;
      if (!d.ok) return s + (S.on ? A.note('fb-retry', 'The puck is moving. Press <strong>✂ Cut the string</strong> under the picture.') : '') + A.actions();
      return s + A.note('fb-ok', 'The dial dropped to 0 N: no string, no force. The puck stopped turning and left in a straight line.') + A.actions(A.nextBtn());
    }
  };
})();
