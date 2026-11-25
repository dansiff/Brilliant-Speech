import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Volume2, 
  Trash2, 
  Plus, 
  Settings, 
  Sparkles, 
  HelpCircle, 
  Check, 
  Folder, 
  ChevronRight, 
  Play, 
  Globe, 
  Info,
  Layers,
  Smile,
  LayoutGrid,
  Search,
  CheckCircle,
  X,
  VolumeX,
  Undo,
  Heart,
  GripVertical
} from 'lucide-react';
import { speakText } from '../utils/speechUtils';
import { Language } from '../types';

interface PecsCard {
  id: string;
  label: string;
  spanishLabel: string;
  emoji: string;
  category: 'core' | 'actions' | 'food' | 'feelings' | 'places' | 'people';
  isCustom?: boolean;
}

const CATEGORIES = [
  { id: 'all', name: 'All Cards', spanishName: 'Todas las tarjetas', icon: Layers, color: 'bg-slate-100 text-slate-800' },
  { id: 'core', name: 'Core Words', spanishName: 'Palabras clave', icon: Sparkles, color: 'bg-amber-100 text-amber-900 border-amber-300' },
  { id: 'actions', name: 'Actions', spanishName: 'Acciones', icon: Play, color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { id: 'food', name: 'Food & Drink', spanishName: 'Comida y bebida', icon: Smile, color: 'bg-blue-100 text-blue-900 border-blue-300' },
  { id: 'feelings', name: 'Feelings', spanishName: 'Sentimientos', icon: Smile, color: 'bg-purple-100 text-purple-900 border-purple-300' },
  { id: 'places', name: 'Places & Toys', spanishName: 'Lugares y juguetes', icon: Folder, color: 'bg-orange-100 text-orange-900 border-orange-300' },
  { id: 'people', name: 'People', spanishName: 'Personas', icon: Smile, color: 'bg-indigo-100 text-indigo-900 border-indigo-300' }
] as const;

const DEFAULT_CARDS: PecsCard[] = [
  // Core / Quick Words
  { id: 'core-i', label: 'I', spanishLabel: 'Yo', emoji: '🙋‍♂️', category: 'core' },
  { id: 'core-you', label: 'You', spanishLabel: 'Tú', emoji: '🙋', category: 'core' },
  { id: 'core-want', label: 'Want', spanishLabel: 'Quiero', emoji: '❤️', category: 'core' },
  { id: 'core-help', label: 'Help', spanishLabel: 'Ayuda', emoji: '🆘', category: 'core' },
  { id: 'core-yes', label: 'Yes', spanishLabel: 'Sí', emoji: '✅', category: 'core' },
  { id: 'core-no', label: 'No', spanishLabel: 'No', emoji: '❌', category: 'core' },
  { id: 'core-please', label: 'Please', spanishLabel: 'Por favor', emoji: '🙏', category: 'core' },
  { id: 'core-thanks', label: 'Thank you', spanishLabel: 'Gracias', emoji: '💖', category: 'core' },
  { id: 'core-more', label: 'More', spanishLabel: 'Más', emoji: '➕', category: 'core' },

  // Actions
  { id: 'act-eat', label: 'Eat', spanishLabel: 'Comer', emoji: '🍕', category: 'actions' },
  { id: 'act-drink', label: 'Drink', spanishLabel: 'Beber', emoji: '🥤', category: 'actions' },
  { id: 'act-go', label: 'Go', spanishLabel: 'Ir', emoji: '🏃‍♂️', category: 'actions' },
  { id: 'act-play', label: 'Play', spanishLabel: 'Jugar', emoji: '🧸', category: 'actions' },
  { id: 'act-stop', label: 'Stop', spanishLabel: 'Parar', emoji: '🛑', category: 'actions' },
  { id: 'act-wash', label: 'Wash', spanishLabel: 'Lavar', emoji: '🧼', category: 'actions' },
  { id: 'act-sleep', label: 'Sleep', spanishLabel: 'Dormir', emoji: '💤', category: 'actions' },
  { id: 'act-look', label: 'Look', spanishLabel: 'Mirar', emoji: '👀', category: 'actions' },

  // Food & Drinks
  { id: 'food-water', label: 'Water', spanishLabel: 'Agua', emoji: '💧', category: 'food' },
  { id: 'food-milk', label: 'Milk', spanishLabel: 'Leche', emoji: '🥛', category: 'food' },
  { id: 'food-juice', label: 'Juice', spanishLabel: 'Jugo', emoji: '🧃', category: 'food' },
  { id: 'food-cookie', label: 'Cookie', spanishLabel: 'Galleta', emoji: '🍪', category: 'food' },
  { id: 'food-apple', label: 'Apple', spanishLabel: 'Manzana', emoji: '🍎', category: 'food' },
  { id: 'food-banana', label: 'Banana', spanishLabel: 'Plátano', emoji: '🍌', category: 'food' },
  { id: 'food-sandwich', label: 'Sandwich', spanishLabel: 'Sándwich', emoji: '🥪', category: 'food' },
  { id: 'food-pizza', label: 'Pizza', spanishLabel: 'Pizza', emoji: '🍕', category: 'food' },

  // Feelings
  { id: 'feel-happy', label: 'Happy', spanishLabel: 'Feliz', emoji: '😊', category: 'feelings' },
  { id: 'feel-sad', label: 'Sad', spanishLabel: 'Triste', emoji: '😢', category: 'feelings' },
  { id: 'feel-angry', label: 'Angry', spanishLabel: 'Enojado', emoji: '😠', category: 'feelings' },
  { id: 'feel-tired', label: 'Tired', spanishLabel: 'Cansado', emoji: '😴', category: 'feelings' },
  { id: 'feel-scared', label: 'Scared', spanishLabel: 'Asustado', emoji: '😨', category: 'feelings' },
  { id: 'feel-excited', label: 'Excited', spanishLabel: 'Emocionado', emoji: '🤩', category: 'feelings' },
  { id: 'feel-hurt', label: 'Hurt', spanishLabel: 'Con dolor', emoji: '🤕', category: 'feelings' },

  // Places & Toys
  { id: 'place-park', label: 'Park', spanishLabel: 'Parque', emoji: '🛝', category: 'places' },
  { id: 'place-school', label: 'School', spanishLabel: 'Escuela', emoji: '🏫', category: 'places' },
  { id: 'place-home', label: 'Home', spanishLabel: 'Casa', emoji: '🏠', category: 'places' },
  { id: 'place-ball', label: 'Ball', spanishLabel: 'Pelota', emoji: '⚽', category: 'places' },
  { id: 'place-blocks', label: 'Blocks', spanishLabel: 'Bloques', emoji: '🧱', category: 'places' },
  { id: 'place-book', label: 'Book', spanishLabel: 'Libro', emoji: '📖', category: 'places' },
  { id: 'place-tablet', label: 'Tablet', spanishLabel: 'Tableta', emoji: '📱', category: 'places' },

  // People
  { id: 'peo-mom', label: 'Mom', spanishLabel: 'Mamá', emoji: '👩', category: 'people' },
  { id: 'peo-dad', label: 'Dad', spanishLabel: 'Papá', emoji: '👨', category: 'people' },
  { id: 'peo-teacher', label: 'Teacher', spanishLabel: 'Maestra', emoji: '👩‍🏫', category: 'people' },
  { id: 'peo-friend', label: 'Friend', spanishLabel: 'Amigo', emoji: '👦', category: 'people' },
  { id: 'peo-me', label: 'Me', spanishLabel: 'Yo', emoji: '🧒', category: 'people' },
  { id: 'peo-doctor', label: 'Doctor', spanishLabel: 'Doctor', emoji: '👨‍⚕️', category: 'people' }
];

const TEMPLATES = [
  {
    title: 'Request Food',
    spanishTitle: 'Pedir comida',
    cards: ['core-i', 'core-want', 'act-eat', 'food-cookie']
  },
  {
    title: 'Request Drink',
    spanishTitle: 'Pedir bebida',
    cards: ['core-i', 'core-want', 'act-drink', 'food-water']
  },
  {
    title: 'Express Feeling',
    spanishTitle: 'Expresar sentimiento',
    cards: ['core-i', 'feel-happy']
  },
  {
    title: 'Ask for Help',
    spanishTitle: 'Pedir ayuda',
    cards: ['core-please', 'core-help', 'peo-me']
  },
  {
    title: 'Go Play Outside',
    spanishTitle: 'Ir a jugar afuera',
    cards: ['core-i', 'core-want', 'act-go', 'place-park']
  }
];

interface FavoritePhrase {
  id: string;
  name: string;
  spanishName: string;
  cards: PecsCard[];
}

export const AacPlayground: React.FC = () => {
  // Config & State
  const [lang, setLang] = useState<Language>(Language.ENGLISH);
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]['id']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sentence, setSentence] = useState<PecsCard[]>([]);
  const [customCards, setCustomCards] = useState<PecsCard[]>([]);
  
  // Drag and Drop States
  const [isDraggingOverSentence, setIsDraggingOverSentence] = useState(false);
  const [draggedCardFromGrid, setDraggedCardFromGrid] = useState<PecsCard | null>(null);
  const [draggedIndexWithinSentence, setDraggedIndexWithinSentence] = useState<number | null>(null);
  const [isDraggingOverTrash, setIsDraggingOverTrash] = useState(false);

  // Favorite Phrases States
  const [favorites, setFavorites] = useState<FavoritePhrase[]>([]);
  const [favoriteNameInput, setFavoriteNameInput] = useState('');
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);

  // Custom Card Form
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardLabel, setNewCardLabel] = useState('');
  const [newCardSpanishLabel, setNewCardSpanishLabel] = useState('');
  const [newCardEmoji, setNewCardEmoji] = useState('🌟');
  const [newCardCategory, setNewCardCategory] = useState<PecsCard['category']>('core');

  // Speech settings
  const [speechRate, setSpeechRate] = useState(0.85);
  const [speechPitch, setSpeechPitch] = useState(1.15);

  // Success indicator
  const [showCelebration, setShowCelebration] = useState(false);

  // Load custom cards & favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('brilliant_speech_custom_pecs');
    if (saved) {
      try {
        setCustomCards(JSON.parse(saved));
      } catch (e) {
        console.error("Failed parsing custom PECS cards", e);
      }
    }

    const savedFavs = localStorage.getItem('brilliant_speech_favorite_phrases');
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        console.error("Failed parsing favorite phrases", e);
      }
    } else {
      // Default initial favorite phrases for warm user onboarding!
      const initialFavs: FavoritePhrase[] = [
        {
          id: 'fav-1',
          name: 'I want cookie 🍪',
          spanishName: 'Quiero galleta 🍪',
          cards: [
            { id: 'core-i', label: 'I', spanishLabel: 'Yo', emoji: '🙋‍♂️', category: 'core' },
            { id: 'core-want', label: 'Want', spanishLabel: 'Quiero', emoji: '❤️', category: 'core' },
            { id: 'food-cookie', label: 'Cookie', spanishLabel: 'Galleta', emoji: '🍪', category: 'food' }
          ]
        },
        {
          id: 'fav-2',
          name: 'Help please 🆘',
          spanishName: 'Ayuda por favor 🆘',
          cards: [
            { id: 'core-help', label: 'Help', spanishLabel: 'Ayuda', emoji: '🆘', category: 'core' },
            { id: 'core-please', label: 'Please', spanishLabel: 'Por favor', emoji: '🙏', category: 'core' }
          ]
        },
        {
          id: 'fav-3',
          name: 'I want play park 🛝',
          spanishName: 'Quiero jugar parque 🛝',
          cards: [
            { id: 'core-i', label: 'I', spanishLabel: 'Yo', emoji: '🙋‍♂️', category: 'core' },
            { id: 'core-want', label: 'Want', spanishLabel: 'Quiero', emoji: '❤️', category: 'core' },
            { id: 'act-play', label: 'Play', spanishLabel: 'Jugar', emoji: '🧸', category: 'actions' },
            { id: 'place-park', label: 'Park', spanishLabel: 'Parque', emoji: '🛝', category: 'places' }
          ]
        }
      ];
      setFavorites(initialFavs);
      localStorage.setItem('brilliant_speech_favorite_phrases', JSON.stringify(initialFavs));
    }
  }, []);

  // Drag & Drop Handlers
  const handleDragStartFromGrid = (e: any, card: PecsCard) => {
    setDraggedCardFromGrid(card);
    if (e.dataTransfer) {
      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'grid', card }));
      e.dataTransfer.effectAllowed = 'copyMove';
    }
  };

  const handleDragStartWithinSentence = (e: any, index: number) => {
    setDraggedIndexWithinSentence(index);
    if (e.dataTransfer) {
      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'sentence', index }));
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragEnd = () => {
    setDraggedCardFromGrid(null);
    setDraggedIndexWithinSentence(null);
    setIsDraggingOverSentence(false);
    setIsDraggingOverTrash(false);
  };

  const handleDragOverSentence = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverSentence(true);
  };

  const handleDragLeaveSentence = () => {
    setIsDraggingOverSentence(false);
  };

  const handleDropOnSentence = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverSentence(false);
    
    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (!rawData) return;
      const data = JSON.parse(rawData);
      
      if (data.type === 'grid') {
        const card = data.card;
        setSentence(prev => [...prev, card]);
        speakWithSettings(lang === Language.ENGLISH ? card.label : card.spanishLabel);
      }
    } catch (err) {
      if (draggedCardFromGrid) {
        setSentence(prev => [...prev, draggedCardFromGrid]);
        speakWithSettings(lang === Language.ENGLISH ? draggedCardFromGrid.label : draggedCardFromGrid.spanishLabel);
      }
    }
    handleDragEnd();
  };

  const handleDropOnSentenceItem = (e: React.DragEvent, targetIdx: number) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (!rawData) return;
      const data = JSON.parse(rawData);
      
      if (data.type === 'grid') {
        const card = data.card;
        setSentence(prev => {
          const next = [...prev];
          next.splice(targetIdx, 0, card);
          return next;
        });
        speakWithSettings(lang === Language.ENGLISH ? card.label : card.spanishLabel);
      } else if (data.type === 'sentence') {
        const sourceIdx = data.index;
        if (sourceIdx !== targetIdx) {
          setSentence(prev => {
            const next = [...prev];
            const [moved] = next.splice(sourceIdx, 1);
            next.splice(targetIdx, 0, moved);
            return next;
          });
        }
      }
    } catch (err) {
      if (draggedCardFromGrid) {
        setSentence(prev => {
          const next = [...prev];
          next.splice(targetIdx, 0, draggedCardFromGrid);
          return next;
        });
      } else if (draggedIndexWithinSentence !== null) {
        const sourceIdx = draggedIndexWithinSentence;
        if (sourceIdx !== targetIdx) {
          setSentence(prev => {
            const next = [...prev];
            const [moved] = next.splice(sourceIdx, 1);
            next.splice(targetIdx, 0, moved);
            return next;
          });
        }
      }
    }
    handleDragEnd();
  };

  const handleDropOnTrash = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverTrash(false);
    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (!rawData) return;
      const data = JSON.parse(rawData);
      if (data.type === 'sentence') {
        const sourceIdx = data.index;
        setSentence(prev => prev.filter((_, idx) => idx !== sourceIdx));
        speakWithSettings(lang === Language.ENGLISH ? 'Removed' : 'Eliminado');
      }
    } catch (err) {
      if (draggedIndexWithinSentence !== null) {
        setSentence(prev => prev.filter((_, idx) => idx !== draggedIndexWithinSentence));
        speakWithSettings(lang === Language.ENGLISH ? 'Removed' : 'Eliminado');
      }
    }
    handleDragEnd();
  };

  // Favorite Phrases Handlers
  const handleSaveFavorite = (e: React.FormEvent) => {
    e.preventDefault();
    if (sentence.length === 0) return;
    
    // Auto-assemble phrase name if input is empty
    const phraseLabel = favoriteNameInput.trim() || sentence.map(c => c.emoji).join('') + ' ' + sentence.map(c => c.label).join(' ');
    const phraseSpanishLabel = favoriteNameInput.trim() || sentence.map(c => c.emoji).join('') + ' ' + sentence.map(c => c.spanishLabel).join(' ');
    
    const newFav: FavoritePhrase = {
      id: `fav-${Date.now()}`,
      name: phraseLabel,
      spanishName: phraseSpanishLabel,
      cards: [...sentence]
    };
    
    const updated = [newFav, ...favorites];
    setFavorites(updated);
    localStorage.setItem('brilliant_speech_favorite_phrases', JSON.stringify(updated));
    setFavoriteNameInput('');
    setIsSavingFavorite(false);
    
    // Play celebratory splash
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
    }, 1500);
    
    speakWithSettings(lang === Language.ENGLISH ? 'Favorite saved!' : '¡Favorito guardado!');
  };

  const handleDeleteFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    localStorage.setItem('brilliant_speech_favorite_phrases', JSON.stringify(updated));
  };

  const handleLoadFavorite = (fav: FavoritePhrase) => {
    setSentence(fav.cards);
    const text = fav.cards.map(c => lang === Language.ENGLISH ? c.label : c.spanishLabel).join(' ');
    speakWithSettings(text);
  };

  const saveCustomCards = (updated: PecsCard[]) => {
    setCustomCards(updated);
    localStorage.setItem('brilliant_speech_custom_pecs', JSON.stringify(updated));
  };

  const allCards = [...DEFAULT_CARDS, ...customCards];

  // Filters cards based on selected category and query
  const filteredCards = allCards.filter(card => {
    const matchesCategory = selectedCategory === 'all' || card.category === selectedCategory;
    const term = searchQuery.toLowerCase();
    const labelToMatch = lang === Language.ENGLISH ? card.label : card.spanishLabel;
    const matchesSearch = labelToMatch.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  // Speak a single word
  const handleCardClick = (card: PecsCard) => {
    const word = lang === Language.ENGLISH ? card.label : card.spanishLabel;
    
    // Web Speech API with custom rate & pitch
    speakWithSettings(word);
    
    // Add to active sentence builder
    setSentence(prev => [...prev, card]);
  };

  // Custom speaker with local playground configurations
  const speakWithSettings = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = lang === Language.SPANISH ? 'es-ES' : 'en-US';
    utterance.lang = langCode;

    const voices = window.speechSynthesis.getVoices();
    const femaleKeywords = ['female', 'samantha', 'victoria', 'monica', 'google us english', 'google español', 'helena', 'zira', 'karen'];
    const femaleVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      const code = v.lang.toLowerCase();
      return code.startsWith(langCode.split('-')[0]) && 
             femaleKeywords.some(keyword => name.includes(keyword));
    });

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    } else {
      const fallbackVoice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
      if (fallbackVoice) utterance.voice = fallbackVoice;
    }

    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    window.speechSynthesis.speak(utterance);
  };

  // Speaks the whole accumulated sentence
  const speakSentence = () => {
    if (sentence.length === 0) return;
    
    const combinedText = sentence
      .map(card => (lang === Language.ENGLISH ? card.label : card.spanishLabel))
      .join(' ');
      
    speakWithSettings(combinedText);
    
    // Show a high-contrast stars animation for pediatric reward
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
    }, 2000);
  };

  // Undo the last card from the sentence
  const handleUndo = () => {
    setSentence(prev => prev.slice(0, -1));
  };

  // Clear sentence
  const clearSentence = () => {
    setSentence([]);
  };

  // Loads a premade template
  const loadTemplate = (cardIds: string[]) => {
    const templateCards = cardIds
      .map(id => allCards.find(c => c.id === id))
      .filter((c): c is PecsCard => !!c);
    setSentence(templateCards);
  };

  // Handles adding custom PECS cards
  const handleAddCustomCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardLabel.trim() || !newCardSpanishLabel.trim()) return;

    const newCard: PecsCard = {
      id: `custom-${Date.now()}`,
      label: newCardLabel.trim(),
      spanishLabel: newCardSpanishLabel.trim(),
      emoji: newCardEmoji || '✨',
      category: newCardCategory,
      isCustom: true
    };

    saveCustomCards([...customCards, newCard]);
    setNewCardLabel('');
    setNewCardSpanishLabel('');
    setNewCardEmoji('🌟');
    setIsAddingCard(false);
  };

  // Handles deletion of custom card
  const handleDeleteCustomCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card speech
    const updated = customCards.filter(c => c.id !== id);
    saveCustomCards(updated);
    
    // Remove from active sentence if present
    setSentence(prev => prev.filter(c => c.id !== id));
  };

  // Get color schemes per PECS standard
  const getCategoryTheme = (cat: PecsCard['category']) => {
    switch (cat) {
      case 'core':
        return {
          bg: 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950',
          badge: 'bg-amber-200 text-amber-900 border-amber-400'
        };
      case 'actions':
        return {
          bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-950',
          badge: 'bg-emerald-200 text-emerald-900 border-emerald-400'
        };
      case 'food':
        return {
          bg: 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-950',
          badge: 'bg-blue-200 text-blue-900 border-blue-400'
        };
      case 'feelings':
        return {
          bg: 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-950',
          badge: 'bg-purple-200 text-purple-900 border-purple-400'
        };
      case 'places':
        return {
          bg: 'bg-orange-50 hover:bg-orange-100 border-orange-300 text-orange-950',
          badge: 'bg-orange-200 text-orange-900 border-orange-400'
        };
      case 'people':
        return {
          bg: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-950',
          badge: 'bg-indigo-200 text-indigo-900 border-indigo-400'
        };
      default:
        return {
          bg: 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-900',
          badge: 'bg-slate-200 text-slate-900'
        };
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">

      {/* AAC Sentence Builder - Primary Interaction Space */}
      <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-6 shadow-md space-y-4 relative overflow-hidden">
        
        {/* Playful background flare for success */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-emerald-300 to-indigo-300 pointer-events-none"
            />
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              {lang === Language.ENGLISH ? 'Expressive Sentence Builder' : 'Constructor de Frases Expresivo'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              id="aac-lang-toggle"
              onClick={() => {
                setLang(prev => prev === Language.ENGLISH ? Language.SPANISH : Language.ENGLISH);
                if (typeof window !== 'undefined') {
                  const synth = window.speechSynthesis;
                  synth?.cancel();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl text-xs font-black text-slate-700"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{lang === Language.ENGLISH ? 'English' : 'Español'}</span>
            </button>
          </div>
        </div>

        {/* The accumulated PECS tiles row */}
        <div 
          onDragOver={handleDragOverSentence}
          onDragLeave={handleDragLeaveSentence}
          onDrop={handleDropOnSentence}
          className={`min-h-32 border rounded-[1.8rem] p-4 flex flex-wrap items-center gap-3 relative transition-all duration-300 ${
            isDraggingOverSentence 
              ? 'bg-indigo-50/50 border-indigo-400 border-dashed ring-4 ring-indigo-500/15' 
              : 'bg-slate-50 border-slate-200/60'
          }`}
        >
          {sentence.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center pointer-events-none">
              <MessageSquare className="w-8 h-8 opacity-40 mb-2 text-indigo-500" />
              <p className="text-xs font-bold leading-normal">
                {lang === Language.ENGLISH 
                  ? 'Tap tiles or Drag & Drop them here to build your sentence!' 
                  : '¡Toca tarjetas o arrástralas aquí para armar tu frase!'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {sentence.map((card, idx) => {
                const theme = getCategoryTheme(card.category);
                return (
                  <motion.div
                    key={`${card.id}-${idx}`}
                    draggable
                    onDragStart={(e) => handleDragStartWithinSentence(e, idx)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOnSentenceItem(e, idx)}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.04 }}
                    whileDrag={{ scale: 1.08, rotate: 2 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border cursor-grab active:cursor-grabbing ${theme.bg} shadow-sm border-2 relative group`}
                  >
                    <GripVertical className="w-3 h-3 text-slate-400/80 -ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-2xl">{card.emoji}</span>
                    <span className="text-sm font-black tracking-tight select-none">
                      {lang === Language.ENGLISH ? card.label : card.spanishLabel}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSentence(prev => prev.filter((_, i) => i !== idx));
                      }}
                      className="w-4 h-4 rounded-full bg-slate-900/10 hover:bg-red-500 hover:text-white flex items-center justify-center text-[9px] font-black text-slate-600 transition-colors -mr-1"
                    >
                      ×
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Save as Favorite Inline Form */}
        <AnimatePresence>
          {isSavingFavorite && (
            <motion.form
              onSubmit={handleSaveFavorite}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-50/40 border border-rose-100 rounded-3xl p-4 space-y-3 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  {lang === Language.ENGLISH ? 'Save Sentence as Favorite' : 'Guardar Frase en Favoritos'}
                </h5>
                <button 
                  type="button" 
                  onClick={() => setIsSavingFavorite(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={favoriteNameInput}
                  onChange={e => setFavoriteNameInput(e.target.value)}
                  placeholder={
                    lang === Language.ENGLISH 
                      ? `Leave blank to save as "${sentence.map(c => c.emoji).join('')} ${sentence.map(c => c.label).slice(0, 3).join(' ')}..."` 
                      : `En blanco para guardar como "${sentence.map(c => c.emoji).join('')} ${sentence.map(c => c.spanishLabel).slice(0, 3).join(' ')}..."`
                  }
                  className="flex-1 px-3.5 py-2.5 bg-white border border-rose-200 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-400"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-2xl shadow-md shadow-rose-100 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{lang === Language.ENGLISH ? 'Save' : 'Guardar'}</span>
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Play, Clear, and Favorite controls */}
        <div className="relative min-h-12 flex items-center justify-between gap-3 flex-wrap pt-2">
          
          <AnimatePresence mode="wait">
            {draggedIndexWithinSentence !== null ? (
              <motion.div
                key="trash-dropzone"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOverTrash(true); }}
                onDragLeave={() => setIsDraggingOverTrash(false)}
                onDrop={handleDropOnTrash}
                className={`w-full py-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 transition-all ${
                  isDraggingOverTrash 
                    ? 'bg-red-500 border-red-600 text-white animate-pulse shadow-md shadow-red-100' 
                    : 'bg-red-50 border-red-200 text-red-600'
                }`}
              >
                <Trash2 className={`w-5 h-5 ${isDraggingOverTrash ? 'animate-bounce' : ''}`} />
                <span className="text-xs font-black uppercase tracking-wider">
                  {lang === Language.ENGLISH ? 'Drop here to delete card' : 'Arrastra aquí para eliminar la tarjeta'}
                </span>
              </motion.div>
            ) : (
              <motion.div 
                key="normal-controls"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex items-center justify-between gap-3 flex-wrap"
              >
                <div className="flex items-center gap-2">
                  <button
                    id="aac-btn-undo"
                    onClick={handleUndo}
                    disabled={sentence.length === 0}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:hover:bg-slate-100 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all"
                    title={lang === Language.ENGLISH ? 'Undo last' : 'Deshacer último'}
                  >
                    <Undo className="w-4 h-4" />
                    <span>{lang === Language.ENGLISH ? 'Undo' : 'Deshacer'}</span>
                  </button>
                  <button
                    id="aac-btn-clear"
                    onClick={clearSentence}
                    disabled={sentence.length === 0}
                    className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 disabled:opacity-40 disabled:hover:bg-red-50 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{lang === Language.ENGLISH ? 'Clear' : 'Borrar'}</span>
                  </button>
                  
                  {/* Save as Favorite Button */}
                  <button
                    id="aac-btn-favorite"
                    onClick={() => { setIsSavingFavorite(!isSavingFavorite); }}
                    disabled={sentence.length === 0}
                    className={`px-4 py-3 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all ${
                      isSavingFavorite 
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-100' 
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-40 disabled:hover:bg-rose-50'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isSavingFavorite ? 'fill-white' : 'fill-none'}`} />
                    <span>{lang === Language.ENGLISH ? 'Favorite' : 'Favorito'}</span>
                  </button>
                </div>

                <button
                  id="aac-btn-speak"
                  onClick={speakSentence}
                  disabled={sentence.length === 0}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center gap-2.5 disabled:opacity-40 disabled:shadow-none"
                >
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span>{lang === Language.ENGLISH ? 'Speak Sentence' : 'Pronunciar Frase'}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>

      </div>

      {/* Main Grid, Folders & custom controls split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left column: Directory filters & Pre-built Templates */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Folders List */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
              {lang === Language.ENGLISH ? 'Folders' : 'Carpetas'}
            </h4>
            <div className="flex flex-col gap-1.5">
              {CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat.id;
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl border text-left font-black text-xs transition-all ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                        : 'bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      <span>{lang === Language.ENGLISH ? cat.name : cat.spanishName}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${isSelected ? 'translate-x-0.5' : ''}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt Templates */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
              {lang === Language.ENGLISH ? 'Quick Templates' : 'Plantillas Rápidas'}
            </h4>
            <p className="text-[10px] text-slate-500 leading-normal font-semibold">
              {lang === Language.ENGLISH 
                ? 'Teach full communicative sequences:' 
                : 'Enseña secuencias completas de comunicación:'}
            </p>
            <div className="space-y-1.5 pt-1">
              {TEMPLATES.map((tmpl, index) => (
                <button
                  key={index}
                  onClick={() => loadTemplate(tmpl.cards)}
                  className="w-full text-left p-3 rounded-2xl bg-indigo-50/40 hover:bg-indigo-50 border border-indigo-100/50 transition-colors text-xs font-bold text-indigo-950 flex items-center justify-between"
                >
                  <span>{lang === Language.ENGLISH ? tmpl.title : tmpl.spanishTitle}</span>
                  <Plus className="w-3.5 h-3.5 text-indigo-500" />
                </button>
              ))}
            </div>
          </div>

          {/* Favorite Phrases */}
          <div className="bg-white border border-rose-100 rounded-[2rem] p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-rose-500 flex items-center gap-1.5">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
              <span>{lang === Language.ENGLISH ? 'Favorite Phrases' : 'Frases Favoritas'}</span>
            </h4>
            <p className="text-[10px] text-slate-500 leading-normal font-semibold">
              {lang === Language.ENGLISH 
                ? 'Save custom sentence combinations for instant quick-play:' 
                : 'Guarda combinaciones de frases personalizadas para reproducir al instante:'}
            </p>
            {favorites.length === 0 ? (
              <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-100 p-3">
                <span className="text-[10px] font-bold text-slate-400 block leading-normal">
                  {lang === Language.ENGLISH 
                    ? 'No favorites yet. Build a sentence and tap "Favorite" to save!' 
                    : 'Aún sin favoritos. ¡Arma una frase y toca "Favorito"!'}
                </span>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {favorites.map((fav) => (
                    <motion.div
                      key={fav.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handleLoadFavorite(fav)}
                      className="group relative w-full text-left p-3 rounded-2xl bg-rose-50/30 hover:bg-rose-50 border border-rose-100/30 hover:border-rose-200/50 transition-all text-xs font-bold text-rose-950 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex flex-col gap-0.5 max-w-[80%]">
                        <span className="truncate block font-black text-rose-950">
                          {lang === Language.ENGLISH ? fav.name : fav.spanishName}
                        </span>
                        <div className="flex gap-1 flex-wrap pt-1 opacity-70">
                          {fav.cards.slice(0, 4).map((c, i) => (
                            <span key={i} className="text-xs" title={lang === Language.ENGLISH ? c.label : c.spanishLabel}>
                              {c.emoji}
                            </span>
                          ))}
                          {fav.cards.length > 4 && <span className="text-[8px] text-slate-400 self-center">+{fav.cards.length - 4}</span>}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const text = fav.cards.map(c => lang === Language.ENGLISH ? c.label : c.spanishLabel).join(' ');
                            speakWithSettings(text);
                          }}
                          className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition-colors"
                          title={lang === Language.ENGLISH ? 'Play now' : 'Pronunciar ahora'}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteFavorite(fav.id, e)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          title={lang === Language.ENGLISH ? 'Delete favorite' : 'Eliminar favorito'}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>

        {/* Center/Right columns: The PECS grid board & custom card adding creator */}
        <div className="lg:col-span-9 space-y-6">

          {/* Grid control bar (Search + Add card trigger) */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-100 rounded-[2rem] p-4 shadow-sm">
            
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === Language.ENGLISH ? "Search cards..." : "Buscar tarjetas..."}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-300"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Config & Action */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              
              {/* Add Custom Button */}
              <button
                id="aac-btn-toggle-add"
                onClick={() => { setIsAddingCard(!isAddingCard); }}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === Language.ENGLISH ? 'Add Card' : 'Crear Tarjeta'}</span>
              </button>

              {/* Quick info popup */}
              <div className="text-[10px] bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-slate-500 font-semibold hidden sm:block">
                💡 {lang === Language.ENGLISH ? 'Double-click to hear single word' : 'Doble toque para escuchar palabra suelta'}
              </div>

            </div>

          </div>

          {/* Create custom card inline slide-down form */}
          <AnimatePresence>
            {isAddingCard && (
              <motion.form
                onSubmit={handleAddCustomCard}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-50 border border-indigo-100 rounded-[2rem] p-6 shadow-inner space-y-4 overflow-hidden"
              >
                <div className="flex items-center justify-between pb-2 border-b border-indigo-100/40">
                  <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    {lang === Language.ENGLISH ? 'Add Custom PECS Tile' : 'Crear Tarjeta PECS Personalizada'}
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingCard(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* English Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Label (English)</label>
                    <input
                      type="text"
                      required
                      value={newCardLabel}
                      onChange={e => setNewCardLabel(e.target.value)}
                      placeholder="e.g. Toy"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-300 text-slate-800"
                    />
                  </div>

                  {/* Spanish Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Nombre (Español)</label>
                    <input
                      type="text"
                      required
                      value={newCardSpanishLabel}
                      onChange={e => setNewCardSpanishLabel(e.target.value)}
                      placeholder="ej. Juguete"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-300 text-slate-800"
                    />
                  </div>

                  {/* Emoji selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Emoji Icon</label>
                    <input
                      type="text"
                      required
                      value={newCardEmoji}
                      onChange={e => setNewCardEmoji(e.target.value)}
                      placeholder="e.g. 🧸"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-300 text-center"
                    />
                  </div>

                  {/* Folder Category */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Category</label>
                    <select
                      value={newCardCategory}
                      onChange={e => setNewCardCategory(e.target.value as PecsCard['category'])}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-300"
                    >
                      <option value="core">Core Words</option>
                      <option value="actions">Actions</option>
                      <option value="food">Food & Drink</option>
                      <option value="feelings">Feelings</option>
                      <option value="places">Places & Toys</option>
                      <option value="people">People</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{lang === Language.ENGLISH ? 'Save PECS Card' : 'Guardar Tarjeta'}</span>
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* THE PECS GRID BOARD */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-4">
            
            {filteredCards.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold text-xs space-y-1">
                <p>No cards match the active folder or search query.</p>
                <button 
                  onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                  className="text-indigo-600 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
                {filteredCards.map(card => {
                  const theme = getCategoryTheme(card.category);
                  return (
                    <motion.div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStartFromGrid(e, card)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleCardClick(card)}
                      onDoubleClick={() => speakWithSettings(lang === Language.ENGLISH ? card.label : card.spanishLabel)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`relative flex flex-col items-center justify-between p-4.5 rounded-[1.5rem] border-2 cursor-pointer shadow-sm select-none text-center ${theme.bg} min-h-32 transition-all cursor-grab active:cursor-grabbing hover:shadow-md`}
                    >
                      
                      {/* Delete Custom Button */}
                      {card.isCustom && (
                        <button
                          onClick={(e) => handleDeleteCustomCard(card.id, e)}
                          className="absolute top-1.5 right-1.5 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                          title="Delete card"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}

                      {/* Folder Category Tag */}
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-45">
                        {card.category}
                      </span>

                      {/* Large Emojis */}
                      <span className="text-4xl my-2.5">{card.emoji}</span>

                      {/* Main Label */}
                      <span className="text-xs font-black tracking-tight leading-tight uppercase">
                        {lang === Language.ENGLISH ? card.label : card.spanishLabel}
                      </span>

                    </motion.div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Speech Fine-tuning Adjuster */}
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50/20 border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Settings className="w-4 h-4 text-indigo-500 animate-spin" />
              {lang === Language.ENGLISH ? 'AAC Speech Engine Calibration' : 'Calibración de Voz AAC'}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Speed / Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>{lang === Language.ENGLISH ? 'Voice Speed' : 'Velocidad de Voz'}</span>
                  <span className="text-indigo-600">{speechRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={speechRate}
                  onChange={e => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 bg-slate-200 rounded-lg appearance-none h-2 cursor-pointer"
                />
                <span className="text-[9px] text-slate-400 font-semibold block">
                  {lang === Language.ENGLISH 
                    ? 'Slower speeds can help speech therapy patients copy phonetic sequences.' 
                    : 'Las velocidades bajas ayudan a los pacientes a asimilar secuencias fonéticas.'}
                </span>
              </div>

              {/* Pitch */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>{lang === Language.ENGLISH ? 'Voice Pitch' : 'Tono de Voz'}</span>
                  <span className="text-indigo-600">{speechPitch}x</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.8"
                  step="0.05"
                  value={speechPitch}
                  onChange={e => setSpeechPitch(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 bg-slate-200 rounded-lg appearance-none h-2 cursor-pointer"
                />
                <span className="text-[9px] text-slate-400 font-semibold block">
                  {lang === Language.ENGLISH 
                    ? 'Raise pitch slightly for friendlier pediatric-focused resonance.' 
                    : 'Aumente un poco para obtener una resonancia más amigable y pediátrica.'}
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
