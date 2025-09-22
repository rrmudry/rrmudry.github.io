import React from 'react';
import DraggableValue from './DraggableValue';
import { Question, Value, Variable } from '../types';
import DraggableUnknown from './DraggableUnknown';
import SpeakButton from './SpeakButton';

interface QuestionDisplayProps {
  question: Question;
  placedValues: Value[];
  isUnknownPlaced: boolean;
  onValueSelect: (value: Value) => void;
  onUnknownSelect: (variable: Variable) => void;
  selectedValueId: string | null;
  selectedUnknown: Variable | null;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  placedValues,
  isUnknownPlaced,
  onValueSelect,
  onUnknownSelect,
  selectedValueId,
  selectedUnknown,
}) => {
  const findValueForVariable = (variable: Variable) => {
    return question.values.find(v => v.variable === variable);
  };

  // Function to build the full question text for text-to-speech
  const getFullQuestionText = (): string => {
    return question.textParts.map(part => {
      if (typeof part === 'string') {
        return part;
      }
      if ('isUnknown' in part && part.isUnknown) {
        return question.unknownText;
      }
      if ('variable' in part) {
        const value = findValueForVariable(part.variable);
        if (value) {
          // Pronounce units for better speech synthesis.
          const unitPronunciation: { [key: string]: string } = {
            'km': 'kilometers',
            'h': 'hours',
            'm/s': 'meters per second',
            's': 'seconds',
            'm': 'meters',
            'miles': 'miles',
            'mph': 'miles per hour'
          };
          const unitText = unitPronunciation[value.unit] || value.unit;
          return `${value.value} ${unitText}`;
        }
      }
      return '';
    }).join('');
  };
  
  const fullQuestionText = getFullQuestionText();

  return (
    <div className="relative bg-white border-2 border-slate-200 rounded-lg p-6 text-2xl text-center mb-8 shadow-md min-h-[10rem] flex items-center justify-center">
      <SpeakButton textToSpeak={fullQuestionText} className="absolute top-2 right-2" />
      <p className="leading-relaxed">
        {question.textParts.map((part, index) => {
          if (typeof part === 'string') {
            return <span key={index}>{part}</span>;
          } else if ('isUnknown' in part && part.isUnknown) {
            return (
              <DraggableUnknown
                key="unknown"
                text={question.unknownText}
                variable={question.solveFor}
                isPlaced={isUnknownPlaced}
                onSelect={onUnknownSelect}
                isSelected={selectedUnknown === question.solveFor}
              />
            );
          } else if ('variable' in part) {
            const value = findValueForVariable(part.variable);
            if (!value) return null;
            const isPlaced = placedValues.some(pv => pv.id === value.id);
            if (isPlaced) {
              return (
                <span key={index} className="inline-block mx-1 font-bold text-slate-400 line-through">
                  {value.value} {value.unit}
                </span>
              );
            }
            return (
              <DraggableValue
                key={value.id}
                value={value}
                isPlaced={false}
                onSelect={onValueSelect}
                isSelected={selectedValueId === value.id}
              />
            );
          }
          return null;
        })}
      </p>
    </div>
  );
};

export default QuestionDisplay;
