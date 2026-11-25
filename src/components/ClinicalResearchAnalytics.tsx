import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Download, 
  ShieldCheck, 
  FileText, 
  Sparkles, 
  Lock, 
  Unlock, 
  TrendingUp, 
  Layers, 
  Activity, 
  Filter, 
  CheckCircle2,
  RefreshCw,
  Database
} from 'lucide-react';
import { toast } from 'sonner';

interface PhonemeErrorStat {
  phoneme: string;
  category: 'Fronting' | 'Stopping' | 'Gliding' | 'Cluster Reduction' | 'De-voicing';
  substitution: string;
  frequency: number;
  severity: 'Mild' | 'Moderate' | 'Severe';
}

interface DoseCohort {
  cohortId: string;
  ageRange: string;
  meanWeeklyDoseMins: number;
  meanAccuracyGainPct: number;
  nSubjects: number;
  effectSizeD: number;
}

const PHONEME_ERROR_PATTERNS: PhonemeErrorStat[] = [
  { phoneme: '/k/', category: 'Fronting', substitution: '/t/ (Velar Fronting)', frequency: 68, severity: 'Severe' },
  { phoneme: '/g/', category: 'Fronting', substitution: '/d/ (Velar Fronting)', frequency: 54, severity: 'Moderate' },
  { phoneme: '/s/', category: 'Stopping', substitution: '/t/ (Fricative Stopping)', frequency: 42, severity: 'Moderate' },
  { phoneme: '/r/', category: 'Gliding', substitution: '/w/ (Liquid Gliding)', frequency: 76, severity: 'Severe' },
  { phoneme: '/l/', category: 'Gliding', substitution: '/w/ or /j/ (Liquid Gliding)', frequency: 38, severity: 'Mild' },
  { phoneme: '/str-/', category: 'Cluster Reduction', substitution: '/st-/ or /t-/', frequency: 59, severity: 'Severe' }
];

const DOSE_COHORTS: DoseCohort[] = [
  { cohortId: 'Cohort-A (Standard Care)', ageRange: '4-6 yrs', meanWeeklyDoseMins: 30, meanAccuracyGainPct: 14.2, nSubjects: 48, effectSizeD: 0.42 },
  { cohortId: 'Cohort-B (App Micro-Dosing)', ageRange: '4-6 yrs', meanWeeklyDoseMins: 65, meanAccuracyGainPct: 38.6, nSubjects: 52, effectSizeD: 0.88 },
  { cohortId: 'Cohort-C (High Intensity)', ageRange: '6-8 yrs', meanWeeklyDoseMins: 90, meanAccuracyGainPct: 47.1, nSubjects: 34, effectSizeD: 1.15 }
];

export const ClinicalResearchAnalytics: React.FC = () => {
  const [isAnonymousMode, setIsAnonymousMode] = useState<boolean>(true);
  const [selectedCohort, setSelectedCohort] = useState<string>('all');

  const handleExportResearchData = (format: 'json' | 'csv') => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `speechflow_clinical_research_export_${timestamp}.${format}`;

    let exportContent = '';
    if (format === 'json') {
      exportContent = JSON.stringify({
        exportDate: new Date().toISOString(),
        deIdentificationStandard: 'HIPAA Safe Harbor Method (§164.514(b)(2))',
        isAnonymousResearchMode: isAnonymousMode,
        cohorts: DOSE_COHORTS,
        phonemeErrorPatterns: PHONEME_ERROR_PATTERNS
      }, null, 2);
    } else {
      exportContent = `Cohort,AgeRange,MeanWeeklyDoseMins,AccuracyGainPct,N_Subjects,EffectSize_Cohen_D\n` +
        DOSE_COHORTS.map(c => `"${c.cohortId}","${c.ageRange}",${c.meanWeeklyDoseMins},${c.meanAccuracyGainPct},${c.nSubjects},${c.effectSizeD}`).join('\n');
    }

    const blob = new Blob([exportContent], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported de-identified clinical research data to ${filename}`);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Clinical Governance & Research Sandbox
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Research & Outcome Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Aggregate phonological error patterns, dose-response velocity modeling, and HIPAA-compliant de-identified data exports.
          </p>
        </div>

        {/* Anonymous Mode Toggle Badge */}
        <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl flex items-center gap-4 shadow-md">
          <div className={`p-2 rounded-xl ${isAnonymousMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {isAnonymousMode ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider">
                {isAnonymousMode ? 'Anonymous Research Mode' : 'Identifiable Clinical Mode'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isAnonymousMode ? 'De-identified tokens (HIPAA §164.514)' : 'Contains real patient metadata'}
            </p>
          </div>
          <button
            onClick={() => {
              setIsAnonymousMode(!isAnonymousMode);
              toast.info(`Switched to ${!isAnonymousMode ? 'Anonymous Research' : 'Identifiable Clinical'} mode.`);
            }}
            className="ml-auto text-xs font-bold text-indigo-300 hover:text-white underline underline-offset-4"
          >
            Toggle
          </button>
        </div>
      </div>

      {/* Therapy Dose vs Progress Velocity Visual Cards */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Therapy Dose vs Progress Velocity (Dose-Response)
            </h3>
            <p className="text-xs text-slate-500">
              Evaluating the statistical correlation between weekly home micro-dosing and target phoneme accuracy gains.
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportResearchData('csv')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={() => handleExportResearchData('json')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
          </div>
        </div>

        {/* Cohort Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {DOSE_COHORTS.map((cohort, idx) => (
            <div
              key={cohort.cohortId}
              className={`p-6 rounded-2xl border transition-all ${
                idx === 1
                  ? 'bg-indigo-50/70 border-indigo-300 shadow-md ring-2 ring-indigo-500/20'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  {cohort.ageRange} (n={cohort.nSubjects})
                </span>
                <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                  d = {cohort.effectSizeD}
                </span>
              </div>

              <h4 className="text-base font-black text-slate-900 mb-4">{cohort.cohortId}</h4>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Weekly Dose:</span>
                    <span className="font-mono font-bold text-slate-800">{cohort.meanWeeklyDoseMins} mins/wk</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${(cohort.meanWeeklyDoseMins / 90) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Accuracy Gain:</span>
                    <span className="font-mono font-bold text-emerald-600">+{cohort.meanAccuracyGainPct}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(cohort.meanAccuracyGainPct / 50) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aggregated Phoneme Error Patterns Heatmap / Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <div>
          <h3 className="text-xl font-black text-slate-900">
            Systemic Phoneme Collapse & Substitution Matrix
          </h3>
          <p className="text-xs text-slate-500">
            Frequency analysis of phonological error patterns across all active speech trials.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Target Sound</th>
                <th className="py-3 px-4">Phonological Process</th>
                <th className="py-3 px-4">Common Substitution</th>
                <th className="py-3 px-4">Error Rate (%)</th>
                <th className="py-3 px-4">Severity Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {PHONEME_ERROR_PATTERNS.map((pattern) => (
                <tr key={pattern.phoneme} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-black font-mono text-indigo-700 text-sm">
                    {pattern.phoneme}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 font-bold">
                    {pattern.category}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono">
                    {pattern.substitution}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${pattern.frequency}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-slate-800">{pattern.frequency}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      pattern.severity === 'Severe'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : pattern.severity === 'Moderate'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {pattern.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
