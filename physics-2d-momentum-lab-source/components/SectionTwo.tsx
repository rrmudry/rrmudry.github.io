import React from 'react';

type SectionTwoProps = {
  data: any;
  updateData: (section: string, field: string, value: any) => void;
};

const SectionTwo: React.FC<SectionTwoProps> = ({ data, updateData }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-xl mb-8">
      <h2 className="text-2xl font-bold text-cyan-400 mb-4 tracking-wider flex items-center">
        <span className="bg-cyan-900 text-cyan-300 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">02</span>
        SECTION 2: 2D SIMULATOR OBSERVATIONS
      </h2>

      <div className="mb-6 bg-gray-900/80 p-4 rounded border-l-4 border-blue-500">
        <h3 className="text-blue-400 font-bold mb-2 uppercase">Instructions</h3>
        <p className="text-gray-300 mb-4">
          Open the simulator instructions below. Switch to <span className="text-white font-bold">2D Mode</span>. 
          Create several explosions and observe the fragments.
        </p>
        <a 
          href="https://rrmudry.github.io/conservation-of-momentum/index.html" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded transition-colors"
        >
          LAUNCH SIMULATOR 
          <svg className="w-4 h-4 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-cyan-300 text-sm font-bold mb-2">
            Observation 1: How is the explosion balanced in the X-direction (Left/Right)?
          </label>
          <p className="text-xs text-gray-500 mb-2">Does one side seem to have more momentum, or do they cancel out?</p>
          <textarea
            className="w-full bg-gray-900 text-white border border-gray-600 rounded p-3 focus:outline-none focus:border-cyan-500 transition-colors"
            rows={4}
            value={data.obsX || ''}
            onChange={(e) => updateData('section2', 'obsX', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-cyan-300 text-sm font-bold mb-2">
             Observation 2: How is the explosion balanced in the Y-direction (Up/Down)?
          </label>
          <textarea
            className="w-full bg-gray-900 text-white border border-gray-600 rounded p-3 focus:outline-none focus:border-cyan-500 transition-colors"
            rows={4}
            value={data.obsY || ''}
            onChange={(e) => updateData('section2', 'obsY', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default SectionTwo;
