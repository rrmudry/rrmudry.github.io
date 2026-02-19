
import React, { useRef, useEffect } from 'react';
import { SimulationData, Point, SimulationState, ProjectedMetrics, ViewState, PathData } from '../types';
import { GRAVITY } from '../constants';

interface SimulationCanvasProps {
  simulationData: SimulationData | null;
  pathPoints: Point[];
  pathHistory: PathData[];
  simulationState: SimulationState;
  launchAngle: number;
  projectedMetrics: ProjectedMetrics;
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  vox: number;
  voy: number;
  currentLaunchSettings: { initialSpeed: number; launchAngle: number } | null;
  setHoverData: React.Dispatch<React.SetStateAction<{ x: number; y: number; speed: number; angle: number; range: number; } | null>>;
}

const PROJECTILE_RADIUS = 5;
const VECTOR_SCALE = 2.5;
const LAUNCHER_WIDTH_METERS = 8;
const LAUNCHER_HEIGHT_METERS = 3;
const PADDING = 80;


const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) => {
  const headlen = 10;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.lineTo(toX, toY);
  ctx.fillStyle = color;
  ctx.fill();
};

const drawLabel = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, offsetX: number = 0, offsetY: number = 0) => {
    ctx.fillStyle = color;
    ctx.font = 'bold 14px Inter';
    ctx.save();
    ctx.scale(1, -1);
    ctx.fillText(text, x + offsetX, -y + offsetY);
    ctx.restore();
};

