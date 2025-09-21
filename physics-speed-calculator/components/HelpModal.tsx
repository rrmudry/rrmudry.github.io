import React, { useEffect } from 'react';
import FormulaTriangle from './FormulaTriangle';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true"></div>
      <div
        className="relative bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full m-4 transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close help"
          className="absolute top-4 right-4 p-1 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 id="help-modal-title" className="text-3xl font-bold text-slate-800 text-center mb-2">
          Understanding the Formula
        </h2>
        <p className="text-center text-slate-600 mb-6">
            The relationship between speed (v), distance (x), and time (t) can be easily remembered with this triangle.
        </p>

        <FormulaTriangle />
        
        <p className="text-center text-slate-600 mt-6 text-sm">
            <strong>How to use it:</strong> Click on the variable you want to find. The triangle will rearrange to show you the correct formula.
        </p>
      </div>
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in-scale {
          animation: fadeInScale 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default HelpModal;