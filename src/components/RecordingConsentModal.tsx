import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, FileText, CheckCircle2, AlertTriangle, X, Mic } from 'lucide-react';
import { privacyGovernanceService } from '../services/privacyGovernanceService';

interface RecordingConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsentGranted: () => void;
  userEmail?: string;
}

export const RecordingConsentModal: React.FC<RecordingConsentModalProps> = ({
  isOpen,
  onClose,
  onConsentGranted,
  userEmail,
}) => {
  const [guardianName, setGuardianName] = useState('Parent / Legal Guardian');
  const [relationship, setRelationship] = useState<'Parent' | 'Legal Guardian' | 'Speech-Language Pathologist' | 'Adult User'>('Parent');
  const [allowClinicianAudio, setAllowClinicianAudio] = useState(true);
  const [allowAiAcoustics, setAllowAiAcoustics] = useState(true);
  const [hasAcknowledgedTerms, setHasAcknowledgedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGrantConsent = () => {
    if (!guardianName.trim() || !hasAcknowledgedTerms) return;
    setIsSubmitting(true);
    try {
      privacyGovernanceService.grantRecordingConsent({
        guardianName: guardianName.trim(),
        guardianRelationship: relationship,
        allowClinicianAudioAccess: allowClinicianAudio,
        allowAiAcousticProcessing: allowAiAcoustics,
        actorEmail: userEmail || 'guardian@local',
      });
      onConsentGranted();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                  HIPAA & COPPA Compliant
                </span>
                <span className="text-[10px] font-mono text-slate-400">v2026.1</span>
              </div>
              <h2 className="text-lg font-black uppercase tracking-tight text-white mt-0.5">
                Pediatric Speech Recording Consent
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-sm">
          <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100 flex items-start gap-3">
            <Lock className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-900 leading-relaxed">
              <strong>Your Child's Privacy Is Our Absolute Priority:</strong> Voice samples are captured exclusively for real-time acoustic analysis, articulation scoring, and clinical progress tracking. Audio is stored in your private, local browser vault with optional encrypted cloud backup.
            </div>
          </div>

          {/* Key Consent Disclosures */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-indigo-600" /> Informed Consent Disclosures
            </h3>
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Acoustic DSP Analysis:</strong> Extracts decibel volume, pitch (F0), phoneme durations, and SODA speech metrics.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Zero Model Training:</strong> Audio recordings and child transcripts are <em>never</em> used to train public AI models.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Data Sovereignty & Right to Erasure:</strong> You can purge audio files or delete all records at any time in Settings.</span>
              </div>
            </div>
          </div>

          {/* Guardian Information Fields */}
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  Parent / Guardian Full Name
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  Relationship to Child
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
                >
                  <option value="Parent">Parent</option>
                  <option value="Legal Guardian">Legal Guardian</option>
                  <option value="Speech-Language Pathologist">Speech-Language Pathologist (Authorized)</option>
                  <option value="Adult User">Self / Adult User</option>
                </select>
              </div>
            </div>

            {/* Granular Consent Checkboxes */}
            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={allowClinicianAudio}
                  onChange={(e) => setAllowClinicianAudio(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">Allow Licensed SLP / Care Team Access</span>
                  <span className="text-slate-500 text-[11px]">Enables invited speech therapists to review practice audio playback.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={allowAiAcoustics}
                  onChange={(e) => setAllowAiAcoustics(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">Enable Real-Time AI Acoustic Scoring</span>
                  <span className="text-slate-500 text-[11px]">Enables phonetic precision feedback. Can be toggled off at any time.</span>
                </div>
              </label>
            </div>

            {/* Final Acknowledgment */}
            <label className="flex items-start gap-2.5 p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={hasAcknowledgedTerms}
                onChange={(e) => setHasAcknowledgedTerms(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-500 mt-0.5 shrink-0"
              />
              <span className="text-xs font-semibold text-indigo-950 leading-snug">
                I confirm that I am the parent or authorized legal guardian. I grant consent to capture and process voice recordings for speech therapy practice in accordance with the HIPAA and COPPA privacy terms.
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel / Practice in Silent Mode
          </button>
          <button
            onClick={handleGrantConsent}
            disabled={!hasAcknowledgedTerms || !guardianName.trim() || isSubmitting}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
              hasAcknowledgedTerms && guardianName.trim()
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:scale-[1.02]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Confirm & Enable Recording</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
