import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Volume2, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle, 
  BookOpen, 
  Award,
  Zap,
  Target,
  RefreshCw,
  Shuffle,
  Eye
} from 'lucide-react';
import { speakText } from '../utils/speechUtils';
import { Language } from '../types';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface MinimalPairCard {
  word: string;
  phoneme: string;
  ipa: string;
  features: string; // e.g. 'Voiceless alveolar fricative'
  emoji: string;
  sentenceContext: string;
}

interface ContrastSet {
  id: string;
  title: string;
  approach: 'minimal_pairs' | 'maximal_oppositions' | 'multiple_oppositions' | 'complexity_approach' | 'cycles';
  clinicalGoal: string;
  targetDescription: string;
  collapseSound?: string; // For multiple oppositions (e.g. /d/)
  cards: MinimalPairCard[];
}

const CONTRAST_SETS: ContrastSet[] = [
  // 1. Complexity-Based Targets
  {
    id: 'complexity-clusters',
    title: 'Complexity Approach: 3-Element Clusters (/str- & spl-/)',
    approach: 'complexity_approach',
    clinicalGoal: 'Targeting marked, non-stimulable 3-consonant clusters to trigger cascade generalization to 2-element clusters and singletons without direct teaching.',
    targetDescription: 'Harder cluster sounds induce broader phonological reorganization across the entire consonant inventory.',
    cards: [
      { word: 'Street', phoneme: '/str-/', ipa: 'stɹit', features: 'Complex coronal glide cluster (Obstruent + Stop + Liquid)', emoji: '🛣️', sentenceContext: 'The yellow car drove down the street.' },
      { word: 'Splash', phoneme: '/spl-/', ipa: 'splæʃ', features: 'Complex labial lateral cluster (Fricative + Labial Stop + Lateral)', emoji: '💦', sentenceContext: 'He made a big splash in the water.' },
      { word: 'String', phoneme: '/str-/', ipa: 'stɹɪŋ', features: '3-element alveolar onset', emoji: '🧶', sentenceContext: 'The kitten plays with a ball of string.' },
      { word: 'Split', phoneme: '/spl-/', ipa: 'splɪt', features: 'Voiceless onset cluster', emoji: '🍌', sentenceContext: 'We shared a delicious banana split.' }
    ]
  },

  // 2. Maximal Oppositions
  {
    id: 'max-k-vs-m',
    title: 'Maximal Oppositions: /k/ vs /m/',
    approach: 'maximal_oppositions',
    clinicalGoal: 'Contrasting phonemes with maximum distinctive feature differences across Major Class, Place, Manner, and Voicing.',
    targetDescription: 'Targeting a known sound vs an unknown sound with maximally distinct acoustic features helps children build distinct phonological representations.',
    cards: [
      { word: 'Key', phoneme: '/k/', ipa: 'ki', features: 'Voiceless Velar Stop (Oral, Non-sonorant)', emoji: '🔑', sentenceContext: 'Unlock the magic door with the key.' },
      { word: 'Me', phoneme: '/m/', ipa: 'mi', features: 'Voiced Bilabial Nasal (Sonorant, [+Nasal])', emoji: '🙋', sentenceContext: 'Give the shiny toy to me.' },
      { word: 'Cap', phoneme: '/k/', ipa: 'kæp', features: 'Velar Stop constriction', emoji: '🧢', sentenceContext: 'He wore a blue baseball cap.' },
      { word: 'Map', phoneme: '/m/', ipa: 'mæp', features: 'Bilabial nasal sonorant', emoji: '🗺️', sentenceContext: 'Look at the pirate treasure map.' }
    ]
  },

  // 3. Multiple Oppositions (Phoneme Collapse)
  {
    id: 'multi-collapse-d',
    title: 'Multiple Oppositions: Phoneme Collapse to /d/',
    approach: 'multiple_oppositions',
    clinicalGoal: 'Resolving extensive phoneme collapse where multiple target phonemes (/g, k, s, ʃ, tʃ/) are all substituted by /d/.',
    collapseSound: '/d/',
    targetDescription: 'Simultaneously teaching the substituted phoneme (/d/) against all collapsed target sounds creates systemic contrast in phonology.',
    cards: [
      { word: 'Doe', phoneme: '/d/ (Substituted Base)', ipa: 'doʊ', features: 'Voiced Alveolar Stop (The Collapse Anchor)', emoji: '🦌', sentenceContext: 'The gentle doe ran in the forest.' },
      { word: 'Go', phoneme: '/g/ (Target 1)', ipa: 'ɡoʊ', features: 'Voiced Velar Stop (Place contrast)', emoji: '🟢', sentenceContext: 'Ready, set, go!' },
      { word: 'Co', phoneme: '/k/ (Target 2)', ipa: 'koʊ', features: 'Voiceless Velar Stop (Voicing + Place)', emoji: '🏢', sentenceContext: 'Co-workers work together.' },
      { word: 'Sew', phoneme: '/s/ (Target 3)', ipa: 'soʊ', features: 'Voiceless Alveolar Fricative (Manner contrast)', emoji: '🪡', sentenceContext: 'Sew the button on the coat.' },
      { word: 'Show', phoneme: '/ʃ/ (Target 4)', ipa: 'ʃoʊ', features: 'Voiceless Postalveolar Fricative (Place + Manner)', emoji: '🎬', sentenceContext: 'Watch the fun movie show.' }
    ]
  },

  // 4. Classic Minimal Pairs (Fronting /t/ vs /k/)
  {
    id: 'min-pair-fronting',
    title: 'Minimal Pairs: Velar Fronting (/t/ vs /k/)',
    approach: 'minimal_pairs',
    clinicalGoal: 'Direct contrast between standard phonological fronting substitute and velar target to develop auditory discrimination.',
    targetDescription: 'Single feature difference (Alveolar vs Velar place of articulation).',
    cards: [
      { word: 'Tea', phoneme: '/t/', ipa: 'ti', features: 'Voiceless Alveolar Stop (Front sound)', emoji: '🍵', sentenceContext: 'Grandma drinks warm mint tea.' },
      { word: 'Key', phoneme: '/k/', ipa: 'ki', features: 'Voiceless Velar Stop (Back sound)', emoji: '🔑', sentenceContext: 'The gold key opens the chest.' },
      { word: 'Tape', phoneme: '/t/', ipa: 'teɪp', features: 'Front alveolar placement', emoji: '📦', sentenceContext: 'Stick the box with tape.' },
      { word: 'Cape', phoneme: '/k/', ipa: 'keɪp', features: 'Back velar placement', emoji: '🦸', sentenceContext: 'The superhero wears a red cape.' }
    ]
  },
  {
    id: 'process-backing',
    title: 'Backing: front sound contrasted with back sound',
    approach: 'minimal_pairs',
    clinicalGoal: 'Practice noticing and producing contrasts in place of articulation with clinician-selected examples.',
    targetDescription: 'The bundled examples include a front-to-back place contrast; choose examples appropriate for the learner.',
    cards: [
      { word: 'Tea', phoneme: '/t/', ipa: 'ti', features: 'Alveolar stop; tongue tip at the ridge', emoji: '🍵', sentenceContext: 'The cup has warm tea.' },
      { word: 'Key', phoneme: '/k/', ipa: 'ki', features: 'Velar stop; back of tongue lifts', emoji: '🔑', sentenceContext: 'The key is on the table.' },
      { word: 'Dough', phoneme: '/d/', ipa: 'doʊ', features: 'Voiced alveolar stop', emoji: '🍞', sentenceContext: 'We made dough for bread.' },
      { word: 'Go', phoneme: '/g/', ipa: 'ɡoʊ', features: 'Voiced velar stop', emoji: '🟢', sentenceContext: 'Ready, set, go!' }
    ]
  },
  {
    id: 'process-stopping',
    title: 'Stopping: continuous sound vs. stop sound',
    approach: 'minimal_pairs',
    clinicalGoal: 'Practice hearing the difference between continuous airflow sounds and brief stop sounds.',
    targetDescription: 'Listen to a model and choose the matching picture/word; examples are clinician-led.',
    cards: [
      { word: 'Sun', phoneme: '/s/', ipa: 'sʌn', features: 'Continuous voiceless fricative', emoji: '☀️', sentenceContext: 'The sun is bright.' },
      { word: 'Tea', phoneme: '/t/', ipa: 'ti', features: 'Brief voiceless stop', emoji: '🍵', sentenceContext: 'The tea is warm.' },
      { word: 'Fan', phoneme: '/f/', ipa: 'fæn', features: 'Continuous lip-to-teeth airflow', emoji: '🪭', sentenceContext: 'Turn on the fan.' },
      { word: 'Pan', phoneme: '/p/', ipa: 'pæn', features: 'Brief lip stop release', emoji: '🍳', sentenceContext: 'The pan is hot.' }
    ]
  },
  {
    id: 'process-gliding',
    title: 'Gliding: liquid vs. glide',
    approach: 'minimal_pairs',
    clinicalGoal: 'Practice listening to contrasts between liquid and glide sounds.',
    targetDescription: 'Short word pairs support repeated listening and clinician-guided discussion.',
    cards: [
      { word: 'Ring', phoneme: '/r/', ipa: 'rɪŋ', features: 'Liquid onset', emoji: '💍', sentenceContext: 'The ring is shiny.' },
      { word: 'Wing', phoneme: '/w/', ipa: 'wɪŋ', features: 'Glide onset', emoji: '🪽', sentenceContext: 'The bird has a wing.' },
      { word: 'Lamb', phoneme: '/l/', ipa: 'læm', features: 'Lateral liquid onset', emoji: '🐑', sentenceContext: 'The lamb is soft.' },
      { word: 'Yam', phoneme: '/j/', ipa: 'jæm', features: 'Palatal glide onset', emoji: '🍠', sentenceContext: 'We ate a yam.' }
    ]
  },
  {
    id: 'process-cluster-reduction',
    title: 'Cluster reduction: one sound vs. a blend',
    approach: 'minimal_pairs',
    clinicalGoal: 'Practice attending to both sounds in a consonant blend.',
    targetDescription: 'Listen for the complete onset and compare the bundled word examples.',
    cards: [
      { word: 'Spot', phoneme: '/sp/', ipa: 'spɑt', features: 'Two-consonant onset blend', emoji: '⚪', sentenceContext: 'I see a spot.' },
      { word: 'Pot', phoneme: '/p/', ipa: 'pɑt', features: 'Single-consonant onset', emoji: '🍲', sentenceContext: 'The pot is on the stove.' },
      { word: 'Star', phoneme: '/st/', ipa: 'stɑr', features: 'Two-consonant onset blend', emoji: '⭐', sentenceContext: 'The star is bright.' },
      { word: 'Tar', phoneme: '/t/', ipa: 'tɑr', features: 'Single-consonant onset', emoji: '🛣️', sentenceContext: 'The road has tar.' }
    ]
  },
  {
    id: 'process-final-consonant-deletion',
    title: 'Final consonants: listen for the word ending',
    approach: 'minimal_pairs',
    clinicalGoal: 'Practice noticing and producing final consonants in short words.',
    targetDescription: 'Contrast a complete word ending with an open syllable; clinician may model both options.',
    cards: [
      { word: 'Bee', phoneme: 'open ending', ipa: 'bi', features: 'Open syllable with no final consonant', emoji: '🐝', sentenceContext: 'A bee is buzzing.' },
      { word: 'Beep', phoneme: 'final /p/', ipa: 'bip', features: 'Final voiceless bilabial stop', emoji: '🚗', sentenceContext: 'The car can beep.' },
      { word: 'Bow', phoneme: 'open ending', ipa: 'boʊ', features: 'Open syllable with no final consonant', emoji: '🎀', sentenceContext: 'Tie a bow.' },
      { word: 'Boat', phoneme: 'final /t/', ipa: 'boʊt', features: 'Final voiceless alveolar stop', emoji: '🚤', sentenceContext: 'The boat is blue.' }
    ]
  },
  {
    id: 'process-weak-syllable-deletion',
    title: 'Weak syllables: full word sequencing',
    approach: 'cycles',
    clinicalGoal: 'Practice hearing and sequencing all syllables in familiar multisyllabic words.',
    targetDescription: 'Use the word, syllable taps, and sentence model as a clinician-led activity.',
    cards: [
      { word: 'Banana', phoneme: '3 syllables', ipa: 'bəˈnænə', features: 'ba • na • na', emoji: '🍌', sentenceContext: 'I peeled a banana.' },
      { word: 'Nana', phoneme: '2 syllables', ipa: 'nænə', features: 'na • na', emoji: '👵', sentenceContext: 'Nana is here.' },
      { word: 'Computer', phoneme: '3 syllables', ipa: 'kəmˈpjutər', features: 'com • pu • ter', emoji: '💻', sentenceContext: 'The computer is on.' },
      { word: 'puter', phoneme: '2 syllables', ipa: 'pjutər', features: 'pu • ter', emoji: '🧩', sentenceContext: 'Say the whole word together.' }
    ]
  },
  {
    id: 'cycles-round',
    title: 'Cycles activity: rotate sound patterns',
    approach: 'cycles',
    clinicalGoal: 'A short rotation through bundled sound-pattern activities with repeated listening and production turns.',
    targetDescription: 'The sequence is an activity organizer, not an individualized treatment recommendation.',
    cards: [
      { word: 'Sun', phoneme: 'Stopping', ipa: 'sʌn', features: 'Continuous airflow', emoji: '☀️', sentenceContext: 'The sun is up.' },
      { word: 'Key', phoneme: 'Fronting / backing contrast', ipa: 'ki', features: 'Back-of-tongue placement', emoji: '🔑', sentenceContext: 'Find the key.' },
      { word: 'Spot', phoneme: 'Cluster reduction', ipa: 'spɑt', features: 'Keep both onset sounds', emoji: '⚪', sentenceContext: 'Find the spot.' },
      { word: 'Banana', phoneme: 'Weak syllable deletion', ipa: 'bəˈnænə', features: 'Tap each syllable', emoji: '🍌', sentenceContext: 'Eat a banana.' }
    ]
  }
];

