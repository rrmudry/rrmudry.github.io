import React, { useState } from 'react';
import { DropObjectConfig, EnvironmentConfig, ActiveGraphTab } from '../types';
import { calculateTerminalVelocity } from '../services/physicsEngine';

export interface GraphDataPoint {
  time: number;
  pos1: number;
  vel1: number;
  acc1: number;
  pos2: number;
  vel2: number;
  acc2: number;
}

interface GraphStudioProps {
  history: GraphDataPoint[];
  obj1: DropObjectConfig;
  obj2: DropObjectConfig;
  env: EnvironmentConfig;
  maxTime: number;
}

export const GraphStudio: React.FC<GraphStudioProps> = ({
  history,
  obj1,
  obj2,
  env,
  maxTime
}) => {
  const [activeTab, setActiveTab] = useState<ActiveGraphTab>('all');

  const vt1 = calculateTerminalVelocity(obj1, env);
  const vt2 = calculateTerminalVelocity(obj2, env);

  // Graph dimensions
  const width = 360;
  const height = 140;
  const padL = 36;
  const padR = 12;
  const padT = 15;
  const padB = 22;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const effectiveMaxT = Math.max(2, maxTime, history[history.length - 1]?.time || 0);

  // Helper to scale points
  const getX = (t: number) => padL + (t / effectiveMaxT) * plotW;

  // 1. Render Position Plot (y vs t)
  const renderPositionPlot = () => {
    const maxY = Math.max(10, env.height);
    const getY = (y: number) => padT + (y / maxY) * plotH;

    const path1 = history.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(pt.time)} ${getY(pt.pos1)}`).join(' ');
    const path2 = history.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(pt.time)} ${getY(pt.pos2)}`).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Grid lines */}
        <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <line x1={padL} y1={padT + plotH / 2} x2={width - padR} y2={padT + plotH / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />

        {/* Curves */}
        {path1 && <path d={path1} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />}
        {path2 && <path d={path2} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />}

        {/* Labels */}
        <text x="4" y={padT + 8} fill="#94a3b8" fontSize="8" fontFamily="monospace">0m</text>
        <text x="4" y={height - padB} fill="#94a3b8" fontSize="8" fontFamily="monospace">{env.height}m</text>
        <text x={width - padR - 15} y={height - 6} fill="#94a3b8" fontSize="8" fontFamily="monospace">{effectiveMaxT.toFixed(1)}s</text>
        <text x={padL + 4} y={padT + 10} fill="#cbd5e1" fontSize="9" fontWeight="bold">Position y (m)</text>
      </svg>
    );
  };

  // 2. Render Velocity Plot (v vs t)
  const renderVelocityPlot = () => {
    const maxV = Math.max(20, ...history.map(p => Math.max(p.vel1, p.vel2, 0)), Number.isFinite(vt1) ? Math.min(vt1, 100) : 0);
    const getY = (v: number) => height - padB - (v / maxV) * plotH;

    const path1 = history.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(pt.time)} ${getY(pt.vel1)}`).join(' ');
    const path2 = history.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(pt.time)} ${getY(pt.vel2)}`).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Grid lines */}
        <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

        {/* Terminal velocity horizontal dashed lines */}
        {Number.isFinite(vt1) && vt1 <= maxV && (
          <g>
            <line x1={padL} y1={getY(vt1)} x2={width - padR} y2={getY(vt1)} stroke="#ea580c" strokeDasharray="3,3" strokeWidth="1" />
            <text x={width - padR - 35} y={getY(vt1) - 2} fill="#ea580c" fontSize="7" fontFamily="monospace">v_t1={vt1.toFixed(0)}</text>
          </g>
        )}
        {Number.isFinite(vt2) && vt2 <= maxV && (
          <g>
            <line x1={padL} y1={getY(vt2)} x2={width - padR} y2={getY(vt2)} stroke="#0284c7" strokeDasharray="3,3" strokeWidth="1" />
            <text x={width - padR - 35} y={getY(vt2) - 2} fill="#0284c7" fontSize="7" fontFamily="monospace">v_t2={vt2.toFixed(0)}</text>
          </g>
        )}

        {/* Curves */}
        {path1 && <path d={path1} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />}
        {path2 && <path d={path2} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />}

        {/* Labels */}
        <text x="4" y={padT + 8} fill="#94a3b8" fontSize="8" fontFamily="monospace">{maxV.toFixed(0)}</text>
        <text x="4" y={height - padB} fill="#94a3b8" fontSize="8" fontFamily="monospace">0 m/s</text>
        <text x={width - padR - 15} y={height - 6} fill="#94a3b8" fontSize="8" fontFamily="monospace">{effectiveMaxT.toFixed(1)}s</text>
        <text x={padL + 4} y={padT + 10} fill="#cbd5e1" fontSize="9" fontWeight="bold">Velocity v (m/s)</text>
      </svg>
    );
  };

  // 3. Render Acceleration Plot (a vs t)
  const renderAccelerationPlot = () => {
    const maxA = Math.max(12, env.gravity * 1.1);
    const getY = (a: number) => height - padB - (Math.max(0, a) / maxA) * plotH;

    const path1 = history.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(pt.time)} ${getY(pt.acc1)}`).join(' ');
    const path2 = history.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(pt.time)} ${getY(pt.acc2)}`).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Grid lines */}
        <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <line x1={padL} y1={getY(env.gravity)} x2={width - padR} y2={getY(env.gravity)} stroke="rgba(255,255,255,0.1)" strokeDasharray="3,3" />

        {/* Curves */}
        {path1 && <path d={path1} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />}
        {path2 && <path d={path2} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />}

        {/* Labels */}
        <text x="4" y={padT + 8} fill="#94a3b8" fontSize="8" fontFamily="monospace">{maxA.toFixed(0)}</text>
        <text x="4" y={height - padB} fill="#94a3b8" fontSize="8" fontFamily="monospace">0 m/s²</text>
        <text x={width - padR - 15} y={height - 6} fill="#94a3b8" fontSize="8" fontFamily="monospace">{effectiveMaxT.toFixed(1)}s</text>
        <text x={padL + 4} y={padT + 10} fill="#cbd5e1" fontSize="9" fontWeight="bold">Acceleration a (m/s²)</text>
      </svg>
    );
  };

  return (
    <div className="glass rounded-2xl border border-white/10 p-4 bg-slate-900/80 shadow-xl space-y-3">
      {/* Header & Graph Tab Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm">📈</span>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">
            Real-Time Graph Studio
          </h3>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <span className="flex items-center gap-1 text-orange-400">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> {obj1.name} (Obj 1)
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> {obj2.name} (Obj 2)
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-white/5 text-[10px] font-bold">
          {(['all', 'position', 'velocity', 'acceleration'] as ActiveGraphTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-0.5 rounded-lg uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Graph Display Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(activeTab === 'all' || activeTab === 'position') && (
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-white/5 flex flex-col justify-between">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono px-1">
              <span>Position y(t)</span>
              <span className="text-orange-400 font-bold">{history[history.length - 1]?.pos1.toFixed(1) || 0}m</span>
              <span className="text-cyan-400 font-bold">{history[history.length - 1]?.pos2.toFixed(1) || 0}m</span>
            </div>
            <div className="h-32 w-full mt-1">
              {renderPositionPlot()}
            </div>
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'velocity') && (
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-white/5 flex flex-col justify-between">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono px-1">
              <span>Velocity v(t)</span>
              <span className="text-orange-400 font-bold">{history[history.length - 1]?.vel1.toFixed(1) || 0} m/s</span>
              <span className="text-cyan-400 font-bold">{history[history.length - 1]?.vel2.toFixed(1) || 0} m/s</span>
            </div>
            <div className="h-32 w-full mt-1">
              {renderVelocityPlot()}
            </div>
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'acceleration') && (
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-white/5 flex flex-col justify-between">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono px-1">
              <span>Acceleration a(t)</span>
              <span className="text-orange-400 font-bold">{history[history.length - 1]?.acc1.toFixed(1) || 0} m/s²</span>
              <span className="text-cyan-400 font-bold">{history[history.length - 1]?.acc2.toFixed(1) || 0} m/s²</span>
            </div>
            <div className="h-32 w-full mt-1">
              {renderAccelerationPlot()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
