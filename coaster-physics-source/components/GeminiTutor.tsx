import React, { useState } from 'react';
import { SimulationState } from '../types';
import { generatePhysicsExplanation, generateQuizQuestion } from '../services/geminiService';
import { Bot, Brain, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface GeminiTutorProps {
  simulationState: SimulationState;
}

const GeminiTutor: React.FC<GeminiTutorProps> = ({ simulationState }) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quiz, setQuiz] = useState<{question: string, options: string[], answer: number, explanation: string} | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleExplain = async () => {
    setIsLoading(true);
    setQuiz(null); // clear quiz
    const text = await generatePhysicsExplanation(
      simulationState.kineticEnergy,
      simulationState.potentialEnergy,
      simulationState.totalEnergy,
      simulationState.height,
      simulationState.velocity,
      simulationState.mass
    );
    setExplanation(text);
    setIsLoading(false);
  };

  const handleQuiz = async () => {
      setIsLoading(true);
      setExplanation(null);
      setSelectedOption(null);
      const data = await generateQuizQuestion(simulationState.totalEnergy / (simulationState.mass * 10), simulationState.mass); // approx max height from TE
      setQuiz(data);
      setIsLoading(false);
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-purple-500/30 shadow-lg overflow-hidden flex flex-col h-full">
      <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2 text-purple-400">
          <Bot size={20} />
          <h2 className="font-bold">AI Physics Tutor</h2>
        </div>
        <div className="flex gap-2">
            <button
            onClick={handleExplain}
            disabled={isLoading}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded transition-colors flex items-center gap-1 disabled:opacity-50"
            >
            <Brain size={12} /> Explain State
            </button>
            <button
            onClick={handleQuiz}
            disabled={isLoading}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors flex items-center gap-1 disabled:opacity-50"
            >
            <RefreshCw size={12} /> Quiz Me
            </button>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-purple-400 animate-pulse">
            Thinking...
          </div>
        ) : quiz ? (
             <div className="space-y-4 animate-fadeIn">
                <p className="font-semibold text-white">{quiz.question}</p>
                <div className="space-y-2">
                    {quiz.options.map((opt, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedOption(idx)}
                            disabled={selectedOption !== null}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                                selectedOption === null 
                                    ? 'bg-slate-700 border-slate-600 hover:border-purple-500' 
                                    : selectedOption === idx 
                                        ? idx === quiz.answer 
                                            ? 'bg-green-900/30 border-green-500' 
                                            : 'bg-red-900/30 border-red-500'
                                        : idx === quiz.answer
                                            ? 'bg-green-900/30 border-green-500'
                                            : 'bg-slate-800 border-slate-700 opacity-50'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-xs font-mono border border-slate-700">
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                {opt}
                                {selectedOption !== null && idx === quiz.answer && <CheckCircle size={16} className="text-green-500 ml-auto" />}
                                {selectedOption !== null && selectedOption === idx && idx !== quiz.answer && <XCircle size={16} className="text-red-500 ml-auto" />}
                            </div>
                        </button>
                    ))}
                </div>
                {selectedOption !== null && (
                    <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg text-sm text-purple-200">
                        <span className="font-bold block mb-1">Explanation:</span>
                        {quiz.explanation}
                    </div>
                )}
             </div>
        ) : explanation ? (
          <div className="text-slate-200 leading-relaxed animate-fadeIn">
            {explanation}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center text-sm p-4">
            <p>Pause the simulation or select a moment to ask the AI tutor about the energy conversion happening.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeminiTutor;
