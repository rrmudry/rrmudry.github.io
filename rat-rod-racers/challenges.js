/**
 * Rat Rod Racers - Academic Proving Grounds ("Dyno Lab & Pit School")
 * Educational challenges teaching Velocity, Acceleration, Mass, Force (F = ma),
 * graph interpretation, and data table calibration.
 * Strict No-LaTeX adherence in all questions and explanations.
 */

class PhysicsChallengeEngine {
  constructor() {
    this.streak = 0;
    this.currentChallenge = null;
  }

  // Generate a random question from one of the 4 core categories
  generateChallenge(category = null) {
    const categories = ['newton', 'graph', 'table', 'friction'];
    const chosenCategory = category || categories[Math.floor(Math.random() * categories.length)];

    let challenge = null;
    switch (chosenCategory) {
      case 'newton':
        challenge = this._genNewtonChallenge();
        break;
      case 'graph':
        challenge = this._genGraphChallenge();
        break;
      case 'table':
        challenge = this._genTableChallenge();
        break;
      case 'friction':
        challenge = this._genFrictionChallenge();
        break;
      default:
        challenge = this._genNewtonChallenge();
    }

    this.currentChallenge = challenge;
    return challenge;
  }

  // 1. Newton's 2nd Law Calculations (F = ma)
  _genNewtonChallenge() {
    const type = Math.floor(Math.random() * 3); // 0: find a, 1: find F, 2: find m
    const baseReward = 100;

    if (type === 0) {
      // Find Acceleration: a = F_net / m
      const mass = [500, 600, 750, 800, 900, 1000, 1200][Math.floor(Math.random() * 7)];
      const driveForce = [2000, 2400, 3000, 3600, 4000, 4500][Math.floor(Math.random() * 6)];
      const dragFriction = [200, 300, 400, 500, 600][Math.floor(Math.random() * 5)];
      const netForce = driveForce - dragFriction;
      const expectedA = Number((netForce / mass).toFixed(2));

      return {
        id: 'newton_a_' + Date.now(),
        category: 'newton',
        title: "Newton's 2nd Law: Net Acceleration",
        badge: "F_net = m · a",
        prompt: `A student rat rod has a total mass of <strong>${mass} kg</strong>. At launch, the engine delivers a drive force of <strong>${driveForce} N</strong>, while friction and drag oppose the car with <strong>${dragFriction} N</strong>.<br><br>Calculate the car's initial acceleration:`,
        unit: "m/s²",
        inputType: "number",
        reward: baseReward,
        tolerance: 0.1,
        expectedValue: expectedA,
        solutionSteps: [
          `Step 1: Calculate Net Force: F_net = F_drive - F_resist = ${driveForce} N - ${dragFriction} N = ${netForce} N`,
          `Step 2: Apply Newton's 2nd Law: a = F_net / m`,
          `Step 3: a = ${netForce} N / ${mass} kg = <strong>${expectedA} m/s²</strong>`
        ]
      };
    } else if (type === 1) {
      // Find Force: F = m * a
      const mass = [400, 550, 700, 850, 950][Math.floor(Math.random() * 5)];
      const targetA = [2.5, 3.0, 4.0, 5.0, 6.0][Math.floor(Math.random() * 5)];
      const expectedF = Math.round(mass * targetA);

      return {
        id: 'newton_f_' + Date.now(),
        category: 'newton',
        title: "Newton's 2nd Law: Required Drive Force",
        badge: "F = m · a",
        prompt: `A driver wants their <strong>${mass} kg</strong> rat rod to accelerate from rest at exactly <strong>${targetA} m/s²</strong> off the starting line. Assuming resistance is negligible during launch, what net force must the engine deliver?`,
        unit: "N",
        inputType: "number",
        reward: baseReward,
        tolerance: 5,
        expectedValue: expectedF,
        solutionSteps: [
          `Step 1: Use Newton's 2nd Law: F_net = m · a`,
          `Step 2: Substitute values: F_net = (${mass} kg) · (${targetA} m/s²)`,
          `Step 3: F_net = <strong>${expectedF} N</strong>`
        ]
      };
    } else {
      // Find Mass: m = F / a
      const netF = [1800, 2400, 3200, 4000, 4800][Math.floor(Math.random() * 5)];
      const accel = [2.0, 2.5, 3.2, 4.0, 5.0][Math.floor(Math.random() * 5)];
      const expectedM = Number((netF / accel).toFixed(0));

      return {
        id: 'newton_m_' + Date.now(),
        category: 'newton',
        title: "Dyno Telemetry: Estimating Vehicle Mass",
        badge: "m = F / a",
        prompt: `During a dyno track pull, telemetry sensors measure a constant net forward force of <strong>${netF} N</strong> resulting in a steady acceleration of <strong>${accel} m/s²</strong>. What is the total mass of the car?`,
        unit: "kg",
        inputType: "number",
        reward: baseReward,
        tolerance: 5,
        expectedValue: expectedM,
        solutionSteps: [
          `Step 1: Rearrange Newton's 2nd Law for mass: m = F_net / a`,
          `Step 2: m = ${netF} N / ${accel} m/s²`,
          `Step 3: m = <strong>${expectedM} kg</strong>`
        ]
      };
    }
  }

