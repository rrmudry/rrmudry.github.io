export interface Point {
  x: number;
  y: number;
  id: string;
}

export interface SimulationState {
  isPlaying: boolean;
  time: number;
  cartPositionT: number; // 0 to 1 along the curve
  direction: number; // 1 for forward, -1 for backward
  velocity: number; // m/s
  mass: number; // kg
  totalEnergy: number; // Joules
  kineticEnergy: number; // Joules
  potentialEnergy: number; // Joules
  height: number; // meters
  distance: number; // pixels along track
}

export interface TrackConfig {
  points: Point[];
  groundLevel: number; // Y coordinate of the "ground"
}