import React from 'react';

type SectionOneProps = {
  data: any;
  updateData: (section: string, field: string, value: any) => void;
};

const SectionOne: React.FC<SectionOneProps> = ({ data, updateData }) => {
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
          <p className="text-gray-300 italic mb-2">Watch the video above and verify your understanding of 2D momentum vectors.</p>
        </div>

        {/* 5 Questions */}
        {[1, 2, 3, 4, 5].map((num) => (
          <div key={num}>
            <label className="block text-cyan-300 text-sm font-bold mb-2">Question #{num} (Placeholder)</label>
            <textarea
              className="w-full bg-gray-900 text-white border border-gray-600 rounded p-3 focus:outline-none focus:border-cyan-500 transition-colors"
              rows={2}
              placeholder="Enter your answer here..."
              value={data[`q${num}`] || ''}
              onChange={(e) => updateData('section1', `q${num}`, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionOne;
