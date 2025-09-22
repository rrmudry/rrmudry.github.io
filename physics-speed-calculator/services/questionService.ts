import data from '../data/questions.json';
import { Question, TextPart, Value, Variable } from '../types';

type RawVariable = 'v' | 'x' | 't';

type RawTextPart = string | { variable: RawVariable } | { isUnknown: true };

type RawValue = {
  id: string;
  value: number;
  unit: string;
  variable: RawVariable;
};

type RawQuestion = {
  id: number;
  textParts: RawTextPart[];
  values: RawValue[];
  solveFor: RawVariable;
  unknownText: string;
};

type QuestionDataset = {
  questions: RawQuestion[];
};

const dataset = data as QuestionDataset;

const toVariable = (raw: RawVariable): Variable => {
  switch (raw) {
    case 'v':
      return Variable.Velocity;
    case 'x':
      return Variable.Distance;
    case 't':
      return Variable.Time;
    default:
      throw new Error(`Unknown variable token: ${raw}`);
  }
};

const mapTextPart = (part: RawTextPart): TextPart => {
  if (typeof part === 'string') {
    return part;
  }
  if ('isUnknown' in part) {
    return { isUnknown: true };
  }
  return { variable: toVariable(part.variable) };
};

const mapValue = (value: RawValue): Value => ({
  ...value,
  variable: toVariable(value.variable),
});

const mapQuestion = (raw: RawQuestion): Question => ({
  id: raw.id,
  textParts: raw.textParts.map(mapTextPart),
  values: raw.values.map(mapValue),
  solveFor: toVariable(raw.solveFor),
  unknownText: raw.unknownText,
});

const ALL_QUESTIONS: Question[] = dataset.questions.map(mapQuestion);

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export interface QuestionOptions {
  limit?: number;
  randomize?: boolean;
}

export const getQuestions = (options: QuestionOptions = {}): Question[] => {
  const { limit = ALL_QUESTIONS.length, randomize = true } = options;
  const source = randomize ? shuffle(ALL_QUESTIONS) : [...ALL_QUESTIONS];
  return source.slice(0, Math.min(limit, source.length));
};

export const getQuestionBankSize = (): number => ALL_QUESTIONS.length;

export const drawRandomQuestions = (
  count: number,
  excludeIds: Set<number> = new Set(),
): Question[] => {
  const available = ALL_QUESTIONS.filter(question => !excludeIds.has(question.id));
  const pool = available.length >= count ? available : ALL_QUESTIONS;
  return shuffle(pool).slice(0, Math.min(count, pool.length));
};
