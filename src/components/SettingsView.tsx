import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Cloud, 
  Lock, 
  Eye, 
  EyeOff, 
  Database, 
  Smartphone,
  ChevronRight,
  Crown,
  CheckCircle2,
  AlertCircle,
  Layout,
  LayoutTemplate,
  Code,
  Users,
  MicOff,
  Globe,
  Plus,
  Bell,
  Stethoscope,
  Target,
  MessageSquare,
  Activity,
  History,
  Timer,
  Volume2,
  PanelLeft,
  Monitor,
  Moon,
  Sun,
  Sliders,
  Sparkles
} from 'lucide-react';
import { LayoutMode } from '../types';
import { navPreferencesService, PRESET_CONFIGS, ExperiencePreset } from '../services/navigationPreferencesService';
import { toast } from 'sonner';

interface SettingsViewProps {
  isPro: boolean;
  privacyMode: boolean;
  cloudSync: boolean;
  isNavbarHidden: boolean;
  isFocusMode: boolean;
  theme: string;
  sensoryProfile: any;
  notificationSettings: any;
  clinicalSettings: any;
  layoutMode: LayoutMode;
  aiCredits: number;
  isAiOptedOut: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: (val: boolean) => void;
  onToggleAiOptOut: (val: boolean) => void;
  onToggleSound: (val: boolean) => void;
  onToggleHaptics: (val: boolean) => void;
  onPurchaseCredits: (type: 'credits_100' | 'credits_1000') => void;
  onTogglePrivacy: (val: boolean) => void;
  onToggleCloudSync: (val: boolean) => void;
  onToggleNavbar: (val: boolean) => void;
  onToggleFocus: (val: boolean) => void;
  onSetTheme: (theme: any) => void;
  onSetLayoutMode: (mode: LayoutMode) => void;
  onUpdateSensoryProfile: (profile: any) => void;
  onUpdateNotificationSettings: (settings: any) => void;
  onUpdateClinicalSettings: (settings: any) => void;
  onUpgrade: () => void;
  onLogin?: () => void;
  onClinicianAccess?: () => void;
  onLogout?: () => void;
  onClearCache: () => void;
  onInstallPWA?: () => void;
  onOpenPrivacyPolicy?: () => void;
  canInstallPWA?: boolean;
  onOpenAdminBuilder?: () => void;
  onOpenAdminCMS?: () => void;
  onOpenDiagnosticConsole?: () => void;
  onOpenPrivacyGovernance?: () => void;
  userEmail?: string;
  styles: any;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isPro,
  privacyMode,
  cloudSync,
  isNavbarHidden,
  isFocusMode,
  theme,
  sensoryProfile,
  notificationSettings,
  clinicalSettings,
  layoutMode,
  aiCredits,
  isAiOptedOut,
  soundEnabled,
  hapticsEnabled,
  isDarkMode,
  onToggleDarkMode,
  onToggleAiOptOut,
  onToggleSound,
  onToggleHaptics,
  onPurchaseCredits,
  onTogglePrivacy,
  onToggleCloudSync,
  onToggleNavbar,
  onToggleFocus,
  onSetTheme,
  onSetLayoutMode,
  onUpdateSensoryProfile,
  onUpdateNotificationSettings,
  onUpdateClinicalSettings,
  onUpgrade,
  onLogin,
  onClinicianAccess,
  onLogout,
  onClearCache,
  onInstallPWA,
  onOpenPrivacyPolicy,
  canInstallPWA,
  onOpenAdminBuilder,
  onOpenAdminCMS,
  onOpenDiagnosticConsole,
  onOpenPrivacyGovernance,
  userEmail,
  styles
}) => {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h2 className="text-3xl font-black uppercase tracking-tight">Settings</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Privacy, Sync & Account</p>
      </div>

      <div className="space-y-6">
        {/* UI Customization Section */}
        <section className={`${styles.card} p-6`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black uppercase text-sm">Interface & Feedback</h3>
              <p className="text-xs text-slate-400">Tailor your app experience</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Eye className={`w-5 h-5 ${isNavbarHidden ? 'text-slate-400' : 'text-primary'}`} />
                <div>
                  <p className="font-bold text-sm">Show Navigation Bar</p>
                  <p className="text-[10px] text-slate-500">Toggle the top menu visibility</p>
                </div>
              </div>
              <button 
                onClick={() => onToggleNavbar(!isNavbarHidden)}
                className={`w-12 h-6 rounded-full transition-colors relative ${!isNavbarHidden ? 'bg-primary' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${!isNavbarHidden ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Smartphone className={`w-5 h-5 ${isFocusMode ? 'text-primary' : 'text-slate-400'}`} />
                <div>
                  <p className="font-bold text-sm">Focus Mode (Full Screen)</p>
                  <p className="text-[10px] text-slate-500">Maximize practice area and hide distractions</p>
                </div>
              </div>
              <button 
                onClick={() => onToggleFocus(!isFocusMode)}
                className={`w-12 h-6 rounded-full transition-colors relative ${isFocusMode ? 'bg-primary' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isFocusMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                {isDarkMode ? (
                  <Moon className="w-5 h-5 text-indigo-500" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <p className="font-bold text-sm">Dark Mode</p>
                  <p className="text-[10px] text-slate-500">Enable an eye-friendly dark color palette</p>
                </div>
              </div>
              <button 
                onClick={() => onToggleDarkMode(!isDarkMode)}
                className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-indigo-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDarkMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Volume2 className={`w-5 h-5 ${soundEnabled ? 'text-primary' : 'text-slate-400'}`} />
                  <div>
                    <p className="font-bold text-sm">Sound Effects</p>
                    <p className="text-[10px] text-slate-500">Enable button clicks and success chimes</p>
                  </div>
                </div>
                <button 
                  onClick={() => onToggleSound(!soundEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${soundEnabled ? 'bg-primary' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${soundEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Activity className={`w-5 h-5 ${hapticsEnabled ? 'text-primary' : 'text-slate-400'}`} />
                  <div>
                    <p className="font-bold text-sm">Haptic Feedback</p>
                    <p className="text-[10px] text-slate-500">Vibrate on success or error (Mobile only)</p>
                  </div>
                </div>
                <button 
                  onClick={() => onToggleHaptics(!hapticsEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${hapticsEnabled ? 'bg-primary' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hapticsEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Theme Section */}
        <section className={`${styles.card} p-6`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black uppercase text-sm">Navigation Style</h3>
              <p className="text-xs text-slate-400">Choose how lists appear</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: LayoutMode.SIDEBAR, name: 'Sidebar', icon: <PanelLeft className="w-5 h-5" />, desc: 'Classic Left List' },
              { id: LayoutMode.TOP_NAV, name: 'Top Bar', icon: <Monitor className="w-5 h-5" />, desc: 'Minimal Header' },
              { id: LayoutMode.BOTTOM_NAV, name: 'Bottom list', icon: <Layout className="w-5 h-5" />, desc: 'Modern Mobile' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => onSetLayoutMode(m.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  layoutMode === m.id 
                    ? `border-primary bg-primary/5 shadow-md` 
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className={`p-2 rounded-lg ${layoutMode === m.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {m.icon}
                  </div>
                  <span className="font-black text-sm uppercase">{m.name}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{m.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Visual Theme Section */}
        <section className={`${styles.card} p-6`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black uppercase text-sm">Visual Theme</h3>
              <p className="text-xs text-slate-400">Choose your preferred look</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'MODERN', name: 'Assistance', icon: '🛡️', desc: 'High-Grade Professional' },
              { id: 'KID', name: 'Kid Friendly', icon: '🎨', desc: 'Fun & Colorful' },
              { id: 'TEENAGE', name: 'Teenage', icon: '⚡', desc: 'Bold & Edgy' },
              { id: 'PLAYFUL', name: 'Playful', icon: '🍭', desc: 'Bright & Bouncy' },
              { id: 'PROFESSIONAL', name: 'Adult', icon: '👔', desc: 'Minimalist' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => onSetTheme(t.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  theme === t.id 
                    ? `border-primary bg-primary/5 shadow-md` 
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xl">{t.icon}</span>
                  <span className="font-black text-sm uppercase">{t.name}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Clinical & Therapy Options Section */}
        <section className={`${styles.card} p-6`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-600">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black uppercase text-sm">Therapy Options</h3>
              <p className="text-xs text-slate-400">Professional tailored recommendations</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Prompting Level */}
            <div>
              <p className="font-bold text-sm mb-3">Prompting Level</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'maximal', label: 'Maximal', desc: 'Frequent cues' },
                  { id: 'moderate', label: 'Moderate', desc: 'Occasional' },
                  { id: 'minimal', label: 'Minimal', desc: 'Just enough' },
                  { id: 'none', label: 'Independent', desc: 'No cues' }
                ].map((level) => (
                  <button
                    key={level.id}
                    onClick={() => onUpdateClinicalSettings({ promptingLevel: level.id })}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      clinicalSettings?.promptingLevel === level.id
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <p className={`font-black text-[10px] uppercase ${clinicalSettings?.promptingLevel === level.id ? 'text-primary' : 'text-slate-600'}`}>
                      {level.label}
                    </p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase">{level.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Wait Time */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Timer className="w-5 h-5 text-cyan-500" />
                <div>
                  <p className="font-bold text-sm">Wait Time</p>
                  <p className="text-[10px] text-slate-500">Seconds to wait for a response</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {[3, 5, 10, 15].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => onUpdateClinicalSettings({ waitTimeSeconds: sec })}
                    className={`w-8 h-8 rounded-lg font-black text-xs transition-all ${
                      clinicalSettings?.waitTimeSeconds === sec
                        ? 'bg-primary text-white'
                        : 'bg-white text-slate-400 border border-slate-200'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Complexity */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-cyan-500" />
                <div>
                  <p className="font-bold text-sm">Feedback Style</p>
                  <p className="text-[10px] text-slate-500">How feedback is explained</p>
                </div>
              </div>
              <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => onUpdateClinicalSettings({ feedbackComplexity: 'simple' })}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                    clinicalSettings?.feedbackComplexity === 'simple' ? 'bg-primary text-white shadow-sm' : 'text-slate-400'
                  }`}
                >
                  Simple
                </button>
                <button
                  onClick={() => onUpdateClinicalSettings({ feedbackComplexity: 'technical' })}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                    clinicalSettings?.feedbackComplexity === 'technical' ? 'bg-primary text-white shadow-sm' : 'text-slate-400'
                  }`}
                >
                  Clinical
                </button>
              </div>
            </div>

            {/* Daily Target */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-cyan-500" />
                <div>
                  <p className="font-bold text-sm">Daily Practice Target</p>
                  <p className="text-[10px] text-slate-500">Goal for total practice minutes</p>
                </div>
              </div>
              <select 
                value={clinicalSettings?.dailyPracticeTargetMinutes || 20}
                onChange={(e) => onUpdateClinicalSettings({ dailyPracticeTargetMinutes: Number(e.target.value) })}
                className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-black text-slate-700 outline-none"
              >
                {[5, 10, 15, 20, 30, 45, 60].map(m => (
                  <option key={m} value={m}>{m} minutes</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className={`${styles.card} p-6`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black uppercase text-sm">Notifications</h3>
              <p className="text-xs text-slate-400">Stay on track with reminders</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Timer className={`w-5 h-5 ${notificationSettings?.remindersEnabled ? 'text-violet-500' : 'text-slate-400'}`} />
                <div>
                  <p className="font-bold text-sm">Practice Reminders</p>
                  <p className="text-[10px] text-slate-500">Get notified when it's time to practice</p>
                </div>
              </div>
              <button 
                onClick={() => onUpdateNotificationSettings({ remindersEnabled: !(notificationSettings?.remindersEnabled) })}
                className={`w-12 h-6 rounded-full transition-colors relative ${notificationSettings?.remindersEnabled ? 'bg-violet-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationSettings?.remindersEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {notificationSettings?.remindersEnabled && (
              <div className="flex items-center justify-between p-4 bg-violet-50/50 rounded-2xl border border-violet-100/50 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-violet-600" />
                  <p className="font-bold text-sm text-violet-900">Preferred Practice Time</p>
                </div>
                <input 
                  type="time" 
                  value={notificationSettings?.practiceTime || "09:00"}
                  onChange={(e) => onUpdateNotificationSettings({ practiceTime: e.target.value })}
                  className="bg-white px-3 py-1.5 rounded-xl border border-violet-200 text-sm font-black text-violet-700 outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Target className={`w-5 h-5 ${notificationSettings?.achievementsEnabled ? 'text-violet-500' : 'text-slate-400'}`} />
                <div>
                  <p className="font-bold text-sm">Achievement Alerts</p>
                  <p className="text-[10px] text-slate-500">Notifications for new badges and streaks</p>
                </div>
              </div>
              <button 
                onClick={() => onUpdateNotificationSettings({ achievementsEnabled: !(notificationSettings?.achievementsEnabled) })}
                className={`w-12 h-6 rounded-full transition-colors relative ${notificationSettings?.achievementsEnabled ? 'bg-violet-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationSettings?.achievementsEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Workspace & Experience Customization Section */}
        <section className={`${styles.card} p-6 space-y-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black uppercase text-sm">Experience Mode & Menu Layout</h3>
                <p className="text-xs text-slate-400">Tailor the app layout for your role (Regular Joe, Kids, Parent, Clinician, Autism)</p>
              </div>
            </div>

            <button
              onClick={() => {
                navPreferencesService.applyPreset('regular_joe');
                toast.success('Restored default Everyday Learner mode!');
                window.location.reload();
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              Reset to Default
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(PRESET_CONFIGS) as ExperiencePreset[]).map((presetKey) => {
              const p = PRESET_CONFIGS[presetKey];
              const isCurrent = navPreferencesService.loadPreferences().activePreset === presetKey;

              return (
                <button
                  key={presetKey}
                  onClick={() => {
                    navPreferencesService.applyPreset(presetKey);
                    toast.success(`Switched to "${p.name}" preset!`);
                    window.location.reload();
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-slate-100 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{p.icon}</span>
                      {isCurrent && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="font-black text-xs text-slate-900 leading-tight mb-1">{p.name}</p>
                    <span className="text-[9px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full inline-block mb-2">
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Sensory Profile Section */}
        <section className={`${styles.card} p-6`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black uppercase text-sm">Sensory Profile</h3>
              <p className="text-xs text-slate-400">Neurodivergent-friendly settings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'calmingColors', name: 'Calming Colors', icon: '🎨', desc: 'Soft, muted color palette' },
              { id: 'reducedMotion', name: 'Reduced Motion', icon: '✨', desc: 'Fewer animations' },
              { id: 'highContrast', name: 'High Contrast', icon: '👁️', desc: 'Better visibility' },
              { id: 'showVisualTimer', name: 'Floating Timer', icon: '⏲️', desc: 'Persistent visual timer' }
            ].map((pref) => (
              <button
                key={pref.id}
                onClick={() => onUpdateSensoryProfile({ [pref.id]: !(sensoryProfile?.[pref.id]) })}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
                  sensoryProfile?.[pref.id]
                    ? `border-primary bg-primary/5 shadow-md` 
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  sensoryProfile?.[pref.id] ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  <span className="text-lg">{pref.icon}</span>
                </div>
                <div>
                  <p className={`font-bold text-sm ${sensoryProfile?.[pref.id] ? 'text-primary' : 'text-slate-700'}`}>{pref.name}</p>
                  <p className="text-[10px] text-slate-400 leading-tight uppercase font-bold tracking-widest">{pref.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* AI Usage & Credits Section */}
        <section className={`${styles.card} p-6`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black uppercase text-sm">AI Speech Analysis</h3>
              <p className="text-xs text-slate-400">Manage your AI limits and practice quality</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Database className={`w-5 h-5 ${isAiOptedOut ? 'text-slate-400' : 'text-emerald-500'}`} />
                <div>
                  <p className="font-bold text-sm">Use AI Analysis</p>
                  <p className="text-[10px] text-slate-500">Disable to use basic local scoring (saves credits)</p>
                </div>
              </div>
              <button 
                onClick={() => onToggleAiOptOut(!isAiOptedOut)}
                className={`w-12 h-6 rounded-full transition-colors relative ${!isAiOptedOut ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${!isAiOptedOut ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black uppercase text-emerald-700">Account Credits</p>
                  <div className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-black">{aiCredits} Balance</div>
                </div>
                <div className="text-[10px] font-bold text-emerald-600">Pro Daily Limit: 500</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => onPurchaseCredits('credits_100')}
                  className="bg-white p-3 rounded-xl border border-emerald-200 text-left hover:shadow-md transition-all group"
                >
                  <p className="font-black text-xs text-slate-900 group-hover:text-emerald-600">100 Credits</p>
                  <p className="text-[10px] font-bold text-emerald-500">$4.99</p>
                </button>
                <button 
                  onClick={() => onPurchaseCredits('credits_1000')}
                  className="bg-emerald-600 p-3 rounded-xl text-left hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  <p className="font-black text-xs text-white">1,000 Credits</p>
                  <p className="text-[10px] font-bold text-emerald-100">$39.99 (Best Value)</p>
                </button>
              </div>
              <p className="mt-3 text-[10px] text-emerald-600 font-medium">Credits are consumed only when using High-Precision AI Speech Scoring.</p>
            </div>
          </div>
        </section>

        {/* Speech Recognition & Clinical Diagnostics */}
        <section className={`${styles.card} p-6`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black uppercase text-sm">Speech Engine & Clinical DSP</h3>
              <p className="text-xs text-slate-400">Offline-first local recognition & diagnostics</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-sm text-sky-900">Clinical Verification & Self-Test</p>
                <p className="text-xs text-sky-700">Run 8 automated provider fallback, acoustic, and bilingual tests</p>
              </div>
              {onOpenDiagnosticConsole && (
                <button
                  onClick={onOpenDiagnosticConsole}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-sky-200"
                >
                  Run Diagnostics
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className={`${styles.card} p-6`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black uppercase text-sm">Privacy, Consent & Compliance</h3>
              <p className="text-xs text-slate-400">HIPAA, FERPA, COPPA governance & data control</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Privacy Governance Hub CTA Banner */}
            <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs uppercase tracking-wider text-indigo-950">
                    Compliance & Access Control Hub
                  </span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-indigo-200/70 text-indigo-800 rounded">
                    Full Control
                  </span>
                </div>
                <p className="text-xs text-indigo-700">
                  AI Opt-out • Recording Consent • 30-Day Audio Retention • Clinician Access • Right to Erasure • Audit Log
                </p>
              </div>
              {onOpenPrivacyGovernance && (
                <button
                  onClick={onOpenPrivacyGovernance}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-200 whitespace-nowrap"
                >
                  Open Governance Hub
                </button>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                {privacyMode ? <EyeOff className="w-5 h-5 text-green-500" /> : <Eye className="w-5 h-5 text-slate-400" />}
                <div>
                  <p className="font-bold text-sm">Local-Only Mode</p>
                  <p className="text-[10px] text-slate-500">Data never leaves this device (HIPAA compliant)</p>
                </div>
              </div>
              <button 
                onClick={() => onTogglePrivacy(!privacyMode)}
                className={`w-12 h-6 rounded-full transition-colors relative ${privacyMode ? 'bg-green-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${privacyMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Cloud className={`w-5 h-5 ${cloudSync ? 'text-blue-500' : 'text-slate-400'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">Cloud Sync</p>
                    {!isPro && <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md font-black">PRO</span>}
                  </div>
                  <p className="text-[10px] text-slate-500">Sync progress across devices securely</p>
                </div>
              </div>
              <button 
                onClick={() => isPro ? onToggleCloudSync(!cloudSync) : onUpgrade()}
                className={`w-12 h-6 rounded-full transition-colors relative ${cloudSync && isPro ? 'bg-blue-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${cloudSync && isPro ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className={`${styles.card} p-6`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black uppercase text-sm">Account</h3>
              <p className="text-xs text-slate-400">{userEmail ? `Logged in as ${userEmail}` : 'Guest Mode'}</p>
            </div>
          </div>

          <div className="space-y-3">
            {userEmail ? (
              <button 
                onClick={onLogout}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100"
              >
                <div className="flex items-center gap-3 text-red-500">
                  <MicOff className="w-5 h-5 opacity-50" />
                  <span className="font-bold text-sm">Sign Out</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
            ) : (
              <div className="space-y-3 w-full">
                <button 
                  onClick={onLogin}
                  className="w-full flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl transition-all hover:scale-[1.02] shadow-lg shadow-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-primary" />
                    <span className="font-black uppercase tracking-widest text-xs">Sign In for Cloud Sync</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/50" />
                </button>
                
                {onClinicianAccess && (
                  <button 
                    onClick={onClinicianAccess}
                    className="w-full flex items-center justify-between p-4 bg-primary/10 text-primary border border-primary/20 rounded-2xl transition-all hover:scale-[1.02] shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <Stethoscope className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform" />
                      <span className="font-black uppercase tracking-widest text-xs text-left">Clinician Secure Gate Login</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-primary/50" />
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Storage Section */}
        <section className={`${styles.card} p-6`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black uppercase text-sm">Local Storage</h3>
              <p className="text-xs text-slate-400">Device-specific data management</p>
            </div>
          </div>

          <div className="space-y-3">
            {canInstallPWA && (
              <button 
                onClick={onInstallPWA}
                className="w-full flex items-center justify-between p-4 bg-primary/10 text-primary rounded-2xl transition-all hover:bg-primary/20 border border-primary/20"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5" />
                  <span className="font-bold text-sm">Install Mobile App</span>
                </div>
                <div className="flex items-center gap-1 text-[8px] font-black bg-primary text-white px-2 py-1 rounded-full uppercase">
                  Recommended
                </div>
              </button>
            )}
            <button 
              onClick={onOpenPrivacyPolicy}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-sm">Privacy Policy</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-slate-400" />
                <span className="font-bold text-sm">Export Local Data</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
            <button 
              onClick={onClearCache}
              className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-2xl transition-colors text-red-500 group"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                <span className="font-bold text-sm">Clear Local Cache</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-30" />
            </button>
          </div>
        </section>

        {/* Admin Section */}
        {userEmail === 'danielSand711@gmail.com' && (
          <section className={`${styles.card} p-6 border-2 border-primary/20 bg-slate-900 text-white`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black uppercase text-sm">System Command Center</h3>
                <p className="text-xs text-slate-400">Applications Management & CMS</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  window.history.pushState({}, '', '/admin');
                  if (onOpenAdminCMS) onOpenAdminCMS();
                }}
                className="flex items-center justify-between p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-600/20"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-white" />
                  <div className="text-left">
                    <span className="font-black uppercase tracking-widest text-xs leading-tight block">Standalone Admin</span>
                    <span className="text-[10px] font-mono text-indigo-200 block">Direct Route: /admin</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/50" />
              </button>

              <button 
                onClick={onOpenAdminBuilder}
                className="flex items-center justify-between p-4 bg-slate-800 text-white rounded-2xl transition-all hover:scale-[1.02] active:scale-95 border border-slate-700 hover:border-slate-600"
              >
                <div className="flex items-center gap-3">
                  <Plus className="w-5 h-5 text-primary" />
                  <span className="font-black uppercase tracking-widest text-xs text-left leading-tight">Visual<br/>Builder</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/50" />
              </button>
            </div>
          </section>
        )}

        {/* Pro Upgrade Banner */}
        {!isPro && (
          <motion.div 
            whileHover={{ scale: 1.01 }}
            onClick={onUpgrade}
            className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 rounded-[2.5rem] text-white shadow-xl shadow-amber-200 cursor-pointer relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Crown className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-6 h-6 fill-white" />
                <h3 className="text-xl font-black uppercase">Upgrade to Pro</h3>
              </div>
              <p className="text-sm font-medium opacity-90 mb-4 max-w-md">
                Unlock Real AI Speech Scoring, Cloud Sync, and Advanced SLP Analytics for your child's journey.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-xs font-black uppercase bg-white/20 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Real AI Analysis
                </div>
                <div className="flex items-center gap-1 text-xs font-black uppercase bg-white/20 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Unlimited Sync
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
