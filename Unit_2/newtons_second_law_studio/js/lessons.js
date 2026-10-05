// Newton's 2nd Law Studio — Guided lesson content (low floor → high ceiling)
//
// Written for ALL students, including Conceptual Physics students who read well below grade level:
// short sentences, everyday words, one idea per task.
//
// Each step is a list of rounds. A round has a scenario generator (random values) and a list of tasks.
// A WRONG answer on any question loads a new scenario and restarts that round, so students can't
// click through. Task types:
//   info – read, then Continue          do  – act on the simulation until a condition is met
//   mc   – multiple choice               num – type a number (checked with a tolerance)
// num tasks may set  calc: true  (embedded Desmos calculator) and  hints: ctx => [...]  (revealed
// one at a time, no penalty). Text may use F_net, m_L, T_R … (converted to real subscripts).

(function () {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const n = (v, d) => Number(v.toFixed(d === undefined ? 3 : d)).toString(); // trim trailing zeros
  const kg = g => n(g / 1000, 3);
  const near = (v, target, rel) => Math.abs(v - target) <= Math.max(Math.abs(target) * (rel || 0.02), 0.0015);
  const gatesDone = p => p.gates.A.speed !== null && p.gates.B.speed !== null;
  const captureGates = (ctx) => {
    const A = ctx.p.gates.A, B = ctx.p.gates.B;
    ctx.s.vA = +A.speed.toFixed(3);
    ctx.s.vB = +B.speed.toFixed(3);
    ctx.s.dt = +(B.tMid - A.tMid).toFixed(3);
    ctx.s.msB = +(B.blockTime * 1000).toFixed(1);
  };

  const sgn = (v, d) => v > 0 ? `+${n(v, d === undefined ? 2 : d)}` : v < 0 ? `−${n(-v, d === undefined ? 2 : d)}` : '0';

  // The one-time "want to try it?" question shown to standard-class students before a ⭐ Honors section.
  // Honors periods skip it (their Honors rounds are required).
  function honorsGate(stepName, topic, blurb) {
    return {
      title: '⭐ Honors challenge',
      honorsGate: true,
      tasks: [{
        type: 'optin',
        stepName,
        text: () => `<p><strong>⭐ Honors Challenge: ${topic}</strong></p>
          <p>You finished ${stepName}! Want to go one level higher? ${blurb}</p>
          <p>This part is optional for your class.</p>`
      }]
    };
  }

  // Simple arrow picture for reading-light students: box in the middle, one arrow per force.
  function forcePic(L, R) {
    const rows = Math.max(L.length, R.length);
    const H = 34 * rows + 16, W = 340, cx = W / 2, bw = 56, unit = 18;
    let out = `<svg class="force-pic" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px" role="img" aria-label="Forces: ${L.join(' N and ')} N to the left, ${R.join(' N and ')} N to the right">`;
    out += `<rect class="fp-box" x="${cx - bw / 2}" y="8" width="${bw}" height="${H - 16}" rx="6"></rect>`;
    const arrow = (val, i, dir) => {
      const y = 8 + 17 + i * 34;
      const x0 = cx + dir * bw / 2, x1 = x0 + dir * Math.min(110, 14 + val * unit);
      const cls = dir < 0 ? 'fp-l' : 'fp-r';
      const tx = x1 + dir * 6;
      return `<line class="${cls}" x1="${x0}" y1="${y}" x2="${x1 - dir * 8}" y2="${y}" stroke-width="5"></line>
        <polygon class="${cls}" points="${x1},${y} ${x1 - dir * 12},${y - 8} ${x1 - dir * 12},${y + 8}"></polygon>
        <text class="fp-t" x="${tx}" y="${y + 5}" text-anchor="${dir < 0 ? 'end' : 'start'}">${n(val, 2)} N</text>`;
    };
    L.forEach((v, i) => { out += arrow(v, i, -1); });
    R.forEach((v, i) => { out += arrow(v, i, 1); });
    return out + '</svg>';
  }

  // A one-question round: calculate the net force shown in a picture. New values on a miss.
  function netForceExample(title, gen) {
    const sum = a => a.reduce((x, y) => x + y, 0);
    return {
      title, keepSim: true,
      scenario: gen,
      tasks: [{
        type: 'num', unit: 'N', calc: true,
        text: ctx => {
          const { L, R } = ctx.s;
          const desc = (arr, side) => arr.length > 1
            ? `${arr.map(v => n(v, 2) + ' N').join(' and ')} pull to the ${side}`
            : `${n(arr[0], 2)} N pulls to the ${side}`;
          return `${forcePic(L, R)}<p>${desc(L, 'left')}. ${desc(R, 'right')}.<br>What is the <strong>net force</strong>?</p>`;
        },
        answer: ctx => Math.abs(sum(ctx.s.R) - sum(ctx.s.L)),
        diagnose: (v, ctx) => {
          const L = sum(ctx.s.L), R = sum(ctx.s.R), ans = Math.abs(R - L);
          if (near(v, L + R)) return 'Forces in opposite directions cancel. Subtract them. Do not add them all.';
          if (v < 0 && near(-v, ans)) return 'Use bigger − smaller, so the answer is not negative.';
          if (ctx.s.L.length + ctx.s.R.length > 2) return 'First add the forces that point the same way. Then subtract the other side.';
          return null;
        },
        hints: ctx => {
          const { L, R } = ctx.s;
          const big = sum(R) >= sum(L) ? R : L, small = big === R ? L : R;
          const out = [];
          if (L.length > 1 || R.length > 1) {
            const two = L.length > 1 ? L : R;
            out.push(`Two forces point the same way. Add them first: ${two.map(v => n(v, 2)).join(' + ')} = ${n(sum(two), 2)} N`);
          }
          out.push(`The forces point in opposite directions. <span class="formula">Net force = bigger − smaller</span>.`);
          out.push(`Bigger: ${n(sum(big), 2)} N. Smaller: ${n(sum(small), 2)} N.`);
          out.push(`Type ${n(sum(big), 2)} − ${n(sum(small), 2)} into the calculator.`);
          return out;
        },
        explain: ctx => {
          const L = sum(ctx.s.L), R = sum(ctx.s.R);
          return `${n(Math.max(L, R), 2)} N − ${n(Math.min(L, R), 2)} N = <strong>${n(Math.abs(R - L), 2)} N</strong> to the ${R > L ? 'right' : 'left'}.`;
        }
      }]
    };
  }

  // ⭐ Honors: a one-question round where the net force must include its sign (right +, left −).
  function signedExample(title, gen) {
    const sum = a => a.reduce((x, y) => x + y, 0);
    const sgn = v => v > 0 ? `+${n(v, 2)}` : v < 0 ? `−${n(-v, 2)}` : '0';
    const terms = ({ L, R }) => [...R.map(v => `(+${n(v, 2)})`), ...L.map(v => `(−${n(v, 2)})`)].join(' + ');
    // e.g. "0.5 + 3 − 4": right forces added, left forces subtracted
    const typed = ({ L, R }) => [...R.map(v => ['+', v]), ...L.map(v => ['−', v])]
      .map(([op, v], i) => (i === 0 ? (op === '−' ? '−' : '') : ` ${op} `) + n(v, 2)).join('');
    return {
      title, honors: true, keepSim: true,
      scenario: gen,
      tasks: [{
        type: 'num', unit: 'N', calc: true,
        text: ctx => {
          const { L, R } = ctx.s;
          const list = arr => arr.map(v => n(v, 2) + ' N').join(' and ');
          return `${forcePic(L, R)}<p>Pulling right: ${list(R)}. Pulling left: ${list(L)}.<br>
            Right is <strong>+</strong>, left is <strong>−</strong>. What is the <strong>net force</strong>? Include the sign.</p>`;
        },
        answer: ctx => sum(ctx.s.R) - sum(ctx.s.L),
        diagnose: (v, ctx) => {
          const ans = sum(ctx.s.R) - sum(ctx.s.L);
          if (ans !== 0 && near(v, -ans)) return 'Check the sign. Right is +, left is −.';
          if (near(v, sum(ctx.s.R) + sum(ctx.s.L))) return 'Left forces get a minus sign, so they take away from the right forces.';
          return null;
        },
        hints: ctx => [
          'Give every force a sign: forces to the right are +, forces to the left are −.',
          `Write it out: <span class="formula">${terms(ctx.s)}</span>`,
          `Type ${typed(ctx.s)} into the calculator.`
        ],
        explain: ctx => {
          const ans = sum(ctx.s.R) - sum(ctx.s.L);
          const dir = ans > 0 ? `${n(ans, 2)} N to the right` : ans < 0 ? `${n(-ans, 2)} N to the left` : 'balanced: no net force';
          return `<span class="formula">${terms(ctx.s)} = ${sgn(ans)} N</span>. That means ${dir}.`;
        }
      }]
    };
  }

  const LESSONS = {
    // ===================================================================== STEP 1
    step1: {
      badge: 'STEP 1 · INERTIA & FORCES',
      title: 'Inertia, Forces & Balance',
      takeaway: 'With no force pushing or pulling it, a moving cart keeps moving at the same speed. That is <strong>inertia</strong>. An <strong>unbalanced</strong> force makes it speed up. <strong>Balanced</strong> forces cancel out, so the net force is 0 N. <strong class="formula">Net force = bigger force − smaller force</strong>.',
      rounds: [
        {
          title: 'A cart with nothing attached',
          scenario: () => ({ cargo: pick([100, 200, 300]) }),
          setup: s => ({ mL: 0, cargo: s.cargo, mR: 0 }),
          tasks: [
            {
              type: 'info',
              text: () => `<p>Here is a cart on a track. Nothing is attached to it.</p>
                <p>A <strong>force</strong> is a push or a pull. Two pictures under this box show every force on the cart:</p>
                <ul><li><strong>Forces on the cart:</strong> where each push or pull acts.</li>
                <li><strong>Free-body diagram:</strong> the cart is a dot. Each arrow is a force. A longer arrow is a bigger force.</li></ul>`
            },
            {
              type: 'do', run: ['nudge'],
              text: () => 'Press <strong>👉 Nudge</strong> to give the cart one quick tap. Then watch it roll all the way across the track.',
              waiting: 'Press 👉 Nudge, then watch the cart…',
              until: ctx => ctx.p.phase === 'stopped' && gatesDone(ctx.p),
              capture: captureGates
            },
            {
              type: 'mc', run: ['reset', 'nudge'],
              text: ctx => `The cart moved at the <strong>same speed</strong> the whole way. (Gate A: ${n(ctx.s.vA)} m/s. Gate B: ${n(ctx.s.vB)} m/s.)<br>
                <strong>Why</strong> did it keep moving at the same speed?`,
              options: () => [
                { t: 'Inertia. Nothing pushes or pulls it forward or backward, so it keeps moving the same way.', ok: true, why: 'Right! A moving object keeps moving at the same speed unless a force changes it. That is <strong>inertia</strong>. Inertia is not a force.' },
                { t: 'The tap from the nudge keeps pushing it.', why: 'The tap ended right away. Look at the free-body diagram: no arrow points forward.' },
                { t: 'Gravity pulls it forward.', why: 'Gravity (F_g) pulls DOWN, not forward. The track (F_N) pushes up just as hard.' },
                { t: 'Its inertia is a force that pushes it.', why: 'Inertia is not a force, so it has no arrow. It just means the cart keeps doing what it was doing.' }
              ]
            }
          ]
        },
        {
          title: 'An unbalanced force',
          scenario: () => ({ mR: pick([50, 80, 100, 120, 150, 200]), cargo: pick([200, 300]) }),
          setup: s => ({ mL: 0, cargo: s.cargo, mR: s.mR }),
          tasks: [
            {
              type: 'do', run: ['release'],
              text: ctx => `Now a weight hangs from a string on the <strong>right</strong> side. It is <strong>${ctx.s.mR} g</strong>.<br>
                Press <strong>▶ Release</strong>. Watch what the cart does.`,
              waiting: 'Press ▶ Release, then watch the cart…',
              until: ctx => ctx.p.phase === 'stopped'
            },
            {
              type: 'mc', run: ['reset', 'release'],
              text: () => 'How did the cart move?',
              options: () => [
                { t: 'It sped up as it rolled to the right.', ok: true, why: 'Right! It went faster and faster. Speeding up is called <strong>acceleration</strong>.' },
                { t: 'It rolled at the same speed.', why: 'Watch again. It started slow and got faster.' },
                { t: 'It stayed still.', why: 'Watch again. The cart rolled to the right.' }
              ]
            },
            {
              type: 'num', unit: 'N', calc: true, hideValues: true,
              text: ctx => `What pulled the cart to the right? The <strong>weight</strong> of the hanging mass. Weight is a force.<br>
                <strong class="formula">Weight = mass × g</strong><br>
                • mass = <strong>${ctx.s.mR} g</strong><br>• g = <strong>10 m/s²</strong> (the pull of gravity)<br>
                The mass must be in kilograms (kg). How many newtons (N) pulled the cart to the right?`,
              answer: ctx => ctx.s.mR / 100,
              diagnose: (v, ctx) => near(v, ctx.s.mR * 10) ? 'Change grams to kilograms first: divide by 1000.'
                : near(v, ctx.s.mR / 1000) ? 'That is the mass in kg. Now multiply by g = 10.'
                  : near(v, ctx.s.mR) ? 'That is the mass in grams. Change it to kg, then multiply by 10.' : null,
              hints: ctx => [
                `First change grams to kilograms: divide by 1000. ${ctx.s.mR} g ÷ 1000 = <strong>${kg(ctx.s.mR)} kg</strong>`,
                `Now multiply by g: ${kg(ctx.s.mR)} × 10`,
                `Type ${kg(ctx.s.mR)} × 10 into the calculator.`
              ],
              explain: ctx => `${kg(ctx.s.mR)} kg × 10 m/s² = <strong>${n(ctx.s.mR / 100)} N</strong>. Look at the free-body diagram: T_R = ${n(ctx.s.mR / 100)} N. Nothing pulled left, so this <strong>unbalanced</strong> force made the cart speed up.`
            }
          ]
        },
        {
          title: 'Balance the cart',
          scenario: () => ({ mR: pick([60, 80, 120, 150, 180, 200, 240]), cargo: pick([200, 300]) }),
          setup: s => ({ mL: 0, cargo: s.cargo, mR: s.mR }),
          tasks: [
            {
              type: 'do', run: ['release', 'reset'], controls: 'left', maxT: 5,
              text: ctx => `The right weight is <strong>${ctx.s.mR} g</strong>.<br>
                <strong>Your job:</strong> add weight to the <strong>LEFT</strong> string so the cart will NOT move.<br>
                1. Use the buttons to add weight to the left side.<br>
                2. Press <strong>▶ Release</strong>.<br>
                The timer runs for 5 seconds. If the cart stays still, you did it!`,
              waiting: 'Add weight to the left, then press ▶ Release…',
              until: ctx => ctx.p.timeUp && ctx.p.v === 0,
              fail: ctx => {
                const p = ctx.p;
                if (p.phase === 'held' || Math.abs(p.x - NSL.START_X) < 0.03) return null;
                return p.x > NSL.START_X
                  ? `The cart rolled RIGHT. The right side pulled harder. The left side needed MORE weight. (Left: ${p.mL} g, right: ${p.mR} g.)`
                  : `The cart rolled LEFT. The left side pulled harder. The left side needed LESS weight. (Left: ${p.mL} g, right: ${p.mR} g.)`;
              },
              doneText: ctx => `✓ The cart stayed still for 5 seconds! Left: ${ctx.p.mL} g. Right: ${ctx.p.mR} g. The pulls are equal.`
            }
          ]
        },
        {
          title: 'Balanced forces and net force',
          keepSim: true,
          tasks: [
            {
              type: 'info',
              text: () => `<p><strong>Balanced forces</strong></p>
                <p>Your two weights pull with the same force, in opposite directions. The pulls cancel out. Forces like this are <strong>balanced</strong>.</p>
                ${forcePic([2], [2])}
                <p>Balanced forces → the cart does not speed up or slow down.</p>`
            },
            {
              type: 'info',
              text: () => `<p><strong>Net force</strong></p>
                <p>The <strong>net force</strong> is the force that is left over after the forces cancel.</p>
                <p>When two forces pull in <strong>opposite</strong> directions:<br><strong class="formula">Net force = bigger force − smaller force</strong></p>
                ${forcePic([3], [5])}
                <p>5 N − 3 N = <strong>2 N</strong>. The net force points the same way as the bigger force: to the right.</p>
                <p>When forces pull the <strong>same</strong> way, add them: 2 N + 3 N = 5 N.</p>`
            }
          ]
        },
        netForceExample('Example 1 of 3', () => {
          const a = pick([1, 2, 3, 4, 5, 6]), b = a + pick([1, 2, 3, 4, 5]);
          return Math.random() < 0.5 ? { L: [a], R: [b] } : { L: [b], R: [a] };
        }),
        netForceExample('Example 2 of 3', () => {
          const vals = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5];
          let a = pick(vals), b = pick(vals);
          while (a === b) b = pick(vals);
          return { L: [a], R: [b] };
        }),
        netForceExample('Example 3 of 3', () => {
          const a = pick([1, 2, 3]), b = pick([1, 2, 3, 4]);
          let c = pick([2, 3, 4, 5, 6, 7]);
          while (c === a + b) c = pick([2, 3, 4, 5, 6, 7]);
          return Math.random() < 0.5 ? { L: [c], R: [a, b] } : { L: [a, b], R: [c] };
        }),
        // ---------- ⭐ Honors: direction matters (required for Honors periods, optional for others)
        honorsGate('Step 1', 'Direction matters', 'You will use <strong>+</strong> and <strong>−</strong> signs to show which way the net force points.'),
        {
          title: 'Direction matters',
          honors: true, keepSim: true,
          scenario: () => ({ v: pick([1.5, 2, 3, 4.5, 6]) }),
          tasks: [
            {
              type: 'info',
              text: () => `<p><strong>Direction matters</strong></p>
                <p>Physicists use signs to show direction:</p>
                <ul><li>Forces to the <strong>right</strong> are <strong>positive (+)</strong>.</li>
                <li>Forces to the <strong>left</strong> are <strong>negative (−)</strong>.</li></ul>
                <p>To find the <strong>net force</strong>, add up ALL the forces, each with its sign.</p>
                ${forcePic([3], [5])}
                <p><span class="formula">Net force = (+5 N) + (−3 N) = +2 N</span></p>
                <p>The sign of the answer tells the direction: <strong>+2 N</strong> means 2 N to the right. <strong>−2 N</strong> would mean 2 N to the left. <strong>0 N</strong> means balanced.</p>`
            },
            {
              type: 'mc',
              text: ctx => `A cart has a net force of <strong>−${n(ctx.s.v, 2)} N</strong>. Which way does the net force point?`,
              options: () => [
                { t: 'To the left.', ok: true, why: 'Right! The minus sign means left.' },
                { t: 'To the right.', why: 'Right is positive (+). A minus sign (−) means left.' },
                { t: 'It has no direction.', why: 'The sign shows the direction. Minus (−) means left.' }
              ]
            }
          ]
        },
        signedExample('Signed example 1 of 3', () => {
          const a = pick([1, 2, 3, 4, 5]), b = a + pick([1, 2, 3, 4]);
          return { L: [b], R: [a] };              // left wins, so the answer is negative
        }),
        signedExample('Signed example 2 of 3', () => {
          const vals = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];
          const L = [pick(vals)], R = [pick(vals), pick(vals)];
          if (R[0] + R[1] === L[0]) L[0] += 0.5;
          return Math.random() < 0.5 ? { L, R } : { L: R, R: L };
        }),
        signedExample('Signed example 3 of 3', () => {
          // Four forces; one time in three they balance exactly (net force 0 N)
          const vals = [0.5, 1, 1.5, 2, 2.5, 3];
          const L = [pick(vals), pick(vals)];
          let R = [pick(vals), pick(vals)];
          if (Math.random() < 1 / 3 && L[0] + L[1] > 1.5) R = [L[0] + L[1] - 1, 1];
          return { L, R };
        })
      ]
    },

    // ===================================================================== STEP 2
    step2: {
      badge: 'STEP 2 · ISOLATE FORCE',
      title: 'Unbalance the Forces',
      takeaway: 'An unbalanced (net) force makes the cart speed up. When the mass stays the same, <strong class="formula">more net force = more acceleration</strong>. Double the force, double the acceleration.',
      rounds: [
        {
          title: 'Unbalance the pulls',
          scenario: () => {
            const dm = pick([20, 40, 60, 80, 100, 120]);
            return { dm, mL: 100 - dm / 2, mR: 100 + dm / 2, cargo: 200 };
          },
          setup: s => ({ mL: s.mL, cargo: s.cargo, mR: s.mR }),
          tasks: [
            {
              type: 'info',
              text: () => `<p><strong>New rule:</strong> the total mass always stays <strong>500 g</strong>. We only move weights from one place to another. We never add or take away.</p>
                <p>That way, only the <strong>force</strong> changes. This makes it a fair test.</p>`
            },
            {
              type: 'mc',
              text: ctx => `The left weight is <strong>${ctx.s.mL} g</strong>. The right weight is <strong>${ctx.s.mR} g</strong>. A hand holds the cart still. When you let go, which way will the cart go?`,
              options: () => [
                { t: 'To the right.', ok: true, why: 'Right! The right weight is heavier, so it pulls harder. Compare the arrows.' },
                { t: 'To the left.', why: 'Look at the weights. The right one is heavier, so it pulls harder.' },
                { t: 'It won\'t move.', why: 'The pulls are not equal now. Compare the T_L and T_R arrows.' }
              ]
            },
            {
              type: 'num', unit: 'N', calc: true, hideValues: ['F_hand', 'sum'],
              text: () => `Look at the <strong>free-body diagram</strong>. Read the two string pulls.<br>
                What is the <strong>net force</strong>?<br><strong class="formula">Net force = bigger pull − smaller pull</strong>`,
              answer: ctx => ctx.s.dm / 100,
              diagnose: (v, ctx) => near(v, (ctx.s.mL + ctx.s.mR) / 100) ? 'The pulls go opposite ways, so subtract. Do not add.'
                : near(v, ctx.s.dm) ? 'Use the forces in newtons (N) from the diagram, not the masses in grams.' : null,
              hints: ctx => [
                'Find T_R and T_L on the free-body diagram (the picture with the dot).',
                `T_R = ${n(ctx.s.mR / 100)} N and T_L = ${n(ctx.s.mL / 100)} N.`,
                `Type ${n(ctx.s.mR / 100)} − ${n(ctx.s.mL / 100)} into the calculator.`
              ],
              explain: ctx => `${n(ctx.s.mR / 100)} N − ${n(ctx.s.mL / 100)} N = <strong>${n(ctx.s.dm / 100)} N</strong> to the right. Right now the hand holds the cart back with that much force (F_hand). When you let go, this force speeds up the cart AND both weights.`
            },
            {
              type: 'info',
              text: () => `<p><strong>📏 What is a photogate?</strong> It is a speed timer. It shines a thin beam of light across the track.</p>
                <p>The cart has a purple flag on top. The flag is <strong>5.0 cm</strong> long. When the flag goes through the gate, it blocks the light. The gate times how long the light is blocked, then shows the cart's speed.</p>
                <p>Fast cart → short time. Slow cart → long time.</p>
                <p>This track has two photogates: <strong>Gate A</strong> and <strong>Gate B</strong>. Their readings show in the strip under the track.</p>`
            },
            {
              type: 'do', run: ['release'],
              text: () => 'Press <strong>▶ Release</strong>. Let the cart roll through both photogates.',
              waiting: 'Waiting for the cart to roll through Gate A and Gate B…',
              until: ctx => gatesDone(ctx.p),
              capture: captureGates
            },
            {
              type: 'num', unit: 'm/s²', calc: true,
              text: ctx => `The photogates measured:<br>
                • Gate A speed: <strong>${n(ctx.s.vA)} m/s</strong><br>
                • Gate B speed: <strong>${n(ctx.s.vB)} m/s</strong><br>
                • Time from Gate A to Gate B: <strong>${n(ctx.s.dt)} s</strong><br>
                Find the <strong>acceleration</strong>.<br><strong class="formula">Acceleration = change in speed ÷ time</strong>`,
              answer: ctx => (ctx.s.vB - ctx.s.vA) / ctx.s.dt,
              tol: 0.03,
              diagnose: (v, ctx) => near(v, ctx.s.vB - ctx.s.vA) ? 'That is the change in speed. Now divide it by the time.'
                : near(v, ctx.s.vB / ctx.s.dt) ? 'Use the CHANGE in speed: Gate B speed − Gate A speed.'
                  : near(v, (ctx.s.vB + ctx.s.vA) / ctx.s.dt) ? 'Subtract the speeds. Do not add them.'
                    : near(v, ctx.s.vB - ctx.s.vA / ctx.s.dt) ? 'Put ( ) around the subtraction, so it happens first.' : null,
              hints: ctx => [
                'Acceleration tells how fast the speed changes.',
                `<span class="formula">Change in speed = Gate B speed − Gate A speed</span><br><span class="formula">= ${n(ctx.s.vB)} − ${n(ctx.s.vA)}</span>`,
                `Then divide by the time: ${n(ctx.s.dt)} s.`,
                `Type (${n(ctx.s.vB)} − ${n(ctx.s.vA)}) ÷ ${n(ctx.s.dt)} into the calculator. Use the ( ) keys!`
              ],
              explain: ctx => `Acceleration = (${n(ctx.s.vB)} − ${n(ctx.s.vA)}) ÷ ${n(ctx.s.dt)} = <strong>${n((ctx.s.vB - ctx.s.vA) / ctx.s.dt, 2)} m/s²</strong>. This is trial 1 in your data table.`,
              onCorrect: app => app.recordTrial(true)
            }
          ]
        },
        {
          title: 'Collect data',
          keepSim: true, graph: true,
          scenario: () => ({ k: pick([2, 3, 4]), ti: Math.floor(Math.random() * 100), Fq: pick([0.3, 0.5, 0.7, 0.9, 1.1]) }),
          tasks: [
            {
              type: 'do', run: ['release', 'reset', 'record'], controls: 'transfer',
              text: ctx => {
                const count = new Set(ctx.trials.map(t => t.F.toFixed(3))).size;
                return `<p>Now collect more data:</p>
                  <ol><li>Move weights with the buttons.</li><li>Press <strong>▶ Release</strong>.</li><li>Press <strong>📋 Record Trial</strong>.</li></ol>
                  <p>Get <strong>4 trials</strong> with different net forces. The app finds the acceleration for you now. <span class="progress-count">${Math.min(count, 4)}/4</span></p>`;
              },
              waiting: 'Record 4 trials with different forces…',
              until: ctx => new Set(ctx.trials.map(t => t.F.toFixed(3))).size >= 4
            },
            {
              type: 'mc',
              text: () => 'Look at the graph. Each dot is one trial. What shape do the dots make?',
              options: () => [
                { t: 'A straight line that starts at 0.', ok: true, why: 'Right! Double the force → double the acceleration.' },
                { t: 'A curve that flattens out.', why: 'Look again. The dots line up on the dashed straight line.' },
                { t: 'A flat line.', why: 'Look again. The dots go up as the force goes up.' },
                { t: 'No pattern.', why: 'Look again. The dots line up on the dashed line.' }
              ]
            },
            {
              type: 'num', unit: 'm/s²', calc: true,
              text: ctx => {
                const t = ctx.pickTrial(ctx.s.ti);
                return `One trial had a net force of <strong>${n(t.F, 2)} N</strong> and an acceleration of <strong>${n(t.a, 2)} m/s²</strong>.<br>
                  What if the net force were <strong>${ctx.s.k} times bigger</strong>? The mass stays the same. Predict the new acceleration.`;
              },
              answer: ctx => +ctx.pickTrial(ctx.s.ti).a.toFixed(2) * ctx.s.k,
              diagnose: (v, ctx) => {
                const a = +ctx.pickTrial(ctx.s.ti).a.toFixed(2);
                if (near(v, a / ctx.s.k)) return 'More force means MORE acceleration, not less.';
                if (near(v, a)) return 'The force changed, so the acceleration changes too.';
                return null;
              },
              hints: ctx => {
                const a = n(+ctx.pickTrial(ctx.s.ti).a.toFixed(2), 2);
                return [
                  'The graph is a straight line. So the acceleration grows the same way the force grows.',
                  `${ctx.s.k} times the force → ${ctx.s.k} times the acceleration.`,
                  `Type ${a} × ${ctx.s.k} into the calculator.`
                ];
              },
              explain: ctx => `${ctx.s.k} times the force → ${ctx.s.k} times the acceleration: ${n(+ctx.pickTrial(ctx.s.ti).a.toFixed(2) * ctx.s.k, 2)} m/s².`
            },
            {
              type: 'num', unit: 'm/s²', calc: true,
              text: ctx => `<strong>Challenge:</strong> the total mass is 0.500 kg. The net force is <strong>${n(ctx.s.Fq, 2)} N</strong>. Predict the acceleration.<br>
                <strong class="formula">Acceleration = net force ÷ mass</strong>`,
              answer: ctx => ctx.s.Fq / 0.5,
              diagnose: (v, ctx) => near(v, ctx.s.Fq * 0.5) ? 'Divide by the mass. Do not multiply.' : near(v, ctx.s.Fq / 500) ? 'Use the mass in kg: 0.500 kg.' : null,
              hints: ctx => [
                'Divide the force by the mass.',
                `Type ${n(ctx.s.Fq, 2)} ÷ 0.5 into the calculator.`
              ],
              explain: ctx => `${n(ctx.s.Fq, 2)} N ÷ 0.500 kg = ${n(ctx.s.Fq / 0.5, 2)} m/s².`
            }
          ]
        },
        // ---------- ⭐ Honors: negative acceleration (required for Honors periods, optional for others)
        honorsGate('Step 2', 'Slowing down', 'You will see what a <strong>negative</strong> acceleration looks like, then predict acceleration with its sign.'),
        {
          title: 'Slowing down',
          honors: true,
          scenario: () => ({ cargo: pick([200, 300]) }),
          setup: s => ({ mL: 110, cargo: s.cargo, mR: 100 }),
          tasks: [
            {
              type: 'do', run: ['nudge'], nudgeV: 0.75,
              text: () => 'Now the <strong>left</strong> weight is a little heavier: 110 g on the left, 100 g on the right.<br>Press <strong>👉 Big Nudge</strong> to push the cart to the RIGHT. Watch its speed.',
              waiting: 'Press 👉 Big Nudge, then watch the cart…',
              until: ctx => gatesDone(ctx.p) && (ctx.p.v < 0 || ctx.p.phase === 'stopped'),
              capture: captureGates
            },
            {
              type: 'mc', run: ['reset', 'nudge'], nudgeV: 0.75,
              text: () => 'The cart started out moving to the RIGHT. What happened next?',
              options: () => [
                { t: 'It slowed down, stopped, then rolled back to the left.', ok: true, why: 'Right! The net force pointed LEFT the whole time. First it slowed the cart down, then it pulled the cart back.' },
                { t: 'It kept the same speed.', why: 'Watch again, and compare the Gate A and Gate B speeds.' },
                { t: 'It sped up to the right.', why: 'Watch again. Gate B measured a slower speed than Gate A.' }
              ]
            },
            {
              type: 'num', unit: 'm/s²', calc: true,
              text: ctx => `The photogates measured the cart going right:<br>
                • Gate A speed: <strong>${n(ctx.s.vA)} m/s</strong><br>
                • Gate B speed: <strong>${n(ctx.s.vB)} m/s</strong><br>
                • Time from Gate A to Gate B: <strong>${n(ctx.s.dt)} s</strong><br>
                Find the acceleration. <strong>Keep the sign!</strong><br><strong class="formula">Acceleration = (v_B − v_A) ÷ time</strong>`,
              answer: ctx => (ctx.s.vB - ctx.s.vA) / ctx.s.dt,
              tol: 0.03,
              diagnose: (v, ctx) => {
                const a = (ctx.s.vB - ctx.s.vA) / ctx.s.dt;
                if (near(v, -a, 0.03)) return 'Check the sign. The cart got SLOWER, so v_B − v_A is negative.';
                if (near(v, ctx.s.vB - ctx.s.vA)) return 'That is the change in speed. Now divide it by the time.';
                return null;
              },
              hints: ctx => [
                'Change in speed = Gate B speed − Gate A speed. The cart slowed down, so this is negative.',
                `<span class="formula">${n(ctx.s.vB)} − ${n(ctx.s.vA)} = ${sgn(ctx.s.vB - ctx.s.vA, 3)} m/s</span>`,
                `Type (${n(ctx.s.vB)} − ${n(ctx.s.vA)}) ÷ ${n(ctx.s.dt)} into the calculator.`
              ],
              explain: ctx => `a = <strong>${sgn((ctx.s.vB - ctx.s.vA) / ctx.s.dt)} m/s²</strong>. The minus sign means the acceleration points <strong>left</strong>.`
            },
            {
              type: 'mc',
              text: () => 'The cart was moving <strong>right</strong>, but its acceleration was <strong>negative</strong>. What does that tell you?',
              options: () => [
                { t: 'The net force points left, so it slows down a cart that is moving right.', ok: true, why: 'Right! Acceleration points the same way as the net force. That is not always the way the cart is moving.' },
                { t: 'The cart must be moving to the left.', why: 'It was moving right. A negative acceleration can slow down a cart that is moving right.' },
                { t: 'The cart is running out of force.', why: 'Objects do not "run out" of force. A net force pointing left slowed it down.' }
              ]
            }
          ]
        },
        {
          title: 'Predict with signs',
          honors: true, keepSim: true,
          scenario: () => {
            const opts = [60, 80, 100, 120, 140, 160];
            const mL = pick(opts);
            let mR = pick(opts);
            while (mR === mL) mR = pick(opts);
            return { mL, mR, cart: pick([200, 300, 400]) };
          },
          tasks: [{
            type: 'num', unit: 'm/s²', calc: true,
            text: ctx => `Predict the acceleration, <strong>with its sign</strong> (right +, left −).<br>
              • left weight: <strong>${ctx.s.mL} g</strong><br>• cart: <strong>${ctx.s.cart} g</strong><br>• right weight: <strong>${ctx.s.mR} g</strong><br>
              Use g = 10 m/s².`,
            answer: ctx => ((ctx.s.mR - ctx.s.mL) / 100) / ((ctx.s.mL + ctx.s.cart + ctx.s.mR) / 1000),
            diagnose: (v, ctx) => {
              const F = (ctx.s.mR - ctx.s.mL) / 100, M = (ctx.s.mL + ctx.s.cart + ctx.s.mR) / 1000;
              if (near(v, -F / M)) return 'Check the sign. Which weight is heavier? That is the direction of the net force.';
              if (near(v, F / (ctx.s.cart / 1000))) return 'Divide by the TOTAL mass: the cart and both hanging weights.';
              return null;
            },
            hints: ctx => {
              const F = (ctx.s.mR - ctx.s.mL) / 100, Mg = ctx.s.mL + ctx.s.cart + ctx.s.mR;
              return [
                'Net force = right weight − left weight, and weight = mass × g.',
                `<span class="formula">Net force = (${kg(ctx.s.mR)} − ${kg(ctx.s.mL)}) × 10 = ${sgn(F)} N</span>`,
                `<span class="formula">Total mass = ${ctx.s.mL} + ${ctx.s.cart} + ${ctx.s.mR} = ${Mg} g = ${kg(Mg)} kg</span>`,
                `Type ${F < 0 ? '−' : ''}${n(Math.abs(F), 2)} ÷ ${kg(Mg)} into the calculator.`
              ];
            },
            explain: ctx => {
              const F = (ctx.s.mR - ctx.s.mL) / 100, M = (ctx.s.mL + ctx.s.cart + ctx.s.mR) / 1000;
              return `<span class="formula">a = ${sgn(F)} N ÷ ${n(M, 3)} kg = ${sgn(F / M)} m/s²</span>. The cart speeds up to the ${F > 0 ? 'right' : 'left'}.`;
            }
          }]
        }
      ]
    },

    // ===================================================================== STEP 3
    step3: {
      badge: 'STEP 3 · ISOLATE MASS',
      title: 'Change the Resistance',
      takeaway: 'Mass resists changes in motion. That is inertia. With the same pull, <strong class="formula">more mass = less acceleration</strong>. Double the mass, half the acceleration. The hanging weights speed up too, so their mass counts.',
      rounds: [
        {
          title: 'Predict, then test',
          scenario: () => ({ cargo: pick([0, 100, 150, 250, 350, 600]) }),
          setup: s => ({ mL: 50, cargo: s.cargo, mR: 100 }),
          tasks: [
            {
              type: 'info',
              text: () => `<p><strong>New rule:</strong> the pull stays the same every time. The right weight is always 50 g heavier than the left. So the net force is always <strong>0.50 N</strong>.</p>
                <p>This time we change the <strong>mass</strong>. Does more mass change the acceleration?</p>`
            },
            {
              type: 'num', unit: 'kg', calc: true, hideValues: true,
              text: ctx => `When the cart moves, the weights move too. Everything on the string speeds up together.<br>
                Add up ALL the mass:<br>• left weight: 50 g<br>• cart: ${100 + ctx.s.cargo} g<br>• right weight: 100 g<br>
                Give your answer in <strong>kilograms (kg)</strong>.`,
              answer: ctx => (250 + ctx.s.cargo) / 1000,
              diagnose: (v, ctx) => near(v, (100 + ctx.s.cargo) / 1000) ? 'The weights speed up too, so add their mass as well!'
                : near(v, 250 + ctx.s.cargo) ? 'That is in grams. Change it to kilograms: divide by 1000.' : null,
              hints: ctx => [
                `Add the three masses: 50 + ${100 + ctx.s.cargo} + 100`,
                `That is ${250 + ctx.s.cargo} grams.`,
                'To change grams to kilograms, divide by 1000.',
                `Type ${250 + ctx.s.cargo} ÷ 1000 into the calculator.`
              ],
              explain: ctx => `50 + ${100 + ctx.s.cargo} + 100 = ${250 + ctx.s.cargo} g = <strong>${kg(250 + ctx.s.cargo)} kg</strong>.`
            },
            {
              type: 'num', unit: 'm/s²', calc: true,
              text: ctx => `Predict the acceleration before you test it.<br>
                • Net force: <strong>0.50 N</strong><br>• Total mass: <strong>${kg(250 + ctx.s.cargo)} kg</strong><br>
                <strong class="formula">Acceleration = net force ÷ mass</strong>`,
              answer: ctx => 0.5 / ((250 + ctx.s.cargo) / 1000),
              diagnose: (v, ctx) => near(v, 0.5 / ((100 + ctx.s.cargo) / 1000)) ? 'Divide by the TOTAL mass, with both weights included.'
                : near(v, 0.5 * (250 + ctx.s.cargo) / 1000) ? 'Divide by the mass. Do not multiply.' : null,
              hints: ctx => [
                'Divide the force by the mass.',
                `Type 0.5 ÷ ${kg(250 + ctx.s.cargo)} into the calculator.`
              ],
              explain: ctx => `0.50 N ÷ ${kg(250 + ctx.s.cargo)} kg = <strong>${n(0.5 / ((250 + ctx.s.cargo) / 1000), 2)} m/s²</strong>. Now let's test it.`
            },
            {
              type: 'do', run: ['release'],
              text: () => 'Press <strong>▶ Release</strong> to test your prediction.',
              waiting: 'Waiting for the cart to roll through Gate A and Gate B…',
              until: ctx => gatesDone(ctx.p),
              capture: ctx => { captureGates(ctx); ctx.s.meas = (ctx.s.vB - ctx.s.vA) / ctx.s.dt; },
              onDone: app => app.recordTrial(true)
            },
            {
              type: 'info',
              text: ctx => `<p>The photogates measured <strong>${n(ctx.s.meas, 2)} m/s²</strong>.<br>You predicted <strong>${n(0.5 / ((250 + ctx.s.cargo) / 1000), 2)} m/s²</strong>.</p>
                <p>✓ You predicted the motion before it happened! This run is trial 1 in your data table.</p>`
            }
          ]
        },
        {
          title: 'Collect data',
          keepSim: true, graph: true,
          scenario: () => ({ k: pick([2, 3, 4]), a0: pick([0.6, 1.2, 1.8, 2.4]) }),
          tasks: [
            {
              type: 'do', run: ['release', 'reset', 'record'], controls: 'cargo',
              text: ctx => {
                const count = new Set(ctx.trials.map(t => t.M.toFixed(3))).size;
                return `<p>Now change the mass and collect data:</p>
                  <ol><li>Load cargo into the cart, or add the same weight to both sides.</li><li>Press <strong>▶ Release</strong>.</li><li>Press <strong>📋 Record Trial</strong>.</li></ol>
                  <p>Get <strong>4 trials</strong> with different total masses. <span class="progress-count">${Math.min(count, 4)}/4</span></p>`;
              },
              waiting: 'Record 4 trials with different total masses…',
              until: ctx => new Set(ctx.trials.map(t => t.M.toFixed(3))).size >= 4
            },
            {
              type: 'mc',
              text: () => 'Look at the graph. As the mass gets bigger, the acceleration…',
              options: () => [
                { t: 'gets smaller.', ok: true, why: 'Right! <span class="formula">More mass = more inertia = less acceleration</span>.' },
                { t: 'gets bigger.', why: 'Look again. The heavier trials are on the right, and they are LOWER.' },
                { t: 'stays the same.', why: 'Look again. The dots are not all at the same height.' }
              ]
            },
            {
              type: 'do', graphSwitch: true,
              text: () => 'This graph curves, so it is hard to read. Click the <strong>a vs 1/M_total</strong> button above the graph.',
              waiting: 'Waiting for you to switch the graph…',
              until: ctx => ctx.graphMode === 'inv'
            },
            {
              type: 'mc',
              text: () => 'Now what shape do the dots make?',
              options: () => [
                { t: 'A straight line that starts at 0.', ok: true, why: 'Right! Double the mass → half the acceleration.' },
                { t: 'A curve.', why: 'Look again. The dots now fall on the dashed straight line.' },
                { t: 'A flat line.', why: 'Look again. The dots are at different heights.' }
              ]
            },
            {
              type: 'num', unit: 'm/s²', calc: true,
              text: ctx => `<strong>Challenge:</strong> a cart speeds up at <strong>${n(ctx.s.a0)} m/s²</strong>. Now its mass is <strong>${ctx.s.k} times bigger</strong>. The pull is the same. What is the new acceleration?`,
              answer: ctx => ctx.s.a0 / ctx.s.k,
              diagnose: (v, ctx) => near(v, ctx.s.a0 * ctx.s.k) ? 'More mass means LESS acceleration.' : near(v, ctx.s.a0) ? 'The mass changed, so the acceleration changes too.' : null,
              hints: ctx => [
                'More mass means less acceleration.',
                `${ctx.s.k} times the mass → divide the acceleration by ${ctx.s.k}.`,
                `Type ${n(ctx.s.a0)} ÷ ${ctx.s.k} into the calculator.`
              ],
              explain: ctx => `${ctx.s.k} times the mass → divide by ${ctx.s.k}: ${n(ctx.s.a0 / ctx.s.k, 2)} m/s².`
            }
          ]
        },
        // ---------- ⭐ Honors: find a hidden mass (required for Honors periods, optional for others)
        honorsGate('Step 3', 'Mystery cargo', 'You will work backward: use the cart\'s motion to find a <strong>hidden mass</strong>.'),
        {
          title: 'Mystery cargo',
          honors: true,
          scenario: () => ({ cargo: pick([150, 250, 400, 550, 700]) }),
          setup: s => ({ mL: 50, cargo: s.cargo, mR: 100 }),
          tasks: [
            {
              type: 'do', run: ['release'], hideCartMass: true, hideValues: true,
              text: () => 'Someone loaded <strong>mystery cargo</strong> into the cart. Its mass is hidden. The pull is still the same: net force = <strong>0.50 N</strong>.<br>Press <strong>▶ Release</strong>.',
              waiting: 'Waiting for the cart to roll through Gate A and Gate B…',
              until: ctx => gatesDone(ctx.p),
              capture: ctx => { captureGates(ctx); ctx.s.a = +((ctx.s.vB - ctx.s.vA) / ctx.s.dt).toFixed(3); }
            },
            {
              type: 'num', unit: 'm/s²', calc: true, hideCartMass: true, hideValues: true,
              text: ctx => `First, find the acceleration:<br>
                • Gate A speed: <strong>${n(ctx.s.vA)} m/s</strong><br>• Gate B speed: <strong>${n(ctx.s.vB)} m/s</strong><br>• Time from Gate A to Gate B: <strong>${n(ctx.s.dt)} s</strong><br>
                <strong class="formula">Acceleration = (v_B − v_A) ÷ time</strong>`,
              answer: ctx => (ctx.s.vB - ctx.s.vA) / ctx.s.dt,
              tol: 0.03,
              diagnose: (v, ctx) => near(v, ctx.s.vB - ctx.s.vA) ? 'That is the change in speed. Now divide it by the time.' : null,
              hints: ctx => [
                `Change in speed = ${n(ctx.s.vB)} − ${n(ctx.s.vA)}`,
                `Type (${n(ctx.s.vB)} − ${n(ctx.s.vA)}) ÷ ${n(ctx.s.dt)} into the calculator.`
              ],
              explain: ctx => `a = <strong>${n(ctx.s.a, 3)} m/s²</strong>.`
            },
            {
              type: 'num', unit: 'kg', calc: true, hideCartMass: true, hideValues: true,
              text: ctx => `Newton's 2nd Law works backward too:<br><strong class="formula">total mass = net force ÷ acceleration</strong><br>
                Net force = <strong>0.50 N</strong>. Acceleration = <strong>${n(ctx.s.a, 3)} m/s²</strong>. Find the total mass in kg.`,
              answer: ctx => 0.5 / ctx.s.a,
              tol: 0.03,
              diagnose: (v, ctx) => near(v, ctx.s.a / 0.5, 0.03) ? 'Flip it: net force ÷ acceleration.' : near(v, 0.5 * ctx.s.a, 0.03) ? 'Divide. Do not multiply.' : null,
              hints: ctx => [
                'Divide the net force by the acceleration.',
                `Type 0.5 ÷ ${n(ctx.s.a, 3)} into the calculator.`
              ],
              explain: ctx => `Total mass = 0.50 N ÷ ${n(ctx.s.a, 3)} m/s² ≈ <strong>${n(0.5 / ctx.s.a, 3)} kg</strong>.`
            },
            {
              type: 'num', unit: 'g', calc: true, hideCartMass: true, hideValues: true, revealOnCorrect: true,
              tol: 0.05,
              text: ctx => `That total includes both hanging weights: 50 g + 100 g = 150 g.<br>
                How many <strong>grams</strong> is the cart with its mystery cargo?`,
              answer: ctx => 0.5 / ctx.s.a * 1000 - 150,
              diagnose: (v, ctx) => {
                const M = 0.5 / ctx.s.a;
                if (near(v, M - 0.15, 0.05) || near(v, M, 0.05)) return 'Answer in grams: multiply kilograms by 1000.';
                if (near(v, M * 1000, 0.03)) return 'Take away the two hanging weights (150 g). They are not part of the cart.';
                return null;
              },
              hints: ctx => [
                `Change the total mass to grams: ${n(0.5 / ctx.s.a, 3)} kg × 1000 = ${n(0.5 / ctx.s.a * 1000, 0)} g`,
                'Then take away the hanging weights: 150 g.',
                `Type ${n(0.5 / ctx.s.a * 1000, 0)} − 150 into the calculator.`
              ],
              explain: ctx => `About ${n(0.5 / ctx.s.a * 1000 - 150, 0)} g. The real cart was <strong>${100 + ctx.s.cargo} g</strong> (look at the cart now). You found a hidden mass using only its motion!`
            }
          ]
        },
        {
          title: 'Same force, different mass',
          honors: true, keepSim: true,
          scenario: () => ({ k: pick([2, 3, 4, 5]), aB: pick([0.4, 0.5, 0.6, 0.8]) }),
          tasks: [{
            type: 'num', unit: 'times', calc: true,
            text: ctx => `Cart A and cart B feel the <strong>same net force</strong>.<br>
              • Cart A accelerates at <strong>${n(ctx.s.aB * ctx.s.k, 2)} m/s²</strong>.<br>• Cart B accelerates at <strong>${n(ctx.s.aB, 2)} m/s²</strong>.<br>
              How many times more mass does cart B have than cart A?`,
            answer: ctx => ctx.s.k,
            diagnose: (v, ctx) => near(v, 1 / ctx.s.k) ? 'Cart B speeds up less, so it has MORE mass. Flip your division.' : null,
            hints: ctx => [
              'Same force: less acceleration means more mass.',
              `Compare the accelerations: ${n(ctx.s.aB * ctx.s.k, 2)} ÷ ${n(ctx.s.aB, 2)}`,
              `Type ${n(ctx.s.aB * ctx.s.k, 2)} ÷ ${n(ctx.s.aB, 2)} into the calculator.`
            ],
            explain: ctx => `Cart A's acceleration is ${ctx.s.k} times bigger, so cart B has <strong>${ctx.s.k} times</strong> the mass. Same force: a ∝ 1 / mass.`
          }]
        }
      ]
    }
  };

  window.LESSONS = LESSONS;
  window.LessonUtil = { near };
})();
