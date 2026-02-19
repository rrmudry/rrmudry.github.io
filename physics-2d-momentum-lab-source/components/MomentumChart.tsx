
import React, { useEffect, useRef } from 'react';
import { TrialData } from '../types';

interface MomentumChartProps {
  trial1: TrialData;
  trial2: TrialData;
}

export const MomentumChart: React.FC<MomentumChartProps> = ({ trial1, trial2 }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<any>(null);

  // Helper to safely calculate momentum
  const getMomentum = (mass: string, vel: string) => {
    const m = parseFloat(mass);
    const v = parseFloat(vel);
    if (isNaN(m) || isNaN(v)) return 0;
    return m * v;
  };

  const renderChart = () => {
    if (!chartRef.current) return;

    const p1A = getMomentum(trial1.massA, trial1.velA);
    const p1B = getMomentum(trial1.massB, trial1.velB);
    const p2A = getMomentum(trial2.massA, trial2.velA);
    const p2B = getMomentum(trial2.massB, trial2.velB);

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Define the font stack to prevent the "weird serif" fallback
    const fontStack = "'Orbitron', 'Inter', 'Segoe UI', Roboto, sans-serif";

    if (chartInstance.current) {
      chartInstance.current.data.datasets[0].data = [p1A, p2A];
      chartInstance.current.data.datasets[1].data = [p1B, p2B];
      chartInstance.current.update(); 
    } else {
      // @ts-ignore
      if (typeof window.Chart === 'undefined') return;

      // @ts-ignore
      chartInstance.current = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['TRIAL 1', 'TRIAL 2'],
          datasets: [
            {
              label: 'Momentum Part #1 (p_1)',
              data: [p1A, p2A],
              backgroundColor: '#06b6d4', // Cyan
              borderColor: '#22d3ee',
              borderWidth: 1,
              borderRadius: 4,
            },
            {
              label: 'Momentum Part #2 (p_2)',
              data: [p1B, p2B],
              backgroundColor: '#2563eb', // Royal Blue
              borderColor: '#60a5fa',
              borderWidth: 1,
              borderRadius: 4,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 500
          },
          scales: {
            x: {
              grid: { color: 'rgba(51, 65, 85, 0.3)' },
              ticks: { 
                color: '#94a3b8',
                font: { family: fontStack, size: 11 }
              }
            },
            y: {
              title: {
                display: true,
                text: 'Momentum (kg·m/s)',
                color: '#94a3b8',
                font: { family: fontStack, size: 10 }
              },
              grid: { 
                color: (context: any) => context.tick.value === 0 ? '#64748b' : 'rgba(51, 65, 85, 0.2)',
                lineWidth: (context: any) => context.tick.value === 0 ? 2 : 1
              },
              ticks: { 
                color: '#94a3b8',
                font: { family: fontStack }
              }
            }
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: '#e2e8f0',
                font: { family: fontStack, size: 10, weight: 'bold' },
                boxWidth: 12,
                padding: 20
              }
            },
            tooltip: {
              backgroundColor: '#1e293b',
              titleFont: { family: fontStack },
              bodyFont: { family: fontStack },
              titleColor: '#22d3ee',
              bodyColor: '#f1f5f9',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 10,
              displayColors: true,
              callbacks: {
                label: (context: any) => {
                  let label = context.dataset.label || '';
                  if (label) label += ': ';
                  if (context.parsed.y !== null) {
                    label += context.parsed.y.toFixed(2) + ' kg·m/s';
                  }
                  return label;
                }
              }
            }
          }
        }
      });
    }
  };

  useEffect(() => {
    renderChart();
    
    // This is the critical fix: 
    // Wait for the custom fonts to actually load, then force a chart update.
    // This removes the "weird" default browser serif font.
    if (document.fonts) {
      document.fonts.ready.then(() => {
        if (chartInstance.current) {
          chartInstance.current.update();
        }
      });
    }
  }, [trial1, trial2]);

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []);

  return <canvas ref={chartRef} className="w-full h-full" />;
};
