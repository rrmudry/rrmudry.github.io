import React from 'react';
import { EnvironmentConfig, PlanetLocation, AtmosphereMode } from '../types';
import { PLANET_PRESETS, ATMOSPHERE_PRESETS } from '../constants';

interface EnvironmentControlsProps {
  envConfig: EnvironmentConfig;
  onChange: (updated: EnvironmentConfig) => void;
  disabled: boolean;
}

export const EnvironmentControls: React.FC<EnvironmentControlsProps> = ({
  envConfig,
  onChange,
  disabled
}) => {
  const handlePlanetSelect = (planetKey: PlanetLocation) => {
    const preset = PLANET_PRESETS[planetKey];
    onChange({
      ...envConfig,
      planet: planetKey,
      gravity: preset.gravity,
      airDensity: envConfig.atmosphereMode === 'vacuum' ? 0 : preset.defaultAirDensity
    });
  };

  const handleAtmosphereSelect = (modeKey: AtmosphereMode) => {
    const preset = ATMOSPHERE_PRESETS[modeKey];
    onChange({
      ...envConfig,
      atmosphereMode: modeKey,
      airDensity: preset.density
    });
  };

  return (
    <div className="glass rounded-2xl border border-white/10 p-4 bg-slate-900/80 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
          <span>🌍</span> Environment &amp; Physics Conditions
        </h3>
        <span className="text-[10px] font-mono text-cyan-400 font-bold">
          g = {envConfig.gravity.toFixed(1)} m/s² • ρ = {envConfig.airDensity.toFixed(3)} kg/m³
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        
        {/* 1. Drop Height Control */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-slate-300 font-bold">Drop Height (h):</label>
            <span className="font-mono font-black text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
              {envConfig.height} m
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={200}
            step={5}
            value={envConfig.height}
            disabled={disabled}
            onChange={(e) => onChange({ ...envConfig, height: parseInt(e.target.value, 10) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-cyan-400 disabled:opacity-50"
          />
          <div className="flex gap-1 mt-1.5">
            {[10, 50, 100, 200].map(h => (
              <button
                key={h}
                onClick={() => onChange({ ...envConfig, height: h })}
                disabled={disabled}
                className={`flex-1 py-1 rounded text-[9px] font-bold border transition-all ${
                  envConfig.height === h
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                } disabled:opacity-50`}
              >
                {h}m
              </button>
            ))}
          </div>
        </div>

        {/* 2. Atmosphere / Medium */}
        <div>
          <label className="text-slate-300 font-bold block mb-1">Atmosphere / Drag:</label>
          <div className="grid grid-cols-2 gap-1 mb-1.5">
            {(['vacuum', 'earth-sea-level', 'high-altitude', 'custom'] as AtmosphereMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => handleAtmosphereSelect(mode)}
                disabled={disabled}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all text-left truncate ${
                  envConfig.atmosphereMode === mode
                    ? mode === 'vacuum'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                } disabled:opacity-50`}
              >
                {mode === 'vacuum' && '⚡ Vacuum'}
                {mode === 'earth-sea-level' && '🌬️ Sea Level'}
                {mode === 'high-altitude' && '✈️ High Alt'}
                {mode === 'custom' && '⚙️ Custom ρ'}
              </button>
            ))}
          </div>
          {envConfig.atmosphereMode === 'custom' && (
            <input
              type="range"
              min={0}
              max={5.0}
              step={0.05}
              value={envConfig.airDensity}
              disabled={disabled}
              onChange={(e) => onChange({ ...envConfig, airDensity: parseFloat(e.target.value) })}
              className="w-full h-1 bg-slate-800 rounded-lg cursor-pointer accent-cyan-400"
            />
          )}
        </div>

        {/* 3. Planetary Gravity */}
        <div>
          <label className="text-slate-300 font-bold block mb-1">Planetary Gravity (g):</label>
          <div className="grid grid-cols-2 gap-1 mb-1.5">
            {(['earth', 'moon', 'mars', 'jupiter'] as PlanetLocation[]).map(pl => {
              const preset = PLANET_PRESETS[pl];
              return (
                <button
                  key={pl}
                  onClick={() => handlePlanetSelect(pl)}
                  disabled={disabled}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all text-left truncate flex items-center justify-between ${
                    envConfig.planet === pl
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                  } disabled:opacity-50`}
                >
                  <span>{preset.icon} {preset.name}</span>
                  <span className="font-mono text-[9px] opacity-75">{preset.gravity}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Playback Speed */}
        <div>
          <label className="text-slate-300 font-bold block mb-1">Playback Speed:</label>
          <div className="flex gap-1 mb-2">
            {[1.0, 0.5, 0.25, 0.1].map(spd => (
              <button
                key={spd}
                onClick={() => onChange({ ...envConfig, playbackSpeed: spd })}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                  envConfig.playbackSpeed === spd
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                }`}
              >
                {spd === 1 ? '1.0x' : `${spd}x`}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-slate-500 italic">
            Use 0.25x or 0.1x slow motion to analyze simultaneous impacts closely.
          </p>
        </div>

      </div>
    </div>
  );
};
