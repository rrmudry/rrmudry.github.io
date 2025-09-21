import React, { useState } from 'react';
import { Variable } from '../types';

type SelectedVariable = Variable.Velocity | Variable.Distance | Variable.Time;

const FormulaTriangle: React.FC = () => {
  const [selected, setSelected] = useState<SelectedVariable>(Variable.Velocity);

  const getVariableClasses = (variable: SelectedVariable) => {
    const base = 'flex items-center justify-center font-bold text-4xl text-slate-700 rounded-lg cursor-pointer transition-all duration-200';
    const size = 'w-32 h-32';
    if (selected === variable) {
      return `${base} ${size} bg-sky-200 text-sky-800 scale-110 shadow-lg`;
    }
    return `${base} ${size} bg-slate-100 hover:bg-slate-200 hover:scale-105`;
  };

  const VariableDisplay: React.FC<{ variable: SelectedVariable }> = ({ variable }) => (
    <div className={getVariableClasses(variable)} onClick={() => setSelected(variable)} role="button" aria-pressed={selected === variable} aria-label={`Select ${variable}`}>
      {variable}
    </div>
  );

  const renderFormula = () => {
    const baseClasses = "text-6xl font-mono text-slate-700 flex items-center justify-center gap-x-6 transition-all duration-300";
    
    switch(selected) {
      case Variable.Distance:
        return (
          <div className={`${baseClasses} animate-fade-in`}>
            <span>x</span><span className="font-sans text-slate-800">=</span><span>v</span><span className="font-sans text-slate-800">*</span><span>t</span>
          </div>
        );
      case Variable.Time:
        return (
          <div className={`${baseClasses} animate-fade-in`}>
            <span>t</span><span className="font-sans text-slate-800">=</span>
            <div className="flex flex-col items-center">
                <span>x</span>
                <div className="w-16 h-1.5 bg-slate-800 my-1 rounded"></div>
                <span>v</span>
            </div>
          </div>
        );
      case Variable.Velocity:
      default:
        return (
          <div className={`${baseClasses} animate-fade-in`}>
            <span>v</span><span className="font-sans text-slate-800">=</span>
            <div className="flex flex-col items-center">
                <span>x</span>
                <div className="w-16 h-1.5 bg-slate-800 my-1 rounded"></div>
                <span>t</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center gap-y-8">
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        `}</style>
      {/* Triangle Visual */}
      <div className="flex flex-col items-center gap-y-2">
        <VariableDisplay variable={Variable.Distance} />
        <div className="flex gap-x-2">
          <VariableDisplay variable={Variable.Velocity} />
          <VariableDisplay variable={Variable.Time} />
        </div>
      </div>

      {/* Formula Display */}
      <div className="h-28 w-full bg-slate-50 border-2 border-slate-200 rounded-lg flex items-center justify-center">
        {renderFormula()}
      </div>
    </div>
  );
};

export default FormulaTriangle;