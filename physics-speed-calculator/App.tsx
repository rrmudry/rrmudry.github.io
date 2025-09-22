import React, { useState, useEffect, useCallback } from 'react';
import Confetti from 'react-confetti';
import { getQuestions } from './services/questionService';
import QuestionDisplay from './components/QuestionDisplay';
import InteractiveEquation from './components/InteractiveEquation';
import ProgressBar from './components/ProgressBar';
import { Question, Value, Variable } from './types';
import SpeakButton from './components/SpeakButton';
import HelpModal from './components/HelpModal';
import CalculatorPanel from './components/CalculatorPanel';

type Feedback = {
  message: string;
  type: 'correct' | 'incorrect' | 'info';
};

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return windowSize;
};

const FeedbackDisplay: React.FC<{ feedback: Feedback | null }> = ({ feedback }) => {
  if (!feedback) return null;
  const baseStyle = "mt-4 p-4 rounded-lg text-center font-semibold text-lg transition-all duration-300 transform ";
  const typeStyle = {
      correct: "bg-green-100 text-green-800 scale-105",
      incorrect: "bg-red-100 text-red-800 animate-shake",
      info: "bg-blue-100 text-blue-800",
  };
  return <div className={`${baseStyle} ${typeStyle[feedback.type]}`}>{feedback.message}</div>
};

