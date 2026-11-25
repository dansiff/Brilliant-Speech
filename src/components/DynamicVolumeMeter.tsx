import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, Compass, Sparkles } from 'lucide-react';
import { speakText } from '../utils/speechUtils';
import { Language } from '../types';

interface DynamicVolumeMeterProps {
  analyser: AnalyserNode | null;
  isMicOn: boolean;
  toggleMicrophone: () => void;
  streakSeconds: number;
  startStreakTimer: () => void;
  stopStreakTimer: () => void;
}

export const DynamicVolumeMeter: React.FC<DynamicVolumeMeterProps> = ({
  analyser,
  isMicOn,
  toggleMicrophone,
  streakSeconds,
  startStreakTimer,
  stopStreakTimer
}) => {
  const [decibels, setDecibels] = useState(30);
  const [smoothedVolume, setSmoothedVolume] = useState(30);
  const animationFrameRef = useRef<number | null>(null);
  const zoneRef = useRef<'quiet' | 'perfect' | 'loud'>('quiet');

  const getVolumeZone = (db: number) => {
    if (db < 43) return 'quiet';
    if (db >= 43 && db <= 72) return 'perfect';
    return 'loud';
  };

  const getResponsiveBalloonY = (vol: number) => {
    const minVol = 30;
    const maxVol = 90;
    const range = maxVol - minVol;
    const pct = Math.min(Math.max((vol - minVol) / range, 0), 1);
    return -pct * 190;
  };

  useEffect(() => {
    if (!isMicOn || !analyser) {
      setDecibels(30);
      setSmoothedVolume(30);
      stopStreakTimer();
      zoneRef.current = 'quiet';
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const timeDomainData = new Float32Array(bufferLength);

    const updateLoop = () => {
      if (!analyser) return;
      analyser.getFloatTimeDomainData(timeDomainData);

      let sumSquares = 0.0;
      for (let i = 0; i < timeDomainData.length; i++) {
        sumSquares += timeDomainData[i] * timeDomainData[i];
      }
      const rms = Math.sqrt(sumSquares / timeDomainData.length);
      
      let db = 20 * Math.log10(rms || 0.00001) + 100;
      if (db < 30) db = 30;
      if (db > 100) db = 100;

      const roundedDb = Math.round(db);
      setDecibels(roundedDb);

      setSmoothedVolume(prev => {
        const diff = db - prev;
        const nextVol = prev + diff * 0.15;
        
        // Dynamic streak handling triggered only on boundaries to prevent redundant re-renders
        const zone = getVolumeZone(nextVol);
        if (zone !== zoneRef.current) {
          zoneRef.current = zone;
          if (zone === 'perfect') {
            startStreakTimer();
          } else {
            stopStreakTimer();
          }
        }
        return nextVol;
      });

      animationFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animationFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      stopStreakTimer();
    };
  }, [isMicOn, analyser, startStreakTimer, stopStreakTimer]);

  return (
    <div id="volume_meter_container" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left side: Interactive volume game and avatar physics */}
      <div className="lg:col-span-8 bg-white border border-slate-100 rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-6 flex flex-col justify-between">
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full animate-pulse">
              Volume Adventure
            </span>
            <div className="flex items-center gap-2">
              <button
                id="btn_vol_toggle_mic"
                onClick={toggleMicrophone}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm ${isMicOn ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
              >
                {isMicOn ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                {isMicOn ? 'Stop Lab' : 'Start Live Mic'}
              </button>
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Sound Decibel Level</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Turn on the microphone and talk! Keep your voice in the green <span className="text-emerald-500 font-black">"Happy Zone"</span> to keep the hot air balloon floating safely. If you whisper too quietly, the balloon sinks! If you shout, the balloon gets red and warnings flash!
          </p>
        </div>

        {/* STAGE AREA FOR AVATAR PHYSICS */}
        <div className="h-64 bg-gradient-to-b from-sky-100 to-sky-50 border border-sky-100 rounded-[2rem] relative overflow-hidden flex flex-col justify-between p-6">
          
          {/* Background decorative clouds */}
          <div className="absolute top-8 left-10 opacity-30 animate-pulse">☁️</div>
          <div className="absolute top-20 right-16 opacity-30">☁️</div>
          <div className="absolute bottom-16 left-32 opacity-25">☁️</div>

          {/* Sky zones lines */}
          <div className="absolute inset-y-0 right-4 w-28 flex flex-col justify-between text-[9px] font-black uppercase text-slate-400 py-3 pointer-events-none text-right">
            <div className="border-t border-red-300/40 pt-1 text-red-500">🚫 Too Loud! (&gt;72 dB)</div>
            <div className="border-t border-emerald-300/40 pt-1 text-emerald-600">🌟 Happy Zone (43-72 dB)</div>
            <div className="border-t border-sky-300/40 pt-1 text-sky-600">💤 Quiet Whispering</div>
          </div>

          {/* Target Streak Overlay */}
          {isMicOn && (
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-white/90 backdrop-blur border border-slate-100 px-3.5 py-1.5 rounded-2xl shadow-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-black text-slate-700">
                  Zone Streak: <span className="text-emerald-600 text-xs">{streakSeconds}s</span> / 5s
                </span>
              </div>
            </div>
          )}

          {/* THE BALLOON AVATAR */}
          <div className="w-full flex justify-center relative h-full items-end pb-8">
            <motion.div
              animate={{ 
                y: getResponsiveBalloonY(smoothedVolume),
                rotate: getVolumeZone(decibels) === 'loud' ? [0, -4, 4, -4, 0] : [0, -1, 1, -1, 0]
              }}
              transition={{
                y: { type: 'spring', stiffness: 50, damping: 12 },
                rotate: { repeat: getVolumeZone(decibels) === 'loud' ? Infinity : 0, duration: 0.3 }
              }}
              className="flex flex-col items-center relative"
            >
              {/* Speech bubble above balloon */}
              <AnimatePresence>
                {getVolumeZone(decibels) === 'loud' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -top-12 bg-red-500 text-white text-[9px] font-black px-2.5 py-1 rounded-xl shadow-md border border-red-600 uppercase"
                  >
                    Too Loud! 🤫
                  </motion.div>
                )}
                {getVolumeZone(decibels) === 'perfect' && streakSeconds > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute -top-12 bg-emerald-500 text-white text-[9px] font-black px-2.5 py-1 rounded-xl shadow-md border border-emerald-600 uppercase flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-200" /> Great Volume!
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Balloon envelope SVG */}
              <svg className="w-20 h-20 filter drop-shadow-md" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Envelope balloon skin */}
                <path 
                  d="M50 10C25 10 10 30 10 55C10 75 25 95 45 105C47 106 53 106 55 105C75 95 90 75 90 55C90 30 75 10 50 10Z" 
                  fill={
                    getVolumeZone(decibels) === 'loud' ? '#ef4444' : 
                    getVolumeZone(decibels) === 'perfect' ? '#10b981' : '#f59e0b'
                  }
                  className="transition-colors duration-300"
                />
                {/* Vertical stripes */}
                <path d="M50 10C38 10 30 35 30 55C30 75 38 102 50 105" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
                <path d="M50 10C62 10 70 35 70 55C70 75 62 102 50 105" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
                {/* Cute face */}
                <circle cx="38" cy="50" r="4" fill="white" />
                <circle cx="62" cy="50" r="4" fill="white" />
                <circle cx="38" cy="50" r="2" fill="black" />
                <circle cx="62" cy="50" r="2" fill="black" />
                {/* Blush */}
                <ellipse cx="32" cy="56" rx="4" ry="2" fill="#fda4af" />
                <ellipse cx="68" cy="56" rx="4" ry="2" fill="#fda4af" />
                {/* Mouth */}
                {getVolumeZone(decibels) === 'loud' ? (
                  <path d="M46 68 Q50 64 54 68" stroke="black" strokeWidth="2" strokeLinecap="round" />
                ) : getVolumeZone(decibels) === 'perfect' ? (
                  <path d="M44 64 Q50 72 56 64" stroke="black" strokeWidth="2" strokeLinecap="round" fill="none" />
                ) : (
                  <path d="M45 66 H55" stroke="black" strokeWidth="2" strokeLinecap="round" />
                )}
                {/* Ropes */}
                <line x1="38" y1="102" x2="42" y2="114" stroke="#78716c" strokeWidth="1.5" />
                <line x1="62" y1="102" x2="58" y2="114" stroke="#78716c" strokeWidth="1.5" />
                {/* Basket */}
                <rect x="40" y="112" width="20" height="12" rx="2" fill="#b45309" />
              </svg>
            </motion.div>
          </div>
        </div>

        {/* DECIBEL DIAL AND PROGRESS GAUGE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-black text-slate-500">
            <span>QUIET WHISPER (40dB)</span>
            <span className="text-indigo-600 font-extrabold">LIVE DECIBELS: {decibels} dB</span>
            <span>SHOUTING (80dB)</span>
          </div>

          {/* Dynamic colored bar */}
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200">
            <div 
              style={{ width: `${Math.max(decibels - 30, 0) / 0.7}%` }}
              className={`h-full rounded-full transition-all duration-75 ${
                getVolumeZone(decibels) === 'loud' ? 'bg-red-500 shadow-md shadow-red-200' :
                getVolumeZone(decibels) === 'perfect' ? 'bg-emerald-500 shadow-md shadow-emerald-200' : 'bg-amber-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Right side: Practice tips & static settings */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Target Zone Guide card */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-4 animate-fade-in">
          <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-500" /> Volume Guide Zones
          </h4>
          
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-start gap-2.5">
              <span className="text-lg">🦉</span>
              <div>
                <h5 className="text-xs font-black text-amber-800">Whisper Voice (30 - 45 dB)</h5>
                <p className="text-[10px] text-amber-700 leading-normal font-medium">
                  Like speaking in a quiet library or telling an exciting secret to a friend.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-2.5">
              <span className="text-lg">🐸</span>
              <div>
                <h5 className="text-xs font-black text-emerald-800">Green Speaking Zone (45 - 70 dB)</h5>
                <p className="text-[10px] text-emerald-700 leading-normal font-medium">
                  Your perfect, strong classroom speaking voice! Keeps your words clear and understandable.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-red-50/50 border border-red-100 flex items-start gap-2.5">
              <span className="text-lg">🦁</span>
              <div>
                <h5 className="text-xs font-black text-red-800">Shouting/Outside Voice (&gt;72 dB)</h5>
                <p className="text-[10px] text-red-700 leading-normal font-medium">
                  For playing outside! Try to bring your volume down when speaking with someone close.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Speech Reciter prompt */}
        <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/50 border border-indigo-100/60 rounded-[2.5rem] p-6 shadow-sm space-y-4">
          <span className="text-[9px] font-black uppercase text-indigo-700 tracking-wider">Practice Challenge</span>
          <h4 className="text-sm font-black text-slate-800">Say This Phrase:</h4>
          <div className="p-3.5 bg-white/80 rounded-2xl border border-indigo-100/50 relative">
            <p className="text-xs font-bold text-slate-700 italic leading-relaxed text-center">
              "Peter Rabbit popped some playful pink bubbles!"
            </p>
            <button
              onClick={() => speakText("Peter Rabbit popped some playful pink bubbles!", Language.ENGLISH)}
              className="absolute bottom-2 right-2 p-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal font-medium">
            Try to say the entire sentence inside the <span className="text-emerald-600 font-bold font-black">Green Speaking Zone</span> without setting off the "Too Loud" warning!
          </p>
        </div>

      </div>
    </div>
  );
};
