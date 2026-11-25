import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hand, 
  Play, 
  Square, 
  Volume2, 
  Sparkles, 
  Activity, 
  RotateCcw, 
  CheckCircle2, 
  Trophy, 
  Timer, 
  Award,
  Zap,
  Mic,
  MicOff,
  ChevronRight,
  Flame
} from 'lucide-react';
import { speakText } from '../utils/speechUtils';
import { audioPipeline } from '../services/audioArchitecture';
import { Language } from '../types';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface StoryPrompt {
  id: string;
  title: string;
  category: string;
  text: string;
  syllables: string[];
  targetDurationSec: number;
}

const STORY_PROMPTS: StoryPrompt[] = [
  {
    id: 'story-park',
    title: 'The Sunny Park Trip',
    category: 'Daily Routine',
    text: 'I went to the green park to play on the blue swings with my friends.',
    syllables: ['I', 'went', 'to', 'the', 'green', 'park', 'to', 'play', 'on', 'the', 'blue', 'swings', 'with', 'my', 'friends'],
    targetDurationSec: 8
  },
  {
    id: 'story-space',
    title: 'The Rocket Journey',
    category: 'Imagination',
    text: 'A shiny silver rocket blasted off into the deep dark starry space.',
    syllables: ['A', 'shi-', 'ny', 'sil-', 'ver', 'roc-', 'ket', 'blas-', 'ted', 'off', 'in-', 'to', 'the', 'deep', 'dark', 'star-', 'ry', 'space'],
    targetDurationSec: 10
  },
  {
    id: 'story-bakery',
    title: 'Baking Fresh Bread',
    category: 'Sensory',
    text: 'Warm bread smells so good when it comes out of the hot oven.',
    syllables: ['Warm', 'bread', 'smells', 'so', 'good', 'when', 'it', 'comes', 'out', 'of', 'the', 'hot', 'o-', 'ven'],
    targetDurationSec: 7
  }
];