const LevelButton: React.FC<{ levelNum: 1 | 2; currentLevel: 1 | 2; onLevelChange: (level: 1 | 2) => void; }> = ({ levelNum, currentLevel, onLevelChange }) => {
  const isActive = currentLevel === levelNum;
  const activeClasses = "bg-sky-600 text-white shadow-md";
  const inactiveClasses = "bg-white text-slate-600 hover:bg-slate-100";
  return (
      <button 
          onClick={() => onLevelChange(levelNum)}
          className={`px-6 py-2 rounded-lg font-bold transition-all ${isActive ? activeClasses : inactiveClasses}`}
      >
          Level {levelNum}
      </button>
  )
};

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [droppedValues, setDroppedValues] = useState<{ [key: string]: Value | null }>({});
  const [droppedUnknown, setDroppedUnknown] = useState<Variable | null>(null);
  const [selectedValue, setSelectedValue] = useState<Value | null>(null);
  const [selectedUnknown, setSelectedUnknown] = useState<Variable | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [calculatedAnswer, setCalculatedAnswer] = useState<number | null>(null);
  const [level, setLevel] = useState<1 | 2>(1);
  const [userAnswer, setUserAnswer] = useState('');
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(true); // Open on first load
  const [hasSeenHelp, setHasSeenHelp] = useState(false);
  const [animateHelpButton, setAnimateHelpButton] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calculatorPosition, setCalculatorPosition] = useState(() => {
    if (typeof window === 'undefined') {
      return { x: 24, y: 120 };
    }
    return { x: Math.max(24, window.innerWidth - 320), y: 140 };
  });
  const CALC_WIDTH = 288;
  const CALC_HEIGHT = 360;


  useEffect(() => {
    const loadedQuestions = getQuestions();
    setQuestions(loadedQuestions);
    resetForQuestion(0, loadedQuestions);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const resetForQuestion = useCallback((index: number, questionSet: Question[]) => {
    if (questionSet.length > 0) {
      setDroppedValues({
        [Variable.Velocity]: null,
        [Variable.Distance]: null,
        [Variable.Time]: null,
      });
    } else {
      setDroppedValues({});
    }
    setDroppedUnknown(null);
    setFeedback(null);
    setShowAnswer(false);
    setCalculatedAnswer(null);
    setUserAnswer('');
    setSelectedValue(null);
    setSelectedUnknown(null);
  }, []);

  const handleLevelChange = (newLevel: 1 | 2) => {
    setLevel(newLevel);
    resetForQuestion(currentQuestionIndex, questions);
  }

  const handleCloseHelpModal = () => {
    setIsHelpModalOpen(false);
    if (!hasSeenHelp) {
      setHasSeenHelp(true);
      setAnimateHelpButton(true);
      setTimeout(() => {
        setAnimateHelpButton(false);
      }, 2000);
    }
  };

  const handleDrop = (
    targetVariable: Variable,
    payload: { type: 'value'; value: Value } | { type: 'unknown'; variable: Variable }
  ) => {
    if (payload.type === 'value') {
      const { value } = payload;
      const isValueAlreadyPlaced = Object.values(droppedValues).some(v => v?.id === value.id);
      if (isValueAlreadyPlaced) {
        setSelectedValue(null);
        setSelectedUnknown(null);
        return;
      }

      if (droppedUnknown === targetVariable) {
        setDroppedUnknown(null);
      }

      setDroppedValues(prev => ({
        ...prev,
        [targetVariable]: value,
      }));
    } else if (payload.type === 'unknown') {
      const newDroppedValues = { ...droppedValues };
      if (newDroppedValues[targetVariable]) {
        newDroppedValues[targetVariable] = null;
        setDroppedValues(newDroppedValues);
      }
      setDroppedUnknown(targetVariable);
    }

    setSelectedValue(null);
    setSelectedUnknown(null);
  };

  const handleValueSelect = useCallback((value: Value) => {
    const isValueAlreadyPlaced = Object.values(droppedValues).some(v => v?.id === value.id);
    if (isValueAlreadyPlaced) {
      setSelectedValue(null);
      return;
    }

    setSelectedUnknown(null);
    setSelectedValue(prev => (prev?.id === value.id ? null : value));
  }, [droppedValues]);

  const handleUnknownSelect = useCallback((variable: Variable) => {
    setSelectedValue(null);
    setSelectedUnknown(prev => (prev === variable ? null : variable));
  }, []);

  const handleZoneTap = (variable: Variable) => {
    if (selectedValue) {
      handleDrop(variable, { type: 'value', value: selectedValue });
    } else if (selectedUnknown) {
      handleDrop(variable, { type: 'unknown', variable: selectedUnknown });
    }
  };

  useEffect(() => {
    if (!isCalculatorOpen) return;
    setCalculatorPosition(prev => {
      const maxX = Math.max(16, width - CALC_WIDTH - 16);
      const maxY = Math.max(16, height - CALC_HEIGHT - 16);
      return {
        x: Math.min(Math.max(prev.x, 16), maxX),
        y: Math.min(Math.max(prev.y, 16), maxY),
      };
    });
  }, [width, height, isCalculatorOpen]);

  const moveCalculator = useCallback(
    (position: { x: number; y: number }) => {
      const maxX = Math.max(16, width - CALC_WIDTH - 16);
      const maxY = Math.max(16, height - CALC_HEIGHT - 16);
      setCalculatorPosition({
        x: Math.min(Math.max(position.x, 16), maxX),
        y: Math.min(Math.max(position.y, 16), maxY),
      });
    },
    [width, height],
  );

  const handleCheckAnswer = () => {
    const question = questions[currentQuestionIndex];
    if (!question) return;

    // --- Common checks for both levels ---
    if (droppedUnknown !== question.solveFor) {
      setFeedback({ message: "The unknown term seems to be in the wrong place. Where should the answer go?", type: 'incorrect' });
      return;
    }
    
    let isPlacementCorrect = true;
    for (const key in droppedValues) {
      const dropped = droppedValues[key];
      if (dropped && dropped.variable !== key) {
        isPlacementCorrect = false;
        break;
      }
    }
    
    if(!isPlacementCorrect) {
        setFeedback({ message: "Hmm, one of the values is in the wrong place. Check your variables!", type: 'incorrect' });
        return;
    }

    const placedValueCount = Object.values(droppedValues).filter(Boolean).length;
    const requiredValues = question.values.length;
    if(placedValueCount !== requiredValues) {
        setFeedback({ message: "Looks like not all values have been placed. Try again!", type: 'incorrect' });
        return;
    }

    // --- Calculation ---
    let calculated = 0;
    const v = droppedValues[Variable.Velocity];
    const x = droppedValues[Variable.Distance];
    const t = droppedValues[Variable.Time];

    try {
        if (question.solveFor === Variable.Velocity) {
            calculated = x!.value / t!.value;
        } else if (question.solveFor === Variable.Distance) {
            calculated = v!.value * t!.value;
        } else if (question.solveFor === Variable.Time) {
            calculated = x!.value / v!.value;
        }
    } catch(e) {
        setFeedback({ message: "Something went wrong with the calculation based on the placed values.", type: 'incorrect' });
        return;
    }

    const newCompleted = new Set(completedQuestions).add(question.id);
    const allQuestionsCompleted = newCompleted.size === questions.length;

    const showFinalMessage = () => {
        if (allQuestionsCompleted) {
            setFeedback({ message: "Congratulations! You've completed all the questions. Restart to practice again.", type: 'correct' });
            setShowConfetti(true);
        }
    };
    
    // --- Level-specific checks ---
    if (level === 1) {
      setFeedback({ message: 'Correct! Great job!', type: 'correct' });
      setShowAnswer(true);
      setCalculatedAnswer(calculated);
      setCompletedQuestions(newCompleted);
      showFinalMessage();
    } else { // Level 2
      const correctAnswer = parseFloat(calculated.toFixed(2));
      const userAnswerNum = parseFloat(userAnswer);

      if (isNaN(userAnswerNum)) {
        setFeedback({ message: "Please enter a valid number for your answer.", type: 'incorrect' });
        return;
      }

      if (Math.abs(userAnswerNum - correctAnswer) < 0.01) {
        setFeedback({ message: 'Correct! Your calculation is spot on!', type: 'correct' });
        setShowAnswer(true);
        setCalculatedAnswer(calculated);
        setCompletedQuestions(newCompleted);
        showFinalMessage();
      } else {
        setFeedback({ message: `Not quite. Check your calculation and make sure to round to the nearest hundredth.`, type: 'incorrect' });
      }
    }
  };

  const handleNextQuestion = () => {
    const nextIndex = (currentQuestionIndex + 1) % questions.length;
    setCurrentQuestionIndex(nextIndex);
    resetForQuestion(nextIndex, questions);
  };
  
  const handleReset = () => {
    resetForQuestion(currentQuestionIndex, questions);
  }

  const handleRestart = () => {
    setCompletedQuestions(new Set());
    setCurrentQuestionIndex(0);
    resetForQuestion(0, questions);
    setShowConfetti(false);
  };

  if (questions.length === 0) {
    return <div>Loading questions...</div>;
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const placedValues = Object.values(droppedValues).filter(v => v !== null) as Value[];
  const allCompleted = completedQuestions.size === questions.length;
  const instructionText = "Drag or tap the values and the unknown term from the problem into the equation.";

  return (
    <>
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        {showConfetti && (
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={400}
            onConfettiComplete={() => setShowConfetti(false)}
          />
        )}
        <div className="w-full max-w-4xl mx-auto">
          <header className="text-center mb-6 relative">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-800">Physics Speed Calculator</h1>
            <div className="flex justify-center items-center gap-2 mt-2">
              <p className="text-slate-600 text-lg">{instructionText}</p>
              <SpeakButton textToSpeak={instructionText} />
            </div>
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className={`absolute top-0 right-0 p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors ${animateHelpButton ? 'animate-pulse-glow' : ''}`}
              aria-label="Open help"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </header>

          <div className="flex justify-center mb-6">
              <div className="flex space-x-2 bg-slate-200 p-1 rounded-lg">
                  <LevelButton levelNum={1} currentLevel={level} onLevelChange={handleLevelChange} />
                  <LevelButton levelNum={2} currentLevel={level} onLevelChange={handleLevelChange} />
              </div>
          </div>

          <main className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-12">
            <ProgressBar
              current={completedQuestions.size}
              total={questions.length}
              currentQuestionIndex={currentQuestionIndex}
            />
            <QuestionDisplay 
              question={currentQuestion}
              placedValues={placedValues}
              isUnknownPlaced={droppedUnknown !== null}
              onValueSelect={handleValueSelect}
              onUnknownSelect={handleUnknownSelect}
              selectedValueId={selectedValue?.id ?? null}
              selectedUnknown={selectedUnknown}
            />

            <div className="mt-12 flex justify-center items-center">
                <InteractiveEquation
                  solveFor={currentQuestion.solveFor}
                  droppedValues={droppedValues}
                  onDrop={handleDrop}
                  calculatedAnswer={calculatedAnswer}
                  droppedUnknown={droppedUnknown}
                  unknownText={currentQuestion.unknownText}
                  level={level}
                  userAnswer={userAnswer}
                  onAnswerChange={setUserAnswer}
                  onZoneTap={handleZoneTap}
                  selectedValue={selectedValue}
                  selectedUnknown={selectedUnknown}
                />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCalculatorOpen(prev => !prev)}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-100"
              >
                <span aria-hidden="true">🧮</span>
                {isCalculatorOpen ? 'Hide calculator' : 'Open calculator'}
              </button>
            </div>
            
            <div className="mt-8">
              <FeedbackDisplay feedback={feedback} />
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                  onClick={handleCheckAnswer}
                  disabled={showAnswer}
                  className="w-full sm:w-auto px-8 py-3 bg-sky-600 text-white font-bold rounded-lg shadow-md hover:bg-sky-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                Check Answer
              </button>
              <button
                  onClick={handleReset}
                  className="w-full sm:w-auto px-8 py-3 bg-slate-500 text-white font-bold rounded-lg shadow-md hover:bg-slate-600 transition-colors"
              >
                Reset
              </button>
              {showAnswer && (
                allCompleted ? (
                  <button
                      onClick={handleRestart}
                      className="w-full sm:w-auto px-8 py-3 bg-emerald-600 text-white font-bold rounded-lg shadow-md hover:bg-emerald-700 transition-colors animate-pulse"
                  >
                      Restart Quiz
                  </button>
                ) : (
                  <button
                      onClick={handleNextQuestion}
                      className="w-full sm:w-auto px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                  >
                      Next Question
                  </button>
                )
              )}
            </div>
          </main>
          
          <footer className="text-center mt-8 text-slate-500">
              <p>Built for interactive physics learning.</p>
          </footer>
        </div>
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
          @keyframes pulse-glow {
            0% {
              box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
            }
          }
          .animate-pulse-glow {
            animation: pulse-glow 2s;
          }
          input[type="number"]::-webkit-inner-spin-button, 
          input[type="number"]::-webkit-outer-spin-button { 
            -webkit-appearance: none; 
            margin: 0; 
          }
          input[type="number"] {
            -moz-appearance: textfield;
          }
        `}</style>
      </div>
      <HelpModal isOpen={isHelpModalOpen} onClose={handleCloseHelpModal} />
      {isCalculatorOpen && (
        <CalculatorPanel
          position={calculatorPosition}
          onPositionChange={moveCalculator}
          onClose={() => setIsCalculatorOpen(false)}
        />
      )}
    </>
  );
};

export default App;
