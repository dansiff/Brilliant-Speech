import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Mic, 
  Cpu, 
  Sparkles, 
  Sliders, 
  FileCheck, 
  Layers, 
  Volume2,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

interface SpeechPipelineFeedbackProps {
  isRecording: boolean;
  isAnalyzing: boolean;
  activeProvider: string;
  liveTranscript?: string;
  onOpenDiagnostics?: () => void;
  liveAudioLevel?: number; // 0 to 100
  targetText?: string;
  className?: string;
}

export const SpeechPipelineFeedback: React.FC<SpeechPipelineFeedbackProps> = ({
  isRecording,
  isAnalyzing,
  activeProvider,
  liveTranscript,
  onOpenDiagnostics,
  liveAudioLevel = 0,
  targetText,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const [analysisStep, setAnalysisStep] = useState<number>(0);

  // Analysis step progression cycle while isAnalyzing is true
  useEffect(() => {
    if (!isAnalyzing) {
      setAnalysisStep(0);
      return;
    }
    const stepsInterval = setInterval(() => {
      setAnalysisStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 450);
    return () => clearInterval(stepsInterval);
  }, [isAnalyzing]);

  // Oscillating waveform canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Advance phase for fluid continuous motion
      const speed = isRecording ? 0.08 : isAnalyzing ? 0.05 : 0.02;
      phaseRef.current += speed;
      const phase = phaseRef.current;

      const centerY = height / 2;

      if (isRecording) {
        // Active Listening Oscillating Multi-Harmonic Waveform
        const normalizedLevel = Math.max(0.15, Math.min(1, (liveAudioLevel > 0 ? liveAudioLevel : 35) / 75));
        const baseAmplitude = (height * 0.32) * normalizedLevel;

        // Background glow wave
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)'; // Red glow
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const envelope = Math.sin(u * Math.PI); // tapering at ends
          const y = centerY + Math.sin(x * 0.045 + phase * 1.5) * (baseAmplitude * 1.25) * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Primary harmonic wave
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)'; // Rose accent
        ctx.lineWidth = 2.5;
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const envelope = Math.sin(u * Math.PI);
          const y = centerY + 
            (Math.sin(x * 0.05 + phase * 2.2) * 0.7 + Math.sin(x * 0.09 - phase * 1.8) * 0.3) * 
            baseAmplitude * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Secondary cyan/emerald acoustic resonance wave
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.75)'; // Emerald resonance
        ctx.lineWidth = 2;
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const envelope = Math.sin(u * Math.PI);
          const y = centerY + 
            Math.cos(x * 0.06 - phase * 2.8) * (baseAmplitude * 0.6) * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

      } else if (isAnalyzing) {
        // Analyzing / DSP Scanning Shimmer Wave
        const baseAmplitude = height * 0.22;

        // Indigo / Violet spectral sweep wave
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.lineWidth = 5;
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const envelope = Math.sin(u * Math.PI);
          const y = centerY + Math.sin(x * 0.06 + phase * 3) * baseAmplitude * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(129, 140, 248, 0.9)';
        ctx.lineWidth = 2.5;
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const envelope = Math.sin(u * Math.PI);
          const y = centerY + 
            (Math.sin(x * 0.08 + phase * 2.5) * 0.6 + Math.cos(x * 0.12 + phase * 3.5) * 0.4) * 
            baseAmplitude * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Moving scan pulse particle
        const scanX = ((phase * 40) % (width + 40)) - 20;
        if (scanX >= 0 && scanX <= width) {
          const gradient = ctx.createRadialGradient(scanX, centerY, 0, scanX, centerY, 24);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
          gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.4)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(scanX, centerY, 24, 0, Math.PI * 2);
          ctx.fill();
        }

      } else {
        // Idle Quiescent Breathing Wave
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = 1.75;
        for (let x = 0; x < width; x++) {
          const u = x / width;
          const envelope = Math.sin(u * Math.PI);
          const y = centerY + Math.sin(x * 0.035 + phase) * 4.5 * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, isAnalyzing, liveAudioLevel]);

  // Stage steps label for analyzing state
  const analysisSteps = [
    { label: 'Acoustic DSP & F0 Extraction', icon: Activity },
    { label: 'Phonetic Alignment & SODA', icon: FileCheck },
    { label: 'Scoring & Error Synthesis', icon: Cpu },
    { label: 'SLP Pedagogical Insights', icon: Sparkles },
  ];

  return (
    <div className={`w-full max-w-md mx-auto space-y-3 ${className}`}>
      {/* Main Pipeline Card */}
      <div 
        className={`relative overflow-hidden rounded-2xl border transition-all duration-300 backdrop-blur-md ${
          isRecording
            ? 'bg-red-50/90 border-red-200/80 shadow-md shadow-red-500/10'
            : isAnalyzing
              ? 'bg-indigo-50/90 border-indigo-200/80 shadow-md shadow-indigo-500/10'
              : 'bg-white/95 border-slate-200/80 shadow-sm'
        }`}
      >
        {/* Header: Status Bar & Engine Pill */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100/80">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isRecording ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </>
              ) : isAnalyzing ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              )}
            </span>
            <span className="text-xs font-bold text-slate-700">
              {isRecording 
                ? 'Speech Pipeline Active' 
                : isAnalyzing 
                  ? 'Processing Audio DSP' 
                  : 'Speech Pipeline Ready'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-full border border-slate-200/60">
              {activeProvider}
            </span>
            {onOpenDiagnostics && (
              <button
                type="button"
                onClick={onOpenDiagnostics}
                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Open Clinical Diagnostics Console"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Live Oscillating Waveform Visualization Canvas */}
        <div className="relative px-3.5 py-2 flex flex-col items-center justify-center">
          <div className="w-full h-12 relative flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={340}
              height={48}
              className="w-full h-full block"
            />
            {/* Live Audio Level indicator chip when recording */}
            {isRecording && (
              <div className="absolute right-2 top-1 flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-md border border-red-200 text-[10px] font-mono font-bold text-red-600 shadow-xs">
                <Volume2 className="w-2.5 h-2.5 animate-pulse" />
                <span>{Math.max(30, liveAudioLevel || 45)} dB</span>
              </div>
            )}
          </div>

          {/* Dynamic Status / Sub-state Message */}
          <div className="w-full flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
            {isRecording ? (
              <span className="flex items-center gap-1.5 text-red-600 font-semibold animate-pulse">
                <Mic className="w-3 h-3" />
                Listening for target phonemes...
              </span>
            ) : isAnalyzing ? (
              <span className="flex items-center gap-1.5 text-indigo-600 font-semibold">
                <Activity className="w-3 h-3 animate-spin" />
                {analysisSteps[analysisStep]?.label || 'Deterministic DSP Evaluation...'}
              </span>
            ) : (
              <span className="text-slate-400">
                Acoustic DSP • 6-Stage Deterministic Alignment
              </span>
            )}

            {/* Stages Dots indicator */}
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((stageIdx) => {
                let dotClass = 'bg-slate-200';
                if (isRecording) {
                  dotClass = stageIdx <= 1 ? 'bg-red-500 animate-pulse' : 'bg-slate-200';
                } else if (isAnalyzing) {
                  dotClass = stageIdx <= (analysisStep + 1) ? 'bg-indigo-600' : 'bg-slate-200';
                }
                return (
                  <span
                    key={stageIdx}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${dotClass}`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Real-time live transcript bubble (when present) */}
        <AnimatePresence>
          {isRecording && liveTranscript && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-3.5 py-2 bg-white border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-800"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">
                Detected: <span className="font-bold text-slate-900">&ldquo;{liveTranscript}&rdquo;</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
