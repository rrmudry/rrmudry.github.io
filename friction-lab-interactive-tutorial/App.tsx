import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GRAVITY } from './constants.ts';

// Let TypeScript know about the QRCode library loaded from the CDN
declare var QRCode: any;

// --- TYPE DEFINITIONS ---
type GameState = 'ID_ENTRY' | 'PRACTICE' | 'PRACTICE_TRANSITION' | 'SCORED' | 'RESULTS';
type FeedbackStatus = 'correct' | 'incorrect' | 'pending';
interface Feedback {
    status: FeedbackStatus;
    message?: string;
}
interface Problem {
    mass: number; // kg
    mu: number; // coefficient of static friction
    appliedForce: number; // Newtons
}
interface UserAnswers {
    weight: string;
    normalForce: string;
    maxFriction: string;
}

const NUM_PRACTICE_QUESTIONS = 4;
const NUM_SCORED_QUESTIONS = 8;

// --- SVG ICONS ---
const CheckIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-green-500 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const XIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-red-500 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// --- HELPER FUNCTIONS ---
const generateNewProblem = (): Problem => {
    const mass = parseFloat((Math.random() * 25 + 5).toFixed(1)); // 5.0 to 30.0 kg
    const mu = parseFloat((Math.random() * 0.7 + 0.2).toFixed(2)); // 0.20 to 0.90
    const maxFriction = mass * GRAVITY * mu;
    
    const forceVariation = maxFriction * 0.5;
    const appliedForce = parseFloat(Math.max(1, (maxFriction - forceVariation + Math.random() * forceVariation * 2)).toFixed(1));
    
    return { mass, mu, appliedForce };
};

// --- VISUAL COMPONENTS ---

interface ScenarioVisualProps {
    mass: number;
    startAnimation: boolean;
}
const ScenarioVisual: React.FC<ScenarioVisualProps> = ({ mass, startAnimation }) => {
    return (
        <div className="p-4 bg-slate-200 rounded-lg h-48 flex items-end justify-center overflow-hidden">
            <div className="w-full max-w-sm relative">
                <div 
                    className={`w-24 h-24 bg-blue-600 rounded-md shadow-lg flex flex-col items-center justify-center text-white z-10 transition-transform duration-1000 ease-in-out ${startAnimation ? 'translate-x-full' : ''}`}
                    style={{ left: 'calc(50% - 48px)', position: 'relative' }}
                >
                    <span className="font-bold text-xl">{mass.toFixed(1)} kg</span>
                </div>
                <div className="h-2 bg-slate-600 -mt-2 rounded"></div>
            </div>
        </div>
    );
};

const VerticalArrow = ({ length, arrowhead }: { length: number; arrowhead: 'up' | 'down' }) => (
    <div className="relative" style={{ height: `${length}px`, width: '2px' }}>
        <div className="w-full h-full bg-black"></div>
        {arrowhead === 'up' && <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '8px solid black', position: 'absolute', top: '-2px', left: '50%', transform: 'translateX(-50%)' }}></div>}
        {arrowhead === 'down' && <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '8px solid black', position: 'absolute', bottom: '-2px', left: '50%', transform: 'translateX(-50%)' }}></div>}
    </div>
);

const HorizontalArrow = ({ length, arrowhead }: { length: number; arrowhead: 'left' | 'right' }) => (
    <div className="relative flex items-center" style={{ width: `${length}px`, height: '2px' }}>
        <div className="w-full h-full bg-black"></div>
        {arrowhead === 'right' && <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '8px solid black', position: 'absolute', right: '-2px' }}></div>}
        {arrowhead === 'left' && <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderRight: '8px solid black', position: 'absolute', left: '-2px' }}></div>}
    </div>
);


