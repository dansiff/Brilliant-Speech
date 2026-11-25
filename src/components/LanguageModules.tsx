import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  RefreshCw, 
  Trophy, 
  ArrowLeft, 
  Volume2, 
  ArrowRight, 
  Check, 
  Mic, 
  Square, 
  Play, 
  Trash2, 
  FolderHeart, 
  HelpCircle, 
  HelpCircle as QuestionIcon,
  Tag, 
  FileText, 
  Star, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  Eye,
  CheckCircle2,
  ChevronRight,
  Bookmark
} from 'lucide-react';
import { speakText } from '../utils/speechUtils';
import { Language } from '../types';

// Web Audio API Synth pop and success sounds
const playLanguageSound = (type: 'pop' | 'chime' | 'success' | 'record-start' | 'record-stop' | 'wrong') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gainNode.gain.setValueAtTime(0.25, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start();
      osc.stop(now + 0.1);
    } else if (type === 'chime') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start();
      osc.stop(now + 0.3);
    } else if (type === 'wrong') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(120, now + 0.18);
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.start();
      osc.stop(now + 0.18);
    } else if (type === 'record-start') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.12);
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start();
      osc.stop(now + 0.25);
    } else if (type === 'record-stop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(440, now + 0.12);
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start();
      osc.stop(now + 0.25);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
      gainNode.gain.setValueAtTime(0.25, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.start();
      osc.stop(now + 0.45);
    }
  } catch (e) {
    console.warn("Speech audio synth failed:", e);
  }
};

// Types & Interfaces
interface SequenceCard {
  id: string;
  stepNumber: number;
  description: string;
  emoji: string;
}

interface SequencingSet {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate';
  cards: SequenceCard[];
}

interface SorterItem {
  id: string;
  name: string;
  emoji: string;
  category: 'Animals' | 'Vehicles' | 'Fruit' | 'Clothes';
}

interface AttributeItem {
  id: string;
  name: string;
  emoji: string;
  matches: string[]; // attributes e.g. ["yellow", "fly", "bounce"]
}

interface WhQuestionCard {
  id: string;
  type: 'Who' | 'What' | 'Where' | 'Why';
  question: string;
  options: string[];
  correctAnswer: string;
  context: string;
}

interface PracticeStats {
  sequencingWins: number;
  sortingWins: number;
  whWins: number;
  totalPoints: number;
  history: Array<{
    id: string;
    timestamp: string;
    module: string;
    details: string;
    points: number;
  }>;
}

// Sequencing content
const SEQUENCING_SETS: SequencingSet[] = [
  {
    id: 'seq-plant',
    title: 'How to Grow a Flower',
    difficulty: 'Beginner',
    cards: [
      { id: 'plant-1', stepNumber: 1, description: 'Dig a hole in the dirt and drop in a flower seed.', emoji: '🌱' },
      { id: 'plant-2', stepNumber: 2, description: 'Water the seed gently so the soil becomes cozy.', emoji: '💧' },
      { id: 'plant-3', stepNumber: 3, description: 'Bright warm sunshine shines down on the ground.', emoji: '☀️' },
      { id: 'plant-4', stepNumber: 4, description: 'A gorgeous bright flower sprouts up into the fresh air!', emoji: '🌸' }
    ]
  },
  {
    id: 'seq-hands',
    title: 'Washing Your Hands',
    difficulty: 'Beginner',
    cards: [
      { id: 'hands-1', stepNumber: 1, description: 'Wet hands with water and squeeze on soap.', emoji: '🧼' },
      { id: 'hands-2', stepNumber: 2, description: 'Scrub all fingers and palms with funny white bubbles.', emoji: '🧼✨' },
      { id: 'hands-3', stepNumber: 3, description: 'Rinse off all the bubbles under running tap water.', emoji: '🚰' },
      { id: 'hands-4', stepNumber: 4, description: 'Dry wet hands completely using a warm clean towel.', emoji: '🙌' }
    ]
  },
  {
    id: 'seq-sandwich',
    title: 'Making a Jam Sandwich',
    difficulty: 'Intermediate',
    cards: [
      { id: 'sand-1', stepNumber: 1, description: 'Place two soft slices of bread on the board.', emoji: '🍞' },
      { id: 'sand-2', stepNumber: 2, description: 'Spread sweet strawberry jam onto one slice.', emoji: '🍓' },
      { id: 'sand-3', stepNumber: 3, description: 'Put the bread slices together carefully.', emoji: '🥪' },
      { id: 'sand-4', stepNumber: 4, description: 'Take a giant delicious bite and smile!', emoji: '😋' }
    ]
  }
];

