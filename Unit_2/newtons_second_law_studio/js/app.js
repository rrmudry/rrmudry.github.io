// Newton's 2nd Law Studio — Master controller
// Guided one-task-at-a-time engine (wrong answer → new scenario), simulation controls,
// trial recording, force diagrams, graph, theme / text size / audio, and the animation loop.

(function () {
  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const sfx = window.soundFx;
  const LESSONS = window.LESSONS;
  const near = window.LessonUtil.near;
  const STEPS = ['step1', 'step2', 'step3'];

  const physics = new AtwoodPhysics();
  const sim = new AtwoodCanvas($('simCanvas'), physics);
  const fbd = new ForceDiagrams($('fbdPicture'), $('fbdFree'), physics);
  const graph = new Graph($('graph'));

  // Bring a card into view when a new question appears (students may not think to scroll).
  // scroll-margin-top in the CSS keeps it clear of the sticky header.
  window.revealCard = el => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const headerBottom = document.querySelector('.app-header').getBoundingClientRect().bottom;
    if (r.top < headerBottom + 8 || r.top > window.innerHeight * 0.55) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const shuffle = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(p => p[1]);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- Persistent state ----------
  // The whole state object is saved by js/auth.js: Firestore for signed-in students,
  // this device only for guests. Bump STATE_VERSION when the lesson structure changes.
  const STATE_VERSION = 4;
  function newState() {
    const st = {
      v: STATE_VERSION,
      tab: 'step1',
      progress: {},
      trials: { step2: [], step3: [] },
      configs: { step1: null, step2: null, step3: null, arena: { mL: 100, cargo: 200, mR: 100 } },
      optIn: {},            // optional Honors parts a standard-class student chose to try
      honorsDoneSteps: {},  // steps whose ⭐ Honors section was completed
      arena: null,          // saved Mastery Arena session (values + tier results)
      arenaBest: 0,         // best number of arena tiers correct
      bestPoints: 0,        // best gradebook points ever (never lowered)
      certCode: null,
      savedAt: 0
    };
    STEPS.forEach(k => { st.progress[k] = { round: 0, task: 0, s: null, status: 'ask', fb: '', order: null, notice: '', done: false }; });
    return st;
  }
  const validState = st => !!(st && st.v === STATE_VERSION && st.progress && st.trials);
  let state = null;
  let cloud = null;
  let profile = { guest: true, honorsRequired: false };

  function save() {
    if (!state) return;
    state.arena = arena.exportState();
    state.arenaBest = Math.max(state.arenaBest || 0, arena.finished ? arena.score : 0);
    scoreState(state);
    if (cloud) cloud.queueSave();
  }

  // Gradebook: 2 pts per finished step + 0.8 pts per Mastery Arena tier (best ever) = 10 pts
  function scoreState(st) {
    const stepsDone = STEPS.filter(k => st.progress[k] && st.progress[k].done).length;
    const arenaBest = st.arenaBest || 0;
    const now = Math.round((2 * stepsDone + 0.8 * arenaBest) * 10) / 10;
    st.bestPoints = Math.max(st.bestPoints || 0, now);
    const honorsDone = Object.keys(st.honorsDoneSteps || {}).filter(k => st.honorsDoneSteps[k]);
    return { stepsDone, arenaBest, honorsDone, points: st.bestPoints, percentage: Math.round(st.bestPoints * 10) };
  }

  let tab = 'step1';
  let speed = 1;
  let tokenSize = 20;
  let transientUntil = 0;
  let arenaPending = null;
  let graphsDirty = true;
  const graphMode = { step2: 'F', step3: 'M', arena: 'v' };
  let doneTimer = null;
  let stripHide = false;     // hide values in the photogate strip ('speed' or true)
  let desmos = null;         // embedded Desmos scientific calculator (created on first use)
  let calcHost = null;

  // ---------- Lesson engine ----------
  const pr = st => state.progress[st];
  const lesson = st => LESSONS[st];
  const roundDef = st => lesson(st).rounds[pr(st).round];
  const honorsActive = st => profile.honorsRequired || !!(state.optIn && state.optIn[st]);
  // Honors rounds run only for Honors periods or students who opted in; the opt-in question
  // itself shows only to students who haven't decided yet.
  function roundActive(st, i) {
    const r = lesson(st).rounds[i];
    if (!r) return false;
    if (r.honorsGate) return !profile.honorsRequired && !(state.optIn && st in state.optIn);
    if (r.honors) return honorsActive(st);
    return true;
  }
  const activeRounds = st => lesson(st).rounds.map((_, i) => i).filter(i => roundActive(st, i));
  function finishStep(st) {
    const p = pr(st);
    p.done = true;
    if (honorsActive(st)) { state.honorsDoneSteps = state.honorsDoneSteps || {}; state.honorsDoneSteps[st] = true; }
    sfx.playChime();
    save();
    updateTabChecks();
    renderAll();
  }
  // Move forward past rounds that don't apply to this student
  function skipInactive(st) {
    const p = pr(st);
    const n = lesson(st).rounds.length;
    while (p.round < n && !roundActive(st, p.round)) p.round++;
    return p.round < n;
  }
  const taskDef = st => {
    const p = pr(st);
    if (p.done) return null;
    const r = roundDef(st);
    return r ? r.tasks[p.task] : null;
  };

  function ctxFor(st) {
    const trials = state.trials[st] || [];
    return {
      s: pr(st).s || {},
      p: physics,
      trials,
      graphMode: graphMode[st],
      pickTrial: i => {
        const usable = trials.filter(t => t.F > 0 && t.a > 0);
        return usable.length ? usable[i % usable.length] : { F: 0.4, a: 0.8 };
      }
    };
  }

  // A round = one scenario + its tasks. A wrong answer calls this again with fresh values.
  function startRound(st, isPenalty) {
    const p = pr(st);
    const r = roundDef(st);
    const old = JSON.stringify(p.s);
    p.s = r.scenario ? r.scenario() : {};
    // A penalty must always bring DIFFERENT numbers
    for (let i = 0; isPenalty && r.scenario && JSON.stringify(p.s) === old && i < 30; i++) p.s = r.scenario();
    p.task = 0;
    p.notice = isPenalty ? '🔄 <strong>New values!</strong> The numbers changed. Read carefully and try this part again.' : '';
    if (r.setup && !r.keepSim) {
      state.configs[st] = r.setup(p.s);
      if (tab === st) applyConfig();
    }
    enterTask(st);
  }

  function enterTask(st) {
    const p = pr(st);
    const t = taskDef(st);
    p.status = 'ask';
    p.fb = '';
    p.picked = null;
    p.lastInput = '';
    p.hintsShown = 0;
    if (desmos && desmos.setBlank) desmos.setBlank();
    p.order = t && t.type === 'mc' ? shuffle(t.options(ctxFor(st)).map((_, i) => i)) : null;
    save();
    if (tab === st) { renderAll(); window.revealCard($('taskCard')); }
  }

  function advance(st) {
    const p = pr(st);
    p.notice = '';
    p.task++;
    if (p.task >= roundDef(st).tasks.length) {
      p.round++;
      if (!skipInactive(st)) { finishStep(st); return; }
      startRound(st, false);
      return;
    }
    enterTask(st);
  }

  function restartStep(st) {
    Object.assign(pr(st), { round: 0, task: 0, done: false, notice: '' });
    if (state.trials[st]) state.trials[st] = [];
    skipInactive(st);
    startRound(st, false);
    updateTabChecks();
  }

  function markCorrect(st, explain) {
    const p = pr(st);
    const t = taskDef(st);
    p.status = 'correct';
    p.fb = explain || '✓ Correct!';
    sfx.playChime();
    if (t.onCorrect) t.onCorrect(api);
    save();
    renderAll();
  }

  function markWrong(st, why) {
    const p = pr(st);
    p.status = 'wrong';
    p.fb = why;
    sfx.playBuzzer();
    save();
    renderAll();
  }

  function submitNum(raw) {
    const st = tab;
    const t = taskDef(st);
    if (!t || t.type !== 'num' || pr(st).status !== 'ask') return;
    const v = parseFloat(String(raw).replace(',', '.').replace(/[−–]/g, '-'));
    if (!isFinite(v)) { flashTask('Type a number first.'); return; }
    pr(st).lastInput = String(raw);
    const ctx = ctxFor(st);
    if (near(v, t.answer(ctx), t.tol)) {
      markCorrect(st, '✓ ' + (t.explain ? t.explain(ctx) : 'Correct!'));
    } else {
      const d = t.diagnose ? t.diagnose(v, ctx) : null;
      markWrong(st, `✗ ${d || 'Not quite.'}${t.hints ? ' Next time, try the 💡 hints.' : ''}`);
    }
  }

  function submitMC(idx) {
    const st = tab;
    const t = taskDef(st);
    if (!t || t.type !== 'mc' || pr(st).status !== 'ask') return;
    const opt = t.options(ctxFor(st))[idx];
    pr(st).picked = idx;
    if (opt.ok) markCorrect(st, '✓ ' + opt.why);
    else markWrong(st, '✗ ' + opt.why);
  }

  function flashTask(msg) {
    const el = document.querySelector('#taskCard .task-flash');
    if (el) el.textContent = msg;
    sfx.playBuzzer();
  }

  // Polled every frame: completes 'do' tasks once their condition is met
  function checkDoTask() {
    if (!STEPS.includes(tab)) return;
    const p = pr(tab);
    const t = taskDef(tab);
    if (!t || t.type !== 'do' || p.status !== 'ask') return;
    const ctx = ctxFor(tab);
    const failMsg = t.fail ? t.fail(ctx) : null;
    if (failMsg) { markWrong(tab, '✗ ' + failMsg); return; }
    if (!t.until(ctx)) return;
    if (t.capture) t.capture(ctx);
    if (t.onDone) t.onDone(api);
    p.status = 'correct';
    p.fb = t.doneText ? t.doneText(ctx) : '✓ Done!';
    sfx.playChime();
    save();
    renderAll();
    const st = tab;
    clearTimeout(doneTimer);
    doneTimer = setTimeout(() => { if (tab === st && pr(st).status === 'correct' && taskDef(st) === t) advance(st); }, t.doneText ? 2600 : 1100);
  }

  // ---------- Rendering: task card ----------
  function renderTask() {
    const card = $('taskCard');
    if (!STEPS.includes(tab)) return;
    const L = lesson(tab);
    const p = pr(tab);
    const ctx = ctxFor(tab);

    if (p.done) {
      const next = STEPS[STEPS.indexOf(tab) + 1] || 'arena';
      card.innerHTML = subHTML(`
        <span class="step-badge">${L.badge}</span>
        <h2>${L.title} <span class="done-mark">✓ Complete</span></h2>
        <div class="takeaway"><strong>Takeaway:</strong> ${L.takeaway}</div>
        <div class="task-actions">
          <button class="btn-primary" data-go="${next}">${next === 'arena' ? 'Go to the Mastery Arena 🏆' : 'Next step →'}</button>
          <button class="btn-link" data-restart>↺ Redo this step</button>
        </div>`);
      return;
    }

    const r = roundDef(tab);
    const t = taskDef(tab);
    const dots = r.tasks.map((_, i) => `<span class="dot ${i < p.task ? 'done' : i === p.task ? 'now' : ''}"></span>`).join('');
    let body = '';
    if (t.type === 'num') {
      const locked = p.status !== 'ask';
      body = `<div class="answer-row">
          <input id="taskInput" type="number" inputmode="decimal" step="any" placeholder="your answer" ${locked ? 'disabled' : ''} value="${locked ? esc(p.lastInput || '') : ''}">
          <span class="unit">${t.unit}</span>
          <button class="btn-primary" data-check ${locked ? 'disabled' : ''}>Check</button>
        </div>`;
    } else if (t.type === 'mc') {
      const opts = t.options(ctx);
      body = `<div class="mc-options">${(p.order || opts.map((_, i) => i)).map(i => {
        const o = opts[i];
        let cls = '';
        if (p.status !== 'ask') cls = p.picked === i ? (o.ok ? 'right' : 'wrong') : (o.ok && p.status === 'correct' ? 'right' : 'dim');
        return `<button class="mc-btn ${cls}" data-mc="${i}" ${p.status !== 'ask' ? 'disabled' : ''}>${o.t}</button>`;
      }).join('')}</div>`;
    } else if (t.type === 'do') {
      body = p.status === 'ask' ? `<p class="waiting">⏳ ${t.waiting || 'Waiting…'}</p>` : '';
    } else if (t.type === 'optin') {
      body = `<div class="task-actions">
          <button class="btn-primary" data-optin="yes">⭐ Yes, I'll try it</button>
          <button class="btn-secondary" data-optin="no">No thanks, finish ${t.stepName || 'this step'}</button>
        </div>`;
    }

    let fb = '';
    if (p.status === 'correct' && t.type !== 'do') {
      fb = `<div class="feedback good">${p.fb}</div><div class="task-actions"><button class="btn-primary" data-continue>Continue →</button></div>`;
    } else if (p.status === 'correct') {
      fb = `<div class="feedback good">${p.fb}</div>`;
    } else if (p.status === 'wrong') {
      fb = `<div class="feedback bad">${p.fb}</div><div class="task-actions"><button class="btn-accent" data-newvals>🔄 Get new values and try again</button></div>`;
    } else if (t.type === 'info') {
      fb = `<div class="task-actions"><button class="btn-primary" data-continue>Got it →</button></div>`;
    }

    card.innerHTML = subHTML(`
      <div class="task-top">
        <span class="step-badge">${L.badge}</span>
        <span class="part-label">Part ${activeRounds(tab).indexOf(p.round) + 1} of ${activeRounds(tab).length}: ${r.title}${r.honors ? ' <span class="honors-chip">⭐ Honors</span>' : ''}</span>
        <button class="btn-read" data-read title="Read this task out loud">🔊 Read to me</button>
      </div>
      <div class="dots" aria-label="Progress in this part">${dots}</div>
      ${p.notice ? `<div class="notice">${p.notice}</div>` : ''}
      <div class="prompt">${t.text(ctx)}</div>
      ${hintsHTML(t, p, ctx)}
      ${body}
      ${t.calc && p.status === 'ask' ? '<div class="calc-slot" id="calcSlot"></div>' : ''}
      <p class="task-flash" aria-live="assertive"></p>
      ${fb}
      <div class="task-foot"><button class="btn-link" data-restart>↺ Restart this step</button></div>`);

    mountCalculator($('taskCard'));
    const input = $('taskInput');
    if (input && p.status === 'ask' && !t.calc) input.focus({ preventScroll: true });
  }

  // Hints are revealed one at a time and never cost anything
  function hintsHTML(t, p, ctx) {
    if (!t.hints || t.type !== 'num') return '';
    const all = t.hints(ctx);
    const shown = Math.min(p.hintsShown || 0, all.length);
    const list = all.slice(0, shown).map((h, i) => `<li><strong>Hint ${i + 1}:</strong> ${h}</li>`).join('');
    const more = shown < all.length && p.status === 'ask'
      ? `<button class="btn-hint" data-hint>💡 ${shown ? 'Next hint' : 'Show a hint'} (${all.length - shown} left)</button>` : '';
    return `<div class="hints">${list ? `<ol class="hint-list">${list}</ol>` : ''}${more}</div>`;
  }

  // One Desmos instance, moved into whichever calculation task is showing (keeps its state)
  let calcKey = null;
  function mountCalculator(scope, key) {
    const slot = (scope || document).querySelector('#calcSlot');
    if (!slot) return;
    // A different question gets a cleared calculator
    if (key !== undefined && key !== calcKey) { calcKey = key; if (desmos && desmos.setBlank) desmos.setBlank(); }
    if (!window.Desmos) {
      slot.innerHTML = '<p class="calc-missing">The calculator did not load (no internet?). Use your own calculator.</p>';
      return;
    }
    if (!calcHost) {
      calcHost = document.createElement('div');
      calcHost.className = 'calc-host';
      slot.appendChild(calcHost);
      try {
        desmos = Desmos.ScientificCalculator(calcHost, {
          invertedColors: !root.classList.contains('theme-light'),
          fontSize: Desmos.FontSizes ? Desmos.FontSizes.LARGE : undefined
        });
      } catch (e) {
        slot.innerHTML = '<p class="calc-missing">The calculator did not load. Use your own calculator.</p>';
        calcHost = null;
        return;
      }
    } else {
      slot.appendChild(calcHost);
      if (desmos && desmos.resize) desmos.resize();
    }
  }

  // Read the task aloud, saying units and symbols as words
  function speakTask() {
    if (!('speechSynthesis' in window)) { setStatus('Read-aloud is not available in this browser.'); return; }
    const t = taskDef(tab);
    if (!t) return;
    const ctx = ctxFor(tab);
    let text = t.text(ctx);
    if (t.type === 'mc') text += ' ' + t.options(ctx).map((o, i) => `Choice ${i + 1}: ${o.t}`).join(' ');
    const fb = pr(tab).fb;
    if (pr(tab).status !== 'ask' && fb) text += ' ' + fb;
    text = text.replace(/<[^>]+>/g, ' ')
      .replace(/m\/s²/g, ' meters per second squared')
      .replace(/m\/s/g, ' meters per second')
      .replace(/(\d)\s*ms\b/g, '$1 milliseconds')
      .replace(/(\d)\s*cm\b/g, '$1 centimeters')
      .replace(/(\d)\s*kg\b/g, '$1 kilograms')
      .replace(/(\d)\s*g\b/g, '$1 grams')
      .replace(/(\d)\s*N\b/g, '$1 newtons')
      .replace(/(\d)\s*m\b/g, '$1 meters')
      .replace(/(\d)\s*s\b/g, '$1 seconds')
      .replace(/\(N\)/g, '')
      .replace(/\b([FMmTva])_(net|total|cart|hand|L|R|A|B|N|g)\b/g, '$1 $2')
      .replace(/÷/g, ' divided by ').replace(/−/g, ' minus ').replace(/×/g, ' times ')
      .replace(/→/g, ', so ').replace(/[•⭐📏✓✗🔄]/g, ' ').replace(/\s+/g, ' ');
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  $('taskCard').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.hasAttribute('data-hint')) { pr(tab).hintsShown = (pr(tab).hintsShown || 0) + 1; sfx.playClick(); save(); renderTask(); return; }
    if (b.hasAttribute('data-read')) { speakTask(); return; }
    if (b.dataset.optin) {
      state.optIn = state.optIn || {};
      state.optIn[tab] = b.dataset.optin === 'yes';
      sfx.playClick();
      advance(tab);
      return;
    }
    if (b.hasAttribute('data-check')) submitNum($('taskInput').value);
    else if (b.dataset.mc !== undefined) submitMC(+b.dataset.mc);
    else if (b.hasAttribute('data-continue')) { sfx.playClick(); advance(tab); }
    else if (b.hasAttribute('data-newvals')) { sfx.playClack(); startRound(tab, true); }
    else if (b.hasAttribute('data-restart')) {
      if (confirm('Start this step over from the beginning? Your data for this step will be cleared.')) { sfx.playClick(); restartStep(tab); }
    } else if (b.dataset.go) { sfx.playClick(); switchTab(b.dataset.go); }
  });
  $('taskCard').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'taskInput') submitNum(e.target.value);
  });

  // ---------- Rendering: controls (only what the current task needs) ----------
  function btn(action, label, cls) {
    return `<button class="${cls || 'btn-secondary'}" data-action="${action}">${label}</button>`;
  }

  function renderControls() {
    const el = $('stepControls');
    let run = [], controls = null;
    if (tab === 'arena') {
      run = ['reset'];
    } else {
      const t = taskDef(tab);
      if (t && pr(tab).status !== 'wrong') { run = t.run || []; controls = t.controls || null; }
    }
    // Release / Nudge / Reset sit in the simulation toolbar; weight controls get their own card
    const labels = {
      release: btn('release', '▶ Release', 'btn-primary'),
      nudge: btn('nudge', (tab !== 'arena' && taskDef(tab) && taskDef(tab).nudgeV) ? '👉 Big Nudge' : '👉 Nudge', 'btn-accent'),
      reset: btn('reset', tab === 'arena' ? '⟲ Reset Track' : '⟲ Reset'),
      record: btn('record', '📋 Record Trial', 'btn-record')
    };
    $('runBar').innerHTML = run.map(r => labels[r]).join('');
    if (!controls) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;

    let html = '';
    if (controls === 'transfer') {
      const sizes = [10, 20, 50].map(s => btn(`token:${s}`, `${s} g`, tokenSize === s ? 'chip active' : 'chip')).join('');
      html += `
        <div class="lock-badge">🔒 M_total locked at <strong>${physics.mTotal} g</strong></div>
        <div class="ctrl-group"><span class="ctrl-label">Token size</span><div class="ctrl-row">${sizes}</div></div>
        <div class="ctrl-group"><span class="ctrl-label">Move one ${tokenSize} g token</span>
          <div class="transfer-grid">
            ${btn('transfer:L-R', 'Left ➜ Right')}${btn('transfer:C-R', 'Cart ➜ Right')}${btn('transfer:R-L', 'Right ➜ Left')}
            ${btn('transfer:C-L', 'Cart ➜ Left')}${btn('transfer:L-C', 'Left ➜ Cart')}${btn('transfer:R-C', 'Right ➜ Cart')}
          </div></div>`;
    } else if (controls === 'left') {
      html += `
        <div class="ctrl-group"><span class="ctrl-label">Weight on the LEFT string: ${physics.mL} g</span>
          <div class="ctrl-row">${btn('left:10', '+10 g', 'chip')}${btn('left:20', '+20 g', 'chip')}${btn('left:50', '+50 g', 'chip')}${btn('left:100', '+100 g', 'chip')}</div>
          <div class="ctrl-row">${btn('left:-10', '−10 g', 'chip')}${btn('left:-50', '−50 g', 'chip')}${btn('leftclear', 'Remove all', 'chip')}</div></div>`;
    } else if (controls === 'cargo') {
      html += `
        <div class="lock-badge">🔒 F_net locked at <strong>0.50 N</strong> (the right hanger is always 50 g heavier)</div>
        <div class="ctrl-group"><span class="ctrl-label">Load cargo into the cart</span>
          <div class="ctrl-row">${btn('cargo:50', '+50 g', 'chip')}${btn('cargo:100', '+100 g', 'chip')}${btn('cargo:200', '+200 g', 'chip')}${btn('cargo:500', '+500 g', 'chip')}${btn('unload', 'Unload all', 'chip')}</div></div>
        <div class="ctrl-group"><span class="ctrl-label">Equal pairs on both hangers</span>
          <div class="ctrl-row">${btn('pair:10', '+10 g each', 'chip')}${btn('pair:50', '+50 g each', 'chip')}${btn('pair:-10', '−10 g each', 'chip')}</div></div>`;
    }
    el.innerHTML = subHTML(html);
  }

  function handleAction(action) {
    const [name, arg] = action.split(':');
    let res = { ok: true };
    switch (name) {
      case 'release':
        if (physics.phase === 'stopped' || physics.timeUp) { setStatus('Press ⟲ Reset to bring the cart back to the start line.'); sfx.playBuzzer(); return; }
        if (physics.phase === 'running') return;
        physics.release(); sfx.playClick();
        return;
      case 'nudge':
        if (physics.phase === 'stopped' || physics.timeUp) physics.reset();
        physics.nudge((taskDef(tab) && taskDef(tab).nudgeV) || 0.25); sfx.playNudge();
        return;
      case 'reset':
        cancelArenaRun(); physics.reset(); sfx.playClick(); graphsDirty = true;
        return;
      case 'token': tokenSize = +arg; sfx.playClick(); renderControls(); return;
      case 'transfer': { const [from, to] = arg.split('-'); res = physics.transferToken(from, to, tokenSize); break; }
      case 'left': res = physics.addLeft(+arg); break;
      case 'leftclear': res = physics.addLeft(-physics.mL); break;
      case 'cargo': res = physics.addCargo(+arg); break;
      case 'unload': res = physics.addCargo(-physics.cargo); break;
      case 'pair': res = physics.addPair(+arg); break;
      case 'record': recordTrial(false); return;
    }
    if (!res.ok) { setStatus('⚠️ ' + res.reason); sfx.playBuzzer(); }
    else sfx.playClack();
    saveConfig();
    renderControls();
  }

  [$('stepControls'), $('runBar')].forEach(el => el.addEventListener('click', e => {
    const b = e.target.closest('[data-action]');
    if (b) handleAction(b.dataset.action);
  }));

  // ---------- Trials ----------
  function recordTrial(silent) {
    if (tab !== 'step2' && tab !== 'step3') return false;
    const gA = physics.gates.A, gB = physics.gates.B;
    if (physics.phase === 'held') {
      if (!silent) { setStatus('Press ▶ Release first, then record after the run.'); sfx.playBuzzer(); }
      return false;
    }
    if (gA.speed === null || gB.speed === null) {
      if (!silent) {
        setStatus(physics.deltaM < 0 ? 'The cart rolled LEFT, away from the photogates. Put more mass on the RIGHT hanger.'
          : 'Wait until the cart passes through BOTH photogates, then record.');
        sfx.playBuzzer();
      }
      return false;
    }
    const list = state.trials[tab];
    const trial = {
      mL: physics.mL, cart: physics.mCart, mR: physics.mR,
      M: physics.mTotal / 1000, F: physics.deltaM / 1000 * NSL.G,
      vA: gA.speed, vB: gB.speed, a: physics.measuredAcceleration()
    };
    const dup = list.findIndex(t => t.mL === trial.mL && t.cart === trial.cart && t.mR === trial.mR);
    if (dup >= 0) list.splice(dup, 1);
    list.push(trial);
    list.sort((p, q) => tab === 'step2' ? p.F - q.F : p.M - q.M);
    if (!silent) {
      sfx.playClack();
      setStatus(dup >= 0 ? '📋 Trial replaced (same masses as before).' : `📋 Trial recorded: a = ${trial.a.toFixed(3)} m/s².`);
    }
    save();
    renderTrials();
    graphsDirty = true;
    const t = taskDef(tab);
    if (t && t.type === 'do' && pr(tab).status === 'ask') renderTask(); // refresh the x/4 counter
    return true;
  }

  function renderTrials() {
    const card = $('trialsCard');
    const list = state.trials[tab];
    if (!list || !list.length) { card.hidden = true; return; }
    card.hidden = false;
    $('trialsTitle').innerHTML = subHTML(tab === 'step2' ? 'Trial Data · M_total locked at 0.500 kg' : 'Trial Data · F_net locked at 0.50 N');
    $('trialsBody').innerHTML = list.map((t, i) => `
      <tr>
        <td>${i + 1}</td><td>${t.mL}</td><td>${t.cart}</td><td>${t.mR}</td>
        <td>${t.M.toFixed(3)}</td><td>${t.F.toFixed(2)}</td>
        <td>${t.vA.toFixed(3)}</td><td>${t.vB.toFixed(3)}</td><td><strong>${t.a.toFixed(3)}</strong></td>
      </tr>`).join('');
  }

  // ---------- Graph (one canvas; modes depend on the step) ----------
  const GRAPH_MODES = {
    step2: [['F', 'a vs F_net'], ['v', 'v vs t']],
    step3: [['M', 'a vs M_total'], ['inv', 'a vs 1/M_total'], ['v', 'v vs t']],
    arena: [['v', 'v vs t']]
  };

  function graphVisible() {
    if (tab === 'arena' || tab === 'step1') return false;
    return pr(tab).done || !!roundDef(tab).graph;
  }

  function renderGraphCard() {
    const card = $('graphCard');
    card.hidden = !graphVisible();
    if (card.hidden) return;
    const modes = GRAPH_MODES[tab];
    $('graphSeg').innerHTML = subHTML(modes.map(([k, label]) =>
      `<button class="seg-btn ${graphMode[tab] === k ? 'active' : ''}" data-gmode="${k}">${label}</button>`).join(''));
    $('graphSeg').hidden = modes.length < 2;
    requestAnimationFrame(() => { graph.resize(); drawGraph(); });
  }

  $('graphSeg').addEventListener('click', e => {
    const b = e.target.closest('[data-gmode]');
    if (!b) return;
    graphMode[tab] = b.dataset.gmode;
    sfx.playClick();
    renderGraphCard();
  });

  function sampleHistory(fn) {
    const h = physics.history;
    const stride = Math.max(1, Math.floor(h.length / 400));
    const out = [];
    for (let i = 0; i < h.length; i += stride) out.push(fn(h[i]));
    if (h.length) out.push(fn(h[h.length - 1]));
    return out;
  }

  function drawGraph() {
    if (!state || $('graphCard').hidden) return;
    const P = graph.palette || (graph.refreshPalette(), graph.palette);
    const mode = graphMode[tab];
    let title = '', noteText = '';
    if (mode === 'v') {
      title = 'v vs t (current run)';
      const pts = sampleHistory(s => ({ x: s.t, y: s.v }));
      graph.draw({ xLabel: 't (s)', yLabel: 'v (m/s)', xMin: 0, xMax: Math.max(2, physics.t * 1.08),
        yMin: Math.min(0, ...pts.map(p => p.y)) * 1.15, yMax: Math.max(0.5, ...pts.map(p => p.y)) * 1.15,
        series: [{ points: pts, color: P.cyan, line: true }] });
      noteText = 'A straight, rising line means the speed grows by the same amount every second: constant acceleration.';
    } else if (tab === 'step2') {
      title = 'a vs F_net';
      const pts = state.trials.step2.map(t => ({ x: t.F, y: t.a }));
      const slope = pts.filter(p => p.x > 0).length >= 2 ? Fits.throughOrigin(pts) : null;
      graph.draw({ xLabel: 'F_net (N)', yLabel: 'a (m/s²)', xMin: 0, xMax: Math.max(0.5, ...pts.map(p => p.x)) * 1.15,
        yMin: 0, yMax: Math.max(1, ...pts.map(p => p.y)) * 1.15,
        series: [{ points: pts, color: P.amber, dots: true }],
        curve: slope ? { fn: x => slope * x, color: P.violet, label: `best fit: slope = ${slope.toFixed(2)}` } : null,
        emptyMessage: 'Record trials to plot a vs F_net' });
      noteText = slope ? `Slope = ${slope.toFixed(2)} (m/s²)/N, which equals 1 ÷ M_total = 1 ÷ 0.500 kg = 2.00.` : 'Record at least 2 trials to see the best-fit line.';
    } else {
      const inv = mode === 'inv';
      title = inv ? 'a vs 1/M_total' : 'a vs M_total';
      const raw = state.trials.step3.map(t => ({ x: t.M, y: t.a }));
      const k = raw.length >= 2 ? Fits.inverse(raw) : null;
      const pts = inv ? raw.map(p => ({ x: 1 / p.x, y: p.y })) : raw;
      graph.draw({ xLabel: inv ? '1 / M_total (1/kg)' : 'M_total (kg)', yLabel: 'a (m/s²)', xMin: 0,
        xMax: Math.max(inv ? 4 : 1, ...pts.map(p => p.x)) * 1.12, yMin: 0, yMax: Math.max(1, ...pts.map(p => p.y)) * 1.15,
        series: [{ points: pts, color: P.amber, dots: true }],
        curve: k ? (inv ? { fn: x => k * x, color: P.violet, label: `best fit: slope = ${k.toFixed(2)}` }
          : { fn: x => (x > 0.02 ? k / x : NaN), color: P.violet, label: `best fit: a = ${k.toFixed(2)} / M_total` }) : null,
        emptyMessage: 'Record trials to plot' });
      noteText = !k ? 'Record at least 2 trials to see the best-fit curve.'
        : inv ? `Slope = ${k.toFixed(2)} N, which equals F_net = 0.50 N.` : 'A curve that drops off: more mass, less acceleration.';
    }
    $('graphTitle').innerHTML = subHTML('Graph · ' + title);
    $('graphNote').innerHTML = subHTML(noteText);
  }

  // ---------- Photogate strip + status ----------
  function updateStrip() {
    const A = physics.gates.A, B = physics.gates.B;
    const hideSpeed = stripHide === true || (Array.isArray(stripHide) && stripHide.includes('speed'));
    const gate = g => {
      if (g.speed === null) return g.blocked ? 'timing…' : '--';
      const v = hideSpeed ? '? m/s' : `${g.speed.toFixed(3)} m/s`;
      return `<span class="ms-sub">blocked ${(g.blockTime * 1000).toFixed(1)} ms</span>${v}`;
    };
    const a = gate(A), b = gate(B);
    if ($('msA').innerHTML !== a) $('msA').innerHTML = a;
    if ($('msB').innerHTML !== b) $('msB').innerHTML = b;
    $('msDT').textContent = (A.tMid !== null && B.tMid !== null) ? `${(B.tMid - A.tMid).toFixed(3)} s` : '--';
  }

  function setStatus(text, ms) {
    $('simStatus').innerHTML = subHTML(text);
    transientUntil = performance.now() + (ms || 3500);
  }

  // Neutral wording on purpose: the status line never gives away an answer
  function autoStatus() {
    if (performance.now() < transientUntil) return;
    const p = physics;
    let msg;
    if (p.phase === 'held') msg = 'Cart held at the start line (x = 0.30 m).';
    else if (p.timeUp) msg = `Clock paused at ${Math.round(p.t)} s. Press ⟲ Reset to run again.`;
    else if (p.phase === 'running') msg = p.v === 0 ? 'Released. The clock is running: watch the cart.' : `Rolling ${p.v > 0 ? 'right' : 'left'}…`;
    else msg = `Stopped at the ${p.stopSide} bumper.`;
    $('simStatus').textContent = msg;
  }

  // ---------- Config / tabs ----------
  function saveConfig() {
    state.configs[tab] = { mL: physics.mL, cargo: physics.cargo, mR: physics.mR };
    graphsDirty = true;
    save();
  }

  function applyConfig() {
    const c = state.configs[tab];
    if (c) physics.setMasses(c.mL, c.cargo, c.mR);
    else physics.reset();
    graphsDirty = true;
  }

  function cancelArenaRun() {
    if (arenaPending) { arenaPending = null; arena._busy = false; arena.render(); }
  }

  function updateTabChecks() {
    STEPS.forEach((st, i) => { $('tabCheck' + (i + 1)).textContent = pr(st).done ? '✓' : ''; });
    $('tabCheck4').textContent = arena.certificateReady ? '✓' : '';
  }

  function renderAll() {
    const isArena = tab === 'arena';
    $('taskCard').hidden = isArena;
    $('arenaCard').hidden = !isArena;
    if (!isArena) renderTask(); else arena.render();
    renderControls();
    renderTrials();
    renderGraphCard();
    // Hide calculated values on the diagrams while a question asks for them
    const t = isArena ? null : taskDef(tab);
    const hide = (t && t.hideValues && pr(tab).status !== 'correct') ? t.hideValues : false;
    sim.hideValues = hide;
    fbd.hideValues = hide;
    const st = isArena ? null : pr(tab);
    const hideCart = !!(t && t.hideCartMass && !(t.revealOnCorrect && st.status === 'correct'));
    sim.hideCartMass = hideCart;
    fbd.hideCartMass = hideCart;
    physics.maxT = (t && t.maxT) || NSL.MAX_T;
    stripHide = hide;
  }

  function switchTab(next) {
    cancelArenaRun();
    clearTimeout(doneTimer);
    tab = next;
    state.tab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    if (STEPS.includes(tab) && !pr(tab).s && !pr(tab).done) startRound(tab, false);
    applyConfig();
    transientUntil = 0;
    save();
    renderAll();
    requestAnimationFrame(resizeAll);
  }

  // ---------- Arena ----------
  const arena = new MasteryArena({
    changed() { save(); },
    mountCalc(scope, key) { if (tab === 'arena') mountCalculator(scope, key); },
    honorsRequired() { return !!profile.honorsRequired; },
    certificate(code) { if (state) { state.certCode = code; save(); } },
    // Everything the certificate shows comes from the account and saved progress (nothing to type)
    certificateInfo() {
      const sc = scoreState(state);
      const stepNames = { step1: 'Step 1', step2: 'Step 2', step3: 'Step 3' };
      return {
        name: profile.guest ? 'Guest' : profile.name,
        guest: !!profile.guest,
        points: sc.points,
        maxPoints: 10,
        stepsDone: sc.stepsDone,
        honors: sc.honorsDone.map(k => stepNames[k]),
        classLabel: profile.teacher ? 'Teacher' : (profile.period !== null && profile.period !== undefined)
          ? `Period ${profile.period}${profile.honorsRequired ? ' · Honors Physics' : ''}` : ''
      };
    },
    runArenaTrial(cfg, cb) {
      physics.setMasses(cfg.mL, cfg.cargo, cfg.mR);
      saveConfig();
      arenaPending = cb;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => { if (arenaPending === cb) physics.release(); }, 450);
    },
    previewConfig(mL, cargo, mR, release) {
      cancelArenaRun();
      physics.setMasses(mL, cargo, mR);
      saveConfig();
      if (release) setTimeout(() => physics.release(), 450);
    }
  }, $('arenaRoot'));
  arena.bind();

  // ---------- Theme / font / audio ----------
  function resizeAll() {
    sim.resize(); fbd.resize(); graph.resize();
    sim.draw(); fbd.draw(); drawGraph();
  }

  function refreshPalettes() {
    sim.refreshPalette(); fbd.refreshPalette(); graph.refreshPalette();
    sim.draw(); fbd.draw(); drawGraph();
  }

  function syncThemeButton() {
    $('btnTheme').textContent = root.classList.contains('theme-light') ? '🌙 Dark' : '☀️ Light';
  }
  function syncFontButtons() {
    const size = ['normal', 'large', 'huge'].find(s => root.classList.contains('font-' + s)) || 'normal';
    document.querySelectorAll('.font-btn').forEach(b => b.classList.toggle('active', b.dataset.size === size));
  }
  function syncAudioButton() {
    $('btnAudio').textContent = sfx.enabled ? '🔊 On' : '🔇 Off';
  }

  $('btnTheme').addEventListener('click', () => {
    const light = !root.classList.contains('theme-light');
    root.classList.toggle('theme-light', light);
    try { localStorage.setItem('nsl_theme', light ? 'light' : 'dark'); } catch (e) { /* ignore */ }
    syncThemeButton(); sfx.playClick(); refreshPalettes();
    if (desmos && desmos.updateSettings) desmos.updateSettings({ invertedColors: !light });
  });

  document.querySelectorAll('.font-btn').forEach(b => b.addEventListener('click', () => {
    root.classList.remove('font-normal', 'font-large', 'font-huge');
    root.classList.add('font-' + b.dataset.size);
    try { localStorage.setItem('nsl_font', b.dataset.size); } catch (e) { /* ignore */ }
    syncFontButtons(); sfx.playClick();
    requestAnimationFrame(resizeAll);
  }));

  $('btnAudio').addEventListener('click', () => { sfx.setEnabled(!sfx.enabled); syncAudioButton(); sfx.playClick(); });

  document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => {
    sfx.playClick();
    switchTab(b.dataset.tab);
  }));

  $('chkVectors').addEventListener('change', e => { sim.showVectors = e.target.checked; });

  document.querySelectorAll('.speed-pill').forEach(b => b.addEventListener('click', () => {
    speed = parseFloat(b.dataset.speed);
    document.querySelectorAll('.speed-pill').forEach(x => x.classList.toggle('active', x === b));
    sfx.playClick();
  }));

  // Certificate modal
  $('btnCloseCert').addEventListener('click', () => { $('certModal').hidden = true; });
  // Print dialog → "Save as PDF" on Chromebooks. The print stylesheet makes it black-and-white and
  // ink-friendly, and the page title becomes the PDF's file name.
  $('btnPrintCert').addEventListener('click', () => {
    const old = document.title;
    const who = ($('certName').textContent || 'Student').replace(/[^A-Za-z0-9]+/g, '_');
    document.title = `Newtons_2nd_Law_Certificate_${who}`;
    window.addEventListener('afterprint', () => { document.title = old; }, { once: true });
    window.print();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $('certModal').hidden = true; });

  physics.on('bumper', () => { sfx.playThud(); graphsDirty = true; });
  physics.on('gateEnter', () => sfx.playBeep());
  physics.on('reset', () => { graphsDirty = true; });

  const ro = new ResizeObserver(() => resizeAll());
  ro.observe($('simCanvas').parentElement);
  ro.observe($('fbdPicture').parentElement);

  // Hooks that lesson tasks may call
  const api = { recordTrial: silent => recordTrial(silent) };

  // ---------- Loop ----------
  let last = performance.now();
  let arenaKey = '';
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const running = physics.phase === 'running' && !physics.timeUp;
    if (running) physics.step(dt * speed);
    sfx.setRollSpeed(physics.phase === 'running' && !physics.timeUp ? Math.abs(physics.v) * Math.sqrt(speed) : 0);

    checkDoTask();

    if (arenaPending) {
      if (physics.gates.B.speed !== null) { const cb = arenaPending; arenaPending = null; cb(physics.gates.B.speed); }
      else if (physics.phase === 'stopped' || physics.timeUp) { const cb = arenaPending; arenaPending = null; cb(null); }
    }
    const k = `${arena.score}|${arena.finished}|${arena.certificateReady}`;
    if (k !== arenaKey) { arenaKey = k; updateTabChecks(); }

    sim.draw();
    fbd.draw();
    updateStrip();
    autoStatus();
    if (running || graphsDirty) { drawGraph(); graphsDirty = false; }
    requestAnimationFrame(frame);
  }

  // ---------- Start (called by js/auth.js once the student's saved state is loaded) ----------
  function start(loaded, cloudSaver, prof) {
    cloud = cloudSaver;
    profile = prof || profile;
    state = validState(loaded) ? loaded : newState();
    if (cloud) cloud.state = state;
    if (state.arena) arena.importState(state.arena);
    arena.setName(profile.guest ? '' : (profile.name || ''));
    STEPS.forEach(st => {
      const p = pr(st);
      if (!p.done && !roundActive(st, p.round)) {
        if (skipInactive(st)) { p.task = 0; p.s = null; } else p.done = true;
      }
    });
    syncThemeButton();
    syncFontButtons();
    syncAudioButton();
    tab = ['step1', 'step2', 'step3', 'arena'].includes(state.tab) ? state.tab : 'step1';
    switchTab(tab);
    updateTabChecks();
    requestAnimationFrame(frame);
  }

  window.NSLApp = { start, newState, validState, scoreState };
})();
