import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { SliderLimit } from '../types.ts';

interface TouchSliderProps {
  id: string;
  label: string;
  value: number;
  limit: SliderLimit;
  onChange: (val: number) => void;
  icon?: React.ReactNode;
}

export function TouchSlider({
  id,
  label,
  value,
  limit,
  onChange,
  icon,
}: TouchSliderProps) {
  const { min, max, step, unit } = limit;

  const handleStepDown = () => {
    const next = Math.max(min, Math.round((value - step) * 100) / 100);
    onChange(next);
  };

  const handleStepUp = () => {
    const next = Math.min(max, Math.round((value + step) * 100) / 100);
    onChange(next);
  };

  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min || 1)) * 100));

  return (
    <div id={`slider-card-${id}`} className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-200">
          {icon && <span className="text-zinc-400">{icon}</span>}
          <span className="font-semibold text-sm">{label}</span>
        </div>

        <div className="flex items-baseline gap-1 font-mono">
          <span className="text-base font-bold text-zinc-100 tabular-nums">
            {Number.isInteger(value) ? value : value.toFixed(1)}
          </span>
          <span className="text-xs text-zinc-500 font-sans">{unit}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          id={`btn-dec-${id}`}
          onClick={handleStepDown}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-750 active:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0 cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="relative flex-1 py-2 flex items-center">
          <div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="absolute top-0 bottom-0 bg-orange-500 rounded-full transition-all duration-75"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <input
            id={`range-${id}`}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            aria-label={label}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full z-10"
          />

          <div
            className="pointer-events-none absolute w-5 h-5 rounded-full bg-zinc-100 border-2 border-zinc-900 shadow-sm -translate-x-1/2 transition-all duration-75"
            style={{ left: `${percentage}%` }}
          />
        </div>

        <button
          type="button"
          id={`btn-inc-${id}`}
          onClick={handleStepUp}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-750 active:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex justify-between items-center text-[11px] text-zinc-500 px-0.5 font-mono">
        <span>Min: {min} {unit}</span>
        <span>Max: {max} {unit}</span>
      </div>
    </div>
  );
}
