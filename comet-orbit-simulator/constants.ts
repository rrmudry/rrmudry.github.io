
import type { PlanetData, FamousCometData } from './types';
import * as THREE from 'three';

// SCENE SCALE
export const AU_TO_SCENE_SCALE = 20; // 1 AU = 20 units in the scene
export const PLANET_RADIUS_SCALE = 0.3; // Exaggerate planet sizes
export const SUN_RADIUS_SCALE = 0.05;

// PHYSICAL CONSTANTS (scaled for simulation: AU, Solar Masses, Days)
export const G = 0.0002959122082855911; // Gravitational constant in AU^3 / (Solar Mass * day^2)
export const SUN_MASS = 1; // In solar masses

// COMET PARAMETERS
export const COMET_INITIAL_STATE = {
    position: new THREE.Vector3(5 * AU_TO_SCENE_SCALE, 0, 0), // Start at 5 AU (approx. Jupiter's orbit)
    velocity: new THREE.Vector3(0, 0, -0.09), // Initial velocity in scene units/day for an elliptical orbit
};
export const COMET_NUCLEUS_SIZE = 0.5;
export const COMET_TRAIL_LENGTH = 200;
export const NON_GRAVITATIONAL_FORCE_STRENGTH = 0.000005; // Strength of sublimation jets
export const SUBLIMATION_START_DISTANCE_AU = 3.5;

// PLANET DATA
export const PLANETS_DATA: PlanetData[] = [
    { name: 'Mercury', color: '#BEBEBE', radius: 2439.7, orbitRadius: 0.387, orbitalPeriod: 88.0, mass: 1.65e-7 },
    { name: 'Venus', color: '#DEA25F', radius: 6051.8, orbitRadius: 0.723, orbitalPeriod: 224.7, mass: 2.45e-6 },
    { name: 'Earth', color: '#5F85B5', radius: 6371, orbitRadius: 1, orbitalPeriod: 365.2, mass: 3.003e-6 },
    { name: 'Mars', color: '#C1440E', radius: 3389.5, orbitRadius: 1.52, orbitalPeriod: 687.0, mass: 3.2e-7 },
    { name: 'Jupiter', color: '#D8C8B8', radius: 69911, orbitRadius: 5.20, orbitalPeriod: 4331, mass: 9.543e-4 },
    { name: 'Saturn', color: '#E0C068', radius: 58232, orbitRadius: 9.58, orbitalPeriod: 10747, mass: 2.857e-4 },
    { name: 'Uranus', color: '#C0D8E0', radius: 25362, orbitRadius: 19.22, orbitalPeriod: 30589, mass: 4.36e-5 },
    { name: 'Neptune', color: '#5B5DDF', radius: 24622, orbitRadius: 30.05, orbitalPeriod: 59800, mass: 5.15e-5 },
];

// DATA FOR FAMOUS COMETS
// Source: JPL Small-Body Database
export const FAMOUS_COMETS_DATA: FamousCometData[] = [
    {
        name: '1P/Halley',
        q: 0.586,       // Perihelion distance in AU
        e: 0.967,       // Eccentricity
        i: 162.26,      // Inclination in degrees
        omega: 111.33,  // Argument of Perihelion in degrees
        node: 58.42,    // Longitude of Ascending Node in degrees
    },
    {
        name: 'C/1995 O1 (Hale-Bopp)',
        q: 0.914,
        e: 0.995,
        i: 89.4,
        omega: 130.6,
        node: 282.5,
    },
    {
        name: '67P/Churyumov–Gerasimenko',
        q: 1.243,
        e: 0.641,
        i: 7.04,
        omega: 12.78,
        node: 50.20,
    }
];