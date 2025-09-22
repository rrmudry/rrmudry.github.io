import React, { useRef } from 'react';
import { Value } from '../types';

interface DraggableValueProps {
  value: Value;
  isPlaced: boolean;
  onSelect?: (value: Value) => void;
  isSelected?: boolean;
}

const DraggableValue: React.FC<DraggableValueProps> = ({ value, isPlaced, onSelect, isSelected = false }) => {
  const pointerTypeRef = useRef<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'value', value }));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    pointerTypeRef.current = e.pointerType;
    if (e.pointerType === 'touch') {
      e.preventDefault();
      onSelect?.(value);
    }
  };

  const handleClick = () => {
    if (pointerTypeRef.current === 'touch') {
      pointerTypeRef.current = null;
      return;
    }
    onSelect?.(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(value);
    }
  };

  const combinedValue = `${value.value} ${value.unit}`;

  if (isPlaced) {
    return (
      <div className="bg-green-100 text-green-800 border-2 border-green-300 font-bold p-3 rounded-lg text-xl text-center shadow-sm">
        {combinedValue}
      </div>
    );
  }

  const baseClasses = 'bg-sky-100 text-sky-800 font-bold px-3 py-2 rounded-md inline-flex items-center justify-center mx-1 cursor-grab transition-all duration-200';
  const interactiveClasses = isSelected
    ? 'ring-2 ring-sky-500 ring-offset-2 bg-sky-200'
    : 'hover:bg-sky-200 hover:scale-105';

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
      {combinedValue}
    </button>
  );
};

export default DraggableValue;
