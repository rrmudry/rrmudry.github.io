import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationParams, SimulationState, SimulationStatus, Location } from './types';
import Simulation from './components/Simulation';
import Controls from './components/Controls';
import DataDisplay from './components/DataDisplay';
import ResultsSummary from './components/ResultsSummary';

const INITIAL_PARAMS: SimulationParams = {
  height: 100, // meters
  mass: 1,     // kg
  radius: 0.1,  // meters
  airDensity: 0, // kg/m^3 - Start with no air resistance
  gravity: 10, // m/s^2
};

const INITIAL_STATE: SimulationState = {
  time: 0,
  position: 0,
  velocity: 0,
};

const App: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>(INITIAL_PARAMS);
  // State for the simulation without air resistance
  const [simStateNoAir, setSimStateNoAir] = useState<SimulationState>(INITIAL_STATE);
  const [trailPositionsNoAir, setTrailPositionsNoAir] = useState<SimulationState[]>([]);
  
  // State for the simulation with air resistance (in comparison mode)
  const [simStateWithAir, setSimStateWithAir] = useState<SimulationState>(INITIAL_STATE);
  const [trailPositionsWithAir, setTrailPositionsWithAir] = useState<SimulationState[]>([]);

  const [status, setStatus] = useState<SimulationStatus>('idle');
  const [location, setLocation] = useState<Location>('earth');
  const [isComparisonMode, setIsComparisonMode] = useState<boolean>(false);

  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const lastTrailTimeRef = useRef<number>(0);
  const finishedStates = useRef<Record<string, boolean>>({ noAir: false, withAir: false });


  const resetSimulation = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    setSimStateNoAir(INITIAL_STATE);
    setTrailPositionsNoAir([]);
    setSimStateWithAir(INITIAL_STATE);
    setTrailPositionsWithAir([]);
    setStatus('idle');
    lastTimeRef.current = null;
    lastTrailTimeRef.current = 0;
    finishedStates.current = { noAir: false, withAir: false };
  }, []);

  const handleLocationChange = (newLocation: Location) => {
    if (status !== 'idle') return;
    setLocation(newLocation);
    setIsComparisonMode(false); 
    if (newLocation === 'earth') {
      setParams(prev => ({ ...prev, gravity: 10, airDensity: 0 }));
    } else { // moon
      setParams(prev => ({ ...prev, gravity: 1.5, airDensity: 0 }));
    }
    resetSimulation();
  };
  
  const handleToggleComparisonMode = () => {
    if (status !== 'idle' || location === 'moon') return;
    const newMode = !isComparisonMode;
    setIsComparisonMode(newMode);
    setParams(prev => ({
      ...prev,
      airDensity: newMode ? 1.225 : 0,
    }));
    resetSimulation();
  };

  const runSimulation = useCallback((timestamp: number) => {
    if (lastTimeRef.current === null) {
      lastTimeRef.current = timestamp;
      animationFrameId.current = requestAnimationFrame(runSimulation);
      return;
    }

    const deltaTime = (timestamp - lastTimeRef.current) / 1000; // in seconds
    lastTimeRef.current = timestamp;

    const calculateNextState = (prevState: SimulationState, useAirResistance: boolean): SimulationState => {
      // Physics Constants
      const DRAG_COEFFICIENT = 0.47; // for a sphere
      const area = Math.PI * params.radius * params.radius;
      const effectiveAirDensity = useAirResistance ? params.airDensity : 0;

      // Forces
      const forceGravity = params.mass * params.gravity;
      const forceDrag = 0.5 * effectiveAirDensity * prevState.velocity * prevState.velocity * DRAG_COEFFICIENT * area;
      
      const netForce = forceGravity - forceDrag;
      const acceleration = netForce / params.mass;
      
      const newVelocity = prevState.velocity + acceleration * deltaTime;
      const newPosition = prevState.position + prevState.velocity * deltaTime + 0.5 * acceleration * deltaTime * deltaTime;
      const newTime = prevState.time + deltaTime;

      return { time: newTime, position: newPosition, velocity: newVelocity };
    };

    // Use the time from the object that is still running to drive trail generation.
    // This ensures time keeps advancing even if one object has finished.
    const currentTimeForTrailCheck = isComparisonMode && finishedStates.current.noAir 
      ? simStateWithAir.time 
      : simStateNoAir.time;
    const newTimeForTrailCheck = currentTimeForTrailCheck + deltaTime;
    
    // Create trails if needed
    const TRAIL_INTERVAL = 0.5;
    while (newTimeForTrailCheck >= lastTrailTimeRef.current + TRAIL_INTERVAL) {
      const trailTime = lastTrailTimeRef.current + TRAIL_INTERVAL;
      lastTrailTimeRef.current = trailTime;

      const interpolateState = (startState: SimulationState, useAirResistance: boolean) => {
          const effectiveAirDensity = useAirResistance ? params.airDensity : 0;
          const DRAG_COEFFICIENT = 0.47;
          const area = Math.PI * params.radius * params.radius;
          const forceGravity = params.mass * params.gravity;
          const forceDrag = 0.5 * effectiveAirDensity * startState.velocity * startState.velocity * DRAG_COEFFICIENT * area;
          const acceleration = (forceGravity - forceDrag) / params.mass;
          const timeSinceLastState = trailTime - startState.time;
          const interpolatedVelocity = startState.velocity + acceleration * timeSinceLastState;
          const interpolatedPosition = startState.position + (startState.velocity * timeSinceLastState) + (0.5 * acceleration * timeSinceLastState * timeSinceLastState);
          return { time: trailTime, position: interpolatedPosition, velocity: interpolatedVelocity };
      };

      if (!finishedStates.current.noAir) {
          const interpolated = interpolateState(simStateNoAir, false);
          if (interpolated.position <= params.height) {
              setTrailPositionsNoAir(prev => [...prev, interpolated]);
          }
      }
      if (isComparisonMode && !finishedStates.current.withAir) {
          const interpolated = interpolateState(simStateWithAir, true);
          if (interpolated.position <= params.height) {
              setTrailPositionsWithAir(prev => [...prev, interpolated]);
          }
      }
    }

    // Update main states
    if (!finishedStates.current.noAir) {
      setSimStateNoAir(prevState => {
        const nextState = calculateNextState(prevState, false);
        if (nextState.position >= params.height) {
          finishedStates.current.noAir = true;
          return { ...prevState, position: params.height, time: nextState.time };
        }
        return nextState;
      });
    }

    if (isComparisonMode && !finishedStates.current.withAir) {
      setSimStateWithAir(prevState => {
        const nextState = calculateNextState(prevState, true);
        if (nextState.position >= params.height) {
          finishedStates.current.withAir = true;
          return { ...prevState, position: params.height, time: nextState.time };
        }
        return nextState;
      });
    }
    
    // Check if simulation should end
    const bothFinished = finishedStates.current.noAir && (isComparisonMode ? finishedStates.current.withAir : true);
    if (bothFinished) {
      setStatus('finished');
    } else {
      animationFrameId.current = requestAnimationFrame(runSimulation);
    }

  }, [params, isComparisonMode, simStateNoAir, simStateWithAir]);

  useEffect(() => {
    if (status === 'running') {
      lastTimeRef.current = null;
      animationFrameId.current = requestAnimationFrame(runSimulation);
    } else if (status === 'paused' || status === 'finished' || status === 'idle') {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    }
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [status, runSimulation]);

  const handleStart = () => {
    if (status === 'idle') {
      setTrailPositionsNoAir([INITIAL_STATE]);
      if (isComparisonMode) {
        setTrailPositionsWithAir([INITIAL_STATE]);
      }
      lastTrailTimeRef.current = 0;
      finishedStates.current = { noAir: false, withAir: false };
    }
    if (status === 'idle' || status === 'paused') {
      setStatus('running');
    }
  };

  const handlePause = () => {
    if (status === 'running') {
      setStatus('paused');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            Free Fall <span className="text-cyan-400">Virtual Lab</span>
          </h1>
          <p className="mt-2 max-w-md mx-auto text-base text-slate-400 sm:text-lg md:mt-4 md:text-xl md:max-w-3xl">
            Experiment with the physics of falling objects. Adjust the parameters and see what happens!
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col lg:flex-row gap-8">
            <div className="flex-grow aspect-w-1 aspect-h-2 md:aspect-h-1 lg:aspect-h-2 xl:h-[65vh] lg:order-2">
              <Simulation 
                position={simStateNoAir.position} 
                trailPositions={trailPositionsNoAir}
                params={params} 
                location={location} 
                status={status}
                isComparisonMode={isComparisonMode}
                position2={simStateWithAir.position}
                trailPositions2={trailPositionsWithAir}
              />
            </div>
            <div className="lg:order-1 lg:w-48 flex flex-col gap-4 justify-start">
                {isComparisonMode ? (
                  <>
                    <div>
                      <h3 className="text-center text-sm font-semibold text-slate-400 mb-2">No Air Resistance</h3>
                      <DataDisplay state={simStateNoAir} />
                    </div>
                     <div>
                      <h3 className="text-center text-sm font-semibold text-slate-400 mb-2">With Air Resistance</h3>
                      <DataDisplay state={simStateWithAir} />
                    </div>
                  </>
                ) : (
                  <div>
                    <h3 className="text-center text-sm font-semibold text-slate-400 mb-2">
                      {location === 'earth' ? 'No Air Resistance' : 'In Vacuum'}
                    </h3>
                    <DataDisplay state={simStateNoAir} />
                  </div>
                )}
            </div>
          </div>
          <div className="lg:col-span-1 flex flex-col gap-4">
              <Controls 
                params={params} 
                setParams={setParams}
                status={status}
                onStart={handleStart}
                onPause={handlePause}
                onReset={resetSimulation}
                location={location}
                onLocationChange={handleLocationChange}
                isComparisonMode={isComparisonMode}
                onToggleComparisonMode={handleToggleComparisonMode}
              />
              <ResultsSummary 
                params={params} 
                state={simStateNoAir}
                stateWithAir={isComparisonMode ? simStateWithAir : null}
                status={status} 
                location={location} 
              />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
