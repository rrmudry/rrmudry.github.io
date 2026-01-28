
import React, { useEffect, useState } from 'react';

interface VideoSectionProps {
  answers: { q1: string; q2: string; q3: string };
  onUpdate: (field: string, val: string) => void;
}

export const VideoSection: React.FC<VideoSectionProps> = ({ answers, onUpdate }) => {
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    // Capturing the current origin helps YouTube verify the embed in restricted environments
    try {
      setOrigin(window.location.origin);
    } catch (e) {
      console.warn("Could not determine origin for video embed verification.");
    }
  }, []);

  // Constructing the URL with rel=0 (related videos from same channel) 
  // and the origin parameter to resolve Error 153
  const videoUrl = `https://www.youtube.com/embed/kIA1wSl63oQ?rel=0&modestbranding=1${origin ? `&origin=${encodeURIComponent(origin)}` : ''}`;

  return (
    <section className="bg-[#161b2e] border border-[#1e293b] rounded-xl p-6 shadow-xl space-y-8 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
      
      <div className="flex items-center space-x-3 mb-2">
        <div className="p-2 bg-cyan-500/10 rounded-lg">
          <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-orbitron text-white uppercase tracking-wider">SECTION 1: MISSION BRIEFING</h2>
      </div>

      <div className="space-y-6">
        <div className="no-print relative pt-[56.25%] w-full rounded-xl overflow-hidden border border-[#334155] shadow-2xl bg-black">
          <iframe 
            className="absolute top-0 left-0 w-full h-full"
            src={videoUrl} 
            title="Conservation of Momentum Video"
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen
          ></iframe>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-3 group/q">
            <label className="text-sm font-semibold text-slate-300 block group-hover/q:text-cyan-400 transition-colors">
              1. What is the initial momentum of the cannon and cannonball system before the explosion, and why is it that value (1:52)?
            </label>
            <textarea
              value={answers.q1}
              onChange={(e) => onUpdate('videoAnswers.q1', e.target.value)}
              className="w-full bg-[#0a0e17] border border-[#334155] rounded-lg p-4 text-white focus:outline-none focus:border-cyan-500 transition-all font-mono text-sm h-24 shadow-inner"
              placeholder="Record initial system state..."
            />
          </div>

          <div className="space-y-3 group/q">
            <label className="text-sm font-semibold text-slate-300 block group-hover/q:text-cyan-400 transition-colors">
              2. After the cannon fires the cannonball, what is the direction of the cannon's recoil velocity (3:10)?
            </label>
            <textarea
              value={answers.q2}
              onChange={(e) => onUpdate('videoAnswers.q2', e.target.value)}
              className="w-full bg-[#0a0e17] border border-[#334155] rounded-lg p-4 text-white focus:outline-none focus:border-cyan-500 transition-all font-mono text-sm h-24 shadow-inner"
              placeholder="Analyze vector direction..."
            />
          </div>

          <div className="space-y-3 group/q">
            <label className="text-sm font-semibold text-slate-300 block group-hover/q:text-cyan-400 transition-colors">
              3. How does the kinetic energy of the system change during the explosion, and where does the extra energy come from (5:57)?
            </label>
            <textarea
              value={answers.q3}
              onChange={(e) => onUpdate('videoAnswers.q3', e.target.value)}
              className="w-full bg-[#0a0e17] border border-[#334155] rounded-lg p-4 text-white focus:outline-none focus:border-cyan-500 transition-all font-mono text-sm h-24 shadow-inner"
              placeholder="Energy transformation analysis..."
            />
          </div>
        </div>
      </div>
    </section>
  );
};
