import React from 'react';

interface SectionTwoProps {
  answers: {
    q1: string;
    q2: string;
  };
  onUpdate: (field: string, val: string) => void;
}

export const SectionTwo: React.FC<SectionTwoProps> = ({ answers, onUpdate }) => {
  return (
    <section className="bg-[#161b2e] border border-[#1e293b] rounded-xl p-6 shadow-xl space-y-8">
      <div className="flex items-center space-x-3 mb-2">
        <div className="w-2 h-8 bg-purple-600 rounded-full shadow-[0_0_10px_rgba(147,51,234,0.5)]"></div>
        <h2 className="text-xl font-orbitron text-white uppercase">Section 3: Conclusion & Synthesis</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <label className="text-sm font-semibold text-slate-300 block leading-snug">
            1. Based on your vector diagram, did the net momentum of the fragments truly sum to zero? Explain any discrepancies (friction, air resistance, rounding).
          </label>
          <textarea
            value={answers.q1}
            onChange={(e) => onUpdate('conceptualAnswers.q1', e.target.value)}
            placeholder="Analytical response required..."
            rows={4}
            className="w-full bg-[#0a0e17] border border-[#1e293b] rounded-lg p-4 text-white focus:outline-none focus:border-purple-500 transition-colors font-mono text-sm"
          />
        </div>

        <div className="space-y-4">
          <label className="text-sm font-semibold text-slate-300 block leading-snug">
            2. In a 2D explosion, can momentum be conserved in the X-direction but NOT in the Y-direction? Explain why or why not.
          </label>
          <textarea
            value={answers.q2}
            onChange={(e) => onUpdate('conceptualAnswers.q2', e.target.value)}
            placeholder="Analytical response required..."
            rows={4}
            className="w-full bg-[#0a0e17] border border-[#1e293b] rounded-lg p-4 text-white focus:outline-none focus:border-purple-500 transition-colors font-mono text-sm"
          />
        </div>
      </div>
    </section>
  );
};
