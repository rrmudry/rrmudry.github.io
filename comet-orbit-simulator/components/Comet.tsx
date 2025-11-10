
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import {
    G, SUN_MASS, COMET_NUCLEUS_SIZE, AU_TO_SCENE_SCALE, 
    NON_GRAVITATIONAL_FORCE_STRENGTH, SUBLIMATION_START_DISTANCE_AU, COMET_TRAIL_LENGTH
} from '../constants';
import type { CometState } from '../types';

interface CometProps {
    isPlaying: boolean;
    simulationSpeed: number;
    showForces: boolean;
    initialState: {
        position: THREE.Vector3;
        velocity: THREE.Vector3;
    },
    planetsGroupRef: React.RefObject<THREE.Group>;
}

const SOFTENING_FACTOR = 1e-5; // Prevents division by zero for numerical stability

const Comet: React.FC<CometProps> = ({ isPlaying, simulationSpeed, showForces, initialState, planetsGroupRef }) => {
    const cometGroupRef = useRef<THREE.Group>(null!);
    const ionTailRef = useRef<THREE.Line>(null!);
    const dustTailRef = useRef<THREE.Line>(null!);
    const comaRef = useRef<THREE.Points>(null!);
    const comaMaterialRef = useRef<THREE.PointsMaterial>(null!);
    const gravVecRef = useRef<THREE.ArrowHelper>(null!);
    const nonGravVecRef = useRef<THREE.ArrowHelper>(null!);
    const velocityVecRef = useRef<THREE.ArrowHelper>(null!);
    const infoTextRef = useRef<any>(null!);

    const cometState = useRef<CometState>({
        position: initialState.position.clone(),
        velocity: initialState.velocity.clone(),
        trail: [],
    });

    const dustTailCurve = useMemo(() => new THREE.CatmullRomCurve3([]), []);

    const ionTail = useMemo(() => new THREE.Line(
        new THREE.BufferGeometry(), 
        new THREE.LineBasicMaterial({ color: '#87CEEB', transparent: true, blending: THREE.AdditiveBlending, linewidth: 2 })
    ), []);
    
    const dustTail = useMemo(() => new THREE.Line(
        new THREE.BufferGeometry(), 
        new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, blending: THREE.AdditiveBlending, linewidth: 4 })
    ), []);

    const comaParticles = useMemo(() => {
        const numParticles = 8000;
        const particles = new Float32Array(numParticles * 3);
        const baseRadius = COMET_NUCLEUS_SIZE * 0.8;

        for (let i = 0; i < numParticles; i++) {
            const i3 = i * 3;
            const r = baseRadius * (1 - Math.pow(Math.random(), 0.5));
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            
            particles[i3] = r * Math.sin(phi) * Math.cos(theta);
            particles[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            particles[i3 + 2] = r * Math.cos(phi);
        }
        return particles;
    }, []);


    useFrame((_, delta) => {
        if (!isPlaying || !cometGroupRef.current || !ionTailRef.current || !dustTailRef.current || !comaRef.current || !comaMaterialRef.current) return;

        // Use the ref directly to avoid stale closures
        const state = cometState.current;

        // Sub-stepping for numerical stability at high simulation speeds
        const timeToSimulate = delta * simulationSpeed;
        const maxDt = 0.5; // Max time step for a single physics update
        const numSubSteps = Math.ceil(timeToSimulate / maxDt) || 1;
        const dt = timeToSimulate / numSubSteps;

        let lastSublimationFactor = 0;
        let lastTotalAccelScene = new THREE.Vector3();
        let lastNonGravAccelScene = new THREE.Vector3();

        for (let i = 0; i < numSubSteps; i++) {
            const totalAccelAU = new THREE.Vector3(); // All forces accumulated here, in AU/day^2

            // --- Sun's Gravity & Sublimation Force ---
            const distToSunVec = state.position.clone();
            const distToSun = distToSunVec.length();
            let nonGravAccel = new THREE.Vector3(); // in AU/day^2

            if (distToSun > 1e-6) { // Avoid singularity and normalize(0)
                const toSunDir = distToSunVec.clone().normalize().negate();
                
                // Sun's Gravity
                const distToSunSqAU = ((distToSun * distToSun) / (AU_TO_SCENE_SCALE * AU_TO_SCENE_SCALE)) + SOFTENING_FACTOR;
                const gravMagnitude = G * SUN_MASS / distToSunSqAU;
                totalAccelAU.add(toSunDir.clone().multiplyScalar(gravMagnitude));

                // Non-gravitational forces (sublimation)
                const distInAU = distToSun / AU_TO_SCENE_SCALE;
                if (distInAU < SUBLIMATION_START_DISTANCE_AU) {
                    lastSublimationFactor = Math.max(0, 1 - (distInAU / SUBLIMATION_START_DISTANCE_AU));
                    const fromSunDir = toSunDir.clone().negate();
                    const nonGravMagnitude = (NON_GRAVITATIONAL_FORCE_STRENGTH * lastSublimationFactor) / (distInAU * distInAU + SOFTENING_FACTOR);
                    nonGravAccel.add(fromSunDir.multiplyScalar(nonGravMagnitude));
                } else {
                    lastSublimationFactor = 0;
                }
            } else {
                lastSublimationFactor = 0;
            }
            totalAccelAU.add(nonGravAccel);

            // --- Planets' Gravity ---
            if (planetsGroupRef.current) {
                planetsGroupRef.current.children.forEach(planetGroup => {
                    const planetMesh = planetGroup.children[0] as THREE.Mesh;
                    if (!planetMesh || !planetMesh.userData.mass) return;

                    const vecToPlanet = new THREE.Vector3().subVectors(planetMesh.position, state.position);
                    const distToPlanet = vecToPlanet.length();
                    
                    if (distToPlanet > 1e-6) { // Avoid singularity and normalize(0)
                        const planetMass = planetMesh.userData.mass;
                        const distToPlanetSqAU = ((distToPlanet * distToPlanet) / (AU_TO_SCENE_SCALE * AU_TO_SCENE_SCALE)) + SOFTENING_FACTOR;
                        const planetGravMag = G * planetMass / distToPlanetSqAU;
                        
                        const accelDir = vecToPlanet.clone().normalize();
                        totalAccelAU.add(accelDir.multiplyScalar(planetGravMag));
                    }
                });
            }
            
            // --- Defensive Layer 1: Capping Acceleration ---
            const MAX_ACCELERATION_AU = 15.0;
            const accelLengthSq = totalAccelAU.lengthSq();

            if (isNaN(accelLengthSq) || !isFinite(accelLengthSq)) {
                totalAccelAU.set(0, 0, 0); 
            } 
            else if (accelLengthSq > MAX_ACCELERATION_AU * MAX_ACCELERATION_AU) {
                const accelLength = Math.sqrt(accelLengthSq);
                totalAccelAU.multiplyScalar(MAX_ACCELERATION_AU / accelLength);
            }

            // --- Integration Step ---
            const totalAccelScene = totalAccelAU.clone().multiplyScalar(AU_TO_SCENE_SCALE);
            state.velocity.add(totalAccelScene.clone().multiplyScalar(dt));
            state.position.add(state.velocity.clone().multiplyScalar(dt));

            // --- Defensive Layer 2: Final State Validation and Recovery Failsafe ---
            if (isNaN(state.position.x) || isNaN(state.velocity.x) || !isFinite(state.position.lengthSq()) || !isFinite(state.velocity.lengthSq())) {
                console.error("Catastrophic numerical instability detected. Resetting comet state to prevent crash.");
                state.position.copy(initialState.position);
                state.velocity.copy(initialState.velocity);
                state.trail.length = 0;
                lastSublimationFactor = 0; 
                break; // Exit the sub-step loop for this frame
            }


            if (i === numSubSteps - 1) { // Store forces from last substep for visualization
                lastTotalAccelScene.copy(totalAccelScene);
                lastNonGravAccelScene.copy(nonGravAccel.clone().multiplyScalar(AU_TO_SCENE_SCALE));
            }
        }

        // --- Update visual elements once per frame after all physics sub-steps ---
        
        cometGroupRef.current.position.copy(state.position);

        if (state.trail.length === 0 || state.trail[state.trail.length - 1].distanceTo(state.position) > 0.5) {
            state.trail.push(state.position.clone());
            if (state.trail.length > COMET_TRAIL_LENGTH) {
                state.trail.shift();
            }
        }

        // Final sanitization before rendering to prevent NaN propagation to visual properties
        if (!isFinite(lastSublimationFactor) || isNaN(lastSublimationFactor)) {
            lastSublimationFactor = 0;
        }
        
        comaMaterialRef.current.opacity = lastSublimationFactor * 0.7;
        comaRef.current.scale.setScalar(1 + lastSublimationFactor * 30);

        // --- Ion Tail Rendering with Zero-Vector Safeguard ---
        const distToSunSq = state.position.lengthSq();
        if (distToSunSq > 1e-9 && lastSublimationFactor > 0.01) {
            const fromSunDir = state.position.clone().normalize();
            const ionTailEnd = state.position.clone().add(fromSunDir.multiplyScalar(lastSublimationFactor * 50));
            ionTailRef.current.geometry.setFromPoints([state.position, ionTailEnd]);
            (ionTailRef.current.material as THREE.LineBasicMaterial).opacity = lastSublimationFactor;
            ionTailRef.current.visible = true;
        } else {
            ionTailRef.current.visible = false;
        }
        ionTailRef.current.geometry.computeBoundingSphere();
        
        if (state.trail.length > 2) {
            dustTailCurve.points = state.trail;
            const points = dustTailCurve.getPoints(50);
            dustTailRef.current.geometry.setFromPoints(points);
            (dustTailRef.current.material as THREE.LineBasicMaterial).opacity = lastSublimationFactor * 0.7;
            dustTailRef.current.visible = true;
            dustTailRef.current.geometry.computeBoundingSphere();
        } else {
             dustTailRef.current.visible = false;
        }

        if(showForces) {
            const gravArrow = gravVecRef.current;
            if (gravArrow) {
                gravArrow.position.copy(state.position);
                const accelMag = lastTotalAccelScene.length();
                if (isFinite(accelMag) && accelMag > 1e-9) {
                    const dir = lastTotalAccelScene.clone().normalize();
                    gravArrow.setDirection(dir);
                    const arrowLength = accelMag * 5000;
                    gravArrow.setLength(arrowLength, arrowLength * 0.2, arrowLength * 0.1);
                } else {
                    gravArrow.setLength(0, 0, 0);
                }
            }
            
            const nonGravArrow = nonGravVecRef.current;
            if (nonGravArrow) {
                nonGravArrow.position.copy(state.position);
                const nonGravMag = lastNonGravAccelScene.length();
                if (isFinite(nonGravMag) && nonGravMag > 1e-12) {
                    const dir = lastNonGravAccelScene.clone().normalize();
                    nonGravArrow.setDirection(dir);
                    const arrowLength = nonGravMag * 100000;
                    nonGravArrow.setLength(arrowLength, arrowLength * 0.2, arrowLength * 0.1);
                } else {
                    nonGravArrow.setLength(0, 0, 0);
                }
            }

            const velArrow = velocityVecRef.current;
            if (velArrow) {
                velArrow.position.copy(state.position);
                const velMag = state.velocity.length();
                 if (isFinite(velMag) && velMag > 1e-9) {
                    const dir = state.velocity.clone().normalize();
                    velArrow.setDirection(dir);
                    const arrowLength = velMag * 5;
                    velArrow.setLength(arrowLength, arrowLength * 0.2, arrowLength * 0.1);
                } else {
                    velArrow.setLength(0, 0, 0);
                }
            }
        }

        if (infoTextRef.current && comaRef.current) {
            const distInAU = state.position.length() / AU_TO_SCENE_SCALE;
            const speedKms = (state.velocity.length() / AU_TO_SCENE_SCALE) * 1731.48; // Conversion factor: (AU/day) to (km/s)
            infoTextRef.current.text = `Dist: ${distInAU.toFixed(2)} AU\nSpeed: ${speedKms.toFixed(0)} km/s`;
            const comaRadius = (COMET_NUCLEUS_SIZE * 0.8) * comaRef.current.scale.y;
            infoTextRef.current.position.y = comaRadius + 2;
        }
    });

    return (
        <>
            <group ref={cometGroupRef}>
                <mesh>
                    <sphereGeometry args={[COMET_NUCLEUS_SIZE, 16, 16]} />
                    <meshStandardMaterial color="#FFFFFF" />
                </mesh>
                <points ref={comaRef}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={comaParticles.length / 3}
                            array={comaParticles}
                            itemSize={3}
                        />
                    </bufferGeometry>
                    <pointsMaterial
                        ref={comaMaterialRef}
                        size={0.05}
                        color="#adebeb"
                        transparent
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                        opacity={0}
                        sizeAttenuation={true}
                    />
                </points>
                <Text ref={infoTextRef} position={[0, 2, 0]} color="#FFFFFF" fontSize={1.2} anchorX="center" anchorY="bottom">{''}</Text>
            </group>
            
            <primitive object={ionTail} ref={ionTailRef} />
            <primitive object={dustTail} ref={dustTailRef} />

            {showForces && (
                 <>
                    <arrowHelper ref={gravVecRef} args={[new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,0), 1, 0xffff00]} />
                    <arrowHelper ref={nonGravVecRef} args={[new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,0), 1, 0xff00ff]} />
                    <arrowHelper ref={velocityVecRef} args={[new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,0), 1, 0x00ffff]} />
                    <Text position={[10, 20, 0]} color="#FFFF00" fontSize={1}>Total Gravity</Text>
                    <Text position={[10, 18, 0]} color="#FF00FF" fontSize={1}>Sublimation</Text>
                    <Text position={[10, 16, 0]} color="#00FFFF" fontSize={1}>Velocity</Text>
                 </>
            )}
        </>
    );
};

export default Comet;
