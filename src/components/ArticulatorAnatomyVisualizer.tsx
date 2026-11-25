import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Volume2, 
  Activity, 
  Info, 
  ShieldCheck, 
  Layers, 
  Eye,
  CheckCircle2,
  Play
} from 'lucide-react';
import { speakText } from '../utils/speechUtils';
import { Language } from '../types';
import { sfx } from '../utils/soundEffects';
import { toast } from 'sonner';

interface PhonemeAnatomyProfile {
  symbol: string;
  name: string;
  manner: 'Stop/Plosive' | 'Fricative' | 'Affricate' | 'Nasal' | 'Liquid' | 'Glide';
  place: 'Bilabial' | 'Labiodental' | 'Interdental' | 'Alveolar' | 'Palatal' | 'Velar' | 'Glottal';
  isVoiced: boolean;
  activeArticulators: string[];
  lipShape: 'neutral' | 'round' | 'spread' | 'closed' | 'labiodental';
  tonguePosture: 'flat' | 'alveolar_tip' | 'interdental' | 'palatal_arch' | 'velar_back' | 'retroflex_curl';
  velumState: 'elevated' | 'lowered';
  clinicalPrompt: string;
  exemplarWords: string[];
}

const PHONEME_PROFILES: PhonemeAnatomyProfile[] = [
  {
    symbol: '/s/',
    name: 'Voiceless Alveolar Fricative',
    manner: 'Fricative',
    place: 'Alveolar',
    isVoiced: false,
    activeArticulators: ['Tongue Tip / Blade', 'Alveolar Ridge', 'Upper Teeth'],
    lipShape: 'spread',
    tonguePosture: 'alveolar_tip',
    velumState: 'elevated',
    clinicalPrompt: 'Keep tongue tip elevated behind teeth ridge, direct narrow steady central airstream ("Snake sound").',
    exemplarWords: ['Sun', 'Soap', 'Messy', 'Bus']
  },
  {
    symbol: '/z/',
    name: 'Voiced Alveolar Fricative',
    manner: 'Fricative',
    place: 'Alveolar',
    isVoiced: true,
    activeArticulators: ['Tongue Tip', 'Alveolar Ridge', 'Vocal Folds (Glottis)'],
    lipShape: 'spread',
    tonguePosture: 'alveolar_tip',
    velumState: 'elevated',
    clinicalPrompt: 'Same tongue groove as /s/, but turn on motor vocal fold vibration ("Buzzy bee sound").',
    exemplarWords: ['Zoo', 'Zipper', 'Buzz', 'Music']
  },
  {
    symbol: '/r/',
    name: 'Voiced Post-Alveolar / Palatal Approximant',
    manner: 'Liquid',
    place: 'Palatal',
    isVoiced: true,
    activeArticulators: ['Tongue Body', 'Hard Palate', 'Lateral Teeth Contacts', 'Vocal Folds'],
    lipShape: 'round',
    tonguePosture: 'retroflex_curl',
    velumState: 'elevated',
    clinicalPrompt: 'Elevate tongue sides against upper molars, curve or bunch tongue back without touching the roof.',
    exemplarWords: ['Red', 'Rabbit', 'Car', 'Door']
  },
  {
    symbol: '/l/',
    name: 'Voiced Alveolar Lateral Liquid',
    manner: 'Liquid',
    place: 'Alveolar',
    isVoiced: true,
    activeArticulators: ['Tongue Tip', 'Alveolar Ridge', 'Vocal Folds'],
    lipShape: 'neutral',
    tonguePosture: 'alveolar_tip',
    velumState: 'elevated',
    clinicalPrompt: 'Firm tongue tip contact on bumpy alveolar ridge; air flows freely around the lowered lateral sides.',
    exemplarWords: ['Lion', 'Lemon', 'Ball', 'Apple']
  },
  {
    symbol: '/k/',
    name: 'Voiceless Velar Stop',
    manner: 'Stop/Plosive',
    place: 'Velar',
    isVoiced: false,
    activeArticulators: ['Tongue Dorsum (Back)', 'Velum (Soft Palate)'],
    lipShape: 'neutral',
    tonguePosture: 'velar_back',
    velumState: 'elevated',
    clinicalPrompt: 'Elevate back of tongue firmly against soft palate to build intraoral pressure, then pop release.',
    exemplarWords: ['Cat', 'Cookie', 'Kite', 'Duck']
  },
  {
    symbol: '/g/',
    name: 'Voiced Velar Stop',
    manner: 'Stop/Plosive',
    place: 'Velar',
    isVoiced: true,
    activeArticulators: ['Tongue Dorsum (Back)', 'Velum (Soft Palate)', 'Vocal Folds'],
    lipShape: 'neutral',
    tonguePosture: 'velar_back',
    velumState: 'elevated',
    clinicalPrompt: 'Back of tongue contacts soft palate with vocal cords humming actively.',
    exemplarWords: ['Go', 'Game', 'Dog', 'Big']
  },
  {
    symbol: '/m/',
    name: 'Voiced Bilabial Nasal',
    manner: 'Nasal',
    place: 'Bilabial',
    isVoiced: true,
    activeArticulators: ['Upper Lip', 'Lower Lip', 'Velum (Lowered)', 'Vocal Folds'],
    lipShape: 'closed',
    tonguePosture: 'flat',
    velumState: 'lowered',
    clinicalPrompt: 'Lips sealed tightly, soft palate lowers to allow resonant vocal air to stream through the nasal cavity.',
    exemplarWords: ['Moon', 'Milk', 'Yummy', 'Home']
  },
  {
    symbol: '/p/',
    name: 'Voiceless Bilabial Stop',
    manner: 'Stop/Plosive',
    place: 'Bilabial',
    isVoiced: false,
    activeArticulators: ['Upper Lip', 'Lower Lip'],
    lipShape: 'closed',
    tonguePosture: 'flat',
    velumState: 'elevated',
    clinicalPrompt: 'Seal lips together firmly, build up burst of air, and pop open without voicing.',
    exemplarWords: ['Pop', 'Pig', 'Puppy', 'Cup']
  },
  {
    symbol: '/b/',
    name: 'Voiced Bilabial Stop',
    manner: 'Stop/Plosive',
    place: 'Bilabial',
    isVoiced: true,
    activeArticulators: ['Upper Lip', 'Lower Lip', 'Vocal Folds'],
    lipShape: 'closed',
    tonguePosture: 'flat',
    velumState: 'elevated',
    clinicalPrompt: 'Bilabial seal with immediate vocal fold vibration at release.',
    exemplarWords: ['Ball', 'Bear', 'Baby', 'Tub']
  },
  {
    symbol: '/f/',
    name: 'Voiceless Labiodental Fricative',
    manner: 'Fricative',
    place: 'Labiodental',
    isVoiced: false,
    activeArticulators: ['Upper Incisors', 'Lower Lip'],
    lipShape: 'labiodental',
    tonguePosture: 'flat',
    velumState: 'elevated',
    clinicalPrompt: 'Gently place upper front teeth on inner lower lip; blow steady cool air.',
    exemplarWords: ['Fish', 'Fun', 'Coffee', 'Leaf']
  },
  {
    symbol: '/θ/',
    name: 'Voiceless Interdental Fricative (TH)',
    manner: 'Fricative',
    place: 'Interdental',
    isVoiced: false,
    activeArticulators: ['Tongue Tip', 'Upper & Lower Teeth'],
    lipShape: 'neutral',
    tonguePosture: 'interdental',
    velumState: 'elevated',
    clinicalPrompt: 'Place tongue tip gently between front teeth, blow soft air over the blade.',
    exemplarWords: ['Thumb', 'Think', 'Tooth', 'Bath']
  },
  {
    symbol: '/ʃ/',
    name: 'Voiceless Post-Alveolar Fricative (SH)',
    manner: 'Fricative',
    place: 'Palatal',
    isVoiced: false,
    activeArticulators: ['Tongue Blade', 'Hard Palate', 'Rounded Lips'],
    lipShape: 'round',
    tonguePosture: 'palatal_arch',
    velumState: 'elevated',
    clinicalPrompt: 'Pucker lips into a gentle trumpet shape, arch tongue blade towards hard palate ("Quiet sound").',
    exemplarWords: ['Ship', 'Shoe', 'Fish', 'Brush']
  }
];

