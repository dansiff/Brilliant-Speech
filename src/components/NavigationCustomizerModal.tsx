import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sliders, 
  Check, 
  X, 
  Sparkles, 
  Layers, 
  Smile, 
  Compass, 
  Eye, 
  Heart, 
  ShieldCheck, 
  Activity, 
  Zap, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { 
  navPreferencesService, 
  PRESET_CONFIGS, 
  ExperiencePreset, 
  ModuleVisibilityConfig 
} from '../services/navigationPreferencesService';
import { sfx } from '../utils/soundEffects';
import { toast } from 'sonner';

interface NavigationCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesChanged: () => void;
}

export const NavigationCustomizerModal: React.FC<NavigationCustomizerModalProps> = ({
  isOpen,
  onClose,
  onPreferencesChanged
}) => {
  const [prefs, setPrefs] = useState(() => navPreferencesService.loadPreferences());
  const [showAdvancedToggles, setShowAdvancedToggles] = useState<boolean>(false);

  const handleSelectPreset = (preset: ExperiencePreset) => {
    sfx.playSuccess();
    const updated = navPreferencesService.applyPreset(preset);
    setPrefs(updated);
    onPreferencesChanged();
    toast.success(`Applied "${PRESET_CONFIGS[preset].name}" experience preset!`);
  };

  const handleToggleIndividualModule = (key: keyof ModuleVisibilityConfig) => {
    sfx.playTap();
    const newVisibility = !prefs.modules[key];
    const updated = navPreferencesService.toggleModule(key, newVisibility);
    setPrefs(updated);
    onPreferencesChanged();
  };

  const handleResetDefault = () => {
    sfx.playTap();
    const updated = navPreferencesService.applyPreset('regular_joe');
    setPrefs(updated);
    onPreferencesChanged();
    toast.info('Restored default Everyday Learner menu layout.');
  };

  if (!isOpen) return null;

  const MODULE_CATEGORIES: Array<{
    title: string;
    description: string;
    items: Array<{ key: keyof ModuleVisibilityConfig; label: string; icon: string; description: string }>;
  }> = [
    {
      title: 'Practice & Sounds',
      description: 'Phonetic drills, hierarchy games, and anatomical vocal tract models',
      items: [
        { key: 'practice', label: 'Daily Practice Arena', icon: '🎯', description: 'Core speech articulation drills & AI scoring' },
        { key: 'soundLadder', label: 'Sound Ladder Game', icon: '🪜', description: 'Traditional 5-step hierarchy drills' },
        { key: 'contrastEngine', label: 'Contrast Pairs (Minimal Pairs)', icon: '🔄', description: 'Phonological process distinction' },
        { key: 'articulatorAnatomy', label: 'Anatomy Lab (Sagittal View)', icon: '👅', description: 'Vocal tract cross-section & active articulators' }
      ]
    },
    {
      title: 'Games & Stories',
      description: 'Engaging literacy and vocabulary mini-games',
      items: [
        { key: 'stories', label: 'Story Time', icon: '📖', description: 'Interactive bilingual illustrated stories' },
        { key: 'matchingGame', label: 'Matching Game', icon: '✨', description: 'Visual & acoustic word matching' },
        { key: 'bilingualMatch', label: 'Bilingual Match', icon: '🌐', description: 'English/Spanish translation pairs' },
        { key: 'languageModules', label: 'Language Modules', icon: '📚', description: 'Syntax, semantics, and morphology' },
        { key: 'lessons', label: 'Structured Lessons', icon: '📝', description: 'Guided step-by-step curriculum' },
        { key: 'videos', label: 'Video Library', icon: '🎥', description: 'Visual speech coaching demonstrations' }
      ]
    },
    {
      title: 'Speech & Fluency Labs',
      description: 'Motor planning, rate control, and vocal biofeedback',
      items: [
        { key: 'motorSpeech', label: 'Apraxia & Motor Studio (DTTC)', icon: '⚡', description: 'Dynamic Temporal & Tactile Cueing + Oral Agility' },
        { key: 'fluencyLab', label: 'Fluency & Pacing Lab', icon: '🐢', description: 'Metronomes, Slow & Smooth Turtle rate trainer' },
        { key: 'vocalLab', label: 'Vocal Therapy Lab', icon: '🌱', description: 'Pitch glides, MPT, and Volume Garden' },
        { key: 'receptiveLanguage', label: 'Receptive Language Arena', icon: '🧭', description: 'Multi-step directions & Wh-Questions' },
        { key: 'voiceMeters', label: 'Dynamic Voice Meters', icon: '📊', description: 'Live decibel volume & pitch indicators' },
        { key: 'pacingBoard', label: 'Tactile Pacing Board', icon: '✋', description: 'Syllable tapping and rhythm regulator' }
      ]
    },
    {
      title: 'AAC & Sensory Tools',
      description: 'Augmentative communication and neurodivergent accommodations',
      items: [
        { key: 'sceneAac', label: 'Visual Scene AAC Boards', icon: '🖼️', description: 'Contextual scene hotspots & sentence strips' },
        { key: 'aacPlayground', label: 'AAC Grid Playground', icon: '🔲', description: 'Core vocabulary communication grids' },
        { key: 'autismTools', label: 'Autism Sensory Tools', icon: '🧠', description: 'First/Then task boards & sensory modes' },
        { key: 'focusSocial', label: 'Social & Pragmatic Skills', icon: '👥', description: 'Turn-taking, greetings, and emotions' }
      ]
    },
    {
      title: 'Clinical & Care Governance',
      description: 'Parent routines, research outcomes, and clinician CRM tools',
      items: [
        { key: 'parentCoaching', label: 'Parent Coaching Portal', icon: '❤️', description: 'Home micro-dosing ("3 Words, 3 Mins") & SLP guides' },
        { key: 'clinicalResearch', label: 'Research & Outcome Analytics', icon: '🛡️', description: 'Dose-response modeling & HIPAA de-identified data' },
        { key: 'clinicCrm', label: 'Clinic CRM Portal (/admin)', icon: '📋', description: 'Patient caseload & clinician auth bypass' },
        { key: 'marketplace', label: 'Exercise Marketplace', icon: '🛍️', description: 'Community custom word decks & downloads' }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Customize Your Experience & Menu</h2>
              <p className="text-xs text-slate-500">
                Choose a tailored preset or fine-tune which tools appear in your navigation bar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Experience Presets Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Select User Profile Preset
            </span>
            <button
              onClick={handleResetDefault}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset to Default (Regular Joe)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(PRESET_CONFIGS) as ExperiencePreset[]).map((presetKey) => {
              const preset = PRESET_CONFIGS[presetKey];
              const isSelected = prefs.activePreset === presetKey;

              return (
                <button
                  key={presetKey}
                  onClick={() => handleSelectPreset(presetKey)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-indigo-500/30 scale-[1.02]'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-indigo-50/40 hover:border-indigo-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{preset.icon}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <h4 className="font-black text-xs leading-tight mb-1">{preset.name}</h4>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-2 ${
                      isSelected ? 'bg-white/20 text-indigo-200' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {preset.badge}
                    </span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggle Detailed Tool Customization */}
        <div className="pt-2">
          <button
            onClick={() => setShowAdvancedToggles(!showAdvancedToggles)}
            className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
            {showAdvancedToggles ? 'Hide Individual Tool Toggles' : 'Customize Individual Tools (Advanced)'}
          </button>
        </div>

        {/* Granular Module Checkboxes */}
        <AnimatePresence>
          {showAdvancedToggles && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6 pt-2 border-t border-slate-100"
            >
              {MODULE_CATEGORIES.map((cat) => (
                <div key={cat.title} className="space-y-3">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      {cat.title}
                    </h4>
                    <p className="text-[11px] text-slate-400">{cat.description}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {cat.items.map((item) => {
                      const isEnabled = prefs.modules[item.key];
                      return (
                        <div
                          key={item.key}
                          onClick={() => handleToggleIndividualModule(item.key)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                            isEnabled
                              ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                              : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 pr-2">
                            <span className="text-xl">{item.icon}</span>
                            <div>
                              <span className="text-xs font-bold block">{item.label}</span>
                              <span className="text-[10px] text-slate-500 line-clamp-1">{item.description}</span>
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${
                            isEnabled ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'
                          }`}>
                            {isEnabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Actions */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              sfx.playSuccess();
              onClose();
            }}
            className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all"
          >
            Apply & Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
