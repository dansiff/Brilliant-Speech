import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Volume2, 
  CheckCircle2, 
  HelpCircle, 
  Award, 
  Trophy, 
  RotateCcw, 
  Target, 
  Compass, 
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Flame
} from 'lucide-react';
import { speakText } from '../utils/speechUtils';
import { Language } from '../types';
import { sfx } from '../utils/soundEffects';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface DirectionTask {
  id: string;
  level: '1-Step' | '2-Step' | 'Conditional & Spatial';
  promptAudio: string;
  expectedSequence: string[]; // item IDs to click in order
  sceneItems: Array<{ id: string; name: string; emoji: string; category: string }>;
  clinicalRationale: string;
}

interface WhQuestionItem {
  id: string;
  type: 'Who' | 'What' | 'Where' | 'When' | 'Why';
  question: string;
  correctAnswerId: string;
  explanation: string;
  options: Array<{ id: string; label: string; emoji: string }>;
}

const DIRECTION_TASKS: DirectionTask[] = [
  {
    id: 'dir-1',
    level: '1-Step',
    promptAudio: 'Touch the red apple.',
    expectedSequence: ['apple'],
    sceneItems: [
      { id: 'apple', name: 'Red Apple', emoji: '🍎', category: 'Food' },
      { id: 'banana', name: 'Yellow Banana', emoji: '🍌', category: 'Food' },
      { id: 'ball', name: 'Blue Soccer Ball', emoji: '⚽', category: 'Toy' }
    ],
    clinicalRationale: 'Direct single-attribute identification (Color + Noun).'
  },
  {
    id: 'dir-2',
    level: '2-Step',
    promptAudio: 'First touch the green frog, then touch the shiny star.',
    expectedSequence: ['frog', 'star'],
    sceneItems: [
      { id: 'frog', name: 'Green Frog', emoji: '🐸', category: 'Animal' },
      { id: 'star', name: 'Shiny Star', emoji: '⭐', category: 'Symbol' },
      { id: 'truck', name: 'Red Fire Truck', emoji: '🚒', category: 'Vehicle' },
      { id: 'hat', name: 'Yellow Hat', emoji: '👒', category: 'Clothing' }
    ],
    clinicalRationale: 'Sequential temporal memory processing (First... Then...).'
  },
  {
    id: 'dir-3',
    level: 'Conditional & Spatial',
    promptAudio: 'Before you tap the dog, tap the blue car, then tap the puppy!',
    expectedSequence: ['car', 'dog'],
    sceneItems: [
      { id: 'dog', name: 'Happy Puppy', emoji: '🐶', category: 'Animal' },
      { id: 'car', name: 'Blue Race Car', emoji: '🏎️', category: 'Vehicle' },
      { id: 'cookie', name: 'Chocolate Cookie', emoji: '🍪', category: 'Food' },
      { id: 'flower', name: 'Pink Flower', emoji: '🌸', category: 'Nature' }
    ],
    clinicalRationale: 'Complex conditional linguistic syntax with executive working memory load.'
  }
];

const WH_QUESTIONS: WhQuestionItem[] = [
  {
    id: 'wh-who-1',
    type: 'Who',
    question: 'Who helps put out fires and drives a big red fire truck?',
    correctAnswerId: 'firefighter',
    explanation: 'Firefighters wear protective gear and rush to put out fires safely!',
    options: [
      { id: 'chef', label: 'Chef', emoji: '👨‍🍳' },
      { id: 'firefighter', label: 'Firefighter', emoji: '👨‍🚒' },
      { id: 'pilot', label: 'Airplane Pilot', emoji: '👨‍✈️' }
    ]
  },
  {
    id: 'wh-where-1',
    type: 'Where',
    question: 'Where do we go to borrow storybooks and read quietly?',
    correctAnswerId: 'library',
    explanation: 'A library has shelves filled with wonderful books to read!',
    options: [
      { id: 'swimming_pool', label: 'Swimming Pool', emoji: '🏊' },
      { id: 'library', label: 'The Library', emoji: '📚' },
      { id: 'supermarket', label: 'Supermarket', emoji: '🛒' }
    ]
  },
  {
    id: 'wh-why-1',
    type: 'Why',
    question: 'Why do we use an umbrella when we go outside?',
    correctAnswerId: 'stay_dry',
    explanation: 'An umbrella shields us from raindrops so our clothes stay dry!',
    options: [
      { id: 'stay_dry', label: 'To stay dry in the rain', emoji: '☔' },
      { id: 'eat_snack', label: 'To eat a snack', emoji: '🥪' },
      { id: 'sleep', label: 'To go to sleep', emoji: '🛏️' }
    ]
  },
  {
    id: 'wh-what-1',
    type: 'What',
    question: 'What do we use to brush our teeth after eating?',
    correctAnswerId: 'toothbrush',
    explanation: 'We use a toothbrush and toothpaste to keep our teeth shiny and clean!',
    options: [
      { id: 'spoon', label: 'A big spoon', emoji: '🥄' },
      { id: 'toothbrush', label: 'Toothbrush', emoji: '🪥' },
      { id: 'pencil', label: 'Crayon pencil', emoji: '✏️' }
    ]
  }
];