  // 2. Kinematic Graph Reading (x-t and v-t)
  _genGraphChallenge() {
    const isVelocityGraph = Math.random() > 0.45;
    const baseReward = 125;

    if (isVelocityGraph) {
      // Velocity vs Time: Slope = Acceleration
      const t1 = 0;
      const t2 = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
      const v1 = 0;
      const v2 = [12, 16, 20, 24, 30][Math.floor(Math.random() * 5)];
      const accel = Number(((v2 - v1) / (t2 - t1)).toFixed(2));

      const svgChart = `
        <svg viewBox="0 0 320 180" class="graph-svg" xmlns="http://www.w3.org/2000/svg">
          <!-- Grid lines -->
          <line x1="45" y1="20" x2="300" y2="20" stroke="#2b2b36" stroke-width="1"/>
          <line x1="45" y1="55" x2="300" y2="55" stroke="#2b2b36" stroke-width="1"/>
          <line x1="45" y1="90" x2="300" y2="90" stroke="#2b2b36" stroke-width="1"/>
          <line x1="45" y1="125" x2="300" y2="125" stroke="#2b2b36" stroke-width="1"/>
          <line x1="45" y1="160" x2="300" y2="160" stroke="#2b2b36" stroke-width="1"/>

          <line x1="45" y1="20" x2="45" y2="160" stroke="#495057" stroke-width="2"/>
          <line x1="45" y1="160" x2="300" y2="160" stroke="#495057" stroke-width="2"/>

          <!-- Axis Labels -->
          <text x="15" y="25" fill="#ffd166" font-size="11" font-weight="bold">${v2}</text>
          <text x="15" y="95" fill="#ffd166" font-size="11" font-weight="bold">${v2 / 2}</text>
          <text x="25" y="165" fill="#ffd166" font-size="11" font-weight="bold">0</text>
          <text x="10" y="80" fill="#adb5bd" font-size="10" transform="rotate(-90 10,80)">v (m/s)</text>

          <text x="45" y="175" fill="#ffd166" font-size="11" font-weight="bold">0</text>
          <text x="160" y="175" fill="#ffd166" font-size="11" font-weight="bold">${t2 / 2}</text>
          <text x="280" y="175" fill="#ffd166" font-size="11" font-weight="bold">${t2}</text>
          <text x="160" y="178" fill="#adb5bd" font-size="10" text-anchor="middle">Time t (s)</text>

          <!-- Trendline -->
          <line x1="45" y1="160" x2="280" y2="20" stroke="#00f0ff" stroke-width="3.5"/>
          <circle cx="45" cy="160" r="5" fill="#00f0ff"/>
          <circle cx="280" cy="20" r="5" fill="#00f0ff"/>

          <!-- Slope triangle -->
          <line x1="45" y1="160" x2="280" y2="160" stroke="#ffbe0b" stroke-dasharray="4,4" stroke-width="1.5"/>
          <line x1="280" y1="160" x2="280" y2="20" stroke="#ffbe0b" stroke-dasharray="4,4" stroke-width="1.5"/>
          <text x="160" y="152" fill="#ffbe0b" font-size="9">Δt = ${t2} s</text>
          <text x="284" y="90" fill="#ffbe0b" font-size="9">Δv = ${v2} m/s</text>
        </svg>
      `;

      return {
        id: 'graph_vt_' + Date.now(),
        category: 'graph',
        title: "Velocity-Time Graph: Finding Acceleration",
        badge: "a = Δv / Δt",
        svg: svgChart,
        prompt: `Inspect the Velocity vs. Time (v-t) graph above showing a rat rod accelerating uniformly from rest. Calculate the acceleration of the vehicle from the slope:`,
        unit: "m/s²",
        inputType: "number",
        reward: baseReward,
        tolerance: 0.1,
        expectedValue: accel,
        solutionSteps: [
          `Step 1: On a velocity-time graph, slope represents acceleration: a = Δv / Δt`,
          `Step 2: Identify coordinates: (t₁, v₁) = (0 s, 0 m/s) and (t₂, v₂) = (${t2} s, ${v2} m/s)`,
          `Step 3: a = (${v2} - 0) / (${t2} - 0) = <strong>${accel} m/s²</strong>`
        ]
      };
    } else {
      // Position vs Time: Slope = Velocity
      const t1 = 0;
      const t2 = [3, 4, 5, 6][Math.floor(Math.random() * 4)];
      const x2 = [30, 48, 60, 75, 90][Math.floor(Math.random() * 5)];
      const velocity = Number((x2 / t2).toFixed(1));

      const svgChart = `
        <svg viewBox="0 0 320 180" class="graph-svg" xmlns="http://www.w3.org/2000/svg">
          <line x1="45" y1="20" x2="300" y2="20" stroke="#2b2b36" stroke-width="1"/>
          <line x1="45" y1="65" x2="300" y2="65" stroke="#2b2b36" stroke-width="1"/>
          <line x1="45" y1="110" x2="300" y2="110" stroke="#2b2b36" stroke-width="1"/>
          <line x1="45" y1="160" x2="300" y2="160" stroke="#2b2b36" stroke-width="1"/>

          <line x1="45" y1="20" x2="45" y2="160" stroke="#495057" stroke-width="2"/>
          <line x1="45" y1="160" x2="300" y2="160" stroke="#495057" stroke-width="2"/>

          <text x="15" y="25" fill="#ffd166" font-size="11" font-weight="bold">${x2}</text>
          <text x="25" y="165" fill="#ffd166" font-size="11" font-weight="bold">0</text>
          <text x="10" y="80" fill="#adb5bd" font-size="10" transform="rotate(-90 10,80)">x (m)</text>

          <text x="45" y="175" fill="#ffd166" font-size="11" font-weight="bold">0</text>
          <text x="280" y="175" fill="#ffd166" font-size="11" font-weight="bold">${t2}</text>
          <text x="160" y="178" fill="#adb5bd" font-size="10" text-anchor="middle">Time t (s)</text>

          <line x1="45" y1="160" x2="280" y2="20" stroke="#ff7b00" stroke-width="3.5"/>
          <circle cx="45" cy="160" r="5" fill="#ff7b00"/>
          <circle cx="280" cy="20" r="5" fill="#ff7b00"/>
        </svg>
      `;

      return {
        id: 'graph_xt_' + Date.now(),
        category: 'graph',
        title: "Position-Time Graph: Uniform Velocity",
        badge: "v = Δx / Δt",
        svg: svgChart,
        prompt: `The Position vs. Time (x-t) graph above shows a cruising speed test run. Determine the vehicle's constant velocity from the slope of the line:`,
        unit: "m/s",
        inputType: "number",
        reward: baseReward,
        tolerance: 0.1,
        expectedValue: velocity,
        solutionSteps: [
          `Step 1: On a position-time graph, the slope represents velocity: v = Δx / Δt`,
          `Step 2: Coordinates: (0 s, 0 m) and (${t2} s, ${x2} m)`,
          `Step 3: v = (${x2} m - 0 m) / (${t2} s - 0 s) = <strong>${velocity} m/s</strong>`
        ]
      };
    }
  }

