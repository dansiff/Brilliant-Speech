import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  ChevronRight, 
  Trophy, 
  Flame, 
  Activity, 
  Smile, 
  Timer, 
  Layers, 
  Award,
  Play,
  Square,
  ShieldCheck
} from 'lucide-react';
import { speakText } from '../utils/speechUtils';
import { audioPipeline } from '../services/audioArchitecture';
import { Language, Difficulty } from '../types';
import { sfx } from '../utils/soundEffects';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface DttcTarget {
  id: string;
  targetWord: string;
  ipa: string;
  syllableStructure: 'CV' | 'VC' | 'VCV' | 'CVC' | 'CVCV' | 'Multisyllabic';
  visualEmoji: string;
  carrierPhrase: string;
  tactileCue: string;
  syllables?: string[];
}

const speakAtRate = (text: string, rate: number): Promise<void> => new Promise((resolve) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    resolve();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = Math.max(0.6, Math.min(1.2, rate));
  utterance.pitch = 1.05;
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith('en'));
  if (voice) utterance.voice = voice;
  utterance.onend = () => resolve();
  utterance.onerror = () => resolve();
  window.speechSynthesis.speak(utterance);
});

interface OralMotorExercise {
  id: string;
  title: string;
  category: 'Lips' | 'Tongue' | 'Cheeks & Jaw' | 'Velopharyngeal';
  instruction: string;
  targetReps: number;
  durationSec: number;
  emoji: string;
  animationVariant: 'lip_stretch' | 'tongue_up' | 'tongue_wag' | 'cheek_puff';
}

const DTTC_TARGETS: DttcTarget[] = [
  {
    id: 'dttc-moo',
    targetWord: 'Moo',
    ipa: 'mu',
    syllableStructure: 'CV',
    visualEmoji: '🐮',
    carrierPhrase: 'The cow says...',
    tactileCue: 'Touch your lips together to feel the gentle humming vibration.'
  },
  {
    id: 'dttc-bye',
    targetWord: 'Bye-Bye',
    ipa: 'baɪ.baɪ',
    syllableStructure: 'CVCV',
    visualEmoji: '👋',
    carrierPhrase: 'Wave your hand and say...',
    tactileCue: 'Two quick bilabial lip pops in rhythmic sequence.',
    syllables: ['bye', 'bye']
  },
  {
    id: 'dttc-pop',
    targetWord: 'Pop',
    ipa: 'pɑp',
    syllableStructure: 'CVC',
    visualEmoji: '🎈',
    carrierPhrase: 'The bubble went...',
    tactileCue: 'Explosive voiceless bilabial stop release.'
  },
  {
    id: 'dttc-open',
    targetWord: 'Open',
    ipa: 'oʊ.pən',
    syllableStructure: 'VCV',
    visualEmoji: '🚪',
    carrierPhrase: 'Please help me...',
    tactileCue: 'Transition smoothly from rounded open vowel to lip seal.',
    syllables: ['o', 'pen']
  },
  {
    id: 'dttc-up',
    targetWord: 'Up',
    ipa: 'ʌp',
    syllableStructure: 'VC',
    visualEmoji: '⬆️',
    carrierPhrase: 'Look ...',
    tactileCue: 'Move from an open vowel into a gentle lip closure.'
  },
  {
    id: 'dttc-no',
    targetWord: 'No',
    ipa: 'noʊ',
    syllableStructure: 'CV',
    visualEmoji: '🙅',
    carrierPhrase: 'Say ...',
    tactileCue: 'Start with the nasal sound, then glide into the vowel.'
  },
  {
    id: 'dttc-banana',
    targetWord: 'Banana',
    ipa: 'bəˈnæn.ə',
    syllableStructure: 'Multisyllabic',
    visualEmoji: '🍌',
    carrierPhrase: 'I am peeling a yellow...',
    tactileCue: 'Notice the syllable sequence and the model’s stress pattern.',
    syllables: ['ba', 'na', 'na']
  }
];

