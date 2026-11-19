// Work & Simple Machines Practice — lesson progression and points for each class.
// Periods 1–3 (conceptual), Periods 4–6 (cp), Period 0 (honors).
// Credit grows step by step and never drops.

(function () {
  const PARTS = [
    { id: 'setup', name: 'GUESS Setup', icon: '🧩', weight: 1 },
    { id: 'pulley', name: 'Pulley Work', icon: '⚙️', weight: 2 },
    { id: 'ramp', name: 'Ramp Trade-Off', icon: '📐', weight: 2 },
    { id: 'machines', name: 'MA & Friction', icon: '⚖️', weight: 2 },
    { id: 'quiz', name: 'Mastery Check', icon: '🏁', weight: 0 }
  ];
  const PART_POINTS = 6, QUIZ_POINTS = 4;
  const TOTAL_WEIGHT = PARTS.reduce((s, p) => s + p.weight, 0);

  const setupPage = (id, gen, title) => ({ id, kind: 'guess_setup', gen, title });
  const probPage = (id, gen, title) => ({ id, kind: 'problem', gen, title });

  const SETUP = [
    { id: 's_predict', kind: 'predict', ungraded: true, title: 'Predict: 1 rope vs. 3 ropes' },
    setupPage('s_w', 'setup_w', 'Identify G, U, and E for Work'),
    setupPage('s_f', 'setup_f', 'Identify G, U, and E for Force'),
    setupPage('s_d', 'setup_d', 'Identify G, U, and E on a Ramp'),
    setupPage('s_ma', 'setup_ma', 'Identify G, U, and E for Mechanical Advantage')
  ];

  const PULLEY = {
    conceptual: [
      probPage('p1', 'pulley_w', '1. Pulley Work (W)'),
      probPage('p2', 'pulley_f', '2. Stage Light Force (F)'),
      probPage('p3', 'pulley_d', '3. Sail Rope Distance (d)')
    ],
    cp: [
      probPage('p1', 'pulley_w', '1. Pulley Work (W)'),
      probPage('p2', 'pulley_f', '2. Stage Light Force (F)'),
      probPage('p3', 'pulley_d', '3. Sail Rope Distance (d)'),
      probPage('p4', 'pulley_2step', '4. Single vs. Double Pulley')
    ],
    honors: [
      probPage('p1', 'pulley_w', '1. Pulley Work (W)'),
      probPage('p2', 'pulley_f', '2. Stage Light Force (F)'),
      probPage('p3', 'pulley_d', '3. Sail Rope Distance (d)'),
      probPage('p4', 'pulley_lift_h', '4. Lift Work & Pulley Pull')
    ]
  };

  const RAMP = {
    conceptual: [
      probPage('r1', 'ramp_givenW_f', '1. Ramp Force from Work'),
      probPage('r2', 'ramp_givenW_d', '2. Ramp Length from Work'),
      probPage('r3', 'ramp_ratio_c', '3. Longer Ramp, Less Force'),
      { id: 'r4', kind: 'compare', gen: 'compare_ab', title: '4. Lift vs. Smooth Ramp' }
    ],
    cp: [
      probPage('r1', 'ramp_givenW_f', '1. Ramp Force from Work'),
      probPage('r2', 'ramp_givenW_d', '2. Ramp Length from Work'),
      probPage('r3', 'ramp_2box_d_cp', '3. Two-Step Ramp Length'),
      probPage('r4', 'ramp_2box_h_cp', '4. Two-Step Dock Height'),
      { id: 'r5', kind: 'compare', gen: 'compare_ab', title: '5. Lift vs. Smooth Ramp' }
    ],
    honors: [
      probPage('r1', 'ramp_givenW_f', '1. Ramp Force from Work'),
      probPage('r2', 'ramp_givenW_d', '2. Ramp Length from Work'),
      probPage('r3', 'ramp_2box_d_h', '3. Cart Ramp Length'),
      probPage('r4', 'ramp_2box_h_h', '4. Truck Bed Height'),
      { id: 'r5', kind: 'compare', gen: 'compare_ab', title: '5. Lift vs. Smooth Ramp' }
    ]
  };

  const MACHINES = {
    conceptual: [
      probPage('m1', 'ma_find', '1. Pulley Mechanical Advantage'),
      probPage('m2', 'ma_pull_c', '2. Pull Force Using MA'),
      probPage('m3', 'rough_2box', '3. Work Lost to Friction')
    ],
    cp: [
      probPage('m1', 'ma_find', '1. Pulley Mechanical Advantage'),
      probPage('m2', 'ma_pull_2box', '2. Weight & Pull Force'),
      probPage('m3', 'ma_ramp_len', '3. Wheelchair Ramp Length'),
      probPage('m4', 'rough_2box', '4. Rough Ramp Friction Work')
    ],
    honors: [
      probPage('m1', 'ma_find', '1. Pulley Mechanical Advantage'),
      probPage('m2', 'ma_pull_h', '2. Engine Block Pull Force'),
      probPage('m3', 'ma_ramp_2box_h', '3. Wheelchair Ramp & Work'),
      probPage('m4', 'rough_3box_h', '4. Rough Ramp Friction Force')
    ]
  };

  function pages(partId, tier = 'cp') {
    const t = ['conceptual', 'cp', 'honors'].includes(tier) ? tier : 'cp';
    if (partId === 'setup') return SETUP;
    if (partId === 'pulley') return PULLEY[t];
    if (partId === 'ramp') return RAMP[t];
    if (partId === 'machines') return MACHINES[t];
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
