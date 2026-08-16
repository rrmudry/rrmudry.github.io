import React, { useRef, useEffect, useState } from 'react';
import { DropObjectConfig, EnvironmentConfig, PhysicsState, StrobePoint, PlanetLocation } from '../types';

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
  const [canvasHeight, setCanvasHeight] = useState<number>(540);

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

  const headerHeightPx = 76; // 44px top status bar + 32px lane headers
  const groundPaddingPx = 36; // 36px ground floor
  const usableHeightPx = Math.max(120, canvasHeight - headerHeightPx - groundPaddingPx);
  const pixelsPerMeter = usableHeightPx / Math.max(5, env.height);

  // Scaled object size in pixels
  const getObjectSizePx = (radiusMeters: number): number => {
    const rawPx = radiusMeters * 2 * pixelsPerMeter * 8;
    return Math.max(24, Math.min(76, rawPx));
  };

  const obj1Size = getObjectSizePx(obj1.radius);
  const obj2Size = getObjectSizePx(obj2.radius);

  // Position from top of the drop zone in pixels
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

  // Planetary Background and Ground Styles
  const getPlanetBackground = (planet: PlanetLocation) => {
    switch (planet) {
      case 'moon':
        return {
          sky: 'from-black via-slate-950 to-slate-900',
          groundBg: 'bg-gradient-to-t from-slate-800 to-slate-600 border-slate-500',
          groundText: 'text-slate-200',
          badge: '🌙 Moon (1.6 m/s²)',
          starField: true,
          earthInSky: true
        };
      case 'mars':
        return {
          sky: 'from-amber-950 via-orange-950 to-red-950/80',
          groundBg: 'bg-gradient-to-t from-red-950 to-red-800 border-orange-700',
          groundText: 'text-orange-200',
          badge: '🪐 Mars (3.7 m/s²)',
          starField: false,
          earthInSky: false
        };
      case 'jupiter':
        return {
          sky: 'from-amber-950 via-yellow-950 to-orange-950',
          groundBg: 'bg-gradient-to-t from-slate-950 via-slate-900 to-slate-800 border-amber-500',
          groundText: 'text-amber-200',
          badge: '⭐ Jupiter (24.8 m/s²)',
          starField: false,
          earthInSky: false
        };
      case 'custom':
        return {
          sky: 'from-indigo-950 via-purple-950 to-slate-950',
          groundBg: 'bg-gradient-to-t from-indigo-950 to-indigo-800 border-indigo-500',
          groundText: 'text-indigo-200',
          badge: `🛸 Custom (${env.gravity.toFixed(1)} m/s²)`,
          starField: true,
          earthInSky: false
        };
      case 'earth':
      default:
        return {
          sky: 'from-sky-950 via-slate-900 to-slate-950',
          groundBg: 'bg-gradient-to-t from-emerald-950 to-emerald-800 border-emerald-600',
          groundText: 'text-emerald-200',
          badge: '🌍 Earth (10.0 m/s²)',
          starField: false,
          earthInSky: false
        };
    }
  };

  const theme = getPlanetBackground(env.planet);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[540px] rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b ${theme.sky} shadow-2xl flex flex-col select-none`}
    >
      {/* 1. Celestial Backdrop Elements (Moon stars, Earth in sky, Mars dunes, Jupiter clouds) */}
      {theme.starField && (
        <div className="absolute inset-0 pointer-events-none opacity-70">
          <div className="absolute top-16 left-20 w-1 h-1 bg-white rounded-full shadow-[0_0_4px_#fff]" />
          <div className="absolute top-28 left-64 w-1.5 h-1.5 bg-cyan-200 rounded-full shadow-[0_0_6px_#38bdf8]" />
          <div className="absolute top-44 right-32 w-1 h-1 bg-white rounded-full opacity-60" />
          <div className="absolute top-20 right-64 w-1 h-1 bg-amber-100 rounded-full opacity-80" />
          <div className="absolute top-64 left-36 w-0.5 h-0.5 bg-white rounded-full" />
          <div className="absolute top-80 right-20 w-1 h-1 bg-white rounded-full" />
        </div>
      )}

      {theme.earthInSky && (
        <div className="absolute top-20 right-8 pointer-events-none opacity-80 flex flex-col items-center z-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 via-emerald-400 to-indigo-900 shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-300/40 relative overflow-hidden">
            <div className="absolute top-2 left-1 w-5 h-1.5 bg-white/40 rounded-full blur-[1px]" />
            <div className="absolute bottom-2 right-1.5 w-6 h-2 bg-white/30 rounded-full blur-[1px]" />
          </div>
          <span className="text-[7px] font-mono text-cyan-300/80 mt-0.5 uppercase tracking-widest">Earth</span>
        </div>
      )}

      {env.planet === 'mars' && (
        <div className="absolute bottom-9 left-0 right-0 h-24 pointer-events-none opacity-30 z-0">
          <svg viewBox="0 0 500 100" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,80 Q120,30 250,70 T500,60 L500,100 L0,100 Z" fill="#991b1b" />
            <path d="M0,90 Q200,40 380,85 T500,75 L500,100 L0,100 Z" fill="#7f1d1d" opacity="0.6" />
          </svg>
        </div>
      )}

      {env.planet === 'jupiter' && (
        <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-col justify-between py-16 z-0">
          <div className="h-6 w-full bg-amber-500/30 blur-md transform -skew-y-1" />
          <div className="h-10 w-full bg-orange-600/30 blur-lg transform skew-y-1" />
          <div className="h-8 w-full bg-yellow-600/20 blur-md" />
        </div>
      )}

      {/* 2. Top Canvas Unified Status Header Bar (No overlapping!) */}
      <div className="h-11 bg-slate-950/90 backdrop-blur-md border-b border-white/10 px-3 flex items-center justify-between z-30 flex-shrink-0">
        
        {/* Left: Location Badge */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-white/15 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-200 shadow-sm">
          <span>{theme.badge}</span>
        </div>

        {/* Center: Vacuum / Atmosphere Mode Pill */}
        {env.atmosphereMode === 'vacuum' ? (
          <div className="flex items-center gap-2 bg-cyan-950/80 border border-cyan-500/50 px-3 py-1 rounded-full text-[10px] font-mono text-cyan-300 shadow-md shadow-cyan-950/50">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-black uppercase tracking-wide">⚡ Vacuum Chamber Active</span>
            <span className="text-cyan-400/80 text-[9px] hidden sm:inline">(0.000 Torr • Zero Drag)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-white/10 px-3 py-1 rounded-full text-[10px] font-mono text-slate-300">
            <span>🌬️ Atmosphere Active</span>
            <span className="text-slate-400 text-[9px]">(ρ = {env.airDensity.toFixed(3)} kg/m³)</span>
          </div>
        )}

        {/* Right: Height Indicator */}
        <div className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 border border-white/10 px-2 py-1 rounded-lg">
          h = {env.height} m
        </div>
      </div>

      {/* 3. Object Lane Header Shelf (Fixed 32px height, perfectly separated) */}
      <div className="h-8 bg-slate-950/60 border-b border-white/5 flex z-20 flex-shrink-0">
        {/* Left ruler spacer */}
        <div className="w-14 border-r border-white/10" />

        {/* Object 1 Lane Header */}
        <div className="flex-1 border-r border-white/10 px-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">{obj1.icon}</span>
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider truncate max-w-[120px]">
              {obj1.name} (Obj 1)
            </span>
          </div>
          <span className="text-[9px] font-mono text-orange-300/80">
            {obj1.mass < 0.1 ? `${(obj1.mass * 1000).toFixed(0)}g` : `${obj1.mass.toFixed(1)}kg`}
          </span>
        </div>

        {/* Object 2 Lane Header */}
        <div className="flex-1 px-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">{obj2.icon}</span>
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider truncate max-w-[120px]">
              {obj2.name} (Obj 2)
            </span>
          </div>
          <span className="text-[9px] font-mono text-cyan-300/80">
            {obj2.mass < 0.1 ? `${(obj2.mass * 1000).toFixed(0)}g` : `${obj2.mass.toFixed(1)}kg`}
          </span>
        </div>
      </div>

      {/* 4. Drop Zone Canvas (Ruler + Lanes) */}
      <div className="relative flex-1 flex overflow-hidden">
        
        {/* Vertical Height Ruler */}
        <div className="w-14 h-full border-r border-white/10 relative z-20 flex flex-col justify-between py-1 pl-2 pr-1 font-mono text-[10px] text-slate-400 select-none bg-slate-950/40 backdrop-blur-xs">
          {rulerTicks.map((tickVal) => {
            const topPx = (tickVal / env.height) * usableHeightPx;
            return (
              <div
                key={tickVal}
                className="absolute left-0 w-full flex items-center justify-between pr-1"
                style={{ top: `${topPx}px` }}
              >
                <div className="w-2 h-[1px] bg-white/30" />
                <span className="text-[8px] font-bold text-slate-300">
                  {env.height - tickVal}m
                </span>
              </div>
            );
          })}
        </div>

        {/* Drop Lane 1: Object 1 (Left Lane / Orange Theme) */}
        <div className="flex-1 h-full relative border-r border-white/10 overflow-hidden">
          
          {/* Strobe Trails */}
          {showStrobe && strobePoints1.map((pt, idx) => (
            <div
              key={idx}
              className="absolute left-1/2 -translate-x-1/2 rounded-full border border-dashed border-orange-400/50 bg-orange-500/15 pointer-events-none flex items-center justify-center text-[8px] font-mono text-orange-200 backdrop-blur-xs"
              style={{
                top: `${getYPosPx(pt.position, obj1Size)}px`,
                width: `${obj1Size * 0.75}px`,
                height: `${obj1Size * 0.75}px`
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
              className="w-full h-full rounded-full shadow-2xl flex items-center justify-center text-xl relative"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #fb923c, #c2410c)',
                boxShadow: '0 6px 25px rgba(249, 115, 22, 0.5)'
              }}
            >
              <span style={{ fontSize: `${Math.max(12, obj1Size * 0.5)}px` }}>{obj1.icon}</span>
            </div>

            {/* Floating Telemetry Badge */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-950/90 border border-orange-500/40 px-2 py-1 rounded-lg text-[9px] font-mono text-slate-200 shadow-xl backdrop-blur-md">
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

          {/* Impact Particle Burst */}
          {state1.isFinished && (
            <div
              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-2 rounded-full bg-orange-500 animate-ping opacity-75 pointer-events-none"
            />
          )}
        </div>

        {/* Drop Lane 2: Object 2 (Right Lane / Cyan Theme) */}
        <div className="flex-1 h-full relative overflow-hidden">
          
          {/* Strobe Trails */}
          {showStrobe && strobePoints2.map((pt, idx) => (
            <div
              key={idx}
              className="absolute left-1/2 -translate-x-1/2 rounded-full border border-dashed border-cyan-400/50 bg-cyan-500/15 pointer-events-none flex items-center justify-center text-[8px] font-mono text-cyan-200 backdrop-blur-xs"
              style={{
                top: `${getYPosPx(pt.position, obj2Size)}px`,
                width: `${obj2Size * 0.75}px`,
                height: `${obj2Size * 0.75}px`
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
              className="w-full h-full rounded-full shadow-2xl flex items-center justify-center text-xl relative"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #38bdf8, #0284c7)',
                boxShadow: '0 6px 25px rgba(56, 189, 248, 0.5)'
              }}
            >
              <span style={{ fontSize: `${Math.max(12, obj2Size * 0.5)}px` }}>{obj2.icon}</span>
            </div>

            {/* Floating Telemetry Badge */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-950/90 border border-cyan-500/40 px-2 py-1 rounded-lg text-[9px] font-mono text-slate-200 shadow-xl backdrop-blur-md">
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

          {/* Impact Particle Burst */}
          {state2.isFinished && (
            <div
              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-2 rounded-full bg-cyan-500 animate-ping opacity-75 pointer-events-none"
            />
          )}
        </div>

      </div>

      {/* 5. Planetary Ground Surface Platform */}
      <div className={`h-9 ${theme.groundBg} border-t-2 flex items-center justify-between px-4 z-30 shadow-2xl backdrop-blur-md flex-shrink-0`}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/50" />
          <span className={`text-[10px] font-black uppercase tracking-wider font-mono ${theme.groundText}`}>
            {env.planet === 'moon' && '🌙 Lunar Regolith (0 m)'}
            {env.planet === 'mars' && '🪐 Martian Iron Sands (0 m)'}
            {env.planet === 'jupiter' && '⭐ Aerostat Landing Deck (0 m)'}
            {env.planet === 'earth' && '🌍 Earth Ground (0 m)'}
            {env.planet === 'custom' && '🛸 Magnetic Landing Pad (0 m)'}
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-300 font-bold">
          Drop Zone: 0 m (Ground)
        </div>
      </div>
    </div>
  );
};
