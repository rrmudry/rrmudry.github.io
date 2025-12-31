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
    date: "2025-01-12",
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
