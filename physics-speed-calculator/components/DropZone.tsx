import React, { useState, ReactNode, useRef } from 'react';
import { Variable } from '../types';

interface DropZoneProps {
  variable: Variable;
  onDrop: (variable: Variable, payload: any) => void;
  children: ReactNode;
  onTap?: (variable: Variable) => void;
  isActive?: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({
  variable,
  onDrop,
  children,
  onTap,
  isActive = false,
}) => {
  const [isOver, setIsOver] = useState(false);
  const pointerTypeRef = useRef<string | null>(null);
  const suppressClickRef = useRef(false);

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
 
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerTypeRef.current = e.pointerType;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onTap || !isActive) {
      pointerTypeRef.current = null;
      return;
    }

    if (pointerTypeRef.current === 'touch') {
      e.preventDefault();
      onTap(variable);
      suppressClickRef.current = true;
    } else if (pointerTypeRef.current === 'mouse') {
      onTap(variable);
    }

    pointerTypeRef.current = null;
  };

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (onTap && isActive) {
      onTap(variable);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onTap || !isActive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTap(variable);
    }
  };
  
  const baseClasses = "w-40 h-28 rounded-lg border-2 border-dashed flex items-center justify-center transition-all duration-200 p-2";
  const stateClasses = 'border-slate-300 bg-slate-50';
  const hoverClasses = isOver ? 'border-sky-500 bg-sky-50 scale-105' : '';
  const selectionClasses = !isActive ? '' : 'ring-2 ring-slate-300 ring-offset-2';


  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onTap && isActive ? 'button' : undefined}
      tabIndex={onTap && isActive ? 0 : -1}
      className={`${baseClasses} ${stateClasses} ${hoverClasses} ${selectionClasses} ${isActive ? 'cursor-pointer' : ''}`}
    >
      {children}
    </div>
  );
};

export default DropZone;
