/**
 * CAST Data Analysis & Graphing Practice - Scenario Bank
 * Multi-Disciplinary Scenarios for High School Science:
 * - Physics (Forces, Motion, Energy)
 * - Biology (Enzymes, Photosynthesis)
 * - Chemistry (Reaction Rates, Heating Curves)
 * - Earth & Space Science (Plate Tectonics, Climate Trends)
 *
 * Each scenario adheres strictly to the No-LaTeX rule:
 * Standard plain text, Unicode (Δ, ², ³, °C, x₀), bold variables.
 */

const SCENARIOS = [
  // -------------------------------------------------------------
  // PHYSICS 1: NEWTON'S SECOND LAW (NET FORCE VS ACCELERATION)
  // -------------------------------------------------------------
  {
    id: "physics-newton-second-law",
    title: "Newton's Second Law: Acceleration vs. Net Force",
    discipline: "Physics",
    disciplineBadge: "⚛️ Physics",
    ngssCode: "HS-PS2-1",
    ngssTitle: "Forces and Motion",
    sep: "SEP-4: Analyzing and Interpreting Data",
    ccc: "CCC-1: Patterns",
    chartType: "scatter",
    xAxis: {
      label: "Net Applied Force",
      symbol: "F",
      unit: "N",
      min: 0,
      suggestedMax: 35
    },
    yAxis: {
      label: "Measured Acceleration",
      symbol: "a",
      unit: "m/s²",
      min: 0,
      suggestedMax: 7.0
    },
    background: `A student engineering team investigates the relationship between net applied force and acceleration on a precision low-friction dynamics track. A frictionless glider with a fixed total mass of <strong>5.0 kg</strong> is accelerated horizontally using calibrated hanging masses suspended over an ultra-low-friction pulley. 

An optical photogate array linked to a high-speed digital timer measures the glider's acceleration across five consecutive trials. To rigorously isolate the net applied force as the sole independent variable, the team maintains constant controlled variables: total system mass (5.0 kg), track leveling verified with an electronic inclinometer (0.0° inclination), aerodynamic drag profile, and ambient laboratory temperature (21.5°C).`,
    controlledVariables: [
      "Total system mass held constant at exactly 5.0 kg across all trials",
      "Dynamics track leveled to 0.0° tilt with frictionless glider release"
    ],
    calibratedInstrumentation: [
      "Photogate array with 0.001 s timing precision",
      "Calibrated analytical hanging masses (±0.01 N tolerance)"
    ],
    dataTable: {
      caption: "Table 1: Glider Acceleration Under Varying Net Force (System Mass = 5.0 kg)",
      columns: [
        { key: "trial", label: "Trial #", isText: true },
        { key: "force", label: "Net Force (N)", isX: true, unit: "N" },
        { key: "accel", label: "Acceleration (m/s²)", isY: true, unit: "m/s²" }
      ],
      rows: [
        { trial: "Trial 1", force: 5.0, accel: 1.0 },
        { trial: "Trial 2", force: 10.0, accel: 2.0 },
        { trial: "Trial 3", force: 15.0, accel: 3.0 },
        { trial: "Trial 4", force: 20.0, accel: 4.0 },
        { trial: "Trial 5", force: 25.0, accel: 5.0 },
        { trial: "Trial 6", force: 30.0, accel: 6.0 }
      ]
    },
    graphConfig: {
      showBestFitDefault: true,
      beginAtZero: true,
      slope: 0.20,
      intercept: 0.0,
      r2: 1.0,
      equation: "a = 0.20 F + 0.00",
      slopeMeaning: "1 / Mass (1 / 5.0 kg = 0.20 m/s² per N)"
    },
    // -------------------------------------------------------------
    // 5-PART PEDAGOGICAL QUESTIONS ARCHITECTURE
    // -------------------------------------------------------------
    questions: {
      // 1. Graph Anatomy & Decoding Mechanics
      anatomy: {
        id: "anatomy_q",
        independentVar: "Net Applied Force (N)",
        dependentVar: "Measured Acceleration (m/s²)",
        locatorPrompt: "Find 25.0 N on the horizontal axis (Net Force). What is the corresponding measured acceleration on the vertical axis?",
        expectedLocatorValue: 5.0,
        locatorTolerance: 0.2,
        locatorUnit: "m/s²",
        interceptPrompt: "At Net Force F = 0 N, the best-fit line passes through the origin (0, 0). What is the physical meaning of this intercept?",
        interceptOptions: [
          "Without an unbalanced net force, an object at rest remains at rest (zero acceleration)",
          "The glider accelerates on its own due to gravity",
          "The mass of the glider drops to zero at the starting gate",
          "The photogate sensors are uncalibrated"
        ],
        interceptCorrectIndex: 0,
        interceptExplanation: "In accordance with Newton's First Law, when the net unbalanced external force is zero, the acceleration must be zero (the cart stays at rest)."
      },
      // 2. Trend Identification & Pattern
      trend: {
        id: "trend_q",
        type: "multiple_choice",
        prompt: "Based on the data table and graph, what is the mathematical relationship between net force and acceleration when mass is held constant?",
        options: [
          "Direct linear relationship (Acceleration is directly proportional to net force)",
          "Inverse relationship (Acceleration decreases as net force increases)",
          "Quadratic relationship (Acceleration increases with the square of net force)",
          "No relationship (Acceleration remains constant regardless of force)"
        ],
        correctIndex: 0,
        explanation: "As net force increases from 5 N to 30 N, acceleration increases at a constant linear rate of 0.20 m/s² for each 1 N increase in force (a = F<sub>net</sub> / m)."
      },
      // 3. Step-by-Step Guided Rate / Slope Analysis (SEP-5)
      quantitative: {
        id: "quant_q",
        type: "calculation",
        prompt: "Calculate the rate of change in acceleration with respect to force (the slope of the line, Δa / ΔF) between Trial 2 (10 N) and Trial 5 (25 N).",
        expectedValue: 0.20,
        tolerance: 0.02,
        unit: "(m/s²) / N",
        hint: "Use slope = (a₂ - a₁) / (F₂ - F₁). That is: (5.0 m/s² - 2.0 m/s²) / (25 N - 10 N) = 3.0 / 15 = 0.20 (m/s²)/N.",
        slopeSteps: {
          point1: { x: 10.0, y: 2.0, label: "Trial 2 (10 N, 2.0 m/s²)" },
          point2: { x: 25.0, y: 5.0, label: "Trial 5 (25 N, 5.0 m/s²)" },
          formulaSetup: "Slope = (5.0 m/s² - 2.0 m/s²) / (25.0 N - 10.0 N) = 3.0 / 15.0",
          calculatedSlope: 0.20,
          slopeUnit: "(m/s²)/N",
          physicalMeaning: "Inverse of the system mass (1 / m = 1 / 5.0 kg = 0.20 (m/s²)/N)"
        }
      },
      // 4. Scaffolded CER with Sentence Frames & Diagnostics
      freeResponse: {
        id: "fr_q",
        type: "cer",
        prompt: "Construct a Claim-Evidence-Reasoning argument explaining how changing the net force affects the acceleration of the glider.",
        zoneCriteria: {
          claim: "State how net applied force affects acceleration when mass is held constant.",
          evidence: ["Cite 2+ data pairs (Force, Acceleration) with units from Table 1.", "Compare values to show the rate of change."],
          reasoning: "Explain the physical principle connecting force, mass, and acceleration using Newton's Second Law (a = F<sub>net</sub> / m)."
        },
        targetNumbers: [5.0, 1.0, 10.0, 2.0, 15.0, 3.0, 20.0, 4.0, 25.0, 5.0, 30.0, 6.0, 0.2],
        requiredUnits: ["n", "newton", "m/s²", "m/s^2", "kg"],
        claimKeywords: ["direct", "proportional", "linear", "increases", "greater force", "doubling", "rate"],
        reasoningKeywords: ["newton", "second law", "mass", "f=ma", "net force", "inertia", "unbalanced"],
        exemplar: "Claim: The acceleration of the glider is directly proportional to the net applied force when mass is held constant. Evidence: At a net force of 10.0 N, the glider accelerated at 2.0 m/s². When the net force was doubled to 20.0 N, the acceleration exactly doubled to 4.0 m/s², maintaining a constant rate of change (slope) of 0.20 (m/s²)/N. Reasoning: According to Newton's Second Law (a = F<sub>net</sub> / m), an unbalanced net force causes a proportional acceleration inversely scaled by the object's mass (5.0 kg).",
        sentenceFrames: {
          claimFrame: "When system mass is held constant at 5.0 kg, the acceleration of the glider is [directly proportional to / inversely proportional to] the net applied force.",
          evidenceFrame: "As shown in the data, when the net force is [Value 1] N, the acceleration is [Value 1] m/s². When the force increases to [Value 2] N, the acceleration reaches [Value 2] m/s², resulting in a rate of change of 0.20 (m/s²)/N.",
          reasoningFrame: "This occurs because according to Newton's Second Law (F<sub>net</sub> = m·a), an unbalanced net force causes an acceleration inversely proportional to the system's [mass / speed], so doubling the force [doubles / halves] the acceleration."
        }
      },
      // 5. Synthesis & Diagnostic Misconception Extrapolation
      synthesis: {
        id: "syn_q",
        type: "multiple_choice",
        prompt: "If the student team applied a 40.0 N net force to the same 5.0 kg glider, what would be the predicted acceleration based on this linear model?",
        options: [
          "7.0 m/s²",
          "8.0 m/s²",
          "10.0 m/s²",
          "12.0 m/s²"
        ],
        correctIndex: 1,
        explanation: "Using a = F<sub>net</sub> / m = 40.0 N / 5.0 kg, or extending the slope line: a = (0.20)(40.0) = 8.0 m/s².",
        diagnosticPrompt: "A student incorrectly claims: 'If you double the net force from 10 N to 20 N, the acceleration quadruples to 8 m/s² because kinetic energy quadruples.' How does the data refute this misconception?",
        diagnosticOptions: [
          "Acceleration only depends on net force and mass (F=ma is linear), whereas kinetic energy scales with speed squared, not force.",
          "The glider mass was changing during the run.",
          "Friction cancels out all additional force.",
          "Acceleration does quadruple when measured with radar instead of photogates."
        ],
        diagnosticCorrectIndex: 0,
        diagnosticExplanation: "Newton's second law is strictly linear with net force: a = F<sub>net</sub> / m. Kinetic energy depends on the square of velocity (½mv²), not force directly."
      }
    }
  },

  // -------------------------------------------------------------
  // PHYSICS 2: BRAKING DISTANCE VS VEHICLE SPEED
  // -------------------------------------------------------------
  {
    id: "physics-braking-distance",
    title: "Kinetic Energy: Vehicle Braking Distance vs. Initial Speed",
    discipline: "Physics",
    disciplineBadge: "⚛️ Physics",
    ngssCode: "HS-PS3-1",
    ngssTitle: "Conservation of Energy and Energy Transfer",
    sep: "SEP-4: Analyzing and Interpreting Data",
    ccc: "CCC-1: Patterns",
    chartType: "line",
    xAxis: {
      label: "Initial Vehicle Speed",
      symbol: "v",
      unit: "m/s",
      min: 0,
      suggestedMax: 30
    },
    yAxis: {
      label: "Braking Distance",
      symbol: "d",
      unit: "m",
      min: 0,
      suggestedMax: 70
    },
    background: `Automotive safety engineers test the emergency stopping distance of an electric sedan (mass = 1,500 kg) on an enclosed, dry asphalt test track. In each experimental trial, the vehicle cruises at a set speed before the autonomous anti-lock braking system (ABS) applies maximum calibrated hydraulic braking force.

High-resolution GPS telemetry and wheel optical encoders record the exact braking distance from the millisecond the brake calipers engage until forward motion completely ceases. To isolate initial speed as the sole independent variable, the testing team strictly controls external variables: identical road surface roughness, dry asphalt conditions (zero precipitation), identical tire tread depth (8.0 mm), constant vehicle curb weight with ballast (1,500 kg), and zero driver reaction time (actuated by electronic telemetry).`,
    controlledVariables: [
      "Total vehicle mass with calibrated ballast held at 1,500 kg",
      "Identical tire compound and tread depth (8.0 mm on dry asphalt)",
      "Braking force maintained at maximum constant ABS deceleration",
      "Reaction time excluded (autonomous sensor trigger at 0.00 s)"
    ],
    calibratedInstrumentation: [
      "Differential GPS with 2 cm positioning accuracy",
      "Optical optical wheel-encoders sampling at 1,000 Hz",
      "Calibrated electronic brake pedal transducer"
    ],
    dataTable: {
      caption: "Table 1: Emergency Braking Distance as a Function of Speed",
      columns: [
        { key: "speed_mph", label: "Speed (mph)", isText: true },
        { key: "speed", label: "Initial Speed (m/s)", isX: true, unit: "m/s" },
        { key: "distance", label: "Braking Distance (m)", isY: true, unit: "m" }
      ],
      rows: [
        { speed_mph: "10 mph", speed: 4.5, distance: 1.6 },
        { speed_mph: "20 mph", speed: 8.9, distance: 6.4 },
        { speed_mph: "30 mph", speed: 13.4, distance: 14.4 },
        { speed_mph: "40 mph", speed: 17.9, distance: 25.6 },
        { speed_mph: "50 mph", speed: 22.4, distance: 40.0 },
        { speed_mph: "60 mph", speed: 26.8, distance: 57.6 }
      ]
    },
    graphConfig: {
      showBestFitDefault: false,
      beginAtZero: true,
      equation: "d = 0.08 v²",
      slopeMeaning: "Quadratic growth: Braking distance scales with v²"
    },
    questions: {
      // 1. Graph Anatomy & Decoding Mechanics
      anatomy: {
        id: "anatomy_q",
        independentVar: "Initial Vehicle Speed (m/s)",
        dependentVar: "Emergency Braking Distance (m)",
        locatorPrompt: "Find 17.9 m/s (~40 mph) on the horizontal axis. What is the corresponding braking distance on the vertical axis?",
        expectedLocatorValue: 25.6,
        locatorTolerance: 0.5,
        locatorUnit: "m",
        interceptPrompt: "At an initial speed of 0 m/s, the curve originates at (0, 0). What is the physical meaning of this point?",
        interceptOptions: [
          "A stationary vehicle requires zero braking distance to come to rest",
          "The brakes do not work when the car is parked",
          "The vehicle has infinite kinetic energy at rest",
          "The speedometer is miscalibrated"
        ],
        interceptCorrectIndex: 0,
        interceptExplanation: "If initial velocity is zero, the car possesses zero kinetic energy (KE = 0 J), so no stopping distance is required."
      },
      // 2. Trend Identification & Pattern
      trend: {
        id: "trend_q",
        type: "multiple_choice",
        prompt: "What trend does the graph reveal regarding the relationship between initial vehicle speed and braking distance?",
        options: [
          "Linear relationship (Braking distance increases at a constant rate)",
          "Non-linear quadratic relationship (Braking distance increases much faster as speed rises)",
          "Inverse relationship (Braking distance decreases at higher speeds)",
          "Logarithmic plateau (Braking distance levels off at highway speeds)"
        ],
        correctIndex: 1,
        explanation: "The curve steepens continuously. Doubling speed from ~8.9 m/s to ~17.9 m/s causes the braking distance to quadruple from 6.4 m to 25.6 m."
      },
      // 3. Step-by-Step Guided Rate / Factor Analysis (SEP-5)
      quantitative: {
        id: "quant_q",
        type: "calculation",
        title: "3. Calculating Distance Increase Factor:",
        prompt: "When initial speed doubles from 8.9 m/s (20 mph) to 17.9 m/s (40 mph), by what factor does the braking distance increase? (Divide distance at 17.9 m/s by distance at 8.9 m/s).",
        expectedValue: 4.0,
        tolerance: 0.2,
        unit: "factor (ratio)",
        hint: "Divide the two braking distances: 25.6 m / 6.4 m = 4.0.",
        slopeSteps: {
          point1: { x: 8.9, y: 6.4, label: "Trial 2 (8.9 m/s, 6.4 m)" },
          point2: { x: 17.9, y: 25.6, label: "Trial 4 (17.9 m/s, 25.6 m)" },
          formulaSetup: "Factor = d₂ / d₁ = 25.6 m / 6.4 m = 4.0",
          blankSetupWork: "Factor = d₂ / d₁ = ( _____ / _____ )",
          calculatedSlope: 4.0,
          slopeUnit: "ratio (4x)",
          calcLabel: "Calculated Factor:",
          physicalMeaning: "Work-Energy relationship: Stopping distance scales quadratically (d ∝ v²)"
        }
      },
      // 4. Scaffolded CER with Sentence Frames & Diagnostics
      freeResponse: {
        id: "fr_q",
        type: "cer",
        prompt: "Construct a scientific argument explaining why highway driving at 60 mph requires disproportionately longer stopping distances than residential driving at 30 mph. You must: (1) State a clear claim about how speed impacts braking distance, (2) Cite at least TWO specific data points with units from the table, (3) Show how the ratio of distances compares to the ratio of speeds, and (4) Explain the physics using the Work-Energy Theorem (KE = ½mv² and Work = F × d).",
        targetNumbers: [4.5, 1.6, 8.9, 6.4, 13.4, 14.4, 17.9, 25.6, 22.4, 40.0, 26.8, 57.6, 4, 4.0],
        requiredUnits: ["m/s", "m", "meters", "mph"],
        claimKeywords: ["quadratic", "disproportionate", "exponential", "quadruple", "square", "steep", "faster"],
        reasoningKeywords: ["kinetic energy", "work", "ke = 1/2mv²", "work-energy", "force", "friction", "dissipate"],
        exemplar: "Claim: Braking distance increases quadratically with speed (d ∝ v²) rather than linearly, so doubling speed quadruples required stopping distance. Evidence: At 13.4 m/s (30 mph), the braking distance is 14.4 m. When speed doubles to 26.8 m/s (60 mph), the stopping distance increases to 57.6 m, which is exactly 4.0 times greater (57.6 / 14.4 = 4.0). Reasoning: According to the Work-Energy Theorem, the work done by friction (W = F × d) must dissipate all vehicle kinetic energy (KE = ½mv²). Because kinetic energy is proportional to the square of velocity (v²), twice the speed contains four times the kinetic energy, requiring four times the stopping distance for constant braking force.",
        sentenceFrames: {
          claimFrame: "Emergency braking distance increases [linearly / quadratically] with initial vehicle speed, meaning higher speeds require disproportionately greater distance.",
          evidenceFrame: "At an initial speed of [Speed 1] m/s, the vehicle stops in [Distance 1] m, but when speed doubles to [Speed 2] m/s, the stopping distance increases to [Distance 2] m (a factor of 4.0x).",
          reasoningFrame: "This non-linear increase is explained by the Work-Energy Theorem (W = F·d = ½m·v²): because kinetic energy depends on the [square of velocity / linear velocity], doubling the velocity quadruples the thermal work that friction must do to stop the vehicle."
        }
      },
      // 5. Synthesis & Diagnostic Misconception Extrapolation
      synthesis: {
        id: "syn_q",
        type: "multiple_choice",
        prompt: "If a vehicle travels at 35.8 m/s (80 mph), approximately what braking distance would be required on this dry surface?",
        options: [
          "~75 m",
          "~102 m",
          "~140 m",
          "~200 m"
        ],
        correctIndex: 1,
        explanation: "Using d = 0.08 v²: d = 0.08 × (35.8)² ≈ 102.5 m. A vehicle traveling 4 times faster than 8.9 m/s requires 16 times the distance (16 × 6.4 m ≈ 102.4 m).",
        diagnosticPrompt: "A novice driver assumes: 'If 30 mph takes ~14 meters to stop, then 60 mph should take about 28 meters.' Why does real-world collision physics contradict this assumption?",
        diagnosticOptions: [
          "Linear scaling fails because stopping distance depends on kinetic energy (v²), not velocity (v), meaning doubling speed requires 4 times the stopping distance (~57.6 m), not 2 times.",
          "ABS systems only turn on at speeds below 45 mph.",
          "Tires gain more friction at higher speeds.",
          "Mass of the car decreases at high speeds."
        ],
        diagnosticCorrectIndex: 0,
        diagnosticExplanation: "Assuming linear stopping distance is one of the most dangerous driving misconceptions. Energy scales as v², so stopping distance quadruples when speed doubles."
      }
    }
  },

  // -------------------------------------------------------------
  // BIOLOGY 1: ENZYME CATALASE ACTIVITY VS TEMPERATURE
  // -------------------------------------------------------------
  {
    id: "biology-enzyme-temperature",
    title: "Enzyme Kinetics: Catalase Reaction Rate vs. Temperature",
    discipline: "Biology",
    disciplineBadge: "🌿 Biology",
    ngssCode: "HS-LS1-1",
    ngssTitle: "From Molecules to Organisms: Structures and Processes",
    sep: "SEP-4: Analyzing and Interpreting Data",
    ccc: "CCC-1: Patterns",
    chartType: "line",
    xAxis: {
      label: "Reaction Temperature",
      symbol: "T",
      unit: "°C",
      min: 0,
      suggestedMax: 70
    },
    yAxis: {
      label: "Oxygen Gas Production Rate",
      symbol: "Rate",
      unit: "mL/min",
      min: 0,
      suggestedMax: 100
    },
    background: `High school biology students investigate the catalytic activity of mammalian catalase, a globular protein enzyme that accelerates the decomposition of cellular metabolic toxins by breaking hydrogen peroxide into water and oxygen gas (2H₂O₂ → 2H₂O + O₂).

Uniform filter paper disks saturated with standardized bovine liver homogenate (providing constant enzyme concentration) are placed at the bottom of reaction vials filled with 30.0 mL of 3.0% hydrogen peroxide solution across a temperature gradient from 10°C to 65°C. To ensure environmental temperature is the sole manipulated independent variable, students strictly hold constant: substrate concentration (3.0% H₂O₂), solution pH buffered at 7.0 using phosphate buffer, disk surface area, and atmospheric pressure. An inverted water-displacement eudiometer records oxygen evolution over 3.0-minute trial intervals.`,
    controlledVariables: [
      "Substrate concentration held constant at 3.0% H₂O₂",
      "pH buffered to 7.0 with phosphate buffer solution",
      "Equal enzyme volume (identical saturated 6 mm filter paper disks)",
      "Standard 3.0-minute reaction duration per trial"
    ],
    calibratedInstrumentation: [
      "Digital precision water bath maintaining ±0.2°C stability",
      "Graduated eudiometer gas tube with 0.1 mL volumetric markings",
      "Calibrated electronic digital pH probe"
    ],
    dataTable: {
      caption: "Table 1: Catalase Activity as a Function of Environmental Temperature",
      columns: [
        { key: "temp", label: "Temperature (°C)", isX: true, unit: "°C" },
        { key: "rate", label: "Oxygen Produced (mL/min)", isY: true, unit: "mL/min" },
        { key: "status", label: "Observed Reaction", isText: true }
      ],
      rows: [
        { temp: 10, rate: 12.0, status: "Slow bubbling" },
        { temp: 20, rate: 28.0, status: "Moderate bubbling" },
        { temp: 30, rate: 54.0, status: "Rapid bubbling" },
        { temp: 37, rate: 86.0, status: "Peak vigorous bubbling (Optimal)" },
        { temp: 45, rate: 48.0, status: "Noticeably declining bubbling" },
        { temp: 55, rate: 10.0, status: "Faint bubbling" },
        { temp: 65, rate: 0.0, status: "Zero bubbling (No reaction)" }
      ]
    },
    graphConfig: {
      showBestFitDefault: false,
      beginAtZero: true,
      equation: "Optimum at 37°C; denatures > 45°C",
      slopeMeaning: "Kinetic activation (10–37°C) followed by protein denaturation (37–65°C)"
    },
    questions: {
      // 1. Graph Anatomy & Decoding Mechanics
      anatomy: {
        id: "anatomy_q",
        independentVar: "Environmental Temperature (°C)",
        dependentVar: "Rate of Oxygen Production (mL/min)",
        locatorPrompt: "Find 30°C on the horizontal axis. What is the corresponding oxygen production rate on the vertical axis?",
        expectedLocatorValue: 54.0,
        locatorTolerance: 1.0,
        locatorUnit: "mL/min",
        interceptPrompt: "At 65°C, the curve drops to 0.0 mL/min on the horizontal axis. What is the biological meaning of this point?",
        interceptOptions: [
          "Thermal energy has disrupted hydrogen and ionic bonds, permanently denaturing the enzyme's active site",
          "The substrate evaporated from the beaker",
          "The bacteria in the liver homogenate froze",
          "The chemical reaction reached chemical equilibrium"
        ],
        interceptCorrectIndex: 0,
        interceptExplanation: "Excess thermal energy above 45°C violently vibrates protein chains, unraveling the tertiary structure and destroying the active site."
      },
      // 2. Trend Identification & Pattern
      trend: {
        id: "trend_q",
        type: "multiple_choice",
        prompt: "Describe the overall pattern of catalase activity across the full temperature range (10°C to 65°C).",
        options: [
          "Linear increase across all temperatures",
          "Increases steadily up to an optimum around 37°C, then drops sharply toward zero",
          "Constant across all temperatures due to enzymatic stability",
          "Inversely proportional, with highest activity at near-freezing temperatures"
        ],
        correctIndex: 1,
        explanation: "Enzyme activity rises from 10°C to a peak of 86.0 mL/min at body temperature (37°C), then decreases sharply between 37°C and 65°C as thermal denaturation alters the protein structure."
      },
      // 3. Step-by-Step Guided Rate / Change Analysis (SEP-5)
      quantitative: {
        id: "quant_q",
        type: "calculation",
        title: "3. Calculating Change in Reaction Rate (Δy):",
        prompt: "By how many mL/min did the reaction rate drop when temperature increased from the optimal 37°C to 55°C? (Calculate Δy = Rate_37 − Rate_55).",
        expectedValue: 76.0,
        tolerance: 1.0,
        unit: "mL/min",
        hint: "Subtract the rate at 55°C (10.0 mL/min) from the rate at 37°C (86.0 mL/min): Δy = 86.0 - 10.0 = 76.0 mL/min.",
        slopeSteps: {
          point1: { x: 37, y: 86.0, label: "Optimum (37°C, 86.0 mL/min)" },
          point2: { x: 55, y: 10.0, label: "Denaturation (55°C, 10.0 mL/min)" },
          formulaSetup: "Δy = Rate_37 − Rate_55 = 86.0 mL/min − 10.0 mL/min = 76.0 mL/min",
          blankSetupWork: "Δy = Rate_37 − Rate_55 = ( _____ − _____ )",
          calculatedSlope: 76.0,
          slopeUnit: "mL/min",
          calcLabel: "Calculated Drop (Δy):",
          physicalMeaning: "Quantitative loss of enzymatic catalytic throughput due to thermal denaturation"
        }
      },
      // 4. Scaffolded CER with Sentence Frames & Diagnostics
      freeResponse: {
        id: "fr_q",
        type: "cer",
        prompt: "Construct a Claim-Evidence-Reasoning explanation describing the biological effect of high fever (>41°C) on human enzyme function. You must: (1) State a claim regarding how high temperatures affect enzyme activity, (2) Cite at least TWO specific data points with units from the table, (3) Contrast the rate at optimum with the rate at elevated temperatures, and (4) Explain the biochemical mechanism involving enzyme active site conformation and hydrogen bonds (denaturation).",
        targetNumbers: [10, 12.0, 20, 28.0, 30, 54.0, 37, 86.0, 45, 48.0, 55, 10.0, 65, 0.0, 76.0],
        requiredUnits: ["°c", "c", "deg c", "degrees c", "ml/min"],
        claimKeywords: ["denature", "optimum", "drops", "decreases", "loss of function", "peak", "inhibits"],
        reasoningKeywords: ["active site", "denaturation", "hydrogen bonds", "tertiary structure", "substrate", "conformation", "protein"],
        exemplar: "Claim: Elevated temperatures above 37°C cause rapid loss of catalase enzyme activity due to protein denaturation. Evidence: Catalase reaches maximum activity at 37°C with an oxygen production rate of 86.0 mL/min. As temperature rises to 45°C, the rate plunges to 48.0 mL/min, and by 65°C the rate reaches 0.0 mL/min (a complete drop of 86.0 mL/min). Reasoning: Below 37°C, increasing temperature boosts molecular kinetic energy and substrate collision frequency. Above 37°C, excessive thermal agitation disrupts delicate hydrogen and ionic bonds stabilizing the enzyme's tertiary structure. This denatures the protein and deforms its active site, preventing hydrogen peroxide substrates from binding.",
        sentenceFrames: {
          claimFrame: "Elevated temperatures above the 37°C optimum cause human enzyme activity to [increase rapidly / drop drastically] due to loss of protein structure.",
          evidenceFrame: "At optimal body temperature of 37°C, catalase produces [Peak Value] mL/min of O₂, but when temperature rises to 55°C, output plummets to [High Temp Value] mL/min (a drop of 76.0 mL/min).",
          reasoningFrame: "This occurs because thermal agitation breaks the [hydrogen and ionic bonds / covalent peptide bonds] stabilizing the enzyme's tertiary structure, denaturing the [active site / cell wall] so substrate molecules can no longer fit."
        }
      },
      // 5. Synthesis & Diagnostic Misconception Extrapolation
      synthesis: {
        id: "syn_q",
        type: "multiple_choice",
        prompt: "If the boiled liver homogenate from the 65°C trial is cooled back down to 37°C and mixed with fresh H₂O₂, what will happen?",
        options: [
          "Activity will return to 86.0 mL/min because temperature is optimal again",
          "Zero or near-zero oxygen will be produced because denaturation is largely irreversible",
          "The rate will double because substrate accumulated",
          "The enzyme will convert hydrogen peroxide into toxic radicals"
        ],
        correctIndex: 1,
        explanation: "Extreme thermal denaturation unfolds the protein and alters its active site irreversibly. Cooling the denatured protein does not restore its functional 3D conformation.",
        diagnosticPrompt: "A student states: 'Enzymes slow down at 10°C for the exact same molecular reason they slow down at 65°C.' Why is this biological reasoning incorrect?",
        diagnosticOptions: [
          "At 10°C, low kinetic energy reduces collision frequency without damaging structure; at 65°C, the enzyme is physically denatured and permanently nonfunctional.",
          "At 10°C the enzyme is destroyed, but at 65°C it is frozen.",
          "Hydrogen bonds only form at 65°C.",
          "Enzymes work at identical speeds at both temperatures."
        ],
        diagnosticCorrectIndex: 0,
        diagnosticExplanation: "Cold temperatures preserve enzyme active site structure but reduce kinetic motion; excessive heat destroys tertiary bonding and denatures the protein."
      }
    }
  },

  // -------------------------------------------------------------
  // BIOLOGY 2: PHOTOSYNTHESIS VS LIGHT INTENSITY
  // -------------------------------------------------------------
  {
    id: "biology-photosynthesis-light",
    title: "Bioenergetics: Photosynthesis Rate vs. Light Intensity",
    discipline: "Biology",
    disciplineBadge: "🌿 Biology",
    ngssCode: "HS-LS1-5",
    ngssTitle: "Photosynthesis and Energy Flow",
    sep: "SEP-4: Analyzing and Interpreting Data",
    ccc: "CCC-1: Patterns",
    chartType: "scatter",
    xAxis: {
      label: "Light Intensity",
      symbol: "I",
      unit: "mW/cm²",
      min: 0,
      suggestedMax: 80
    },
    yAxis: {
      label: "Oxygen Production Rate",
      symbol: "R",
      unit: "mL/hr",
      min: 0,
      suggestedMax: 18
    },
    background: `An AP Biology laboratory group investigates light-dependent photosynthetic rate using sprigs of aquatic elodea weed (Elodea canadensis) submerged in an airtight glass respiration chamber filled with 250 mL of 0.20 M sodium bicarbonate (NaHCO₃) solution, providing a continuous, non-limiting reservoir of dissolved inorganic carbon dioxide.

A full-spectrum calibrated LED quantum growth lamp illuminates the chamber at controlled photon intensities ranging from 5 to 80 mW/cm². To isolate light intensity as the sole manipulated independent variable, students implement rigorous controls: a circulating optical water-jacket thermal filter that absorbs infrared heat to maintain the chamber at precisely 22.0°C (±0.2°C), constant elodea vegetative wet mass (10.0 g), and uniform chamber stirring. A high-precision optical dissolved oxygen sensor connected to a micro-respirometer quantifies the rate of photosynthetic oxygen evolution in mL of O₂ per hour.`,
    controlledVariables: [
      "Circulating water bath thermal jacket holding temperature at 22.0°C (±0.2°C)",
      "Non-limiting carbon source (0.20 M NaHCO₃ providing excess CO₂)",
      "Plant biomass held constant at exactly 10.0 g of fresh elodea",
      "Full-spectrum photosynthetically active radiation (PAR 400–700 nm)"
    ],
    calibratedInstrumentation: [
      "Quantum light sensor (PAR radiometer calibrated in mW/cm²)",
      "Micro-respirometer with digital optical O₂ probe (0.01 mL resolution)",
      "Submersible magnetic stirrer providing uniform solution mixing"
    ],
    dataTable: {
      caption: "Table 1: Net Photosynthetic Rate Under Varying Light Intensities",
      columns: [
        { key: "intensity", label: "Light Intensity (mW/cm²)", isX: true, unit: "mW/cm²" },
        { key: "oxygen", label: "O₂ Production (mL/hr)", isY: true, unit: "mL/hr" },
        { key: "limiting", label: "Primary Limiting Factor", isText: true }
      ],
      rows: [
        { intensity: 5, oxygen: 1.5, limiting: "Light Availability" },
        { intensity: 10, oxygen: 3.2, limiting: "Light Availability" },
        { intensity: 20, oxygen: 6.5, limiting: "Light Availability" },
        { intensity: 35, oxygen: 10.8, limiting: "Light Availability" },
        { intensity: 50, oxygen: 14.2, limiting: "Approaching Saturation" },
        { intensity: 65, oxygen: 14.6, limiting: "Enzyme / CO₂ Saturated" },
        { intensity: 80, oxygen: 14.7, limiting: "Light Saturated (Plateau)" }
      ]
    },
    graphConfig: {
      showBestFitDefault: false,
      beginAtZero: true,
      equation: "Linear rise (0-50 mW/cm²) then saturation plateau (~14.6 mL/hr)",
      slopeMeaning: "Light-limited photochemical efficiency transitioning to light saturation"
    },
    questions: {
      // 1. Graph Anatomy & Decoding Mechanics
      anatomy: {
        id: "anatomy_q",
        independentVar: "Light Intensity (mW/cm²)",
        dependentVar: "Net Oxygen Production Rate (mL/hr)",
        locatorPrompt: "Find 20 mW/cm² on the horizontal axis. What is the corresponding oxygen production rate on the vertical axis?",
        expectedLocatorValue: 6.5,
        locatorTolerance: 0.3,
        locatorUnit: "mL/hr",
        interceptPrompt: "At very high light intensities (65 to 80 mW/cm²), the graph becomes completely horizontal (plateaus near 14.6 mL/hr). What is the biological meaning of this plateau?",
        interceptOptions: [
          "Photosystem reaction centers and Calvin cycle enzymes (Rubisco) are operating at maximum catalytic turnover, so light is no longer the limiting factor",
          "The plant has completely exhausted all water molecules in the chamber",
          "The LED lamp has burned out and stops emitting photons",
          "The plant chloroplasts have turned into mitochondria"
        ],
        interceptCorrectIndex: 0,
        interceptExplanation: "Once all chlorophyll photosystems absorb photons faster than enzymes can fix carbon, the system reaches saturation and additional light produces no extra oxygen."
      },
      // 2. Trend Identification & Pattern
      trend: {
        id: "trend_q",
        type: "multiple_choice",
        prompt: "Which statement accurately characterizes the relationship between light intensity and oxygen production?",
        options: [
          "Direct linear increase across all light intensities without limits",
          "Initial linear increase at low intensities, leveling off into a plateau above 50 mW/cm²",
          "Inverse relationship where intense light halts oxygen generation immediately",
          "Exponential upward curve that continuously steepens"
        ],
        correctIndex: 1,
        explanation: "Photosynthesis increases linearly while light is the limiting reactant (5 to 50 mW/cm²), then plateaus near ~14.6 mL/hr once chloroplast pigments and Calvin cycle enzymes reach maximum turnover."
      },
      // 3. Step-by-Step Guided Rate Analysis (SEP-5)
      quantitative: {
        id: "quant_q",
        type: "calculation",
        prompt: "Calculate the average rate of increase in O₂ production per mW/cm² of light between 5 mW/cm² and 50 mW/cm² (ΔO₂ / ΔIntensity).",
        expectedValue: 0.28,
        tolerance: 0.03,
        unit: "(mL/hr) / (mW/cm²)",
        hint: "Use Δy / Δx: (14.2 mL/hr - 1.5 mL/hr) / (50 mW/cm² - 5 mW/cm²) = 12.7 / 45 ≈ 0.282.",
        slopeSteps: {
          point1: { x: 5, y: 1.5, label: "Low Light (5 mW/cm², 1.5 mL/hr)" },
          point2: { x: 50, y: 14.2, label: "Saturation Point (50 mW/cm², 14.2 mL/hr)" },
          formulaSetup: "Slope = (14.2 mL/hr - 1.5 mL/hr) / (50 mW/cm² - 5 mW/cm²) = 12.7 / 45 ≈ 0.282",
          calculatedSlope: 0.28,
          slopeUnit: "(mL/hr)/(mW/cm²)",
          physicalMeaning: "Photochemical quantum yield efficiency during the light-limited linear phase"
        }
      },
      // 4. Scaffolded CER with Sentence Frames & Diagnostics
      freeResponse: {
        id: "fr_q",
        type: "cer",
        prompt: "Construct a Claim-Evidence-Reasoning explanation answering: 'Why does increasing light intensity beyond 50 mW/cm² fail to significantly increase the rate of photosynthesis?'",
        zoneCriteria: {
          claim: "State how increasing light beyond 50 mW/cm² affects the rate of photosynthesis.",
          evidence: ["Cite 2+ data pairs (Light, O₂ Production) with units from Table 1.", "Contrast the rate of change before and after 50 mW/cm²."],
          reasoning: "Explain cellular biochemical limits (chlorophyll light saturation and enzyme turnover capacity)."
        },
        targetNumbers: [5, 1.5, 10, 3.2, 20, 6.5, 35, 10.8, 50, 14.2, 65, 14.6, 80, 14.7, 0.28],
        requiredUnits: ["mw/cm²", "mw/cm^2", "ml/hr"],
        claimKeywords: ["plateau", "saturation", "limiting factor", "levels off", "no longer increases", "maximum rate"],
        reasoningKeywords: ["light reactions", "chlorophyll", "calvin cycle", "rubisco", "enzymes", "turnover", "limiting factor"],
        exemplar: "Claim: Photosynthesis reaches a light saturation point around 50 mW/cm², after which light is no longer the limiting reactant. Evidence: Between 5 and 50 mW/cm², oxygen production increased rapidly from 1.5 to 14.2 mL/hr (a gain of 12.7 mL/hr). However, increasing light further from 50 to 80 mW/cm² only increased oxygen output from 14.2 to 14.7 mL/hr (a negligible gain of 0.5 mL/hr). Reasoning: In the light-dependent reactions, chlorophyll reaction centers absorb photons to split water and produce O₂. At high light intensities, all photosystem complexes are saturated with photons and operating at peak capacity; the Calvin cycle enzymes (like Rubisco) cannot fix carbon any faster, making enzyme availability or CO₂ the new limiting factor.",
        sentenceFrames: {
          claimFrame: "Photosynthetic oxygen evolution reaches a distinct [saturation plateau / linear increase] at high light intensities because light ceases to be the rate-limiting reactant.",
          evidenceFrame: "Between 5 and 50 mW/cm², oxygen output rises from [Low O₂] to [Mid O₂] mL/hr, but increasing light from 50 to 80 mW/cm² only alters output from 14.2 to [High O₂] mL/hr.",
          reasoningFrame: "This plateau occurs because [photosystem complexes and Calvin cycle enzymes / plant roots and stems] reach their maximum biochemical processing velocity; further increases in photon flux cannot speed up oxygen generation without increasing [temperature or CO₂ concentration / light color]."
        }
      },
      // 5. Synthesis & Diagnostic Misconception Extrapolation
      synthesis: {
        id: "syn_q",
        type: "multiple_choice",
        prompt: "What environmental modification would most effectively elevate the plateau above 14.7 mL/hr at 80 mW/cm²?",
        options: [
          "Double the light intensity to 160 mW/cm²",
          "Increase the ambient CO₂ concentration in the chamber",
          "Remove dissolved carbon dioxide from the water",
          "Lower the chamber temperature to 5°C"
        ],
        correctIndex: 1,
        explanation: "Because light is no longer the limiting factor at the plateau, providing more of another essential reactant (such as dissolved CO₂) enables Calvin cycle enzymes to fix carbon faster, shifting the plateau upward.",
        diagnosticPrompt: "A student looks at the plateau and argues: 'At 80 mW/cm², the plant has stopped photosynthesizing because the line is flat.' How does the data refute this common misconception?",
        diagnosticOptions: [
          "A flat horizontal line with non-zero y-value (14.7 mL/hr) indicates high, continuous oxygen production at maximum speed, not zero production.",
          "The plant has died and is rotting.",
          "Oxygen production only happens on upward slopes.",
          "The y-axis actually measures glucose, not oxygen."
        ],
        diagnosticCorrectIndex: 0,
        diagnosticExplanation: "Students frequently confuse rate with total accumulation. A horizontal line on a rate graph means constant maximum production (~14.7 mL of O₂ each and every hour)."
      }
    }
  },

  // -------------------------------------------------------------
  // CHEMISTRY 1: REACTION RATE VS CONCENTRATION
  // -------------------------------------------------------------
  {
    id: "chem-reaction-rate-concentration",
    title: "Chemical Kinetics: Reaction Rate vs. Reactant Concentration",
    discipline: "Chemistry",
    disciplineBadge: "🧪 Chemistry",
    ngssCode: "HS-PS1-5",
    ngssTitle: "Chemical Reactions and Collision Theory",
    sep: "SEP-4: Analyzing and Interpreting Data",
    ccc: "CCC-1: Patterns",
    chartType: "scatter",
    xAxis: {
      label: "Hydrochloric Acid Concentration",
      symbol: "[HCl]",
      unit: "M",
      min: 0,
      suggestedMax: 1.4
    },
    yAxis: {
      label: "Initial Rate of Hydrogen Gas Evolution",
      symbol: "Rate",
      unit: "mL/s",
      min: 0,
      suggestedMax: 4.0
    },
    background: `A high school chemistry class investigates the kinetics of single replacement oxidation-reduction between solid metallic magnesium ribbon and aqueous hydrochloric acid:
Mg(s) + 2HCl(aq) → MgCl₂(aq) + H₂(g) + Heat.

In six consecutive quantitative trials, uniform 2.00 cm strips of magnesium ribbon (mass = 0.040 g) are submerged into 50.0 mL of standardized HCl solution at molar concentrations ranging from 0.20 M to 1.20 M. To isolate acid concentration as the sole independent variable, students implement strict controls: all reagent solutions are maintained at an isothermal 21.0°C in a water bath, ribbons are polished with emery cloth to eliminate passivating oxide coatings, and reaction volume is held constant. A digital differential pressure transducer connected to an airtight gas-collection manifold logs initial hydrogen gas evolution (mL/s) over the first 15.0 seconds of reaction.`,
    controlledVariables: [
      "Reaction temperature held strictly isothermal at 21.0°C (±0.1°C)",
      "Magnesium ribbon surface area and mass constant (2.00 cm, 0.040 g, oxide-polished)",
      "Aqueous solution volume held constant at 50.0 mL",
      "Identical reaction vessel geometry and initial atmospheric pressure"
    ],
    calibratedInstrumentation: [
      "Digital differential pressure transducer (0.01 kPa sensitivity)",
      "Standardized analytical volumetric pipettes (±0.05 mL tolerance)",
      "Analytical balance (0.001 g resolution)"
    ],
    dataTable: {
      caption: "Table 1: Initial Rate of H₂ Generation Across Increasing HCl Molarities",
      columns: [
        { key: "trial", label: "Trial #", isText: true },
        { key: "conc", label: "[HCl] Concentration (M)", isX: true, unit: "M" },
        { key: "rate", label: "Initial H₂ Rate (mL/s)", isY: true, unit: "mL/s" }
      ],
      rows: [
        { trial: "Trial 1", conc: 0.20, rate: 0.55 },
        { trial: "Trial 2", conc: 0.40, rate: 1.10 },
        { trial: "Trial 3", conc: 0.60, rate: 1.65 },
        { trial: "Trial 4", conc: 0.80, rate: 2.20 },
        { trial: "Trial 5", conc: 1.00, rate: 2.75 },
        { trial: "Trial 6", conc: 1.20, rate: 3.30 }
      ]
    },
    graphConfig: {
      showBestFitDefault: true,
      beginAtZero: true,
      slope: 2.75,
      intercept: 0.0,
      r2: 1.0,
      equation: "Rate = 2.75 [HCl] + 0.00",
      slopeMeaning: "Rate constant factor: +2.75 mL/s per 1.0 M increase in HCl"
    },
    questions: {
      // 1. Graph Anatomy & Decoding Mechanics
      anatomy: {
        id: "anatomy_q",
        independentVar: "Hydrochloric Acid Concentration ([HCl] in M)",
        dependentVar: "Initial Rate of Hydrogen Gas Evolution (mL/s)",
        locatorPrompt: "Find 0.80 M on the horizontal axis. What is the corresponding initial reaction rate on the vertical axis?",
        expectedLocatorValue: 2.20,
        locatorTolerance: 0.08,
        locatorUnit: "mL/s",
        interceptPrompt: "At [HCl] = 0.0 M, the best-fit regression line intersects at (0, 0). What is the chemical meaning of this intercept?",
        interceptOptions: [
          "Without hydrogen ion reactants (zero acid concentration), no chemical collisions can occur and the reaction rate is zero",
          "The magnesium ribbon dissolves instantly in pure water",
          "The beaker has run out of atmospheric air",
          "The pressure sensor needs a battery replacement"
        ],
        interceptCorrectIndex: 0,
        interceptExplanation: "According to collision theory, without reactant particles present ([HCl] = 0), collision frequency is zero and no reaction can take place."
      },
      // 2. Trend Identification & Pattern
      trend: {
        id: "trend_q",
        type: "multiple_choice",
        prompt: "What mathematical trend describes how HCl concentration affects the initial rate of hydrogen gas production?",
        options: [
          "Direct linear proportionality (Reaction rate is directly proportional to acid concentration)",
          "Inverse relationship (Higher concentration slows down the reaction)",
          "Step function with distinct flat thresholds",
          "Zero correlation between concentration and rate"
        ],
        correctIndex: 0,
        explanation: "Doubling concentration from 0.40 M to 0.80 M exactly doubles the rate from 1.10 mL/s to 2.20 mL/s, indicating a first-order direct linear relationship."
      },
      // 3. Step-by-Step Guided Rate / Slope Analysis (SEP-5)
      quantitative: {
        id: "quant_q",
        type: "calculation",
        prompt: "Calculate the rate of change in reaction speed per unit increase in molarity (the slope of the graph, ΔRate / Δ[HCl]) between 0.20 M and 1.00 M.",
        expectedValue: 2.75,
        tolerance: 0.1,
        unit: "(mL/s) / M",
        hint: "Slope = (2.75 mL/s - 0.55 mL/s) / (1.00 M - 0.20 M) = 2.20 / 0.80 = 2.75 (mL/s)/M.",
        slopeSteps: {
          point1: { x: 0.20, y: 0.55, label: "Trial 1 (0.20 M, 0.55 mL/s)" },
          point2: { x: 1.00, y: 2.75, label: "Trial 5 (1.00 M, 2.75 mL/s)" },
          formulaSetup: "Slope = (2.75 mL/s - 0.55 mL/s) / (1.00 M - 0.20 M) = 2.20 / 0.80 = 2.75",
          calculatedSlope: 2.75,
          slopeUnit: "(mL/s)/M",
          physicalMeaning: "First-order kinetics rate factor: rate increases by 2.75 mL/s per 1.0 M increase in HCl"
        }
      },
      // 4. Scaffolded CER with Sentence Frames & Diagnostics
      freeResponse: {
        id: "fr_q",
        type: "cer",
        prompt: "Construct a Claim-Evidence-Reasoning explanation connecting reactant concentration to reaction rate using Collision Theory. You must: (1) State a claim regarding how concentration affects reaction rate, (2) Cite at least TWO specific data points with units from the table, (3) Show how doubling concentration impacts rate, and (4) Explain the molecular mechanism using Collision Theory (particle density and frequency of effective collisions).",
        targetNumbers: [0.20, 0.55, 0.40, 1.10, 0.60, 1.65, 0.80, 2.20, 1.00, 2.75, 1.20, 3.30, 2.75],
        requiredUnits: ["m", "molar", "ml/s"],
        claimKeywords: ["direct", "proportional", "linear", "increases", "doubling", "faster", "higher concentration"],
        reasoningKeywords: ["collision theory", "particle", "frequency", "effective collisions", "density", "activation energy", "surface area"],
        exemplar: "Claim: The initial reaction rate between magnesium and hydrochloric acid is directly proportional to HCl concentration. Evidence: At 0.40 M HCl, hydrogen gas evolved at 1.10 mL/s. When acid concentration was doubled to 0.80 M, the rate doubled to 2.20 mL/s, exhibiting a constant linear slope of 2.75 (mL/s)/M across all trials. Reasoning: According to Collision Theory, chemical reactions require reactant particles to collide with sufficient energy and correct orientation. Increasing acid molarity increases the number of H⁺ ions per unit volume, directly multiplying the frequency of effective collisions against the magnesium metal surface per second.",
        sentenceFrames: {
          claimFrame: "The initial reaction rate between magnesium ribbon and hydrochloric acid is [directly proportional / inversely related] to acid molarity.",
          evidenceFrame: "In Trial 2, at 0.40 M HCl, hydrogen gas generated at [Rate 1] mL/s; when acid concentration doubled to 0.80 M (Trial 4), generation rate doubled to [Rate 2] mL/s (a slope of 2.75 (mL/s)/M).",
          reasoningFrame: "According to Collision Theory, doubling molar concentration doubles the [density of dissolved H⁺ ions / temperature of the water], directly doubling the [frequency of effective collisions / mass of magnesium] with sufficient activation energy."
        }
      },
      // 5. Synthesis & Diagnostic Misconception Extrapolation
      synthesis: {
        id: "syn_q",
        type: "multiple_choice",
        prompt: "If the experiment were repeated using 1.00 M HCl at 40°C instead of 21°C, how would the data point compare to Trial 5 (1.00 M, 2.75 mL/s)?",
        options: [
          "Rate would remain 2.75 mL/s because concentration is unchanged",
          "Rate would exceed 2.75 mL/s because higher kinetic energy increases collision frequency and energy",
          "Rate would decrease because warm gases dissolve slower",
          "The reaction would stop completely"
        ],
        correctIndex: 1,
        explanation: "Increasing temperature increases average molecular kinetic energy, increasing both the overall collision frequency and the percentage of collisions that exceed the activation energy threshold.",
        diagnosticPrompt: "A student predicts: 'If you use 1.00 M HCl with powdered magnesium instead of a solid 2.0 cm ribbon, the slope will remain exactly 2.75 (mL/s)/M because the acid molarity didn't change.' How does collision theory critique this prediction?",
        diagnosticOptions: [
          "Powdered magnesium vastly increases exposed surface area, dramatically increasing collision frequency and producing a much steeper initial rate slope.",
          "Powdered metal cannot react with aqueous acids.",
          "Surface area only affects gas-phase reactions.",
          "Powdered magnesium lowers the acid concentration."
        ],
        diagnosticCorrectIndex: 0,
        diagnosticExplanation: "Reaction rate is governed by surface collision frequency. Greater surface area exposes far more metal atoms to simultaneous H⁺ collisions."
      }
    }
  },

  // -------------------------------------------------------------
  // CHEMISTRY 2: HEATING CURVE OF WATER (PHASE CHANGES)
  // -------------------------------------------------------------
  {
    id: "chem-heating-curve-water",
    title: "Thermodynamics: Heating Curve of Water & Phase Changes",
    discipline: "Chemistry",
    disciplineBadge: "🧪 Chemistry",
    ngssCode: "HS-PS1-4",
    ngssTitle: "Thermal Energy and Molecular Models",
    sep: "SEP-4: Analyzing and Interpreting Data",
    ccc: "CCC-1: Patterns",
    chartType: "line",
    xAxis: {
      label: "Heating Time",
      symbol: "t",
      unit: "min",
      min: 0,
      suggestedMax: 16
    },
    yAxis: {
      label: "Sample Temperature",
      symbol: "T",
      unit: "°C",
      min: -20,
      suggestedMax: 120
    },
    background: `An Honors Chemistry student places exactly 100.0 grams of crushed crystalline ice at an initial temperature of -15.0°C inside a precision adiabatic calorimeter equipped with a continuous electric immersion heating element delivering constant, uniform thermal power (P = 500.0 Watts = 500.0 J/s).

A digital thermocouple temperature sensor records the temperature of the water sample once per minute over a 15-minute heating span as the solid warms, transitions through melting, heats as liquid, and vaporizes into steam at 1.00 atm atmospheric pressure. Controlled variables maintained to ensure internal validity include: constant heating rate (zero voltage fluctuation), sealed adiabatic insulation preventing thermal energy loss to the surroundings, ambient atmospheric pressure (101.3 kPa), and continuous magnetic stirring during liquid phases.`,
    controlledVariables: [
      "Constant thermal power input maintained at 500.0 W (±1.0 W)",
      "Sample mass held constant at exactly 100.0 g of H₂O",
      "Ambient pressure constant at standard 1.00 atm (101.3 kPa)",
      "Adiabatic calorimeter walls preventing ambient heat exchange"
    ],
    calibratedInstrumentation: [
      "Calibrated high-precision thermocouple data logger (±0.1°C)",
      "Regulated DC power supply with digital wattmeter",
      "Digital analytical balance (0.01 g precision)"
    ],
    dataTable: {
      caption: "Table 1: Temperature Progression of Water During Constant Heat Addition",
      columns: [
        { key: "time", label: "Time (min)", isX: true, unit: "min" },
        { key: "temp", label: "Temperature (°C)", isY: true, unit: "°C" },
        { key: "phase", label: "Observed Physical State", isText: true }
      ],
      rows: [
        { time: 0, temp: -15.0, phase: "Solid Ice" },
        { time: 1, temp: 0.0, phase: "Ice Reaches Melting Point" },
        { time: 2, temp: 0.0, phase: "Melting (Ice + Liquid Water Coexist)" },
        { time: 3, temp: 0.0, phase: "Melting (Last Ice Melts)" },
        { time: 5, temp: 33.0, phase: "Liquid Water Heating" },
        { time: 7, temp: 66.0, phase: "Liquid Water Heating" },
        { time: 9, temp: 100.0, phase: "Liquid Reaches Boiling Point" },
        { time: 11, temp: 100.0, phase: "Boiling (Liquid + Steam Coexist)" },
        { time: 13, temp: 100.0, phase: "Boiling (Vaporization Phase)" },
        { time: 15, temp: 115.0, phase: "Superheated Steam (Gas)" }
      ]
    },
    graphConfig: {
      showBestFitDefault: false,
      beginAtZero: false,
      equation: "Plateaus at 0°C (Melting) and 100°C (Boiling)",
      slopeMeaning: "Slanted regions = ΔKinetic Energy; Horizontal plateaus = ΔPotential Energy (Phase Changes)"
    },
    questions: {
      // 1. Graph Anatomy & Decoding Mechanics
      anatomy: {
        id: "anatomy_q",
        independentVar: "Heating Time (min)",
        dependentVar: "Water Temperature (°C)",
        locatorPrompt: "Find minute 7 on the horizontal axis. What is the corresponding temperature of the liquid water on the vertical axis?",
        expectedLocatorValue: 66.0,
        locatorTolerance: 1.0,
        locatorUnit: "°C",
        interceptPrompt: "At minute 0, the temperature begins at -15.0°C (below zero). What is the physical state of the water molecules at this starting point?",
        interceptOptions: [
          "Molecules are locked in a rigid hexagonal crystal lattice of solid ice",
          "Molecules are flowing freely as liquid water",
          "Molecules have broken into separate hydrogen and oxygen atoms",
          "Molecules possess zero total thermal energy"
        ],
        interceptCorrectIndex: 0,
        interceptExplanation: "Below 0°C at 1 atm, water exists exclusively as solid crystalline ice where hydrogen bonds lock H₂O molecules into a rigid structural lattice."
      },
      // 2. Trend Identification & Pattern
      trend: {
        id: "trend_q",
        type: "multiple_choice",
        prompt: "Why does the temperature line remain completely flat and horizontal between minutes 1–3 and minutes 9–13 despite continuous heat addition?",
        options: [
          "The heating element automatically turned off during those intervals",
          "Added thermal energy is converted into intermolecular potential energy to break hydrogen bonds rather than increasing kinetic energy",
          "Water reflects thermal radiation at 0°C and 100°C",
          "The digital thermometer froze"
        ],
        correctIndex: 1,
        explanation: "During phase changes, added thermal energy breaks intermolecular forces (hydrogen bonds) rather than increasing molecular motion (kinetic energy/temperature)."
      },
      // 3. Step-by-Step Guided Rate Analysis (SEP-5)
      quantitative: {
        id: "quant_q",
        type: "calculation",
        prompt: "Calculate the rate of temperature increase (slope in °C/min) during the liquid water heating phase between minute 3 (0.0°C) and minute 9 (100.0°C).",
        expectedValue: 16.67,
        tolerance: 0.5,
        unit: "°C/min",
        hint: "Slope = ΔT / Δt = (100.0°C - 0.0°C) / (9 min - 3 min) = 100.0 / 6 ≈ 16.67 °C/min.",
        slopeSteps: {
          point1: { x: 3, y: 0.0, label: "Melting Complete (3 min, 0.0°C)" },
          point2: { x: 9, y: 100.0, label: "Boiling Begins (9 min, 100.0°C)" },
          formulaSetup: "Slope = (100.0°C - 0.0°C) / (9 min - 3 min) = 100.0 / 6.0 ≈ 16.67",
          calculatedSlope: 16.67,
          slopeUnit: "°C/min",
          physicalMeaning: "Liquid water warming rate determined by heat capacity: q = m·c·ΔT"
        }
      },
      // 4. Scaffolded CER with Sentence Frames & Diagnostics
      freeResponse: {
        id: "fr_q",
        type: "cer",
        prompt: "Construct a Claim-Evidence-Reasoning argument explaining the difference between temperature changes and phase changes in matter. You must: (1) State a claim distinguishing thermal kinetic energy from intermolecular potential energy, (2) Cite at least TWO specific data points with units from the table, (3) Contrast a plateau interval with a heating interval, and (4) Explain the molecular behavior of water molecules and hydrogen bonds during boiling.",
        targetNumbers: [-15.0, 0.0, 1, 3, 33.0, 5, 66.0, 7, 100.0, 9, 11, 13, 115.0, 15, 16.67],
        requiredUnits: ["°c", "c", "min", "minutes"],
        claimKeywords: ["kinetic", "potential", "temperature", "plateau", "constant", "phase change", "hydrogen bonds"],
        reasoningKeywords: ["intermolecular", "hydrogen bonds", "kinetic energy", "potential energy", "phase change", "latent heat", "state of matter"],
        exemplar: "Claim: Temperature measures average particle kinetic energy, which remains constant during phase changes because absorbed heat is stored as potential energy to disrupt intermolecular bonds. Evidence: Between minutes 3 and 9, liquid water temperature increased steadily from 0.0°C to 100.0°C at ~16.7°C/min. In contrast, from minutes 9 to 13, the temperature remained exactly constant at 100.0°C for 4 full minutes despite continuous heat input. Reasoning: In the liquid warming phase, thermal energy increases molecular velocity (kinetic energy), driving up temperature. At 100.0°C, the energy is diverted into latent heat of vaporization, overcoming intermolecular hydrogen bonds between liquid water molecules to separate them into gaseous water vapor without raising temperature.",
        sentenceFrames: {
          claimFrame: "Temperature directly reflects average [particle kinetic energy / nuclear energy], which remains constant during phase changes because absorbed heat is stored as [intermolecular potential energy / friction].",
          evidenceFrame: "During liquid warming (minutes 3 to 9), temperature climbed from 0.0°C to 100.0°C at ~16.7°C/min, whereas during boiling (minutes 9 to 13), temperature stayed completely flat at [Boiling Temp]°C for [Plateau Duration] minutes.",
          reasoningFrame: "At 100.0°C, all 500 Watts of heat are consumed as [latent heat of vaporization / kinetic acceleration] to overcome [intermolecular hydrogen bonds / covalent bonds], transforming liquid water into vapor without altering molecular speed."
        }
      },
      // 5. Synthesis & Diagnostic Misconception Extrapolation
      synthesis: {
        id: "syn_q",
        type: "multiple_choice",
        prompt: "Why is the boiling plateau (100°C, ~4+ minutes) significantly longer than the melting plateau (0°C, ~2 minutes)?",
        options: [
          "Ice absorbs heat faster than water",
          "Completely separating molecules into gas requires much more energy (heat of vaporization) than partially loosening them in a liquid (heat of fusion)",
          "Steam has higher density than liquid water",
          "The heater output dropped at higher temperatures"
        ],
        correctIndex: 1,
        explanation: "The heat of vaporization of water (2,260 J/g) is nearly seven times greater than the heat of fusion (334 J/g) because boiling requires completely breaking all hydrogen bonds.",
        diagnosticPrompt: "A student looks at minute 11 (100°C boiling) and claims: 'Since the temperature isn't rising, the water has stopped absorbing energy.' Why is this thermodynamic claim scientifically false?",
        diagnosticOptions: [
          "The heater continues pumping 500 J/s into the water, but all absorbed energy is converted into potential energy to overcome hydrogen bonds rather than speeding up particles.",
          "Energy is destroyed during boiling.",
          "The water cools down the heating element.",
          "Steam pushes energy back into the water."
        ],
        diagnosticCorrectIndex: 0,
        diagnosticExplanation: "Absorbed energy does not disappear when temperature is constant; it is absorbed as latent heat of vaporization to disrupt attractive hydrogen bonds."
      }
    }
  },

  // -------------------------------------------------------------
  // EARTH & SPACE 1: SEAFLOOR SPREADING & CRUST AGE
  // -------------------------------------------------------------
  {
    id: "earth-seafloor-spreading",
    title: "Plate Tectonics: Seafloor Age vs. Distance from Ridge",
    discipline: "Earth & Space",
    disciplineBadge: "🌋 Earth & Space",
    ngssCode: "HS-ESS1-5",
    ngssTitle: "Evidence of Plate Tectonics and Earth History",
    sep: "SEP-4: Analyzing and Interpreting Data",
    ccc: "CCC-1: Patterns",
    chartType: "scatter",
    xAxis: {
      label: "Distance from Ridge Crest",
      symbol: "x",
      unit: "km",
      min: 0,
      suggestedMax: 600
    },
    yAxis: {
      label: "Oceanic Crust Age",
      symbol: "Age",
      unit: "Ma",
      min: 0,
      suggestedMax: 30
    },
    background: `Oceanographic research vessels equipped with deep-sea core drilling rigs collect basalt core samples across two divergent tectonic plate boundaries: the Mid-Atlantic Ridge (a slow-spreading ridge in the Atlantic Ocean) and the East Pacific Rise (a fast-spreading ridge in the Pacific Ocean).

Radioactive isotope dating of the basalt cores determines the numerical age of oceanic crust in millions of years (Ma) at progressive distances straight out from the central volcanic rift valley.`,
    controlledVariables: [
      "Rock samples collected at equal distances straight out from the ridge center",
      "Rock ages measured using radiometric dating"
    ],
    calibratedInstrumentation: [
      "Sector-field multi-collector mass spectrometer (±0.05 Ma precision)",
      "Satellite multibeam sonar bathymetry (10 m lateral resolution)"
    ],
    dataTable: {
      caption: "Table 1: Oceanic Crust Age vs. Distance from Spreading Axis",
      columns: [
        { key: "distance", label: "Distance from Ridge (km)", isX: true, unit: "km" },
        { key: "atlantic", label: "Mid-Atlantic Crust Age (Ma)", isY: true, unit: "Ma", seriesId: "atlantic" },
        { key: "pacific", label: "East Pacific Rise Crust Age (Ma)", isY: true, unit: "Ma", seriesId: "pacific" }
      ],
      rows: [
        { distance: 0, atlantic: 0.0, pacific: 0.0 },
        { distance: 100, atlantic: 5.0, pacific: 1.5 },
        { distance: 200, atlantic: 10.0, pacific: 3.0 },
        { distance: 300, atlantic: 15.0, pacific: 4.5 },
        { distance: 400, atlantic: 20.0, pacific: 6.0 },
        { distance: 500, atlantic: 25.0, pacific: 7.5 }
      ]
    },
    graphConfig: {
      multiSeries: true,
      series: [
        { id: "atlantic", label: "Mid-Atlantic Ridge", color: "#0284c7", pointStyle: "circle" },
        { id: "pacific", label: "East Pacific Rise", color: "#ea580c", pointStyle: "triangle" }
      ],
      showBestFitDefault: true,
      beginAtZero: true,
      equation: "Atlantic slope: 0.050 Ma/km (20 km/Ma); Pacific slope: 0.015 Ma/km (66.7 km/Ma)",
      slopeMeaning: "Steeper slope = older rock closer to ridge = slower spreading rate"
    },
    questions: {
      // 1. Graph Anatomy & Decoding Mechanics
      anatomy: {
        id: "anatomy_q",
        independentVar: "Distance from Ridge Crest (km)",
        dependentVar: "Oceanic Crust Age (Ma)",
        locatorPrompt: "Find 300 km on the horizontal axis. What is the crust age for the East Pacific Rise (▲ orange triangle) on the vertical axis?",
        expectedLocatorValue: 4.5,
        locatorTolerance: 0.2,
        locatorUnit: "Ma",
        interceptPrompt: "At distance = 0 km, both curves intersect at Age = 0.0 Ma. What is the plate tectonic significance of this zero-age intercept?",
        interceptOptions: [
          "The central ridge crest is the active rift zone where brand-new oceanic crust is continuously formed by magma upwelling",
          "Older rocks dissolve at the ridge axis",
          "The tectonic plates are subducting beneath the mantle at the ridge",
          "The ocean is completely drained at the rift center"
        ],
        interceptCorrectIndex: 0,
        interceptExplanation: "At the volcanic rift crest (0 km), magma wells up directly from the asthenosphere and solidifies into fresh basalt (Age = 0 Ma)."
      },
      // 2. Trend Identification & Pattern
      trend: {
        id: "trend_q",
        type: "multiple_choice",
        prompt: "Comparing the two lines on the graph, which oceanic ridge system is spreading at a faster rate?",
        options: [
          "The Mid-Atlantic Ridge spreads faster because its line has a steeper slope",
          "The East Pacific Rise spreads faster because its crust is much younger at any given distance",
          "Both ridge systems spread at exactly identical rates",
          "Neither ridge system is actively spreading"
        ],
        correctIndex: 1,
        explanation: "At 500 km from the ridge, Pacific crust is only 7.5 million years old, while Atlantic crust is 25.0 million years old. Generating 500 km of crust in less time means the Pacific spreading rate is much faster."
      },
      // 3. Step-by-Step Guided Rate / Velocity Analysis (SEP-5)
      quantitative: {
        id: "quant_q",
        type: "calculation",
        title: "3. Calculating Spreading Speed (Velocity):",
        prompt: "Calculate the spreading speed of the East Pacific Rise in km per million years (km/Ma) using the data at 500 km (Distance / Age).",
        expectedValue: 66.67,
        tolerance: 2.0,
        unit: "km/Ma",
        hint: "Spreading Speed = Distance / Age = 500 km / 7.5 Ma ≈ 66.67 km/Ma (or ~6.7 cm/year).",
        slopeSteps: {
          point1: { x: 0, y: 0.0, label: "Rift Axis (0 km, 0 Ma)" },
          point2: { x: 500, y: 7.5, label: "Outer Crust (500 km, 7.5 Ma)" },
          formulaSetup: "Velocity = Distance / Age = 500 km / 7.5 Ma ≈ 66.67 km/Ma",
          blankSetupWork: "Velocity = Distance / Age = ( _____ / _____ )",
          calculatedSlope: 66.67,
          slopeUnit: "km/Ma",
          calcLabel: "Calculated Speed:",
          physicalMeaning: "Tectonic plate divergence velocity: ~66.7 km/Ma (equivalent to 6.67 cm/year)"
        }
      },
      // 4. Scaffolded CER with Sentence Frames & Diagnostics
      freeResponse: {
        id: "fr_q",
        type: "cer",
        prompt: "Construct a Claim-Evidence-Reasoning argument explaining how crust age and spreading speed differ between the Mid-Atlantic Ridge and East Pacific Rise.",
        zoneCriteria: {
          claim: "State how crust age changes with distance and which ridge spreads faster.",
          evidence: ["Cite 2+ data pairs (Distance, Age) with units from Table 1.", "Compare the calculated spreading speeds."],
          reasoning: "Explain the geological mechanism (magma upwelling, mantle convection, and slab pull)."
        },
        targetNumbers: [0.0, 100, 5.0, 1.5, 200, 10.0, 3.0, 300, 15.0, 4.5, 400, 20.0, 6.0, 500, 25.0, 7.5, 66.67, 20],
        requiredUnits: ["km", "ma", "million years"],
        claimKeywords: ["faster", "spreading", "divergent", "younger", "older", "seafloor spreading", "velocity"],
        reasoningKeywords: ["mantle", "convection", "magma", "upwelling", "slab pull", "divergent boundary", "tectonic plates"],
        exemplar: "Claim: Ocean crust age increases linearly with distance from divergent boundaries, with the East Pacific Rise spreading over three times faster than the Mid-Atlantic Ridge. Evidence: At 500 km from the ridge axis, Mid-Atlantic crust is 25.0 Ma old (spreading velocity = 500 km / 25 Ma = 20 km/Ma). In contrast, at the same 500 km distance on the East Pacific Rise, the crust is only 7.5 Ma old (spreading velocity = 500 km / 7.5 Ma = 66.7 km/Ma). Reasoning: New oceanic crust forms continuously at ridge crests as magma upwells and solidifies. As tectonic plates pull apart due to mantle convection currents and subduction slab-pull forces, older rocks are pushed symmetrically outward. Stronger slab-pull forces in the Pacific drive faster seafloor spreading than the slower Atlantic convection cells.",
        sentenceFrames: {
          claimFrame: "Oceanic crust age increases linearly with distance from the ridge crest, with the East Pacific Rise spreading [faster than / slower than] the Mid-Atlantic Ridge.",
          evidenceFrame: "At 500 km from the rift axis, Mid-Atlantic crust is [Atlantic Age] Ma old (speed = 20 km/Ma), whereas East Pacific Rise crust at 500 km is only [Pacific Age] Ma old (speed = 66.7 km/Ma).",
          reasoningFrame: "This difference occurs because fresh magma upwells and freezes at divergent boundaries; stronger [subduction slab pull and mantle convection / ocean tidal currents] pull Pacific plates apart at over 3 times the velocity of Atlantic plates."
        }
      },
      // 5. Synthesis & Diagnostic Misconception Extrapolation
      synthesis: {
        id: "syn_q",
        type: "multiple_choice",
        prompt: "Where would the most intense volcanic activity and highest hydrothermal vent temperatures be located on these maps?",
        options: [
          "At distance = 500 km from the ridge",
          "Directly at distance = 0 km (the central ridge rift axis)",
          "At the continental shoreline",
          "Evenly distributed across the ocean floor"
        ],
        correctIndex: 1,
        explanation: "At distance = 0 km, tectonic plates are pulling apart, allowing superheated mantle magma to breach the seafloor and create hydrothermal black smoker vents and new oceanic crust.",
        diagnosticPrompt: "A student mistakenly concludes: 'The Mid-Atlantic Ridge is faster because its graph has a steeper slope.' Why is this mathematical interpretation of the graph flawed?",
        diagnosticOptions: [
          "The y-axis is Age (time). A steeper slope means more millions of years are required to travel the same distance, which corresponds to a slower spreading speed (v = Distance / Time).",
          "The graph is inverted upside down.",
          "Slopes only apply to temperature graphs.",
          "The Pacific data was measured in miles instead of kilometers."
        ],
        diagnosticCorrectIndex: 0,
        diagnosticExplanation: "When time/age is on the y-axis, slope is ΔTime / ΔDistance (inverse velocity). A larger slope means more time per kilometer, which is slower velocity."
      }
    }
  },

  // -------------------------------------------------------------
  // EARTH & SPACE 2: ATMOSPHERIC CO2 & GLOBAL TEMPERATURE
  // -------------------------------------------------------------
  {
    id: "earth-climate-carbon-temperature",
    title: "Earth Systems: Atmospheric CO₂ vs. Global Temperature",
    discipline: "Earth & Space",
    disciplineBadge: "🌋 Earth & Space",
    ngssCode: "HS-ESS2-4",
    sep: "SEP-4: Analyzing and Interpreting Data",
    ccc: "CCC-1: Patterns",
    chartType: "scatter",
    xAxis: {
      label: "Atmospheric CO₂ Concentration",
      symbol: "[CO₂]",
      unit: "ppm",
      min: 300,
      suggestedMax: 440
    },
    yAxis: {
      label: "Global Mean Temperature Anomaly",
      symbol: "ΔT",
      unit: "°C",
      min: -0.1,
      suggestedMax: 1.2
    },
    background: `Earth and atmospheric scientists compile composite instrumental data from the NOAA Mauna Loa Baseline Observatory in Hawaii (measuring tropospheric background carbon dioxide in parts per million, ppm) and NASA GISS global land-ocean surface temperature anomalies (degrees Celsius deviation relative to the 1951–1980 base period) across six decades from 1960 to 2020.

The dataset quantifies historical trends in anthropogenic greenhouse gas forcing and global thermodynamic response. To establish rigorous empirical validity, climate researchers apply systematic quality controls: sampling pristine mid-tropospheric maritime air above the planetary boundary inversion layer, filtering volcanic outgassing spikes using continuous infrared gas analyzer (NDIR) telemetry, and calculating area-weighted global temperature anomalies using thousands of calibrated weather stations and satellite sea-surface radiometers.`,
    controlledVariables: [
      "Mid-tropospheric background air sampling (3,397 m altitude above local pollution)",
      "Strict 1951–1980 climatological baseline normalization period (0.00°C anomaly)",
      "Standardized seasonal cycle detrending (annual average decadal means)"
    ],
    calibratedInstrumentation: [
      "High-precision non-dispersive infrared (NDIR) gas analyzers (±0.2 ppm)",
      "NASA GISS global land-ocean satellite thermal radiometers"
    ],
    dataTable: {
      caption: "Table 1: Decadal Atmospheric CO₂ and Global Temperature Anomalies",
      columns: [
        { key: "decade", label: "Year / Decade", isText: true },
        { key: "co2", label: "Atmospheric CO₂ (ppm)", isX: true, unit: "ppm" },
        { key: "temp_anomaly", label: "Temperature Anomaly (°C)", isY: true, unit: "°C" }
      ],
      rows: [
        { decade: "1960", co2: 317, temp_anomaly: 0.03 },
        { decade: "1970", co2: 326, temp_anomaly: 0.04 },
        { decade: "1980", co2: 339, temp_anomaly: 0.18 },
        { decade: "1990", co2: 354, temp_anomaly: 0.32 },
        { decade: "2000", co2: 370, temp_anomaly: 0.42 },
        { decade: "2010", co2: 390, temp_anomaly: 0.72 },
        { decade: "2020", co2: 414, temp_anomaly: 1.02 }
      ]
    },
    graphConfig: {
      showBestFitDefault: true,
      beginAtZero: false,
      slope: 0.010,
      intercept: -3.2,
      r2: 0.96,
      equation: "ΔT = 0.010 [CO₂] - 3.20",
      slopeMeaning: "Sensitivity: ~0.10°C temperature anomaly increase per 10 ppm increase in CO₂"
    },
    questions: {
      // 1. Graph Anatomy & Decoding Mechanics
      anatomy: {
        id: "anatomy_q",
        independentVar: "Atmospheric CO₂ Concentration (ppm)",
        dependentVar: "Global Mean Temperature Anomaly (°C)",
        locatorPrompt: "Find 370 ppm on the horizontal axis (Year 2000). What was the global temperature anomaly on the vertical axis?",
        expectedLocatorValue: 0.42,
        locatorTolerance: 0.05,
        locatorUnit: "°C",
        interceptPrompt: "The linear regression trendline predicts a 0.0°C baseline anomaly occurs at roughly ~320 ppm CO₂. What is the planetary climate meaning of this intercept?",
        interceptOptions: [
          "It represents the pre-industrial / mid-century baseline climate balance prior to accelerated greenhouse forcing",
          "The Earth had zero temperature and was completely frozen at 320 ppm",
          "Carbon dioxide gas did not exist on Earth before 1960",
          "Solar radiation dropped to zero"
        ],
        interceptCorrectIndex: 0,
        interceptExplanation: "A temperature anomaly of 0.0°C denotes the 1951–1980 reference climate normal, which corresponded to atmospheric CO₂ levels around 315–320 ppm."
      },
      // 2. Trend Identification & Pattern
      trend: {
        id: "trend_q",
        type: "multiple_choice",
        prompt: "What trend is evident when comparing decadal atmospheric CO₂ concentration and the global mean temperature anomaly?",
        options: [
          "Strong positive correlation (Higher atmospheric CO₂ correlates with higher global temperature anomalies)",
          "Inverse relationship (Temperature anomalies fall as CO₂ levels rise)",
          "Cyclical oscillation with zero net directional change",
          "No correlation between CO₂ concentration and temperature"
        ],
        correctIndex: 0,
        explanation: "As CO₂ increased steadily from 317 ppm in 1960 to 414 ppm in 2020, global temperature anomaly climbed from +0.03°C to +1.02°C, demonstrating a strong positive correlation."
      },
      // 3. Step-by-Step Guided Rate / Sensitivity Analysis (SEP-5)
      quantitative: {
        id: "quant_q",
        type: "calculation",
        title: "3. Calculating Total Temperature Change (ΔT):",
        prompt: "Calculate the total change in global temperature anomaly (ΔT = T_2020 − T_1960) over the 60-year observation span between 1960 and 2020.",
        expectedValue: 0.99,
        tolerance: 0.03,
        unit: "°C",
        hint: "Subtract the 1960 anomaly (0.03°C) from the 2020 anomaly (1.02°C): 1.02°C - 0.03°C = 0.99°C.",
        slopeSteps: {
          point1: { x: 317, y: 0.03, label: "1960 Baseline (317 ppm, +0.03°C)" },
          point2: { x: 414, y: 1.02, label: "2020 Modern (414 ppm, +1.02°C)" },
          formulaSetup: "ΔT = T_2020 − T_1960 = 1.02°C − 0.03°C = 0.99°C",
          blankSetupWork: "ΔT = T_2020 − T_1960 = ( _____ − _____ )",
          calculatedSlope: 0.99,
          slopeUnit: "°C (Total ΔT)",
          calcLabel: "Calculated Change (ΔT):",
          physicalMeaning: "Transient climate sensitivity: ~0.10°C global warming per 10 ppm increase in atmospheric CO₂"
        }
      },
      // 4. Scaffolded CER with Sentence Frames & Diagnostics
      freeResponse: {
        id: "fr_q",
        type: "cer",
        prompt: "Construct a Claim-Evidence-Reasoning argument evaluating the role of atmospheric carbon dioxide as a greenhouse gas. You must: (1) State a clear claim, (2) Cite at least TWO specific data points with units from the table, (3) Contrast the 1960 baseline with recent 2010–2020 data, and (4) Explain the physical greenhouse mechanism (absorption and re-emission of infrared radiation by asymmetric greenhouse gas molecules).",
        targetNumbers: [317, 0.03, 326, 0.04, 339, 0.18, 354, 0.32, 370, 0.42, 390, 0.72, 414, 1.02, 0.99],
        requiredUnits: ["ppm", "°c", "c"],
        claimKeywords: ["greenhouse effect", "correlation", "positive", "warming", "increases", "temperature anomaly", "forcing"],
        reasoningKeywords: ["infrared", "radiation", "absorption", "greenhouse gas", "thermal energy", "re-emit", "trapped"],
        exemplar: "Claim: Rising atmospheric CO₂ concentrations directly amplify the planetary greenhouse effect, increasing global average surface temperatures. Evidence: In 1960, atmospheric CO₂ was 317 ppm with a temperature anomaly of +0.03°C. By 2020, CO₂ rose to 414 ppm and the temperature anomaly reached +1.02°C (an increase of 97 ppm CO₂ and +0.99°C temperature anomaly). Reasoning: Carbon dioxide molecules possess vibrational modes that absorb outgoing terrestrial infrared (longwave) radiation. Rather than escaping directly into space, this thermal radiation is absorbed and re-emitted in all directions, trapping additional thermal energy in the lower troposphere and driving positive climate feedback loops.",
        sentenceFrames: {
          claimFrame: "Rising atmospheric CO₂ concentrations exhibit a strong [positive correlation / negative correlation] with global surface temperature anomalies due to enhanced greenhouse forcing.",
          evidenceFrame: "In 1960, background CO₂ measured 317 ppm with an anomaly of +0.03°C, but by 2020, CO₂ climbed to [2020 CO2] ppm as the anomaly surged to [2020 Anomaly]°C (a net rise of 0.99°C).",
          reasoningFrame: "This warming occurs because triatomic CO₂ molecules absorb outgoing [terrestrial infrared radiation / ultraviolet light], re-radiating thermal energy back toward the surface rather than allowing it to escape freely into space."
        }
      },
      // 5. Synthesis & Diagnostic Misconception Extrapolation
      synthesis: {
        id: "syn_q",
        type: "multiple_choice",
        prompt: "If atmospheric CO₂ concentration reaches 450 ppm, what is the best estimate for the projected temperature anomaly based on the linear sensitivity trend?",
        options: [
          "~0.80°C",
          "~1.30°C",
          "~2.50°C",
          "~4.00°C"
        ],
        correctIndex: 1,
        explanation: "Using the trend rate of approximately +0.10°C per 10 ppm CO₂: from 414 ppm to 450 ppm (+36 ppm), the anomaly would increase by ~0.36°C above 1.02°C, yielding ~1.38°C.",
        diagnosticPrompt: "A climate skeptic argues: 'Carbon dioxide only makes up about 0.04% of the atmosphere, so such a tiny fraction cannot possibly alter Earth's global thermal balance.' How does molecular radiative physics refute this argument?",
        diagnosticOptions: [
          "Major atmospheric gases (N₂ and O₂) are symmetrical and completely transparent to infrared radiation; trace greenhouse gases with dipole moments dominate 100% of the planetary thermal absorption budget.",
          "CO₂ absorbs visible green sunlight instead of infrared.",
          "Carbon dioxide is heavier than nitrogen so it compresses the atmosphere.",
          "The percentage of CO₂ in the atmosphere is actually 40%."
        ],
        diagnosticCorrectIndex: 0,
        diagnosticExplanation: "Diatomic gases (N₂, O₂) cannot absorb infrared radiation. Even at 400+ ppm, asymmetric molecules like CO₂ and H₂O absorb virtually all outgoing planetary infrared heat."
      }
    }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SCENARIOS };
}
