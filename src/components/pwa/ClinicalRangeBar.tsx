import React from 'react';

interface ClinicalRangeBarProps {
  value: number;
  min: number;
  max: number;
  targetLow: number;
  targetHigh: number;
  unit: string;
  label?: string;
}

export const ClinicalRangeBar: React.FC<ClinicalRangeBarProps> = ({
  value, min, max, targetLow, targetHigh, unit, label,
}) => {
  const range = max - min;
  const percent = Math.min(100, Math.max(0, ((value - min) / range) * 100));
  const isOptimal = value >= targetLow && value <= targetHigh;
  const targetLeftPct = ((targetLow - min) / range) * 100;
  const targetWidthPct = ((targetHigh - targetLow) / range) * 100;

  return (
    <div className="w-full space-y-1.5 pt-1.5">
      <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
        <span>{label || `Normal: ${targetLow}–${targetHigh} ${unit}`}</span>
        <span className={isOptimal ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}>
          {isOptimal ? '✓ In Range' : '⚠ Outside Range'}
        </span>
      </div>

      {/* Visual Range Track */}
      <div className="relative h-2 w-full rounded-full bg-slate-200 dark:bg-white/[0.08] overflow-hidden">
        {/* Shaded Target Normal Zone */}
        <div
          className="absolute top-0 bottom-0 bg-emerald-500/25 dark:bg-emerald-500/20 border-x border-emerald-500/40 dark:border-emerald-400/25"
          style={{
            left: `${targetLeftPct}%`,
            width: `${targetWidthPct}%`,
          }}
        />
        {/* Marker Dot */}
        <div
          className={`absolute top-0 bottom-0 w-2.5 -ml-[5px] rounded-full shadow-sm transition-all duration-300 ${
            isOptimal
              ? 'bg-emerald-500 dark:bg-emerald-400 ring-2 ring-emerald-500/30 dark:ring-emerald-400/40'
              : 'bg-amber-500 dark:bg-amber-400 ring-2 ring-amber-500/30 dark:ring-amber-400/40'
          }`}
          style={{ left: `${percent}%` }}
        />
      </div>
    </div>
  );
};
