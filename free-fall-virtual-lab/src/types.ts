
export type Location = 'earth' | 'moon';

export interface SimulationParams {
  height: number;
  mass: number;
  radius: number;
  airDensity: number;
  gravity: number;
}

export interface SimulationState {
  time: number;
  position: number; // y-position from the top
  velocity: number;
}

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'finished';