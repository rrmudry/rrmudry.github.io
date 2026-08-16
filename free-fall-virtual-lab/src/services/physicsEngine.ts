import { DropObjectConfig, EnvironmentConfig, PhysicsState } from '../types';

/**
 * Calculates the cross-sectional frontal area of an object (A = pi * r^2) in m^2
 */
export function getCrossSectionalArea(radius: number): number {
  return Math.PI * radius * radius;
}

/**
 * Calculates theoretical terminal velocity: vt = sqrt((2 * m * g) / (rho * A * Cd))
 * Returns Infinity if air density (rho) is 0 (vacuum).
 */
export function calculateTerminalVelocity(obj: DropObjectConfig, env: EnvironmentConfig): number {
  if (env.airDensity <= 0) {
    return Infinity;
  }
  const area = getCrossSectionalArea(obj.radius);
  const denominator = env.airDensity * area * obj.dragCoefficient;
  if (denominator <= 0) return Infinity;
  const numerator = 2 * obj.mass * env.gravity;
  return Math.sqrt(numerator / denominator);
}

/**
 * Calculates the theoretical free-fall time in a vacuum: t = sqrt((2 * h) / g)
 */
export function calculateVacuumImpactTime(height: number, gravity: number): number {
  if (gravity <= 0 || height <= 0) return 0;
  return Math.sqrt((2 * height) / gravity);
}

/**
 * Calculates instantaneous forces and acceleration for an object at a given downward velocity
 */
export function calculateInstantaneousForces(
  velocity: number,
  obj: DropObjectConfig,
  env: EnvironmentConfig
): {
  forceGravity: number;
  forceDrag: number;
  forceNet: number;
  acceleration: number;
} {
  const forceGravity = obj.mass * env.gravity; // Fg = m * g (Newtons)
  
  const area = getCrossSectionalArea(obj.radius);
  // Fdrag = 0.5 * rho * v^2 * Cd * A
  const forceDrag = 0.5 * env.airDensity * (velocity * velocity) * obj.dragCoefficient * area;
  
  // Net force downward (clamped so drag never exceeds gravity to push object backwards during pure drop)
  const clampedDrag = Math.min(forceDrag, forceGravity * 1.5);
  const forceNet = Math.max(0, forceGravity - forceDrag);
  
  // a = Fnet / m
  const acceleration = forceNet / obj.mass;

  return {
    forceGravity,
    forceDrag,
    forceNet,
    acceleration
  };
}

/**
 * Steps the physics simulation forward by deltaTime seconds using sub-stepped numerical integration
 */
export function stepObjectPhysics(
  currentState: PhysicsState,
  obj: DropObjectConfig,
  env: EnvironmentConfig,
  deltaTime: number
): PhysicsState {
  if (currentState.isFinished) {
    return currentState;
  }

  // Use 4 sub-steps for robust numerical stability and high precision
  const SUB_STEPS = 4;
  const dt = deltaTime / SUB_STEPS;
  let pos = currentState.position;
  let vel = currentState.velocity;
  let acc = currentState.acceleration;
  let fg = currentState.forceGravity;
  let fd = currentState.forceDrag;
  let fnet = currentState.forceNet;

  for (let step = 0; step < SUB_STEPS; step++) {
    if (pos >= env.height) {
      break;
    }

    const forces = calculateInstantaneousForces(vel, obj, env);
    fg = forces.forceGravity;
    fd = forces.forceDrag;
    fnet = forces.forceNet;
    acc = forces.acceleration;

    vel += acc * dt;
    pos += vel * dt;
  }

  const newTime = currentState.time + deltaTime;
  const isFinished = pos >= env.height;

  if (isFinished) {
    pos = env.height;
    return {
      time: newTime,
      position: env.height,
      velocity: vel,
      acceleration: 0,
      forceGravity: fg,
      forceDrag: fd,
      forceNet: 0,
      isFinished: true,
      impactTime: currentState.impactTime ?? newTime,
      impactVelocity: currentState.impactVelocity ?? vel
    };
  }

  return {
    time: newTime,
    position: pos,
    velocity: vel,
    acceleration: acc,
    forceGravity: fg,
    forceDrag: fd,
    forceNet: fnet,
    isFinished: false
  };
}
