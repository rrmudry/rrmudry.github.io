import React from 'react';
import { DropObjectConfig, EnvironmentConfig, PhysicsState, ExperimentTrial } from '../types';
import { calculateTerminalVelocity } from '../services/physicsEngine';

interface ResultsComparisonProps {
  obj1: DropObjectConfig;
  obj2: DropObjectConfig;
  env: EnvironmentConfig;
  state1: PhysicsState;
  state2: PhysicsState;
  trials: ExperimentTrial[];
  onSaveTrial: () => void;
  onClearTrials: () => void;
}

export const ResultsComparison: React.FC<ResultsComparisonProps> = ({
  obj1,
  obj2,
  env,
  state1,
  state2,
  trials,
  onSaveTrial,
  onClearTrials
}) => {
  const vt1 = calculateTerminalVelocity(obj1, env);
  const vt2 = calculateTerminalVelocity(obj2, env);

  const bothFinished = state1.isFinished && state2.isFinished;
  const timeDelta = (state1.impactTime !== undefined && state2.impactTime !== undefined)
    ? Math.abs(state1.impactTime - state2.impactTime)
    : 0;

  const handleExportCSV = () => {
    if (!trials.length) return;
    const headers = [
      'Trial_ID',
      'Timestamp',
      'Height_m',
      'Gravity_m_s2',
      'Air_Density_kg_m3',
      'Obj1_Name',
      'Obj1_Mass_kg',
      'Obj1_Radius_m',
      'Obj1_Impact_Time_s',
      'Obj1_Impact_Vel_m_s',
      'Obj2_Name',
      'Obj2_Mass_kg',
      'Obj2_Radius_m',
      'Obj2_Impact_Time_s',
      'Obj2_Impact_Vel_m_s',
      'Time_Delta_s'
    ];

    const rows = trials.map(t => [
      t.id,
      t.timestamp,
      t.height,
      t.gravity,
      t.airDensity,
      `"${t.obj1Name}"`,
      t.obj1Mass,
      t.obj1Radius,
      t.obj1ImpactTime.toFixed(3),
      t.obj1ImpactVel.toFixed(2),
      `"${t.obj2Name}"`,
      t.obj2Mass,
      t.obj2Radius,
      t.obj2ImpactTime.toFixed(3),
      t.obj2ImpactVel.toFixed(2),
      t.timeDelta.toFixed(3)
    ]);

    const csvContent = [headers.join(',')].concat(rows.map(r => r.join(','))).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FreeFall_Lab_Data_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="glass rounded-2xl border border-white/10 p-4 bg-slate-900/80 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm">⚖️</span>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">
            Impact Telemetry &amp; Comparison
          </h3>
        </div>

        {bothFinished && (
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
              timeDelta < 0.02
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {timeDelta < 0.02 ? '✨ Simultaneous Impact (Δt ≈ 0.00s)' : `Δt = ${timeDelta.toFixed(2)}s Difference`}
            </span>

            <button
              onClick={onSaveTrial}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-lg transition-all"
            >
              + Log Trial
            </button>
          </div>
        )}
      </div>

      {/* Comparison Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
        {/* Object 1 Stats */}
        <div className="p-2.5 rounded-xl bg-orange-950/40 border border-orange-500/30">
          <p className="text-[9px] font-sans font-black uppercase text-orange-400 truncate">{obj1.name}</p>
          <p className="text-sm font-bold text-white mt-1">
            t = {state1.impactTime ? `${state1.impactTime.toFixed(2)}s` : `${state1.time.toFixed(2)}s`}
          </p>
          <p className="text-[10px] text-slate-400">
            v = {state1.impactVelocity ? `${state1.impactVelocity.toFixed(1)} m/s` : `${state1.velocity.toFixed(1)} m/s`}
          </p>
        </div>

        {/* Object 2 Stats */}
        <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
          <p className="text-[9px] font-sans font-black uppercase text-cyan-400 truncate">{obj2.name}</p>
          <p className="text-sm font-bold text-white mt-1">
            t = {state2.impactTime ? `${state2.impactTime.toFixed(2)}s` : `${state2.time.toFixed(2)}s`}
          </p>
          <p className="text-[10px] text-slate-400">
            v = {state2.impactVelocity ? `${state2.impactVelocity.toFixed(1)} m/s` : `${state2.velocity.toFixed(1)} m/s`}
          </p>
        </div>

        {/* Terminal Velocities */}
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
          <p className="text-[9px] font-sans font-black uppercase text-slate-400">Terminal Velocities</p>
          <p className="text-[11px] font-bold text-orange-300 mt-1">
            Obj 1: {Number.isFinite(vt1) ? `${vt1.toFixed(1)} m/s` : '∞ (Vacuum)'}
          </p>
          <p className="text-[11px] font-bold text-cyan-300">
            Obj 2: {Number.isFinite(vt2) ? `${vt2.toFixed(1)} m/s` : '∞ (Vacuum)'}
          </p>
        </div>

        {/* Environment summary */}
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
          <p className="text-[9px] font-sans font-black uppercase text-slate-400">Conditions</p>
          <p className="text-[11px] font-bold text-slate-200 mt-1">h = {env.height} m</p>
          <p className="text-[10px] text-slate-400">
            {env.atmosphereMode === 'vacuum' ? 'Vacuum (0 Drag)' : `Air ρ = ${env.airDensity} kg/m³`}
          </p>
        </div>
      </div>

      {/* Trial History Table */}
      {trials.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-300 text-[10px] uppercase tracking-wider">
              Experiment Run Log ({trials.length} trials)
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="text-[10px] bg-white/10 hover:bg-white/20 text-slate-200 px-2 py-0.5 rounded font-bold transition-all"
              >
                Export CSV 📥
              </button>
              <button
                onClick={onClearTrials}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-36 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/70">
            <table className="w-full text-left text-[10px] font-mono">
              <thead className="bg-slate-900 sticky top-0 text-slate-400 border-b border-white/5">
                <tr>
                  <th className="p-2">Run</th>
                  <th className="p-2">Medium</th>
                  <th className="p-2">Height</th>
                  <th className="p-2">Obj 1 (t / v)</th>
                  <th className="p-2">Obj 2 (t / v)</th>
                  <th className="p-2">Δt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {trials.map((tr, idx) => (
                  <tr key={tr.id} className="hover:bg-white/5">
                    <td className="p-2 font-bold text-white">#{idx + 1}</td>
                    <td className="p-2">{tr.airDensity === 0 ? '⚡ Vacuum' : '🌬️ Air'}</td>
                    <td className="p-2">{tr.height}m</td>
                    <td className="p-2 text-orange-300">{tr.obj1ImpactTime.toFixed(2)}s ({tr.obj1ImpactVel.toFixed(0)}m/s)</td>
                    <td className="p-2 text-cyan-300">{tr.obj2ImpactTime.toFixed(2)}s ({tr.obj2ImpactVel.toFixed(0)}m/s)</td>
                    <td className="p-2 font-bold text-amber-300">{tr.timeDelta.toFixed(2)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
