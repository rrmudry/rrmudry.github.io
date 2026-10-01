// Mass, Weight & Zero-G Inertia Studio: Master Application Controller
// Tab routing, shared object selection, evidence log, grade display, theme & projector font scaling.
// Boots only after StudioAuth signs the student in and loads their saved progress from Firestore.

const TAB_INFO = {
  volume: {
    badge: 'STATION 1 · SPATIAL VOLUME CHAMBER',
    desc: '<strong>Volume</strong> is how much space an object takes up (cm³ or L). It tells you <em>nothing</em> about inertia. Scan the giant Space-Foam and the tiny Tungsten Anvil, then go shove them both in Station 3.',
    myth: 'MYTH: “Bigger objects always have more inertia.”'
  },
  weight: {
    badge: 'STATION 2 · PLANETARY GRAVITY PLATFORM',
    desc: '<strong>Weight</strong> is the pull of gravity on an object: W = m · g, measured in newtons (N). Move the scale between worlds and watch which number changes and which one never does.',
    myth: 'MYTH: “Objects lose their mass when they float in space.”'
  },
  inertia: {
    badge: 'STATION 3 · ZERO-G INERTIA CHAMBER',
    desc: '<strong>Mass</strong> (kg) is the measure of <strong>inertia</strong>: how stubbornly an object resists any change in its motion. In this bay every object weighs 0 N, yet watch how differently each one responds to the exact same push.',
    myth: 'MYTH: “Weightless objects are effortless to move or stop.”'
  },
  arena: {
    badge: '🎯 MASTERY ARENA · MYTHBUSTERS: DEEP SPACE EDITION',
    desc: 'Five scenarios, one locked-in answer each. Score at least <strong>4 / 5 (80%)</strong> to earn your Deep Space Dynamics Specialist certificate. Question 4 needs evidence you collect from the three stations.',
    myth: ''
  }
};

const INERTIA_CALLOUTS = {
  nudge: '<strong>INERTIA OF REST:</strong> High mass stubbornly resists <em>starting</em> to move, even when weight is exactly 0 newtons!',
  catch: '<strong>INERTIA OF MOTION:</strong> An object in motion continues in motion unless acted upon by an external net force. Massive objects stubbornly resist being <em>stopped</em>!'
};

function storageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

function storageSet(key, val) {
  try { localStorage.setItem(key, val); } catch (e) { /* storage blocked: session-only */ }
}

document.addEventListener('DOMContentLoaded', () => {
  new StudioAuth(startStudio);
});

