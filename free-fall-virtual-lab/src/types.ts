export type PlanetLocation = 'earth' | 'moon' | 'mars' | 'jupiter' | 'custom';

export type AtmosphereMode = 'vacuum' | 'earth-sea-level' | 'high-altitude' | 'custom';

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'finished';

export type ActiveGraphTab = 'all' | 'position' | 'velocity' | 'acceleration';

export interface DropObjectConfig {
  id: string;
  name: string;
  icon: string;
  mass: number;            // in kg (e.g. 5.0 for bowling ball, 0.005 for feather)
  radius: number;          // in meters (e.g. 0.108 for bowling ball, 0.05 for feather)
  dragCoefficient: number; // dimensionless (0.47 for sphere, 1.2 for feather, 1.5 for parachute/filter)
  color: string;           // theme accent hex / class
  accentBg: string;
}

export interface EnvironmentConfig {
  height: number;          // in meters (5m to 200m)
  gravity: number;         // in m/s^2 (e.g. 9.8 for Earth, 1.6 for Moon)
  planet: PlanetLocation;
  airDensity: number;      // in kg/m^3 (0 for vacuum, 1.225 for Earth sea level)
  atmosphereMode: AtmosphereMode;
  playbackSpeed: number;   // 1, 0.5, 0.25, 0.1
}

export interface PhysicsState {
  time: number;            // seconds elapsed
  position: number;        // y-distance fallen from top in meters
  velocity: number;        // downward velocity in m/s
  acceleration: number;    // current acceleration in m/s^2
  forceGravity: number;    // Fg = m * g in Newtons
  forceDrag: number;       // Fdrag = 0.5 * rho * v^2 * Cd * A in Newtons
  forceNet: number;        // Fnet = Fg - Fdrag in Newtons
  isFinished: boolean;     // reached ground
  impactTime?: number;     // time at ground contact in seconds
  impactVelocity?: number; // velocity at ground contact in m/s
}

export interface StrobePoint {
  time: number;
  position: number;
  velocity: number;
  acceleration: number;
}

export interface ExperimentTrial {
  id: string;
  timestamp: string;
  height: number;
  gravity: number;
  airDensity: number;
  obj1Name: string;
  obj1Mass: number;
  obj1Radius: number;
  obj1ImpactTime: number;
  obj1ImpactVel: number;
  obj1TerminalVel: number;
  obj2Name: string;
  obj2Mass: number;
  obj2Radius: number;
  obj2ImpactTime: number;
  obj2ImpactVel: number;
  obj2TerminalVel: number;
  timeDelta: number;
}

export interface GuidedChallenge {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  obj1PresetId: string;
  obj2PresetId: string;
  height: number;
  atmosphereMode: AtmosphereMode;
  planet: PlanetLocation;
  keyQuestion: string;
  explanation: string;
}