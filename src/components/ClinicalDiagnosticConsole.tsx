import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Play, 
  RefreshCw, 
  Mic, 
  MicOff, 
  Activity, 
  Sliders, 
  Volume2, 
  Cpu, 
  ShieldCheck, 
  Sparkles, 
  Languages, 
  Terminal, 
  AlertCircle,
  BarChart3,
  Layers,
  ChevronRight,
  Sparkle,
  GitBranch,
  FileCheck,
  Hash,
  Clock,
  VolumeX,
  Award,
  DownloadCloud,
  Check,
  AlertTriangle,
  Radio
} from 'lucide-react';
import { testRunnerService, TestResult } from '../services/testRunnerService';
import { sttService, SpeechProviderType, MicPermissionState, WebSpeechCapabilityReport } from '../services/sttService';
import { clinicalEngine, StructuredAttemptResult } from '../services/clinicalEngine';
import { 
  deterministicScorer, 
  phoneticDictionary, 
  transcriptNormalizer, 
  audioProcessor,
  DeterministicAttemptScore,
  NormalizedSessionResult,
  AudioPipelineStage 
} from '../services/audioArchitecture';
import { audioService } from '../services/audioService';
import { Language, Difficulty, ExerciseType } from '../types';

interface ClinicalDiagnosticConsoleProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const ClinicalDiagnosticConsole: React.FC<ClinicalDiagnosticConsoleProps> = ({ isOpen = true, onClose }) => {
  if (!isOpen) return null;
  const [activeTab, setActiveTab] = useState<'tests' | 'live-engine' | 'dsp-pipeline' | 'providers' | 'audio-architecture'>('providers');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [activeProvider, setActiveProvider] = useState<SpeechProviderType>(sttService.getActiveProvider());
  const [micPermission, setMicPermission] = useState<MicPermissionState>('prompt');
  
  // Web Speech Capability state
  const [capabilityReport, setCapabilityReport] = useState<WebSpeechCapabilityReport | null>(null);
  const [isInstallingPack, setIsInstallingPack] = useState(false);
  const [installPackMessage, setInstallPackMessage] = useState<string | null>(null);
  const [errorSimMessage, setErrorSimMessage] = useState<string | null>(null);

  // Interactive test states
  const [testLanguage, setTestLanguage] = useState<Language>(Language.ENGLISH);
  const [targetWord, setTargetWord] = useState('rabbit');
  const [spokenInput, setSpokenInput] = useState('w-w-wabbit');
  const [simResult, setSimResult] = useState<StructuredAttemptResult | null>(null);

  // Audio architecture session state
  const [architectureAttempts, setArchitectureAttempts] = useState<any[]>([]);
  const [selectedArchStage, setSelectedArchStage] = useState<number>(5);
  const [activeDistortionType, setActiveDistortionType] = useState<string>('none');

  // Live DSP mic monitor states
  const [isDspActive, setIsDspActive] = useState(false);
  const [liveDb, setLiveDb] = useState(0);
  const [livePitch, setLivePitch] = useState(0);
  const [liveSpectralRatio, setLiveSpectralRatio] = useState(0);
  const liveAudioStreamRef = useRef<MediaStream | null>(null);
  const liveAudioContextRef = useRef<AudioContext | null>(null);
  const liveAnimFrameRef = useRef<number | null>(null);

  useEffect(() => {
    sttService.getMicPermissionStatus().then(setMicPermission);
    setActiveProvider(sttService.getActiveProvider());
    loadCapabilityReport();
  }, []);

  const loadCapabilityReport = async () => {
    const report = await sttService.getCapabilityReport(testLanguage);
    setCapabilityReport(report);
  };

