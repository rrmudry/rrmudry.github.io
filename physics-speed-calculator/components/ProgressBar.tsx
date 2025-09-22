import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  currentQuestionIndex: number;
  title?: string;
  statusText?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, currentQuestionIndex, title, statusText }) => {
  const progressPercentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const progressTitle = title ?? `Question ${Math.min(currentQuestionIndex + 1, total)} of ${total}`;
  const progressStatus = statusText ?? `${current} / ${total} Completed`;

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-1 text-slate-600">
        <span className="text-sm font-semibold">{progressTitle}</span>
        <span className="text-sm font-bold">{progressStatus}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5" role="progressbar" aria-label="Questions completed progress" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total}>
        <div
          className="bg-sky-600 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
