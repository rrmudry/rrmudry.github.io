import React from 'react';
import { SUN_RADIUS_SCALE } from '../constants';
import * as THREE from 'three';

const Sun: React.FC = () => {
    const sunSize = 696340 * SUN_RADIUS_SCALE / 10000;

    return (
        <mesh>
            <sphereGeometry args={[sunSize, 32, 32]} />
            <meshStandardMaterial 
                emissive="#FFD700" 
                emissiveIntensity={2} 
                color="#FFD700" 
                toneMapped={false} 
            />
        </mesh>
    );
};

export default Sun;