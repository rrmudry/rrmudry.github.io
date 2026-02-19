import { Point } from '../types';
import { GRAVITY, PIXELS_PER_METER, GROUND_Y } from '../constants';

// --- Bezier Curve Logic ---

// Calculate a point on a cubic Bezier curve at t (0 <= t <= 1)
export const getCubicBezierPoint = (
  t: number,
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point
): { x: number; y: number } => {
  const oneMinusT = 1 - t;
  const oneMinusTSq = oneMinusT * oneMinusT;
  const oneMinusTCu = oneMinusTSq * oneMinusT;
  const tSq = t * t;
  const tCu = tSq * t;

  const x =
    oneMinusTCu * p0.x +
    3 * oneMinusTSq * t * p1.x +
    3 * oneMinusT * tSq * p2.x +
    tCu * p3.x;
  const y =
    oneMinusTCu * p0.y +
    3 * oneMinusTSq * t * p1.y +
    3 * oneMinusT * tSq * p2.y +
    tCu * p3.y;

  return { x, y };
};

// Calculate the derivative (tangent vector) at t
export const getCubicBezierDerivative = (
  t: number,
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point
): { x: number; y: number } => {
  const oneMinusT = 1 - t;
  // d/dt of (1-t)^3 = -3(1-t)^2

  const x =
    3 * (1 - t) * (1 - t) * (p1.x - p0.x) +
    6 * (1 - t) * t * (p2.x - p1.x) +
    3 * t * t * (p3.x - p2.x);

  const y =
    3 * (1 - t) * (1 - t) * (p1.y - p0.y) +
    6 * (1 - t) * t * (p2.y - p1.y) +
    3 * t * t * (p3.y - p2.y);

  return { x, y };
};

export const pointsToPathSegments = (points: Point[]) => {
  const segments = [];

  for (let i = 0; i < points.length - 1; i++) {
    const pPrev = points[Math.max(0, i - 1)];
    const pStart = points[i];
    const pEnd = points[i + 1];
    const pNext = points[Math.min(points.length - 1, i + 2)];

    // Catmull-Rom to Cubic Bezier conversion
    // cp1 = pStart + (pEnd - pPrev) / 6 * tension (usually 1)
    const tension = 1;

    let cp1x = pStart.x + ((pEnd.x - pPrev.x) / 6) * tension;
    let cp1y = pStart.y + ((pEnd.y - pPrev.y) / 6) * tension;

    let cp2x = pEnd.x - ((pNext.x - pStart.x) / 6) * tension;
    let cp2y = pEnd.y - ((pNext.y - pStart.y) / 6) * tension;

    // Fix: Clamp y-coordinates to prevent Catmull-Rom "overshoot" loops
    // especially when transitioning from steep slopes to horizontal sections
    const minY = Math.min(pStart.y, pEnd.y);
    const maxY = Math.max(pStart.y, pEnd.y);
    cp1y = Math.max(minY, Math.min(maxY, cp1y));
    cp2y = Math.max(minY, Math.min(maxY, cp2y));

    segments.push({
      p0: pStart,
      p1: { x: cp1x, y: cp1y, id: `cp1-${i}` },
      p2: { x: cp2x, y: cp2y, id: `cp2-${i}` },
      p3: pEnd,
    });
  }
  return segments;
};

// --- Physics Calculations ---

// Convert Y pixels to Meters (Physics Height)
export const getPhysicsHeight = (pixelY: number): number => {
  return (GROUND_Y - pixelY) / PIXELS_PER_METER;
};

// Get simulation state based on position T
export const calculatePhysicsState = (
  globalT: number, // 0 to N-1 (where N is num points)
  segments: any[],
  totalEnergy: number,
  mass: number
) => {
  // Determine which segment we are on
  const segmentIndex = Math.floor(globalT);
  const localT = globalT - segmentIndex;

  // Safety check
  const segment = segments[Math.min(segmentIndex, segments.length - 1)];
  const actualLocalT = segmentIndex >= segments.length ? 1 : Math.max(0, localT);

  const pos = getCubicBezierPoint(actualLocalT, segment.p0, segment.p1, segment.p2, segment.p3);
  const derivative = getCubicBezierDerivative(actualLocalT, segment.p0, segment.p1, segment.p2, segment.p3);

  // Angle for rotating the cart
  const angle = Math.atan2(derivative.y, derivative.x);

  // Height and Energy
  const height = getPhysicsHeight(pos.y);
  const pe = mass * GRAVITY * height;

  // KE = TE - PE. Clamp to 0 if negative (impossible physics state, or cart doesn't reach)
  let ke = totalEnergy - pe;
  if (ke < 0) ke = 0;

  const v = Math.sqrt((2 * ke) / mass);

  return {
    pos,
    angle,
    height,
    pe,
    ke,
    v,
    derivative
  };
};

export const generateTrackLUT = (segments: any[], resolution: number = 200) => {
  const lut = [];
  let totalLength = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    let prevP = seg.p0;

    for (let step = 1; step <= resolution; step++) {
      const t = step / resolution;
      const p = getCubicBezierPoint(t, seg.p0, seg.p1, seg.p2, seg.p3);
      const dist = Math.sqrt(Math.pow(p.x - prevP.x, 2) + Math.pow(p.y - prevP.y, 2));
      totalLength += dist;
      lut.push({
        globalT: i + t,
        dist: totalLength,
        pos: p
      });
      prevP = p;
    }
  }
  return { lut, totalLength };
};