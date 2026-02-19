import React, { useState, useEffect, useRef, useMemo } from 'react';
import { INITIAL_POINTS, INITIAL_MASS, GRAVITY, GROUND_Y, PIXELS_PER_METER } from './constants';
import { SimulationState, Point } from './types';
import TrackCanvas from './components/TrackCanvas';
import EnergyCharts from './components/EnergyCharts';
import GeminiTutor from './components/GeminiTutor';
import { pointsToPathSegments, generateTrackLUT, getPhysicsHeight, calculatePhysicsState } from './utils/physicsUtils';
import { Play, Pause, RotateCcw, Settings2, Plus, Minus } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [points, setPoints] = useState<Point[]>(INITIAL_POINTS);
  const [mass, setMass] = useState(INITIAL_MASS);
  const [isPlaying, setIsPlaying] = useState(false);

  // Simulation State
  const [simState, setSimState] = useState<SimulationState>({
    isPlaying: false,
    time: 0,
    cartPositionT: 0,
    direction: 1, // 1 = forward, -1 = backward
    velocity: 0,
    mass: INITIAL_MASS,
    totalEnergy: 0,
    kineticEnergy: 0,
    potentialEnergy: 0,
    height: 0,
    distance: 0,
  });

  // Derived Geometry (memoized for performance)
  const trackGeometry = useMemo(() => {
    const segments = pointsToPathSegments(points);
    // Use 100 samples per segment for the LUT
    const { lut, totalLength } = generateTrackLUT(segments, 100);
    return { segments, lut, totalLength };
  }, [points]);

  // Animation Loop Ref
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();

  // Reset Simulation when track changes or manual reset
  const resetSimulation = () => {
    setIsPlaying(false);

    // Calculate initial potential energy based on start height
    const startHeight = getPhysicsHeight(points[0].y);
    const pe = mass * GRAVITY * startHeight;

    setSimState({
      isPlaying: false,
      time: 0,
      cartPositionT: 0,
      direction: 1,
      velocity: 0,
      mass: mass,
      totalEnergy: pe, // Assuming starts from rest
      kineticEnergy: 0,
      potentialEnergy: pe,
      height: startHeight,
      distance: 0,
    });
  };

  // Add/Remove Point Logic
  const handleAddPoint = () => {
    setPoints((prev) => {
      const lastPoint = prev[prev.length - 1];
      const newX = lastPoint.x + 250; // Add point 250px (6.25m) to the right
      // Default new Y to somewhere in the middle (300)
      const newPoint: Point = { x: newX, y: 300, id: `p-${Date.now()}` };
      return [...prev, newPoint];
    });
  };

  const handleRemovePoint = () => {
    setPoints((prev) => {
      if (prev.length <= 3) return prev; // Keep at least 3 points for a curve
      return prev.slice(0, -1);
    });
  };

  // Manual Progress Slider Handler
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newT = parseFloat(e.target.value);
    setIsPlaying(false); // Pause simulation when manually scrubbing

    // Recalculate physics state for the new position
    // We assume conservation of energy holds from the start point
    const currentPhys = calculatePhysicsState(
      newT,
      trackGeometry.segments,
      simState.totalEnergy,
      simState.mass
    );

    // Approximate distance for charts
    const lutIndex = Math.min(Math.floor(newT * 100), trackGeometry.lut.length - 1);
    const currentDist = trackGeometry.lut[lutIndex]?.dist || 0;

    setSimState(prev => ({
      ...prev,
      isPlaying: false,
      cartPositionT: newT,
      direction: 1, // Reset direction to forward when scrubbing
      velocity: currentPhys.v,
      kineticEnergy: currentPhys.ke,
      potentialEnergy: currentPhys.pe,
      height: currentPhys.height,
      distance: currentDist
    }));
  };

  // Effect to update mass or track changes
  useEffect(() => {
    // Only reset if not playing to avoid jarring jumps, or if mass changes
    if (!isPlaying) {
      resetSimulation();
    }
  }, [mass, points]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute Static Profile for Charts (Pre-calculation)
  const trackEnergyProfile = useMemo(() => {
    const startHeight = getPhysicsHeight(points[0].y);
    const totalE = mass * GRAVITY * startHeight;

    return trackGeometry.lut.map((pt) => {
      const h = getPhysicsHeight(pt.pos.y);
      const pe = mass * GRAVITY * h;
      let ke = totalE - pe;
      if (ke < 0) ke = 0;
      return {
        distance: pt.dist,
        pe,
        ke,
        te: totalE
      };
    });
  }, [trackGeometry, mass, points]);

  // The Physics Loop
  const animate = (time: number) => {
    if (lastTimeRef.current !== undefined) {
      const deltaTime = (time - lastTimeRef.current) / 1000; // seconds

      setSimState((prev) => {
        // 1. Get current position/height to determine velocity
        const currentPhys = calculatePhysicsState(prev.cartPositionT, trackGeometry.segments, prev.totalEnergy, prev.mass);

        // Handle Velocity & Direction
        let v = currentPhys.v;
        let direction = prev.direction;

        // "Kickstart" / Direction Logic at low speeds (Turnaround or Start)
        if (v < 0.5) {
          // Look at slope (derivative.y)
          // derivative.y > 0 means visual Y increases (Height decreases) as T increases. This is a Downhill slope in Forward direction.
          // derivative.y < 0 means visual Y decreases (Height increases) as T increases. This is an Uphill slope in Forward direction.
          const slope = currentPhys.derivative.y;

          // If slope is significant enough to cause movement
          if (Math.abs(slope) > 0.05) {
            // If slope > 0 (Downhill), we want to go Forward (1)
            // If slope < 0 (Uphill), we want to go Backward (-1)
            direction = slope > 0 ? 1 : -1;

            // Apply small kickstart velocity to initiate movement from the stop
            v = 0.5;
          } else {
            // Flat peak/valley, effectively stopped
            v = 0;
          }
        }

        // 2. Calculate movement distance based on velocity
        // We need pixels per second: v * PIXELS_PER_METER
        const pxPerSec = v * PIXELS_PER_METER;

        // 3. Convert distance to 't' parameter change
        // We use the tangent magnitude at current point to map pixel distance to t-space
        const tangentMag = Math.sqrt(currentPhys.derivative.x ** 2 + currentPhys.derivative.y ** 2);
        const safeTangentMag = tangentMag > 1 ? tangentMag : 1;

        const dt = (pxPerSec * deltaTime) / safeTangentMag;

        // Apply direction to the delta T
        let nextT = prev.cartPositionT + (direction * dt);

        // 4. Boundary & Energy Checks

        // A. Start/End of Track Limits
        if (nextT <= 0) {
          nextT = 0;
          // If we hit the start wall, ensure we can roll forward if slope permits
          if (direction === -1) direction = 1;
        } else if (nextT >= points.length - 1 - 0.05) {
          setIsPlaying(false);
          return prev;
        }

        // B. Energy Barrier Check (Lookahead)
        // Check if the next position requires more energy than we have (i.e., PE > TE)
        const nextPhys = calculatePhysicsState(nextT, trackGeometry.segments, prev.totalEnergy, prev.mass);

        // Tolerance of 0.1J/m roughly to prevent floating point jitter at peaks
        if (nextPhys.pe > prev.totalEnergy + 0.1) {
          // We tried to go higher than allowed.
          // Reverse direction!
          direction = -direction;
          nextT = prev.cartPositionT; // Stay put this frame
        }

        // Lookup approximate distance for the chart X-axis
        const lutIndex = Math.min(Math.floor(nextT * 100), trackGeometry.lut.length - 1);
        const currentDist = trackGeometry.lut[lutIndex]?.dist || prev.distance;

        return {
          ...prev,
          time: prev.time + deltaTime,
          cartPositionT: nextT,
          direction: direction,
          velocity: v,
          kineticEnergy: currentPhys.ke,
          potentialEnergy: currentPhys.pe,
          height: currentPhys.height,
          distance: currentDist
        };
      });
    }
    lastTimeRef.current = time;
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      lastTimeRef.current = undefined;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, [isPlaying, trackGeometry]);

  return (
    <div className="min-h-screen lg:h-screen bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center shadow-md z-10 shrink-0">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            CoasterPhysics <span className="text-slate-400 font-light text-lg">Energy Lab</span>
          </h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
            <span className="font-mono text-yellow-500">g = {GRAVITY} m/s²</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* Left Column: Visuals & Controls */}
        <div className="flex-1 flex flex-col gap-4 p-4 lg:p-6 min-w-0 overflow-y-auto lg:overflow-hidden">
          {/* Toolbar */}
          <div className="shrink-0 flex flex-wrap items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${isPlaying
                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/50'
                    : 'bg-green-500 text-slate-900 hover:bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                  }`}
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                {isPlaying ? 'PAUSE' : 'START RUN'}
              </button>

              <button
                onClick={resetSimulation}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Reset Simulation"
              >
                <RotateCcw size={20} />
              </button>
            </div>

            {/* Progress Slider */}
            <div className="flex-1 px-4 min-w-[150px] flex flex-col justify-center">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Track Position</span>
                <span className="text-[10px] font-mono text-slate-400">{simState.distance.toFixed(1)}m</span>
              </div>
              <input
                type="range"
                min="0"
                max={points.length - 1 - 0.001}
                step="0.01"
                value={simState.cartPositionT}
                onChange={handleProgressChange}
                className="w-full" // styling is now handled in index.html, layout only here
              />
            </div>

            <div className="flex items-center gap-6 border-l border-slate-700 pl-6">
              {/* Track Length Controls */}
              <div className="flex flex-col gap-1 items-center">
                <label className="text-xs text-slate-500 uppercase font-semibold">Track Length</label>
                <div className="flex gap-1 bg-slate-900 rounded-lg p-1 border border-slate-700">
                  <button
                    onClick={handleRemovePoint}
                    disabled={points.length <= 3}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Remove Segment"
                  >
                    <Minus size={16} />
                  </button>
                  <button
                    onClick={handleAddPoint}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                    title="Add Segment"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="w-px h-8 bg-slate-700"></div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 uppercase font-semibold">Cart Mass (kg)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="10"
                    value={mass}
                    onChange={(e) => setMass(Number(e.target.value))}
                    className="w-32"
                  />
                  <span className="font-mono w-12 text-right">{mass}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas (Flex Grow to fill space) */}
          <div className="flex-1 min-h-[250px] relative">
            <TrackCanvas
              simulationState={simState}
              setSimulationState={setSimState}
              points={points}
              setPoints={setPoints}
              isDraggingAllowed={!isPlaying}
            />
          </div>

          {/* Graphs Area (Fixed height) */}
          <div className="shrink-0 h-[240px] lg:h-[280px]">
            <EnergyCharts simulationState={simState} trackEnergyProfile={trackEnergyProfile} />
          </div>
        </div>

        {/* Right Column: AI & Analysis */}
        <div className="w-full lg:w-80 flex flex-col gap-4 p-4 lg:p-6 lg:pl-0 border-t lg:border-t-0 lg:border-l border-slate-700 bg-slate-900/50 overflow-y-auto lg:overflow-hidden">
          <div className="flex-1 min-h-[300px]">
            <GeminiTutor simulationState={simState} />
          </div>

          {/* Static Info Card */}
          <div className="shrink-0 bg-slate-800 p-4 rounded-xl border border-slate-700 text-sm text-slate-400">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <Settings2 size={16} /> Key Concepts
            </h3>
            <ul className="space-y-2 list-disc pl-4">
              <li><span className="text-blue-400">Potential Energy (PE)</span> depends on height. Max at highest peak.</li>
              <li><span className="text-orange-400">Kinetic Energy (KE)</span> depends on speed. Max at lowest point.</li>
              <li><span className="text-green-400">Total Energy (TE)</span> remains constant (Conservation of Energy).</li>
            </ul>
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;