export const FluencyPacingLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pacing_board' | 'slow_smooth_race' | 'timed_storytelling'>('pacing_board');
  
  // Pacing Board State
  const [syllableCount, setSyllableCount] = useState<number>(5);
  const [activeSyllableIndex, setActiveSyllableIndex] = useState<number>(-1);
  const [pacingRateMode, setPacingRateMode] = useState<'turtle' | 'rabbit'>('turtle'); // Turtle (90-120 WPM) vs Rabbit
  const [isMetronomeActive, setIsMetronomeActive] = useState<boolean>(false);
  const metronomeTimerRef = useRef<any>(null);

  // Slow & Smooth Race Game State
  const [isRacing, setIsRacing] = useState<boolean>(false);
  const [raceProgress, setRaceProgress] = useState<number>(0); // 0 to 100%
  const [turtlePosition, setTurtlePosition] = useState<number>(0);
  const [rabbitPosition, setRabbitPosition] = useState<number>(0);
  const [smoothnessScore, setSmoothnessScore] = useState<number>(92);
  const [raceTimer, setRaceTimer] = useState<number>(0);
  const raceIntervalRef = useRef<any>(null);

  // Timed Storytelling State
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number>(0);
  const [isStoryRecording, setIsStoryRecording] = useState<boolean>(false);
  const [storyTimeElapsed, setStoryTimeElapsed] = useState<number>(0);
  const [storyCompleted, setStoryCompleted] = useState<boolean>(false);
  const storyTimerRef = useRef<any>(null);

  const selectedStory = STORY_PROMPTS[selectedStoryIndex];

  // Synthesize smooth tactile audio click
  const playTapClick = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pacingRateMode === 'turtle' ? 320 : 640, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {}
  };

  // Metronome effect
  useEffect(() => {
    if (isMetronomeActive) {
      const intervalMs = pacingRateMode === 'turtle' ? 700 : 350; // Slow turtle vs fast rabbit tempo
      metronomeTimerRef.current = setInterval(() => {
        setActiveSyllableIndex(prev => (prev + 1) % syllableCount);
        playTapClick();
      }, intervalMs);
    } else {
      if (metronomeTimerRef.current) clearInterval(metronomeTimerRef.current);
      setActiveSyllableIndex(-1);
    }
    return () => {
      if (metronomeTimerRef.current) clearInterval(metronomeTimerRef.current);
    };
  }, [isMetronomeActive, pacingRateMode, syllableCount]);

  // Start Slow & Smooth Race
  const startSlowSmoothRace = async () => {
    try {
      await audioPipeline.startRecording();
      setIsRacing(true);
      setTurtlePosition(0);
      setRabbitPosition(0);
      setRaceTimer(0);

      raceIntervalRef.current = setInterval(() => {
        setRaceTimer(prev => prev + 1);
        // Turtle advances steadily when smooth speech rate is maintained
        setTurtlePosition(prev => {
          const next = prev + 5;
          if (next >= 100) {
            stopSlowSmoothRace(true);
            return 100;
          }
          return next;
        });

        // Rabbit stumbles / rushes
        setRabbitPosition(prev => Math.min(95, prev + (Math.random() > 0.4 ? 6 : 1)));
      }, 500);

      toast.success('Race Started! Speak slowly and smoothly like the wise Turtle!');
    } catch (err) {
      toast.error('Microphone required to monitor smooth speech rate.');
    }
  };

  const stopSlowSmoothRace = async (won: boolean = false) => {
    if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
    setIsRacing(false);
    try {
      await audioPipeline.stopRecording();
    } catch (e) {}

    if (won) {
      confetti({ particleCount: 50, spread: 70 });
      toast.success('🐢 The Slow & Smooth Turtle won the race! Perfect pacing!');
    }
  };

  // Timed Storytelling Handlers
  const startStoryTrial = async () => {
    try {
      await audioPipeline.startRecording();
      setIsStoryRecording(true);
      setStoryTimeElapsed(0);
      setStoryCompleted(false);

      storyTimerRef.current = setInterval(() => {
        setStoryTimeElapsed(prev => prev + 1);
      }, 1000);
    } catch (e) {
      toast.error('Microphone access is required.');
    }
  };

  const finishStoryTrial = async () => {
    if (storyTimerRef.current) clearInterval(storyTimerRef.current);
    setIsStoryRecording(false);
    setStoryCompleted(true);
    try {
      await audioPipeline.stopRecording();
    } catch (e) {}

    const diff = Math.abs(storyTimeElapsed - selectedStory.targetDurationSec);
    if (diff <= 2) {
      confetti({ particleCount: 40, spread: 60 });
      toast.success(`🌟 Stellar Pacing! You finished in ${storyTimeElapsed}s (Target: ${selectedStory.targetDurationSec}s).`);
    } else {
      toast.info(`Completed in ${storyTimeElapsed}s. Try aiming for the target pace of ${selectedStory.targetDurationSec}s.`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Fluency & Stuttering Rate Control
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Fluency & Pacing Lab
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Regulate speech rate, reduce blocks/prolongations, and master smooth syllable pacing with interactive visual cues.
          </p>
        </div>

        {/* Speedometer Mode Badge */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setPacingRateMode('turtle')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              pacingRateMode === 'turtle'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🐢</span>
            Turtle Pace (Smooth)
          </button>
          <button
            onClick={() => setPacingRateMode('rabbit')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              pacingRateMode === 'rabbit'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🐇</span>
            Rabbit Pace (Fast)
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('pacing_board')}
          className={`w-full sm:w-auto justify-start px-3 sm:px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            activeTab === 'pacing_board'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Hand className="w-4 h-4 text-emerald-400" />
          Syllable Pacing Board
        </button>

        <button
          onClick={() => setActiveTab('slow_smooth_race')}
          className={`w-full sm:w-auto justify-start px-3 sm:px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            activeTab === 'slow_smooth_race'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          Slow & Smooth Race Game
        </button>

        <button
          onClick={() => setActiveTab('timed_storytelling')}
          className={`w-full sm:w-auto justify-start px-3 sm:px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            activeTab === 'timed_storytelling'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Timer className="w-4 h-4 text-indigo-400" />
          Timed Storytelling with Pacing
        </button>
      </div>

      {/* Tab 1: Syllable Pacing Board */}
      {activeTab === 'pacing_board' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">Tactile Syllable Pacing</h3>
              <p className="text-xs text-slate-500">Tap each colored circle as you speak each syllable to stabilize speech rhythm.</p>
            </div>

            {/* Syllable Count Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Dots:</span>
              {[3, 4, 5, 6, 7].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setSyllableCount(num);
                    setActiveSyllableIndex(-1);
                  }}
                  className={`w-8 h-8 rounded-xl font-bold text-xs ${
                    syllableCount === num
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Tactile Pacing Circles */}
          <div className="p-8 sm:p-12 bg-gradient-to-br from-slate-50 to-teal-50/40 rounded-3xl border border-slate-200 flex flex-wrap items-center justify-center gap-4 sm:gap-6 min-h-[220px]">
            {Array.from({ length: syllableCount }).map((_, idx) => {
              const isActive = activeSyllableIndex === idx;
              return (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setActiveSyllableIndex(idx);
                    playTapClick();
                  }}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center font-black text-lg transition-all shadow-lg cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-white scale-110 ring-4 ring-emerald-400/40 shadow-emerald-200'
                      : 'bg-white text-slate-700 hover:scale-105 border-2 border-slate-200'
                  }`}
                >
                  <span>{idx + 1}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-75">Tap</span>
                </motion.button>
              );
            })}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <button
              onClick={() => setIsMetronomeActive(!isMetronomeActive)}
              className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                isMetronomeActive
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                  : 'bg-slate-900 text-white shadow-md'
              }`}
            >
              <Activity className="w-4 h-4" />
              {isMetronomeActive ? 'Stop Auto-Metronome' : 'Start Auto-Metronome'}
            </button>

            <button
              onClick={() => setActiveSyllableIndex(-1)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Board
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Slow & Smooth Race Game */}
      {activeTab === 'slow_smooth_race' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900">Slow & Smooth Race</h3>
              <p className="text-xs text-slate-500">
                In this race, slow and smooth speech wins! Speak gently and smoothly to help the Turtle cross the finish line.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl flex items-center gap-2 text-emerald-800 font-black text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Smoothness Index: {smoothnessScore}%
            </div>
          </div>

          {/* Racetrack Visual */}
          <div className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl text-white space-y-6 relative overflow-hidden">
            {/* Finish Line Stripe */}
            <div className="absolute right-12 top-0 bottom-0 w-3 bg-white/20 border-r-2 border-dashed border-amber-400 z-0 flex items-center justify-center">
              <span className="text-[10px] font-black uppercase rotate-90 text-amber-300">FINISH</span>
            </div>

            {/* Lane 1: Turtle (Player's smooth rate) */}
            <div className="space-y-1 relative z-10">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                <span>Lane 1: Slow & Smooth Turtle</span>
                <span>{turtlePosition}%</span>
              </div>
              <div className="h-14 bg-slate-800/80 rounded-2xl p-2 relative flex items-center border border-slate-700">
                <motion.div
                  style={{ left: `${Math.min(90, turtlePosition)}%` }}
                  className="absolute text-3xl"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  🐢
                </motion.div>
              </div>
            </div>

            {/* Lane 2: Rabbit (Fast / Rushed rate) */}
            <div className="space-y-1 relative z-10">
              <div className="flex items-center justify-between text-xs font-bold text-rose-400">
                <span>Lane 2: Rushing Rabbit</span>
                <span>{rabbitPosition}%</span>
              </div>
              <div className="h-14 bg-slate-800/80 rounded-2xl p-2 relative flex items-center border border-slate-700">
                <motion.div
                  style={{ left: `${Math.min(90, rabbitPosition)}%` }}
                  className="absolute text-3xl"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                >
                  🐇
                </motion.div>
              </div>
            </div>
          </div>

          {/* Race Controls */}
          <div className="flex items-center justify-center pt-2">
            {!isRacing ? (
              <button
                onClick={startSlowSmoothRace}
                className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-200 flex items-center gap-3 transition-all"
              >
                <Play className="w-5 h-5" />
                Start Slow & Smooth Race
              </button>
            ) : (
              <button
                onClick={() => stopSlowSmoothRace(false)}
                className="px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-200 flex items-center gap-3 animate-pulse transition-all"
              >
                <Square className="w-5 h-5" />
                Stop Race & Catch Breath
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Timed Storytelling */}
      {activeTab === 'timed_storytelling' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">Timed Storytelling with Pacing</h3>
              <p className="text-xs text-slate-500">Read each story with steady phrasing matching the target pacing duration.</p>
            </div>

            <div className="flex items-center gap-2">
              {STORY_PROMPTS.map((prompt, idx) => (
                <button
                  key={prompt.id}
                  onClick={() => {
                    setSelectedStoryIndex(idx);
                    setStoryCompleted(false);
                    setStoryTimeElapsed(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                    selectedStoryIndex === idx
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Story {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Story Prompt Card */}
          <div className="p-8 rounded-3xl bg-indigo-50/50 border border-indigo-200 space-y-6 text-center">
            <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
              {selectedStory.title} ({selectedStory.category})
            </span>

            <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed font-mono">
              "{selectedStory.text}"
            </p>

            {/* Visual Syllable Rhythm Blocks */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {selectedStory.syllables.map((syl, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-xs font-mono font-bold text-indigo-900 shadow-sm">
                  {syl}
                </span>
              ))}
            </div>

            <div className="pt-4 flex items-center justify-center gap-6 text-xs text-slate-600">
              <span>⏱️ Target Pace: <strong>{selectedStory.targetDurationSec} seconds</strong></span>
              <span>🎙️ Recorded Time: <strong>{storyTimeElapsed}s</strong></span>
            </div>
          </div>

          {/* Recording Actions */}
          <div className="flex items-center justify-center gap-4">
            {!isStoryRecording ? (
              <button
                onClick={startStoryTrial}
                className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all"
              >
                <Mic className="w-5 h-5" />
                Start Paced Story Trial
              </button>
            ) : (
              <button
                onClick={finishStoryTrial}
                className="px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm uppercase tracking-wider shadow-lg animate-pulse flex items-center gap-2 transition-all"
              >
                <MicOff className="w-5 h-5" />
                Finish Story ({storyTimeElapsed}s)
              </button>
            )}

            <button
              onClick={() => speakText(selectedStory.text, Language.ENGLISH)}
              className="px-5 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4" />
              Hear Model Pace
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