interface FreeBodyDiagramProps {
    forces: {
        weight: number;
        normal: number;
        applied: number;
        friction: number;
    };
    visibleForces: {
        weight: boolean;
        normal: boolean;
        applied: boolean;
        friction: boolean;
    }
}
const FreeBodyDiagram: React.FC<FreeBodyDiagramProps> = ({ forces, visibleForces }) => {
    const maxForce = Math.max(forces.weight, forces.normal, forces.applied, forces.friction, 1);
    const scale = 50 / maxForce;

    return (
        <div className="mt-6 p-4 border-2 border-blue-500 rounded-lg h-64 flex items-center justify-center bg-white relative">
            <div className="relative w-20 h-20 bg-white border-2 border-black">
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 flex flex-col items-center transition-opacity duration-500 ${visibleForces.normal ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-sm font-semibold mb-1 whitespace-nowrap">
                        F<sub>normal</sub> = {forces.normal.toFixed(1)} N
                    </span>
                    <VerticalArrow length={forces.normal * scale} arrowhead="up" />
                </div>
                <div className={`absolute top-full left-1/2 -translate-x-1/2 flex flex-col items-center transition-opacity duration-500 ${visibleForces.weight ? 'opacity-100' : 'opacity-0'}`}>
                    <VerticalArrow length={forces.weight * scale} arrowhead="down" />
                    <span className="text-sm font-semibold mt-1 whitespace-nowrap">
                         F<sub>gravity</sub> = {forces.weight.toFixed(1)} N
                    </span>
                </div>
                <div className={`absolute left-full top-1/2 -translate-y-1/2 flex items-center transition-opacity duration-500 ${visibleForces.applied ? 'opacity-100' : 'opacity-0'}`}>
                    <HorizontalArrow length={forces.applied * scale} arrowhead="right" />
                    <span className="text-sm font-semibold ml-2 whitespace-nowrap">
                        F<sub>applied</sub> = {forces.applied.toFixed(1)} N
                    </span>
                </div>
                 <div className={`absolute right-full top-1/2 -translate-y-1/2 flex items-center transition-opacity duration-500 ${visibleForces.friction ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-sm font-semibold mr-2 whitespace-nowrap">
                        F<sub>friction</sub> = {forces.friction.toFixed(1)} N
                    </span>
                    <HorizontalArrow length={forces.friction * scale} arrowhead="left" />
                </div>
            </div>
        </div>
    );
};

// --- TUTORIAL STEP COMPONENTS ---

interface QuestionStepProps {
    title: React.ReactNode;
    question: React.ReactNode;
    formula?: React.ReactNode;
    unit: string;
    value: string;
    feedback: Feedback;
    onChange: (value: string) => void;
    onSubmit: () => void;
}
const QuestionStep: React.FC<QuestionStepProps> = ({title, question, formula, unit, value, feedback, onChange, onSubmit}) => (
    <div>
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        <p className="mt-2 text-slate-700">{question}</p>
        {formula && (
            <div className="mt-3 text-center bg-slate-100 p-3 rounded-md shadow-sm">
                <p className="text-lg font-mono text-slate-800">{formula}</p>
            </div>
        )}
        <div className="mt-4 flex items-center space-x-2">
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200"
                disabled={feedback.status !== 'pending'}
            />
             <span className="font-semibold text-slate-600">{unit}</span>
            <button
                onClick={onSubmit}
                disabled={feedback.status !== 'pending'}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400"
            >
                Check
            </button>
        </div>
         {feedback.message && (
            <div className={`mt-2 text-sm flex items-center ${feedback.status === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
                {feedback.status === 'correct' ? <CheckIcon className="h-5 w-5 mr-1"/> : <XIcon className="h-5 w-5 mr-1"/>}
                <span>{feedback.message}</span>
            </div>
        )}
    </div>
);

// --- SENTENCE BUILDER COMPONENT ---
interface SentenceBuilderProps {
    onCheckAnswer: (isCorrect: boolean) => void;
    correctWillSlide: boolean;
    disabled: boolean;
}
const SentenceBuilder: React.FC<SentenceBuilderProps> = ({ onCheckAnswer, correctWillSlide, disabled }) => {
    const initialWords = useMemo(() => ['Yes', 'No', 'slide', 'not slide', 'greater than', 'less than or equal to'], []);
    const [wordBank, setWordBank] = useState<string[]>(initialWords);
    const [slots, setSlots] = useState<(string | null)[]>([null, null, null]);
    const [draggedWord, setDraggedWord] = useState<string | null>(null);
    const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
    const [selectedWord, setSelectedWord] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, word: string) => {
        setSelectedWord(null);
        setDraggedWord(word);
        e.dataTransfer.setData('text/plain', word);
    };

    const handleDropOnSlot = (e: React.DragEvent, slotIndex: number) => {
        e.preventDefault();
        const droppedWord = e.dataTransfer.getData('text/plain');
        if (!droppedWord) return;

        const newSlots = [...slots];
        const wordInSlot = newSlots[slotIndex];
        newSlots[slotIndex] = droppedWord;
        const newWordBank = wordBank.filter(w => w !== droppedWord);
        if (wordInSlot) {
            newWordBank.push(wordInSlot);
        }
        setSlots(newSlots);
        setWordBank(newWordBank);
        setDraggedWord(null);
        setDragOverSlot(null);
    };
    
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    
    const handleWordBankClick = (word: string) => {
        if (disabled) return;
        setSelectedWord(prev => (prev === word ? null : word));
    };
    
    const handleSlotClick = (slotIndex: number) => {
        if (disabled) return;
        if (selectedWord) {
            const newSlots = [...slots];
            const wordCurrentlyInSlot = newSlots[slotIndex];
            newSlots[slotIndex] = selectedWord;
            const newWordBank = wordBank.filter(w => w !== selectedWord);
            if (wordCurrentlyInSlot) {
                newWordBank.push(wordCurrentlyInSlot);
            }
            setSlots(newSlots);
            setWordBank(newWordBank);
            setSelectedWord(null);
        } else {
            const wordCurrentlyInSlot = slots[slotIndex];
            if (wordCurrentlyInSlot) {
                const newSlots = [...slots];
                newSlots[slotIndex] = null;
                setSlots(newSlots);
                setWordBank(prev => [...prev, wordCurrentlyInSlot]);
            }
        }
    };

    const handleCheck = () => {
        const [choice, outcome, comparison] = slots;
        let isCorrect = false;
        if (correctWillSlide) {
            isCorrect = choice === 'Yes' && outcome === 'slide' && comparison === 'greater than';
        } else {
            isCorrect = choice === 'No' && outcome === 'not slide' && comparison === 'less than or equal to';
        }
        onCheckAnswer(isCorrect);
    };

    const handleReturnToBank = (e: React.DragEvent) => {
        e.preventDefault();
        const returnedWord = e.dataTransfer.getData('text/plain');
        if (!returnedWord || wordBank.includes(returnedWord)) return;
        const newSlots = slots.map(s => (s === returnedWord ? null : s));
        setSlots(newSlots);
        setWordBank(prev => [...prev, returnedWord]);
        setDraggedWord(null);
    };

    useEffect(() => {
        // Reset sentence builder for a new problem
        setWordBank(initialWords);
        setSlots([null, null, null]);
        setSelectedWord(null);
    }, [correctWillSlide, initialWords]);

    return (
        <div>
            <div className="bg-slate-100 p-4 rounded-lg flex flex-wrap items-center gap-2 text-slate-800">
                {[...Array(3)].map((_, i) => (
                    <React.Fragment key={i}>
                        <div
                            onClick={() => handleSlotClick(i)}
                            onDrop={(e) => !disabled && handleDropOnSlot(e, i)}
                            onDragOver={handleDragOver}
                            onDragEnter={() => !disabled && setDragOverSlot(i)}
                            onDragLeave={() => setDragOverSlot(null)}
                            className={`h-10 rounded-md border-2 border-dashed flex items-center justify-center transition-all
                                ${i === 0 ? 'w-24' : i === 1 ? 'w-32' : 'w-48'}
                                ${dragOverSlot === i ? 'border-emerald-500 bg-emerald-100' : (slots[i] ? 'border-blue-500 bg-blue-100 font-semibold' : 'border-slate-400 bg-white')}
                                ${!disabled ? 'cursor-pointer' : ''}
                            `}
                        >
                            {slots[i] && (
                                <div draggable={!disabled} onDragStart={(e) => handleDragStart(e, slots[i]!)} className={`w-full h-full flex items-center justify-center ${disabled ? '' : 'cursor-grab'}`} >
                                    {slots[i]}
                                </div>
                            )}
                        </div>
                        {i === 0 && <span>, it will</span>}
                        {i === 1 && <span>because the applied force is</span>}
                        {i === 2 && <span>the maximum force of friction.</span>}
                    </React.Fragment>
                ))}
            </div>
            <div className="mt-6 p-4 border rounded-lg min-h-[6rem] bg-slate-50" onDrop={handleReturnToBank} onDragOver={handleDragOver}>
                 <h4 className="text-sm font-semibold text-slate-600 mb-2">Drag or click the words to complete the sentence:</h4>
                 <div className="flex flex-wrap gap-2">
                    {wordBank.map(word => (
                        <div key={word} draggable={!disabled} onClick={() => handleWordBankClick(word)} onDragStart={(e) => handleDragStart(e, word)} className={`px-3 py-1 rounded-full text-slate-800 font-medium shadow-sm transition-all ${disabled ? 'cursor-not-allowed opacity-50 bg-slate-200' : 'cursor-pointer hover:bg-slate-300'} ${selectedWord === word ? 'bg-emerald-300 ring-2 ring-emerald-500' : 'bg-slate-200'}`}>
                            {word}
                        </div>
                    ))}
                 </div>
            </div>
            <button onClick={handleCheck} disabled={disabled || slots.some(s => s === null)} className="mt-6 w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
                Check My Sentence
            </button>
        </div>
    );
};

// --- GAME FLOW COMPONENTS ---
const IdEntryScreen: React.FC<{onIdSubmit: (id: string) => void}> = ({ onIdSubmit }) => {
    const [id, setId] = useState('');
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-sm w-full">
                <h1 className="text-2xl font-bold text-slate-800">Friction Tutorial</h1>
                <p className="text-slate-600 mt-2 mb-6">Please enter your Student ID to begin.</p>
                <input type="text" value={id} onChange={e => setId(e.target.value)} placeholder="Student ID" className="w-full px-4 py-2 border border-slate-300 rounded-md mb-4"/>
                <button onClick={() => onIdSubmit(id)} disabled={!id} className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400">
                    Start
                </button>
            </div>
        </div>
    );
};

