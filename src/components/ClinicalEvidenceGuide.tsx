import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Target, 
  Flame, 
  Volume2, 
  Cpu, 
  Smile, 
  HelpCircle, 
  ChevronDown, 
  GraduationCap, 
  CheckCircle2, 
  Settings, 
  Award,
  Zap,
  Activity,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

export interface GuideContent {
  title: string;
  supports: string[];
  clinicalGoal: string;
  evidenceBase: string;
  motorSpeech: string;
  language: string;
  fluency: string;
  aac: string;
  voice: string;
  executiveFunction: string;
  sensoryRegulation: string;
}

const CLINICAL_DATA: Record<string, GuideContent> = {
  'pacing-board': {
    title: "Interactive Pacing Board",
    supports: ["Childhood Apraxia of Speech", "Dysarthria", "Fluency Disorders", "Speech Rate Control"],
    clinicalGoal: "Establish syllable-by-syllable speech rate control, improve speech motor planning, and systematically reduce speech intelligibility breakdowns.",
    evidenceBase: "Pacing boards provide a tactical-visual external timing cue that assists in sequencing speech movements. Research demonstrates that slow, paced speech improves the temporal planning of articulatory gestures, reducing errors in individuals with apraxia, dysarthria, or fluency disorders (Yorkston et al., 2012).",
    motorSpeech: "Slows speaking rate to allow adequate time for complex articulatory transitions and accurate speech motor execution in Childhood Apraxia of Speech (CAS) and Dysarthria.",
    language: "Facilitates morphological awareness, syllable division, and syntactic segmentation by dividing phrase units into distinct steps.",
    fluency: "Directly decreases stuttering frequency by fostering a regular, rhythmic speaking rate and promoting easy vocal onset.",
    aac: "Serves as a reliable low-to-mid-tech multimodal alternative communication strategy bridging the gap between vocalizing and manual gesturing.",
    voice: "Fosters steady subglottal pressure, vocal tract relaxation, and breath-holding coordination by preventing fast speech depletion of lung volume.",
    executiveFunction: "Promotes proactive self-monitoring, impulse inhibition of fast speech rushes, and metacognitive awareness of speech clarity.",
    sensoryRegulation: "Provides tactile-proprioceptive feedback (via manual node tapping) and soothing visual cues that stabilize the child's arousal levels."
  },
  'practice': {
    title: "Phonemic Drill & Articulation",
    supports: ["Speech Sound Disorders", "Phonological Processing", "Articulation Masteries"],
    clinicalGoal: "Systematically drill target phonemes in isolation, syllables, words, and sentences to achieve articulation mastery and phonemic awareness.",
    evidenceBase: "High-frequency, repetitive phoneme drilling paired with immediate, explicit feedback is the cornerstone of traditional articulation therapy (Van Riper approach) and motor learning theories, emphasizing neural plasticity through active, repeated practice (Maas et al., 2008).",
    motorSpeech: "Establishes correct feedforward motor commands, tongue-jaw dissociation, and accurate phonetic placement for target consonants and vowels.",
    language: "Reinforces phonological representations of phonemes, contrasting target speech sounds with error patterns (minimal pairs framework).",
    fluency: "Reduces struggle behaviors and secondary tension by automating speech sound motor pathways, preventing dysfluency triggered by phonetic complexity.",
    aac: "Complements expressive alternative communication by expanding natural speech approximations and strengthening vocal intelligibility.",
    voice: "Promotes correct velopharyngeal closure, balanced respiratory support, and clean resonance during targeted phonation.",
    executiveFunction: "Boosts auditory working memory (holding target sounds in mind), sustained attention, and selective focus during intensive drills.",
    sensoryRegulation: "Provides auditory self-discrimination training (looping audio playback) and visual motor modeling through real-time lip/tongue animation guides."
  },
  'stories': {
    title: "Stories & Bilingual Literacy",
    supports: ["Bilingual Language Therapy", "Narrative Comprehension", "Reading Phrasing & Prosody"],
    clinicalGoal: "Enhance dual-language reading comprehension, narrative formulation, vocabulary acquisition, and lexical-semantic translation pathways.",
    evidenceBase: "Bilingual narrative intervention activates shared conceptual representations across both languages. Dual-language exposure and interactive reading strategies enhance meta-linguistic awareness, syntax comprehension, and overall literacy in bilingual children (Peña et al., 2014).",
    motorSpeech: "Exercises complex coarticulation and prosodic phrasing across diverse phonetic systems (English vs. Spanish).",
    language: "Directly expands semantic networks, syntactic structures, storytelling cohesion, vocabulary retrieval, and bilingual translation equivalence.",
    fluency: "Promotes smooth phrasing, dynamic intonation, and linguistic confidence, reducing word-finding hesitations.",
    aac: "Integrates text-to-speech literacy, vocabulary scanning, and multi-modal reading guides.",
    voice: "Exercises dynamic vocal pitch variation, vocal hygiene, and respiratory coordination across long read-aloud sentences.",
    executiveFunction: "Enhances auditory working memory, sequence tracking (beginning, middle, end), story comprehension, and logical reasoning.",
    sensoryRegulation: "Employs calming, steady narration pacing and customizable visual font sizing to alleviate sensory cognitive fatigue."
  },
  'language-modules': {
    title: "Language & Logic Exercises",
    supports: ["Expressive & Receptive Language Delay", "Semantic Categorization", "Structural Syntax"],
    clinicalGoal: "Develop critical expressive and receptive language constructs, including categories, spatial relations, logic reasoning, and grammatical syntax.",
    evidenceBase: "Structured semantic-syntactic mapping interventions stimulate neural connectivity within the temporal-frontal language networks. Categorization and structural reasoning practices strengthen lexical retrieval and functional logical reasoning (Lahey, 1988).",
    motorSpeech: "Assists in planning verbal speech responses based on logical reasoning and cognitive category prompts.",
    language: "Strengthens semantic relations, spatial concepts (prepositions), morphological inflections, and verbal logic.",
    fluency: "Minimizes word-retrieval blocks and linguistic dysfluency by building highly organized mental taxonomies and semantic pathways.",
    aac: "Directly maps logical concepts to PECS/AAC boards, establishing a foundation for structured, syntactically correct communication.",
    voice: "Encourages precise vocal volume and clarity when responding to expressive language prompts.",
    executiveFunction: "Exercises cognitive flexibility, planning, working memory, categorization logic, and problem-solving.",
    sensoryRegulation: "Utilizes low-stimulus visual layouts and logical predictability to prevent cognitive overstimulation and sensory frustration."
  },
  'voice-meters': {
    title: "Voice Onset & Sound Decibel Meters",
    supports: ["Vocal Hypophonia (Parkinsonian/Paresis)", "Resonance Disorders", "Vocal Loudness Self-Control"],
    clinicalGoal: "Provide real-time biofeedback of vocal volume (dB) and vocal cord vibration onset to treat vocal hypophonia and voice onset timing disorders.",
    evidenceBase: "Real-time visual biofeedback is highly effective in treating pediatric voice disorders and hyper/hypo-nasality. Visual decibel targets and sound-wave analysis allow clients to self-correct vocal intensity and voice-onset behaviors (Ramig et al., 2018).",
    motorSpeech: "Stimulates respiratory-laryngeal coordination and precision of vocal fold adduction during initial phonation.",
    language: "Facilitates verbal turn-taking awareness, pragmatic communication volume regulation, and vocal emotional prosody.",
    fluency: "Facilitates easy vocal onset techniques (gradual adduction of vocal folds), which prevents hard glottal attacks and reduces fluency blocks.",
    aac: "Bridges non-verbal vocalization attempts to communicative intents using visual amplitude indicators.",
    voice: "Directly treats vocal fatigue, breathy/hoarse voicing, vocal hyperfunction, and soft/monotone volume through explicit decibel targets.",
    executiveFunction: "Promotes self-monitoring, cognitive inhibitory control over vocal bursts, and active volume self-regulation.",
    sensoryRegulation: "Translates invisible auditory and laryngeal tactile sensations into intuitive visual waveforms, easing proprioceptive and sensory processing loads."
  },
  'aac-playground': {
    title: "AAC Expressive Grid Boards (PECS)",
    supports: ["Non-Verbal / Minimally Verbal Autism", "Severe Apraxia", "Functional Expressive Communication"],
    clinicalGoal: "Empower non-verbal and minimally-verbal individuals to express functional communicative intents, construct sentences, and build pragmatic social skills.",
    evidenceBase: "Augmentative and Alternative Communication (AAC) and Picture Exchange Communication Systems (PECS) have been proven to increase functional communication, speech onset rates, and social engagement in autistic and minimally verbal learners (Light & McNaughton, 2014).",
    motorSpeech: "Reduces immediate speech motor load while practicing verbal syntax, giving the vocal tract rest while continuing linguistic training.",
    language: "Strengthens syntactic ordering, semantic categorization, vocabulary retrieval, and sentence building through visual representations.",
    fluency: "Minimizes the intense communicative anxiety and motor speech blocks associated with verbal formulation by utilizing an alternative expressive modality.",
    aac: "Direct, high-contrast, comprehensive augmentative communication board with synthesized TTS voice outputs.",
    voice: "Reinforces functional communicative voice via high-quality digital voice generation, modeling natural speech prosody.",
    executiveFunction: "Exercises cognitive organization, working memory, categorization, and logical step-by-step sentence construction.",
    sensoryRegulation: "Offers highly predictable, structured, non-flickering high-contrast visual grids that prevent cognitive sensory overstimulation."
  },
  'autism-tools': {
    title: "Autism Support & Sensory Tools",
    supports: ["Sensory Processing Sensitivity", "Transitions & Schedule Anxiety", "Executive Planning Support"],
    clinicalGoal: "Provide structural visual supports (First/Then boards) and sensory profile customization to alleviate sensory overload and enhance task transition predictability.",
    evidenceBase: "Structured teaching and visual schedules (like TEACCH) decrease task transition anxiety and behavioral challenges in neurodivergent and autistic children. Accommodating sensory profiles improves attention, task performance, and emotional regulation (Mesibov et al., 2005).",
    motorSpeech: "Stabilizes emotional and sensory states, which reduces stress-induced motor speech breakdowns and apraxic hesitation.",
    language: "Enhances receptive comprehension of task sequencing and temporal-relational concepts (first this, then that).",
    fluency: "Reduces tension-related dysfluencies by establishing a predictable schedule and calming routine environment.",
    aac: "Utilizes visual icons and timetables to support functional receptive and expressive routines.",
    voice: "Alleviates emotional vocal tension, high-pitched shrieks, or mutism caused by transition-induced sensory overload.",
    executiveFunction: "Fosters task planning, transition management, cognitive set-shifting, time awareness, and goal completion.",
    sensoryRegulation: "Directly optimizes the sensory environment with calming color palettes, reduced motion, high contrast, and visual timers."
  },
  'matching-game': {
    title: "Articulation Matching Game",
    supports: ["Speech Sound Discrimination", "Phonetic Recall", "Interactive Play Therapy"],
    clinicalGoal: "Reinforce target speech sound discrimination and phoneme production in a highly motivating gamified recall setting.",
    evidenceBase: "Gamification of speech drills enhances child engagement, increases therapeutic compliance, and fosters implicit, fun motor learning by shifting focus to the game objective rather than mechanical drills (Shapi'i et al., 2013).",
    motorSpeech: "Strengthens rapid phonological and articulatory retrieval of target speech sounds in single words under game conditions.",
    language: "Boosts lexical retrieval, semantic pairing, phonological awareness, and working memory.",
    fluency: "Helps maintain natural speech pacing and easy word-retrieval in a low-stakes, joyful interactive game.",
    aac: "Provides clear visual cards that can be paired with gesturing, pointing, or vocalizations.",
    voice: "Fosters relaxed laryngeal posture and positive emotional vocal inflections during game wins.",
    executiveFunction: "Trains visual working memory (remembering card coordinates), selective attention, and rule-based play.",
    sensoryRegulation: "Calming game graphics and pleasant auditory feedback reward success while minimizing sensory cognitive load."
  },
  'bilingual-match': {
    title: "Bilingual Card Matching",
    supports: ["Bilingual Vocabulary Development", "Code-Switching", "Cross-Linguistic Transference"],
    clinicalGoal: "Cultivate English-Spanish translational equivalencies, semantic association, and code-switching flexibility in a gamified context.",
    evidenceBase: "Gamified bilingual intervention bridges vocabulary systems across languages, reinforcing meta-linguistic cognitive flexibility and strengthening vocabulary in both native and secondary tongues (Kohnert, 2013).",
    motorSpeech: "Challenges speech motor planning to flexibly alternate between distinct English and Spanish phonetic patterns (code-switching).",
    language: "Promotes cross-linguistic vocabulary transfer, semantic pairing, translation equivalent structures, and bilingual lexical depth.",
    fluency: "Cultivates cognitive confidence across both languages, lowering the linguistic anxiety that often triggers speech dysfluency.",
    aac: "Uses paired dual-language visual cards to facilitate multi-lingual expressive AAC.",
    voice: "Encourages vocal flexibility and pitch range when speaking across Spanish and English phonetic styles.",
    executiveFunction: "High-level training of cognitive switching, working memory, attention shifting, and mental flexibility.",
    sensoryRegulation: "Structured, calming card layout and clear pronunciation audio assist children in maintaining focus."
  },
  'focus-social': {
    title: "Focus, Directions & Social Skills",
    supports: ["Impulsivity / ADHD", "Receptive Directions Delay", "Pragmatic Social Communication"],
    clinicalGoal: "Develop following-directions logic, social-emotional narrative comprehension, visual attention focus, and impulsivity control.",
    evidenceBase: "Structured social-emotional learning interventions and following-directions practice enhance pragmatic conversation skills, peer engagement, visual tracking, and cognitive self-regulation (Gresham et al., 2001).",
    motorSpeech: "Coordinates physical motor responses and speech planning with explicit verbal instructions.",
    language: "Strengthens receptive syntax (complex multi-step commands) and pragmatic/social communication conventions.",
    fluency: "Helps reduce speech cluttering and impulsive verbal interruptions by training slow listening and verbal inhibition.",
    aac: "Integrates following visual instructions and pragmatics with alternative communication pathways.",
    voice: "Cultivates appropriate vocal emotional expression, loudness regulation, and voice control during social interaction scenarios.",
    executiveFunction: "Direct training of working memory (retaining multi-step directions), visual attention, self-regulation, and impulse inhibition.",
    sensoryRegulation: "Slows down child cognitive-motor processing speed, stabilizing arousal levels through highly structured tasks."
  },
  'lessons': {
    title: "Clinician Custom Lessons & Plans",
    supports: ["Individualized Education Plans (IEP)", "Curriculum Sequencing", "Target Generalization"],
    clinicalGoal: "Provide clinicians and parents with a highly structured, customizable sequence of speech targets tailored specifically to the child's developmental profile.",
    evidenceBase: "Structured, individualized curriculum planning (IEP) combined with incremental task progression maximizes therapeutic outcomes, encouraging generalization of speech targets from clinic to home (ASHA, 2016).",
    motorSpeech: "Allows precise sequencing of phonetic complexity (isolation -> syllables -> words -> phrases) to systematically build speech motor mastery.",
    language: "Supports custom vocabulary, grammatical structures, and semantic themes aligned with the child's linguistic needs.",
    fluency: "Builds structured, progressive easy-onset target lists to gradually build speaking confidence.",
    aac: "Customizable targets can include visual PECS references, helping users integrate AAC targets with vocalized practice.",
    voice: "Custom targets can focus on specific laryngeal exercises, pitch ranges, or volume thresholds.",
    executiveFunction: "Empowers the child with a clear visual sequence of goals, task progress tracking, and scheduled rewards.",
    sensoryRegulation: "Allows the clinician to custom-pace each lesson, adjusting visual elements and pause times to suit the child's sensory profile."
  }
};

