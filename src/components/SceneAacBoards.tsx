import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Volume2, 
  Sparkles, 
  Trash2, 
  Play, 
  Plus, 
  Layers, 
  CheckCircle2, 
  Heart, 
  RotateCcw,
  Smile,
  Compass,
  Award
} from 'lucide-react';
import { speakText } from '../utils/speechUtils';
import { Language } from '../types';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface SceneItem {
  id: string;
  name: string;
  spanishName: string;
  emoji: string;
  category: 'fringe' | 'action' | 'feeling' | 'core';
  starterPhrase: string;
}

interface VisualScene {
  id: string;
  title: string;
  spanishTitle: string;
  description: string;
  bgGradient: string;
  sceneEmoji: string;
  hotspots: SceneItem[];
}

const VISUAL_SCENES: VisualScene[] = [
  {
    id: 'playground',
    title: 'The Playground Scene',
    spanishTitle: 'El Parque de Juegos',
    description: 'Outdoor gross-motor & peer socialization communication board',
    bgGradient: 'from-amber-100 via-emerald-50 to-sky-100',
    sceneEmoji: '🛝',
    hotspots: [
      { id: 'swing', name: 'Swing', spanishName: 'Columpio', emoji: '🪑', category: 'fringe', starterPhrase: 'Push me high on the swing please!' },
      { id: 'slide', name: 'Slide', spanishName: 'Tobogán', emoji: '🛝', category: 'fringe', starterPhrase: 'I want to go down the big slide.' },
      { id: 'ball', name: 'Ball', spanishName: 'Pelota', emoji: '⚽', category: 'fringe', starterPhrase: 'Can we kick the soccer ball?' },
      { id: 'sandbox', name: 'Sandbox', spanishName: 'Arenero', emoji: '🏖️', category: 'fringe', starterPhrase: 'Let us build a sand castle together.' },
      { id: 'turn', name: 'My Turn', spanishName: 'Mi Turno', emoji: '🙋', category: 'core', starterPhrase: 'It is my turn to play now.' },
      { id: 'help', name: 'Help Me', spanishName: 'Ayúdame', emoji: '🆘', category: 'core', starterPhrase: 'Can you help me climb up?' }
    ]
  },
  {
    id: 'classroom',
    title: 'The Classroom Scene',
    spanishTitle: 'El Aula de Clases',
    description: 'School routine, academic requesting & joint engagement vocabulary',
    bgGradient: 'from-blue-100 via-indigo-50 to-purple-100',
    sceneEmoji: '🏫',
    hotspots: [
      { id: 'book', name: 'Storybook', spanishName: 'Libro de cuentos', emoji: '📖', category: 'fringe', starterPhrase: 'Let us read the picture book.' },
      { id: 'crayons', name: 'Crayons', spanishName: 'Crayones', emoji: '🖍️', category: 'fringe', starterPhrase: 'I want to color with the blue crayon.' },
      { id: 'snack', name: 'Snack Time', spanishName: 'Merienda', emoji: '🍎', category: 'fringe', starterPhrase: 'I am ready for apple snack time.' },
      { id: 'teacher', name: 'Teacher', spanishName: 'Maestra', emoji: '👩‍🏫', category: 'core', starterPhrase: 'Teacher, I have a question!' },
      { id: 'bathroom', name: 'Bathroom', spanishName: 'Baño', emoji: '🚻', category: 'core', starterPhrase: 'May I please use the bathroom?' },
      { id: 'listen', name: 'Listen', spanishName: 'Escuchar', emoji: '👂', category: 'action', starterPhrase: 'I am listening quietly.' }
    ]
  },
  {
    id: 'dinner',
    title: 'Home & Dinner Table',
    spanishTitle: 'La Mesa de Comedor',
    description: 'Mealtime requests, food preferences & family conversation',
    bgGradient: 'from-orange-100 via-amber-50 to-rose-100',
    sceneEmoji: '🍽️',
    hotspots: [
      { id: 'water', name: 'Cold Water', spanishName: 'Agua fría', emoji: '💧', category: 'fringe', starterPhrase: 'Please pour me a glass of water.' },
      { id: 'more_food', name: 'More Please', spanishName: 'Más por favor', emoji: '➕', category: 'core', starterPhrase: 'I would like some more please.' },
      { id: 'yummy', name: 'Yummy', spanishName: 'Delicioso', emoji: '😋', category: 'feeling', starterPhrase: 'This food tastes delicious!' },
      { id: 'all_done', name: 'All Done', spanishName: 'Ya terminé', emoji: '🛑', category: 'core', starterPhrase: 'I am all done eating, thank you.' },
      { id: 'pizza', name: 'Pizza', spanishName: 'Pizza', emoji: '🍕', category: 'fringe', starterPhrase: 'I love warm cheese pizza.' },
      { id: 'napkin', name: 'Napkin', spanishName: 'Servilleta', emoji: '🧻', category: 'fringe', starterPhrase: 'I need a napkin to wipe my hands.' }
    ]
  }
];

