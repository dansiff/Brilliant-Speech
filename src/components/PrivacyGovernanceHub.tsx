import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Bot,
  Mic,
  Clock,
  Trash2,
  Users,
  Building2,
  FileCheck,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Search,
  Filter,
  RefreshCw,
  Lock,
  KeyRound,
  Plus,
  ChevronRight,
  Sparkles,
  Award,
  AlertOctagon,
  FileText,
  UserCheck,
  Calendar,
  Sliders,
  ShieldCheck,
  Hash,
  Unlock,
  X
} from 'lucide-react';
import {
  privacyGovernanceService,
  PrivacyGovernanceSettings,
  RetentionPolicy,
  AuditLogEntry,
  ClinicianAccessGrant,
  AuditActionType
} from '../services/privacyGovernanceService';
import {
  aiSafetyGuardrailsService,
  ChildUsageQuota,
  SlpNoteOverride
} from '../services/aiSafetyGuardrailsService';
import {
  cryptoRecordService,
  EncryptedClinicalPackage
} from '../services/cryptoRecordService';
import { RecordingConsentModal } from './RecordingConsentModal';

interface PrivacyGovernanceHubProps {
  isOpen?: boolean;
  onClose?: () => void;
  userEmail?: string;
  userId?: string;
  isAiOptedOut: boolean;
  onToggleAiOptOut: (val: boolean) => void;
  onDataErased?: () => void;
}

