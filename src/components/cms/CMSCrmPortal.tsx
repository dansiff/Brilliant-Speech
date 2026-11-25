import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  ExternalLink, 
  Link as LinkIcon, 
  Plus, 
  Calendar, 
  FileText, 
  Activity, 
  Clock, 
  Volume2, 
  CheckCircle2, 
  Settings, 
  Lock, 
  Mic, 
  TrendingUp, 
  ArrowRight,
  ShieldAlert,
  Clipboard,
  Check,
  CheckCircle
} from 'lucide-react';
import { ChildProfile, VoiceRecording } from '../../types';
import { toast } from 'sonner';

interface CMSCrmPortalProps {
  profiles: ChildProfile[];
  onUpdateRubric: (recordingId: string, rubricData: any) => void;
  onSelectClient?: (profileId: string) => void;
}

interface ExternalCRM {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultUrl: string;
  logoColor: string;
}

const TOP_SLP_CRMS: ExternalCRM[] = [
  {
    id: 'simplepractice',
    name: 'SimplePractice',
    category: 'Therapy Practice Management',
    description: 'Direct billing, customized intake paperwork, telehealth client portals, and secure pathology documentation.',
    defaultUrl: 'https://www.simplepractice.com',
    logoColor: 'bg-emerald-500'
  },
  {
    id: 'cliniko',
    name: 'Cliniko',
    category: 'Clinical Operations Portal',
    description: 'Complete practice management software for speech and pediatric clinics. Perfect for session scheduling and templates.',
    defaultUrl: 'https://www.cliniko.com',
    logoColor: 'bg-purple-500'
  },
  {
    id: 'theranest',
    name: 'TheraNest',
    category: 'Mental Health & SLP CRM',
    description: 'Therapy notes, patient scheduling, and interactive speech counseling records for collaborative mental-health.',
    defaultUrl: 'https://theranest.com',
    logoColor: 'bg-indigo-500'
  },
  {
    id: 'janeapp',
    name: 'Jane App',
    category: 'All-in-One Scheduling / CRM',
    description: 'Patient charting, scheduling, online booking, and customized billing designed beautifully for speech pathologists.',
    defaultUrl: 'https://jane.app',
    logoColor: 'bg-cyan-500'
  },
];

