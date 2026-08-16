import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DropObjectConfig,
  EnvironmentConfig,
  PhysicsState,
  SimulationStatus,
  StrobePoint,
  ExperimentTrial,
  AtmosphereMode
} from './types';
import { OBJECT_PRESETS, PLANET_PRESETS, ATMOSPHERE_PRESETS, GUIDED_CHALLENGES } from './constants';
import { stepObjectPhysics } from './services/physicsEngine';
import { Header } from './components/Header';
import { SimulationCanvas } from './components/SimulationCanvas';
import { ObjectControlCard } from './components/ObjectControlCard';
import { EnvironmentControls } from './components/EnvironmentControls';
import { GraphStudio, GraphDataPoint } from './components/GraphStudio';
import { ResultsComparison } from './components/ResultsComparison';
import { MisconceptionGuide } from './components/MisconceptionGuide';

const INITIAL_OBJ1: DropObjectConfig = {
  ...OBJECT_PRESETS.find(p => p.id === 'bowling-ball')!,
  color: '#f97316',
  accentBg: 'rgba(249, 115, 22, 0.15)'
};

const INITIAL_OBJ2: DropObjectConfig = {
  ...OBJECT_PRESETS.find(p => p.id === 'feather')!,
  color: '#38bdf8',
  accentBg: 'rgba(56, 189, 248, 0.15)'
};

const INITIAL_ENV: EnvironmentConfig = {
  height: 100, // 100 meters
  gravity: 10.0, // Earth (standard high school convention)
  planet: 'earth',
  airDensity: 0.0, // Start in Vacuum mode as classic misconception buster!
  atmosphereMode: 'vacuum',
  playbackSpeed: 1.0
};

const INITIAL_PHYSICS_STATE: PhysicsState = {
  time: 0,
  position: 0,
  velocity: 0,
  acceleration: 10.0,
  forceGravity: 0,
  forceDrag: 0,
  forceNet: 0,
  isFinished: false
};

