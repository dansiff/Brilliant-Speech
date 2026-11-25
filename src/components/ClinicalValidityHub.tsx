import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  Volume2, 
  Mic, 
  ShieldCheck, 
  FileText, 
  Download, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  BarChart3,
  Award,
  Sparkles,
  Layers
} from 'lucide-react';
import { 
  clinicalValidityService, 
  ClinicalValidityReport, 
  PhonemeValiditySummary 
} from '../services/clinicalValidityService';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  AreaChart, 
  Area,
  BarChart,
  Bar
} from 'recharts';

interface ClinicalValidityHubProps {
  childId: string;
  childName: string;
  onExportPdf?: () => void;
}

export const ClinicalValidityHub: React.FC<ClinicalValidityHubProps> = ({
  childId,
  childName,
  onExportPdf
}) => {
  const [report, setReport] = useState<ClinicalValidityReport | null>(null);
  const [selectedPhoneme, setSelectedPhoneme] = useState<PhonemeValiditySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMetricTab, setActiveMetricTab] = useState<'accuracy' | 'latency' | 'decibels' | 'pitch'>('accuracy');

  useEffect(() => {
    loadReport();
  }, [childId]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await clinicalValidityService.generateValidityReport(childId);
      setReport(data);
      if (data.phonemeSummaries.length > 0) {
        setSelectedPhoneme(data.phonemeSummaries[0]);
      }
    } catch (e) {
      console.error('Failed to load clinical validity report:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !report) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse">
        <Activity className="w-8 h-8 mx-auto text-indigo-500 animate-spin mb-3" />
        <p className="text-slate-600 font-medium">Synthesizing clinical acoustic evidence and trial validity...</p>
      </div>
    );
  }

  // Format trend data for recharts
  const trendData = selectedPhoneme?.accuracyTrend.map((acc, idx) => ({
    trial: `T${idx + 1}`,
    accuracy: acc,
    latency: selectedPhoneme.latencyTrend[idx] || selectedPhoneme.avgLatencyMs,
    decibels: selectedPhoneme.decibelTrend[idx] || selectedPhoneme.avgDecibels,
    pitch: selectedPhoneme.pitchTrend[idx] || selectedPhoneme.avgPitchHz
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header & Insurance Audit Certification */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Clinical Validity & Evidence Engine</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Insurance & IEP Audit Certified
                  </span>
                </div>
                <p className="text-sm text-slate-300">
                  Quantitative acoustic telemetry, trial counts, and motor speech consistency for <span className="font-semibold text-white">{childName}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onExportPdf}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium rounded-xl shadow-md transition-all text-sm"
            >
              <Download className="w-4 h-4" />
              Export Reimbursement Audit Pack
            </button>
          </div>

          {/* Core Metrics Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-xs text-indigo-200 font-medium mb-1 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-300" />
                Tracked Phoneme Targets
              </div>
              <div className="text-3xl font-extrabold text-white">
                {report.phonemeSummaries.length}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                {report.totalTrialsRecorded} validated acoustic trials
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-xs text-emerald-200 font-medium mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-300" />
                Overall Intelligibility Index
              </div>
              <div className="text-3xl font-extrabold text-emerald-400">
                {report.overallIntelligibilityIndex}%
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Acoustic DSP weighted mean
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-xs text-amber-200 font-medium mb-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-300" />
                Voice Onset Latency
              </div>
              <div className="text-3xl font-extrabold text-amber-400">
                {Math.round(report.phonemeSummaries.reduce((a, b) => a + b.avgLatencyMs, 0) / (report.phonemeSummaries.length || 1))}ms
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Motor planning reaction speed
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-xs text-sky-200 font-medium mb-1 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-sky-300" />
                Decibel Consistency
              </div>
              <div className="text-3xl font-extrabold text-sky-400">
                {Math.round(report.phonemeSummaries.reduce((a, b) => a + b.decibelConsistencyScore, 0) / (report.phonemeSummaries.length || 1))}%
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Subglottal pressure stability
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phoneme Deep-Dive & Clinical Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Phoneme Selection Cards */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Phoneme Target Profiles
            </h3>
            <span className="text-xs text-slate-500 font-medium">Select to analyze</span>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {report.phonemeSummaries.map((item) => {
              const isSelected = selectedPhoneme?.phoneme === item.phoneme;
              return (
                <button
                  key={item.phoneme}
                  onClick={() => setSelectedPhoneme(item)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-mono font-bold text-base flex items-center justify-center shadow-sm">
                        {item.phoneme}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          Sound Target {item.phoneme}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.totalTrials} trials recorded ({item.correctTrials} correct)
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      item.accuracyPercent >= 85 ? 'bg-emerald-100 text-emerald-800' :
                      item.accuracyPercent >= 60 ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {item.accuracyPercent}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400 block">Latency:</span>
                      <span className="font-semibold text-slate-800">{item.avgLatencyMs}ms</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">dB Stability:</span>
                      <span className="font-semibold text-slate-800">{item.decibelConsistencyScore}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Pitch (F₀):</span>
                      <span className="font-semibold text-slate-800">{item.avgPitchHz}Hz</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Interactive Clinical Telemetry Charts */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPhoneme && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      Acoustic & Motor Speech Trajectory: {selectedPhoneme.phoneme}
                    </h3>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {selectedPhoneme.reimbursementReadiness}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Chronological progression across {selectedPhoneme.totalTrials} continuous speech attempts
                  </p>
                </div>

                {/* Metric switcher tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveMetricTab('accuracy')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeMetricTab === 'accuracy'
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Accuracy (%)
                  </button>
                  <button
                    onClick={() => setActiveMetricTab('latency')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeMetricTab === 'latency'
                        ? 'bg-white text-amber-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Latency (ms)
                  </button>
                  <button
                    onClick={() => setActiveMetricTab('decibels')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeMetricTab === 'decibels'
                        ? 'bg-white text-sky-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Decibels (dB)
                  </button>
                  <button
                    onClick={() => setActiveMetricTab('pitch')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeMetricTab === 'pitch'
                        ? 'bg-white text-purple-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pitch F₀ (Hz)
                  </button>
                </div>
              </div>

              {/* Chart Display */}
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {activeMetricTab === 'accuracy' ? (
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="trial" stroke="#94a3b8" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
                      <Tooltip />
                      <Area type="monotone" dataKey="accuracy" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#accuracyGrad)" />
                    </AreaChart>
                  ) : activeMetricTab === 'latency' ? (
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="trial" stroke="#94a3b8" fontSize={11} />
                      <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={11} unit="ms" />
                      <Tooltip />
                      <Line type="monotone" dataKey="latency" stroke="#d97706" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  ) : activeMetricTab === 'decibels' ? (
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="trial" stroke="#94a3b8" fontSize={11} />
                      <YAxis domain={[40, 95]} stroke="#94a3b8" fontSize={11} unit="dB" />
                      <Tooltip />
                      <Line type="monotone" dataKey="decibels" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  ) : (
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="trial" stroke="#94a3b8" fontSize={11} />
                      <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={11} unit="Hz" />
                      <Tooltip />
                      <Line type="monotone" dataKey="pitch" stroke="#9333ea" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Clinical Telemetry Cards for the selected phoneme */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium mb-1">Trial Accuracy</div>
                  <div className="text-xl font-bold text-indigo-700">{selectedPhoneme.accuracyPercent}%</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{selectedPhoneme.clinicalStatus}</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium mb-1">Onset Latency Delta</div>
                  <div className="text-xl font-bold text-amber-700">
                    {selectedPhoneme.latencyImprovementMs > 0 ? `-${selectedPhoneme.latencyImprovementMs}ms` : `+${Math.abs(selectedPhoneme.latencyImprovementMs)}ms`}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Reaction speed acceleration</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium mb-1">Intensity Consistency</div>
                  <div className="text-xl font-bold text-sky-700">{selectedPhoneme.decibelConsistencyScore}%</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Mean: {selectedPhoneme.avgDecibels} dB SPL</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium mb-1">Pitch Stability</div>
                  <div className="text-xl font-bold text-purple-700">{selectedPhoneme.pitchStabilityScore}%</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Mean F₀: {selectedPhoneme.avgPitchHz} Hz</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insurance Coding & Reimbursement Justification Guide */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Insurance Reimbursement & School District Billing Codes
            </h3>
            <p className="text-xs text-slate-500">
              Correlated with AMA CPT standards and quantitative telemetry proof
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {report.insuranceReimbursementCodes.map((codeItem) => (
            <div
              key={codeItem.cptCode}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-mono font-bold text-xs">
                  {codeItem.cptCode}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Audit Verified
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 leading-snug">
                {codeItem.description}
              </div>
              <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                <span className="font-semibold text-slate-700">Supported Evidence:</span> {codeItem.supportedEvidence}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
