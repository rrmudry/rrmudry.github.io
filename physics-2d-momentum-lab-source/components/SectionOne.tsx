import React from 'react';
import { Trial2DData } from '../types';

interface SectionOneProps {
  data: Trial2DData;
  onUpdate: (field: string, val: string) => void;
}

export const SectionOne: React.FC<SectionOneProps> = ({ data, onUpdate }) => {
  const getVal = (v: string) => parseFloat(v) || 0;
  
  const p1x = getVal(data.m1) * getVal(data.vx1);
  const p1y = getVal(data.m1) * getVal(data.vy1);
  const p2x = getVal(data.m2) * getVal(data.vx2);
  const p2y = getVal(data.m2) * getVal(data.vy2);
  const p3x = getVal(data.m3) * getVal(data.vx3);
  const p3y = getVal(data.m3) * getVal(data.vy3);
  
  const totalX = p1x + p2x + p3x;
  const totalY = p1y + p2y + p3y;

  return (
    <div className="bg-[#161b2e] border border-[#1e293b] rounded-xl p-6 shadow-xl space-y-6">
      <div className="flex items-center space-x-3 mb-2">
        <div className="w-2 h-8 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
        <h2 className="text-xl font-orbitron text-white">SECTION 2: 2D DATA & VECTOR ANALYSIS</h2>
      </div>

      <div className="bg-[#0f172a] p-4 rounded-lg border border-[#1e293b] text-slate-400 text-sm leading-relaxed">
        <p className="mb-4">
          <span className="text-blue-400 font-bold uppercase mr-2">Instructions:</span>
          Set to <span className="text-white font-bold">2D Mode</span>. Record Mass and (vx, vy) for all fragments.
        </p>
        <div className="flex justify-center">
          <a href="https://rrmudry.github.io/conservation-of-momentum/index.html" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-2 rounded-lg font-bold text-white uppercase text-xs tracking-widest hover:scale-105 transition-transform">
            Launch Simulator
          </a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
             <tr className="border-b border-[#334155]">
                <th className="py-3 px-2 text-[10px] font-orbitron text-blue-400 uppercase tracking-tighter">Fragment</th>
                <th className="py-3 px-2 text-[10px] font-orbitron text-blue-400 uppercase tracking-tighter text-center">Mass (kg)</th>
                <th className="py-3 px-2 text-[10px] font-orbitron text-blue-400 uppercase tracking-tighter text-center">Vel X (m/s)</th>
                <th className="py-3 px-2 text-[10px] font-orbitron text-blue-400 uppercase tracking-tighter text-center">Vel Y (m/s)</th>
                <th className="py-3 px-2 text-[10px] font-orbitron text-cyan-400 uppercase tracking-tighter text-center">Momentum (Px, Py)</th>
             </tr>
          </thead>
          <tbody className="text-sm font-mono text-white">
             {/* Part 1 */}
             <tr className="border-b border-[#1e293b]">
                <td className="py-4 px-2 text-blue-400 font-orbitron text-xs">Part #1</td>
                <td><input type="number" step="any" value={data.m1} onChange={(e)=>onUpdate('m1', e.target.value)} className="w-full bg-[#0a0e17] border border-[#334155] rounded px-2 py-1 text-center" /></td>
                <td><input type="number" step="any" value={data.vx1} onChange={(e)=>onUpdate('vx1', e.target.value)} className="w-full bg-[#0a0e17] border border-[#334155] rounded px-2 py-1 text-center text-blue-300" /></td>
                <td><input type="number" step="any" value={data.vy1} onChange={(e)=>onUpdate('vy1', e.target.value)} className="w-full bg-[#0a0e17] border border-[#334155] rounded px-2 py-1 text-center text-purple-300" /></td>
                <td className="text-center text-[10px] text-gray-500">({p1x.toFixed(2)}, {p1y.toFixed(2)})</td>
             </tr>
             {/* Part 2 */}
             <tr className="border-b border-[#1e293b]">
                <td className="py-4 px-2 text-purple-400 font-orbitron text-xs">Part #2</td>
                <td><input type="number" step="any" value={data.m2} onChange={(e)=>onUpdate('m2', e.target.value)} className="w-full bg-[#0a0e17] border border-[#334155] rounded px-2 py-1 text-center" /></td>
                <td><input type="number" step="any" value={data.vx2} onChange={(e)=>onUpdate('vx2', e.target.value)} className="w-full bg-[#0a0e17] border border-[#334155] rounded px-2 py-1 text-center text-blue-300" /></td>
                <td><input type="number" step="any" value={data.vy2} onChange={(e)=>onUpdate('vy2', e.target.value)} className="w-full bg-[#0a0e17] border border-[#334155] rounded px-2 py-1 text-center text-purple-300" /></td>
                <td className="text-center text-[10px] text-gray-500">({p2x.toFixed(2)}, {p2y.toFixed(2)})</td>
             </tr>
             {/* Part 3 */}
             <tr className="border-b border-[#1e293b]">
                <td className="py-4 px-2 text-yellow-400 font-orbitron text-xs">Part #3</td>
                <td><input type="number" step="any" value={data.m3} onChange={(e)=>onUpdate('m3', e.target.value)} className="w-full bg-[#0a0e17] border border-[#334155] rounded px-2 py-1 text-center" /></td>
                <td><input type="number" step="any" value={data.vx3} onChange={(e)=>onUpdate('vx3', e.target.value)} className="w-full bg-[#0a0e17] border border-[#334155] rounded px-2 py-1 text-center text-blue-300" /></td>
                <td><input type="number" step="any" value={data.vy3} onChange={(e)=>onUpdate('vy3', e.target.value)} className="w-full bg-[#0a0e17] border border-[#334155] rounded px-2 py-1 text-center text-purple-300" /></td>
                <td className="text-center text-[10px] text-gray-500">({p3x.toFixed(2)}, {p3y.toFixed(2)})</td>
             </tr>
             {/* Totals */}
             <tr className="bg-cyan-950/20">
                <td className="py-4 px-2 text-white font-orbitron text-xs font-bold">NET TOTAL</td>
                <td colSpan={1}></td>
                <td className={`text-center font-bold ${Math.abs(totalX) < 0.2 ? 'text-green-400' : 'text-red-400'}`}>{totalX.toFixed(2)}</td>
                <td className={`text-center font-bold ${Math.abs(totalY) < 0.2 ? 'text-green-400' : 'text-red-400'}`}>{totalY.toFixed(2)}</td>
                <td className="text-center text-[10px] text-cyan-400/50">(Goal: 0.00)</td>
             </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex flex-col items-center">
         <h3 className="text-xs font-orbitron text-center mb-6 text-slate-400 uppercase tracking-widest">Vector Momentum Diagram</h3>
         
         <div className="relative w-64 h-64 border border-[#1e293b] rounded-full bg-black/40 shadow-inner overflow-hidden">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-[#1e293b]"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#1e293b]"></div>
            
            <svg viewBox="-100 -100 200 200" className="w-full h-full overflow-visible">
               <defs>
                 <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                   <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
                 </marker>
               </defs>
               {(() => {
                  const maxP = Math.max(Math.sqrt(p1x**2+p1y**2), Math.sqrt(p2x**2+p2y**2), Math.sqrt(p3x**2+p3y**2), 0.1);
                  const scale = 80 / maxP;
                  const drawV = (x:number, y:number, color:string) => (
                    <line x1="0" y1="0" x2={x*scale} y2={-y*scale} stroke="currentColor" strokeWidth="3" markerEnd="url(#arrowhead)" className={color} />
                  );
                  return (
                    <>
                       {drawV(p1x, p1y, "text-blue-500")}
                       {drawV(p2x, p2y, "text-purple-500")}
                       {drawV(p3x, p3y, "text-yellow-500")}
                       {/* Net error circle */}
                       <circle cx={totalX*scale} cy={-totalY*scale} r="3" fill="#ef4444" className="opacity-80" />
                    </>
                  );
               })()}
            </svg>
         </div>
         <p className="text-[10px] text-gray-500 mt-4 uppercase font-orbitron">Conservation Check: Red dot should stay centered</p>
      </div>

      <div className="bg-[#0f172a] p-4 rounded-lg border border-[#1e293b]">
         <p className="text-cyan-400 font-bold text-xs uppercase mb-2">💡 Momentum Lab Guide: (vx, vy)</p>
         <img src="https://rrmudry.github.io/data-hint.png" alt="Data Hint" className="h-10 opacity-70 mb-2" />
         <p className="text-[10px] text-slate-500 leading-tight">Match the X and Y components separately in the table above.</p>
      </div>
    </div>
  );
};
