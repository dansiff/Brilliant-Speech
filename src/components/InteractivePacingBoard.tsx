import React, { useState, useEffect, useRef } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  Hand, 
  Plus, 
  Trash2, 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  Settings, 
  Sparkles, 
  Activity, 
  ChevronRight, 
  History, 
  CheckCircle, 
  RefreshCw, 
  BookOpen, 
  Sliders, 
  Check, 
  FileText,
  AlertCircle
} from 'lucide-react';

// Web Audio API feedback generator (No external MP3 files needed)
const playSynthSound = (type: 'pop' | 'bell' | 'wood' | 'chime' | 'success') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.12);
      gainNode.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } else if (type === 'wood') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.06);
      gainNode.gain.setValueAtTime(0.45, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.06);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.06);
    } else if (type === 'bell') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'chime') {
      osc.type = 'sine';
      const now = audioCtx.currentTime;
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gainNode.gain.setValueAtTime(0.25, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start();
      osc.stop(now + 0.35);
    } else if (type === 'success') {
      const now = audioCtx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start();
      osc.stop(now + 0.5);
    }
  } catch (e) {
    console.warn("AudioContext failed to play synth feedback:", e);
  }
};

interface PacingPreset {
  id: string;
  phrase: string;
  category: 'Articulation Blends' | 'Multi-Syllables' | 'Rate Control' | 'Custom';
  segments: string[];
}

interface CompletedSession {
  id: string;
  timestamp: string;
  phrase: string;
  segmentsCount: number;
  completedCycles: number;
  soundType: string;
  shape: string;
  bpm: number;
  durationSeconds: number;
}

const PRESET_PHRASES: PacingPreset[] = [
  {
    id: 'blend-1',
    phrase: 'The slippery snake slithered slowly.',
    category: 'Articulation Blends',
    segments: ['The', 'slip-pe-ry', 'snake', 'sli-thered', 'slow-ly.']
  },
  {
    id: 'blend-2',
    phrase: 'Clara cleaned her cute blue classroom.',
    category: 'Articulation Blends',
    segments: ['Cla-ra', 'cleaned', 'her', 'cute', 'blue', 'class-room.']
  },
  {
    id: 'syl-1',
    phrase: 'Caterpillar',
    category: 'Multi-Syllables',
    segments: ['Ca', 'ter', 'pil', 'lar']
  },
  {
    id: 'syl-2',
    phrase: 'Hippopotamus',
    category: 'Multi-Syllables',
    segments: ['Hip', 'po', 'po', 'ta', 'mus']
  },
  {
    id: 'syl-3',
    phrase: 'University',
    category: 'Multi-Syllables',
    segments: ['U', 'ni', 'ver', 'si', 'ty']
  },
  {
    id: 'rate-1',
    phrase: 'I can speak clearly one word at a time.',
    category: 'Rate Control',
    segments: ['I', 'can', 'speak', 'clear-ly', 'one', 'word', 'at', 'a', 'time.']
  },
  {
    id: 'rate-2',
    phrase: 'Let us take a deep breath and go slow.',
    category: 'Rate Control',
    segments: ['Let', 'us', 'take', 'a', 'deep', 'breath', 'and', 'go', 'slow.']
  }
];

