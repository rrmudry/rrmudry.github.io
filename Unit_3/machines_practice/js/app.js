// Work & Simple Machines Practice — Desmos calculator, display tools (Light/Dark/Projector), and startup.

(function () {
  const A = window.SMPApp, { $ } = A, SMP = window.SMP;
  let desmos = null;

  function toggleCalc(open) {
    $('calcPanel').hidden = !open;
    document.body.classList.toggle('calc-open', open);
    if (!open || !window.Desmos) return;
    if (!desmos) {
      try {
        desmos = window.Desmos.ScientificCalculator($('calcHost'), {
          degreeMode: true,
          invertedColors: document.documentElement.classList.contains('theme-dark')
        });
      } catch (e) { $('calcHost').innerHTML = '<p class="calc-missing">The calculator did not load.</p>'; }
    }
    requestAnimationFrame(() => { if (desmos && desmos.resize) desmos.resize(); });
  }
  window.addEventListener('resize', () => { if (desmos && desmos.resize) desmos.resize(); });
  function sayCalc(msg) { $('calcMsg').hidden = !msg; $('calcMsg').innerHTML = msg ? window.subHTML(msg) : ''; }
  A.clearCalc = () => { if (desmos && desmos.setBlank) desmos.setBlank(); sayCalc(''); };

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
    const problem = SMP.workProblem(work, q.needs || {});
    if (problem) return sayCalc(problem);
    sayCalc('');
    A.ui.draft = String(Number(work.value.toFixed(3)));
    A.ui.work = work.latex;
    if (A.ui.fb && A.ui.fb.retry) A.ui.fb = null;
    if (A.quizDraft) A.quizDraft();
    A.render();
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

  function bindTools() {
    const root = document.documentElement;
    const meta = document.querySelector('meta[name="color-scheme"]');
    const store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } };
    const show = () => {
      if (window.smpFit) window.smpFit();
      const dark = root.classList.contains('theme-dark');
      if (meta) meta.content = dark ? 'dark' : 'light';
      $('btn-theme-toggle').textContent = dark ? '☀️ Light' : '🌙 Dark';
      $('btn-projector-mode').classList.toggle('btn-on', root.classList.contains('projector'));
    };
    $('btn-theme-toggle').addEventListener('click', () => {
      root.classList.remove('projector');
      root.classList.toggle('theme-dark');
      store('smp_theme', root.classList.contains('theme-dark') ? 'dark' : 'light');
      store('smp_projector', 'off');
      if (desmos && desmos.updateSettings) desmos.updateSettings({ invertedColors: root.classList.contains('theme-dark') });
      show();
    });
    $('btn-projector-mode').addEventListener('click', () => {
      const on = !root.classList.contains('projector');
      root.classList.toggle('projector', on);
      if (on) root.classList.remove('theme-dark');
      store('smp_projector', on ? 'on' : 'off');
      if (desmos && desmos.updateSettings) desmos.updateSettings({ invertedColors: false });
      show();
    });
    // Full screen: recommend on start via banner whenever not full screen, plus a header toggle.
    const isFull = () => !!document.fullscreenElement || (window.innerHeight >= screen.height - 2);
    const goFull = () => {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    };
    let fsDismissed = false;
    const fsPaint = () => {
      const banner = $('fsBanner'), btn = $('btnFull');
      if (banner) banner.hidden = fsDismissed || isFull();
      if (btn) {
        const active = !!document.fullscreenElement;
        btn.textContent = active ? '⛶ Exit full screen' : '⛶ Full screen';
        btn.classList.toggle('btn-on', active);
      }
      if (window.smpFit) window.smpFit();
      if (desmos && desmos.resize) requestAnimationFrame(() => desmos.resize());
    };
    $('btnFull').addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else goFull();
    });
    $('btnFsBanner').addEventListener('click', goFull);
    $('btnFsClose').addEventListener('click', () => { fsDismissed = true; fsPaint(); });
    document.addEventListener('fullscreenchange', fsPaint);
    window.addEventListener('resize', fsPaint);
    fsPaint();
    show();
  }

  function start(s, c, prof) {
    A.state = s; A.cloud = c; A.profile = prof; A.tier = prof.tier;
    if (s.tier !== A.tier) {
      s.tier = A.tier;
    }
    if (s.current !== 'quiz' && !s.parts[s.current]) s.current = 'setup';
    $('btnUseCalc').addEventListener('click', grabAnswer);
    $('btnCert').addEventListener('click', () => A.downloadCertificate($('btnCert')));
    bindCalcDrag();
    bindTools();
    if (prof.teacher || prof.preview) {
      $('viewWrap').hidden = false;
      $('viewSelect').value = prof.previewView || 'teacher';
      $('viewSelect').addEventListener('change', e => {
        location.search = e.target.value === 'teacher' ? '' : `?preview&view=${e.target.value}`;
      });
      const resetBtn = $('btnResetTeacher');
      if (resetBtn) {
        resetBtn.hidden = false;
        resetBtn.addEventListener('click', () => {
          if (!window.confirm('Reset your teacher view? This clears only your own saved progress (never any student data).')) return;
          const fresh = A.newState();
          fresh.tier = A.tier;
          A.state = fresh;
          if (A.cloud && A.cloud.resetState) A.cloud.resetState(fresh);
          A.enter();
          A.updateScoreChip();
          A.render();
        });
      }
    }
    if (prof.teacher) $('btnMonitor').hidden = false;
    A.enter();
    A.render();
  }

  window.MachinesPractice = { start, newState: A.newState, validState: A.validState, scoreState: A.scoreState, debug: () => ({ app: A, desmos }) };
})();
