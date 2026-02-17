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
  // --- Unit 5: Thermodynamics ---
  {
    date: "2026-03-10",
    day: 22,
    unit: 5,
    title: "Efficiency & Unit Review",
    summary: "Calculating engine efficiency and reviewing all thermodynamic concepts.",
    details: "Final review of the unit. Students calculate the efficiency of various heat engines and prepare for the unit test.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true
  },
  {
    date: "2026-03-09",
    day: 21,
    unit: 5,
    title: "Heat Engines: Turning Heat into Work",
    summary: "Analyzing how engines use heat flow to perform mechanical work.",
    details: "Students investigate the basic components of a heat engine (hot reservoir, cold reservoir, engine) and the energy flow diagram.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true
  },
  {
    date: "2026-03-06",
    day: 20,
    unit: 5,
    title: "PV Diagrams: Visualizing Work",
    summary: "Interpreting Pressure-Volume graphs to calculate work done.",
    details: "Lecture and practice on reading PV diagrams. Calculating the area under the curve to find work (W = PΔV).",
    type: "Activity",
    dok: 3,
    semester: 2,
    isFeatured: true
  },
  {
    date: "2026-03-05",
    day: 19,
    unit: 5,
    title: "Lab: Ideal Gas Law",
    summary: "Experimental verification of the relationship between P, V, and T.",
    details: "Students use a syringe and pressure sensor (or simulation) to verify Boyle's Law and Charles's Law.",
    type: "Lab",
    dok: 3,
    semester: 2,
    isFeatured: true
  },
  {
    date: "2026-03-04",
    day: 18,
    unit: 5,
    title: "Adiabatic Processes",
    summary: "Rapid expansion and compression where no heat is exchanged.",
    details: "Study of adiabatic processes in diesel engines and cloud formation. Q=0, so ΔU = W.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true
  },
  {
    date: "2026-03-03",
    day: 17,
    unit: 5,
    title: "Isobaric & Isochoric Processes",
    summary: "Constant pressure vs. constant volume processes.",
    details: "Analyzing gas behavior when pressure or volume is held constant. Calculating work done in isobaric processes.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true
  },
  {
    date: "2026-03-02",
    day: 16,
    unit: 5,
    title: "Intro to Ideal Gases & Isothermal Processes",
    summary: "The Ideal Gas Law (PV=nRT) and constant temperature changes.",
    details: "Introduction to the microscopic model of gases. Defining the Ideal Gas Law and studying isothermal expansion/compression.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true
  },
  {
    date: "2026-02-27",
    day: 15,
    unit: 5,
    title: "Entropy in the Real World",
    summary: "From melting ice to time's arrow: Entropy is everywhere.",
    details: "Discussion of the 'Heat Death' of the universe and why perpetual motion machines are impossible due to the Second Law.",
    type: "Activity",
    dok: 1,
    semester: 2,
    isFeatured: true
  },
  {
    date: "2026-02-26",
    day: 14,
    unit: 5,
    title: "The Second Law: Entropy",
    summary: "The universe tends toward disorder. Why efficiency is never 100%.",
    details: "Introduction to the concept of Entropy (S) as a measure of disorder. The Second Law of Thermodynamics.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true
  },
  {
    date: "2026-02-25",
    day: 13,
    unit: 5,
    title: "Systems & Energy Conservation",
    summary: "Applying the First Law (ΔU = Q + W) to closed systems.",
    details: "Calculations involving internal energy change, heat added, and work done on/by the system.",
    type: "Practice",
    dok: 2,
    semester: 2,
    isFeatured: true
  },
  {
    date: "2026-02-24",
    day: 12,
    unit: 5,
    title: "The Zeroth & First Laws",
    summary: "Defining temperature and the conservation of energy.",
    details: "Formal introduction to the First Law of Thermodynamics: Energy cannot be created or destroyed, only transferred.",
    type: "Activity",
    dok: 1,
    semester: 2,
    isFeatured: true
  },
  {
    date: "2026-02-23",
    day: 11,
    unit: 5,
    title: "Thermal Expansion",
    summary: "Why bridges have gaps: Solids and liquids expanding with heat.",
    details: "Investigating linear and volumetric expansion. Calculation of length change ΔL = αL₀ΔT.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true
  },
  {
    date: "2026-02-20",
    day: 10,
    unit: 5,
    title: "Specific Heat Intro (Q=mcΔT)",
    summary: "Writing: Quick-Write (The Beach Analogy). Organization: Formula breakdown and variable mapping.",
    details: "Introduction to the main thermodynamics formula using the beach analogy for specific heat.",
    type: "Activity",
    dok: 2,
    semester: 2,
    isFeatured: true,
    wicor: {
      writing: "Quick-Write (The Beach Analogy).",
      organization: "Formula breakdown and variable mapping."
    }
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
      collaboration: "Structured table groups with assigned roles (Lead Scientist, Data Recorder, Timekeeper).",
      inquiry: "Essential Question Hook and Prediction in notebooks.",
      writing: "CER Statement: Claim (Metal is better conductor), Evidence (Melt times), Reasoning (Momentum transfer).",
      organization: "Binder/Notebook check for Wednesday's annotated reading."
    }
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
      '3 Modes of Heat Transfer Reading': 'https://docs.google.com/document/d/1l2lmOQW4ekqVNpc30GCE69UrxQnn1oShPBXC_snQ7rk/edit?usp=sharing'
    }
  },
  {
    date: "2026-02-17",
    day: 7,
    unit: 5,
    title: "Systems vs. Surroundings",
    summary: "Defining the boundary of our study.",
    details: "Vocabulary drill: Open vs. Closed vs. Isolated systems. Identifying the system in various scenarios.",
    type: "Activity",
    dok: 1,
    semester: 2,
    isFeatured: true
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
<<<<<<< HEAD
=======
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
      'Lab Worksheet': 'https://docs.google.com/document/d/1onqDNCSUDJi4u-oreNEpD4egYqTfwLuH8jObR6BUdwU/edit?usp=sharing',
      'Class Presentation': 'https://docs.google.com/presentation/d/1hIh64bCJDzl2VfIUFaMOoDsfsF9F7vvSPdYArvxsAFk/edit?usp=sharing'
    }
  },
  {
>>>>>>> 02e9632 (Update Unit 5 schedule and dashboard for Feb 16-20 with WICOR/AVID strategies and lesson links)
    date: "2026-02-12",
    day: 4,
    unit: 5,
    title: "Wrap up of article annotations we read",
    summary: "Finalizing and reviewing our analysis of thermodynamic readings.",
    details: "Students wrap up their annotated readings on Thermodynamics and Matter, synthesizing key concepts before moving into systems.",
    type: "Activity",
    dok: 1,
    semester: 2,
    isFeatured: true
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
    isFeatured: true
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
    }
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
    isFeatured: true
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
    isFeatured: true
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
    isFeatured: true
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
    isFeatured: true
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
    isFeatured: true
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
    isFeatured: true
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
    isFeatured: true
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
    isFeatured: true
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
    isFeatured: true
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
    isFeatured: true
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
    isFeatured: true
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
    isFeatured: true
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
    isFeatured: true
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
    isFeatured: true
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
    isFeatured: false
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
    isFeatured: false
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
    isFeatured: false
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
    isFeatured: false
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
    isFeatured: false
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
    isFeatured: true
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
