import React, { useState } from 'react';
import { MessageSquareText, FileText, Search, BookOpen, PenLine, Volume2, Brain, ListOrdered, Mic2, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

type RehabTab = 'aphasia' | 'scripts' | 'retrieval' | 'reading' | 'writing' | 'dysarthria' | 'cognition' | 'memory';
const TABS: { id: RehabTab; label: string; icon: React.ElementType }[] = [
  { id: 'aphasia', label: 'Aphasia communication', icon: MessageSquareText },
  { id: 'scripts', label: 'Functional scripts', icon: FileText },
  { id: 'retrieval', label: 'Word retrieval', icon: Search },
  { id: 'reading', label: 'Reading', icon: BookOpen },
  { id: 'writing', label: 'Writing', icon: PenLine },
  { id: 'dysarthria', label: 'Speech practice', icon: Mic2 },
  { id: 'cognition', label: 'Cognitive communication', icon: Brain },
  { id: 'memory', label: 'Memory & sequencing', icon: ListOrdered }
];

const READING_PASSAGES = [
  { title: 'A morning appointment', text: 'Jordan has an appointment at 10:30 on Tuesday. The clinic is on Pine Street. Jordan plans to bring a list of questions and arrive a few minutes early.', question: 'What time is the appointment?', choices: ['9:30', '10:30', 'Tuesday afternoon'], answer: '10:30' },
  { title: 'A change in plans', text: 'The neighborhood book group will meet at the library this week instead of the café. The group starts at 6:00 p.m. Members can bring a book they enjoyed.', question: 'Where will the group meet?', choices: ['At the library', 'At the café', 'At someone’s home'], answer: 'At the library' }
];
const WORDS = [
  { word: 'Umbrella', category: 'An object used outdoors', use: 'It helps keep someone dry in the rain.', feature: 'It opens and has a handle.' },
  { word: 'Key', category: 'A small everyday object', use: 'It can open a lock.', feature: 'It is often carried in a pocket or bag.' },
  { word: 'Thermometer', category: 'A measuring tool', use: 'It tells how warm or cool something is.', feature: 'It may be used when someone feels unwell.' }
];
const ROUTINES = [
  { name: 'Make a cup of tea', steps: ['Get a cup', 'Heat water', 'Put tea in the cup', 'Pour water and wait'] },
  { name: 'Get ready to leave', steps: ['Check what you need', 'Gather your items', 'Put on shoes or coat', 'Lock the door if needed'] }
];

export const AdultSpeechRehabStudio: React.FC = () => {
  const [tab, setTab] = useState<RehabTab>('aphasia');
  const [personalMessage, setPersonalMessage] = useState('');
  const [selectedScript, setSelectedScript] = useState('At a café');
  const [scriptText, setScriptText] = useState('Hello. Could I please have a coffee?');
  const [wordIndex, setWordIndex] = useState(0);
  const [revealedCues, setRevealedCues] = useState<string[]>([]);
  const [wordResponse, setWordResponse] = useState('');
  const [readingIndex, setReadingIndex] = useState(0);
  const [readingAnswer, setReadingAnswer] = useState('');
  const [showReadingReflection, setShowReadingReflection] = useState(false);
  const [writingText, setWritingText] = useState('');
  const [writingPrompt, setWritingPrompt] = useState('Write a note to arrange a visit with someone you know.');
  const [selectedPhrase, setSelectedPhrase] = useState('I would like to order lunch, please.');
  const [cognitiveTask, setCognitiveTask] = useState('Plan a simple meal');
  const [cognitiveSteps, setCognitiveSteps] = useState<string[]>(['Choose a meal', 'Check ingredients', 'Prepare the food']);
  const [newCognitiveStep, setNewCognitiveStep] = useState('');
  const [routineIndex, setRoutineIndex] = useState(0);
  const [sequence, setSequence] = useState<string[]>(ROUTINES[0].steps);
  const [showSequence, setShowSequence] = useState(true);

  const speak = (text: string) => {
    if (typeof window.speechSynthesis === 'undefined') {
      toast.error('Text-to-speech is not available in this browser.');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onerror = () => toast.error('The browser could not play this phrase.');
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Failed to play rehabilitation phrase:', error);
      toast.error('The browser could not play this phrase.');
    }
  };
  const scripts: Record<string, string> = {
    'At a café': 'Hello. Could I please have a coffee?',
    'At an appointment': 'I have an appointment today. I would like to ask a question.',
    'On the phone': 'Hello, this is ____. I am calling about ____.',
    'Ask for help': 'Could you please help me with ____?'
  };
  const cues = [
    ['Category', WORDS[wordIndex].category],
    ['What it does', WORDS[wordIndex].use],
    ['A feature', WORDS[wordIndex].feature]
  ];

  return (
    <section aria-labelledby="adult-rehab-title" className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <header className="rounded-3xl bg-gradient-to-br from-sky-50 to-teal-50 border border-sky-100 p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-widest text-sky-800">Everyday communication practice</p>
        <h1 id="adult-rehab-title" className="text-3xl font-black text-slate-900 mt-2">Adult Speech & Communication Studio</h1>
        <p className="text-slate-700 mt-2 max-w-3xl">Flexible activities for aphasia, word retrieval, reading, writing, speech, planning, and memory. Choose a task or adapt the wording to your own goals.</p>
      </header>

      <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2" aria-label="Adult communication activities">
        {TABS.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)} className={`p-3 rounded-xl text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-2 ${tab === id ? 'bg-sky-800 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-sky-50'}`}><Icon className="w-5 h-5" />{label}</button>)}
      </nav>

      {tab === 'aphasia' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
          <div><h2 className="text-xl font-black text-slate-900">Aphasia: communicate your message</h2><p className="text-sm text-slate-600 mt-1">Use a spoken model, read it, point to a phrase, or adapt it. The message—not the method—is what matters.</p></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{[['I need help', 'Could you help me, please?'], ['I need a break', 'I would like to take a break.'], ['I have a question', 'I have a question.'], ['Yes / No', 'Yes. No. I am not sure.'], ['Please wait', 'Please give me time.'], ['Try another way', 'Could you say or show that another way?']].map(([label, phrase]) => <button key={label} onClick={() => speak(phrase)} className="min-h-24 rounded-2xl border-2 border-sky-100 bg-sky-50 hover:bg-sky-100 p-4 text-left"><span className="text-sm font-black text-sky-950">{label}</span><span className="block text-xs text-slate-700 mt-2">{phrase}</span><Volume2 className="w-4 h-4 text-sky-700 mt-2" /></button>)}</div>
          <label className="block text-sm font-bold text-slate-700">Make a personal message
            <textarea rows={2} value={personalMessage} placeholder="Write or edit a message that works for you" className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" onChange={event => setPersonalMessage(event.target.value)} />
          </label>
          <button disabled={!personalMessage.trim()} onClick={() => speak(personalMessage)} className="px-4 py-3 rounded-xl bg-sky-800 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40"><Volume2 className="w-4 h-4" />Speak message</button>
        </section>
      )}

      {tab === 'scripts' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
          <div><h2 className="text-xl font-black text-slate-900">Functional scripts</h2><p className="text-sm text-slate-600 mt-1">Create a phrase for a situation that matters to you. Use the script as-is, change it, or use another communication method.</p></div>
          <div className="flex flex-wrap gap-2">{Object.keys(scripts).map(title => <button key={title} onClick={() => { setSelectedScript(title); setScriptText(scripts[title]); }} aria-pressed={selectedScript === title} className={`px-3 py-2 rounded-xl border text-sm font-bold ${selectedScript === title ? 'bg-sky-50 border-sky-500' : 'border-slate-200'}`}>{title}</button>)}</div>
          <label className="block text-sm font-bold text-slate-700">{selectedScript}
            <textarea rows={4} value={scriptText} onChange={event => setScriptText(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 p-4 text-base font-normal" />
          </label>
          <button onClick={() => speak(scriptText)} className="px-4 py-3 rounded-xl bg-sky-800 text-white text-sm font-bold flex items-center gap-2"><Volume2 className="w-4 h-4" />Hear script</button>
        </section>
      )}

      {tab === 'retrieval' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
          <div><h2 className="text-xl font-black text-slate-900">Word retrieval with optional cues</h2><p className="text-sm text-slate-600 mt-1">Take as much time as you like. Reveal any clue, use a different word, or skip the activity.</p></div>
          <div className="flex flex-wrap gap-2">{WORDS.map((item, index) => <button key={item.word} onClick={() => { setWordIndex(index); setRevealedCues([]); setWordResponse(''); }} aria-pressed={wordIndex === index} className={`px-3 py-2 rounded-xl border text-sm font-bold ${wordIndex === index ? 'bg-amber-50 border-amber-500' : 'border-slate-200'}`}>Word {index + 1}</button>)}</div>
          <div className="p-5 rounded-2xl bg-amber-50"><p className="font-bold text-slate-900">Think of an everyday item.</p><div className="mt-3 flex flex-wrap gap-2">{cues.map(([label, text]) => <button key={label} onClick={() => setRevealedCues(current => current.includes(label) ? current : [...current, label])} className="px-3 py-2 rounded-xl bg-white border border-amber-200 text-sm font-semibold">Show {label.toLowerCase()}</button>)}</div><div className="mt-3 space-y-2">{cues.filter(([label]) => revealedCues.includes(label)).map(([label, text]) => <p key={label} className="text-sm text-slate-700"><strong>{label}:</strong> {text}</p>)}</div></div>
          <label className="block text-sm font-bold text-slate-700">Your word or idea (optional)
            <input value={wordResponse} onChange={event => setWordResponse(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" placeholder="Type a guess, related word, or personal note" />
          </label>
          <button onClick={() => setRevealedCues(['Category', 'What it does', 'A feature', 'Answer'])} className="text-sm font-bold text-amber-800 underline">Show example word</button>
          {revealedCues.includes('Answer') && <p className="p-3 bg-slate-50 rounded-xl text-sm">Example word: <strong>{WORDS[wordIndex].word}</strong>. Other answers or related ideas are welcome.</p>}
        </section>
      )}

      {tab === 'reading' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
          <div><h2 className="text-xl font-black text-slate-900">Reading comprehension</h2><p className="text-sm text-slate-600 mt-1">Read silently, read aloud, or listen to the passage. You can reveal details to check your understanding without a score.</p></div>
          <div className="flex gap-2">{READING_PASSAGES.map((passage, index) => <button key={passage.title} onClick={() => { setReadingIndex(index); setReadingAnswer(''); setShowReadingReflection(false); }} aria-pressed={readingIndex === index} className={`px-3 py-2 rounded-xl border text-sm font-bold ${readingIndex === index ? 'bg-teal-50 border-teal-500' : 'border-slate-200'}`}>{passage.title}</button>)}</div>
          <article className="p-5 rounded-2xl bg-teal-50 text-lg leading-relaxed text-slate-800">{READING_PASSAGES[readingIndex].text}<button onClick={() => speak(READING_PASSAGES[readingIndex].text)} aria-label="Listen to passage" className="ml-3 text-teal-800 align-middle"><Volume2 className="w-5 h-5" /></button></article>
          <fieldset className="space-y-2"><legend className="font-bold text-slate-800">{READING_PASSAGES[readingIndex].question}</legend>{READING_PASSAGES[readingIndex].choices.map(choice => <label key={choice} className="flex gap-3 items-center p-3 rounded-xl border border-slate-200 text-sm"><input type="radio" name="reading-answer" value={choice} checked={readingAnswer === choice} onChange={() => { setReadingAnswer(choice); setShowReadingReflection(false); }} className="accent-teal-700" />{choice}</label>)}</fieldset>
          <button onClick={() => setShowReadingReflection(true)} disabled={!readingAnswer} className="px-4 py-3 rounded-xl bg-teal-800 text-white text-sm font-bold disabled:opacity-40">Show passage detail</button>
          {showReadingReflection && <p className="p-3 rounded-xl bg-slate-50 text-sm text-slate-700">The passage says: <strong>{READING_PASSAGES[readingIndex].answer}</strong>. Use this as a chance to reflect; this activity does not grade you.</p>}
        </section>
      )}

      {tab === 'writing' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
          <div><h2 className="text-xl font-black text-slate-900">Writing for everyday communication</h2><p className="text-sm text-slate-600 mt-1">Write, dictate with your device, sketch, or use keywords. There is no required length or spelling score.</p></div>
          <select value={writingPrompt} onChange={event => setWritingPrompt(event.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm">{['Write a note to arrange a visit with someone you know.', 'Write a short list for an activity you enjoy.', 'Write a message asking for information.', 'Write about something you would like to share.'].map(prompt => <option key={prompt}>{prompt}</option>)}</select>
          <textarea value={writingText} onChange={event => setWritingText(event.target.value)} rows={8} placeholder={writingPrompt} className="w-full rounded-2xl border border-slate-200 p-4 text-base" />
          <div className="flex items-center justify-between text-xs text-slate-500"><span>{writingText.length} characters (for your reference)</span><button onClick={() => setWritingText('')} className="font-bold text-rose-700">Clear draft</button></div>
        </section>
      )}

      {tab === 'dysarthria' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
          <div><h2 className="text-xl font-black text-slate-900">Speech practice: dysarthria support</h2><p className="text-sm text-slate-600 mt-1">Practice a personally meaningful phrase at a comfortable effort. Use cues selected with your clinician if you have them; this tool does not rate speech or prescribe exercises.</p></div>
          <div className="grid sm:grid-cols-2 gap-3">{['I would like to order lunch, please.', 'Could you tell me what time we are leaving?', 'I have something important to share.', 'Please give me a moment to finish.'].map(phrase => <button key={phrase} onClick={() => setSelectedPhrase(phrase)} aria-pressed={selectedPhrase === phrase} className={`p-4 rounded-2xl border text-left font-semibold ${selectedPhrase === phrase ? 'bg-sky-50 border-sky-500' : 'border-slate-200'}`}>{phrase}</button>)}</div>
          <label className="block text-sm font-bold text-slate-700">Edit or enter your own phrase
            <textarea value={selectedPhrase} onChange={event => setSelectedPhrase(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" />
          </label>
          <button onClick={() => speak(selectedPhrase)} className="px-4 py-3 rounded-xl bg-sky-800 text-white text-sm font-bold flex items-center gap-2"><Volume2 className="w-4 h-4" />Hear text-to-speech model</button>
          <p className="text-xs text-slate-500">The voice is a device-generated model, not an assessment of your voice or a treatment target.</p>
        </section>
      )}

      {tab === 'cognition' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
          <div><h2 className="text-xl font-black text-slate-900">Cognitive communication: organize a task</h2><p className="text-sm text-slate-600 mt-1">Break a real or imagined activity into manageable steps. Rearrange, add, or remove ideas to fit your routine.</p></div>
          <select value={cognitiveTask} onChange={event => { setCognitiveTask(event.target.value); setCognitiveSteps(event.target.value === 'Plan a simple meal' ? ['Choose a meal', 'Check ingredients', 'Prepare the food'] : ['Choose a place', 'Check the time', 'Gather what I need', 'Plan how to get there']); }} className="rounded-xl border border-slate-200 p-3 text-sm"><option>Plan a simple meal</option><option>Get ready for an outing</option></select>
          <p className="font-bold text-slate-800">{cognitiveTask}</p>
          <ol className="space-y-2 list-decimal list-inside">{cognitiveSteps.map((step, index) => <li key={`${step}-${index}`} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-800">{step}</li>)}</ol>
          <div className="flex flex-col sm:flex-row gap-2"><input value={newCognitiveStep} onChange={event => setNewCognitiveStep(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && newCognitiveStep.trim()) { setCognitiveSteps(current => [...current, newCognitiveStep.trim()]); setNewCognitiveStep(''); } }} placeholder="Add a step in your own words" className="flex-1 rounded-xl border border-slate-300 p-3 text-sm" /><button onClick={() => { if (newCognitiveStep.trim()) { setCognitiveSteps(current => [...current, newCognitiveStep.trim()]); setNewCognitiveStep(''); } }} className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold">Add step</button></div>
          <p className="text-xs text-slate-500">Personal routines differ; adapt or skip any suggestion.</p>
        </section>
      )}

      {tab === 'memory' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
          <div><h2 className="text-xl font-black text-slate-900">Memory and sequencing</h2><p className="text-sm text-slate-600 mt-1">Review a familiar sequence, hide it to recall in your own way, or rearrange the steps. No timer or score.</p></div>
          <select value={routineIndex} onChange={event => { const index = Number(event.target.value); setRoutineIndex(index); setSequence(ROUTINES[index].steps); setShowSequence(true); }} className="rounded-xl border border-slate-200 p-3 text-sm">{ROUTINES.map((routine, index) => <option key={routine.name} value={index}>{routine.name}</option>)}</select>
          <button onClick={() => setShowSequence(!showSequence)} className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-900 text-sm font-bold flex items-center gap-2">{showSequence ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}{showSequence ? 'Hide sequence' : 'Show sequence'}</button>
          {showSequence ? <ol className="space-y-2">{sequence.map((step, index) => <li key={`${step}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><span className="font-black text-indigo-800">{index + 1}.</span><span className="flex-1 text-sm text-slate-800">{step}</span><button aria-label={`Move ${step} up`} disabled={index === 0} onClick={() => setSequence(current => { const next = [...current]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button><button aria-label={`Move ${step} down`} disabled={index === sequence.length - 1} onClick={() => setSequence(current => { const next = [...current]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next; })} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button></li>)}</ol> : <p className="rounded-2xl bg-indigo-50 p-5 text-sm text-indigo-950">Recall the steps in your own way, then reveal them to reflect. It is okay to use notes or supports.</p>}
        </section>
      )}
      <p className="text-xs text-slate-500 text-center">These activities are educational practice tools, not automated clinical treatment recommendations.</p>
    </section>
  );
};
