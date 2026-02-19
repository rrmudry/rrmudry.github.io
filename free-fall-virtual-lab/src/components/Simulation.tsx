import React, { useState, useRef, useEffect } from 'react';
import { SimulationParams, Location, SimulationState, SimulationStatus } from '../types';

interface SimulationProps {
  position: number;
  params: SimulationParams;
  location: Location;
  trailPositions: SimulationState[];
  status: SimulationStatus;
  isComparisonMode: boolean;
  position2?: number;
  trailPositions2?: SimulationState[];
}

const Simulation: React.FC<SimulationProps> = ({ 
  position, 
  params, 
  location, 
  trailPositions, 
  status,
  isComparisonMode,
  position2,
  trailPositions2
}) => {
  const simulationRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    // Use ResizeObserver to get container height dynamically and ensure accurate scaling
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setContainerHeight(entries[0].contentRect.height);
      }
    });

    if (simulationRef.current) {
      observer.observe(simulationRef.current);
    }

    return () => {
      if (simulationRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        observer.unobserve(simulationRef.current);
      }
    };
  }, []);
  
  const groundHeightPx = 16; // from className h-4 (1rem)
  const fallAreaHeight = containerHeight > groundHeightPx ? containerHeight - groundHeightPx : 0;
  const pixelsPerMeter = fallAreaHeight > 0 ? fallAreaHeight / params.height : 0;
  
  // Calculate object diameter in pixels, scaled to the simulation height
  const objectDiameterPx = params.radius * 2 * pixelsPerMeter;
  const objectSize = Math.max(10, objectDiameterPx); // Ensure a minimum visible size

  const [hoveredTrailIndex, setHoveredTrailIndex] = useState<number | null>(null);
  const [hoveredTrailIndex2, setHoveredTrailIndex2] = useState<number | null>(null);

  const locationStyles = {
    earth: {
      sky: 'from-blue-400 to-blue-200',
      ground: 'bg-green-600',
      object: 'bg-red-500'
    },
    moon: {
      sky: 'from-slate-900 to-slate-800',
      ground: 'bg-slate-600',
      object: 'bg-yellow-200'
    }
  };

  const styles = locationStyles[location];
  
  const hoveredState = hoveredTrailIndex !== null ? trailPositions[hoveredTrailIndex] : null;
  const hoveredState2 = hoveredTrailIndex2 !== null && trailPositions2 ? trailPositions2[hoveredTrailIndex2] : null;

  const getTopPositionStyle = (currentPosition: number): string => {
    if (params.height <= 0 || fallAreaHeight <= 0) return '0px';
    const positionInPx = currentPosition * pixelsPerMeter;
    // Clamp position so the object rests on the ground, not halfway through it
    const maxTop = fallAreaHeight - objectSize;
    return `${Math.min(positionInPx, maxTop)}px`;
  };

  const getLeftPositionStyle = (columnIndex: number): string => {
    if (!isComparisonMode) {
      return `calc(50% - ${objectSize / 2}px)`;
    }
    const columnCenter = columnIndex === 0 ? '25%' : '75%';
    return `calc(${columnCenter} - ${objectSize / 2}px)`;
  };
  
  const getTooltipLeftPositionStyle = (columnIndex: number): string => {
    if (!isComparisonMode) {
      return `calc(50% + ${objectSize / 2}px + 10px)`;
    }
    const columnCenter = columnIndex === 0 ? '25%' : '75%';
    return `calc(${columnCenter} + ${objectSize / 2}px + 10px)`;
  }


  return (
    <div ref={simulationRef} className={`relative w-full h-full bg-gradient-to-b ${styles.sky} rounded-lg overflow-hidden shadow-inner`}>
      {location === 'moon' && (
         <div className="absolute top-0 left-0 w-full h-full opacity-30">
            {/* Some stars for the moon */}
            <div className="absolute w-1 h-1 bg-white rounded-full" style={{top: '10%', left: '20%'}}></div>
            <div className="absolute w-1 h-1 bg-white rounded-full" style={{top: '30%', left: '80%'}}></div>
            <div className="absolute w-0.5 h-0.5 bg-white rounded-full" style={{top: '50%', left: '50%'}}></div>
            <div className="absolute w-1 h-1 bg-white rounded-full" style={{top: '70%', left: '10%'}}></div>
            <div className="absolute w-0.5 h-0.5 bg-white rounded-full" style={{top: '80%', left: '90%'}}></div>
         </div>
      )}

      {/* SIMULATION 1: No Air Resistance */}
      <>
        {trailPositions.map((trailState, index) => {
          if (trailState.position < 0 || trailState.position > params.height) return null;
          return (
            <div
              key={`trail-1-${index}`}
              className={`absolute rounded-full ${styles.object} opacity-30 cursor-pointer`}
              style={{
                top: getTopPositionStyle(trailState.position),
                left: getLeftPositionStyle(0),
                width: `${objectSize}px`,
                height: `${objectSize}px`,
              }}
              onMouseEnter={() => setHoveredTrailIndex(index)}
              onMouseLeave={() => setHoveredTrailIndex(null)}
            />
          );
        })}
        <div
          className={`absolute rounded-full ${styles.object} shadow-lg`}
          style={{
            top: getTopPositionStyle(position),
            left: getLeftPositionStyle(0),
            width: `${objectSize}px`,
            height: `${objectSize}px`,
          }}
        />
        {hoveredState && (
          <div
            className="absolute bg-slate-900/80 text-white p-2 rounded-md shadow-lg text-xs z-10 pointer-events-none"
            style={{
              top: `calc(${getTopPositionStyle(hoveredState.position)} + ${objectSize / 2}px)`,
              left: getTooltipLeftPositionStyle(0),
            }}
          >
            <div className="font-mono whitespace-nowrap">
              <div>Time:     <span className="font-bold text-cyan-400">{hoveredState.time.toFixed(2)}s</span></div>
              <div>Velocity: <span className="font-bold text-cyan-400">{hoveredState.velocity.toFixed(2)}m/s</span></div>
              <div>Position: <span className="font-bold text-cyan-400">{hoveredState.position.toFixed(2)}m</span></div>
            </div>
          </div>
        )}
      </>

      {/* SIMULATION 2: With Air Resistance (only in comparison mode) */}
      {isComparisonMode && position2 !== undefined && trailPositions2 && (
        <>
          {trailPositions2.map((trailState, index) => {
            if (trailState.position < 0 || trailState.position > params.height) return null;
            return (
              <div
                key={`trail-2-${index}`}
                className={`absolute rounded-full ${styles.object} opacity-30 cursor-pointer`}
                style={{
                  top: getTopPositionStyle(trailState.position),
                  left: getLeftPositionStyle(1),
                  width: `${objectSize}px`,
                  height: `${objectSize}px`,
                }}
                onMouseEnter={() => setHoveredTrailIndex2(index)}
                onMouseLeave={() => setHoveredTrailIndex2(null)}
              />
            );
          })}
          <div
            className={`absolute rounded-full ${styles.object} shadow-lg`}
            style={{
              top: getTopPositionStyle(position2),
              left: getLeftPositionStyle(1),
              width: `${objectSize}px`,
              height: `${objectSize}px`,
            }}
          />
          {hoveredState2 && (
            <div
              className="absolute bg-slate-900/80 text-white p-2 rounded-md shadow-lg text-xs z-10 pointer-events-none"
              style={{
                top: `calc(${getTopPositionStyle(hoveredState2.position)} + ${objectSize / 2}px)`,
                left: getTooltipLeftPositionStyle(1),
              }}
            >
              <div className="font-mono whitespace-nowrap">
                <div>Time:     <span className="font-bold text-cyan-400">{hoveredState2.time.toFixed(2)}s</span></div>
                <div>Velocity: <span className="font-bold text-cyan-400">{hoveredState2.velocity.toFixed(2)}m/s</span></div>
                <div>Position: <span className="font-bold text-cyan-400">{hoveredState2.position.toFixed(2)}m</span></div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Shared UI Elements */}
      <div className={`absolute bottom-0 left-0 w-full h-4 ${styles.ground}`} />
      <div className="absolute top-0 right-0 h-full p-2 text-xs text-white/50 flex flex-col justify-between">
        <span>{params.height.toFixed(0)} m</span>
        <span>0 m</span>
      </div>

      {isComparisonMode && location === 'earth' ? (
        <>
          <div className="absolute bottom-5 left-1/4 -translate-x-1/2 text-xs text-white/70 bg-black/20 px-2 py-1 rounded w-max">
              No Air Resistance
          </div>
          <div className="absolute bottom-5 left-3/4 -translate-x-1/2 text-xs text-white/70 bg-black/20 px-2 py-1 rounded w-max">
              With Air Resistance
          </div>
        </>
      ) : (
        <>
          {params.airDensity === 0 && location === 'earth' && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/70 bg-black/20 px-2 py-1 rounded w-max">
                No Air Resistance
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Simulation;