export const ArticulatorAnatomyVisualizer: React.FC = () => {
  const [selectedPhonemeIndex, setSelectedPhonemeIndex] = useState<number>(0);
  const currentPhoneme = PHONEME_PROFILES[selectedPhonemeIndex];

  const handlePlaySound = (word?: string) => {
    sfx.playTap();
    const textToSpeak = word || currentPhoneme.exemplarWords[0];
    speakText(textToSpeak, Language.ENGLISH);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Vocal Tract Sagittal Cross-Section Simulator
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Articulator Anatomy Explorer
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Interactive anatomical cross-section mapping active articulatory postures, tongue placement, velopharyngeal port gating, and vocal fold voicing.
          </p>
        </div>

        {/* Voicing Badge */}
        <div className={`px-5 py-3 rounded-2xl border flex items-center gap-3 ${
          currentPhoneme.isVoiced 
            ? 'bg-amber-50 border-amber-300 text-amber-950' 
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className={`w-3.5 h-3.5 rounded-full ${
            currentPhoneme.isVoiced ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
          }`} />
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest block">Glottal Voicing</span>
            <span className="text-xs font-black">
              {currentPhoneme.isVoiced ? 'Voiced (Vibrating)' : 'Voiceless (Silent Breath)'}
            </span>
          </div>
        </div>
      </div>

      {/* Phoneme Quick Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {PHONEME_PROFILES.map((p, idx) => {
          const isSelected = idx === selectedPhonemeIndex;
          return (
            <button
              key={p.symbol}
              onClick={() => {
                sfx.playPop();
                setSelectedPhonemeIndex(idx);
              }}
              className={`px-4 py-2.5 rounded-2xl font-mono font-black text-sm transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md scale-105'
                  : 'bg-white text-slate-700 hover:bg-indigo-50 border border-slate-200'
              }`}
            >
              {p.symbol}
            </button>
          );
        })}
      </div>

      {/* Main Interactive Diagram & Clinical Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sagittal Cross Section Diagram (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                {currentPhoneme.place} • {currentPhoneme.manner}
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1">{currentPhoneme.name}</h3>
            </div>

            <button
              onClick={() => handlePlaySound()}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              Hear Target Audio
            </button>
          </div>

          {/* SVG Sagittal Anatomical Cross-Section */}
          <div className="relative bg-slate-900 rounded-3xl p-6 flex items-center justify-center overflow-hidden min-h-[320px]">
            {/* Vocal Tract Outline SVG */}
            <svg viewBox="0 0 400 320" className="w-full max-w-[360px] h-auto">
              {/* Hard Palate & Upper Jaw Outline */}
              <path
                d="M 50 140 Q 60 110 90 90 Q 140 70 200 70 Q 240 70 270 90 L 270 120"
                fill="none"
                stroke="#64748b"
                strokeWidth="4"
              />

              {/* Upper Front Teeth */}
              <rect x="75" y="115" width="12" height="18" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Lower Front Teeth */}
              <rect
                x="78"
                y={currentPhoneme.lipShape === 'labiodental' ? '145' : '155'}
                width="12"
                height="18"
                rx="2"
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />

              {/* Alveolar Ridge Marker */}
              <circle
                cx="115"
                cy="92"
                r="6"
                fill={currentPhoneme.place === 'Alveolar' ? '#818cf8' : '#334155'}
                className={currentPhoneme.place === 'Alveolar' ? 'animate-pulse' : ''}
              />
              <text x="115" y="80" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
                Alveolar
              </text>

              {/* Velum / Soft Palate */}
              <motion.path
                d={
                  currentPhoneme.velumState === 'lowered'
                    ? 'M 200 70 Q 230 80 250 110' // Lowered (Nasal)
                    : 'M 200 70 Q 240 70 265 85' // Elevated (Oral seal)
                }
                fill="none"
                stroke={currentPhoneme.velumState === 'lowered' ? '#38bdf8' : '#f472b6'}
                strokeWidth="6"
                strokeLinecap="round"
              />
              <text x="255" y="65" fill="#94a3b8" fontSize="10" fontWeight="bold">
                Velum ({currentPhoneme.velumState})
              </text>

              {/* Tongue Body with dynamic morphing */}
              <motion.path
                d={
                  currentPhoneme.tonguePosture === 'alveolar_tip'
                    ? 'M 85 180 Q 115 100 135 150 Q 180 180 220 220' // Tip touching alveolar
                    : currentPhoneme.tonguePosture === 'velar_back'
                    ? 'M 85 180 Q 120 170 190 85 Q 210 160 220 220' // Back elevated to velum
                    : currentPhoneme.tonguePosture === 'retroflex_curl'
                    ? 'M 85 180 Q 105 110 120 110 Q 150 160 220 220' // Curled tip
                    : currentPhoneme.tonguePosture === 'interdental'
                    ? 'M 70 135 Q 110 160 160 165 Q 190 190 220 220' // Tongue protruded
                    : currentPhoneme.tonguePosture === 'palatal_arch'
                    ? 'M 85 180 Q 140 100 170 140 Q 190 180 220 220' // Palatal arch
                    : 'M 85 180 Q 130 170 170 170 Q 200 190 220 220' // Flat
                }
                fill="#fda4af"
                stroke="#e11d48"
                strokeWidth="4"
                strokeLinecap="round"
                animate={{
                  scale: [1, 1.02, 1]
                }}
                transition={{ repeat: Infinity, duration: 2 }}
              />

              {/* Vocal Cords / Glottis Indicator */}
              <circle
                cx="220"
                cy="235"
                r="10"
                fill={currentPhoneme.isVoiced ? '#f59e0b' : '#334155'}
                className={currentPhoneme.isVoiced ? 'animate-ping opacity-75' : ''}
              />
              <circle
                cx="220"
                cy="235"
                r="6"
                fill={currentPhoneme.isVoiced ? '#f59e0b' : '#475569'}
              />
              <text x="220" y="260" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">
                Vocal Folds ({currentPhoneme.isVoiced ? 'Voiced' : 'Voiceless'})
              </text>

              {/* Lips Indicator */}
              <motion.path
                d={
                  currentPhoneme.lipShape === 'closed'
                    ? 'M 60 120 Q 65 135 60 150' // Bilabial contact
                    : currentPhoneme.lipShape === 'round'
                    ? 'M 50 115 Q 40 135 50 155' // Rounded protrusion
                    : 'M 65 115 Q 70 135 65 155' // Neutral
                }
                fill="none"
                stroke="#f43f5e"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <text x="45" y="105" textAnchor="middle" fill="#fda4af" fontSize="10" fontWeight="bold">
                Lips
              </text>
            </svg>
          </div>

          {/* Active Articulators List Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-1">Active Contact:</span>
            {currentPhoneme.activeArticulators.map((art) => (
              <span
                key={art}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-bold"
              >
                {art}
              </span>
            ))}
          </div>
        </div>

        {/* Clinical Coaching Guide & Word Bank (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* SLP Clinical Prompt Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-bold w-fit">
              <Info className="w-3.5 h-3.5 text-amber-600" />
              Verbal & Tactile Cueing Guide
            </div>

            <p className="text-sm font-medium text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              "{currentPhoneme.clinicalPrompt}"
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Place of Articulation:</span>
                <span className="font-bold text-slate-900">{currentPhoneme.place}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Manner of Articulation:</span>
                <span className="font-bold text-slate-900">{currentPhoneme.manner}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Glottal Voicing:</span>
                <span className="font-bold text-slate-900">{currentPhoneme.isVoiced ? 'Voiced (+V)' : 'Voiceless (-V)'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 font-medium">Nasal Port:</span>
                <span className="font-bold text-slate-900">{currentPhoneme.velumState === 'lowered' ? 'Open (Nasal Flow)' : 'Closed (Oral Flow)'}</span>
              </div>
            </div>
          </div>

          {/* Exemplar Words Practice Bank */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-4">
            <h4 className="text-base font-black text-slate-900">Exemplar Practice Words</h4>
            <div className="grid grid-cols-2 gap-2.5">
              {currentPhoneme.exemplarWords.map((word) => (
                <button
                  key={word}
                  onClick={() => handlePlaySound(word)}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-left flex items-center justify-between group transition-all"
                >
                  <span className="font-black text-sm text-slate-800 group-hover:text-indigo-600">
                    {word}
                  </span>
                  <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 fill-current" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