const calculateNiceStep = (range: number): number => {
    if (range <= 0) return 10;
    // Aim for roughly 5-10 grid lines
    const roughStep = range / 8; 
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const residual = roughStep / magnitude;

    if (residual > 5) {
        return 10 * magnitude;
    } else if (residual > 2) {
        return 5 * magnitude;
    } else if (residual > 1) {
        return 2 * magnitude;
    } else {
        return Math.max(magnitude, 0.1); // Avoid step of 0
    }
};

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ simulationData, pathPoints, pathHistory, simulationState, launchAngle, projectedMetrics, viewState, setViewState, vox, voy, currentLaunchSettings, setHoverData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.offsetX, y: e.offsetY };
      canvas.style.cursor = 'grabbing';
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      canvas.style.cursor = 'grab';
    };

    const handleMouseLeave = () => {
      isDraggingRef.current = false;
      canvas.style.cursor = 'grab';
      setHoverData(null);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        setHoverData(null);
        const dx = e.offsetX - lastMousePosRef.current.x;
        const dy = e.offsetY - lastMousePosRef.current.y;
        setViewState(prev => ({
          ...prev,
          offsetX: prev.offsetX + dx,
          offsetY: prev.offsetY + dy,
        }));
        lastMousePosRef.current = { x: e.offsetX, y: e.offsetY };
      } else {
        // Hover logic
        const { width, height } = canvas.getBoundingClientRect();
        const usableWidth = width - PADDING;
        const usableHeight = height - PADDING;
        const scaleX = usableWidth / projectedMetrics.range;
        const scaleY = usableHeight / projectedMetrics.maxHeight;
        const basePixelsPerMeter = Math.min(scaleX, scaleY);
        const pixelsPerMeter = basePixelsPerMeter * viewState.zoom;

        if (pixelsPerMeter <= 0) {
          setHoverData(null);
          return;
        }

        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        const worldX = (mouseX - viewState.offsetX - PADDING / 2) / pixelsPerMeter;
        const worldY = ((height - PADDING / 2) - (mouseY - viewState.offsetY)) / pixelsPerMeter;
        
        const threshold = (5 / pixelsPerMeter);
        const thresholdSq = threshold * threshold;

        let foundPathData: { speed: number; angle: number; range: number; } | null = null;
        
        if (currentLaunchSettings && pathPoints.length > 0) {
          for (const point of pathPoints) {
            const distSq = (point.x - worldX)**2 + (point.y - worldY)**2;
            if (distSq < thresholdSq) {
              const angleInRadians = currentLaunchSettings.launchAngle * (Math.PI / 180);
              const v0x = currentLaunchSettings.initialSpeed * Math.cos(angleInRadians);
              const v0y = currentLaunchSettings.initialSpeed * Math.sin(angleInRadians);
              const range = v0x * (2 * v0y / GRAVITY);

              foundPathData = { 
                speed: currentLaunchSettings.initialSpeed, 
                angle: currentLaunchSettings.launchAngle,
                range: range
              };
              break;
            }
          }
        }
        
        if (!foundPathData) {
          for (const pathData of pathHistory) {
            for (const point of pathData.points) {
               const distSq = (point.x - worldX)**2 + (point.y - worldY)**2;
                if (distSq < thresholdSq) {
                  foundPathData = { 
                    speed: pathData.initialSpeed, 
                    angle: pathData.launchAngle,
                    range: pathData.range 
                  };
                  break;
                }
            }
            if (foundPathData) break;
          }
        }

        if (foundPathData) {
          setHoverData({ x: mouseX, y: mouseY, ...foundPathData });
        } else {
          setHoverData(null);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 1.1;
      const newZoom = viewState.zoom * Math.pow(zoomFactor, -e.deltaY / 100);
      
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;

      const newOffsetX = mouseX - (mouseX - viewState.offsetX) * (newZoom / viewState.zoom);
      const newOffsetY = mouseY - (mouseY - viewState.offsetY) * (newZoom / viewState.zoom);
      
      setViewState({
        zoom: newZoom,
        offsetX: newOffsetX,
        offsetY: newOffsetY,
      });
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('wheel', handleWheel);
    
    canvas.style.cursor = 'grab';

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.style.cursor = 'default';
    };
  }, [setViewState, viewState, projectedMetrics, pathPoints, pathHistory, currentLaunchSettings, setHoverData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = canvas.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const usableWidth = width - PADDING;
    const usableHeight = height - PADDING;
    
    const scaleX = usableWidth / projectedMetrics.range;
    const scaleY = usableHeight / projectedMetrics.maxHeight;
    
    const basePixelsPerMeter = Math.min(scaleX, scaleY);
    const pixelsPerMeter = basePixelsPerMeter * viewState.zoom;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    
    ctx.translate(viewState.offsetX, viewState.offsetY);
    ctx.translate(PADDING / 2, height - PADDING / 2);
    ctx.scale(1, -1);

    const viewWidthInMeters = width / pixelsPerMeter;
    const viewHeightInMeters = height / pixelsPerMeter;
    const worldOriginX = -(PADDING / 2 + viewState.offsetX) / pixelsPerMeter;
    const worldOriginY = (viewState.offsetY - PADDING / 2) / pixelsPerMeter;
    
    const gridStepX = calculateNiceStep(viewWidthInMeters);
    const gridStepY = calculateNiceStep(viewHeightInMeters);
    
    const startGridX = Math.floor(worldOriginX / gridStepX) * gridStepX;
    const endGridX = worldOriginX + viewWidthInMeters;
    
    const startGridY = Math.floor(worldOriginY / gridStepY) * gridStepY;
    const endGridY = worldOriginY + viewHeightInMeters;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = startGridX; x <= endGridX; x += gridStepX) {
        const canvasX = x * pixelsPerMeter;
        ctx.beginPath();
        ctx.moveTo(canvasX, worldOriginY * pixelsPerMeter);
        ctx.lineTo(canvasX, (worldOriginY + viewHeightInMeters) * pixelsPerMeter);
        ctx.stroke();
    }
    for (let y = startGridY; y <= endGridY; y += gridStepY) {
        const canvasY = y * pixelsPerMeter;
        ctx.beginPath();
        ctx.moveTo(worldOriginX * pixelsPerMeter, canvasY);
        ctx.lineTo((worldOriginX + viewWidthInMeters) * pixelsPerMeter, canvasY);
        ctx.stroke();
    }

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(worldOriginX * pixelsPerMeter, 0);
    ctx.lineTo((worldOriginX + viewWidthInMeters) * pixelsPerMeter, 0);
    ctx.stroke();

    ctx.save();
    const angleInRadians = launchAngle * (Math.PI / 180);
    ctx.rotate(angleInRadians);
    ctx.fillStyle = '#475569';
    const launcherWidth = LAUNCHER_WIDTH_METERS * pixelsPerMeter;
    const launcherHeight = LAUNCHER_HEIGHT_METERS * pixelsPerMeter;
    ctx.fillRect(0, -launcherHeight / 2, launcherWidth, launcherHeight);
    ctx.restore();

    ctx.strokeStyle = '#cbd5e1'; // light grey
    ctx.lineWidth = 2;
    pathHistory.forEach(historyPathData => {
        const historyPath = historyPathData.points;
        if (historyPath.length > 1) {
            ctx.beginPath();
            ctx.moveTo(historyPath[0].x * pixelsPerMeter, historyPath[0].y * pixelsPerMeter);
            for (const point of historyPath) {
                ctx.lineTo(point.x * pixelsPerMeter, point.y * pixelsPerMeter);
            }
            ctx.stroke();
        }
    });

    if (pathPoints.length > 1) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pathPoints[0].x * pixelsPerMeter, pathPoints[0].y * pixelsPerMeter);
      for (const point of pathPoints) {
        ctx.lineTo(point.x * pixelsPerMeter, point.y * pixelsPerMeter);
      }
      ctx.stroke();
    }

    if ((simulationState === 'running' || simulationState === 'finished') && simulationData) {
      const projX = simulationData.x * pixelsPerMeter;
      const projY = simulationData.y * pixelsPerMeter;

      ctx.beginPath();
      ctx.arc(projX, projY, PROJECTILE_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = '#ef4444';
      ctx.fill();

      if (simulationState === 'running') {
        drawArrow(ctx, projX, projY, projX + simulationData.vx * VECTOR_SCALE, projY, '#f97316');
        drawLabel(ctx, 'Vx', projX + simulationData.vx * VECTOR_SCALE, projY, '#f97316', 5, 5);

        drawArrow(ctx, projX, projY, projX, projY + simulationData.vy * VECTOR_SCALE, '#8b5cf6');
        drawLabel(ctx, 'Vy', projX, projY + simulationData.vy * VECTOR_SCALE, '#8b5cf6', 5, simulationData.vy > 0 ? -5 : 15);
        
        const v = Math.sqrt(simulationData.vx * simulationData.vx + simulationData.vy * simulationData.vy);
        const endVx = projX + simulationData.vx * VECTOR_SCALE;
        const endVy = projY + simulationData.vy * VECTOR_SCALE;
        drawArrow(ctx, projX, projY, endVx, endVy, '#10b981');
        drawLabel(ctx, 'V', endVx, endVy, '#10b981', 5, -5);
      }
    }
    
    ctx.restore();

    ctx.save();
    ctx.font = '12px "Roboto Mono"';
    ctx.fillStyle = '#94a3b8';

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = startGridY; y <= endGridY; y += gridStepY) {
        if (Math.abs(y) < 1e-9) continue;
        const screenY = (height - PADDING / 2) - (y * pixelsPerMeter) + viewState.offsetY;
        
        if (screenY > PADDING / 2 - 20 && screenY < height - PADDING / 2 + 20) {
            ctx.fillText(`${y.toFixed(0)}m`, PADDING / 2 - 8, screenY);
        }
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let x = startGridX; x <= endGridX; x += gridStepX) {
        const screenX = (PADDING / 2) + (x * pixelsPerMeter) + viewState.offsetX;

        if (screenX > PADDING / 2 - 20 && screenX < width - PADDING / 2 + 20) {
            ctx.fillText(`${x.toFixed(0)}m`, screenX, height - PADDING / 2 + 8);
        }
    }

    ctx.restore();

    ctx.save();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.font = '16px "Roboto Mono"';
    
    const textMargin = 20;
    
    const voxString = `v\u2080\u2093 = ${vox.toFixed(2)} m/s`;
    const voyString = `v\u2080\u1D67 = ${voy.toFixed(2)} m/s`;

    ctx.fillStyle = '#f97316';
    ctx.fillText(voxString, width - textMargin, textMargin);
    
    ctx.fillStyle = '#9333ea';
    ctx.fillText(voyString, width - textMargin, textMargin + 24);

    ctx.restore();


  }, [simulationData, pathPoints, pathHistory, simulationState, launchAngle, projectedMetrics, viewState, vox, voy]);

  return <canvas ref={canvasRef} className="w-full h-full bg-white rounded-lg shadow-md" />;
};