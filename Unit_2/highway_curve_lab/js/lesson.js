// Highway Curve Lab — the order of the lesson for each class.
// Every page ends with something to do: aim an arrow, drive the car, read a gauge, plot a point, or calculate.
// One short instruction per page. Page kinds are drawn and checked by the app-*.js files.

(function () {
  const FL = window.FL;
  const PARTS = [
    { id: 'skid', name: 'The Skid', icon: '🛞', weight: 2 },
    { id: 'measure', name: 'Measure', icon: '📏', weight: 3 },
    { id: 'graph', name: 'Graph It', icon: '📈', weight: 3 },
    { id: 'weather', name: 'Mass & Weather', icon: '🌧️', weight: 2 },
    { id: 'engineer', name: 'Engineer the Sign', icon: '🚧', weight: 2 },
    { id: 'quiz', name: 'Mastery Check', icon: '🏁', weight: 0 }
  ];
  const PART_POINTS = 6, QUIZ_POINTS = 4;
  const TOTAL_WEIGHT = PARTS.reduce((s, p) => s + p.weight, 0);

  const SKID = [
    { id: 's_predict', kind: 'aim', what: 'path', ungraded: true, title: 'Predict: where does it slide?',
      text: 'The car hits ice right here. Click the map to aim its path. Not graded.' },
    { id: 's_run', kind: 'skid', title: 'Test your prediction',
      text: 'Press ▶ Drive. Watch the car when it reaches the ice.' },
    { id: 's_path', kind: 'aim', what: 'path', title: 'Where does it slide?',
      text: 'New spot. Click the map to aim the path the car slides on ice.' },
    { id: 's_force', kind: 'aim', what: 'force', title: 'Aim the friction',
      text: 'Dry road: the car turns. Click the map to aim the friction from the road.' },
    { id: 's_name', kind: 'name', title: 'Name the force' }
  ];

  const trials = tier => Array.from({ length: FL.TRIALS[tier] }, (_, i) => ({ id: `t${i + 1}`, kind: 'trial', n: i + 1, title: `Trial ${i + 1}` }));
  const plots = tier => Array.from({ length: FL.TRIALS[tier] }, (_, i) => ({ id: `pl${i + 1}`, kind: 'plot', n: i + 1, title: `Plot Trial ${i + 1}` }));
  const MEASURE_CP = [{ id: 't_limits', kind: 'limits', title: 'Read the grip limits' }];

  const GRAPH = {
    conceptual: [
      { id: 'g_half', kind: 'ask', q: 'half', title: 'Dry or icy?' },
      { id: 'g_truck', kind: 'ask', q: 'truckDiff', title: 'Car or truck?' },
      { id: 'g_predict', kind: 'ask', q: 'predictTruck', title: 'Make your prediction' },
      { id: 'g_test', kind: 'find', surf: 'icy', veh: 'truck', pred: 'predV', title: 'Test your prediction' }
    ],
    cp: [
      { id: 'g_cross_dry', kind: 'cross', surf: 'dry', title: 'Dry road limit' },
      { id: 'g_cross_wet', kind: 'cross', surf: 'wet', title: 'Wet road limit' },
      { id: 'g_cross_icy', kind: 'cross', surf: 'icy', title: 'Icy road limit' },
      { id: 'g_test', kind: 'find', surf: 'wet', veh: 'car', pred: 'crossWet', title: 'Test your graph' }
    ],
    honors: [
      { id: 'g_straight', kind: 'axis', title: 'Straighten the curve' },
      { id: 'g_slope', kind: 'slope', title: 'Find the slope' },
      { id: 'g_radius', kind: 'ask', q: 'radius', title: 'What is the slope?' },
      { id: 'g_predict', kind: 'ask', q: 'predictGravel', title: 'A road you did not test' },
      { id: 'g_test', kind: 'find', surf: 'gravel', veh: 'car', pred: 'predV', title: 'Test your prediction' }
    ]
  };

  const WEATHER = [
    { id: 'w_double', kind: 'double', title: 'Twice as fast' },
    { id: 'w_mass', kind: 'mass', title: 'Heavy truck on ice' }
  ];
  const LANE_PAGE = [{ id: 'w_lane', kind: 'lane', title: 'Inner or outer lane?' }];
  const ENGINEER = {
    base: [
      { id: 'e_mph', kind: 'mph', title: 'Speed in mph' },
      { id: 'e_sign', kind: 'sign', title: 'Choose the sign' },
      { id: 'e_cer', kind: 'cer', title: 'Defend your sign' }
    ],
    bank: [{ id: 'e_bank', kind: 'bank', title: 'Bank the curve' }]
  };

  function pages(partId, tier) {
    if (partId === 'skid') return SKID;
    if (partId === 'measure') return trials(tier).concat(tier === 'cp' ? MEASURE_CP : []);
    if (partId === 'graph') return plots(tier).concat(GRAPH[tier]);
    if (partId === 'weather') return WEATHER.concat(tier === 'conceptual' ? [] : LANE_PAGE);
    if (partId === 'engineer') return ENGINEER.base.concat(tier === 'honors' ? ENGINEER.bank : []);
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
