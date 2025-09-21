import React from 'react';
import { Variable } from '../types';

interface DraggableUnknownProps {
  text: string;
  variable: Variable;
  isPlaced: boolean;
}

const DraggableUnknown: React.FC<DraggableUnknownProps> = ({ text, variable, isPlaced }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'unknown', variable }));
  };

  if (isPlaced) {
    return (
      <span className="inline-block mx-1 font-bold text-slate-400 line-through">
        {text}
      </span>
    );
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-purple-100 text-purple-800 font-bold p-2 rounded-md inline-block mx-1 cursor-grab hover:bg-purple-200 hover:scale-105 transition-all duration-200"
    >
      {text}
    </div>
  );
};

export default DraggableUnknown;
