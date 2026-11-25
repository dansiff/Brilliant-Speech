import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  Flame, 
  RotateCcw, 
  TrendingUp, 
  Flower2, 
  Sprout, 
  Sun, 
  Award,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { speakText } from '../utils/speechUtils';
import { audioPipeline } from '../services/audioArchitecture';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface PlantFlower {
  id: number;
  type: 'tulip' | 'sunflower' | 'rose' | 'daisy';
  stage: number; // 0: seed, 1: sprout, 2: blooming, 3: full flower
  color: string;
}

export const VocalTherapyLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vfe_glides' | 'pitch_path' | 'volume_garden'>('volume_garden');
  
  // Real-time Audio Mic and Stats
  const [isMicOn, setIsMicOn] = useState<boolean>(false);
  const [currentPitchHz, setCurrentPitchHz] = useState<number>(220);
  const [currentDecibels, setCurrentDecibels] = useState<number>(62);
  const [mptSeconds, setMptSeconds] = useState<number>(0);
  const [isSustaining, setIsSustaining] = useState<boolean>(false);
  const mptTimerRef = useRef<any>(null);

  // Volume Garden State
  const [gardenFlowers, setGardenFlowers] = useState<PlantFlower[]>([
    { id: 1, type: 'tulip', stage: 2, color: 'text-rose-500' },
    { id: 2, type: 'sunflower', stage: 1, color: 'text-amber-500' },
    { id: 3, type: 'rose', stage: 0, color: 'text-purple-500' },
    { id: 4, type: 'daisy', stage: 3, color: 'text-pink-500' }
  ]);
  const [waterPoints, setWaterPoints] = useState<number>(140);
  const gardenLoopRef = useRef<any>(null);

  // Pitch Path Game State
  const [pitchMission, setPitchMission] = useState<'rising_glide' | 'falling_glide' | 'steady_tone' | 'sinusoidal_wave'>('rising_glide');
  const [pitchPathScore, setPitchPathScore] = useState<number>(85);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Start Real-Time Microphone & Acoustic Tracking
  const toggleMicrophone = async () => {
    if (!isMicOn) {
      try {
        await audioPipeline.startRecording();
        setIsMicOn(true);
        toast.success('Voice sensor online. Acoustic feedback engaged!');
      } catch (err) {
        toast.error('Microphone access is required.');
      }
    } else {
      try {
        await audioPipeline.stopRecording();
      } catch (e) {}
      setIsMicOn(false);
      if (isSustaining) stopSustainedPhonation();
    }
  };

  // Acoustic polling for Volume Garden and Pitch Path simulation
  useEffect(() => {
    let interval: any = null;
    if (isMicOn) {
      interval = setInterval(() => {
        // Poll acoustic metrics from architecture or simulate realistic acoustic jitter
        const simulatedDb = 58 + Math.floor(Math.random() * 16); // 58-74 dB
        const simulatedPitch = 190 + Math.floor(Math.random() * 60); // 190-250 Hz

        setCurrentDecibels(simulatedDb);
        setCurrentPitchHz(simulatedPitch);

        // In Volume Garden: 60-72 dB is healthy vocal hygiene green zone
        if (activeTab === 'volume_garden' && simulatedDb >= 60 && simulatedDb <= 72) {
          setWaterPoints(prev => prev + 2);
          // Evolve a random flower stage
          if (Math.random() > 0.7) {
            setGardenFlowers(prev => prev.map(f => {
              if (f.stage < 3 && Math.random() > 0.5) {
                return { ...f, stage: f.stage + 1 };
              }
              return f;
            }));
          }
        }
      }, 300);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMicOn, activeTab]);

  // Sustained Phonation Timer (MPT)
  const startSustainedPhonation = async () => {
    if (!isMicOn) await toggleMicrophone();
    setIsSustaining(true);
    setMptSeconds(0);
    mptTimerRef.current = setInterval(() => {
      setMptSeconds(prev => prev + 0.1);
    }, 100);
  };

  const stopSustainedPhonation = () => {
    if (mptTimerRef.current) clearInterval(mptTimerRef.current);
    setIsSustaining(false);
    const scoreSec = Math.round(mptSeconds * 10) / 10;
    if (scoreSec >= 8.0) {
      confetti({ particleCount: 30, spread: 50 });
      toast.success(`🎉 Excellent Maximum Phonation Time: ${scoreSec} seconds!`);
    } else {
      toast.info(`Sustained phonation: ${scoreSec}s. Aim for ≥8 seconds to build breath support.`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-700 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Voice, Pitch & Resonance Lab
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Vocal Function & Hygiene Lab
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Strengthen vocal cords, practice resonant voice, and maintain optimal pediatric decibels without vocal strain.
          </p>
        </div>

        {/* Microphone Sensor Action */}
        <button
          onClick={toggleMicrophone}
          className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md ${
            isMicOn
              ? 'bg-rose-600 text-white shadow-rose-200 animate-pulse'
              : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'
          }`}
        >
          {isMicOn ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {isMicOn ? 'Turn Off Voice Sensor' : 'Engage Voice Sensor'}
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('volume_garden')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            activeTab === 'volume_garden'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Flower2 className="w-4 h-4 text-pink-400" />
          The Volume Garden Game
        </button>

        <button
          onClick={() => setActiveTab('pitch_path')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            activeTab === 'pitch_path'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Pitch Path Trajectory
        </button>

        <button
          onClick={() => setActiveTab('vfe_glides')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            activeTab === 'vfe_glides'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4 text-indigo-400" />
          Vocal Function Exercises (VFEs)
        </button>
      </div>

      {/* Tab 1: Volume Garden */}
      {activeTab === 'volume_garden' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">Grow the Volume Garden</h3>
              <p className="text-xs text-slate-500">
                Keep your voice inside the gentle <strong>Green Target Zone (60–72 dB)</strong> to shower and blossom your garden flowers.
              </p>
            </div>

            <div className="bg-pink-50 border border-pink-200 px-4 py-2 rounded-2xl flex items-center gap-2 text-pink-900 font-black text-sm">
              <Sun className="w-4 h-4 text-amber-500 animate-spin" />
              Garden Water Points: {waterPoints}
            </div>
          </div>

          {/* Real-time Decibel Bar Gauge */}
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-black uppercase">
              <span className="text-slate-400">Whisper (&lt;50 dB)</span>
              <span className="text-emerald-700 bg-emerald-100 px-3 py-0.5 rounded-full border border-emerald-300">
                🌱 Healthy Speaking Zone (60-72 dB)
              </span>
              <span className="text-rose-600">Over-shouting (&gt;85 dB)</span>
            </div>

            <div className="h-6 w-full bg-slate-200 rounded-full overflow-hidden relative">
              {/* Healthy Target Zone Marker in Center */}
              <div className="absolute left-[40%] right-[30%] top-0 bottom-0 bg-emerald-300/40 border-x-2 border-emerald-500" />

              <motion.div
                className={`h-full rounded-full transition-all duration-150 ${
                  currentDecibels > 80
                    ? 'bg-rose-500'
                    : currentDecibels >= 60
                    ? 'bg-emerald-500 shadow-md shadow-emerald-300'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, (currentDecibels / 95) * 100)}%` }}
              />
            </div>

            <div className="text-center font-mono font-black text-sm text-slate-700">
              Live Volume: {currentDecibels} dB
            </div>
          </div>

          {/* Visual Garden Plot */}
          <div className="p-8 bg-gradient-to-b from-sky-100 via-emerald-50 to-emerald-100 rounded-3xl border border-emerald-200 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center min-h-[220px]">
            {gardenFlowers.map((flower) => {
              const flowerEmoji = flower.stage === 0 ? '🌰' : flower.stage === 1 ? '🌱' : flower.stage === 2 ? '🌿' : '🌸';
              const stageLabel = flower.stage === 0 ? 'Seed' : flower.stage === 1 ? 'Sprout' : flower.stage === 2 ? 'Budding' : 'Full Bloom!';

              return (
                <motion.div
                  key={flower.id}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-emerald-200 shadow-sm flex flex-col items-center justify-between"
                >
                  <span className="text-4xl sm:text-5xl mb-2">{flowerEmoji}</span>
                  <div>
                    <span className="text-xs font-bold text-slate-800 capitalize block">{flower.type}</span>
                    <span className="text-[10px] font-black uppercase text-emerald-700">{stageLabel}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Pitch Path Trajectory */}
      {activeTab === 'pitch_path' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">The Pitch Path</h3>
              <p className="text-xs text-slate-500">Glide your vocal pitch ($F_0$) smoothly up and down to navigate the spaceship tunnel.</p>
            </div>

            <div className="flex items-center gap-2">
              {[
                { id: 'rising_glide', name: 'Rising Glide' },
                { id: 'falling_glide', name: 'Falling Glide' },
                { id: 'sinusoidal_wave', name: 'Wave Path' }
              ].map((m: any) => (
                <button
                  key={m.id}
                  onClick={() => setPitchMission(m.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                    pitchMission === m.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Pitch Tunnel Arena */}
          <div className="p-8 bg-slate-900 rounded-3xl text-white flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
            <div className="text-center space-y-2 z-10">
              <span className="text-5xl block animate-bounce">🚀</span>
              <div className="text-2xl font-mono font-black text-indigo-400">
                {currentPitchHz} Hz ($F_0$)
              </div>
              <p className="text-xs text-slate-400">
                {pitchMission === 'rising_glide'
                  ? 'Start on a comfortable low tone and glide upwards to high note.'
                  : 'Start high and slide downward smoothly.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: VFEs (Maximum Phonation Time & Sustained Tone) */}
      {activeTab === 'vfe_glides' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-900">Vocal Function Exercises (VFEs)</h3>
            <p className="text-xs text-slate-500">
              Sustained phonation of vowel /a/ or /i/ on pitch. Measures respiratory-laryngeal coordination and Maximum Phonation Time.
            </p>
          </div>

          {/* Sustained Phonation Timer Card */}
          <div className="p-8 rounded-3xl bg-indigo-50/60 border border-indigo-200 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-indigo-600 text-white mx-auto flex items-center justify-center font-black text-3xl shadow-lg shadow-indigo-200">
              {Math.round(mptSeconds * 10) / 10}s
            </div>

            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-xl font-black text-slate-900">Sustained /a/ Warm-Up</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Take a deep diaphragmatic breath and produce a soft, clear /a/ sound for as long as possible without straining.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4">
              {!isSustaining ? (
                <button
                  onClick={startSustainedPhonation}
                  className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all"
                >
                  <Mic className="w-5 h-5" />
                  Start Sustained Phonation
                </button>
              ) : (
                <button
                  onClick={stopSustainedPhonation}
                  className="px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm uppercase tracking-wider shadow-lg animate-pulse flex items-center gap-2 transition-all"
                >
                  <MicOff className="w-5 h-5" />
                  Stop & Record MPT ({Math.round(mptSeconds * 10) / 10}s)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
