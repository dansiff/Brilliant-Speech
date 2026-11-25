import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Trophy,
  Star,
  Sparkles,
  RotateCcw,
  ArrowUp,
  CheckCircle2,
  ChevronRight,
  Flame,
  ShieldCheck,
  Layers,
  Award,
  Zap
} from 'lucide-react';
import { speakText } from '../utils/speechUtils';
import { useScoring } from '../hooks/useScoring';
import { analyzeSpeech } from '../services/geminiService';
import { pseudoAnalyze } from '../utils/localSpeechEngine';
import { Language, Difficulty, Exercise, ExerciseType } from '../types';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface LadderRung {
  level: number;
  stageName: 'Isolation' | 'Syllables' | 'Words' | 'Phrases' | 'Sentences';
  targetPrompt: string;
  phonemeDescription: string;
  visualCue: string;
  pointsValue: number;
}

interface SoundTargetFamily {
  sound: string;
  ipa: string;
  title: string;
  description: string;
  color: string;
  rungs: LadderRung[];
}

const SOUND_LADDERS: SoundTargetFamily[] = [
  {
    sound: '/s/',
    ipa: 's',
    title: 'The Snake Sound (/s/)',
    description: 'Tongue tip behind top teeth, airflow straight down center without side leakage.',
    color: 'from-emerald-500 to-teal-600',
    rungs: [
      { level: 1, stageName: 'Isolation', targetPrompt: 'ssssssss', phonemeDescription: 'Continuous smooth hiss with lips gently smiling', visualCue: '🐍', pointsValue: 20 },
      { level: 2, stageName: 'Syllables', targetPrompt: 'sa - see - so - soo', phonemeDescription: 'Connect the snake sound directly into the open vowel', visualCue: '🔤', pointsValue: 35 },
      { level: 3, stageName: 'Words', targetPrompt: 'Sun, Soap, Bus, Star', phonemeDescription: 'Initial, medial, and final position precision', visualCue: '☀️', pointsValue: 50 },
      { level: 4, stageName: 'Phrases', targetPrompt: 'See the shiny star', phonemeDescription: 'Maintain accurate tongue positioning across multi-word flow', visualCue: '⭐', pointsValue: 75 },
      { level: 5, stageName: 'Sentences', targetPrompt: 'The bright summer sun shines over the sea.', phonemeDescription: 'Master conversational rhythm with crisp alveolar constriction', visualCue: '🌊', pointsValue: 100 }
    ]
  },
  {
    sound: '/r/',
    ipa: 'ɹ',
    title: 'The Roaring Lion (/r/)',
    description: 'Bunched or retroflex tongue posture with strong lateral tongue anchor against upper molars.',
    color: 'from-amber-500 to-orange-600',
    rungs: [
      { level: 1, stageName: 'Isolation', targetPrompt: 'rrrrrrrr', phonemeDescription: 'Sides of tongue elevated against back molars, low F3 frequency', visualCue: '🦁', pointsValue: 20 },
      { level: 2, stageName: 'Syllables', targetPrompt: 'ra - ree - ro - roo', phonemeDescription: 'Coarticulation transition into tense vowels', visualCue: '🔤', pointsValue: 35 },
      { level: 3, stageName: 'Words', targetPrompt: 'Red, Rabbit, Car, Ring', phonemeDescription: 'Prevocalic and postvocalic rhotic control', visualCue: '🏎️', pointsValue: 50 },
      { level: 4, stageName: 'Phrases', targetPrompt: 'Run down the red road', phonemeDescription: 'Continuous voicing through rhotic sequence', visualCue: '🛤️', pointsValue: 75 },
      { level: 5, stageName: 'Sentences', targetPrompt: 'Rachel rode her red race car around the track.', phonemeDescription: 'Complex coarticulation without vowel neutralization', visualCue: '🏆', pointsValue: 100 }
    ]
  },
  {
    sound: '/l/',
    ipa: 'l',
    title: 'The Singing Bell (/l/)',
    description: 'Tongue tip elevates to alveolar ridge with open lateral acoustic channels.',
    color: 'from-blue-500 to-indigo-600',
    rungs: [
      { level: 1, stageName: 'Isolation', targetPrompt: 'llllllll', phonemeDescription: 'Tongue tip locked against upper gumline with continuous vocal cord vibration', visualCue: '🔔', pointsValue: 20 },
      { level: 2, stageName: 'Syllables', targetPrompt: 'la - lee - lo - loo', phonemeDescription: 'Quick, crisp downward tongue tip release', visualCue: '🔤', pointsValue: 35 },
      { level: 3, stageName: 'Words', targetPrompt: 'Light, Lemon, Ball, Yellow', phonemeDescription: 'Light /l/ initial vs dark /l/ final contrast', visualCue: '🍋', pointsValue: 50 },
      { level: 4, stageName: 'Phrases', targetPrompt: 'Look at the little light', phonemeDescription: 'Sustained lateral airflow across phrase breaks', visualCue: '💡', pointsValue: 75 },
      { level: 5, stageName: 'Sentences', targetPrompt: 'Leo laughed as the yellow balloon floated away.', phonemeDescription: 'Generalization across complex multisyllabic vocabulary', visualCue: '🎈', pointsValue: 100 }
    ]
  },
  {
    sound: '/k-g/',
    ipa: 'k, ɡ',
    title: 'The Velar Clickers (/k, g/)',
    description: 'Back of tongue elevates to soft palate (velum) with clean explosive plosion.',
    color: 'from-purple-500 to-pink-600',
    rungs: [
      { level: 1, stageName: 'Isolation', targetPrompt: 'k - k - k - g - g', phonemeDescription: 'Crisp velar back stop without fronting to /t/ or /d/', visualCue: '🥁', pointsValue: 20 },
      { level: 2, stageName: 'Syllables', targetPrompt: 'ka - kee - ko - goo', phonemeDescription: 'Voiceless vs voiced velar transitions', visualCue: '🔤', pointsValue: 35 },
      { level: 3, stageName: 'Words', targetPrompt: 'Cat, Key, Duck, Game', phonemeDescription: 'Prevents typical phonological fronting errors', visualCue: '🐱', pointsValue: 50 },
      { level: 4, stageName: 'Phrases', targetPrompt: 'Keep the green kite', phonemeDescription: 'Alternating velar stops with rhythmic stability', visualCue: '🪁', pointsValue: 75 },
      { level: 5, stageName: 'Sentences', targetPrompt: 'The cute kitty caught a giant green cricket.', phonemeDescription: 'High-density velar sentence drill with full voice onset accuracy', visualCue: '🦗', pointsValue: 100 }
    ]
  }
];

