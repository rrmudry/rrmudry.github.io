/**
 * Acceleration Rate & Sign Studio - 4-Tier Scaffolded Challenge Engine
 * Powers Tier 1 (Sign Detective), Tier 2 (Ticker-Tape Rate Analyzer),
 * Tier 3 (GUESS Telemetry Sprint), and Tier 4 (Autonomous Pod Intercept).
 */

class ChallengeEngine {
  constructor(app) {
    this.app = app;
    this.tierScores = {
      tier1: 0,
      tier2: 0,
      tier3: 0,
      tier4: 0
    };
    this.tierCompleted = {
      tier1: false,
      tier2: false,
      tier3: false,
      tier4: false
    };

    // State for Tier 1: Dynamic Question Generation & 3-in-a-Row Streak
    this.tier1RoundNumber = 1;
    this.tier1CurrentIndex = 0;
    this.tier1CorrectInRound = 0;
    this.tier1Streak = 0;
    this.tier1RoundMessage = '';
    this.tier1Questions = this.generateTier1Questions();
    this.tier1Simulator = null;

    // State for Tier 2: Dynamic Problem Generation & 3-in-a-Row Streak
    this.tier2RoundNumber = 1;
    this.tier2CurrentIndex = 0;
    this.tier2CorrectInRound = 0;
    this.tier2Streak = 0;
    this.tier2RoundMessage = '';
    this.tier2Problems = this.generateTier2Problems();
    this.tier2Simulator = null;

    // State for Tier 3: GUESS Acceleration Sprint — 3-in-a-Row Mastery & Dynamic Problem Generation
    this.tier3RoundNumber = 1;
    this.tier3CurrentIndex = 0;
    this.tier3CorrectInRound = 0;
    this.tier3Streak = 0;
    this.tier3RoundMessage = '';
    this.tier3Problems = this.generateTier3Problems();

    // State for Tier 4: Emergency Braking Reversal
    this.tier4State = {
      v0: 24.0,
      tStop: 6.0,
      reqA: -4.0,
      vReversedTarget: -8.0,
      isSimulating: false
    };
  }

  generateTier1Questions() {
    // Pod names for variety
    const podNames = [
      'Pod Alpha', 'Pod Bravo', 'Pod Delta', 'Pod Echo',
      'Pod Nova', 'Pod Titan', 'Pod Zephyr', 'Pod Orion',
      'Pod Apex', 'Pod Vortex', 'Pod Phoenix', 'Pod Comet'
    ];

    // Helper to pick random element from array
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];

    // Shuffle array (Fisher-Yates)
    const shuffle = arr => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const shuffledNames = shuffle(podNames);

    // 4 Physical Archetypes for 1D Motion
    const archetypes = [
      // 1. Moving Right (+v), Pushed Right (+a) -> Speeding Up
      () => {
        const vVal = pick([6, 8, 10, 12, 14, 16]);
        const aVal = pick([2, 3, 4, 5]);
        return {
          v0: `+${vVal}.0 m/s`,
          a: `+${aVal}.0 m/s²`,
          numV0: vVal,
          numA: aVal,
          correctHeading: '+x',
          correctAccel: '+a',
          correctMotion: 'speeding',
          explanation: `Velocity is positive (+${vVal}.0 m/s moving right) and acceleration is positive (+${aVal}.0 m/s² pushed right). Both point right, so the pod speeds up!`
        };
      },
      // 2. Moving Right (+v), Pushed Left (-a) -> Slowing Down
      () => {
        const vVal = pick([12, 14, 16, 18, 20, 24]);
        const aVal = pick([-2, -3, -4, -5]);
        return {
          v0: `+${vVal}.0 m/s`,
          a: `${aVal}.0 m/s²`,
          numV0: vVal,
          numA: aVal,
          correctHeading: '+x',
          correctAccel: '-a',
          correctMotion: 'slowing',
          explanation: `Velocity is positive (+${vVal}.0 m/s moving right), but acceleration is negative (${aVal}.0 m/s² pushed left). Opposing directions mean the pod slows down!`
        };
      },
      // 3. Moving Left (-v), Pushed Left (-a) -> Speeding Up
      () => {
        const vVal = pick([-6, -8, -10, -12, -14]);
        const aVal = pick([-2, -3, -4, -5]);
        return {
          v0: `${vVal}.0 m/s`,
          a: `${aVal}.0 m/s²`,
          numV0: vVal,
          numA: aVal,
          correctHeading: '-x',
          correctAccel: '-a',
          correctMotion: 'speeding',
          explanation: `Velocity is negative (${vVal}.0 m/s moving left) and acceleration is negative (${aVal}.0 m/s² pushed left). Both point left, so the pod speeds up moving left!`
        };
      },
      // 4. Moving Left (-v), Pushed Right (+a) -> Slowing Down
      () => {
        const vVal = pick([-12, -14, -16, -18, -20]);
        const aVal = pick([2, 3, 4, 5]);
        return {
          v0: `${vVal}.0 m/s`,
          a: `+${aVal}.0 m/s²`,
          numV0: vVal,
          numA: aVal,
          correctHeading: '-x',
          correctAccel: '+a',
          correctMotion: 'slowing',
          explanation: `Velocity is negative (${vVal}.0 m/s moving left), but acceleration is positive (+${aVal}.0 m/s² pushed right). Opposing directions mean the pod slows down!`
        };
      }
    ];

    // Shuffle the archetypes so the 4 questions appear in random order each round
    const shuffledArchetypes = shuffle(archetypes);

