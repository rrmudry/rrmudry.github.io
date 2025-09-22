import React from 'react';
import { Variable, Value } from '../types';
import DropZone from './DropZone';
import DraggableValue from './DraggableValue';

interface InteractiveEquationProps {
  solveFor: Variable;
  droppedValues: { [key: string]: Value | null };
  onDrop: (variable: Variable, payload: any) => void;
  calculatedAnswer: number | null;
  droppedUnknown: Variable | null;
  unknownText: string;
  level: 1 | 2;
  userAnswer: string;
  onAnswerChange: (value: string) => void;
  onZoneTap: (variable: Variable) => void;
  selectedValue: Value | null;
  selectedUnknown: Variable | null;
}

const InteractiveEquation: React.FC<InteractiveEquationProps> = ({
  solveFor,
  droppedValues,
  onDrop,
  calculatedAnswer,
  droppedUnknown,
  unknownText,
  level,
  userAnswer,
  onAnswerChange,
  onZoneTap,
  selectedValue,
  selectedUnknown,
}) => {

  const renderSlotContent = (variable: Variable) => {
    const droppedValue = droppedValues[variable];
    if (droppedValue) {
        return <DraggableValue value={droppedValue} isPlaced={true} />;
    }

    if (droppedUnknown === variable) {
        // In Level 2, if this is the answer slot, show an input field.
        if (level === 2 && variable === solveFor) {
            return (
                 <input
                    type="number"
                    step="0.01"
                    value={userAnswer}
                    onChange={(e) => onAnswerChange(e.target.value)}
                    placeholder="0.00"
                    aria-label="Enter your calculated answer"
                    className="w-full text-center bg-purple-50 text-purple-800 text-3xl font-bold border-b-2 border-purple-300 focus:outline-none focus:border-purple-500 rounded-t-md p-2"
                 />
            );
        }
        
        // If the answer is revealed (either by solving L1 or correctly solving L2)
        if (calculatedAnswer !== null) {
            return (
                <div className="text-purple-800 text-3xl font-bold">
                    ≈ {calculatedAnswer.toFixed(2)}
                </div>
            );
        }

        // Default display for the placed unknown
        return (
            <div className="bg-purple-100 text-purple-800 border-2 border-purple-300 font-bold p-3 rounded-lg text-xl text-center shadow-sm w-full">
                {unknownText}
            </div>
        );
    }
    
    return <span className="text-slate-400 text-5xl font-mono">{variable}</span>;
  };

  const activeValueVariable = selectedValue?.variable ?? null;
  const unknownSelected = selectedUnknown !== null;

  return (
    <div className="flex flex-col items-center space-y-8 w-full">
      <div className="flex justify-center items-center text-7xl font-mono text-slate-700 space-x-6">
        <DropZone
          variable={Variable.Velocity}
          onDrop={onDrop}
          onTap={onZoneTap}
          isActive={activeValueVariable === Variable.Velocity || unknownSelected}
          selectionType={activeValueVariable === Variable.Velocity ? 'value' : unknownSelected ? 'unknown' : null}
        >
            {renderSlotContent(Variable.Velocity)}
        </DropZone>
        <span className="font-sans text-slate-800">=</span>
        <div className="flex flex-col items-center">
          <DropZone
            variable={Variable.Distance}
            onDrop={onDrop}
            onTap={onZoneTap}
            isActive={activeValueVariable === Variable.Distance || unknownSelected}
            selectionType={activeValueVariable === Variable.Distance ? 'value' : unknownSelected ? 'unknown' : null}
          >
            {renderSlotContent(Variable.Distance)}
          </DropZone>
          <div className="w-40 h-2 bg-slate-800 my-2 rounded"></div>
          <DropZone
            variable={Variable.Time}
            onDrop={onDrop}
            onTap={onZoneTap}
            isActive={activeValueVariable === Variable.Time || unknownSelected}
            selectionType={activeValueVariable === Variable.Time ? 'value' : unknownSelected ? 'unknown' : null}
          >
            {renderSlotContent(Variable.Time)}
          </DropZone>
        </div>
      </div>
    </div>
  );
};

export default InteractiveEquation;
