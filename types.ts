export enum Variable {
  Velocity = 'v',
  Distance = 'x',
  Time = 't',
}

export interface Value {
  id: string;
  value: number;
  unit: string;
  variable: Variable;
}

export type TextPart = string | { variable: Variable } | { isUnknown: true };

export interface Question {
  id: number;
  textParts: TextPart[];
  values: Value[];
  solveFor: Variable;
  unknownText: string;
}
