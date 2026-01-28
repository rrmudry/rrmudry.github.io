import React from 'react';

interface VideoSectionProps {
  answers: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    q5: string;
  };
  onUpdate: (field: string, val: string) => void;
}

export const VideoSection: React.FC<VideoSectionProps> = ({ answers, onUpdate }) => {
  const questions = [
    { id: 'q1', label: '1. What happens to the momentum of the bullet when it hits the water?' },
    { id: 'q2', label: '2. Explain the relationship between the bullet\'s velocity and the water\'s displacement.' },
    { id: 'q3', label: '3. Why does the bullet shatter upon impact at high speeds?' },
    { id: 'q4', label: '4. How is the total momentum of the system conserved in this collision?' },
    { id: 'q5', label: '5. Describe the transfer of energy from the bullet to the water molecules.' }
  ];

  return (
    <section className="bg-[#161b2e] border border-[#1e293b] rounded-xl p-6 shadow-xl space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-2 h-8 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
        <h2 className="text-xl font-orbitron text-white">SECTION 1: CONCEPTUAL OVERVIEW (VIDEO)</h2>
      </div>

      <div className="aspect-video w-full rounded-xl overflow-hidden border border-[#1e293b] shadow-2xl bg-black">
        <iframe 
          className="w-full h-full"
          src="https://www.youtube.com/embed/zv3IzDros9c" 
          title="Physics Video" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
      </div>

      <div className="space-y-8">
        {questions.map((q) => (
          <div key={q.id} className="space-y-4">
            <label className="text-sm font-semibold text-slate-300 block leading-snug">
              {q.label}
            </label>
            <textarea
              value={(answers as any)[q.id]}
              onChange={(e) => onUpdate(`videoAnswers.${q.id}`, e.target.value)}
              placeholder="Enter your scientific analysis..."
              rows={3}
              className="w-full bg-[#0a0e17] border border-[#1e293b] rounded-lg p-4 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm shadow-inner"
            />
          </div>
        ))}
      </div>
    </section>
  );
};
