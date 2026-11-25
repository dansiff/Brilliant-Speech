import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HeartHandshake, 
  Flame, 
  CheckCircle2, 
  Play, 
  Clock, 
  Sparkles, 
  BookOpen, 
  Star, 
  Video, 
  Calendar, 
  Award,
  ChevronRight,
  ShieldCheck,
  Zap,
  Volume2
} from 'lucide-react';
import { speakText } from '../utils/speechUtils';
import { Language } from '../types';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface HomeExercise {
  id: string;
  title: string;
  targetPhoneme: string;
  goalDescription: string;
  recommendedMinutes: number;
  slpNotes: string;
  isCompleted: boolean;
  cueType: 'Tactile / Visual' | 'Auditory Modeling' | 'Metaphorical Cue';
}

interface SlpVideoDemo {
  id: string;
  title: string;
  duration: string;
  technique: string;
  keyTakeaway: string;
  thumbnailEmoji: string;
}

export const ParentCoachingPortal: React.FC = () => {
  // "3 Words, 3 Minutes" Daily Micro-Dosing State
  const [dailyDose, setDailyDose] = useState<{
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  }>({
    morning: true,
    afternoon: false,
    evening: false
  });

  const [activeStreakDays, setActiveStreakDays] = useState<number>(12);

  // Assigned Exercises
  const [assignedExercises, setAssignedExercises] = useState<HomeExercise[]>([
    {
      id: 'ex-1',
      title: 'Snake Sound Smile Drills (/s/)',
      targetPhoneme: '/s/',
      goalDescription: '5 repetitions before breakfast: "Sun, Soap, Sea"',
      recommendedMinutes: 3,
      slpNotes: 'Remind child to smile gently and keep the tongue behind the front teeth without peeking through.',
      isCompleted: true,
      cueType: 'Tactile / Visual'
    },
    {
      id: 'ex-2',
      title: 'Lion Roar Lateral Anchor (/r/)',
      targetPhoneme: '/r/',
      goalDescription: '3 repetitions during car ride: "Red race car"',
      recommendedMinutes: 3,
      slpNotes: 'Encourage tongue sides to touch upper back molars like wings of an airplane.',
      isCompleted: false,
      cueType: 'Metaphorical Cue'
    },
    {
      id: 'ex-3',
      title: 'Syllable Dot Pacing (Fluency)',
      targetPhoneme: 'Phrasing',
      goalDescription: 'Read 1 bedtime story page using the Turtle Pacing cadence',
      recommendedMinutes: 4,
      slpNotes: 'Model slow, relaxed speech rate with comfortable pauses at commas.',
      isCompleted: false,
      cueType: 'Auditory Modeling'
    }
  ]);

  const [slpDemos] = useState<SlpVideoDemo[]>([
    {
      id: 'demo-1',
      title: 'How to Cue the /s/ Sound without Pressure',
      duration: '2:15',
      technique: 'The Smile & Airflow Straw Metaphor',
      keyTakeaway: 'Avoid saying "say it right". Instead say: "Let us make our snake hiss quietly!"',
      thumbnailEmoji: '🐍'
    },
    {
      id: 'demo-2',
      title: 'Effective 5-Second Wait Time in AAC',
      duration: '1:45',
      technique: 'Joint Engagement & Processing Pauses',
      keyTakeaway: 'Count to 5 mentally after asking an open question to allow child cognitive processing time.',
      thumbnailEmoji: '⏱️'
    },
    {
      id: 'demo-3',
      title: 'Positive Praise vs Specific Feedback',
      duration: '2:00',
      technique: 'Descriptive Reinforcement',
      keyTakeaway: 'Praise the effort: "I love how your tongue stayed right behind your teeth!"',
      thumbnailEmoji: '⭐'
    }
  ]);

  const handleToggleDose = (period: 'morning' | 'afternoon' | 'evening') => {
    setDailyDose(prev => {
      const updated = { ...prev, [period]: !prev[period] };
      if (updated.morning && updated.afternoon && updated.evening) {
        confetti({ particleCount: 50, spread: 70 });
        toast.success('🎉 Fantastic! Full 3-Words, 3-Minutes daily micro-dose achieved!');
      }
      return updated;
    });
  };

  const handleToggleExercise = (id: string) => {
    setAssignedExercises(prev =>
      prev.map(ex => {
        if (ex.id === id) {
          const nextCompleted = !ex.isCompleted;
          if (nextCompleted) {
            toast.success(`Completed "${ex.title}"!`);
          }
          return { ...ex, isCompleted: nextCompleted };
        }
        return ex;
      })
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-black uppercase tracking-wider mb-2">
            <HeartHandshake className="w-3.5 h-3.5" />
            Home Practice & Parent Coaching
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Parent Coaching Portal
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Clinician-guided home practice assignments, video coaching demos, and daily <strong>"3 Words, 3 Minutes"</strong> micro-dosing routines.
          </p>
        </div>

        {/* Streak Counter */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-amber-200 px-5 py-3 rounded-2xl flex items-center gap-4">
          <Flame className="w-8 h-8 text-orange-500 animate-bounce" />
          <div>
            <span className="text-[10px] font-bold text-orange-700 uppercase tracking-widest block">
              Home Practice Streak
            </span>
            <span className="text-2xl font-black text-orange-950">
              {activeStreakDays} Days
            </span>
            <span className="text-[10px] text-orange-700 block font-medium">
              Top 5% consistency
            </span>
          </div>
        </div>
      </div>

      {/* "3 Words, 3 Minutes" Micro-Dosing Tracker */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="text-xl font-black text-slate-900">
                "3 Words, 3 Minutes" Daily Micro-Dosing
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Short, high-frequency practice (3 minutes, 3 times a day) produces superior speech motor neuroplasticity compared to once-a-week long sessions.
            </p>
          </div>

          <div className="text-xs font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
            Today: {Object.values(dailyDose).filter(Boolean).length} / 3 Completed
          </div>
        </div>

        {/* 3 Day Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { key: 'morning', label: 'Morning Dose', time: 'Before School / Breakfast', icon: '🌅' },
            { key: 'afternoon', label: 'Afternoon Dose', time: 'After School / Snack', icon: '☀️' },
            { key: 'evening', label: 'Evening Dose', time: 'Bedtime Routine / Bath', icon: '🌙' }
          ].map((slot) => {
            const isDone = dailyDose[slot.key as keyof typeof dailyDose];
            return (
              <div
                key={slot.key}
                onClick={() => handleToggleDose(slot.key as any)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isDone
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{slot.icon}</span>
                  <div>
                    <span className="text-sm font-black block">{slot.label}</span>
                    <span className="text-xs text-slate-500 block">{slot.time}</span>
                  </div>
                </div>

                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black ${
                  isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SLP Assigned Home Exercises */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900">Current SLP Home Assignments</h3>
            <p className="text-xs text-slate-500">Prescribed by your clinician for this week's practice cycle.</p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {assignedExercises.filter(e => e.isCompleted).length} of {assignedExercises.length} Done
          </span>
        </div>

        <div className="space-y-4">
          {assignedExercises.map((exercise) => (
            <div
              key={exercise.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                exercise.isCompleted
                  ? 'bg-slate-50/80 border-slate-200 opacity-80'
                  : 'bg-white border-indigo-100 shadow-sm hover:border-indigo-300'
              }`}
            >
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-mono font-bold">
                    {exercise.targetPhoneme}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    • {exercise.cueType}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    • {exercise.recommendedMinutes} mins
                  </span>
                </div>

                <h4 className="text-base font-black text-slate-900">{exercise.title}</h4>
                <p className="text-xs text-slate-600 font-medium">{exercise.goalDescription}</p>

                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 text-xs text-amber-900">
                  <strong className="font-bold">Clinician Coaching Tip: </strong>
                  {exercise.slpNotes}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => speakText(exercise.goalDescription, Language.ENGLISH)}
                  className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Hear model prompt"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleToggleExercise(exercise.id)}
                  className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                    exercise.isCompleted
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {exercise.isCompleted ? 'Completed' : 'Mark Complete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Short SLP Video & Coaching Demos */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <div>
          <h3 className="text-xl font-black text-slate-900">SLP Video & Cueing Demonstrations</h3>
          <p className="text-xs text-slate-500">Short 2-minute clinical coaching clips demonstrating supportive home cueing techniques.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {slpDemos.map((demo) => (
            <div
              key={demo.id}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{demo.thumbnailEmoji}</span>
                  <span className="text-[10px] font-mono font-bold bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                    {demo.duration}
                  </span>
                </div>

                <h4 className="text-sm font-black text-slate-900 mb-1 leading-snug">{demo.title}</h4>
                <span className="text-xs font-bold text-indigo-600 block mb-2">{demo.technique}</span>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{demo.keyTakeaway}</p>
              </div>

              <button
                onClick={() => {
                  speakText(demo.keyTakeaway, Language.ENGLISH);
                  toast.info(`Playing coaching guide: "${demo.title}"`);
                }}
                className="w-full py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Watch Coaching Clip
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