const TransitionScreen: React.FC<{title: string, message: string, buttonText: string, onContinue: () => void}> = ({ title, message, buttonText, onContinue }) => (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
            <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
            <p className="text-slate-600 mt-4 mb-8">{message}</p>
            <button onClick={onContinue} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700">
                {buttonText}
            </button>
        </div>
    </div>
);

const ResultsScreen: React.FC<{ studentId: string; score: number; total: number }> = ({ studentId, score, total }) => {
    const qrCodeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (qrCodeRef.current) {
            // Clear previous QR code
            qrCodeRef.current.innerHTML = '';
            // Generate new QR code
            new QRCode(qrCodeRef.current, {
                text: JSON.stringify({ studentId, score: score.toFixed(2) }),
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }, [studentId, score]);

    const handleDownload = () => {
        const originalCanvas = qrCodeRef.current?.querySelector('canvas');
        if (originalCanvas) {
            const padding = 20; // White border size
            const finalSize = originalCanvas.width + padding * 2;

            // Create a new canvas with padding
            const newCanvas = document.createElement('canvas');
            newCanvas.width = finalSize;
            newCanvas.height = finalSize;
            const ctx = newCanvas.getContext('2d');

            if (ctx) {
                // Fill the new canvas with a white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, finalSize, finalSize);

                // Draw the original QR code canvas onto the center of the new canvas
                ctx.drawImage(originalCanvas, padding, padding);

                // Create a link to download the new canvas image
                const link = document.createElement('a');
                link.download = `friction-lab_${studentId}.png`;
                link.href = newCanvas.toDataURL('image/png');
                link.click();
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-lg w-full">
                <h1 className="text-3xl font-bold text-slate-800">Assignment Complete!</h1>
                <p className="text-slate-600 mt-4 text-lg">
                    Your final score is: <span className="font-bold text-blue-600">{score.toFixed(2)} / {total.toFixed(2)}</span>
                </p>
                 {/* Container for the on-screen QR code with visual padding */}
                <div className="my-6 flex justify-center">
                    <div className="bg-white p-4 rounded-lg shadow-inner inline-block" ref={qrCodeRef}>
                        {/* QR Code will be generated here by the useEffect hook */}
                    </div>
                </div>
                <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 text-left rounded-r-lg">
                    <p className="font-bold">Instructions for Submission:</p>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Click the "Download QR Code" button below.</li>
                        <li>Submit the downloaded image file with your assignment in Google Classroom.</li>
                    </ol>
                </div>
                <button onClick={handleDownload} className="mt-6 w-full py-3 bg-slate-700 text-white font-bold rounded-lg shadow-md hover:bg-slate-800">
                    Download QR Code
                </button>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
export default function App() {
    const [gameState, setGameState] = useState<GameState>('ID_ENTRY');
    const [studentId, setStudentId] = useState('');
    const [practiceQuestionNumber, setPracticeQuestionNumber] = useState(1);
    const [scoredQuestionNumber, setScoredQuestionNumber] = useState(1);
    const [score, setScore] = useState(0);
    const [pointsAwardedThisQuestion, setPointsAwardedThisQuestion] = useState<Record<string, boolean>>({});

    const [problem, setProblem] = useState<Problem>(generateNewProblem);
    const [currentStep, setCurrentStep] = useState(0);
    const [userAnswers, setUserAnswers] = useState<UserAnswers>({ weight: '', normalForce: '', maxFriction: '' });
    const [feedbacks, setFeedbacks] = useState<Record<keyof UserAnswers, Feedback>>({ weight: { status: 'pending' }, normalForce: { status: 'pending' }, maxFriction: { status: 'pending' } });
    const [isFinalSentenceCorrect, setIsFinalSentenceCorrect] = useState<boolean | null>(null);
    const [showFinalExplanation, setShowFinalExplanation] = useState(false);
    const [startSlideAnimation, setStartSlideAnimation] = useState(false);

    const correctAnswers = useMemo(() => {
        const weight = problem.mass * GRAVITY;
        const normalForce = weight;
        const maxFriction = problem.mu * normalForce;
        return { weight, normalForce, maxFriction, willSlide: problem.appliedForce > maxFriction };
    }, [problem]);

    const resetQuestionState = useCallback(() => {
        setProblem(generateNewProblem());
        setCurrentStep(0);
        setUserAnswers({ weight: '', normalForce: '', maxFriction: '' });
        setFeedbacks({ weight: { status: 'pending' }, normalForce: { status: 'pending' }, maxFriction: { status: 'pending' } });
        setIsFinalSentenceCorrect(null);
        setShowFinalExplanation(false);
        setStartSlideAnimation(false);
        setPointsAwardedThisQuestion({});
    }, []);
    
    const advanceToNextProblem = useCallback(() => {
        if (gameState === 'PRACTICE') {
            if (practiceQuestionNumber < NUM_PRACTICE_QUESTIONS) {
                setPracticeQuestionNumber(prev => prev + 1);
                resetQuestionState();
            } else {
                setGameState('PRACTICE_TRANSITION');
            }
        } else if (gameState === 'SCORED') {
            if (scoredQuestionNumber < NUM_SCORED_QUESTIONS) {
                setScoredQuestionNumber(prev => prev + 1);
                resetQuestionState();
            } else {
                setGameState('RESULTS');
            }
        }
    }, [gameState, practiceQuestionNumber, scoredQuestionNumber, resetQuestionState]);
    
    const handleIdSubmit = (id: string) => {
        setStudentId(id);
        setGameState('PRACTICE');
    };

    const handleStartScoredRound = () => {
        resetQuestionState();
        setGameState('SCORED');
    };

    const handleAnswerChange = (field: keyof UserAnswers, value: string) => {
        setUserAnswers(prev => ({ ...prev, [field]: value }));
    };

    const checkNumericAnswer = (field: keyof UserAnswers) => {
        // This function now only allows one attempt. If the answer is incorrect,
        // it reveals the correct answer and moves on without awarding points.
        if (feedbacks[field].status !== 'pending') return;

        const userAnswer = parseFloat(userAnswers[field]);
        const correctAnswer = correctAnswers[field];

        if (isNaN(userAnswer)) {
            setFeedbacks(prev => ({ ...prev, [field]: { status: 'incorrect', message: `That's not a valid number. The correct answer is ${correctAnswer.toFixed(2)} N.` } }));
            setTimeout(() => setCurrentStep(prev => prev + 1), 2500); // Longer delay to read the answer
            return;
        }

        if (Math.abs(userAnswer - correctAnswer) / correctAnswer < 0.01) {
            // Correct on the first try
            if (gameState === 'SCORED' && !pointsAwardedThisQuestion[field]) {
                setScore(prev => prev + 0.25);
                setPointsAwardedThisQuestion(prev => ({...prev, [field]: true}));
            }
            setFeedbacks(prev => ({ ...prev, [field]: { status: 'correct', message: `Correct! It's ${correctAnswer.toFixed(2)} N.` } }));
            setTimeout(() => setCurrentStep(prev => prev + 1), 1000);
        } else {
            // Incorrect on the first try
            setFeedbacks(prev => ({ ...prev, [field]: { status: 'incorrect', message: `Not quite. The correct answer is ${correctAnswer.toFixed(2)} N.` } }));
            setTimeout(() => setCurrentStep(prev => prev + 1), 2500); // Longer delay to read the answer
        }
    };
    
    const handleSentenceCheck = (isCorrect: boolean) => {
        setIsFinalSentenceCorrect(isCorrect);
        setShowFinalExplanation(true);
        if (isCorrect) {
            if (gameState === 'SCORED' && !pointsAwardedThisQuestion['sentence']) {
                setScore(prev => prev + 0.25);
                setPointsAwardedThisQuestion(prev => ({...prev, sentence: true}));
            }
            if (correctAnswers.willSlide) {
                setStartSlideAnimation(true);
            }
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: return <QuestionStep title={<>Step 1: Calculate Weight (F<sub>g</sub>)</>} question={<>The block has a mass of <strong>{problem.mass.toFixed(1)} kg</strong>. What is its weight on Earth?</>} formula={<>F<sub>g</sub> = mass × g</>} unit="N" value={userAnswers.weight} feedback={feedbacks.weight} onChange={(v) => handleAnswerChange('weight', v)} onSubmit={() => checkNumericAnswer('weight')}/>;
            case 1: return <QuestionStep title={<>Step 2: Determine Normal Force (F<sub>n</sub>)</>} question="Since the block is on a flat, horizontal surface, what is the normal force acting on it?" formula={<>F<sub>n</sub> = F<sub>g</sub> (on a flat surface)</>} unit="N" value={userAnswers.normalForce} feedback={feedbacks.normalForce} onChange={(v) => handleAnswerChange('normalForce', v)} onSubmit={() => checkNumericAnswer('normalForce')}/>;
            case 2: return <QuestionStep title={<>Step 3: Calculate Max Static Friction (F<sub>fr,max</sub>)</>} question={<>The coefficient of static friction (μ<sub>s</sub>) between the block and the surface is <strong>{problem.mu.toFixed(2)}</strong>. What is the maximum force of static friction?</>} formula={<>F<sub>fr,max</sub> = μ<sub>s</sub> × F<sub>n</sub></>} unit="N" value={userAnswers.maxFriction} feedback={feedbacks.maxFriction} onChange={(v) => handleAnswerChange('maxFriction', v)} onSubmit={() => checkNumericAnswer('maxFriction')}/>;
            case 3: return (
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Final Question: Will it Slide?</h3>
                    <p className="mt-2 text-slate-700 mb-4">An external force of <strong>{problem.appliedForce.toFixed(1)} N</strong> is applied to the block. Complete the sentence below to explain what will happen.</p>
                    <SentenceBuilder onCheckAnswer={handleSentenceCheck} correctWillSlide={correctAnswers.willSlide} disabled={showFinalExplanation}/>
                </div>
            );
            default: return null;
        }
    }

    if (gameState === 'ID_ENTRY') return <IdEntryScreen onIdSubmit={handleIdSubmit} />;
    if (gameState === 'PRACTICE_TRANSITION') return <TransitionScreen title="Practice Complete!" message={`You've completed the ${NUM_PRACTICE_QUESTIONS} practice questions. The next ${NUM_SCORED_QUESTIONS} questions will be scored.`} buttonText="Start Scored Round" onContinue={handleStartScoredRound} />;
    if (gameState === 'RESULTS') return <ResultsScreen studentId={studentId} score={score} total={NUM_SCORED_QUESTIONS} />;
    
    const roundTitle = gameState === 'PRACTICE' ? `Practice Question ${practiceQuestionNumber} of ${NUM_PRACTICE_QUESTIONS}` : `Scored Question ${scoredQuestionNumber} of ${NUM_SCORED_QUESTIONS}`;
    
    return (
        <div className="min-h-screen font-sans bg-slate-100">
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Interactive Friction Tutorial</h1>
                        <p className="text-slate-600 mt-1">{roundTitle}</p>
                    </div>
                    {gameState === 'SCORED' && <div className="text-lg font-bold text-blue-600">Score: {score.toFixed(2)}</div>}
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Visuals</h2>
                        <ScenarioVisual mass={problem.mass} startAnimation={startSlideAnimation} />
                        <FreeBodyDiagram forces={{ weight: correctAnswers.weight, normal: correctAnswers.normalForce, applied: problem.appliedForce, friction: correctAnswers.maxFriction }} visibleForces={{ weight: currentStep > 0 || showFinalExplanation, normal: currentStep > 1 || showFinalExplanation, friction: currentStep > 2 || showFinalExplanation, applied: currentStep > 2 || showFinalExplanation }}/>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg mt-8 lg:mt-0">
                         <div className="min-h-[20rem] flex flex-col justify-center">
                            {renderStepContent()}
                             {showFinalExplanation && (
                                <div className={`mt-4 p-4 border-l-4 rounded-r-lg ${isFinalSentenceCorrect ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'}`}>
                                    <div className="flex items-center">
                                        {isFinalSentenceCorrect ? <CheckIcon /> : <XIcon />}
                                        <h3 className="ml-3 text-lg font-bold text-slate-800">{isFinalSentenceCorrect ? 'Correct!' : 'Not Quite!'}</h3>
                                    </div>
                                    <div className="mt-3 text-sm text-slate-700 space-y-2">
                                        <p>We compare the <strong>Applied Force ({problem.appliedForce.toFixed(2)} N)</strong> to the <strong>Max Friction Force ({correctAnswers.maxFriction.toFixed(2)} N)</strong>.</p>
                                        <p className="font-semibold">Since the applied force is {correctAnswers.willSlide ? 'greater than' : 'not greater than'} the max friction, the object {correctAnswers.willSlide ? <strong>will slide</strong> : <strong>will not slide</strong>}.</p>
                                        <button onClick={advanceToNextProblem} className="mt-4 w-full px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-800">
                                            Continue
                                        </button>
                                    </div>
                                </div>
                            )}
                         </div>
                    </div>
                </div>
            </main>
        </div>
    );
}