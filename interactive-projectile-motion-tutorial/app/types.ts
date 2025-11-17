
export interface SimulationData {
  time: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface SummaryData {
  maxHeight: number;
  range: number;
  flightTime: number;
}

export type SimulationState = 'idle' | 'running' | 'finished';

export interface Point {
  x: number;
  y: number;
}

export interface PathData {
  points: Point[];
  initialSpeed: number;
  launchAngle: number;
  range: number;
}

export interface ProjectedMetrics {
  range: number;
  maxHeight: number;
}

export interface ViewState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}