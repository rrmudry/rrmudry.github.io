
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SimulationCanvas } from './components/SimulationCanvas';
import { SimulationData, SummaryData, SimulationState, Point, ProjectedMetrics, ViewState, PathData } from './types';
import { GRAVITY } from './constants';

const ControlPanel = ({ initialSpeed, setInitialSpeed, launchAngle, setLaunchAngle, onLaunch, onReset, onResetView, simulationState }: {
  initialSpeed: number, setInitialSpeed: (v: number) => void, launchAngle: number, setLaunchAngle: (a: number) => void, onLaunch: () => void, onReset: () => void, onResetView: () => void, simulationState: SimulationState
}) => (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <h2 className="text-xl font-bold text-slate-700 border-b pb-2">Controls</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="speed" className="block text-sm font-medium text-slate-600">Initial Launch Speed: <span className="font-bold text-indigo-600">{initialSpeed.toFixed(1)} m/s</span></label>
          <input type="range" id="speed" min="1" max="100" value={initialSpeed} onChange={(e) => setInitialSpeed(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" disabled={simulationState === 'running'} />
        </div>
        <div>
          <label htmlFor="angle" className="block text-sm font-medium text-slate-600">Launch Angle: <span className="font-bold text-indigo-600">{launchAngle.toFixed(1)}°</span></label>
          <input type="range" id="angle" min="0" max="90" value={launchAngle} onChange={(e) => setLaunchAngle(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" disabled={simulationState === 'running'} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-2">
        <button onClick={onLaunch} className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-300 disabled:bg-slate-400 col-span-2" disabled={simulationState === 'running'}>
          Launch
        </button>
        <button onClick={onReset} className="w-full bg-slate-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-600 transition duration-300">
          Reset All
        </button>
        <button onClick={onResetView} className="w-full bg-gray-200 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-300">
          Reset View
        </button>
      </div>
    </div>
);

const DataDisplay = ({ simulationData, summaryData }: { simulationData: SimulationData | null, summaryData: SummaryData | null }) => (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-4 font-mono">
        <h3 className="font-sans text-lg font-bold text-slate-700 border-b pb-2">Real-Time Data</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span className="text-slate-500">Time (s):</span> <span className="text-right text-indigo-600">{simulationData?.time.toFixed(2) || '0.00'}</span>
            <span className="text-slate-500">X (m):</span> <span className="text-right text-indigo-600">{simulationData?.x.toFixed(2) || '0.00'}</span>
            <span className="text-slate-500">Y (m):</span> <span className="text-right text-indigo-600">{simulationData?.y.toFixed(2) || '0.00'}</span>
            <span className="text-slate-500">Vx (m/s):</span> <span className="text-right text-orange-600">{simulationData?.vx.toFixed(2) || '0.00'}</span>
            <span className="text-slate-500">Vy (m/s):</span> <span className="text-right text-purple-600">{simulationData?.vy.toFixed(2) || '0.00'}</span>
        </div>
        {summaryData && (
            <>
                <h3 className="font-sans text-lg font-bold text-slate-700 border-b pt-4 pb-2">Flight Summary</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <span className="text-slate-500">Max Height (m):</span> <span className="text-right text-indigo-600">{summaryData.maxHeight.toFixed(2)}</span>
                    <span className="text-slate-500">Range (m):</span> <span className="text-right text-indigo-600">{summaryData.range.toFixed(2)}</span>
                    <span className="text-slate-500">Flight Time (s):</span> <span className="text-right text-indigo-600">{summaryData.flightTime.toFixed(2)}</span>
                </div>
            </>
        )}
    </div>
);

const EducationalText = ({ vox, voy }: { vox: number, voy: number }) => (
    <div className="bg-white p-6 rounded-lg shadow-md col-span-1 lg:col-span-2">
        <h2 className="text-xl font-bold text-slate-700 mb-2">Understanding the Physics</h2>
        <div className="text-slate-600 space-y-4 text-base">
            <p>
                Projectile motion is governed by gravity. The key is to analyze the horizontal (x) and vertical (y) components of motion separately. The initial velocity (V) at an angle (θ) is broken down using trigonometry:
                <span className="block text-center font-mono bg-slate-100 p-2 my-2 rounded">
                    v<sub>0x</sub> = V * cos(θ) &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; v<sub>0y</sub> = V * sin(θ)
                </span>
            </p>
            <p>
                Based on your current settings, the initial launch velocity components are:
                <span className="block text-center font-mono bg-slate-100 p-2 my-2 rounded">
                    v<sub>0x</sub> = <span className="text-orange-600 font-bold">{vox.toFixed(2)} m/s</span>
                    &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
                    v<sub>0y</sub> = <span className="text-purple-600 font-bold">{voy.toFixed(2)} m/s</span>
                </span>
            </p>
            <p>
                <strong>Horizontal Velocity (V<sub>x</sub>) is constant</strong> because there are no horizontal forces acting on the projectile (we ignore air resistance). This means horizontal acceleration is zero.
            </p>
            <p>
                <strong>Vertical Velocity (V<sub>y</sub>) changes</strong> due to the constant downward acceleration of gravity (g = 10 m/s²). V<sub>y</sub> decreases as the projectile rises, becomes zero at its maximum height, and then increases in the downward direction as it falls.
            </p>
        </div>
    </div>
);

const INITIAL_VIEW_STATE: ViewState = { zoom: 1, offsetX: 0, offsetY: 0 };

export default function App() {
  const [initialSpeed, setInitialSpeed] = useState(50);
  const [launchAngle, setLaunchAngle] = useState(45);
  const [simulationState, setSimulationState] = useState<SimulationState>('idle');
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [pathPoints, setPathPoints] = useState<Point[]>([]);
  const [pathHistory, setPathHistory] = useState<PathData[]>([]);
  const [projectedMetrics, setProjectedMetrics] = useState<ProjectedMetrics>({ range: 100, maxHeight: 100 });
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [hoverData, setHoverData] = useState<{ x: number, y: number, speed: number, angle: number, range: number } | null>(null);
  const [currentLaunchSettings, setCurrentLaunchSettings] = useState<{ initialSpeed: number, launchAngle: number } | null>(null);

  const animationFrameId = useRef<number | null>(null);
  const simulationStartTime = useRef<number>(0);
  const initialVx = useRef<number>(0);
  const initialVy = useRef<number>(0);

  useEffect(() => {
    const angleInRadians = launchAngle * (Math.PI / 180);
    const v0x = initialSpeed * Math.cos(angleInRadians);
    const v0y = initialSpeed * Math.sin(angleInRadians);

    const flightTime = (2 * v0y) / GRAVITY;
    const range = v0x * flightTime;
    const maxHeight = (v0y ** 2) / (2 * GRAVITY);
    
    setProjectedMetrics({ range: Math.max(range, 10), maxHeight: Math.max(maxHeight, 10) });
    setViewState(INITIAL_VIEW_STATE);
  }, [initialSpeed, launchAngle]);

  const runSimulation = useCallback(() => {
    const animate = (currentTime: number) => {
      const elapsedTime = (currentTime - simulationStartTime.current) / 1000;
      
      const newX = initialVx.current * elapsedTime;
      const newY = initialVy.current * elapsedTime - 0.5 * GRAVITY * elapsedTime * elapsedTime;

      if (newY < 0 && elapsedTime > 0) {
        const finalTime = (2 * initialVy.current) / GRAVITY;
        const finalRange = initialVx.current * finalTime;
        const finalMaxHeight = (initialVy.current * initialVy.current) / (2 * GRAVITY);
        
        setSimulationData({
          time: finalTime,
          x: finalRange,
          y: 0,
          vx: initialVx.current,
          vy: initialVy.current - GRAVITY * finalTime
        });

        setSummaryData({
          maxHeight: finalMaxHeight,
          range: finalRange,
          flightTime: finalTime,
        });

        setSimulationState('finished');
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
        return;
      }

      const newVx = initialVx.current;
      const newVy = initialVy.current - GRAVITY * elapsedTime;

      setSimulationData({ time: elapsedTime, x: newX, y: newY, vx: newVx, vy: newVy });
      setPathPoints(prev => [...prev, { x: newX, y: newY }]);
      
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);
  }, []);

  const handleLaunch = () => {
    if (simulationState === 'running') return;

    if (pathPoints.length > 0 && currentLaunchSettings) {
      const prevAngleRads = currentLaunchSettings.launchAngle * (Math.PI / 180);
      const prevVox = currentLaunchSettings.initialSpeed * Math.cos(prevAngleRads);
      const prevVoy = currentLaunchSettings.initialSpeed * Math.sin(prevAngleRads);
      const prevRange = prevVox * (2 * prevVoy / GRAVITY);

      setPathHistory(prev => [...prev, {
        points: pathPoints,
        initialSpeed: currentLaunchSettings.initialSpeed,
        launchAngle: currentLaunchSettings.launchAngle,
        range: prevRange,
      }]);
    }

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    setSimulationData(null);
    setSummaryData(null);
    setPathPoints([]);
    setCurrentLaunchSettings({ initialSpeed, launchAngle });

    const angleInRadians = launchAngle * (Math.PI / 180);
    initialVx.current = initialSpeed * Math.cos(angleInRadians);
    initialVy.current = initialSpeed * Math.sin(angleInRadians);

    simulationStartTime.current = performance.now();
    setSimulationState('running');
  };

  const handleReset = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    setSimulationState('idle');
    setSimulationData(null);
    setSummaryData(null);
    setPathPoints([]);
    setPathHistory([]);
    setViewState(INITIAL_VIEW_STATE);
    setHoverData(null);
    setCurrentLaunchSettings(null);
  };

  const handleResetView = () => {
    setViewState(INITIAL_VIEW_STATE);
  };

  useEffect(() => {
    if (simulationState === 'running') {
      runSimulation();
    }
  }, [simulationState, runSimulation]);

  const angleInRadians = launchAngle * (Math.PI / 180);
  const vox = initialSpeed * Math.cos(angleInRadians);
  const voy = initialSpeed * Math.sin(angleInRadians);

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-700">Interactive Projectile Motion</h1>
          <p className="text-lg text-slate-600 mt-2">A Visual Tutorial on Vector Components in Physics</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 lg:row-span-2 min-h-[240px] sm:min-h-[320px] md:min-h-[400px] relative">
            <SimulationCanvas 
              simulationData={simulationData}
              pathPoints={pathPoints}
              pathHistory={pathHistory}
              simulationState={simulationState}
              launchAngle={launchAngle}
              projectedMetrics={projectedMetrics}
              viewState={viewState}
              setViewState={setViewState}
              vox={vox}
              voy={voy}
              currentLaunchSettings={currentLaunchSettings}
              setHoverData={setHoverData}
            />
            {hoverData && (
              <div
                className="absolute bg-slate-800 text-white p-2 rounded text-sm pointer-events-none shadow-lg"
                style={{
                  left: hoverData.x + 15,
                  top: hoverData.y,
                  transform: 'translateY(-100%)',
                }}
              >
                <div>Speed: {hoverData.speed.toFixed(1)} m/s</div>
                <div>Angle: {hoverData.angle.toFixed(1)}°</div>
                <div>Range: {hoverData.range.toFixed(1)} m</div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-8">
            <ControlPanel
              initialSpeed={initialSpeed}
              setInitialSpeed={setInitialSpeed}
              launchAngle={launchAngle}
              setLaunchAngle={setLaunchAngle}
              onLaunch={handleLaunch}
              onReset={handleReset}
              onResetView={handleResetView}
              simulationState={simulationState}
            />
            <DataDisplay 
              simulationData={simulationData}
              summaryData={summaryData}
            />
          </div>
          
          <div className="lg:col-span-3">
            <EducationalText vox={vox} voy={voy} />
          </div>
        </div>
      </div>
    </main>
  );
}