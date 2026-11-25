import React, { useState } from 'react';
import { Heart, MessageCircle, HandHelping, Eye, ShieldCheck, BookOpen, Volume2, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';

type StudioTab = 'conversation' | 'turns' | 'help' | 'emotions' | 'perspective' | 'advocacy' | 'stories';

const TABS: { id: StudioTab; label: string; icon: React.ElementType }[] = [
  { id: 'conversation', label: 'Conversation', icon: MessageCircle },
  { id: 'turns', label: 'Taking turns', icon: ArrowRight },
  { id: 'help', label: 'Ask for help', icon: HandHelping },
  { id: 'emotions', label: 'Emotions', icon: Heart },
  { id: 'perspective', label: 'Perspectives', icon: Eye },
  { id: 'advocacy', label: 'Self-advocacy', icon: ShieldCheck },
  { id: 'stories', label: 'Social stories', icon: BookOpen }
];

const CONVERSATION_TOPICS = ['A favorite activity', 'Something I noticed today', 'A show, game, or book', 'A question I am curious about'];
const HELP_NEEDS = [
  ['I need more time', '“Please give me a little more time.”'],
  ['I did not understand', '“Could you explain that another way?”'],
  ['I need a break', '“I need a break. I will come back when I am ready.”'],
  ['I need access support', '“Could you help me with this?”']
];
const EMOTION_SCENARIOS = [
  { scene: 'A friend changes the game everyone planned to play.', emotions: ['Disappointed', 'Curious', 'Relieved', 'Unsure'] },
  { scene: 'Someone is invited to share an idea with a group.', emotions: ['Excited', 'Nervous', 'Proud', 'Not sure yet'] },
  { scene: 'A favorite plan is postponed until another day.', emotions: ['Sad', 'Flexible', 'Frustrated', 'Hopeful'] }
];
const PERSPECTIVE_SCENARIOS = [
  { scene: 'Two people both reach for the same book.', possibilities: ['One person may want to read it now.', 'They might decide to read together.', 'One may offer it to the other.', 'We can ask what each person prefers.'] },
  { scene: 'A classmate is quiet during a group activity.', possibilities: ['They may be thinking.', 'They might prefer to listen.', 'They could have something else on their mind.', 'We cannot know without asking respectfully.'] }
];

export const SocialCommunicationStudio: React.FC = () => {
  const [tab, setTab] = useState<StudioTab>('conversation');
  const [topicIndex, setTopicIndex] = useState(0);
  const [turn, setTurn] = useState<'my-turn' | 'partner-turn'>('my-turn');
  const [helpIndex, setHelpIndex] = useState(0);
  const [emotionIndex, setEmotionIndex] = useState(0);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [perspectiveIndex, setPerspectiveIndex] = useState(0);
  const [selectedPerspectives, setSelectedPerspectives] = useState<string[]>([]);
  const [advocacyNeeds, setAdvocacyNeeds] = useState<string[]>([]);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyPage, setStoryPage] = useState(0);

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
      console.error('Failed to play communication phrase:', error);
      toast.error('The browser could not play this phrase.');
    }
  };
  const toggleItem = (items: string[], setItems: (next: string[]) => void, item: string) => {
    setItems(items.includes(item) ? items.filter(value => value !== item) : [...items, item]);
  };

  const stories = [
    { title: 'My way of communicating', pages: ['People communicate in many ways: speech, AAC, writing, gesture, and more.', 'I can communicate in the way that works for me. I can take the time I need.', 'A kind listener pays attention to my message. I deserve to be included.'] },
    { title: 'Joining a conversation', pages: ['I may listen first, join in, or choose another activity.', 'I can share an idea, ask a question, or use my communication tools.', 'There is more than one way to take part. My choice matters.'] },
    { title: 'When a conversation feels hard', pages: ['Sometimes people do not understand me right away. That is not my fault.', 'I can repeat, rephrase, show, write, use AAC, or ask someone to listen.', 'I can pause or leave. I can try again when I choose.'] }
  ];

  return (
    <section aria-labelledby="social-communication-title" className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <header className="rounded-3xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-widest text-violet-700">Communication choices & connection</p>
        <h1 id="social-communication-title" className="text-3xl font-black text-slate-900 mt-2">Social Communication Studio</h1>
        <p className="text-slate-700 mt-2 max-w-3xl">Explore conversation, emotions, perspectives, and self-advocacy through flexible practice. There is no single correct way to socialize, and nobody needs to mask or hide who they are.</p>
      </header>

      <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2" aria-label="Social communication activities">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)} className={`p-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 ${tab === id ? 'bg-violet-700 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-violet-50'}`}>
            <Icon className="w-4 h-4 shrink-0" />{label}
          </button>
        ))}
      </nav>

      {tab === 'conversation' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
          <div><h2 className="text-xl font-black text-slate-900">Start with a topic you choose</h2><p className="text-sm text-slate-600 mt-1">Practice alone, with someone you trust, or just read the prompts.</p></div>
          <div className="flex flex-wrap gap-2">{CONVERSATION_TOPICS.map((topic, index) => <button key={topic} onClick={() => setTopicIndex(index)} aria-pressed={topicIndex === index} className={`px-3 py-2 rounded-xl border text-sm font-semibold ${topicIndex === index ? 'bg-violet-50 border-violet-500 text-violet-900' : 'border-slate-200 text-slate-700'}`}>{topic}</button>)}</div>
          <div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs uppercase font-black tracking-wider text-slate-500">A possible opener</p><p className="text-lg font-bold text-slate-900 mt-2">“I’d like to tell you about {CONVERSATION_TOPICS[topicIndex].toLowerCase()}.”</p><button onClick={() => speak(`I'd like to tell you about ${CONVERSATION_TOPICS[topicIndex].toLowerCase()}.`)} className="mt-3 text-sm text-violet-800 font-bold flex items-center gap-2"><Volume2 className="w-4 h-4" />Hear it</button></div>
          <div className="flex flex-wrap items-center gap-3"><span className="text-sm text-slate-700">Practice turn:</span><button onClick={() => setTurn(turn === 'my-turn' ? 'partner-turn' : 'my-turn')} className="px-4 py-2 rounded-xl bg-violet-700 text-white text-sm font-bold">{turn === 'my-turn' ? 'My turn to share' : 'Partner’s turn to share'}</button><span className="text-xs text-slate-500">Listening, pausing, and passing are all ways to participate.</span></div>
        </section>
      )}

      {tab === 'turns' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
          <div><h2 className="text-xl font-black text-slate-900">Flexible turn-taking</h2><p className="text-sm text-slate-600 mt-1">A turn can be a spoken sentence, a gesture, an AAC message, a written note, or choosing to listen.</p></div>
          <div className="grid sm:grid-cols-3 gap-3">{[['Share', '“I want to add something.”'], ['Invite', '“Would you like to share?”'], ['Pass', '“I’ll listen for now.”']].map(([label, phrase]) => <button key={label} onClick={() => speak(phrase)} className="text-left p-5 rounded-2xl border border-slate-200 hover:border-violet-400"><span className="font-black text-violet-900">{label}</span><p className="text-sm text-slate-700 mt-2">{phrase}</p><span className="mt-3 inline-flex items-center gap-1 text-xs text-violet-700 font-bold"><Volume2 className="w-3.5 h-3.5" />Hear phrase</span></button>)}</div>
          <div className="flex flex-wrap items-center gap-3"><p aria-live="polite" className="text-sm text-slate-700">Current practice turn: <strong>{turn === 'my-turn' ? 'you' : 'conversation partner'}</strong></p><button onClick={() => setTurn(turn === 'my-turn' ? 'partner-turn' : 'my-turn')} className="px-4 py-3 rounded-xl bg-violet-700 text-white text-sm font-bold">Switch turn (optional)</button></div>
        </section>
      )}

      {tab === 'help' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
          <div><h2 className="text-xl font-black text-slate-900">Ask for help or a change</h2><p className="text-sm text-slate-600 mt-1">Choose wording that sounds like you. You can also use your own words, AAC, a gesture, or a written message.</p></div>
          <div className="flex flex-wrap gap-2">{HELP_NEEDS.map(([need], index) => <button key={need} onClick={() => setHelpIndex(index)} aria-pressed={helpIndex === index} className={`px-3 py-2 rounded-xl border text-sm font-semibold ${helpIndex === index ? 'bg-violet-50 border-violet-500' : 'border-slate-200'}`}>{need}</button>)}</div>
          <div className="p-5 rounded-2xl bg-violet-50 border border-violet-100"><p className="text-xl font-bold text-violet-950">{HELP_NEEDS[helpIndex][1]}</p><button onClick={() => speak(HELP_NEEDS[helpIndex][1])} className="mt-3 flex items-center gap-2 text-sm text-violet-800 font-bold"><Volume2 className="w-4 h-4" />Hear request</button></div>
        </section>
      )}

      {tab === 'emotions' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
          <div><h2 className="text-xl font-black text-slate-900">Name feelings with curiosity</h2><p className="text-sm text-slate-600 mt-1">More than one feeling can fit the same situation. A person’s feelings are theirs to describe.</p></div>
          <div className="flex flex-wrap gap-2">{EMOTION_SCENARIOS.map((item, index) => <button key={item.scene} onClick={() => { setEmotionIndex(index); setSelectedEmotions([]); }} aria-pressed={emotionIndex === index} className={`px-3 py-2 rounded-xl border text-sm font-semibold ${emotionIndex === index ? 'bg-amber-50 border-amber-500' : 'border-slate-200'}`}>Situation {index + 1}</button>)}</div>
          <div className="p-5 bg-amber-50 rounded-2xl"><p className="font-bold text-slate-900">{EMOTION_SCENARIOS[emotionIndex].scene}</p><p className="text-sm text-slate-700 mt-2">Which feelings might someone have? Choose any, or add another.</p></div>
          <div className="flex flex-wrap gap-2">{EMOTION_SCENARIOS[emotionIndex].emotions.map(emotion => <button key={emotion} onClick={() => toggleItem(selectedEmotions, setSelectedEmotions, emotion)} aria-pressed={selectedEmotions.includes(emotion)} className={`px-4 py-2 rounded-full border text-sm font-bold ${selectedEmotions.includes(emotion) ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-slate-200 text-slate-700'}`}>{emotion}</button>)}</div>
          <p aria-live="polite" className="text-sm text-slate-600">{selectedEmotions.length ? `You chose: ${selectedEmotions.join(', ')}. Other feelings may fit too.` : 'There are no right or wrong answers. We can ask rather than guess.'}</p>
        </section>
      )}

      {tab === 'perspective' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
          <div><h2 className="text-xl font-black text-slate-900">Consider possible perspectives</h2><p className="text-sm text-slate-600 mt-1">These are possibilities, not facts about what someone thinks. Asking kindly is one option.</p></div>
          <div className="flex gap-2">{PERSPECTIVE_SCENARIOS.map((scenario, index) => <button key={scenario.scene} onClick={() => { setPerspectiveIndex(index); setSelectedPerspectives([]); }} aria-pressed={perspectiveIndex === index} className={`px-3 py-2 rounded-xl border text-sm font-semibold ${perspectiveIndex === index ? 'bg-sky-50 border-sky-500' : 'border-slate-200'}`}>Example {index + 1}</button>)}</div>
          <p className="rounded-2xl bg-sky-50 p-4 font-bold text-slate-900">{PERSPECTIVE_SCENARIOS[perspectiveIndex].scene}</p>
          <div className="space-y-2">{PERSPECTIVE_SCENARIOS[perspectiveIndex].possibilities.map(option => <label key={option} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 text-sm text-slate-700"><input type="checkbox" checked={selectedPerspectives.includes(option)} onChange={() => toggleItem(selectedPerspectives, setSelectedPerspectives, option)} className="mt-0.5 accent-sky-700" />{option}</label>)}</div>
          <p className="text-xs text-slate-500">Different people can understand the same moment differently. You can choose not to guess.</p>
        </section>
      )}

      {tab === 'advocacy' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
          <div><h2 className="text-xl font-black text-slate-900">Self-advocacy: communicate what works for you</h2><p className="text-sm text-slate-600 mt-1">Choose preferences to build a message. Edit it, share it, or keep it private.</p></div>
          <div className="grid sm:grid-cols-2 gap-3">{['Please give me time to answer.', 'I may communicate with speech, AAC, writing, or gestures.', 'Please speak to me, not only to someone with me.', 'I may need a quieter place or a break.', 'Please do not finish my sentences.', 'I will tell you if I want help.'].map(item => <label key={item} className="p-3 rounded-xl border border-slate-200 flex gap-3 text-sm text-slate-700"><input type="checkbox" checked={advocacyNeeds.includes(item)} onChange={() => toggleItem(advocacyNeeds, setAdvocacyNeeds, item)} className="accent-violet-700" />{item}</label>)}</div>
          <div className="p-4 rounded-2xl bg-violet-50 min-h-20 text-sm text-violet-950">{advocacyNeeds.length ? advocacyNeeds.join(' ') : 'Select any preferences you would like to include.'}</div>
          {advocacyNeeds.length > 0 && <button onClick={() => speak(advocacyNeeds.join(' '))} className="px-4 py-3 rounded-xl bg-violet-700 text-white font-bold text-sm flex items-center gap-2"><Volume2 className="w-4 h-4" />Hear message</button>}
        </section>
      )}

      {tab === 'stories' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
          <div><h2 className="text-xl font-black text-slate-900">Affirming social stories</h2><p className="text-sm text-slate-600 mt-1">Stories recognize communication differences and personal choice; they do not teach masking or forced eye contact.</p></div>
          <div className="flex flex-wrap gap-2">{stories.map((story, index) => <button key={story.title} onClick={() => { setStoryIndex(index); setStoryPage(0); }} aria-pressed={storyIndex === index} className={`px-3 py-2 rounded-xl border text-sm font-bold ${storyIndex === index ? 'bg-violet-50 border-violet-500' : 'border-slate-200'}`}>{story.title}</button>)}</div>
          <article className="min-h-40 flex flex-col justify-between rounded-2xl bg-violet-50 p-6"><p className="text-xl sm:text-2xl font-bold leading-relaxed text-violet-950">{stories[storyIndex].pages[storyPage]}</p><div className="mt-6 flex items-center justify-between"><span className="text-xs text-violet-700">Page {storyPage + 1} of {stories[storyIndex].pages.length}</span><button onClick={() => setStoryPage((storyPage + 1) % stories[storyIndex].pages.length)} className="px-4 py-2 rounded-xl bg-violet-700 text-white text-sm font-bold flex items-center gap-2"><Check className="w-4 h-4" />Next page</button></div></article>
        </section>
      )}
      <p className="text-xs text-slate-500 text-center">These are flexible practice activities, not a clinical assessment or treatment plan.</p>
    </section>
  );
};
