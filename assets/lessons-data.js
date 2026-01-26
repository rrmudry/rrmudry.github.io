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
  {
    date: "2026-01-26",
    title: "Explosions in Physics",
    unit: 4,
    day: 11,
    summary: "Internal forces driving objects apart. Video analysis.",
    details: "Students analyze the physics of explosions and internal forces. Worksheet available on dashboard.",
    semester: 2,
    isFeatured: true
  },
  {
    date: "2026-01-23",
    title: "Project Testing: Operation Safe Heeler (Crash Test Day)",
    unit: 4,
    day: 10,
    summary: "Crash test day! Testing barriers and analyzing impulse results.",
    details: "Final testing day for the crash attenuation barriers. Results available on the project dashboard.",
    semester: 2,
    isFeatured: true
  },
  {
    date: "2026-01-22",
    title: "Project Build: Operation Safe Heeler",
    unit: 4,
    day: 9,
    summary: "Hands-on construction day for building crash attenuation barriers.",
    details: "Students apply their knowledge of impulse and momentum to engineer safety systems for the 'Operation Safe Heeler' project.",
    semester: 2,
    isFeatured: true
  },
  {
    date: "2026-01-21",
    title: "Rocket Cart Lab: Impulse & Momentum",
    unit: 4,
    day: 8,
    summary: "Interactive lab exploring impulse and momentum with rocket-powered carts.",
    details: "Students use the Rocket Cart Lab webapp to investigate the relationship between impulse and momentum. Lab Worksheet available on dashboard.",
    semester: 2,
    isFeatured: true
  },
  {
    date: "2026-01-20",
    title: "Project Launch: Operation Safe Heeler",
    unit: 4,
    day: 7,
    summary: "Today we launch our Unit 4 project: Operation Safe Heeler!",
    details: "Introduction to crash attenuation barriers. Students will design and build a safety system for a cart. Project Worksheet and Day 7 Link available on dashboard.",
    semester: 2,
    isFeatured: false
  },
  {
    date: "2026-01-19",
    title: "MLK Day - No School",
    unit: 4,
    day: 6,
    summary: "Holiday observed. No school activities scheduled.",
    details: "Martin Luther King Jr. Day observed.",
    semester: 2,
    isFeatured: false
  },
  {
    date: "2026-01-16",
    title: "Momentum & Impulse Quiz",
    unit: 4,
    day: 5,
    summary: "Quiz covering momentum foundations and the impulse-momentum theorem.",
    details: "Summative assessment on the first week's concepts.",
    semester: 2,
    isFeatured: false
  },
  {
    date: "2026-01-15",
    title: "Hey! Stop that thing!! (Impulse)",
    unit: 4,
    day: 4,
    summary: "Scenario-based lab calculating the impulse needed to stop an object.",
    details: "Students create scenarios where objects with momentum are brought to a stop, calculating force and time requirements. Lab worksheet available on dashboard.",
    semester: 2,
    isFeatured: false
  },
  {
    date: "2026-01-14",
    title: "Momentum and Impulse Practice",
    unit: 4,
    day: 3,
    summary: "Numerical practice with p=mv and J=Ft equations.",
    details: "Computational worksheet to solidify the mathematical relationship between force, time, and momentum change.",
    semester: 2,
    isFeatured: false
  },
  {
    date: "2026-01-13",
    title: "Momentum (PowerPoint Intro)",
    unit: 4,
    day: 2,
    summary: "Formal introduction to the mathematical definition of momentum.",
    details: "Lecture and demonstration covering p=mv. Students began notes using the class presentation.",
    semester: 2,
    isFeatured: false
  },
  {
    date: "2026-01-12",
    title: "Semester 2 Kickoff: Momentum & Impulse",
    unit: 4,
    day: 1,
    summary: "Welcome back! Today we transition from static forces to the physics of impact.",
    details: "Winter break check-in. Introduction to Linear Momentum (p = mv) and the Impulse-Momentum Theorem. Demonstrations with air tracks and carts.",
    semester: 2,
    isFeatured: true
  },
  {
    date: "2024-12-20",
    title: "Semester 1 Final Wrap-up",
    unit: 3,
    day: 12,
    summary: "Reflecting on Units 1-3. Semester 1 concludes.",
    details: "Final assessments submitted. Winter break begins!",
    semester: 1,
    isFeatured: false
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
