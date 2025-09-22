import React, { useRef } from 'react';
import { Variable } from '../types';

interface DraggableUnknownProps {
  text: string;
  variable: Variable;
  isPlaced: boolean;
  onSelect?: (variable: Variable) => void;
  isSelected?: boolean;
}

const DraggableUnknown: React.FC<DraggableUnknownProps> = ({
  text,
  variable,
  isPlaced,
  onSelect,
  isSelected = false,
}) => {
  const pointerTypeRef = useRef<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'unknown', variable }));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    pointerTypeRef.current = e.pointerType;
    if (e.pointerType === 'touch') {
      e.preventDefault();
      onSelect?.(variable);
    }
  };

  const handleClick = () => {
    if (pointerTypeRef.current === 'touch') {
      pointerTypeRef.current = null;
      return;
    }
    onSelect?.(variable);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(variable);
    }
  };

  if (isPlaced) {
    return (
      <span className="inline-block mx-1 font-bold text-slate-400 line-through">
        {text}
      </span>
    );
  }

  const baseClasses = 'bg-purple-100 text-purple-800 font-bold px-3 py-2 rounded-md inline-flex items-center justify-center mx-1 cursor-grab transition-all duration-200';
  const interactiveClasses = isSelected
    ? 'ring-2 ring-purple-500 ring-offset-2 bg-purple-200'
    : 'hover:bg-purple-200 hover:scale-105';

  return (
    <button
      type="button"
      draggable
      onDragStart={handleDragStart}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`${baseClasses} ${interactiveClasses}`}
      aria-pressed={isSelected}
    >
      {text}
    </button>
  );
};

export default DraggableUnknown;
