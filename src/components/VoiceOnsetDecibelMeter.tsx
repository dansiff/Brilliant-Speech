import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Volume2, 
  Mic, 
  Trophy, 
  Sparkles, 
  AlertTriangle, 
  Award, 
  Heart 
} from 'lucide-react';
import { DynamicVolumeMeter } from './DynamicVolumeMeter';
import { SpectrogramPitchLab, VoiceMeterStats } from './SpectrogramPitchLab';

const playMeterSound = (type: 'pop' | 'ding' | 'success' | 'warn' | 'power') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    if (type === 'pop') {
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'ding') {
      osc.frequency.setValueAtTime(587.33, now); // D5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.setValueAtTime(0.1, now + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'warn') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(120, now + 0.25);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'power') {
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (e) {
    console.warn("Audio Context sound failed:", e);
  }
};

const CONSONANT_PAIRS = [
  {
    title: 'P vs B (Lips Popping)',
    voiced: {
      consonant: '/b/ (Voiced)',
      example: 'Bat, Ball, Baby, Bubble',
      emoji: '🐝',
      tip: 'Hum like a little bee! Put your hand on your neck to feel your voice motor rumble.'
    },
    voiceless: {
      consonant: '/p/ (Voiceless)',
      example: 'Pat, Pop, Pig, Paper',
      emoji: '💨',
      tip: 'Just blow cold air out of your lips. The voice motor in your throat is completely off!'
    }
  },
  {
    title: 'T vs D (Tongue Tap)',
    voiced: {
      consonant: '/d/ (Voiced)',
      example: 'Dog, Dad, Dinosaur, Duck',
      emoji: '🥁',
      tip: 'Say "Duh-duh-duh". Your vocal cords are humming along with the drum beats!'
    },
    voiceless: {
      consonant: '/t/ (Voiceless)',
      example: 'Top, Toy, Turtle, Table',
      emoji: '⏰',
      tip: 'Your tongue taps behind your teeth but no humming! Like a quiet grandfather clock.'
    }
  },
  {
    title: 'K vs G (Throat Click)',
    voiced: {
      consonant: '/g/ (Voiced)',
      example: 'Goat, Game, Girl, Gorilla',
      emoji: '🐸',
      tip: 'Gargle a tiny bit in the back of your throat. Feel the warm motor shake your hand.'
    },
    voiceless: {
      consonant: '/k/ (Voiceless)',
      example: 'Cat, Key, Kangaroo, Cookie',
      emoji: '🔑',
      tip: 'A quiet cough or click in the back of your mouth. Keep the throat motor off!'
    }
  },
  {
    title: 'S vs Z (Hiss & Buzz)',
    voiced: {
      consonant: '/z/ (Voiced)',
      example: 'Zoo, Zebra, Zipper, Zero',
      emoji: '🦟',
      tip: 'Buzz like a mosquito! Keep your teeth closed and rumble your vocal cords.'
    },
    voiceless: {
      consonant: '/s/ (Voiceless)',
      example: 'Sun, Star, Snake, Soap',
      emoji: '🐍',
      tip: 'Hiss like a snake! Cool air slips through your teeth with no throat rumble.'
    }
  },
  {
    title: 'F vs V (Lip Biting)',
    voiced: {
      consonant: '/v/ (Voiced)',
      example: 'Van, Vase, Violin, Volcano',
      emoji: '🏎️',
      tip: 'Rev your racing car engine! Vroooom! Your lips should vibrate like crazy!'
    },
    voiceless: {
      consonant: '/f/ (Voiceless)',
      example: 'Fan, Fox, Fish, Flower',
      emoji: '🍃',
      tip: 'Bite your lip gently and blow "Ffff". It is just cool air passing by!'
    }
  }
];