const ORAL_MOTOR_EXERCISES: OralMotorExercise[] = [
  {
    id: 'om-lip-smile-pucker',
    title: 'Smile & Pucker (Ooh-Eee)',
    category: 'Lips',
    instruction: 'Stretch lips wide into a big smile ("Eee"), then pucker tightly into a kiss ("Ooh").',
    targetReps: 5,
    durationSec: 15,
    emoji: '😚',
    animationVariant: 'lip_stretch'
  },
  {
    id: 'om-tongue-tip-up',
    title: 'Elevate Tongue to the Ridge',
    category: 'Tongue',
    instruction: 'Place your tongue tip right behind upper front teeth on the bumpy alveolar ridge. Hold for 3 seconds.',
    targetReps: 4,
    durationSec: 12,
    emoji: '👅',
    animationVariant: 'tongue_up'
  },
  {
    id: 'om-tongue-lateral',
    title: 'Side-to-Side Tongue Wag',
    category: 'Tongue',
    instruction: 'Touch your tongue tip to the left mouth corner, then smoothly glide to the right corner.',
    targetReps: 6,
    durationSec: 15,
    emoji: '🦎',
    animationVariant: 'tongue_wag'
  },
  {
    id: 'om-cheek-puffs',
    title: 'Cheek Puff Balloon Hold',
    category: 'Cheeks & Jaw',
    instruction: 'Fill both cheeks with air like a balloon, seal lips firmly without letting any air escape.',
    targetReps: 3,
    durationSec: 10,
    emoji: '🐡',
    animationVariant: 'cheek_puff'
  }
];

