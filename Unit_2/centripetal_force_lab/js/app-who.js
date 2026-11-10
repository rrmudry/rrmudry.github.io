// Centripetal Force Lab — "Who Pulls?" stations (take things away until the object leaves the circle, then name the force)
// and the "How Much?" problems (new numbers on a picture, worked on the calculator).

(function () {
  const A = window.FLApp, { $ } = A, FL = window.FL, Scene = window.Scene, S = A.sim;
  const calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RATE = calm ? 45 : 150;   // degrees per second: every station turns at the same easy pace

  // ---------- A station ----------
  // d = { st (station on screen), seen, order (test buttons), tried, found, off, phi, pick, need, streak, bad, until, more, ok }
  let note = '';
  const def = d => FL.STATIONS[d.st];
  const realTest = d => def(d).tests.find(t => t.real);
  function deal(d, st) {
    Object.assign(d, { st, order: FL.shuffle(FL.STATIONS[st].tests.map(t => t.id)), tried: [], found: false, off: false, pick: null, bad: null, more: false });
    d.seen = (d.seen || []).concat(st);
    note = '';
  }
  const answered = d => d.ok || d.bad || d.more;

  A.kinds.station = {
    enter(pg, d) {
      note = '';
      if (!d.st) deal(d, pg.st);
      if (d.bad && !d.ok) A.ui.fb = { bad: true, msg: d.bad };
    },
    scene(pg, d) {
      if (!d.off || S.free) return Scene.station({ id: d.st, phi: S.phi, off: d.off, note });
      const f = A.flightEnd(d.phi, Scene.ST);
      const svg = Scene.station({ id: d.st, phi: d.phi, off: true, note: `“${realTest(d).t}”: the ${def(d).obj} left the circle in a straight line.` });
      return A.inject(svg, A.tangentLine(f)).replace(/(<g id="puck" transform=")[^"]*/, `$1translate(${f.to.x.toFixed(1)} ${f.to.y.toFixed(1)}) rotate(${-d.phi})`);
    },
    ctl(pg, d) {
      if (d.off) return `<span class="ctl-note">Found it.</span>${answered(d) ? '' : '<button type="button" class="btn-test" id="btnPutBack">↩ Put it back</button>'}`;
      return '<span class="ctl-note">Test:</span>' + d.order.map(id => {
        const t = def(d).tests.find(x => x.id === id);
        return `<button type="button" class="btn-test ${d.tried.includes(id) ? 'on' : ''}" data-test="${id}" ${answered(d) ? 'disabled' : ''}>${t.t}</button>`;
      }).join('');
    },
    bindStage(pg, d) {
      A.on('btnPutBack', () => { d.off = false; note = ''; A.save(); A.renderStage(); });
      document.querySelectorAll('#stageCtl [data-test]').forEach(b => b.addEventListener('click', () => {
        if (S.free || d.off) return;
        const t = def(d).tests.find(x => x.id === b.dataset.test);
        if (!d.tried.includes(t.id)) d.tried.push(t.id);
        b.classList.add('on');
        if (!t.real) {
          note = `“${t.t}”: the ${def(d).obj} still goes around the circle.`;
          if ($('testNote')) $('testNote').textContent = note;
          return A.save();
        }
        Object.assign(d, { found: true, off: true, phi: Math.round(S.phi) });
        A.save();   // a reload in the middle of the flight comes back with the test already found
        const svg = $('stage').querySelector('svg');
        if (svg) svg.classList.add('link-off');
        if ($('testNote')) $('testNote').textContent = '';
        document.querySelectorAll('#stageCtl [data-test]').forEach(x => { x.disabled = true; });
        A.release();
        S.tick = () => { if (S.landed) { S.tick = null; S.free = null; A.save(); A.render(); } };
      }));
    },
    live(pg, d) {
      if (d.off && !S.free) return;
      S.geo = Scene.ST; S.turn = true;
      if (S.on) A.startAnim(); else A.spin(4, { rate: RATE });
    },
    task(pg, d) {
      const o = def(d).obj;
      const head = `${d.need ? `<p class="launch-tag">Right in a row: ${d.streak || 0} of ${d.need}</p>` : ''}${A.title(pg.title)}`;
      if (!d.found) {
        return head + `<p class="task-body">Something pulls the ${o} toward the center and keeps it on the circle. Find out what it is. Use the <strong>test buttons</strong> under the picture. Only one test makes the ${o} leave the circle.</p>` + A.actions();
      }
      const opts = `<div class="opts">${FL.FORCES.map(f => {
        const cls = d.pick !== f.id ? '' : d.ok || d.more ? 'opt-right' : d.bad ? 'opt-wrong' : 'opt-picked';
        return `<button type="button" class="opt ${cls}" data-force="${f.id}" ${answered(d) ? 'disabled' : ''}>${f.t}</button>`;
      }).join('')}</div>`;
      const s = head + `<p class="task-body">“${realTest(d).t}” made the ${o} leave. So which force was holding the ${o} on its circle?</p>` + opts;
      if (d.ok) return s + A.okNote(def(d).why) + A.actions(A.nextBtn());
      if (d.more) return s + A.okNote(`${def(d).why} Now show it on a new one.`) + A.actions('<button type="button" class="btn-primary" id="btnNew">Next one ▶</button>');
      if (d.bad) return s + A.note('fb-bad', `<strong>✗ Not yet.</strong> ${d.bad}`) + A.actions(A.btn('btnNew', 'Try a new one ▶', 'btn-primary', d.until));
      return s + A.fbHTML() + A.actions('<button type="button" class="btn-primary" id="btnCheck">Check</button>');
    },
    bindTask(pg, d) {
      document.querySelectorAll('#taskCard [data-force]').forEach(b => b.addEventListener('click', () => { d.pick = b.dataset.force; A.ui.fb = null; A.renderTask(); }));
      A.on('btnCheck', () => {
        if (!d.pick) { A.ui.fb = { retry: true, msg: 'Pick one of the four forces first.' }; return A.renderTask(); }
        const res = FL.checkForceName(d.st, d.pick);
        A.recordTry(`${pg.id}_${d.seen.length}`, res.ok);
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
        deal(d, FL.nextStation(d.seen, d.st));
        A.resetSim(); A.ui.fb = null;
        A.save(); A.render();
      });
    }
  };

  // ---------- A new problem: the numbers are on the picture ----------
  // d = { sc (the dealt problem), steps: { questionId: record } }
  const GEN = { compare: () => FL.compareProblem(), fnet: pg => FL.fnetProblem(pg.skin), vmax: pg => FL.vmaxProblem(pg.skin) };
  function dealProblem(pg, d) {
    const old = d.sc ? JSON.stringify(d.sc) : '';
    for (let i = 0; i < 20; i++) { d.sc = GEN[pg.gen](pg); if (JSON.stringify(d.sc) !== old) break; }
    d.steps = {};
  }
  const rec = (d, q) => d.steps[q.id] || (d.steps[q.id] = {});
  function now(d) {
    const steps = FL.stepsOf(d.sc), i = steps.findIndex(q => !rec(d, q).ok);
    return { steps, i: i < 0 ? steps.length - 1 : i, done: i < 0 };
  }
  A.kinds.problem = {
    enter(pg, d) {
      if (!d.sc) dealProblem(pg, d);
      const { steps, i } = now(d), s = rec(d, steps[i]);
      if (s.bad && !s.ok) A.ui.fb = { bad: true, msg: s.bad };
    },
    scene(pg, d) {
      const solved = {};
      FL.stepsOf(d.sc).forEach(q => { if (rec(d, q).ok) solved[q.id] = true; });
      return Scene.problem(d.sc, solved);
    },
    task(pg, d) {
      const { steps, i } = now(d), q = steps[i];
      const before = i > 0 ? ` · ✓ ${steps[i - 1].right}` : '';
      return A.qHTML(q, rec(d, q), { tag: steps.length > 1 ? `Step ${i + 1} of ${steps.length}${before}` : '' });
    },
    bindTask(pg, d) {
      const { steps, i } = now(d), q = steps[i], s = rec(d, q);
      A.on('btnCheck', () => A.checkQ(q, s, `${pg.id}_${q.id}`));
      A.on('btnNew', () => {
        if (A.left(s.until)) return;
        dealProblem(pg, d);
        A.ui.fb = null; A.ui.draft = ''; A.ui.work = null;
        A.save(); A.render();
      });
    },
    calc(pg, d) {
      const { steps, i, done } = now(d), q = steps[i], s = rec(d, q);
      return !done && q.calc && !s.bad ? q : null;
    }
  };
})();
