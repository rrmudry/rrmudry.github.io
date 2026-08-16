import React from 'react';
import { GUIDED_CHALLENGES } from '../constants';
import { AtmosphereMode, SimulationStatus } from '../types';

interface HeaderProps {
  atmosphereMode: AtmosphereMode;
  onToggleVacuum: () => void;
  status: SimulationStatus;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  selectedChallengeId: string;
  onSelectChallenge: (challengeId: string) => void;
  showVectors: boolean;
  onToggleVectors: () => void;
  showStrobe: boolean;
  onToggleStrobe: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  atmosphereMode,
  onToggleVacuum,
  status,
  onStart,
  onPause,
  onReset,
  selectedChallengeId,
  onSelectChallenge,
  showVectors,
  onToggleVectors,
  showStrobe,
  onToggleStrobe
}) => {
  const isRunning = status === 'running';
  const isVacuum = atmosphereMode === 'vacuum';

  return (
    <header className="bg-slate-950/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Branding & NGSS Badges */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl shadow-lg shadow-orange-500/20">
            🪶
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black italic tracking-tight uppercase text-white">
                Free Fall <span className="text-cyan-400">&amp; Terminal Velocity</span>
              </h1>
              <span className="text-[10px] font-bold bg-white/10 text-slate-300 px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/10">
                Dual Object Lab
              </span>
              <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono border border-indigo-500/30">
                HS-PS2-1
              </span>
              <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono border border-indigo-500/30">
                HS-PS2-2
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Side-by-side acceleration, mass, radius, and atmospheric drag analysis
            </p>
          </div>
        </div>

        {/* Middle: Guided Challenge Selector & Toggles */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {/* Challenge Selector */}
          <select
            value={selectedChallengeId}
            onChange={(e) => onSelectChallenge(e.target.value)}
            disabled={isRunning}
            className="bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:border-cyan-500 outline-none transition-all disabled:opacity-50 cursor-pointer"
          >
            <option value="custom">🎯 Guided Challenge: Custom Investigation</option>
            {GUIDED_CHALLENGES.map(ch => (
              <option key={ch.id} value={ch.id}>
                🔬 {ch.title} ({ch.subtitle})
              </option>
            ))}
          </select>

          {/* Quick Vacuum Switch */}
          <button
            onClick={onToggleVacuum}
            disabled={isRunning}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border shadow-sm ${
              isVacuum
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 border-white/10 hover:border-white/20'
            } disabled:opacity-50`}
            title="Toggle between complete vacuum (Zero Drag) and atmosphere"
          >
            <span>{isVacuum ? '⚡' : '🌬️'}</span>
            <span>{isVacuum ? 'Vacuum (Drag = 0)' : 'Earth Air'}</span>
          </button>

          {/* Force Vectors Toggle */}
          <button
            onClick={onToggleVectors}
            className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              showVectors
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 border-white/10'
            }`}
            title="Toggle live Force Vector arrows (Fg, Fdrag, Fnet)"
          >
            Vectors {showVectors ? 'ON' : 'OFF'}
          </button>

          {/* Strobe Trails Toggle */}
          <button
            onClick={onToggleStrobe}
            className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              showStrobe
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-slate-900 text-slate-400 border-white/10'
            }`}
            title="Toggle timestamped motion strobe trails"
          >
            Strobe {showStrobe ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Right: Simulation Controls (Start / Pause / Reset) */}
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={onStart}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 hover:scale-105 active:scale-95"
            >
              <span>▶</span> Drop Objects
            </button>
          ) : (
            <button
              onClick={onPause}
              className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-amber-950/50"
            >
              <span>⏸</span> Pause
            </button>
          )}

          <button
            onClick={onReset}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold border border-white/10 transition-all flex items-center gap-1"
            title="Reset simulation to initial drop position"
          >
            <span>↺</span> Reset
          </button>
        </div>

      </div>
    </header>
  );
};