export const InteractivePacingBoard: React.FC = () => {
  // Phrases and database state (merged with localStorage)
  const [customPresets, setCustomPresets] = useState<PacingPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<PacingPreset>(PRESET_PHRASES[0]);
  const [activePhraseSegments, setActivePhraseSegments] = useState<string[]>(PRESET_PHRASES[0].segments);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(-1);
  const [completedCycles, setCompletedCycles] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);

  // Styling and configuration options
  const [boardShape, setBoardShape] = useState<'circle' | 'star' | 'paw' | 'flower'>('circle');
  const [soundFeedback, setSoundFeedback] = useState<'pop' | 'bell' | 'wood' | 'chime' | 'none'>('pop');
  const [metronomeBpm, setMetronomeBpm] = useState<number>(60);
  const [isMetronomeActive, setIsMetronomeActive] = useState<boolean>(false);
  const [visualAccentColor, setVisualAccentColor] = useState<string>('emerald');

  // Input states for new phrases
  const [newPhraseText, setNewPhraseText] = useState<string>('');
  const [newPhraseSegmentsStr, setNewPhraseSegmentsStr] = useState<string>('');
  const [newPhraseCategory, setNewPhraseCategory] = useState<'Articulation Blends' | 'Multi-Syllables' | 'Rate Control' | 'Custom'>('Custom');

  // Session stats log state
  const [practiceHistory, setPracticeHistory] = useState<CompletedSession[]>([]);

  // Timer reference for metronome
  const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load state on mount
  useEffect(() => {
    // 1. Load custom presets from local state storage
    const savedCustom = localStorage.getItem('brilliant_speech_pacing_presets');
    if (savedCustom) {
      try {
        setCustomPresets(JSON.parse(savedCustom));
      } catch (e) {
        console.error("Failed to load local custom presets:", e);
      }
    }

    // 2. Load practice session history
    const savedHistory = localStorage.getItem('brilliant_speech_pacing_history');
    if (savedHistory) {
      try {
        setPracticeHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load local pacing history:", e);
      }
    }
  }, []);

  // Update segments when active preset changes
  useEffect(() => {
    setActivePhraseSegments(selectedPreset.segments);
    setActiveSegmentIndex(-1);
    setStartTime(Date.now());
  }, [selectedPreset]);

  // Metronome sound/visual generator effect
  useEffect(() => {
    if (isMetronomeActive) {
      const intervalMs = (60 / metronomeBpm) * 1000;
      
      metronomeIntervalRef.current = setInterval(() => {
        // Increment the segment index sequentially, wrapping around
        setActiveSegmentIndex(prev => {
          const nextIdx = (prev + 1) % activePhraseSegments.length;
          if (soundFeedback !== 'none') {
            playSynthSound(soundFeedback);
          }
          if (nextIdx === activePhraseSegments.length - 1) {
            // Completed a full cycle via metronome pace
            setCompletedCycles(c => c + 1);
          }
          return nextIdx;
        });
      }, intervalMs);
    } else {
      if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
      }
    }

    return () => {
      if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
      }
    };
  }, [isMetronomeActive, metronomeBpm, activePhraseSegments, soundFeedback]);

  // Combine custom presets and hardcoded presets for select lists
  const allPresets = [...PRESET_PHRASES, ...customPresets];

  // Create custom preset handler
  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhraseText.trim()) return;

    // Split words dynamically if no explicit hyphen splits are given
    const segments = newPhraseSegmentsStr.trim()
      ? newPhraseSegmentsStr.split(',').map(s => s.trim())
      : newPhraseText.split(' ').map(s => s.trim());

    const newPreset: PacingPreset = {
      id: `preset-custom-${Date.now()}`,
      phrase: newPhraseText.trim(),
      category: newPhraseCategory,
      segments: segments.filter(s => s.length > 0)
    };

    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    localStorage.setItem('brilliant_speech_pacing_presets', JSON.stringify(updated));

    // Auto-select the newly added preset
    setSelectedPreset(newPreset);
    
    // Clear forms
    setNewPhraseText('');
    setNewPhraseSegmentsStr('');
    
    playSynthSound('chime');
  };

  // Delete a custom preset
  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    localStorage.setItem('brilliant_speech_pacing_presets', JSON.stringify(updated));
    
    if (selectedPreset.id === id) {
      setSelectedPreset(PRESET_PHRASES[0]);
    }
    playSynthSound('wood');
  };

  // Node Tap Event Handling
  const handleNodeTap = (index: number) => {
    if (isMetronomeActive) return; // Ignore manual taps during metronome autopilot

    // Track active index
    setActiveSegmentIndex(index);
    
    // Play selected audio cue
    if (soundFeedback !== 'none') {
      playSynthSound(soundFeedback);
    }

    // Check if we hit the final word or syllable in sequence
    if (index === activePhraseSegments.length - 1) {
      // Completed! Play full reward sound and log stats
      playSynthSound('success');
      const cycles = completedCycles + 1;
      setCompletedCycles(cycles);

      // Save to local storage
      const practiceDuration = Math.round((Date.now() - startTime) / 1000);
      const newSession: CompletedSession = {
        id: `session-log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        phrase: selectedPreset.phrase,
        segmentsCount: activePhraseSegments.length,
        completedCycles: cycles,
        soundType: soundFeedback,
        shape: boardShape,
        bpm: isMetronomeActive ? metronomeBpm : 0,
        durationSeconds: practiceDuration > 0 ? practiceDuration : 10
      };

      const updatedHistory = [newSession, ...practiceHistory].slice(0, 15); // limit list size
      setPracticeHistory(updatedHistory);
      localStorage.setItem('brilliant_speech_pacing_history', JSON.stringify(updatedHistory));
    }
  };

  // Clear Practice Stats
  const handleClearHistory = () => {
    setPracticeHistory([]);
    localStorage.removeItem('brilliant_speech_pacing_history');
    playSynthSound('wood');
  };

  // Reset current board cycle
  const handleResetBoard = () => {
    setActiveSegmentIndex(-1);
    setCompletedCycles(0);
    setStartTime(Date.now());
    setIsMetronomeActive(false);
    playSynthSound('chime');
  };

  // Render shapes dynamically based on selected style skin
  const getShapeClasses = (index: number) => {
    const isTapped = index <= activeSegmentIndex;
    const isCurrent = index === activeSegmentIndex;

    const baseTransition = "relative flex items-center justify-center cursor-pointer select-none transition-all duration-300 transform font-bold shadow-md ";
    let activeColor = "";
    let inactiveColor = "bg-white border-2 border-slate-200 text-slate-400 hover:border-slate-300 hover:scale-105 active:scale-95 ";

    if (visualAccentColor === 'emerald') {
      activeColor = isCurrent 
        ? "bg-emerald-500 text-white ring-4 ring-emerald-200 border-emerald-500 scale-115 "
        : "bg-emerald-100 text-emerald-800 border-2 border-emerald-300 scale-100 ";
    } else if (visualAccentColor === 'indigo') {
      activeColor = isCurrent
        ? "bg-indigo-500 text-white ring-4 ring-indigo-200 border-indigo-500 scale-115 "
        : "bg-indigo-100 text-indigo-800 border-2 border-indigo-300 scale-100 ";
    } else if (visualAccentColor === 'pink') {
      activeColor = isCurrent
        ? "bg-pink-500 text-white ring-4 ring-pink-200 border-pink-500 scale-115 "
        : "bg-pink-100 text-pink-800 border-2 border-pink-300 scale-100 ";
    } else {
      activeColor = isCurrent
        ? "bg-amber-500 text-white ring-4 ring-amber-200 border-amber-500 scale-115 "
        : "bg-amber-100 text-amber-800 border-2 border-amber-300 scale-100 ";
    }

    const stateColor = isTapped ? activeColor : inactiveColor;

    if (boardShape === 'circle') {
      return baseTransition + stateColor + "w-16 h-16 sm:w-20 sm:h-20 rounded-full text-base sm:text-lg";
    } else if (boardShape === 'star') {
      return baseTransition + stateColor + "w-16 h-16 sm:w-20 sm:h-20 clip-star rounded-lg text-xs sm:text-sm";
    } else if (boardShape === 'flower') {
      return baseTransition + stateColor + "w-16 h-16 sm:w-20 sm:h-20 rounded-[28px] border-dashed text-base sm:text-lg";
    } else {
      // Paw style (using a playful custom pill round shape)
      return baseTransition + stateColor + "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl rotate-45 text-base sm:text-lg";
    }
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 py-2">
      {/* LEFT SECTION: Board Controller & Visual Workspace */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Board Display Header with Active Phrase Target */}
        <div className="bg-white/80 border border-slate-100 rounded-[32px] p-6 sm:p-8 shadow-sm backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Hand className="w-48 h-48 text-emerald-500" />
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 animate-spin" />
              Active Target Board
            </span>
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span className="font-bold text-slate-700">{selectedPreset.category}</span>
              <span>•</span>
              <span>{activePhraseSegments.length} Syllables</span>
            </div>
          </div>

          {/* Large pacing word renderer */}
          <div className="min-h-[100px] flex flex-col justify-center items-center py-4 bg-slate-50 border border-dashed border-slate-200/80 rounded-2xl px-6 text-center">
            {activeSegmentIndex === -1 ? (
              <p className="text-slate-400 font-bold text-base sm:text-lg italic flex items-center gap-2">
                <Hand className="w-5 h-5 text-slate-300 animate-bounce" />
                Tap circles below or click metronome to pace...
              </p>
            ) : (
              <motion.div 
                key={activeSegmentIndex}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-2"
              >
                <div className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight flex flex-wrap justify-center gap-1.5">
                  {activePhraseSegments.map((seg, sIdx) => (
                    <span 
                      key={sIdx} 
                      className={`px-1.5 transition-colors duration-200 ${sIdx === activeSegmentIndex ? 'text-emerald-500 scale-110 font-extrabold underline decoration-wavy decoration-emerald-400' : 'text-slate-700 opacity-30'}`}
                    >
                      {seg}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 font-bold max-w-sm mx-auto">
                  "{selectedPreset.phrase}"
                </p>
              </motion.div>
            )}
          </div>

          {/* Interactive Pacing Board Nodes */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-4 sm:gap-6 py-6 border-t border-slate-100">
            {activePhraseSegments.map((segment, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                {/* Visual Circle/Paw node */}
                <motion.div
                  onClick={() => handleNodeTap(index)}
                  whileHover={{ scale: isMetronomeActive ? 1 : 1.05 }}
                  whileTap={{ scale: isMetronomeActive ? 1 : 0.92 }}
                  className={getShapeClasses(index)}
                >
                  {/* Paw Print extra internal circles or Star icon wrapper */}
                  {boardShape === 'paw' && (
                    <div className="absolute inset-0 flex items-center justify-center -rotate-45">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-current absolute top-2 left-2" />
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-current absolute top-1" />
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-current absolute top-2 right-2" />
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-current mt-2" />
                    </div>
                  )}
                  
                  {boardShape === 'flower' && (
                    <div className="absolute inset-1 border-2 border-dashed border-current/25 rounded-[22px] flex items-center justify-center">
                      <span className="text-lg sm:text-xl font-extrabold">{index + 1}</span>
                    </div>
                  )}

                  {boardShape === 'star' && (
                    <span className="text-lg sm:text-xl font-black">★</span>
                  )}

                  {boardShape === 'circle' && (
                    <span className="text-base sm:text-lg font-extrabold">{index + 1}</span>
                  )}
                </motion.div>

                {/* Bubble label helper showing the word block */}
                <span className={`text-[10px] font-black tracking-tight rounded-md px-1.5 py-0.5 transition-all ${index === activeSegmentIndex ? 'bg-slate-800 text-white scale-105' : 'text-slate-400 bg-slate-50'}`}>
                  {segment}
                </span>
              </div>
            ))}
          </div>

          {/* Controls Bar */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetBoard}
                className="px-4 py-2 text-xs font-black text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Board
              </button>
              {completedCycles > 0 && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  {completedCycles} {completedCycles === 1 ? 'Practice' : 'Practices'} Completed
                </span>
              )}
            </div>

            {/* Metronome controller interface */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-3 py-1">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="range"
                  min="40"
                  max="140"
                  value={metronomeBpm}
                  onChange={(e) => setMetronomeBpm(parseInt(e.target.value))}
                  disabled={isMetronomeActive}
                  className="w-16 accent-emerald-500 h-1 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] font-black text-slate-600">{metronomeBpm} BPM</span>
              </div>

              <button
                onClick={() => {
                  setIsMetronomeActive(!isMetronomeActive);
                  playSynthSound('pop');
                }}
                className={`px-4 py-2 text-xs font-black rounded-xl flex items-center gap-1.5 transition-all ${isMetronomeActive ? 'bg-red-500 text-white shadow-md shadow-red-200 hover:bg-red-600' : 'bg-slate-800 text-white hover:bg-slate-900'}`}
              >
                {isMetronomeActive ? (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    Stop Metronome
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Metronome Mode
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Board Design Skins & Audio Select Settings Panel */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-emerald-500" />
            Customize Board Cosmetics & Sound Feedback
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Shape Select */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500">Board Node Theme</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'circle', label: 'Classic Circles' },
                  { id: 'paw', label: 'Animal Paw' },
                  { id: 'star', label: 'Starry Stars' },
                  { id: 'flower', label: 'Forest Flower' }
                ].map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => {
                      setBoardShape(shape.id as any);
                      playSynthSound('pop');
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl text-left border transition-all ${boardShape === shape.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                  >
                    {shape.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Selector */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500">Node Sound Feedback</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'pop', label: '🎈 Soft Bubble' },
                  { id: 'wood', label: '🪵 Woodblock' },
                  { id: 'bell', label: '🔔 High Bell' },
                  { id: 'chime', label: '🎵 Poly Chime' }
                ].map((snd) => (
                  <button
                    key={snd.id}
                    onClick={() => {
                      setSoundFeedback(snd.id as any);
                      playSynthSound(snd.id as any);
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl text-left border transition-all ${soundFeedback === snd.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'}`}
                  >
                    {snd.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Theme Color */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500">Tactile Color Accent</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'emerald', label: 'Emerald Green', bg: 'bg-emerald-500' },
                  { id: 'indigo', label: 'Indigo Purple', bg: 'bg-indigo-500' },
                  { id: 'pink', label: 'Pink Bubble', bg: 'bg-pink-500' },
                  { id: 'amber', label: 'Amber Sunny', bg: 'bg-amber-500' }
                ].map((color) => (
                  <button
                    key={color.id}
                    onClick={() => {
                      setVisualAccentColor(color.id);
                      playSynthSound('pop');
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl text-left border flex items-center gap-2 transition-all ${visualAccentColor === color.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${color.bg}`} />
                    {color.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: Target Presets & Custom Form + Practice Logs */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Presets & Phrase Switcher Panel */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            Select Practice target
          </h3>

          <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
            {allPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset)}
                className={`w-full text-left p-3 rounded-2xl border transition-all flex justify-between items-start gap-2 ${selectedPreset.id === preset.id ? 'bg-emerald-50/70 border-emerald-200/80' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50 hover:border-slate-200/60'}`}
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-black text-slate-800 line-clamp-1">"{preset.phrase}"</p>
                  <p className="text-[10px] text-slate-400 font-bold">{preset.category}</p>
                </div>
                {preset.id.startsWith('preset-custom-') && (
                  <button
                    onClick={(e) => handleDeletePreset(preset.id, e)}
                    className="p-1 hover:text-red-500 text-slate-400 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-all mt-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Add custom target form */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-3">
            <Plus className="w-4 h-4 text-emerald-500" />
            Add Custom Target phrase
          </h3>

          <form onSubmit={handleAddPreset} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Target Phrase</label>
              <input
                type="text"
                required
                value={newPhraseText}
                onChange={(e) => setNewPhraseText(e.target.value)}
                placeholder="The frog hopped far."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50 font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Segments (Comma-Separated)</label>
              <input
                type="text"
                value={newPhraseSegmentsStr}
                onChange={(e) => setNewPhraseSegmentsStr(e.target.value)}
                placeholder="The, frog, hopped, far."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50 font-bold"
              />
              <span className="text-[9px] text-slate-400 font-bold leading-none mt-1 block">
                Leave empty to split automatically by space.
              </span>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Syllable Category</label>
              <select
                value={newPhraseCategory}
                onChange={(e) => setNewPhraseCategory(e.target.value as any)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50 font-bold"
              >
                <option value="Articulation Blends">Articulation Blends</option>
                <option value="Multi-Syllables">Multi-Syllables</option>
                <option value="Rate Control">Rate Control</option>
                <option value="Custom">Custom Drill</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 text-white font-black text-xs rounded-xl hover:bg-emerald-600 shadow-md shadow-emerald-100 hover:shadow-lg transition-all flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add to presets
            </button>
          </form>
        </div>

        {/* Local Practice Tracker History Log */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-500" />
              Practice History Log
            </h3>
            {practiceHistory.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-[10px] font-black text-red-500 hover:text-red-600 bg-red-50 px-2.5 py-1 rounded-lg transition-all"
              >
                Clear Log
              </button>
            )}
          </div>

          <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
            {practiceHistory.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200/80 rounded-2xl p-4">
                <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-[10px] font-black text-slate-400">
                  No practice trials completed yet. Start pacing above!
                </p>
              </div>
            ) : (
              practiceHistory.map((sess) => (
                <div key={sess.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-slate-800 line-clamp-1">"{sess.phrase}"</p>
                    <p className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                      <span>{sess.segmentsCount} Syllables</span>
                      <span>•</span>
                      <span>{sess.durationSeconds}s practice</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-md block">
                      Success
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 mt-1 block">
                      {sess.timestamp}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
