import React from 'react';
import { SimulationState } from '../types';

interface DataDisplayProps {
  state: SimulationState;
}

const DataDisplayItem: React.FC<{ label: string, value: string, unit: string }> = ({ label, value, unit }) => (
  <div className="text-center">
    <p className="text-sm text-slate-400">{label}</p>
    <p className="text-2xl font-mono font-bold text-cyan-400">
      {value} <span className="text-lg text-slate-400">{unit}</span>
    </p>
  </div>
);

const DataDisplay: React.FC<DataDisplayProps> = ({ state }) => {
  return (
    <div className="bg-slate-800 p-4 rounded-lg flex flex-col h-full justify-center gap-4">
      <DataDisplayItem label="Time" value={state.time.toFixed(2)} unit="s" />
      <DataDisplayItem label="Velocity" value={state.velocity.toFixed(2)} unit="m/s" />
      <DataDisplayItem label="Position" value={state.position.toFixed(2)} unit="m" />
    </div>
  );
};

export default DataDisplay;
