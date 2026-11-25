import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  RefreshCw, 
  Trophy, 
  ArrowLeft, 
  Volume2, 
  Languages, 
  Type, 
  MessageCircle,
  Flag,
  Globe
} from 'lucide-react';
import { Language } from '../types';
import { speakText } from '../utils/speechUtils';
import { BILINGUAL_WORDS, BILINGUAL_PHRASES, BilingualPair } from '../constants/bilingualContent';
import { triggerHaptic } from '../utils/haptics';
import { shareAchievement } from '../utils/nativeBridge';

interface Card {
  id: string;
  pairId: string;
  content: string;
  lang: 'en' | 'es';
  isFlipped: boolean;
  isMatched: boolean;
}

interface BilingualMatchingGameProps {
  onClose: () => void;
  playCue: (type: 'chime' | 'swoosh' | 'pop') => void;
  sensoryProfile?: any;
}

export const BilingualMatchingGame: React.FC<BilingualMatchingGameProps> = ({
  onClose,
  playCue,
  sensoryProfile
}) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [difficulty, setDifficulty] = useState<'words' | 'phrases'>('words');
  const [showPronounceChallenge, setShowPronounceChallenge] = useState<BilingualPair | null>(null);

  useEffect(() => {
    initializeGame();
  }, [difficulty]);

  const initializeGame = () => {
    const sourceData = difficulty === 'words' ? BILINGUAL_WORDS : BILINGUAL_PHRASES;
    const selectedPairs = [...sourceData]
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);

    const gameCards: Card[] = [];
    selectedPairs.forEach((pair, index) => {
      gameCards.push({
        id: `en-${index}`,
        pairId: `pair-${index}`,
        content: pair.en,
        lang: 'en',
        isFlipped: false,
        isMatched: false
      });
      gameCards.push({
        id: `es-${index}`,
        pairId: `pair-${index}`,
        content: pair.es,
        lang: 'es',
        isFlipped: false,
        isMatched: false
      });
    });

    setCards(gameCards.sort(() => Math.random() - 0.5));
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setIsWon(false);
    setShowPronounceChallenge(null);
  };

  const handleCardClick = (index: number) => {
    if (
      flippedCards.length === 2 || 
      cards[index].isFlipped || 
      cards[index].isMatched ||
      isWon
    ) return;

    playCue('pop');
    if (!sensoryProfile?.reducedMotion) {
      triggerHaptic('light');
    }

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    // Speak content
    const lang = cards[index].lang === 'es' ? Language.SPANISH : Language.ENGLISH;
    speakText(cards[index].content, lang);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [firstIndex, secondIndex] = newFlipped;
      
      if (cards[firstIndex].pairId === cards[secondIndex].pairId) {
        // Match!
        setTimeout(() => {
          playCue('chime');
          if (!sensoryProfile?.reducedMotion) {
            triggerHaptic('success');
          }
          const matchedCards = [...cards];
          matchedCards[firstIndex].isMatched = true;
          matchedCards[secondIndex].isMatched = true;
          setCards(matchedCards);
          setFlippedCards([]);
          setMatches(m => m + 1);
          
          // Show Pronunciation Challenge (Find the original pair data)
          const sourceData = difficulty === 'words' ? BILINGUAL_WORDS : BILINGUAL_PHRASES;
          const matchedPair = sourceData.find(p => p.en === (cards[firstIndex].lang === 'en' ? cards[firstIndex].content : cards[secondIndex].content));
          if (matchedPair) {
            setShowPronounceChallenge(matchedPair);
          }

          if (matches + 1 === cards.length / 2) {
            setTimeout(() => {
              setIsWon(true);
              if (!sensoryProfile?.reducedMotion) {
                triggerHaptic('heavy');
              }
            }, 1500);
          }
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          if (!sensoryProfile?.reducedMotion) {
            triggerHaptic('medium');
          }
          const resetCards = [...cards];
          resetCards[firstIndex].isFlipped = false;
          resetCards[secondIndex].isFlipped = false;
          setCards(resetCards);
          setFlippedCards([]);
        }, 1200);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Practice
          </button>
          
          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setDifficulty('words')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                difficulty === 'words' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Type className="w-4 h-4" />
              Words
            </button>
            <button
              onClick={() => setDifficulty('phrases')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                difficulty === 'phrases' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Phrases
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Moves</p>
              <p className="text-xl font-black">{moves}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Matches</p>
              <p className="text-xl font-black text-indigo-600">{matches}/{cards.length / 2}</p>
            </div>
            <button 
              onClick={initializeGame}
              className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <RefreshCw className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-8 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-indigo-900 uppercase tracking-tight">Bilingual Challenge</p>
            <p className="text-xs text-indigo-600">Match the English word to its Spanish translation!</p>
          </div>
        </div>

        {/* Game Grid */}
        <div className={`grid grid-cols-3 md:grid-cols-4 gap-4 ${sensoryProfile?.reducedMotion ? '' : 'animate-in fade-in zoom-in duration-500'}`}>
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              onClick={() => handleCardClick(index)}
              className="relative aspect-[4/3] cursor-pointer"
              whileHover={sensoryProfile?.reducedMotion ? {} : { scale: 1.02 }}
              whileTap={sensoryProfile?.reducedMotion ? {} : { scale: 0.98 }}
              style={{ perspective: "1000px" }}
            >
              <motion.div
                className="w-full h-full relative"
                initial={false}
                animate={{ rotateY: (card.isFlipped || card.isMatched) ? 180 : 0 }}
                transition={sensoryProfile?.reducedMotion ? { duration: 0.1 } : { duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Back Side (Face Down) */}
                <div 
                  className={`absolute inset-0 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center bg-indigo-50`}
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-inner`}>
                      <Languages className={`w-5 h-5 text-indigo-600`} />
                    </div>
                  </div>
                </div>

                {/* Front Side (Face Up) */}
                <div 
                  className={`absolute inset-0 rounded-2xl bg-white border-4 ${card.isMatched ? 'border-emerald-400 bg-emerald-50' : 'border-white'} shadow-xl overflow-hidden flex flex-col items-center justify-center p-3`}
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className="absolute top-2 left-2">
                    {card.lang === 'en' ? (
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">English</span>
                    ) : (
                      <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">Spanish</span>
                    )}
                  </div>
                  
                  <div className="text-center w-full">
                    <p className={`text-sm md:text-base font-black uppercase tracking-tight break-words leading-tight ${sensoryProfile?.highContrast ? 'text-black' : (card.lang === 'es' ? 'text-indigo-800' : 'text-slate-800')}`}>
                      {card.content}
                    </p>
                  </div>

                  <div className="mt-auto flex justify-center">
                    <div className={`p-1 rounded-full ${card.isMatched ? 'bg-emerald-100' : 'bg-slate-50'}`}>
                      <Volume2 className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>

                  {card.isMatched && (
                    <div className="absolute top-2 right-2">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-emerald-500 rounded-full p-1 shadow-sm"
                      >
                        <Trophy className="w-3 h-3 text-white" />
                      </motion.div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Pronunciation Challenge Overlay */}
        <AnimatePresence>
          {showPronounceChallenge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            >
              <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-emerald-500" />
                
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Languages className="w-6 h-6 text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Word Match Found!</span>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">ENGLISH</p>
                      <h3 className="text-2xl font-black uppercase tracking-tight text-slate-700">{showPronounceChallenge.en}</h3>
                    </div>
                    
                    <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">SPANISH</p>
                      <h3 className="text-2xl font-black uppercase tracking-tight text-indigo-600">{showPronounceChallenge.es}</h3>
                    </div>
                  </div>

                  <p className="text-slate-500 font-medium text-sm">Can you say the Spanish translation?</p>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        speakText(showPronounceChallenge.en, Language.ENGLISH);
                        playCue('pop');
                      }}
                      className="flex items-center justify-center gap-2 py-3 bg-slate-100 rounded-2xl font-bold text-xs text-slate-600 hover:bg-slate-200 transition-all uppercase tracking-widest"
                    >
                      <Volume2 className="w-4 h-4" />
                      Listen EN
                    </button>
                    <button
                      onClick={() => {
                        speakText(showPronounceChallenge.es, Language.SPANISH);
                        playCue('pop');
                      }}
                      className="flex items-center justify-center gap-2 py-3 bg-indigo-100 rounded-2xl font-bold text-xs text-indigo-600 hover:bg-indigo-200 transition-all uppercase tracking-widest"
                    >
                      <Volume2 className="w-4 h-4" />
                      Listen ES
                    </button>
                  </div>
                  
                  <button
                    onClick={() => {
                      playCue('chime');
                      setShowPronounceChallenge(null);
                    }}
                    className="py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all mt-2"
                  >
                    I Said It!
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Win Modal */}
        <AnimatePresence>
          {isWon && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl overflow-hidden relative"
              >
                <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-100 rounded-full opacity-50" />
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-100 rounded-full opacity-50" />
                
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Trophy className="w-10 h-10 text-emerald-600" />
                  </div>
                  
                  <h2 className="text-3xl font-black mb-2 uppercase tracking-tight">¡Buen Trabajo!</h2>
                  <p className="text-slate-500 mb-8 font-medium italic">You mastered the bilingual match in {moves} moves!</p>
                  <div className="space-y-3">
                    <button
                      onClick={async () => {
                        await shareAchievement({
                          title: '¡Buen Trabajo!',
                          text: `My child just matched ${cards.length / 2} bilingual word pairs in SpeechFlow AI! 🚀`,
                          url: window.location.href
                        });
                      }}
                      className="w-full py-4 bg-emerald-600 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Globe className="w-5 h-5" />
                      Share Success
                    </button>
                    <button
                      onClick={initializeGame}
                      className="w-full py-4 bg-indigo-600 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
                    >
                      Play Again
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full py-4 rounded-2xl bg-slate-100 text-slate-600 font-black uppercase tracking-widest transition-all hover:bg-slate-200"
                    >
                      Back to Practice
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