  // 3. Experimental Data Table Completion
  _genTableChallenge() {
    const baseReward = 150;
    // Constant Force experiment: F_net = 3000 N
    const netForce = [2400, 3000, 3600][Math.floor(Math.random() * 3)];
    const m1 = 600;
    const a1 = Number((netForce / m1).toFixed(1));
    const m2 = 1000;
    const a2 = Number((netForce / m2).toFixed(1));
    const m3 = 1200;
    const a3 = Number((netForce / m3).toFixed(1));

    // Hide one value in trial 2 or 3
    const hideTrial = Math.random() > 0.5 ? 2 : 3;
    const expectedValue = hideTrial === 2 ? a2 : a3;
    const targetMass = hideTrial === 2 ? m2 : m3;

    const tableHtml = `
      <table class="dyno-data-table">
        <thead>
          <tr>
            <th>Trial</th>
            <th>Net Force (N)</th>
            <th>Car Mass (kg)</th>
            <th>Acceleration (m/s²)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>${netForce}</td>
            <td>${m1}</td>
            <td>${a1}</td>
          </tr>
          <tr class="${hideTrial === 2 ? 'highlight-row' : ''}">
            <td>2</td>
            <td>${netForce}</td>
            <td>${m2}</td>
            <td>${hideTrial === 2 ? '<strong>[ ? ]</strong>' : a2}</td>
          </tr>
          <tr class="${hideTrial === 3 ? 'highlight-row' : ''}">
            <td>3</td>
            <td>${netForce}</td>
            <td>${m3}</td>
            <td>${hideTrial === 3 ? '<strong>[ ? ]</strong>' : a3}</td>
          </tr>
        </tbody>
      </table>
    `;

    return {
      id: 'table_' + Date.now(),
      category: 'table',
      title: "Dyno Data Table: Inverse Mass Relationship",
      badge: "a = F / m",
      tableHtml: tableHtml,
      prompt: `Students tested three different vehicle configurations while maintaining a constant net drive force of <strong>${netForce} N</strong>. Use Newton's 2nd Law to calculate the missing acceleration value in <strong>Trial ${hideTrial}</strong>:`,
      unit: "m/s²",
      inputType: "number",
      reward: baseReward,
      tolerance: 0.1,
      expectedValue: expectedValue,
      solutionSteps: [
        `Step 1: Notice that Net Force remains constant at ${netForce} N across all trials.`,
        `Step 2: In Trial ${hideTrial}, mass is ${targetMass} kg.`,
        `Step 3: a = F_net / m = ${netForce} N / ${targetMass} kg = <strong>${expectedValue} m/s²</strong>.`,
        `Concept Note: Doubling the mass cuts the acceleration in half!`
      ]
    };
  }

