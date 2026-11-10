// Centripetal Force Lab — the calculator, the display buttons, and starting the app.
// Calculation answers come only from the calculator, and the calculator line has to be real work.

(function () {
  const A = window.FLApp, { $ } = A, FL = window.FL;
  let desmos = null;

  // ---------- Calculator ----------
  function toggleCalc(open) {
    $('calcPanel').hidden = !open;
    document.body.classList.toggle('calc-open', open);
    if (!open || !window.Desmos) return;
    if (!desmos) {
      try {
        desmos = window.Desmos.ScientificCalculator($('calcHost'), {
          degreeMode: true,
          invertedColors: document.documentElement.classList.contains('theme-dark'),
          fontSize: window.Desmos.FontSizes ? window.Desmos.FontSizes.LARGE : undefined
        });
      } catch (e) { $('calcHost').innerHTML = '<p class="calc-missing">The calculator did not load.</p>'; }
    } else if (desmos.resize) desmos.resize();
  }
  function sayCalc(msg) { $('calcMsg').hidden = !msg; $('calcMsg').innerHTML = msg ? window.subHTML(msg) : ''; }
  A.clearCalc = () => { if (desmos && desmos.setBlank) desmos.setBlank(); sayCalc(''); };

  // The question whose answer the calculator should fill in right now
  function calcQuestion() {
    if (A.state.current === 'quiz') return A.quizCalc();
    const pg = A.page(), k = A.kind();
    return pg && k && k.calc ? k.calc(pg, A.d()) : null;
  }
  A.syncCalc = () => toggleCalc(!!(calcQuestion() && window.Desmos));

  function grabAnswer() {
    const q = calcQuestion();
    if (!q || !desmos) return;
    const work = window.Engine.readCalculator(desmos.getState());
    if (work.empty) return sayCalc('Type your calculation into the calculator first.');
    if (work.unreadable) return sayCalc('The calculator line is not finished. Check it, or press "clear all" and type it again.');
    const problem = FL.workProblem(work, q.needs || {});
    if (problem) return sayCalc(problem);
    sayCalc('');
    A.ui.draft = String(Number(work.value.toFixed(3)));
    A.ui.work = work.latex;
    if (A.ui.fb && A.ui.fb.retry) A.ui.fb = null;
    A.quizDraft();
    A.renderTask();
  }

  function bindCalcDrag() {
    const panel = $('calcPanel'), head = $('calcHead');
    let grab = null;
    head.addEventListener('pointerdown', e => {
      const r = panel.getBoundingClientRect();
      grab = { dx: e.clientX - r.left, dy: e.clientY - r.top };
      head.setPointerCapture(e.pointerId);
    });
    head.addEventListener('pointermove', e => {
      if (!grab) return;
      const r = panel.getBoundingClientRect();
      panel.style.left = `${Math.max(0, Math.min(innerWidth - r.width, e.clientX - grab.dx))}px`;
      panel.style.top = `${Math.max(0, Math.min(innerHeight - r.height, e.clientY - grab.dy))}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    });
    head.addEventListener('pointerup', () => { grab = null; });
  }

  // ---------- Display buttons ----------
  function bindTools() {
    const root = document.documentElement;
    const store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } };
    const show = () => {
      if (window.flFit) window.flFit();   // Projector mode changes the text size, so the layout is measured again
      $('btn-theme-toggle').textContent = root.classList.contains('theme-dark') ? '☀️ Light' : '🌙 Dark';
      $('btn-projector-mode').classList.toggle('btn-on', root.classList.contains('projector'));
    };
    $('btn-theme-toggle').addEventListener('click', () => {
      root.classList.remove('projector');
      root.classList.toggle('theme-dark');
      store('cfl_theme', root.classList.contains('theme-dark') ? 'dark' : 'light');
      store('cfl_projector', 'off');
      if (desmos && desmos.updateSettings) desmos.updateSettings({ invertedColors: root.classList.contains('theme-dark') });
      show();
    });
    $('btn-projector-mode').addEventListener('click', () => {
      const on = !root.classList.contains('projector');
      root.classList.toggle('projector', on);
      if (on) root.classList.remove('theme-dark');
      store('cfl_projector', on ? 'on' : 'off');
      show();
    });
    show();
  }

  // ---------- Start ----------
  function start(s, c, prof) {
    A.state = s; A.cloud = c; A.profile = prof; A.tier = prof.tier;
    // Each student gets their own puck and string. A class change starts the lab over, but credit already earned is kept.
    if (!s.rig || s.tier !== A.tier) {
      const keep = s.bestPoints || 0;
      Object.keys(s).forEach(k => delete s[k]);
      Object.assign(s, A.newState(), { tier: A.tier, rig: FL.newRig(A.tier), bestPoints: keep });
    }
    if (s.current !== 'quiz' && !s.parts[s.current]) s.current = 'pull';
    $('btnUseCalc').addEventListener('click', grabAnswer);
    $('btnCert').addEventListener('click', () => A.downloadCertificate($('btnCert')));
    bindCalcDrag();
    bindTools();
    if (prof.teacher || prof.preview) {
      $('viewWrap').hidden = false;
      $('viewSelect').value = prof.previewView || 'teacher';
      $('viewSelect').addEventListener('change', e => { location.search = e.target.value === 'teacher' ? '' : `?preview&view=${e.target.value}`; });
      const btnSample = $('btnSampleData');
      if (btnSample) {
        btnSample.hidden = false;
        btnSample.addEventListener('click', () => {
          A.fillSampleData({ force: true, plotAll: true, linearize: false });
          A.state.parts.measure.done = true;
          A.state.parts.measure.far = FL.TRIALS[A.tier];
          if (A.state.current !== 'graph') A.state.current = 'graph';
          A.state.parts.graph.i = FL.TRIALS[A.tier];
          A.state.parts.graph.far = Math.max(A.state.parts.graph.far || 0, FL.TRIALS[A.tier]);
          if (A.tier === 'honors') {
            delete A.d('g_straight').ok;
            delete A.state.graph.xKey;
          }
          A.enter();
          A.save();
          A.render();
        });
      }
    }
    if (prof.teacher) $('btnMonitor').hidden = false;
    A.enter();
    A.render();
  }

  window.ForceLab = { start, newState: A.newState, validState: A.validState, scoreState: A.scoreState, debug: () => ({ app: A, desmos }) };
})();
