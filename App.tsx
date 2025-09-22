import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import {
  drawRandomQuestions,
  getQuestionBankSize,
} from './services/questionService';
import QuestionDisplay from './components/QuestionDisplay';
import InteractiveEquation from './components/InteractiveEquation';
import ProgressBar from './components/ProgressBar';
import { Question, Value, Variable } from './types';
import SpeakButton from './components/SpeakButton';
import HelpModal from './components/HelpModal';
import CalculatorPanel from './components/CalculatorPanel';
import StudentIdModal from './components/StudentIdModal';
import ScoreSummary from './components/ScoreSummary';

type Feedback = {
  message: string;
  type: 'correct' | 'incorrect' | 'info';
};

type Stage = 'registration' | 'level1' | 'level2' | 'level3' | 'summary';
type AttemptStatus = 'idle' | 'correct' | 'incorrect';

const LEVEL1_REQUIRED_STREAK = 6;
const LEVEL2_REQUIRED_CORRECT = 6;
const LEVEL2_REQUIRED_STREAK = 4;
const LEVEL3_TOTAL_QUESTIONS = 6;

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window === 'undefined' ? 1024 : window.innerWidth,
    height: typeof window === 'undefined' ? 768 : window.innerHeight,
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
  const baseStyle = 'mt-4 p-4 rounded-lg text-center font-semibold text-lg transition-all duration-300 transform ';
  const typeStyle = {
    correct: 'bg-green-100 text-green-800 scale-105',
    incorrect: 'bg-red-100 text-red-800 animate-shake',
    info: 'bg-blue-100 text-blue-800',
  } as const;

  return <div className={`${baseStyle} ${typeStyle[feedback.type]}`}>{feedback.message}</div>;
};

const StageBadge: React.FC<{ stage: Stage }> = ({ stage }) => {
  const labelMap: Record<Stage, string> = {
    registration: 'Registration',
    level1: 'Level 1 · Drag & Drop',
    level2: 'Level 2 · Calculate & Check',
    level3: 'Level 3 · Final Challenge',
    summary: 'Session Summary',
  };

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-200 text-slate-700 px-3 py-1 text-sm font-semibold uppercase tracking-wide">
      {labelMap[stage]}
    </span>
  );
};