  // 4. Traction & Friction Limit Calculations (F_grip = mu * m * g)
  _genFrictionChallenge() {
    const baseReward = 140;
    const mass = [650, 750, 850, 950][Math.floor(Math.random() * 4)];
    const mu = [0.80, 0.90, 1.00, 1.10][Math.floor(Math.random() * 4)];
    const g = 10; // m/s² standard for clean, predictable patterns
    const maxGrip = Math.round(mu * mass * g);

    return {
      id: 'friction_' + Date.now(),
      category: 'friction',
      title: "Traction Limit: Maximum Grip Force",
      badge: "F<sub>friction</sub> = μ · m · g",
      prompt: `A rat rod has total mass <strong>${mass} kg</strong> and is fitted with racing tires with a static grip coefficient of <strong>μ = ${mu}</strong>. Using g = 10 m/s², what is the maximum drive force the tires can transfer to the asphalt before wheel spin occurs?`,
      unit: "N",
      inputType: "number",
      reward: baseReward,
      tolerance: 15,
      expectedValue: maxGrip,
      solutionSteps: [
        `Step 1: Calculate Normal Force: F<sub>N</sub> = m · g = (${mass} kg) · (10 m/s²) = ${mass * 10} N`,
        `Step 2: Maximum Static Friction: F<sub>max</sub> = μ · F<sub>N</sub> = ${mu} · ${mass * 10} N`,
        `Step 3: F<sub>max</sub> = <strong>${maxGrip} N</strong>`,
        `Note: If engine drive force exceeds this threshold, tires slip and burn rubber!`
      ]
    };
  }

  // Verify student answer
  checkAnswer(userVal) {
    if (!this.currentChallenge) return { success: false, msg: "No active challenge." };

    // Prevent duplicate evaluation exploit
    if (this.currentChallenge.answered) {
      return {
        success: false,
        alreadyAnswered: true,
        earnedCash: 0,
        streak: this.streak,
        msg: "This challenge has already been answered. Click Next Challenge to continue."
      };
    }

    const parsed = parseFloat(userVal);
    if (isNaN(parsed)) {
      return { success: false, msg: "Please enter a valid numerical value." };
    }

    // Mark as answered immediately
    this.currentChallenge.answered = true;

    const exp = this.currentChallenge.expectedValue;
    const tol = this.currentChallenge.tolerance || 0.1;
    const diff = Math.abs(parsed - exp);
    const isCorrect = diff <= tol;
    this.currentChallenge.wasCorrect = isCorrect;

    if (isCorrect) {
      this.streak++;
      let multiplier = 1.0;
      if (this.streak >= 5) multiplier = 2.0;
      else if (this.streak >= 3) multiplier = 1.5;
      else if (this.streak >= 2) multiplier = 1.25;

      const earned = Math.round((this.currentChallenge.reward || 100) * multiplier);
      return {
        success: true,
        correct: true,
        diff: diff,
        earnedCash: earned,
        streak: this.streak,
        multiplier: multiplier,
        steps: this.currentChallenge.solutionSteps || [],
        solutionSteps: this.currentChallenge.solutionSteps || []
      };
    } else {
      this.streak = 0;
      return {
        success: false,
        correct: false,
        diff: diff,
        earnedCash: 0,
        streak: 0,
        expected: exp,
        steps: this.currentChallenge.solutionSteps || [],
        solutionSteps: this.currentChallenge.solutionSteps || []
      };
    }
  }
}

window.PhysicsChallengeEngine = PhysicsChallengeEngine;
