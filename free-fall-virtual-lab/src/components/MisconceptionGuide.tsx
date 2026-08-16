import React, { useState } from 'react';

export const MisconceptionGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden bg-slate-900/80 shadow-xl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">💡</span>
          <div>
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              Physics Insight: Why Do Heavy &amp; Light Objects Fall Together in a Vacuum?
            </h3>
            <p className="text-[10px] text-slate-400">
              Click to explore Newton's 2nd Law, inertia cancellation, and the mechanics of terminal velocity
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-400 font-mono px-2 py-1 rounded bg-white/5">
          {isOpen ? '▲ Hide' : '▼ Learn More'}
        </span>
      </button>

      {isOpen && (
        <div className="p-4 pt-2 border-t border-white/10 text-xs space-y-3.5 text-slate-300 leading-relaxed bg-slate-950/60">
          
          {/* Section 1: Inertia vs Gravity */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20">
            <h4 className="font-bold text-cyan-300 text-sm mb-1">
              1. The Perfect Balance: Gravity vs. Inertia
            </h4>
            <p className="mb-2">
              It is common to assume that because a 5 kg bowling ball experiences 1,000 times more gravitational force than a 5 g feather, it must fall faster. But Newton's Second Law reveals the truth:
            </p>
            <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-center font-bold text-amber-300 border border-white/10 my-2">
              a = F<sub>net</sub> / m = (m · g) / m = g = 9.8 m/s²
            </div>
            <p>
              A heavier object has more <strong>gravitational force</strong> pulling it downward, but it also has proportionally more <strong>inertia (mass)</strong> resisting any change in motion. The extra downward pull is canceled out by the extra inertia, resulting in the <strong>exact same downward acceleration (g)</strong> for every object on Earth!
            </p>
          </div>

          {/* Section 2: When Air Resistance Enters */}
          <div className="p-3 rounded-xl bg-orange-950/30 border border-orange-500/20">
            <h4 className="font-bold text-orange-300 text-sm mb-1">
              2. Why Feathers Fall Slower in Everyday Air
            </h4>
            <p className="mb-2">
              In real-world air, an upward drag force opposes motion:
            </p>
            <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-center font-bold text-orange-300 border border-white/10 my-2">
              F<sub>drag</sub> = ½ · ρ · v² · C<sub>d</sub> · A
            </div>
            <p>
              Because a feather has a very small mass and weight (0.049 N), it only needs to travel at ~1.5 m/s before upward air drag balances its entire weight. Once <strong>F<sub>drag</sub> = F<sub>g</sub></strong>, the net force is zero and acceleration drops to <strong>0 m/s²</strong> (Terminal Velocity). A dense bowling ball needs over 60 m/s of speed to generate enough drag to equal its 49 N weight!
            </p>
          </div>

          {/* Section 3: The Apollo 15 Moon Proof */}
          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20">
            <h4 className="font-bold text-purple-300 text-sm mb-1">
              3. The Apollo 15 Lunar Demonstration
            </h4>
            <p>
              In 1971, Apollo 15 Commander David Scott stood in the natural vacuum of the Moon and dropped a 1.3 kg geological hammer and a 0.03 kg falcon feather simultaneously. With zero atmosphere to create drag, both hit the lunar regolith at the exact same instant, verifying Galileo's hypothesis!
            </p>
          </div>

        </div>
      )}
    </div>
  );
};
