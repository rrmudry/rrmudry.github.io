import React from 'react';

type SectionFourProps = {
  data: any;
  updateData: (section: string, field: string, value: any) => void;
};

const SectionFour: React.FC<SectionFourProps> = ({ data, updateData }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-xl mb-8">
      <h2 className="text-2xl font-bold text-cyan-400 mb-4 tracking-wider flex items-center">
        <span className="bg-cyan-900 text-cyan-300 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">04</span>
        SECTION 4: CONCLUSION
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block text-cyan-300 text-sm font-bold mb-2">
            1. Why must the total momentum in the Y-direction be zero if the object was explicitly moving only in the X-direction (or stationary) before the explosion?
          </label>
          <textarea
            className="w-full bg-gray-900 text-white border border-gray-600 rounded p-3 focus:outline-none focus:border-cyan-500 transition-colors"
            rows={4}
            value={data.q1 || ''}
            onChange={(e) => updateData('section4', 'q1', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-cyan-300 text-sm font-bold mb-2">
            2. If one piece flies off at an angle, why MUST another piece fly off in generally the opposite direction? Use Newton's Laws or Momentum in your answer.
          </label>
          <textarea
            className="w-full bg-gray-900 text-white border border-gray-600 rounded p-3 focus:outline-none focus:border-cyan-500 transition-colors"
            rows={4}
            value={data.q2 || ''}
            onChange={(e) => updateData('section4', 'q2', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default SectionFour;