export const App: React.FC = () => {
  const [obj1, setObj1] = useState<DropObjectConfig>(INITIAL_OBJ1);
  const [obj2, setObj2] = useState<DropObjectConfig>(INITIAL_OBJ2);
  const [env, setEnv] = useState<EnvironmentConfig>(INITIAL_ENV);

  const [state1, setState1] = useState<PhysicsState>(INITIAL_PHYSICS_STATE);
  const [state2, setState2] = useState<PhysicsState>(INITIAL_PHYSICS_STATE);

  const [strobePoints1, setStrobePoints1] = useState<StrobePoint[]>([]);
  const [strobePoints2, setStrobePoints2] = useState<StrobePoint[]>([]);
  const [graphHistory, setGraphHistory] = useState<GraphDataPoint[]>([]);

  const [status, setStatus] = useState<SimulationStatus>('idle');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('galileo-vacuum');

  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showStrobe, setShowStrobe] = useState<boolean>(true);
  const [trials, setTrials] = useState<ExperimentTrial[]>([]);

  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const lastStrobeTimeRef = useRef<number>(0);

  // Reset simulation states to initial drop position
  const handleReset = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    lastTimestampRef.current = null;
    lastStrobeTimeRef.current = 0;

    setState1({
      ...INITIAL_PHYSICS_STATE,
      acceleration: env.gravity,
      forceGravity: obj1.mass * env.gravity,
      forceNet: obj1.mass * env.gravity
    });

    setState2({
      ...INITIAL_PHYSICS_STATE,
      acceleration: env.gravity,
      forceGravity: obj2.mass * env.gravity,
      forceNet: obj2.mass * env.gravity
    });

    setStrobePoints1([]);
    setStrobePoints2([]);
    setGraphHistory([
      {
        time: 0,
        pos1: 0,
        vel1: 0,
        acc1: env.gravity,
        pos2: 0,
        vel2: 0,
        acc2: env.gravity
      }
    ]);
    setStatus('idle');
  }, [env.gravity, obj1.mass, obj2.mass]);

  // Handle environment or object param change reset
  useEffect(() => {
    handleReset();
  }, [handleReset, env.height, env.gravity, env.airDensity, obj1.mass, obj1.radius, obj2.mass, obj2.radius]);

  // Toggle quick vacuum mode
  const handleToggleVacuum = () => {
    const nextMode: AtmosphereMode = env.atmosphereMode === 'vacuum' ? 'earth-sea-level' : 'vacuum';
    const nextDensity = ATMOSPHERE_PRESETS[nextMode].density;
    setEnv(prev => ({
      ...prev,
      atmosphereMode: nextMode,
      airDensity: nextDensity
    }));
  };

  // Load Guided Challenge
  const handleSelectChallenge = (challengeId: string) => {
    setSelectedChallengeId(challengeId);
    if (challengeId === 'custom') return;

    const challenge = GUIDED_CHALLENGES.find(c => c.id === challengeId);
    if (challenge) {
      const p1 = OBJECT_PRESETS.find(p => p.id === challenge.obj1PresetId);
      const p2 = OBJECT_PRESETS.find(p => p.id === challenge.obj2PresetId);
      if (p1) setObj1({ ...p1, color: '#f97316', accentBg: 'rgba(249, 115, 22, 0.15)' });
      if (p2) setObj2({ ...p2, color: '#38bdf8', accentBg: 'rgba(56, 189, 248, 0.15)' });

      setEnv(prev => ({
        ...prev,
        height: challenge.height,
        atmosphereMode: challenge.atmosphereMode,
        airDensity: ATMOSPHERE_PRESETS[challenge.atmosphereMode].density,
        planet: challenge.planet,
        gravity: PLANET_PRESETS[challenge.planet].gravity
      }));
    }
  };

  // Main Physics loop
  const stepSimulation = useCallback((timestamp: number) => {
    if (lastTimestampRef.current === null) {
      lastTimestampRef.current = timestamp;
      animationFrameRef.current = requestAnimationFrame(stepSimulation);
      return;
    }

    const rawDelta = (timestamp - lastTimestampRef.current) / 1000;
    lastTimestampRef.current = timestamp;

    // Apply playback speed and clamp max delta to prevent tunneling during lag
    const deltaTime = Math.min(0.05, rawDelta) * env.playbackSpeed;

    let s1 = state1;
    let s2 = state2;

    setState1(prev1 => {
      s1 = stepObjectPhysics(prev1, obj1, env, deltaTime);
      return s1;
    });

    setState2(prev2 => {
      s2 = stepObjectPhysics(prev2, obj2, env, deltaTime);
      return s2;
    });

    const currentTime = Math.max(s1.time, s2.time);

    // Record graph data point at 30Hz
    setGraphHistory(prev => [
      ...prev,
      {
        time: currentTime,
        pos1: s1.position,
        vel1: s1.velocity,
        acc1: s1.acceleration,
        pos2: s2.position,
        vel2: s2.velocity,
        acc2: s2.acceleration
      }
    ]);

    // Record strobe marker points every 0.3 seconds
    if (currentTime - lastStrobeTimeRef.current >= 0.3) {
      lastStrobeTimeRef.current = currentTime;
      if (!s1.isFinished) {
        setStrobePoints1(prev => [...prev, { time: s1.time, position: s1.position, velocity: s1.velocity, acceleration: s1.acceleration }]);
      }
      if (!s2.isFinished) {
        setStrobePoints2(prev => [...prev, { time: s2.time, position: s2.position, velocity: s2.velocity, acceleration: s2.acceleration }]);
      }
    }

    // Check if both objects reached ground
    if (s1.isFinished && s2.isFinished) {
      setStatus('finished');
      animationFrameRef.current = null;
      return;
    }

    animationFrameRef.current = requestAnimationFrame(stepSimulation);
  }, [env, obj1, obj2, state1, state2]);

  // Start Playback
  const handleStart = () => {
    if (status === 'finished') {
      handleReset();
    }
    setStatus('running');
    lastTimestampRef.current = null;
  };

  // Pause Playback
  const handlePause = () => {
    setStatus('paused');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // Effect to manage animation frame
  useEffect(() => {
    if (status === 'running') {
      animationFrameRef.current = requestAnimationFrame(stepSimulation);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [status, stepSimulation]);

  // Save Trial
  const handleSaveTrial = () => {
    if (!state1.isFinished || !state2.isFinished) return;
    const newTrial: ExperimentTrial = {
      id: `trial-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString(),
      height: env.height,
      gravity: env.gravity,
      airDensity: env.airDensity,
      obj1Name: obj1.name,
      obj1Mass: obj1.mass,
      obj1Radius: obj1.radius,
      obj1ImpactTime: state1.impactTime || state1.time,
      obj1ImpactVel: state1.impactVelocity || state1.velocity,
      obj1TerminalVel: 0,
      obj2Name: obj2.name,
      obj2Mass: obj2.mass,
      obj2Radius: obj2.radius,
      obj2ImpactTime: state2.impactTime || state2.time,
      obj2ImpactVel: state2.impactVelocity || state2.velocity,
      obj2TerminalVel: 0,
      timeDelta: Math.abs((state1.impactTime || state1.time) - (state2.impactTime || state2.time))
    };
    setTrials(prev => [newTrial, ...prev]);
  };

  const handleClearTrials = () => setTrials([]);

  const isControlsDisabled = status === 'running';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Header with NGSS standards, challenge selector, and controls */}
      <Header
        atmosphereMode={env.atmosphereMode}
        onToggleVacuum={handleToggleVacuum}
        status={status}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
        selectedChallengeId={selectedChallengeId}
        onSelectChallenge={handleSelectChallenge}
        showVectors={showVectors}
        onToggleVectors={() => setShowVectors(!showVectors)}
        showStrobe={showStrobe}
        onToggleStrobe={() => setShowStrobe(!showStrobe)}
      />

      {/* Main Lab Workspace */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        
        {/* Top Split Layout: Canvas (Center-Left) + Object Cards (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Drop Simulation Canvas (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            <SimulationCanvas
              obj1={obj1}
              obj2={obj2}
              env={env}
              state1={state1}
              state2={state2}
              strobePoints1={strobePoints1}
              strobePoints2={strobePoints2}
              showVectors={showVectors}
              showStrobe={showStrobe}
            />

            {/* Quick Helper / Vector Legend */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 font-mono bg-slate-900/50 p-2 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-orange-400 rounded-full" /> Gravity F<sub>g</sub> (Down)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-400 rounded-full" /> Drag F<sub>drag</sub> (Up)</span>
              </div>
              <span className="text-slate-500 italic">Net Force: F<sub>net</sub> = F<sub>g</sub> - F<sub>drag</sub></span>
            </div>
          </div>

          {/* Object 1 & Object 2 Independent Configuration Cards (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <ObjectControlCard
              label="Object 1"
              objectConfig={obj1}
              onChange={setObj1}
              envConfig={env}
              disabled={isControlsDisabled}
              themeColor="orange"
            />

            <ObjectControlCard
              label="Object 2"
              objectConfig={obj2}
              onChange={setObj2}
              envConfig={env}
              disabled={isControlsDisabled}
              themeColor="cyan"
            />
          </div>

        </div>

        {/* Environment, Gravity, and Medium Controls Bar */}
        <EnvironmentControls
          envConfig={env}
          onChange={setEnv}
          disabled={isControlsDisabled}
        />

        {/* Real-time Multi-Graph Studio */}
        <GraphStudio
          history={graphHistory}
          obj1={obj1}
          obj2={obj2}
          env={env}
          maxTime={Math.max(state1.time, state2.time, 2)}
        />

        {/* Impact Results Comparison & Trial Logger */}
        <ResultsComparison
          obj1={obj1}
          obj2={obj2}
          env={env}
          state1={state1}
          state2={state2}
          trials={trials}
          onSaveTrial={handleSaveTrial}
          onClearTrials={handleClearTrials}
        />

        {/* Interactive Misconception Deep-Dive Guide */}
        <MisconceptionGuide />

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 p-4 text-center text-xs text-slate-500 bg-slate-950/80">
        <p>Mr. Mudry’s Physics Virtual Lab Suite • Dual-Object Free Fall &amp; Terminal Velocity Simulator • NGSS HS-PS2-1 &amp; HS-PS2-2</p>
      </footer>

    </div>
  );
};

export default App;
