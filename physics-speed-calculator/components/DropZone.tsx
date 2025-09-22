import React, { useState, ReactNode } from 'react';
import { Variable } from '../types';

interface DropZoneProps {
  variable: Variable;
  onDrop: (variable: Variable, payload: any) => void;
  children: ReactNode;
}

const DropZone: React.FC<DropZoneProps> = ({ variable, onDrop, children }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      onDrop(variable, JSON.parse(data));
    }
  };
  
  const baseClasses = "w-40 h-28 rounded-lg border-2 border-dashed flex items-center justify-center transition-all duration-200 p-2";
  const stateClasses = 'border-slate-300 bg-slate-50';
  const hoverClasses = isOver ? 'border-sky-500 bg-sky-50 scale-105' : '';


  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`${baseClasses} ${stateClasses} ${hoverClasses}`}
    >
      {children}
    </div>
  );
};

export default DropZone;