interface SoundLadderGameProps {
  onClose?: () => void;
  onAddPoints?: (pts: number) => void;
  isOnline?: boolean;
}

export const SoundLadderGame: React.FC<SoundLadderGameProps> = ({ onClose, onAddPoints, isOnline = true }) => {
  const [selectedSoundIndex, setSelectedSoundIndex] = useState(0);
  const [currentRungIndex, setCurrentRungIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [recordingScore, setRecordingScore] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [completedRungs, setCompletedRungs] = useState<number[]>([]);
  const [totalGamePoints, setTotalGamePoints] = useState(0);
  const [streakCount, setStreakCount] = useState(0);

  const { result: scoringResult, loading: scoringLoading, error: scoringError, score } = useScoring();
  useEffect(() => {
    if (scoringError) toast.error(`Scoring error: ${scoringError}`);
  }, [scoringError]);

  const currentSound = SOUND_LADDERS[selectedSoundIndex];
  const currentRung = currentSound.rungs[currentRungIndex];

  const handlePlayModel = () => {
    speakText(currentRung.targetPrompt, Language.ENGLISH);
  };

  const startTrialRecording = async () => {
    if (isRecordingRef.current) return;
    isRecordingRef.current = true;
    setIsRecording(true);
    setIsEvaluating(true);
    setRecordingScore(null);
    setFeedbackMessage('');

    const syntheticExercise: Exercise = {
      id: `ladder-${currentSound.sound}-${currentRung.level}`,
      title: currentRung.targetPrompt,
      targetWord: currentRung.targetPrompt,
      type: ExerciseType.ARTICULATION,
      difficulty: Difficulty.EASY,
      language: Language.ENGLISH,
      category: 'Articulation',
      isPremium: false,
      description: currentRung.phonemeDescription,
      imageUrl: ''
    };

    try {
      const result = await score(syntheticExercise);
      setRecordingScore(result.overallScore);
      setFeedbackMessage(result.summary);
      if (result.overallScore >= 70) {
        const pts = currentRung.pointsValue;
        setTotalGamePoints(p => p + pts);
        setStreakCount(s => s + 1);
        if (onAddPoints) onAddPoints(pts);
        if (!completedRungs.includes(currentRungIndex)) {
          setCompletedRungs(prev => [...prev, currentRungIndex]);
        }
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
        toast.success(`Level Cleared! +${pts} Points earned!`);
      } else {
        setStreakCount(0);
        toast.info('Keep trying!');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Evaluation failed');
    } finally {
      isRecordingRef.current = false;
      setIsRecording(false);
      setIsEvaluating(false);
    }
  };

  const handleNextRung = () => {
    if (currentRungIndex < currentSound.rungs.length - 1) {
      setCurrentRungIndex(i => i + 1);
      setRecordingScore(null);
      setFeedbackMessage('');
    } else {
      toast.success(`✅ Completed ${currentSound.sound} ladder!`);
      confetti({ particleCount: 120, spread: 100 });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <h2 className="text-2xl font-bold">{currentSound.title}</h2>
      <div className={`rounded-3xl bg-gradient-to-br ${currentSound.color} p-6 text-white shadow-lg`}>
        <span className="text-7xl" role="img" aria-label={currentRung.phonemeDescription}>
          {currentRung.visualCue}
        </span>
        <p className="mt-3 font-semibold">{currentSound.description}</p>
        <p className="mt-1 text-sm text-white/90">{currentRung.phonemeDescription}</p>
      </div>
      <p>{currentRung.stageName}: {currentRung.targetPrompt}</p>
      <button onClick={handlePlayModel}>Play Model</button>
      <button onClick={startTrialRecording} disabled={isRecording || isEvaluating}>
        {isRecording ? 'Listening...' : isEvaluating ? 'Evaluating...' : 'Speak Target'}
      </button>
      {isRecording && <p>Say the target, then pause while your speech is evaluated.</p>}
      {feedbackMessage && <p>{feedbackMessage} (Score: {recordingScore})</p>}
      <button onClick={handleNextRung}>Next</button>
      <button onClick={onClose}>Close</button>
    </div>
  );
};
