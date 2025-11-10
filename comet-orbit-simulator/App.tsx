
import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Scene from './components/Scene';
import ControlsPanel from './components/ControlsPanel';
import type { SimulationControls, CometInstance } from './types';
import { COMET_INITIAL_STATE, FAMOUS_COMETS_DATA, G, SUN_MASS, AU_TO_SCENE_SCALE } from './constants';
import { convertOrbitalElementsToStateVectors } from './utils/orbitalCalculations';

const App: React.FC = () => {
    const [controls, setControls] = useState<SimulationControls>({
        isPlaying: true,
        simulationSpeed: 50,
        showOrbits: true,
        showLabels: true,
        showForces: false,
        cometEccentricity: 0.6,
        resetKey: 0,
    });

    const [cometInstances, setCometInstances] = useState<CometInstance[]>([]);

    useEffect(() => {
        // Initialize with one comet or reset simulation
        setCometInstances([{
            id: Date.now(),
            initialState: {
                position: COMET_INITIAL_STATE.position.clone(),
                velocity: COMET_INITIAL_STATE.velocity.clone(),
            }
        }]);
    }, [controls.resetKey]);

    const spawnCustomComet = (position: THREE.Vector3) => {
        // Don't spawn comets too close to the sun
        if (position.length() < 10) return;

        const distanceToSun = position.length();
        const distanceInAU = distanceToSun / AU_TO_SCENE_SCALE;
        
        const circularSpeedInAUPerDay = Math.sqrt(G * SUN_MASS / distanceInAU);
        const speedInAUPerDay = circularSpeedInAUPerDay * controls.cometEccentricity;
        
        const direction = new THREE.Vector3(-position.z, 0, position.x).normalize();
        
        const velocityAU = direction.multiplyScalar(speedInAUPerDay);
        const velocityScene = velocityAU.multiplyScalar(AU_TO_SCENE_SCALE);
        
        const newComet: CometInstance = {
            id: Date.now(),
            initialState: {
                position,
                velocity: velocityScene,
            }
        };
        setCometInstances(current => [...current, newComet]);
    };

    const addFamousComet = (cometName: string) => {
        const cometData = FAMOUS_COMETS_DATA.find(c => c.name === cometName);
        if (!cometData) return;
        
        const { position, velocity } = convertOrbitalElementsToStateVectors(cometData);
        
        const newComet: CometInstance = {
            id: Date.now(),
            initialState: {
                position: position.multiplyScalar(AU_TO_SCENE_SCALE),
                velocity: velocity.multiplyScalar(AU_TO_SCENE_SCALE),
            }
        };
        setCometInstances(current => [...current, newComet]);
    };


    return (
        <div className="w-screen h-screen bg-black text-white font-sans">
            <div id="canvas-container" className="w-full h-full">
                <Canvas camera={{ position: [0, 60, 100], fov: 45 }}>
                    <Scene 
                        {...controls} 
                        cometInstances={cometInstances}
                        onSpawnComet={spawnCustomComet}
                    />
                </Canvas>
            </div>
            
            <div className="absolute top-4 left-4 text-white p-4 rounded-lg bg-black bg-opacity-50">
                <h1 className="text-2xl font-bold">3D Comet Orbit Simulator</h1>
                <p className="text-sm text-gray-300">Observe a comet's journey through the solar system.</p>
            </div>

            <ControlsPanel 
                controls={controls} 
                setControls={setControls} 
                onAddFamousComet={addFamousComet} 
            />
        </div>
    );
};

export default App;