interface Props {
  activeView: string;
}

export const ClinicalEvidenceGuide: React.FC<Props> = ({ activeView }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const content = CLINICAL_DATA[activeView] || CLINICAL_DATA['practice'];

  return (
    <div className="w-full mt-4">
      <div className="bg-slate-50 border border-slate-200/80 rounded-[2rem] overflow-hidden shadow-sm transition-all">
        {/* Header Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-100/50 transition-colors focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-slate-800 text-xs sm:text-sm uppercase tracking-wide">
                Clinical Goal & Evidence Base
              </h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                Why this matters for {content.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-[9px] font-black uppercase text-slate-400 bg-white border border-slate-200/60 px-2.5 py-1 rounded-md">
              {isOpen ? 'COLLAPSE INTERVENTION FRAMEWORK' : 'VIEW SLP FRAMEWORK'}
            </span>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </motion.div>
          </div>
        </button>

        {/* Content Panel */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden border-t border-slate-200/60 bg-white"
            >
              <div className="p-6 sm:p-8 space-y-6">
                
                {/* Supports badging */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    SUPPORTS:
                  </span>
                  {content.supports.map((s, idx) => (
                    <span 
                      key={idx} 
                      className="text-[9px] font-bold uppercase tracking-wider bg-indigo-50/60 text-indigo-700 border border-indigo-100/40 px-2.5 py-1 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Primary Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Goal and Evidence */}
                  <div className="space-y-4">
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 sm:p-5 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <Target className="w-4 h-4" />
                        <h5 className="text-[10px] font-black uppercase tracking-widest">Clinical Goal</h5>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        {content.clinicalGoal}
                      </p>
                    </div>

                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 sm:p-5 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <BookOpen className="w-4 h-4" />
                        <h5 className="text-[10px] font-black uppercase tracking-widest">Evidence Base</h5>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed italic font-medium">
                        {content.evidenceBase}
                      </p>
                    </div>
                  </div>

                  {/* Multi-Domain Support Grid */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Speech & Cognitive Domains</h5>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Motor Speech */}
                      <div className="border border-slate-100 rounded-xl p-3 bg-white hover:border-indigo-100 transition-colors space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                          <Activity className="w-3 h-3" />
                          Motor Speech
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium leading-normal">{content.motorSpeech}</p>
                      </div>

                      {/* Language */}
                      <div className="border border-slate-100 rounded-xl p-3 bg-white hover:border-indigo-100 transition-colors space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                          <UserCheck className="w-3 h-3" />
                          Language
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium leading-normal">{content.language}</p>
                      </div>

                      {/* Fluency */}
                      <div className="border border-slate-100 rounded-xl p-3 bg-white hover:border-indigo-100 transition-colors space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                          <Zap className="w-3 h-3" />
                          Fluency
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium leading-normal">{content.fluency}</p>
                      </div>

                      {/* AAC */}
                      <div className="border border-slate-100 rounded-xl p-3 bg-white hover:border-indigo-100 transition-colors space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                          <Award className="w-3 h-3" />
                          AAC
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium leading-normal">{content.aac}</p>
                      </div>

                      {/* Voice */}
                      <div className="border border-slate-100 rounded-xl p-3 bg-white hover:border-indigo-100 transition-colors space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-wider text-pink-600 flex items-center gap-1.5">
                          <Volume2 className="w-3 h-3" />
                          Voice
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium leading-normal">{content.voice}</p>
                      </div>

                      {/* Executive Function */}
                      <div className="border border-slate-100 rounded-xl p-3 bg-white hover:border-indigo-100 transition-colors space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                          <Cpu className="w-3 h-3" />
                          Executive Function
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium leading-normal">{content.executiveFunction}</p>
                      </div>
                    </div>

                    {/* Sensory Regulation Footer Row */}
                    <div className="border border-slate-100 rounded-xl p-3.5 bg-indigo-50/20 border-dashed hover:border-indigo-150 transition-colors space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                        <Smile className="w-3.5 h-3.5" />
                        Sensory Regulation
                      </p>
                      <p className="text-[11px] text-slate-600 font-medium leading-normal">{content.sensoryRegulation}</p>
                    </div>

                  </div>
                </div>

                {/* Professional SLP Assurance */}
                <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Standardized Clinician Framework</span>
                  <span>Bilingual & Brilliant Speech Therapy</span>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
