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
      symbol: "F_net",
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
    background: `A student engineering team investigates the relationship between net applied force and acceleration on a low-friction dynamics track. A frictionless glider with a fixed total mass of <strong>5.0 kg</strong> is pulled horizontally across the track using calibrated hanging masses over a frictionless pulley. 

An optical photogate array measures the glider's acceleration for five separate trials. The team ensures the total system mass remains constant throughout all trials to isolate the direct effect of net force on acceleration.`,
    dataTable: {
      caption: "Table 1: Glider Acceleration Under Varying Net Force (Mass = 5.0 kg)",
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
      equation: "a = 0.20 F_net + 0.00",
      slopeMeaning: "1 / Mass (1 / 5.0 kg = 0.20 m/s² per N)"
    },
    questions: {
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
        explanation: "As net force increases from 5 N to 30 N, acceleration increases at a constant linear rate of 0.20 m/s² for each 1 N increase in force (a = F_net / m)."
      },
      quantitative: {
        id: "quant_q",
        type: "calculation",
        prompt: "Calculate the rate of change in acceleration with respect to force (the slope of the line, Δa / ΔF) between Trial 2 (10 N) and Trial 5 (25 N).",
        expectedValue: 0.20,
        tolerance: 0.02,
        unit: "(m/s²) / N",
        hint: "Use slope = (a₂ - a₁) / (F₂ - F₁). That is: (5.0 m/s² - 2.0 m/s²) / (25 N - 10 N) = 3.0 / 15 = 0.20 (m/s²)/N."
      },
      freeResponse: {
        id: "fr_q",
        type: "cer",
        prompt: "Construct a scientific explanation (Claim-Evidence-Reasoning) explaining how changing the net force affects the acceleration of the glider. You must: (1) State a clear claim, (2) Cite at least TWO specific data points with units from the table or graph, (3) Compare the values to show the rate of change, and (4) Explain the physical reasoning connecting force, mass, and acceleration.",
        targetNumbers: [5.0, 1.0, 10.0, 2.0, 15.0, 3.0, 20.0, 4.0, 25.0, 5.0, 30.0, 6.0, 0.2],
        requiredUnits: ["n", "newton", "m/s²", "m/s^2", "kg"],
        claimKeywords: ["direct", "proportional", "linear", "increases", "greater force", "doubling", "rate"],
        reasoningKeywords: ["newton", "second law", "mass", "f=ma", "net force", "inertia", "unbalanced"],
        exemplar: "Claim: The acceleration of the glider is directly proportional to the net applied force when mass is held constant. Evidence: At a net force of 10.0 N, the glider accelerated at 2.0 m/s². When the net force was doubled to 20.0 N, the acceleration exactly doubled to 4.0 m/s², maintaining a constant rate of change (slope) of 0.20 (m/s²)/N. Reasoning: According to Newton's Second Law (a = F_net / m), an unbalanced net force causes a proportional acceleration inversely scaled by the object's mass (5.0 kg)."
      },
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
        explanation: "Using a = F_net / m = 40.0 N / 5.0 kg, or extending the slope line: a = (0.20)(40.0) = 8.0 m/s²."
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
    background: `Automotive safety engineers test the emergency stopping distance of an electric sedan (mass = 1,500 kg) on a dry asphalt test track. In each test run, the test vehicle cruises at a set speed before the autonomous anti-lock braking system (ABS) applies maximum steady braking force.

The braking distance is recorded from the precise moment the brakes engage until the vehicle comes to a complete stop. Reaction time is excluded to isolate the physical braking distance.`,
    dataTable: {
      caption: "Table 2: Emergency Braking Distance as a Function of Speed",
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
      quantitative: {
        id: "quant_q",
        type: "calculation",
        prompt: "When initial speed doubles from 8.9 m/s (20 mph) to 17.9 m/s (40 mph), by what factor does the braking distance increase? (Divide distance at 17.9 m/s by distance at 8.9 m/s).",
        expectedValue: 4.0,
        tolerance: 0.2,
        unit: "factor (ratio)",
        hint: "Divide the two braking distances: 25.6 m / 6.4 m = 4.0."
      },
      freeResponse: {
        id: "fr_q",
        type: "cer",
        prompt: "Construct a scientific argument explaining why highway driving at 60 mph requires disproportionately longer stopping distances than residential driving at 30 mph. You must: (1) State a clear claim about how speed impacts braking distance, (2) Cite at least TWO specific data points with units from the table, (3) Show how the ratio of distances compares to the ratio of speeds, and (4) Explain the physics using the Work-Energy Theorem (KE = ½mv² and Work = F × d).",
        targetNumbers: [4.5, 1.6, 8.9, 6.4, 13.4, 14.4, 17.9, 25.6, 22.4, 40.0, 26.8, 57.6, 4, 4.0],
        requiredUnits: ["m/s", "m", "meters", "mph"],
        claimKeywords: ["quadratic", "disproportionate", "exponential", "quadruple", "square", "steep", "faster"],
        reasoningKeywords: ["kinetic energy", "work", "ke = 1/2mv²", "work-energy", "force", "friction", "dissipate"],
        exemplar: "Claim: Braking distance increases quadratically with speed (d ∝ v²) rather than linearly, so doubling speed quadruples required stopping distance. Evidence: At 13.4 m/s (30 mph), the braking distance is 14.4 m. When speed doubles to 26.8 m/s (60 mph), the stopping distance increases to 57.6 m, which is exactly 4.0 times greater (57.6 / 14.4 = 4.0). Reasoning: According to the Work-Energy Theorem, the work done by friction (W = F × d) must dissipate all vehicle kinetic energy (KE = ½mv²). Because kinetic energy is proportional to the square of velocity (v²), twice the speed contains four times the kinetic energy, requiring four times the stopping distance for constant braking force."
      },
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
        explanation: "Using d = 0.08 v²: d = 0.08 × (35.8)² ≈ 102.5 m. A vehicle traveling 4 times faster than 8.9 m/s requires 16 times the distance (16 × 6.4 m ≈ 102.4 m)."
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
    background: `High school biology students investigate the activity of the enzyme catalase, which catalyzes the breakdown of harmful hydrogen peroxide (2H₂O₂ → 2H₂O + O₂) inside mammalian cells. 

Uniform paper disks soaked in liver homogenate (containing catalase) are placed at the bottom of vials containing 3% hydrogen peroxide solution at varying controlled temperatures. The rate of oxygen gas evolution is measured using an inverted gas collection tube over 3-minute intervals.`,
    dataTable: {
      caption: "Table 3: Catalase Activity as a Function of Environmental Temperature",
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
      quantitative: {
        id: "quant_q",
        type: "calculation",
        prompt: "By how many mL/min did the reaction rate drop when temperature increased from the optimal 37°C to 55°C? (Calculate ΔRate = Rate_37 - Rate_55).",
        expectedValue: 76.0,
        tolerance: 1.0,
        unit: "mL/min",
        hint: "Subtract the rate at 55°C (10.0 mL/min) from the rate at 37°C (86.0 mL/min): 86.0 - 10.0 = 76.0 mL/min."
      },
      freeResponse: {
        id: "fr_q",
        type: "cer",
        prompt: "Construct a Claim-Evidence-Reasoning explanation describing the biological effect of high fever (>41°C) on human enzyme function. You must: (1) State a claim regarding how high temperatures affect enzyme activity, (2) Cite at least TWO specific data points with units from the table, (3) Contrast the rate at optimum with the rate at elevated temperatures, and (4) Explain the biochemical mechanism involving enzyme active site conformation and hydrogen bonds (denaturation).",
        targetNumbers: [10, 12.0, 20, 28.0, 30, 54.0, 37, 86.0, 45, 48.0, 55, 10.0, 65, 0.0, 76.0],
        requiredUnits: ["°c", "c", "deg c", "degrees c", "ml/min"],
        claimKeywords: ["denature", "optimum", "drops", "decreases", "loss of function", "peak", "inhibits"],
        reasoningKeywords: ["active site", "denaturation", "hydrogen bonds", "tertiary structure", "substrate", "conformation", "protein"],
        exemplar: "Claim: Elevated temperatures above 37°C cause rapid loss of catalase enzyme activity due to protein denaturation. Evidence: Catalase reaches maximum activity at 37°C with an oxygen production rate of 86.0 mL/min. As temperature rises to 45°C, the rate plunges to 48.0 mL/min, and by 65°C the rate reaches 0.0 mL/min (a complete drop of 86.0 mL/min). Reasoning: Below 37°C, increasing temperature boosts molecular kinetic energy and substrate collision frequency. Above 37°C, excessive thermal agitation disrupts delicate hydrogen and ionic bonds stabilizing the enzyme's tertiary structure. This denatures the protein and deforms its active site, preventing hydrogen peroxide substrates from binding."
      },
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
        explanation: "Extreme thermal denaturation unfolds the protein and alters its active site irreversibly. Cooling the denatured protein does not restore its functional 3D conformation."
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
      symbol: "P_rate",
      unit: "mL/hr",
      min: 0,
      suggestedMax: 18
    },
    background: `An AP Biology class uses an aquatic elodea weed setup in a sealed chamber filled with sodium bicarbonate solution (providing an abundant dissolved carbon dioxide source). 

An adjustable LED spectrum light source illuminates the plant at increasing intensities while a water bath absorbs radiant heat to maintain a constant temperature of 22°C. The net rate of photosynthesis is quantified by measuring the volume of oxygen gas produced per hour.`,
    dataTable: {
      caption: "Table 4: Net Photosynthetic Rate Under Varying Light Intensities",
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
      quantitative: {
        id: "quant_q",
        type: "calculation",
        prompt: "Calculate the average rate of increase in O₂ production per mW/cm² of light between 5 mW/cm² and 50 mW/cm² (ΔO₂ / ΔIntensity).",
        expectedValue: 0.28,
        tolerance: 0.03,
        unit: "(mL/hr) / (mW/cm²)",
        hint: "Use Δy / Δx: (14.2 mL/hr - 1.5 mL/hr) / (50 mW/cm² - 5 mW/cm²) = 12.7 / 45 ≈ 0.282."
      },
      freeResponse: {
        id: "fr_q",
        type: "cer",
        prompt: "Construct a Claim-Evidence-Reasoning explanation answering: 'Why does increasing light intensity beyond 50 mW/cm² fail to significantly increase the rate of photosynthesis?' You must: (1) State a claim regarding light saturation, (2) Cite at least TWO specific data points with units from the table or graph, (3) Contrast the rate of change before and after 50 mW/cm², and (4) Explain the cellular biochemical reasoning (chlorophyll photon absorption capacity and Rubisco/Calvin cycle enzyme turnover limits).",
        targetNumbers: [5, 1.5, 10, 3.2, 20, 6.5, 35, 10.8, 50, 14.2, 65, 14.6, 80, 14.7, 0.28],
        requiredUnits: ["mw/cm²", "mw/cm^2", "ml/hr"],
        claimKeywords: ["plateau", "saturation", "limiting factor", "levels off", "no longer increases", "maximum rate"],
        reasoningKeywords: ["light reactions", "chlorophyll", "calvin cycle", "rubisco", "enzymes", "turnover", "limiting factor"],
        exemplar: "Claim: Photosynthesis reaches a light saturation point around 50 mW/cm², after which light is no longer the limiting reactant. Evidence: Between 5 and 50 mW/cm², oxygen production increased rapidly from 1.5 to 14.2 mL/hr (a gain of 12.7 mL/hr). However, increasing light further from 50 to 80 mW/cm² only increased oxygen output from 14.2 to 14.7 mL/hr (a negligible gain of 0.5 mL/hr). Reasoning: In the light-dependent reactions, chlorophyll reaction centers absorb photons to split water and produce O₂. At high light intensities, all photosystem complexes are saturated with photons and operating at peak capacity; the Calvin cycle enzymes (like Rubisco) cannot fix carbon any faster, making enzyme availability or CO₂ the new limiting factor."
      },
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
        explanation: "Because light is no longer the limiting factor at the plateau, providing more of another essential reactant (such as dissolved CO₂) enables Calvin cycle enzymes to fix carbon faster, shifting the plateau upward."
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
    background: `A chemistry class investigates the kinetics of the single replacement reaction between solid magnesium ribbon and aqueous hydrochloric acid:
Mg(s) + 2HCl(aq) → MgCl₂(aq) + H₂(g)

In six separate trials, identical 2.0 cm strips of magnesium ribbon are submerged into 50.0 mL of HCl solution at concentrations ranging from 0.20 M to 1.20 M at a constant temperature of 21.0°C. A digital pressure transducer records the initial rate of hydrogen gas produced in mL per second during the first 15 seconds of reaction.`,
    dataTable: {
      caption: "Table 5: Initial Rate of H₂ Generation Across Increasing HCl Molarities",
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
      quantitative: {
        id: "quant_q",
        type: "calculation",
        prompt: "Calculate the rate of change in reaction speed per unit increase in molarity (the slope of the graph, ΔRate / Δ[HCl]) between 0.20 M and 1.00 M.",
        expectedValue: 2.75,
        tolerance: 0.1,
        unit: "(mL/s) / M",
        hint: "Slope = (2.75 mL/s - 0.55 mL/s) / (1.00 M - 0.20 M) = 2.20 / 0.80 = 2.75 (mL/s)/M."
      },
      freeResponse: {
        id: "fr_q",
        type: "cer",
        prompt: "Construct a Claim-Evidence-Reasoning explanation connecting reactant concentration to reaction rate using Collision Theory. You must: (1) State a claim regarding how concentration affects reaction rate, (2) Cite at least TWO specific data points with units from the table, (3) Show how doubling concentration impacts rate, and (4) Explain the molecular mechanism using Collision Theory (particle density and frequency of effective collisions).",
        targetNumbers: [0.20, 0.55, 0.40, 1.10, 0.60, 1.65, 0.80, 2.20, 1.00, 2.75, 1.20, 3.30, 2.75],
        requiredUnits: ["m", "molar", "ml/s"],
        claimKeywords: ["direct", "proportional", "linear", "increases", "doubling", "faster", "higher concentration"],
        reasoningKeywords: ["collision theory", "particle", "frequency", "effective collisions", "density", "activation energy", "surface area"],
        exemplar: "Claim: The initial reaction rate between magnesium and hydrochloric acid is directly proportional to HCl concentration. Evidence: At 0.40 M HCl, hydrogen gas evolved at 1.10 mL/s. When acid concentration was doubled to 0.80 M, the rate doubled to 2.20 mL/s, exhibiting a constant linear slope of 2.75 (mL/s)/M across all trials. Reasoning: According to Collision Theory, chemical reactions require reactant particles to collide with sufficient energy and correct orientation. Increasing acid molarity increases the number of H⁺ ions per unit volume, directly multiplying the frequency of effective collisions against the magnesium metal surface per second."
      },
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
        explanation: "Increasing temperature increases average molecular kinetic energy, increasing both the overall collision frequency and the percentage of collisions that exceed the activation energy threshold."
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
    background: `A chemistry student places 100.0 grams of solid ice at -15.0°C inside a heavily insulated calorimeter with an electric immersion heater delivering a constant, uniform 500 Watts of thermal power. 

The temperature of the water sample is recorded continuously every minute for 15 minutes as the ice warms, melts into liquid water, heats up, and boils into steam.`,
    dataTable: {
      caption: "Table 6: Temperature Progression of Water During Constant Heat Addition",
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
      quantitative: {
        id: "quant_q",
        type: "calculation",
        prompt: "Calculate the rate of temperature increase (slope in °C/min) during the liquid water heating phase between minute 3 (0.0°C) and minute 9 (100.0°C).",
        expectedValue: 16.67,
        tolerance: 0.5,
        unit: "°C/min",
        hint: "Slope = ΔT / Δt = (100.0°C - 0.0°C) / (9 min - 3 min) = 100.0 / 6 ≈ 16.67 °C/min."
      },
      freeResponse: {
        id: "fr_q",
        type: "cer",
        prompt: "Construct a Claim-Evidence-Reasoning argument explaining the difference between temperature changes and phase changes in matter. You must: (1) State a claim distinguishing thermal kinetic energy from intermolecular potential energy, (2) Cite at least TWO specific data points with units from the table, (3) Contrast a plateau interval with a heating interval, and (4) Explain the molecular behavior of water molecules and hydrogen bonds during boiling.",
        targetNumbers: [-15.0, 0.0, 1, 3, 33.0, 5, 66.0, 7, 100.0, 9, 11, 13, 115.0, 15, 16.67],
        requiredUnits: ["°c", "c", "min", "minutes"],
        claimKeywords: ["kinetic", "potential", "temperature", "plateau", "constant", "phase change", "hydrogen bonds"],
        reasoningKeywords: ["intermolecular", "hydrogen bonds", "kinetic energy", "potential energy", "phase change", "latent heat", "state of matter"],
        exemplar: "Claim: Temperature measures average particle kinetic energy, which remains constant during phase changes because absorbed heat is stored as potential energy to disrupt intermolecular bonds. Evidence: Between minutes 3 and 9, liquid water temperature increased steadily from 0.0°C to 100.0°C at ~16.7°C/min. In contrast, from minutes 9 to 13, the temperature remained exactly constant at 100.0°C for 4 full minutes despite continuous heat input. Reasoning: In the liquid warming phase, thermal energy increases molecular velocity (kinetic energy), driving up temperature. At 100.0°C, the energy is diverted into latent heat of vaporization, overcoming intermolecular hydrogen bonds between liquid water molecules to separate them into gaseous water vapor without raising temperature."
      },
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
        explanation: "The heat of vaporization of water (2,260 J/g) is nearly seven times greater than the heat of fusion (334 J/g) because boiling requires completely breaking all hydrogen bonds."
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
      label: "Distance from Mid-Ocean Ridge Crest",
      symbol: "x",
      unit: "km",
      min: 0,
      suggestedMax: 600
    },
    yAxis: {
      label: "Oceanic Crust Age",
      symbol: "Age",
      unit: "Million Years (Ma)",
      min: 0,
      suggestedMax: 30
    },
    background: `Oceanographic research vessels equipped with deep-sea core drilling rigs collect basalt core samples across two divergent tectonic plate boundaries: the Mid-Atlantic Ridge (slow-spreading ridge in the Atlantic Ocean) and the East Pacific Rise (fast-spreading ridge in the Pacific Ocean).

Radioactive isotope dating of the basalt cores determines the numerical age of oceanic crust in millions of years (Ma) at progressive distances perpendicular to the central volcanic rift valley.`,
    dataTable: {
      caption: "Table 7: Oceanic Crust Age vs. Distance from Spreading Axis",
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
      quantitative: {
        id: "quant_q",
        type: "calculation",
        prompt: "Calculate the spreading speed of the East Pacific Rise in km per million years (km/Ma) using the data at 500 km (Distance / Age).",
        expectedValue: 66.67,
        tolerance: 2.0,
        unit: "km/Ma",
        hint: "Spreading Speed = Distance / Age = 500 km / 7.5 Ma ≈ 66.67 km/Ma (or ~6.7 cm/year)."
      },
      freeResponse: {
        id: "fr_q",
        type: "cer",
        prompt: "Construct a Claim-Evidence-Reasoning argument supporting the theory of seafloor spreading by contrasting the Mid-Atlantic Ridge and East Pacific Rise. You must: (1) State a claim regarding how crust age relates to ridge distance and spreading speed, (2) Cite at least TWO specific data points with units from each ridge from the table, (3) Quantitatively compare the ages or spreading velocities of the two ridges, and (4) Explain the geological mechanism (magma upwelling, mantle convection, and slab pull).",
        targetNumbers: [0.0, 100, 5.0, 1.5, 200, 10.0, 3.0, 300, 15.0, 4.5, 400, 20.0, 6.0, 500, 25.0, 7.5, 66.67, 20],
        requiredUnits: ["km", "ma", "million years"],
        claimKeywords: ["faster", "spreading", "divergent", "younger", "older", "seafloor spreading", "velocity"],
        reasoningKeywords: ["mantle", "convection", "magma", "upwelling", "slab pull", "divergent boundary", "tectonic plates"],
        exemplar: "Claim: Ocean crust age increases linearly with distance from divergent boundaries, with the East Pacific Rise spreading over three times faster than the Mid-Atlantic Ridge. Evidence: At 500 km from the ridge axis, Mid-Atlantic crust is 25.0 Ma old (spreading velocity = 500 km / 25 Ma = 20 km/Ma). In contrast, at the same 500 km distance on the East Pacific Rise, the crust is only 7.5 Ma old (spreading velocity = 500 km / 7.5 Ma = 66.7 km/Ma). Reasoning: New oceanic crust forms continuously at ridge crests as magma upwells and solidifies. As tectonic plates pull apart due to mantle convection currents and subduction slab-pull forces, older rocks are pushed symmetrically outward. Stronger slab-pull forces in the Pacific drive faster seafloor spreading than the slower Atlantic convection cells."
      },
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
        explanation: "At distance = 0 km, tectonic plates are pulling apart, allowing superheated mantle magma to breach the seafloor and create hydrothermal black smoker vents and new oceanic crust."
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
    ngssTitle: "Earth Materials, Systems, and Global Climate Change",
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
    background: `Climate scientists compile composite instrument data from the Mauna Loa Observatory (measuring atmospheric carbon dioxide in parts per million, ppm) and NASA GISS global land-ocean temperature anomalies (degrees Celsius deviation relative to the 1951–1980 base period) across six decades from 1960 to 2020.

The dataset documents historical trends in greenhouse gas concentrations and planetary thermal response.`,
    dataTable: {
      caption: "Table 8: Decadal Atmospheric CO₂ and Global Temperature Anomalies",
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
      quantitative: {
        id: "quant_q",
        type: "calculation",
        prompt: "Calculate the total change in global temperature anomaly (ΔT = T_2020 - T_1960) over the 60-year observation span between 1960 and 2020.",
        expectedValue: 0.99,
        tolerance: 0.03,
        unit: "°C",
        hint: "Subtract the 1960 anomaly (0.03°C) from the 2020 anomaly (1.02°C): 1.02°C - 0.03°C = 0.99°C."
      },
      freeResponse: {
        id: "fr_q",
        type: "cer",
        prompt: "Construct a Claim-Evidence-Reasoning argument evaluating the role of atmospheric carbon dioxide as a greenhouse gas. You must: (1) State a clear claim, (2) Cite at least TWO specific data points with units from the table, (3) Contrast the 1960 baseline with recent 2010–2020 data, and (4) Explain the physical greenhouse mechanism (absorption and re-emission of infrared radiation by asymmetric greenhouse gas molecules).",
        targetNumbers: [317, 0.03, 326, 0.04, 339, 0.18, 354, 0.32, 370, 0.42, 390, 0.72, 414, 1.02, 0.99],
        requiredUnits: ["ppm", "°c", "c"],
        claimKeywords: ["greenhouse effect", "correlation", "positive", "warming", "increases", "temperature anomaly", "forcing"],
        reasoningKeywords: ["infrared", "radiation", "absorption", "greenhouse gas", "thermal energy", "re-emit", "trapped"],
        exemplar: "Claim: Rising atmospheric CO₂ concentrations directly amplify the planetary greenhouse effect, increasing global average surface temperatures. Evidence: In 1960, atmospheric CO₂ was 317 ppm with a temperature anomaly of +0.03°C. By 2020, CO₂ rose to 414 ppm and the temperature anomaly reached +1.02°C (an increase of 97 ppm CO₂ and +0.99°C temperature anomaly). Reasoning: Carbon dioxide molecules possess vibrational modes that absorb outgoing terrestrial infrared (longwave) radiation. Rather than escaping directly into space, this thermal radiation is absorbed and re-emitted in all directions, trapping additional thermal energy in the lower troposphere and driving positive climate feedback loops."
      },
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
        explanation: "Using the trend rate of approximately +0.10°C per 10 ppm CO₂: from 414 ppm to 450 ppm (+36 ppm), the anomaly would increase by ~0.36°C above 1.02°C, yielding ~1.38°C."
      }
    }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SCENARIOS };
}
