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
  Flame,
  BookOpen,
  Brain,
  Eye
} from 'lucide-react';
import { speakText } from '../utils/speechUtils';
import { Language } from '../types';
import { sfx } from '../utils/soundEffects';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface DirectionTask {
  id: string;
  level: '1-Step' | '2-Step' | '3-Step' | 'Conditional & Spatial';
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

interface ConceptQuestion {
  id: string;
  focus: 'Object identification' | 'Negation' | 'Spatial concepts' | 'Temporal concepts' | 'Semantic relationships';
  question: string;
  correctAnswerId: string;
  explanation: string;
  options: Array<{ id: string; label: string; emoji: string }>;
}

interface ListeningQuestion {
  title: string;
  passage: string;
  question: string;
  correctAnswerId: string;
  explanation: string;
  options: Array<{ id: string; label: string; emoji: string }>;
}

interface MemoryTrial {
  prompt: string;
  expectedSequence: string[];
  items: Array<{ id: string; label: string; emoji: string }>;
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
  },
  {
    id: 'dir-4',
    level: '3-Step',
    promptAudio: 'First touch the star, then touch the yellow hat, and finally touch the banana.',
    expectedSequence: ['star', 'hat', 'banana'],
    sceneItems: [
      { id: 'star', name: 'Bright Star', emoji: '⭐', category: 'Symbol' },
      { id: 'hat', name: 'Yellow Hat', emoji: '👒', category: 'Clothing' },
      { id: 'banana', name: 'Yellow Banana', emoji: '🍌', category: 'Food' },
      { id: 'dog', name: 'Brown Dog', emoji: '🐕', category: 'Animal' }
    ],
    clinicalRationale: 'Listen for sequence words and carry out three steps in order.'
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
  },
  {
    id: 'wh-when-1',
    type: 'When',
    question: 'When do many people see stars in the sky?',
    correctAnswerId: 'night',
    explanation: 'Stars are easiest to see at night when the sky is dark.',
    options: [
      { id: 'night', label: 'At night', emoji: '🌙' },
      { id: 'lunch', label: 'At lunchtime', emoji: '🥪' },
      { id: 'morning', label: 'During the morning', emoji: '🌅' }
    ]
  }
];

const CONCEPT_QUESTIONS: ConceptQuestion[] = [
  {
    id: 'concept-object',
    focus: 'Object identification',
    question: 'Which object do we use to brush our teeth?',
    correctAnswerId: 'brush',
    explanation: 'A toothbrush is used to brush teeth.',
    options: [
      { id: 'brush', label: 'Toothbrush', emoji: '🪥' },
      { id: 'comb', label: 'Comb', emoji: '🪮' },
      { id: 'spoon', label: 'Spoon', emoji: '🥄' }
    ]
  },
  {
    id: 'concept-negation',
    focus: 'Negation',
    question: 'Which one is NOT a fruit?',
    correctAnswerId: 'carrot',
    explanation: 'A carrot is a vegetable, not a fruit.',
    options: [
      { id: 'apple', label: 'Apple', emoji: '🍎' },
      { id: 'grape', label: 'Grapes', emoji: '🍇' },
      { id: 'carrot', label: 'Carrot', emoji: '🥕' }
    ]
  },
  {
    id: 'concept-spatial',
    focus: 'Spatial concepts',
    question: 'The cat is under the table. Where is the cat?',
    correctAnswerId: 'under',
    explanation: 'Under means below or beneath the table.',
    options: [
      { id: 'under', label: 'Under the table', emoji: '🐈' },
      { id: 'on', label: 'On the table', emoji: '🐈' },
      { id: 'beside', label: 'Beside the table', emoji: '🐈' }
    ]
  },
  {
    id: 'concept-temporal',
    focus: 'Temporal concepts',
    question: 'You put on your pajamas after you take a bath. What happens first?',
    correctAnswerId: 'bath',
    explanation: 'After tells us the bath happens first, then pajamas.',
    options: [
      { id: 'bath', label: 'Take a bath', emoji: '🛁' },
      { id: 'pajamas', label: 'Put on pajamas', emoji: '🛌' },
      { id: 'breakfast', label: 'Eat breakfast', emoji: '🥣' }
    ]
  },
  {
    id: 'concept-relationship',
    focus: 'Semantic relationships',
    question: 'Which item goes with a lock?',
    correctAnswerId: 'key',
    explanation: 'A key is used to open or lock many locks.',
    options: [
      { id: 'key', label: 'Key', emoji: '🔑' },
      { id: 'sock', label: 'Sock', emoji: '🧦' },
      { id: 'leaf', label: 'Leaf', emoji: '🍃' }
    ]
  }
];

