// Mechanical Work Studio — the order of the lesson for each class.
// Every page ends with something to do: aim an arrow, run the hoist, read an instrument, plot a point, or calculate.
// Page kinds are drawn and checked by the app-*.js files.

(function () {
  const FL = window.FL;
  const PARTS = [
    { id: 'dir', name: 'Direction Check', icon: '🧭', weight: 1 },
    { id: 'measure', name: 'Measure', icon: '📏', weight: 2 },
    { id: 'graph', name: 'Graph It', icon: '📈', weight: 2 },
    { id: 'much', name: 'How Much?', icon: '🧮', weight: 2 },
    { id: 'quiz', name: 'Mastery Check', icon: '🏁', weight: 0 }
  ];
  const PART_POINTS = 6, QUIZ_POINTS = 4;
  const TOTAL_WEIGHT = PARTS.reduce((s, p) => s + p.weight, 0);

  const DIR = [
    { id: 'd_predict', kind: 'choose', ungraded: true, title: 'Predict: which one does work?' },
    { id: 'd_hold', kind: 'demo', act: 'hold', title: 'Test it: hold the crate still' },
    { id: 'd_lift', kind: 'demo', act: 'lift', title: 'Test it: lift the crate' }
  ].concat(FL.MAIN_SCENES.map(s => ({ id: `d_${s}`, kind: 'dir', sc: s, title: 'Positive, negative or zero work?' })));

  const trials = tier => Array.from({ length: FL.TRIALS[tier] }, (_, i) => ({ id: `t${i + 1}`, kind: 'trial', n: i + 1, title: `Trial ${i + 1}` }));
  const plots = tier => Array.from({ length: FL.TRIALS[tier] }, (_, i) => ({ id: `pl${i + 1}`, kind: 'plot', n: i + 1, title: `Plot Trial ${i + 1}` }));

  // Before plotting: the distance is what you chose, the work depended on it. So d goes on x and W goes on y.
  const AXES = { id: 'g_axes', kind: 'axes', title: 'Which goes on which axis?' };
  const GRAPH = {
    conceptual: [
      { id: 'g_factor2', kind: 'ask', q: 'factor2', pic: 'graph', title: 'Twice as far' },
      { id: 'g_factor3', kind: 'ask', q: 'factor3', pic: 'graph', title: '3 times as far' },
      { id: 'g_read', kind: 'ask', q: 'readLine', pic: 'graph', title: 'Read your line' },
      { id: 'g_pfactor', kind: 'ask', q: 'pfactor', pic: 'graph', title: 'A distance you did not test' },
      { id: 'g_predict', kind: 'ask', q: 'predictC', pic: 'lab', title: 'Make your prediction' },
      { id: 'g_test', kind: 'test', title: 'Test your prediction' }
    ],
    cp: [
      { id: 'g_slope', kind: 'slope', title: 'Find the slope' },
      { id: 'g_match', kind: 'match', title: 'What is the slope?' },
      { id: 'g_read', kind: 'ask', q: 'readLine', pic: 'graph', title: 'Read your line' },
      { id: 'g_predict', kind: 'ask', q: 'predict', pic: 'lab', title: 'A distance you did not test' },
      { id: 'g_test', kind: 'test', title: 'Test your prediction' }
    ],
    honors: [
      { id: 'g_slope', kind: 'slope', title: 'Find the slope' },
      { id: 'g_match', kind: 'match', title: 'Slope against the scale' },
      { id: 'g_par', kind: 'ask', q: 'parallel', pic: 'lab', title: 'The part along the track' },
      { id: 'g_predict', kind: 'ask', q: 'predict', pic: 'lab', title: 'A distance you did not test' },
      { id: 'g_test', kind: 'test', title: 'Test your prediction' }
    ]
  };

  const prob = (id, gen) => ({ id, kind: 'problem', gen, title: 'How much work?' });
  // More calculation practice, from the Day 2 problem set. Periods 1–3 get no division and the lift split into two boxes.
  const MUCH = {
    conceptual: [prob('m1', 'pull'), prob('m2', 'pull'), prob('m3', 'liftC'), prob('m4', 'liftC'), prob('m5', 'carry0'), prob('m6', 'net')],
    cp: [prob('m1', 'pull'), prob('m2', 'revF'), prob('m3', 'brake'), prob('m4', 'carry0'), prob('m5', 'lift'), prob('m6', 'revH'), prob('m7', 'multi'), prob('m8', 'net')],
    honors: [prob('m1', 'pull'), prob('m2', 'revF'), prob('m3', 'brake'), prob('m4', 'lift'), prob('m5', 'revH'), prob('m6', 'multi'), prob('m7', 'net'), prob('m8', 'angle'), prob('m9', 'fric')]
  };

  function pages(partId, tier) {
    if (partId === 'dir') return DIR;
    if (partId === 'measure') return trials(tier);
    if (partId === 'graph') return [AXES].concat(plots(tier), GRAPH[tier]);
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
