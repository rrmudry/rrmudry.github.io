import { GRAVITY } from "../constants";

export const generatePhysicsExplanation = async (
  ke: number,
  pe: number,
  te: number,
  height: number,
  velocity: number,
  mass: number
): Promise<string> => {
  // Calculate energy ratios
  const peRatio = te > 0 ? pe / te : 0;
  const keRatio = te > 0 ? ke / te : 0;

  // Determine the dominant energy type
  let explanation = "";

  if (peRatio > 0.8) {
    // High potential energy - near the top
    explanation = `At ${height.toFixed(1)} meters high, the coaster has mostly potential energy (${pe.toFixed(0)} J). `;
    explanation += `The coaster is moving slowly at ${velocity.toFixed(1)} m/s, storing energy as height. `;
    explanation += `As it descends, this potential energy will convert to kinetic energy, speeding up the ride!`;
  } else if (keRatio > 0.8) {
    // High kinetic energy - near the bottom
    explanation = `Racing at ${velocity.toFixed(1)} m/s near the bottom, the coaster has mostly kinetic energy (${ke.toFixed(0)} J). `;
    explanation += `At only ${height.toFixed(1)} meters high, most of the potential energy has been converted to speed. `;
    explanation += `Watch how the energy transforms back to potential as the coaster climbs the next hill!`;
  } else {
    // Mixed energy state - middle of transition
    explanation = `The coaster is in the middle of an energy transformation! `;
    explanation += `At ${height.toFixed(1)} m and ${velocity.toFixed(1)} m/s, it has ${pe.toFixed(0)} J of potential energy and ${ke.toFixed(0)} J of kinetic energy. `;
    explanation += `Notice how the total energy (${te.toFixed(0)} J) stays constant as energy converts between height and speed.`;
  }

  return explanation;
};

export const generateQuizQuestion = async (
  maxHeight: number,
  mass: number
): Promise<{ question: string, options: string[], answer: number, explanation: string } | null> => {
  // Calculate the maximum potential energy
  const maxPE = mass * GRAVITY * maxHeight;

  // Create a pool of question templates
  const questionTemplates = [
    {
      question: `If the coaster has a mass of ${mass} kg and reaches a maximum height of ${maxHeight.toFixed(1)} m, what is its maximum potential energy?`,
      correctAnswer: `${maxPE.toFixed(0)} J`,
      wrongAnswers: [
        `${(maxPE * 0.5).toFixed(0)} J`,
        `${(maxPE * 1.5).toFixed(0)} J`,
        `${(maxPE * 2).toFixed(0)} J`
      ],
      explanation: `Potential Energy = mass × gravity × height = ${mass} kg × ${GRAVITY} m/s² × ${maxHeight.toFixed(1)} m = ${maxPE.toFixed(0)} J`
    },
    {
      question: `At the bottom of the track (height = 0), what will be the coaster's kinetic energy if it started from ${maxHeight.toFixed(1)} m?`,
      correctAnswer: `${maxPE.toFixed(0)} J`,
      wrongAnswers: [
        `0 J`,
        `${(maxPE * 0.5).toFixed(0)} J`,
        `${(maxPE * 2).toFixed(0)} J`
      ],
      explanation: `Due to conservation of energy, all potential energy converts to kinetic energy at the bottom. KE = ${maxPE.toFixed(0)} J`
    },
    {
      question: `What is the coaster's approximate maximum velocity at the bottom of the track?`,
      correctAnswer: `${Math.sqrt(2 * GRAVITY * maxHeight).toFixed(1)} m/s`,
      wrongAnswers: [
        `${(Math.sqrt(2 * GRAVITY * maxHeight) * 0.5).toFixed(1)} m/s`,
        `${(Math.sqrt(2 * GRAVITY * maxHeight) * 1.5).toFixed(1)} m/s`,
        `${(GRAVITY * maxHeight).toFixed(1)} m/s`
      ],
      explanation: `Using v = √(2gh), we get v = √(2 × ${GRAVITY} × ${maxHeight.toFixed(1)}) = ${Math.sqrt(2 * GRAVITY * maxHeight).toFixed(1)} m/s`
    },
    {
      question: `If the coaster is at half the maximum height (${(maxHeight / 2).toFixed(1)} m) and moving, what is its potential energy?`,
      correctAnswer: `${(maxPE / 2).toFixed(0)} J`,
      wrongAnswers: [
        `${maxPE.toFixed(0)} J`,
        `${(maxPE / 4).toFixed(0)} J`,
        `0 J`
      ],
      explanation: `PE = mgh = ${mass} × ${GRAVITY} × ${(maxHeight / 2).toFixed(1)} = ${(maxPE / 2).toFixed(0)} J (half the maximum PE)`
    }
  ];

  // Randomly select a question
  const template = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];

  // Create options array with correct answer and wrong answers
  const allOptions = [template.correctAnswer, ...template.wrongAnswers];

  // Shuffle options
  const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);

  // Find the index of the correct answer after shuffling
  const correctIndex = shuffledOptions.indexOf(template.correctAnswer);

  return {
    question: template.question,
    options: shuffledOptions,
    answer: correctIndex,
    explanation: template.explanation
  };
}
