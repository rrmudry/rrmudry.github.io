
import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { PLANET_RADIUS_SCALE, AU_TO_SCENE_SCALE } from '../constants';
import type { PlanetData } from '../types';

interface PlanetProps {
  planetData: PlanetData;
  isPlaying: boolean;
  simulationSpeed: number;
  showOrbit: boolean;
  showLabel: boolean;
}

const Planet: React.FC<PlanetProps> = ({ planetData, isPlaying, simulationSpeed, showOrbit, showLabel }) => {
  const planetRef = useRef<THREE.Mesh>(null!);
  const timeRef = useRef(Math.random() * 10000); // Random start position

  const scaledRadius = Math.max(0.1, (planetData.radius * PLANET_RADIUS_SCALE) / 6371); // Scaled relative to Earth, with a minimum size
  const scaledOrbitRadius = planetData.orbitRadius * AU_TO_SCENE_SCALE;
  
  const orbitPoints = useMemo(() => {
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * 2 * Math.PI;
        points.push(new THREE.Vector3(Math.cos(theta) * scaledOrbitRadius, 0, Math.sin(theta) * scaledOrbitRadius));
    }
    return points;
  }, [scaledOrbitRadius]);

  useLayoutEffect(() => {
    if(planetRef.current) {
      planetRef.current.userData.mass = planetData.mass;
    }
  }, [planetData.mass])

  useFrame((_, delta) => {
    if (isPlaying && planetRef.current) {
      // Use scaled orbital period for simulation speed
      const effectivePeriod = planetData.orbitalPeriod; 
      timeRef.current += (delta * simulationSpeed);
      const angle = (timeRef.current / effectivePeriod) * 2 * Math.PI;
      planetRef.current.position.x = Math.cos(angle) * scaledOrbitRadius;
      planetRef.current.position.z = Math.sin(angle) * scaledOrbitRadius;
    }
  });

  return (
    <group>
      <mesh ref={planetRef}>
        <sphereGeometry args={[scaledRadius, 32, 32]} />
        <meshStandardMaterial color={planetData.color} emissive={planetData.color} emissiveIntensity={0.5} />
        {showLabel && (
           <Text
            position={[0, scaledRadius + 1.5, 0]}
            color="#FFFFFF"
            fontSize={1.5}
            anchorX="center"
            anchorY="middle"
          >
            {planetData.name}
          </Text>
        )}
      </mesh>
      
      {showOrbit && (
        <Line
            points={orbitPoints}
            color="#808080"
            lineWidth={0.5}
            dashed={true}
            dashSize={0.5}
            gapSize={0.5}
        />
      )}
    </group>
  );
};

export default Planet;