const LISTENING_QUESTIONS: ListeningQuestion[] = [
  {
    title: 'The lost mitten',
    passage: 'On a cold morning, Mia put on her red coat and walked to school. At recess, she noticed one mitten was missing. Her friend Leo spotted it beside the playground slide and gave it back.',
    question: 'Where did Leo find the mitten?',
    correctAnswerId: 'slide',
    explanation: 'Leo found the mitten beside the playground slide.',
    options: [
      { id: 'classroom', label: 'In the classroom', emoji: '🏫' },
      { id: 'slide', label: 'Beside the slide', emoji: '🛝' },
      { id: 'bus', label: 'On the bus', emoji: '🚌' }
    ]
  },
  {
    title: 'A garden surprise',
    passage: 'Noah planted three seeds in a pot. He watered the soil and put the pot by a sunny window. After several days, small green leaves appeared.',
    question: 'What helped the seeds grow?',
    correctAnswerId: 'water-sun',
    explanation: 'Noah watered the soil and placed the pot by a sunny window.',
    options: [
      { id: 'water-sun', label: 'Water and sunlight', emoji: '💧☀️' },
      { id: 'snow', label: 'Snow and ice', emoji: '❄️' },
      { id: 'toy', label: 'A toy truck', emoji: '🚚' }
    ]
  },
  {
    title: 'The rainy walk',
    passage: 'The sky grew dark and raindrops began to fall. Ava opened her umbrella before walking home. When she arrived, her jacket was dry.',
    question: 'Why did Ava open her umbrella?',
    correctAnswerId: 'rain',
    explanation: 'The umbrella helped keep Ava dry in the rain.',
    options: [
      { id: 'rain', label: 'To stay dry', emoji: '☂️' },
      { id: 'sun', label: 'To block the sun', emoji: '🌞' },
      { id: 'fly', label: 'To fly home', emoji: '🪽' }
    ]
  }
];

const MEMORY_TRIALS: MemoryTrial[] = [
  {
    prompt: 'Remember the order of three items.',
    expectedSequence: ['apple', 'bell', 'star'],
    items: [
      { id: 'apple', label: 'Apple', emoji: '🍎' },
      { id: 'bell', label: 'Bell', emoji: '🔔' },
      { id: 'star', label: 'Star', emoji: '⭐' },
      { id: 'fish', label: 'Fish', emoji: '🐟' }
    ]
  },
  {
    prompt: 'Listen, remember, and tap the items in order.',
    expectedSequence: ['shoe', 'moon', 'cake'],
    items: [
      { id: 'shoe', label: 'Shoe', emoji: '👟' },
      { id: 'moon', label: 'Moon', emoji: '🌙' },
      { id: 'cake', label: 'Cake', emoji: '🍰' },
      { id: 'frog', label: 'Frog', emoji: '🐸' }
    ]
  },
  {
    prompt: 'Try remembering the four items in sequence.',
    expectedSequence: ['book', 'leaf', 'car', 'sun'],
    items: [
      { id: 'book', label: 'Book', emoji: '📘' },
      { id: 'leaf', label: 'Leaf', emoji: '🍃' },
      { id: 'car', label: 'Car', emoji: '🚗' },
      { id: 'sun', label: 'Sun', emoji: '☀️' },
      { id: 'ball', label: 'Ball', emoji: '⚽' }
    ]
  }
];

