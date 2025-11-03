import React from 'react';
import { SimulationParams, SimulationState, SimulationStatus, Location } from '../types';

interface ResultsSummaryProps {
  params: SimulationParams;
  state: SimulationState;
  stateWithAir: SimulationState | null;
  status: SimulationStatus;
  location: Location;
}

const ResultsSummary: React.FC<ResultsSummaryProps> = ({ params, state, stateWithAir, status, location }) => {
  const renderSummary = () => {
    if (status !== 'finished') {
      return (
        <p className="text-slate-400 text-center">
          Complete a simulation run to see the summary.
        </p>
      );
    }

    if (stateWithAir) {
      return (
        <div className="space-y-3 text-slate-300">
          <p>
            When falling <strong className="text-cyan-400">{params.height.toFixed(1)} m</strong>, the object{' '}
            <strong className="text-cyan-400">without air resistance</strong> landed in{' '}
            <strong className="text-cyan-400">{state.time.toFixed(2)}s</strong> with a final velocity of{' '}
            <strong className="text-cyan-400">{state.velocity.toFixed(2)} m/s</strong>.
          </p>
           <p>
            The object <strong className="text-cyan-400">with air resistance</strong> landed in{' '}
            <strong className="text-cyan-400">{stateWithAir.time.toFixed(2)}s</strong> with a final velocity of{' '}
            <strong className="text-cyan-400">{stateWithAir.velocity.toFixed(2)} m/s</strong>.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3 text-slate-300">
        <p>
          The{' '}
          <strong className="text-cyan-400">{params.mass.toFixed(1)} kg</strong> object,
          falling from{' '}
          <strong className="text-cyan-400">{params.height.toFixed(1)} m</strong> on the{' '}
          <strong className="capitalize text-cyan-400">{location}</strong>, landed in{' '}
          <strong className="text-cyan-400">{state.time.toFixed(2)} seconds</strong>.
        </p>
        <p>
          It reached a final velocity of{' '}
          <strong className="text-cyan-400">{state.velocity.toFixed(2)} m/s</strong>.
        </p>
        <p className="text-xs text-slate-400 pt-2 border-t border-slate-700">
          Conditions: Gravity at {params.gravity.toFixed(2)} m/s², Air Density at {params.airDensity.toFixed(2)} kg/m³.
        </p>
      </div>
    );
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg mt-4">
      <h3 className="text-lg font-bold text-cyan-400 mb-4">Experiment Summary</h3>
      <div className="bg-slate-900/50 p-4 rounded-md min-h-[120px] flex items-center justify-center">
        {renderSummary()}
      </div>
    </div>
  );
};

export default ResultsSummary;
