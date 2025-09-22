import React, { useCallback, useEffect, useRef, useState } from 'react';

type Operator = '+' | '-' | '×' | '÷';

type CalculatorPanelProps = {
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  onClose: () => void;
};

const buttonBase =
  'inline-flex items-center justify-center rounded-lg text-lg font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2';

const formatNumber = (value: number): string => {
  if (!Number.isFinite(value)) {
    return 'Error';
  }
  if (Number.isInteger(value)) {
    return value.toString();
  }
  const fixed = value.toFixed(6);
  return parseFloat(fixed).toString();
};

const CalculatorPanel: React.FC<CalculatorPanelProps> = ({ position, onPositionChange, onClose }) => {
  const [displayValue, setDisplayValue] = useState('0');
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [pendingOperator, setPendingOperator] = useState<Operator | null>(null);
  const [overwrite, setOverwrite] = useState(false);

  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!draggingRef.current) return;
      const newX = event.clientX - dragOffsetRef.current.x;
      const newY = event.clientY - dragOffsetRef.current.y;
      onPositionChange({ x: newX, y: newY });
    },
    [onPositionChange],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }, [handlePointerMove]);

  const beginDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      draggingRef.current = true;
      dragOffsetRef.current = {
        x: event.clientX - position.x,
        y: event.clientY - position.y,
      };
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [handlePointerMove, handlePointerUp, position.x, position.y],
  );

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const appendDigit = (digit: string) => {
    setDisplayValue(prev => {
      if (overwrite) {
        setOverwrite(false);
        return digit;
      }
      if (prev === '0' && digit === '0') return prev;
      if (prev === '0') return digit;
      return prev + digit;
    });
  };

  const appendDecimal = () => {
    setDisplayValue(prev => {
      if (overwrite) {
        setOverwrite(false);
        return '0.';
      }
      if (prev.includes('.')) return prev;
      return `${prev}.`;
    });
  };

  const clearAll = () => {
    setDisplayValue('0');
    setAccumulator(null);
    setPendingOperator(null);
    setOverwrite(false);
  };

  const compute = useCallback(
    (left: number, right: number, operator: Operator): number => {
      switch (operator) {
        case '+':
          return left + right;
        case '-':
          return left - right;
        case '×':
          return left * right;
        case '÷':
          return right === 0 ? NaN : left / right;
        default:
          return right;
      }
    },
    [],
  );

  const handleOperator = (nextOperator: Operator) => {
    const currentValue = parseFloat(displayValue);
    if (Number.isNaN(currentValue)) {
      return;
    }

    if (accumulator === null) {
      setAccumulator(currentValue);
    } else if (pendingOperator) {
      const result = compute(accumulator, currentValue, pendingOperator);
      setAccumulator(result);
      setDisplayValue(formatNumber(result));
    }

    setPendingOperator(nextOperator);
    setOverwrite(true);
  };

  const evaluate = () => {
    if (pendingOperator === null || accumulator === null) {
      return;
    }
    const currentValue = parseFloat(displayValue);
    const result = compute(accumulator, currentValue, pendingOperator);
    setDisplayValue(formatNumber(result));
    setAccumulator(null);
    setPendingOperator(null);
    setOverwrite(true);
  };

  const toggleSign = () => {
    setDisplayValue(prev => {
      if (prev.startsWith('-')) {
        return prev.slice(1);
      }
      if (prev === '0') return prev;
      return `-${prev}`;
    });
  };

  const percent = () => {
    setDisplayValue(prev => {
      const numeric = parseFloat(prev);
      if (Number.isNaN(numeric)) return prev;
      return formatNumber(numeric / 100);
    });
  };

  const buttons = [
    { label: 'C', action: clearAll, tone: 'muted' },
    { label: '+/-', action: toggleSign, tone: 'muted' },
    { label: '%', action: percent, tone: 'muted' },
    { label: '÷', action: () => handleOperator('÷'), tone: 'accent' },
    { label: '7', action: () => appendDigit('7') },
    { label: '8', action: () => appendDigit('8') },
    { label: '9', action: () => appendDigit('9') },
    { label: '×', action: () => handleOperator('×'), tone: 'accent' },
    { label: '4', action: () => appendDigit('4') },
    { label: '5', action: () => appendDigit('5') },
    { label: '6', action: () => appendDigit('6') },
    { label: '-', action: () => handleOperator('-'), tone: 'accent' },
    { label: '1', action: () => appendDigit('1') },
    { label: '2', action: () => appendDigit('2') },
    { label: '3', action: () => appendDigit('3') },
    { label: '+', action: () => handleOperator('+'), tone: 'accent' },
    { label: '0', action: () => appendDigit('0'), span: 2 },
    { label: '.', action: appendDecimal },
    { label: '=', action: evaluate, tone: 'accent' },
  ];

  return (
    <div
      className="fixed z-50 select-none"
      style={{ top: position.y, left: position.x }}
      role="dialog"
      aria-label="Calculator"
    >
      <div className="w-72 rounded-2xl shadow-2xl border border-slate-200 bg-white overflow-hidden">
        <div
          className="flex items-center justify-between bg-slate-800 text-slate-50 px-4 py-2 cursor-move"
          onPointerDown={beginDrag}
        >
          <span className="text-sm font-semibold tracking-wide uppercase">Calculator</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors"
            aria-label="Close calculator"
          >
            ×
          </button>
        </div>
        <div className="px-4 py-3 bg-slate-900 text-right">
          <div className="text-slate-200 text-lg">
            {pendingOperator ? `${formatNumber(accumulator ?? 0)} ${pendingOperator}` : '\u00a0'}
          </div>
          <div className="text-4xl font-semibold text-slate-50 break-all" aria-live="polite">
            {displayValue}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 p-4 bg-white">
          {buttons.map(button => {
            const tone = button.tone ?? 'default';
            const spanClass = button.span === 2 ? 'col-span-2' : '';
            const palette =
              tone === 'accent'
                ? 'bg-sky-500 hover:bg-sky-600 text-white'
                : tone === 'muted'
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900';

            return (
              <button
                key={button.label}
                type="button"
                onClick={button.action}
                className={`${buttonBase} ${palette} ${spanClass} h-12`}
              >
                {button.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalculatorPanel;