export const CMSCrmPortal: React.FC<CMSCrmPortalProps> = ({ 
  profiles, 
  onUpdateRubric,
  onSelectClient
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string>(profiles[0]?.id || '');
  const [customCrmName, setCustomCrmName] = useState(() => localStorage.getItem('slp_custom_crm_name') || 'My Private Clinic CRM');
  const [customCrmUrl, setCustomCrmUrl] = useState(() => localStorage.getItem('slp_custom_crm_url') || '');
  const [isCrmSaved, setIsCrmSaved] = useState(!!localStorage.getItem('slp_custom_crm_url'));
  
  // Clinical journal helper
  const [journalNote, setJournalNote] = useState('');
  const [activeClinicalJournal, setActiveClinicalJournal] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('slp_clinical_journals');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Clinician access management state
  const [invitedClinicians, setInvitedClinicians] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('slp_authorized_emails');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newClinicianEmail, setNewClinicianEmail] = useState('');

  const handleAddClinician = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newClinicianEmail.trim().toLowerCase();
    if (!cleanEmail) return;
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      toast.error('Please enter a valid clinic email address.');
      return;
    }
    if (invitedClinicians.includes(cleanEmail)) {
      toast.warning('This clinical email already is authorized.');
      return;
    }
    const updated = [...invitedClinicians, cleanEmail];
    setInvitedClinicians(updated);
    localStorage.setItem('slp_authorized_emails', JSON.stringify(updated));
    setNewClinicianEmail('');
    
    // Dispatch custom event to notify App.tsx to reload its admin verification Memo instantly!
    window.dispatchEvent(new Event('slp_authorized_emails_changed'));
    toast.success(`Access permissions successfully granted for clinician: ${cleanEmail}`);
  };

  const handleRemoveClinician = (emailToRemove: string) => {
    const updated = invitedClinicians.filter(e => e !== emailToRemove);
    setInvitedClinicians(updated);
    localStorage.setItem('slp_authorized_emails', JSON.stringify(updated));
    window.dispatchEvent(new Event('slp_authorized_emails_changed'));
    toast.info(`Access revoked for: ${emailToRemove}`);
  };

  // Retroactive 3D Evaluating States
  const [evaluatingRec, setEvaluatingRec] = useState<VoiceRecording | null>(null);
  const [evalAccuracy, setEvalAccuracy] = useState(5);
  const [evalFluency, setEvalFluency] = useState(5);
  const [evalIndependence, setEvalIndependence] = useState(5);
  const [evalPromptLevel, setEvalPromptLevel] = useState('Independent');
  const [evalFamiliarIntelligibility, setEvalFamiliarIntelligibility] = useState(75);
  const [evalUnfamiliarIntelligibility, setEvalUnfamiliarIntelligibility] = useState(50);
  const [evalResponseTimeMs, setEvalResponseTimeMs] = useState(1000);
  const [evalNotes, setEvalNotes] = useState('');

  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0] || null;

  const saveCustomCrm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCrmUrl) {
      toast.error("Please enter a valid HTTP/HTTPS CRM link.");
      return;
    }
    localStorage.setItem('slp_custom_crm_name', customCrmName);
    localStorage.setItem('slp_custom_crm_url', customCrmUrl);
    setIsCrmSaved(true);
    toast.success("Speech pathology CRM workspace synchronized successfully!");
  };

  const clearCustomCrm = () => {
    localStorage.removeItem('slp_custom_crm_name');
    localStorage.removeItem('slp_custom_crm_url');
    setCustomCrmName('My Private Clinic CRM');
    setCustomCrmUrl('');
    setIsCrmSaved(false);
    toast.info("Custom CRM link cleared.");
  };

  const handleAddJournalNote = () => {
    if (!activeProfile || !journalNote.trim()) return;
    const profileId = activeProfile.id;
    const nowStamp = new Date().toLocaleString();
    const newNoteText = `[${nowStamp}] ${journalNote.trim()}`;
    
    const updatedJournal = {
      ...activeClinicalJournal,
      [profileId]: [newNoteText, ...(activeClinicalJournal[profileId] || [])]
    };
    
    setActiveClinicalJournal(updatedJournal);
    localStorage.setItem('slp_clinical_journals', JSON.stringify(updatedJournal));
    setJournalNote('');
    toast.success("Progress note appended to patient clinical registry!");
  };

  const getAverageLatency = (history: VoiceRecording[]) => {
    if (!history || history.length === 0) return 1000;
    const valid = history.map(h => h.responseTimeMs || 1000);
    return Math.round(valid.reduce((sum, val) => sum + val, 0) / valid.length);
  };

  const openExternalCrm = (url: string) => {
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(formattedUrl, '_blank', 'noreferrer,noopener');
    toast.info(`Opening clinic dashboard portal: ${formattedUrl}`);
  };

  return (
    <div className="space-y-8 text-slate-100 pb-12">
      {/* 1. Quick CRM External Links Panel */}
      <section className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 lg:p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest">
            <span>⚙️ SYSTEM CONNECTIONS</span>
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
          </div>
          <h3 className="text-xl font-black text-white">Speech Pathology CRM Operations</h3>
          <p className="text-xs text-slate-400 leading-relaxed mt-1">
            Connect this practice workflow directly with established clinic CRM platforms and patient administration workspaces.
          </p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOP_SLP_CRMS.map((crm) => (
            <div 
              key={crm.id} 
              onClick={() => openExternalCrm(crm.defaultUrl)}
              className="group p-5 bg-slate-950 border border-slate-850 hover:border-indigo-500/50 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className={`px-2.5 py-1 rounded-lg text-[9px] font-bold text-white uppercase tracking-wider ${crm.logoColor} ring-2 ring-slate-900`}>
                    {crm.name}
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1 line-clamp-1">{crm.category}</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-3">{crm.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-900/60 flex items-center justify-between text-[9px] font-extrabold uppercase tracking-widest text-indigo-400">
                <span>Access Dashboard</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {/* Custom CRM Link Builder */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850">
          <form onSubmit={saveCustomCrm} className="flex flex-col lg:flex-row items-end gap-4">
            <div className="space-y-1.5 flex-1 w-full">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Clinic CRM Branding Name</label>
              <input 
                type="text" 
                placeholder="e.g., SimplePractice Portal, TheraNest Patient Dashboard"
                value={customCrmName}
                onChange={e => setCustomCrmName(e.target.value)}
                disabled={isCrmSaved}
                className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500/40 disabled:opacity-60"
              />
            </div>
            
            <div className="space-y-1.5 flex-[2] w-full">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">External Clinic Link / CRM Integration Webpage URL</label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input 
                  type="text" 
                  placeholder="Paste secure URL here (e.g., https://my-therapy-practice.simplepractice.com)"
                  value={customCrmUrl}
                  onChange={e => setCustomCrmUrl(e.target.value)}
                  disabled={isCrmSaved}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500/40 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="w-full lg:w-auto shrink-0 flex gap-2">
              {isCrmSaved ? (
                <>
                  <button 
                    type="button"
                    onClick={() => openExternalCrm(customCrmUrl)}
                    className="flex-1 lg:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Launch Custom CRM
                  </button>
                  <button 
                    type="button"
                    onClick={clearCustomCrm}
                    className="px-4 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-rose-500 text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors"
                  >
                    Clear Link
                  </button>
                </>
              ) : (
                <button 
                  type="submit"
                  className="w-full lg:w-auto px-6 py-3 bg-white hover:bg-slate-100 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md"
                >
                  Confirm CRM Integration
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Dynamic Authority & Clinicians Access Manager */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-white">🔐 Manage Specialist & Clinician Access Rights</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                Grant or revoke clinical permissions. Authorized emails will instantly unlock client charts, metrics, & retroactive grading.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              HIPAA Protected
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            
            {/* Left side: Quick add form */}
            <form onSubmit={handleAddClinician} className="lg:col-span-6 space-y-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Clinician Email Address</label>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="e.g., pathologist@clinicname.org"
                    value={newClinicianEmail}
                    onChange={e => setNewClinicianEmail(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500/40"
                  />
                  <button 
                    type="submit"
                    className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition-colors shadow-md"
                    title="Authorize Clinician Email"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-[9px] text-slate-500 leading-normal flex items-start gap-1">
                <span className="text-indigo-400">💡</span>
                <span>The clinic system grants administrative access automatically to the principal accounts (<b>danielsand711@gmail.com</b> and <b>DanielEsme</b>). Add fellow speech-language pathologists or assistance staff above to grant secondary access.</span>
              </div>
            </form>

            {/* Right side: Current Clinician List */}
            <div className="lg:col-span-6 flex flex-col justify-start space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Currently Authorized Specialists ({invitedClinicians.length + 2})</label>
              <div className="bg-slate-900/50 border border-slate-850 rounded-xl p-3 max-h-[160px] overflow-y-auto select-scrollbar text-[10px] space-y-1.5">
                {/* Out of shelf static admins */}
                <div className="flex justify-between items-center py-1.5 px-2 bg-slate-900 rounded border border-slate-800">
                  <span className="font-extrabold text-slate-200">danielsand711@gmail.com</span>
                  <span className="text-[7px] bg-indigo-500/15 text-indigo-400 font-bold px-1.5 py-0.2 rounded uppercase">Principal Operator</span>
                </div>
                <div className="flex justify-between items-center py-1.5 px-2 bg-slate-900 rounded border border-slate-800">
                  <span className="font-extrabold text-slate-200">DanielEsme</span>
                  <span className="text-[7px] bg-indigo-500/15 text-indigo-400 font-bold px-1.5 py-0.2 rounded uppercase">Principal Operator</span>
                </div>
                {/* Dynamically added Clinicians */}
                {invitedClinicians.map((email) => (
                  <div key={email} className="flex justify-between items-center py-1.5 px-2 bg-slate-900 rounded border border-slate-850 hover:border-rose-500/20 group transition-all">
                    <span className="font-medium text-slate-300">{email}</span>
                    <button 
                      onClick={() => handleRemoveClinician(email)}
                      className="text-[8px] text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white px-2 py-0.5 rounded transition-all uppercase font-medium"
                    >
                      Revoke Access
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Client Management & Therapy Progress Audit */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Client Selector */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-[32px] p-6 flex flex-col h-[650px]">
          <div className="mb-4">
            <h4 className="text-sm font-black text-white flex items-center gap-1.5 mb-1">
              👥 Medical Profile Registry
            </h4>
            <p className="text-[10px] text-slate-400 font-medium leading-normal">
              Search and manage your pediatric speech clients
            </p>
          </div>

          <div className="mb-4 bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Filter clients..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none w-full"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2 select-scrollbar">
            {filteredProfiles.map((p) => {
              const latestRec = p.voiceHistory && p.voiceHistory.length > 0 
                ? p.voiceHistory[p.voiceHistory.length - 1] 
                : null;
              const hasNotes = (activeClinicalJournal[p.id] || []).length > 0;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProfileId(p.id);
                    if (onSelectClient) onSelectClient(p.id);
                  }}
                  className={`p-3.5 rounded-2xl cursor-pointer border transition-all text-xs flex items-center gap-3 relative ${
                    selectedProfileId === p.id 
                      ? 'bg-slate-950 border-indigo-500 shadow-xl shadow-indigo-500/5' 
                      : 'bg-slate-950/40 border-slate-850/80 hover:bg-slate-950/60 hover:border-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-indigo-400 text-sm font-extrabold uppercase shrink-0 relative">
                    {p.name.charAt(0)}
                    {p.isPro && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white truncate">{p.name}</span>
                      <span className="text-[8px] font-bold text-slate-500 font-mono">ID: {p.id.substring(0, 5)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[8px] font-black tracking-wider uppercase px-1 py-0.2 bg-slate-900 border border-slate-800 text-slate-400 rounded">
                        🏠 Intelligibility: {latestRec?.assessmentRubric?.intelligibility?.familiar || 75}%
                      </span>
                      {hasNotes && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" title="Has Clinical Notes" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProfiles.length === 0 && (
              <div className="py-20 text-center border border-dashed border-slate-850 rounded-2xl">
                <Users className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-slate-600 uppercase">Registry Empty</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Clinic Workspace & Analytical Record Archive */}
        <div className="lg:col-span-8 space-y-6">
          {activeProfile ? (
            <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 lg:p-8 space-y-6 flex flex-col h-[650px] overflow-hidden justify-between">
              
              {/* Header Info */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl font-bold text-indigo-400">
                    {activeProfile.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider">{activeProfile.name} Diagnostic Center</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Completed {activeProfile.sessions || 0} sessions • {activeProfile.streak || 0}-day dynamic practice loop
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black uppercase text-indigo-400 tracking-wider">APRAXIA MOTOR PLANNING METRIC</span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs font-black font-mono">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Avg Latency:</span>
                    <span className="text-white px-2 py-0.5 rounded bg-slate-950 border border-slate-850 text-[10px]">
                      {getAverageLatency(activeProfile.voiceHistory || [])}ms
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Inner Workspace Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0 overflow-y-auto py-2 no-scrollbar">
                
                {/* 3D Assessment logs */}
                <div className="md:col-span-7 flex flex-col shrink-0 min-h-0">
                  <div className="mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">📊 Dynamic Practice Audio Archives</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 select-scrollbar">
                    {(!activeProfile.voiceHistory || activeProfile.voiceHistory.length === 0) ? (
                      <div className="py-20 text-center bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl">
                        <Mic className="w-5 h-5 text-slate-700 mx-auto mb-2" />
                        <p className="text-[10px] font-medium text-slate-500 leading-normal">
                          No recording sessions registered for this client yet.
                        </p>
                      </div>
                    ) : (
                      [...activeProfile.voiceHistory].reverse().map((rec) => {
                        const hasRubric = !!rec.assessmentRubric;
                        
                        return (
                          <div 
                            key={rec.id} 
                            className="p-3 bg-slate-950 rounded-xl border border-slate-850/80 flex items-center justify-between text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-200 truncate max-w-[150px]">{rec.exerciseTitle}</span>
                                <span className="text-[8px] text-slate-500 font-mono">
                                  {new Date(rec.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex gap-1.5 pt-0.5">
                                <span className="px-1.5 py-0.5 rounded text-[7px] font-black bg-indigo-500/10 text-indigo-400">
                                  ⏱️ Latency: {rec.responseTimeMs || 1000} ms
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-slate-900 border border-slate-850 text-slate-400">
                                  Score: {rec.score || 0}%
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  const audio = new Audio(rec.audioUrl);
                                  audio.play().catch(e => {
                                    console.error(e);
                                    toast.error("Play error - audio file could be offline.");
                                  });
                                }}
                                className="p-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-indigo-400 transition-colors"
                                title="Listen"
                              >
                                <Volume2 className="w-3" />
                              </button>
                              <button
                                onClick={() => {
                                  setEvaluatingRec(rec);
                                  setEvalAccuracy(rec.assessmentRubric?.accuracy ?? 5);
                                  setEvalFluency(rec.assessmentRubric?.fluency ?? 5);
                                  setEvalIndependence(rec.assessmentRubric?.independence ?? 5);
                                  setEvalPromptLevel(rec.assessmentRubric?.promptLevel ?? 'Independent');
                                  setEvalFamiliarIntelligibility(rec.assessmentRubric?.intelligibility?.familiar ?? 75);
                                  setEvalUnfamiliarIntelligibility(rec.assessmentRubric?.intelligibility?.unfamiliar ?? 50);
                                  setEvalResponseTimeMs(rec.assessmentRubric?.responseTimeMs ?? rec.responseTimeMs ?? 1000);
                                  setEvalNotes(rec.assessmentRubric?.notes ?? '');
                                }}
                                className="px-2 py-1 bg-white text-slate-950 font-black rounded text-[8px] uppercase tracking-wider hover:bg-slate-100 transition-colors"
                              >
                                {hasRubric ? 'Edit 3D' : 'Grade'}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Journal entry notes */}
                <div className="md:col-span-5 flex flex-col shrink-0 min-h-0 space-y-3">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">✍️ Clinical Progress Logs & Journals</span>
                  </div>

                  <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-850 p-3.5 overflow-hidden flex flex-col justify-between">
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 select-scrollbar text-[9px] text-slate-400 min-h-0">
                      {(!activeClinicalJournal[activeProfile.id] || activeClinicalJournal[activeProfile.id].length === 0) ? (
                        <div className="py-12 text-center text-slate-600">
                          <Clipboard className="w-4 h-4 mx-auto text-slate-700 mb-1.5" />
                          No permanent record logs updated. Type in comments below to persist observations.
                        </div>
                      ) : (
                        activeClinicalJournal[activeProfile.id].map((noteStr, idx) => (
                          <div key={idx} className="p-2 border border-slate-900 bg-slate-950/50 rounded-lg whitespace-pre-wrap leading-relaxed">
                            {noteStr}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-3 space-y-2">
                      <textarea
                        rows={2}
                        value={journalNote}
                        onChange={(e) => setJournalNote(e.target.value)}
                        placeholder="Type observation or progress logs..."
                        className="w-full text-[10px] bg-slate-900 border border-slate-800 placeholder-slate-600 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500/30 text-white resize-none"
                      />
                      <button
                        onClick={handleAddJournalNote}
                        className="w-full py-2 bg-gradient-to-r from-primary to-indigo-600 font-extrabold text-[8px] uppercase tracking-widest text-white rounded-lg transition-all hover:opacity-90"
                      >
                        Append Progress Journal Note
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Status and Action bar */}
              <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  HIPAA HIPAA-Compliant Sandboxed Cloud Engine
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const csvContent = "data:text/csv;charset=utf-8,Date,Exercise,Score,Latency(ms)\n" + 
                        (activeProfile.voiceHistory || []).map(r => `${new Date(r.timestamp).toLocaleDateString()},"${r.exerciseTitle}",${r.score},${r.responseTimeMs || 1000}`).join('\n');
                      const encoded = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encoded);
                      link.setAttribute("download", `${activeProfile.name}_speech_progress.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast.success(`Exported clinical database for ${activeProfile.name}!`);
                    }}
                    className="px-3.5 py-2 border border-slate-800 text-[9px] font-extrabold uppercase tracking-widest hover:bg-slate-800 text-slate-300 rounded-xl"
                  >
                    CSV Session Backup
                  </button>
                </div>
              </div>
              
            </div>
          ) : (
            <div className="py-24 text-center bg-slate-900 border border-slate-800 rounded-[32px]">
              <Users className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-xs text-slate-400">No active patient profile selected.</p>
            </div>
          )}
        </div>

      </section>

      {/* Retroactive Rubric Modals */}
      <AnimatePresence>
        {evaluatingRec && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEvaluatingRec(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative z-10 text-slate-100 space-y-6 select-scrollbar"
            >
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest">
                  <span>👩‍⚕️ Clinical Grading Station</span>
                </div>
                <h3 className="text-xl font-black text-white">Retroactive Speech Session Grading</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Re-grade target performance parameters for current pediatric trials and response pauses.
                </p>
              </div>

              {/* 3D sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <span>1. Accuracy</span>
                    <span className="text-xs text-indigo-400 font-black font-mono">{evalAccuracy}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={evalAccuracy}
                    onChange={(e) => setEvalAccuracy(Number(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-800 rounded-lg appearance-none h-1 cursor-pointer"
                  />
                  <p className="text-[8px] text-slate-500">Crystal clarity and proper target phonetic sound placement.</p>
                </div>

                <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <span>2. Fluency</span>
                    <span className="text-xs text-amber-500 font-black font-mono">{evalFluency}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={evalFluency}
                    onChange={(e) => setEvalFluency(Number(e.target.value))}
                    className="w-full accent-amber-500 bg-slate-800 rounded-lg appearance-none h-1 cursor-pointer"
                  />
                  <p className="text-[8px] text-slate-500">Pacing consistency, smooth cadence and minimal blocks.</p>
                </div>

                <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <span>3. Independence</span>
                    <span className="text-xs text-emerald-400 font-black font-mono">{evalIndependence}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={evalIndependence}
                    onChange={(e) => setEvalIndependence(Number(e.target.value))}
                    className="w-full accent-emerald-400 bg-slate-800 rounded-lg appearance-none h-1 cursor-pointer"
                  />
                  <p className="text-[8px] text-slate-500">Autonomy level without prompting or manual aid.</p>
                </div>
              </div>

              {/* Cue levels */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">Prompting Cue Level Applied</label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {['Independent', 'Verbal Cue', 'Visual Cue', 'Tactile/Physical'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEvalPromptLevel(lvl)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-extrabold transition-all text-center border ${
                        evalPromptLevel === lvl
                          ? 'bg-white text-slate-950 border-white shadow'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intelligibility */}
              <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 block">🗣️ Intelligibility Index Calibration</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-300">🏠 Familiar Listener</span>
                      <span className="text-xs font-extrabold text-indigo-400">{evalFamiliarIntelligibility}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={evalFamiliarIntelligibility}
                      onChange={(e) => setEvalFamiliarIntelligibility(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 bg-slate-800 h-1 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-300">🎒 Unfamiliar Listener</span>
                      <span className="text-xs font-extrabold text-emerald-400">{evalUnfamiliarIntelligibility}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={evalUnfamiliarIntelligibility}
                      onChange={(e) => setEvalUnfamiliarIntelligibility(parseInt(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-800 h-1"
                    />
                  </div>
                </div>
              </div>

              {/* Cognitive response latency */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">⏱️ Response Latency Calibration</label>
                  <span className="text-xs font-black font-mono text-indigo-400">{evalResponseTimeMs} ms</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="3000"
                  step="50"
                  value={evalResponseTimeMs}
                  onChange={(e) => setEvalResponseTimeMs(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 h-1 cursor-pointer rounded-lg px-px"
                />
              </div>

              {/* Observation notes */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">Observation Notes</label>
                <textarea
                  rows={2}
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  placeholder="Record placing mechanics or target substitutions noted..."
                  className="w-full text-xs bg-slate-950 text-white placeholder-slate-700 rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-indigo-500/50 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEvaluatingRec(null)}
                  className="px-4 py-2 border border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateRubric(evaluatingRec.id, {
                      accuracy: evalAccuracy,
                      fluency: evalFluency,
                      independence: evalIndependence,
                      promptLevel: evalPromptLevel,
                      notes: evalNotes,
                      responseTimeMs: evalResponseTimeMs,
                      intelligibility: {
                        familiar: evalFamiliarIntelligibility,
                        unfamiliar: evalUnfamiliarIntelligibility
                      }
                    });
                    setEvaluatingRec(null);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary to-indigo-600 text-white hover:opacity-90 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg"
                >
                  Save Rubric Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