export const SceneAacBoards: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'visual_scenes' | 'sentence_builder' | 'request_reward'>('visual_scenes');
  
  // Scene Board State
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
  const currentScene = VISUAL_SCENES[selectedSceneIndex];

  // Sentence Builder State
  const [sentenceTokens, setSentenceTokens] = useState<Array<{ id: string; word: string; color: string; emoji: string }>>([
    { id: '1', word: 'I', color: 'bg-amber-100 text-amber-900 border-amber-300', emoji: '🙋' },
    { id: '2', word: 'want', color: 'bg-emerald-100 text-emerald-900 border-emerald-300', emoji: '❤️' },
    { id: '3', word: 'apple', color: 'bg-rose-100 text-rose-900 border-rose-300', emoji: '🍎' }
  ]);

  // Request & Reward State
  const [requestedItem, setRequestedItem] = useState<string>('cookie');
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);

  const handleSpeakPhrase = (text: string) => {
    speakText(text, Language.ENGLISH);
  };

  const handleSpeakFullSentence = () => {
    const fullText = sentenceTokens.map(t => t.word).join(' ');
    if (!fullText) return;
    speakText(fullText, Language.ENGLISH);
    toast.success(`Voicing: "${fullText}"`);
  };

  const handleAddSentenceToken = (word: string, emoji: string, color: string) => {
    setSentenceTokens(prev => [...prev, { id: Date.now().toString(), word, emoji, color }]);
  };

  const handleClearSentence = () => {
    setSentenceTokens([]);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Visual Scene Displays & Functional AAC
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Scene-Based AAC & Sentence Builder
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Rich environmental visual scenes, Fitzgerald-keyed sentence construction, and functional communication reward loops.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('visual_scenes')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            activeTab === 'visual_scenes'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Compass className="w-4 h-4 text-blue-400" />
          Interactive Visual Scenes
        </button>

        <button
          onClick={() => setActiveTab('sentence_builder')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            activeTab === 'sentence_builder'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          Build-a-Sentence AAC
        </button>

        <button
          onClick={() => setActiveTab('request_reward')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            activeTab === 'request_reward'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          Request & Reward Loop
        </button>
      </div>

      {/* Tab 1: Visual Scene Display */}
      {activeTab === 'visual_scenes' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          {/* Scene Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {VISUAL_SCENES.map((scene, idx) => (
              <button
                key={scene.id}
                onClick={() => setSelectedSceneIndex(idx)}
                className={`p-4 rounded-2xl font-bold text-left border transition-all ${
                  selectedSceneIndex === idx
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{scene.sceneEmoji}</span>
                  <div>
                    <span className="text-sm font-black block">{scene.title}</span>
                    <span className="text-xs opacity-75">{scene.spanishTitle}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Active Scene Display Arena */}
          <div className={`p-8 rounded-3xl bg-gradient-to-br ${currentScene.bgGradient} border border-slate-200 space-y-6`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm border border-slate-200">
                {currentScene.title}
              </span>
              <span className="text-xs text-slate-600 font-medium">
                Tap any item to speak in complete natural sentences
              </span>
            </div>

            {/* Scene Hotspot Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {currentScene.hotspots.map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleSpeakPhrase(item.starterPhrase)}
                  className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl sm:text-4xl">{item.emoji}</span>
                    <Volume2 className="w-4 h-4 text-indigo-500 opacity-60 group-hover:opacity-100" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-slate-900 block">{item.name}</span>
                    <span className="text-xs text-slate-500 block mb-2">{item.spanishName}</span>
                    <p className="text-[11px] text-indigo-700 font-medium italic line-clamp-2">
                      "{item.starterPhrase}"
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Build-a-Sentence AAC */}
      {activeTab === 'sentence_builder' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-900">Build-a-Sentence (Fitzgerald Key)</h3>
            <p className="text-xs text-slate-500">
              Grammatically color-coded tiles: Yellow (Pronouns/People), Green (Verbs), Orange (Objects/Nouns), Pink (Feelings).
            </p>
          </div>

          {/* Sentence Ribbon (Visual Strip) */}
          <div className="p-6 bg-slate-900 rounded-3xl text-white space-y-4 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Sentence Strip
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearSentence}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
                <button
                  onClick={handleSpeakFullSentence}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-900"
                >
                  <Volume2 className="w-4 h-4" />
                  Speak Full Sentence
                </button>
              </div>
            </div>

            <div className="min-h-[80px] p-3 bg-slate-800/80 rounded-2xl border border-slate-700 flex flex-wrap items-center gap-3">
              {sentenceTokens.length === 0 ? (
                <span className="text-xs text-slate-500 italic">Tap cards below to assemble your sentence...</span>
              ) : (
                sentenceTokens.map((token, idx) => (
                  <motion.div
                    key={token.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 font-black text-sm shadow-sm ${token.color}`}
                  >
                    <span>{token.emoji}</span>
                    <span>{token.word}</span>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Available Tile Palette */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vocabulary Palette</h4>
            
            {/* Subjects / People (Yellow) */}
            <div className="flex flex-wrap gap-2">
              {[
                { word: 'I', emoji: '🙋' },
                { word: 'You', emoji: '👉' },
                { word: 'We', emoji: '👥' },
                { word: 'Mom', emoji: '👩' },
                { word: 'Dad', emoji: '👨' }
              ].map(t => (
                <button
                  key={t.word}
                  onClick={() => handleAddSentenceToken(t.word, t.emoji, 'bg-amber-100 text-amber-900 border-amber-300')}
                  className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 font-black text-xs flex items-center gap-1.5"
                >
                  <span>{t.emoji}</span>
                  <span>{t.word}</span>
                </button>
              ))}
            </div>

            {/* Verbs / Actions (Green) */}
            <div className="flex flex-wrap gap-2">
              {[
                { word: 'want', emoji: '❤️' },
                { word: 'see', emoji: '👀' },
                { word: 'like', emoji: '👍' },
                { word: 'play', emoji: '🧸' },
                { word: 'eat', emoji: '🍽️' },
                { word: 'help', emoji: '🆘' }
              ].map(t => (
                <button
                  key={t.word}
                  onClick={() => handleAddSentenceToken(t.word, t.emoji, 'bg-emerald-100 text-emerald-900 border-emerald-300')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-900 font-black text-xs flex items-center gap-1.5"
                >
                  <span>{t.emoji}</span>
                  <span>{t.word}</span>
                </button>
              ))}
            </div>

            {/* Objects / Nouns (Orange) */}
            <div className="flex flex-wrap gap-2">
              {[
                { word: 'cookie', emoji: '🍪' },
                { word: 'water', emoji: '💧' },
                { word: 'ball', emoji: '⚽' },
                { word: 'book', emoji: '📖' },
                { word: 'apple', emoji: '🍎' }
              ].map(t => (
                <button
                  key={t.word}
                  onClick={() => handleAddSentenceToken(t.word, t.emoji, 'bg-orange-100 text-orange-900 border-orange-300')}
                  className="px-3.5 py-2 rounded-xl bg-orange-100 hover:bg-orange-200 border border-orange-300 text-orange-900 font-black text-xs flex items-center gap-1.5"
                >
                  <span>{t.emoji}</span>
                  <span>{t.word}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Request & Reward Loop */}
      {activeTab === 'request_reward' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-900">Request & Reward Loop</h3>
            <p className="text-xs text-slate-500">
              Functional communication practice: Build the request phrase to unlock the reward!
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-center space-y-6">
            <span className="text-6xl block">🐻</span>
            <h4 className="text-2xl font-black text-slate-900">
              Barnaby Bear says: "I am hungry for a <strong>{requestedItem}</strong>!"
            </h4>
            <p className="text-xs text-slate-600">
              Say: "I want {requestedItem} please" to feed Barnaby!
            </p>

            <button
              onClick={() => {
                speakText(`I want ${requestedItem} please`, Language.ENGLISH);
                setRewardClaimed(true);
                confetti({ particleCount: 50, spread: 70 });
                toast.success(`🎉 Great requesting! Barnaby enjoyed the ${requestedItem}!`);
              }}
              className="px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm uppercase tracking-wider shadow-lg flex items-center gap-2 mx-auto transition-all"
            >
              <Volume2 className="w-5 h-5" />
              Say: "I want {requestedItem} please"
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