    return shuffledArchetypes.map((genFn, index) => {
      const qData = genFn();
      return {
        id: `t1_r${this.tier1RoundNumber}_q${index + 1}`,
        name: shuffledNames[index] || `Pod #${index + 1}`,
        ...qData
      };
    });
  }

  generateTier2Problems() {
    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // 4 Distinct Kinematic Archetypes for 1D Motion
    const archetypes = [
      // 1. Moving Right (+v), Pushing Right (+a) -> Speeding Up Moving Right
      () => {
        const vVal = pick([3, 4, 5, 6, 8, 10]);
        const aVal = pick([2, 3, 4, 5]);
        return {
          archetypeTitle: 'Speeding Up Moving Right (+v and +a)',
          description: `A test pod moves <strong>right</strong> at <strong>v₀ = +${vVal}.0 m/s</strong>. Its engine pushes <strong>right</strong> with an acceleration of <strong>a = +${aVal}.0 m/s²</strong>. Find its velocity after each second:`,
          v0: vVal,
          a: aVal,
          answers: {
            t1: vVal + aVal,
            t2: vVal + 2 * aVal,
            t3: vVal + 3 * aVal,
            deltaV: 3 * aVal
          },
          explanation: `Each second, velocity increases by +${aVal}.0 m/s: ${vVal} ➔ ${vVal + aVal} ➔ ${vVal + 2 * aVal} ➔ ${vVal + 3 * aVal} m/s! Both point right, so the pod speeds up moving right.`
        };
      },
      // 2. Moving Right (+v), Pushing Left (-a) -> Slowing Down Moving Right
      () => {
        const aVal = pick([-2, -3, -4, -5]);
        const candidateV0s = {
          '-2': [10, 12, 14, 16],
          '-3': [15, 18, 21, 24],
          '-4': [16, 20, 24, 28],
          '-5': [20, 25, 30, 35]
        }[String(aVal)];
        const vVal = pick(candidateV0s);
        return {
          archetypeTitle: 'Slowing Down Moving Right (+v and -a)',
          description: `A test pod moves <strong>right</strong> at <strong>v₀ = +${vVal}.0 m/s</strong>. Its brakes push <strong>left</strong> with an acceleration of <strong>a = ${aVal}.0 m/s²</strong>. Find its velocity after each second:`,
          v0: vVal,
          a: aVal,
          answers: {
            t1: vVal + aVal,
            t2: vVal + 2 * aVal,
            t3: vVal + 3 * aVal,
            deltaV: 3 * aVal
          },
          explanation: `Each second, velocity drops by ${Math.abs(aVal)}.0 m/s: ${vVal} ➔ ${vVal + aVal} ➔ ${vVal + 2 * aVal} ➔ ${vVal + 3 * aVal} m/s! Opposing directions slow it down moving right.`
        };
      },
      // 3. Moving Left (-v), Pushing Left (-a) -> Speeding Up Moving Left
      () => {
        const vVal = pick([-4, -5, -6, -8, -10]);
        const aVal = pick([-2, -3, -4]);
        return {
          archetypeTitle: 'Speeding Up Moving Left (-v and -a)',
          description: `A test pod moves <strong>left</strong> at <strong>v₀ = ${vVal}.0 m/s</strong>. Its engine pushes <strong>left</strong> with an acceleration of <strong>a = ${aVal}.0 m/s²</strong>. Find its velocity after each second:`,
          v0: vVal,
          a: aVal,
          answers: {
            t1: vVal + aVal,
            t2: vVal + 2 * aVal,
            t3: vVal + 3 * aVal,
            deltaV: 3 * aVal
          },
          explanation: `Adding ${aVal}.0 m/s each second speeds it up moving left: ${vVal} ➔ ${vVal + aVal} ➔ ${vVal + 2 * aVal} ➔ ${vVal + 3 * aVal} m/s! Both signs are negative, so the pod speeds up moving left.`
        };
      },
      // 4. Moving Left (-v), Pushing Right (+a) -> Slowing Down Moving Left
      () => {
        const aVal = pick([2, 3, 4, 5]);
        const candidateV0s = {
          '2': [-10, -12, -14, -16],
          '3': [-15, -18, -21, -24],
          '4': [-16, -20, -24, -28],
          '5': [-20, -25, -30, -35]
        }[String(aVal)];
        const vVal = pick(candidateV0s);
        return {
          archetypeTitle: 'Slowing Down Moving Left (-v and +a)',
          description: `A test pod moves <strong>left</strong> at <strong>v₀ = ${vVal}.0 m/s</strong>. Its brakes push <strong>right</strong> with an acceleration of <strong>a = +${aVal}.0 m/s²</strong>. Find its velocity after each second:`,
          v0: vVal,
          a: aVal,
          answers: {
            t1: vVal + aVal,
            t2: vVal + 2 * aVal,
            t3: vVal + 3 * aVal,
            deltaV: 3 * aVal
          },
          explanation: `Each second, velocity increases by +${aVal}.0 m/s toward zero: ${vVal} ➔ ${vVal + aVal} ➔ ${vVal + 2 * aVal} ➔ ${vVal + 3 * aVal} m/s! Opposing directions slow it down moving left.`
        };
      }
    ];

    const shuffledArchetypes = shuffle(archetypes);

    return shuffledArchetypes.map((genFn, index) => {
      const pData = genFn();
      return {
        id: `t2_r${this.tier2RoundNumber}_p${index + 1}`,
        missionNum: index + 1,
        title: `Mission ${index + 1}: ${pData.archetypeTitle}`,
        ...pData
      };
    });
  }

  generateTier3Problems() {
    const shuffle = (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const vehiclesRight = [
      'metro subway train', 'hyperloop capsule', 'high-speed maglev shuttle',
      'cargo transport pod', 'autonomous test cart', 'express commuter train'
    ];
    const vehiclesLeft = [
      'mining tunnel shuttle', 'reverse transit pod', 'underground test cart',
      'leftward rail car', 'subterranean drone pod', 'retro-rocket hauler'
    ];

    // 4 Physical Archetypes exclusively for calculating acceleration: a = Δv / Δt
    const archetypes = [
      // 1. Moving Right (+v), Pushed Right (+a) -> Speeding Up Moving Right
      () => {
        const vehicle = pick(vehiclesRight);
        const preset = pick([
          { v0: 0, vf: 24, dt: 8, a: 3 },
          { v0: 0, vf: 30, dt: 6, a: 5 },
          { v0: 0, vf: 28, dt: 7, a: 4 },
          { v0: 10, vf: 26, dt: 4, a: 4 },
          { v0: 8, vf: 32, dt: 6, a: 4 },
          { v0: 5, vf: 25, dt: 5, a: 4 },
          { v0: 0, vf: 18, dt: 6, a: 3 },
          { v0: 12, vf: 36, dt: 8, a: 3 }
        ]);
        const v0Str = preset.v0 === 0 ? '0 m/s (at rest)' : `+${preset.v0}.0 m/s`;
        const vfStr = `+${preset.vf}.0 m/s`;
        return {
          title: 'Speeding Up Moving Right (+a)',
          prompt: `A ${vehicle} starts at <strong>v₀ = ${v0Str}</strong> and speeds up rightward to <strong>v<sub>f</sub> = ${vfStr}</strong> in <strong>Δt = ${preset.dt}.0 s</strong>. What is its acceleration rate (<strong>a</strong>)?`,
          given: `v₀ = ${preset.v0 === 0 ? '0 m/s' : `+${preset.v0}.0 m/s`}, v<sub>f</sub> = ${vfStr}, Δt = ${preset.dt}.0 s`,
          givenText: `v₀ = ${preset.v0 === 0 ? '0 m/s' : `+${preset.v0}.0 m/s`}, v<sub>f</sub> = ${vfStr}, Δt = ${preset.dt}.0 s`,
          targetVar: 'a (Acceleration rate)',
          unknownText: 'a (Acceleration rate)',
          formula: 'a = Δv / Δt',
          correctVal: preset.a,
          targetVal: preset.a,
          tolerance: 0.1,
          unit: 'm/s²',
          correctUnit: 'm/s²',
          hint: `Use a = (v<sub>f</sub> - v₀) / Δt = (${preset.vf}.0 - ${preset.v0}.0) / ${preset.dt}.0 = +${preset.a}.0 m/s²`
        };
      },

      // 2. Moving Right (+v), Pushed Left (-a) -> Slowing Down Moving Right
      () => {
        const vehicle = pick(vehiclesRight);
        const preset = pick([
          { v0: 28, vf: 0, dt: 7, a: -4 },
          { v0: 24, vf: 0, dt: 6, a: -4 },
          { v0: 30, vf: 0, dt: 6, a: -5 },
          { v0: 32, vf: 12, dt: 5, a: -4 },
          { v0: 20, vf: 5, dt: 5, a: -3 },
          { v0: 35, vf: 15, dt: 4, a: -5 },
          { v0: 18, vf: 0, dt: 6, a: -3 },
          { v0: 25, vf: 5, dt: 5, a: -4 }
        ]);
        const vfStr = preset.vf === 0 ? '0 m/s (complete halt)' : `+${preset.vf}.0 m/s`;
        return {
          title: 'Slowing Down Moving Right (-a)',
          prompt: `A ${vehicle} is traveling right at <strong>v₀ = +${preset.v0}.0 m/s</strong>. Brakes are applied to bring it to <strong>v<sub>f</sub> = ${vfStr}</strong> in <strong>Δt = ${preset.dt}.0 s</strong>. What is its acceleration rate (<strong>a</strong>)?`,
          given: `v₀ = +${preset.v0}.0 m/s, v<sub>f</sub> = ${preset.vf === 0 ? '0 m/s' : `+${preset.vf}.0 m/s`}, Δt = ${preset.dt}.0 s`,
          givenText: `v₀ = +${preset.v0}.0 m/s, v<sub>f</sub> = ${preset.vf === 0 ? '0 m/s' : `+${preset.vf}.0 m/s`}, Δt = ${preset.dt}.0 s`,
          targetVar: 'a (Acceleration rate)',
          unknownText: 'a (Acceleration rate)',
          formula: 'a = Δv / Δt',
          correctVal: preset.a,
          targetVal: preset.a,
          tolerance: 0.1,
          unit: 'm/s²',
          correctUnit: 'm/s²',
          hint: `Use a = (v<sub>f</sub> - v₀) / Δt = (${preset.vf}.0 - ${preset.v0}.0) / ${preset.dt}.0 = ${preset.a}.0 m/s²`
        };
      },

      // 3. Moving Left (-v), Pushed Left (-a) -> Speeding Up Moving Left
      () => {
        const vehicle = pick(vehiclesLeft);
        const preset = pick([
          { v0: 0, vf: -20, dt: 5, a: -4 },
          { v0: -6, vf: -30, dt: 8, a: -3 },
          { v0: -4, vf: -24, dt: 5, a: -4 },
          { v0: 0, vf: -18, dt: 6, a: -3 },
          { v0: -8, vf: -28, dt: 4, a: -5 },
          { v0: -10, vf: -34, dt: 6, a: -4 },
          { v0: 0, vf: -24, dt: 6, a: -4 }
        ]);
        const v0Str = preset.v0 === 0 ? '0 m/s (at rest)' : `${preset.v0}.0 m/s`;
        return {
          title: 'Speeding Up Moving Left (-a)',
          prompt: `A ${vehicle} starts at <strong>v₀ = ${v0Str}</strong> and fires left thrusters to reach <strong>v<sub>f</sub> = ${preset.vf}.0 m/s</strong> in <strong>Δt = ${preset.dt}.0 s</strong>. What is its acceleration rate (<strong>a</strong>)?`,
          given: `v₀ = ${preset.v0 === 0 ? '0 m/s' : `${preset.v0}.0 m/s`}, v<sub>f</sub> = ${preset.vf}.0 m/s, Δt = ${preset.dt}.0 s`,
          givenText: `v₀ = ${preset.v0 === 0 ? '0 m/s' : `${preset.v0}.0 m/s`}, v<sub>f</sub> = ${preset.vf}.0 m/s, Δt = ${preset.dt}.0 s`,
          targetVar: 'a (Acceleration rate)',
          unknownText: 'a (Acceleration rate)',
          formula: 'a = Δv / Δt',
          correctVal: preset.a,
          targetVal: preset.a,
          tolerance: 0.1,
          unit: 'm/s²',
          correctUnit: 'm/s²',
          hint: `Use a = (v<sub>f</sub> - v₀) / Δt = (${preset.vf}.0 - (${preset.v0}.0)) / ${preset.dt}.0 = ${preset.a}.0 m/s²`
        };
      },

      // 4. Moving Left (-v), Pushed Right (+a) -> Slowing Down Moving Left
      () => {
        const vehicle = pick(vehiclesLeft);
        const preset = pick([
          { v0: -20, vf: 0, dt: 4, a: 5 },
          { v0: -24, vf: 0, dt: 6, a: 4 },
          { v0: -27, vf: 0, dt: 9, a: 3 },
          { v0: -25, vf: -5, dt: 5, a: 4 },
          { v0: -18, vf: -6, dt: 4, a: 3 },
          { v0: -30, vf: -10, dt: 5, a: 4 },
          { v0: -16, vf: 0, dt: 4, a: 4 }
        ]);
        const vfStr = preset.vf === 0 ? '0 m/s (complete stop)' : `${preset.vf}.0 m/s`;
        return {
          title: 'Slowing Down Moving Left (+a)',
          prompt: `A ${vehicle} is traveling left at <strong>v₀ = ${preset.v0}.0 m/s</strong>. Emergency reverse brakes bring it to <strong>v<sub>f</sub> = ${vfStr}</strong> in <strong>Δt = ${preset.dt}.0 s</strong>. What is its acceleration rate (<strong>a</strong>)?`,
          given: `v₀ = ${preset.v0}.0 m/s, v<sub>f</sub> = ${preset.vf === 0 ? '0 m/s' : `${preset.vf}.0 m/s`}, Δt = ${preset.dt}.0 s`,
          givenText: `v₀ = ${preset.v0}.0 m/s, v<sub>f</sub> = ${preset.vf === 0 ? '0 m/s' : `${preset.vf}.0 m/s`}, Δt = ${preset.dt}.0 s`,
          targetVar: 'a (Acceleration rate)',
          unknownText: 'a (Acceleration rate)',
          formula: 'a = Δv / Δt',
          correctVal: preset.a,
          targetVal: preset.a,
          tolerance: 0.1,
          unit: 'm/s²',
          correctUnit: 'm/s²',
          hint: `Use a = (v<sub>f</sub> - v₀) / Δt = (${preset.vf}.0 - (${preset.v0}.0)) / ${preset.dt}.0 = +${preset.a}.0 m/s²`
        };
      }
    ];

    const shuffledArchetypes = shuffle(archetypes);

    return shuffledArchetypes.map((genFn, index) => {
      const pData = genFn();
      return {
        id: `t3_r${this.tier3RoundNumber}_p${index + 1}`,
        missionNum: index + 1,
        ...pData
      };
    });
  }

  init() {
    this.renderTier1();
    this.renderTier2();
    this.renderTier3();
    this.renderTier4();
    this.updateScoreBar();
  }

  /* ========================================================================
     TIER 1: SIGN DETECTIVE
     ======================================================================== */
  renderTier1() {
    const q = this.tier1Questions[this.tier1CurrentIndex];
    const container = document.getElementById('tier1QuestionBox');
    if (!container) return;

    const isMastered = (this.tier1Streak >= 3 || this.tierCompleted.tier1);
    const isLastInRound = (this.tier1CurrentIndex >= this.tier1Questions.length - 1);

    container.innerHTML = `
      <div class="tier1-container">
        <!-- LEFT COLUMN: Telemetry Stimulus & Streak Tracker -->
        <div class="tier1-left-col">
          ${this.tier1RoundMessage ? `<div class="tier1-round-notice">${this.tier1RoundMessage}</div>` : ''}

          <!-- 3-in-a-Row Streak Card -->
          <div class="tier1-streak-banner ${isMastered ? 'mastered' : ''}">
            <div class="streak-header">
              <span class="streak-title">🎯 Goal: 3 in a row</span>
              <span class="streak-badge-pill ${isMastered ? 'mastered' : ''}">
                ${isMastered ? '✓ 3/3 MASTERED' : `Streak: ${this.tier1Streak} / 3 🔥`}
              </span>
            </div>
            <div class="streak-dots">
              <div class="streak-dot ${this.tier1Streak >= 1 ? 'active' : ''}"><span>1</span></div>
              <div class="streak-dot ${this.tier1Streak >= 2 ? 'active' : ''}"><span>2</span></div>
              <div class="streak-dot ${this.tier1Streak >= 3 ? 'active' : ''}"><span>3</span></div>
            </div>
            ${this.tierCompleted.tier1 
              ? `<div class="streak-unlocked-note">🎉 Tier 2 Unlocked! (+25 PTS)</div>` 
              : `<div class="streak-subnote">Answer 3 correct in a row to unlock Tier 2!</div>`}
          </div>

          <div class="telemetry-screen">
            <div class="telemetry-header">
              <span>POD TELEMETRY // SET ${this.tier1RoundNumber} (POD ${this.tier1CurrentIndex + 1} OF 4)</span>
              <span style="color: #4ade80;">● ONLINE</span>
            </div>
            <div class="telemetry-grid">
              <div class="tel-entry">
                <span class="tel-key">Vehicle:</span>
                <span class="tel-data">${q.name}</span>
              </div>
              <div class="tel-entry">
                <span class="tel-key">Sensor Feed:</span>
                <span class="tel-data" style="font-size: 0.82rem; color: #38bdf8;">● Active</span>
              </div>
              <div class="tel-entry">
                <span class="tel-key">Velocity (v₀):</span>
                <span class="tel-data" style="color: #4ade80; font-size: 1.05rem;">${q.v0}</span>
              </div>
              <div class="tel-entry">
                <span class="tel-key">Acceleration (a):</span>
                <span class="tel-data" style="color: #38bdf8; font-size: 1.05rem;">${q.a}</span>
              </div>
            </div>
          </div>

          <div class="tier1-helper-box">
            <div style="font-weight: 700; color: var(--accent-cyan); margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.35rem;">
              <span>💡</span> Quick Sign Rule:
            </div>
            <div>• <strong>Same signs</strong> (+/+ or -/-) ➔ <strong>Speeding Up</strong></div>
            <div>• <strong>Opposite signs</strong> (+/- or -/+) ➔ <strong>Slowing Down</strong></div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Questions, Options & Submission -->
        <div class="tier1-right-col">
          <div class="tier1-questions-wrap">
            <!-- Question 1 -->
            <div class="tier1-q-group">
              <label class="tier1-q-label">
                <span>1.</span> Which way is it moving? <span style="font-weight: 400; color: var(--text-muted); font-size: 0.78rem;">(look at v₀)</span>
              </label>
              <div class="tier1-btn-grid" id="tier1HeadingOptions">
                <button class="btn-option tier1-btn-option" data-val="+x">➡️ Right (+)</button>
                <button class="btn-option tier1-btn-option" data-val="-x">⬅️ Left (-)</button>
              </div>
            </div>

            <!-- Question 2 -->
            <div class="tier1-q-group">
              <label class="tier1-q-label">
                <span>2.</span> Which way is it pushed? <span style="font-weight: 400; color: var(--text-muted); font-size: 0.78rem;">(look at a)</span>
              </label>
              <div class="tier1-btn-grid" id="tier1AccelOptions">
                <button class="btn-option tier1-btn-option" data-val="+a">➡️ Right (+)</button>
                <button class="btn-option tier1-btn-option" data-val="-a">⬅️ Left (-)</button>
              </div>
            </div>

            <!-- Question 3 -->
            <div class="tier1-q-group">
              <label class="tier1-q-label">
                <span>3.</span> Is it speeding up or slowing down?
              </label>
              <div class="tier1-btn-grid-3" id="tier1MotionOptions">
                <button class="btn-option tier1-btn-option" data-val="speeding">🚀 Speeding Up</button>
                <button class="btn-option tier1-btn-option" data-val="slowing">🛑 Slowing Down</button>
                <button class="btn-option tier1-btn-option" data-val="constant">⚡ Constant Speed</button>
              </div>
            </div>

            <!-- Actions & Feedback -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: 0.15rem; flex-wrap: wrap;">
              <button id="btnSubmitTier1" class="btn-primary" style="padding: 0.45rem 1rem; font-size: 0.85rem;">
                <span>✓</span> Check Answers
              </button>
              <button id="btnNextTier1" class="btn-secondary" style="display: none; padding: 0.45rem 1rem; font-size: 0.85rem;">
                ${isLastInRound ? 'Next Round (New Pods) ➔' : 'Next Pod ➔'}
              </button>
              ${this.tierCompleted.tier1 ? `
                <button id="btnGoToTier2Direct" class="btn-primary" style="padding: 0.45rem 1rem; font-size: 0.85rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-color: #34d399;">
                  🚀 Go to Tier 2 ➔
                </button>
              ` : ''}
            </div>

            <div id="tier1Feedback" class="feedback-box"></div>
          </div>
        </div>
      </div>
    `;

    // Hook up option selectors
    this.setupOptionGroup('tier1HeadingOptions');
    this.setupOptionGroup('tier1AccelOptions');
    this.setupOptionGroup('tier1MotionOptions');

    // Submit and Next handlers
    const btnSubmit = document.getElementById('btnSubmitTier1');
    const btnNext = document.getElementById('btnNextTier1');
    const btnGoTier2 = document.getElementById('btnGoToTier2Direct');
    
    btnSubmit.addEventListener('click', () => this.checkTier1Answer());
    btnNext.addEventListener('click', () => this.advanceTier1Question());
    if (btnGoTier2) {
      btnGoTier2.addEventListener('click', () => {
        if (window.AudioEngine) window.AudioEngine.playClick();
        if (this.app && this.app.switchToTab) this.app.switchToTab('tab-tier2');
      });
    }
  }

  advanceTier1Question() {
    const isLastInRound = (this.tier1CurrentIndex >= this.tier1Questions.length - 1);

    if (isLastInRound) {
      const isMastered = (this.tier1Streak >= 3 || this.tierCompleted.tier1);
      const passedRound = (this.tier1CorrectInRound >= 3);

      const prevCorrect = this.tier1CorrectInRound;
      this.tier1RoundNumber++;
      this.tier1Questions = this.generateTier1Questions();
      this.tier1CurrentIndex = 0;
      this.tier1CorrectInRound = 0;

      if (!isMastered) {
        const msg = passedRound 
          ? `Great round (${prevCorrect}/4), but you need 3 in a row to unlock Tier 2! New pods generated.`
          : `You scored less than 3/4 (${prevCorrect}/4). New pods generated! Keep going until you get 3 in a row.`;
        this.tier1RoundMessage = `🔄 ${msg}`;
        if (this.app && this.app.showGlobalToast) {
          this.app.showGlobalToast('🔄 New question set generated! Answer 3 in a row to unlock Tier 2.');
        }
      } else {
        this.tier1RoundMessage = '🌟 Extra Practice Mode: Tier 1 is already mastered! Feel free to practice or move to Tier 2.';
      }
    } else {
      this.tier1CurrentIndex++;
      this.tier1RoundMessage = '';
    }
    this.renderTier1();
  }

  setupOptionGroup(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return;
    const buttons = group.querySelectorAll('.btn-option');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.AudioEngine) window.AudioEngine.playClick();
        buttons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
  }

  checkTier1Answer() {
    const q = this.tier1Questions[this.tier1CurrentIndex];
    const headingBtn = document.querySelector('#tier1HeadingOptions .btn-option.selected');
    const accelBtn = document.querySelector('#tier1AccelOptions .btn-option.selected');
    const motionBtn = document.querySelector('#tier1MotionOptions .btn-option.selected');
    const fb = document.getElementById('tier1Feedback');
    const btnSubmit = document.getElementById('btnSubmitTier1');
    const btnNext = document.getElementById('btnNextTier1');

    if (!headingBtn || !accelBtn || !motionBtn) {
      fb.className = 'feedback-box feedback-hint show';
      fb.innerHTML = '⚠️ Please pick an answer for all 3 questions before checking!';
      return;
    }

    const selHeading = headingBtn.dataset.val;
    const selAccel = accelBtn.dataset.val;
    const selMotion = motionBtn.dataset.val;

    const isHeadingCorrect = (selHeading === q.correctHeading);
    const isAccelCorrect = (selAccel === q.correctAccel);
    const isMotionCorrect = (selMotion === q.correctMotion);

    if (isHeadingCorrect && isAccelCorrect && isMotionCorrect) {
      if (window.AudioEngine) window.AudioEngine.playSuccess();
      fb.className = 'feedback-box feedback-success show';

      this.tier1Streak++;
      this.tier1CorrectInRound++;
      let justMastered = false;

      if (this.tier1Streak >= 3 && !this.tierCompleted.tier1) {
        this.tierScores.tier1 = 25;
        this.tierCompleted.tier1 = true;
        justMastered = true;
        this.updateScoreBar();
        if (this.app && this.app.updateTabLockStates) this.app.updateTabLockStates();
        if (window.AudioEngine) window.AudioEngine.playUnlockPing();
      }

      fb.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;">
          <div>
            <strong>✓ Correct!</strong> ${q.explanation}
            <div style="margin-top: 0.25rem; color: ${this.tier1Streak >= 3 ? '#34d399' : '#fbbf24'}; font-weight: 700; font-size: 0.82rem;">
              ${this.tier1Streak >= 3 ? '🏆 3 IN A ROW ACHIEVED! Tier 2 is now UNLOCKED!' : `🔥 Current Streak: ${this.tier1Streak} / 3 in a row`}
            </div>
          </div>
          <button id="btnFeedbackSim" class="btn-tier1-view-sim">
            <span>🎥</span> Re-watch Flight Simulation
          </button>
        </div>
      `;
      
      const fbSim = document.getElementById('btnFeedbackSim');
      if (fbSim) {
        fbSim.addEventListener('click', () => {
          if (window.AudioEngine) window.AudioEngine.playClick();
          this.openTier1SimModal({ 
            isCorrect: true, 
            explanation: q.explanation, 
            streak: this.tier1Streak,
            isTier1Mastered: (this.tier1Streak >= 3 || this.tierCompleted.tier1)
          });
        });
      }

      btnSubmit.style.display = 'none';
      btnNext.style.display = 'inline-flex';

      // Automatically launch flight motion simulation popup with correct status
      this.openTier1SimModal({ 
        isCorrect: true, 
        explanation: q.explanation, 
        streak: this.tier1Streak,
        isTier1Mastered: (this.tier1Streak >= 3 || this.tierCompleted.tier1)
      });
    } else {
      if (window.AudioEngine) window.AudioEngine.playError();
      fb.className = 'feedback-box feedback-error show';
      
      this.tier1Streak = 0; // Streak reset!

      let errDetail = '';
      if (!isHeadingCorrect) errDetail += '• Direction of motion was incorrect (+ is Right, - is Left).<br>';
      if (!isAccelCorrect) errDetail += '• Direction of push was incorrect (+ is Right, - is Left).<br>';
      if (!isMotionCorrect) {
        errDetail += `• Speeding/slowing was incorrect. Look at the signs! Velocity is ${q.v0} and acceleration is ${q.a}. When the signs match, it speeds up. When they fight, it slows down.<br>`;
      }
      fb.innerHTML = `
        <strong>❌ Not quite:</strong><br>${errDetail}
        <div style="margin-top: 0.25rem; color: #fb7185; font-size: 0.8rem; font-weight: 600;">
          ⚠️ Streak reset to 0. You need 3 correct in a row to unlock Tier 2!
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: 0.35rem; flex-wrap: wrap;">
          <span style="font-size: 0.8rem; color: #cbd5e1;">Observe the simulation and adjust your answers:</span>
          <button id="btnFeedbackSimErr" class="btn-tier1-view-sim">
            <span>🎥</span> Re-watch Flight Simulation
          </button>
        </div>
      `;

      const fbSimErr = document.getElementById('btnFeedbackSimErr');
      if (fbSimErr) {
        fbSimErr.addEventListener('click', () => {
          if (window.AudioEngine) window.AudioEngine.playClick();
          this.openTier1SimModal({ isCorrect: false, errDetail: errDetail, streak: 0 });
        });
      }

      // Automatically launch flight motion simulation popup with incorrect status
      this.openTier1SimModal({ isCorrect: false, errDetail: errDetail, streak: 0 });
    }
  }

  /* ========================================================================
     TIER 1 SIMULATION POPUP MODAL
     ======================================================================== */
  initTier1ModalSimulator() {
    if (this.tier1Simulator) return;
    const canvas = document.getElementById('tier1SimCanvas');
    if (!canvas) return;

    this.tier1Simulator = new MotionSimulator('tier1SimCanvas');
    this.tier1Simulator.onUpdate = (data) => {
      const elTime = document.getElementById('tier1SimTelTime');
      const elVel = document.getElementById('tier1SimTelVel');
      const elAcc = document.getElementById('tier1SimTelAcc');
      const elStatus = document.getElementById('tier1SimTelStatus');
      const btnPlay = document.getElementById('btnPlayTier1Sim');

      if (elTime) elTime.textContent = `${data.t.toFixed(1)} s`;
      if (elVel) {
        const sign = data.v >= 0 ? '+' : '';
        elVel.textContent = `${sign}${data.v.toFixed(1)} m/s`;
      }
      if (elAcc) {
        const sign = data.a >= 0 ? '+' : '';
        elAcc.textContent = `${sign}${data.a.toFixed(1)} m/s²`;
      }
      if (elStatus) {
        elStatus.textContent = data.status;
      }
      if (btnPlay) {
        btnPlay.innerHTML = data.isRunning ? '<span>⏸</span> Pause' : '<span>▶</span> Play';
      }
    };

    // Modal play/pause and reset controls
    const btnPlay = document.getElementById('btnPlayTier1Sim');
    const btnReset = document.getElementById('btnResetTier1Sim');
    const btnClose = document.getElementById('btnCloseTier1Sim');
    const btnCloseBottom = document.getElementById('btnCloseTier1SimBottom');
    const btnModalNext = document.getElementById('btnModalNextPod');
    const btnGoTier2 = document.getElementById('btnModalGoTier2');
    const modal = document.getElementById('tier1SimModal');

    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        if (window.AudioEngine) window.AudioEngine.playClick();
        if (this.tier1Simulator.isRunning) {
          this.tier1Simulator.pause();
        } else {
          this.tier1Simulator.play();
        }
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (window.AudioEngine) window.AudioEngine.playClick();
        const q = this.tier1Questions[this.tier1CurrentIndex];
        this.tier1Simulator.setState(q.numV0, q.numA, 0);
        this.tier1Simulator.play();
      });
    }

    const closeHandler = () => {
      if (window.AudioEngine) window.AudioEngine.playClick();
      this.closeTier1SimModal();
    };

    if (btnClose) btnClose.addEventListener('click', closeHandler);
    if (btnCloseBottom) btnCloseBottom.addEventListener('click', closeHandler);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeHandler();
      });
    }

    if (btnGoTier2) {
      btnGoTier2.addEventListener('click', () => {
        if (window.AudioEngine) window.AudioEngine.playClick();
        this.closeTier1SimModal();
        if (this.app && this.app.switchToTab) {
          this.app.switchToTab('tab-tier2');
        }
      });
    }

    if (btnModalNext) {
      btnModalNext.addEventListener('click', () => {
        if (window.AudioEngine) window.AudioEngine.playClick();
        this.closeTier1SimModal();
        this.advanceTier1Question();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
        this.closeTier1SimModal();
      }
    });
  }

  openTier1SimModal(resultData = null) {
    this.initTier1ModalSimulator();
    const q = this.tier1Questions[this.tier1CurrentIndex];
    const modal = document.getElementById('tier1SimModal');
    if (!modal) return;

    // Update title and parameters
    const podName = document.getElementById('tier1ModalPodName');
    const modalV0 = document.getElementById('tier1ModalV0');
    const modalA = document.getElementById('tier1ModalA');
    if (podName) podName.textContent = q.name;
    if (modalV0) modalV0.textContent = q.v0;
    if (modalA) modalA.textContent = q.a;

    // Update Result Banner
    const banner = document.getElementById('tier1ModalResultBanner');
    const btnModalNext = document.getElementById('btnModalNextPod');
    const btnGoTier2 = document.getElementById('btnModalGoTier2');
    const btnCloseBottom = document.getElementById('btnCloseTier1SimBottom');

    const isLastInRound = (this.tier1CurrentIndex >= this.tier1Questions.length - 1);
    if (btnModalNext) {
      btnModalNext.textContent = isLastInRound ? 'Next Round (New Pods) ➔' : 'Next Pod ➔';
    }

    if (banner && resultData) {
      banner.className = 'tier1-modal-result-banner show ' + (resultData.isCorrect ? 'result-success' : 'result-error');
      if (resultData.isCorrect) {
        if (resultData.isTier1Mastered) {
          banner.innerHTML = `
            <div class="result-banner-header">
              <span>🏆</span> 3 IN A ROW! TIER 1 MASTERED!
            </div>
            <div>${resultData.explanation}</div>
            <div style="margin-top: 0.35rem; color: #34d399; font-weight: 700;">
              🎉 You earned 25 PTS and unlocked <strong>Tier 2: Speed Each Second</strong>!
            </div>
          `;
          if (btnGoTier2) btnGoTier2.style.display = 'inline-flex';
          if (btnModalNext) btnModalNext.style.display = 'inline-flex';
          if (btnCloseBottom) btnCloseBottom.textContent = 'Stay on Tier 1';
        } else {
          banner.innerHTML = `
            <div class="result-banner-header">
              <span>🎉</span> Correct Prediction!
            </div>
            <div>${resultData.explanation}</div>
            <div style="margin-top: 0.35rem; color: #fbbf24; font-weight: 700; font-size: 0.85rem;">
              🔥 Streak: ${resultData.streak} of 3 in a row (${3 - resultData.streak} more needed to unlock Tier 2)
            </div>
          `;
          if (btnGoTier2) btnGoTier2.style.display = 'none';
          if (btnModalNext) btnModalNext.style.display = 'inline-flex';
          if (btnCloseBottom) btnCloseBottom.textContent = 'Review Question';
        }
      } else {
        banner.innerHTML = `
          <div class="result-banner-header">
            <span>❌</span> Not Quite Right — Observe the Flight Simulation Below:
          </div>
          <div>${resultData.errDetail || ''}Watch the pod's green velocity arrow and cyan acceleration arrow to see why!</div>
          <div style="margin-top: 0.35rem; color: #fb7185; font-size: 0.82rem; font-weight: 600;">
            ⚠️ Streak reset to 0. You need 3 correct in a row to unlock Tier 2!
          </div>
        `;
        if (btnGoTier2) btnGoTier2.style.display = 'none';
        if (btnModalNext) btnModalNext.style.display = 'none';
        if (btnCloseBottom) btnCloseBottom.textContent = 'Try Again 🔄';
      }
    } else if (banner) {
      banner.className = 'tier1-modal-result-banner';
      banner.innerHTML = '';
      if (btnGoTier2) btnGoTier2.style.display = 'none';
      if (btnModalNext) btnModalNext.style.display = 'none';
      if (btnCloseBottom) btnCloseBottom.textContent = 'Return to Questions';
    }

    // Pause Tab 1 simulator if running
    if (this.app && this.app.simulator && this.app.simulator.isRunning) {
      this.app.simulator.pause();
    }

    modal.classList.add('active');
    modal.style.display = 'flex';

    // Resize canvas and run simulation
    setTimeout(() => {
      if (this.tier1Simulator) {
        this.tier1Simulator.resize();
        this.tier1Simulator.setState(q.numV0, q.numA, 0);
        this.tier1Simulator.play();
      }
    }, 60);
  }

  closeTier1SimModal() {
    const modal = document.getElementById('tier1SimModal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
    if (this.tier1Simulator) {
      this.tier1Simulator.pause();
    }
  }

  /* ========================================================================
     TIER 2: TICKER-TAPE RATE ANALYZER (How Speed Changes Each Second)
     ======================================================================== */
  renderTier2() {
    const p = this.tier2Problems[this.tier2CurrentIndex];
    const container = document.getElementById('tier2Box');
    if (!container) return;

    const isMastered = (this.tier2Streak >= 3 || this.tierCompleted.tier2);
    const isLastInRound = (this.tier2CurrentIndex >= this.tier2Problems.length - 1);
    const aSign = p.a >= 0 ? '+' : '';
    const v0Sign = p.v0 >= 0 ? '+' : '';

    container.innerHTML = `
      <div class="tier2-container">
        <!-- LEFT COLUMN: Mini Flight Track Animation & Live Telemetry -->
        <div class="tier2-left-col">
          ${this.tier2RoundMessage ? `<div class="tier2-round-notice">${this.tier2RoundMessage}</div>` : ''}
          <div class="challenge-badge">TIER 2: SPEED EACH SECOND // MISSION ${this.tier2CurrentIndex + 1} OF 4 (SET ${this.tier2RoundNumber})</div>
          <h3 class="tier2-mission-title">${p.title}</h3>
          <p class="tier2-mission-desc">${p.description}</p>

          <!-- Live Mini Simulation Track -->
          <div class="tier2-track-wrap">
            <canvas id="tier2TrackCanvas"></canvas>
          </div>

          <div class="tier2-track-controls">
            <button id="btnPlayTier2Track" class="btn-track-play">
              <span>▶</span> Run Flight (3s)
            </button>
            <button id="btnResetTier2Track" class="btn-track-reset">
              <span>🔄</span> Reset
            </button>
          </div>

          <!-- Live Flight Telemetry Strip -->
          <div class="tier2-sim-telemetry-bar">
            <div class="sim-tel-item">
              <span class="sim-tel-label">Time</span>
              <span id="tier2TelTime" class="sim-tel-val">0.0 / 3.0 s</span>
            </div>
            <div class="sim-tel-item">
              <span class="sim-tel-label">Velocity (v)</span>
              <span id="tier2TelVel" class="sim-tel-val" style="color: #4ade80;">${v0Sign}${p.v0.toFixed(1)} m/s</span>
            </div>
            <div class="sim-tel-item">
              <span class="sim-tel-label">Acceleration (a)</span>
              <span id="tier2TelAcc" class="sim-tel-val" style="color: #38bdf8;">${aSign}${p.a}.0 m/s²</span>
            </div>
          </div>

          <div class="tier2-rule-pill">
            <span>💡</span> <strong>Rule:</strong> <strong>a = ${aSign}${p.a}.0 m/s²</strong> means speed changes by <strong>${aSign}${p.a}.0 m/s</strong> every 1 second.
          </div>
        </div>

        <!-- RIGHT COLUMN: Clean 2-Column Table, Streak Banner & Check Action -->
        <div class="tier2-right-col">
          <!-- 3-in-a-Row Streak Card -->
          <div class="tier2-streak-banner ${isMastered ? 'mastered' : ''}">
            <div class="streak-header">
              <span class="streak-title">🎯 Goal: 3 in a row</span>
              <span class="streak-badge-pill ${isMastered ? 'mastered' : ''}">
                ${isMastered ? '✓ 3/3 MASTERED' : `Streak: ${this.tier2Streak} / 3 🔥`}
              </span>
            </div>
            <div class="streak-dots">
              <div class="streak-dot ${this.tier2Streak >= 1 ? 'active' : ''}"><span>1</span></div>
              <div class="streak-dot ${this.tier2Streak >= 2 ? 'active' : ''}"><span>2</span></div>
              <div class="streak-dot ${this.tier2Streak >= 3 ? 'active' : ''}"><span>3</span></div>
            </div>
            ${this.tierCompleted.tier2 
              ? `<div class="streak-unlocked-note">🎉 Tier 3 Unlocked! (+25 PTS)</div>` 
              : `<div class="streak-subnote">Answer 3 correct in a row to unlock Tier 3!</div>`}
          </div>

          <div class="tier2-table-card">
            <table class="tier2-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Velocity</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="time-pill">t = 0 s</span> <span class="time-sub">(Start)</span></td>
                  <td class="vel-cell initial-vel">${v0Sign}${p.v0.toFixed(1)} m/s</td>
                </tr>
                <tr class="step-rate-row">
                  <td colspan="2">
                    <div class="step-rate-indicator">
                      <span>⬇</span> <strong>Change:</strong> ${aSign}${p.a}.0 m/s each second
                    </div>
                  </td>
                </tr>
                <tr>
                  <td><span class="time-pill">t = 1 s</span></td>
                  <td class="vel-cell">
                    <div class="input-unit-wrap">
                      <input type="number" step="any" id="t2_v1" class="table-input" placeholder="?">
                      <span class="unit-tag">m/s</span>
                    </div>
                  </td>
                </tr>
                <tr class="step-rate-row">
                  <td colspan="2">
                    <div class="step-rate-indicator">
                      <span>⬇</span> <strong>Change:</strong> ${aSign}${p.a}.0 m/s each second
                    </div>
                  </td>
                </tr>
                <tr>
                  <td><span class="time-pill">t = 2 s</span></td>
                  <td class="vel-cell">
                    <div class="input-unit-wrap">
                      <input type="number" step="any" id="t2_v2" class="table-input" placeholder="?">
                      <span class="unit-tag">m/s</span>
                    </div>
                  </td>
                </tr>
                <tr class="step-rate-row">
                  <td colspan="2">
                    <div class="step-rate-indicator">
                      <span>⬇</span> <strong>Change:</strong> ${aSign}${p.a}.0 m/s each second
                    </div>
                  </td>
                </tr>
                <tr>
                  <td><span class="time-pill">t = 3 s</span></td>
                  <td class="vel-cell">
                    <div class="input-unit-wrap">
                      <input type="number" step="any" id="t2_v3" class="table-input" placeholder="?">
                      <span class="unit-tag">m/s</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="tier2-delta-box">
              <div class="delta-label-wrap">
                <span class="delta-symbol">Δv =</span>
                <span class="delta-title">Total Velocity Change:</span>
              </div>
              <div class="input-unit-wrap">
                <input type="number" step="any" id="t2_deltaV" class="table-input" style="width: 85px;" placeholder="Δv">
                <span class="unit-tag">m/s</span>
              </div>
              <div class="delta-subtext">(Velocity at 3 s minus Starting velocity v₀)</div>
            </div>
          </div>

          <div class="tier2-actions">
            <button id="btnCheckTier2" class="btn-primary">
              <span>✓</span> Check My Table
            </button>
            <button id="btnNextTier2" class="btn-secondary" style="display: none;">
              ${isLastInRound ? 'Next Round (New Pods) ➔' : 'Next Mission ➔'}
            </button>
            ${this.tierCompleted.tier2 ? `
              <button id="btnGoToTier3Direct" class="btn-primary" style="padding: 0.45rem 1rem; font-size: 0.85rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-color: #34d399;">
                🚀 Go to Tier 3 ➔
              </button>
            ` : ''}
          </div>

          <div id="tier2Feedback" class="feedback-box"></div>
        </div>
      </div>
    `;

    this.initTier2Track();

    document.getElementById('btnCheckTier2').addEventListener('click', () => this.checkTier2Answer());
    document.getElementById('btnNextTier2').addEventListener('click', () => this.advanceTier2Problem());

    const btnGoTier3 = document.getElementById('btnGoToTier3Direct');
    if (btnGoTier3) {
      btnGoTier3.addEventListener('click', () => {
        if (window.AudioEngine) window.AudioEngine.playClick();
        if (this.app && this.app.switchToTab) this.app.switchToTab('tab-tier3');
      });
    }
  }

  advanceTier2Problem() {
    const isLastInRound = (this.tier2CurrentIndex >= this.tier2Problems.length - 1);

    if (isLastInRound) {
      const isMastered = (this.tier2Streak >= 3 || this.tierCompleted.tier2);
      const passedRound = (this.tier2CorrectInRound >= 3);

      const prevCorrect = this.tier2CorrectInRound;
      this.tier2RoundNumber++;
      this.tier2Problems = this.generateTier2Problems();
      this.tier2CurrentIndex = 0;
      this.tier2CorrectInRound = 0;

      if (!isMastered) {
        const msg = passedRound 
          ? `Great round (${prevCorrect}/4), but you need 3 in a row to unlock Tier 3! New pods generated.`
          : `You scored less than 3/4 (${prevCorrect}/4). New pods generated! Keep going until you get 3 in a row.`;
        this.tier2RoundMessage = `🔄 ${msg}`;
        if (this.app && this.app.showGlobalToast) {
          this.app.showGlobalToast('🔄 New problem set generated! Answer 3 in a row to unlock Tier 3.');
        }
      } else {
        this.tier2RoundMessage = '🌟 Extra Practice Mode: Tier 2 is already mastered! Feel free to practice or move to Tier 3.';
      }
    } else {
      this.tier2CurrentIndex++;
      this.tier2RoundMessage = '';
    }
    this.renderTier2();
  }

  initTier2Track() {
    const canvas = document.getElementById('tier2TrackCanvas');
    if (!canvas) return;

    const p = this.tier2Problems[this.tier2CurrentIndex];

    if (this.tier2Simulator) {
      this.tier2Simulator.pause();
    }
    this.tier2Simulator = new MotionSimulator('tier2TrackCanvas');

    const sim = this.tier2Simulator;
    sim.resize();
    sim.setState(p.v0, p.a, 0);

    const btnPlay = document.getElementById('btnPlayTier2Track');
    const btnReset = document.getElementById('btnResetTier2Track');
    const elTime = document.getElementById('tier2TelTime');
    const elVel = document.getElementById('tier2TelVel');
    const elAcc = document.getElementById('tier2TelAcc');

    sim.onUpdate = (data) => {
      if (elTime) {
        const displayT = Math.min(3.0, data.t);
        elTime.textContent = `${displayT.toFixed(1)} / 3.0 s`;
      }
      if (elVel) {
        const sign = data.v >= 0 ? '+' : '';
        elVel.textContent = `${sign}${data.v.toFixed(1)} m/s`;
      }
      if (elAcc) {
        const sign = data.a >= 0 ? '+' : '';
        elAcc.textContent = `${sign}${data.a.toFixed(1)} m/s²`;
      }

      // Auto-stop at 3.0 seconds
      if (data.t >= 3.0 && sim.isRunning) {
        sim.pause();
        if (elTime) elTime.textContent = '3.0 / 3.0 s';
        if (btnPlay) {
          btnPlay.innerHTML = '<span>▶</span> Re-run Flight (3s)';
        }
        if (window.AudioEngine) window.AudioEngine.playClick();
      }
    };

    if (btnPlay) {
      btnPlay.onclick = () => {
        if (window.AudioEngine) window.AudioEngine.playClick();
        if (sim.isRunning) {
          sim.pause();
          btnPlay.innerHTML = '<span>▶</span> Resume Flight';
        } else {
          if (sim.t >= 3.0) {
            sim.setState(p.v0, p.a, 0);
          }
          sim.play();
          btnPlay.innerHTML = '<span>⏸</span> Pause';
        }
      };
    }

    if (btnReset) {
      btnReset.onclick = () => {
        if (window.AudioEngine) window.AudioEngine.playClick();
        sim.setState(p.v0, p.a, 0);
        if (btnPlay) btnPlay.innerHTML = '<span>▶</span> Run Flight (3s)';
        if (elTime) elTime.textContent = '0.0 / 3.0 s';
      };
    }
  }

  checkTier2Answer() {
    const p = this.tier2Problems[this.tier2CurrentIndex];
    const inV1 = document.getElementById('t2_v1');
    const inV2 = document.getElementById('t2_v2');
    const inV3 = document.getElementById('t2_v3');
    const inDelta = document.getElementById('t2_deltaV');
    const fb = document.getElementById('tier2Feedback');
    const btnCheck = document.getElementById('btnCheckTier2');
    const btnNext = document.getElementById('btnNextTier2');

    const val1 = parseFloat(inV1.value);
    const val2 = parseFloat(inV2.value);
    const val3 = parseFloat(inV3.value);
    const valDelta = parseFloat(inDelta.value);

    if (isNaN(val1) || isNaN(val2) || isNaN(val3) || isNaN(valDelta)) {
      fb.className = 'feedback-box feedback-hint show';
      fb.innerHTML = '⚠️ Please enter numbers for all 3 seconds and the total velocity change (Δv).';
      return;
    }

    const c1 = (Math.abs(val1 - p.answers.t1) < 0.05);
    const c2 = (Math.abs(val2 - p.answers.t2) < 0.05);
    const c3 = (Math.abs(val3 - p.answers.t3) < 0.05);
    const cDelta = (Math.abs(valDelta - p.answers.deltaV) < 0.05);

    inV1.className = c1 ? 'table-input valid' : 'table-input invalid';
    inV2.className = c2 ? 'table-input valid' : 'table-input invalid';
    inV3.className = c3 ? 'table-input valid' : 'table-input invalid';
    inDelta.className = cDelta ? 'table-input valid' : 'table-input invalid';

    if (c1 && c2 && c3 && cDelta) {
      if (window.AudioEngine) window.AudioEngine.playSuccess();
      fb.className = 'feedback-box feedback-success show';
      
      this.tier2Streak++;
      this.tier2CorrectInRound++;

      if (this.tier2Streak >= 3 && !this.tierCompleted.tier2) {
        this.tierScores.tier2 = 25;
        this.tierCompleted.tier2 = true;
        this.updateScoreBar();
        if (this.app && this.app.updateTabLockStates) this.app.updateTabLockStates();
        if (window.AudioEngine) window.AudioEngine.playUnlockPing();
      }

      const isMastered = (this.tier2Streak >= 3 || this.tierCompleted.tier2);

      fb.innerHTML = `
        <strong>✓ Correct!</strong> Each second, velocity changed by ${p.a >= 0 ? '+' : ''}${p.a}.0 m/s.<br>
        Total change after 3 s: <strong>Δv = ${p.answers.deltaV >= 0 ? '+' : ''}${p.answers.deltaV}.0 m/s</strong> (Ending velocity ${p.answers.t3 >= 0 ? '+' : ''}${p.answers.t3}.0 minus starting velocity ${p.v0 >= 0 ? '+' : ''}${p.v0}.0)!
        <div style="margin-top: 0.25rem; color: ${isMastered ? '#34d399' : '#fbbf24'}; font-weight: 700; font-size: 0.82rem;">
          ${isMastered ? '🏆 3 IN A ROW ACHIEVED! Tier 3 is now UNLOCKED! (+25 PTS awarded)' : `🔥 Current Streak: ${this.tier2Streak} / 3 in a row`}
        </div>
      `;

      btnCheck.style.display = 'none';
      btnNext.style.display = 'inline-flex';

      // Update streak banner live
      const streakBanner = document.querySelector('.tier2-streak-banner');
      if (streakBanner) {
        if (isMastered) streakBanner.classList.add('mastered');
        const badge = streakBanner.querySelector('.streak-badge-pill');
        if (badge) {
          badge.className = `streak-badge-pill ${isMastered ? 'mastered' : ''}`;
          badge.textContent = isMastered ? '✓ 3/3 MASTERED' : `Streak: ${this.tier2Streak} / 3 🔥`;
        }
        const dots = streakBanner.querySelectorAll('.streak-dot');
        dots.forEach((dot, idx) => {
          if (idx < this.tier2Streak) dot.classList.add('active');
          else dot.classList.remove('active');
        });
        const note = streakBanner.querySelector('.streak-subnote, .streak-unlocked-note');
        if (note && this.tierCompleted.tier2) {
          note.className = 'streak-unlocked-note';
          note.textContent = '🎉 Tier 3 Unlocked! (+25 PTS)';
        }
      }

      // If just mastered, show Go to Tier 3 direct button if not already present
      if (this.tierCompleted.tier2 && !document.getElementById('btnGoToTier3Direct')) {
        const actions = document.querySelector('.tier2-actions');
        if (actions) {
          const btn = document.createElement('button');
          btn.id = 'btnGoToTier3Direct';
          btn.className = 'btn-primary';
          btn.style.cssText = 'padding: 0.45rem 1rem; font-size: 0.85rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-color: #34d399;';
          btn.innerHTML = '🚀 Go to Tier 3 ➔';
          btn.addEventListener('click', () => {
            if (window.AudioEngine) window.AudioEngine.playClick();
            if (this.app && this.app.switchToTab) this.app.switchToTab('tab-tier3');
          });
          actions.appendChild(btn);
        }
      }
    } else {
      if (window.AudioEngine) window.AudioEngine.playError();
      fb.className = 'feedback-box feedback-error show';
      
      this.tier2Streak = 0; // Streak reset!

      // Update streak banner live on error
      const streakBanner = document.querySelector('.tier2-streak-banner');
      if (streakBanner && !this.tierCompleted.tier2) {
        streakBanner.classList.remove('mastered');
        const badge = streakBanner.querySelector('.streak-badge-pill');
        if (badge) {
          badge.className = 'streak-badge-pill';
          badge.textContent = 'Streak: 0 / 3 🔥';
        }
        const dots = streakBanner.querySelectorAll('.streak-dot');
        dots.forEach(dot => dot.classList.remove('active'));
      }

      let errRows = [];
      if (!c1) errRows.push('1 s');
      if (!c2) errRows.push('2 s');
      if (!c3) errRows.push('3 s');
      if (!cDelta) errRows.push('Δv');

      fb.innerHTML = `
        <strong>❌ Check highlighted red boxes (${errRows.join(', ')}):</strong><br>
        Speed changes by <strong>${p.a >= 0 ? '+' : ''}${p.a}.0 m/s</strong> each second. Click <strong>▶ Run Flight (3s)</strong> to watch the speed change on the track!
        <div style="margin-top: 0.25rem; color: #fb7185; font-size: 0.8rem; font-weight: 600;">
          ⚠️ Streak reset to 0. You need 3 correct in a row to unlock Tier 3!
        </div>
      `;
    }
  }

  /* ========================================================================
     TIER 3: GUESS ACCELERATION SPRINT (Quantitative Acceleration Solver)
     ======================================================================== */
  renderTier3() {
    const p = this.tier3Problems[this.tier3CurrentIndex];
    const container = document.getElementById('tier3Box');
    if (!container) return;

    const isMastered = (this.tier3Streak >= 3 || this.tierCompleted.tier3);
    const givenDisplay = p.given || p.givenText || 'Not specified';
    const unknownDisplay = p.unknownText || p.targetVar || 'a (Acceleration rate)';

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.35rem; flex-wrap: wrap;">
        <div class="challenge-badge" style="margin-bottom: 0;">TIER 3: GUESS ACCELERATION SPRINT (ROUND ${this.tier3RoundNumber} • PROBLEM ${this.tier3CurrentIndex + 1} OF 4)</div>
        <div class="tier3-streak-banner ${isMastered ? 'mastered' : ''}" style="padding: 0.2rem 0.65rem; display: flex; align-items: center; gap: 0.6rem;">
          <span class="streak-badge-pill ${isMastered ? 'mastered' : ''}" style="font-size: 0.75rem;">
            ${isMastered ? '✓ 3/3 MASTERED' : `Streak: ${this.tier3Streak} / 3 🔥`}
          </span>
          <div class="streak-dots" style="margin-bottom: 0; gap: 0.3rem;">
            <span class="streak-dot ${this.tier3Streak >= 1 ? 'active' : ''}" style="width: 14px; height: 14px; border-radius: 3px;"></span>
            <span class="streak-dot ${this.tier3Streak >= 2 ? 'active' : ''}" style="width: 14px; height: 14px; border-radius: 3px;"></span>
            <span class="streak-dot ${this.tier3Streak >= 3 ? 'active' : ''}" style="width: 14px; height: 14px; border-radius: 3px;"></span>
          </div>
        </div>
      </div>

      ${this.tier3RoundMessage ? `
        <div class="tier3-round-notice">${this.tier3RoundMessage}</div>
      ` : ''}

      <h3 style="font-family: var(--font-display); font-size: 1.1rem; margin-bottom: 0.3rem;">${p.title}</h3>
      <p style="font-size: 0.92rem; line-height: 1.45; margin-bottom: 0.6rem;">
        ${p.prompt}
      </p>

      <div class="guess-container">
        <!-- Given -->
        <div class="guess-row">
          <span class="guess-letter">G</span>
          <span style="font-size: 0.85rem; font-weight: 600; color: var(--accent-cyan);">Given Values:</span>
          <span style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted);">${givenDisplay}</span>
        </div>

        <!-- Unknown -->
        <div class="guess-row">
          <span class="guess-letter">U</span>
          <span style="font-size: 0.85rem; font-weight: 600; color: var(--accent-cyan);">Unknown Target:</span>
          <span style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted);">${unknownDisplay}</span>
        </div>

        <!-- Equation -->
        <div class="guess-row">
          <span class="guess-letter">E</span>
          <span style="font-size: 0.85rem; font-weight: 600; color: var(--accent-cyan);">Select Working Formula:</span>
          <select id="t3_selectFormula" class="input-pill">
            <option value="">-- Choose Formula --</option>
            <option value="a = Δv / Δt">a = Δv / Δt</option>
            <option value="Δv = a · Δt">Δv = a · Δt</option>
            <option value="Δt = Δv / a">Δt = Δv / a</option>
            <option value="v = d / t">v = d / t (Constant speed only)</option>
          </select>
        </div>

        <!-- Substitute & Solve -->
        <div class="guess-row">
          <span class="guess-letter">S</span>
          <span style="font-size: 0.85rem; font-weight: 600; color: var(--accent-cyan);">Substitute, Solve & Unit:</span>
          <input type="number" step="any" id="t3_inputAnswer" class="input-pill" style="width: 140px;" placeholder="Value for a">
          <select id="t3_selectUnit" class="input-pill">
            <option value="">Unit</option>
            <option value="m/s²">m/s²</option>
            <option value="m/s">m/s</option>
            <option value="s">s</option>
            <option value="m">m</option>
          </select>
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
        <button id="btnCheckTier3" class="btn-primary">
          <span>✓</span> Check GUESS Solution
        </button>
        <button id="btnNextTier3" class="btn-secondary" style="display: none;">
          Next Acceleration Problem ➔
        </button>
        ${this.tierCompleted.tier3 ? `
          <button id="btnGoToTier4Direct" class="btn-primary" style="padding: 0.45rem 1rem; font-size: 0.85rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-color: #34d399;">
            🚀 Go to Tier 4 ➔
          </button>
        ` : ''}
      </div>

      <div id="tier3Feedback" class="feedback-box"></div>
    `;

    document.getElementById('btnCheckTier3').addEventListener('click', () => this.checkTier3Answer());
    document.getElementById('btnNextTier3').addEventListener('click', () => this.advanceTier3Problem());

    const btnGoTier4 = document.getElementById('btnGoToTier4Direct');
    if (btnGoTier4) {
      btnGoTier4.addEventListener('click', () => {
        if (window.AudioEngine) window.AudioEngine.playClick();
        if (this.app && this.app.switchToTab) this.app.switchToTab('tab-tier4');
      });
    }
  }

  advanceTier3Problem() {
    const isLastInRound = (this.tier3CurrentIndex >= this.tier3Problems.length - 1);

    if (isLastInRound) {
      const isMastered = (this.tier3Streak >= 3 || this.tierCompleted.tier3);
      const passedRound = (this.tier3CorrectInRound >= 3);

      const prevCorrect = this.tier3CorrectInRound;
      this.tier3RoundNumber++;
      this.tier3Problems = this.generateTier3Problems();
      this.tier3CurrentIndex = 0;
      this.tier3CorrectInRound = 0;

      if (!isMastered) {
        const msg = passedRound 
          ? `Great round (${prevCorrect}/4), but you need 3 in a row to unlock Tier 4! New acceleration problems generated.`
          : `You scored less than 3/4 (${prevCorrect}/4). New problems generated! Keep practicing until you get 3 in a row.`;
        this.tier3RoundMessage = `🔄 ${msg}`;
        if (this.app && this.app.showGlobalToast) {
          this.app.showGlobalToast('🔄 New acceleration problems generated! Answer 3 in a row to unlock Tier 4.');
        }
      } else {
        this.tier3RoundMessage = '🌟 Extra Practice Mode: Tier 3 is already mastered! Feel free to practice or move to Tier 4.';
      }
    } else {
      this.tier3CurrentIndex++;
      this.tier3RoundMessage = '';
    }
    this.renderTier3();
  }

  checkTier3Answer() {
    const p = this.tier3Problems[this.tier3CurrentIndex];
    const selFormula = document.getElementById('t3_selectFormula').value;
    const inputVal = parseFloat(document.getElementById('t3_inputAnswer').value);
    const selUnit = document.getElementById('t3_selectUnit').value;
    const fb = document.getElementById('tier3Feedback');
    const btnCheck = document.getElementById('btnCheckTier3');
    const btnNext = document.getElementById('btnNextTier3');

    if (!selFormula || isNaN(inputVal) || !selUnit) {
      fb.className = 'feedback-box feedback-hint show';
      fb.innerHTML = '⚠️ Please select a formula, compute the numerical value for acceleration (a), and select standard units (m/s²).';
      return;
    }

    const expectedFormula = p.formula;
    const expectedVal = (p.correctVal !== undefined ? p.correctVal : p.targetVal);
    const expectedUnit = (p.correctUnit || p.unit || 'm/s²');

    const isFormulaCorrect = (selFormula === expectedFormula);
    const isValCorrect = (Math.abs(inputVal - expectedVal) <= p.tolerance);
    const isUnitCorrect = (selUnit === expectedUnit);

    if (isFormulaCorrect && isValCorrect && isUnitCorrect) {
      if (window.AudioEngine) window.AudioEngine.playSuccess();
      fb.className = 'feedback-box feedback-success show';
      
      this.tier3Streak++;
      this.tier3CorrectInRound++;

      if (this.tier3Streak >= 3 && !this.tierCompleted.tier3) {
        this.tierScores.tier3 = 25;
        this.tierCompleted.tier3 = true;
        this.updateScoreBar();
        if (this.app && this.app.updateTabLockStates) this.app.updateTabLockStates();
        if (window.AudioEngine) window.AudioEngine.playUnlockPing();
      }

      const isMastered = (this.tier3Streak >= 3 || this.tierCompleted.tier3);

      fb.innerHTML = `
        <strong>✓ CORRECT GUESS DERIVATION:</strong> ${p.hint}
        <div style="margin-top: 0.25rem; color: ${isMastered ? '#34d399' : '#fbbf24'}; font-weight: 700; font-size: 0.82rem;">
          ${isMastered ? '🏆 3 IN A ROW ACHIEVED! Tier 4 is now UNLOCKED! (+25 PTS awarded)' : `🔥 Current Streak: ${this.tier3Streak} / 3 in a row`}
        </div>
      `;

      btnCheck.style.display = 'none';
      btnNext.style.display = 'inline-flex';

      // Live update streak banner
      const banner = document.querySelector('.tier3-streak-banner');
      if (banner) {
        if (isMastered) banner.classList.add('mastered');
        const badge = banner.querySelector('.streak-badge-pill');
        if (badge) {
          badge.className = `streak-badge-pill ${isMastered ? 'mastered' : ''}`;
          badge.textContent = isMastered ? '✓ 3/3 MASTERED' : `Streak: ${this.tier3Streak} / 3 🔥`;
        }
        const dots = banner.querySelectorAll('.streak-dot');
        dots.forEach((dot, idx) => {
          if (idx < this.tier3Streak) dot.classList.add('active');
          else dot.classList.remove('active');
        });
      }

      if (this.tierCompleted.tier3 && !document.getElementById('btnGoToTier4Direct')) {
        const actions = btnNext.parentElement;
        if (actions) {
          const btn = document.createElement('button');
          btn.id = 'btnGoToTier4Direct';
          btn.className = 'btn-primary';
          btn.style.cssText = 'padding: 0.45rem 1rem; font-size: 0.85rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-color: #34d399;';
          btn.innerHTML = '🚀 Go to Tier 4 ➔';
          btn.addEventListener('click', () => {
            if (window.AudioEngine) window.AudioEngine.playClick();
            if (this.app && this.app.switchToTab) this.app.switchToTab('tab-tier4');
          });
          actions.appendChild(btn);
        }
      }
    } else {
      if (window.AudioEngine) window.AudioEngine.playError();
      fb.className = 'feedback-box feedback-error show';

      this.tier3Streak = 0; // Streak reset!

      // Live reset streak banner
      const banner = document.querySelector('.tier3-streak-banner');
      if (banner && !this.tierCompleted.tier3) {
        banner.classList.remove('mastered');
        const badge = banner.querySelector('.streak-badge-pill');
        if (badge) {
          badge.className = 'streak-badge-pill';
          badge.textContent = 'Streak: 0 / 3 🔥';
        }
        const dots = banner.querySelectorAll('.streak-dot');
        dots.forEach(dot => dot.classList.remove('active'));
      }

      let err = '';
      if (!isFormulaCorrect) err += `Formula '${selFormula}' does not isolate acceleration. We need a = Δv / Δt. `;
      if (!isValCorrect) err += `Calculated value (${inputVal}) is incorrect. Check direction sign (+ or -) and subtraction order: (v<sub>f</sub> - v₀) / Δt. `;
      if (!isUnitCorrect) err += `Unit '${selUnit}' is incorrect for acceleration (must be m/s²). `;
      fb.innerHTML = `
        <strong>❌ SOLUTION REJECTED:</strong> ${err}
        <div style="margin-top: 0.25rem; color: #fb7185; font-size: 0.8rem; font-weight: 600;">
          ⚠️ Streak reset to 0. You need 3 correct in a row to unlock Tier 4!
        </div>
      `;
    }
  }

  /* ========================================================================
     TIER 4: AUTONOMOUS POD INTERCEPT & REVERSAL (High Ceiling Challenge)
     ======================================================================== */
  renderTier4() {
    const container = document.getElementById('tier4Box');
    if (!container) return;

    container.innerHTML = `
      <div class="challenge-badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border-color: rgba(245, 158, 11, 0.4);">
        TIER 4: FINAL CHALLENGE — BRAKING & REVERSAL
      </div>
      <h3 style="font-family: var(--font-display); font-size: 1.15rem; margin-bottom: 0.35rem;">
        Safety Barrier Braking Challenge
      </h3>
      <p style="font-size: 0.93rem; line-height: 1.45; color: var(--text-main); margin-bottom: 0.5rem;">
        A test pod moves right at <strong>v₀ = +24.0 m/s</strong>. A safety barrier ahead closes in <strong>Δt = 6.0 seconds</strong>. The pod must brake to a complete stop (<strong>v<sub>f</sub> = 0 m/s</strong>) right when the barrier closes.
      </p>

      <div class="pod-hazard-track" id="hazardCanvasWrapper" style="margin-bottom: 0.4rem;">
        <canvas id="hazardCanvas" style="width: 100%; height: 98px;"></canvas>
      </div>

      <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.55rem 0.8rem; margin-bottom: 0.45rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.6rem;">
          <div>
            <label style="font-size: 0.82rem; font-weight: 600; display: block; margin-bottom: 0.2rem;">
              1. Braking Acceleration (a) to stop in 6.0 s:
            </label>
            <div style="display: flex; align-items: center; gap: 0.45rem;">
              <input type="number" step="any" id="t4_inputAccel" class="input-pill" style="width: 110px;" placeholder="a in m/s²">
              <span style="font-family: var(--font-mono); font-size: 0.82rem;">m/s²</span>
            </div>
            <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-top: 0.15rem;">
              Hint: a = (v<sub>f</sub> - v₀) / Δt = (0 - 24.0) / 6.0
            </span>
          </div>

          <div>
            <label style="font-size: 0.82rem; font-weight: 600; display: block; margin-bottom: 0.2rem;">
              2. Reversal: If brakes push for 8.0 s total, what is the final velocity?
            </label>
            <div style="display: flex; align-items: center; gap: 0.45rem;">
              <input type="number" step="any" id="t4_inputReversal" class="input-pill" style="width: 110px;" placeholder="v(8) in m/s">
              <span style="font-family: var(--font-mono); font-size: 0.82rem;">m/s</span>
            </div>
            <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-top: 0.15rem;">
              Hint: Pod stops at 6.0 s (v = 0), then speeds up to the left for 2 more seconds.
            </span>
          </div>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <button id="btnLaunchHazardTest" class="btn-primary" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-color: #fbbf24; padding: 0.45rem 1rem;">
          <span>🚀</span> Test Braking Run
        </button>
        <button id="btnResetHazard" class="btn-secondary" style="padding: 0.45rem 0.9rem;">
          Reset Pod
        </button>
      </div>

      <div id="tier4Feedback" class="feedback-box"></div>
    `;

    this.initHazardCanvas();

    document.getElementById('btnLaunchHazardTest').addEventListener('click', () => this.runHazardTest());
    document.getElementById('btnResetHazard').addEventListener('click', () => this.resetHazardTest());
  }

  initHazardCanvas() {
    const canvas = document.getElementById('hazardCanvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = 98 * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    this.hazardCtx = ctx;
    this.hazardWidth = rect.width;
    this.hazardHeight = 98;
    
    if (!this.hazardLayers && typeof ParallaxLayer !== 'undefined') {
      this.hazardLayers = [
        new ParallaxLayer('layers/parallax-mountain-bg.png', 0.0),
        new ParallaxLayer('layers/parallax-mountain-montain-far.png', 0.004),
        new ParallaxLayer('layers/parallax-mountain-mountains.png', 0.012),
        new ParallaxLayer('layers/parallax-mountain-trees.png', 0.03),
        new ParallaxLayer('layers/parallax-mountain-foreground-trees.png', 0.07)
      ];
    }
    this.drawHazardStatic(0);
  }

  drawHazardStatic(podProgress0to1) {
    const ctx = this.hazardCtx;
    if (!ctx) return;
    const w = this.hazardWidth;
    const h = this.hazardHeight;
    ctx.clearRect(0, 0, w, h);

    const roadY = h * 0.72;

    // 1. Draw Parallax Background Layers with Single Sun
    if (this.hazardLayers) {
      const simulatedPos = podProgress0to1 * 40;
      const backdropH = roadY + 8;
      // Sky layer (layer 0)
      if (this.hazardLayers[0]) {
        this.hazardLayers[0].draw(ctx, simulatedPos, 12, w, backdropH, 0);
      }

      // Single Sun in upper sky (pure, clean glowing orb)
      const sunX = w * 0.78;
      const sunY = backdropH * 0.28;
      const sunR = 15;
      ctx.save();
      const glow = ctx.createRadialGradient(sunX, sunY, 3, sunX, sunY, 30);
      glow.addColorStop(0, 'rgba(255, 247, 226, 0.4)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff7e2';
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Mountain and tree layers (layers 1-4)
      for (let i = 1; i < this.hazardLayers.length; i++) {
        this.hazardLayers[i].draw(ctx, simulatedPos, 12, w, backdropH, 0);
      }
    }

    // 2. Track & Asphalt Road
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, roadY, w, h - roadY);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, roadY);
    ctx.lineTo(w, roadY);
    ctx.stroke();

    // Secondary road marker line
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, roadY + 20);
    ctx.lineTo(w, roadY + 20);
    ctx.stroke();

    // Terminal Gate Barrier at 82% of width
    const gateX = w * 0.82;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(gateX, roadY - 45, 14, 45);
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(gateX, roadY - 45, 14, 45);

    // Hazard Stripes on Gate
    ctx.fillStyle = '#fef08a';
    for (let sy = roadY - 40; sy < roadY; sy += 10) {
      ctx.fillRect(gateX + 2, sy, 10, 4);
    }

    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fca5a5';
    ctx.textAlign = 'center';
    ctx.fillText('SAFETY GATE', gateX + 7, roadY - 52);

    // Pod Position
    const startX = 45;
    const currentX = startX + (gateX - startX - 35) * podProgress0to1;
    const podY = roadY - 14;

    // Retro-Thrust Braking Flame when active
    if (podProgress0to1 > 0 && podProgress0to1 < 1.0) {
      const flameLen = 22 + Math.random() * 8;
      const grad = ctx.createRadialGradient(currentX + 25, podY, 2, currentX + 25 + flameLen, podY, 14);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#00f2fe');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(currentX + 25 + flameLen / 2, podY, flameLen / 2, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pod Hull
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(currentX - 25, podY - 10, 50, 20, 6);
    ctx.fill();
    ctx.stroke();

    // Pod Cockpit
    ctx.fillStyle = '#00f2fe';
    ctx.beginPath();
    ctx.roundRect(currentX - 8, podY - 8, 18, 6, 2);
    ctx.fill();

    // Pod Levitation Glow
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(currentX - 15, podY + 11, 2.5, 0, Math.PI * 2);
    ctx.arc(currentX + 15, podY + 11, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  runHazardTest() {
    const inputAccel = parseFloat(document.getElementById('t4_inputAccel').value);
    const inputRev = parseFloat(document.getElementById('t4_inputReversal').value);
    const fb = document.getElementById('tier4Feedback');

    if (isNaN(inputAccel) || isNaN(inputRev)) {
      fb.className = 'feedback-box feedback-hint show';
      fb.innerHTML = '⚠️ Please calculate both the required acceleration (a) and the turnaround final velocity before test launch.';
      return;
    }

    const isAccelCorrect = (Math.abs(inputAccel - (-4.0)) < 0.1);
    const isRevCorrect = (Math.abs(inputRev - (-8.0)) < 0.2);

    if (window.AudioEngine) window.AudioEngine.playThrustWhine();

    let progress = 0;
    const startTime = performance.now();
    const duration = 2500; // 2.5s visual animation

    const animate = (time) => {
      const elapsed = time - startTime;
      const frac = Math.min(1.0, elapsed / duration);
      // Decelerating ease out
      progress = 1 - Math.pow(1 - frac, 2);
      this.drawHazardStatic(progress);

      if (frac < 1.0) {
        requestAnimationFrame(animate);
      } else {
        if (isAccelCorrect && isRevCorrect) {
          if (window.AudioEngine) window.AudioEngine.playSuccess();
          fb.className = 'feedback-box feedback-success show';
          fb.innerHTML = `
            <strong>🏆 TEST SUCCESSFUL — 100% KINEMATIC MASTERY!</strong><br>
            • Braking Acceleration: a = (0 - 24.0 m/s) / 6.0 s = <strong>-4.0 m/s²</strong> (Moving right while pushing left slows it down to a stop).<br>
            • Directional Reversal: The pod stops at t = 6.0 s. Pushing left for 2.0 more seconds accelerates it to the left: v(8) = 0 + (-4.0 m/s²)(2.0 s) = <strong>-8.0 m/s</strong>!
            <div style="margin-top: 0.65rem;">
              <button id="btnTier4OpenCert" class="btn-primary" style="padding: 0.45rem 1rem; font-size: 0.85rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-color: #34d399;">
                🏆 View Official Completion Certificate & Grade Confirmation ➔
              </button>
            </div>
          `;
          document.getElementById('btnTier4OpenCert')?.addEventListener('click', () => {
            if (this.app && this.app.openCompletionModal) {
              this.app.openCompletionModal();
            }
          });

          this.tierScores.tier4 = 25;
          this.tierCompleted.tier4 = true;
          this.updateScoreBar();

          // Automatically pop up completion screen after 1.2s
          setTimeout(() => {
            if (this.app && this.app.openCompletionModal) {
              this.app.openCompletionModal();
            }
          }, 1200);
        } else {
          if (window.AudioEngine) window.AudioEngine.playBrakeCrash();
          fb.className = 'feedback-box feedback-error show';
          let err = '';
          if (!isAccelCorrect) err += `Acceleration (${inputAccel} m/s²) does not stop the pod in 6.0 s. It needs a = (0 - 24) / 6 = -4.0 m/s². `;
          if (!isRevCorrect) err += `Reversal velocity (${inputRev} m/s) is incorrect. At 8 s, v = -8.0 m/s. `;
          fb.innerHTML = `<strong>⚠️ COLLISION ALERT:</strong> ${err}`;
        }
      }
    };

    requestAnimationFrame(animate);
  }

  resetHazardTest() {
    this.drawHazardStatic(0);
    const fb = document.getElementById('tier4Feedback');
    if (fb) fb.className = 'feedback-box';
  }

  /* ========================================================================
     SCORE PROGRESS & CERTIFICATION
     ======================================================================== */
  getState() {
    return {
      tierScores: { ...this.tierScores },
      tierCompleted: { ...this.tierCompleted },
      tier1Streak: this.tier1Streak,
      tier2Streak: this.tier2Streak,
      tier3Streak: this.tier3Streak,
      totalScore: this.tierScores.tier1 + this.tierScores.tier2 + this.tierScores.tier3 + this.tierScores.tier4
    };
  }

  restoreState(savedState, score = 0) {
    if (!savedState) return;

    if (savedState.tierScores) {
      this.tierScores = {
        tier1: Number(savedState.tierScores.tier1) || 0,
        tier2: Number(savedState.tierScores.tier2) || 0,
        tier3: Number(savedState.tierScores.tier3) || 0,
        tier4: Number(savedState.tierScores.tier4) || 0
      };
    }
    if (savedState.tierCompleted) {
      this.tierCompleted = {
        tier1: !!savedState.tierCompleted.tier1,
        tier2: !!savedState.tierCompleted.tier2,
        tier3: !!savedState.tierCompleted.tier3,
        tier4: !!savedState.tierCompleted.tier4
      };
    }
    if (typeof savedState.tier1Streak === 'number') {
      this.tier1Streak = savedState.tier1Streak;
    }
    if (typeof savedState.tier2Streak === 'number') {
      this.tier2Streak = savedState.tier2Streak;
    }
    if (typeof savedState.tier3Streak === 'number') {
      this.tier3Streak = savedState.tier3Streak;
    }

    // Ensure tier completed matches points
    if (this.tierCompleted.tier1 && this.tierScores.tier1 < 25) this.tierScores.tier1 = 25;
    if (this.tierCompleted.tier2 && this.tierScores.tier2 < 25) this.tierScores.tier2 = 25;
    if (this.tierCompleted.tier3 && this.tierScores.tier3 < 25) this.tierScores.tier3 = 25;
    if (this.tierCompleted.tier4 && this.tierScores.tier4 < 25) this.tierScores.tier4 = 25;

    // Refresh streak and challenge UI
    if (typeof this.renderTier1Question === 'function') {
      this.renderTier1Question();
    }
    if (typeof this.renderTier2Problem === 'function') {
      this.renderTier2Problem();
    }
    if (typeof this.renderTier3 === 'function') {
      this.renderTier3();
    }

    this.updateScoreBar();
    if (this.app && this.app.updateTabLockStates) {
      this.app.updateTabLockStates();
    }
  }

  updateScoreBar() {
    const total = this.tierScores.tier1 + this.tierScores.tier2 + this.tierScores.tier3 + this.tierScores.tier4;
    const fill = document.getElementById('scoreFill');
    const badge = document.getElementById('scoreBadge');
    const btnClaim = document.getElementById('btnClaimCert');

    if (fill) fill.style.width = `${total}%`;
    if (badge) badge.innerText = `${total} / 100 PTS`;

    // Update tab completed classes
    ['tier1', 'tier2', 'tier3', 'tier4'].forEach(tier => {
      const tabBtn = document.querySelector(`[data-tab="tab-${tier}"]`);
      if (tabBtn && this.tierCompleted[tier]) {
        tabBtn.classList.add('completed');
        tabBtn.classList.remove('locked');
        const pill = tabBtn.querySelector('.tab-score-pill');
        if (pill) pill.innerText = '25/25 ✓';
      }
    });

    if (this.app && this.app.updateTabLockStates) {
      this.app.updateTabLockStates();
    }

    if (btnClaim) {
      if (total >= 80) {
        btnClaim.style.display = 'inline-flex';
        btnClaim.classList.add('active-glow');
      } else {
        btnClaim.style.display = 'none';
      }
    }

    // Auto backup to Firebase AuthManager if present
    if (window.AuthManager) {
      window.AuthManager.saveProgress(this.getState());
    }
  }
}

window.ChallengeEngine = ChallengeEngine;
