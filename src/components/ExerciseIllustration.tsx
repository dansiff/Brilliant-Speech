import React from 'react';
import { getExerciseIllustration } from '../utils/exerciseVisuals';

interface ExerciseIllustrationProps {
  word: string;
  className?: string;
  illustrationClassName?: string;
}

export const ExerciseIllustration: React.FC<ExerciseIllustrationProps> = ({
  word,
  className = '',
  illustrationClassName = 'text-6xl',
}) => (
  <div
    className={`flex items-center justify-center bg-gradient-to-br from-amber-50 via-sky-50 to-indigo-100 ${className}`}
    role="img"
    aria-label={`Illustration of ${word}`}
  >
    <span aria-hidden="true" className={`select-none drop-shadow-sm ${illustrationClassName}`}>
      {getExerciseIllustration(word)}
    </span>
  </div>
);
