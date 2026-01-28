import React from 'react';

type SectionOneProps = {
  data: any;
  updateData: (section: string, field: string, value: any) => void;
};

const SectionOne: React.FC<SectionOneProps> = ({ data, updateData }) => {
  const questions = [
    {
      id: "q1",
      label: "1. What defines an 'explosion' in the context of physics as discussed in the video?",
      placeholder: "Explain what happens to the object..."
    },
    {
      id: "q2",
      label: "2. Why is momentum conserved during an explosion, according to the video?",
      placeholder: "Consider outside forces..."
    },
    {
      id: "q3",
      label: "3. The video states that an explosion is a 'reverse inelastic collision.' What does this mean for the properties of energy during an explosion?",
      placeholder: "Is kinetic energy conserved? Why or why not?"
    },
    {
      id: "q4",
      label: "4. If a watermelon explodes, and its initial momentum was zero, what can be said about the total momentum of all the pieces after the explosion?",
      placeholder: "Describe the total sum..."
    },
    {
      id: "q5",
      label: "5. When two objects of different masses explode from a stationary position, which object will move faster, and why?",
      placeholder: "Explain using the relationship between mass and velocity..."
    }
  ];

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-xl mb-8">
      <h2 className="text-2xl font-bold text-cyan-400 mb-4 tracking-wider flex items-center">
        <span className="bg-cyan-900 text-cyan-300 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">01</span>
        SECTION 1: MISSION BRIEFING
      </h2>

      <div className="space-y-6">
        {/* Video Embed */}
        <div className="aspect-w-16 aspect-h-9 mb-6 border-2 border-cyan-500/30 rounded-lg overflow-hidden shadow-lg">
          <iframe 
            width="100%" 
            height="400" 
            src="https://www.youtube.com/embed/zv3IzDros9c" 
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            className="w-full object-cover"
          ></iframe>
        </div>

        <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
          <p className="text-gray-300 italic mb-2">Watch the video above and answer the following questions based on the content.</p>
        </div>

        {/* 5 Questions */}
        {questions.map((q) => (
          <div key={q.id}>
            <label className="block text-cyan-300 text-sm font-bold mb-2">{q.label}</label>
            <textarea
              className="w-full bg-gray-900 text-white border border-gray-600 rounded p-3 focus:outline-none focus:border-cyan-500 transition-colors"
              rows={3}
              placeholder={q.placeholder}
              value={data[q.id] || ''}
              onChange={(e) => updateData('section1', q.id, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionOne;