export const MotorSpeechStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dttc_ladder' | 'oral_motor_gym'>('dttc_ladder');
  
  // DTTC State
  const [selectedTargetIndex, setSelectedTargetIndex] = useState<number>(0);
  const [dttcStage, setDttcStage] = useState<1 | 2 | 3 | 4>(1); // 1: Simultaneous, 2: Immediate, 3: Delayed, 4: Spontaneous
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isDelayedTimerActive, setIsDelayedTimerActive] = useState<boolean>(false);
  const [delayCountdown, setDelayCountdown] = useState<number>(3);
  const [scoreResult, setScoreResult] = useState<number | null>(null);
  const [awaitingClinicianRating, setAwaitingClinicianRating] = useState(false);
  const [recordedTrials, setRecordedTrials] = useState(0);
  const [paceRate, setPaceRate] = useState(0.75);
  const [delaySeconds, setDelaySeconds] = useState(3);
  const [cueLevel, setCueLevel] = useState<'Visual' | 'Verbal' | 'Combined' | 'Minimal'>('Combined');
  const [clinicianCue, setClinicianCue] = useState('');
  const [stressCue, setStressCue] = useState<'Model' | 'Even beats' | 'First syllable' | 'Middle syllable' | 'Last syllable'>('Model');
  const [dttcPoints, setDttcPoints] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);

  // Oral-Motor Gym State
  const [selectedOmIndex, setSelectedOmIndex] = useState<number>(0);
  const [omActive, setOmActive] = useState<boolean>(false);
  const [omSecondsLeft, setOmSecondsLeft] = useState<number>(15);
  const [completedReps, setCompletedReps] = useState<number>(0);
  const omTimerRef = useRef<any>(null);
  const delayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentTarget = DTTC_TARGETS[selectedTargetIndex];
  const currentOm = ORAL_MOTOR_EXERCISES[selectedOmIndex];
  const targetSyllables = currentTarget.syllables || [currentTarget.targetWord];
  const stressIndex = stressCue === 'First syllable'
    ? 0
    : stressCue === 'Middle syllable'
      ? Math.floor((targetSyllables.length - 1) / 2)
      : stressCue === 'Last syllable'
        ? targetSyllables.length - 1
        : -1;

  // DTTC Stage Names & Descriptions
  const DTTC_STAGES = [
    {
      level: 1,
      title: 'Level 1: Simultaneous Production',
      badge: 'Unison Practice',
      description: 'Clinician and child produce the word together in slow motion with maximal visual & tactile feedback.',
      instructions: 'Look at the mouth, listen, and say the word AT THE SAME TIME as the coach.'
    },
    {
      level: 2,
      title: 'Level 2: Direct Immediate Imitation',
      badge: 'Direct Echo',
      description: 'Clinician models the word; child imitates immediately with preserved tactile posture.',
      instructions: 'Listen to the model, then say it right away as soon as the model finishes.'
    },
    {
      level: 3,
      title: 'Level 3: Delayed Imitation',
      badge: 'Cognitive Hold',
      description: 'A clinician-adjustable pause between the model and learner response.',
      instructions: 'Wait for the selected countdown to reach zero, then produce the target word.'
    },
    {
      level: 4,
      title: 'Level 4: Spontaneous Production',
      badge: 'Independent',
      description: 'Child retrieves and executes the motor plan independently from a visual or carrier phrase prompt.',
      instructions: 'Complete the sentence or name the picture on your own without an auditory model!'
    }
  ];

  const cancelImitationCountdown = () => {
    if (delayTimerRef.current) clearInterval(delayTimerRef.current);
    delayTimerRef.current = null;
    setIsDelayedTimerActive(false);
  };

  const handlePlayModelAudio = (slow: boolean = false) => {
    sfx.playTap();
    return speakAtRate(currentTarget.targetWord, slow ? Math.min(paceRate, 0.65) : paceRate);
  };

  const startImitationCountdown = (seconds: number) => {
    setIsDelayedTimerActive(true);
    setDelayCountdown(seconds);
    if (delayTimerRef.current) clearInterval(delayTimerRef.current);
    delayTimerRef.current = setInterval(() => {
      setDelayCountdown((prev) => {
        if (prev <= 1) {
          if (delayTimerRef.current) clearInterval(delayTimerRef.current);
          delayTimerRef.current = null;
          setIsDelayedTimerActive(false);
          void executeMicCapture();
          return 0;
        }
        sfx.playMetronomeTick();
        return prev - 1;
      });
    }, 1000);
  };

  const handleStartDttcTrial = async () => {
    sfx.playTap();
    setAwaitingClinicianRating(false);
    setScoreResult(null);
    if (dttcStage === 1) {
      const capture = executeMicCapture();
      handlePlayModelAudio();
      await capture;
      return;
    }
    if (dttcStage === 2 || dttcStage === 3) {
      await handlePlayModelAudio();
      startImitationCountdown(dttcStage === 2 ? 1 : delaySeconds);
      return;
    }
    await executeMicCapture();
  };

  const executeMicCapture = async () => {
    try {
      await audioPipeline.startRecording();
      setIsRecording(true);
      setScoreResult(null);
    } catch (e) {
      toast.error('Microphone access is required for motor speech practice.');
    }
  };

  const handleStopDttcTrial = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    sfx.playTap();

    try {
      await audioPipeline.stopRecording();
      setRecordedTrials((count) => count + 1);
      setAwaitingClinicianRating(true);
      toast.info('Trial recorded. A clinician or practice partner can record an observation below.');
    } catch (e) {
      toast.error('Evaluation failed. Please try again.');
    }
  };

  const recordClinicianRating = (metTarget: boolean) => {
    setScoreResult(metTarget ? 100 : 0);
    setAwaitingClinicianRating(false);
    if (metTarget) {
      sfx.playSuccess();
      setDttcPoints((prev) => prev + dttcStage * 25);
      setStreak((prev) => prev + 1);
      toast.success('Clinician observation saved: target observed.');
    } else {
      sfx.playRetry();
      setStreak(0);
      toast.info('Clinician observation saved: continue practice at the selected level.');
    }
  };

  const handleNextStage = () => {
    if (dttcStage < 4) {
      sfx.playLevelUp();
      setDttcStage((prev) => (prev + 1) as any);
      setScoreResult(null);
    } else {
      sfx.playLevelUp();
      toast.success('🏆 Fantastic! You mastered all 4 DTTC Motor Hierarchy levels for this word!');
      confetti({ particleCount: 80, spread: 90 });
    }
  };

  // Oral-Motor Timer
  const startOralMotorExercise = () => {
    sfx.playTap();
    setOmActive(true);
    setOmSecondsLeft(currentOm.durationSec);
    setCompletedReps(0);

    omTimerRef.current = setInterval(() => {
      setOmSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(omTimerRef.current);
          setOmActive(false);
          sfx.playSuccess();
          confetti({ particleCount: 40, spread: 60 });
          toast.success(`🌟 Oral-Motor Exercise Completed! Great stamina!`);
          return 0;
        }
        if (prev % 3 === 0) {
          sfx.playMetronomeTick();
          setCompletedReps((r) => Math.min(currentOm.targetReps, r + 1));
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopOralMotorExercise = () => {
    if (omTimerRef.current) clearInterval(omTimerRef.current);
    setOmActive(false);
    sfx.playTap();
  };

  useEffect(() => {
    return () => {
      if (omTimerRef.current) clearInterval(omTimerRef.current);
      if (delayTimerRef.current) clearInterval(delayTimerRef.current);
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-black uppercase tracking-wider mb-2">
            <Zap className="w-3.5 h-3.5" />
            Childhood Apraxia & Motor Planning Studio
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Motor Speech & Apraxia Studio
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Evidence-based <strong>Dynamic Temporal and Tactile Cueing (DTTC)</strong> motor hierarchy and interactive <strong>Oral-Motor Agility</strong> training.
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200 px-4 py-3 rounded-2xl flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-600" />
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block">Motor Points</span>
              <span className="text-xl font-black text-amber-950">{dttcPoints}</span>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 px-4 py-3 rounded-2xl flex items-center gap-3">
            <Flame className="w-6 h-6 text-orange-500 animate-bounce" />
            <div>
              <span className="text-[10px] font-bold text-orange-700 uppercase tracking-widest block">Streak</span>
              <span className="text-xl font-black text-orange-950">{streak}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => {
            sfx.playTap();
            setActiveTab('dttc_ladder');
          }}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            activeTab === 'dttc_ladder'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          DTTC Motor Cueing Ladder (4 Stages)
        </button>

        <button
          onClick={() => {
            sfx.playTap();
            setActiveTab('oral_motor_gym');
          }}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            activeTab === 'oral_motor_gym'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Smile className="w-4 h-4 text-emerald-400" />
          Oral-Motor Agility Gym
        </button>
      </div>

      {/* TAB 1: DTTC HIERARCHY */}
      {activeTab === 'dttc_ladder' && (
        <div className="space-y-6">
          {/* Target Word Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {DTTC_TARGETS.map((target, idx) => {
              const isSelected = idx === selectedTargetIndex;
              return (
                <button
                  key={target.id}
                  type="button"
                  disabled={isRecording || isDelayedTimerActive}
                  onClick={() => {
                    sfx.playPop();
                    cancelImitationCountdown();
                    setSelectedTargetIndex(idx);
                    setScoreResult(null);
                    setAwaitingClinicianRating(false);
                    setRecordedTrials(0);
                  }}
                  className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-600 shadow-lg scale-[1.02]'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{target.visualEmoji}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-black/10">
                      {target.syllableStructure}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-base truncate">{target.targetWord}</h3>
                    <p className="text-xs opacity-80 font-mono">/{target.ipa}/</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* DTTC 4-Stage Progressive Ladder Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {DTTC_STAGES.map((st) => {
              const isCurrent = st.level === dttcStage;
              const isPassed = st.level < dttcStage;

              return (
                <button
                  key={st.level}
                  type="button"
                  disabled={isRecording || isDelayedTimerActive}
                  aria-pressed={isCurrent}
                  onClick={() => {
                    sfx.playTap();
                    cancelImitationCountdown();
                    setDttcStage(st.level as any);
                    setScoreResult(null);
                    setAwaitingClinicianRating(false);
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                    isCurrent
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-400'
                      : isPassed
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Stage {st.level}
                    </span>
                    {isPassed && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <h4 className="text-xs font-black truncate">{st.badge}</h4>
                </button>
              );
            })}
          </div>

          {/* Active DTTC Motor Arena */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  {DTTC_STAGES[dttcStage - 1].title}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  {DTTC_STAGES[dttcStage - 1].instructions}
                </p>
              </div>

              <button
                onClick={() => handlePlayModelAudio(false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors self-start sm:self-auto"
              >
                <Volume2 className="w-4 h-4 text-indigo-600" />
                Listen to Clinician Model
              </button>
            </div>

            {/* Target Display Card */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-50/60 via-orange-50/40 to-slate-50 border border-amber-200/80 text-center space-y-4">
              <span className="text-6xl sm:text-7xl block animate-bounce">{currentTarget.visualEmoji}</span>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 font-mono tracking-tight">
                "{currentTarget.targetWord}"
              </h2>
              <p className="text-xs sm:text-sm font-mono text-slate-500">
                IPA: /{currentTarget.ipa}/ • Cadence: {currentTarget.syllableStructure}
              </p>
              {targetSyllables.length > 1 && (
                <div className="flex flex-wrap justify-center gap-2" aria-label={`Syllable stress cue: ${stressCue}`}>
                  {targetSyllables.map((syllable, index) => (
                    <span
                      key={`${syllable}-${index}`}
                      className={`rounded-lg px-3 py-2 font-black ${stressCue === 'Even beats' ? 'bg-indigo-100 text-indigo-900' : stressIndex === index ? 'bg-amber-500 text-white ring-2 ring-amber-700' : 'bg-white text-slate-700 border border-slate-200'}`}
                    >
                      {syllable}
                    </span>
                  ))}
                </div>
              )}
              {stressCue !== 'Model' && (
                <p className="text-xs text-slate-600">Visual stress cue only; the clinician directs the spoken rhythm.</p>
              )}

              {/* Tactile Cue Callout */}
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-white border border-amber-200 shadow-sm text-xs text-slate-700 text-left flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div>
                  <strong className="font-bold text-amber-900 block mb-0.5">Tactile / Proprioceptive Cue:</strong>
                  {currentTarget.tactileCue}
                </div>
              </div>
              <div className="mx-auto grid max-w-3xl grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <label className="rounded-xl border border-amber-200 bg-white p-3 text-xs font-bold text-slate-700">
                  Model pace: {paceRate.toFixed(2)}×
                  <input
                    type="range"
                    min="0.6"
                    max="1.2"
                    step="0.05"
                    value={paceRate}
                    onChange={(event) => setPaceRate(Number(event.target.value))}
                    className="mt-2 w-full accent-amber-600"
                    aria-label="Adjust model playback pace"
                  />
                </label>
                <label className="rounded-xl border border-amber-200 bg-white p-3 text-xs font-bold text-slate-700">
                  Imitation wait: {delaySeconds} seconds
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={delaySeconds}
                    onChange={(event) => setDelaySeconds(Number(event.target.value))}
                    className="mt-2 w-full accent-amber-600"
                    aria-label="Adjust delayed imitation wait"
                  />
                </label>
                <label className="rounded-xl border border-amber-200 bg-white p-3 text-xs font-bold text-slate-700">
                  Clinician cue level
                  <select
                    value={cueLevel}
                    onChange={(event) => setCueLevel(event.target.value as typeof cueLevel)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2"
                  >
                    {(['Visual', 'Verbal', 'Combined', 'Minimal'] as const).map((level) => <option key={level}>{level}</option>)}
                  </select>
                </label>
                <label className="rounded-xl border border-amber-200 bg-white p-3 text-xs font-bold text-slate-700">
                  Stress / prosody cue
                  <select
                    value={stressCue}
                    onChange={(event) => setStressCue(event.target.value as typeof stressCue)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2"
                  >
                    {(['Model', 'Even beats', 'First syllable', 'Middle syllable', 'Last syllable'] as const).map((cue) => <option key={cue}>{cue}</option>)}
                  </select>
                </label>
                <label className="sm:col-span-2 rounded-xl border border-amber-200 bg-white p-3 text-xs font-bold text-slate-700">
                  Clinician-selected cue or note (optional)
                  <input
                    value={clinicianCue}
                    onChange={(event) => setClinicianCue(event.target.value)}
                    placeholder="Enter a cue to use for this practice turn"
                    className="mt-2 w-full rounded-lg border border-slate-300 p-2 font-normal"
                  />
                </label>
              </div>
              <p className="text-xs text-slate-600" aria-live="polite">
                Cue: {cueLevel} · Stress: {stressCue}{clinicianCue ? ` · ${clinicianCue}` : ''}
              </p>
            </div>

            {/* Delayed Countdown Overlay */}
            {isDelayedTimerActive && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-6 bg-slate-900 text-white rounded-2xl text-center space-y-2"
              >
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Prepare for imitation...
                </span>
                <div className="text-5xl font-black font-mono text-white animate-pulse">
                  {delayCountdown}
                </div>
                <p className="text-xs text-slate-400">Speak when the wait reaches zero.</p>
              </motion.div>
            )}

            {/* Evaluation Score Result */}
            {scoreResult !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-5 rounded-2xl border ${
                  scoreResult >= 75
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black uppercase tracking-wider">
                    Clinician observation
                  </span>
                  <span className="text-2xl font-black">{scoreResult === 100 ? 'Target observed' : 'Practice again'}</span>
                </div>
                <p className="text-xs leading-relaxed">
                  This is a clinician-entered note, not an automatic speech assessment.
                </p>
              </motion.div>
            )}

            <p className="text-xs font-bold text-slate-600" aria-live="polite">Recorded practice trials: {recordedTrials}</p>
            {awaitingClinicianRating && (
              <div className="flex flex-col sm:flex-row gap-3" role="group" aria-label="Clinician observation">
                <button type="button" onClick={() => recordClinicianRating(true)} className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800">
                  Clinician: target observed
                </button>
                <button type="button" onClick={() => recordClinicianRating(false)} className="flex-1 rounded-xl bg-slate-700 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">
                  Clinician: try again
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              {!isRecording ? (
                <button
                  onClick={handleStartDttcTrial}
                  disabled={isDelayedTimerActive}
                  className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-black text-base shadow-xl shadow-amber-200 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                >
                  <Mic className="w-5 h-5" />
                  {dttcStage === 1 ? 'Model together & record' : dttcStage === 2 ? 'Model, then imitate' : dttcStage === 3 ? `Model, wait ${delaySeconds}s, imitate` : 'Record independent attempt'}
                </button>
              ) : (
                <button
                  onClick={handleStopDttcTrial}
                  className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-black text-base shadow-xl shadow-rose-200 flex items-center justify-center gap-3 animate-pulse transition-all"
                >
                  <MicOff className="w-5 h-5" />
                  Stop recording
                </button>
              )}

              {scoreResult === 100 && dttcStage < 4 && (
                <button
                  onClick={handleNextStage}
                  className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  Advance to {DTTC_STAGES[dttcStage].title}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORAL-MOTOR AGILITY GYM */}
      {activeTab === 'oral_motor_gym' && (
        <div className="space-y-6">
          {/* Exercise Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {ORAL_MOTOR_EXERCISES.map((ex, idx) => {
              const isSelected = idx === selectedOmIndex;
              return (
                <button
                  key={ex.id}
                  onClick={() => {
                    sfx.playPop();
                    setSelectedOmIndex(idx);
                    stopOralMotorExercise();
                  }}
                  className={`p-4 rounded-2xl border transition-all text-left ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-[1.02]'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-emerald-50/40'
                  }`}
                >
                  <span className="text-3xl block mb-2">{ex.emoji}</span>
                  <span className="text-[10px] font-black uppercase opacity-75 block">{ex.category}</span>
                  <h4 className="text-xs font-black truncate">{ex.title}</h4>
                </button>
              );
            })}
          </div>

          {/* Active Exercise Stage */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6 text-center">
            <div className="max-w-md mx-auto space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {currentOm.category} Warmup
              </span>
              <h3 className="text-2xl font-black text-slate-900">{currentOm.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{currentOm.instruction}</p>
            </div>

            {/* Animated Avatar / Muscle Visualizer */}
            <div className="p-10 rounded-3xl bg-gradient-to-b from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200 max-w-lg mx-auto flex flex-col items-center justify-center space-y-4">
              <motion.div
                animate={
                  omActive
                    ? {
                        scale: [1, 1.15, 1],
                        rotate: currentOm.animationVariant === 'tongue_wag' ? [-10, 10, -10] : [0, 0, 0]
                      }
                    : {}
                }
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-7xl sm:text-8xl"
              >
                {currentOm.emoji}
              </motion.div>

              <div className="flex items-center gap-6 pt-2">
                <div className="text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Time Left</span>
                  <span className="text-2xl font-black font-mono text-slate-900">{omSecondsLeft}s</span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Reps Completed</span>
                  <span className="text-2xl font-black font-mono text-emerald-600">
                    {completedReps} / {currentOm.targetReps}
                  </span>
                </div>
              </div>
            </div>

            {/* Exercise Controls */}
            <div className="flex items-center justify-center gap-4 pt-2">
              {!omActive ? (
                <button
                  onClick={startOralMotorExercise}
                  className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-200 flex items-center gap-2 transition-all"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Start Exercise Routine
                </button>
              ) : (
                <button
                  onClick={stopOralMotorExercise}
                  className="px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm uppercase tracking-wider shadow-lg animate-pulse flex items-center gap-2 transition-all"
                >
                  <Square className="w-5 h-5 fill-current" />
                  Pause Routine
                </button>
              )}

              <button
                onClick={() => speakText(currentOm.instruction, Language.ENGLISH)}
                className="px-5 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center gap-2"
              >
                <Volume2 className="w-4 h-4" />
                Audio Coach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
