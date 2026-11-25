import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';

interface PronunciationVisualizerProps {
  mouthPosition?: string;
  tonguePlacement?: string;
  mouthAnimationUrl?: string;
  tongueAnimationUrl?: string;
  mouthAudioUrl?: string;
  tongueAudioUrl?: string;
  playTargetAudio?: (url: string) => void;
}

export const PronunciationVisualizer: React.FC<PronunciationVisualizerProps> = ({
  mouthPosition = '',
  tonguePlacement = '',
  mouthAnimationUrl,
  tongueAnimationUrl,
  mouthAudioUrl,
  tongueAudioUrl,
  playTargetAudio
}) => {
  // Determine mouth state
  const mouthState = useMemo(() => {
    const text = mouthPosition.toLowerCase();
    if (text.includes('rounded') || text.includes('lips together')) return 'closed';
    if (text.includes('wide')) return 'wide';
    if (text.includes('open')) return 'open';
    return 'neutral';
  }, [mouthPosition]);

  // Determine tongue state
  const tongueState = useMemo(() => {
    const text = tonguePlacement.toLowerCase();
    if (text.includes('curled') || text.includes('roof')) return 'up';
    if (text.includes('between teeth')) return 'between';
    if (text.includes('back')) return 'back';
    return 'flat';
  }, [tonguePlacement]);

  // Mouth Paths (Simplified)
  const mouthPaths = {
    neutral: "M 20 50 Q 50 55 80 50 Q 50 60 20 50",
    open: "M 20 40 Q 50 20 80 40 Q 50 80 20 40",
    wide: "M 10 50 Q 50 45 90 50 Q 50 70 10 50",
    closed: "M 35 50 Q 50 48 65 50 Q 50 52 35 50"
  };

  // Tongue Paths (Simplified)
  const tonguePaths = {
    flat: "M 30 70 Q 50 75 70 70",
    up: "M 30 70 Q 50 30 70 70",
    between: "M 20 60 Q 50 65 80 60",
    back: "M 40 70 Q 60 50 80 70"
  };

  const handleMouthClick = () => {
    if (mouthAudioUrl && playTargetAudio) {
      playTargetAudio(mouthAudioUrl);
    }
  };

  const handleTongueClick = () => {
    if (tongueAudioUrl && playTargetAudio) {
      playTargetAudio(tongueAudioUrl);
    }
  };

  return (
    <div className="flex gap-6 items-center justify-center bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
      {/* Mouth Visualizer */}
      <div className="flex flex-col items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleMouthClick}
          className={`w-24 h-24 bg-white rounded-2xl shadow-inner border border-slate-100 flex items-center justify-center overflow-hidden relative group ${mouthAudioUrl ? 'cursor-pointer' : 'cursor-default'}`}
        >
          {mouthAnimationUrl && !mouthAnimationUrl.includes('picsum.photos') ? (
            <img src={mouthAnimationUrl} className="w-full h-full object-cover" alt="Mouth Diagram" referrerPolicy="no-referrer" />
          ) : (
            <svg viewBox="0 0 100 100" className="w-full h-full p-2">
              <motion.path
                d={mouthPaths[mouthState as keyof typeof mouthPaths]}
                fill="#f87171"
                stroke="#b91c1c"
                strokeWidth="2"
                animate={{ 
                  d: mouthPaths[mouthState as keyof typeof mouthPaths],
                  scale: [1, 1.02, 1],
                }}
                transition={{ 
                  d: { type: 'spring', stiffness: 100 },
                  scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                }}
              />
            </svg>
          )}
          {mouthAudioUrl && (
            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Volume2 className="w-6 h-6 text-primary drop-shadow-sm" />
            </div>
          )}
        </motion.button>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mouth</span>
      </div>

      {/* Tongue Visualizer */}
      <div className="flex flex-col items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleTongueClick}
          className={`w-24 h-24 bg-white rounded-2xl shadow-inner border border-slate-100 flex items-center justify-center overflow-hidden relative group ${tongueAudioUrl ? 'cursor-pointer' : 'cursor-default'}`}
        >
          {tongueAnimationUrl && !tongueAnimationUrl.includes('picsum.photos') ? (
            <img src={tongueAnimationUrl} className="w-full h-full object-cover" alt="Tongue Diagram" referrerPolicy="no-referrer" />
          ) : (
            <svg viewBox="0 0 100 100" className="w-full h-full p-2">
              {/* Teeth indicator for reference */}
              <motion.rect 
                x="30" y="30" width="40" height="10" rx="2" fill="#fff" stroke="#e2e8f0" strokeWidth="1" 
                animate={{ y: [30, 31, 30] }}
                transition={{ repeat: Infinity, duration: 4 }}
              />
              <motion.path
                d={tonguePaths[tongueState as keyof typeof tonguePaths]}
                fill="#fda4af"
                stroke="#e11d48"
                strokeWidth="2"
                animate={{ 
                  d: tonguePaths[tongueState as keyof typeof tonguePaths],
                  y: [0, 2, 0]
                }}
                transition={{ 
                  d: { type: 'spring', stiffness: 100 },
                  y: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                }}
              />
            </svg>
          )}
          {tongueAudioUrl && (
            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Volume2 className="w-6 h-6 text-primary drop-shadow-sm" />
            </div>
          )}
        </motion.button>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tongue</span>
      </div>
    </div>
  );
};
