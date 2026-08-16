import React, { useRef, useEffect, useState } from 'react';
import { DropObjectConfig, EnvironmentConfig, PhysicsState, StrobePoint } from '../types';

interface SimulationCanvasProps {
  obj1: DropObjectConfig;
  obj2: DropObjectConfig;
  env: EnvironmentConfig;
  state1: PhysicsState;
  state2: PhysicsState;
  strobePoints1: StrobePoint[];
  strobePoints2: StrobePoint[];
  showVectors: boolean;
  showStrobe: boolean;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  obj1,
  obj2,
  env,
  state1,
  state2,
  strobePoints1,
  strobePoints2,
  showVectors,
  showStrobe
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasHeight, setCanvasHeight] = useState<number>(500);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setCanvasHeight(entries[0].contentRect.height);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const groundPaddingPx = 36;
  const usableHeightPx = Math.max(100, canvasHeight - groundPaddingPx);
  const pixelsPerMeter = usableHeightPx / Math.max(5, env.height);

  // Scaled object size in pixels
  const getObjectSizePx = (radiusMeters: number): number => {
    const rawPx = radiusMeters * 2 * pixelsPerMeter * 8; // enhanced visibility scale
    return Math.max(22, Math.min(80, rawPx));
  };

  const obj1Size = getObjectSizePx(obj1.radius);
  const obj2Size = getObjectSizePx(obj2.radius);

  // Position from top in pixels
  const getYPosPx = (positionMeters: number, objSize: number): number => {
    const maxTop = usableHeightPx - objSize;
    const computedTop = positionMeters * pixelsPerMeter;
    return Math.min(maxTop, computedTop);
  };

  const pos1Px = getYPosPx(state1.position, obj1Size);
  const pos2Px = getYPosPx(state2.position, obj2Size);

  // Generate ruler tick marks
  const tickInterval = env.height <= 20 ? 5 : env.height <= 50 ? 10 : env.height <= 100 ? 20 : 50;
  const rulerTicks: number[] = [];
  for (let h = 0; h <= env.height; h += tickInterval) {
    rulerTicks.push(h);
  }
  if (!rulerTicks.includes(env.height)) rulerTicks.push(env.height);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-2xl flex select-none"
    >
      {/* Background Vacuum Chamber / Atmosphere Grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Vacuum Glass Chamber Accent glow if vacuum */}
      {env.atmosphereMode === 'vacuum' && (
        <div className="absolute inset-0 pointer-events-none border-2 border-amber-500/30 rounded-2xl shadow-[inset_0_0_40px_rgba(245,158,11,0.1)] flex items-start justify-center pt-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-300/80 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/40">
            ⚡ Vacuum Chamber Active • Zero Atmospheric Drag
          </span>
        </div>
      )}

      {/* 1. Left Vertical Height Ruler */}
      <div className="w-14 h-full border-r border-white/10 relative z-10 flex flex-col justify-between py-2 pl-2 pr-1 font-mono text-[10px] text-slate-500 select-none">
        {rulerTicks.map((tickVal) => {
          const topPx = (tickVal / env.height) * usableHeightPx;
          return (
            <div
              key={tickVal}
              className="absolute left-0 w-full flex items-center justify-between pr-1"
              style={{ top: `${topPx}px` }}
            >
              <div className="w-2.5 h-[1px] bg-white/20" />
              <span className="text-[9px] font-bold text-slate-400">
                {env.height - tickVal}m
              </span>
            </div>
          );
        })}
      </div>

      {/* Drop Lane 1: Object 1 (Left Lane / Orange Theme) */}
      <div className="flex-1 h-full relative border-r border-white/5 overflow-hidden">
        {/* Lane Header */}
        <div className="absolute top-2 left-3 z-10 flex items-center gap-1.5 bg-orange-950/60 border border-orange-500/30 px-2.5 py-1 rounded-lg">
          <span className="text-xs">{obj1.icon}</span>
          <span className="text-[10px] font-black text-orange-300 uppercase truncate max-w-[100px]">{obj1.name}</span>
        </div>

        {/* Strobe Trails */}
        {showStrobe && strobePoints1.map((pt, idx) => (
          <div
            key={idx}
            className="absolute left-1/2 -translate-x-1/2 rounded-full border border-dashed border-orange-400/40 bg-orange-500/10 pointer-events-none flex items-center justify-center text-[8px] font-mono text-orange-300"
            style={{
              top: `${getYPosPx(pt.position, obj1Size)}px`,
              width: `${obj1Size * 0.7}px`,
              height: `${obj1Size * 0.7}px`
            }}
          >
            {pt.time.toFixed(1)}s
          </div>
        ))}

        {/* Object 1 Body */}
        <div
          className="absolute left-1/2 -translate-x-1/2 transition-transform duration-75 flex flex-col items-center justify-center z-20"
          style={{
            top: `${pos1Px}px`,
            width: `${obj1Size}px`,
            height: `${obj1Size}px`
          }}
        >
          {/* Sphere Render */}
          <div
            className="w-full h-full rounded-full shadow-lg flex items-center justify-center text-xl relative"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #fb923c, #c2410c)',
              boxShadow: '0 4px 20px rgba(249, 115, 22, 0.4)'
            }}
          >
            <span style={{ fontSize: `${Math.max(12, obj1Size * 0.5)}px` }}>{obj1.icon}</span>
          </div>

          {/* Floating Telemetry Badge */}
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-950/90 border border-orange-500/40 px-2 py-1 rounded-lg text-[9px] font-mono text-slate-200 shadow-md">
            <p className="font-bold text-orange-400">v: {state1.velocity.toFixed(1)} m/s</p>
            <p className="text-slate-400">y: {state1.position.toFixed(1)} m</p>
          </div>

          {/* Force Vectors Overlay */}
          {showVectors && (
            <svg className="absolute overflow-visible pointer-events-none z-30" style={{ width: '1px', height: '1px' }}>
              {/* Gravity Vector Fg (Downward Orange Arrow) */}
              <g>
                <line
                  x1="0"
                  y1={obj1Size / 2}
                  x2="0"
                  y2={obj1Size / 2 + Math.min(80, state1.forceGravity * 1.5 + 20)}
                  stroke="#fb923c"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <polygon
                  points={`0,${obj1Size / 2 + Math.min(80, state1.forceGravity * 1.5 + 20)} -4,${obj1Size / 2 + Math.min(80, state1.forceGravity * 1.5 + 20) - 8} 4,${obj1Size / 2 + Math.min(80, state1.forceGravity * 1.5 + 20) - 8}`}
                  fill="#fb923c"
                />
                <text x="6" y={obj1Size / 2 + 25} fill="#fb923c" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  Fg={state1.forceGravity.toFixed(1)}N
                </text>
              </g>

              {/* Drag Vector Fdrag (Upward Red Arrow) */}
              {state1.forceDrag > 0.05 && (
                <g>
                  <line
                    x1="0"
                    y1={-obj1Size / 2}
                    x2="0"
                    y2={-obj1Size / 2 - Math.min(70, state1.forceDrag * 1.5 + 10)}
                    stroke="#f87171"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <polygon
                    points={`0,${-obj1Size / 2 - Math.min(70, state1.forceDrag * 1.5 + 10)} -4,${-obj1Size / 2 - Math.min(70, state1.forceDrag * 1.5 + 10) + 8} 4,${-obj1Size / 2 - Math.min(70, state1.forceDrag * 1.5 + 10) + 8}`}
                    fill="#f87171"
                  />
                  <text x="6" y={-obj1Size / 2 - 15} fill="#f87171" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    Fd={state1.forceDrag.toFixed(1)}N
                  </text>
                </g>
              )}
            </svg>
          )}
        </div>

        {/* Impact Glow / Particle */}
        {state1.isFinished && (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-2 rounded-full bg-orange-500 animate-ping opacity-75 pointer-events-none"
          />
        )}
      </div>

      {/* Drop Lane 2: Object 2 (Right Lane / Cyan Theme) */}
      <div className="flex-1 h-full relative overflow-hidden">
        {/* Lane Header */}
        <div className="absolute top-2 left-3 z-10 flex items-center gap-1.5 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
          <span className="text-xs">{obj2.icon}</span>
          <span className="text-[10px] font-black text-cyan-300 uppercase truncate max-w-[100px]">{obj2.name}</span>
        </div>

        {/* Strobe Trails */}
        {showStrobe && strobePoints2.map((pt, idx) => (
          <div
            key={idx}
            className="absolute left-1/2 -translate-x-1/2 rounded-full border border-dashed border-cyan-400/40 bg-cyan-500/10 pointer-events-none flex items-center justify-center text-[8px] font-mono text-cyan-300"
            style={{
              top: `${getYPosPx(pt.position, obj2Size)}px`,
              width: `${obj2Size * 0.7}px`,
              height: `${obj2Size * 0.7}px`
            }}
          >
            {pt.time.toFixed(1)}s
          </div>
        ))}

        {/* Object 2 Body */}
        <div
          className="absolute left-1/2 -translate-x-1/2 transition-transform duration-75 flex flex-col items-center justify-center z-20"
          style={{
            top: `${pos2Px}px`,
            width: `${obj2Size}px`,
            height: `${obj2Size}px`
          }}
        >
          {/* Sphere Render */}
          <div
            className="w-full h-full rounded-full shadow-lg flex items-center justify-center text-xl relative"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #38bdf8, #0284c7)',
              boxShadow: '0 4px 20px rgba(56, 189, 248, 0.4)'
            }}
          >
            <span style={{ fontSize: `${Math.max(12, obj2Size * 0.5)}px` }}>{obj2.icon}</span>
          </div>

          {/* Floating Telemetry Badge */}
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-950/90 border border-cyan-500/40 px-2 py-1 rounded-lg text-[9px] font-mono text-slate-200 shadow-md">
            <p className="font-bold text-cyan-400">v: {state2.velocity.toFixed(1)} m/s</p>
            <p className="text-slate-400">y: {state2.position.toFixed(1)} m</p>
          </div>

          {/* Force Vectors Overlay */}
          {showVectors && (
            <svg className="absolute overflow-visible pointer-events-none z-30" style={{ width: '1px', height: '1px' }}>
              {/* Gravity Vector Fg (Downward Cyan Arrow) */}
              <g>
                <line
                  x1="0"
                  y1={obj2Size / 2}
                  x2="0"
                  y2={obj2Size / 2 + Math.min(80, state2.forceGravity * 1.5 + 20)}
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <polygon
                  points={`0,${obj2Size / 2 + Math.min(80, state2.forceGravity * 1.5 + 20)} -4,${obj2Size / 2 + Math.min(80, state2.forceGravity * 1.5 + 20) - 8} 4,${obj2Size / 2 + Math.min(80, state2.forceGravity * 1.5 + 20) - 8}`}
                  fill="#38bdf8"
                />
                <text x="6" y={obj2Size / 2 + 25} fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  Fg={state2.forceGravity.toFixed(1)}N
                </text>
              </g>

              {/* Drag Vector Fdrag (Upward Red Arrow) */}
              {state2.forceDrag > 0.05 && (
                <g>
                  <line
                    x1="0"
                    y1={-obj2Size / 2}
                    x2="0"
                    y2={-obj2Size / 2 - Math.min(70, state2.forceDrag * 1.5 + 10)}
                    stroke="#f87171"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <polygon
                    points={`0,${-obj2Size / 2 - Math.min(70, state2.forceDrag * 1.5 + 10)} -4,${-obj2Size / 2 - Math.min(70, state2.forceDrag * 1.5 + 10) + 8} 4,${-obj2Size / 2 - Math.min(70, state2.forceDrag * 1.5 + 10) + 8}`}
                    fill="#f87171"
                  />
                  <text x="6" y={-obj2Size / 2 - 15} fill="#f87171" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    Fd={state2.forceDrag.toFixed(1)}N
                  </text>
                </g>
              )}
            </svg>
          )}
        </div>

        {/* Impact Glow / Particle */}
        {state2.isFinished && (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-2 rounded-full bg-cyan-500 animate-ping opacity-75 pointer-events-none"
          />
        )}
      </div>

      {/* Ground Platform */}
      <div className="absolute bottom-0 left-0 right-0 h-9 bg-slate-950 border-t-2 border-slate-700 flex items-center justify-between px-4 z-30 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/50" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
            Ground Level (0 m)
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-500">
          Drop Height: {env.height} m
        </div>
      </div>
    </div>
  );
};