export const ReceptiveLanguageArena: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'directions' | 'wh_quest'>('directions');
  
  // Directions Task State
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);
  const [userSequence, setUserSequence] = useState<string[]>([]);
  const [directionScore, setDirectionScore] = useState<number>(0);
  const [totalDirectionTrials, setTotalDirectionTrials] = useState<number>(0);

  // Wh Questions State
  const [currentWhIndex, setCurrentWhIndex] = useState<number>(0);
  const [selectedWhOption, setSelectedWhOption] = useState<string | null>(null);
  const [whScore, setWhScore] = useState<number>(0);
  const [totalWhAnswered, setTotalWhAnswered] = useState<number>(0);

  const currentTask = DIRECTION_TASKS[currentTaskIndex];
  const currentWh = WH_QUESTIONS[currentWhIndex];

  // Directions handlers
  const handlePlayDirectionAudio = () => {
    sfx.playTap();
    speakText(currentTask.promptAudio, Language.ENGLISH);
  };

  const handleTapSceneItem = (itemId: string) => {
    sfx.playPop();
    const updated = [...userSequence, itemId];
    setUserSequence(updated);

    // Check if current sequence matches expected sequence up to this point
    const isPrefixValid = updated.every((id, idx) => id === currentTask.expectedSequence[idx]);

    if (!isPrefixValid) {
      sfx.playRetry();
      toast.error('Oops! That was not the right sequence. Listen again!');
      speakText(currentTask.promptAudio, Language.ENGLISH);
      setUserSequence([]);
      return;
    }

    // If fully completed
    if (updated.length === currentTask.expectedSequence.length) {
      sfx.playSuccess();
      setDirectionScore((prev) => prev + 1);
      setTotalDirectionTrials((prev) => prev + 1);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      toast.success('🎉 Perfect! You followed the direction accurately!');

      setTimeout(() => {
        setUserSequence([]);
        setCurrentTaskIndex((prev) => (prev + 1) % DIRECTION_TASKS.length);
      }, 1400);
    }
  };

  // Wh Questions handlers
  const handleSelectWhChoice = (optionId: string) => {
    if (selectedWhOption) return; // already answered
    setSelectedWhOption(optionId);
    setTotalWhAnswered((prev) => prev + 1);

    if (optionId === currentWh.correctAnswerId) {
      sfx.playSuccess();
      setWhScore((prev) => prev + 1);
      confetti({ particleCount: 35, spread: 60 });
      toast.success(`Correct! ${currentWh.explanation}`);
      speakText(`Correct! ${currentWh.explanation}`, Language.ENGLISH);
    } else {
      sfx.playRetry();
      toast.error(`Not quite. ${currentWh.explanation}`);
      speakText(currentWh.explanation, Language.ENGLISH);
    }
  };

  const handleNextWhQuestion = () => {
    sfx.playTap();
    setSelectedWhOption(null);
    setCurrentWhIndex((prev) => (prev + 1) % WH_QUESTIONS.length);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Receptive Language & Auditory Processing
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Receptive Language Arena
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Train <strong>multi-step following directions</strong>, spatial prepositions, and <strong>Wh-Question</strong> reasoning comprehension.
          </p>
        </div>

        {/* Accuracy Counter */}
        <div className="bg-blue-50 border border-blue-200 px-5 py-3 rounded-2xl flex items-center gap-4">
          <Target className="w-7 h-7 text-blue-600" />
          <div>
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest block">
              Auditory Accuracy
            </span>
            <span className="text-2xl font-black text-blue-950">
              {totalDirectionTrials + totalWhAnswered > 0
                ? `${Math.round(((directionScore + whScore) / (totalDirectionTrials + totalWhAnswered)) * 100)}%`
                : '100%'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => {
            sfx.playTap();
            setActiveTab('directions');
          }}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            activeTab === 'directions'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Compass className="w-4 h-4 text-blue-400" />
          Multi-Step Following Directions
        </button>

        <button
          onClick={() => {
            sfx.playTap();
            setActiveTab('wh_quest');
          }}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            activeTab === 'wh_quest'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-purple-400" />
          Wh-Questions & Reasoning Quest
        </button>
      </div>

      {/* TAB 1: MULTI-STEP DIRECTIONS */}
      {activeTab === 'directions' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Level: {currentTask.level} (Task {currentTaskIndex + 1}/{DIRECTION_TASKS.length})
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Clinical Focus: {currentTask.clinicalRationale}
              </p>
            </div>

            <button
              onClick={handlePlayDirectionAudio}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-200 flex items-center gap-2 transition-all self-start sm:self-auto"
            >
              <Volume2 className="w-4 h-4" />
              Listen to Direction
            </button>
          </div>

          {/* Auditory Prompt Display Box */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200 text-center space-y-3">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest block">
              Audio Command Prompt
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono leading-relaxed">
              "{currentTask.promptAudio}"
            </h2>
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="text-xs text-slate-500">Your Progress:</span>
              <span className="font-mono text-xs font-bold text-blue-700">
                {userSequence.length} of {currentTask.expectedSequence.length} steps touched
              </span>
            </div>
          </div>

          {/* Interactive Scene Cards Arena */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {currentTask.sceneItems.map((item) => {
              const isTapped = userSequence.includes(item.id);
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleTapSceneItem(item.id)}
                  className={`p-6 rounded-3xl border text-center transition-all flex flex-col items-center justify-between min-h-[160px] ${
                    isTapped
                      ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/30'
                      : 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-white'
                  }`}
                >
                  <span className="text-5xl sm:text-6xl block mb-2">{item.emoji}</span>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">{item.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{item.category}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={() => {
                sfx.playTap();
                setUserSequence([]);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Current Step Sequence
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: WH-QUESTIONS QUEST */}
      {activeTab === 'wh_quest' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              {currentWh.type} Question (Card {currentWhIndex + 1}/{WH_QUESTIONS.length})
            </span>
            <button
              onClick={() => speakText(currentWh.question, Language.ENGLISH)}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Hear question audio"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Question Text Box */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-50 via-pink-50/40 to-slate-50 border border-purple-200 text-center space-y-2">
            <span className="text-5xl block animate-pulse">❓</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
              {currentWh.question}
            </h2>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {currentWh.options.map((option) => {
              const isSelected = selectedWhOption === option.id;
              const isCorrect = option.id === currentWh.correctAnswerId;

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectWhChoice(option.id)}
                  disabled={selectedWhOption !== null}
                  className={`p-6 rounded-3xl border text-center transition-all flex flex-col items-center justify-between min-h-[140px] ${
                    selectedWhOption !== null
                      ? isCorrect
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400'
                        : isSelected
                        ? 'bg-rose-50 border-rose-400 opacity-60'
                        : 'bg-slate-50 border-slate-200 opacity-40'
                      : 'bg-white border-slate-200 hover:border-purple-400 hover:shadow-md'
                  }`}
                >
                  <span className="text-5xl mb-2">{option.emoji}</span>
                  <span className="text-sm font-black text-slate-900">{option.label}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation Banner & Next Button */}
          {selectedWhOption !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <p className="text-xs text-purple-900 font-medium">
                💡 <strong>Clinical Insight:</strong> {currentWh.explanation}
              </p>

              <button
                onClick={handleNextWhQuestion}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 shadow-sm"
              >
                Next Question <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