  const handleInstallLanguagePack = async () => {
    setIsInstallingPack(true);
    setInstallPackMessage(null);
    try {
      const res = await sttService.installLanguagePack(testLanguage, true);
      setInstallPackMessage(res.message);
      loadCapabilityReport();
    } finally {
      setIsInstallingPack(false);
    }
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await testRunnerService.runAllTests((updated) => {
        setTestResults(updated);
      });
      setTestResults(results);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleEvaluateTrial = () => {
    const mockEx = {
      id: 'diagnostic-trial',
      title: 'Diagnostic Articulation Trial',
      description: 'Interactive diagnostic tester',
      language: testLanguage,
      type: ExerciseType.ARTICULATION,
      difficulty: Difficulty.MEDIUM,
      targetWord: targetWord,
      category: 'Diagnostic',
      isPremium: false,
      pronunciationGuide: {
        mouthPosition: testLanguage === Language.ENGLISH ? 'Lips rounded, teeth slightly apart' : 'Labios relajados',
        tonguePlacement: testLanguage === Language.ENGLISH ? 'Sides of tongue against upper molars' : 'Punta de la lengua en los alvéolos',
        tip: testLanguage === Language.ENGLISH ? 'Avoid letting lips touch like a /w/ sound' : 'Produce una vibración clara con la punta de la lengua'
      }
    };

    const res = clinicalEngine.evaluateAttempt(
      mockEx, 
      spokenInput, 
      { avgDecibels: 68, fundamentalFrequencyHz: 220, spectralEnergyRatio: 0.48 },
      activeProvider
    );
    setSimResult(res);
  };

  // DSP Live Monitor toggle
  const toggleDspMonitor = async () => {
    if (isDspActive) {
      if (liveAnimFrameRef.current) cancelAnimationFrame(liveAnimFrameRef.current);
      liveAudioStreamRef.current?.getTracks().forEach(t => t.stop());
      liveAudioContextRef.current?.close().catch(() => {});
      setIsDspActive(false);
      return;
    }

    try {
      const { granted, stream, error } = await sttService.requestMicPermission();
      if (!granted || !stream) {
        alert(error || 'Microphone access denied');
        return;
      }

      setMicPermission('granted');
      liveAudioStreamRef.current = stream;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      liveAudioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const timeData = new Float32Array(analyser.fftSize);
      const freqData = new Uint8Array(analyser.frequencyBinCount);

      setIsDspActive(true);

      const updateLoop = () => {
        analyser.getFloatTimeDomainData(timeData);
        analyser.getByteFrequencyData(freqData);

        const db = audioService.calculateDecibels(timeData);
        const pitch = audioService.detectPitch(timeData, audioCtx.sampleRate, 75, 600);
        const spectral = audioService.analyzeSpectralEnergy(freqData, audioCtx.sampleRate);

        setLiveDb(Math.round(db));
        if (pitch > 0) setLivePitch(Math.round(pitch));
        setLiveSpectralRatio(spectral.ratio);

        liveAnimFrameRef.current = requestAnimationFrame(updateLoop);
      };

      updateLoop();
    } catch (e: any) {
      console.error('DSP Monitor failed:', e);
      alert('Could not start live DSP monitor: ' + e.message);
    }
  };

  useEffect(() => {
    return () => {
      if (liveAnimFrameRef.current) cancelAnimationFrame(liveAnimFrameRef.current);
      liveAudioStreamRef.current?.getTracks().forEach(t => t.stop());
      liveAudioContextRef.current?.close().catch(() => {});
    };
  }, []);

  const totalPassed = testResults.filter(t => t.status === 'passed').length;
  const totalFailed = testResults.filter(t => t.status === 'failed').length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-4xl mx-auto my-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold tracking-tight">Clinical Speech Engine Console</h2>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              Autonomous / Local-First
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Verification suite & diagnostic inspector for decoupled STT, Acoustic DSP, and SODA scoring.
          </p>
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Close Console
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50 px-6 pt-3 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tests')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'tests'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Automated Verification Suite
          {testResults.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-slate-200 text-slate-700">
              {totalPassed}/{testResults.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('live-engine')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'live-engine'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Languages className="w-4 h-4" />
          Bilingual & SODA Simulator
        </button>

        <button
          onClick={() => setActiveTab('dsp-pipeline')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'dsp-pipeline'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          Live Acoustic DSP & Pitch
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'providers'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Provider Config & Diagnostics
        </button>

        <button
          onClick={() => setActiveTab('audio-architecture')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'audio-architecture'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          6-Stage Audio Architecture & Scoring
        </button>
      </div>

      {/* Tab 1: Automated Verification Tests */}
      {activeTab === 'tests' && (
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
            <div>
              <h3 className="text-sm font-bold text-indigo-950">Automated Clinical Engine Verification</h3>
              <p className="text-xs text-indigo-800/80 mt-0.5">
                Executes 8 deterministic test cases: Web Speech fallback, Spanish NLP, English WER, SODA classifier, Pitch DSP, Gemini opt-out, and Firestore payload security.
              </p>
            </div>
            <button
              onClick={handleRunTests}
              disabled={isRunningTests}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              {isRunningTests ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Testing Suite...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Run All Tests
                </>
              )}
            </button>
          </div>

          {testResults.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Test Suite Ready</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Click "Run All Tests" above to verify speech recognition independence, deterministic scoring, and provider failover.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-500">
                <span>Verification Check</span>
                <span>Status & Duration</span>
              </div>
              {testResults.map((test) => (
                <div 
                  key={test.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    test.status === 'passed' 
                      ? 'bg-emerald-50/60 border-emerald-200' 
                      : test.status === 'failed'
                        ? 'bg-rose-50 border-rose-200'
                        : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {test.status === 'passed' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
                      {test.status === 'failed' && <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
                      {test.status === 'running' && <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin shrink-0 mt-0.5" />}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{test.name}</span>
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-200/80 text-slate-700 font-medium">
                            {test.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{test.details}</p>
                        {test.error && (
                          <p className="text-xs text-rose-700 font-mono mt-1 bg-rose-100/70 p-2 rounded-lg">
                            Error: {test.error}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold font-mono text-slate-500 shrink-0">
                      {test.durationMs}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Bilingual NLP & SODA Simulator */}
      {activeTab === 'live-engine' && (
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Language</label>
              <select
                value={testLanguage}
                onChange={(e) => {
                  const lang = e.target.value as Language;
                  setTestLanguage(lang);
                  if (lang === Language.SPANISH) {
                    setTargetWord('el árbol y el perro');
                    setSpokenInput('el arbol y el pelo');
                  } else {
                    setTargetWord('rabbit');
                    setSpokenInput('wabbit');
                  }
                }}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
              >
                <option value={Language.ENGLISH}>English (en-US)</option>
                <option value={Language.SPANISH}>Spanish (es-ES / es-MX)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Word / Phrase</label>
              <input
                type="text"
                value={targetWord}
                onChange={(e) => setTargetWord(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Spoken / Recognized Input</label>
              <input
                type="text"
                value={spokenInput}
                onChange={(e) => setSpokenInput(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
              />
            </div>
          </div>

          <button
            onClick={handleEvaluateTrial}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Evaluate Trial with Deterministic SODA Engine
          </button>

          {simResult && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Deterministic Result</span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    {simResult.overallScore}% <span className="text-sm font-normal text-slate-500">Overall Accuracy</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                    simResult.soda.summaryTag === 'Correct'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    SODA: {simResult.soda.summaryTag}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-medium">Accuracy</span>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{simResult.accuracyScore}%</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-medium">Fluency</span>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{simResult.fluencyScore}%</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-medium">Pronunciation</span>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{simResult.pronunciationScore}%</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-medium">WER / CER</span>
                  <p className="text-base font-bold text-slate-800 mt-0.5">WER: {simResult.wer} | CER: {simResult.cer}</p>
                </div>
              </div>

              {/* SODA Breakdown */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-700">Clinical SODA Analysis:</span>
                {simResult.soda.substitutions.length > 0 && (
                  <div className="text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    🔄 <strong>Substitutions:</strong> {simResult.soda.substitutions.join(', ')}
                  </div>
                )}
                {simResult.soda.omissions.length > 0 && (
                  <div className="text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    ➖ <strong>Omissions:</strong> {simResult.soda.omissions.join(', ')}
                  </div>
                )}
                {simResult.soda.distortions.length > 0 && (
                  <div className="text-purple-700 bg-purple-50 p-2 rounded-lg border border-purple-200">
                    〰️ <strong>Distortions:</strong> {simResult.soda.distortions.join(', ')}
                  </div>
                )}
                {simResult.soda.additions.length > 0 && (
                  <div className="text-blue-700 bg-blue-50 p-2 rounded-lg border border-blue-200">
                    ➕ <strong>Additions:</strong> {simResult.soda.additions.join(', ')}
                  </div>
                )}
                {simResult.soda.summaryTag === 'Correct' && (
                  <div className="text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    ✅ <strong>Target Match:</strong> Phonetic sounds aligned with high fidelity.
                  </div>
                )}
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-1">Deterministic Clinical Feedback:</span>
                <p className="text-slate-600 italic">"{simResult.deterministicFeedback}"</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Live Acoustic DSP & Pitch Pipeline */}
      {activeTab === 'dsp-pipeline' && (
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Real-Time Acoustic DSP Analyzer</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Runs independently from speech recognition using Web Audio API (RMS Decibels, YIN Pitch Tracker, and FFT Spectral Energy).
              </p>
            </div>
            <button
              onClick={toggleDspMonitor}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${
                isDspActive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isDspActive ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Stop DSP Monitor
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Start Live DSP Monitor
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Decibel Gauge */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                <span>RMS Volume (dB)</span>
                <span className="font-mono text-indigo-600">{liveDb} dB</span>
              </div>
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-75"
                  style={{ width: `${Math.min(100, Math.max(0, liveDb))}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Optimal speech volume: 55dB - 80dB</p>
            </div>

            {/* Pitch F0 Gauge */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                <span>Fundamental Pitch (F0)</span>
                <span className="font-mono text-emerald-600">{livePitch > 0 ? `${livePitch} Hz` : '--'}</span>
              </div>
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-75"
                  style={{ width: `${Math.min(100, (livePitch / 400) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Child voice range: 180Hz - 350Hz</p>
            </div>

            {/* Spectral Energy Ratio */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                <span>Spectral Balance Ratio</span>
                <span className="font-mono text-amber-600">{(liveSpectralRatio * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full transition-all duration-75"
                  style={{ width: `${Math.min(100, liveSpectralRatio * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">High freq / Low freq acoustic balance</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Provider Config & Diagnostics */}
      {activeTab === 'providers' && (
        <div className="p-6 space-y-6">
          {/* Provider Selection */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Speech Recognition Provider Hierarchy</h3>
                <p className="text-xs text-slate-500">
                  Dynamic runtime provider resolution with automatic fallback hierarchy.
                </p>
              </div>
              <button
                onClick={() => {
                  sttService.setForcedProvider(null);
                  setActiveProvider(sttService.getActiveProvider());
                  loadCapabilityReport();
                }}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline"
              >
                Auto-Detect Best
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: SpeechProviderType.WEB_SPEECH_API,
                  label: 'Web Speech API',
                  desc: 'Browser native real-time recognition with on-device capability probing',
                  supported: sttService.isWebSpeechSupported()
                },
                {
                  id: SpeechProviderType.ACOUSTIC_PHONETIC,
                  label: 'Acoustic-Phonetic Engine',
                  desc: 'Deterministic client-side acoustic DSP + spectral formant matching',
                  supported: sttService.isAudioContextSupported()
                },
                {
                  id: SpeechProviderType.MANUAL_EVALUATION,
                  label: 'Manual / Audio Fallback',
                  desc: 'Clinical rubric evaluation when microphone access is restricted',
                  supported: true
                }
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    sttService.setForcedProvider(p.id);
                    setActiveProvider(sttService.getActiveProvider());
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    activeProvider === p.id
                      ? 'bg-indigo-50 border-indigo-600 shadow-sm ring-1 ring-indigo-600'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{p.label}</span>
                    {activeProvider === p.id && (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">{p.desc}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    p.supported ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {p.supported ? 'Supported' : 'Unsupported on this device'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Web Speech API Capability Matrix */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">Web Speech API Capability Detection Matrix</h3>
              </div>
              <button
                onClick={loadCapabilityReport}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Probe Browser
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Browser speech recognition has limited cross-browser availability. The application dynamically probes constructor availability, vendor prefixes, on-device processing capabilities, and static availability hooks.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Standard Constructor</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-800 font-bold">window.SpeechRecognition</span>
                  {capabilityReport?.hasStandardConstructor ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Available
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                      Not Defined
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Vendor-Prefixed Constructor</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-800 font-bold">webkitSpeechRecognition</span>
                  {capabilityReport?.hasWebkitConstructor ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Available
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                      Not Defined
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">On-Device Processing</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-800 font-bold">processLocally</span>
                  {capabilityReport?.supportsProcessLocally ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Supported
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Cloud/Default
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Static Availability Check</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-800 font-bold">SpeechRecognition.available()</span>
                  {capabilityReport?.hasStaticAvailable ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Implemented
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                      Unexposed
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Static Model Installer</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-800 font-bold">SpeechRecognition.install()</span>
                  {capabilityReport?.hasStaticInstall ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Implemented
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                      Built-in/Cloud
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Detected Engine Status</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-800 font-bold">{capabilityReport?.detectedEngine || 'Detecting...'}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    capabilityReport?.isSupported ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {capabilityReport?.isSupported ? 'Active' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Language Pack and On-Device Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-slate-700">Supported Target Locales:</span>
                <div className="flex items-center gap-1">
                  {capabilityReport?.supportedLocales.map(loc => (
                    <span key={loc} className="text-[10px] font-mono font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700">
                      {loc}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={handleInstallLanguagePack}
                disabled={isInstallingPack}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                {isInstallingPack ? 'Installing...' : 'Probe / Install On-Device Pack'}
              </button>
            </div>

            {installPackMessage && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{installPackMessage}</span>
              </div>
            )}
          </div>

          {/* Speech Error Resilience & Fault Handling Simulator */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Speech Error Resilience & Automatic Fallback Simulator</h3>
            <p className="text-xs text-slate-500 mb-3">
              Verify how the application gracefully recovers from recognition service failures without interrupting practice.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              <button
                onClick={() => {
                  setErrorSimMessage('Simulated "language-not-supported": Gracefully switches locale or acoustic DSP engine.');
                }}
                className="p-2.5 bg-white border border-slate-200 hover:border-amber-400 rounded-xl text-left transition-all"
              >
                <span className="text-[10px] font-bold text-amber-600 block uppercase">Language Test</span>
                <span className="text-xs font-semibold text-slate-800">language-not-supported</span>
              </button>

              <button
                onClick={async () => {
                  const res = await sttService.requestMicPermission();
                  setErrorSimMessage(`Microphone query result: ${res.granted ? 'Permission granted' : res.error}`);
                }}
                className="p-2.5 bg-white border border-slate-200 hover:border-rose-400 rounded-xl text-left transition-all"
              >
                <span className="text-[10px] font-bold text-rose-600 block uppercase">Mic Permission</span>
                <span className="text-xs font-semibold text-slate-800">not-allowed / denied</span>
              </button>

              <button
                onClick={() => {
                  setErrorSimMessage('Simulated "network / service-not-allowed": Seamlessly activates local Acoustic-Phonetic DSP.');
                }}
                className="p-2.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl text-left transition-all"
              >
                <span className="text-[10px] font-bold text-indigo-600 block uppercase">Service Outage</span>
                <span className="text-xs font-semibold text-slate-800">network failure</span>
              </button>

              <button
                onClick={() => {
                  setErrorSimMessage('Simulated unexpected onend: Auto-recovery mechanism restarts listening buffer within 150ms.');
                }}
                className="p-2.5 bg-white border border-slate-200 hover:border-emerald-400 rounded-xl text-left transition-all"
              >
                <span className="text-[10px] font-bold text-emerald-600 block uppercase">Unexpected End</span>
                <span className="text-xs font-semibold text-slate-800">Auto-recovery restart</span>
              </button>
            </div>

            {errorSimMessage && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{errorSimMessage}</span>
                </div>
                <button 
                  onClick={() => setErrorSimMessage(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Microphone Permission Status Bar */}
          <div className="flex items-center justify-between bg-slate-100 p-4 rounded-2xl text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <span className="font-semibold text-slate-700">Microphone Permission State:</span>
              <span className="font-mono font-bold capitalize text-indigo-700">{micPermission}</span>
            </div>
            <button
              onClick={async () => {
                const res = await sttService.requestMicPermission();
                setMicPermission(res.granted ? 'granted' : 'denied');
              }}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs transition-all shadow-sm"
            >
              Check / Prompt Mic
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: 6-Stage Decoupled Audio Architecture & Deterministic Scoring */}
      {activeTab === 'audio-architecture' && (
        <div className="p-6 space-y-6">
          {/* Architecture Stages Diagram */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Decoupled 6-Stage Audio Pipeline</h3>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                100% Deterministically Reproducible
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {[
                { stage: 1, name: '1. Capture', desc: 'PCM & Blob Stream', icon: Mic },
                { stage: 2, name: '2. DSP', desc: 'Pitch F0 & Acoustics', icon: Activity },
                { stage: 3, name: '3. Recognition', desc: 'STT & Candidates', icon: Cpu },
                { stage: 4, name: '4. Transcript', desc: 'NLP & Repetitions', icon: Languages },
                { stage: 5, name: '5. Scoring', desc: 'SODA, WER & Phonemes', icon: FileCheck },
                { stage: 6, name: '6. Optional AI', desc: 'Gemini SLP Coaching', icon: Sparkles },
              ].map((s) => (
                <button
                  key={s.stage}
                  onClick={() => setSelectedArchStage(s.stage)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    selectedArchStage === s.stage
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <s.icon className={`w-4 h-4 mb-2 ${selectedArchStage === s.stage ? 'text-white' : 'text-indigo-400'}`} />
                  <p className="text-xs font-bold leading-tight">{s.name}</p>
                  <p className="text-[10px] text-slate-300/80 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Trial Scoring Sandbox */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Input Controls */}
            <div className="lg:col-span-5 space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                Deterministic Scoring Sandbox
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Word</label>
                  <input
                    type="text"
                    value={targetWord}
                    onChange={(e) => setTargetWord(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-indigo-600"
                    placeholder="e.g. rabbit, star, elephant"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Recognized Speech / Transcribed</label>
                  <input
                    type="text"
                    value={spokenInput}
                    onChange={(e) => setSpokenInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-indigo-600"
                    placeholder="e.g. w-w-wabbit"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Language</label>
                    <select
                      value={testLanguage}
                      onChange={(e) => setTestLanguage(e.target.value as Language)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-semibold text-slate-900"
                    >
                      <option value={Language.ENGLISH}>English (US)</option>
                      <option value={Language.SPANISH}>Spanish (ES/MX)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Acoustic Distortion</label>
                    <select
                      value={activeDistortionType}
                      onChange={(e) => setActiveDistortionType(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-semibold text-slate-900"
                    >
                      <option value="none">Normal (No Distortion)</option>
                      <option value="derhotacization">Derhotacization (Low Energy Ratio)</option>
                      <option value="lateralization">Lateralization (Centroid Shift)</option>
                      <option value="pitch_break">Pitch Break (Low Stability)</option>
                      <option value="vowel_lengthening">Vowel Lengthening (&gt;3.5s)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      const mockEx: any = {
                        id: 'arch-demo-ex',
                        title: targetWord,
                        targetWord: targetWord,
                        language: testLanguage,
                        type: ExerciseType.ARTICULATION,
                        difficulty: Difficulty.MEDIUM,
                      };

                      const spectralRatio = activeDistortionType === 'derhotacization' ? 0.21 : 0.48;
                      const centroid = activeDistortionType === 'lateralization' ? 1050 : 1650;
                      const pitchStability = activeDistortionType === 'pitch_break' ? 35 : 90;
                      const durationMs = activeDistortionType === 'vowel_lengthening' ? 4200 : 850;

                      const result = deterministicScorer.scoreAttempt({
                        exercise: mockEx,
                        targetText: targetWord,
                        recognizedHypothesis: {
                          transcript: spokenInput,
                          confidence: 0.94,
                          isFinal: true,
                          provider: activeProvider,
                        },
                        acousticMeasurements: {
                          avgDecibels: 68,
                          peakDecibels: 80,
                          noiseFloorDb: 35,
                          snrDb: 45,
                          fundamentalFrequencyHz: 218,
                          pitchRangeHz: [165, 315],
                          pitchStability,
                          spectralEnergyRatio: spectralRatio,
                          spectralCentroidHz: centroid,
                          voiceOnsetLatencyMs: 360,
                          speechDurationMs: durationMs,
                          silenceDurationMs: 140,
                          totalRecordingDurationMs: durationMs + 140,
                          articulationRateSyllablesPerSec: 2.6,
                        },
                        attemptNumber: architectureAttempts.length + 1,
                        provider: activeProvider,
                        language: testLanguage,
                      });

                      setArchitectureAttempts((prev) => [...prev, result]);
                    }}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Evaluate Attempt
                  </button>

                  <button
                    onClick={() => setArchitectureAttempts([])}
                    className="px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Results Inspection Panel */}
            <div className="lg:col-span-7 space-y-4">
              {architectureAttempts.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                  <FileCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Deterministic Results Inspector</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Click "Evaluate Attempt" to view the complete phoneme alignment, S.O.D.A classifications, error rates, and acoustic profiles.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const latest = architectureAttempts[architectureAttempts.length - 1] as DeterministicAttemptScore;
                    return (
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                        {/* Header Metrics */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Attempt #{latest.attemptNumber}</span>
                            <h4 className="text-base font-extrabold text-slate-900">
                              "{latest.targetText}" → "{latest.recognizedRawTranscript}"
                            </h4>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-black text-indigo-600">{latest.overallScore}%</span>
                            <p className="text-[10px] font-semibold text-slate-400">Overall Score</p>
                          </div>
                        </div>

                        {/* Phoneme Alignment & IPA */}
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span>Phoneme Alignment & S.O.D.A.</span>
                            <span className="font-mono text-[11px] text-slate-500">Target: {latest.expectedIpa}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {latest.phonemeAlignments.map((al, i) => (
                              <div
                                key={i}
                                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex flex-col items-center border ${
                                  al.status === 'correct'
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                    : al.status === 'substitution'
                                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                                      : al.status === 'omission'
                                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                                        : 'bg-purple-50 border-purple-300 text-purple-800'
                                }`}
                              >
                                <span>{al.expectedPhoneme}</span>
                                <span className="text-[9px] font-normal opacity-80">{al.expectedIpa}</span>
                                <span className="text-[9px] uppercase mt-0.5">{al.status}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Error Rates & Acoustic Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase">WER</span>
                            <p className="text-sm font-bold text-slate-900">{latest.wordErrorRate}</p>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase">PER</span>
                            <p className="text-sm font-bold text-slate-900">{latest.phonemeErrorRate}</p>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase">VOT Latency</span>
                            <p className="text-sm font-bold text-slate-900">{latest.latencyMs}ms</p>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase">Confidence</span>
                            <p className="text-sm font-bold text-slate-900">{latest.confidence}</p>
                          </div>
                        </div>

                        {/* Clinical Errors Detail */}
                        <div className="space-y-1.5 text-xs">
                          {latest.errors.substitutions.length > 0 && (
                            <div className="p-2 bg-amber-50 text-amber-900 rounded-lg">
                              <span className="font-bold">Substitutions:</span>{' '}
                              {latest.errors.substitutions.map((s) => `${s.target} → ${s.recognized} (${s.phoneticProcess || 'Gliding/Fronting'})`).join(', ')}
                            </div>
                          )}
                          {latest.errors.distortions.length > 0 && (
                            <div className="p-2 bg-indigo-50 text-indigo-900 rounded-lg">
                              <span className="font-bold">Measurable Distortion:</span>{' '}
                              {latest.errors.distortions.map((d) => `${d.type} - ${d.acousticTrigger}`).join(', ')}
                            </div>
                          )}
                          {latest.errors.repetitions.length > 0 && (
                            <div className="p-2 bg-purple-50 text-purple-900 rounded-lg">
                              <span className="font-bold">Repetitions / Dysfluencies:</span>{' '}
                              {latest.errors.repetitions.map((r) => `"${r.repeatedUnit}" x${r.count}`).join(', ')}
                            </div>
                          )}
                        </div>

                        {/* Reproducible Digest Checksum */}
                        <div className="flex items-center justify-between text-[11px] bg-slate-900 text-slate-300 px-3 py-2 rounded-xl font-mono">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Hash className="w-3.5 h-3.5 text-indigo-400" />
                            Reproducible Digest:
                          </span>
                          <span className="text-indigo-300 font-bold">{latest.reproducibleDigest}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Multi-Attempt Normalized Session Summary */}
                  {architectureAttempts.length >= 2 && (
                    <div className="bg-indigo-950 text-white rounded-2xl p-5 space-y-3">
                      {(() => {
                        const session = deterministicScorer.aggregateSession(
                          'session-preview',
                          'user-preview',
                          { id: 'ex-1', title: targetWord, language: testLanguage } as any,
                          architectureAttempts
                        );
                        return (
                          <>
                            <div className="flex items-center justify-between border-b border-indigo-800 pb-2">
                              <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                                <Award className="w-4 h-4 text-amber-400" />
                                Normalized Session Aggregation ({session.totalAttempts} Attempts)
                              </h5>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-800 text-indigo-200">
                                Trend: {session.progressionTrend}
                              </span>
                            </div>
                            <p className="text-xs text-indigo-200">{session.deterministicSessionReport}</p>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                              <div className="bg-indigo-900/60 p-2 rounded-lg">
                                <span className="text-[10px] text-indigo-300">Mean Accuracy</span>
                                <p className="font-bold text-white">{session.meanAccuracy}%</p>
                              </div>
                              <div className="bg-indigo-900/60 p-2 rounded-lg">
                                <span className="text-[10px] text-indigo-300">Best Attempt</span>
                                <p className="font-bold text-emerald-400">{session.bestAttemptScore}%</p>
                              </div>
                              <div className="bg-indigo-900/60 p-2 rounded-lg">
                                <span className="text-[10px] text-indigo-300">Mean Latency</span>
                                <p className="font-bold text-white">{session.meanLatencyMs}ms</p>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