export const ReceptiveLanguageArena: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'directions' | 'wh_quest' | 'listening' | 'concepts' | 'memory'>('directions');
  
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

  const [listeningIndex, setListeningIndex] = useState(0);
  const [selectedListeningOption, setSelectedListeningOption] = useState<string | null>(null);
  const [listeningScore, setListeningScore] = useState(0);
  const [totalListeningAnswered, setTotalListeningAnswered] = useState(0);
  const [conceptIndex, setConceptIndex] = useState(0);
  const [selectedConceptOption, setSelectedConceptOption] = useState<string | null>(null);
  const [conceptScore, setConceptScore] = useState(0);
  const [totalConceptAnswered, setTotalConceptAnswered] = useState(0);
  const [memoryIndex, setMemoryIndex] = useState(0);
  const [memorySequence, setMemorySequence] = useState<string[]>([]);
  const [memoryResult, setMemoryResult] = useState<boolean | null>(null);
  const [memoryScore, setMemoryScore] = useState(0);
  const [totalMemoryTrials, setTotalMemoryTrials] = useState(0);

  const currentTask = DIRECTION_TASKS[currentTaskIndex];
  const currentWh = WH_QUESTIONS[currentWhIndex];
  const currentListeningQuestion = LISTENING_QUESTIONS[listeningIndex];
  const currentConceptQuestion = CONCEPT_QUESTIONS[conceptIndex];
  const currentMemoryTrial = MEMORY_TRIALS[memoryIndex];

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

  const handleListeningAnswer = (optionId: string) => {
    if (selectedListeningOption !== null) return;
    setSelectedListeningOption(optionId);
    setTotalListeningAnswered((prev) => prev + 1);
    if (optionId === currentListeningQuestion.correctAnswerId) {
      setListeningScore((prev) => prev + 1);
      sfx.playSuccess();
    } else {
      sfx.playRetry();
    }
  };

  const handleConceptAnswer = (optionId: string) => {
    if (selectedConceptOption !== null) return;
    setSelectedConceptOption(optionId);
    setTotalConceptAnswered((prev) => prev + 1);
    if (optionId === currentConceptQuestion.correctAnswerId) {
      setConceptScore((prev) => prev + 1);
      sfx.playSuccess();
    } else {
      sfx.playRetry();
    }
  };

  const handleMemoryItem = (itemId: string) => {
    if (memoryResult !== null) return;
    const updated = [...memorySequence, itemId];
    setMemorySequence(updated);
    const isPrefixCorrect = updated.every((id, index) => id === currentMemoryTrial.expectedSequence[index]);
    if (!isPrefixCorrect) {
      setMemoryResult(false);
      setTotalMemoryTrials((prev) => prev + 1);
      sfx.playRetry();
      return;
    }
    if (updated.length === currentMemoryTrial.expectedSequence.length) {
      setMemoryResult(true);
      setMemoryScore((prev) => prev + 1);
      setTotalMemoryTrials((prev) => prev + 1);
      sfx.playSuccess();
    } else {
      sfx.playPop();
    }
  };

  const handleNextListening = () => {
    setSelectedListeningOption(null);
    setListeningIndex((prev) => (prev + 1) % LISTENING_QUESTIONS.length);
  };

  const handleNextConcept = () => {
    setSelectedConceptOption(null);
    setConceptIndex((prev) => (prev + 1) % CONCEPT_QUESTIONS.length);
  };

  const handleNextMemory = () => {
    setMemorySequence([]);
    setMemoryResult(null);
    setMemoryIndex((prev) => (prev + 1) % MEMORY_TRIALS.length);
  };

  const playMemorySequence = () => {
    const spokenItems = currentMemoryTrial.expectedSequence
      .map((id) => currentMemoryTrial.items.find((item) => item.id === id)?.label)
      .filter(Boolean)
      .join(', ');
    speakText(spokenItems, Language.ENGLISH);
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

        {/* Practice counter */}
        <div className="bg-blue-50 border border-blue-200 px-5 py-3 rounded-2xl flex items-center gap-4">
          <Target className="w-7 h-7 text-blue-600" />
          <div>
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest block">
              Correct responses
            </span>
            <span className="text-2xl font-black text-blue-950">
              {directionScore + whScore + listeningScore + conceptScore + memoryScore}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2 sm:grid-cols-3 lg:grid-cols-5">
        <button
          onClick={() => {
            sfx.playTap();
            setActiveTab('directions');
          }}
          className={`px-3 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'directions'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Compass className="w-4 h-4 text-blue-400" />
          Directions
        </button>

        <button
          onClick={() => {
            sfx.playTap();
            setActiveTab('wh_quest');
          }}
          className={`px-3 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'wh_quest'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-purple-400" />
          WH Questions
        </button>
        <button onClick={() => setActiveTab('listening')} className={`px-3 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'listening' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
          <BookOpen className="w-4 h-4 text-emerald-500" /> Listening
        </button>
        <button onClick={() => setActiveTab('concepts')} className={`px-3 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'concepts' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
          <Eye className="w-4 h-4 text-amber-500" /> Concepts
        </button>
        <button onClick={() => setActiveTab('memory')} className={`px-3 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'memory' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
          <Brain className="w-4 h-4 text-purple-500" /> Auditory memory
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

      {activeTab === 'listening' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">Listening comprehension · Story {listeningIndex + 1}/{LISTENING_QUESTIONS.length}</span>
              <h2 className="mt-3 text-2xl font-black text-slate-900">{currentListeningQuestion.title}</h2>
            </div>
            <button onClick={() => speakText(currentListeningQuestion.passage, Language.ENGLISH)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white hover:bg-emerald-700">
              <Volume2 className="h-4 w-4" /> Listen to story
            </button>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 text-base leading-relaxed text-slate-700">{currentListeningQuestion.passage}</div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <h3 className="text-lg font-black text-slate-900">{currentListeningQuestion.question}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {currentListeningQuestion.options.map((option) => (
                <button key={option.id} disabled={selectedListeningOption !== null} onClick={() => handleListeningAnswer(option.id)} className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-colors ${selectedListeningOption !== null && option.id === currentListeningQuestion.correctAnswerId ? 'border-emerald-400 bg-emerald-50' : selectedListeningOption === option.id ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white hover:border-emerald-300'}`}>
                  <span className="text-4xl">{option.emoji}</span>
                  <span className="text-sm font-bold text-slate-800">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
          {selectedListeningOption !== null && (
            <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-emerald-950">{currentListeningQuestion.explanation}</p>
              <button onClick={handleNextListening} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white">Next story <ArrowRight className="h-4 w-4" /></button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'concepts' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">{currentConceptQuestion.focus} · Challenge {conceptIndex + 1}/{CONCEPT_QUESTIONS.length}</span>
              <p className="mt-3 text-sm text-slate-500">Listen, read the question, and choose the matching object or idea.</p>
            </div>
            <button onClick={() => speakText(currentConceptQuestion.question, Language.ENGLISH)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs font-black text-amber-800 hover:bg-amber-100"><Volume2 className="h-4 w-4" /> Hear question</button>
          </div>
          <h2 className="rounded-2xl bg-amber-50/70 p-6 text-center text-2xl font-black text-slate-900">{currentConceptQuestion.question}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {currentConceptQuestion.options.map((option) => (
              <button key={option.id} disabled={selectedConceptOption !== null} onClick={() => handleConceptAnswer(option.id)} className={`flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-colors ${selectedConceptOption !== null && option.id === currentConceptQuestion.correctAnswerId ? 'border-emerald-400 bg-emerald-50' : selectedConceptOption === option.id ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white hover:border-amber-300'}`}>
                <span className="text-5xl">{option.emoji}</span>
                <span className="text-sm font-bold text-slate-800">{option.label}</span>
              </button>
            ))}
          </div>
          {selectedConceptOption !== null && (
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-amber-950">{currentConceptQuestion.explanation}</p>
              <button onClick={handleNextConcept} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-black text-white">Next concept <ArrowRight className="h-4 w-4" /></button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'memory' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">Auditory memory · Trial {memoryIndex + 1}/{MEMORY_TRIALS.length}</span>
              <p className="mt-3 text-sm text-slate-600">{currentMemoryTrial.prompt} Listen, then tap the pictured items in the same order.</p>
            </div>
            <button onClick={playMemorySequence} className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-xs font-black text-white hover:bg-purple-700"><Volume2 className="h-4 w-4" /> Listen to sequence</button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-purple-50 p-4" aria-live="polite">
            <span className="mr-2 text-xs font-bold text-purple-800">Your taps:</span>
            {memorySequence.length ? memorySequence.map((id, index) => {
              const item = currentMemoryTrial.items.find((candidate) => candidate.id === id);
              return <span key={`${id}-${index}`} className="rounded-lg bg-white px-3 py-2 text-xl shadow-sm" aria-label={item?.label}>{item?.emoji}</span>;
            }) : <span className="text-xs text-purple-500">No items yet</span>}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {currentMemoryTrial.items.map((item) => (
              <button key={item.id} disabled={memoryResult !== null} onClick={() => handleMemoryItem(item.id)} className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-purple-300 hover:bg-purple-50 disabled:opacity-70">
                <span className="text-5xl">{item.emoji}</span>
                <span className="text-sm font-bold text-slate-800">{item.label}</span>
              </button>
            ))}
          </div>
          {memoryResult !== null && (
            <div className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${memoryResult ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
              <div>
                <p className="text-sm font-bold text-slate-900">{memoryResult ? 'Sequence complete!' : 'That sequence did not match. Listen again or try another round.'}</p>
                {!memoryResult && <button onClick={() => { setMemorySequence([]); setMemoryResult(null); playMemorySequence(); }} className="mt-2 text-xs font-bold text-purple-700 underline">Retry this sequence</button>}
              </div>
              <button onClick={handleNextMemory} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 py-2.5 text-xs font-black text-white">Next sequence <ArrowRight className="h-4 w-4" /></button>
            </div>
          )}
          {memoryResult === null && memorySequence.length > 0 && (
            <div className="text-center">
              <button onClick={() => setMemorySequence([])} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"><RotateCcw className="h-3.5 w-3.5" /> Start sequence again</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
