import React, { useState, useEffect, useRef } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  Target, 
  Info, 
  Volume2, 
  Mic, 
  MicOff, 
  Zap, 
  Play, 
  RotateCcw, 
  AlertCircle,
  Timer as TimerIcon,
  Sparkles,
  Hand,
  Users as UsersIcon,
  User,
  Loader2
} from 'lucide-react';
import { Exercise, ExerciseType, Language, Difficulty } from '../types';
import { PronunciationVisualizer } from './PronunciationVisualizer';
import { SpeechPipelineFeedback } from './SpeechPipelineFeedback';
import { FALLBACK_IMAGE } from '../constants';

interface SpecializedExerciseViewProps {
  exercise: Exercise;
  styles: any;
  playCue: (type: 'chime' | 'swoosh' | 'pop') => void;
  onComplete: (score: number, rubric?: {
    accuracy: number;
    fluency: number;
    independence: number;
    promptLevel: string;
    notes?: string;
    intelligibility?: {
      familiar: number;
      unfamiliar: number;
    };
  }) => void;
  localMentorAudio?: string | null;
  playTargetAudio?: (url: string) => void;
  isRecording?: boolean;
  isAnalyzing?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  userId?: string;
  language: Language;
  difficulty: Difficulty;
  aiFeedback?: { score: number, feedback: string } | null;
}