export const PrivacyGovernanceHub: React.FC<PrivacyGovernanceHubProps> = ({
  isOpen = true,
  onClose,
  userEmail = 'parent@speechflow.app',
  userId = 'user_default',
  isAiOptedOut,
  onToggleAiOptOut,
  onDataErased,
}) => {
  const [activeTab, setActiveTab] = useState<
    'ai_guardrails' | 'consent' | 'retention' | 'encrypted_export' | 'deletion' | 'clinicians' | 'organization' | 'audit_logs'
  >('ai_guardrails');

  const [settings, setSettings] = useState<PrivacyGovernanceSettings>(
    privacyGovernanceService.getSettings()
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditFilterSeverity, setAuditFilterSeverity] = useState<string>('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // AI Safety state
  const [childQuota, setChildQuota] = useState<ChildUsageQuota>(
    aiSafetyGuardrailsService.getChildAiQuota(userId)
  );
  const [slpOverrides, setSlpOverrides] = useState<SlpNoteOverride[]>(
    aiSafetyGuardrailsService.getChildOverrides(userId)
  );

  // Encrypted Export & Vault state
  const [vaultPassphrase, setVaultPassphrase] = useState('');
  const [confirmVaultPassphrase, setConfirmVaultPassphrase] = useState('');
  const [isExportingVault, setIsExportingVault] = useState(false);
  const [showVaultPassphrase, setShowVaultPassphrase] = useState(false);

  // Vault Decryptor / Inspector state
  const [inspectPassphrase, setInspectPassphrase] = useState('');
  const [encryptedPackageInput, setEncryptedPackageInput] = useState<EncryptedClinicalPackage | null>(null);
  const [decryptedVaultContent, setDecryptedVaultContent] = useState<any | null>(null);
  const [vaultDecryptError, setVaultDecryptError] = useState<string | null>(null);
  const [isDecryptingVault, setIsDecryptingVault] = useState(false);

  // Audit Integrity verification
  const [auditIntegrity, setAuditIntegrity] = useState<{
    verified: boolean;
    valid: boolean;
    brokenIndex?: number;
    message: string;
  } | null>(null);
  const [showHashes, setShowHashes] = useState(false);

  // Clinician Invite state
  const [isInviteClinicianOpen, setIsInviteClinicianOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteClinic, setInviteClinic] = useState('');
  const [inviteLicense, setInviteLicense] = useState('');
  const [invitePermissions, setInvitePermissions] = useState({
    canViewReports: true,
    canListenAudio: true,
    canAssignHomework: true,
    canModifyPlan: false,
    canExportData: true,
  });

  // Deletion confirm states
  const [isPurgeAudioConfirmOpen, setIsPurgeAudioConfirmOpen] = useState(false);
  const [isAccountEraseConfirmOpen, setIsAccountEraseConfirmOpen] = useState(false);
  const [eraseConfirmText, setEraseConfirmText] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const refreshData = () => {
    const s = privacyGovernanceService.getSettings();
    setSettings(s);
    const logs = privacyGovernanceService.getAuditLogs({
      severity: auditFilterSeverity !== 'all' ? (auditFilterSeverity as any) : undefined,
      search: auditSearchQuery || undefined,
    });
    setAuditLogs(logs);
    setChildQuota(aiSafetyGuardrailsService.getChildAiQuota(userId));
    setSlpOverrides(aiSafetyGuardrailsService.getChildOverrides(userId));
  };

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Retention update
  const handleRetentionChange = (policy: RetentionPolicy) => {
    const res = privacyGovernanceService.setRetentionPolicy(policy, userEmail);
    refreshData();
    showNotification(`Retention policy updated to ${policy.replace('_', ' ')}. Purged ${res.purgedCount} expired audio files.`);
  };

  // Purge all audio
  const handlePurgeAllAudio = async () => {
    setIsProcessingAction(true);
    try {
      const count = await privacyGovernanceService.purgeAllAudioRecordings(undefined, userEmail);
      setIsPurgeAudioConfirmOpen(false);
      refreshData();
      showNotification(`Successfully purged ${count} local audio recording(s). Numerical session metrics preserved.`);
    } catch {
      showNotification('Failed to purge audio recordings.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Full erasure
  const handleExecuteAccountErasure = async () => {
    if (eraseConfirmText.toLowerCase() !== 'delete') return;
    setIsProcessingAction(true);
    try {
      await privacyGovernanceService.executeFullAccountErasure(userId, userEmail);
      setIsAccountEraseConfirmOpen(false);
      showNotification('All account data has been wiped in accordance with HIPAA Right-to-be-Forgotten.');
      if (onDataErased) onDataErased();
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch {
      showNotification('Failed to erase account data completely.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Update per-child quota
  const handleUpdateChildQuota = (newDailyLimit: number) => {
    aiSafetyGuardrailsService.setChildAiQuotaLimit(userId, newDailyLimit);
    refreshData();
    showNotification(`Daily AI limit updated to ${newDailyLimit} analyses/day for active profile.`);
  };

  // Trigger Encrypted Vault Export
  const handleGenerateEncryptedExport = async () => {
    if (!vaultPassphrase || vaultPassphrase.length < 8) {
      showNotification('Passphrase must be at least 8 characters long.', 'error');
      return;
    }
    if (vaultPassphrase !== confirmVaultPassphrase) {
      showNotification('Passphrase confirmation does not match.', 'error');
      return;
    }

    setIsExportingVault(true);
    try {
      const rawData = privacyGovernanceService.exportCompleteHealthArchive(userId, userEmail);
      const encryptedPkg = await cryptoRecordService.createEncryptedClinicalExport(
        rawData,
        vaultPassphrase,
        userId,
        userEmail
      );
      cryptoRecordService.downloadEncryptedPackage(encryptedPkg, `speechflow_vault_${userId}_${new Date().toISOString().slice(0, 10)}.json`);
      setVaultPassphrase('');
      setConfirmVaultPassphrase('');
      refreshData();
      showNotification('Encrypted AES-256-GCM clinical vault downloaded successfully.');
    } catch (err: any) {
      showNotification(`Encryption failed: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setIsExportingVault(false);
    }
  };

  // Decrypt uploaded vault
  const handleDecryptVaultPackage = async () => {
    if (!encryptedPackageInput) {
      setVaultDecryptError('Please upload an encrypted .json vault file first.');
      return;
    }
    if (!inspectPassphrase) {
      setVaultDecryptError('Please enter the vault decryption passphrase.');
      return;
    }

    setIsDecryptingVault(true);
    setVaultDecryptError(null);
    try {
      const decrypted = await cryptoRecordService.decryptClinicalExport(encryptedPackageInput, inspectPassphrase);
      setDecryptedVaultContent(decrypted);
      showNotification('Vault decrypted and verified successfully.');
    } catch (err: any) {
      setVaultDecryptError(err.message || 'Decryption failed. Invalid passphrase or corrupted archive.');
      setDecryptedVaultContent(null);
    } finally {
      setIsDecryptingVault(false);
    }
  };

  // File upload for vault inspector
  const handleVaultFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.cipher !== 'AES-256-GCM' || !parsed.ciphertext) {
          setVaultDecryptError('Invalid vault file format. Missing AES-256-GCM payload structure.');
          setEncryptedPackageInput(null);
          return;
        }
        setEncryptedPackageInput(parsed);
        setVaultDecryptError(null);
        setDecryptedVaultContent(null);
      } catch (err) {
        setVaultDecryptError('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Verify Audit Chain Integrity
  const handleVerifyAuditChain = () => {
    const res = privacyGovernanceService.verifyAuditTrailIntegrity();
    setAuditIntegrity({
      verified: true,
      valid: res.isValid,
      brokenIndex: res.brokenIndex,
      message: res.message
    });
    if (res.isValid) {
      showNotification('Cryptographic hash chain verified! Audit trail is authentic and tamper-free.');
    } else {
      showNotification(`Warning: Audit chain compromised at block #${res.brokenIndex}`, 'error');
    }
  };

  // Export Plain Audit CSV
  const handleExportAuditCSV = () => {
    const csv = privacyGovernanceService.exportAuditLogsAsCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speechflow_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Audit log CSV exported.');
  };

  // Export Plain JSON archive
  const handleExportPlainArchive = () => {
    const data = privacyGovernanceService.exportCompleteHealthArchive(userId, userEmail);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speechflow_plain_archive_${userId}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Plain data archive exported.');
  };

  // Clinician Invite Submit
  const handleInviteClinicianSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    privacyGovernanceService.grantClinicianAccess(
      {
        clinicianEmail: inviteEmail,
        clinicianName: inviteName,
        clinicName: inviteClinic || undefined,
        licenseNumber: inviteLicense || undefined,
        permissions: invitePermissions,
        grantedByGuardianEmail: userEmail,
      },
      userEmail
    );

    setIsInviteClinicianOpen(false);
    setInviteEmail('');
    setInviteName('');
    setInviteClinic('');
    setInviteLicense('');
    refreshData();
    showNotification(`Care team invite generated for ${inviteName}.`);
  };

  // Revoke Clinician
  const handleRevokeClinician = (grantId: string, name: string) => {
    privacyGovernanceService.revokeClinicianAccess(grantId, userEmail);
    refreshData();
    showNotification(`Access revoked for ${name}.`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col h-[90vh] max-h-[850px] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-950">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> HIPAA / FERPA / COPPA
                </span>
                <span className="text-[10px] font-mono text-slate-400">Clinical Data Governance Hub</span>
              </div>
              <h1 className="text-xl font-black uppercase tracking-tight text-white mt-0.5">
                Privacy, AI Safety & Access Control
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPlainArchive}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white text-xs font-bold transition-colors border border-white/10"
              title="Export complete data archive"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Archive</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Notification Banner */}
        <AnimatePresence>
          {notificationMsg && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`px-6 py-2 text-xs font-bold flex items-center gap-2 ${
                notificationMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100'
                  : notificationMsg.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border-b border-rose-100'
                  : 'bg-blue-50 text-blue-800 border-b border-blue-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{notificationMsg.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 px-4 overflow-x-auto no-scrollbar">
          {[
            { id: 'ai_guardrails', label: 'AI Safety & Quotas', icon: Bot },
            { id: 'retention', label: 'Data Retention', icon: Clock },
            { id: 'encrypted_export', label: 'Encrypted Vault', icon: KeyRound },
            { id: 'audit_logs', label: 'HIPAA Audit Trail', icon: FileCheck },
            { id: 'clinicians', label: 'Care Team & SLP', icon: Users },
            { id: 'consent', label: 'Recording Consent', icon: Mic },
            { id: 'organization', label: 'District / BAA', icon: Building2 },
            { id: 'deletion', label: 'Data Erasure', icon: Trash2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 bg-white shadow-sm -mb-px rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
          {/* ========================================================================= */}
          {/* 1. AI SAFETY & GUARDRAILS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'ai_guardrails' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-base font-black uppercase tracking-wide text-slate-900 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-600" />
                  AI Safety, Usage Caps & Clinical Guardrails
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Protect pediatric users with per-child daily evaluation quotas, hallucination sanitization filters, and SLP clinical overrides.
                </p>
              </div>

              {/* Master AI Toggle Card */}
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAiOptedOut ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">AI Speech Model Enrichment</p>
                      <p className="text-xs text-slate-500">
                        {isAiOptedOut
                          ? 'AI is Opted-Out (Strictly Offline Local Scoring)'
                          : 'AI Coaching Enabled (With Local Fallback & Hallucination Firewall)'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const nextVal = !isAiOptedOut;
                      onToggleAiOptOut(nextVal);
                      privacyGovernanceService.setAiOptOutGlobal(nextVal, userEmail);
                      refreshData();
                    }}
                    className={`w-14 h-7 rounded-full transition-colors relative ${
                      !isAiOptedOut ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow ${
                        !isAiOptedOut ? 'left-8' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Firewall Status Box */}
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  isAiOptedOut
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="font-bold flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isAiOptedOut ? 'Offline Local Deterministic Engine ACTIVE' : 'Local DSP Engine + Guardrailed Gemini Coaching'}</span>
                  </div>
                  <p>
                    {isAiOptedOut
                      ? 'No audio waveforms, text transcripts, or patient telemetry are sent to Gemini or external cloud AI servers. Clinical scoring is calculated entirely in-browser using Web Audio DSP and phonetic SODA classification.'
                      : 'Audio is analyzed on-device first for acoustic metrics (F0, pitch, decibels, latency). Non-identifiable phonetic transcripts are augmented with motivational clinical tips. Zero data is retained for model training.'}
                  </p>
                </div>
              </div>

              {/* Per-Child Usage Capping */}
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-black text-sm text-slate-900 uppercase flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      Per-Child Daily AI Usage Cap
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enforce daily quotas on cloud AI evaluations per student to prevent over-reliance and manage computational resources.
                    </p>
                  </div>
                  <span className="text-xs font-black px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                    {childQuota.usedToday} / {childQuota.dailyLimit} Used Today
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Daily Analysis Limit for Active Child</span>
                    <span className="font-mono text-indigo-600 text-sm">{childQuota.dailyLimit} trials / day</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={childQuota.dailyLimit}
                    onChange={(e) => handleUpdateChildQuota(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                    <span>5 (Conservative)</span>
                    <span>20 (Recommended)</span>
                    <span>50 (High Frequency)</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                  <span>When limit is exceeded, the app automatically switches to the offline deterministic DSP engine with zero interruption.</span>
                  <button
                    onClick={() => {
                      aiSafetyGuardrailsService.resetChildQuota(userId);
                      refreshData();
                      showNotification('Daily quota counter reset for child profile.');
                    }}
                    className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-sm"
                  >
                    Reset Today's Counter
                  </button>
                </div>
              </div>

              {/* Hallucination Filter & Safety Rules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Clinical Hallucination Filter</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    AI feedback is pre-filtered against unauthorized medical diagnoses (e.g. autism, apraxia, neurological claims), prescription suggestions, or negative child criticism.
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-mono text-[10px] font-black rounded border border-emerald-200">
                      S.O.D.A. TAXONOMY COMPLIANT
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-[10px] font-black rounded border border-indigo-200">
                      ACTIVE SANITIZER
                    </span>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                    <UserCheck className="w-4 h-4" />
                    <span>SLP Override Mode</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Clinicians can edit, adjust, or replace AI notes in SOAP documentation with certified digital signatures and audit-logged revision tracking.
                  </p>
                  <div className="pt-2 text-xs font-bold text-slate-700">
                    Total SLP Overrides on File: <span className="font-mono text-indigo-600">{slpOverrides.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. AUDIO & DATA RETENTION TAB */}
          {/* ========================================================================= */}
          {activeTab === 'retention' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-base font-black uppercase tracking-wide text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Parent-Controlled Data Retention Policies
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set granular expiration lifecycles for voice waveforms to align with school district policies and pediatric health records.
                </p>
              </div>

              {/* Retention Policy Selector */}
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Select Active Retention Window
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'ephemeral', label: 'Ephemeral Only', desc: 'No audio stored (DSP only)', badge: 'Max Privacy' },
                    { id: '7_days', label: '7 Days', desc: 'Short review window' },
                    { id: '30_days', label: '30 Days', desc: 'Standard clinical cycle', badge: 'Standard' },
                    { id: '90_days', label: '90 Days', desc: 'Quarterly IEP evaluation' },
                    { id: '1_year', label: '1 School Year', desc: '365 days retention' },
                    { id: '7_years', label: '7 Years (FERPA/HIPAA)', desc: 'Pediatric medical record mandate', badge: 'District Mandate' },
                    { id: 'indefinite', label: 'Indefinite', desc: 'Retain until manual wipe' },
                  ].map((p) => {
                    const isSelected = settings.retentionPolicy === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleRetentionChange(p.id as RetentionPolicy)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                            : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        {p.badge && (
                          <span className={`absolute top-2 right-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {p.badge}
                          </span>
                        )}
                        <p className={`font-black text-xs uppercase ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                          {p.label}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{p.desc}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">Automated Background Purge Daemon</span>
                    <span className="text-slate-500 text-[11px]">
                      Runs on application boot to automatically clean audio blobs that have passed the {settings.retentionPolicy.replace('_', ' ')} window.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const res = privacyGovernanceService.runRetentionCleanup();
                      showNotification(`Manual cleanup finished. Purged ${res.purgedCount} expired audio files.`);
                      refreshData();
                    }}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors whitespace-nowrap"
                  >
                    Run Cleanup Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. ENCRYPTED CLINICAL VAULT TAB */}
          {/* ========================================================================= */}
          {activeTab === 'encrypted_export' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-base font-black uppercase tracking-wide text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-600" />
                  AES-256-GCM Encrypted Clinical Vault & Portability
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Export password-protected encrypted clinical archives for insurance reimbursement or school district transfers.
                </p>
              </div>

              {/* Encrypted Export Generator */}
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 uppercase">Export Encrypted Health Package</h3>
                    <p className="text-xs text-slate-500">
                      Creates an AES-256-GCM encrypted container with PBKDF2 (100,000 rounds) key derivation.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Vault Passphrase (Min 8 chars)
                    </label>
                    <div className="relative">
                      <input
                        type={showVaultPassphrase ? 'text' : 'password'}
                        value={vaultPassphrase}
                        onChange={(e) => setVaultPassphrase(e.target.value)}
                        placeholder="Enter strong passphrase..."
                        className="w-full px-3 py-2 pr-10 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowVaultPassphrase(!showVaultPassphrase)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showVaultPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Confirm Passphrase
                    </label>
                    <input
                      type={showVaultPassphrase ? 'text' : 'password'}
                      value={confirmVaultPassphrase}
                      onChange={(e) => setConfirmVaultPassphrase(e.target.value)}
                      placeholder="Re-enter passphrase..."
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    🔒 Zero-Knowledge Encryption: The passphrase is never transmitted or stored on any server.
                  </span>
                  <button
                    onClick={handleGenerateEncryptedExport}
                    disabled={isExportingVault || !vaultPassphrase}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-colors shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExportingVault ? 'Encrypting...' : 'Generate Encrypted Vault'}</span>
                  </button>
                </div>
              </div>

              {/* Built-in Vault Inspector / Decryptor */}
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 uppercase">Vault Decryptor & Inspector</h3>
                    <p className="text-xs text-slate-500">
                      Upload an encrypted vault file and enter the passphrase to inspect or verify clinical contents.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Upload Encrypted .json Vault
                    </label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleVaultFileUpload}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium file:mr-3 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Decryption Passphrase
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={inspectPassphrase}
                        onChange={(e) => setInspectPassphrase(e.target.value)}
                        placeholder="Enter vault passphrase..."
                        className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={handleDecryptVaultPackage}
                        disabled={isDecryptingVault || !encryptedPackageInput}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold whitespace-nowrap transition-colors"
                      >
                        {isDecryptingVault ? 'Decrypting...' : 'Decrypt'}
                      </button>
                    </div>
                  </div>
                </div>

                {vaultDecryptError && (
                  <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{vaultDecryptError}</span>
                  </div>
                )}

                {decryptedVaultContent && (
                  <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-emerald-400 font-bold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Decrypted Health Vault Verified
                      </span>
                      <span>Exported: {new Date(decryptedVaultContent.exportedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 pt-1">
                      <div>Total Recordings: <span className="text-white font-bold">{decryptedVaultContent.recordings?.length || 0}</span></div>
                      <div>Profiles: <span className="text-white font-bold">{decryptedVaultContent.profiles?.length || 0}</span></div>
                      <div>Audit Log Entries: <span className="text-white font-bold">{decryptedVaultContent.auditLogs?.length || 0}</span></div>
                      <div>Retention Setting: <span className="text-indigo-300 font-bold">{decryptedVaultContent.settings?.retentionPolicy || '30_days'}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. HIPAA-COMPLIANT AUDIT TRAIL TAB */}
          {/* ========================================================================= */}
          {activeTab === 'audit_logs' && (
            <div className="space-y-4 max-w-4xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wide text-slate-900 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-indigo-600" />
                    HIPAA & FERPA Cryptographic Audit Trail
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tamper-evident, hash-chained chronological record of consent changes, AI evaluations, audio purges, and access events.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleVerifyAuditChain}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Hash className="w-3.5 h-3.5" />
                    <span>Verify Hash Chain</span>
                  </button>
                  <button
                    onClick={() => setShowHashes(!showHashes)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>{showHashes ? 'Hide Hashes' : 'Show Hashes'}</span>
                  </button>
                  <button
                    onClick={handleExportAuditCSV}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={refreshData}
                    className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-colors"
                    title="Refresh Log"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Integrity Verification Card */}
              {auditIntegrity && (
                <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                  auditIntegrity.valid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-center gap-2">
                    {auditIntegrity.valid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    )}
                    <div>
                      <span className="font-bold">{auditIntegrity.message}</span>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {auditIntegrity.valid
                          ? `All ${auditLogs.length} audit trail blocks chained cryptographically without mutation.`
                          : `Integrity broken at record #${auditIntegrity.brokenIndex}.`}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-white font-mono font-bold text-[10px] rounded border">
                    {auditIntegrity.valid ? 'SEAL: VERIFIED' : 'SEAL: BROKEN'}
                  </span>
                </div>
              )}

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    placeholder="Search audit trail by keyword, actor, or action..."
                    className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={auditFilterSeverity}
                  onChange={(e) => setAuditFilterSeverity(e.target.value)}
                  className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="all">All Severities</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="security">Security / Consent</option>
                </select>
              </div>

              {/* Audit Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-black text-[10px] sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Timestamp</th>
                        <th className="py-2.5 px-4">Action</th>
                        <th className="py-2.5 px-4">Actor</th>
                        <th className="py-2.5 px-4">Details</th>
                        {showHashes && <th className="py-2.5 px-4">Hash Chain</th>}
                        <th className="py-2.5 px-4">Severity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 font-black text-[11px] text-slate-900 whitespace-nowrap">
                            {log.action.replace(/_/g, ' ')}
                          </td>
                          <td className="py-2.5 px-4 text-[11px] text-slate-600 font-mono whitespace-nowrap">
                            {log.actorEmail}
                          </td>
                          <td className="py-2.5 px-4 text-slate-700 leading-snug">
                            {log.details}
                          </td>
                          {showHashes && (
                            <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                              <span className="text-indigo-600">{log.hash?.slice(0, 8)}...</span>
                              <span className="text-slate-400"> (prev: {log.prevHash?.slice(0, 6)}...)</span>
                            </td>
                          )}
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                log.severity === 'security'
                                  ? 'bg-purple-100 text-purple-800'
                                  : log.severity === 'warning'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {log.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. CLINICIANS ACCESS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'clinicians' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wide text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    Care Team & Speech-Language Pathologist Access
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Grant or revoke time-limited access for speech therapists, school SLPs, or private clinicians.
                  </p>
                </div>
                <button
                  onClick={() => setIsInviteClinicianOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Invite SLP</span>
                </button>
              </div>

              {/* Clinicians List */}
              <div className="space-y-3">
                {(settings.clinicianGrants || []).length === 0 ? (
                  <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
                    <Users className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">No external clinicians currently authorized.</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Click "Invite SLP" to authorize your school or private speech pathologist with granular HIPAA-compliant permissions.
                    </p>
                  </div>
                ) : (
                  (settings.clinicianGrants || []).map((grant) => (
                    <div
                      key={grant.id}
                      className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{grant.clinicianName}</span>
                          {grant.licenseNumber && (
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {grant.licenseNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-mono">{grant.clinicianEmail}</p>
                        {((grant as any).clinicName || (grant as any).clinicOrHospital) && (
                          <p className="text-[11px] text-slate-400">{(grant as any).clinicName || (grant as any).clinicOrHospital}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRevokeClinician(grant.id, grant.clinicianName)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors"
                        >
                          Revoke Access
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. RECORDING CONSENT TAB */}
          {/* ========================================================================= */}
          {activeTab === 'consent' && (
            <div className="space-y-6 max-w-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wide text-slate-900">
                    Pediatric Recording Consent & Permissions
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Parental/Guardian consent tracking under HIPAA, COPPA, and state medical recording regulations.
                  </p>
                </div>
                <button
                  onClick={() => setIsConsentModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                >
                  {settings.recordingConsent?.granted ? 'Update Consent Form' : 'Grant Recording Consent'}
                </button>
              </div>

              {/* Consent Status Card */}
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current Consent Status</span>
                    <div className="flex items-center gap-2 mt-1">
                      {settings.recordingConsent?.granted ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-black text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>ACTIVE CONSENT ON FILE</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 rounded-full font-black text-xs">
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>CONSENT WITHDRAWN / NOT GRANTED</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {settings.recordingConsent?.granted && (
                    <button
                      onClick={() => {
                        privacyGovernanceService.withdrawRecordingConsent(userEmail);
                        refreshData();
                        showNotification('Recording consent has been revoked. Voice captures are now disabled.');
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors border border-rose-200"
                    >
                      Withdraw Consent
                    </button>
                  )}
                </div>

                {/* Consent Metadata Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Consenting Guardian</span>
                    <span className="font-bold text-slate-800">{settings.recordingConsent?.guardianName || '—'}</span>
                    <span className="text-[11px] text-slate-500 block">({settings.recordingConsent?.guardianRelationship || 'Parent'})</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Consent Timestamp & Version</span>
                    <span className="font-bold text-slate-800">
                      {settings.recordingConsent?.consentedAt
                        ? new Date(settings.recordingConsent.consentedAt).toLocaleDateString()
                        : '—'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono block">
                      Doc Version: {settings.recordingConsent?.version || '2026.1-HIPAA'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 7. DISTRICT / ORGANIZATION TAB */}
          {/* ========================================================================= */}
          {activeTab === 'organization' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-base font-black uppercase tracking-wide text-slate-900">
                  School District & Institutional BAA Link
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage organization pairing, FERPA BAA (Business Associate Agreement) verification, and enterprise data controls.
                </p>
              </div>

              {settings.organization ? (
                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-mono text-indigo-600 block">{settings.organization.institutionalId}</span>
                        <h3 className="font-black text-sm text-slate-900">{settings.organization.orgName}</h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-black text-xs">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>BAA ACTIVE & SIGNED</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Organization Type</span>
                      <span className="font-bold text-slate-800 capitalize">
                        {settings.organization.orgType.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">FERPA Compliance</span>
                      <span className="font-bold text-emerald-700">
                        {settings.organization.ferpaCompliant ? 'Verified Standard' : 'Standard'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Institutional Admin</span>
                      <span className="font-mono text-slate-700 truncate block">
                        {settings.organization.orgAdminEmail}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
                  <Building2 className="w-10 h-10 mx-auto text-slate-300" />
                  <h3 className="font-black text-sm text-slate-800 uppercase">Link School District or Clinic</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Enter an institutional code from your school district, hospital system, or clinic to activate enterprise FERPA and HIPAA BAA coverage.
                  </p>
                  <button
                    onClick={() => {
                      privacyGovernanceService.linkOrganization(
                        {
                          orgId: 'org_metro_speech_consortium',
                          orgName: 'Metro Pediatric Speech & Health Consortium',
                          orgType: 'school_district',
                          baaStatus: 'signed_verified',
                          baaSignedDate: '2026-02-01',
                          ferpaCompliant: true,
                          orgAdminEmail: 'compliance@metroschools.edu',
                          institutionalId: 'DISTRICT-CA-409',
                          enforceAiOptOut: false,
                          enforcedMaxRetentionDays: 90,
                        },
                        userEmail
                      );
                      refreshData();
                      showNotification('Connected to Metro Pediatric Speech Consortium under FERPA BAA.');
                    }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md"
                  >
                    Link Sample School District
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 8. DELETION & DATA SOVEREIGNTY TAB */}
          {/* ========================================================================= */}
          {activeTab === 'deletion' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-base font-black uppercase tracking-wide text-slate-900">
                  Data Sovereignty & Right to Erasure
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Export, purge, or permanently erase your pediatric speech therapy records under HIPAA and GDPR standards.
                </p>
              </div>

              {/* Audio Purge Card */}
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-sm text-slate-900 uppercase">Purge Raw Voice Recordings</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Deletes all stored WAV/WebM audio blobs immediately from the browser storage while preserving scores.
                  </p>
                </div>
                <button
                  onClick={() => setIsPurgeAudioConfirmOpen(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Purge Audio Only</span>
                </button>
              </div>

              {/* Irreversible Account Erasure Card */}
              <div className="p-6 bg-rose-50/50 rounded-2xl border border-rose-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-sm text-rose-900 uppercase">Permanent Account Erasure (Right-to-be-Forgotten)</h3>
                  <p className="text-xs text-rose-700 mt-0.5">
                    Irrevocably deletes all child profiles, practice attempts, audio recordings, and audit logs.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEraseConfirmText('');
                    setIsAccountEraseConfirmOpen(true);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm"
                >
                  <AlertOctagon className="w-4 h-4" />
                  <span>Erase All Data</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 text-slate-400 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">
              HIPAA Privacy Rule • FERPA 34 CFR Part 99 • COPPA 16 CFR Part 312
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">SpeechFlow Security & Governance Engine</span>
        </div>
      </motion.div>

      {/* Recording Consent Form Modal */}
      <RecordingConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        onConsentGranted={() => {
          refreshData();
          showNotification('Pediatric recording consent successfully saved & audit logged.');
        }}
        userEmail={userEmail}
      />

      {/* Invite Clinician Modal */}
      {isInviteClinicianOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm uppercase text-slate-900">Invite Speech-Language Pathologist</h3>
              <button
                onClick={() => setIsInviteClinicianOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteClinicianSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Clinician Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sarah Jenkins, CCC-SLP"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Clinician Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. slp@pediatrictherapy.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Clinic / Hospital Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Children's Speech & Hearing Center"
                  value={inviteClinic}
                  onChange={(e) => setInviteClinic(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">State License / ASHA ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ASHA-1284901"
                  value={inviteLicense}
                  onChange={(e) => setInviteLicense(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-bold font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteClinicianOpen(false)}
                  className="px-3 py-2 text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-wider"
                >
                  Generate Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purge Audio Confirmation Modal */}
      {isPurgeAudioConfirmOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase text-slate-900">Purge All Voice Recordings?</h3>
              <p className="text-xs text-slate-600 mt-1">
                This will delete all raw audio files from your browser database. Your child's practice scores, badges, and progress history will NOT be affected.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsPurgeAudioConfirmOpen(false)}
                className="px-3 py-2 text-slate-500 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handlePurgeAllAudio}
                disabled={isProcessingAction}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md"
              >
                {isProcessingAction ? 'Purging...' : 'Confirm Purge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Erasure Confirmation Modal */}
      {isAccountEraseConfirmOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-rose-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base uppercase text-rose-900">Permanent Account & Data Erasure</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                This action is irreversible. All child profiles, speech recordings, custom boards, and cloud database records will be permanently deleted in accordance with HIPAA Right-to-be-Forgotten.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600">
                Type <span className="font-mono text-rose-600 font-black">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={eraseConfirmText}
                onChange={(e) => setEraseConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-rose-200 text-xs font-black text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAccountEraseConfirmOpen(false)}
                className="px-3 py-2 text-slate-500 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAccountErasure}
                disabled={eraseConfirmText.toLowerCase() !== 'delete' || isProcessingAction}
                className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                  eraseConfirmText.toLowerCase() === 'delete' && !isProcessingAction
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isProcessingAction ? 'Erasing Everything...' : 'Erase Everything Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
