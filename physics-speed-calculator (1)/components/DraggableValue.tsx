import React from 'react';
import { Value } from '../types';

interface DraggableValueProps {
  value: Value;
  isPlaced: boolean;
}

const DraggableValue: React.FC<DraggableValueProps> = ({ value, isPlaced }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'value', value }));
  };

  const combinedValue = `${value.value} ${value.unit}`;

  if (isPlaced) {
    return (
      <div className="bg-green-100 text-green-800 border-2 border-green-300 font-bold p-3 rounded-lg text-xl text-center shadow-sm">
        {combinedValue}
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-sky-100 text-sky-800 font-bold p-2 rounded-md inline-block mx-1 cursor-grab hover:bg-sky-200 hover:scale-105 transition-all duration-200"
    >
      {combinedValue}
    </div>
  );
};

export default DraggableValue;
