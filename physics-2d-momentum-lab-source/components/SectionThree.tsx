import React from 'react';

type SectionThreeProps = {
  data: any;
  updateData: (section: string, field: string, value: any) => void;
};

const SectionThree: React.FC<SectionThreeProps> = ({ data, updateData }) => {
  
  // Helper to safely get number or 0
  const getVal = (key: string) => parseFloat(data[key]) || 0;

  // Calculate momenta
  const p1x = getVal('m1') * getVal('vx1');
  const p1y = getVal('m1') * getVal('vy1');
  const p2x = getVal('m2') * getVal('vx2');
  const p2y = getVal('m2') * getVal('vy2');
  const p3x = getVal('m3') * getVal('vx3');
  const p3y = getVal('m3') * getVal('vy3');
  
  const totalPx = p1x + p2x + p3x;
  const totalPy = p1y + p2y + p3y;

  const handleChange = (field: string, val: string) => {
    updateData('section3', field, val);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-xl mb-8">
      <h2 className="text-2xl font-bold text-cyan-400 mb-4 tracking-wider flex items-center">
        <span className="bg-cyan-900 text-cyan-300 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">03</span>
        SECTION 3: DATA ANALYSIS (2D)
      </h2>

      <div className="mb-6 bg-gray-900 p-4 rounded border border-gray-600 text-sm">
         <p className="text-gray-300 mb-2">
            Record the Mass (kg) and Velocity components (m/s) for all 3 fragments after the explosion.
            <br/>
            <span className="text-cyan-400 font-bold">⚠️ HINT:</span> In the simulator data view, velocity is shown as <code className="bg-gray-800 px-1 rounded text-green-400">(vx, vy)</code>. 
            The first number is X, the second is Y.
         </p>
         <img src="https://rrmudry.github.io/data-hint.png" alt="Data Hint" className="mt-2 h-16 object-contain opacity-80" />
      </div>

      {/* Part 1 */}
      <div className="border-b border-gray-700 pb-4 mb-4">
        <h3 className="text-blue-400 font-bold mb-2">PART #1</h3>
        <div className="grid grid-cols-3 gap-4 mb-2">
            <div>
            <label className="block text-gray-400 text-xs uppercase">Mass (kg)</label>
            <input type="number" step="0.1" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" 
                value={data.m1 || ''} onChange={(e) => handleChange('m1', e.target.value)} />
            </div>
            <div>
            <label className="block text-gray-400 text-xs uppercase">Vel X (m/s)</label>
            <input type="number" step="0.1" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" 
                value={data.vx1 || ''} onChange={(e) => handleChange('vx1', e.target.value)} />
            </div>
            <div>
            <label className="block text-gray-400 text-xs uppercase">Vel Y (m/s)</label>
            <input type="number" step="0.1" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" 
                value={data.vy1 || ''} onChange={(e) => handleChange('vy1', e.target.value)} />
            </div>
        </div>
        <div className="flex gap-4 text-xs text-gray-500 font-mono">
            <span>Px = {p1x.toFixed(2)}</span>
            <span>Py = {p1y.toFixed(2)}</span>
        </div>
      </div>

      {/* Part 2 */}
      <div className="border-b border-gray-700 pb-4 mb-4">
        <h3 className="text-purple-400 font-bold mb-2">PART #2</h3>
        <div className="grid grid-cols-3 gap-4 mb-2">
            <div>
            <label className="block text-gray-400 text-xs uppercase">Mass (kg)</label>
            <input type="number" step="0.1" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" 
                value={data.m2 || ''} onChange={(e) => handleChange('m2', e.target.value)} />
            </div>
            <div>
            <label className="block text-gray-400 text-xs uppercase">Vel X (m/s)</label>
            <input type="number" step="0.1" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" 
                value={data.vx2 || ''} onChange={(e) => handleChange('vx2', e.target.value)} />
            </div>
            <div>
            <label className="block text-gray-400 text-xs uppercase">Vel Y (m/s)</label>
            <input type="number" step="0.1" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" 
                value={data.vy2 || ''} onChange={(e) => handleChange('vy2', e.target.value)} />
            </div>
        </div>
        <div className="flex gap-4 text-xs text-gray-500 font-mono">
            <span>Px = {p2x.toFixed(2)}</span>
            <span>Py = {p2y.toFixed(2)}</span>
        </div>
      </div>

      {/* Part 3 */}
      <div className="border-b border-gray-700 pb-4 mb-4">
        <h3 className="text-yellow-400 font-bold mb-2">PART #3</h3>
        <div className="grid grid-cols-3 gap-4 mb-2">
            <div>
            <label className="block text-gray-400 text-xs uppercase">Mass (kg)</label>
            <input type="number" step="0.1" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" 
                value={data.m3 || ''} onChange={(e) => handleChange('m3', e.target.value)} />
            </div>
            <div>
            <label className="block text-gray-400 text-xs uppercase">Vel X (m/s)</label>
            <input type="number" step="0.1" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" 
                value={data.vx3 || ''} onChange={(e) => handleChange('vx3', e.target.value)} />
            </div>
            <div>
            <label className="block text-gray-400 text-xs uppercase">Vel Y (m/s)</label>
            <input type="number" step="0.1" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" 
                value={data.vy3 || ''} onChange={(e) => handleChange('vy3', e.target.value)} />
            </div>
        </div>
        <div className="flex gap-4 text-xs text-gray-500 font-mono">
            <span>Px = {p3x.toFixed(2)}</span>
            <span>Py = {p3y.toFixed(2)}</span>
        </div>
      </div>

      {/* TOTALS */}
      <div className="bg-gray-700/50 p-4 rounded border border-gray-600 mt-6">
         <h4 className="text-white font-bold mb-2 uppercase tracking-widest text-center">Totals</h4>
         <div className="grid grid-cols-2 gap-4 text-center">
            <div>
               <div className="text-gray-400 text-xs">Total X Momentum</div>
               <div className={`text-xl font-mono font-bold ${Math.abs(totalPx) < 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                 {totalPx.toFixed(2)} kg·m/s
               </div>
               <div className="text-xs text-gray-500">(Target: ~0)</div>
            </div>
            <div>
               <div className="text-gray-400 text-xs">Total Y Momentum</div>
               <div className={`text-xl font-mono font-bold ${Math.abs(totalPy) < 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                 {totalPy.toFixed(2)} kg·m/s
               </div>
               <div className="text-xs text-gray-500">(Target: ~0)</div>
            </div>
         </div>
      </div>
      
      {/* VISUALIZATION */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mt-8">
        <h4 className="text-cyan-400 font-bold mb-6 uppercase tracking-widest text-center text-sm">Momentum Analysis</h4>

        <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
            
            {/* Main 2D Diagram */}
            <div className="flex flex-col items-center">
                <span className="text-gray-400 text-xs mb-2">2D Spatial View</span>
                <div className="relative w-48 h-48 border border-gray-800 rounded-full bg-gray-900/50 shadow-inner">
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-800"></div>
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-800"></div>
                    <svg viewBox="-100 -100 200 200" className="w-full h-full overflow-visible">
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
                            </marker>
                        </defs>
                        {(() => {
                            const maxVal = Math.max(
                                Math.sqrt(p1x**2 + p1y**2), 
                                Math.sqrt(p2x**2 + p2y**2), 
                                Math.sqrt(p3x**2 + p3y**2), 
                                0.1
                            );
                            const scale = 80 / maxVal;
                            // Helper to draw standard vector
                            const drawV = (x: number, y: number, color: string) => (
                                <line x1="0" y1="0" x2={x * scale} y2={-y * scale} stroke="currentColor" strokeWidth="3" markerEnd="url(#arrowhead)" className={color} />
                            );
                            return (
                                <>
                                    {drawV(p1x, p1y, "text-blue-500")}
                                    {drawV(p2x, p2y, "text-purple-500")}
                                    {drawV(p3x, p3y, "text-yellow-500")}
                                    {/* Net 2D */}
                                    <line x1="0" y1="0" x2={totalPx * scale} y2={-totalPy * scale} stroke="currentColor" strokeWidth="4" strokeDasharray="4 2" className="text-red-500 opacity-80" />
                                    <circle cx={totalPx * scale} cy={-totalPy * scale} r="3" fill="currentColor" className="text-red-500" />
                                </>
                            );
                        })()}
                    </svg>
                </div>
            </div>

            {/* Component Breakdowns */}
            <div className="flex gap-4">
                {/* X-Component Head-to-Tail */}
                <div className="flex flex-col items-center">
                    <span className="text-gray-400 text-xs mb-2">X-Balance (Head-to-Tail)</span>
                    <div className="w-24 h-48 border border-gray-800 bg-gray-900/50 relative">
                        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-700"></div> {/* Center Axis */}
                        <svg viewBox="-50 -100 100 200" className="w-full h-full overflow-visible">
                             {(() => {
                                 // Scale based on X max extents
                                 const maxX = Math.max(Math.abs(p1x)+Math.abs(p2x)+Math.abs(p3x), 0.1);
                                 const scaleX = 90 / maxX; // fit in 100 height (since we rotate 90deg effectively or just draw vertically)
                                 
                                 // Actually for X (Horizontal), we usually draw horizontally. 
                                 // But to save specific space, let's draw X vectors vertically? No that's confusing.
                                 // Let's draw X horizontally in a wider box.
                                 return null; 
                             })()}
                             {/* Retrying with better layout logic below in the main return for this block */}
                        </svg>
                        {/* RE-IMPLEMENTING X-CHART CORRECTLY BELOW */}
                    </div>
                </div>
            </div>
        </div>

        {/* Separate X and Y Linear Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 w-full">
            
            {/* X-Axis Chart */}
            <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                <h5 className="text-xs font-bold text-gray-400 uppercase mb-2 text-center">X-Momentum Sum (Should = 0)</h5>
                <div className="h-16 relative flex items-center">
                    <div className="absolute left-0 right-0 h-px bg-gray-600 top-1/2"></div>
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-600"></div>
                    <svg className="w-full h-full overflow-visible" viewBox="-100 -20 200 40">
                        {(() => {
                             // Scale for Component Charts
                             const range = Math.max(Math.abs(p1x) + Math.abs(p2x) + Math.abs(p3x), Math.abs(p1y) + Math.abs(p2y) + Math.abs(p3y), 0.1) * 1.2;
                             const scale = 90 / range;
                             
                             // Head to Tail X
                             let cx = 0;
                             return (
                                 <g transform="translate(0,0)">
                                     {/* P1X */}
                                     <line x1={cx} y1="-5" x2={cx + p1x*scale} y2="-5" stroke="currentColor" strokeWidth="4" className="text-blue-500" markerEnd="url(#arrowhead)" />
                                     {/* P2X */}
                                     <line x1={cx + p1x*scale} y1="0" x2={cx + (p1x+p2x)*scale} y2="0" stroke="currentColor" strokeWidth="4" className="text-purple-500" markerEnd="url(#arrowhead)" />
                                     {/* P3X */}
                                     <line x1={cx + (p1x+p2x)*scale} y1="5" x2={cx + (p1x+p2x+p3x)*scale} y2="5" stroke="currentColor" strokeWidth="4" className="text-yellow-500" markerEnd="url(#arrowhead)" />
                                     
                                     {/* Net X (Result) */}
                                     {Math.abs(totalPx) > 0.1 && (
                                         <rect x={totalPx > 0 ? 0 : totalPx*scale} y="-10" width={Math.abs(totalPx*scale)} height="20" fill="currentColor" className="text-red-500 opacity-20" />
                                     )}
                                 </g>
                             );
                        })()}
                    </svg>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>-X</span>
                    <span>0</span>
                    <span>+X</span>
                </div>
            </div>

            {/* Y-Axis Chart */}
            <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                <h5 className="text-xs font-bold text-gray-400 uppercase mb-2 text-center">Y-Momentum Sum (Should = 0)</h5>
                <div className="h-16 relative flex items-center">
                    <div className="absolute left-0 right-0 h-px bg-gray-600 top-1/2"></div>
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-600"></div>
                    <svg className="w-full h-full overflow-visible" viewBox="-100 -20 200 40">
                       {(() => {
                             const range = Math.max(Math.abs(p1x) + Math.abs(p2x) + Math.abs(p3x), Math.abs(p1y) + Math.abs(p2y) + Math.abs(p3y), 0.1) * 1.2;
                             const scale = 90 / range;
                             
                             let cy = 0;
                             // We draw Y horizontally here for layout consistency? 
                             // Or should we draw it vertically?
                             // User asked to see X and Y separately. 
                             // Representing Y as a horizontal bar chart of magnitude is often easier to read than a tall vertical one.
                             // But "Right" usually means +X. "Up" means +Y.
                             // Let's stick to horizontal representation for the SUM logic (Number line), but maybe label it well.
                             // Actually, let's keep X Horizontal and Y Horizontal (as number lines) seems easiest to compare magnitudes.
                             
                             return (
                                 <g transform="translate(0,0)">
                                     <line x1={cy} y1="-5" x2={cy + p1y*scale} y2="-5" stroke="currentColor" strokeWidth="4" className="text-blue-500" markerEnd="url(#arrowhead)" />
                                     <line x1={cy + p1y*scale} y1="0" x2={cy + (p1y+p2y)*scale} y2="0" stroke="currentColor" strokeWidth="4" className="text-purple-500" markerEnd="url(#arrowhead)" />
                                     <line x1={cy + (p1y+p2y)*scale} y1="5" x2={cy + (p1y+p2y+p3y)*scale} y2="5" stroke="currentColor" strokeWidth="4" className="text-yellow-500" markerEnd="url(#arrowhead)" />
                                     
                                     {Math.abs(totalPy) > 0.1 && (
                                         <rect x={totalPy > 0 ? 0 : totalPy*scale} y="-10" width={Math.abs(totalPy*scale)} height="20" fill="currentColor" className="text-red-500 opacity-20" />
                                     )}
                                 </g>
                             );
                        })()}
                    </svg>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>-Y</span>
                    <span>0</span>
                    <span>+Y</span>
                </div>
            </div>

        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs font-bold uppercase">
          <div className="flex items-center gap-1 text-blue-400"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Part 1</div>
          <div className="flex items-center gap-1 text-purple-400"><div className="w-3 h-3 bg-purple-500 rounded-full"></div> Part 2</div>
          <div className="flex items-center gap-1 text-yellow-400"><div className="w-3 h-3 bg-yellow-500 rounded-full"></div> Part 3</div>
          <div className="flex items-center gap-1 text-red-500"><div className="w-3 h-3 bg-red-500 rounded-full opacity-50"></div> Net Error</div>
        </div>
        
      </div>
    </div>
  );
};

export default SectionThree;