export const VoiceOnsetDecibelMeter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'decibel' | 'onset' | 'spectrogram' | 'stats'>('decibel');
  const [stats, setStats] = useState<VoiceMeterStats>({
    decibelWins: 0,
    onsetWins: 0,
    highScoreStreak: 0,
    points: 100,
    history: []
  });

  const [selectedMission, setSelectedMission] = useState<'free' | 'steady' | 'rising' | 'wave'>('free');

  // Audio nodes & state
  const [isMicOn, setIsMicOn] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [streakSeconds, setStreakSeconds] = useState(0);
  const streakTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Voice Onset Time states
  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const [voiceOnsetDetecting, setVoiceOnsetDetecting] = useState(false);
  const [detectedVoiceState, setDetectedVoiceState] = useState<'SILENT' | 'VOICED' | 'VOICELESS' | null>(null);
  const [onsetHistory, setOnsetHistory] = useState<Array<{ time: string; state: 'VOICED' | 'VOICELESS'; match: boolean }>>([]);
  const detectBufferRef = useRef<number[]>([]);
  const detectPitchRef = useRef<number[]>([]);
  const detectSpectralRef = useRef<number[]>([]);

  // Load stats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('brilliant_speech_voice_onset_stats');
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch (e) {
        console.error("Failed parsing voice stats:", e);
      }
    }
  }, []);

  const saveStats = (newStats: VoiceMeterStats) => {
    setStats(newStats);
    localStorage.setItem('brilliant_speech_voice_onset_stats', JSON.stringify(newStats));
  };

  const startStreakTimer = () => {
    if (streakTimerRef.current) return;
    streakTimerRef.current = setInterval(() => {
      setStreakSeconds(prev => {
        const next = prev + 1;
        if (next === 5) {
          playMeterSound('success');
          setStats(current => {
            const updatedPoints = current.points + 25;
            const newHistory = [
              {
                id: `decibel-${Date.now()}`,
                timestamp: new Date().toLocaleString(),
                type: 'Volume Master' as const,
                score: 25,
                description: 'Kept green zone volume for 5 seconds streak!'
              },
              ...current.history
            ];
            const updated = {
              ...current,
              decibelWins: current.decibelWins + 1,
              highScoreStreak: Math.max(current.highScoreStreak, 5),
              points: updatedPoints,
              history: newHistory.slice(0, 15)
            };
            localStorage.setItem('brilliant_speech_voice_onset_stats', JSON.stringify(updated));
            return updated;
          });
        }
        return next;
      });
    }, 1000);
  };

  const stopStreakTimer = () => {
    if (streakTimerRef.current) {
      clearInterval(streakTimerRef.current);
      streakTimerRef.current = null;
    }
    setStreakSeconds(0);
  };

  // Turn Mic On/Off
  const toggleMicrophone = async () => {
    if (isMicOn) {
      stopAudioAnalysis();
    } else {
      await startAudioAnalysis();
    }
  };

  const startAudioAnalysis = async () => {
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      setIsMicOn(true);
      playMeterSound('power');
    } catch (err: any) {
      console.error("Microphone access failed", err);
      setMicError("Microphone access denied. Please allow mic access.");
    }
  };

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    streamRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
    setIsMicOn(false);
    stopStreakTimer();
  };

  const detectPitch = (timeDomainData: Float32Array, sampleRate: number): number => {
    let size = timeDomainData.length;
    let r = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size - i; j++) {
        r[i] += timeDomainData[j] * timeDomainData[j + i];
      }
    }
    let d = 0;
    while (d < size - 1 && r[d] > r[d + 1]) d++;
    let maxval = -1;
    let maxpos = -1;
    for (let i = d; i < size - 1; i++) {
      if (r[i] > r[i - 1] && r[i] > r[i + 1]) {
        if (r[i] > maxval) {
          maxval = r[i];
          maxpos = i;
        }
      }
    }
    if (maxpos !== -1 && maxval > 0.15) {
      const pitch = sampleRate / maxpos;
      if (pitch >= 80 && pitch <= 650) {
        return pitch;
      }
    }
    return -1;
  };

  const analyzeSpectralEnergy = (frequencyData: Uint8Array, sampleRate: number) => {
    const totalBins = frequencyData.length;
    const hzPerBin = sampleRate / (totalBins * 2);
    let lowEnergy = 0;
    let highEnergy = 0;
    for (let i = 0; i < totalBins; i++) {
      const freq = i * hzPerBin;
      const energy = frequencyData[i];
      if (freq < 1600) {
        lowEnergy += energy;
      } else if (freq > 3000) {
        highEnergy += energy;
      }
    }
    if (lowEnergy === 0) return 0;
    return highEnergy / lowEnergy;
  };

  const runRealTimeFeedback = () => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const analyser = analyserRef.current;
    const sampleRate = audioContextRef.current.sampleRate;
    const bufferLength = analyser.frequencyBinCount;
    
    const frequencyData = new Uint8Array(bufferLength);
    const timeDomainData = new Float32Array(bufferLength);

    const updateLoop = () => {
      if (!analyserRef.current) return;
      
      analyser.getByteFrequencyData(frequencyData);
      analyser.getFloatTimeDomainData(timeDomainData);

      if (voiceOnsetDetecting) {
        let sumSquares = 0.0;
        for (let i = 0; i < timeDomainData.length; i++) {
          sumSquares += timeDomainData[i] * timeDomainData[i];
        }
        const rms = Math.sqrt(sumSquares / timeDomainData.length);
        let db = 20 * Math.log10(rms || 0.00001) + 100;
        if (db < 30) db = 30;
        if (db > 100) db = 100;

        if (db > 42) {
          const pitch = detectPitch(timeDomainData, sampleRate);
          const highLowRatio = analyzeSpectralEnergy(frequencyData, sampleRate);
          detectBufferRef.current.push(db);
          detectPitchRef.current.push(pitch);
          detectSpectralRef.current.push(highLowRatio);
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animationFrameRef.current = requestAnimationFrame(updateLoop);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streakTimerRef.current) {
        clearInterval(streakTimerRef.current);
      }
    };
  }, []);

  const triggerVoiceOnsetCapture = () => {
    if (!isMicOn) {
      startAudioAnalysis().then(() => {
        startCaptureSequence();
      });
    } else {
      startCaptureSequence();
    }
  };

  const startCaptureSequence = () => {
    playMeterSound('pop');
    setVoiceOnsetDetecting(true);
    setDetectedVoiceState(null);
    detectBufferRef.current = [];
    detectPitchRef.current = [];
    detectSpectralRef.current = [];

    runRealTimeFeedback();

    setTimeout(() => {
      setVoiceOnsetDetecting(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      analyzeCapturedSamples();
    }, 1300);
  };

  const analyzeCapturedSamples = () => {
    const dbs = detectBufferRef.current;
    const pitches = detectPitchRef.current;
    const spectrals = detectSpectralRef.current;

    const maxDb = dbs.length > 0 ? Math.max(...dbs) : 30;
    if (maxDb < 45) {
      setDetectedVoiceState('SILENT');
      playMeterSound('warn');
      return;
    }

    const validPitchCount = pitches.filter(p => p > 0).length;
    const pitchRatio = pitches.length > 0 ? validPitchCount / pitches.length : 0;
    const avgSpectralRatio = spectrals.length > 0 
      ? spectrals.reduce((a, b) => a + b, 0) / spectrals.length 
      : 0;

    let detected: 'VOICED' | 'VOICELESS' = 'VOICED';
    if (pitchRatio < 0.25 || avgSpectralRatio > 0.45) {
      detected = 'VOICELESS';
    } else {
      detected = 'VOICED';
    }

    setDetectedVoiceState(detected);

    if (detected === 'VOICED') {
      playMeterSound('ding');
    } else {
      playMeterSound('success');
    }

    setOnsetHistory(prev => [
      {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        state: detected,
        match: true
      },
      ...prev
    ].slice(0, 10));

    setStats(current => {
      const updatedPoints = current.points + 15;
      const newHistory = [
        {
          id: `onset-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          type: 'Voice Onset' as const,
          score: 15,
          description: `Vocal fold analysis detected: ${detected === 'VOICED' ? 'Voiced Consonant (/b/, /d/, etc.)' : 'Voiceless Consonant (/p/, /t/, etc.)'}`
        },
        ...current.history
      ];
      const updated = {
        ...current,
        onsetWins: current.onsetWins + 1,
        points: updatedPoints,
        history: newHistory.slice(0, 15)
      };
      localStorage.setItem('brilliant_speech_voice_onset_stats', JSON.stringify(updated));
      return updated;
    });
  };

  const matchScoreRef = useRef<number>(0);

  return (
    <div id="vocal_lab_container" className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* Dynamic Header */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
            <Activity className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-800">Voice & Acoustics Lab</h3>
            <p className="text-xs font-black text-slate-400">Tactile vocal cord vibration and real-time volume coaching</p>
          </div>
        </div>

        {/* Level & points */}
        <div className="flex items-center gap-6 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-2.5">
          <div className="text-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Lab Stars</span>
            <span className="text-lg font-black text-amber-500 flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
              {stats.points}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-slate-200" />
          <div className="text-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Zone Achievements</span>
            <span className="text-sm font-extrabold text-emerald-600">
              {stats.decibelWins + stats.onsetWins} Passed
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center p-1 bg-white border border-slate-100 rounded-2xl max-w-xl mx-auto shadow-sm">
        <button
          onClick={() => { setActiveTab('decibel'); playMeterSound('pop'); }}
          className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all text-center flex items-center justify-center gap-1 ${activeTab === 'decibel' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          Volume Meter
        </button>
        <button
          onClick={() => { setActiveTab('onset'); playMeterSound('pop'); }}
          className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all text-center flex items-center justify-center gap-1 ${activeTab === 'onset' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Activity className="w-3.5 h-3.5" />
          Voice Onset
        </button>
        <button
          onClick={() => { setActiveTab('spectrogram'); playMeterSound('pop'); }}
          className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all text-center flex items-center justify-center gap-1 ${activeTab === 'spectrogram' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Activity className="w-3.5 h-3.5" />
          Spectrogram & Pitch
        </button>
        <button
          onClick={() => { setActiveTab('stats'); playMeterSound('pop'); }}
          className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all text-center flex items-center justify-center gap-1 ${activeTab === 'stats' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Award className="w-3.5 h-3.5" />
          Lab History
        </button>
      </div>

      {/* Error alert */}
      {micError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 max-w-lg mx-auto">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="text-xs text-red-700 font-semibold">{micError}</div>
        </div>
      )}

      {/* Active tab content */}
      <AnimatePresence mode="wait">
        
        {activeTab === 'decibel' && (
          <motion.div
            key="decibel-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DynamicVolumeMeter
              analyser={analyserRef.current}
              isMicOn={isMicOn}
              toggleMicrophone={toggleMicrophone}
              streakSeconds={streakSeconds}
              startStreakTimer={startStreakTimer}
              stopStreakTimer={stopStreakTimer}
            />
          </motion.div>
        )}

        {activeTab === 'onset' && (
          <motion.div
            key="onset-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            <div className="lg:col-span-8 bg-white border border-slate-100 rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-6">
              
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  Phonation Lab
                </span>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Voice Onset Time & Vibration</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Speech therapy uses "Voiced" sounds (which start with vocal cord rumble, like /b/ or /z/) and "Voiceless" sounds (just air pops, like /p/ or /s/). Place your fingers gently on your neck and make the sounds below to feel the difference!
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CONSONANT_PAIRS.map((pair, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setSelectedPairIndex(idx); setDetectedVoiceState(null); playMeterSound('pop'); }}
                    className={`p-3 rounded-2xl border text-center transition-all ${selectedPairIndex === idx ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'}`}
                  >
                    <span className="text-xs font-black block">{pair.title.split(' ')[0]}</span>
                    <span className="text-[10px] font-extrabold opacity-80 block mt-1">{pair.title.split(' ').slice(1).join(' ')}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="p-5 bg-gradient-to-br from-indigo-50/50 to-slate-50/50 border border-indigo-100 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-indigo-800 tracking-wider bg-indigo-100/60 px-2.5 py-0.5 rounded-md">
                      Voice IS Vibrating
                    </span>
                    <span className="text-2xl">{CONSONANT_PAIRS[selectedPairIndex].voiced.emoji}</span>
                  </div>
                  <h4 className="text-lg font-black text-slate-800">{CONSONANT_PAIRS[selectedPairIndex].voiced.consonant}</h4>
                  <p className="text-xs font-bold text-slate-600">Examples: {CONSONANT_PAIRS[selectedPairIndex].voiced.example}</p>
                  
                  <div className="bg-white p-3 rounded-xl border border-slate-100 text-[10px] text-slate-500 leading-normal font-semibold">
                    💡 {CONSONANT_PAIRS[selectedPairIndex].voiced.tip}
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-br from-emerald-50/50 to-slate-50/50 border border-emerald-100 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider bg-emerald-100/60 px-2.5 py-0.5 rounded-md">
                      Voice is Quiet Air
                    </span>
                    <span className="text-2xl">{CONSONANT_PAIRS[selectedPairIndex].voiceless.emoji}</span>
                  </div>
                  <h4 className="text-lg font-black text-slate-800">{CONSONANT_PAIRS[selectedPairIndex].voiceless.consonant}</h4>
                  <p className="text-xs font-bold text-slate-600">Examples: {CONSONANT_PAIRS[selectedPairIndex].voiceless.example}</p>
                  
                  <div className="bg-white p-3 rounded-xl border border-slate-100 text-[10px] text-slate-500 leading-normal font-semibold">
                    💡 {CONSONANT_PAIRS[selectedPairIndex].voiceless.tip}
                  </div>
                </div>

              </div>

              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 text-center space-y-4">
                
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Acoustic Throat Vibration Detector</h4>

                <div className="flex flex-col items-center justify-center space-y-3">
                  
                  {voiceOnsetDetecting ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white text-lg font-black animate-pulse shadow-lg shadow-red-100 mx-auto">
                        🎤
                      </div>
                      <p className="text-xs font-bold text-slate-600 animate-bounce">Listening closely... Make the sound now!</p>
                      
                      <div className="flex items-center justify-center gap-1.5 h-10 py-1">
                        {[1, 3, 5, 8, 10, 8, 5, 2, 6, 9, 7, 3, 1, 4, 8, 9, 5, 2, 1].map((h, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: [4, h * 3, 4] }}
                            transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.03 }}
                            className="w-1 bg-indigo-500 rounded-full"
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      id="btn_start_onset_check"
                      onClick={triggerVoiceOnsetCapture}
                      className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center gap-2"
                    >
                      <Mic className="w-4 h-4 animate-pulse" />
                      Start Consonant Check
                    </button>
                  )}

                  <AnimatePresence>
                    {detectedVoiceState && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-6 rounded-2xl border text-center w-full max-w-md mx-auto space-y-2 ${
                          detectedVoiceState === 'VOICED' ? 'bg-indigo-50 border-indigo-200 text-indigo-900' :
                          detectedVoiceState === 'VOICELESS' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        {detectedVoiceState === 'VOICED' && (
                          <>
                            <span className="text-3xl block">🔊 BZZZZ!</span>
                            <h4 className="text-base font-black">VOICE MOTOR ON!</h4>
                            <p className="text-xs text-indigo-700 font-medium">
                              Vocal folds vibrated perfectly. We detected a fundamental periodic rumble in your voice!
                            </p>
                          </>
                        )}
                        {detectedVoiceState === 'VOICELESS' && (
                          <>
                            <span className="text-3xl block">💨 PUFF!</span>
                            <h4 className="text-base font-black">VOICED MOTOR OFF (Just Air)!</h4>
                            <p className="text-xs text-emerald-700 font-medium">
                              Great clean puff! High spectral frequencies were detected without any vocal cord vibration.
                            </p>
                          </>
                        )}
                        {detectedVoiceState === 'SILENT' && (
                          <>
                            <span className="text-3xl block">🤫 Quiet</span>
                            <h4 className="text-base font-black">No Sound Detected</h4>
                            <p className="text-xs text-slate-500 font-medium">
                              We didn't catch that sound. Turn up your volume and hold the mic closer to your mouth!
                            </p>
                          </>
                        )}

                        <span className="text-[10px] font-black uppercase text-amber-600 bg-white border border-amber-200/50 px-2.5 py-1 rounded-full inline-block mt-2">
                          🌟 +15 Lab Stars Awarded!
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>

              </div>

            </div>

            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400 fill-red-400" /> Speech Therapist Tips
                </h4>
                
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Speech therapists often use <strong>tactile feedback</strong>. Try these three tricks to help children understand:
                </p>

                <div className="space-y-3 text-[11px] text-slate-600">
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <strong>1. Throat Touch:</strong> Put two fingers gently on the throat. Say "Ahhhh" then whisper "Shhh". Feel when the rumble turns on and off!
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <strong>2. Hand-in-Front:</strong> Place a hand in front of the mouth. Say /p/ then /b/. Feel the strong puff of warm air for /p/ but minimal for /b/.
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <strong>3. Ear Plug Trick:</strong> Plug ears gently and say "Zzzz". The voicing will sound extremely loud inside their head, but "Ssss" stays quiet!
                  </div>
                </div>
              </div>

              {onsetHistory.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Captures</h4>
                  <div className="space-y-2">
                    {onsetHistory.map((log, index) => (
                      <div key={index} className="flex items-center justify-between text-xs p-2.5 bg-slate-50 rounded-xl">
                        <span className="font-semibold text-slate-500">{log.time}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          log.state === 'VOICED' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {log.state}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}

        {activeTab === 'spectrogram' && (
          <motion.div
            key="spectrogram-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SpectrogramPitchLab
              analyser={analyserRef.current}
              sampleRate={audioContextRef.current?.sampleRate || 44100}
              isMicOn={isMicOn}
              toggleMicrophone={toggleMicrophone}
              selectedMission={selectedMission}
              setSelectedMission={setSelectedMission}
              matchScoreRef={matchScoreRef}
              setStats={setStats}
              playMeterSound={playMeterSound}
            />
          </motion.div>
        )}

        {activeTab === 'stats' && (
          <motion.div
            key="stats-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-slate-100 rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Lab Session Logs</h3>
                <p className="text-xs text-slate-400 font-bold">Comprehensive acoustic practice scores and tracking</p>
              </div>
              <button
                onClick={() => {
                  const cleared = {
                    decibelWins: 0,
                    onsetWins: 0,
                    highScoreStreak: 0,
                    points: 100,
                    history: []
                  };
                  saveStats(cleared);
                  playMeterSound('pop');
                }}
                className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-xl border border-transparent hover:border-red-100 transition-all"
              >
                Clear History
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl text-center space-y-1">
                <span className="text-2xl">📈</span>
                <h5 className="text-xs font-black text-slate-500 uppercase">Volume Successes</h5>
                <p className="text-xl font-black text-emerald-600">{stats.decibelWins} Streaks</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl text-center space-y-1">
                <span className="text-2xl">🎤</span>
                <h5 className="text-xs font-black text-slate-500 uppercase">Onset Captures</h5>
                <p className="text-xl font-black text-indigo-600">{stats.onsetWins} analyzed</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl text-center space-y-1">
                <span className="text-2xl">⭐</span>
                <h5 className="text-xs font-black text-slate-500 uppercase">Best Volume Streak</h5>
                <p className="text-xl font-black text-amber-500">{stats.highScoreStreak} Seconds</p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Acoustic Activity Timeline</h4>
              
              {stats.history.length === 0 ? (
                <div className="text-center py-8 text-slate-300 text-xs font-bold">
                  No lab activities completed yet. Start the Volume Meter or Voice Onset check to see achievements here!
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {stats.history.map((log) => (
                    <div key={log.id} className="p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl flex items-center justify-between transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {log.type === 'Volume Master' ? '🔊' : '🎙️'}
                        </span>
                        <div>
                          <h5 className="text-xs font-extrabold text-slate-800">{log.type}</h5>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{log.timestamp}</p>
                          <p className="text-[11px] text-slate-500 font-semibold mt-1">{log.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-amber-600 flex items-center justify-end gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          +{log.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};