const App: React.FC = () => {
  const [stage, setStage] = useState<Stage>('registration');
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [studentId, setStudentId] = useState('');

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const usedQuestionIdsRef = useRef<Set<number>>(new Set());

  const [droppedValues, setDroppedValues] = useState<{ [key: string]: Value | null }>({});
  const [droppedUnknown, setDroppedUnknown] = useState<Variable | null>(null);
  const [selectedValue, setSelectedValue] = useState<Value | null>(null);
  const [selectedUnknown, setSelectedUnknown] = useState<Variable | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [attemptStatus, setAttemptStatus] = useState<AttemptStatus>('idle');
  const [calculatedAnswer, setCalculatedAnswer] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState('');

  const [level1Stats, setLevel1Stats] = useState({ attempts: 0, correct: 0, streak: 0 });
  const [level2Stats, setLevel2Stats] = useState({ attempts: 0, correct: 0, streak: 0 });
  const [level3Stats, setLevel3Stats] = useState({ attempts: 0, score: 0 });

  const [pendingStage, setPendingStage] = useState<Stage | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(true);
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

  const resetInteractionState = useCallback(() => {
    setDroppedValues({
      [Variable.Velocity]: null,
      [Variable.Distance]: null,
      [Variable.Time]: null,
    });
    setDroppedUnknown(null);
    setSelectedValue(null);
    setSelectedUnknown(null);
    setFeedback(null);
    setAttemptStatus('idle');
    setCalculatedAnswer(null);
    setUserAnswer('');
  }, []);

  const loadNextQuestion = useCallback(() => {
    resetInteractionState();
    const [nextQuestion] = drawRandomQuestions(1, usedQuestionIdsRef.current);
    const updated = new Set(usedQuestionIdsRef.current);
    if (nextQuestion) {
      updated.add(nextQuestion.id);
      usedQuestionIdsRef.current = updated;
      setCurrentQuestion(nextQuestion);
    }
  }, [resetInteractionState]);

  const startStage = useCallback(
    (nextStage: Stage, options: { resetQuestionHistory?: boolean } = {}) => {
      if (options.resetQuestionHistory) {
        usedQuestionIdsRef.current = new Set();
      }

      setStage(nextStage);
      setPendingStage(null);
      setFeedback(null);
      setAttemptStatus('idle');
      setCalculatedAnswer(null);
      setUserAnswer('');
      setShowConfetti(false);

      if (nextStage === 'level1') {
        setLevel(1);
        setLevel1Stats({ attempts: 0, correct: 0, streak: 0 });
        setLevel2Stats({ attempts: 0, correct: 0, streak: 0 });
        setLevel3Stats({ attempts: 0, score: 0 });
        loadNextQuestion();
      } else if (nextStage === 'level2') {
        setLevel(2);
        setLevel2Stats({ attempts: 0, correct: 0, streak: 0 });
        loadNextQuestion();
      } else if (nextStage === 'level3') {
        setLevel(3);
        setLevel3Stats({ attempts: 0, score: 0 });
        loadNextQuestion();
      } else if (nextStage === 'summary') {
        setLevel(3);
        setShowConfetti(true);
        setCurrentQuestion(null);
      }
    },
    [loadNextQuestion],
  );

  const handleStudentIdSubmit = (id: string) => {
    setStudentId(id);
    startStage('level1', { resetQuestionHistory: true });
  };

  const handleCloseHelpModal = () => {
    setIsHelpModalOpen(false);
    if (!hasSeenHelp) {
      setHasSeenHelp(true);
      setAnimateHelpButton(true);
      setTimeout(() => setAnimateHelpButton(false), 2000);
    }
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

  const handleDrop = (
    targetVariable: Variable,
    payload: { type: 'value'; value: Value } | { type: 'unknown'; variable: Variable },
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
    } else {
      const updated = { ...droppedValues };
      if (updated[targetVariable]) {
        updated[targetVariable] = null;
        setDroppedValues(updated);
      }
      setDroppedUnknown(targetVariable);
    }

    setSelectedValue(null);
    setSelectedUnknown(null);
  };

  const handleZoneTap = (variable: Variable) => {
    if (selectedValue) {
      handleDrop(variable, { type: 'value', value: selectedValue });
    } else if (selectedUnknown) {
      handleDrop(variable, { type: 'unknown', variable: selectedUnknown });
    }
  };

  const handleCheckAnswer = () => {
    if (!currentQuestion) return;

    if (pendingStage === 'summary') {
      setFeedback({
        message: 'Level 3 is complete! Tap Next Question to see your score.',
        type: 'info',
      });
      return;
    }

    if (pendingStage && pendingStage !== 'summary') {
      setFeedback({ message: 'Level complete! Tap Next Question to continue.', type: 'info' });
      return;
    }

    if (attemptStatus === 'correct') {
      setFeedback({ message: 'Great work! Move to the next challenge.', type: 'info' });
      return;
    }

    if (droppedUnknown !== currentQuestion.solveFor) {
      setFeedback({
        message: 'Place the unknown in the correct part of the triangle before checking.',
        type: 'incorrect',
      });
      setAttemptStatus('incorrect');
      return;
    }

    const placementsValid = Object.entries(droppedValues).every(([slotKey, value]) => {
      if (!value) return true;
      return value.variable === (slotKey as Variable);
    });

    if (!placementsValid) {
      setFeedback({
        message: 'Something is in the wrong place. Double-check each variable.',
        type: 'incorrect',
      });
      setAttemptStatus('incorrect');
      return;
    }

    const placedCount = Object.values(droppedValues).filter(Boolean).length;
    if (placedCount !== currentQuestion.values.length) {
      setFeedback({
        message: 'Use every value from the question before checking your answer.',
        type: 'incorrect',
      });
      setAttemptStatus('incorrect');
      return;
    }

    const v = droppedValues[Variable.Velocity];
    const x = droppedValues[Variable.Distance];
    const t = droppedValues[Variable.Time];

    let calculated = 0;
    try {
      if (currentQuestion.solveFor === Variable.Velocity) {
        calculated = (x?.value ?? 0) / (t?.value ?? 1);
      } else if (currentQuestion.solveFor === Variable.Distance) {
        calculated = (v?.value ?? 0) * (t?.value ?? 0);
      } else {
        calculated = (x?.value ?? 0) / (v?.value ?? 1);
      }
    } catch (error) {
      setFeedback({
        message: 'Check your placements—something caused an invalid math operation.',
        type: 'incorrect',
      });
      setAttemptStatus('incorrect');
      return;
    }

    let isCorrect = true;
    let correctAnswer = calculated;

    if (level !== 1) {
      correctAnswer = parseFloat(calculated.toFixed(2));
      const numericAnswer = parseFloat(userAnswer);
      if (Number.isNaN(numericAnswer)) {
        setFeedback({ message: 'Enter a numeric answer before checking.', type: 'incorrect' });
        setAttemptStatus('incorrect');
        return;
      }
      if (Math.abs(numericAnswer - correctAnswer) >= 0.01) {
        isCorrect = false;
      }
    }

    if (isCorrect) {
      setFeedback({ message: 'Correct! Great job!', type: 'correct' });
      setAttemptStatus('correct');
      setCalculatedAnswer(calculated);
    } else {
      setFeedback({
        message: 'Not quite. Recalculate and try again. Round to the nearest hundredth.',
        type: 'incorrect',
      });
      setAttemptStatus('incorrect');
      setCalculatedAnswer(null);
    }

    if (stage === 'level1') {
      const updatedAttempts = level1Stats.attempts + 1;
      const updatedCorrect = isCorrect ? level1Stats.correct + 1 : level1Stats.correct;
      const updatedStreak = isCorrect ? level1Stats.streak + 1 : 0;
      setLevel1Stats({
        attempts: updatedAttempts,
        correct: updatedCorrect,
        streak: updatedStreak,
      });

      if (isCorrect && updatedStreak >= LEVEL1_REQUIRED_STREAK) {
        setPendingStage('level2');
        setFeedback({
          message: 'Streak unlocked! Tap Next Question to begin Level 2.',
          type: 'info',
        });
      }
    } else if (stage === 'level2') {
      const updatedAttempts = level2Stats.attempts + 1;
      const updatedCorrect = isCorrect ? level2Stats.correct + 1 : level2Stats.correct;
      const updatedStreak = isCorrect ? level2Stats.streak + 1 : 0;
      setLevel2Stats({
        attempts: updatedAttempts,
        correct: updatedCorrect,
        streak: updatedStreak,
      });

      if (isCorrect && updatedCorrect >= LEVEL2_REQUIRED_CORRECT && updatedStreak >= LEVEL2_REQUIRED_STREAK) {
        setPendingStage('level3');
        setFeedback({
          message: 'Level 2 cleared! Tap Next Question to enter the final challenge.',
          type: 'info',
        });
      }
    } else if (stage === 'level3') {
      const updatedAttempts = level3Stats.attempts + 1;
      const updatedScore = isCorrect ? level3Stats.score + 1 : level3Stats.score;
      setLevel3Stats({ attempts: updatedAttempts, score: updatedScore });

      if (updatedAttempts >= LEVEL3_TOTAL_QUESTIONS) {
        setPendingStage('summary');
        setFinalScore(updatedScore);
        setFeedback({
          message: 'Challenge complete! Tap Next Question to view your score.',
          type: 'info',
        });
      }
    }
  };

  const handleNextQuestion = () => {
    if (attemptStatus === 'idle') {
      setFeedback({ message: 'Give this question a try before moving on.', type: 'info' });
      return;
    }

    if (pendingStage) {
      if (pendingStage === 'summary') {
        startStage('summary');
      } else {
        startStage(pendingStage);
      }
      return;
    }

    loadNextQuestion();
  };

  const handleReset = () => {
    resetInteractionState();
  };

  const handleStartOver = () => {
    usedQuestionIdsRef.current = new Set();
    setStudentId('');
    setLevel1Stats({ attempts: 0, correct: 0, streak: 0 });
    setLevel2Stats({ attempts: 0, correct: 0, streak: 0 });
    setLevel3Stats({ attempts: 0, score: 0 });
    setFinalScore(null);
    setCurrentQuestion(null);
    setStage('registration');
    setAttemptStatus('idle');
    setFeedback(null);
    setShowConfetti(false);
  };

  const stageInstructions = useMemo(() => {
    switch (stage) {
      case 'level1':
        return 'Build a streak of 6 correct drag-and-drop answers to unlock Level 2.';
      case 'level2':
        return 'Solve each problem, enter your answer, and reach 6 correct with a 4-question streak.';
      case 'level3':
        return 'Final challenge! Six questions, one point each. Record your best score.';
      case 'summary':
        return 'Session complete. Share your score with your teacher.';
      default:
        return 'Welcome to the Physics Speed Calculator.';
    }
  }, [stage]);

  useEffect(() => {
    if (!isCalculatorOpen) {
      return;
    }
    const maxX = Math.max(16, width - CALC_WIDTH - 16);
    const maxY = Math.max(16, height - CALC_HEIGHT - 16);
    setCalculatorPosition(prev => ({
      x: Math.min(Math.max(prev.x, 16), maxX),
      y: Math.min(Math.max(prev.y, 16), maxY),
    }));
  }, [width, height, isCalculatorOpen]);

  const moveCalculator = useCallback((position: { x: number; y: number }) => {
    const maxX = Math.max(16, width - CALC_WIDTH - 16);
    const maxY = Math.max(16, height - CALC_HEIGHT - 16);
    setCalculatorPosition({
      x: Math.min(Math.max(position.x, 16), maxX),
      y: Math.min(Math.max(position.y, 16), maxY),
    });
  }, [width, height]);

  const progressMetrics = useMemo(() => {
    if (stage === 'level1') {
      return {
        total: LEVEL1_REQUIRED_STREAK,
        current: Math.min(level1Stats.streak, LEVEL1_REQUIRED_STREAK),
        index: level1Stats.attempts,
        title: 'Earn a 6-question streak to advance',
        status: `Current streak: ${level1Stats.streak} · Total correct: ${level1Stats.correct}`,
      };
    }
    if (stage === 'level2') {
      return {
        total: LEVEL2_REQUIRED_CORRECT,
        current: Math.min(level2Stats.correct, LEVEL2_REQUIRED_CORRECT),
        index: level2Stats.attempts,
        title: 'Answer 6 correctly with a streak of 4',
        status: `Correct: ${level2Stats.correct} · Streak: ${level2Stats.streak}/${LEVEL2_REQUIRED_STREAK}`,
      };
    }
    if (stage === 'level3') {
      return {
        total: LEVEL3_TOTAL_QUESTIONS,
        current: Math.min(level3Stats.attempts, LEVEL3_TOTAL_QUESTIONS),
        index: level3Stats.attempts,
        title: 'Level 3 Final Challenge',
        status: `Score: ${level3Stats.score} / ${LEVEL3_TOTAL_QUESTIONS}`,
      };
    }
    return null;
  }, [stage, level1Stats, level2Stats, level3Stats]);

  if (stage === 'registration') {
    return <StudentIdModal onSubmit={handleStudentIdSubmit} />;
  }

  if (stage === 'summary') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
        <ScoreSummary
          studentId={studentId}
          score={finalScore ?? level3Stats.score}
          total={LEVEL3_TOTAL_QUESTIONS}
          onRestart={handleStartOver}
        />
      </div>
    );
  }

  const questionBankSize = getQuestionBankSize();

  return (
    <>
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={400} />}
        <div className="w-full max-w-4xl mx-auto">
          <header className="text-center mb-6 relative">
            <div className="flex justify-center mb-3">
              <StageBadge stage={stage} />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-800">Physics Speed Calculator</h1>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-3 text-slate-600 text-sm">
              <p>{stageInstructions}</p>
              <span className="hidden sm:inline">·</span>
              <p>Question bank size: {questionBankSize}</p>
              <span className="hidden sm:inline">·</span>
              <p>Student ID: <span className="font-semibold text-slate-800">{studentId}</span></p>
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

          <main className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-12">
            {progressMetrics && (
              <ProgressBar
                current={progressMetrics.current}
                total={progressMetrics.total}
                currentQuestionIndex={progressMetrics.index}
                title={progressMetrics.title}
                statusText={progressMetrics.status}
              />
            )}

            {currentQuestion ? (
              <>
                <QuestionDisplay
                  question={currentQuestion}
                  placedValues={Object.values(droppedValues).filter((value): value is Value => value !== null)}
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
                    className="w-full sm:w-auto px-8 py-3 bg-sky-600 text-white font-bold rounded-lg shadow-md hover:bg-sky-700 transition-colors"
                  >
                    Check Answer
                  </button>
                  <button
                    onClick={handleReset}
                    className="w-full sm:w-auto px-8 py-3 bg-slate-500 text-white font-bold rounded-lg shadow-md hover:bg-slate-600 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    className="w-full sm:w-auto px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                  >
                    Next Question
                  </button>
                </div>
              </>
            ) : (
              <p className="text-center text-slate-600">Loading question…</p>
            )}
          </main>

          <footer className="text-center mt-8 text-slate-500 text-sm">
            <p>Built for interactive physics learning. Need a new student?{' '}
              <button onClick={handleStartOver} className="text-sky-600 hover:text-sky-700 font-semibold">
                Start over
              </button>
            </p>
          </footer>
        </div>
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
