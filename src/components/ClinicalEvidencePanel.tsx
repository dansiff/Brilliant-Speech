import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Brain, 
  Wind, 
  Activity, 
  Volume2, 
  Grid, 
  FlameKindling,
  BookOpen
} from 'lucide-react';

export type ClinicalModuleId = 
  | 'pacing-board' 
  | 'voice-meters' 
  | 'aac-playground' 
  | 'autism-tools' 
  | 'matching-game' 
  | 'bilingual-match' 
  | 'language-modules';

interface ClinicalEvidencePanelProps {
  moduleId: ClinicalModuleId;
}

interface ModuleClinicalData {
  title: string;
  supports: string[];
  evidence: string[];
  goals: string;
  motorSpeech: string;
  language: string;
  fluency: string;
  aac: string;
  voice: string;
  executiveFunction: string;
  sensoryRegulation: string;
}

const CLINICAL_DATABASE: Record<ClinicalModuleId, ModuleClinicalData> = {
  'pacing-board': {
    title: 'Interactive Pacing Board',
    supports: ['Childhood Apraxia of Speech (CAS)', 'Dysarthria', 'Fluency / Stuttering', 'Rate Control'],
    evidence: [
      'Pacing boards improve temporal speech planning.',
      'Tactile-visual timing cues significantly reduce articulatory errors and increase overall intelligibility in dysarthria (Yorkston et al., 2012).',
      'Proprioceptive and tactile pacing provides stable external constraints that aid motor programming for apraxia (Helm-Estabrooks et al., 2014).'
    ],
    goals: 'Slow down speaking rate, improve syllable segmentation, and enhance speech intelligibility via tactile-visual pacing.',
    motorSpeech: 'Enhances motor planning and programming by partitioning complex, multi-syllabic targets into discrete, manageable tactile movements.',
    language: 'Facilitates morphological and phonological awareness by clearly demarcating syllabic and structural components of phrases.',
    fluency: 'Establishes a regular, predictable speech rhythm (pacing) to alleviate severe repetitions, blocks, or cluttering.',
    aac: 'Translates thoughts to progressive visual/tactile representations, acting as a low-tech pacing augmentative strategy.',
    voice: 'Encourages healthy breath groups, prompting the speaker to take adequate inhalation breaks between paced words/segments.',
    executiveFunction: 'Promotes active self-monitoring, working memory, and conscious control of conversational pace.',
    sensoryRegulation: 'Provides calming, predictable tactile haptic sensations (taps) and visual state changes to ground hyperactive or anxious speakers.'
  },
  'voice-meters': {
    title: 'Voice Onset & Decibel Meters',
    supports: ['Vocal Nodules / Abuse', 'Dysphonia', 'Flaccid/Parkinsonian Dysarthria', 'Speech Volume Control'],
    evidence: [
      'Real-time acoustic biofeedback (visual volume and spectrograms) accelerates vocal hygiene learning and prevents hard vocal attacks (Thomas-Stonell et al., 2009).',
      'Targeted intensity training promotes vocal cord adduction and respiratory support, aligning with evidence-based LSVT LOUD principles (Ramig et al., 2018).'
    ],
    goals: 'Master gentle voicing onset (easy onset) and self-regulate vocal intensity (decibels) to prevent vocal abuse.',
    motorSpeech: 'Coordinates laryngeal phonatory muscles with respiratory drive to stabilize voice initiation.',
    language: 'Teaches lexical and syntactic stress through pitch variation and decibel emphasis.',
    fluency: 'Promotes "easy onset" (soft, gradual vocal cord vibration) to prevent laryngeal blocks in stuttering therapy.',
    aac: 'Aids patients with limited vocalizations in visualising their expressive attempts as clear visual spikes and waves.',
    voice: 'Prevents hard vocal attacks, monitors dynamic loudness range, and assists in pitch-matching exercises.',
    executiveFunction: 'Strengthens the internal auditorial feedback loop by mapping sound to clear visual gauges.',
    sensoryRegulation: 'Provides interactive high-contrast visualizations of invisible acoustic waves, bridging the auditory-visual sensory gap.'
  },
  'aac-playground': {
    title: 'AAC Expressive Grid Boards (PECS)',
    supports: ['Non-Verbal Autism', 'Apraxia of Speech', 'Severe Receptive/Expressive Delay', 'Cerebral Palsy'],
    evidence: [
      'Core vocabulary instruction using visual AAC systems increases functional communication and promotes natural speech development (Light & McNaughton, 2014).',
      'Picture exchange structures improve social-communicative initiations and reduce frustration-induced behaviors (Ganz et al., 2012).'
    ],
    goals: 'Build functional communication, multi-word sentence structure, and immediate needs expression using high-contrast visual icon pairings.',
    motorSpeech: 'Reduces motor speech load for non-verbal children while maintaining semantic communication pathways.',
    language: 'Builds expressive syntax (Subject + Verb + Object) through progressive sentence-builder strip construction.',
    fluency: 'Eliminated speech performance anxiety by offering a stress-free alternative communication channel.',
    aac: 'Serves as a digital Picture Exchange Communication System (PECS) with text-to-speech output.',
    voice: 'Supplements verbal speech with high-quality synthesized voice models to serve as functional vocal output.',
    executiveFunction: 'Supports planning, categorization, and working memory as children search and organize semantic categories.',
    sensoryRegulation: 'Reduces frustration-induced dysregulation by giving the learner a reliable, structured voice.'
  },
  'autism-tools': {
    title: 'Sensory & Transition Support Tools',
    supports: ['Autism Spectrum Disorder (ASD)', 'ADHD', 'Sensory Processing Disorder (SPD)', 'Executive Dysfunction'],
    evidence: [
      'Visual schedules and first-then boards significantly decrease transition anxiety and off-task behaviors in classrooms (Hume et al., 2014).',
      'Predictable visual structures support independent task completion and cognitive security for neurodivergent learners (Ganz et al., 2012).'
    ],
    goals: 'Facilitate transitions, promote emotional self-awareness, and support self-regulation using visual timers and sensory boards.',
    motorSpeech: 'Calming oral-motor breathing helpers stabilize the respiratory support required for speech production.',
    language: 'Teaches emotional labeling and pragmatic language through interactive facial/mood selectors.',
    fluency: 'Reduces situational tension and stress, which are major triggers for speech disfluency.',
    aac: 'Bridges transitional communication via first-then structures and emotion boards.',
    voice: 'Calming breathing patterns promote a relaxed laryngeal state to alleviate voice tension or breathy speech.',
    executiveFunction: 'Boosts cognitive planning, temporal orientation (timers), and working memory during task transitions.',
    sensoryRegulation: 'Offers multi-sensory input (ambient sound generators, quiet drawing boards) to prevent cognitive overload.'
  },
  'matching-game': {
    title: 'Articulation Matching Game',
    supports: ['Phonological Disorders', 'Articulation Delays', 'Speech Sound Disorders (SSD)'],
    evidence: [
      'Gamified articulation drills increase trial repetitions and engagement, leading to faster speech sound generalization (Baker & McLeod, 2011).',
      'Visual pairing of phonemes with target images reinforces correct lexical representation of speech sounds.'
    ],
    goals: 'Generalize sound targets across word positions (initial, medial, final) through highly repetitive visual matching.',
    motorSpeech: 'Builds precise articulatory placement and phoneme-to-motor-execution matching.',
    language: 'Enhances receptive vocabulary and categorical association as words are paired and categorized.',
    fluency: 'Reduces tension during drill sessions, maintaining positive associations with speaking practice.',
    aac: 'Uses high-contrast visual cards to support image-to-word representation.',
    voice: 'Strengthens phonatory activation during speech target articulation.',
    executiveFunction: 'Enhances working memory, cognitive flexibility, and visual attention during card selection.',
    sensoryRegulation: 'Gamified visual confetti and pleasant audio triggers reinforce active learning without sensory distress.'
  },
  'bilingual-match': {
    title: 'Bilingual Matching Game',
    supports: ['Dual-Language Learners', 'Culturally Diverse Patients', 'Bilingual Aphasia'],
    evidence: [
      'Bilingual speech-language intervention enhances cross-linguistic transfer, strengthening language pathways in both native and secondary tongues (Kohnert, 2013).',
      'Dual-language exposure improves overall cognitive flexibility and metalinguistic awareness (Bedore et al., 2012).'
    ],
    goals: 'Strengthen lexical associations, build vocabulary across English and Spanish, and improve cognitive flexibility.',
    motorSpeech: 'Trains transitioning between different phonetic inventories and speech motor coordinates (e.g., flapped Spanish /r/ vs. American /r/).',
    language: 'Facilitates semantic map growth, lexical retrieval, and cross-linguistic vocabulary matching.',
    fluency: 'Builds linguistic confidence to minimize word-finding blocks and pauses common in bilingual learners.',
    aac: 'Promotes multilingual AAC awareness by connecting concepts visually across languages.',
    voice: 'Encourages varied intonation patterns typical of different cultural and linguistic settings.',
    executiveFunction: 'Exercises high-level executive control and inhibitory control during bilingual code-switching.',
    sensoryRegulation: 'Positive reinforcement design with balanced feedback prevents cognitive bilingual fatigue.'
  },
  'language-modules': {
    title: 'Language & Logic Modules',
    supports: ['Developmental Language Delay (DLD)', 'Expressive/Receptive Aphasia', 'Specific Language Impairment (SLI)'],
    evidence: [
      'Contextualized syntax and semantic intervention improves sentence complexity and narrative production in pediatric language disorders (Fey et al., 2011).',
      'Interactive syntax modeling supports grammatical morphology acquisition and logical thinking (Nippold, 2014).'
    ],
    goals: 'Reinforce syntactic, semantic, and narrative logical reasoning structures.',
    motorSpeech: 'Connects grammatical planning directly with motor speech execution.',
    language: 'Directly addresses sentence syntax, grammatical morphology, categorizations, and semantic relationships.',
    fluency: 'Organizes logical pre-planning of utterances, reducing word-finding struggles and secondary cluttering behaviors.',
    aac: 'Facilitates syntactic sequencing and word-combining structures.',
    voice: 'Exercises vocal inflection and logical pausing for comma/period boundaries.',
    executiveFunction: 'Exercises logic, structural organization, narrative sequencing, and cognitive sorting.',
    sensoryRegulation: 'Provides highly structured, clear rules and neat categorization tasks that reduce cognitive anxiety.'
  }
};

