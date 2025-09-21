import { Question, Variable } from '../types';

export const questions: Question[] = [
  {
    id: 1,
    textParts: ["A train travels ", { "variable": Variable.Distance }, " in ", { "variable": Variable.Time }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q1v1", value: 250, unit: "km", variable: Variable.Distance },
      { id: "q1v2", value: 5, unit: "h", variable: Variable.Time }
    ],
    solveFor: Variable.Velocity,
    unknownText: "its average speed",
  },
  {
    id: 2,
    textParts: ["A cyclist maintains a constant speed of ", { "variable": Variable.Velocity }, " for ", { "variable": Variable.Time }, ". ", { isUnknown: true }, "?"],
    values: [
      { id: "q2v1", value: 12, unit: "m/s", variable: Variable.Velocity },
      { id: "q2v2", value: 60, unit: "s", variable: Variable.Time }
    ],
    solveFor: Variable.Distance,
    unknownText: "How far did they travel",
  },
  {
    id: 3,
    textParts: ["A cheetah covers a distance of ", { "variable": Variable.Distance }, " while running at a blistering ", { "variable": Variable.Velocity }, ". ", { isUnknown: true }, "?"],
    values: [
      { id: "q3v1", value: 300, unit: "m", variable: Variable.Distance },
      { id: "q3v2", value: 30, unit: "m/s", variable: Variable.Velocity }
    ],
    solveFor: Variable.Time,
    unknownText: "How long did it take",
  },
  {
    id: 4,
    textParts: ["Sound travels at about ", { "variable": Variable.Velocity }, ". If you see a lightning strike and hear the thunder ", { "variable": Variable.Time }, " later, ", { isUnknown: true }, "?"],
    values: [
      { id: "q4v1", value: 343, unit: "m/s", variable: Variable.Velocity },
      { id: "q4v2", value: 3, unit: "s", variable: Variable.Time }
    ],
    solveFor: Variable.Distance,
    unknownText: "how far away was the strike",
  },
  {
    id: 5,
    textParts: ["A satellite orbits Earth covering a distance of ", { "variable": Variable.Distance }, " in ", { "variable": Variable.Time }, ". What is ", { isUnknown: true }, "?"],
    values: [
      { id: "q5v1", value: 42000, unit: "km", variable: Variable.Distance },
      { id: "q5v2", value: 1.5, unit: "h", variable: Variable.Time }
    ],
    solveFor: Variable.Velocity,
    unknownText: "its orbital speed",
  },
  {
    id: 6,
    textParts: ["A car needs to travel ", { "variable": Variable.Distance }, ". If its average speed is ", { "variable": Variable.Velocity }, ", ", { isUnknown: true }, "?"],
    values: [
        { id: "q6v1", value: 450, unit: "miles", variable: Variable.Distance },
        { id: "q6v2", value: 60, unit: "mph", variable: Variable.Velocity }
    ],
    solveFor: Variable.Time,
    unknownText: "how much time will the journey take",
  }
];

export const getQuestions = (): Question[] => {
  return questions;
};