export const ContrastEngineView: React.FC = () => {
  const [selectedSetId, setSelectedSetId] = useState<string>(CONTRAST_SETS[0].id);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [discriminationScore, setDiscriminationScore] = useState<number>(0);
  const [totalTrials, setTotalTrials] = useState<number>(0);
  const [isAuditoryGameActive, setIsAuditoryGameActive] = useState<boolean>(false);
  const [mysteryCard, setMysteryCard] = useState<MinimalPairCard | null>(null);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [cycleTurns, setCycleTurns] = useState(0);

  const currentSet = CONTRAST_SETS.find(s => s.id === selectedSetId) || CONTRAST_SETS[0];

  const handlePlayAudio = (text: string) => {
    speakText(text, Language.ENGLISH);
  };

  const startAuditoryDiscriminationGame = () => {
    const randomCard = currentSet.cards[Math.floor(Math.random() * currentSet.cards.length)];
    setMysteryCard(randomCard);
    setIsAuditoryGameActive(true);
    speakText(randomCard.word, Language.ENGLISH);
    toast.info(`Listen closely! Which card did the speech coach say?`);
  };

  const handleSelectAuditoryChoice = (card: MinimalPairCard) => {
    if (!mysteryCard) return;

    setTotalTrials(prev => prev + 1);
    if (card.word.toLowerCase() === mysteryCard.word.toLowerCase()) {
      setDiscriminationScore(prev => prev + 1);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
      toast.success(`Correct! "${card.word}" (${card.phoneme})`);
    } else {
      toast.error(`Not quite! The target was "${mysteryCard.word}". Listen again!`);
      speakText(mysteryCard.word, Language.ENGLISH);
    }

    // Pick next mystery card after brief delay
    setTimeout(() => {
      const nextCard = currentSet.cards[Math.floor(Math.random() * currentSet.cards.length)];
      setMysteryCard(nextCard);
      speakText(nextCard.word, Language.ENGLISH);
    }, 1200);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Phonological Contrast Suite
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            The Contrast Engine
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Evidence-based phonological interventions: <strong>Complexity Approach</strong>, <strong>Maximal Oppositions</strong>, and <strong>Multiple Oppositions</strong> for phoneme collapse.
          </p>
        </div>

        {/* Auditory Accuracy Counter */}
        <div className="bg-purple-50 border border-purple-200 px-5 py-3 rounded-2xl flex items-center gap-4">
          <Target className="w-7 h-7 text-purple-600" />
          <div>
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-widest block">
              Discrimination Accuracy
            </span>
            <span className="text-2xl font-black text-purple-950">
              {totalTrials > 0 ? `${Math.round((discriminationScore / totalTrials) * 100)}%` : '100%'}
            </span>
            <span className="text-[10px] text-purple-600 block">
              {discriminationScore} of {totalTrials} correct trials
            </span>
          </div>
        </div>
      </div>

      {/* Method Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CONTRAST_SETS.map((set) => {
          const isSelected = set.id === selectedSetId;
          return (
            <button
              key={set.id}
              onClick={() => {
                setSelectedSetId(set.id);
                setActiveCardIndex(0);
                setIsAuditoryGameActive(false);
                setMysteryCard(null);
                setCycleIndex(0);
                setCycleTurns(0);
              }}
              className={`p-4 rounded-2xl font-bold transition-all text-left border ${
                isSelected
                  ? 'bg-purple-900 text-white border-purple-900 shadow-lg scale-[1.02]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/40'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider block opacity-75 mb-1">
                {set.approach.replace('_', ' ')}
              </span>
              <p className="text-xs sm:text-sm font-black truncate">{set.title.split(':')[1] || set.title}</p>
            </button>
          );
        })}
      </div>

      {/* Clinical Rationale Box */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            Clinical Protocol & Rationales
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            {currentSet.clinicalGoal}
          </p>
          <p className="text-xs text-slate-400 italic">
            {currentSet.targetDescription}
          </p>
        </div>

        <button
          onClick={startAuditoryDiscriminationGame}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black text-xs uppercase tracking-wider shadow-lg hover:from-purple-600 hover:to-indigo-700 active:scale-95 transition-all flex items-center gap-2 shrink-0"
        >
          <Volume2 className="w-4 h-4" />
          {isAuditoryGameActive ? 'Replay Mystery Sound' : 'Play Discrimination Game'}
        </button>
      </div>

      {currentSet.approach === 'cycles' && (
        <section aria-labelledby="cycles-activity-title" className="rounded-3xl border border-teal-200 bg-teal-50 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-teal-800">Bundled activity sequence</span>
              <h2 id="cycles-activity-title" className="text-xl font-black text-slate-900">Cycles-style listening and practice turns</h2>
              <p className="text-xs text-slate-600">Repeat or move through the examples at the clinician’s direction. This activity does not select goals or recommend treatment.</p>
            </div>
            <span className="text-xs font-bold text-teal-900">Turn count: {cycleTurns}</span>
          </div>
          {(() => {
            const cycleCard = currentSet.cards[cycleIndex % currentSet.cards.length];
            return (
              <div className="rounded-2xl bg-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase text-teal-700">Activity {cycleIndex + 1} of {currentSet.cards.length} · {cycleCard.phoneme}</p>
                  <p className="text-2xl font-black text-slate-900">{cycleCard.emoji} {cycleCard.word}</p>
                  <p className="text-sm text-slate-600">{cycleCard.features}</p>
                  <p className="text-sm italic text-slate-500">“{cycleCard.sentenceContext}”</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(cycleCard.word)}
                    className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800"
                  ><Volume2 className="inline h-4 w-4 mr-1" />Hear word</button>
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(cycleCard.sentenceContext)}
                    className="rounded-xl border border-teal-200 bg-white px-4 py-2 text-sm font-bold text-teal-900 hover:bg-teal-50"
                  >Hear sentence</button>
                  <button
                    type="button"
                    onClick={() => setCycleTurns((turns) => turns + 1)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >Count practice turn</button>
                  <button
                    type="button"
                    onClick={() => setCycleIndex((index) => (index + 1) % currentSet.cards.length)}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                  >Next activity</button>
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* Contrast Matrix Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {currentSet.cards.map((card, idx) => {
          const isSelected = idx === activeCardIndex;
          const isCollapseAnchor = currentSet.approach === 'multiple_oppositions' && idx === 0;

          return (
            <motion.div
              key={card.word}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              onClick={() => {
                setActiveCardIndex(idx);
                if (isAuditoryGameActive) {
                  handleSelectAuditoryChoice(card);
                } else {
                  handlePlayAudio(card.word);
                }
              }}
              onKeyDown={(event) => {
                if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  setActiveCardIndex(idx);
                  if (isAuditoryGameActive) handleSelectAuditoryChoice(card);
                  else handlePlayAudio(card.word);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`${card.word}, ${card.phoneme}. ${isAuditoryGameActive ? 'Choose this word' : 'Play word model'}`}
              aria-pressed={isSelected}
              className={`p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isCollapseAnchor
                  ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/40'
                  : isSelected
                  ? 'bg-white border-purple-500 shadow-xl ring-2 ring-purple-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {isCollapseAnchor && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[9px] font-black uppercase tracking-wider">
                  Substituted Anchor
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                    {card.phoneme}
                  </span>
                  <span className="text-3xl">{card.emoji}</span>
                </div>

                <h3 className="text-3xl font-black text-slate-900 mb-1 font-mono tracking-tight">
                  {card.word}
                </h3>
                <p className="text-xs font-mono text-slate-400 mb-3">IPA: /{card.ipa}/</p>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Distinctive Features
                  </span>
                  <p className="text-xs text-slate-700 leading-snug">{card.features}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 italic mb-4">"{card.sentenceContext}"</p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayAudio(card.word);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-purple-200"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Hear Word
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayAudio(card.sentenceContext);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold text-xs transition-colors"
                    title="Hear Sentence Context"
                  >
                    Context
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