function startStudio({ state, cloud, guest }) {
  const root = document.documentElement;

  // State lives in Firestore (studioState) so crates can't be re-rolled by refreshing
  const save = (immediate = false) => {
    cloud.queueSave(immediate);
    renderScore();
  };

  let objects = MWS.allObjects(state.crates);
  let currentObj = objects.find(o => o.id === 'tungsten');
  let activeTab = 'volume';
  let arena = null;

  // ------------------------------------------------------------------
  // Evidence log
  // ------------------------------------------------------------------
  const onMeasure = (objId, key, value) => {
    if (!state.log[objId]) state.log[objId] = {};
    const prev = state.log[objId][key];
    // Keep a real dent over a later 'lost' run so a finished cell is never erased
    if (key === 'dent' && value === 'lost' && typeof prev === 'number') return;
    state.log[objId][key] = value;
    const isNewCell = MWS.DATA_KEYS.includes(key) && value !== 'lost' && (prev == null || prev === 'lost');
    if (isNewCell) toastRecorded(objId, key, value);
    save();
    renderLog();
    renderObjectPicker();
    if (arena) arena.refreshEvidence();
  };

  // ------------------------------------------------------------------
  // Mission guidance: per-station progress, "next step" + Go button, toasts
  // ------------------------------------------------------------------
  const WEIGHT_KEYS = ['earth', 'mars', 'space'];
  const STATION_NEED = { volume: 1, weight: 3, inertia: 2 };

  function stationProgress(o) {
    const r = state.log[o.id] || {};
    return {
      volume: r.volume != null ? 1 : 0,
      weight: WEIGHT_KEYS.filter(k => r[k] != null).length,
      inertia: (r.nudge != null ? 1 : 0) + (typeof r.dent === 'number' ? 1 : 0)
    };
  }

  function findNextStep() {
    const label = o => `${o.icon} <strong>${o.short}</strong>`;
    for (const o of objects) {
      if (stationProgress(o).volume < 1) return { tab: 'volume', obj: o, text: `<strong>Station 1 · Volume Chamber:</strong> scan the ${label(o)}` };
    }
    for (const o of objects) {
      const r = state.log[o.id] || {};
      for (const k of WEIGHT_KEYS) {
        if (r[k] == null) {
          const p = MWS.planet(k);
          return { tab: 'weight', obj: o, planet: k, text: `<strong>Station 2 · Gravity Platform:</strong> weigh the ${label(o)} on ${p.icon} <strong>${p.name}</strong>` };
        }
      }
    }
    for (const o of objects) {
      if ((state.log[o.id] || {}).nudge == null) return { tab: 'inertia', mode: 'nudge', obj: o, text: `<strong>Station 3 · Mode A:</strong> press ✋ Push on the ${label(o)}` };
    }
    for (const o of objects) {
      if (typeof (state.log[o.id] || {}).dent !== 'number') return { tab: 'inertia', mode: 'catch', obj: o, text: `<strong>Station 3 · Mode B:</strong> release the ${label(o)}, then catch it with 🛡️ the barrier` };
    }
    const answered = Object.keys(state.answers || {}).length;
    if (answered < 5) return { tab: 'arena', text: `<strong>🎯 Mastery Arena:</strong> Evidence Log complete! Answer the 5 questions (${answered} / 5 done)` };
    return { tab: 'arena', done: true, text: '🏆 <strong>Mission complete!</strong> Retake the arena any time to raise your question score.' };
  }

  function renderMission() {
    const totals = { volume: 0, weight: 0, inertia: 0 };
    objects.forEach(o => {
      const p = stationProgress(o);
      Object.keys(totals).forEach(k => { totals[k] += p[k]; });
    });
    const answered = Object.keys(state.answers || {}).length;
    const prog = {
      volume: [totals.volume, objects.length * STATION_NEED.volume],
      weight: [totals.weight, objects.length * STATION_NEED.weight],
      inertia: [totals.inertia, objects.length * STATION_NEED.inertia],
      arena: [answered, 5]
    };
    Object.entries(prog).forEach(([k, [got, need]]) => {
      document.querySelector(`[data-prog="${k}"]`).textContent = `${got} / ${need}${got >= need ? ' ✓' : ''}`;
      document.querySelector(`[data-prog-bar="${k}"]`).style.width = `${(got / need) * 100}%`;
      document.querySelector(`.m-tile[data-goto="${k}"]`).classList.toggle('done', got >= need);
    });
    const next = findNextStep();
    document.getElementById('nextStepText').innerHTML = next.text;
    document.getElementById('btnNextStep').textContent = next.done ? 'Arena →' : 'Go →';
    document.querySelectorAll('.m-tile').forEach(t => t.classList.toggle('is-next', !next.done && t.dataset.goto === next.tab));
  }

  function attention(el) {
    document.querySelectorAll('.attention').forEach(e => e.classList.remove('attention'));
    if (!el) return;
    el.classList.add('attention');
    const clear = () => el.classList.remove('attention');
    el.addEventListener('click', clear, { once: true });
    setTimeout(clear, 8000);
  }

  function goNextStep() {
    const n = findNextStep();
    if (n.tab === 'arena') {
      switchTab('arena');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    switchTab(n.tab, n.obj.id);
    if (n.planet) {
      const btn = document.querySelector(`.planet-btn[data-planet="${n.planet}"]`);
      if (!btn.classList.contains('active')) btn.click();
    }
    if (n.mode) {
      const btn = document.querySelector(`.inertia-mode-btn[data-mode="${n.mode}"]`);
      if (!btn.classList.contains('active')) btn.click();
      attention(document.getElementById(n.mode === 'nudge' ? 'btnPush' : 'btnRelease'));
    }
  }

  let toastTimer = null;
  function toastRecorded(objId, key, value) {
    const o = objects.find(x => x.id === objId);
    if (!o) return;
    const what = {
      volume: ['Volume', `${MWS.fmt(value, 0)} cm³`],
      earth: ['Weight on Earth', `${MWS.fmt(value, 1)} N`],
      mars: ['Weight on Mars', `${MWS.fmt(value, 1)} N`],
      space: ['Weight in Deep Space', `${MWS.fmt(value, 1)} N`],
      nudge: ['Nudge speed', `${MWS.fmt(value, 2)} m/s`],
      dent: ['Barrier dent', `${Math.round(value * 100)} cm`]
    }[key];
    const toast = document.getElementById('toast');
    toast.innerHTML = `✓ Recorded in Evidence Log: <strong>${o.icon} ${o.short}</strong> · ${what[0]} = <strong>${what[1]}</strong>`;
    toast.hidden = false;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
  }

  const logBody = document.getElementById('logBody');
  function renderLog() {
    const cell = (v, fmt) => (v == null ? '<td class="log-empty">—</td>' : `<td>${fmt(v)}</td>`);
    const N = v => `${MWS.fmt(v, 1)} N`;
    logBody.innerHTML = objects.map(o => {
      const r = state.log[o.id] || {};
      const isCurrent = o.id === currentObj.id;
      return `<tr class="${o.hidden ? 'row-crate' : ''} ${isCurrent ? 'row-current' : ''}">
        <th scope="row">${o.icon} ${o.short}</th>
        ${cell(r.volume, v => `${MWS.fmt(v, 0)} cm³`)}
        ${cell(r.earth, N)}
        ${cell(r.mars, N)}
        ${cell(r.space, N)}
        <td>${o.hidden ? '<span class="log-sealed">🔒 sealed</span>' : `${MWS.fmt(o.mass, 1)} kg`}</td>
        ${cell(r.nudge, v => `${MWS.fmt(v, 2)} m/s`)}
        ${cell(r.dent, v => (v === 'lost' ? 'lost in space' : `${Math.round(v * 100)} cm`))}
      </tr>`;
    }).join('');
  }

  // ------------------------------------------------------------------
  // Grade display: 5 pts data table + 5 pts questions = 10 pts
  // ------------------------------------------------------------------
  function renderScore() {
    const s = MWS.scoreState(state);
    const fmt1 = n => (Number.isInteger(n) ? String(n) : n.toFixed(1));
    document.querySelectorAll('[data-score="total"]').forEach(el => { el.textContent = fmt1(s.points); });
    document.querySelectorAll('[data-score="data"]').forEach(el => { el.textContent = fmt1(s.dataPoints); });
    document.querySelectorAll('[data-score="questions"]').forEach(el => { el.textContent = fmt1(s.questionPoints); });
    document.querySelectorAll('[data-score="cells"]').forEach(el => { el.textContent = `${s.filled} / ${s.total}`; });
    document.querySelectorAll('[data-score="bar-data"]').forEach(el => { el.style.width = `${(s.dataPoints / 5) * 100}%`; });
    document.querySelectorAll('[data-score="bar-questions"]').forEach(el => { el.style.width = `${(s.questionPoints / 5) * 100}%`; });
    if (guest) document.getElementById('scoreNote').textContent = 'Guest mode: not graded';
    renderMission();
  }

  // ------------------------------------------------------------------
  // Simulations & canvas
  // ------------------------------------------------------------------
  const canvas = document.getElementById('mainCanvas');
  const ctx = canvas.getContext('2d');
  const sims = {
    volume: new SimVolume(onMeasure),
    weight: new SimWeight(onMeasure),
    inertia: new SimInertia(onMeasure)
  };
  let view = { ctx, w: 0, h: 0, fs: 1, pal: {} };

  function readPalette() {
    const cs = getComputedStyle(root);
    const v = n => cs.getPropertyValue(n).trim();
    view.pal = {
      isLight: root.classList.contains('theme-light'),
      sceneBg: v('--scene-bg'),
      scenePanel: v('--scene-panel'),
      scenePanel2: v('--scene-panel-2'),
      sceneLine: v('--scene-line'),
      labelBg: v('--label-bg'),
      labelText: v('--label-text'),
      border: v('--border-strong'),
      textMain: v('--text-main'),
      textMuted: v('--text-muted'),
      textDim: v('--text-dim'),
      accentCyan: v('--accent-cyan'),
      accentPurple: v('--accent-purple'),
      accentAmber: v('--accent-amber'),
      accentEmerald: v('--accent-emerald'),
      accentRose: v('--accent-rose')
    };
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    view.w = rect.width;
    view.h = rect.height;
    view.fs = Math.max(0.85, Math.min(1.5, parseFloat(getComputedStyle(root).fontSize) / 16));
  }

  new ResizeObserver(() => { resizeCanvas(); renderSim(); }).observe(canvas);

  function renderSim() {
    const sim = sims[activeTab];
    if (!sim || !view.w) return;
    ctx.clearRect(0, 0, view.w, view.h);
    sim.render(view);
  }

  // ------------------------------------------------------------------
  // Object picker (shared across all three stations)
  // ------------------------------------------------------------------
  const objectBar = document.getElementById('objectPicker');
  function renderObjectPicker() {
    const need = STATION_NEED[activeTab];
    objectBar.innerHTML = objects.map(o => {
      let status = '';
      let done = false;
      if (need) {
        const got = stationProgress(o)[activeTab];
        done = got >= need;
        status = done ? '<span class="obj-status obj-check">✓</span>' : (need > 1 ? `<span class="obj-status">${got}/${need}</span>` : '');
      }
      return `
      <button type="button" class="obj-btn ${o.hidden ? 'obj-crate' : ''} ${done ? 'obj-done' : ''} ${o.id === currentObj.id ? 'active' : ''}" data-obj="${o.id}" aria-pressed="${o.id === currentObj.id}" title="${o.name}${done ? ' (done at this station)' : ''}">
        <span class="obj-icon">${o.icon}</span><span class="obj-name">${o.short}</span>${status}
      </button>`;
    }).join('');
  }
  objectBar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-obj]');
    if (!btn) return;
    selectObject(btn.dataset.obj);
  });

  function selectObject(id) {
    const obj = objects.find(o => o.id === id);
    if (!obj) return;
    currentObj = obj;
    renderObjectPicker();
    renderLog();
    const sim = sims[activeTab];
    if (sim) sim.setObject(obj);
    syncInertiaButtons();
    window.soundFx.playClick();
  }

  // ------------------------------------------------------------------
  // Tabs
  // ------------------------------------------------------------------
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = {
    volume: document.getElementById('panelVolume'),
    weight: document.getElementById('panelWeight'),
    inertia: document.getElementById('panelInertia')
  };
  const stage = document.getElementById('stageGrid');
  const arenaSection = document.getElementById('arenaSection');
  const objectSection = document.getElementById('objectSection');
  const massBanner = document.getElementById('massBanner');

  // Bring the object picker + station into view just below the sticky header
  function scrollToStation() {
    const dock = document.querySelector('.sticky-dock');
    const top = objectSection.getBoundingClientRect().top + window.scrollY - dock.offsetHeight - 8;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  function switchTab(tabId, objId) {
    activeTab = tabId;
    tabButtons.forEach(btn => {
      const on = btn.dataset.tab === tabId;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on);
    });
    Object.entries(panels).forEach(([k, el]) => el.classList.toggle('active', k === tabId));

    const info = TAB_INFO[tabId];
    const badge = document.getElementById('stationBadge');
    badge.textContent = info.badge;
    badge.className = `station-badge badge-${tabId}`;
    document.getElementById('stationDesc').innerHTML = info.desc;
    const myth = document.getElementById('stationMyth');
    myth.textContent = info.myth;
    myth.hidden = !info.myth;

    const isArena = tabId === 'arena';
    stage.hidden = isArena;
    objectSection.hidden = isArena;
    arenaSection.hidden = !isArena;
    massBanner.hidden = tabId !== 'weight';

    if (objId && objects.some(o => o.id === objId)) {
      currentObj = objects.find(o => o.id === objId);
      renderLog();
    }
    renderObjectPicker();
    const sim = sims[tabId];
    if (sim && sim.obj !== currentObj) sim.setObject(currentObj);
    if (!isArena) {
      requestAnimationFrame(() => { resizeCanvas(); renderSim(); });
    }
    syncInertiaButtons();
    storageSet('mws_tab', tabId);
    window.soundFx.playClick();
    if (objId) scrollToStation();
  }

  tabButtons.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  document.querySelectorAll('.m-tile').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.goto)));
  document.getElementById('btnNextStep').addEventListener('click', goNextStep);

  // Mission briefing: shown automatically on the first visit, re-openable any time
  const briefing = document.getElementById('modalBriefing');
  const openBriefing = () => {
    briefing.classList.add('open');
    document.body.classList.add('modal-open');
    document.getElementById('btnStartMission').focus();
  };
  const closeBriefing = () => {
    briefing.classList.remove('open');
    document.body.classList.remove('modal-open');
    if (!state.briefed) {
      state.briefed = true;
      save();
    }
  };
  document.getElementById('btnShowBriefing').addEventListener('click', openBriefing);
  document.getElementById('btnStartMission').addEventListener('click', () => {
    closeBriefing();
    goNextStep();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && briefing.classList.contains('open')) closeBriefing();
  });

  // ------------------------------------------------------------------
  // Station controls
  // ------------------------------------------------------------------
  // Station 1
  document.querySelectorAll('.vol-mode-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.vol-mode-btn').forEach(b => b.classList.toggle('active', b === btn));
    sims.volume.setMode(btn.dataset.mode);
    document.getElementById('btnVolumeRun').textContent = btn.dataset.mode === 'calipers' ? '🔦 Re-Run Laser Scan' : '💧 Lower Into Tank Again';
    window.soundFx.playClick();
  }));
  document.getElementById('btnVolumeRun').addEventListener('click', () => sims.volume.start());

  // Station 2
  const planetBtns = document.querySelectorAll('.planet-btn');
  planetBtns.forEach(btn => btn.addEventListener('click', () => {
    planetBtns.forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-pressed', b === btn);
    });
    sims.weight.setPlanet(btn.dataset.planet);
  }));
  document.getElementById('btnWeightDrop').addEventListener('click', () => sims.weight.reset());

  // Station 3
  const btnPush = document.getElementById('btnPush');
  const btnRelease = document.getElementById('btnRelease');
  const btnBarrier = document.getElementById('btnBarrier');
  document.querySelectorAll('.inertia-mode-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.inertia-mode-btn').forEach(b => b.classList.toggle('active', b === btn));
    sims.inertia.setMode(btn.dataset.mode);
    document.getElementById('inertiaCallout').innerHTML = INERTIA_CALLOUTS[btn.dataset.mode];
    document.getElementById('nudgeControls').hidden = btn.dataset.mode !== 'nudge';
    document.getElementById('catchControls').hidden = btn.dataset.mode !== 'catch';
    syncInertiaButtons();
    window.soundFx.playClick();
  }));
  btnPush.addEventListener('click', () => sims.inertia.push());
  btnRelease.addEventListener('click', () => {
    sims.inertia.release();
    attention(btnBarrier);
  });
  btnBarrier.addEventListener('click', () => sims.inertia.deployBarrier());
  document.getElementById('btnInertiaReset').addEventListener('click', () => {
    sims.inertia.reset();
    window.soundFx.playClick();
  });

  function syncInertiaButtons() {
    const s = sims.inertia;
    btnPush.textContent = s.phase === 'idle' || s.phase === 'extend' ? '✋ Apply Standard Hand Push' : '✋ Reset & Push Again';
    btnRelease.textContent = s.phase === 'ready' ? '🚀 Release Cargo (1.0 m/s)' : '🚀 Release Again';
    btnBarrier.disabled = s.barrierOn;
    btnBarrier.textContent = s.barrierOn ? '🛡️ Barrier Deployed' : '🛡️ Deploy Safety Catch Barrier';
  }

  // ------------------------------------------------------------------
  // Telemetry & mass/weight banner
  // ------------------------------------------------------------------
  const telEls = [1, 2, 3, 4].map(i => ({
    label: document.getElementById(`tel${i}Label`),
    val: document.getElementById(`tel${i}Val`)
  }));
  const setText = (el, text) => { if (el.textContent !== text) el.textContent = text; };
  const bannerMass = document.getElementById('bannerMass');
  const bannerWeight = document.getElementById('bannerWeight');
  const bannerCalc = document.getElementById('bannerCalc');

  function updateTelemetry() {
    const sim = sims[activeTab];
    if (!sim || !sim.obj) return;
    sim.getTelemetry().forEach((t, i) => {
      setText(telEls[i].label, t.label);
      setText(telEls[i].val, t.value);
    });
    if (activeTab === 'weight') {
      const w = sims.weight;
      const obj = w.obj;
      const p = w.planet;
      setText(bannerMass, obj.hidden ? '? kg 🔒' : `${MWS.fmt(obj.mass, 1)} kg`);
      setText(bannerWeight, `${MWS.fmt(w.weight(), 1)} N`);
      setText(bannerCalc, `W = m · g = ${obj.hidden ? '?' : MWS.fmt(obj.mass, 1)} kg × ${MWS.fmt(p.g, 1)} m/s² = ${MWS.fmt(w.weight(), 1)} N`);
    }
    if (activeTab === 'inertia') syncInertiaButtons();
  }

  // ------------------------------------------------------------------
  // Mastery Arena
  // ------------------------------------------------------------------
  arena = new MasteryArena({
    state,
    save: () => save(true),
    getCrates: () => state.crates,
    getLog: () => state.log,
    guest,
    switchTab
  });
  arena.onRetake = () => {
    state.crates.forEach(c => { delete state.log[c.id]; });
    state.crates = MWS.generateCrates();
    state.attempt += 1;
    objects = MWS.allObjects(state.crates);
    if (currentObj.hidden) currentObj = objects.find(o => o.id === 'tungsten');
    Object.values(sims).forEach(s => { s.obj = null; });
    renderObjectPicker();
    renderLog();
  };

  // ------------------------------------------------------------------
  // Header tools: sound, projector font scaling, theme
  // ------------------------------------------------------------------
  const btnSound = document.getElementById('btnSound');
  const syncSound = () => {
    btnSound.textContent = window.soundFx.enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
    btnSound.setAttribute('aria-pressed', window.soundFx.enabled);
  };
  btnSound.addEventListener('click', () => {
    window.soundFx.toggle();
    syncSound();
    window.soundFx.playClick();
  });
  syncSound();

  const FONT_PX = { normal: 16, large: 20, huge: 24 };
  const fontBtns = document.querySelectorAll('.font-btn');
  function applyFontSize(size) {
    if (!FONT_PX[size]) size = 'normal';
    root.style.fontSize = `${FONT_PX[size]}px`;
    fontBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.size === size);
      b.setAttribute('aria-pressed', b.dataset.size === size);
    });
    storageSet('mws_font', size);
    resizeCanvas();
    renderSim();
  }
  fontBtns.forEach(b => b.addEventListener('click', () => applyFontSize(b.dataset.size)));

  const btnTheme = document.getElementById('btnTheme');
  function applyTheme(theme) {
    const light = theme === 'light';
    root.classList.toggle('theme-light', light);
    btnTheme.textContent = light ? '🌙 Dark Mode' : '☀️ Light Mode';
    storageSet('mws_theme', theme);
    readPalette();
    renderSim();
  }
  btnTheme.addEventListener('click', () => {
    applyTheme(root.classList.contains('theme-light') ? 'dark' : 'light');
    window.soundFx.playClick();
  });

  // ------------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------------
  applyTheme(storageGet('mws_theme') === 'light' ? 'light' : 'dark');
  applyFontSize(storageGet('mws_font') || 'normal');
  renderObjectPicker();
  renderLog();
  renderScore();
  const savedTab = storageGet('mws_tab');
  // Silent boot: don't play the click on first paint
  const sfx = window.soundFx.enabled;
  window.soundFx.enabled = false;
  switchTab(TAB_INFO[savedTab] ? savedTab : 'volume');
  window.soundFx.enabled = sfx;
  if (!state.briefed) openBriefing();

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const sim = sims[activeTab];
    if (sim && sim.obj) {
      sim.update(dt);
      renderSim();
      updateTelemetry();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