// Semantic sorting content
const SEMANTIC_ITEMS: SorterItem[] = [
  { id: 'sort-dog', name: 'Friendly Puppy', emoji: '🐶', category: 'Animals' },
  { id: 'sort-cat', name: 'Fluffy Kitten', emoji: '🐱', category: 'Animals' },
  { id: 'sort-lion', name: 'Roaring Lion', emoji: '🦁', category: 'Animals' },
  { id: 'sort-elephant', name: 'Gigantic Elephant', emoji: '🐘', category: 'Animals' },
  { id: 'sort-bus', name: 'School Bus', emoji: '🚌', category: 'Vehicles' },
  { id: 'sort-car', name: 'Red Racecar', emoji: '🏎️', category: 'Vehicles' },
  { id: 'sort-plane', name: 'Jet Airplane', emoji: '✈️', category: 'Vehicles' },
  { id: 'sort-truck', name: 'Big Firetruck', emoji: '🚒', category: 'Vehicles' },
  { id: 'sort-apple', name: 'Red Apple', emoji: '🍎', category: 'Fruit' },
  { id: 'sort-banana', name: 'Yellow Banana', emoji: '🍌', category: 'Fruit' },
  { id: 'sort-grape', name: 'Sweet Grapes', emoji: '🍇', category: 'Fruit' },
  { id: 'sort-orange', name: 'Sunny Orange', emoji: '🍊', category: 'Fruit' },
  { id: 'sort-jacket', name: 'Winter Coat', emoji: '🧥', category: 'Clothes' },
  { id: 'sort-socks', name: 'Warm Socks', emoji: '🧦', category: 'Clothes' },
  { id: 'sort-hat', name: 'Beanie Hat', emoji: '👒', category: 'Clothes' },
  { id: 'sort-scarf', name: 'Cozy Scarf', emoji: '🧣', category: 'Clothes' }
];

const ATTRIBUTE_ITEMS: AttributeItem[] = [
  { id: 'attr-bee', name: 'Honeybee', emoji: '🐝', matches: ['yellow', 'fly'] },
  { id: 'attr-butterfly', name: 'Butterfly', emoji: '🦋', matches: ['yellow', 'fly'] },
  { id: 'attr-canary', name: 'Canary Bird', emoji: '🐦', matches: ['yellow', 'fly'] },
  { id: 'attr-lemon', name: 'Ripe Lemon', emoji: '🍋', matches: ['yellow'] },
  { id: 'attr-sunflower', name: 'Sunflower', emoji: '🌻', matches: ['yellow'] },
  { id: 'attr-soccer', name: 'Soccer Ball', emoji: '⚽', matches: ['bounce', 'round'] },
  { id: 'attr-basketball', name: 'Basketball', emoji: '🏀', matches: ['bounce', 'round'] },
  { id: 'attr-orange', name: 'Orange Fruit', emoji: '🍊', matches: ['round'] },
  { id: 'attr-balloon', name: 'Bouncy Balloon', emoji: '🎈', matches: ['bounce', 'round', 'fly'] }
];

// WH questions content
const WH_QUESTIONS: WhQuestionCard[] = [
  {
    id: 'wh-1',
    type: 'Who',
    question: 'Who helps us when we feel sick or need a checkup?',
    options: ['A friendly Doctor', 'A brave Firefighter', 'A sweet Baker', 'A fast Pilot'],
    correctAnswer: 'A friendly Doctor',
    context: 'Doctors help keep our bodies healthy and strong!'
  },
  {
    id: 'wh-2',
    type: 'What',
    question: 'What do we brush every morning and night to keep them sparkling?',
    options: ['Our white teeth', 'Our soft hair', 'Our shoes', 'Our school books'],
    correctAnswer: 'Our white teeth',
    context: 'We brush our teeth with toothpaste to prevent cavities!'
  },
  {
    id: 'wh-3',
    type: 'Where',
    question: 'Where do we go to borrow books, read quietly, and find fun stories?',
    options: ['The Public Library', 'The Swimming Pool', 'The Supermarket', 'The Pet Shop'],
    correctAnswer: 'The Public Library',
    context: 'The library is filled with thousands of exciting books and stories!'
  },
  {
    id: 'wh-4',
    type: 'Why',
    question: 'Why do we wear warm winter coats, fluffy beanies, and scarves?',
    options: ['Because it is very cold outside', 'To swim in the backyard pool', 'Because we are getting hungry', 'To go to sleep in bed'],
    correctAnswer: 'Because it is very cold outside',
    context: 'Warm clothes protect us from chilly wind, snow, and ice!'
  },
  {
    id: 'wh-5',
    type: 'Who',
    question: 'Who flies the giant airplanes safely across the blue sky?',
    options: ['The Airplane Pilot', 'The Train Engineer', 'The Chef', 'The Teacher'],
    correctAnswer: 'The Airplane Pilot',
    context: 'Pilots undergo special training to navigate planes.'
  },
  {
    id: 'wh-6',
    type: 'What',
    question: 'What falls down from dark storm clouds to feed thirsty trees and grass?',
    options: ['Cool Rain water', 'Bright stars', 'Warm bread', 'Toy cars'],
    correctAnswer: 'Cool Rain water',
    context: 'Rain water helps nature grow and bloom!'
  },
  {
    id: 'wh-7',
    type: 'Where',
    question: 'Where do kids go to slide, swing, climb structures, and play tag?',
    options: ['The Outdoor Playground', 'The Grocery Store', 'The Kitchen', 'The Garage'],
    correctAnswer: 'The Outdoor Playground',
    context: 'Playgrounds are great places to exercise and meet friends!'
  },
  {
    id: 'wh-8',
    type: 'Why',
    question: 'Why do we need to drink plenty of clean fresh water every single day?',
    options: ['To stay hydrated and active', 'To make our hair grow longer', 'To look like a fish', 'To float in the air'],
    correctAnswer: 'To stay hydrated and active',
    context: 'Water keeps our muscles hydrated and organs working correctly!'
  }
];

