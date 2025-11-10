
import React, { useRef } from 'react';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import Sun from './Sun';
import Planet from './Planet';
import Comet from './Comet';
import { PLANETS_DATA } from '../constants';
import type { SimulationControls, CometInstance } from '../types';

interface SceneProps extends SimulationControls {
    cometInstances: CometInstance[];
    onSpawnComet: (position: THREE.Vector3) => void;
}

const Scene: React.FC<SceneProps> = (props) => {
    const pointerDownInfo = useRef<{ time: number; x: number; y: number; point: THREE.Vector3 | null }>({ time: 0, x: 0, y: 0, point: null });
    const planetsGroupRef = useRef<THREE.Group>(null!);

    const handlePointerDown = (event: any) => {
        event.stopPropagation();
        pointerDownInfo.current = {
            time: event.timeStamp,
            x: event.clientX,
            y: event.clientY,
            point: event.point,
        };
    };

    const handlePointerUp = (event: any) => {
        event.stopPropagation();
        const { time, x, y, point } = pointerDownInfo.current;
        const upTime = event.timeStamp;
        const upX = event.clientX;
        const upY = event.clientY;

        const timeDiff = upTime - time;
        const distance = Math.sqrt(Math.pow(upX - x, 2) + Math.pow(upY - y, 2));

        const MAX_CLICK_DURATION = 250; // ms
        const MAX_CLICK_DISTANCE = 10; // pixels

        if (timeDiff < MAX_CLICK_DURATION && distance < MAX_CLICK_DISTANCE && point) {
            props.onSpawnComet(point);
        }
        // Reset for next interaction
        pointerDownInfo.current = { time: 0, x: 0, y: 0, point: null };
    };

    return (
        <>
            <ambientLight intensity={0.1} />
            <pointLight position={[0, 0, 0]} intensity={1.5} distance={1000} color="#FFDAB9" />
            <Stars radius={300} depth={50} count={10000} factor={7} saturation={0} fade speed={1} />
            
            <Sun />
            
            <group ref={planetsGroupRef}>
                {PLANETS_DATA.map((planetData) => (
                    <Planet 
                        key={planetData.name} 
                        planetData={planetData} 
                        isPlaying={props.isPlaying}
                        simulationSpeed={props.simulationSpeed}
                        showOrbit={props.showOrbits}
                        showLabel={props.showLabels}
                    />
                ))}
            </group>
            
            {props.cometInstances.map(comet => (
                 <Comet 
                    key={comet.id}
                    initialState={comet.initialState}
                    isPlaying={props.isPlaying}
                    simulationSpeed={props.simulationSpeed}
                    showForces={props.showForces}
                    planetsGroupRef={planetsGroupRef}
                />
            ))}

            {/* Invisible plane for catching clicks to spawn comets */}
            <mesh 
                rotation={[-Math.PI / 2, 0, 0]} 
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                visible={false}
            >
                <planeGeometry args={[1000, 1000]} />
                <meshBasicMaterial />
            </mesh>

            <OrbitControls 
                enablePan={true} 
                enableZoom={true} 
                enableRotate={true}
                minDistance={10}
                maxDistance={500}
            />
        </>
    );
};

export default Scene;