export const ClinicalEvidencePanel: React.FC<ClinicalEvidencePanelProps> = ({ moduleId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const data = CLINICAL_DATABASE[moduleId];

  if (!data) return null;

  return (
    <div id={`clinical_panel_${moduleId}`} className="bg-slate-50 border border-slate-200/60 rounded-[2rem] overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Clinician & Therapist Portal</h4>
            <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
              Clinical & Evidence-Based Framework <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            </h3>
          </div>
        </div>
        <div className="text-slate-400">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-slate-200/60"
          >
            <div className="p-6 space-y-6 text-xs text-slate-600 leading-relaxed bg-white">
              {/* Supports & Clinical Goal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h5 className="font-black text-slate-800 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Supports / Diagnoses
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {data.supports.map((sup, idx) => (
                      <span key={idx} className="bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-lg border border-indigo-100/40 text-[10px]">
                        {sup}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-black text-slate-800 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Clinical Goal
                  </h5>
                  <p className="font-semibold text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-3">
                    {data.goals}
                  </p>
                </div>
              </div>

              {/* Evidence Base */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <h5 className="font-black text-slate-800 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Evidence Base & Research Literature
                </h5>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 font-medium">
                  {data.evidence.map((ev, idx) => (
                    <li key={idx} className="marker:text-indigo-400 pl-1">{ev}</li>
                  ))}
                </ul>
              </div>

              {/* Clinical Domains */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h5 className="font-black text-slate-800 uppercase tracking-widest text-[10px] flex items-center gap-1.5 mb-3">
                  <Brain className="w-3.5 h-3.5 text-indigo-500" /> Impact Across Therapeutic Domains
                </h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Motor Speech */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <h6 className="font-black text-slate-800 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                      <Activity className="w-3.5 h-3.5 text-indigo-500" /> Motor Speech
                    </h6>
                    <p className="text-[11px] text-slate-500 font-medium leading-normal">{data.motorSpeech}</p>
                  </div>

                  {/* Language */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <h6 className="font-black text-slate-800 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                      <Brain className="w-3.5 h-3.5 text-indigo-500" /> Language
                    </h6>
                    <p className="text-[11px] text-slate-500 font-medium leading-normal">{data.language}</p>
                  </div>

                  {/* Fluency */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <h6 className="font-black text-slate-800 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                      <Wind className="w-3.5 h-3.5 text-indigo-500" /> Fluency
                    </h6>
                    <p className="text-[11px] text-slate-500 font-medium leading-normal">{data.fluency}</p>
                  </div>

                  {/* AAC */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <h6 className="font-black text-slate-800 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                      <Grid className="w-3.5 h-3.5 text-indigo-500" /> AAC Support
                    </h6>
                    <p className="text-[11px] text-slate-500 font-medium leading-normal">{data.aac}</p>
                  </div>

                  {/* Voice */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <h6 className="font-black text-slate-800 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                      <Volume2 className="w-3.5 h-3.5 text-indigo-500" /> Voice & Phonation
                    </h6>
                    <p className="text-[11px] text-slate-500 font-medium leading-normal">{data.voice}</p>
                  </div>

                  {/* Executive Function */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <h6 className="font-black text-slate-800 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-500" /> Executive Function
                    </h6>
                    <p className="text-[11px] text-slate-500 font-medium leading-normal">{data.executiveFunction}</p>
                  </div>
                </div>

                {/* Sensory Regulation */}
                <div className="p-3.5 bg-gradient-to-br from-indigo-50/40 to-slate-50/50 border border-indigo-100/40 rounded-2xl space-y-1.5">
                  <h6 className="font-black text-indigo-950 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                    <FlameKindling className="w-3.5 h-3.5 text-indigo-500" /> Sensory Regulation & Emotional Calming
                  </h6>
                  <p className="text-[11px] text-indigo-900/80 font-semibold leading-relaxed">{data.sensoryRegulation}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
