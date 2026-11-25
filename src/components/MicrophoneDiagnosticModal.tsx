import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  Play, 
  Square, 
  HelpCircle, 
  ShieldCheck, 
  Settings2,
  Sliders,
  Sparkles
} from 'lucide-react';
import { sfx } from '../utils/soundEffects';
import { toast } from 'sonner';

interface MicrophoneDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMicReady?: () => void;
}

export const MicrophoneDiagnosticModal: React.FC<MicrophoneDiagnosticModalProps> = ({
  isOpen,
  onClose,
  onMicReady
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1); // 1: Test VU meter, 2: 3-sec Loopback, 3: Browser Help
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');

  // Loopback state
  const [isRecordingLoopback, setIsRecordingLoopback] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingLoopback, setIsPlayingLoopback] = useState<boolean>(false);

  // Audio Context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isOpen) {
      checkPermissionAndEnumerate();
    } else {
      stopAudioCapture();
    }
    return () => {
      stopAudioCapture();
    };
  }, [isOpen]);

  const checkPermissionAndEnumerate = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const res = await navigator.permissions.query({ name: 'microphone' as any });
          setPermissionState(res.state as any);
        } catch (e) {}
      }

      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter((d) => d.kind === 'audioinput');
        setAvailableDevices(audioInputs);
        if (audioInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(audioInputs[0].deviceId);
        }
      }
    } catch (e) {}
  };

  const startAudioCapture = async (deviceId?: string) => {
    stopAudioCapture();
    sfx.playTap();

    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: deviceId || selectedDeviceId ? { exact: deviceId || selectedDeviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setPermissionState('granted');
      setIsCapturing(true);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
      toast.success('Microphone sensor active! Speak to test volume levels.');
    } catch (err: any) {
      setPermissionState('denied');
      setIsCapturing(false);
      sfx.playRetry();
      toast.error('Could not access microphone. Please review browser permissions.');
    }
  };

  const stopAudioCapture = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
    setIsCapturing(false);
    setMicLevel(0);
  };

  // Loopback recorder
  const startLoopbackRecord = async () => {
    sfx.playTap();
    if (!streamRef.current) {
      await startAudioCapture();
    }
    if (!streamRef.current) return;

    try {
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
        setIsRecordingLoopback(false);
        sfx.playSuccess();
        toast.success('3-Second Loopback Captured! Press Play to listen.');
      };

      mediaRecorder.start();
      setIsRecordingLoopback(true);

      // Auto stop after 3 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 3000);
    } catch (e) {
      toast.error('Loopback recorder failed.');
    }
  };

  const playRecordedLoopback = () => {
    if (!recordedAudioUrl) return;
    sfx.playTap();
    const audio = new Audio(recordedAudioUrl);
    setIsPlayingLoopback(true);
    audio.onended = () => setIsPlayingLoopback(false);
    audio.play();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Microphone & Audio Diagnostic</h2>
              <p className="text-xs text-slate-500">Hardware verification, volume sensitivity & permission recovery</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Navigation Bar */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              sfx.playTap();
              setCurrentStep(1);
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs transition-all ${
              currentStep === 1
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            1. Live VU Meter
          </button>
          <button
            onClick={() => {
              sfx.playTap();
              setCurrentStep(2);
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs transition-all ${
              currentStep === 2
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            2. Audio Loopback
          </button>
          <button
            onClick={() => {
              sfx.playTap();
              setCurrentStep(3);
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs transition-all ${
              currentStep === 3
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            3. Permission Guide
          </button>
        </div>

        {/* STEP 1: LIVE VU METER */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Device Selector */}
            {availableDevices.length > 1 && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Select Audio Input Device:</label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => {
                    setSelectedDeviceId(e.target.value);
                    startAudioCapture(e.target.value);
                  }}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  {availableDevices.map((dev) => (
                    <option key={dev.deviceId} value={dev.deviceId}>
                      {dev.label || `Microphone ${dev.deviceId.slice(0, 5)}...`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Live Visualizer Card */}
            <div className="p-8 rounded-3xl bg-slate-900 text-white text-center space-y-4 shadow-inner">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest block">
                Live Acoustic Input Level
              </span>

              {/* Dynamic VU Meter Bar */}
              <div className="space-y-2 max-w-md mx-auto">
                <div className="h-6 bg-slate-800 rounded-full overflow-hidden p-1 flex items-center">
                  <motion.div
                    className={`h-full rounded-full transition-all duration-75 ${
                      micLevel > 70
                        ? 'bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500'
                        : micLevel > 25
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                        : 'bg-slate-700'
                    }`}
                    style={{ width: `${Math.max(4, micLevel)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Silent (0%)</span>
                  <span>Optimal Speech (30-75%)</span>
                  <span>Peak (100%)</span>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-300">
                {isCapturing ? (
                  micLevel > 20 ? (
                    <span className="text-emerald-400 inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Strong voice signal detected!
                    </span>
                  ) : (
                    <span className="text-amber-400">Speak into your microphone to test volume...</span>
                  )
                ) : (
                  <span className="text-slate-400">Click below to activate sensor</span>
                )}
              </div>
            </div>

            {/* Activation Button */}
            {!isCapturing ? (
              <button
                onClick={() => startAudioCapture()}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all"
              >
                <Mic className="w-5 h-5" />
                Activate Microphone & Test Input
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={stopAudioCapture}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Stop Test
                </button>
                <button
                  onClick={() => {
                    sfx.playSuccess();
                    if (onMicReady) onMicReady();
                    onClose();
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                >
                  Microphone Verified & Ready!
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: LOOPBACK RECORDER */}
        {currentStep === 2 && (
          <div className="space-y-6 text-center">
            <div className="p-6 rounded-3xl bg-indigo-50/70 border border-indigo-200 space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-700">
                3-Second Instant Loopback
              </span>
              <h3 className="text-xl font-black text-slate-900">Hear Your Own Audio Quality</h3>
              <p className="text-xs text-slate-600">
                Record 3 seconds of speech, then listen back to check for background noise, distortion, or clipping.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!isRecordingLoopback ? (
                <button
                  onClick={startLoopbackRecord}
                  className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-lg flex items-center gap-2"
                >
                  <Mic className="w-5 h-5" />
                  Record 3-Sec Test Sample
                </button>
              ) : (
                <button
                  disabled
                  className="px-8 py-4 rounded-2xl bg-rose-600 text-white font-black text-sm shadow-lg animate-pulse flex items-center gap-2"
                >
                  <Square className="w-5 h-5 fill-current" />
                  Recording 3-Sec Sample...
                </button>
              )}

              {recordedAudioUrl && (
                <button
                  onClick={playRecordedLoopback}
                  disabled={isPlayingLoopback}
                  className="px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg flex items-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" />
                  {isPlayingLoopback ? 'Playing Sample...' : 'Play Back Recording'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: BROWSER PERMISSION GUIDES */}
        {currentStep === 3 && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-900 block mb-1">
                  How to unlock microphone permissions:
                </strong>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  <li><strong>Google Chrome & Microsoft Edge:</strong> Click the padlock icon 🔒 in the URL address bar, then toggle <em>Microphone</em> to <strong>Allow</strong> and refresh.</li>
                  <li><strong>Apple Safari (macOS):</strong> Click <em>Safari &gt; Settings &gt; Websites &gt; Microphone</em> and select <strong>Allow</strong> for this site.</li>
                  <li><strong>iOS Safari (iPhone/iPad):</strong> Open iOS <em>Settings &gt; Safari &gt; Microphone</em> and set to <strong>Allow</strong>.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
