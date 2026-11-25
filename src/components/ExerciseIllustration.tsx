import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getExerciseIllustration } from '../utils/exerciseVisuals';

interface ExerciseIllustrationProps {
  word: string;
  className?: string;
  illustrationClassName?: string;
}

interface ExerciseImageProps extends ExerciseIllustrationProps {
  imageUrl?: string;
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

export const ExerciseImage: React.FC<ExerciseImageProps> = ({
  imageUrl,
  word,
  className = '',
  illustrationClassName,
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  if (!imageUrl || imageUrl.includes('picsum.photos') || imageError) {
    return (
      <ExerciseIllustration
        word={word}
        className={className}
        illustrationClassName={illustrationClassName}
      />
    );
  }

  return (
    <img
      src={imageUrl}
      alt={word}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => {
        setImageError(true);
        toast.info('Illustration unavailable; using built-in art instead.');
      }}
    />
  );
};
