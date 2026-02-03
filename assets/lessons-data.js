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
  // --- Unit 4: Momentum & Impulse ---
  {
    date: "2026-02-01",
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
