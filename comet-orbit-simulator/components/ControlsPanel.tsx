
import React, { useState } from 'react';
import type { SimulationControls } from '../types';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import ResetIcon from './icons/ResetIcon';
import { FAMOUS_COMETS_DATA } from '../constants';

interface ControlsPanelProps {
    controls: SimulationControls;
    setControls: React.Dispatch<React.SetStateAction<SimulationControls>>;
    onAddFamousComet: (cometName: string) => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({ controls, setControls, onAddFamousComet }) => {
    const [selectedComet, setSelectedComet] = useState<string>(FAMOUS_COMETS_DATA[0].name);

    const handleTogglePlay = () => {
        setControls(c => ({ ...c, isPlaying: !c.isPlaying }));
    };

    const handleReset = () => {
        setControls(c => ({ ...c, resetKey: c.resetKey + 1 }));
    };

    const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setControls(c => ({ ...c, simulationSpeed: Number(e.target.value) }));
    };

    const handleEccentricityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setControls(c => ({...c, cometEccentricity: Number(e.target.value)}));
    }

    const handleToggle = (key: keyof SimulationControls) => {
        setControls(c => ({ ...c, [key]: !c[key] }));
    };

    const handleAddComet = () => {
        if (selectedComet) {
            onAddFamousComet(selectedComet);
        }
    }

    return (
        <div className="absolute bottom-4 left-4 p-4 rounded-lg bg-gray-900 bg-opacity-70 backdrop-blur-sm w-full max-w-sm md:max-w-xs text-sm divide-y divide-gray-700">
            <div className="pb-3">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-bold">Controls</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={handleTogglePlay} className="p-2 rounded-full bg-gray-700 hover:bg-blue-600 transition-colors">
                            {controls.isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                        <button onClick={handleReset} className="p-2 rounded-full bg-gray-700 hover:bg-red-600 transition-colors">
                            <ResetIcon />
                        </button>
                    </div>
                </div>

                <div className="mt-4">
                    <label htmlFor="speed" className="block mb-1 text-gray-300">Simulation Speed: {controls.simulationSpeed}x</label>
                    <input
                        type="range"
                        id="speed"
                        min="1"
                        max="500"
                        value={controls.simulationSpeed}
                        onChange={handleSpeedChange}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>

            <div className="py-3">
                 <p className="font-semibold text-gray-200 mb-2">Click anywhere to add a custom comet.</p>
                <label htmlFor="eccentricity" className="block mb-1 text-gray-300">
                    Custom Comet Orbit Shape
                </label>
                 <input
                    type="range"
                    id="eccentricity"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={controls.cometEccentricity}
                    onChange={handleEccentricityChange}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Elliptical</span>
                    <span>Circular</span>
                </div>
            </div>

            <div className="py-3">
                 <p className="font-semibold text-gray-200 mb-2">Add Famous Comet</p>
                 <div className="flex gap-2">
                    <select 
                        value={selectedComet} 
                        onChange={e => setSelectedComet(e.target.value)}
                        className="block w-full px-2 py-1.5 text-white bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        {FAMOUS_COMETS_DATA.map(comet => (
                            <option key={comet.name} value={comet.name}>{comet.name}</option>
                        ))}
                    </select>
                    <button onClick={handleAddComet} className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap">Add Comet</button>
                 </div>
            </div>
            
            <div className="pt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center">
                    <input type="checkbox" id="showOrbits" checked={controls.showOrbits} onChange={() => handleToggle('showOrbits')} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 ring-offset-gray-800 focus:ring-2"/>
                    <label htmlFor="showOrbits" className="ml-2 text-gray-200">Show Orbits</label>
                </div>
                 <div className="flex items-center">
                    <input type="checkbox" id="showLabels" checked={controls.showLabels} onChange={() => handleToggle('showLabels')} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 ring-offset-gray-800 focus:ring-2"/>
                    <label htmlFor="showLabels" className="ml-2 text-gray-200">Show Labels</label>
                </div>
                 <div className="flex items-center">
                    <input type="checkbox" id="showForces" checked={controls.showForces} onChange={() => handleToggle('showForces')} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 ring-offset-gray-800 focus:ring-2"/>
                    <label htmlFor="showForces" className="ml-2 text-gray-200">Show Forces</label>
                </div>
            </div>
        </div>
    );
};

export default ControlsPanel;
