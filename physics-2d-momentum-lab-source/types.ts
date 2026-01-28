
export interface TrialData {
  massA: string;
  velA: string;
  massB: string;
  velB: string;
}

export interface LabState {
  studentName: string;
  studentId: string;
  classPeriod: string;
  videoAnswers: {
    q1: string;
    q2: string;
    q3: string;
  };
  trial1: TrialData;
  trial2: TrialData;
  realWorldAnswers: {
    q1: string;
    q2: string;
  };
  conceptualAnswers: {
    q1: string;
    q2: string;
  };
}
