import React from 'react';
import { DropObjectConfig, EnvironmentConfig } from '../types';
import { OBJECT_PRESETS } from '../constants';
import { calculateTerminalVelocity, getCrossSectionalArea } from '../services/physicsEngine';

interface ObjectControlCardProps {
  label: string;             // e.g. "Object 1" or "Object 2"
  objectConfig: DropObjectConfig;
  onChange: (updated: DropObjectConfig) => void;
  envConfig: EnvironmentConfig;
  disabled: boolean;
  themeColor: 'orange' | 'cyan';
}

export const ObjectControlCard: React.FC<ObjectControlCardProps> = ({
  label,
  objectConfig,
  onChange,
  envConfig,
  disabled,
  themeColor
}) => {
  const isOrange = themeColor === 'orange';
  const borderClass = isOrange ? 'border-orange-500/40' : 'border-cyan-500/40';
  const headerBg = isOrange ? 'bg-orange-500/10 text-orange-400' : 'bg-cyan-500/10 text-cyan-400';
  const badgeColor = isOrange ? 'text-orange-300 bg-orange-950/60' : 'text-cyan-300 bg-cyan-950/60';
  const sliderAccent = isOrange ? 'accent-orange-500' : 'accent-cyan-400';

  const terminalVelocity = calculateTerminalVelocity(objectConfig, envConfig);
  const area = getCrossSectionalArea(objectConfig.radius);
  const weight = objectConfig.mass * envConfig.gravity;

  const handlePresetSelect = (presetId: string) => {
    const found = OBJECT_PRESETS.find(p => p.id === presetId);
    if (found) {
      onChange({
        ...found,
        color: objectConfig.color,
        accentBg: objectConfig.accentBg
      });
    }
  };

  return (
    <div className={`glass rounded-2xl border ${borderClass} overflow-hidden shadow-xl flex flex-col justify-between bg-slate-900/80`}>
      {/* Card Header */}
      <div className={`p-3.5 border-b border-white/10 flex items-center justify-between ${headerBg}`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{objectConfig.icon}</span>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-75">{label}</span>
            <h3 className="text-sm font-bold text-white truncate max-w-[140px]">{objectConfig.name}</h3>
          </div>
        </div>

        {/* Preset Selector */}
        <select
          value={OBJECT_PRESETS.some(p => p.id === objectConfig.id) ? objectConfig.id : 'custom'}
          onChange={(e) => handlePresetSelect(e.target.value)}
          disabled={disabled}
          className="bg-slate-950/90 border border-white/15 rounded-lg px-2 py-1 text-xs font-bold text-white focus:border-cyan-400 outline-none disabled:opacity-50 cursor-pointer"
        >
          {OBJECT_PRESETS.map(p => (
            <option key={p.id} value={p.id}>
              {p.icon} {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sliders & Parameters */}
      <div className="p-4 space-y-3.5 text-xs flex-1">
        
        {/* Mass Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-slate-300 font-bold flex items-center gap-1">
              <span>Mass (m):</span>
            </label>
            <span className={`font-mono font-black px-2 py-0.5 rounded border border-white/10 ${badgeColor}`}>
              {objectConfig.mass < 0.1 ? `${(objectConfig.mass * 1000).toFixed(0)} g` : `${objectConfig.mass.toFixed(2)} kg`}
            </span>
          </div>
          <input
            type="range"
            min={0.001}
            max={100.0}
            step={objectConfig.mass < 0.1 ? 0.001 : objectConfig.mass < 1.0 ? 0.01 : 0.25}
            value={objectConfig.mass}
            disabled={disabled}
            onChange={(e) => onChange({ ...objectConfig, id: 'custom', mass: parseFloat(e.target.value) })}
            className={`w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer ${sliderAccent} disabled:opacity-50`}
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
            <span>1 g</span>
            <span>10 kg</span>
            <span>100 kg</span>
          </div>
        </div>

        {/* Radius Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-slate-300 font-bold">
              <span>Radius (r):</span>
            </label>
            <span className={`font-mono font-black px-2 py-0.5 rounded border border-white/10 ${badgeColor}`}>
              {objectConfig.radius < 1.0 ? `${(objectConfig.radius * 100).toFixed(1)} cm` : `${objectConfig.radius.toFixed(2)} m`}
            </span>
          </div>
          <input
            type="range"
            min={0.01}
            max={3.0}
            step={objectConfig.radius < 0.2 ? 0.005 : 0.05}
            value={objectConfig.radius}
            disabled={disabled}
            onChange={(e) => onChange({ ...objectConfig, id: 'custom', radius: parseFloat(e.target.value) })}
            className={`w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer ${sliderAccent} disabled:opacity-50`}
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
            <span>1 cm (Tiny)</span>
            <span>45 cm (Skydiver)</span>
            <span>3.0 m (Parachute)</span>
          </div>
        </div>

        {/* Drag Coefficient (Cd) */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-slate-300 font-bold">
              <span>Shape Drag (C<sub>d</sub>):</span>
            </label>
            <span className={`font-mono font-black px-2 py-0.5 rounded border border-white/10 ${badgeColor}`}>
              {objectConfig.dragCoefficient.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={2.0}
            step={0.05}
            value={objectConfig.dragCoefficient}
            disabled={disabled}
            onChange={(e) => onChange({ ...objectConfig, id: 'custom', dragCoefficient: parseFloat(e.target.value) })}
            className={`w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer ${sliderAccent} disabled:opacity-50`}
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
            <span>0.1 (Streamlined)</span>
            <span>0.47 (Sphere)</span>
            <span>1.5 (Parachute)</span>
          </div>
        </div>

      </div>

      {/* Physics Property Footer Card */}
      <div className="p-3 bg-slate-950/70 border-t border-white/10 grid grid-cols-3 gap-1 text-[10px] text-center font-mono">
        <div className="p-1 rounded bg-white/5">
          <p className="text-[8px] text-slate-400 uppercase font-sans">Frontal Area</p>
          <p className="font-bold text-slate-200">{(area * 10000).toFixed(0)} cm²</p>
        </div>
        <div className="p-1 rounded bg-white/5">
          <p className="text-[8px] text-slate-400 uppercase font-sans">Weight (F<sub>g</sub>)</p>
          <p className="font-bold text-amber-300">{weight.toFixed(1)} N</p>
        </div>
        <div className="p-1 rounded bg-white/5">
          <p className="text-[8px] text-slate-400 uppercase font-sans">Terminal Vel</p>
          <p className="font-bold text-emerald-400">
            {Number.isFinite(terminalVelocity) ? `${terminalVelocity.toFixed(1)} m/s` : '∞ (Vacuum)'}
          </p>
        </div>
      </div>
    </div>
  );
};
