// Highway Curve Lab — driving the car, the moving instruments, and the pages of Part 1 (The Skid):
// aim on the map, drive onto the ice, and name the force that turns the car.

(function () {
  const A = window.FLApp, { $ } = A, FL = window.FL, Scene = window.Scene;
  const World = () => window.World;
  const calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rig = () => A.state.rig;

  // ---------- The instruments: needles ease toward their targets. Drawn from these values, so a redraw never jumps. ----------
  const G = A.gauge = { v: 0, vShow: 0, F: 0, Fshow: 0, slip: false, raf: 0, last: 0, max: 10 };
  function place() {
    const sp = $('speedNeedle'), gn = $('gripNeedle'), lu = $('loupeUse'), lamp = $('slipLamp');
    if (sp) sp.setAttribute('transform', `rotate(${Scene.sweep(G.vShow, FL.SPEEDO.max).toFixed(2)} ${Scene.SPD.cx} ${Scene.SPD.cy})`);
    if (gn) gn.setAttribute('transform', `rotate(${Scene.sweep(G.Fshow, G.max).toFixed(2)} ${Scene.GAUGE_G.cx} ${Scene.GAUGE_G.cy})`);
    if (lu) lu.setAttribute('transform', Scene.loupeTransform(G.Fshow, G.max));
    if (lamp) lamp.style.opacity = G.slip ? (Math.floor(performance.now() / 220) % 2 ? '1' : '0.25') : '0';
  }
  function tick(now) {
    G.raf = 0;
    const dt = Math.min(0.05, Math.max(0, (now - G.last) / 1000));
    G.last = now;
    const k = calm ? 1 : 1 - Math.exp(-dt / 0.28);
    G.Fshow += (G.F - G.Fshow) * k; G.vShow += (G.v - G.vShow) * k;
    place();
    if (Math.abs(G.F - G.Fshow) > 0.003 || Math.abs(G.v - G.vShow) > 0.01 || G.slip) G.raf = requestAnimationFrame(tick);
    else { G.Fshow = G.F; G.vShow = G.v; place(); }
  }
  A.setGauge = (o = {}) => {
    Object.assign(G, o);
    if (o.snap) { G.Fshow = G.F; G.vShow = G.v; }
    if (!G.raf) { G.last = performance.now(); G.raf = requestAnimationFrame(tick); }
  };
  A.setBanner = b => {
    A.ui.banner = b;
    const el = $('runBanner');
    if (el) el.innerHTML = b ? Scene.plate(Scene.PANEL_X / 2, Scene.H - 16, b.text, `hc-banner ${b.cls || ''}`) : '';
  };
  A.resetSim = () => {
    if (window.World) World().stop();
    Object.assign(G, { v: 0, vShow: 0, F: 0, Fshow: 0, slip: false });
    A.rec = {}; A.ui.banner = null;
  };

  // ---------- The panel of instruments over the 3D view ----------
  const chips = (surf, veh, more = []) => [`${FL.SURF[surf].icon} ${FL.SURF[surf].name} road${A.tier === 'conceptual' ? '' : ` · μ = ${FL.fmt(FL.SURF[surf].mu)}`}`, `${FL.VEH[veh].icon} ${FL.VEH[veh].name} · ${FL.VEH[veh].m.toLocaleString('en-US')} kg`].concat(more);
  A.chips = chips;
  // o = { surf, veh, limit: false to hide, coach, more (extra chips), extra (svg) }
  A.panelScene = (o = {}) => {
    const surf = o.surf || 'dry', veh = o.veh || 'car';
    G.max = FL.GAUGE[veh].max;
    const limit = o.limit === false || FL.SURF[surf].mu === 0 ? null : FL.fMax(FL.SURF[surf].mu, FL.VEH[veh].m) / 1000;
    return Scene.panel({ v: G.vShow, F: G.Fshow, veh, limit, chips: chips(surf, veh, o.more || []), banner: A.ui.banner, coach: o.coach, extra: o.extra });
  };

  // ---------- Driving ----------
  // o = { surf, veh, v, slipAt (force a slide here, for the ice patch), slideKN (gauge while sliding), onDone(grip) }
  A.drive = o => {
    const mu = FL.SURF[o.surf].mu, m = FL.VEH[o.veh].m, r = o.r || rig().r;   // o.r: the radius of the lane being driven
    const grip = o.slipAt === undefined ? FL.grips(mu, o.v, r) : false;
    const need = FL.fNeed(m, o.v, r) / 1000, lim = FL.fMax(mu, m) / 1000;
    const turnKN = Math.min(need, lim);
    A.setBanner(null);
    A.setGauge({ v: o.v, F: 0, slip: false });
    World().run({
      v: o.v, slipAt: grip ? null : (o.slipAt === undefined ? 7 : o.slipAt),
      onFrame: f => {
        if (f.phase === 'turn') A.setGauge({ F: turnKN });
        if (f.phase === 'exit') A.setGauge({ F: 0 });
        if (f.phase === 'slide') { A.setGauge({ F: o.slideKN === undefined ? lim : o.slideKN, slip: true }); A.setBanner({ text: '⚠️ The tires are slipping!', cls: 'hc-bad' }); }
        if (f.phase === 'crash') A.setGauge({ v: 0, F: 0, slip: false });
      },
      onDone: res => {
        if (res.grip) { A.setGauge({ F: turnKN, v: o.v }); A.setBanner({ text: `✅ The tires held at ${FL.fmt(o.v)} m/s`, cls: 'hc-ok' }); } else { A.setGauge({ F: 0, v: 0, slip: false }); A.setBanner({ text: `💥 Slid off at ${FL.fmt(o.v)} m/s`, cls: 'hc-bad' }); }
        if (o.onDone) o.onDone(res.grip);
      }
    });
    return grip;
  };
  A.driving = () => !!(window.World && World().running());

  // Speed slider + Drive button, under the picture
  A.slider = () => FL.SLIDER[A.tier];
  A.speedCtl = (o = {}) => {
    const sl = o.slider || A.slider(), val = A.ui.speed === undefined || A.ui.speed === null ? (o.start || sl.min) : A.ui.speed;
    A.ui.speed = val;
    const busy = A.driving() || o.locked;
    return `<span class="ctl-label" id="setLabel">Speed ${FL.fmt(val)} m/s</span>
      <button type="button" class="btn-ghost btn-nudge" id="btnSlower" ${busy ? 'disabled' : ''} aria-label="Slower">−</button>
      <input type="range" class="ctl-range" id="setRange" min="${sl.min}" max="${sl.max}" step="${sl.step}" value="${val}" ${busy ? 'disabled' : ''} aria-label="Speed">
      <button type="button" class="btn-ghost btn-nudge" id="btnFaster" ${busy ? 'disabled' : ''} aria-label="Faster">+</button>
      <button type="button" class="btn-step" id="btnRun" ${busy ? 'disabled' : ''}>▶ Drive</button>${o.extra || ''}`;
  };
  A.bindSpeedCtl = (onRun, o = {}) => {
    const range = $('setRange'), sl = o.slider || A.slider();
    const set = v => { A.ui.speed = Math.max(sl.min, Math.min(sl.max, FL.round(v, 2))); if (range) range.value = A.ui.speed; $('setLabel').textContent = `Speed ${FL.fmt(A.ui.speed)} m/s`; };
    if (range) range.addEventListener('input', () => set(Number(range.value)));
    A.on('btnSlower', () => set(A.ui.speed - sl.step));
    A.on('btnFaster', () => set(A.ui.speed + sl.step));
    A.on('btnRun', () => { if (!A.driving()) onRun(A.ui.speed); });
  };
  // ---------- Watching again on a finished step: nothing is recorded, the page's data stays as it is ----------
  // A.ui.watch picks the road and vehicle being replayed. It lives in A.ui, so it is never saved and resets on every page.
  A.watch = () => A.ui.watch || {};
  A.replayCtl = (list, note = '') => (note ? `<span class="ctl-note">${note}</span>` : '')
    + list.map((r, i) => `<button type="button" class="btn-step" data-replay="${i}" ${A.driving() ? 'disabled' : ''}>↻ ${r.label}</button>`).join('');
  A.bindReplay = list => document.querySelectorAll('#stageCtl [data-replay]').forEach(b => b.addEventListener('click', () => {
    if (A.driving()) return;
    const r = list[Number(b.dataset.replay)];
    A.ui.watch = { surf: r.surf, veh: r.veh, lane: r.lane };
    World().park({ s: 0 });
    A.renderStage();   // shows the replayed road and vehicle, with the right gauge
    A.lockCtl(true);
    if (r.run) r.run(() => A.lockCtl(false));
    else A.drive({ surf: r.surf, veh: r.veh, v: r.v, r: r.r, onDone: () => A.lockCtl(false) });
  }));
  // Free driving on a finished step: any speed, nothing recorded
  A.freeCtl = start => A.speedCtl({ start, extra: '<span class="ctl-note">Free drive: not recorded</span>' });
  A.bindFree = (surf, veh) => A.bindSpeedCtl(v => { A.lockCtl(true); A.drive({ surf, veh, v, onDone: () => A.lockCtl(false) }); });

  // Lock the controls while the car drives, without redrawing the picture
  A.lockCtl = on => document.querySelectorAll('#stageCtl button, #stageCtl input').forEach(el => { el.disabled = on; });

  // The picture when a part is finished
  A.restWorld = () => (A.state.current === 'graph' ? null : { surf: 'dry', veh: 'car' });
  A.restScene = () => { World().park({ phi: 45, showV: true, showF: true }); return A.panelScene({ surf: 'dry', veh: 'car' }); };

  // ---------- Aim an arrow on the map ----------
  const OK_MSG = {
    force: 'Friction from the road points to the center of the curve. That sideways grip is what turns the car.',
    path: 'With no grip there is no force to turn it. The car slides in a straight line along the tangent: the way it was already moving.'
  };
  A.kinds.aim = {
    enter(pg, d) {
      if (!d.spot) d.spot = pg.ungraded ? { phi: 45, rot: 0 } : FL.newSpot();
      if (d.bad && !d.ok) A.ui.fb = { bad: true, msg: d.bad };
    },
    scene(pg, d) {
      const open = !d.ok && !d.bad && !d.more, aim = typeof d.angle === 'number' ? d.angle : null, right = d.ok && !pg.ungraded;
      return Scene.map({
        phi: d.spot.phi, rot: d.spot.rot, aim, aimCls: right ? (pg.what === 'force' ? 'fl-force' : 'fl-vel') : 'fl-aim',
        ice: pg.what === 'path', showV: pg.what === 'force', tangent: right && pg.what === 'path', clickable: open,
        hint: open && aim === null ? 'Click anywhere on the map to aim your arrow' : ''
      });
    },
    task(pg, d) {
      const has = typeof d.angle === 'number';
      const head = `${d.need ? `<p class="launch-tag">Right in a row: ${d.streak || 0} of ${d.need}</p>` : ''}${A.title(pg.title)}<p class="task-body">${pg.text}</p>`;
      if (pg.ungraded) {
        if (d.ok) return head + A.note('fb-ok', 'Your prediction is locked in. Next you will test it.') + A.actions(A.nextBtn());
        return head + turnRow(has) + A.fbHTML() + A.actions('<button type="button" class="btn-primary" id="btnLock">Lock in my prediction</button>');
      }
      if (d.ok) return head + A.okNote(OK_MSG[pg.what]) + A.actions(A.nextBtn());
      if (d.more) return head + A.note('fb-ok', '<strong>✓ Correct!</strong> Show it once more at a new spot.') + A.actions('<button type="button" class="btn-primary" id="btnNew">One more ▶</button>');
      if (d.bad) return head + A.note('fb-bad', `<strong>✗ Not yet.</strong> ${d.bad}`) + A.actions(A.btn('btnNew', 'Try a new spot ▶', 'btn-primary', d.until));
      return head + turnRow(has) + A.fbHTML() + A.actions('<button type="button" class="btn-primary" id="btnCheck">Check</button>');
    },
    bindStage(pg, d) {
      if (d.ok || d.bad || d.more) return;
      A.onStageClick(p => {
        const from = Scene.mapCar(d.spot.phi, d.spot.rot);
        if (Math.hypot(p.x - from.x, p.y - from.y) < 16) return;
        d.angle = Math.round(Scene.angleOf(from, p));
        A.ui.fb = null; A.renderStage(); A.renderTask();
      });
    },
    bindTask(pg, d) {
      const turn = by => { d.angle = Math.round(FL.norm(d.angle + by)); A.renderStage(); A.renderTask(); };
      A.on('btnTurnL', () => turn(10)); A.on('btnTurnR', () => turn(-10));
      const need = () => { if (typeof d.angle === 'number') return false; A.ui.fb = { retry: true, msg: 'Click the map first to aim your arrow.' }; A.renderTask(); return true; };
      const phi = () => d.spot.phi + d.spot.rot;
      A.on('btnLock', () => {
        if (need()) return;
        A.state.prediction = { angle: d.angle, cat: FL.aimCategory(phi(), d.angle) };
        d.ok = true; A.advance();
      });
      A.on('btnCheck', () => {
        if (need()) return;
        const res = FL.checkAim(pg.what, phi(), d.angle);
        A.recordTry(`${pg.id}_${d.streak || 0}`, res.ok);
        if (res.ok) { d.streak = (d.streak || 0) + 1; if (d.streak >= (d.need || 1)) d.ok = true; else d.more = true; } else {
          A.recordMistake(res.mistake); d.miss = (d.miss || 0) + 1;
          Object.assign(d, { need: 2, streak: 0, bad: res.msg, until: A.wait(Math.min(16, 4 + 3 * d.miss)) });
          A.ui.fb = { bad: true, msg: res.msg };
        }
        A.save(); A.render();
      });
      A.on('btnNew', () => {
        if (A.left(d.until)) return;
        d.spot = FL.newSpot(d.spot);
        delete d.angle; d.bad = null; d.more = false; A.ui.fb = null;
        A.save(); A.render();
      });
    }
  };
  function turnRow(has) {
    return has ? '<div class="turn-row">Fine-tune: <button type="button" class="btn-ghost" id="btnTurnL">↺ turn</button><button type="button" class="btn-ghost" id="btnTurnR">↻ turn</button></div>' : '<div class="turn-row">No arrow yet. Click the map.</div>';
  }

  // ---------- Drive onto the ice patch ----------
  const ICE = [40, 62];
  const SAID = { forward: 'along the tangent', outward: 'straight out from the center', center: 'toward the center', backward: 'backward', other: 'along a curve' };
  A.kinds.skid = {
    enter(pg, d) { if (d.ok) World().park({ phi: ICE[0], crashed: true, tangent: true }); else World().park({ s: 0 }); },
    world: () => ({ surf: 'dry', veh: 'car', ice: ICE }),
    scene: () => A.panelScene({ surf: 'dry', veh: 'car', more: ['🧊 Ice patch on the curve'] }),
    ctl: (pg, d) => `<span class="ctl-label">Speed ${FL.fmt(skidV())} m/s</span><button type="button" class="btn-step" id="btnRun" ${A.driving() ? 'disabled' : ''}>▶ Drive</button><span class="ctl-note">${d.ok ? 'Drive again to watch it once more' : 'A safe speed for a dry road'}</span>`,
    bindStage(pg, d) {
      A.on('btnRun', () => {
        if (A.driving()) return;
        A.lockCtl(true);
        A.drive({ surf: 'dry', veh: 'car', v: skidV(), slipAt: ICE[0], slideKN: FL.fMax(FL.SURF.icy.mu, 1000) / 1000, onDone: () => {
          World().park({ phi: ICE[0], crashed: true, tangent: true });
          A.setBanner({ text: '🧊 On the ice it went straight, along the tangent', cls: 'hc-bad' });
          d.ok = true; A.save(); A.renderTask(); A.lockCtl(false);
        } });
      });
    },
    task(pg, d) {
      const s = A.title(pg.title) + `<p class="task-body">${pg.text}</p>`;
      if (!d.ok) return s + A.fbHTML() + A.actions();
      const cat = A.state.prediction && A.state.prediction.cat;
      const cmp = cat === 'forward' ? 'Your prediction was right.' : cat ? `You predicted ${SAID[cat] || SAID.other}. Look at the dashed line.` : '';
      return s + A.note('fb-ok', `On ice the grip is gone, so nothing turns the car. It slid in a <strong>straight line</strong>, the way it was already going. ${cmp}`) + A.actions(A.nextBtn());
    }
  };
  const skidV = () => Math.round(FL.vMax(FL.SURF.dry.mu, rig().r) * 0.7);

  // ---------- Name the force that turns the car ----------
  A.kinds.name = {
    enter(pg, d) { if (!d.order) d.order = FL.shuffle(FL.FORCES.map(f => f.id)); if (d.bad && !d.ok) A.ui.fb = { bad: true, msg: d.bad }; },
    scene: (pg, d) => Scene.forces({ label: d.ok ? 'friction' : null }),
    task(pg, d) {
      const opts = `<div class="opts">${d.order.map(id => {
        const f = FL.FORCES.find(x => x.id === id), cls = d.pick !== id ? '' : d.ok ? 'opt-right' : d.bad ? 'opt-wrong' : 'opt-picked';
        return `<button type="button" class="opt ${cls}" data-force="${id}" ${d.ok || d.bad ? 'disabled' : ''}>${f.t}</button>`;
      }).join('')}</div>`;
      const s = A.title('What force is the “?” arrow toward the center?') + opts;
      if (d.ok) return s + A.okNote(FL.checkForceName('friction').msg) + A.actions(A.nextBtn());
      if (d.bad) return s + A.note('fb-bad', `<strong>✗ Not yet.</strong> ${d.bad}`) + A.actions(A.btn('btnNew', 'Try again ▶', 'btn-primary', d.until));
      return s + A.fbHTML() + A.actions('<button type="button" class="btn-primary" id="btnCheck">Check</button>');
    },
    bindTask(pg, d) {
      document.querySelectorAll('#taskCard [data-force]').forEach(b => b.addEventListener('click', () => { d.pick = b.dataset.force; A.ui.fb = null; A.renderTask(); }));
      A.on('btnCheck', () => {
        if (!d.pick) { A.ui.fb = { retry: true, msg: 'Pick one of the four forces first.' }; return A.renderTask(); }
        const res = FL.checkForceName(d.pick);
        A.recordTry(pg.id, res.ok);
        if (res.ok) d.ok = true; else { A.recordMistake(res.mistake); d.miss = (d.miss || 0) + 1; Object.assign(d, { bad: res.msg, until: A.wait(Math.min(20, 6 + 4 * d.miss)) }); A.ui.fb = { bad: true, msg: res.msg }; }
        A.save(); A.render();
      });
      A.on('btnNew', () => { if (A.left(d.until)) return; d.bad = null; d.pick = null; d.order = FL.shuffle(d.order); A.ui.fb = null; A.save(); A.render(); });
    }
  };
})();
