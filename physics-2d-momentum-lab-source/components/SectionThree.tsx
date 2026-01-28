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

    </div>
  );
};

export default SectionThree;
