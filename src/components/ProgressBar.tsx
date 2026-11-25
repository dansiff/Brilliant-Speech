import React from 'react';

interface ProgressBarProps {
  /** Score from 0 to 100 */
  score: number;
}

/** Simple horizontal progress bar with color thresholds */
export const ProgressBar: React.FC<ProgressBarProps> = ({ score }) => {
  const clamped = Math.max(0, Math.min(100, score));
  let color = 'bg-red-500';
  if (clamped >= 70) color = 'bg-emerald-500';
  else if (clamped >= 40) color = 'bg-amber-500';

  return (
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden" aria-label={`Score ${clamped}%`}>
      <div
        className={`${color} h-full transition-width duration-300`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};