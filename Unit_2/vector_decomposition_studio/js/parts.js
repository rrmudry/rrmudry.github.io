// Vector Decomposition Studio — lesson content: one short task at a time, low floor to high ceiling
// Part 1: read parts off a grid with no trig. Part 2: measure → table → graph.
// Part 3: see from THEIR data that sin and cos tell how much of the speed goes each way.
// Part 4: I do / we do / you do calculations. Then Practice Gym, Honors (P0 only), Mastery Check.
// c = { sc, data, support, honors, angle } (built in app.js).
// A task with fresh() starts a scenario; a wrong answer jumps back to it with new values.

(function () {
  const E = () => window.Engine;
  const near = (v, t, tol) => Math.abs(v - t) <= tol;
  const ANGLES = [0, 15, 30, 45, 60, 75, 90];
  const trueRow = (v0, th) => ({ th, x: th === 90 ? 0 : E().Phys.vx(v0, th), y: th === 0 ? 0 : E().Phys.vy(v0, th) });

  const gridScene = (c, extra) => Object.assign({ mode: 'grid', sc: c.sc, showArrow: true, showX: true, showY: true }, extra);
  const launchScene = (c, extra) => Object.assign({ mode: 'scene', sc: c.sc, showX: true, showY: true }, extra);
  const labScene = c => {
    const v0 = c.data.v0;
    const r = trueRow(v0, c.angle);
    return { mode: 'grid', lab: true, protractor: true, sc: { v0, th: c.angle, x: r.x, y: r.y, scale: 1, thing: c.data.thing }, showArrow: true, showX: true, showY: true };
  };
  // A row from the student's table; the true values stand in if a teacher jumped past the lab
  const rowOf = (c, th) => {
    const row = c.data.rows.find(r => r.th === th);
    return row && row.x !== null ? row : trueRow(c.data.v0, th);
  };
  const trigOf = (kind, th) => (kind === 'y' ? Math.sin : Math.cos)(E().rad(th));
  const pctOf = t => Number((t * 100).toFixed(1));
  // Turns the calculator's decimal into the percent it means, big enough to notice
  const pctBig = t => `<div class="pct-big">${Number(t.toFixed(3))} = ${pctOf(t)}%</div>`;
  // showPct: once the calculator step is answered, the bar shows the percent too
  const shareScene = (kind, showPct) => c => {
    const row = rowOf(c, c.sc.rowTh);
    const part = kind === 'y' ? row.y : row.x;
    return {
      mode: 'share', kind, th: c.sc.rowTh, v0: c.data.v0, part, partLabel: E().fmt(part, 1).replace(/\.0$/, ''),
      pct: showPct === 'always' || (showPct && c.answered) ? pctOf(trigOf(kind, c.sc.rowTh)) : null
    };
  };
  // Teaching page: from the calculator's decimal, to multiplying, to matching the student's table, to the formula
  const formulaPage = kind => c => {
    const up = kind === 'y';
    const th = c.sc.rowTh, v0 = c.data.v0;
    const row = rowOf(c, th);
    const t = trigOf(kind, th);
    const dec = Number(t.toFixed(3));
    const answer = E().fmt(v0 * t, 1).replace(/\.0$/, '');
    const measured = E().fmt(up ? row.y : row.x, 1).replace(/\.0$/, '');
    const tag = up ? 'tag-y' : 'tag-x';
    const fn = up ? 'sin' : 'cos';
    const sym = up ? 'v_0y' : 'v_0x';
    return `<p><strong>Here is how to find the <span class="tag ${tag}">${up ? 'upward' : 'sideways'}</span> part.</strong> Use your ${th}° launch.</p>
      <ol class="howto steps">
        <li>Ask the calculator how much goes ${up ? 'up' : 'sideways'}:<br><span class="formula">${fn}(${th}°) = ${dec}</span> (${pctOf(t)}%)</li>
        <li>Find that much of the launch speed. Multiply:<br><span class="formula">${v0} m/s × ${dec} = ${answer} m/s</span></li>
        <li>Check your table. You measured <strong>${measured} m/s</strong>. ${measured === answer ? 'It matches!' : 'That is really close!'}</li>
      </ol>
      <div class="anatomy" role="group" aria-label="The formula, piece by piece">
        <div class="an-term ${up ? 'an-y' : 'an-x'}"><span class="an-sym">${sym}</span><span class="an-word">${up ? 'upward' : 'sideways'} part only</span><span class="an-val">${answer} m/s</span></div>
        <div class="an-op">=</div>
        <div class="an-term an-v"><span class="an-sym">v_0</span><span class="an-word">whole launch speed</span><span class="an-val">${v0} m/s</span></div>
        <div class="an-op">×</div>
        <div class="an-term an-fn"><span class="an-sym">${fn}(θ)</span><span class="an-word">how much goes ${up ? 'up' : 'sideways'}</span><span class="an-val">${dec}</span></div>
      </div>
      <p class="big-idea"><strong>Watch the little letter!</strong> <span class="formula">v_0</span> is the whole speed. The <strong>${up ? 'y' : 'x'}</strong> in <span class="formula">${sym}</span> means only the ${up ? 'upward' : 'sideways'} part, so it is smaller.</p>`;
  };
  const graphScene = (c, extra) => Object.assign({ mode: 'graph', rows: c.data.rows, v0: c.data.v0 }, extra);

  // ---------- Reusable answer checks ----------
  const readCheck = (target, label, tip) => raw => {
    const v = E().parseNum(raw);
    if (v === null) return { ok: null, msg: 'Type a number first.' };
    if (near(v, target, 0.01)) return { ok: true };
    return { ok: false, mistake: 'read', msg: `${label} is ${E().fmtAns(target).replace(/\.0+$/, '')} m/s. ${tip}` };
  };
  const calcInput = (asked, label) => c => ({
    k: asked, label, unit: 'm/s', calc: true,
    needs: { trig: true, nums: [c.sc.v0, c.sc.th] },
    check: raw => E().checkCalc(asked, raw, c.sc)
  });
  const calcHints = asked => c => [
    `${asked === 'x' ? 'Sideways touches θ, so use cos.' : 'Upward is across from θ, so use sin.'}`,
    `Type this in the calculator: <span class="formula">${c.sc.v0} × ${E().fn(asked)}(${c.sc.th})</span>`,
    'Check it: the answer must be smaller than v_0.'
  ];
  // Three stacked steps for a guided calculation; keys = null means the student builds the keystrokes
  const calcSteps = (first, math, keys) => `<ol class="step-stack">
      <li><span class="step-label">${first}:</span><span class="step-math">${math}</span></li>
      <li><span class="step-label">${keys ? 'Type this into the calculator:' : 'Put in the numbers from the picture. Type it into the calculator.'}</span>
        ${keys ? `<span class="step-math step-keys">${keys}</span>` : ''}
        </li>
      <li><span class="step-label">Press <strong>Use calculator answer</strong>, then Check:</span></li>
    </ol>`;
  const roundingHints = fnName => () => [
    `On the calculator, press the numbers, then ×, then the ${fnName} button, then the angle.`,
    'Check it: the answer must be smaller than v_0.'
  ];
  const pickFn = asked => ({
    type: 'mc', chain: true,
    text: () => `Which one do you need for the part marked "?"`,
    scene: c => launchScene(c, { showX: asked === 'x', showY: asked === 'y', mark: asked }),
    options: () => [
      { t: 'sin(θ)', formula: true, ok: asked === 'y', why: 'sin goes with the side ACROSS from θ. That is the upward side.' },
      { t: 'cos(θ)', formula: true, ok: asked === 'x', why: 'cos goes with the side that TOUCHES θ. That is the sideways side.' },
      { t: 'tan(θ)', formula: true, ok: false, why: 'tan does not use the long side, v_0. Here we know v_0, so use sin or cos.' }
    ],
    right: () => (asked === 'x' ? 'Yes. The sideways side touches θ, so it uses cos.' : 'Yes. The upward side is across from θ, so it uses sin.')
  });

  const PARTS = [
    // ---------------------------------------- Part 1 ----------------------------------------
    {
      id: 'p1', icon: '🔭', label: 'See the Parts', title: 'Part 1: See the Parts', weight: 1,
      tasks: [
        {
          type: 'info', fresh: () => E().gridArrow([1]),
          text: () => `<p>A ball launched at an angle moves <strong>sideways</strong> and <strong>up</strong> at the same time.</p>
            <p>The purple arrow is the launch velocity, <span class="formula">v_0</span>. Its length is the launch speed.</p>
            <p>We can split it into two parts called <strong>components</strong>. A component is the part of an arrow that points in one direction.</p>
            <ul class="howto"><li><span class="tag tag-x">v_0x</span> is the sideways part.</li><li><span class="tag tag-y">v_0y</span> is the upward part.</li></ul>`,
          scene: c => gridScene(c, { keyLabel: true })
        },
        {
          type: 'mc',
          text: () => 'Where do you look to read the sideways part, v_0x?',
          scene: c => gridScene(c, { keyLabel: true }),
          options: () => [
            { t: 'Along the bottom, from the start to the blue dashed line', ok: true },
            { t: 'Up the left side, to the orange dashed line', why: 'Up the left side shows the upward part, v_0y.' },
            { t: 'Along the purple arrow', why: 'The purple arrow is the whole launch speed, v_0.' }
          ],
          right: () => 'Yes. The blue dashed line drops from the tip to the bottom axis. Read the number there.'
        },
        {
          type: 'num', fresh: () => E().gridArrow([1]),
          text: () => 'Read the grid. How fast is the sideways part?',
          scene: c => gridScene(c, { keyLabel: true, showY: false }),
          inputs: c => [{ k: 'x', label: 'v_0x =', unit: 'm/s', check: readCheck(c.sc.x, 'v_0x', 'Follow the blue dashed line down from the tip and read the bottom axis.') }],
          hints: () => ['Find the tip of the purple arrow.', 'Follow the blue dashed line straight down to the bottom axis.', 'Read the number on the axis. Move your mouse over the grid to zoom in.']
        },
        {
          type: 'num',
          text: () => 'Same arrow. How fast is the upward part?',
          scene: c => gridScene(c, { keyLabel: true }),
          inputs: c => [{ k: 'y', label: 'v_0y =', unit: 'm/s', check: readCheck(c.sc.y, 'v_0y', 'Follow the orange dashed line left from the tip and read the left axis.') }],
          hints: () => ['Find the tip of the purple arrow.', 'Follow the orange dashed line straight left to the left axis.', 'Read the number on the axis.']
        },
        {
          type: 'num', fresh: () => E().gridArrow([2, 5]),
          text: () => '<strong>Watch out:</strong> this grid has a new scale. Read the key at the top right, then find both parts.',
          scene: c => gridScene(c, { keyLabel: true }),
          inputs: c => [
            { k: 'x', label: 'v_0x =', unit: 'm/s', check: readCheck(c.sc.x, 'v_0x', `Each square is worth ${c.sc.scale} m/s here.`) },
            { k: 'y', label: 'v_0y =', unit: 'm/s', check: readCheck(c.sc.y, 'v_0y', `Each square is worth ${c.sc.scale} m/s here.`) }
          ],
          hints: c => ['The key says how much one square is worth.', 'Read the numbers on the axis, not the count of squares.']
        },
        {
          type: 'mc',
          text: () => `<p>Look at the picture. We slid the orange arrow over, so it now starts where the blue arrow ends. Sliding an arrow does not change its speed or direction.</p>
            <p>Now the <strong>purple</strong>, <strong>blue</strong> and <strong>orange</strong> arrows connect. What shape do they make?</p>`,
          scene: c => gridScene(c, { keyLabel: true, triangle: true }),
          options: () => [
            { t: 'A right triangle', ok: true },
            { t: 'A square', why: 'Count the sides of the shaded shape. It has three.' },
            { t: 'A circle', why: 'The shaded shape has three straight sides.' }
          ],
          right: () => 'Yes. The little square marks where sideways and up meet at a right angle (90°). That is why triangle math works here.'
        },
        {
          type: 'info',
          text: () => `<p><strong>Why do we need a triangle?</strong> Picture a motorboat crossing a river.</p>
            <ul class="howto"><li>The motor drives the boat straight across at <span class="tag tag-y">4 m/s</span>.</li>
            <li>The <strong>current</strong> (the moving water) pushes the boat sideways at <span class="tag tag-x">3 m/s</span>.</li></ul>
            <p>Both happen at the same time. The boat points straight across, but watch the path it really takes.</p>`,
          scene: () => ({ mode: 'river', stage: 'crossing' })
        },
        {
          type: 'info',
          text: () => `<p>Now look at just one second of the crossing. The motor moves the boat 4 m across. The current moves it 3 m sideways.</p>
            <p><strong>How far did the boat really go?</strong></p>
            <div class="compare">
              <div class="compare-card compare-no"><p class="compare-label">✗ Just adding</p><p class="compare-value"><s>7 m</s></p><p class="formula">4 m + 3 m</p></div>
              <div class="compare-card compare-yes"><p class="compare-label">✓ The real path</p><p class="compare-value">5 m</p><p>The long side of the triangle</p></div>
            </div>
            <p class="big-idea"><strong>The boat traveled 5 m, not 7 m.</strong> The two motions point in different directions, so they do not simply add.</p>
            <p>In 1 second the boat went 5 m, so its real speed is 5 m/s.</p>`,
          scene: () => ({ mode: 'river', stage: 'triangle' })
        },
        {
          type: 'info', fresh: () => E().gridArrow([1, 2]),
          text: c => `<p><strong>A launch works the same way.</strong> It moves sideways and upward at the same time, in different directions.</p>
            <p><strong>How fast is the launch really?</strong></p>
            <div class="compare">
              <div class="compare-card compare-no"><p class="compare-label">✗ Just adding</p><p class="compare-value"><s>${c.sc.x + c.sc.y} m/s</s></p><p class="formula">${c.sc.x} m/s + ${c.sc.y} m/s</p></div>
              <div class="compare-card compare-yes"><p class="compare-label">✓ The launch speed</p><p class="compare-value">${c.sc.v0} m/s</p><p>The long side of the triangle</p></div>
            </div>
            <p class="big-idea"><strong>Big idea:</strong> The launch speed v_0 is the long side of the triangle, so each part is always <strong>smaller</strong> than v_0.</p>`,
          scene: c => gridScene(c, { keyLabel: true, triangle: true, showValues: true })
        }
      ]
    },

    // ---------------------------------------- Part 2 ----------------------------------------
    {
      id: 'p2', icon: '🔬', label: 'Angle Lab', title: 'Part 2: Angle Lab', weight: 2, lab: true,
      tasks: [
        {
          type: 'info', labAngle: true,
          text: c => `<p>In this lab the launch speed stays the same. You change only the angle θ.</p>
            <p>A <strong>protractor</strong> is the curved scale that measures angles. Each small mark is 5°.</p>
            <p><strong>Try it:</strong> move the slider under the grid, or drag on the grid. Watch the blue and orange arrows.</p>`,
          scene: labScene
        },
        {
          type: 'mc', labAngle: true,
          text: () => 'Predict: as the angle gets steeper, what happens to the sideways part, v_0x?',
          scene: labScene,
          options: () => [
            { t: 'It gets smaller', ok: true },
            { t: 'It gets bigger', why: 'Move the slider up and watch the blue arrow. It shrinks.' },
            { t: 'It stays the same', why: 'Move the slider up and watch the blue arrow. It shrinks.' }
          ],
          right: () => 'Right. Now measure it so you have data to prove it.'
        },
        ...ANGLES.map(th => ({ type: 'measure', th, labAngle: true, text: () => '', scene: labScene })),
        {
          type: 'info', showGraph: true,
          text: () => `<p>Here is a <strong>graph of your table</strong>. Each dot is a number you measured.</p>
            <p>Move your mouse over the graph. The red dashed lines show you where to read each axis.</p>`,
          table: true,
          scene: c => graphScene(c)
        },
        {
          type: 'mc',
          text: () => 'Look at your graph. Which line shows the sideways part, and what does it do as θ gets bigger?',
          scene: c => graphScene(c),
          options: () => [
            { t: 'The blue circles, v_0x. It goes down.', ok: true },
            { t: 'The blue circles, v_0x. It goes up.', why: 'Start at the blue dot at 0° and follow it to 90°.' },
            { t: 'The orange squares, v_0y. It goes down.', why: 'Orange squares are the upward part, and they rise as θ gets bigger.' }
          ],
          right: () => 'Yes. As the launch gets steeper, sideways speed turns into upward speed.'
        },
        {
          type: 'num',
          text: () => 'Find where your two lines cross. What angle is that?',
          scene: c => graphScene(c),
          inputs: () => [{
            k: 'cross', label: 'θ =', unit: '°',
            check: raw => {
              const v = E().parseNum(raw);
              if (v === null) return { ok: null, msg: 'Type a number first.' };
              return near(v, 45, 6) ? { ok: true, msg: 'At this angle the speed splits evenly between sideways and up.' }
                : { ok: false, msg: 'Find the spot where blue and orange meet, then read straight down to the angle axis.' };
            }
          }],
          hints: () => ['Find the spot where the blue line and orange line touch.', 'Put your mouse there. Follow the red line down to the bottom axis.'],
          retrySame: true
        },
        {
          type: 'num',
          fresh: () => ({ readTh: E().pick([20, 25, 35, 40, 50, 55, 65, 70]) }),
          text: c => `Your graph can predict angles you did not measure. Use the red line to read v_0y at ${c.sc.readTh}°.`,
          scene: c => graphScene(c, { markTh: c.sc.readTh }),
          inputs: c => [{
            k: 'read', label: 'v_0y ≈', unit: 'm/s',
            check: raw => {
              const v = E().parseNum(raw);
              if (v === null) return { ok: null, msg: 'Type a number first.' };
              const t = E().Phys.vy(c.data.v0, c.sc.readTh);
              return near(v, t, 2) ? { ok: true, msg: 'Good read. A graph lets you estimate between your data points.' }
                : { ok: false, msg: `Follow the red line up to the orange line, then read across to the left axis. It should be about ${t.toFixed(0)} m/s.` };
            }
          }],
          hints: () => ['Start at the red dashed line on the bottom axis.', 'Go up until you hit the ORANGE line.', 'Go straight left and read the speed axis.']
        }
      ]
    },

    // ---------------------------------------- Part 3 ----------------------------------------
    {
      id: 'p3', icon: '🔎', label: 'Sin & Cos', title: 'Part 3: What Sin and Cos Mean', weight: 1, needsData: true,
      tasks: [
        // See how much in bars first; nobody has to divide to see "about half"
        {
          type: 'mc',
          fresh: () => ({ rowTh: 30 }),
          text: c => `Look at the bars. They come from your ${c.sc.rowTh}° row. About how much of the launch speed goes <strong>up</strong>?`,
          scene: shareScene('y'),
          options: () => [
            { t: 'About half', ok: true },
            { t: 'Almost all of it', why: 'Compare the bars. The orange bar stops near the middle.' },
            { t: 'Almost none of it', why: 'Compare the bars. The orange bar reaches the middle.' }
          ],
          right: () => 'Yes. At 30°, about half of the launch speed goes up.'
        },
        {
          type: 'mc',
          fresh: () => ({ rowTh: E().pick([15, 75]) }),
          text: c => `Now try your ${c.sc.rowTh}° row. How much of the launch speed goes <strong>up</strong> now?`,
          scene: shareScene('y'),
          options: c => [
            { t: 'About a quarter', ok: c.sc.rowTh === 15, why: 'Look where the orange bar stops. It goes almost to "all."' },
            { t: 'About half', why: 'Look where the orange bar stops. It is not near "half."' },
            { t: 'Almost all of it', ok: c.sc.rowTh === 75, why: 'Look where the orange bar stops. It is near "a quarter."' }
          ],
          right: c => (c.sc.rowTh === 75 ? 'Yes. A steep launch sends almost all of the speed up.' : 'Yes. A low launch sends only a little of the speed up.')
        },
        // Periods 0 and 4–6 also find the exact decimal from their table
        {
          type: 'num', noSupport: true,
          text: c => `You can find the exact decimal. Use the two numbers on the bars from your ${c.sc.rowTh}° row. In the calculator, divide <span class="nowrap">v_0y ÷ v_0.</span>`,
          scene: shareScene('y'),
          inputs: c => {
            const row = rowOf(c, c.sc.rowTh);
            return [{
              k: 'fy', label: 'v_0y ÷ v_0 =', unit: '', calc: true,
              needs: { nums: [row.y, c.data.v0] },
              check: raw => {
                const v = E().parseNum(raw);
                if (v === null) return { ok: null, msg: 'Type a number first.' };
                return near(v, row.y / c.data.v0, 0.05) ? { ok: true, msg: `So about ${Math.round(100 * row.y / c.data.v0)}% of the launch speed goes up at ${c.sc.rowTh}°.` }
                  : { ok: false, msg: `Divide the v_0y in that row by v_0: <span class="formula">${E().fmt(row.y, 1)} ÷ ${c.data.v0} = ${(row.y / c.data.v0).toFixed(2)}</span>` };
              }
            }];
          },
          hints: c => [`v_0 is on the top bar. v_0y is on the bottom bar.`, 'Divide the bottom number by the top number. Then press Use calculator answer.'],
          retrySame: true
        },
        {
          type: 'info',
          fresh: () => ({ rowTh: 30 }),
          text: () => `<p>How much of the launch speed goes up? Physicists write the answer as a <strong>decimal</strong>:</p>
            <div class="share-scale">
              <div><strong>0</strong><span>none (0%)</span></div><div><strong>0.25</strong><span>a quarter (25%)</span></div>
              <div><strong>0.5</strong><span>half (50%)</span></div><div><strong>1</strong><span>all (100%)</span></div>
            </div>
            <p><strong>Good news:</strong> your calculator can find this decimal for any angle.</p>
            <ul class="howto"><li><strong>sin</strong> (sine) tells how much of the speed goes <span class="tag tag-y">up</span>.</li>
            <li><strong>cos</strong> (cosine) tells how much of the speed goes <span class="tag tag-x">sideways</span>.</li></ul>`,
          scene: shareScene('y')
        },
        {
          type: 'num', calc: true,
          text: c => `Try it. In the calculator, type <span class="formula">sin(${c.sc.rowTh})</span>. Then press <strong>Use calculator answer</strong>.`,
          scene: shareScene('y', true),
          inputs: c => [{
            k: 'sin', label: `sin(${c.sc.rowTh}°) =`, unit: '', calc: true,
            needs: { fn: 'sin', nums: [c.sc.rowTh] },
            check: raw => {
              const v = E().parseNum(raw);
              if (v === null) return { ok: null, msg: 'Type a number first.' };
              const t = Math.sin(E().rad(c.sc.rowTh));
              if (near(v, t, 0.02)) return { ok: true, msg: `${pctBig(t)}<strong>${pctOf(t)}%</strong> of the launch speed goes up. That is what "about half" means! Half of ${c.data.v0} m/s is ${c.data.v0 / 2} m/s, the upward part in your table.` };
              if (near(v, Math.sin(c.sc.rowTh), 0.02)) return { ok: false, mistake: 'radians', msg: 'Your calculator is in radian mode. Switch it to degrees (DEG).' };
              return { ok: false, msg: `Type sin(${c.sc.rowTh}) in the calculator. It should say ${t.toFixed(1)}.` };
            }
          }],
          hints: () => ['Press the sin button in the calculator, then type the angle.', 'Then press Use calculator answer.'],
          retrySame: true
        },
        {
          type: 'mc',
          fresh: () => ({ rowTh: E().pick([30, 60]) }),
          text: c => `Now look at the <strong>sideways</strong> part from your ${c.sc.rowTh}° row. How much of the launch speed goes sideways?`,
          scene: shareScene('x'),
          options: c => [
            { t: 'About half', ok: c.sc.rowTh === 60, why: 'Look where the blue bar stops. It is past "three quarters."' },
            { t: 'Most of it', ok: c.sc.rowTh === 30, why: 'Look where the blue bar stops. It is near "half."' },
            { t: 'Almost none of it', why: 'Look where the blue bar stops. It reaches at least the middle.' }
          ],
          right: c => (c.sc.rowTh === 60 ? 'Yes. At 60°, about half of the speed goes sideways.' : 'Yes. At 30°, most of the speed goes sideways.')
        },
        {
          type: 'num', calc: true,
          text: c => `Check it with the calculator. Type <span class="formula">cos(${c.sc.rowTh})</span>. Then press <strong>Use calculator answer</strong>.`,
          scene: shareScene('x', true),
          inputs: c => [{
            k: 'cos', label: `cos(${c.sc.rowTh}°) =`, unit: '', calc: true,
            needs: { fn: 'cos', nums: [c.sc.rowTh] },
            check: raw => {
              const v = E().parseNum(raw);
              if (v === null) return { ok: null, msg: 'Type a number first.' };
              const t = Math.cos(E().rad(c.sc.rowTh));
              if (near(v, t, 0.02)) return { ok: true, msg: `${pctBig(t)}<strong>${pctOf(t)}%</strong> of the launch speed goes sideways. That is what "${c.sc.rowTh === 30 ? 'most of it' : 'about half'}" means! <strong>cos of the angle tells how much of the speed goes sideways.</strong>` };
              if (near(v, Math.cos(c.sc.rowTh), 0.02)) return { ok: false, mistake: 'radians', msg: 'Your calculator is in radian mode. Switch it to degrees (DEG).' };
              return { ok: false, msg: `Type cos(${c.sc.rowTh}) in the calculator. It should say ${t.toFixed(2)}.` };
            }
          }],
          hints: () => ['Press the cos button in the calculator, then type the angle.', 'Then press Use calculator answer.'],
          retrySame: true
        },
        {
          type: 'mc', fresh: () => E().launch(1),
          text: () => 'A calculator says sin(30°) = 0.50. What does that mean for a launch at 30°?',
          scene: c => ({ mode: 'scene', sc: Object.assign({}, c.sc, { th: 30, x: E().Phys.vx(c.sc.v0, 30), y: E().Phys.vy(c.sc.v0, 30) }), showX: true, showY: true, labelV0: false, hideAngle: false }),
          options: () => [
            { t: 'Half of the launch speed goes up.', ok: true },
            { t: 'The ball goes half as far.', why: 'sin is about splitting the speed, not how far the ball lands.' },
            { t: 'The launch speed is 0.50 m/s.', why: '0.50 means half of the speed. It is not a speed.' }
          ],
          right: () => 'Yes. So the upward part is the launch speed × 0.50.'
        },
        {
          type: 'mc', fresh: () => E().launch(1),
          text: () => `<p>Each side of a right triangle has a name:</p>
            <ul class="howto"><li><strong>Hypotenuse:</strong> the longest side, across from the 90° corner.</li>
            <li><strong>Adjacent:</strong> the other side that touches θ. "Adjacent" means "next to."</li>
            <li><strong>Opposite:</strong> the side across from θ. It does not touch θ.</li></ul>
            <p>Which color is the <strong>adjacent</strong> side?</p>`,
          scene: c => launchScene(c, { nameV0: 'hypotenuse', nameX: '?', nameY: '?', hideAngle: true }),
          options: () => [
            { t: '🔵 The blue side (sideways)', ok: true },
            { t: '🟠 The orange side (upward)', why: 'The orange side is across from θ. That makes it the opposite side.' },
            { t: '🟣 The purple side', why: 'The purple side is the longest. That makes it the hypotenuse.' }
          ],
          right: () => `Yes. Remember it this way: <strong>cos</strong> goes with the side <strong>c</strong>lose to θ. You may also hear <strong>SOH CAH TOA</strong>: Sin = Opposite ÷ Hypotenuse, Cos = Adjacent ÷ Hypotenuse.`
        },
        // New idea, so show it: each formula is built from the student's own 30° row
        {
          type: 'info',
          fresh: () => ({ rowTh: 30 }),
          text: formulaPage('x'),
          scene: shareScene('x', 'always')
        },
        {
          type: 'info',
          text: formulaPage('y'),
          scene: shareScene('y', 'always')
        }
      ]
    },

    // ---------------------------------------- Part 4 ----------------------------------------
    {
      id: 'p4', icon: '🧮', label: 'Calculate', title: 'Part 4: Guided Calculations', weight: 1,
      tasks: [
        {
          type: 'info',
          fresh: () => { const s = { v0: 20, th: 30, thing: 0 }; s.x = E().Phys.vx(20, 30); s.y = E().Phys.vy(20, 30); return s; },
          text: () => `<p><strong>Watch one first.</strong> This is the soccer ball from today's bell ringer.</p>
            <div class="worked-box">
              <p><span class="tag tag-x">Sideways</span> <span class="formula">v_0x = v_0 × cos(θ)</span><br><span class="formula">v_0x = 20 m/s × cos(30°) = 17.3 m/s</span></p>
              <p><span class="tag tag-y">Upward</span> <span class="formula">v_0y = v_0 × sin(θ)</span><br><span class="formula">v_0y = 20 m/s × sin(30°) = 10 m/s</span></p>
            </div>
            <p>Check: both answers are smaller than 20 m/s. ✓</p>
            <p>If you rounded cos(30°) to 0.87, you got 17.4 m/s. That earns credit too.</p>`,
          scene: c => launchScene(c, { valX: '17.3', valY: '10' })
        },
        // "We do": every step is separated
        {
          type: 'num', calc: false,
          fresh: () => E().launch('five'),
          text: () => '<strong>Your turn.</strong> First, read the picture. What is the launch speed and the angle on the protractor?',
          scene: c => launchScene(c, { protractor: true, showX: false, showY: false, showGuides: true }),
          inputs: c => [
            { k: 'v0', label: 'v_0 =', unit: 'm/s', check: readCheck(c.sc.v0, 'v_0', 'The launch speed is written on the purple arrow.') },
            {
              k: 'th', label: 'θ =', unit: '°',
              check: raw => {
                const v = E().parseNum(raw);
                if (v === null) return { ok: null, msg: 'Type a number first.' };
                return near(v, c.sc.th, 2) ? { ok: true } : { ok: false, msg: `The arrow points to ${c.sc.th}° on the protractor. Each small mark is 5°, and numbers count up from the ground.` };
              }
            }
          ],
          hints: () => ['The launch speed is on the purple label.', 'Follow the purple arrow to the curved scale. Start from 0° at the ground and count marks by 5s.']
        },
        pickFn('x'),
        {
          type: 'num',
          text: () => 'Here is the formula. Put the numbers from the picture into the boxes.',
          scene: c => launchScene(c, { showY: false, showGuides: true, mark: 'x' }),
          setupFn: 'cos', setupSym: 'v_0x',
          hints: () => ['v_0 is the launch speed. Look at the purple label.', 'θ is the angle marked in the picture.'],
          inputs: c => [
            { k: 'v0', label: 'v_0x =', unit: '', check: readCheck(c.sc.v0, 'v_0', 'Start with the launch speed from the picture.') },
            {
              k: 'th', label: '× cos(', unit: '°)',
              check: raw => {
                const v = E().parseNum(raw);
                if (v === null) return { ok: null, msg: 'Type a number first.' };
                return near(v, c.sc.th, 0.01) ? { ok: true } : { ok: false, msg: `The angle in the picture is ${c.sc.th}°.` };
              }
            }
          ]
        },
        {
          type: 'num', calc: true,
          big: true,
          text: c => calcSteps('Your setup', `v_0x = ${c.sc.v0} m/s × cos(${c.sc.th}°)`, `${c.sc.v0} × cos(${c.sc.th})`),
          scene: c => launchScene(c, { showY: false, showGuides: true, mark: 'x' }),
          inputs: c => [calcInput('x', 'v_0x =')(c)],
          hints: roundingHints('cos')
        },
        pickFn('y'),
        {
          type: 'num', calc: true,
          big: true,
          text: () => calcSteps('Now the upward part. The formula', 'v_0y = v_0 × sin(θ)', null),
          scene: c => launchScene(c, { valX: E().fmt(c.sc.x, 1), mark: 'y' }),
          inputs: c => [calcInput('y', 'v_0y =')(c)],
          hints: roundingHints('sin')
        },
        // Fewer steps
        Object.assign(pickFn('y'), { fresh: () => E().launch(2) }),
        {
          type: 'num', calc: true,
          text: () => 'New launch. Find the upward part.',
          scene: c => launchScene(c, { showX: false, showGuides: true, mark: 'y' }),
          inputs: c => [calcInput('y', 'v_0y =')(c)],
          hints: calcHints('y')
        },
        {
          type: 'num', calc: true,
          text: () => 'Same launch. Now find the sideways part.',
          scene: c => launchScene(c, { showY: false, showGuides: true, mark: 'x' }),
          inputs: c => [calcInput('x', 'v_0x =')(c)],
          hints: calcHints('x')
        },
        // "You do": both parts, no prompts
        {
          type: 'num', calc: true,
          fresh: () => E().launch(2),
          text: c => `A ${E().THINGS[c.sc.thing].name} ${E().THINGS[c.sc.thing].verb}. Find <strong>both</strong> parts on your own.`,
          scene: c => launchScene(c, { mark: 'both', nameX: 'v_0x = ?', nameY: 'v_0y = ?' }),
          inputs: c => [calcInput('x', 'v_0x =')(c), calcInput('y', 'v_0y =')(c)],
          hints: c => ['Sideways touches θ: cos. Upward is across from θ: sin.', 'Multiply v_0 by cos(θ). Then multiply v_0 by sin(θ).']
        }
      ]
    },

    // ---------------------------------------- Practice ----------------------------------------
    { id: 'gym', icon: '🏋️', label: 'Practice Gym', title: 'Practice Gym', weight: 1, kind: 'gym' },

    // ---------------------------------------- Honors (Period 0 only) ----------------------------------------
    {
      id: 'honors', icon: '⭐', label: 'Honors', title: 'Honors Challenges', weight: 1, honors: true, kind: 'honorsSet',
      kinds: ['h_speed', 'h_angle', 'h_vertical', 'h_down', 'h_back']
    },

    // ---------------------------------------- Assessment ----------------------------------------
    { id: 'quiz', icon: '🏆', label: 'Mastery Check', title: 'Mastery Check', weight: 0, kind: 'quiz' }
  ];

  window.PARTS = PARTS;
  window.LAB = { ANGLES, trueRow };
})();
