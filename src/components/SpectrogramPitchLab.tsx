import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, TrendingUp, Sparkles, Compass, Activity, Volume2 } from 'lucide-react';
import { speakText } from '../utils/speechUtils';
import { Language } from '../types';

export interface VoiceMeterStats {
  decibelWins: number;
  onsetWins: number;
  highScoreStreak: number;
  points: number;
  history: Array<{
    id: string;
    timestamp: string;
    type: 'Volume Master' | 'Voice Onset';
    score: number;
    description: string;
  }>;
}

interface SpectrogramPitchLabProps {
  analyser: AnalyserNode | null;
  sampleRate: number;
  isMicOn: boolean;
  toggleMicrophone: () => void;
  selectedMission: 'free' | 'steady' | 'rising' | 'wave';
  setSelectedMission: React.Dispatch<React.SetStateAction<'free' | 'steady' | 'rising' | 'wave'>>;
  matchScoreRef: React.MutableRefObject<number>;
  setStats: React.Dispatch<React.SetStateAction<VoiceMeterStats>>;
  playMeterSound: (type: 'pop' | 'ding' | 'success' | 'warn' | 'power') => void;
}

export const SpectrogramPitchLab: React.FC<SpectrogramPitchLabProps> = ({
  analyser,
  sampleRate,
  isMicOn,
  toggleMicrophone,
  selectedMission,
  setSelectedMission,
  matchScoreRef,
  setStats,
  playMeterSound
}) => {
  const [claimStatus, setClaimStatus] = useState<{ type: 'success' | 'fail' | null; message: string }>({ type: null, message: '' });
  const spectrogramCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pitchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pitchHistoryRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const getTargetPitch = (fraction: number): number => {
    if (selectedMission === 'steady') return 220;
    if (selectedMission === 'rising') return 180 + fraction * 140; // 180 to 320Hz
    if (selectedMission === 'wave') return 220 + Math.sin(fraction * Math.PI * 1.5) * 65;
    return 200;
  };

  const drawPitchTunnel = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (selectedMission === 'free') return;
    
    ctx.beginPath();
    const minPitch = 100;
    const maxPitch = 400;
    const tunnelRadius = 25; // 25Hz tunnel width
    
    for (let x = 0; x < width; x += 5) {
      const fract = x / width;
      const targetHz = getTargetPitch(fract);
      const yTop = height - (((targetHz + tunnelRadius) - minPitch) / (maxPitch - minPitch)) * height;
      if (x === 0) {
        ctx.moveTo(x, yTop);
      } else {
        ctx.lineTo(x, yTop);
      }
    }
    
    for (let x = width; x >= 0; x -= 5) {
      const fract = x / width;
      const targetHz = getTargetPitch(fract);
      const yBottom = height - (((targetHz - tunnelRadius) - minPitch) / (maxPitch - minPitch)) * height;
      ctx.lineTo(x, yBottom);
    }
    
    ctx.closePath();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
    ctx.fill();
    
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 2;
    for (let x = 0; x < width; x += 10) {
      const fract = x / width;
      const targetHz = getTargetPitch(fract);
      const yTarget = height - ((targetHz - minPitch) / (maxPitch - minPitch)) * height;
      if (x === 0) ctx.moveTo(x, yTarget);
      else ctx.lineTo(x, yTarget);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawSpectrogramFrame = (frequencyData: Uint8Array) => {
    const canvas = spectrogramCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const shift = 2;

    ctx.drawImage(canvas, shift, 0, width - shift, height, 0, 0, width - shift, height);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(width - shift, 0, shift, height);

    const x = width - shift;
    const lowBin = 1;
    const highBin = Math.min(80, frequencyData.length);
    const binCount = highBin - lowBin;
    const sliceHeight = height / binCount;

    for (let i = 0; i < binCount; i++) {
      const binValue = frequencyData[lowBin + i];
      const y = height - (i * sliceHeight);
      
      if (binValue > 15) {
        let r = 9, g = 13, b = 22;
        if (binValue < 70) {
          const rati = binValue / 70;
          r = Math.floor(rati * 80);
          g = Math.floor(rati * 40);
          b = Math.floor(50 + rati * 150);
        } else if (binValue < 160) {
          const rati = (binValue - 70) / 90;
          r = Math.floor(80 + rati * 140);
          g = Math.floor(40 + rati * 30);
          b = Math.floor(200 - rati * 60);
        } else {
          const rati = Math.min(1, (binValue - 160) / 95);
          r = 220 + Math.floor(rati * 35);
          g = 70 + Math.floor(rati * 185);
          b = 140 - Math.floor(rati * 100);
        }

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, y - sliceHeight, shift, sliceHeight + 0.3);
      }
    }
  };

  const detectPitchLocal = (timeDomainData: Float32Array): number => {
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

  const drawPitchArenaFrame = () => {
    const canvas = pitchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const minPitch = 100;
    const maxPitch = 400;
    const gridPitches = [100, 200, 300, 400];
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '9px monospace';
    
    gridPitches.forEach(pHz => {
      const y = height - ((pHz - minPitch) / (maxPitch - minPitch)) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.fillText(`${pHz}Hz`, 8, y - 4);
    });

    drawPitchTunnel(ctx, width, height);

    const history = pitchHistoryRef.current;
    if (history.length === 0) return;

    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    let isDrawingLine = false;
    let matchCount = 0;
    let totalSamplesWithPitch = 0;

    for (let i = 0; i < history.length; i++) {
      const hz = history[i];
      const x = (i / 300) * width;
      const fract = x / width;

      if (hz > 0) {
        totalSamplesWithPitch++;
        const y = height - ((hz - minPitch) / (maxPitch - minPitch)) * height;
        
        if (selectedMission !== 'free') {
          const targetHz = getTargetPitch(fract);
          const tunnelRadius = 25;
          if (hz >= targetHz - tunnelRadius && hz <= targetHz + tunnelRadius) {
            matchCount++;
          }
        }

        if (!isDrawingLine) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          isDrawingLine = true;
        } else {
          ctx.lineTo(x, y);
        }
      } else {
        if (isDrawingLine) {
          ctx.strokeStyle = selectedMission !== 'free' ? '#10b981' : '#f59e0b';
          ctx.shadowColor = selectedMission !== 'free' ? '#10b981' : '#f59e0b';
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.shadowBlur = 0;
          isDrawingLine = false;
        }
      }
    }

    if (isDrawingLine) {
      ctx.strokeStyle = selectedMission !== 'free' ? '#10b981' : '#f59e0b';
      ctx.shadowColor = selectedMission !== 'free' ? '#10b981' : '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (selectedMission !== 'free') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(width - 110, 10, 100, 32);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.strokeRect(width - 110, 10, 100, 32);
      
      const score = totalSamplesWithPitch > 8 ? Math.round((matchCount / totalSamplesWithPitch) * 100) : 0;
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText("MATCH SCORE", width - 102, 22);
      
      ctx.fillStyle = score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`${score}%`, width - 102, 37);
      
      matchScoreRef.current = score;
    }
  };

  useEffect(() => {
    if (!isMicOn || !analyser) {
      if (pitchHistoryRef.current.length > 0) {
        pitchHistoryRef.current = [];
      }
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeDomainData = new Float32Array(bufferLength);

    const updateLoop = () => {
      if (!analyser) return;
      analyser.getByteFrequencyData(frequencyData);
      analyser.getFloatTimeDomainData(timeDomainData);

      // Decibels calculation to gate vocal output
      let sumSquares = 0.0;
      for (let i = 0; i < timeDomainData.length; i++) {
        sumSquares += timeDomainData[i] * timeDomainData[i];
      }
      const rms = Math.sqrt(sumSquares / timeDomainData.length);
      let db = 20 * Math.log10(rms || 0.00001) + 100;

      const pitch = detectPitchLocal(timeDomainData);
      const activePitch = (db > 42 && pitch > 80 && pitch < 650) ? pitch : -1;
      pitchHistoryRef.current.push(activePitch);
      if (pitchHistoryRef.current.length > 300) {
        pitchHistoryRef.current.shift();
      }

      drawSpectrogramFrame(frequencyData);
      drawPitchArenaFrame();

      animationFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animationFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMicOn, analyser, selectedMission]);

  return (
    <div id="spectrogram_pitch_lab" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Visualizers (Spectrogram & Pitch Canvas) */}
      <div className="lg:col-span-8 bg-white border border-slate-100 rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-6">
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Acoustic Map & Pitch
            </span>
            <button
              id="btn_spect_toggle_mic"
              onClick={toggleMicrophone}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm ${isMicOn ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
            >
              {isMicOn ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              {isMicOn ? 'Stop Lab' : 'Start Live Mic'}
            </button>
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Real-Time Pitch & Spectrogram</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Watch your speech formants (frequency layers) in the scrolling Spectrogram, and trace the pitch lines in the Pitch Arena. This teaches vocal inflections, singing tones, and question/statement patterns!
          </p>
        </div>

        {/* MISSION SELECTOR */}
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4.5 space-y-3">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Select a Pitch Mission:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => { setSelectedMission('free'); setClaimStatus({ type: null, message: '' }); playMeterSound('pop'); }}
              className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${selectedMission === 'free' ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200/60 text-slate-600 hover:bg-slate-100'}`}
            >
              🎨 Free Drawing
            </button>
            <button
              onClick={() => { setSelectedMission('steady'); setClaimStatus({ type: null, message: '' }); playMeterSound('pop'); }}
              className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${selectedMission === 'steady' ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200/60 text-slate-600 hover:bg-slate-100'}`}
            >
              📏 Steady "Ahhh" (220Hz)
            </button>
            <button
              onClick={() => { setSelectedMission('rising'); setClaimStatus({ type: null, message: '' }); playMeterSound('pop'); }}
              className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${selectedMission === 'rising' ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200/60 text-slate-600 hover:bg-slate-100'}`}
            >
              📈 Question Glide (180Hz ➔ 320Hz)
            </button>
            <button
              onClick={() => { setSelectedMission('wave'); setClaimStatus({ type: null, message: '' }); playMeterSound('pop'); }}
              className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${selectedMission === 'wave' ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200/60 text-slate-600 hover:bg-slate-100'}`}
            >
              〰️ Sing-Song Rollercoaster
            </button>
          </div>
        </div>

        {/* CANVAS DISPLAYS */}
        <div className="space-y-4">
          
          {/* 1. SPECTROGRAM PANEL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black uppercase text-slate-400">1. Spectrogram (Frequency Textures & Formants)</span>
              <span className="text-[9px] font-bold text-indigo-500 uppercase bg-indigo-50/70 px-2 py-0.5 rounded-md">80Hz - 5000Hz Waterfall</span>
            </div>
            <div className="relative">
              <canvas
                ref={spectrogramCanvasRef}
                width={640}
                height={150}
                className="w-full h-36 bg-[#090d16] rounded-2xl border border-slate-800 shadow-inner"
              />
              {!isMicOn && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center text-xs font-bold text-white pointer-events-none">
                  ⚠️ Turn on live mic to start scrolling
                </div>
              )}
            </div>
          </div>

          {/* 2. PITCH ARENA PANEL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black uppercase text-slate-400">2. Pitch Arena (Trace the Target!)</span>
              <span className="text-[9px] font-bold text-emerald-500 uppercase bg-emerald-50 px-2 py-0.5 rounded-md">100Hz - 400Hz Vocal Fold Rumble</span>
            </div>
            <div className="relative">
              <canvas
                ref={pitchCanvasRef}
                width={640}
                height={180}
                className="w-full h-44 bg-[#0f172a] rounded-2xl border border-slate-800 shadow-inner"
              />
              {!isMicOn && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center text-xs font-bold text-white pointer-events-none">
                  ⚠️ Turn on live mic to start drawing
                </div>
              )}
            </div>
          </div>

        </div>

        {/* CLAIM STATUS FEEDBACK HUD */}
        {claimStatus.type && (
          <div className={`p-4 rounded-3xl border flex items-center justify-between transition-all ${
            claimStatus.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{claimStatus.type === 'success' ? '🏆' : '💪'}</span>
              <p className="text-xs font-extrabold">{claimStatus.message}</p>
            </div>
            <button
              onClick={() => setClaimStatus({ type: null, message: '' })}
              className="text-[10px] font-black uppercase px-2.5 py-1 hover:bg-black/5 rounded-md"
            >
              Close
            </button>
          </div>
        )}

        {/* ACTION: AWARD STARS FOR SUCCESS */}
        {selectedMission !== 'free' && isMicOn && (
          <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-3xl">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl animate-spin">🌟</span>
              <div>
                <h5 className="text-xs font-black text-emerald-800">Mission Target Matcher</h5>
                <p className="text-[10px] text-emerald-600 leading-normal font-semibold">
                  Keep your pitch line centered in the faint violet channel to earn bonus stars!
                </p>
              </div>
            </div>
            <button
              id="btn_claim_stars"
              onClick={() => {
                if (matchScoreRef.current >= 65) {
                  playMeterSound('success');
                  
                  setStats(current => {
                    const updatedPoints = current.points + 50;
                    const newHistory = [
                      {
                        id: `pitch-${Date.now()}`,
                        timestamp: new Date().toLocaleString(),
                        type: 'Voice Onset' as const,
                        score: 50,
                        description: `Successfully completed Pitch Mission (${selectedMission}) with a score of ${matchScoreRef.current}%!`
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
                  setClaimStatus({
                    type: 'success',
                    message: `Fantastic job! You matched the target with a score of ${matchScoreRef.current}%! +50 Lab Stars awarded!`
                  });
                } else {
                  playMeterSound('warn');
                  setClaimStatus({
                    type: 'fail',
                    message: `Keep practicing! You scored ${matchScoreRef.current}%. Try to trace the line closer. (Need 65% to claim stars!)`
                  });
                }
              }}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-100 transition-all"
            >
              Claim Stars
            </button>
          </div>
        )}

      </div>

      {/* Right Column: Acoustics Information / Pediatric Guides */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-4">
          <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-500" /> What is a Spectrogram?
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            A spectrogram is a <strong>sound fingerprint</strong>. It visualizes:
          </p>
          <div className="space-y-3 text-[11px] text-slate-600">
            <div className="p-3 bg-slate-50 rounded-2xl">
              <strong>🔊 Height (Frequency):</strong> Low frequency rumbles (like deep vocals) sit near the bottom. High frequency whispers/clicks sit at the top.
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <strong>🎨 Brightness (Intensity):</strong> The brighter and warmer the color (pink, orange, yellow), the louder the sound energy at that specific frequency!
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <strong>📈 Formants:</strong> Look at the bands of energy when you say vowels like "Ah" vs "Ee". Those bright stripes are formants which make voices sound distinct!
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-4">
          <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" /> Pitch & Vocal Flexibility
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Sustaining and modulating pitch helps neurodiverse children learn:
          </p>
          <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-2 pl-1 font-medium font-semibold">
            <li>Natural question inflections (rising pitch)</li>
            <li>Emotional voice modulation (happy vs statements)</li>
            <li>Strengthening voice muscles by steady vowels holding (pitch targeting)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
