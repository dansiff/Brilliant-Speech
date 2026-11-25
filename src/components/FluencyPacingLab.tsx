import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Hand, 
  Square, 
  Volume2, 
  Sparkles, 
  Activity, 
  RotateCcw, 
  Timer,
  Mic,
  Heart,
  BookOpen,
  NotebookPen,
  Users,
  Lightbulb,
  Plus
} from 'lucide-react';
import { speakText } from '../utils/speechUtils';
import { Language } from '../types';
import { toast } from 'sonner';

interface StoryPrompt {
  id: string;
  title: string;
  category: string;
  text: string;
  syllables: string[];
}

interface JournalEntry {
  id: number;
  date: string;
  reflection: string;
}

interface ParticipationEntry {
  id: number;
  date: string;
  activity: string;
  note: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isJournalEntry = (value: unknown): value is JournalEntry =>
  isRecord(value) &&
  typeof value.id === 'number' &&
  typeof value.date === 'string' &&
  typeof value.reflection === 'string';

const isParticipationEntry = (value: unknown): value is ParticipationEntry =>
  isRecord(value) &&
  typeof value.id === 'number' &&
  typeof value.date === 'string' &&
  typeof value.activity === 'string' &&
  typeof value.note === 'string';

const parseStoredEntries = <T,>(
  value: string | null,
  isEntry: (entry: unknown) => entry is T
): T[] => {
  if (!value) return [];
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error('Stored activity data is not a list.');
  const entries = parsed.filter(isEntry);
  if (entries.length !== parsed.length) throw new Error('Stored activity data contains invalid entries.');
  return entries;
};

const STORY_PROMPTS: StoryPrompt[] = [
  {
    id: 'story-park',
    title: 'The Sunny Park Trip',
    category: 'Daily Routine',
    text: 'I went to the green park to play on the blue swings with my friends.',
    syllables: ['I', 'went', 'to', 'the', 'green', 'park', 'to', 'play', 'on', 'the', 'blue', 'swings', 'with', 'my', 'friends']
  },
  {
    id: 'story-space',
    title: 'The Rocket Journey',
    category: 'Imagination',
    text: 'A shiny silver rocket blasted off into the deep dark starry space.',
    syllables: ['A', 'shi-', 'ny', 'sil-', 'ver', 'roc-', 'ket', 'blas-', 'ted', 'off', 'in-', 'to', 'the', 'deep', 'dark', 'star-', 'ry', 'space']
  },
  {
    id: 'story-bakery',
    title: 'Baking Fresh Bread',
    category: 'Sensory',
    text: 'Warm bread smells so good when it comes out of the hot oven.',
    syllables: ['Warm', 'bread', 'smells', 'so', 'good', 'when', 'it', 'comes', 'out', 'of', 'the', 'hot', 'o-', 'ven']
  }
];

export const FluencyPacingLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'awareness' | 'strategies' | 'pacing' | 'confidence' | 'journal' | 'sample' | 'participation' | 'pacing_board' | 'timed_storytelling'>('awareness');
  
  // Pacing Board State
  const [syllableCount, setSyllableCount] = useState<number>(5);
  const [activeSyllableIndex, setActiveSyllableIndex] = useState<number>(-1);
  const [pacingRateMode, setPacingRateMode] = useState<'turtle' | 'rabbit'>('turtle'); // Turtle (90-120 WPM) vs Rabbit
  const [isMetronomeActive, setIsMetronomeActive] = useState<boolean>(false);
  const metronomeTimerRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Timed Storytelling State
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number>(0);
  const [isStoryRecording, setIsStoryRecording] = useState<boolean>(false);
  const [storyTimeElapsed, setStoryTimeElapsed] = useState<number>(0);
  const storyTimerRef = useRef<ReturnType<typeof window.setInterval> | null>(null);

