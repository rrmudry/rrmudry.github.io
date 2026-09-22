// 50 Standardized Curated Physics Word Problems for vf = vo + at
// Strict NGSS/CAST Terminology: Acceleration, Initial Velocity, Final Velocity, Elapsed Time.
// Mathematically verified for vf = vo + at across all 50 questions.

const QUESTIONS = [
  // =========================================================================
  // LEVEL 1: Variable Identification & Formula Anatomy (Questions 1 to 20)
  // =========================================================================

  // Solve for vf (Q1 - Q5)
  {
    id: 1,
    textParts: ["A sports car accelerates from rest at ", { variable: "vo" }, " with a constant acceleration of ", { variable: "a" }, " for ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q1v1", value: 0, unit: "m/s", variable: "vo" },
      { id: "q1v2", value: 4, unit: "m/s²", variable: "a" },
      { id: "q1v3", value: 5, unit: "s", variable: "t" }
    ],
    solveFor: "vf",
    unknownText: "its final velocity"
  },
  {
    id: 2,
    textParts: ["A commercial passenger jet rolls onto the runway at an initial velocity of ", { variable: "vo" }, " and accelerates at ", { variable: "a" }, " for ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q2v1", value: 10, unit: "m/s", variable: "vo" },
      { id: "q2v2", value: 3, unit: "m/s²", variable: "a" },
      { id: "q2v3", value: 20, unit: "s", variable: "t" }
    ],
    solveFor: "vf",
    unknownText: "its final takeoff velocity"
  },
  {
    id: 3,
    textParts: ["A commuter train travels at an initial velocity of ", { variable: "vo" }, " before decelerating at ", { variable: "a" }, " for ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q3v1", value: 28, unit: "m/s", variable: "vo" },
      { id: "q3v2", value: -3.5, unit: "m/s²", variable: "a" },
      { id: "q3v3", value: 6, unit: "s", variable: "t" }
    ],
    solveFor: "vf",
    unknownText: "its final velocity"
  },
  {
    id: 4,
    textParts: ["A cyclist coasting at an initial velocity of ", { variable: "vo" }, " accelerates downhill at ", { variable: "a" }, " for ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q4v1", value: 6, unit: "m/s", variable: "vo" },
      { id: "q4v2", value: 1.5, unit: "m/s²", variable: "a" },
      { id: "q4v3", value: 8, unit: "s", variable: "t" }
    ],
    solveFor: "vf",
    unknownText: "their final velocity"
  },
  {
    id: 5,
    textParts: ["A subway train departs a station from rest at ", { variable: "vo" }, ", accelerating at ", { variable: "a" }, " for ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q5v1", value: 0, unit: "m/s", variable: "vo" },
      { id: "q5v2", value: 2.2, unit: "m/s²", variable: "a" },
      { id: "q5v3", value: 10, unit: "s", variable: "t" }
    ],
    solveFor: "vf",
    unknownText: "its final velocity"
  },

  // Solve for vo (Q6 - Q10)
  {
    id: 6,
    textParts: ["A test car decelerates at ", { variable: "a" }, " for ", { variable: "t" }, " to come to a complete stop at a final velocity of ", { variable: "vf" }, ". What was ", { isUnknown: true }, "?"],
    values: [
      { id: "q6v1", value: 0, unit: "m/s", variable: "vf" },
      { id: "q6v2", value: -5, unit: "m/s²", variable: "a" },
      { id: "q6v3", value: 6, unit: "s", variable: "t" }
    ],
    solveFor: "vo",
    unknownText: "its initial velocity"
  },
  {
    id: 7,
    textParts: ["A sprinter crosses the finish line at a final velocity of ", { variable: "vf" }, " after accelerating at ", { variable: "a" }, " for ", { variable: "t" }, ". What was ", { isUnknown: true }, "?"],
    values: [
      { id: "q7v1", value: 11.5, unit: "m/s", variable: "vf" },
      { id: "q7v2", value: 0.8, unit: "m/s²", variable: "a" },
      { id: "q7v3", value: 5, unit: "s", variable: "t" }
    ],
    solveFor: "vo",
    unknownText: "their initial velocity"
  },
  {
    id: 8,
    textParts: ["A landing aircraft slows to a final taxi velocity of ", { variable: "vf" }, " after decelerating at ", { variable: "a" }, " for ", { variable: "t" }, ". What was ", { isUnknown: true }, "?"],
    values: [
      { id: "q8v1", value: 15, unit: "m/s", variable: "vf" },
      { id: "q8v2", value: -4, unit: "m/s²", variable: "a" },
      { id: "q8v3", value: 12, unit: "s", variable: "t" }
    ],
    solveFor: "vo",
    unknownText: "its initial touchdown velocity"
  },
  {
    id: 9,
    textParts: ["A drone reaches a final velocity of ", { variable: "vf" }, " after accelerating at ", { variable: "a" }, " for ", { variable: "t" }, ". What was ", { isUnknown: true }, "?"],
    values: [
      { id: "q9v1", value: 24, unit: "m/s", variable: "vf" },
      { id: "q9v2", value: 3.5, unit: "m/s²", variable: "a" },
      { id: "q9v3", value: 4, unit: "s", variable: "t" }
    ],
    solveFor: "vo",
    unknownText: "its initial velocity"
  },
  {
    id: 10,
    textParts: ["A roller coaster car slows to a final velocity of ", { variable: "vf" }, " at the peak of a loop after decelerating at ", { variable: "a" }, " for ", { variable: "t" }, ". What was ", { isUnknown: true }, "?"],
    values: [
      { id: "q10v1", value: 8, unit: "m/s", variable: "vf" },
      { id: "q10v2", value: -2.5, unit: "m/s²", variable: "a" },
      { id: "q10v3", value: 4, unit: "s", variable: "t" }
    ],
    solveFor: "vo",
    unknownText: "its initial velocity"
  },

  // Solve for a (Q11 - Q15)
  {
    id: 11,
    textParts: ["An electric sports car accelerates from rest at ", { variable: "vo" }, " to a final velocity of ", { variable: "vf" }, " in ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q11v1", value: 0, unit: "m/s", variable: "vo" },
      { id: "q11v2", value: 27, unit: "m/s", variable: "vf" },
      { id: "q11v3", value: 3, unit: "s", variable: "t" }
    ],
    solveFor: "a",
    unknownText: "its acceleration"
  },
  {
    id: 12,
    textParts: ["A delivery van traveling at an initial velocity of ", { variable: "vo" }, " decelerates to a complete stop at ", { variable: "vf" }, " in ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q12v1", value: 20, unit: "m/s", variable: "vo" },
      { id: "q12v2", value: 0, unit: "m/s", variable: "vf" },
      { id: "q12v3", value: 5, unit: "s", variable: "t" }
    ],
    solveFor: "a",
    unknownText: "its acceleration"
  },
  {
    id: 13,
    textParts: ["A motorcycle increases its velocity from an initial ", { variable: "vo" }, " to a final velocity of ", { variable: "vf" }, " in ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q13v1", value: 12, unit: "m/s", variable: "vo" },
      { id: "q13v2", value: 30, unit: "m/s", variable: "vf" },
      { id: "q13v3", value: 6, unit: "s", variable: "t" }
    ],
    solveFor: "a",
    unknownText: "its acceleration"
  },
  {
    id: 14,
    textParts: ["A sled sliding across rough snow slows from an initial velocity of ", { variable: "vo" }, " to a final velocity of ", { variable: "vf" }, " in ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q14v1", value: 14, unit: "m/s", variable: "vo" },
      { id: "q14v2", value: 2, unit: "m/s", variable: "vf" },
      { id: "q14v3", value: 6, unit: "s", variable: "t" }
    ],
    solveFor: "a",
    unknownText: "its acceleration"
  },
  {
    id: 15,
    textParts: ["A high-speed maglev train launches from rest at ", { variable: "vo" }, " and reaches a cruising velocity of ", { variable: "vf" }, " in ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q15v1", value: 0, unit: "m/s", variable: "vo" },
      { id: "q15v2", value: 80, unit: "m/s", variable: "vf" },
      { id: "q15v3", value: 40, unit: "s", variable: "t" }
    ],
    solveFor: "a",
    unknownText: "its acceleration"
  },

  // Solve for t (Q16 - Q20)
  {
    id: 16,
    textParts: ["A car cruising at an initial velocity of ", { variable: "vo" }, " accelerates at ", { variable: "a" }, " to reach a final velocity of ", { variable: "vf" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q16v1", value: 18, unit: "m/s", variable: "vo" },
      { id: "q16v2", value: 28, unit: "m/s", variable: "vf" },
      { id: "q16v3", value: 2.5, unit: "m/s²", variable: "a" }
    ],
    solveFor: "t",
    unknownText: "the elapsed time"
  },
  {
    id: 17,
    textParts: ["A city bus traveling at an initial velocity of ", { variable: "vo" }, " decelerates at ", { variable: "a" }, " to come to a stop at ", { variable: "vf" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q17v1", value: 15, unit: "m/s", variable: "vo" },
      { id: "q17v2", value: 0, unit: "m/s", variable: "vf" },
      { id: "q17v3", value: -3, unit: "m/s²", variable: "a" }
    ],
    solveFor: "t",
    unknownText: "the time to stop"
  },
  {
    id: 18,
    textParts: ["A rocket sled starts from rest at ", { variable: "vo" }, " and accelerates at ", { variable: "a" }, " to reach a final velocity of ", { variable: "vf" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q18v1", value: 0, unit: "m/s", variable: "vo" },
      { id: "q18v2", value: 120, unit: "m/s", variable: "vf" },
      { id: "q18v3", value: 20, unit: "m/s²", variable: "a" }
    ],
    solveFor: "t",
    unknownText: "the elapsed time"
  },
  {
    id: 19,
    textParts: ["A motorboat slows from an initial velocity of ", { variable: "vo" }, " to an idle velocity of ", { variable: "vf" }, " by decelerating at ", { variable: "a" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q19v1", value: 16, unit: "m/s", variable: "vo" },
      { id: "q19v2", value: 4, unit: "m/s", variable: "vf" },
      { id: "q19v3", value: -2, unit: "m/s²", variable: "a" }
    ],
    solveFor: "t",
    unknownText: "the elapsed time"
  },
  {
    id: 20,
    textParts: ["A cheetah accelerates from rest at ", { variable: "vo" }, " with a constant acceleration of ", { variable: "a" }, " until reaching a top velocity of ", { variable: "vf" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q20v1", value: 0, unit: "m/s", variable: "vo" },
      { id: "q20v2", value: 30, unit: "m/s", variable: "vf" },
      { id: "q20v3", value: 7.5, unit: "m/s²", variable: "a" }
    ],
    solveFor: "t",
    unknownText: "the elapsed time"
  },

  // =========================================================================
  // LEVEL 2: Tool-Aided Computation (Questions 21 to 40)
  // =========================================================================

  // Solve for vf (Q21 - Q25)
  {
    id: 21,
    textParts: ["A mountain coaster enters a steep descent with an initial velocity of ", { variable: "vo" }, " and accelerates at ", { variable: "a" }, " for ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q21v1", value: 5.5, unit: "m/s", variable: "vo" },
      { id: "q21v2", value: 3.2, unit: "m/s²", variable: "a" },
      { id: "q21v3", value: 4.5, unit: "s", variable: "t" }
    ],
    solveFor: "vf",
    unknownText: "its final velocity"
  },
  {
    id: 22,
    textParts: ["A medical helicopter moves from a forward hover at an initial velocity of ", { variable: "vo" }, " and accelerates at ", { variable: "a" }, " for ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q22v1", value: 8, unit: "m/s", variable: "vo" },
      { id: "q22v2", value: 2.4, unit: "m/s²", variable: "a" },
      { id: "q22v3", value: 15, unit: "s", variable: "t" }
    ],
    solveFor: "vf",
    unknownText: "its final velocity"
  },
  {
    id: 23,
    textParts: ["A runaway cart rolling at an initial velocity of ", { variable: "vo" }, " enters a sand arrestor bed that decelerates it at ", { variable: "a" }, " for ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q23v1", value: 18.5, unit: "m/s", variable: "vo" },
      { id: "q23v2", value: -4.2, unit: "m/s²", variable: "a" },
      { id: "q23v3", value: 3, unit: "s", variable: "t" }
    ],
    solveFor: "vf",
    unknownText: "its final velocity"
  },
  {
    id: 24,
    textParts: ["A hydroplane glides with an initial velocity of ", { variable: "vo" }, " and then accelerates at ", { variable: "a" }, " for ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q24v1", value: 14, unit: "m/s", variable: "vo" },
      { id: "q24v2", value: 5.6, unit: "m/s²", variable: "a" },
      { id: "q24v3", value: 3.5, unit: "s", variable: "t" }
    ],
    solveFor: "vf",
    unknownText: "its final velocity"
  },
  {
    id: 25,
    textParts: ["A skydiver falls at an initial velocity of ", { variable: "vo" }, " before opening a parachute that decelerates them at ", { variable: "a" }, " for ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q25v1", value: 52, unit: "m/s", variable: "vo" },
      { id: "q25v2", value: -18, unit: "m/s²", variable: "a" },
      { id: "q25v3", value: 2.5, unit: "s", variable: "t" }
    ],
    solveFor: "vf",
    unknownText: "their final velocity"
  },

  // Solve for vo (Q26 - Q30)
  {
    id: 26,
    textParts: ["A freight truck decelerates at ", { variable: "a" }, " for ", { variable: "t" }, " to come to a complete stop at ", { variable: "vf" }, ". What was ", { isUnknown: true }, "?"],
    values: [
      { id: "q26v1", value: 0, unit: "m/s", variable: "vf" },
      { id: "q26v2", value: -3.8, unit: "m/s²", variable: "a" },
      { id: "q26v3", value: 6.5, unit: "s", variable: "t" }
    ],
    solveFor: "vo",
    unknownText: "its initial velocity"
  },
  {
    id: 27,
    textParts: ["An electric scooter reaches a top velocity of ", { variable: "vf" }, " after accelerating at ", { variable: "a" }, " for ", { variable: "t" }, ". What was ", { isUnknown: true }, "?"],
    values: [
      { id: "q27v1", value: 9.5, unit: "m/s", variable: "vf" },
      { id: "q27v2", value: 1.2, unit: "m/s²", variable: "a" },
      { id: "q27v3", value: 5, unit: "s", variable: "t" }
    ],
    solveFor: "vo",
    unknownText: "its initial velocity"
  },
  {
    id: 28,
    textParts: ["A ski racer reaches the finish gate at a final velocity of ", { variable: "vf" }, " after accelerating down a slope at ", { variable: "a" }, " for ", { variable: "t" }, ". What was ", { isUnknown: true }, "?"],
    values: [
      { id: "q28v1", value: 34, unit: "m/s", variable: "vf" },
      { id: "q28v2", value: 2.8, unit: "m/s²", variable: "a" },
      { id: "q28v3", value: 7, unit: "s", variable: "t" }
    ],
    solveFor: "vo",
    unknownText: "their initial velocity"
  },
  {
    id: 29,
    textParts: ["A ferry boat slows to a docking velocity of ", { variable: "vf" }, " after decelerating at ", { variable: "a" }, " for ", { variable: "t" }, ". What was ", { isUnknown: true }, "?"],
    values: [
      { id: "q29v1", value: 1.5, unit: "m/s", variable: "vf" },
      { id: "q29v2", value: -0.6, unit: "m/s²", variable: "a" },
      { id: "q29v3", value: 10, unit: "s", variable: "t" }
    ],
    solveFor: "vo",
    unknownText: "its initial velocity"
  },
  {
    id: 30,
    textParts: ["A car merges onto the freeway at a final velocity of ", { variable: "vf" }, " after accelerating on the on-ramp at ", { variable: "a" }, " for ", { variable: "t" }, ". What was ", { isUnknown: true }, "?"],
    values: [
      { id: "q30v1", value: 29, unit: "m/s", variable: "vf" },
      { id: "q30v2", value: 2.2, unit: "m/s²", variable: "a" },
      { id: "q30v3", value: 8, unit: "s", variable: "t" }
    ],
    solveFor: "vo",
    unknownText: "its initial velocity"
  },

  // Solve for a (Q31 - Q35)
  {
    id: 31,
    textParts: ["A dragster launches from rest at ", { variable: "vo" }, " and reaches a final velocity of ", { variable: "vf" }, " in ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q31v1", value: 0, unit: "m/s", variable: "vo" },
      { id: "q31v2", value: 48, unit: "m/s", variable: "vf" },
      { id: "q31v3", value: 3.2, unit: "s", variable: "t" }
    ],
    solveFor: "a",
    unknownText: "its acceleration"
  },
  {
    id: 32,
    textParts: ["A train traveling at an initial velocity of ", { variable: "vo" }, " decelerates to a final velocity of ", { variable: "vf" }, " in ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q32v1", value: 65, unit: "m/s", variable: "vo" },
      { id: "q32v2", value: 25, unit: "m/s", variable: "vf" },
      { id: "q32v3", value: 20, unit: "s", variable: "t" }
    ],
    solveFor: "a",
    unknownText: "its acceleration"
  },
  {
    id: 33,
    textParts: ["A downhill skateboarder increases velocity from ", { variable: "vo" }, " to a final velocity of ", { variable: "vf" }, " in ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q33v1", value: 4, unit: "m/s", variable: "vo" },
      { id: "q33v2", value: 16.6, unit: "m/s", variable: "vf" },
      { id: "q33v3", value: 4.5, unit: "s", variable: "t" }
    ],
    solveFor: "a",
    unknownText: "their acceleration"
  },
  {
    id: 34,
    textParts: ["An aircraft carrier catapult launches a jet from rest at ", { variable: "vo" }, " to a takeoff velocity of ", { variable: "vf" }, " in ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q34v1", value: 0, unit: "m/s", variable: "vo" },
      { id: "q34v2", value: 75, unit: "m/s", variable: "vf" },
      { id: "q34v3", value: 2.5, unit: "s", variable: "t" }
    ],
    solveFor: "a",
    unknownText: "its acceleration"
  },
  {
    id: 35,
    textParts: ["A police cruiser accelerates from an initial patrol velocity of ", { variable: "vo" }, " to a pursuit velocity of ", { variable: "vf" }, " in ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q35v1", value: 16, unit: "m/s", variable: "vo" },
      { id: "q35v2", value: 37, unit: "m/s", variable: "vf" },
      { id: "q35v3", value: 6, unit: "s", variable: "t" }
    ],
    solveFor: "a",
    unknownText: "its acceleration"
  },

  // Solve for t (Q36 - Q40)
  {
    id: 36,
    textParts: ["A sports sedan accelerates from rest at ", { variable: "vo" }, " with a constant acceleration of ", { variable: "a" }, " to reach a freeway velocity of ", { variable: "vf" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q36v1", value: 0, unit: "m/s", variable: "vo" },
      { id: "q36v2", value: 27, unit: "m/s", variable: "vf" },
      { id: "q36v3", value: 4.5, unit: "m/s²", variable: "a" }
    ],
    solveFor: "t",
    unknownText: "the elapsed time"
  },
  {
    id: 37,
    textParts: ["A cargo truck cruising at an initial velocity of ", { variable: "vo" }, " decelerates at ", { variable: "a" }, " to come to a stop at ", { variable: "vf" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q37v1", value: 24, unit: "m/s", variable: "vo" },
      { id: "q37v2", value: 0, unit: "m/s", variable: "vf" },
      { id: "q37v3", value: -3.2, unit: "m/s²", variable: "a" }
    ],
    solveFor: "t",
    unknownText: "the time to stop"
  },
  {
    id: 38,
    textParts: ["An elevator ascends from an initial velocity of ", { variable: "vo" }, " with an acceleration of ", { variable: "a" }, " to reach a cruising velocity of ", { variable: "vf" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q38v1", value: 1.5, unit: "m/s", variable: "vo" },
      { id: "q38v2", value: 9.5, unit: "m/s", variable: "vf" },
      { id: "q38v3", value: 1.6, unit: "m/s²", variable: "a" }
    ],
    solveFor: "t",
    unknownText: "the elapsed time"
  },
  {
    id: 39,
    textParts: ["A roller coaster car with an initial velocity of ", { variable: "vo" }, " slows to a docking velocity of ", { variable: "vf" }, " by decelerating at ", { variable: "a" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q39v1", value: 32, unit: "m/s", variable: "vo" },
      { id: "q39v2", value: 4, unit: "m/s", variable: "vf" },
      { id: "q39v3", value: -7, unit: "m/s²", variable: "a" }
    ],
    solveFor: "t",
    unknownText: "the braking time"
  },
  {
    id: 40,
    textParts: ["A planetary rover accelerates from an initial velocity of ", { variable: "vo" }, " to a survey velocity of ", { variable: "vf" }, " with an acceleration of ", { variable: "a" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q40v1", value: 0.2, unit: "m/s", variable: "vo" },
      { id: "q40v2", value: 1.4, unit: "m/s", variable: "vf" },
      { id: "q40v3", value: 0.15, unit: "m/s²", variable: "a" }
    ],
    solveFor: "t",
    unknownText: "the elapsed time"
  },

  // =========================================================================
  // LEVEL 3: Mastery Challenge & Certification (Questions 41 to 50)
  // =========================================================================

  {
    id: 41,
    textParts: ["A hypersonic test sled with an initial velocity of ", { variable: "vo" }, " accelerates at ", { variable: "a" }, " for ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q41v1", value: 85, unit: "m/s", variable: "vo" },
      { id: "q41v2", value: 35, unit: "m/s²", variable: "a" },
      { id: "q41v3", value: 4, unit: "s", variable: "t" }
    ],
    solveFor: "vf",
    unknownText: "its final velocity"
  },
  {
    id: 42,
    textParts: ["A lunar descent module decelerates at ", { variable: "a" }, " for ", { variable: "t" }, " to touch down gently at a final velocity of ", { variable: "vf" }, ". What was ", { isUnknown: true }, "?"],
    values: [
      { id: "q42v1", value: 1, unit: "m/s", variable: "vf" },
      { id: "q42v2", value: -2.8, unit: "m/s²", variable: "a" },
      { id: "q42v3", value: 12, unit: "s", variable: "t" }
    ],
    solveFor: "vo",
    unknownText: "its initial velocity"
  },
  {
    id: 43,
    textParts: ["A race car accelerates from an initial velocity of ", { variable: "vo" }, " to a straightaway velocity of ", { variable: "vf" }, " in ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q43v1", value: 22, unit: "m/s", variable: "vo" },
      { id: "q43v2", value: 76, unit: "m/s", variable: "vf" },
      { id: "q43v3", value: 4.5, unit: "s", variable: "t" }
    ],
    solveFor: "a",
    unknownText: "its acceleration"
  },
  {
    id: 44,
    textParts: ["A locomotive rolling at an initial velocity of ", { variable: "vo" }, " decelerates at ", { variable: "a" }, " until coming to a stop at ", { variable: "vf" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q44v1", value: 36, unit: "m/s", variable: "vo" },
      { id: "q44v2", value: 0, unit: "m/s", variable: "vf" },
      { id: "q44v3", value: -4.5, unit: "m/s²", variable: "a" }
    ],
    solveFor: "t",
    unknownText: "the time to stop"
  },
  {
    id: 45,
    textParts: ["An aircraft accelerates from rest at ", { variable: "vo" }, " with a constant acceleration of ", { variable: "a" }, " for ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q45v1", value: 0, unit: "m/s", variable: "vo" },
      { id: "q45v2", value: 4.8, unit: "m/s²", variable: "a" },
      { id: "q45v3", value: 15, unit: "s", variable: "t" }
    ],
    solveFor: "vf",
    unknownText: "its final takeoff velocity"
  },
  {
    id: 46,
    textParts: ["A downhill mountain biker reaches the bottom of a trail at a final velocity of ", { variable: "vf" }, " after accelerating at ", { variable: "a" }, " for ", { variable: "t" }, ". What was ", { isUnknown: true }, "?"],
    values: [
      { id: "q46v1", value: 18.2, unit: "m/s", variable: "vf" },
      { id: "q46v2", value: 2.4, unit: "m/s²", variable: "a" },
      { id: "q46v3", value: 3.5, unit: "s", variable: "t" }
    ],
    solveFor: "vo",
    unknownText: "their initial velocity"
  },
  {
    id: 47,
    textParts: ["A maglev vehicle accelerates uniformly from an initial velocity of ", { variable: "vo" }, " to a cruising velocity of ", { variable: "vf" }, " in ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q47v1", value: 15, unit: "m/s", variable: "vo" },
      { id: "q47v2", value: 87, unit: "m/s", variable: "vf" },
      { id: "q47v3", value: 18, unit: "s", variable: "t" }
    ],
    solveFor: "a",
    unknownText: "its acceleration"
  },
  {
    id: 48,
    textParts: ["A stunt motorcycle traveling at an initial velocity of ", { variable: "vo" }, " decelerates on a landing ramp at ", { variable: "a" }, " to reach a final velocity of ", { variable: "vf" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q48v1", value: 28, unit: "m/s", variable: "vo" },
      { id: "q48v2", value: 7, unit: "m/s", variable: "vf" },
      { id: "q48v3", value: -6, unit: "m/s²", variable: "a" }
    ],
    solveFor: "t",
    unknownText: "the elapsed time"
  },
  {
    id: 49,
    textParts: ["A space capsule enters the atmosphere at an initial velocity of ", { variable: "vo" }, " and decelerates at ", { variable: "a" }, " for ", { variable: "t" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q49v1", value: 1200, unit: "m/s", variable: "vo" },
      { id: "q49v2", value: -28, unit: "m/s²", variable: "a" },
      { id: "q49v3", value: 25, unit: "s", variable: "t" }
    ],
    solveFor: "vf",
    unknownText: "its final velocity"
  },
  {
    id: 50,
    textParts: ["A jet dragster with an initial velocity of ", { variable: "vo" }, " slows to a final velocity of ", { variable: "vf" }, " by decelerating at ", { variable: "a" }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q50v1", value: 110, unit: "m/s", variable: "vo" },
      { id: "q50v2", value: 10, unit: "m/s", variable: "vf" },
      { id: "q50v3", value: -20, unit: "m/s²", variable: "a" }
    ],
    solveFor: "t",
    unknownText: "the braking time"
  }
];

// Verification of Question Bank Integrity
console.log(`Loaded ${QUESTIONS.length} questions.`);
let counts = { vf: 0, vo: 0, a: 0, t: 0 };
QUESTIONS.forEach((q) => {
  counts[q.solveFor]++;
  if (q.values.length !== 3) {
    throw new Error(`Question ${q.id} has invalid values count: ${q.values.length}`);
  }
  let vfVal = null, voVal = null, aVal = null, tVal = null;
  q.values.forEach(v => {
    if (v.variable === 'vf') vfVal = v.value;
    if (v.variable === 'vo') voVal = v.value;
    if (v.variable === 'a') aVal = v.value;
    if (v.variable === 't') tVal = v.value;
  });
  let computed = 0;
  if (q.solveFor === 'vf') computed = voVal + (aVal * tVal);
  if (q.solveFor === 'vo') computed = vfVal - (aVal * tVal);
  if (q.solveFor === 'a') computed = (vfVal - voVal) / tVal;
  if (q.solveFor === 't') computed = (vfVal - voVal) / aVal;
  if (isNaN(computed) || !isFinite(computed)) {
    throw new Error(`Question ${q.id} math failed: computed ${computed}`);
  }
});
console.log('Solve-for distribution:', counts);

module.exports = { QUESTIONS };
