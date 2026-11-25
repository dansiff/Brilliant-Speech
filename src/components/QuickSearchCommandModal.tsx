import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  X, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  Activity, 
  Zap, 
  Smile, 
  Compass, 
  Eye, 
  BookOpen, 
  Mic, 
  Heart, 
  ShieldCheck, 
  Settings, 
  Video, 
  FileText
} from 'lucide-react';
import { sfx } from '../utils/soundEffects';

interface SearchItem {
  id: string;
  title: string;
  category: string;
  description: string;
  targetView: string;
  icon: any;
  tags: string[];
}

interface QuickSearchCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView: (view: any) => void;
}

const SEARCH_CATALOG: SearchItem[] = [
  {
    id: 'view-practice',
    title: 'Daily Practice Arena',
    category: 'Core Articulation',
    description: 'Word drills, real-time phonetic evaluation, and motor tongue guides',
    targetView: 'practice',
    icon: Mic,
    tags: ['practice', 'speech', 'words', 'articulation', 'phonemes', 'record']
  },
  {
    id: 'view-motor-speech',
    title: 'Motor Speech & Apraxia Studio',
    category: 'Clinical Therapy',
    description: 'Dynamic Temporal & Tactile Cueing (DTTC) hierarchy & Oral-Motor Agility',
    targetView: 'motor-speech',
    icon: Zap,
    tags: ['motor', 'apraxia', 'dttc', 'oral motor', 'tongue', 'lips', 'cheeks', 'cas']
  },
  {
    id: 'view-receptive-language',
    title: 'Receptive Language Arena',
    category: 'Clinical Therapy',
    description: 'Multi-step following directions, spatial concepts, and Wh-questions',
    targetView: 'receptive-language',
    icon: Compass,
    tags: ['receptive', 'directions', 'wh questions', 'who', 'what', 'where', 'why', 'spatial', 'following']
  },
  {
    id: 'view-articulator-anatomy',
    title: 'Articulator Anatomy Explorer',
    category: 'Clinical Therapy',
    description: 'Interactive sagittal vocal tract cross-section and active IPA contact points',
    targetView: 'articulator-anatomy',
    icon: Eye,
    tags: ['anatomy', 'sagittal', 'vocal tract', 'ipa', 'tongue placement', 'velum', 'glottis', 'lips']
  },
  {
    id: 'view-sound-ladder',
    title: 'Sound Ladder Game',
    category: 'Games & Drills',
    description: 'Traditional 5-step hierarchy: Isolation → Syllables → Words → Phrases → Sentences',
    targetView: 'sound-ladder',
    icon: Layers,
    tags: ['ladder', 'hierarchy', 'isolation', 'syllables', 'sentences', 'game']
  },
  {
    id: 'view-contrast-engine',
    title: 'Contrast Pair Engine (Minimal Pairs)',
    category: 'Games & Drills',
    description: 'Fronting, stopping, gliding, and cluster reduction minimal pairs',
    targetView: 'contrast-engine',
    icon: Sparkles,
    tags: ['minimal pairs', 'contrast', 'fronting', 'stopping', 'gliding', 'cluster reduction']
  },
  {
    id: 'view-fluency-lab',
    title: 'Fluency & Pacing Lab',
    category: 'Clinical Therapy',
    description: 'Rhythmic metronomes, timed storytelling, and the Slow & Smooth Turtle',
    targetView: 'fluency-lab',
    icon: Activity,
    tags: ['fluency', 'stuttering', 'pacing', 'turtle', 'rate control', 'smooth speech']
  },
  {
    id: 'view-vocal-lab',
    title: 'Vocal Therapy Lab',
    category: 'Clinical Therapy',
    description: 'Acoustic pitch glides, Maximum Phonation Time (MPT), and Volume Garden',
    targetView: 'vocal-lab',
    icon: Activity,
    tags: ['vocal', 'voice', 'pitch', 'mpt', 'phonation', 'volume garden', 'decibel']
  },
  {
    id: 'view-scene-aac',
    title: 'Visual Scene AAC Boards',
    category: 'AAC & Communication',
    description: 'Contextual scene hotspots, Fitzgerald sentence strips, and voice output',
    targetView: 'scene-aac',
    icon: Sparkles,
    tags: ['aac', 'visual scene', 'communication', 'non-verbal', 'autism', 'sentence strip']
  },
  {
    id: 'view-parent-coaching',
    title: 'Parent Coaching Portal',
    category: 'Carryover & Home Care',
    description: 'Micro-dosing routines ("3 Words, 3 Minutes") and SLP video guides',
    targetView: 'parent-coaching',
    icon: Heart,
    tags: ['parent', 'home', 'carryover', 'micro dosing', 'slp', 'homework']
  },
  {
    id: 'view-clinical-research',
    title: 'Research & Outcome Analytics',
    category: 'Clinical Governance',
    description: 'Aggregate phonological patterns, dose-response modeling, HIPAA de-identified data',
    targetView: 'clinical-research',
    icon: ShieldCheck,
    tags: ['research', 'analytics', 'data', 'hipaa', 'dose response', 'outcomes', 'slp']
  },
  {
    id: 'view-stories',
    title: 'Interactive Story Time',
    category: 'Language & Literacy',
    description: 'Illustrated bilingual stories with interactive tap-to-define vocabulary',
    targetView: 'stories',
    icon: BookOpen,
    tags: ['stories', 'reading', 'books', 'comprehension', 'vocabulary', 'bilingual']
  },
  {
    id: 'view-settings',
    title: 'App Settings & Sensory Options',
    category: 'System',
    description: 'Adjust sensory themes, calming colors, speech synthesis speed, and mic devices',
    targetView: 'settings',
    icon: Settings,
    tags: ['settings', 'sensory', 'audio', 'theme', 'dark mode', 'high contrast', 'volume']
  }
];

export const QuickSearchCommandModal: React.FC<QuickSearchCommandModalProps> = ({
  isOpen,
  onClose,
  onSelectView
}) => {
  const [query, setQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          setQuery('');
          sfx.playTap();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return SEARCH_CATALOG;

    return SEARCH_CATALOG.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query]);

  const handleSelectItem = (item: SearchItem) => {
    sfx.playWhoosh();
    onSelectView(item.targetView);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center p-4 pt-16 sm:pt-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/70">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search exercises, sounds (/r/, /s/), games, apraxia, or AAC tools..."
            className="w-full bg-transparent border-none outline-none text-slate-900 font-medium text-sm sm:text-base placeholder:text-slate-400"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 space-y-1 divide-y divide-slate-50 flex-1">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className="w-full p-3.5 rounded-2xl hover:bg-indigo-50/70 text-left flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-700 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 group-hover:text-indigo-950">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                </button>
              );
            })
          ) : (
            <div className="p-10 text-center space-y-2">
              <span className="text-4xl block">🔍</span>
              <p className="text-sm font-bold text-slate-700">No matching activities found</p>
              <p className="text-xs text-slate-400">Try searching for "apraxia", "fluency", "vocal", or "minimal pairs".</p>
            </div>
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 px-5">
          <span>Press <strong>ESC</strong> to exit</span>
          <span>Shortcut: <strong>Ctrl + K</strong> or <strong>⌘ + K</strong></span>
        </div>
      </motion.div>
    </div>
  );
};