  const selectedStory = STORY_PROMPTS[selectedStoryIndex];
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [customStrategy, setCustomStrategy] = useState('');
  const [selfReflection, setSelfReflection] = useState('');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [participationEntries, setParticipationEntries] = useState<ParticipationEntry[]>([]);
  const [participationActivity, setParticipationActivity] = useState('Conversation');
  const [participationNote, setParticipationNote] = useState('');
  const [sampleRecording, setSampleRecording] = useState(false);
  const [sampleUrl, setSampleUrl] = useState<string | null>(null);
  const [sampleSelfRating, setSampleSelfRating] = useState('');
  const [samplePrompt, setSamplePrompt] = useState('');
  const sampleRecorderRef = useRef<MediaRecorder | null>(null);
  const sampleStreamRef = useRef<MediaStream | null>(null);
  const sampleChunksRef = useRef<Blob[]>([]);
  const sampleStartedAtRef = useRef<number>(0);
  const [sampleDuration, setSampleDuration] = useState(0);
  const [selectedPace, setSelectedPace] = useState('My usual pace');

  useEffect(() => {
    try {
      setJournalEntries(parseStoredEntries(localStorage.getItem('brilliant_speech_fluency_journal'), isJournalEntry));
    } catch (error) {
      console.error('Failed to load local fluency reflections:', error);
      toast.error('Saved reflections could not be loaded from this device.');
    }

    try {
      setParticipationEntries(parseStoredEntries(localStorage.getItem('brilliant_speech_fluency_participation'), isParticipationEntry));
    } catch (error) {
      console.error('Failed to load local participation history:', error);
      toast.error('Participation history could not be loaded from this device.');
    }

    return () => {
      if (sampleRecorderRef.current?.state === 'recording') {
        sampleRecorderRef.current.onstop = null;
        sampleRecorderRef.current.stop();
      }
      sampleStreamRef.current?.getTracks().forEach(track => track.stop());
      if (storyTimerRef.current) clearInterval(storyTimerRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        void audioContextRef.current.close().catch(error => {
          console.error('Failed to close fluency audio context:', error);
        });
      }
    };
  }, []);

  useEffect(() => () => {
    if (sampleUrl) URL.revokeObjectURL(sampleUrl);
  }, [sampleUrl]);

  useEffect(() => {
    if (!sampleRecording) return;
    const timer = window.setInterval(() => {
      setSampleDuration(Math.floor((Date.now() - sampleStartedAtRef.current) / 1000));
    }, 500);
    return () => window.clearInterval(timer);
  }, [sampleRecording]);

