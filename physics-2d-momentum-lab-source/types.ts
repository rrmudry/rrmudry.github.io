export interface Trial2DData {
  m1: string;
  vx1: string;
  vy1: string;
  m2: string;
  vx2: string;
  vy2: string;
  m3: string;
  vx3: string;
  vy3: string;
}

export interface LabState {
  studentName: string;
  studentId: string;
  classPeriod: string;
  videoAnswers: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    q5: string;
  };
  trial2D: Trial2DData;
  conceptualAnswers: {
    q1: string;
    q2: string;
  };
}
