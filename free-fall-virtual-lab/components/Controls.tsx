import React from 'react';
import { SimulationParams, Location } from '../types';
import { PlayIcon, PauseIcon, ResetIcon } from './icons';
import type { SimulationStatus } from '../types';


interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  disabled: boolean;
}

const ControlSlider: React.FC<ControlSliderProps> = ({ label, value, min, max, step, unit, onChange, disabled }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-baseline">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <span className="text-sm font-mono text-cyan-400">{value.toFixed(2)} {unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      disabled={disabled}
      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:disabled:bg-slate-500"
    />
  </div>
);


interface ControlsProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  status: SimulationStatus;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  location: Location;
  onLocationChange: (location: Location) => void;
  isComparisonMode: boolean;
  onToggleComparisonMode: () => void;
}

const Controls: React.FC<ControlsProps> = ({ 
  params, 
  setParams, 
  status, 
  onStart, 
  onPause, 
  onReset, 
  location, 
  onLocationChange,
  isComparisonMode,
  onToggleComparisonMode
}) => {
  const isRunning = status === 'running';
  const isIdle = status === 'idle';

  const handleParamChange = <K extends keyof SimulationParams>(param: K, value: SimulationParams[K]) => {
    setParams(prev => ({ ...prev, [param]: value }));
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg shadow-lg h-full flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-4 text-cyan-400">Simulation Controls</h2>
        
        <div className="mb-4">
            <label className="text-sm font-medium text-slate-300 block mb-2">Location</label>
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => onLocationChange('earth')}
                    disabled={!isIdle}
                    className={`p-3 rounded-md text-center font-semibold transition-colors duration-200 ${
                        location === 'earth'
                        ? 'bg-cyan-500 text-slate-900'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    Earth
                </button>
                <button
                    onClick={() => onLocationChange('moon')}
                    disabled={!isIdle}
                    className={`p-3 rounded-md text-center font-semibold transition-colors duration-200 ${
                        location === 'moon'
                        ? 'bg-cyan-500 text-slate-900'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    Moon
                </button>
            </div>
        </div>

        <div className="space-y-4">
          <ControlSlider label="Height" value={params.height} min={10} max={1000} step={10} unit="m" onChange={(v) => handleParamChange('height', v)} disabled={!isIdle} />
          <ControlSlider label="Mass" value={params.mass} min={1} max={100} step={1} unit="kg" onChange={(v) => handleParamChange('mass', v)} disabled={!isIdle} />
          <ControlSlider label="Object Radius" value={params.radius} min={0.1} max={5} step={0.1} unit="m" onChange={(v) => handleParamChange('radius', v)} disabled={!isIdle} />
          
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">Air Resistance</label>
            <button
              onClick={onToggleComparisonMode}
              disabled={!isIdle || location === 'moon'}
              className={`w-full p-3 rounded-md text-center font-semibold transition-colors duration-200 ${
                  isComparisonMode
                  ? 'bg-cyan-500 text-slate-900'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isComparisonMode ? 'Side-by-Side View' : 'Single View'}
            </button>
             <p className="text-xs text-slate-500 mt-2 text-center">
                {location === 'moon' ? 'Air resistance comparison not available on the Moon.' : 'Toggle to compare fall with and without air resistance.'}
            </p>
          </div>

          <ControlSlider label="Gravity" value={params.gravity} min={1} max={25} step={0.1} unit="m/s²" onChange={(v) => handleParamChange('gravity', v)} disabled={true} />
        </div>
      </div>
      <div className="flex justify-center items-center gap-4 mt-6">
        <button onClick={onReset} className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" title="Reset Simulation">
          <ResetIcon />
        </button>
        {isRunning ? (
          <button onClick={onPause} className="p-4 rounded-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 transition-colors duration-200" title="Pause Simulation">
            <PauseIcon className="w-8 h-8"/>
          </button>
        ) : (
          <button onClick={onStart} disabled={status === 'finished'} className="p-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 transition-colors duration-200 disabled:bg-slate-600" title="Start Simulation">
            <PlayIcon className="w-8 h-8"/>
          </button>
        )}
      </div>
    </div>
  );
};

export default Controls;