  const startSampleRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.error('This browser does not support local audio recording.');
      return;
    }
    let acquiredStream: MediaStream | null = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      acquiredStream = stream;
      sampleStreamRef.current = stream;
      sampleChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      sampleRecorderRef.current = recorder;
      recorder.ondataavailable = event => {
        if (event.data.size) sampleChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const recording = new Blob(sampleChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (recording.size) {
          setSampleUrl(previous => {
            if (previous) URL.revokeObjectURL(previous);
            return URL.createObjectURL(recording);
          });
        }
        stream.getTracks().forEach(track => track.stop());
        sampleStreamRef.current = null;
        setSampleRecording(false);
      };
      sampleStartedAtRef.current = Date.now();
      setSampleDuration(0);
      recorder.start();
      setSampleRecording(true);
    } catch (error) {
      console.error('Failed to start local speech recording:', error);
      acquiredStream?.getTracks().forEach(track => track.stop());
      toast.error('Microphone access was not available. No recording was saved.');
    }
  };

  const stopSampleRecording = () => {
    if (sampleRecorderRef.current?.state === 'recording') {
      try {
        sampleRecorderRef.current.stop();
      } catch (error) {
        console.error('Failed to stop local speech recording:', error);
        toast.error('The recording could not be stopped.');
      }
    }
  };

  const saveJournalEntry = () => {
    if (!selfReflection.trim()) return;
    const entries: JournalEntry[] = [{ id: Date.now(), date: new Date().toLocaleString(), reflection: selfReflection.trim() }, ...journalEntries];
    try {
      localStorage.setItem('brilliant_speech_fluency_journal', JSON.stringify(entries));
      setJournalEntries(entries);
      setSelfReflection('');
    } catch (error) {
      console.error('Failed to save local fluency reflection:', error);
      toast.error('The reflection could not be saved on this device.');
    }
  };

  const logParticipation = () => {
    const entries: ParticipationEntry[] = [{ id: Date.now(), date: new Date().toLocaleString(), activity: participationActivity, note: participationNote.trim() }, ...participationEntries];
    try {
      localStorage.setItem('brilliant_speech_fluency_participation', JSON.stringify(entries));
      setParticipationEntries(entries);
      setParticipationNote('');
    } catch (error) {
      console.error('Failed to save local participation history:', error);
      toast.error('Participation could not be saved on this device.');
    }
  };

  const playTapClick = async (): Promise<boolean> => {
    if (typeof window.AudioContext === 'undefined') {
      toast.error('Audio cues are not supported in this browser.');
      return false;
    }

    try {
      const audioCtx = audioContextRef.current ?? new window.AudioContext();
      audioContextRef.current = audioCtx;
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pacingRateMode === 'turtle' ? 320 : 640, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
      return true;
    } catch (error) {
      console.error('Failed to play fluency pacing cue:', error);
      toast.error('The pacing audio cue could not be played.');
      setIsMetronomeActive(false);
      return false;
    }
  };

  // Metronome effect
  useEffect(() => {
    if (isMetronomeActive) {
      const intervalMs = pacingRateMode === 'turtle' ? 700 : 350; // Slow turtle vs fast rabbit tempo
      metronomeTimerRef.current = setInterval(() => {
        setActiveSyllableIndex(prev => (prev + 1) % syllableCount);
        void playTapClick();
      }, intervalMs);
    } else {
      if (metronomeTimerRef.current) clearInterval(metronomeTimerRef.current);
      setActiveSyllableIndex(-1);
    }
    return () => {
      if (metronomeTimerRef.current) clearInterval(metronomeTimerRef.current);
    };
  }, [isMetronomeActive, pacingRateMode, syllableCount]);

  // Timed Storytelling Handlers
  const startStoryTrial = async () => {
    setIsStoryRecording(true);
    setStoryTimeElapsed(0);
    storyTimerRef.current = setInterval(() => setStoryTimeElapsed(prev => prev + 1), 1000);
  };

  const finishStoryTrial = async () => {
    if (storyTimerRef.current) clearInterval(storyTimerRef.current);
    setIsStoryRecording(false);
    toast.success('Practice finished. Your pace and speaking style are your own.');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Fluency & Stuttering Rate Control
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Fluency & Pacing Lab
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Explore communication preferences, optional pacing supports, confidence, reflection, and participation—without fluency scores or pressure to change how you speak.
          </p>
        </div>

        {/* Speedometer Mode Badge */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => { setPacingRateMode('turtle'); setSelectedPace('A little slower'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              pacingRateMode === 'turtle'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🐢</span>
            Comfortable pace
          </button>
          <button
            onClick={() => { setPacingRateMode('rabbit'); setSelectedPace('A little quicker'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              pacingRateMode === 'rabbit'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🐇</span>
            Another pace
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 border-b border-slate-200 pb-3">
        {([
          ['awareness', 'Speech awareness', Lightbulb],
          ['strategies', 'My strategies', Heart],
          ['pacing', 'Voluntary pacing', Hand],
          ['confidence', 'Confidence', Sparkles],
          ['journal', 'Reflection journal', NotebookPen],
          ['sample', 'Speech sample', Mic],
          ['participation', 'Participation', Users],
          ['pacing_board', 'Pacing board', Activity],
          ['timed_storytelling', 'Story prompts', BookOpen]
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            aria-pressed={activeTab === id}
            className={`px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === id ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'awareness' && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-5">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-sky-50 text-sky-700"><Lightbulb className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Notice communication, on your terms</h2>
              <p className="text-sm text-slate-600 mt-1">Stuttering is a natural way some people speak. There is no need to count, hide, or fix it here.</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              'What helps me feel heard in a conversation?',
              'When do I prefer more time, a pause, or a different way to communicate?',
              'What do I want a listener to know about my communication?',
              'Which topics or people make conversation feel comfortable for me?'
            ].map(prompt => (
              <div key={prompt} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-semibold text-slate-700">{prompt}</div>
            ))}
          </div>
          <p className="text-xs text-slate-500">You can answer privately, out loud, with AAC, or skip any prompt.</p>
        </section>
      )}

      {activeTab === 'strategies' && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-5">
          <div>
            <h2 className="text-xl font-black text-slate-900">Strategies chosen by you and your clinician</h2>
            <p className="text-sm text-slate-600 mt-1">Select only ideas already discussed with your clinician, or add your own. This tool does not recommend treatment.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {['Pause when I choose', 'Use a visual pacing cue', 'Take turns with a conversation partner', 'Use AAC, writing, or gesture', 'Ask for extra time', 'No strategy today'].map(strategy => (
              <label key={strategy} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" checked={selectedStrategies.includes(strategy)} onChange={event => setSelectedStrategies(current => event.target.checked ? [...current, strategy] : current.filter(item => item !== strategy))} className="w-4 h-4 accent-teal-600" />
                <span className="text-sm font-semibold text-slate-700">{strategy}</span>
              </label>
            ))}
          </div>
          <form onSubmit={event => { event.preventDefault(); if (customStrategy.trim()) { setSelectedStrategies(current => [...current, customStrategy.trim()]); setCustomStrategy(''); } }} className="flex flex-col sm:flex-row gap-2">
            <input value={customStrategy} onChange={event => setCustomStrategy(event.target.value)} placeholder="Add a strategy I chose" className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            <button type="submit" className="px-4 py-3 rounded-xl bg-teal-700 text-white text-sm font-bold flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Add</button>
          </form>
          {selectedStrategies.length > 0 && <p className="text-xs text-teal-800 bg-teal-50 rounded-xl p-3">Selected for this visit: {selectedStrategies.join(' · ')}</p>}
        </section>
      )}

      {activeTab === 'pacing' && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-5">
          <h2 className="text-xl font-black text-slate-900">Choose a pace—or choose not to</h2>
          <p className="text-sm text-slate-600">Try a voluntary pacing cue only if it feels useful. Your natural pace and stuttering are welcome; you can stop or change the activity at any time.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['My usual pace', 'A little slower', 'A little quicker', 'No pacing cue'].map(option => (
              <button key={option} aria-pressed={selectedPace === option} onClick={() => { setSelectedPace(option); if (option === 'A little quicker') setPacingRateMode('rabbit'); else { setPacingRateMode('turtle'); if (option === 'No pacing cue') setIsMetronomeActive(false); } }} className={`rounded-2xl border-2 p-4 text-sm font-bold ${selectedPace === option ? 'border-teal-500 bg-teal-50 text-teal-900' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>{option}</button>
            ))}
          </div>
          <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
            <p className="font-bold text-indigo-950">Optional practice</p>
            <p className="text-sm text-indigo-900 mt-1">Choose a sentence, speak it in the way that feels right, and pause whenever you like. There is no timer, target, or score.</p>
          </div>
        </section>
      )}

      {activeTab === 'confidence' && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-5">
          <div className="flex items-center gap-3"><Sparkles className="w-6 h-6 text-amber-500" /><div><h2 className="text-xl font-black text-slate-900">Communication confidence</h2><p className="text-sm text-slate-600">Practice participation and self-advocacy, not fluent speech.</p></div></div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              ['Ask for time', '“I have something to say. Please give me a moment.”'],
              ['Set a boundary', '“Please listen to what I am saying, not how I say it.”'],
              ['Choose another way', '“I can show you, write it, or use my device.”'],
              ['Start a conversation', 'Choose a person and topic that feel comfortable—or practice privately first.']
            ].map(([title, phrase]) => <div key={title} className="p-4 rounded-2xl bg-amber-50 border border-amber-100"><p className="font-bold text-amber-950">{title}</p><p className="text-sm text-slate-700 mt-2">{phrase}</p><button onClick={() => speakText(phrase, Language.ENGLISH)} className="mt-3 text-xs font-bold text-amber-800 flex items-center gap-1"><Volume2 className="w-3.5 h-3.5" />Hear phrase</button></div>)}
          </div>
        </section>
      )}

      {activeTab === 'journal' && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-5">
          <div><h2 className="text-xl font-black text-slate-900">Private reflection journal</h2><p className="text-sm text-slate-600 mt-1">Entries stay in this browser on this device. Reflect on what mattered to you—not a fluency score.</p></div>
          <textarea value={selfReflection} onChange={event => setSelfReflection(event.target.value)} rows={4} placeholder="What felt meaningful? What would you like to remember? What support did you value?" className="w-full rounded-2xl border border-slate-200 p-4 text-sm focus:border-teal-500 focus:outline-none" />
          <button onClick={saveJournalEntry} disabled={!selfReflection.trim()} className="px-5 py-3 rounded-xl bg-teal-700 text-white text-sm font-bold disabled:opacity-40">Save reflection</button>
          <div className="space-y-3">{journalEntries.map(entry => <article key={entry.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100"><p className="text-xs text-slate-500">{entry.date}</p><p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">{entry.reflection}</p></article>)}</div>
        </section>
      )}

      {activeTab === 'sample' && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-5">
          <div><h2 className="text-xl font-black text-slate-900">Optional speech sample</h2><p className="text-sm text-slate-600 mt-1">Recording stays in memory in this tab only. It is not uploaded or scored, and is cleared when you leave or reload.</p></div>
          <label className="block text-sm font-bold text-slate-700">Optional prompt
            <input value={samplePrompt} onChange={event => setSamplePrompt(event.target.value)} placeholder="A topic or sentence of your choice" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {!sampleRecording ? <button onClick={startSampleRecording} className="px-5 py-3 rounded-xl bg-rose-600 text-white font-bold flex items-center gap-2"><Mic className="w-4 h-4" />Start local recording</button> : <button onClick={stopSampleRecording} className="px-5 py-3 rounded-xl bg-slate-900 text-white font-bold flex items-center gap-2"><Square className="w-4 h-4" />Stop ({sampleDuration}s)</button>}
            {sampleUrl && <audio controls src={sampleUrl} className="max-w-full" />}
          </div>
          {sampleUrl && <div className="space-y-2"><label className="block text-sm font-bold text-slate-700">Neutral self-rating (optional): How did the experience feel?</label><div className="flex flex-wrap gap-2">{['Comfortable', 'Mixed', 'Challenging', 'Prefer not to say'].map(rating => <button key={rating} onClick={() => setSampleSelfRating(rating)} className={`px-3 py-2 rounded-xl border text-sm ${sampleSelfRating === rating ? 'bg-teal-50 border-teal-500 text-teal-900' : 'border-slate-200 text-slate-700'}`}>{rating}</button>)}</div><p className="text-xs text-slate-500">This reflects your experience—not the number or type of disfluencies.</p><button onClick={() => { URL.revokeObjectURL(sampleUrl); setSampleUrl(null); setSampleSelfRating(''); }} className="text-xs text-rose-700 font-bold">Delete this recording</button></div>}
        </section>
      )}

      {activeTab === 'participation' && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-5">
          <div><h2 className="text-xl font-black text-slate-900">Participation tracker</h2><p className="text-sm text-slate-600 mt-1">Record communication opportunities you chose to take part in. No fluency or performance ratings.</p></div>
          <div className="grid sm:grid-cols-3 gap-3">
            <select value={participationActivity} onChange={event => setParticipationActivity(event.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm">{['Conversation', 'Class or meeting', 'Phone or video call', 'Ordering or asking for help', 'Creative activity', 'Other'].map(option => <option key={option}>{option}</option>)}</select>
            <input value={participationNote} onChange={event => setParticipationNote(event.target.value)} placeholder="Optional note (what mattered?)" className="sm:col-span-2 rounded-xl border border-slate-200 p-3 text-sm" />
          </div>
          <button onClick={logParticipation} className="px-5 py-3 rounded-xl bg-indigo-700 text-white text-sm font-bold">Log participation</button>
          <div className="divide-y divide-slate-100">{participationEntries.map(entry => <div key={entry.id} className="py-3"><p className="font-bold text-sm text-slate-800">{entry.activity}</p><p className="text-xs text-slate-500">{entry.date}{entry.note ? ` · ${entry.note}` : ''}</p></div>)}</div>
        </section>
      )}

      {/* Tab 1: Syllable Pacing Board */}
      {activeTab === 'pacing_board' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">Tactile Syllable Pacing</h3>
              <p className="text-xs text-slate-500">Tap each colored circle as you speak each syllable to stabilize speech rhythm.</p>
            </div>

            {/* Syllable Count Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Dots:</span>
              {[3, 4, 5, 6, 7].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setSyllableCount(num);
                    setActiveSyllableIndex(-1);
                  }}
                  className={`w-8 h-8 rounded-xl font-bold text-xs ${
                    syllableCount === num
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Tactile Pacing Circles */}
          <div className="p-8 sm:p-12 bg-gradient-to-br from-slate-50 to-teal-50/40 rounded-3xl border border-slate-200 flex flex-wrap items-center justify-center gap-4 sm:gap-6 min-h-[220px]">
            {Array.from({ length: syllableCount }).map((_, idx) => {
              const isActive = activeSyllableIndex === idx;
              return (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setActiveSyllableIndex(idx);
                    void playTapClick();
                  }}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center font-black text-lg transition-all shadow-lg cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-white scale-110 ring-4 ring-emerald-400/40 shadow-emerald-200'
                      : 'bg-white text-slate-700 hover:scale-105 border-2 border-slate-200'
                  }`}
                >
                  <span>{idx + 1}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-75">Tap</span>
                </motion.button>
              );
            })}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <button
              onClick={async () => {
                if (isMetronomeActive) {
                  setIsMetronomeActive(false);
                  return;
                }
                if (await playTapClick()) setIsMetronomeActive(true);
              }}
              className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                isMetronomeActive
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                  : 'bg-slate-900 text-white shadow-md'
              }`}
            >
              <Activity className="w-4 h-4" />
              {isMetronomeActive ? 'Stop Auto-Metronome' : 'Start Auto-Metronome'}
            </button>

            <button
              onClick={() => setActiveSyllableIndex(-1)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Board
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Timed Storytelling */}
      {activeTab === 'timed_storytelling' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">Timed Storytelling with Pacing</h3>
              <p className="text-xs text-slate-500">Choose a prompt and explore it at a pace that feels comfortable. Timing is optional and is never compared to a target.</p>
            </div>

            <div className="flex items-center gap-2">
              {STORY_PROMPTS.map((prompt, idx) => (
                <button
                  key={prompt.id}
                  onClick={() => {
                    setSelectedStoryIndex(idx);
                    setStoryTimeElapsed(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                    selectedStoryIndex === idx
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Story {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Story Prompt Card */}
          <div className="p-8 rounded-3xl bg-indigo-50/50 border border-indigo-200 space-y-6 text-center">
            <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
              {selectedStory.title} ({selectedStory.category})
            </span>

            <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed font-mono">
              "{selectedStory.text}"
            </p>

            {/* Visual Syllable Rhythm Blocks */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {selectedStory.syllables.map((syl, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-xs font-mono font-bold text-indigo-900 shadow-sm">
                  {syl}
                </span>
              ))}
            </div>

            <div className="pt-4 flex items-center justify-center gap-6 text-xs text-slate-600">
              <span>⏱️ Optional elapsed time: <strong>{storyTimeElapsed}s</strong></span>
              <span>🗣️ No target pace</span>
            </div>
          </div>

          {/* Recording Actions */}
          <div className="flex items-center justify-center gap-4">
            {!isStoryRecording ? (
              <button
                onClick={startStoryTrial}
                className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all"
              >
                <Timer className="w-5 h-5" />
                Start optional timer
              </button>
            ) : (
              <button
                onClick={finishStoryTrial}
                className="px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm uppercase tracking-wider shadow-lg animate-pulse flex items-center gap-2 transition-all"
              >
                <Square className="w-5 h-5" />
                Stop optional timer ({storyTimeElapsed}s)
              </button>
            )}

            <button
              onClick={() => speakText(selectedStory.text, Language.ENGLISH)}
              className="px-5 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4" />
              Hear Model Pace
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