export const LanguageModules: React.FC = () => {
  // Modules: 'sequencing' | 'sorting' | 'wh' | 'stats'
  const [activeModule, setActiveModule] = useState<'sequencing' | 'sorting' | 'wh' | 'stats'>('sequencing');

  // Stats / Progress state
  const [stats, setStats] = useState<PracticeStats>({
    sequencingWins: 0,
    sortingWins: 0,
    whWins: 0,
    totalPoints: 0,
    history: []
  });

  // ---------------------------------------------------------------------------
  // 1. SEQUENCING MODULE STATES
  // ---------------------------------------------------------------------------
  const [currentSeqSet, setCurrentSeqSet] = useState<SequencingSet>(SEQUENCING_SETS[0]);
  const [shuffledCards, setShuffledCards] = useState<SequenceCard[]>([]);
  const [placedCards, setPlacedCards] = useState<Array<SequenceCard | null>>([null, null, null, null]);
  const [isSeqChecking, setIsSeqChecking] = useState<boolean>(false);
  const [seqSuccess, setSeqSuccess] = useState<boolean | null>(null);
  
  // Custom speech/recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [hasRecording, setHasRecording] = useState<boolean>(false);
  const [recordingPlaybackActive, setRecordingPlaybackActive] = useState<boolean>(false);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ---------------------------------------------------------------------------
  // 2. SEMANTIC CATEGORY SORTING STATES
  // ---------------------------------------------------------------------------
  const [sortingMode, setSortingMode] = useState<'baskets' | 'attributes'>('baskets');
  const [targetCategoryLeft, setTargetCategoryLeft] = useState<'Animals' | 'Fruit'>('Animals');
  const [targetCategoryRight, setTargetCategoryRight] = useState<'Vehicles' | 'Clothes'>('Vehicles');
  const [currentSorterItem, setCurrentSorterItem] = useState<SorterItem | null>(null);
  const [sortingMatchesCount, setSortingMatchesCount] = useState<number>(0);
  const [sortingItemsHistory, setSortingItemsHistory] = useState<Array<{ item: SorterItem; target: 'left' | 'right'; correct: boolean }>>([]);
  const [sortingRoundComplete, setSortingRoundComplete] = useState<boolean>(false);

  // Attribute sorting
  const [selectedAttributeFilter, setSelectedAttributeFilter] = useState<'yellow' | 'fly' | 'bounce'>('yellow');
  const [attributeSelections, setAttributeSelections] = useState<string[]>([]);
  const [attrSubmitResult, setAttrSubmitResult] = useState<boolean | null>(null);

  // ---------------------------------------------------------------------------
  // 3. WH-QUESTIONS STATES
  // ---------------------------------------------------------------------------
  const [currentWhIndex, setCurrentWhIndex] = useState<number>(0);
  const [selectedWhAnswer, setSelectedWhAnswer] = useState<string | null>(null);
  const [whIsCorrect, setWhIsCorrect] = useState<boolean | null>(null);
  const [whScore, setWhScore] = useState<number>(0);

  // ---------------------------------------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const saved = localStorage.getItem('brilliant_speech_language_stats');
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse language stats:", e);
      }
    }
  }, []);

  // Save utility
  const saveStatsAndProgress = (updated: PracticeStats) => {
    setStats(updated);
    localStorage.setItem('brilliant_speech_language_stats', JSON.stringify(updated));
  };

  // ---------------------------------------------------------------------------
  // SEQUENCING ENGINE
  // ---------------------------------------------------------------------------
  useEffect(() => {
    resetSequencingSet(currentSeqSet);
  }, [currentSeqSet]);

  const resetSequencingSet = (set: SequencingSet) => {
    // Shuffle cards and clear slot matches
    const shuffled = [...set.cards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setPlacedCards([null, null, null, null]);
    setSeqSuccess(null);
    setIsSeqChecking(false);
    stopRecording();
    setHasRecording(false);
  };

  const placeCardInSlot = (card: SequenceCard, slotIdx: number) => {
    playLanguageSound('pop');
    
    // Check if card is already placed somewhere and clear it
    const updatedPlaced = placedCards.map((c, idx) => {
      if (c?.id === card.id) {
        return null;
      }
      return c;
    });

    updatedPlaced[slotIdx] = card;
    setPlacedCards(updatedPlaced);

    // Remove from shuffled pile
    setShuffledCards(prev => prev.filter(c => c.id !== card.id));
  };

  const removeCardFromSlot = (slotIdx: number) => {
    const card = placedCards[slotIdx];
    if (!card) return;

    playLanguageSound('pop');
    setShuffledCards(prev => [...prev, card]);
    
    const updatedPlaced = [...placedCards];
    updatedPlaced[slotIdx] = null;
    setPlacedCards(updatedPlaced);
  };

  const verifySequence = () => {
    setIsSeqChecking(true);
    
    const allPlaced = placedCards.every(c => c !== null);
    if (!allPlaced) {
      playLanguageSound('wrong');
      setIsSeqChecking(false);
      alert("Please place all four cards in slots first!");
      return;
    }

    // Check step numbers sequentially
    const correct = placedCards.every((c, idx) => c!.stepNumber === idx + 1);

    if (correct) {
      playLanguageSound('success');
      setSeqSuccess(true);

      // Award points
      const pointsToAdd = currentSeqSet.difficulty === 'Intermediate' ? 20 : 15;
      const updatedHistory = [
        {
          id: `log-seq-${Date.now()}`,
          timestamp: new Date().toLocaleDateString(),
          module: 'Sequencing',
          details: `Completed "${currentSeqSet.title}" correctly!`,
          points: pointsToAdd
        },
        ...stats.history
      ];

      saveStatsAndProgress({
        ...stats,
        sequencingWins: stats.sequencingWins + 1,
        totalPoints: stats.totalPoints + pointsToAdd,
        history: updatedHistory.slice(0, 15)
      });
    } else {
      playLanguageSound('wrong');
      setSeqSuccess(false);
      setIsSeqChecking(false);
    }
  };

  // Recording Simulation
  const startRecording = () => {
    playLanguageSound('record-start');
    setIsRecording(true);
    setRecordingSeconds(0);
    setHasRecording(false);
    
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds(prev => {
        if (prev >= 20) {
          stopRecording();
          return 20;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (isRecording) {
      playLanguageSound('record-stop');
      setIsRecording(false);
      setHasRecording(true);
    }
  };

  const playRecordedNarrative = () => {
    if (!hasRecording || recordingPlaybackActive) return;
    setRecordingPlaybackActive(true);
    playLanguageSound('chime');
    
    setTimeout(() => {
      setRecordingPlaybackActive(false);
    }, recordingSeconds * 1000);
  };

  // ---------------------------------------------------------------------------
  // SEMANTIC SORTING ENGINE
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (activeModule === 'sorting') {
      initializeSortingRound();
    }
  }, [activeModule, sortingMode]);

  const initializeSortingRound = () => {
    // Pick categories
    if (sortingMode === 'baskets') {
      const leftCat = Math.random() > 0.5 ? 'Animals' : 'Fruit';
      const rightCat = leftCat === 'Animals' ? 'Vehicles' : 'Clothes';
      
      setTargetCategoryLeft(leftCat as any);
      setTargetCategoryRight(rightCat as any);

      // Filter possible matching items
      const availableItems = SEMANTIC_ITEMS.filter(
        item => item.category === leftCat || item.category === rightCat
      );

      // Take first item shuffled
      const shuffled = [...availableItems].sort(() => Math.random() - 0.5);
      setCurrentSorterItem(shuffled[0] || null);
      setSortingMatchesCount(0);
      setSortingItemsHistory([]);
      setSortingRoundComplete(false);
    } else {
      // Attribute selections
      setSelectedAttributeFilter(['yellow', 'fly', 'bounce'][Math.floor(Math.random() * 3)] as any);
      setAttributeSelections([]);
      setAttrSubmitResult(null);
    }
  };

  const sortItemToSide = (side: 'left' | 'right') => {
    if (!currentSorterItem || sortingRoundComplete) return;

    const sideCategory = side === 'left' ? targetCategoryLeft : targetCategoryRight;
    const isCorrect = currentSorterItem.category === sideCategory;

    if (isCorrect) {
      playLanguageSound('pop');
    } else {
      playLanguageSound('wrong');
    }

    const nextHistory = [
      { item: currentSorterItem, target: side, correct: isCorrect },
      ...sortingItemsHistory
    ];
    setSortingItemsHistory(nextHistory);

    const matches = isCorrect ? sortingMatchesCount + 1 : sortingMatchesCount;
    setSortingMatchesCount(matches);

    // Filter down to get next item
    const allowedCategories = [targetCategoryLeft, targetCategoryRight];
    const availableItems = SEMANTIC_ITEMS.filter(
      item => (item.category === targetCategoryLeft || item.category === targetCategoryRight) && 
              !nextHistory.some(hist => hist.item.id === item.id)
    );

    if (nextHistory.length >= 6 || availableItems.length === 0) {
      // Round Complete!
      setSortingRoundComplete(true);
      playLanguageSound('success');

      // Points
      const points = Math.min(nextHistory.filter(h => h.correct).length * 4, 24);
      const updatedHistory = [
        {
          id: `log-sort-${Date.now()}`,
          timestamp: new Date().toLocaleDateString(),
          module: 'Semantic Sorting',
          details: `Sorted ${matches}/${nextHistory.length} objects correctly!`,
          points
        },
        ...stats.history
      ];

      saveStatsAndProgress({
        ...stats,
        sortingWins: stats.sortingWins + 1,
        totalPoints: stats.totalPoints + points,
        history: updatedHistory.slice(0, 15)
      });
    } else {
      // Select next item
      const shuffled = [...availableItems].sort(() => Math.random() - 0.5);
      setCurrentSorterItem(shuffled[0]);
    }
  };

  const toggleAttributeSelection = (item: AttributeItem) => {
    playLanguageSound('pop');
    if (attributeSelections.includes(item.id)) {
      setAttributeSelections(prev => prev.filter(id => id !== item.id));
    } else {
      setAttributeSelections(prev => [...prev, item.id]);
    }
  };

  const verifyAttributes = () => {
    // Find all items that match selected attribute
    const trulyCorrectItems = ATTRIBUTE_ITEMS.filter(item => 
      item.matches.includes(selectedAttributeFilter)
    );

    const correctIds = trulyCorrectItems.map(i => i.id);
    const correctCount = attributeSelections.filter(id => correctIds.includes(id)).length;
    const incorrectCount = attributeSelections.filter(id => !correctIds.includes(id)).length;

    const allFound = correctCount === correctIds.length && incorrectCount === 0;

    if (allFound) {
      playLanguageSound('success');
      setAttrSubmitResult(true);

      const points = 15;
      const updatedHistory = [
        {
          id: `log-attr-${Date.now()}`,
          timestamp: new Date().toLocaleDateString(),
          module: 'Attribute Matching',
          details: `Found all items that are "${selectedAttributeFilter}"!`,
          points
        },
        ...stats.history
      ];

      saveStatsAndProgress({
        ...stats,
        sortingWins: stats.sortingWins + 1,
        totalPoints: stats.totalPoints + points,
        history: updatedHistory.slice(0, 15)
      });
    } else {
      playLanguageSound('wrong');
      setAttrSubmitResult(false);
    }
  };

  // ---------------------------------------------------------------------------
  // WH-QUESTIONS ENGINE
  // ---------------------------------------------------------------------------
  const handleWhAnswer = (option: string) => {
    if (whIsCorrect !== null) return; // Prevent double clicks

    const currentCard = WH_QUESTIONS[currentWhIndex];
    const isCorrect = option === currentCard.correctAnswer;

    setSelectedWhAnswer(option);
    setWhIsCorrect(isCorrect);

    if (isCorrect) {
      playLanguageSound('chime');
      setWhScore(prev => prev + 1);
    } else {
      playLanguageSound('wrong');
    }
  };

  const nextWhQuestion = () => {
    setSelectedWhAnswer(null);
    setWhIsCorrect(null);

    if (currentWhIndex + 1 < WH_QUESTIONS.length) {
      setCurrentWhIndex(prev => prev + 1);
    } else {
      // Completed the full quiz deck
      playLanguageSound('success');
      const earnedPoints = whScore * 5;

      const updatedHistory = [
        {
          id: `log-wh-${Date.now()}`,
          timestamp: new Date().toLocaleDateString(),
          module: 'WH-Questions',
          details: `Completed quiz deck, scoring ${whScore}/${WH_QUESTIONS.length}!`,
          points: earnedPoints
        },
        ...stats.history
      ];

      saveStatsAndProgress({
        ...stats,
        whWins: stats.whWins + 1,
        totalPoints: stats.totalPoints + earnedPoints,
        history: updatedHistory.slice(0, 15)
      });

      // Show congratulations page (we can wrap back or resets)
      setCurrentWhIndex(0);
      setWhScore(0);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* 1. TOP HEADER SUMMARY & MODULE TAB NAVIGATION */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
            <FolderHeart className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-800">Language Exercises</h3>
            <p className="text-xs font-bold text-slate-400">Expressive, Receptive, and Logical sequencing tools</p>
          </div>
        </div>

        {/* Level & Points Summary */}
        <div className="flex items-center gap-6 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-2.5">
          <div className="text-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Total Stars</span>
            <span className="text-lg font-black text-amber-500 flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              {stats.totalPoints}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-slate-200" />
          <div className="text-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Exercises</span>
            <span className="text-sm font-extrabold text-indigo-600">
              {stats.sequencingWins + stats.sortingWins + stats.whWins} Completed
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center p-1 bg-white border border-slate-100 rounded-2xl max-w-md mx-auto shadow-sm">
        {[
          { id: 'sequencing', label: 'Sequencing', emoji: '🎬' },
          { id: 'sorting', label: 'Sorting', emoji: '🍎' },
          { id: 'wh', label: 'WH-Questions', emoji: '❓' },
          { id: 'stats', label: 'My Progress', emoji: '📊' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveModule(tab.id as any);
              playLanguageSound('pop');
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all text-center flex items-center justify-center gap-1 ${activeModule === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 2. MAIN ACTIVE MODULE VIEW AREA */}
      <AnimatePresence mode="wait">
        
        {/* =================================================================== */}
        {/* MODULE A: LOGICAL SEQUENCING CARDS */}
        {/* =================================================================== */}
        {activeModule === 'sequencing' && (
          <motion.div
            key="sequencing-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Guide & Presets */}
            <div className="bg-gradient-to-br from-indigo-50/50 to-emerald-50/40 border border-indigo-100/40 rounded-[2rem] p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                  Step-by-Step Logic
                </span>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Logical Sequencing Cards</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Put the cards in the correct order from 1 to 4 to complete the logical timeline! Once in place, press verify, then practice reading and record your child's narrative narration below.
                </p>
              </div>

              {/* Set selector */}
              <div className="space-y-1 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm justify-center flex flex-col">
                <label className="text-[10px] font-black uppercase text-slate-400">Choose Sequence</label>
                <div className="space-y-1">
                  {SEQUENCING_SETS.map((set) => (
                    <button
                      key={set.id}
                      onClick={() => setCurrentSeqSet(set)}
                      className={`w-full py-2 px-3 text-left rounded-xl text-xs font-black border transition-all flex justify-between items-center ${currentSeqSet.id === set.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'}`}
                    >
                      <span>{set.title}</span>
                      <span className="text-[9px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-400">{set.difficulty}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Placed slots timeline */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Drag or click cards to order</span>
                <button
                  onClick={() => resetSequencingSet(currentSeqSet)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reset Board
                </button>
              </div>

              {/* Four active slots */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((slotIdx) => {
                  const placedCard = placedCards[slotIdx];
                  return (
                    <div 
                      key={slotIdx} 
                      className={`min-h-[160px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 relative transition-all ${placedCard ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-50/20 border-slate-200/60'}`}
                    >
                      <div className="absolute top-2 left-2 bg-slate-800 text-white w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center">
                        {slotIdx + 1}
                      </div>

                      {placedCard ? (
                        <div className="w-full flex flex-col items-center text-center space-y-2">
                          <span className="text-4xl filter drop-shadow">{placedCard.emoji}</span>
                          <p className="text-xs font-bold text-slate-700 leading-tight">
                            {placedCard.description}
                          </p>
                          <button
                            onClick={() => removeCardFromSlot(slotIdx)}
                            className="text-[9px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg border border-transparent hover:border-red-100 hover:bg-red-100/50 transition-all mt-2"
                          >
                            Remove Card
                          </button>
                        </div>
                      ) : (
                        <div className="text-slate-300 font-bold text-xs">
                          Place Card Here
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Shuffled/unplaced cards selection pile */}
              {shuffledCards.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <p className="text-[10px] font-black uppercase text-slate-400">Available Cards (Click to place in next slot):</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {shuffledCards.map((card) => (
                      <motion.div
                        key={card.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const nextEmptyIdx = placedCards.indexOf(null);
                          if (nextEmptyIdx !== -1) {
                            placeCardInSlot(card, nextEmptyIdx);
                          } else {
                            alert("No empty slots! Remove a card first.");
                          }
                        }}
                        className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex items-center gap-3 cursor-pointer select-none max-w-xs transition-colors hover:border-indigo-400"
                      >
                        <span className="text-3xl">{card.emoji}</span>
                        <p className="text-xs font-semibold text-slate-700 line-clamp-2 leading-tight">
                          {card.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {placedCards.every(c => c !== null) && (
                <div className="flex flex-col items-center space-y-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={verifySequence}
                    className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-100 hover:shadow-emerald-200 hover:scale-103 active:scale-97 transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Verify Timeline
                  </button>

                  {seqSuccess === true && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4 max-w-lg w-full"
                    >
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                        <Trophy className="w-6 h-6 animate-bounce" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-emerald-900">Success! Correct Sequencing</h4>
                        <p className="text-xs text-emerald-600 font-bold mt-1">
                          You earned <span className="text-amber-600 font-black">+{currentSeqSet.difficulty === 'Intermediate' ? 20 : 15} Stars</span>! Let's practice reciting the sequence loud.
                        </p>
                      </div>

                      {/* Speaking / Audio Narrative Practice */}
                      <div className="bg-white border border-emerald-200/60 p-4 rounded-2xl shadow-sm text-left space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider flex items-center gap-1">
                            <Mic className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                            Speech Reciter & Recorder
                          </span>
                          {isRecording && (
                            <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                              Recording 0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 font-medium leading-normal">
                          Read the timeline aloud in sequence. If you want, turn on the microphone below to record and play back your voice trial!
                        </p>

                        <div className="flex items-center gap-3">
                          {!isRecording ? (
                            <button
                              onClick={startRecording}
                              className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5"
                            >
                              <Mic className="w-3.5 h-3.5" /> Start Recording
                            </button>
                          ) : (
                            <button
                              onClick={stopRecording}
                              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
                            >
                              <Square className="w-3.5 h-3.5" /> Stop & Save
                            </button>
                          )}

                          {hasRecording && (
                            <button
                              onClick={playRecordedNarrative}
                              disabled={recordingPlaybackActive}
                              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${recordingPlaybackActive ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'}`}
                            >
                              <Play className="w-3.5 h-3.5" /> Play Voice Review
                            </button>
                          )}
                        </div>

                        {/* Animated waveform visual feedback */}
                        {isRecording && (
                          <div className="flex items-center justify-center gap-1.5 h-8 py-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((h, i) => (
                              <motion.div
                                key={i}
                                animate={{ height: [4, h * 3, 4] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.05 }}
                                className="w-1 bg-red-400 rounded-full"
                              />
                            ))}
                          </div>
                        )}
                        {recordingPlaybackActive && (
                          <div className="flex items-center justify-center gap-1.5 h-8 py-1">
                            {[1, 3, 5, 7, 5, 3, 1, 4, 8, 4, 1, 3, 5, 3, 1].map((h, i) => (
                              <motion.div
                                key={i}
                                animate={{ height: [4, h * 3, 4] }}
                                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.04 }}
                                className="w-1 bg-indigo-400 rounded-full"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {seqSuccess === false && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-4 bg-red-50 border border-red-200 rounded-2xl text-center max-w-sm"
                    >
                      <h4 className="text-xs font-black text-red-900 flex items-center justify-center gap-1">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        Sequence order incorrect
                      </h4>
                      <p className="text-[11px] text-red-600 font-bold mt-1">
                        Don't worry! Click "Remove Card" or drag items to swap positions, and check again.
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* =================================================================== */}
        {/* MODULE B: SEMANTIC FEATURE & CATEGORY SORTING */}
        {/* =================================================================== */}
        {activeModule === 'sorting' && (
          <motion.div
            key="sorting-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Sorting mini-sub-tabs */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setSortingMode('baskets')}
                className={`py-1.5 px-4 rounded-xl text-xs font-black border transition-all ${sortingMode === 'baskets' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                📥 Basket Category Sorting
              </button>
              <button
                onClick={() => setSortingMode('attributes')}
                className={`py-1.5 px-4 rounded-xl text-xs font-black border transition-all ${sortingMode === 'attributes' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                🎨 Attribute Matching
              </button>
            </div>

            {sortingMode === 'baskets' ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left Basket column */}
                <div className="md:col-span-4 bg-white border border-slate-100 rounded-[2.5rem] p-6 text-center space-y-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500" />
                  
                  <div className="space-y-1">
                    <span className="text-[2.5rem] block">🧺</span>
                    <h3 className="text-lg font-black text-indigo-800 uppercase tracking-tight">{targetCategoryLeft}</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Only place {targetCategoryLeft.toLowerCase()} items here</p>
                  </div>

                  <div className="py-6 border-y border-slate-50 min-h-[120px] flex flex-wrap justify-center gap-1.5">
                    {sortingItemsHistory.filter(h => h.target === 'left').map((hist, idx) => (
                      <span 
                        key={idx} 
                        className={`text-2xl p-1.5 rounded-lg border flex items-center justify-center ${hist.correct ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200 opacity-60'}`}
                        title={hist.item.name}
                      >
                        {hist.item.emoji}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => sortItemToSide('left')}
                    disabled={sortingRoundComplete || !currentSorterItem}
                    className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-black text-xs rounded-xl transition-all"
                  >
                    Place in Left Basket
                  </button>
                </div>

                {/* Middle Item Pile */}
                <div className="md:col-span-4 bg-slate-50/50 border border-slate-200/60 rounded-[2.5rem] p-6 text-center flex flex-col justify-between shadow-inner">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Items Sorted</span>
                    <p className="text-xl font-black mt-1">{sortingItemsHistory.length} / 6</p>
                  </div>

                  <AnimatePresence mode="wait">
                    {currentSorterItem && !sortingRoundComplete ? (
                      <motion.div
                        key={currentSorterItem.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="my-8 space-y-3"
                      >
                        <div className="w-24 h-24 bg-white rounded-[2rem] border border-slate-200/80 shadow-md flex items-center justify-center mx-auto text-5xl">
                          {currentSorterItem.emoji}
                        </div>
                        <h4 className="text-base font-black text-slate-800 tracking-tight">{currentSorterItem.name}</h4>
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => speakText(currentSorterItem.name, Language.ENGLISH)}
                            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 shadow-sm"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="my-8 text-center space-y-2">
                        <span className="text-3xl">🎉</span>
                        <h4 className="text-xs font-black text-slate-600">Round Complete!</h4>
                        <p className="text-[10px] text-slate-400">Sorted matches score count is: {sortingMatchesCount} / 6</p>
                      </div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={initializeSortingRound}
                    className="w-full py-3 bg-slate-800 text-white font-black text-xs rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Next Round
                  </button>
                </div>

                {/* Right Basket column */}
                <div className="md:col-span-4 bg-white border border-slate-100 rounded-[2.5rem] p-6 text-center space-y-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
                  
                  <div className="space-y-1">
                    <span className="text-[2.5rem] block">📦</span>
                    <h3 className="text-lg font-black text-emerald-800 uppercase tracking-tight">{targetCategoryRight}</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Only place {targetCategoryRight.toLowerCase()} items here</p>
                  </div>

                  <div className="py-6 border-y border-slate-50 min-h-[120px] flex flex-wrap justify-center gap-1.5">
                    {sortingItemsHistory.filter(h => h.target === 'right').map((hist, idx) => (
                      <span 
                        key={idx} 
                        className={`text-2xl p-1.5 rounded-lg border flex items-center justify-center ${hist.correct ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200 opacity-60'}`}
                        title={hist.item.name}
                      >
                        {hist.item.emoji}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => sortItemToSide('right')}
                    disabled={sortingRoundComplete || !currentSorterItem}
                    className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-black text-xs rounded-xl transition-all"
                  >
                    Place in Right Box
                  </button>
                </div>

              </div>
            ) : (
              /* Attribute Matching Grid Mode */
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-6">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
                  <span className="text-2xl">✨</span>
                  <div className="space-y-0.5 text-left">
                    <span className="text-[10px] font-black uppercase text-amber-700">Semantic Feature Task</span>
                    <p className="text-xs text-amber-900 font-extrabold">
                      "Find everything that has the following attribute: <span className="underline uppercase tracking-wide text-indigo-700 font-black">{selectedAttributeFilter}</span>!"
                    </p>
                  </div>
                </div>

                {/* Grid list of Attribute items */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {ATTRIBUTE_ITEMS.map((item) => {
                    const isSelected = attributeSelections.includes(item.id);
                    return (
                      <motion.div
                        key={item.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleAttributeSelection(item)}
                        className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-center gap-3 select-none ${isSelected ? 'bg-indigo-50 border-indigo-400 text-indigo-900' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'}`}
                      >
                        <span className="text-3xl">{item.emoji}</span>
                        <div className="text-left">
                          <p className="text-xs font-black">{item.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold">Category Item</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-3">
                  <div className="flex gap-3">
                    <button
                      onClick={verifyAttributes}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow transition-all"
                    >
                      Check Choices
                    </button>
                    <button
                      onClick={initializeSortingRound}
                      className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black text-xs rounded-xl border border-slate-200 transition-all"
                    >
                      New Puzzle
                    </button>
                  </div>

                  {attrSubmitResult === true && (
                    <p className="text-xs font-black text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full">
                      🎉 Perfect Match! You found them all. Stars added!
                    </p>
                  )}
                  {attrSubmitResult === false && (
                    <p className="text-xs font-black text-red-600 bg-red-50 px-4 py-1.5 rounded-full">
                      ❌ Not quite. Double-check your choices! Keep trying.
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* =================================================================== */}
        {/* MODULE C: VISUAL WH-QUESTIONS FLASHCARDS */}
        {/* =================================================================== */}
        {activeModule === 'wh' && (
          <motion.div
            key="wh-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* WH Intro Header Banner */}
            <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">❓</span>
                <div className="text-left">
                  <span className="text-[10px] font-black uppercase text-indigo-500">Structured Language Questions</span>
                  <p className="text-xs text-indigo-900 font-black">Practice structured Who, What, Where, and Why question patterns</p>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-white px-3 py-1 rounded-full border border-indigo-200">
                Score: {whScore} Completed
              </span>
            </div>

            {/* Main Flashcard Container */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 sm:p-8 shadow-sm max-w-xl mx-auto space-y-6 text-center">
              
              {/* Card Badge identifying WH type */}
              <div>
                <span className="px-4 py-1 rounded-full bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest">
                  {WH_QUESTIONS[currentWhIndex].type} Question
                </span>
              </div>

              {/* Large question readout */}
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-snug">
                  {WH_QUESTIONS[currentWhIndex].question}
                </h3>
              </div>

              {/* Option Choice Buttons */}
              <div className="grid grid-cols-1 gap-3">
                {WH_QUESTIONS[currentWhIndex].options.map((option, idx) => {
                  const isSelected = selectedWhAnswer === option;
                  const isCorrectAnswer = option === WH_QUESTIONS[currentWhIndex].correctAnswer;
                  
                  let btnStyle = "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300";
                  if (selectedWhAnswer !== null) {
                    if (isCorrectAnswer) {
                      btnStyle = "bg-emerald-50 border-emerald-400 text-emerald-800 font-extrabold";
                    } else if (isSelected) {
                      btnStyle = "bg-red-50 border-red-300 text-red-800";
                    } else {
                      btnStyle = "bg-slate-50 opacity-40 border-slate-200 text-slate-400";
                    }
                  }

                  return (
                    <motion.button
                      key={idx}
                      disabled={selectedWhAnswer !== null}
                      whileHover={selectedWhAnswer === null ? { scale: 1.01 } : {}}
                      whileTap={selectedWhAnswer === null ? { scale: 0.99 } : {}}
                      onClick={() => handleWhAnswer(option)}
                      className={`w-full py-3 px-4 text-xs font-black rounded-xl border text-left transition-all flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{option}</span>
                      
                      {selectedWhAnswer !== null && isCorrectAnswer && (
                        <span className="text-emerald-600 bg-emerald-100/60 p-1 rounded-full">✓</span>
                      )}
                      {selectedWhAnswer !== null && isSelected && !isCorrectAnswer && (
                        <span className="text-red-500 bg-red-100/60 px-1.5 py-0.5 rounded-full">✗</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Feedback and Continue Controls */}
              {whIsCorrect !== null && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl border bg-slate-50 text-left space-y-3"
                >
                  <p className="text-xs text-slate-600 leading-normal font-semibold">
                    <span className="font-extrabold text-slate-800 uppercase block mb-1">Context Breakdown:</span>
                    {WH_QUESTIONS[currentWhIndex].context}
                  </p>

                  <div className="flex justify-end">
                    <button
                      onClick={nextWhQuestion}
                      className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-black flex items-center gap-1 transition-all shadow-md"
                    >
                      Next Question <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

            </div>
          </motion.div>
        )}

        {/* =================================================================== */}
        {/* MODULE D: STATS / DETAILED PRACTICE HISTORY */}
        {/* =================================================================== */}
        {activeModule === 'stats' && (
          <motion.div
            key="stats-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 max-w-2xl mx-auto"
          >
            {/* Dashboard stats layout */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <span className="text-[2.2rem] block mb-1">🎬</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sequencing Rounds</p>
                <p className="text-xl font-black text-slate-800">{stats.sequencingWins}</p>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <span className="text-[2.2rem] block mb-1">🍎</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sorting Rounds</p>
                <p className="text-xl font-black text-slate-800">{stats.sortingWins}</p>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <span className="text-[2.2rem] block mb-1">❓</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">WH-Questions</p>
                <p className="text-xl font-black text-slate-800">{stats.whWins}</p>
              </div>
            </div>

            {/* Detailed practice history */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  Recent Language Module Practices
                </h3>
                {stats.history.length > 0 && (
                  <button
                    onClick={() => {
                      saveStatsAndProgress({
                        sequencingWins: 0,
                        sortingWins: 0,
                        whWins: 0,
                        totalPoints: 0,
                        history: []
                      });
                      playLanguageSound('pop');
                    }}
                    className="text-[9px] font-black text-red-500 hover:text-red-600 bg-red-50 px-2.5 py-1 rounded-lg transition-all"
                  >
                    Clear History
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {stats.history.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200/80 rounded-2xl p-4">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      No practices logged yet. Choose a tab above!
                    </p>
                  </div>
                ) : (
                  stats.history.map((hist) => (
                    <div key={hist.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                      <div className="text-left space-y-0.5">
                        <span className="text-[9px] font-black uppercase text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {hist.module}
                        </span>
                        <p className="text-xs font-bold text-slate-700 mt-1">{hist.details}</p>
                        <p className="text-[9px] text-slate-400 font-semibold">{hist.timestamp}</p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-xs font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-0.5">
                          ⭐ +{hist.points}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};
