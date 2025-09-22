import React from 'react';
import { useSpeech } from '../services/speechService';

interface SpeakButtonProps {
  textToSpeak: string;
  className?: string;
}

const SpeakButton: React.FC<SpeakButtonProps> = ({ textToSpeak, className }) => {
  const { speak, cancel, isSpeaking } = useSpeech();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isSpeaking) {
      cancel();
    } else {
      speak(textToSpeak);
    }
  };

  const a11yLabel = isSpeaking ? 'Stop reading aloud' : 'Read aloud';

  return (
    <button
      onClick={handleClick}
      aria-label={a11yLabel}
      title={isSpeaking ? 'Stop reading aloud' : 'Read description aloud'}
      className={`relative p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${isSpeaking ? 'bg-sky-200 text-sky-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} ${className || ''}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
      {isSpeaking && (
        <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
        </span>
      )}
    </button>
  );
};

export default SpeakButton;