export const SpecializedExerciseView: React.FC<SpecializedExerciseViewProps> = ({
  exercise,
  styles,
  playCue,
  onComplete,
  localMentorAudio,
  playTargetAudio,
  isRecording,
  isAnalyzing,
  onStartRecording,
  onStopRecording,
  userId,
  language,
  difficulty,
  aiFeedback
}) => {
  const [step, setStep] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [canAct, setCanAct] = useState(false);
  const [turn, setTurn] = useState<'me' | 'you'>('me');
  const [teacherCommand, setTeacherCommand] = useState<{ text: string, shouldAct: boolean } | null>(null);
  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const [currentSyllableIndex, setCurrentSyllableIndex] = useState(-1);
  const [expansionStep, setExpansionStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Caregiver 3D Assessment Rubric States
  const [showRubric, setShowRubric] = useState(false);
  const [rubricAccuracy, setRubricAccuracy] = useState(5);
  const [rubricFluency, setRubricFluency] = useState(5);
  const [rubricIndependence, setRubricIndependence] = useState(5);
  const [rubricPromptLevel, setRubricPromptLevel] = useState('Independent');
  const [rubricFamiliarIntelligibility, setRubricFamiliarIntelligibility] = useState(75);
  const [rubricUnfamiliarIntelligibility, setRubricUnfamiliarIntelligibility] = useState(50);
  const [rubricNotes, setRubricNotes] = useState('');

  // Helper to complete with/without 3D Rubric
  const completeExercise = (scoreValue = 100) => {
    if (showRubric) {
      const computedScore = Math.round(((rubricAccuracy + rubricFluency + rubricIndependence) / 15) * 100);
      onComplete(computedScore, {
        accuracy: rubricAccuracy,
        fluency: rubricFluency,
        independence: rubricIndependence,
        promptLevel: rubricPromptLevel,
        notes: rubricNotes,
        intelligibility: {
          familiar: rubricFamiliarIntelligibility,
          unfamiliar: rubricUnfamiliarIntelligibility
        }
      });
    } else {
      onComplete(scoreValue);
    }
    setIsActive(false);
    setLocalFeedback(null);
  };

  // Focus Session Timer
  useEffect(() => {
    let interval: any;
    if (isActive && exercise.type === ExerciseType.FOCUS_SESSION) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev >= 10) {
            setIsActive(false);
            setLocalFeedback("Great focus!");
            playCue('chime');
            completeExercise(100);
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, exercise.type]);

  // Impulsivity & Social Skill (Teacher Says) Logic
  useEffect(() => {
    if (exercise.type === ExerciseType.IMPULSIVITY_PRACTICE && isActive) {
      setIsWaiting(true);
      setCanAct(false);
      const waitTime = Math.random() * 3000 + 2000;
      const timeout = setTimeout(() => {
        setIsWaiting(false);
        setCanAct(true);
        playCue('pop');
      }, waitTime);
      return () => clearTimeout(timeout);
    }

    if (exercise.type === ExerciseType.SOCIAL_SKILLS && exercise.title.toLowerCase().includes('teacher says') && isActive) {
      generateTeacherCommand();
    }
  }, [isActive, exercise.type]);

  const generateTeacherCommand = () => {
    const commands = [
      "Touch your nose",
      "Clap your hands",
      "Jump once",
      "Touch your ears",
      "Wiggle your fingers"
    ];
    const shouldAddPrefix = Math.random() > 0.4;
    const commandText = commands[Math.floor(Math.random() * commands.length)];
    setTeacherCommand({
      text: shouldAddPrefix ? `Teacher says: ${commandText}` : commandText,
      shouldAct: shouldAddPrefix
    });
    playCue('pop');
  };

  const handleAction = () => {
    if (exercise.type === ExerciseType.IMPULSIVITY_PRACTICE) {
      if (isWaiting) {
        setLocalFeedback("Oops! Wait for the green light.");
        playCue('pop');
        setIsActive(false);
      } else if (canAct) {
        setLocalFeedback("Perfect timing!");
        playCue('chime');
        completeExercise(100);
      }
    } else if (exercise.type === ExerciseType.SOCIAL_SKILLS) {
      if (exercise.title.toLowerCase().includes('turn-taking')) {
        if (turn === 'me') {
          setTurn('you');
          setLocalFeedback("Your turn now!");
          playCue('pop');
        } else {
          setTurn('me');
          setLocalFeedback("My turn! Great waiting.");
          playCue('chime');
          completeExercise(100);
        }
      } else if (exercise.title.toLowerCase().includes('teacher says')) {
        if (teacherCommand?.shouldAct) {
          setLocalFeedback("Correct! Teacher said so.");
          playCue('chime');
          setTimeout(() => generateTeacherCommand(), 1500);
        } else {
          setLocalFeedback("Wait! Teacher didn't say.");
          playCue('pop');
          setIsActive(false);
        }
      }
    } else if (exercise.type === ExerciseType.FOLLOWING_DIRECTIONS) {
      setLocalFeedback("Step complete!");
      playCue('pop');
      completeExercise(100);
    } else if (exercise.type === ExerciseType.SYLLABLE_PACING) {
      const syllables = exercise.syllables || [];
      if (currentSyllableIndex < syllables.length - 1) {
        setCurrentSyllableIndex(prev => prev + 1);
        playCue('pop');
      } else {
        setLocalFeedback("Perfect pacing!");
        playCue('chime');
        completeExercise(100);
      }
    } else if (exercise.type === ExerciseType.SENTENCE_EXPANSION) {
      const steps = exercise.expansionData?.steps || [];
      if (expansionStep < steps.length - 1) {
        setExpansionStep(prev => prev + 1);
        playCue('pop');
      } else {
        setLocalFeedback("Amazing building!");
        playCue('chime');
        completeExercise(100);
      }
    }
  };

  const handleMinimalPairClick = (index: number) => {
    if (!isActive) return;
    playCue('pop');
    setLocalFeedback(index === 0 ? "That's the first one!" : "That's the second one!");
    if (exercise.minimalPairs?.[selectedPairIndex]) {
      const pair = exercise.minimalPairs[selectedPairIndex];
      const audio = index === 0 ? pair.audioUrl1 : pair.audioUrl2;
      if (audio && playTargetAudio) playTargetAudio(audio);
    }
    setTimeout(() => {
      completeExercise(100);
    }, 2000);
  };

  const handleRoleplayOption = (index: number) => {
    if (!isActive) return;
    setSelectedOption(index);
    const option = exercise.roleplayData?.options[index];
    if (option) {
      setLocalFeedback(option.feedback);
      if (option.isCorrect) {
        playCue('chime');
        setTimeout(() => {
          completeExercise(100);
        }, 3000);
      } else {
        playCue('pop');
      }
    }
  };

  const startExercise = () => {
    setIsActive(true);
    setTimer(0);
    setLocalFeedback(null);
    setStep(0);
    setSelectedPairIndex(0);
    setCurrentSyllableIndex(-1);
    setExpansionStep(0);
    setSelectedOption(null);
    setTurn('me');
    playCue('swoosh');
  };

  return (
    <div className="space-y-10 p-2 sm:p-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="text-left space-y-1">
          <h3 className={`text-3xl font-black tracking-tight text-slate-900`}>{exercise.title}</h3>
          <p className="text-sm text-slate-500 font-medium">{exercise.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {(localFeedback || aiFeedback) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                  aiFeedback ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                }`}
              >
                {aiFeedback ? aiFeedback.feedback : localFeedback}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
            {exercise.type === ExerciseType.FOLLOWING_DIRECTIONS ? (
              <AlertCircle className="w-5 h-5 text-accent" />
            ) : exercise.type === ExerciseType.SOCIAL_SKILLS ? (
              <UsersIcon className="w-5 h-5 text-emerald-500" />
            ) : (
              <Target className="w-5 h-5 text-primary" />
            )}
          </div>
        </div>
      </div>

      {/* Pronunciation Visualizer Integration */}
      {exercise.pronunciationGuide && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-amber-50 text-amber-700 w-fit border border-amber-100 italic text-xs font-bold">
            <Sparkles className="w-3 h-3" />
            Articulation Guide
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <PronunciationVisualizer 
              mouthPosition={exercise.pronunciationGuide.mouthPosition}
              tonguePlacement={exercise.pronunciationGuide.tonguePlacement}
              mouthAnimationUrl={exercise.pronunciationGuide.mouthAnimationUrl}
              tongueAnimationUrl={exercise.pronunciationGuide.tongueAnimationUrl}
              mouthAudioUrl={exercise.pronunciationGuide.mouthAudioUrl}
              tongueAudioUrl={exercise.pronunciationGuide.tongueAudioUrl}
              playTargetAudio={playTargetAudio}
            />
            <div className="space-y-4 text-left">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Oral Position</span>
                <p className="text-sm font-bold text-slate-700">{exercise.pronunciationGuide.mouthPosition}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tongue Support</span>
                <p className="text-sm font-bold text-slate-700">{exercise.pronunciationGuide.tonguePlacement}</p>
              </div>
              {exercise.pronunciationGuide.tip && (
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <p className="text-xs text-primary font-bold italic">💡 "{exercise.pronunciationGuide.tip}"</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex-1 relative w-full h-[300px] flex items-center justify-center overflow-hidden">
        <AnimatePresence>
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            {exercise.imageUrl && (!isActive || exercise.type === ExerciseType.STORY) && (
              <motion.img 
                key="base-img"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                src={exercise.imageUrl || FALLBACK_IMAGE} 
                alt={exercise.title}
                className="absolute inset-0 w-full h-full object-cover rounded-[40px] opacity-40 blur-[2px]"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
            )}

            {/* Overlay components for specific exercise types */}
            {exercise.type === ExerciseType.FOCUS_SESSION && isActive && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center"
              >
                <div className="bg-white/95 backdrop-blur px-10 py-5 rounded-3xl shadow-2xl flex flex-col items-center gap-2 border border-white">
                  <div className="flex items-center gap-3">
                    <TimerIcon className="w-8 h-8 text-primary animate-pulse" />
                    <span className="text-4xl font-black tabular-nums text-slate-900">{10 - timer}s</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Focus Time</p>
                </div>
              </motion.div>
            )}

            {exercise.type === ExerciseType.IMPULSIVITY_PRACTICE && isActive && (
              <div className="relative">
                <motion.div 
                  animate={{ 
                    scale: isWaiting ? [1, 1.05, 1] : [1, 1.2, 1],
                    boxShadow: isWaiting 
                      ? "0 0 40px rgba(239, 68, 68, 0.4)" 
                      : "0 0 60px rgba(16, 185, 129, 0.6)"
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`w-40 h-40 rounded-full border-8 border-white shadow-2xl transition-colors duration-500 ${isWaiting ? 'bg-red-500' : 'bg-emerald-500'}`} 
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white font-black uppercase tracking-widest text-sm">
                  {isWaiting ? 'Wait...' : 'GO!'}
                </div>
              </div>
            )}

            {exercise.type === ExerciseType.SOCIAL_SKILLS && exercise.title.toLowerCase().includes('turn-taking') && isActive && (
              <div className="flex gap-12">
                <motion.div 
                  animate={{ 
                    scale: turn === 'me' ? 1.25 : 0.85, 
                    y: turn === 'me' ? -10 : 0,
                    opacity: turn === 'me' ? 1 : 0.4,
                    boxShadow: turn === 'me' ? '0 20px 40px rgba(59, 130, 246, 0.4)' : 'none'
                  }}
                  className={`w-36 h-36 rounded-[40px] border-4 border-white flex flex-col items-center justify-center gap-3 shadow-2xl transition-all duration-500 ${turn === 'me' ? 'bg-primary text-white' : 'bg-white text-slate-400'}`}
                >
                  <User className="w-12 h-12" />
                  <span className="font-black text-xs uppercase tracking-widest">Teacher</span>
                </motion.div>
                <motion.div 
                  animate={{ 
                    scale: turn === 'you' ? 1.25 : 0.85, 
                    y: turn === 'you' ? -10 : 0,
                    opacity: turn === 'you' ? 1 : 0.4,
                    boxShadow: turn === 'you' ? '0 20px 40px rgba(16, 185, 129, 0.4)' : 'none'
                  }}
                  className={`w-36 h-36 rounded-[40px] border-4 border-white flex flex-col items-center justify-center gap-3 shadow-2xl transition-all duration-500 ${turn === 'you' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400'}`}
                >
                  <UsersIcon className="w-12 h-12" />
                  <span className="font-black text-xs uppercase tracking-widest">You</span>
                </motion.div>
              </div>
            )}

            {exercise.type === ExerciseType.SOCIAL_SKILLS && exercise.title.toLowerCase().includes('teacher says') && isActive && (
              <motion.div 
                key={teacherCommand?.text}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-6"
              >
                <p className="text-4xl font-black text-amber-900 leading-tight bg-white/80 backdrop-blur inline-block px-10 py-6 rounded-[40px] border border-amber-100 shadow-sm">
                  "{teacherCommand?.text}"
                </p>
              </motion.div>
            )}

            {exercise.type === ExerciseType.MINIMAL_PAIRS && isActive && (
              <div className="grid grid-cols-2 gap-8 w-full max-w-xl">
                {exercise.minimalPairs?.[selectedPairIndex] && (
                  <>
                    <button 
                      onClick={() => handleMinimalPairClick(0)}
                      className="flex flex-col items-center justify-center gap-4 p-6 rounded-[32px] bg-white border-4 border-slate-100 hover:border-primary hover:shadow-xl transition-all group"
                    >
                      <div className="w-32 h-32 rounded-2xl overflow-hidden bg-slate-50">
                        <img src={exercise.minimalPairs[selectedPairIndex].imageUrl1} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-2xl font-black text-slate-800 group-hover:text-primary transition-colors">{exercise.minimalPairs[selectedPairIndex].word1}</span>
                    </button>
                    <button 
                      onClick={() => handleMinimalPairClick(1)}
                      className="flex flex-col items-center justify-center gap-4 p-6 rounded-[32px] bg-white border-4 border-slate-100 hover:border-primary hover:shadow-xl transition-all group"
                    >
                      <div className="w-32 h-32 rounded-2xl overflow-hidden bg-slate-50">
                        <img src={exercise.minimalPairs[selectedPairIndex].imageUrl2} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-2xl font-black text-slate-800 group-hover:text-primary transition-colors">{exercise.minimalPairs[selectedPairIndex].word2}</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {exercise.type === ExerciseType.SYLLABLE_PACING && isActive && (
              <div className="flex gap-4">
                {exercise.syllables?.map((syl, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scale: currentSyllableIndex === i ? 1.3 : 1,
                      backgroundColor: currentSyllableIndex === i ? '#3b82f6' : '#fff',
                      color: currentSyllableIndex === i ? '#fff' : '#334155',
                      boxShadow: currentSyllableIndex === i ? '0 10px 25px -5px rgba(59, 130, 246, 0.4)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black border-2 border-slate-100"
                  >
                    {syl}
                  </motion.div>
                ))}
              </div>
            )}

            {exercise.type === ExerciseType.SENTENCE_EXPANSION && isActive && (
              <div className="space-y-4 w-full max-w-md bg-white p-6 rounded-[40px] shadow-xl">
                {exercise.expansionData?.steps.map((text, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ 
                      x: expansionStep >= i ? 0 : -20, 
                      opacity: expansionStep >= i ? 1 : 0.3,
                      scale: expansionStep === i ? 1.05 : 1
                    }}
                    className={`p-4 rounded-2xl border-2 font-bold transition-all ${
                      expansionStep === i ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400 font-normal'
                    }`}
                  >
                    {text}
                  </motion.div>
                ))}
              </div>
            )}

            {exercise.type === ExerciseType.PRAGMATIC_ROLEPLAY && isActive && (
              <div className="bg-white rounded-[40px] shadow-2xl p-10 w-full max-w-lg border-4 border-slate-50 space-y-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary text-left">Scenario</p>
                  <p className="text-2xl font-black text-slate-800 leading-tight text-left">{exercise.roleplayData?.scenario}</p>
                </div>
                <div className="grid gap-4 text-left">
                  {exercise.roleplayData?.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleRoleplayOption(i)}
                      className={`w-full p-5 rounded-2xl border-2 font-bold transition-all text-sm ${
                        selectedOption === i 
                          ? (opt.isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md' : 'bg-red-50 border-red-500 text-red-700 shadow-md')
                          : 'bg-slate-50 border-slate-100 hover:border-primary/40 hover:bg-white hover:-translate-y-0.5'
                      }`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-center gap-8">
        {!isActive ? (
          <div className="flex flex-col items-center gap-5 w-full">
            <button
              onClick={startExercise}
              className={`group px-20 py-6 rounded-[40px] text-white font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-4 text-xl ${styles.button}`}
            >
              <Play className="w-8 h-8 fill-white group-hover:scale-110 transition-transform" />
              Start Module
            </button>
            
            {localMentorAudio && playTargetAudio && (
              <button 
                onClick={() => playTargetAudio(localMentorAudio)}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
              >
                <Volume2 className="w-4 h-4" />
                Play Guide Audio
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={() => {
                if (exercise.type === ExerciseType.SOCIAL_SKILLS && exercise.title.toLowerCase().includes('teacher says')) {
                  if (teacherCommand?.shouldAct === false) {
                    setLocalFeedback("Correct! I shouldn't have moved.");
                    playCue('chime');
                    setTimeout(() => generateTeacherCommand(), 1500);
                  } else {
                    handleAction();
                  }
                } else {
                  handleAction();
                }
              }}
              disabled={isAnalyzing}
              className={`px-20 py-6 rounded-[40px] text-white font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-4 text-xl ${
                exercise.type === ExerciseType.IMPULSIVITY_PRACTICE && isWaiting 
                  ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                  : styles.button
              }`}
            >
              <Zap className="w-8 h-8 fill-white" />
              {exercise.type === ExerciseType.SYLLABLE_PACING ? 'Next Syllable' : 
               exercise.type === ExerciseType.SENTENCE_EXPANSION ? 'Next Step' : 
               exercise.title.toLowerCase().includes('teacher says') ? "I'm Acting!" :
               "I'm Done!"}
            </button>

            {exercise.type === ExerciseType.SOCIAL_SKILLS && turn === 'you' && (
              <div className="flex flex-col items-center gap-4 bg-emerald-50/50 p-6 rounded-[40px] border border-emerald-100/50 w-full max-w-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Practice your response!</p>
                <SpeechPipelineFeedback
                  isRecording={!!isRecording}
                  isAnalyzing={!!isAnalyzing}
                  activeProvider="Web Speech API"
                  targetText={exercise.targetSentence || exercise.targetWord || exercise.title}
                  className="w-full"
                />
                <button
                  onClick={isRecording ? onStopRecording : onStartRecording}
                  disabled={isAnalyzing}
                  className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all border-8 border-white ${
                    isRecording ? 'bg-red-500 animate-pulse scale-110' : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="w-10 h-10 text-white" />
                  ) : (
                    <Mic className="w-10 h-10 text-white" />
                  )}
                </button>
              </div>
            )}

            {exercise.title.toLowerCase().includes('teacher says') && (
              <button
                onClick={() => {
                  if (teacherCommand?.shouldAct === false) {
                    setLocalFeedback("Correct! I stayed still.");
                    playCue('chime');
                    setTimeout(() => generateTeacherCommand(), 1500);
                  } else {
                    setLocalFeedback("Oops! Teacher said to act.");
                    playCue('pop');
                    setIsActive(false);
                  }
                }}
                className="px-10 py-4 rounded-[32px] bg-white border-4 border-slate-100 text-slate-500 font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all hover:border-slate-200"
              >
                I'm Staying Still
              </button>
            )}
          </div>
        )}

        {/* Clinician & Parent 3-Dimensional Assessment Rubric */}
        <div className="w-full mt-8 p-6 sm:p-8 bg-slate-900 border border-slate-800 text-slate-100 rounded-[32px] shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-indigo-400 text-[9px] font-black uppercase tracking-wider">CARE-GIVER CONSOLE</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  PERSISTENCE SYNC
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                👩‍⚕️ Clinician & Parent 3D Rubric
              </h3>
              <p className="text-xs text-slate-400">Rate sound precision, pacing, and client independence manually.</p>
            </div>
            
            <button
              onClick={() => setShowRubric(!showRubric)}
              className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                showRubric 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {showRubric ? 'ON: MANUAL GRADING' : 'OFF: AUTO AI SCORING'}
            </button>
          </div>

          <AnimatePresence>
            {showRubric && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden space-y-6"
              >
                {/* 3D Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  {/* Dimension 1: Articulation & Sound Accuracy */}
                  <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/65">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">1. Articulation</label>
                      <span className="text-xs font-black text-primary px-2 py-0.5 rounded-lg bg-primary/10">{rubricAccuracy}/5</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      value={rubricAccuracy}
                      onChange={(e) => setRubricAccuracy(Number(e.target.value))}
                      className="w-full accent-primary bg-slate-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 leading-snug min-h-[40px]">
                      {rubricAccuracy === 1 && "❌ Need heavy correction, sounds omitted."}
                      {rubricAccuracy === 2 && "⚠️ Approaching target with significant help."}
                      {rubricAccuracy === 3 && "✏️ Distorted sound but correct word shape."}
                      {rubricAccuracy === 4 && "⭐ Minor phone distortions, near native."}
                      {rubricAccuracy === 5 && "🎯 Crystal clear precise sound production."}
                    </p>
                  </div>

                  {/* Dimension 2: Fluency & Pacing */}
                  <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/65">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">2. Fluency & Pacing</label>
                      <span className="text-xs font-black text-amber-500 px-2 py-0.5 rounded-lg bg-amber-500/10">{rubricFluency}/5</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      value={rubricFluency}
                      onChange={(e) => setRubricFluency(Number(e.target.value))}
                      className="w-full accent-amber-500 bg-slate-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 leading-snug min-h-[40px]">
                      {rubricFluency === 1 && "❌ Heavy blocks / severe stutters."}
                      {rubricFluency === 2 && "⚠️ Intermittent pacing blocks and pauses."}
                      {rubricFluency === 3 && "✏️ Normal hesitancies, moderate cadence."}
                      {rubricFluency === 4 && "⭐ Smooth sentence string with light pauses."}
                      {rubricFluency === 5 && "🎯 Highly fluent & conversational cadence."}
                    </p>
                  </div>

                  {/* Dimension 3: Independence */}
                  <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/65">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">3. Independence</label>
                      <span className="text-xs font-black text-emerald-400 px-2 py-0.5 rounded-lg bg-emerald-500/10">{rubricIndependence}/5</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      value={rubricIndependence}
                      onChange={(e) => setRubricIndependence(Number(e.target.value))}
                      className="w-full accent-emerald-400 bg-slate-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 leading-snug min-h-[40px]">
                      {rubricIndependence === 1 && "❌ Student was fully dependent on caretaker."}
                      {rubricIndependence === 2 && "⚠️ Relied on maximal verbal/visual prompts."}
                      {rubricIndependence === 3 && "✏️ Achieved goal with moderate cueing/hints."}
                      {rubricIndependence === 4 && "⭐ Independent with tiny gestural cue."}
                      {rubricIndependence === 5 && "🎯 100% self-corrected & independent."}
                    </p>
                  </div>
                </div>

                {/* Prompt Level Selector */}
                <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/65">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300">Prompting Cue Level Applied</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['Independent', 'Verbal Cue', 'Visual Cue', 'Tactile/Physical'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setRubricPromptLevel(lvl)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center border ${
                          rubricPromptLevel === lvl
                            ? 'bg-white text-slate-950 border-white shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 min-h-[30px]">
                    {rubricPromptLevel === 'Independent' && "Student carried out pronunciation tasks organically without therapeutic handholds."}
                    {rubricPromptLevel === 'Verbal Cue' && "Caretaker provided structural voice prompts (e.g., repeating specific syllables or sounds)."}
                    {rubricPromptLevel === 'Visual Cue' && "Caretaker demoed mouth mechanics or tongue position shape dynamically."}
                    {rubricPromptLevel === 'Tactile/Physical' && "Applied delicate hand placement or corrective structural guides for posture."}
                  </p>
                </div>

                {/* Intelligibility Index (Familiar vs. Unfamiliar Listener) */}
                <div className="space-y-4 bg-slate-950 p-4 rounded-2xl border border-slate-800/65">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      🗣️ Speech Intelligibility Index
                    </label>
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">Real-World Success</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Estimate the percentage of speech which is understandable to other listeners in a natural setting.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Familiar Listener */}
                    <div className="space-y-2 bg-slate-900/50 p-3 rounded-xl border border-slate-900">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                          🏠 Familiar Listener
                        </span>
                        <span className="text-xs font-black text-indigo-400">{rubricFamiliarIntelligibility}%</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Parent, sibling, or primary clinician.</p>
                      <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        step="5"
                        value={rubricFamiliarIntelligibility}
                        onChange={(e) => setRubricFamiliarIntelligibility(parseInt(e.target.value))}
                        className="w-full accent-indigo-500 bg-slate-800 h-1 rounded-lg cursor-pointer animate-none"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 px-0.5">
                        <button type="button" onClick={() => setRubricFamiliarIntelligibility(50)} className="hover:text-slate-300 font-medium">50%</button>
                        <button type="button" onClick={() => setRubricFamiliarIntelligibility(75)} className="hover:text-slate-300 font-medium">75%</button>
                        <button type="button" onClick={() => setRubricFamiliarIntelligibility(100)} className="hover:text-slate-300 font-medium">100%</button>
                      </div>
                    </div>

                    {/* Unfamiliar Listener */}
                    <div className="space-y-2 bg-slate-900/50 p-3 rounded-xl border border-slate-900">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                          🎒 Unfamiliar Listener
                        </span>
                        <span className="text-xs font-black text-emerald-400">{rubricUnfamiliarIntelligibility}%</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Teacher, peer, or general stranger.</p>
                      <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        step="5"
                        value={rubricUnfamiliarIntelligibility}
                        onChange={(e) => setRubricUnfamiliarIntelligibility(parseInt(e.target.value))}
                        className="w-full accent-emerald-400 bg-slate-800 h-1 rounded-lg cursor-pointer animate-none"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 px-0.5">
                        <button type="button" onClick={() => setRubricUnfamiliarIntelligibility(25)} className="hover:text-slate-300 font-medium">25%</button>
                        <button type="button" onClick={() => setRubricUnfamiliarIntelligibility(50)} className="hover:text-slate-300 font-medium">50%</button>
                        <button type="button" onClick={() => setRubricUnfamiliarIntelligibility(75)} className="hover:text-slate-300 font-medium">75%</button>
                        <button type="button" onClick={() => setRubricUnfamiliarIntelligibility(100)} className="hover:text-slate-300 font-medium">100%</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Therapist/Caregiver Session Notes */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    🗒️ Therapeutic Observations & Notes
                  </label>
                  <textarea
                    rows={2}
                    value={rubricNotes}
                    onChange={(e) => setRubricNotes(e.target.value)}
                    placeholder="E.g., Sofia showed great engagement. Practiced turn-taking rules well but required slight visual cue for sound adjustment."
                    className="w-full text-sm bg-slate-950 text-white placeholder-slate-600 rounded-2xl p-3 border border-slate-800 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={() => {
            setIsActive(false);
            setLocalFeedback(null);
            setTurn('me');
          }}
          className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 hover:text-slate-500 flex items-center gap-2 transition-colors py-4"
        >
          <RotateCcw className="w-3 h-3" />
          Reset View
        </button>
      </div>
    </div>
  );
};
