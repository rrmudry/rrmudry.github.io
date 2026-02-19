import React, { useRef, useState, useCallback } from 'react';
import { Point, SimulationState } from '../types';
import { GROUND_Y, PIXELS_PER_METER } from '../constants';
import { pointsToPathSegments, calculatePhysicsState } from '../utils/physicsUtils';
import { Activity } from 'lucide-react';

interface TrackCanvasProps {
  simulationState: SimulationState;
  setSimulationState: React.Dispatch<React.SetStateAction<SimulationState>>;
  points: Point[];
  setPoints: React.Dispatch<React.SetStateAction<Point[]>>;
  isDraggingAllowed: boolean;
}

const CART_WIDTH = 40;
const CART_HEIGHT = 24;

const TrackCanvas: React.FC<TrackCanvasProps> = ({
  simulationState,
  setSimulationState,
  points,
  setPoints,
  isDraggingAllowed,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Determine dynamic viewBox width based on the furthest point
  // Add some padding (e.g., 100px) to the right
  const maxPointX = points[points.length - 1].x;
  const viewBoxWidth = Math.max(1000, maxPointX + 100);

  // Generate path definition for SVG
  const segments = pointsToPathSegments(points);

  let d = `M ${segments[0].p0.x} ${segments[0].p0.y}`;
  segments.forEach((seg) => {
    d += ` C ${seg.p1.x} ${seg.p1.y}, ${seg.p2.x} ${seg.p2.y}, ${seg.p3.x} ${seg.p3.y}`;
  });

  // Handle Dragging
  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    if (!isDraggingAllowed) return;
    setDraggingId(id);
    e.stopPropagation();
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!draggingId || !svgRef.current) return;

      // Mark as interacted to hide hint once user starts shaping the track
      setHasInteracted(true);

      const svg = svgRef.current;
      const pt = svg.createSVGPoint();

      // Handle both mouse and touch events
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      pt.x = clientX;
      pt.y = clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

      // Snap Logic:
      // 1. Convert Y pixels to Height in meters
      let heightMeters = (GROUND_Y - svgP.y) / PIXELS_PER_METER;

      // 2. Snap to nearest 0.1m
      heightMeters = Math.round(heightMeters * 10) / 10;

      // 3. Clamp to reasonable bounds (0m to 12m) to keep on screen
      // 12m is roughly 500 - (12*40) = 20px from top
      heightMeters = Math.max(0, Math.min(heightMeters, 12));

      // 4. Convert back to pixels
      const snappedY = GROUND_Y - (heightMeters * PIXELS_PER_METER);

      // We do not update X to keep points vertically aligned as per request
      setPoints((prev) =>
        prev.map((p) =>
          p.id === draggingId ? { ...p, y: snappedY } : p
        )
      );
    },
    [draggingId, setPoints]
  );

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  // Get Cart visual position
  const physState = calculatePhysicsState(
    simulationState.cartPositionT,
    segments,
    simulationState.totalEnergy,
    simulationState.mass
  );

  const { pos, angle } = physState;

  // Wheel positions relative to cart center
  const wheelOffset = 12;

  return (
    <div
      className="relative w-full h-full min-h-[300px] bg-slate-800 rounded-xl overflow-hidden shadow-2xl border border-slate-700 select-none touch-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewBoxWidth} 600`}
        preserveAspectRatio="xMidYMax meet"
        className="absolute inset-0 bg-slate-900"
      >
        <defs>
          {/* Grid Pattern */}
          <pattern id="grid" width={PIXELS_PER_METER} height={PIXELS_PER_METER} patternUnits="userSpaceOnUse">
            <path d={`M ${PIXELS_PER_METER} 0 L 0 0 0 ${PIXELS_PER_METER}`} fill="none" stroke="#475569" strokeWidth="1" strokeOpacity="0.3" />
          </pattern>

          {/* Velocity Arrow Marker */}
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#fbbf24" />
          </marker>
        </defs>

        {/* Background Grid */}
        <rect x="-5000" y="-5000" width="20000" height="10000" fill="url(#grid)" />

        {/* Ground Area - Extended Width for safety */}
        <rect
          x="-5000"
          y={GROUND_Y}
          width="20000"
          height={600 - GROUND_Y}
          fill="#0f172a"
        />
        <line
          x1="-5000"
          y1={GROUND_Y}
          x2="20000"
          y2={GROUND_Y}
          stroke="#475569"
          strokeWidth="2"
        />
        <text
          x="20"
          y={GROUND_Y + 30}
          fill="#64748b"
          className="font-mono text-xs select-none"
          style={{ fontSize: '14px' }}
        >
          Ground Level (h = 0m)
        </text>

        {/* Track Line */}
        <path
          d={d}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="6"
          strokeLinecap="round"
          className=""
        />
        {/* Track Support Pillars */}
        {points.map((p, i) => (
          <line
            key={`pillar-${i}`}
            x1={p.x} y1={p.y}
            x2={p.x} y2={GROUND_Y}
            stroke="#475569"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        ))}

        {/* The Cart (Rendered before points so points overlay it) */}
        <g transform={`translate(${pos.x}, ${pos.y}) rotate(${(angle * 180) / Math.PI})`}>
          {/* Cart Body */}
          <rect
            x={-CART_WIDTH / 2}
            y={-CART_HEIGHT - 4}
            width={CART_WIDTH}
            height={CART_HEIGHT}
            rx="6"
            fill="#ef4444"
            stroke="#b91c1c"
            strokeWidth="2"
          />
          {/* Wheels */}
          <circle cx={-wheelOffset} cy={-2} r="5" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
          <circle cx={wheelOffset} cy={-2} r="5" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
          {/* Speed Vector (Visual only) - Points in direction of motion */}
          {simulationState.velocity > 0 && (
            <line
              x1="0" y1={-CART_HEIGHT / 2 - 4}
              x2={simulationState.velocity * 5 * simulationState.direction} y2={-CART_HEIGHT / 2 - 4}
              stroke="#fbbf24"
              strokeWidth="2"
              markerEnd="url(#arrow)"
              opacity="0.8"
            />
          )}
        </g>

        {/* Control Points */}
        {points.map((p, i) => {
          // If point is high (near top edge), render label below it
          const isHighPoint = p.y < 100;
          const labelYOffset = isHighPoint ? 50 : -45;

          return (
            <g
              key={p.id}
              transform={`translate(${p.x}, ${p.y})`}
              className={`${isDraggingAllowed ? 'cursor-ns-resize active:cursor-grabbing' : 'opacity-0'}`}
              onMouseDown={(e) => handleMouseDown(p.id, e)}
              onTouchStart={(e) => handleMouseDown(p.id, e as any)}
            >
              <circle r="12" fill="rgba(59, 130, 246, 0.2)" />
              <circle r="6" fill="#60a5fa" stroke="white" strokeWidth="2" />
              <text
                y={labelYOffset}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="18"
                className="pointer-events-none font-mono font-bold"
                style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.9)' }}
              >
                {((GROUND_Y - p.y) / PIXELS_PER_METER).toFixed(1)}m
              </text>
            </g>
          );
        })}

      </svg>

      {/* Start Hint */}
      {isDraggingAllowed && !simulationState.isPlaying && !hasInteracted && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur px-4 py-2 rounded-lg border border-slate-700 text-sm text-blue-200 pointer-events-none">
          <span className="flex items-center gap-2">
            <Activity size={16} /> Drag points vertically to shape the track
          </span>
        </div>
      )}
    </div>
  );
};

export default TrackCanvas;