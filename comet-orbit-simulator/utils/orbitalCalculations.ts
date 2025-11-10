
import * as THREE from 'three';
import { G, SUN_MASS } from '../constants';
import type { FamousCometData } from '../types';

/**
 * Converts classical orbital elements of a comet into state vectors (position and velocity).
 * This function is robust for all eccentricities (e < 1, e = 1, e > 1).
 * @param cometData - The orbital elements of the famous comet.
 * @returns An object containing the initial 3D position and velocity vectors in AU and AU/day.
 */
export function convertOrbitalElementsToStateVectors(cometData: FamousCometData): { position: THREE.Vector3, velocity: THREE.Vector3 } {
    // 1. Convert angles from degrees to radians
    const i = THREE.MathUtils.degToRad(cometData.i); // Inclination
    const omega = THREE.MathUtils.degToRad(cometData.omega); // Argument of Perihelion
    const node = THREE.MathUtils.degToRad(cometData.node); // Longitude of Ascending Node

    // 2. Calculate state vectors in the orbital plane (perifocal frame)
    const e = cometData.e;
    const q = cometData.q;
    const p = q * (1 + e); // Semi-latus rectum in AU

    let trueAnomaly: number; // The angle of the comet in its orbit from periapsis

    if (e < 1) {
        // For elliptical orbits, we want to start at the farthest point (apoapsis)
        // to see the full journey into the inner solar system.
        trueAnomaly = Math.PI; // 180 degrees
    } else {
        // For parabolic (e=1) and hyperbolic (e>1) orbits, apoapsis is at infinity.
        // We must start them at a large but finite distance. Let's choose a distance
        // that is well outside Neptune's orbit, e.g., 50 AU.
        const startDistanceAU = 50.0;
        
        // Using the orbit equation r = p / (1 + e*cos(theta))
        // We can solve for cos(theta) = (p/r - 1) / e
        let cosTrueAnomaly = (p / startDistanceAU - 1) / e;
        
        // Clamp the value to the valid range [-1, 1] to prevent Math.acos from returning NaN
        // due to floating-point inaccuracies.
        cosTrueAnomaly = Math.max(-1, Math.min(1, cosTrueAnomaly));
        trueAnomaly = Math.acos(cosTrueAnomaly);
    }

    // 3. Define position and velocity using general state vector equations in the perifocal frame
    // Distance from the sun 'r' at the calculated true anomaly
    const r = p / (1 + e * Math.cos(trueAnomaly));

    // Position vector in the orbital plane (z=0)
    const posOrbital = new THREE.Vector3(
        r * Math.cos(trueAnomaly),
        r * Math.sin(trueAnomaly),
        0
    );

    // Velocity vector in the orbital plane (z=0)
    const speedFactor = Math.sqrt(G * SUN_MASS / p);
    const velOrbital = new THREE.Vector3(
        -speedFactor * Math.sin(trueAnomaly),
        speedFactor * (e + Math.cos(trueAnomaly)),
        0
    );
    
    // 4. Create rotation matrix to transform from orbital plane (perifocal) to ecliptic coordinates
    // This is done by applying three rotations in order: R = R_z(node) * R_x(i) * R_z(omega)
    const rotMatrix = new THREE.Matrix4();
    const rotZ_node = new THREE.Matrix4().makeRotationZ(node);
    const rotX_i = new THREE.Matrix4().makeRotationX(i);
    const rotZ_omega = new THREE.Matrix4().makeRotationZ(omega);

    rotMatrix.multiply(rotZ_node).multiply(rotX_i).multiply(rotZ_omega);
    
    // 5. Apply the rotation to the orbital vectors to get the final 3D state vectors
    const position = posOrbital.clone().applyMatrix4(rotMatrix);
    const velocity = velOrbital.clone().applyMatrix4(rotMatrix);

    return { position, velocity };
}
