// Pulleys and Ramps Lab — one page, like the Ideal Pulley System Lab: 1 Setup, 2 Simulation, 3 My Data, 4 What It Shows.
// Tap P to pull: 55 N for every tap per second, smoothed. The load speeds up or sinks with the net force.
// Hold it in the green zone for 1.2 s and it latches, so the spring scale and rope tape can be read calmly.
// The student reads d and F, works out W = F × d, and adds the row. Nothing is filled in for them.
// Points (10): 1 for each correct row up to 6 (3 pulley + 3 ramp), 1 for each of two questions, 2 for a tested prediction.

(function () {
  const FL = window.FL = window.FLcore, Scene = window.Scene;
  const $ = id => document.getElementById(id);
  const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const fmt = FL.fmt;
  const N_PER_TAP_RATE = 55, DAMP = 30, HOLD_T = 1.2, FORGET = 3000, ZONE_TOL = 0.20;
  const NEED_EACH = 3, MAX_EACH = 4;   // each table needs 3 rows and holds up to 4
  const fast = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]fast\b/.test(location.search);
  const wait = s => Date.now() + s * (fast ? 50 : 1000);
  const left = t => Math.max(0, Math.ceil(((t || 0) - Date.now()) / 1000));

  let st = null, cloud = null, profile = null;
  // Periods 1–3 (conceptual) also get a digital readout under the spring scale. The teacher can switch views.
  let viewTier = null;
  const tier = () => viewTier || (profile && profile.tier) || 'cp';
  const sim = { x: 0, v: 0, effort: 0, taps: [], hold: 0, locked: false, last: 0 };
  const ui = { rec: {}, msg: '', recMsg: '', predDraft: '', readDraft: '' };

  // ---------- Saved work ----------
  const newState = () => ({ v: 2, rig: null, setup: { mach: 'pulley', n: 1, L: 3 }, rows: [], ask: {}, pred: null, tries: {}, mistakes: {}, time: {}, bestPoints: 0, savedAt: 0 });
  const validState = s => !!(s && s.v === 2 && Array.isArray(s.rows) && s.setup);
  const counts = s => ({ pulley: s.rows.filter(r => r.mach === 'pulley').length, ramp: s.rows.filter(r => r.mach === 'ramp').length });
  function earned(s) {
    const c = counts(s);
    const rowPts = Math.min(NEED_EACH, c.pulley) + Math.min(NEED_EACH, c.ramp);
    const steps = STEPS(tier()), total = steps.reduce((t, id) => t + WEIGHT[id], 0);
    const got = steps.filter(id => stepDone(s, id)).reduce((t, id) => t + WEIGHT[id], 0);
    return Math.round((rowPts + 4 * got / total) * 10) / 10;
  }
  function scoreState(s) {
    s.bestPoints = Math.max(s.bestPoints || 0, earned(s));
    const tries = Object.values(s.tries || {}), c = counts(s);
    const done = [];
    if (c.pulley >= NEED_EACH) done.push('pulley');
    if (c.ramp >= NEED_EACH) done.push('ramp');
    const steps = STEPS(tier());
    if (steps.filter(id => !['predict', 'design'].includes(id)).every(id => stepDone(s, id))) done.push('think');
    if (steps.filter(id => ['predict', 'design'].includes(id)).every(id => stepDone(s, id))) done.push('predict');
    return {
      points: s.bestPoints, percentage: Math.round(s.bestPoints * 10), done, rows: s.rows.length,
      progress: { pulley: Math.round(100 * Math.min(1, c.pulley / NEED_EACH)), ramp: Math.round(100 * Math.min(1, c.ramp / NEED_EACH)) },
      questions: tries.length, firstTry: tries.length ? Math.round((100 * tries.filter(t => t.first).length) / tries.length) : null,
      minutes: Math.round(Object.values(s.time || {}).reduce((a, b) => a + b, 0) / 60), mistakes: s.mistakes || {}
    };
  }
  const save = immediate => { scoreState(st); if (cloud) cloud.queueSave(immediate); paintScore(); };
  const recordTry = (key, ok) => { const t = st.tries[key] || (st.tries[key] = { n: 0, first: !!ok }); t.n++; };
  const mistake = id => { st.mistakes[id] = (st.mistakes[id] || 0) + 1; };

  // time spent, only while the tab is showing and in use
  let lastTick = Date.now(), lastInput = Date.now();
  ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => { lastInput = Date.now(); }, true));
  setInterval(() => {
    const now = Date.now(), gap = Math.min(30, (now - lastTick) / 1000);
    lastTick = now;
    if (!st || document.hidden || now - lastInput > 120000) return;
    st.time.lab = Math.round(((st.time.lab || 0) + gap) * 10) / 10;
  }, 5000);

  // ---------- The machine ----------
  const machine = () => (st.setup.mach === 'pulley' ? { mach: 'pulley', n: st.setup.n } : { mach: 'ramp', L: st.setup.L });
  const sameMachine = (a, b) => a.mach === b.mach && (a.mach === 'pulley' ? a.n === b.set : Math.abs(a.L - b.set) < 0.01);
  const already = () => st.rows.find(r => sameMachine(machine(), r));
  const label = r => (r.mach === 'pulley' ? `⚙️ ${r.set} rope${r.set > 1 ? 's' : ''}` : `📐 ${fmt(r.set)} m ramp`);
  // Short row names used everywhere: P1, P2… for pulley rows and R1, R2… for ramp rows
  const tag = i => { const r = st.rows[i]; return `${r.mach === 'pulley' ? 'P' : 'R'}${st.rows.slice(0, i + 1).filter(x => x.mach === r.mach).length}`; };
  // Two tables, one per machine. hi = row indexes to highlight, cols = columns to bold
  function tablesHTML(o = {}) {
    const hi = o.hi || [], cols = o.cols || [], c = k => (cols.includes(k) ? 'col-on' : '');
    return [['pulley', '⚙️ Pulley trials', 'Ropes'], ['ramp', '📐 Ramp trials', 'Ramp']].map(([m, title, setHead]) => {
      const idx = st.rows.map((r, i) => i).filter(i => st.rows[i].mach === m);
      const body = idx.map(i => { const r = st.rows[i]; return `<tr class="${hi.includes(i) ? 'row-on' : ''}"><td class="tag-cell">${tag(i)}</td><td>${m === 'pulley' ? r.set : `${fmt(r.set)} m`}</td><td class="${c('d')}">${fmt(r.d)}</td><td class="${c('F')}">${fmt(r.F)}</td><td class="${c('W')}">${fmt(r.W)}</td></tr>`; });
      for (let k = idx.length; k < (o.big ? 0 : NEED_EACH); k++) body.push(`<tr class="empty"><td class="tag-cell">${m === 'pulley' ? 'P' : 'R'}${k + 1}</td><td></td><td></td><td></td><td></td></tr>`);
      return `<div class="tbl-block"><div class="tbl-title">${title}</div><table class="tbl ${o.big ? 'big-tbl' : ''}"><thead><tr><th></th><th>${setHead}</th><th class="c-d ${c('d')}">d (m)</th><th class="c-F ${c('F')}">F (N)</th><th class="c-W ${c('W')}">W (J)</th></tr></thead><tbody>${body.join('')}</tbody></table></div>`;
    }).join('');
  }

  function resetLift() { Object.assign(sim, { x: 0, v: 0, effort: 0, taps: [], hold: 0, locked: false }); ui.rec = {}; ui.recMsg = ''; drawScene(); paintRec(); paintAsk(); }

  // ---------- Tapping ----------
  function tap() { if (!sim.locked) sim.taps.push(performance.now()); }
  window.addEventListener('keydown', e => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target && e.target.tagName;
    if (t === 'TEXTAREA' || t === 'SELECT' || (t === 'INPUT' && e.target.type !== 'range')) return;
    if (e.key && e.key.toLowerCase() === 'p') { e.preventDefault(); tap(); }
  });
  function tapRate(now) {
    const t = sim.taps;
    while (t.length && now - t[0] > FORGET) t.shift();
    if (t.length > 6) t.splice(0, t.length - 6);
    if (!t.length) return 0;
    const since = (now - t[t.length - 1]) / 1000;
    let r;
    if (t.length >= 2) { const n = Math.min(t.length - 1, 3); r = n / ((t[t.length - 1] - t[t.length - 1 - n]) / 1000); } else r = 1 / Math.max(since, 1);
    if (since > 0 && 1 / since < r) r = 1 / since;
    return Math.min(r, 14);
  }
  const heightOf = (mc, x) => x / FL.factor(st.rig, mc);
  function inZone(mc, x) {
    const y = heightOf(mc, x), h = st.rig.h;
    return Math.abs(y - h) <= ZONE_TOL;   // the same green band for pulleys and ramps
  }
  const maxRope = mc => (mc.mach === 'pulley' ? mc.n : mc.L / st.rig.h) * (st.rig.h + 0.28);
  function step(dt) {
    const mc = machine(), r = st.rig, now = performance.now();
    sim.effort += (tapRate(now) * N_PER_TAP_RATE - sim.effort) * (1 - Math.exp(-8 * dt));
    if (sim.locked) return;
    const need = FL.forceNeed(r, mc), k = FL.factor(r, mc);
    const inertia = mc.mach === 'pulley' ? r.m / (k * k) : r.m;
    sim.v += ((sim.effort - need - DAMP * sim.v) / inertia) * dt;
    sim.x += sim.v * dt;
    if (sim.x <= 0) { sim.x = 0; if (sim.v < 0) sim.v = 0; }
    if (sim.x >= maxRope(mc)) { sim.x = maxRope(mc); if (sim.v > 0) sim.v = 0; }
    sim.hold = inZone(mc, sim.x) ? sim.hold + dt : Math.max(0, sim.hold - dt * 1.5);
    if (sim.hold >= HOLD_T) { sim.locked = true; sim.x = FL.ropeDist(r, mc); sim.v = 0; ui.rec = {}; ui.recMsg = ''; paintRec(); paintAsk(); }
  }
  function status() {
    const mc = machine(), y = heightOf(mc, sim.x), h = st.rig.h;
    let m, cls = '';
    if (sim.locked) { m = '🔒 Held! Read the scale and the tape.'; cls = 'ok'; }
    else if (inZone(mc, sim.x) && sim.hold > 0) { m = `Hold it… ${'🟩'.repeat(Math.ceil(sim.hold / HOLD_T * 3))}${'⬜'.repeat(3 - Math.ceil(sim.hold / HOLD_T * 3))}`; cls = 'ok'; }
    else if (y > h + ZONE_TOL) { m = 'Too high. Slow down.'; cls = 'warn'; }
    else if (sim.v < -0.05) { m = 'Slipping! Tap faster.'; cls = 'warn'; }
    else if (sim.x < 0.01) m = 'Tap P fast! Hold it in the green zone.';
    else m = 'Up, up…';
    if (m + cls !== ui.msg) { ui.msg = m + cls; $('status').textContent = m; $('status').className = `status ${cls}`; }
  }
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - sim.last) / 1000));
    sim.last = now;
    if (st) {
      step(dt);
      const F = sim.locked ? FL.forceNeed(st.rig, machine()) : sim.effort;
      Scene.place($('stage').querySelector('svg'), { rig: st.rig, mc: machine(), x: sim.x, F, hold: sim.hold / HOLD_T, locked: sim.locked });
      status();
    }
    requestAnimationFrame(frame);
  }

  // ---------- 1 Setup ----------
  function paintSetup() {
    const s = st.setup;
    document.querySelectorAll('.mach').forEach(b => b.classList.toggle('on', b.dataset.mach === s.mach));
    $('ctlPulley').hidden = s.mach !== 'pulley';
    $('ctlRamp').hidden = s.mach !== 'ramp';
    $('ropes').value = s.n; $('ropesVal').textContent = s.n;
    $('rampL').value = s.L; $('rampLVal').textContent = s.L.toFixed(1);
  }
  function changeSetup(patch) { Object.assign(st.setup, patch); paintSetup(); resetLift(); save(); paintTrue(); }
  function bindSetup() {
    document.querySelectorAll('.mach').forEach(b => b.addEventListener('click', () => changeSetup({ mach: b.dataset.mach })));
    $('ropes').addEventListener('input', e => changeSetup({ n: Number(e.target.value) }));
    $('rampL').addEventListener('input', e => changeSetup({ L: Number(e.target.value) }));
    // let go of the keyboard once the slider is set, so arrow keys and P go back to the lab
    ['ropes', 'rampL'].forEach(id => ['change', 'pointerup'].forEach(ev => $(id).addEventListener(ev, e => e.target.blur())));
    document.querySelectorAll('.mach').forEach(b => b.addEventListener('pointerup', () => b.blur()));
    $('btnReset').addEventListener('click', resetLift);
    $('btnPull').addEventListener('pointerdown', e => { e.preventDefault(); tap(); });
  }

  // ---------- 2 Simulation ----------
  function drawScene() {
    $('stage').innerHTML = Scene.lab({ rig: st.rig, mc: machine(), x: sim.x, F: sim.locked ? FL.forceNeed(st.rig, machine()) : sim.effort, hold: 0, locked: sim.locked, digital: tier() === 'conceptual' });
  }

  // ---------- 3 My Data ----------
  function paintRows() {
    const c = counts(st);
    $('progress').innerHTML = `<span class="${c.pulley >= NEED_EACH ? 'done' : ''}">⚙️ ${Math.min(c.pulley, NEED_EACH)}/${NEED_EACH}</span><span class="${c.ramp >= NEED_EACH ? 'done' : ''}">📐 ${Math.min(c.ramp, NEED_EACH)}/${NEED_EACH}</span>`;
    $('tables').innerHTML = tablesHTML();
  }
  // fromCalc: the box is filled only by the calculator's "Use answer" button
  const inp = (k, unit, cls, fromCalc) => `<label class="rec-in ${cls}"><span>${k}</span><input type="text" inputmode="decimal" autocomplete="off" data-rec="${k}" value="${esc(ui.rec[k] || '')}" aria-label="${k} in ${unit}${fromCalc ? ', from the calculator' : ''}" ${fromCalc ? 'readonly tabindex="-1" class="calc-fill" placeholder="🧮"' : ''}><span>${unit}</span></label>`;
  function paintRec() {
    const box = $('recBox');
    const callout = (cls, ico, big, small) => `<div class="callout ${cls}"><span class="ico">${ico}</span><div>${big}${small ? `<small>${small}</small>` : ''}</div></div>`;
    if (counts(st)[st.setup.mach] >= MAX_EACH && !already()) { box.innerHTML = callout('callout-full', '✅', `Your ${st.setup.mach} table is full.`, `Try the ${st.setup.mach === 'pulley' ? 'ramp' : 'pulley'}, or answer the questions.`); syncCalc(); return; }
    if (already()) { box.innerHTML = callout('callout-done', '🔁', 'This setup is already in your table.', `Change to a different ${st.setup.mach === 'pulley' ? 'number of ropes' : 'ramp length'} or machine in 1 Setup.`); syncCalc(); return; }
    if (!sim.locked) { box.innerHTML = callout('callout-info', '⬆️', 'Lift and hold to record.', 'Tap P. Keep the load in the green zone.'); syncCalc(); return; }
    const until = ui.recUntil || 0, l = left(until);
    box.innerHTML = `<div class="rec-row">${inp('d', 'm', 'c-d')}${inp('F', 'N', 'c-F')}${inp('W', 'J', 'c-W', !!desmos)}
      <button type="button" class="btn btn-green" id="btnAdd" ${l ? 'disabled' : ''}>${l ? `Wait ${l}` : 'Add ✓'}</button></div>
      <p class="formula">W = F × d${desmos ? ' · work it out on the 🧮 calculator, then press 📥 Use answer' : ''}</p>${ui.recMsg ? `<p class="miss">${ui.recMsg}</p>` : ''}`;
    box.querySelectorAll('[data-rec]').forEach(el => {
      el.addEventListener('input', () => { ui.rec[el.dataset.rec] = el.value; });
      el.addEventListener('keydown', e => { if (e.key === 'Enter') addRow(); });
    });
    $('btnAdd').addEventListener('click', addRow);
    syncCalc();
    if (l) setTimeout(paintRec, Math.min(1000, Math.max(50, (until || 0) - Date.now())));
  }
  function addRow() {
    if (!sim.locked || already() || left(ui.recUntil) || counts(st)[st.setup.mach] >= MAX_EACH) return;
    const mc = machine(), d = FL.ropeDist(st.rig, mc), F = FL.forceNeed(st.rig, mc);
    const v = k => FL.parseNum(ui.rec[k] || '');
    const dv = v('d'), Fv = v('F'), Wv = v('W');
    if (dv === null || Fv === null || Wv === null) { ui.recMsg = 'Fill in all three.'; return paintRec(); }
    const cd = FL.checkDist(String(dv), d, F), cF = FL.checkForce(String(Fv), F, d, st.rig);
    const wOk = Math.abs(Wv - Fv * dv) <= Math.max(0.6, 0.02 * Fv * dv);
    const key = `row_${st.rows.length + 1}`;
    if (!cd.ok || !cF.ok || !wOk) {
      recordTry(key, false);
      const bad = !cd.ok ? cd : !cF.ok ? cF : null;
      if (bad) mistake(bad.mistake); else mistake('w_math');
      ui.recMsg = !cd.ok ? (cd.mistake === 'dist_gave_height' ? '1.5 m is how high the load went. How far did the rope move? Look at the red tag.' : '🔍 Look again at the red tag on the tape.')
        : !cF.ok ? (cF.mistake === 'force_gave_weight' ? 'That is the whole weight. Read the scale.' : '🔍 Look again at the scale. Small marks are 5 N.')
          : 'Check your multiplying: W = F × d.';
      ui.misses = (ui.misses || 0) + 1;
      ui.recUntil = wait(Math.min(12, 2 + 2 * ui.misses));
      save(); return paintRec();
    }
    recordTry(key, true);
    st.rows.push({ mach: mc.mach, set: mc.mach === 'pulley' ? mc.n : mc.L, d: FL.round(dv, 2), F: FL.round(Fv, 1), W: FL.round(Wv, 1), work: ui.work || null });
    ui.work = null; if (desmos && desmos.setBlank) desmos.setBlank();
    ui.rec = {}; ui.recMsg = ''; ui.misses = 0; ui.recUntil = 0;
    save(true); paintRows(); paintRec(); paintCharts(); paintAsk();
    if (ready() && !ready.__was) { ready.__was = true; openThink(); }
  }

  // ---------- Charts: small in card 4, big in the Think view ----------
  // o = { big, hi: [row indexes to highlight], curve: true, readX: number }
  function graphSVG(o = {}) {
    const W = o.big ? 600 : 320, H = o.big ? 380 : 214, b = o.big ? { x0: 84, x1: 584, y0: 318, y1: 34 } : { x0: 56, x1: 312, y0: 172, y1: 26 };
    const fs = o.big ? 1.4 : 1, ymax = FL.forceAxis(FL.weight(st.rig)).max, xmax = 7, hi = o.hi || [];
    const px = (x, y) => ({ x: b.x0 + x / xmax * (b.x1 - b.x0), y: b.y0 - y / ymax * (b.y0 - b.y1) });
    let g = `<text x="${W / 2}" y="${16 * fs}" class="ch-title" style="font-size:${15 * fs}px" text-anchor="middle">Force vs. rope pulled</text>`;
    const step = o.big ? 25 : 50;
    if (o.big) {   // minor lines every 0.5 m and 5 N, so a value can be read closely
      for (let x = 0.5; x < xmax; x += 1) { const p = px(x, 0); g += `<line x1="${p.x}" y1="${b.y0}" x2="${p.x}" y2="${b.y1}" class="ch-grid-minor"/>`; }
      for (let y = 5; y < ymax; y += 5) { if (y % 25) { const p = px(0, y); g += `<line x1="${b.x0}" y1="${p.y}" x2="${b.x1}" y2="${p.y}" class="ch-grid-minor"/>`; } }
    }
    for (let x = 0; x <= xmax; x++) { const p = px(x, 0); g += `<line x1="${p.x}" y1="${b.y0}" x2="${p.x}" y2="${b.y1}" class="ch-grid"/><text x="${p.x}" y="${b.y0 + 16 * fs}" class="ch-num" style="font-size:${13 * fs}px" text-anchor="middle">${x}</text>`; }
    for (let y = 0; y <= ymax; y += step) { const p = px(0, y); g += `<line x1="${b.x0}" y1="${p.y}" x2="${b.x1}" y2="${p.y}" class="ch-grid"/><text x="${b.x0 - 6}" y="${p.y + 4}" class="ch-num" style="font-size:${13 * fs}px" text-anchor="end">${y}</text>`; }
    g += `<path d="M ${b.x0} ${b.y1} V ${b.y0} H ${b.x1}" class="ch-axis"/><text x="${(b.x0 + b.x1) / 2}" y="${H - 8}" class="ch-lab c-d-fill" style="font-size:${13.5 * fs}px" text-anchor="middle">rope pulled, d (m)</text>`
      + `<text transform="translate(${16 * fs} ${(b.y0 + b.y1) / 2}) rotate(-90)" class="ch-lab c-F-fill" style="font-size:${13.5 * fs}px" text-anchor="middle">force, F (N)</text>`;
    if (o.curve && st.rows.length) {
      const Wc = FL.workOut(st.rig), xa = Math.max(0.3, Wc / ymax), pts = [];
      for (let i = 0; i <= 50; i++) { const x = xa + (xmax - xa) * i / 50, p = px(x, Wc / x); pts.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`); }
      g += `<path d="M ${pts.join(' L ')}" class="ch-curve"/>`;
    }
    if (typeof o.readX === 'number') { const p = px(o.readX, 0); g += `<line x1="${p.x}" y1="${b.y0}" x2="${p.x}" y2="${b.y1}" class="ch-read"/><text x="${p.x + 6}" y="${b.y0 - 8}" class="ch-lab c-d-fill pt-label" style="font-size:${14 * fs}px">d = ${fmt(o.readX)} m</text>`; }
    const order = st.rows.map((r, i) => i).sort((p, q) => (st.rows[p].mach === st.rows[q].mach ? 0 : st.rows[p].mach === 'ramp' ? -1 : 1));
    order.forEach(i => {
      const r = st.rows[i], p = px(r.d, r.F), on = hi.includes(i), k = (on ? 1.35 : 1) * (o.big ? 1.25 : 1);
      g += r.mach === 'ramp' ? `<path d="M ${p.x} ${p.y - 13 * k} l ${12 * k} ${20 * k} h ${-24 * k} z" class="pt-ramp ${on ? 'pt-on' : ''}"/>` : `<circle cx="${p.x}" cy="${p.y}" r="${5.5 * k}" class="pt-pulley ${on ? 'pt-on' : ''}"/>`;
      if (on) g += `<text x="${p.x + 14}" y="${p.y - 10}" class="pt-label">${tag(i)}: ${fmt(r.F)} N</text>`;
    });
    if (!st.rows.length) g += `<text x="${(b.x0 + b.x1) / 2}" y="${(b.y0 + b.y1) / 2}" class="ch-empty" text-anchor="middle">Your trials appear here</text>`;
    g += `<g transform="translate(${b.x1 - 140 * fs} ${b.y1 + 4})" style="font-size:${13 * fs}px"><circle cx="8" cy="8" r="6" class="pt-pulley"/><text x="18" y="13" class="ch-num" style="font-size:inherit">pulley</text><path d="M ${84 * fs} 0 l 8 14 h -16 z" class="pt-ramp"/><text x="${96 * fs}" y="13" class="ch-num" style="font-size:inherit">ramp</text></g>`;
    return `<svg viewBox="0 0 ${W} ${H}" class="ch">${g}</svg>`;
  }
  function barsSVG(o = {}) {
    const W = o.big ? 600 : 320, H = o.big ? 380 : 214, b = o.big ? { x0: 84, x1: 584, y0: 318, y1: 34 } : { x0: 56, x1: 312, y0: 172, y1: 26 };
    const fs = o.big ? 1.4 : 1, hi = o.hi || [];
    const wmax = Math.ceil((FL.workOut(st.rig) * 1.3) / 50) * 50, n = Math.max(6, st.rows.length), slot = (b.x1 - b.x0) / n;
    let w = `<text x="${W / 2}" y="${16 * fs}" class="ch-title" style="font-size:${15 * fs}px" text-anchor="middle">Work in each trial</text>`;
    for (let y = 0; y <= wmax; y += (o.big ? 50 : 100)) { const yy = b.y0 - y / wmax * (b.y0 - b.y1); w += `<line x1="${b.x0}" y1="${yy}" x2="${b.x1}" y2="${yy}" class="ch-grid"/><text x="${b.x0 - 6}" y="${yy + 4}" class="ch-num" style="font-size:${13 * fs}px" text-anchor="end">${y}</text>`; }
    w += `<path d="M ${b.x0} ${b.y1} V ${b.y0} H ${b.x1}" class="ch-axis"/><text transform="translate(${16 * fs} ${(b.y0 + b.y1) / 2}) rotate(-90)" class="ch-lab c-W-fill" style="font-size:${13.5 * fs}px" text-anchor="middle">work, W (J)</text>`;
    st.rows.forEach((r, i) => {
      const x = b.x0 + i * slot + slot * 0.18, bw = slot * 0.64, top = b.y0 - Math.min(wmax, r.W) / wmax * (b.y0 - b.y1), on = hi.includes(i);
      w += `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${(b.y0 - top).toFixed(1)}" rx="3" class="${r.mach === 'ramp' ? 'bar-ramp' : 'bar-pulley'} ${on ? 'bar-on' : ''}"/>`
        + `<text x="${(x + bw / 2).toFixed(1)}" y="${(top - 5).toFixed(1)}" class="ch-num ${on ? 'strong-num' : ''}" style="font-size:${13 * fs}px" text-anchor="middle">${fmt(Math.round(r.W))}</text>`
        + `<text x="${(x + bw / 2).toFixed(1)}" y="${b.y0 + 16 * fs}" class="ch-num" style="font-size:${13 * fs}px" text-anchor="middle">${tag(i)}</text>`;
      if (on && o.big) w += `<text x="${(x + bw / 2).toFixed(1)}" y="${b.y0 + 34 * fs}" class="pt-label" text-anchor="middle">d = ${fmt(r.d)} m</text>`;
    });
    if (!st.rows.length) w += `<text x="${(b.x0 + b.x1) / 2}" y="${(b.y0 + b.y1) / 2}" class="ch-empty" text-anchor="middle">W = F × d for each trial</text>`;
    return `<svg viewBox="0 0 ${W} ${H}" class="ch">${w}</svg>`;
  }
  // ---------- Any chart, full screen ----------
  let chartOpen = null;
  function openChart(kind, opts) {
    chartOpen = { kind, opts: Object.assign({}, opts, { big: true }) };
    paintChartModal();
    $('chartModal').hidden = false;
    $('chartClose').focus();
  }
  function paintChartModal() {
    if (!chartOpen) return;
    $('chartModalBody').innerHTML = chartOpen.kind === 'bars' ? barsSVG(chartOpen.opts) : graphSVG(chartOpen.opts);
  }
  function closeChart() { chartOpen = null; $('chartModal').hidden = true; }
  function bindCharts() {
    $('graph').addEventListener('click', () => openChart('graph', { curve: st.rows.length >= 4 }));
    $('bars').addEventListener('click', () => openChart('bars', {}));
    $('thinkBody').addEventListener('click', e => { if (e.target.closest('.think-chart') && ui.thinkChart) openChart(ui.thinkChart.kind, ui.thinkChart.opts); });
    $('chartClose').addEventListener('click', closeChart);
    $('chartModal').addEventListener('click', e => { if (e.target.id === 'chartModal') closeChart(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && chartOpen) closeChart(); });
    $('graph').title = $('bars').title = 'Click to see it full screen';
  }
  function paintCharts() { $('graph').innerHTML = graphSVG(); $('bars').innerHTML = barsSVG(); if (!$('think').hidden) paintThink(); paintChartModal(); }

  // ---------- Think about your data: a big view, opened once the table is ready ----------
  function ready() { const c = counts(st); return c.pulley >= NEED_EACH && c.ramp >= NEED_EACH; }
  function testLengths() { const used = st.rows.map(r => r.d); return [2.5, 3.5, 4.5, 5, 5.5].filter(L => used.every(u => Math.abs(u - L) > 0.2)); }
  const FRAC = { 2: '½', 3: '⅓', 4: '¼' };
  // Two of their pulley rows where one rope distance is a whole number of times the other (2× if possible)
  function pairQ() {
    const a = st.ask.double || (st.ask.double = {});
    if (!a.pair) {
      const P = st.rows.map((r, i) => ({ r, i })).filter(o => o.r.mach === 'pulley');
      let best = null;
      P.forEach(p => P.forEach(q => { const k = q.r.set / p.r.set; if (Number.isInteger(k) && k > 1 && (!best || Math.abs(k - 2) < Math.abs(best.k - 2))) best = { i: p.i, j: q.i, k }; }));
      if (!best) { const s = st.rows.map((r, i) => ({ r, i })).sort((p, q) => p.r.d - q.r.d); best = { i: s[0].i, j: s[s.length - 1].i, k: Math.round(s[s.length - 1].r.d / s[0].r.d) }; }
      Object.assign(a, { pair: [best.i, best.j], k: best.k });
    }
    return a;
  }
  function spreadQ() {
    const a = st.ask.same || (st.ask.same = {});
    if (!a.pair) { const s = st.rows.map((r, i) => ({ r, i })).sort((p, q) => p.r.d - q.r.d); a.pair = [s[0].i, s[s.length - 1].i]; }
    return a;
  }
  // ---------- The questions each class gets, in order ----------
  // Periods 1–3: force pattern, work pattern, predict a ramp.
  // Periods 4–6 add mechanical advantage and a sentence that explains the trade-off. Period 0 also designs a ramp.
  const STEPS = t => ['double', 'same'].concat(t === 'conceptual' ? [] : ['ma', 'claim'], ['predict'], t === 'honors' ? ['design'] : []);
  const WEIGHT = { double: 1, same: 1, ma: 1, claim: 1, predict: 2, design: 2 };
  const THINK = ['double', 'same', 'ma', 'claim', 'predict', 'design'];   // steps answered in the big view
  function stepDone(s, id) {
    if (id === 'predict') return !!(s.pred && s.pred.ok);
    if (id === 'design') return !!(s.design && s.design.ok);
    return !!(s.ask && s.ask[id] && s.ask[id].ok);
  }
  function thinkStep() {
    if (!ready()) return null;
    for (const id of STEPS(tier())) {
      if (stepDone(st, id)) continue;
      if (id === 'predict') return st.pred && st.pred.val !== undefined && st.pred.val !== null ? 'test' : 'predict';
      if (id === 'design') return st.design && st.design.Lok ? 'dtest' : 'design';
      return id;
    }
    return 'done';
  }
  const thinkLeft = () => STEPS(tier()).filter(id => !stepDone(st, id)).length;

  function questionFor(id) {
    if (id === 'double') {
      const a = pairQ(), [i, j] = a.pair, r1 = st.rows[i], r2 = st.rows[j], k = a.k;
      return {
        a, hi: [i, j], chart: 'graph', cols: ['d', 'F'],
        text: `<p><b>${tag(i)}</b> (${label(r1)}): you pulled <b class="c-d">${fmt(r1.d)} m</b> of rope.</p><p><b>${tag(j)}</b> (${label(r2)}): you pulled <b class="c-d">${fmt(r2.d)} m</b>. That is <b>${k} times as far</b>.</p>`,
        ask: `What happened to the <span class="c-F">force</span>?`,
        opts: [['bigger', `${k}× bigger`], ['same', 'stayed the same'], ['smaller', `${FRAC[k] || `1/${k}`} as big`]], right: 'smaller',
        look: `Find ${tag(i)} and ${tag(j)} in your tables. Compare their forces.`
      };
    }
    const a = spreadQ(), [i, j] = a.pair, r1 = st.rows[i], r2 = st.rows[j];
    return {
      a, hi: [i, j], chart: 'bars', cols: ['d', 'W'],
      text: `<p><b>${tag(i)}</b> (${label(r1)}) pulled the <b>least</b> rope: <b class="c-d">${fmt(r1.d)} m</b>.</p><p><b>${tag(j)}</b> (${label(r2)}) pulled the <b>most</b> rope: <b class="c-d">${fmt(r2.d)} m</b>.</p>`,
      ask: `How does their <span class="c-W">work</span> compare?`,
      opts: [['more', `${tag(j)} took more work`], ['same', 'about the same work'], ['less', `${tag(j)} took less work`]], right: 'same',
      look: `Look at the bars for ${tag(i)} and ${tag(j)}. Are they different heights?`
    };
  }
  const bigTable = (hi, cols) => `<div class="big-tables">${tablesHTML({ hi, cols, big: true })}</div>`;

  // Number boxes in the big view. The calculator's "Use answer" fills the one the student last clicked (or the first empty one).
  const numBox = (id, sym, unit, cls) => `<label class="rec-in ${cls} big-in"><span>${sym}</span><input type="text" inputmode="decimal" autocomplete="off" class="calc-target" id="${id}" value="${esc((ui.drafts || {})[id] || '')}" aria-label="${sym}"><span>${unit}</span></label>`;
  function bindNumBoxes(box, onEnter) {
    box.querySelectorAll('.calc-target').forEach(el => {
      el.addEventListener('focus', () => { ui.lastCalc = el.id; });
      el.addEventListener('input', () => { ui.drafts = Object.assign({}, ui.drafts, { [el.id]: el.value }); });
      el.addEventListener('keydown', e => { if (e.key === 'Enter' && onEnter) onEnter(); });
    });
  }
  const draft = id => FL.parseNum((ui.drafts || {})[id] || '');
  const clearDrafts = () => { ui.drafts = {}; ui.lastCalc = null; };

  function openThink() { $('think').hidden = false; paintThink(); }
  function closeThink() { $('think').hidden = true; paintAsk(); syncCalc(); }
  function paintThink() {
    const stp = thinkStep(), box = $('thinkBody');
    if (!stp || !THINK.includes(stp)) { closeThink(); return; }
    const list = STEPS(tier()).filter(id => THINK.includes(id));
    $('thinkStep').textContent = `Question ${list.indexOf(stp) + 1} of ${list.length}`;
    const left2 = (chart, kind, opts) => { ui.thinkChart = { kind, opts }; return `<div class="think-left"><div class="think-chart" title="Click to see it full screen">${chart}</div></div>`; };

    if (stp === 'predict') {
      if (!st.pred) { st.pred = { L: FL.pick(testLengths()) || 5 }; save(); }
      const L = st.pred.L, o = { big: true, curve: true, readX: L };
      box.innerHTML = left2(graphSVG(o), 'graph', o) + `
        <div class="think-q"><div class="q-text">${st.pred.lastMsg ? `<p class="miss">${st.pred.lastMsg} Try this one.</p>` : ''}<p>A <b class="c-d">${fmt(L)} m</b> ramp is <b>not</b> in your tables.</p><p>The curve goes through your points. The dashed line is at ${fmt(L)} m.</p></div>
        <p class="q-ask">Predict the <span class="c-F">force</span> on the rope.</p>
        <div class="rec-row">${numBox('predIn', 'F', 'N', 'c-F')}<button type="button" class="btn btn-blue" id="btnPred">Lock it in</button></div>
        <p class="hint">Read the curve, or use the calculator: F = W ÷ d.</p>${bigTable([], ['d', 'F', 'W'])}</div>`;
      bindNumBoxes(box, () => $('btnPred').click());
      $('btnPred').addEventListener('click', () => {
        const v = draft('predIn');
        if (v === null || v <= 0) return;
        st.pred.val = FL.round(v, 1); st.pred.lastMsg = ''; clearDrafts(); save(true); closeThink();
      });
      syncCalc(); return;
    }

    if (stp === 'ma') {
      // the row with the most rope: a big trade-off to look at
      const a = st.ask.ma || (st.ask.ma = {});
      if (a.i === undefined) a.i = st.rows.reduce((b, r, i) => (r.d > st.rows[b].d ? i : b), 0);
      const r = st.rows[a.i], l = left(a.until), o = { big: true, hi: [a.i] };
      box.innerHTML = left2(graphSVG(o), 'graph', o) + `
        <div class="think-q"><div class="q-text"><p><b>Mechanical advantage (MA)</b> tells how many times a machine multiplies your force.</p>
          <p>Look at <b>${tag(a.i)}</b> (${label(r)}). Your load is <b>${st.rig.m} kg</b>, so its weight is F<sub>g</sub> = m × g.</p></div>
        <p class="q-ask">Find both. Use the calculator.</p>
        <div class="ma-grid"><span class="formula-chip">MA = F<sub>g</sub> ÷ F</span>${numBox('maIn', 'MA', '', 'c-F')}
          <span class="formula-chip">rope distance ÷ height = d ÷ h</span>${numBox('ratioIn', 'd ÷ h', '', 'c-d')}</div>
        <button type="button" class="btn btn-green" id="btnMa" ${l ? 'disabled' : ''}>${l ? `Wait ${l}` : 'Check'}</button>
        ${a.msg ? `<p class="miss">${a.msg}</p>` : ''}${bigTable([a.i], ['d', 'F'])}</div>`;
      bindNumBoxes(box, () => $('btnMa').click());
      $('btnMa').addEventListener('click', () => {
        if (left(a.until)) return;
        const ma = draft('maIn'), ra = draft('ratioIn');
        if (ma === null || ra === null) { a.msg = 'Fill in both boxes.'; return paintThink(); }
        const maT = st.rig.m * 10 / r.F, raT = r.d / st.rig.h;
        const maOk = Math.abs(ma - maT) <= Math.max(0.1, 0.03 * maT), raOk = Math.abs(ra - raT) <= Math.max(0.05, 0.02 * raT);
        recordTry('q_ma', maOk && raOk);
        if (maOk && raOk) { a.ok = true; a.ma = FL.round(ma, 2); a.ratio = FL.round(ra, 2); a.msg = ''; clearDrafts(); save(true); paintThink(); paintAsk(); return; }
        mistake(!maOk ? 'q_ma_value' : 'q_ma_ratio');
        a.msg = !maOk ? `Check MA. First find F<sub>g</sub> = ${st.rig.m} kg × 10 m/s², then divide by ${tag(a.i)}'s force from your table.` : `Check d ÷ h. Use ${tag(a.i)}'s rope distance from your table and the 1.5 m height.`;
        a.until = wait(4); save(); paintThink();
        setTimeout(paintThink, Math.min(1000, Math.max(50, a.until - Date.now())));
      });
      syncCalc(); return;
    }

    if (stp === 'claim') {
      const pq = pairQ(), [i, j] = pq.pair, k = pq.k, a = st.ask.claim || (st.ask.claim = {}), l = left(a.until), o = { big: true, hi: [i, j] };
      const choices = [['up', `went up ${k} times`], ['same', 'stayed the same'], ['down', `went down to ${FRAC[k] || `1/${k}`}`]];
      const pick = slot => `<select class="claim-sel ${slot === 'F' ? 'c-F' : 'c-W'}" data-slot="${slot}" ${l ? 'disabled' : ''} aria-label="${slot === 'F' ? 'What the force did' : 'What the work did'}"><option value="">choose…</option>${choices.map(c => `<option value="${c[0]}" ${a[slot] === c[0] ? 'selected' : ''}>${c[1]}</option>`).join('')}</select>`;
      box.innerHTML = left2(graphSVG(o), 'graph', o) + `
        <div class="think-q"><div class="q-text"><p>Explain the trade-off with ${tag(i)} and ${tag(j)}. Finish the sentence.</p></div>
        <p class="claim-sentence">When the rope distance went up <b>${k} times</b>, the <span class="c-F">force</span> ${pick('F')} and the <span class="c-W">work</span> ${pick('W')}.</p>
        <button type="button" class="btn btn-green" id="btnClaim" ${l ? 'disabled' : ''}>${l ? `Wait ${l}` : 'Check my sentence'}</button>
        ${a.msg ? `<p class="miss">${a.msg}</p>` : ''}${bigTable([i, j], ['d', 'F', 'W'])}</div>`;
      box.querySelectorAll('[data-slot]').forEach(sel => sel.addEventListener('change', () => { a[sel.dataset.slot] = sel.value || null; a.msg = ''; }));
      $('btnClaim').addEventListener('click', () => {
        if (left(a.until)) return;
        if (!a.F || !a.W) { a.msg = 'Pick one for the force and one for the work.'; return paintThink(); }
        const ok = a.F === 'down' && a.W === 'same';
        recordTry('q_claim', ok);
        if (ok) { a.ok = true; a.msg = ''; save(true); paintThink(); paintAsk(); return; }
        mistake(`q_claim_${a.F}_${a.W}`);
        a.msg = a.F !== 'down' ? `Look at the forces for ${tag(i)} and ${tag(j)} in your table.` : `Look at the work (W) for ${tag(i)} and ${tag(j)}.`;
        a.F = null; a.W = null; a.until = wait(6); save(); paintThink();
        setTimeout(paintThink, Math.min(1000, Math.max(50, a.until - Date.now())));
      });
      syncCalc(); return;
    }

    if (stp === 'design') {
      if (!st.design) {
        const W = FL.workOut(st.rig), used = st.rows.map(r => r.d).concat(st.pred ? [st.pred.L] : []);
        const opts = [2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6].filter(L => used.every(u => Math.abs(u - L) > 0.2) && Number.isInteger(FL.round(W / L, 4)));
        const L = FL.pick(opts) || 5;
        st.design = { L, F: FL.round(W / L, 1) }; save();
      }
      const d = st.design, l = left(d.until), o = { big: true, curve: true };
      box.innerHTML = left2(graphSVG(o), 'graph', o) + `
        <div class="think-q"><div class="q-text"><p><b>Design a ramp.</b> Your strongest steady pull is only <b class="c-F">${fmt(d.F)} N</b>.</p><p>The load still has to reach the 1.5 m line.</p></div>
        <p class="q-ask">What is the <b>shortest</b> ramp that works?</p>
        <div class="rec-row">${numBox('designIn', 'L', 'm', 'c-d')}<button type="button" class="btn btn-green" id="btnDesign" ${l ? 'disabled' : ''}>${l ? `Wait ${l}` : 'Check'}</button></div>
        <p class="hint">Use your work: L = W ÷ F. Then you will build it and test it.</p>${d.msg ? `<p class="miss">${d.msg}</p>` : ''}${bigTable([], ['d', 'F', 'W'])}</div>`;
      bindNumBoxes(box, () => $('btnDesign').click());
      $('btnDesign').addEventListener('click', () => {
        if (left(d.until)) return;
        const v = draft('designIn');
        if (v === null) return;
        const ok = Math.abs(v - d.L) <= Math.max(0.05, 0.02 * d.L);
        recordTry('q_design', ok);
        if (ok) { d.Lok = true; d.val = d.L; d.msg = ''; clearDrafts(); save(true); closeThink(); return; }
        mistake(v > d.L ? 'q_design_long' : 'q_design_short');
        d.msg = `Check it: your work in every trial was about ${fmt(Math.round(FL.workOut(st.rig)))} J. Divide by the ${fmt(d.F)} N you can pull.`;
        d.until = wait(5); save(); paintThink();
        setTimeout(paintThink, Math.min(1000, Math.max(50, d.until - Date.now())));
      });
      syncCalc(); return;
    }

    // double / same: pick an answer
    const q = questionFor(stp), a = q.a, l = left(a.until), order = a.order || q.opts.map(o => o[0]), o = { big: true, hi: q.hi };
    box.innerHTML = left2(q.chart === 'graph' ? graphSVG(o) : barsSVG(o), q.chart, o) + `
      <div class="think-q"><div class="q-text">${q.text}</div><p class="q-ask">${q.ask}</p>
        <div class="q-opts big-opts">${order.map(k => { const op = q.opts.find(x => x[0] === k); return `<button type="button" class="opt" data-a="${k}" ${l ? 'disabled' : ''}>${op[1]}</button>`; }).join('')}</div>
        ${l ? `<p class="miss">Not quite. ${q.look} (${l})</p>` : ''}${bigTable(q.hi, q.cols)}</div>`;
    box.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => {
      if (left(a.until)) return;
      const ok = b.dataset.a === q.right;
      recordTry(`q_${stp}`, ok);
      if (ok) a.ok = true; else { mistake(`q_${stp}_${b.dataset.a}`); a.until = wait(6); a.order = FL.shuffle(q.opts.map(x => x[0])); }
      save(true); paintThink(); paintAsk();
    }));
    if (l) setTimeout(paintThink, Math.min(1000, Math.max(50, (a.until || 0) - Date.now())));
    syncCalc();
  }

  // ---------- In My Data: the way into the questions, then testing the prediction or the design ----------
  function paintAsk() {
    const box = $('askBox'), stp = thinkStep();
    const callout = (cls, ico, big, small, btn) => `<div class="callout ${cls}"><span class="ico">${ico}</span><div>${big}${small ? `<small>${small}</small>` : ''}${btn || ''}</div></div>`;
    if (!stp) { box.innerHTML = ''; if ($('btnUseCalc')) syncCalc(); return; }
    if (THINK.includes(stp)) {
      const n = thinkLeft();
      box.innerHTML = callout('callout-go', '🤔', `Your tables are ready! ${n} question${n > 1 ? 's' : ''} left.`, 'They use your own data.', '<button type="button" class="btn btn-blue go-btn" id="btnThink">Answer the questions ▶</button>');
      $('btnThink').addEventListener('click', openThink);
    } else if (stp === 'done') {
      const p = st.pred;
      box.innerHTML = `<div class="callout callout-full done-callout"><span class="ico">🎉</span><div>You finished the lab!<small>You predicted ${fmt(p.val)} N for a ${fmt(p.L)} m ramp. The scale read ${fmt(p.read)} N.</small>${certButton()}</div></div>`;
      bindCertButtons(box);
    } else box.innerHTML = testHTML(stp === 'dtest' ? 'design' : 'pred');
    bindTest(stp === 'dtest' ? 'design' : 'pred');
    if ($('btnUseCalc')) syncCalc();
  }
  function testHTML(kind) {
    const p = kind === 'design' ? st.design : st.pred, L = p.L, onIt = st.setup.mach === 'ramp' && Math.abs(st.setup.L - L) < 0.01;
    const head = kind === 'design'
      ? `<div class="callout callout-go"><span class="ico">🛠️</span><div>Build your design: a <b>${fmt(L)} m</b> ramp. You can pull only <b>${fmt(p.F)} N</b>.`
      : `<div class="callout callout-go"><span class="ico">🎯</span><div>Test your prediction: <b>${fmt(p.val)} N</b> for a <b>${fmt(L)} m</b> ramp.`;
    if (!onIt) return `${head}<small>Set the ramp to ${fmt(L)} m in 1 Setup.</small><button type="button" class="btn btn-blue go-btn" id="btnGoTest">Set it up ▶</button></div></div>`;
    if (!sim.locked) return `${head}<small>Now lift the cart and hold it at the line.</small></div></div>`;
    const l = left(p.until);
    return `${head}<small>What does the scale read?</small><div class="rec-row" style="margin-top:0.4rem"><label class="rec-in c-F"><span>F</span><input type="text" inputmode="decimal" id="readIn" value="${esc(ui.readDraft)}" aria-label="Scale reading in newtons"><span>N</span></label>
      <button type="button" class="btn btn-green" id="btnRead" ${l ? 'disabled' : ''}>${l ? `Wait ${l}` : 'Check'}</button></div>${p.msg ? `<p class="miss">${p.msg}</p>` : ''}</div></div>`;
  }
  function bindTest(kind) {
    const p = kind === 'design' ? st.design : st.pred;
    if (!p) return;
    const bg = $('btnGoTest'); if (bg) bg.addEventListener('click', () => changeSetup({ mach: 'ramp', L: p.L }));
    const ri = $('readIn'); if (ri) { ri.addEventListener('input', () => { ui.readDraft = ri.value; }); ri.addEventListener('keydown', e => { if (e.key === 'Enter') $('btnRead').click(); }); }
    const br = $('btnRead');
    if (br) br.addEventListener('click', () => {
      if (left(p.until)) return;
      const F = FL.forceNeed(st.rig, { mach: 'ramp', L: p.L }), x = FL.parseNum(ui.readDraft);
      if (x === null) return;
      const c = FL.checkForce(String(x), F, p.L, st.rig);
      if (!c.ok) { mistake(c.mistake); p.msg = '🔍 Look again at the scale. Small marks are 5 N.'; p.until = wait(4); save(); return paintAsk(); }
      p.read = FL.round(x, 1); ui.readDraft = ''; p.msg = '';
      if (kind === 'design') {
        // the design was checked when it was entered; the test shows the scale lands on the pull limit
        p.ok = true; recordTry('design_test', true);
        save(true); paintAsk(); checkFinished();
        if (thinkStep() !== 'done') openThink();
        return;
      }
      const ok = Math.abs(p.val - F) <= Math.max(4, 0.08 * F);
      recordTry(`pred_${(p.tries || 0) + 1}`, ok);
      if (ok) p.ok = true; else {
        mistake('prediction_missed');
        const L = FL.pick(testLengths().filter(t => t !== p.L)) || p.L;
        st.pred = { L, tries: (p.tries || 0) + 1, lastMsg: `The scale read ${fmt(p.read)} N, not ${fmt(p.val)} N.` };
        save(true); paintAsk(); openThink(); return;
      }
      save(true); paintAsk(); checkFinished();
      if (thinkStep() !== 'done') openThink();
    });
  }

  // ---------- Finished: an obvious ending and a certificate (PDF) ----------
  const finished = () => scoreState(st).done.length === 4;
  // Certificates are for signed-in students. A preview gets a SAMPLE. A guest is asked to sign in.
  const certKind = () => (profile.preview || profile.teacher ? 'sample' : profile.guest ? 'guest' : 'real');
  function ensureCert() {
    if (!finished() || certKind() === 'guest') return null;
    const id = certKind() === 'sample' ? 'SAMPLE' : (cloud && cloud.studentId) || 'STUDENT';
    const code = window.Certificate.code(id, st.bestPoints);
    if (!st.cert || st.cert.code !== code) st.cert = { code, at: (st.cert && st.cert.at) || Date.now() };
    return st.cert;
  }
  async function downloadCert(btn) {
    const c = ensureCert();
    if (!c) return;
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Making your certificate…';
    try {
      await window.Certificate.download({
        name: certKind() === 'sample' ? 'Sample Student' : profile.name, sample: certKind() === 'sample', best: st.bestPoints, honors: tier() === 'honors',
        period: profile.teacher ? 'Teacher' : (profile.period !== null && profile.period !== undefined ? `Period ${profile.period}` : ''),
        earned: c.at, code: c.code
      });
      btn.textContent = label;
    } catch (e) { console.error('Certificate failed:', e); btn.textContent = 'It did not download. Try again'; }
    btn.disabled = false;
    save(true);
  }
  const certButton = () => (certKind() === 'guest'
    ? '<p class="done-note">🎓 Certificates are for signed-in students. Sign in with your school account to get yours.</p>'
    : '<button type="button" class="btn btn-green done-cert" data-cert>📄 Download my certificate (PDF)</button>');
  function bindCertButtons(root) { root.querySelectorAll('[data-cert]').forEach(b => b.addEventListener('click', () => downloadCert(b))); }
  function showDone() {
    const c = counts(st), p = st.pred;
    $('doneScore').textContent = `${fmt(st.bestPoints)} / 10`;
    const items = [`✅ ${c.pulley} pulley trials and ${c.ramp} ramp trials, read and recorded`, '✅ Found that more rope distance means less force', '✅ Showed the work stays the same'];
    if (st.ask.ma && st.ask.ma.ok) items.push(`✅ Found a mechanical advantage of ${fmt(st.ask.ma.ma)}, the same as d ÷ h`);
    if (st.ask.claim && st.ask.claim.ok) items.push('✅ Explained the trade-off in a sentence');
    items.push(`✅ Predicted ${fmt(p.val)} N for a ${fmt(p.L)} m ramp, and it held up`);
    if (st.design && st.design.ok) items.push(`✅ Designed a ${fmt(st.design.L)} m ramp for a ${fmt(st.design.F)} N pull, and it worked`);
    $('doneList').innerHTML = items.map(t => `<li>${t}</li>`).join('');
    $('doneCert').innerHTML = certButton();
    bindCertButtons($('doneCert'));
    $('doneModal').hidden = false;
  }
  function checkFinished() {
    const done = finished();
    $('btnCertChip').hidden = !done || certKind() === 'guest';
    if (done) ensureCert();
    if (done && !st.celebrated) { st.celebrated = true; save(true); showDone(); }
  }

  function paintScore() { const el = $('scoreChip'); if (el && st) el.textContent = `${fmt(st.bestPoints || 0)} / 10`; }

  // ---------- Calculator: W (and the prediction) come from here, and the line has to be real work ----------
  let desmos = null;
  function setupCalc() {
    if (!window.Desmos) { st.calcUnavailable = true; $('calcHost').innerHTML = '<p class="hint" style="padding:0.6rem">The calculator did not load. Type W yourself.</p>'; return; }
    try {
      desmos = window.Desmos.ScientificCalculator($('calcHost'), { degreeMode: true, invertedColors: document.documentElement.classList.contains('theme-dark') });
    } catch (e) { desmos = null; }
    $('btnUseCalc').addEventListener('click', useCalc);
    window.addEventListener('resize', () => { if (desmos && desmos.resize) desmos.resize(); });
  }
  // Where the answer goes right now: the W box, or the prediction box
  function calcTarget() {
    if (!$('think').hidden && $('thinkBody').querySelector('.calc-target')) return 'think';
    if ($('btnAdd')) return 'W';
    return null;
  }
  function syncCalc() {
    const t = calcTarget(), b = $('btnUseCalc');
    b.disabled = !desmos || !t;
    b.textContent = t === 'W' ? '📥 Use as W' : t === 'think' ? ($('predIn') ? '📥 Use as prediction' : '📥 Use as answer') : '📥 Use answer';
  }
  function sayCalc(msg) { $('calcMsg').hidden = !msg; $('calcMsg').textContent = msg || ''; }
  function useCalc() {
    const t = calcTarget();
    if (!desmos || !t) return;
    const work = window.Engine.readCalculator(desmos.getState());
    if (work.empty) return sayCalc('Type your calculation first.');
    if (work.unreadable) return sayCalc('The line is not finished. Check it.');
    if (t === 'W') {
      const d = FL.parseNum(ui.rec.d || ''), F = FL.parseNum(ui.rec.F || '');
      if (d === null || F === null) return sayCalc('Type d and F first.');
      const problem = FL.workProblem(work, { routes: [[F, d]], from: 'your F and d' });
      if (problem) return sayCalc(problem);
      ui.rec.W = String(FL.round(work.value, 2)); ui.work = work.latex;
    } else {
      const problem = FL.workProblem(work, {});
      if (problem) return sayCalc(problem);
      // the box the student last clicked, or else the first empty one
      const boxes = [...$('thinkBody').querySelectorAll('.calc-target')];
      const target = boxes.find(b => b.id === ui.lastCalc) || boxes.find(b => !b.value) || boxes[0];
      ui.drafts = Object.assign({}, ui.drafts, { [target.id]: String(FL.round(work.value, 2)) });
      ui.lastCalc = null;
    }
    sayCalc('');
    if (t === 'W') paintRec(); else paintThink();
  }

  // ---------- Teacher tools: only for teacher accounts (and ?teacher on localhost) ----------
  const isTeacher = () => !!(profile && (profile.teacher || profile.teacherPreview));
  function trueReadings() {
    if (!isTeacher() || !$('tShow').checked) return '';
    const mc = machine(), d = FL.ropeDist(st.rig, mc), F = FL.forceNeed(st.rig, mc);
    return `d = ${fmt(FL.round(d, 2))} m · F = ${fmt(FL.round(F, 1))} N · W = ${fmt(FL.round(F * d, 1))} J`;
  }
  function paintTrue() {
    const t = trueReadings(), h = document.querySelector('.sim h2');
    let el = $('trueRead');
    if (!t) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('span'); el.id = 'trueRead'; el.className = 'true-read'; h.insertBefore(el, $('status')); }
    el.textContent = t;
  }
  function setupTeacher() {
    if (!isTeacher()) return;
    $('teachWrap').hidden = false;
    $('btnMonitor').hidden = false;
    $('btnTeach').addEventListener('click', () => { $('teachPanel').hidden = !$('teachPanel').hidden; });
    document.addEventListener('pointerdown', e => { if (!$('teachWrap').contains(e.target)) $('teachPanel').hidden = true; });
    $('tShow').addEventListener('change', paintTrue);
    $('tView').addEventListener('change', e => { viewTier = e.target.value || null; drawScene(); });
    ['tFill', 'tQuestions', 'tReset'].forEach(id => $(id).addEventListener('click', () => { $('teachPanel').hidden = true; }));
    $('tFill').addEventListener('click', () => {
      const plan = [{ mach: 'pulley', n: 1 }, { mach: 'pulley', n: 2 }, { mach: 'pulley', n: 4 }, { mach: 'ramp', L: 3 }, { mach: 'ramp', L: 6 }, { mach: 'ramp', L: 2 }];
      st.rows = plan.map(mc => { const d = FL.ropeDist(st.rig, mc), F = FL.round(FL.forceNeed(st.rig, mc), 1); return { mach: mc.mach, set: mc.mach === 'pulley' ? mc.n : mc.L, d, F, W: FL.round(F * d, 1), work: null }; });
      save(true); paintRows(); paintRec(); paintCharts(); paintAsk();
    });
    $('tQuestions').addEventListener('click', () => {
      if (!ready()) $('tFill').click();
      pairQ(); spreadQ(); ['double', 'same', 'ma', 'claim'].forEach(id => { st.ask[id] = Object.assign(st.ask[id] || {}, { ok: true }); });
      save(true); paintAsk(); openThink();
    });
    $('tReset').addEventListener('click', () => {
      if (!window.confirm('Start over? This clears your own copy only.')) return;
      const keep = st.rig; Object.keys(st).forEach(k => delete st[k]); Object.assign(st, newState(), { rig: keep });
      paintSetup(); resetLift(); paintRows(); paintCharts(); paintAsk(); save(true);
    });
  }

  // ---------- Header tools ----------
  function bindTools() {
    const root = document.documentElement, store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* blocked */ } };
    const show = () => { $('btn-theme-toggle').textContent = root.classList.contains('theme-dark') ? '☀️' : '🌙'; $('btnBig').classList.toggle('on', root.classList.contains('big')); };
    $('btn-theme-toggle').addEventListener('click', () => { root.classList.toggle('theme-dark'); store('tol_theme', root.classList.contains('theme-dark') ? 'dark' : 'light'); show(); drawScene(); if (desmos && desmos.updateSettings) desmos.updateSettings({ invertedColors: root.classList.contains('theme-dark') }); });
    // Full screen: the button, plus a banner whenever the lab is not full screen. ✕ hides the banner until the next visit.
    const isFull = () => !!document.fullscreenElement || (window.innerHeight >= screen.height - 2);
    const goFull = () => { const el = document.documentElement; if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); };
    let fsDismissed = false;
    const fsPaint = () => { $('fsBanner').hidden = fsDismissed || isFull(); $('btnFull').textContent = document.fullscreenElement ? '⛶ Exit full screen' : '⛶ Full screen'; };
    $('btnFull').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else goFull(); });
    $('btnFsBanner').addEventListener('click', goFull);
    $('btnFsClose').addEventListener('click', () => { fsDismissed = true; fsPaint(); });
    document.addEventListener('fullscreenchange', fsPaint);
    window.addEventListener('resize', fsPaint);
    fsPaint();
    $('btnBig').addEventListener('click', () => { root.classList.toggle('big'); store('tol_big', root.classList.contains('big') ? 'on' : 'off'); show(); });
    show();
  }

  function start(s, c, prof) {
    st = s; cloud = c; profile = prof;
    if (!st.rig) st.rig = FL.newRig('cp');
    if (st.setup.L > 6) st.setup.L = 6;
    bindSetup(); bindTools(); setupCalc(); setupTeacher();
    $('btnDoneClose').addEventListener('click', () => { $('doneModal').hidden = true; });
    $('btnCertChip').addEventListener('click', e => downloadCert(e.currentTarget));
    $('btnThinkBack').addEventListener('click', closeThink);
    // The simulation, full screen: click it to open. It stays live, so P still pulls. ✕, Esc or a click outside closes it.
    const simFull = on => {
      document.querySelector('.sim').classList.toggle('sim-full', on);
      $('simBackdrop').hidden = !on; $('btnSimClose').hidden = !on;
    };
    $('stage').addEventListener('click', () => { if (!document.querySelector('.sim').classList.contains('sim-full')) simFull(true); });
    $('btnSimClose').addEventListener('click', () => simFull(false));
    $('simBackdrop').addEventListener('click', () => simFull(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.querySelector('.sim').classList.contains('sim-full')) simFull(false); });
    $('stage').title = 'Click to see it full screen';
    bindCharts();
    ready.__was = ready();
    paintSetup(); drawScene(); paintRows(); paintRec(); paintAsk(); paintCharts(); paintScore(); checkFinished();
    requestAnimationFrame(frame);
  }

  window.TradeoffLab = { start, newState, validState, scoreState, debug: () => ({ st, sim, tap, machine }) };
})();
