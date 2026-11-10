// Centripetal Force Lab — the order of the lesson for each class.
// Every page ends with something to do: aim an arrow, run the table, read the dial, plot a point, or calculate.
// Page kinds are drawn and checked by app.js.

(function () {
  const FL = window.FL;
  const PARTS = [
    { id: 'pull', name: 'The Pull', icon: '🧵', weight: 1 },
    { id: 'measure', name: 'Measure', icon: '📏', weight: 2 },
    { id: 'graph', name: 'Graph It', icon: '📈', weight: 2 },
    { id: 'who', name: 'Who Pulls?', icon: '🔎', weight: 1 },
    { id: 'much', name: 'How Much?', icon: '🧮', weight: 1 },
    { id: 'quiz', name: 'Mastery Check', icon: '🏁', weight: 0 }
  ];
  const PART_POINTS = 6, QUIZ_POINTS = 4;
  const TOTAL_WEIGHT = PARTS.reduce((s, p) => s + p.weight, 0);

  const PULL = [
    { id: 'p_predict', kind: 'aim', what: 'force', ungraded: true, title: 'Predict: which way is the pull?',
      text: 'A puck slides around a circle on an air table. A string holds it. Which way does the net force on the puck point? Click the picture to aim an arrow from the puck. This one is not graded.' },
    { id: 'p_run', kind: 'run', need: 4, title: 'Test your prediction',
      text: 'Set the speed to 4 m/s and press Run. Watch the string and the force dial.' },
    { id: 'p_aim', kind: 'aim', what: 'force', title: 'Aim the net force',
      text: 'The puck is at a new spot. Click the picture to aim the net force on the puck.' },
    { id: 'p_cut', kind: 'cut', title: 'Take the force away',
      text: 'Pick any speed and press Run. While the puck is moving, press Cut the string. Watch the dial and the path.' },
    { id: 'p_path', kind: 'aim', what: 'path', title: 'Where does it go?',
      text: 'The string is cut when the puck is right here. Click the picture to aim the path the puck takes.' }
  ];

  const trials = tier => Array.from({ length: FL.TRIALS[tier] }, (_, i) => ({ id: `t${i + 1}`, kind: 'trial', n: i + 1, title: `Trial ${i + 1}` }));
  const plots = tier => Array.from({ length: FL.TRIALS[tier] }, (_, i) => ({ id: `pl${i + 1}`, kind: 'plot', n: i + 1, title: `Plot Trial ${i + 1}` }));

  const PAPER = { id: 'g_paper', kind: 'paper', title: 'Write it down' };
  const GRAPH = {
    conceptual: [
      { id: 'g_factor2', kind: 'ask', q: 'factor2', pic: 'graph', title: 'Twice as fast' },
      { id: 'g_factor3', kind: 'ask', q: 'factor3', pic: 'graph', title: '3 times as fast' },
      { id: 'g_pfactor', kind: 'ask', q: 'pfactor', pic: 'graph', title: 'A speed you did not test' },
      { id: 'g_predict', kind: 'ask', q: 'predictC', pic: 'graph', title: 'Make your prediction' },
      { id: 'g_test', kind: 'test', title: 'Test your prediction' },
      PAPER
    ],
    cp: [
      { id: 'g_slope', kind: 'slope', title: 'Find the slope' },
      { id: 'g_weigh', kind: 'weigh', title: 'What is the slope?' },
      { id: 'g_predict', kind: 'ask', q: 'predictCP', pic: 'lab', title: 'A speed you did not test' },
      { id: 'g_test', kind: 'test', title: 'Test your prediction' },
      PAPER
    ],
    honors: [
      { id: 'g_straight', kind: 'axis', title: 'Straighten the curve' },
      { id: 'g_slope', kind: 'slope', title: 'Find the slope' },
      { id: 'g_mass', kind: 'ask', q: 'massFromSlope', pic: 'graph', title: 'Find the mass' },
      { id: 'g_weigh', kind: 'weigh', title: 'Check the mass' },
      { id: 'g_break', kind: 'ask', q: 'breakSpeed', pic: 'lab', title: 'How fast before it snaps?' },
      { id: 'g_test', kind: 'snap', title: 'Test your prediction' },
      PAPER
    ]
  };

  const WHO = FL.MAIN_STATIONS.map(st => ({ id: `s_${st}`, kind: 'station', st, title: 'What does the pulling?' }))
    .concat([{ id: 'who_aim', kind: 'aim', what: 'force', station: true, title: 'Aim the net force',
      text: 'A new one. Click the picture to aim the net force on it.' }]);

  const MUCH = {
    conceptual: [{ id: 'm1', kind: 'problem', gen: 'compare' }, { id: 'm2', kind: 'problem', gen: 'compare' }],
    cp: [{ id: 'm1', kind: 'problem', gen: 'fnet', skin: 'rope' }, { id: 'm2', kind: 'problem', gen: 'fnet', skin: 'car' }, { id: 'm3', kind: 'problem', gen: 'fnet', skin: 'ride' }],
    honors: [{ id: 'm1', kind: 'problem', gen: 'fnet', skin: 'ride' }, { id: 'm2', kind: 'problem', gen: 'vmax', skin: 'rope' }, { id: 'm3', kind: 'problem', gen: 'vmax', skin: 'car' }]
  };
  MUCH.conceptual.concat(MUCH.cp, MUCH.honors).forEach((p, i) => { p.title = 'How much pull?'; });

  function pages(partId, tier) {
    if (partId === 'pull') return PULL;
    if (partId === 'measure') return trials(tier);
    if (partId === 'graph') return plots(tier).concat(GRAPH[tier]);
    if (partId === 'who') return WHO;
    if (partId === 'much') return MUCH[tier];
    return [];
  }

  const partProgress = (st, id, tier) => {
    const p = st.parts[id];
    if (!p) return 0;
    if (p.done) return 1;
    const n = pages(id, tier).length;
    return n ? Math.min(1, (p.far || 0) / n) : 0;
  };
  function earnedPoints(st, tier) {
    const guided = PARTS.reduce((s, p) => s + (p.weight / TOTAL_WEIGHT) * PART_POINTS * partProgress(st, p.id, tier), 0);
    return guided + QUIZ_POINTS * ((st.quiz && st.quiz.best) || 0) / 100;
  }

  window.Lesson = { PARTS, PART_POINTS, QUIZ_POINTS, pages, partProgress, earnedPoints };
})();
