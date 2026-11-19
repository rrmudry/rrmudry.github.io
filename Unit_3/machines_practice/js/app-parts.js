// Work & Simple Machines Practice — the 4 guided page kinds:
//   predict     (Part 1 opener: ungraded prediction + animated 1-rope vs 3-rope pulley test)
//   guess_setup (Part 1: zero-arithmetic GUESS sorting of Givens, Unknown, and Equation with 2-in-a-row after a miss)
//   problem     (Parts 2–4: 1-, 2-, or 3-box scaffolded GUESS + Desmos problems)
//   compare     (Part 3 finale: Student A vs Student B work comparison + Desmos check)

(function () {
  const A = window.SMPApp, { $, esc } = A, SMP = window.SMP, Scene = window.Scene;

  // ---------- 1. Predict + Test (Part 1 Page 1) ----------
  const PREDICT_OPTS = [
    ['less', 'Less work with 3 ropes'],
    ['same', 'Same work (600 J) with both pulleys'],
    ['more', 'More work with 3 ropes']
  ];
  A.kinds.predict = {
    enter(pg, d) {
      if (d.p === undefined) d.p = d.tested ? 1 : 0;
    },
    scene(pg, d) {
      return Scene.tradeoffDemo(d.tested ? 1 : (d.p || 0), !!d.tested);
    },
    ctl(pg, d) {
      return `<button type="button" class="btn-step" id="btnTest" ${!d.pick || d.anim ? 'disabled' : ''}>${d.tested ? '↻ Test again' : '▶ Test both pulleys'}</button>`;
    },
    board(pg, d) {
      return A.guessStripHTML([
        ['G', 'Givens', '300 N crate, 2 m lift', 'done'],
        ['U', 'Unknown', 'Work with 1 vs. 3 ropes', 'done'],
        ['E', 'Equation', 'W = F × d', 'done'],
        ['S', 'Substitute', d.tested ? '100 N × 6 m' : 'Run test first', d.tested ? 'done' : 'now'],
        ['S', 'Solve', d.tested ? '600 J = 600 J' : '?', d.tested ? 'done' : '']
      ]);
    },
    task(pg, d) {
      const opts = PREDICT_OPTS.map(([id, label]) =>
        `<button type="button" class="opt ${d.pick === id ? 'opt-picked' : ''}" data-pick="${id}">${label}</button>`
      ).join('');
      const after = d.tested
        ? `<div class="feedback fb-ok"><strong>✓ Same work: 600 J!</strong> The 3-rope pulley cuts the force to 1/3 (100 N), but you pull 3× as much rope (6 m). Work stays <strong>100 N × 6 m = 600 J</strong>.</div>`
        : `<p class="task-body">Pick your prediction, then press <strong>▶ Test both pulleys</strong> under the picture.</p>`;
      return A.title('Both pulleys lift the same 300 N crate 2 m up. Before testing, how does the 3-rope pulley\'s <strong>work</strong> compare?')
        + `<div class="opts">${opts}</div>`
        + after
        + A.actions(d.tested ? A.nextBtn() : '<button type="button" class="btn-primary" disabled>Test the pulleys first</button>');
    },
    bindStage(pg, d) {
      A.on('btnTest', () => {
        if (!d.pick || d.anim) return;
        d.anim = true; d.p = 0;
        const start = performance.now();
        const step = now => {
          const t = Math.min(1, (now - start) / 900);
          d.p = t;
          $('stage').innerHTML = Scene.tradeoffDemo(t, t >= 1);
          if (t < 1) { requestAnimationFrame(step); return; }
          d.anim = false; d.tested = true;
          A.save(); A.render();
        };
        requestAnimationFrame(step);
      });
    },
    bindTask(pg, d) {
      document.querySelectorAll('#taskCard [data-pick]').forEach(b => b.addEventListener('click', () => {
        d.pick = b.dataset.pick;
        A.state.prediction = d.pick;
        A.save(); A.render();
      }));
    }
  };

  // ---------- 2. Interactive GUESS Setup (Part 1 Pages 2–5) ----------
  function dealSetup(pg, d, keepStreak) {
    const old = d.sc ? JSON.stringify(d.sc) : '';
    for (let i = 0; i < 15; i++) {
      d.sc = SMP.SETUP_GEN[pg.gen]();
      if (JSON.stringify(d.sc) !== old) break;
    }
    const spec = SMP.setupSpec(d.sc);
    d.chipOrder = SMP.shuffle(spec.chips.map(c => c.id));
    d.eqOrder = SMP.shuffle(spec.eqChoices);
    d.g = []; d.u = null; d.stage = 'gu'; d.done = false; d.badEq = null; d.badMsg = null; d.until = 0;
    if (!keepStreak) { d.streak = 0; d.needStreak = 1; }
  }

  A.kinds.guess_setup = {
    enter(pg, d) {
      if (!d.sc) dealSetup(pg, d, false);
      if (d.badEq && d.badMsg && !d.done) A.ui.fb = { bad: true, msg: d.badMsg };
    },
    scene(pg, d) {
      return Scene.forScenario(d.sc, d.done ? { w: true, f: true, d: true, ma: true } : {}, A.tier);
    },
    board(pg, d) {
      const spec = SMP.setupSpec(d.sc);
      const chipText = id => { const c = spec.chips.find(x => x.id === id); return c ? c.text : ''; };
      const gTxt = (d.g || []).length ? d.g.map(chipText).join(', ') : '';
      const uTxt = d.u ? chipText(d.u) : '';
      return A.guessStripHTML([
        ['G', 'Givens', gTxt, d.stage !== 'gu' ? 'done' : 'now'],
        ['U', 'Unknown', uTxt, d.stage !== 'gu' ? 'done' : 'now'],
        ['E', 'Equation', d.done ? spec.rightEq : '', d.done ? 'done' : d.stage === 'eq' ? 'now' : ''],
        ['S', 'Substitute', d.done ? spec.worked.split(' = ')[2] : '', d.done ? 'done' : ''],
        ['S', 'Solve', d.done ? spec.worked.split(' = ').pop() : '', d.done ? 'done' : '']
      ]);
    },
    task(pg, d) {
      const spec = SMP.setupSpec(d.sc);
      const chipById = id => spec.chips.find(c => c.id === id);
      const placed = new Set([...(d.g || []), d.u].filter(Boolean));
      const bankIds = (d.chipOrder || spec.chips.map(c => c.id)).filter(id => !placed.has(id));

      if (d.stage === 'gu') {
        const bank = bankIds.map(id => {
          const c = chipById(id), sel = A.ui.selectedChip === id;
          return `<button type="button" class="var-chip ${c.cls} ${sel ? 'chip-selected' : ''}" draggable="true" data-chip="${id}">${c.text}</button>`;
        }).join('');
        const gChips = (d.g || []).map(id => {
          const c = chipById(id);
          return `<button type="button" class="var-chip ${c.cls}" data-remove="g" data-chip="${id}" title="Click to remove">${c.text} ✕</button>`;
        }).join('');
        const uChip = d.u ? (() => {
          const c = chipById(d.u);
          return `<button type="button" class="var-chip ${c.cls}" data-remove="u" data-chip="${d.u}" title="Click to remove">${c.text} ✕</button>`;
        })() : '';

        return A.title(spec.prompt)
          + A.symKeyHTML(spec.symbols)
          + `<div class="chip-bank" aria-label="Picture labels">${bank || '<span class="slot-placeholder">All labels placed! Check below.</span>'}</div>`
          + `<div class="guess-slots">`
          + `<div class="guess-slot ${(d.g || []).length ? 'slot-filled' : ''}" data-slot="g" role="button" tabindex="0"><div class="slot-head"><span>G — Givens (numbers you already know)</span><span>${(d.g || []).length}/${spec.givens.length}</span></div><div class="slot-chips">${gChips || '<span class="slot-placeholder">Tap a label above, then tap here</span>'}</div></div>`
          + `<div class="guess-slot ${d.u ? 'slot-filled' : ''}" data-slot="u" role="button" tabindex="0"><div class="slot-head"><span>U — Unknown (what has ?)</span><span>${d.u ? 1 : 0}/1</span></div><div class="slot-chips">${uChip || '<span class="slot-placeholder">Tap the ? label, then tap here</span>'}</div></div>`
          + `</div>`
          + A.fbHTML()
          + A.actions(`<button type="button" class="btn-primary" id="btnCheckGU">Check G &amp; U</button>`)
          + A.hintsHTML(spec.guHints);
      }

      // Stage B: Equation pick + Reveal
      const streakNote = d.needStreak > 1 && !d.done ? `<p class="launch-tag">Confirmation: ${d.streak} of ${d.needStreak} right in a row</p>` : '';
      const teachHTML = spec.teach ? `<div class="teach-box">${spec.teach}</div>` : '';
      const triHTML = spec.triangle
        ? A.triWrapHTML(spec.triangle, `Cover <strong>${spec.triangle.cover}</strong> in the triangle:<br>Top ÷ Bottom, or Bottom × Bottom`)
        : '';
      const eqBtns = (d.eqOrder || spec.eqChoices).map(eq => {
        const cls = d.done && eq === spec.rightEq ? 'opt-right' : d.badEq === eq ? 'opt-wrong' : '';
        return `<button type="button" class="eq-btn ${cls}" data-eq="${esc(eq)}" ${d.done || d.badEq ? 'disabled' : ''}>${eq}</button>`;
      }).join('');
      const revealed = d.done
        ? A.okNote(`Equation matched! Here are Substitute &amp; Solve:<br>${SMP.stack(spec.worked)}`)
        : d.badEq
          ? A.note('fb-bad', `<strong>✗ Not yet.</strong> ${d.badMsg || (A.ui.fb && A.ui.fb.msg) || `Match the symbol in Unknown (${chipById(spec.unknown).text}).`}`)
          : A.fbHTML();
      const btn = d.done ? A.nextBtn() : d.badEq ? A.btn('btnRetrySetup', 'Try new numbers ▶', 'btn-primary', d.until) : '';
      return streakNote + A.title(`Step E (Equation): Pick the formula that solves for <strong>${chipById(spec.unknown).text}</strong>`)
        + A.symKeyHTML(spec.symbols)
        + teachHTML
        + triHTML
        + `<div class="eq-opts">${eqBtns}</div>`
        + revealed
        + A.actions(btn)
        + (d.done || d.badEq ? '' : A.hintsHTML(spec.eqHints));
    },
    bindTask(pg, d) {
      const spec = SMP.setupSpec(d.sc);
      const placeChip = (id, slot) => {
        if (!id) return;
        d.g = (d.g || []).filter(x => x !== id);
        if (d.u === id) d.u = null;
        if (slot === 'u') {
          d.u = id;
        } else {
          d.g.push(id);
        }
        A.ui.selectedChip = null; A.ui.fb = null;
        A.save(); A.render();
      };

      document.querySelectorAll('#taskCard [data-chip]:not([data-remove])').forEach(btn => {
        btn.addEventListener('click', () => {
          A.ui.selectedChip = A.ui.selectedChip === btn.dataset.chip ? null : btn.dataset.chip;
          A.renderTask();
        });
        btn.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', btn.dataset.chip); });
      });

      document.querySelectorAll('#taskCard [data-remove]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const id = btn.dataset.chip;
          if (btn.dataset.remove === 'u') d.u = null;
          else d.g = (d.g || []).filter(x => x !== id);
          A.ui.fb = null; A.save(); A.render();
        });
      });

      document.querySelectorAll('#taskCard [data-slot]').forEach(slotEl => {
        const slot = slotEl.dataset.slot;
        slotEl.addEventListener('click', () => { if (A.ui.selectedChip) placeChip(A.ui.selectedChip, slot); });
        slotEl.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && A.ui.selectedChip) { e.preventDefault(); placeChip(A.ui.selectedChip, slot); } });
        slotEl.addEventListener('dragover', e => e.preventDefault());
        slotEl.addEventListener('drop', e => { e.preventDefault(); placeChip(e.dataTransfer.getData('text/plain'), slot); });
      });

      A.on('btnCheckGU', () => {
        const gSet = new Set(d.g || []);
        const totalPlaced = gSet.size + (d.u ? 1 : 0);
        if (totalPlaced < spec.chips.length) {
          A.ui.fb = { retry: true, msg: 'Place every label from the picture into Givens or Unknown first.' };
          return A.renderTask();
        }
        A.recordTry(`${pg.id}_gu`, d.u === spec.unknown && spec.givens.every(x => gSet.has(x)));
        if (d.u !== spec.unknown) {
          A.recordMistake('setup_gu');
          A.ui.fb = { retry: true, msg: 'Look for the <strong>?</strong> badge — that is what we are trying to find, so put it in <strong>Unknown (U)</strong>!' };
          return A.renderTask();
        }
        A.ui.fb = null;
        A.ui.hints = A.tier === 'conceptual' ? 1 : 0;
        d.stage = 'eq';
        A.save(); A.render();
      });

      document.querySelectorAll('#taskCard [data-eq]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (d.done || d.badEq) return;
          const chosen = btn.dataset.eq;
          const ok = chosen === spec.rightEq;
          A.recordTry(`${pg.id}_eq`, ok);
          if (ok) {
            d.streak = (d.streak || 0) + 1;
            if (d.streak >= (d.needStreak || 1)) {
              d.done = true; A.ui.fb = null; d.badMsg = null;
              A.save(); A.render();
            } else {
              dealSetup(pg, d, true);
              const newSpec = SMP.setupSpec(d.sc);
              d.g = newSpec.givens.slice(); d.u = newSpec.unknown; d.stage = 'eq';
              A.ui.hints = A.tier === 'conceptual' ? 1 : 0;
              A.ui.fb = { ok: true, msg: 'Good! Solve one more setup with new numbers to lock it in.' };
              A.save(); A.render();
            }
          } else {
            A.recordMistake('setup_eq');
            d.needStreak = 2; d.streak = 0; d.badEq = chosen; d.until = A.wait(6);
            d.badMsg = spec.explainWrongEq
              ? spec.explainWrongEq(chosen)
              : `Look at Unknown (${spec.chips.find(c => c.id === spec.unknown).text}). The equation needs to isolate that variable: <strong>${spec.rightEq}</strong>.`;
            A.ui.fb = { bad: true, msg: d.badMsg };
            A.save(); A.render();
          }
        });
      });

      A.on('btnRetrySetup', () => {
        if (A.left(d.until)) return;
        dealSetup(pg, d, true);
        A.ui.hints = A.tier === 'conceptual' ? 1 : 0;
        A.ui.fb = null; A.save(); A.render();
      });
    }
  };

  // ---------- 3. Scaffolded GUESS Calculation Problems (Parts 2–4) ----------
  function dealProblem(pg, d) {
    const old = d.sc ? JSON.stringify(d.sc) : '';
    for (let i = 0; i < 20; i++) {
      d.sc = SMP.GEN[pg.gen]();
      if (JSON.stringify(d.sc) !== old) break;
    }
    d.steps = {};
  }
  const rec = (d, q) => d.steps[q.id] || (d.steps[q.id] = {});
  function nowOf(d) {
    const steps = SMP.stepsOf(d.sc, A.tier);
    const i = steps.findIndex(q => !rec(d, q).ok);
    return { steps, i: i < 0 ? steps.length - 1 : i, done: i < 0 };
  }

  A.kinds.problem = {
    enter(pg, d) {
      if (!d.sc) dealProblem(pg, d);
      const { steps, i } = nowOf(d), s = rec(d, steps[i]);
      if (s.bad && !s.ok) A.ui.fb = { bad: true, msg: s.bad };
    },
    scene(pg, d) {
      const solved = {};
      SMP.stepsOf(d.sc, A.tier).forEach(q => { if (rec(d, q).ok) solved[q.id] = true; });
      return Scene.forScenario(d.sc, solved, A.tier);
    },
    board(pg, d) {
      const { steps, i } = nowOf(d), q = steps[i], s = rec(d, q);
      const sSub = s.ok ? (s.work || `${SMP.fmt(s.val)} ${q.unit}`.trim()) : (A.ui.work || '');
      const sSolve = s.ok ? `${q.sym} = ${SMP.fmt(s.val)} ${q.unit}`.trim() : '';
      return A.guessStripHTML([
        ['G', 'Givens', q.guessG || '', 'done'],
        ['U', 'Unknown', q.guessU || `${q.sym} = ?`, 'done'],
        ['E', 'Equation', q.formula || '', 'done'],
        ['S', 'Substitute', sSub, s.ok ? 'done' : 'now'],
        ['S', 'Solve', sSolve, s.ok ? 'done' : 'now']
      ]);
    },
    task(pg, d) {
      const { steps, i } = nowOf(d), q = steps[i];
      const finalOf = step => { const parts = step.right.split(' = '); return `${parts[0]} = ${parts[parts.length - 1]}`; };
      const done = steps.slice(0, i).filter(st => rec(d, st).ok);
      const solved = {};
      steps.forEach(st => { if (rec(d, st).ok) solved[st.id] = true; });
      const fricBarHTML = q.fricBar ? Scene.frictionBarHTML(d.sc, solved) : '';
      const before = done.length ? `<div class="prev-steps">${done.map(st => `<span class="prev-chip">✓ <span class="formula">${finalOf(st)}</span></span>`).join('')}</div>` : '';
      return (steps.length > 1 ? `<p class="launch-tag">Box ${i + 1} of ${steps.length}</p>${before}` : '') + A.qHTML(q, rec(d, q), { fricBarHTML });
    },
    bindTask(pg, d) {
      const { steps, i } = nowOf(d), q = steps[i], s = rec(d, q);
      A.on('btnCheck', () => A.checkQ(q, s, `${pg.id}_${q.id}`));
      A.on('btnNew', () => {
        if (A.left(s.until)) return;
        dealProblem(pg, d);
        A.ui.fb = null; A.ui.draft = ''; A.ui.work = null;
        A.save(); A.render();
      });
    },
    calc(pg, d) {
      const { steps, i, done } = nowOf(d), q = steps[i], s = rec(d, q);
      return !done && q.calc && !s.bad ? q : null;
    }
  };

  // ---------- 4. Student A vs Student B Work Comparison (Part 3 Finale) ----------
  const COMPARE_OPTS = [
    ['equal', 'Both students do the same work'],
    ['a', 'Student A (straight lift) does more work'],
    ['b', 'Student B (ramp) does more work']
  ];
  A.kinds.compare = {
    enter(pg, d) {
      if (!d.sc) dealProblem(pg, d);
      if (!d.needStreak) d.needStreak = 1;
      if (!d.streak) d.streak = 0;
      const q = SMP.stepsOf(d.sc, A.tier)[0], s = rec(d, q);
      if (s.bad && !s.ok) A.ui.fb = { bad: true, msg: s.bad };
    },
    scene(pg, d) {
      const q = SMP.stepsOf(d.sc, A.tier)[0], s = rec(d, q);
      return Scene.compare(d.sc, s.ok ? { w: true } : {}, A.tier);
    },
    board(pg, d) {
      const q = SMP.stepsOf(d.sc, A.tier)[0], s = rec(d, q);
      if (!d.choiceOk) {
        return A.guessStripHTML([
          ['G', 'Givens', 'Same box, same height h', 'done'],
          ['U', 'Unknown', 'Compare W_A and W_B', 'now'],
          ['E', 'Equation', 'W = F × d', 'done'],
          ['S', 'Substitute', d.badChoice ? 'Smaller F × larger d' : '', d.badChoice ? 'done' : ''],
          ['S', 'Solve', '', '']
        ]);
      }
      return A.guessStripHTML([
        ['G', 'Givens', q.guessG, 'done'],
        ['U', 'Unknown', q.guessU, 'done'],
        ['E', 'Equation', q.formula, 'done'],
        ['S', 'Substitute', s.ok ? (s.work || `${SMP.fmt(s.val)} J`) : (A.ui.work || ''), s.ok ? 'done' : 'now'],
        ['S', 'Solve', s.ok ? `W = ${SMP.fmt(s.val)} J` : '', s.ok ? 'done' : 'now']
      ]);
    },
    task(pg, d) {
      if (!d.choiceOk) {
        const streakTag = d.needStreak > 1 ? `<p class="launch-tag">Confirmation: ${d.streak} of ${d.needStreak} right in a row</p>` : '';
        const opts = COMPARE_OPTS.map(([id, label]) => {
          const cls = d.badChoice === id ? 'opt-wrong' : '';
          return `<button type="button" class="opt ${cls}" data-cmp="${id}" ${d.badChoice ? 'disabled' : ''}>${label}</button>`;
        }).join('');
        const fb = d.badChoice
          ? A.note('fb-bad', '<strong>✗ Not yet.</strong> A smooth ramp reduces the push force F, but increases distance d by the same factor, so F × d stays the exact same.')
          : A.fbHTML();
        const btn = d.badChoice ? A.btn('btnCmpNew', 'Try new numbers ▶', 'btn-primary', d.until) : '';
        return streakTag + A.title('Student A lifts the box straight up. Student B pushes an identical box up a smooth ramp to the same shelf. How does their work compare?')
          + `<div class="opts">${opts}</div>` + fb + A.actions(btn);
      }
      const q = SMP.stepsOf(d.sc, A.tier)[0], s = rec(d, q);
      return `<p class="launch-tag">Part 2 of 2</p><div class="prev-steps"><span class="prev-chip">✓ W_A = W_B</span></div>` + A.qHTML(q, s);
    },
    bindTask(pg, d) {
      if (!d.choiceOk) {
        document.querySelectorAll('#taskCard [data-cmp]').forEach(b => b.addEventListener('click', () => {
          if (d.badChoice) return;
          const ok = b.dataset.cmp === 'equal';
          A.recordTry(`${pg.id}_cmp`, ok);
          if (ok) {
            d.streak = (d.streak || 0) + 1;
            if (d.streak >= (d.needStreak || 1)) {
              d.choiceOk = true; A.ui.fb = null;
              A.save(); A.render();
            } else {
              dealProblem(pg, d);
              d.badChoice = null; d.until = 0;
              A.ui.fb = { ok: true, msg: 'Right! Answer one more with new shelf numbers to continue.' };
              A.save(); A.render();
            }
          } else {
            A.recordMistake('compare_wrong');
            d.needStreak = 2; d.streak = 0; d.badChoice = b.dataset.cmp; d.until = A.wait(6);
            A.save(); A.render();
          }
        }));
        A.on('btnCmpNew', () => {
          if (A.left(d.until)) return;
          dealProblem(pg, d);
          d.badChoice = null; d.until = 0; A.ui.fb = null;
          A.save(); A.render();
        });
        return;
      }
      const q = SMP.stepsOf(d.sc, A.tier)[0], s = rec(d, q);
      A.on('btnCheck', () => A.checkQ(q, s, `${pg.id}_${q.id}`));
      A.on('btnNew', () => {
        if (A.left(s.until)) return;
        dealProblem(pg, d);
        d.choiceOk = true;
        A.ui.fb = null; A.ui.draft = ''; A.ui.work = null;
        A.save(); A.render();
      });
    },
    calc(pg, d) {
      if (!d.choiceOk) return null;
      const q = SMP.stepsOf(d.sc, A.tier)[0], s = rec(d, q);
      return q.calc && !s.ok && !s.bad ? q : null;
    }
  };
})();
