/**
 * Centralized data store for physics lessons.
 * Format:
 * {
 *   date: "YYYY-MM-DD",
 *   title: "Lesson Title",
 *   unit: 1,
 *   day: 1,
 *   summary: "Short description for cards.",
 *   details: "Full details/handouts/links.",
 *   semester: 2,
 *   isFeatured: true // Set to true to highlight this lesson
 * }
 */
const lessonsData = [
  // --- Unit 6: Waves and Electromagnetic Radiation ---
  {
    date: "2026-05-01",
    day: 25,
    unit: 6,
    title: "Final Performance Task",
    summary: "Students complete/present their 'How Technology Uses Waves' project.",
    details: "Project presentations and final notebook submissions.",
    type: "Activity",
    dok: 4,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How can we apply our knowledge to explain the physics of a specific technology?"
  },
  {
    date: "2026-04-30",
    day: 24,
    unit: 6,
    title: "Unit Summative Exam",
    summary: "Comprehensive assessment of the Waves unit.",
    details: "Final unit test covering mechanical waves, EM radiation, and wave-particle duality.",
    type: "Assessment",
    dok: 3,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How successfully have we mastered the objectives of the Waves unit?"
  },
  {
    date: "2026-04-29",
    day: 23,
    unit: 6,
    title: "Review Session Part 2",
    summary: "EM radiation, duality, and technology (Weeks 3 & 4).",
    details: "Cumulative review of light, duality, and communications technology.",
    type: "Practice",
    dok: 2,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How well can we synthesize concepts from the second half of the unit?"
  },
  {
    date: "2026-04-28",
    day: 22,
    unit: 6,
    title: "Review Session Part 1",
    summary: "Mechanical waves and interactions (Weeks 1 & 2).",
    details: "Cumulative review of wave fundamentals and interactions.",
    type: "Practice",
    dok: 2,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How well can we synthesize concepts from the first half of the unit?"
  },
  {
    date: "2026-04-27",
    day: 21,
    unit: 6,
    title: "Real-World Physics",
    summary: "How medical imaging (MRIs/X-rays) and solar cells utilize wave principles.",
    details: "Applications of waves in medicine and energy production.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How are wave principles applied in medical imaging and renewable energy?"
  },
  {
    date: "2026-04-24",
    day: 20,
    unit: 6,
    title: "Duality & Tech Assessment",
    summary: "Comparing models of light and digital/analog signals.",
    details: "Check for understanding on wave-particle duality and basic technology concepts.",
    type: "Assessment",
    dok: 3,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How do competing models of light help us understand its behavior?"
  },
  {
    date: "2026-04-23",
    day: 19,
    unit: 6,
    title: "Information Technology",
    summary: "Fiber optics, cell phones, and routers encode and transmit information.",
    details: "How wave principles are implemented in modern telecommunications.",
    type: "Activity",
    dok: 3,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How do modern technologies encode and transmit information using waves?"
  },
  {
    date: "2026-04-22",
    day: 18,
    unit: 6,
    title: "Analog vs. Digital",
    summary: "Comparing continuous waves to binary pulses; why digital is superior for storage.",
    details: "Communication physics: noise, signal integrity, and data encoding.",
    type: "Activity",
    links: { "The Digital Encoder (ADC)": "Unit_6_Waves_Radiation/digital_encoder/index.html" },
    dok: 2,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "What are the advantages of digital signals over analog signals for communication?"
  },
  {
    date: "2026-04-21",
    day: 17,
    unit: 6,
    title: "Evidence for Particles",
    summary: "Introduction to the Photoelectric Effect and the concept of 'Photons'.",
    details: "Exploring the particle-like behavior of light at high frequencies.",
    type: "Activity",
    dok: 3,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How does the photoelectric effect demonstrate the particle nature of light?"
  },
  {
    date: "2026-04-20",
    day: 16,
    unit: 6,
    title: "Evidence for Waves",
    summary: "Reviewing the Double-Slit experiment and Polarization.",
    details: "Experimental evidence supporting the wave model of light.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "What experimental evidence confirms that light behaves like a wave?"
  },
  {
    date: "2026-04-17",
    day: 15,
    unit: 6,
    title: "EM Spectrum Research Quiz",
    summary: "Identifying regions of the spectrum and their uses.",
    details: "Assessment on the properties and applications of electromagnetic waves.",
    type: "Assessment",
    dok: 2,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How do humans utilize different parts of the EM spectrum in technology?"
  },
  {
    date: "2026-04-16",
    day: 14,
    unit: 6,
    title: "The Dangers of Radiation",
    summary: "Evaluating the impact of Ionizing Radiation (UV, X-ray, Gamma) on biological tissue.",
    details: "Comparing ionizing vs. non-ionizing radiation and their effects.",
    type: "Activity",
    dok: 3,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "What makes certain frequencies of the EM spectrum hazardous to living tissue?"
  },
  {
    date: "2026-04-15",
    day: 13,
    unit: 6,
    title: "Energy & Matter Interactions",
    summary: "How materials absorb, reflect, or transmit specific frequencies.",
    details: "Transparency, opacity, and the selective absorption of light.",
    type: "Activity",
    links: { "Ripple Tank Node Hunter": "Unit_6_Waves_Radiation/ripple_tank/index.html" },
    dok: 2,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "What determines whether a material will absorb or transmit a specific frequency of light?"
  },
  {
    date: "2026-04-14",
    day: 12,
    unit: 6,
    title: "The EM Spectrum Map",
    summary: "Categorizing waves from Radio to Gamma by wavelength and frequency.",
    details: "Survey of the electromagnetic spectrum and its various regions.",
    links: { "Unknown Signal Analyzer": "Unit_6_Waves_Radiation/signal_analyzer/index.html" },
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How are the regions of the EM spectrum organized by energy and wavelength?"
  },
  {
    date: "2026-04-13",
    day: 11,
    unit: 6,
    title: "The Nature of Light",
    summary: "Introduction to EM waves (no medium required) and the constant speed c.",
    details: "Understanding light as an oscillation of electric and magnetic fields.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "Why does light not require a physical medium to travel through space?"
  },
  {
    date: "2026-04-10",
    day: 10,
    unit: 6,
    title: "Interference Lab/Activity",
    summary: "Hands-on station work with ripple tanks or sound interference apps.",
    details: "Practical application and observation of interference patterns.",
    type: "Lab",
    dok: 3,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How can we experimentally verify the principle of superposition?"
  },
  {
    date: "2026-04-09",
    day: 9,
    unit: 6,
    title: "Standing Waves & Ruben's Tube",
    summary: "Modeling standing waves and nodes using fire and sound in the Ruben's Tube demonstration.",
    details: "Physics of musical instruments, harmonics, and natural frequency. Demonstrating standing waves with the Ruben's Tube.",
    type: "Activity",
    dok: 3,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How do standing waves and resonance explain the physics of music?",
    wicor: {
      inquiry: "Ruben's Tube Demo: Visualizing nodes and antinodes using flammable gas and acoustic pressure.",
      writing: "CER Statement: How does changing frequency affect the number of fire peaks?",
      collaboration: "Harmonics Mapping: Group identification of node locations."
    }
  },
  {
    date: "2026-04-08",
    day: 8,
    unit: 6,
    title: "Constructive vs. Destructive Interference",
    summary: "Mapping 'dead spots' and 'loud spots' in sound and light.",
    details: "Detailed study of phase relationships and their effect on wave amplitude.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How do phase differences lead to constructive and destructive interference?"
  },
  {
    date: "2026-04-07",
    day: 7,
    unit: 6,
    title: "Diffraction & Interference",
    summary: "Waves bending around obstacles and the Principle of Superposition.",
    details: "Investigating how waves interact and combine when they occupy the same space.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "What happens when two or more waves overlap in the same medium?"
  },
  {
    date: "2026-04-06",
    day: 6,
    unit: 6,
    title: "Boundary Behaviors",
    summary: "Reflection (fixed/free end) and Refraction (bending).",
    details: "Qualitative exploration of how waves behave when hitting a boundary or changing media.",
    type: "Activity",
    links: { 
      "Wave Boundary Explorer": "Unit_6_Waves_Radiation/Boundary_Behaviors/Boundary_Behaviors.html",
      "WaveMaster Lab": "Unit_6_Waves_Radiation/WaveMaster_Lab/wavemaster_lab.html" 
    },
    dok: 2,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How does the medium determine whether a wave reflects or refracts at a boundary?"
  },
  {
    date: "2026-03-27",
    day: 5,
    unit: 6,
    title: "Week 1 Review & Quiz",
    summary: "Assessment on wave anatomy and basic calculations.",
    details: "Summative check on wave properties and the wave equation.",
    type: "Assessment",
    dok: 3,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How well can we model and calculate basic wave properties?",
    wicor: {
      writing: "Self-Reflection: Which wave concept is most challenging so far?",
      organization: "Flashcard review for wave vocabulary.",
      collaboration: "Peer-grading of the Week 1 Review Set."
    }
  },
  {
    date: "2026-03-26",
    day: 4,
    unit: 6,
    title: "Period and Frequency",
    summary: "Exploring the inverse relationship (T = 1/f); Simple harmonic motion basics.",
    details: "Understanding the relationship between the time for one cycle and the number of cycles per second.",
    type: "Activity",
    dok: 1,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "What is the inverse relationship between the period and frequency of a wave?",
    links: { "Pendulum Mastery Lab": "Unit_6_Waves_Radiation/pendulum_lab/index.html" },
    wicor: {
      inquiry: "Pendulum Swing: Measuring time for 10 swings vs. swings per second.",
      writing: "Summary: Explaining why T = 1/f makes sense using physical units.",
      organization: "Graphic Organizer: Period vs. Frequency."
    }
  },
  {
    date: "2026-03-25",
    day: 3,
    unit: 6,
    title: "The Wave Equation",
    summary: "Practicing calculations for wave speed, frequency, and wavelength.",
    details: "Applying the fundamental wave equation v = fλ to various scenarios.",
    type: "Practice",
    links: { "Frequency...Practice 'til it Hertz": "Unit_6_Waves_Radiation/frequency_calculator/index.html" },
    dok: 2,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How can we mathematically relate wave speed, frequency, and wavelength?",
    wicor: {
      writing: "Variable Mapping: Defining v, f, and λ with units.",
      organization: "The Formula Triangle for v = fλ.",
      inquiry: "Predicting how doubling frequency affects wavelength if speed is constant."
    }
  },
  {
    date: "2026-03-24",
    day: 2,
    unit: 6,
    title: "Wave Types: Transverse vs. Longitudinal",
    summary: "Modeling particle motion using slinkies or simulations.",
    details: "Distinguishing between transverse waves (perpendicular motion) and longitudinal waves (parallel motion/compressions).",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How does the direction of particle motion distinguish transverse from longitudinal waves?",
    links: {
      "Simulation: Wave Measurement": "wave_measurement_simulation.html"
    },
    wicor: {
      inquiry: "Modeling particle motion with human 'stadium waves' vs. 'domino lines'.",
      collaboration: "Think-Pair-Share: Which wave type better models sound in air?",
      reading: "Venn Diagram comparing transverse and longitudinal properties."
    }
  },
  {
    date: "2026-03-23",
    day: 1,
    unit: 6,
    title: "Intro to Waves: Energy in Motion",
    summary: "AVID Critical Reading: Exploring the fundamental rule of waves—energy transports, matter stays.",
    details: "Students analyze a 5-paragraph text on mechanical and electromagnetic waves. The lesson focuses on the 5-part AVID annotation process, including gist statements and DOK 3 inquiry questions.",
    type: "Activity",
    dok: 1,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How can energy travel across a distance without actually moving matter from one place to another?",
    links: {
      "Reading: Intro to Waves": "https://docs.google.com/document/d/1UJdSuMXqWDw-NatiVyo9lG93a-24oYWkZH2dACjiFLQ/edit?usp=sharing",
      "Strategy: 3-Word Gist Statements": "https://youtu.be/YQKIc5apEUM",
      "Interactive: Waves & Energy Report": "Waves_Interactive_report.html"
    },
    wicor: {
      writing: "3-Word Gist Statements: Summarizing each of the 5 text paragraphs using exactly three words.",
      inquiry: "Level 3 Question: Developing a complex inquiry about Mediums vs. Vacuums.",
      organization: "Marking-the-Text: Numbering paragraphs, circling key terms, and underlining the 'Fundamental Rule' in Para 1.",
      reading: "Comparative Analysis: Distinguishing between mechanical waves and EM radiation."
    }
  },

  // --- Unit 5: Thermodynamics ---
  {
    date: "2026-03-20",
    day: 30,
    unit: 5,
    title: "Unit 5 Assessment",
    summary: "Summative assessment on Thermodynamics, Entropy, and Heat Engines.",
    details: "Students will demonstrate their understanding of the laws of thermodynamics, heat engines, and entropy in this unit assessment.",
    type: "Assessment",
    dok: 3,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How do we demonstrate mastery of thermodynamic laws and entropy concepts?"
  },
  {
    date: "2026-03-19",
    day: 29,
    unit: 5,
    title: "Heat Pump Dynamics",
    summary: "Exploring how heat pumps move energy against the gradient using the interactive model.",
    details: "Students analyze the thermodynamic cycle of a heat pump. Using the interactive model, they investigate how work is used to extract heat from a cold environment and release it into a warm one.",
    type: "Activity",
    dok: 3,
    semester: 2,
    isFeatured: true,
    links: {
      'Heat Pump Interactive Model': 'Heat_Pump_Model/index.html'
    },
    essentialQuestion: "How can we 'pump' heat against its natural flow from hot to cold?"
  },
  {
    date: "2026-03-18",
    day: 28,
    unit: 5,
    title: "AVID Focused Note Taking: Entropy & Heat Engines",
    summary: "Using AVID strategies to synthesize information on entropy and the efficiency of heat engines.",
    details: "Focused Reading and Note Taking: Students use marking-the-text strategies to analyze the 'Entropy and the Cost of Power' reading and connect it to heat engine efficiency.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    links: {
      'Reading: Entropy and the Cost of Power': 'https://docs.google.com/document/d/18SCo219sB0k27d_VGOXa20wFp4iQk0fOInLbwq_5AHI/edit?usp=sharing',
      'Interactive: Entropy & The Cost of Power': 'Entropy_Cost_of_power.html',
      'Presentation: Heat Engines': 'https://docs.google.com/presentation/d/1H1-IDxkyQ0MPDQ3y6Y9ebC_dmjzDTJwj9SjFLwdkmqU/edit?usp=sharing',
      'Printed Instructions': 'https://docs.google.com/document/d/1UXZ83sRCXzGNUq2MnIk-QF7sgIUhuqS9M9M57cFeDNE/edit?usp=sharing'
    },
    wicor: {
      reading: "Marking the Text & Focused Annotation.",
      writing: "Focused Note Taking: Identifying Main Ideas & Supporting Details."
    },
    essentialQuestion: "How can we use focused note-taking to analyze the relationship between entropy and engine efficiency?"
  },
  {
    date: "2026-03-17",
    day: 27,
    unit: 5,
    title: "Project: Entropy and Zombies",
    summary: "Applying entropy concepts to a survival scenario in the 'Entropy and Zombies' project.",
    details: "Students work in groups to solve thermodynamics-based survival challenges, applying the Second Law to predict the inevitable decay of systems and resource management.",
    type: "Activity",
    dok: 3,
    semester: 2,
    isFeatured: true,
    links: {
      'Entropy and Zombies Project Doc': 'https://docs.google.com/document/d/1P6zTrHvILhcegkh_KdeMliKIxFxIRzz-Wh3mwSht6Yg/edit?usp=sharing',
      'Entropy and Zombies Examples': 'https://drive.google.com/file/d/1zU6kPKk03noFmwDFEidzMLBkTBjnposw/view?usp=sharing',
      'Thermodynamics: Entropy & Heat Engines': 'https://docs.google.com/document/d/18SCo219sB0k27d_VGOXa20wFp4iQk0fOInLbwq_5AHI/edit?usp=sharing'
    },
    essentialQuestion: "How does the Second Law of Thermodynamics predict the inevitable decay of all systems?"
  },
  {
    date: "2026-03-16",
    day: 26,
    unit: 5,
    title: "Introduction to Entropy & Entropy Lab",
    summary: "Introducing the Second Law of Thermodynamics and the concept of disorder using the Entropy Lab.",
    details: "Defining entropy as a measure of disorder and microstates. Students use the Entropy Lab to observe particle diffusion (Microscopic) and structural decay (Macroscopic).",
    type: "Lab",
    dok: 2,
    semester: 2,
    isFeatured: true,
    links: {
      'Entropy Lab: Micro & Macro': 'Entropy_Simulation/index.html',
      'Entropy and Zombies Examples': 'https://drive.google.com/file/d/1zU6kPKk03noFmwDFEidzMLBkTBjnposw/view?usp=sharing'
    },
    essentialQuestion: "What is the relationship between microscopic disorder and macroscopic decay?"
  },
  {
    date: "2026-03-13",
    day: 25,
    unit: 5,
    title: "First Law Assessment",
    summary: "Assessment covering the First Law of Thermodynamics.",
    details: "Students will complete the interactive First Law Assessment to test their understanding of internal energy, heat, and work.",
    type: "Assessment",
    dok: 3,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How do we demonstrate mastery of the First Law of Thermodynamics?"
  },
  {
    date: "2026-03-12",
    day: 24,
    unit: 5,
    title: "Review: Thermodynamics U, Q, W",
    summary: "Reviewing the Thermodynamics U Q W worksheet and preparing for the quiz.",
    details: "In-class review of the Thermodynamics U Q W worksheet answers to clarify concepts on internal energy, heat, and work before the upcoming assessment.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How do we clarify the relationships between U, Q, and W before assessment?"
  },
  {
    date: "2026-03-11",
    day: 23,
    unit: 5,
    title: "Heat Engine Report",
    summary: "Researching and reporting on 5 different heat engines.",
    details: "Students will find information about the 5 listed heat engines and fill in the requested information for each.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    links: {
      'Heat Engine Report Slides': 'https://docs.google.com/presentation/d/1n7nqFHerCyZs3wRiW2Aj633TNEDT_MCpJwWWih13XRs/edit?usp=sharing'
    },
    essentialQuestion: "How do heat engines convert thermal energy into useful mechanical work?"
  },
  {
    date: "2026-03-10",
    day: 22,
    unit: 5,
    title: "The First Law of Thermodynamics",
    summary: "Energy conservation in thermodynamic systems (ΔU = Q + W).",
    details: "Defining Heat (Q) and Work (W) sign conventions. Understanding how adding heat or doing work changes a system's internal energy.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    links: {
      'Presentation: First Law of Thermodynamics': 'https://orangeusdorg-my.sharepoint.com/:p:/g/personal/rmudry_orangeusd_org/IQDZATPiyvvPR4J3orI6Kv85AY7a8qbPR-NCTCusDW9_dXQ?e=blosae',
      'Worksheet: The First Law': 'https://orangeusdorg-my.sharepoint.com/:b:/g/personal/rmudry_orangeusd_org/IQDDLo9r5BE4RYLXfENSHuFgATTddX3SJRYqYsTJsdXkIQI?e=LVtN99',
      'Interactive Model: The Cylinder & Piston': 'First_Law_Sim/index.html'
    },
    essentialQuestion: "How does the First Law of Thermodynamics relate changes in internal energy to heat and work?"
  },
  {
    date: "2026-03-09",
    day: 21,
    unit: 5,
    title: "Temperature vs. Internal Energy",
    summary: "Understanding the difference between average kinetic energy and total system energy.",
    details: "Comparing hot coffee to an iceberg, and analyzing the 'Oven vs. Sparkler' phenomenon. Introduction to how molecular mass affects speed at the same temperature.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    links: {
      'Presentation: Temp vs. Internal Energy': 'https://orangeusdorg-my.sharepoint.com/:p:/g/personal/rmudry_orangeusd_org/IQDZATPiyvvPR4J3orI6Kv85AY7a8qbPR-NCTCusDW9_dXQ?e=MzCXqr',
      'Heat Engine Research': 'https://docs.google.com/presentation/d/1n7nqFHerCyZs3wRiW2Aj633TNEDT_MCpJwWWih13XRs/edit?usp=sharing',
      'Thermodynamics: First Law Reading (English)': 'https://docs.google.com/document/d/1fezNGOy_SmsX2H3Iaf4L75OUl0XI_pqBlIbHZXIKjYY/edit?usp=sharing',
      'Thermodynamics: First Law Reading (Spanish)': 'https://docs.google.com/document/d/10VUp5VlLS08d7J85TxhYlACc3BvctmfZIrUWwqKoMlk/edit?usp=sharing'
    },
    essentialQuestion: "What is the difference between average kinetic energy and the total energy of a system?"
  },
  {
    date: "2026-03-06",
    day: 20,
    unit: 5,
    title: "Radiation Week Wrap-Up & Turn In",
    summary: "Finalizing Radiation Lab analysis and turning in the week's work.",
    details: "Organization: Finishing CER arguments and data matrices from Radiation Week. Students submitted their complete lab reports and worksheets for credit. This includes wrapping up the study of radiative heat transfer using the interactive Virtual Radiation Lab simulation.",
    type: "Activity",
    dok: 3,
    semester: 2,
    isFeatured: true,
    links: {
      'Turn In: Radiation Week Work': 'https://docs.google.com/document/d/1EJcKSlydN5ovtlp496SewBpOR_eqeMN2bZCXyISU1gU/edit?usp=sharing',
      'Virtual Radiation Lab': 'Radiation_Lab/index.html'
    },
    essentialQuestion: "How do we finalize our analysis of radiative heat transfer?"
  },
  {
    date: "2026-03-05",
    day: 19,
    unit: 5,
    title: "Synthesis: The Physics of Radiation",
    summary: "Connecting Reading, Demo, and Lab data to build a CER argument. <span class='inline-flex items-center gap-1 bg-blue-950/40 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/30 ml-2 animate-pulse'>★ VISITOR DAY</span>",
    details: "Writing & Organization: Students synthesize their observations from the week into a cohesive scientific argument. Visitors will observe AVID strategies in action.",
    type: "Activity",
    dok: 3,
    semester: 2,
    isFeatured: true,
    links: {
      'CER: The Physics of Radiation': 'https://docs.google.com/document/d/17auQmJ0RMZ8FiMe9m6arPO1T7Mh-AwGfP39jidER6NY/edit?usp=sharing',
      'Radiation Lab Worksheet': 'https://docs.google.com/document/d/1GhgcEpqwD06hJCLF0XsDtxKn1F2LjeIhoBKjFEs2G1M/edit?usp=sharing',
      'Synthesis Discussion Slides': 'https://docs.google.com/presentation/d/1b0NVmEJQjWIlre7w85iYGDkQF8Cx-0GJrplIvzE1FmI/edit?usp=sharing',
      'AI Career Outlook': 'ai-impact/index.html'
    },
    wicor: {
      writing: "CER Statement: How does distance and albedo affect thermal energy transfer?",
      organization: "Data Matrix connecting previous 3 days of evidence.",
      collaboration: "Peer review of arguments."
    },
    essentialQuestion: "How do we build a scientific argument for heat transfer using evidence and reasoning?"
  },
  {
    date: "2026-03-04",
    day: 18,
    unit: 5,
    title: "Virtual Lab: Radiation & Albedo",
    summary: "Using a digital simulation to test variables that affect radiative heat transfer.",
    details: "Inquiry & Collaboration: Groups use the Virtual Lab webapp to test how different materials and distances affect heat absorption.",
    type: "Lab",
    dok: 3,
    semester: 2,
    isFeatured: true,
    links: {
      'Virtual Lab Worksheet': 'https://docs.google.com/document/d/1GhgcEpqwD06hJCLF0XsDtxKn1F2LjeIhoBKjFEs2G1M/edit?usp=sharing',
      'Virtual Radiation Lab': 'Radiation_Lab/index.html',
      'Albedo Simulation': 'Radiation_Lab/albedo_sim.html'
    },
    wicor: {
      inquiry: "Testing variables (Distance vs. Absorption).",
      collaboration: "Group data analysis."
    },
    essentialQuestion: "What variables most significantly impact the rate of heat absorption by radiation?"
  },
  {
    date: "2026-03-03",
    day: 17,
    unit: 5,
    title: "Demonstration: Albedo & Inverse Square Law",
    summary: "Predicting and tracking temperature changes in black vs. white surfaces. Discussing Albedo and the Inverse Square Law.",
    details: "Inquiry & Organization: Predict/Observe/Explain cycle. Live data collection comparing a black can and a white can under a heat source to observe differential absorption and how distance affects intensity via the Inverse Square Law.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    links: {
      'Live Demo Tracker': 'Radiation_Lab/demo_tracker.html',
      'Albedo Simulation': 'Radiation_Lab/albedo_sim.html',
      'Interactive: Inverse Square Law': 'Inverse_Square_Law/index.html',
      'Inverse Square Law Notes': 'https://docs.google.com/document/d/1HYCiVSm_oczVIswpvDMwy9FBXZT0Aw4KEypgDabVfs0/edit?usp=sharing',
      'Video: Albedo explained': 'https://www.youtube.com/watch?v=8SG5hxx2RH4'
    },
    wicor: {
      inquiry: "Predicting heating rates based on surface color and distance.",
      organization: "Data table & Graphing of live temperatures."
    },
    essentialQuestion: "How do surface color and distance affect the intensity of radiative heating?"
  },
  {
    date: "2026-03-02",
    day: 16,
    unit: 5,
    title: "Reading: Heat Transfer by Radiation",
    summary: "Focused annotation of text on electromagnetic waves and thermal energy.",
    details: "Reading & Writing: Students use marking-the-text strategies to identify key concepts in radiative heat transfer.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    links: {
      'Radiation Reading (English)': 'https://docs.google.com/document/d/16y1kJZq4Rafpjyqr0EvsMSPGIB4eLmo9IiJBKGKgWXY/edit?usp=sharing',
      'Radiation Reading (Spanish)': 'https://docs.google.com/document/d/1q-3hxNYXSkdU6HIvrrGyLSqfclUkX4alEuqBnIXoQFg/edit?usp=sharing',
      'Web App Reading Version': 'Radiation_Lab/reading.html'
    },
    wicor: {
      reading: "Focused Annotation & Marking the Text.",
      writing: "Quick-summary of the Stefan-Boltzmann relationship."
    },
    essentialQuestion: "How is thermal energy transferred through electromagnetic waves?"
  },
  {
    date: "2026-02-27",
    day: 15,
    unit: 5,
    title: "Work Catchup & Turn In Day",
    summary: "Time to finalize boat designs, finish lab reports, and submit all pending Unit 5 assignments.",
    details: "Students will have the full period to complete their Penny Boat Lab analysis, finalize any missing work from the previous two weeks, and ensure all digital assignments are turned in.",
    type: "Activity",
    dok: 1,
    semester: 2,
    isFeatured: true,
    wicor: {
      writing: "Quick-Write (The Beach Analogy).",
      organization: "Formula breakdown and variable mapping."
    },
    essentialQuestion: "How do we summarize our understanding of buoyancy and heat transfer?"
  },
  {
    date: "2026-02-26",
    day: 14,
    unit: 5,
    title: "Lab: Penny Boat Activity",
    summary: "Testing boat designs and maximizing carrying capacity.",
    details: "Students iterate on their designs and compete to see which boat can hold the most pennies before sinking.",
    type: "Lab",
    dok: 3,
    semester: 2,
    isFeatured: true,
    links: {
      'Penny Boat Lab Simulation': 'penny-boat-lab/index.html',
      'Lab Worksheet': 'https://docs.google.com/document/d/1VQUuUUDHWyi3-RyGK4vMBHEynfavdPs9/edit?usp=sharing&ouid=111972921986195834260&rtpof=true&sd=true'
    },
    essentialQuestion: "How can we maximize buoyant force through boat design?"
  },
  {
    date: "2026-02-25",
    day: 13,
    unit: 5,
    title: "Connections: Reading and Lab",
    summary: "Making connections between the reading and the lab.",
    details: "Students will collaborate with their group to make connections between the reading materials and the recent lab using a shared document.",
    type: "Activity",
    dok: 3,
    semester: 2,
    isFeatured: true,
    wicor: {
      collaboration: "Students will collaborate with their group.",
      reading: "Making connections to the reading materials.",
      writing: "Documenting connections in the shared document."
    },
    links: {
      'Collaborative Document': 'https://docs.google.com/document/d/1dCXH40YVvT2zvgQBGSn-YRu4R8j7p8ardLDmhJd7KPU/edit?usp=sharing'
    },
    essentialQuestion: "How do we synthesize lab observations with core thermodynamic principles?"
  },
  {
    date: "2026-02-24",
    day: 12,
    unit: 5,
    title: "Buoyancy and Buoyant Force",
    summary: "Archimedes' Principle: Why things float (or sink).",
    details: "Study of buoyant force and how it relates to displaced fluid volume. Introduction to Archimedes' Principle.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    links: {
      'Reading': 'https://docs.google.com/document/d/1e1Cwzw_ZKKNy2roVR3oCfLnWNxiGaqZaq77qNkj7fpg/edit?usp=sharing',
      'Worksheet': 'https://docs.google.com/document/d/1IdLCxbYPBPB3RsRsxvp4UjFD1nPYD-4RXy-5t6UIXCI/edit?usp=sharing',
      'Buoyancy Basics Simulation': 'https://rrmudry.github.io/Buoyancy_Basics/buoyancy-basics_en.html'
    },
    essentialQuestion: "How does Archimedes' Principle explain why objects float in a fluid?"
  },
  {
    date: "2026-02-23",
    day: 11,
    unit: 5,
    title: "Thermal Expansion & Convection",
    summary: "Why bridges have gaps and how heat fluids move.",
    details: "Investigating linear and volumetric expansion and the movement of energy through fluid currents (convection).",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How does thermal energy affect the volume and density of fluids and solids?"
  },
  {
    date: "2026-02-20",
    day: 10,
    unit: 5,
    title: "Temperature Scales Practice",
    summary: "Finishing the Food Coloring Lab Worksheet. <span class=\"inline-flex items-center gap-1 bg-red-950/40 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/30 ml-2 animate-pulse\">⚠ SUB PRESENT</span>",
    details: "Students will complete the Lab Worksheet from Day 7.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    links: {
      'Lab Worksheet': 'https://docs.google.com/document/d/1onqDNCSUDJi4u-oreNEpD4egYqTfwLuH8jObR6BUdwU/edit?usp=sharing'
    },
    essentialQuestion: "How do we convert between Celsius, Fahrenheit, and Kelvin scales?"
  },
  {
    date: "2026-02-19",
    day: 9,
    unit: 5,
    title: "Ice Cube / Heatsink Lab (WICOR Walk)",
    summary: "Collaboration: Table group inquiry & data collection. Inquiry: Discrepant event (Predicting vs. Observing).",
    details: "Extensive lab for visitor walk. Focus on inquiry hooks, assigned roles, and CER writing.",
    type: "Lab",
    dok: 3,
    semester: 2,
    isFeatured: true,
    wicor: {
      writing: "CER Statement: Claim (Metal is better conductor), Evidence (Melt times), Reasoning (Momentum transfer).",
      inquiry: "Discrepant Event: Predicting vs. Observing ice melt rates on different materials.",
      collaboration: "Structured table groups with assigned roles (Lead Scientist, Data Recorder, Timekeeper).",
      organization: "Double Bubble Thinking Map comparing heat sink and wood block.",
      reading: "Lab instructions and background on thermal conductivity."
    },
    links: {
      'Lab Worksheet': 'https://docs.google.com/document/d/10UjF46bf5btNcFKzQqmEh9uEDaFugH-_k53kA50hL6c/edit?usp=sharing',
      'Class Presentation': 'https://docs.google.com/presentation/d/1P0ULnY6GGiIC9oxKiCnBeBTUQQMCPUCEZuYK_T3Tp-E/edit?usp=sharing'
    },
    essentialQuestion: "Why do different materials feel 'colder' even when at the same temperature?"
  },
  {
    date: "2026-02-18",
    day: 8,
    unit: 5,
    title: "Annotated Reading: 3 Modes of Heat Transfer",
    summary: "Reading: Focused Annotation & Marking the Text. Writing: Summarizing the 'Micro-View' of each mode.",
    details: "Focused annotation of text on conduction, convection, and radiation. Writing summaries of microscopic energy transfer.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    wicor: {
      reading: "Focused Annotation & Marking the Text.",
      writing: "Summarizing the 'Micro-View' of each mode."
    },
    links: {
      '3 Modes of Heat Transfer Reading': 'https://docs.google.com/document/d/1l2lmOQW4ekqVNpc30GCE69UrxQnn1oShPBXC_snQ7rk/edit?usp=sharing',
      'Class Presentation': 'https://docs.google.com/presentation/d/12PEKCsPVp568VA8rfx8KKHJlrR2sRCQR3ffCJ4YhWjA/edit?usp=sharing'
    },
    essentialQuestion: "What are the microscopic mechanisms for conduction, convection, and radiation?"
  },
  {
    date: "2026-02-17",
    day: 7,
    unit: 5,
    title: "Food Coloring Lab + Temp Scales",
    summary: "Inquiry: Predicting motion based on previous reading. Organization: Conversion Practice Worksheet.",
    details: "Predicting motion based on previous reading. Practicing temperature scale conversions.",
    type: "Lab",
    dok: 2,
    semester: 2,
    isFeatured: true,
    wicor: {
      inquiry: "Predicting motion based on previous reading.",
      organization: "Conversion Practice Worksheet."
    },
    links: {
      'Class Presentation': 'https://docs.google.com/presentation/d/1hIh64bCJDzl2VfIUFaMOoDsfsF9F7vvSPdYArvxsAFk/edit?usp=sharing'
    },
    essentialQuestion: "How does temperature affect the rate of molecular motion?"
  },
  {
    date: "2026-02-16",
    day: 6,
    unit: 5,
    title: "Presidents' Day - No School",
    summary: "Holiday observed. No school activities scheduled.",
    details: "Martin Luther King Jr. Day observed.",
    type: "Activity",
    dok: 0,
    semester: 2,
    isFeatured: false
  },
  {
    date: "2026-02-13",
    day: 5,
    unit: 5,
    title: "Presidents' Day (Observed) - No School",
    summary: "Holiday observed.",
    details: "No school.",
    type: "Activity",
    dok: 0,
    semester: 2,
    isFeatured: false
  },
  {
    date: "2026-02-12",
    day: 4,
    unit: 5,
    title: "Systems vs. Surroundings",
    summary: "Defining the boundary of our study.",
    details: "Vocabulary drill: Open vs. Closed vs. Isolated systems. Identifying the system in various scenarios.",
    type: "Activity",
    dok: 1,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How do we define the boundaries of a thermodynamic system?"
  },
  {
    date: "2026-02-11",
    day: 3,
    unit: 5,
    title: "Thermal Equilibrium",
    summary: "When hot meets cold: The inevitable balance.",
    details: "Conceptual understanding of heat flow. Heat moves from high T to low T until T_final is reached.",
    type: "Activity",
    dok: 1,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "Why does heat always flow from higher temperature to lower temperature?"
  },
  {
    date: "2026-02-10",
    day: 2,
    unit: 5,
    title: "Properties of Matter",
    summary: "Unit 5 Kickoff! Understanding matter and its thermal properties.",
    details: "Students will use AVID annotation strategies to read and analyze the 'Thermodynamics & Matter' reading, exploring the distinction between temperature (microscopic average KE) and heat (macroscopic energy transfer).",
    type: "Activity",
    dok: 1,
    semester: 2,
    isFeatured: true,
    links: {
      reading: 'https://docs.google.com/document/d/1B2MmWi6uCSIEM9hKdQufnxnwlf1sqyod420oX_KwyBg/edit?usp=sharing'
    },
    essentialQuestion: "What is the distinction between temperature and heat?"
  },
  {
    date: "2026-02-09",
    day: 1,
    unit: 5,
    title: "Wrap up of previous week",
    summary: "Wrapping up Unit 4 concepts and finalizing outstanding work.",
    details: "Review and wrap up of concepts from the previous week to ensure a smooth transition into Thermodynamics.",
    type: "Activity",
    dok: 1,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How do we bridge the gap between momentum concepts and thermodynamic energy?"
  },

  // --- Unit 4: Momentum & Impulse ---
  {
    date: "2026-02-06",
    day: 20,
    unit: 4,
    title: "Egg Drop: Test Day",
    summary: "Drop day! Testing egg containers and analyzing impulse reduction effectiveness.",
    details: "Students drop their egg containers from designated height and analyze which designs were most effective at reducing impulse to protect the egg.",
    type: "Activity",
    dok: 3,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "Which design features are most effective at increasing impact time to protect a passenger?"
  },
  {
    date: "2026-02-05",
    day: 19,
    unit: 4,
    title: "Egg Drop: Building Day",
    summary: "Hands-on construction of egg drop protection containers.",
    details: "Students build their egg drop protection containers using approved materials, applying impulse reduction principles to protect the egg during impact.",
    type: "Activity",
    dok: 3,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How do we apply engineering constraints to maximize safety in a collision?"
  },
  {
    date: "2026-02-04",
    day: 18,
    unit: 4,
    title: "Impulse, Momentum, and Collisions Review",
    summary: "Students will work on an impulse, momentum, and collisions review.",
    details: "Review session covering key concepts of Unit 4 including impulse, momentum, and collision types.",
    type: "Practice",
    dok: 2,
    links: {
      worksheet: 'https://docs.google.com/document/d/1NTlmnUfAbc-M5DIXjM16fddZQ4kT22gp/edit?usp=drive_link&ouid=111972921986195834260&rtpof=true&sd=true'
    },
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How do we demonstrate mastery of Unit 4 concepts through comprehensive review?"
  },
  {
    date: "2026-02-03",
    day: 17,
    unit: 4,
    title: "Practice: Elastic & Inelastic Collisions",
    summary: "Guided review of collision calculations followed by independent practice.",
    details: "We reviewed the PowerPoint slides on collision types and worked through example problems. Students then completed the practice worksheet.",
    type: "Practice",
    dok: 2,
    links: {
      worksheet: 'https://docs.google.com/document/d/1oPYECLlG-p7O3gOdFiw0aGqtdZxQLd9OvZ5jA0VVzSA/edit?usp=sharing'
    },
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How do we mathematically predict the outcomes of various types of collisions?"
  },
  {
    date: "2026-02-02",
    day: 16,
    unit: 4,
    title: "Reading: Elastic vs. Inelastic Collisions",
    summary: "AVID annotations of reading material & Egg Drop project kickoff.",
    details: "Students annotated the text on Elastic and Inelastic Collisions. We also reviewed the instructions for the upcoming Egg Drop challenge.",
    type: "Activity",
    dok: 2,
    links: {
      worksheet: 'https://docs.google.com/document/d/1SSEvaA1CjvFzp_syOhSzLdmLxeYmgo4XvjxS0VEK-6Q/edit?usp=sharing',
      'Egg Drop Instructions': 'https://orangeusdorg-my.sharepoint.com/:w:/g/personal/rmudry_orangeusd_org/IQCK_YeyS2K9R6Rpf-S4iTzOAe736fEhXKILK4262BaDQbY?e=FbF2YO'
    },
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How does the conservation of kinetic energy distinguish elastic from inelastic collisions?"
  },
  {
    date: "2026-01-30",
    day: 15,
    unit: 4,
    title: "Project Launch: Egg Drop Challenge",
    summary: "Instructions & constraints for the classic Egg Drop project.",
    details: "Introduction to the Egg Drop Challenge. Students will review the project guidelines, material constraints, and the physics of impulse reduction required to keep their egg safe.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How can we apply the impulse-momentum theorem to protect a fragile object from a fall?"
  },
  {
    date: "2026-01-29",
    day: 14,
    unit: 4,
    title: "Collisions in 1D Lab (PhET Simulation)",
    summary: "Investigating elastic and inelastic collisions using PhET simulation. Partners allowed.",
    details: "Students used the PhET Collision Lab to collect data and verify conservation of momentum in 1D. Links provided for the simulation and lab worksheet.",
    type: "Lab",
    dok: 2,
    links: {
      'PhET Simulation': 'https://phet.colorado.edu/sims/html/collision-lab/latest/collision-lab_all.html',
      worksheet: 'https://orangeusdorg-my.sharepoint.com/:w:/g/personal/rmudry_orangeusd_org/IQBqZra85A4SSK1ZmAvZcPY-ASLOQK3ArJx-cqWamoCeOBc?e=tHrura'
    },
    semester: 2,
    isFeatured: true,
    essentialQuestion: "What are the differences between elastic and inelastic collisions in terms of momentum conservation?"
  },
  {
    date: "2026-01-28",
    day: 13,
    unit: 4,
    title: "PHYSICS LAB: 2D MOMENTUM",
    summary: "Analyzing conservation of momentum in two dimensions using vector addition. <span class=\"inline-flex items-center gap-1 bg-red-950/40 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/30 ml-2 animate-pulse\">⚠ SUB PRESENT</span>",
    details: "Students conduct a 2D explosion lab, recording masses and (vx, vy) components to verify conservation rules. Links: <a href='https://rrmudry.github.io/physics-2d-momentum-lab/index.html'>Lab Report Webapp</a> | <a href='https://rrmudry.github.io/conservation-of-momentum/index.html'>Simulation</a>",
    type: "Lab",
    dok: 3,
    links: { 'Lab Report Webapp': 'https://rrmudry.github.io/physics-2d-momentum-lab/index.html', 'Simulation': 'https://rrmudry.github.io/conservation-of-momentum/index.html' },
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How do we apply conservation of momentum using vector addition in two dimensions?"
  },
  {
    date: "2026-01-27",
    day: 12,
    unit: 4,
    title: "Conservation of Momentum Day 1 Explosions in 1D",
    summary: "Simulated explosions! Applying conservation laws to 1D system. <span class=\"inline-flex items-center gap-1 bg-red-950/40 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/30 ml-2 animate-pulse\">⚠ SUB PRESENT</span>",
    details: "In-class investigation of 1D explosions using the simulator. Links: <a href='https://rrmudry.github.io/physics-momentum-lab-report/index.html'>Lab Report Webapp</a> | <a href='https://rrmudry.github.io/conservation-of-momentum/index.html'>Simulation</a>",
    type: "Lab",
    dok: 3,
    links: { 'Lab Report Webapp': 'https://rrmudry.github.io/physics-momentum-lab-report/index.html', 'Simulation': 'https://rrmudry.github.io/conservation-of-momentum/index.html' },
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How is momentum conserved in a closed system during an explosion?"
  },
  {
    date: "2026-01-26",
    day: 11,
    unit: 4,
    title: "FINAL ENGINEERING REPORT",
    summary: "Internal forces driving objects apart. Video analysis.",
    details: "Students analyze the physics of explosions and internal forces.",
    type: "Lab",
    dok: 3,
    links: { worksheet: 'https://docs.google.com/document/d/15eeYq-2sPEcbqNAOQ0AN9TQ_3i-XIMWXb9Nx_q_w0ps/edit?usp=sharing' },
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How do internal forces drive objects apart in an explosion?"
  },
  {
    date: "2026-01-23",
    day: 10,
    unit: 4,
    title: "Project Testing: Operation Safe Heeler (Crash Test Day)",
    summary: "Crash test day! Testing barriers and analyzing impulse results.",
    details: "Final testing day for the crash attenuation barriers. Results available on the project dashboard.",
    type: "Activity",
    dok: 3,
    links: { 'project results': 'operation_safe_heeler_results.html' },
    semester: 2,
    isFeatured: true,
    essentialQuestion: "Which design features are most effective at increasing impact time to protect a passenger?"
  },
  {
    date: "2026-01-22",
    day: 9,
    unit: 4,
    title: "Project Build: Operation Safe Heeler",
    summary: "Hands-on construction day for building crash attenuation barriers.",
    details: "Students apply their knowledge of impulse and momentum to engineer safety systems for the 'Operation Safe Heeler' project.",
    type: "Activity",
    dok: 3,
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How do material choices affect the time of impact and the resulting force?"
  },
  {
    date: "2026-01-21",
    day: 8,
    unit: 4,
    title: "Rocket Cart Lab: Impulse & Momentum",
    summary: "Interactive lab exploring impulse and momentum with rocket-powered carts.",
    details: "Students use the Rocket Cart Lab webapp to investigate the relationship between impulse and momentum.",
    type: "Lab",
    dok: 3,
    links: { webapp: 'https://rrmudry.github.io/rocket-cart-lab/index.html', worksheet: 'https://docs.google.com/document/d/1Wdb2nz8V71ER6nSFD-mLFTPlBpVAbEQP86q2BWbG1EQ/edit?usp=sharing' },
    semester: 2,
    isFeatured: true,
    essentialQuestion: "What is the relationship between impulse and the change in an object's momentum?"
  },
  {
    date: "2026-01-20",
    day: 7,
    unit: 4,
    title: "Project Launch: Operation Safe Heeler",
    summary: "Today we launch our Unit 4 project: Operation Safe Heeler!",
    details: "Introduction to crash attenuation barriers. Students will design and build a safety system for a cart. Project Worksheet and Day 7 Link available on dashboard.",
    type: "Activity",
    dok: 3,
    links: { worksheet: 'https://docs.google.com/document/d/1hn4Wwx4MjXH5IWOp-Md69w7-nHm6eNq7SO1o1MgSFYA/edit?usp=sharing', 'project website': 'operation-safe-heeler.html', 'Day 7 Link': 'https://docs.google.com/forms/d/e/1FAIpQLSe43Z06ocBI9LJXwOOFsx4zbF6SfLm73l5uQvU-l76Lpu8bEw/viewform?usp=publish-editor', 'crash barriers video': 'https://www.youtube.com/watch?v=w6CKltZfToY&t=61s' },
    semester: 2,
    isFeatured: false,
    essentialQuestion: "How can we engineer safety systems to reduce impulse during a crash?"
  },
  {
    date: "2026-01-19",
    day: 6,
    unit: 4,
    title: "MLK Day - No School",
    summary: "Holiday observed. No school activities scheduled.",
    details: "Martin Luther King Jr. Day observed.",
    type: "Activity",
    semester: 2,
    isFeatured: false
  },
  {
    date: "2026-01-16",
    day: 5,
    unit: 4,
    title: "Momentum & Impulse Quiz",
    summary: "Quiz covering momentum foundations and the impulse-momentum theorem.",
    details: "Summative assessment on the first week's concepts.",
    type: "Assessment",
    dok: 3,
    semester: 2,
    isFeatured: false,
    essentialQuestion: "How can we demonstrate mastery of momentum and the impulse-momentum theorem?"
  },
  {
    date: "2026-01-15",
    day: 4,
    unit: 4,
    title: "Hey! Stop that thing!! (Impulse)",
    summary: "Scenario-based lab calculating the impulse needed to stop an object.",
    details: "Students create scenarios where objects with momentum are brought to a stop, calculating force and time requirements. Lab worksheet available on dashboard.",
    type: "Lab",
    dok: 3,
    links: { worksheet: 'https://docs.google.com/document/d/1S_9AbUsIyIVDCooBL63XZ5qcB95RGBQCnODqmRtfD3Y/edit?usp=sharing' },
    semester: 2,
    isFeatured: false,
    essentialQuestion: "What determines how much force is needed to stop a moving object?"
  },
  {
    date: "2026-01-14",
    day: 3,
    unit: 4,
    title: "Momentum and Impulse Practice",
    summary: "Numerical practice with p=mv and J=Ft equations.",
    details: "Computational worksheet to solidify the mathematical relationship between force, time, and momentum change.",
    type: "Practice",
    dok: 2,
    links: { worksheet: 'https://orangeusdorg-my.sharepoint.com/:w:/g/personal/rmudry_orangeusd_org/IQCwJD7mmYGORJTobad0Q3FjAZ70FTiLHMdqRQNOBAPoVOk?e=P4qdky' },
    semester: 2,
    isFeatured: false,
    essentialQuestion: "How do we calculate momentum and impulse using p=mv and J=Ft?"
  },
  {
    date: "2026-01-13",
    day: 2,
    unit: 4,
    title: "Momentum (PowerPoint Intro)",
    summary: "Formal introduction to the mathematical definition of momentum.",
    details: "Lecture and demonstration covering p=mv. Students began notes using the class presentation.",
    type: "Activity",
    dok: 2,
    links: { notes: 'https://orangeusdorg-my.sharepoint.com/:p:/g/personal/rmudry_orangeusd_org/IQDAf56uDWDvRrHKm_dqPjndAaZFIsdJv1aFlRtInx7he0M?e=tpeQBO' },
    semester: 2,
    isFeatured: false,
    essentialQuestion: "What is momentum and how is it mathematically defined?"
  },
  {
    date: "2026-01-12",
    day: 1,
    unit: 4,
    title: "Understanding Car Crashes",
    summary: "Welcome back! Today we transition from static forces to the physics of impact.",
    details: "Watched the YouTube video (MythBusters: Crash Force) and completed the Google Doc.",
    type: "Activity",
    dok: 1,
    links: { video: 'https://www.youtube.com/watch?v=2XKOzibVqJg', worksheet: 'https://docs.google.com/document/d/1-byPZiH6PZ6kOckrk3-35An7i1IDFM6GL_S3jvvXqNs/edit?usp=sharing' },
    semester: 2,
    isFeatured: true,
    essentialQuestion: "How does the physics of impact differ from static forces?"
  }
];

// Helper to get today's lesson or latest lesson
function getLatestLesson() {
  return lessonsData[0]; // Assuming sorted by date descending or just latest entry
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { lessonsData, getLatestLesson };
}
