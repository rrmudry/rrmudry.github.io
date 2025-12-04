import { Point } from './types';

// Physics Constants
export const GRAVITY = 10; // m/s^2 as requested
export const PIXELS_PER_METER = 40; // Scale factor for visualization
export const TRACK_SMOOTHING = 0.2; // Catmull-Rom spline tension-like factor (simplified for Bezier)

// Initial Track Setup
export const INITIAL_POINTS: Point[] = [
  { x: 80, y: 150, id: 'start' },
  { x: 250, y: 400, id: 'p1' },
  { x: 500, y: 200, id: 'p2' },
  { x: 750, y: 350, id: 'p3' },
  { x: 950, y: 250, id: 'end' },
];

export const GROUND_Y = 500; // Canvas Y coordinate for 0 height
export const INITIAL_MASS = 50; // kg