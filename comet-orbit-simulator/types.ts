
import type { Vector3 } from 'three';

export interface PlanetData {
  name: string;
  color: string;
  radius: number; // in km
  orbitRadius: number; // in AU
  orbitalPeriod: number; // in Earth days
  mass: number; // in Solar Masses
}

export interface CometState {
    position: Vector3;
    velocity: Vector3;
    trail: Vector3[];
}

export interface CometInstance {
    id: number;
    initialState: {
        position: Vector3;
        velocity: Vector3;
    }
}

export interface SimulationControls {
    isPlaying: boolean;
    simulationSpeed: number;
    showOrbits: boolean;
    showLabels: boolean;
    showForces: boolean;
    cometEccentricity: number;
    resetKey: number;
}

export interface FamousCometData {
    name: string;
    q: number; // Perihelion distance (AU)
    e: number; // Eccentricity
    i: number; // Inclination (degrees)
    omega: number; // Argument of Perihelion (degrees)
    node: number; // Longitude of Ascending Node (degrees)
}