import { Language, Exercise } from '../../types';
import { SpeechProviderType } from '../sttService';

/**
 * Phoneme representation model
 */
export interface PhonemeUnit {
  symbol: string; // e.g. "R", "AE", "B", "IH", "T" or IPA "/ɹ/", "/æ/", "/b/", "/ɪ/", "/t/"
  ipa: string;
  type: 'vowel' | 'consonant' | 'diphthong' | 'liquid' | 'fricative' | 'stop' | 'nasal' | 'affricate' | 'glide';
  voiced: boolean;
  placeOfArticulation?: string;
  mannerOfArticulation?: string;
}

/**
 * Phoneme-level alignment and comparison item
 */
export interface PhonemeAlignmentItem {
  index: number;
  expectedPhoneme: string;
  expectedIpa: string;
  producedPhoneme?: string;
  producedIpa?: string;
  status: 'correct' | 'substitution' | 'omission' | 'addition' | 'distortion';
  acousticDistortionScore?: number; // 0 to 100% distortion severity if applicable
  notes?: string;
}

/**
 * Granular S.O.D.A. + Repetitions Error Breakdown
 */
export interface ClinicalErrorClassification {
  correctProductions: {
    unit: string;
    type: 'phoneme' | 'word' | 'syllable';
    position: number;
    ipa?: string;
  }[];
  substitutions: {
    target: string;
    recognized: string;
    position: number;
    context: 'initial' | 'medial' | 'final' | 'cluster';
    phonemeTarget?: string;
    phonemeRecognized?: string;
    phoneticProcess?: string; // e.g. "Fronting", "Stopping", "Gliding (/r/ -> /w/)", "De-voicing"
  }[];
  omissions: {
    target: string;
    position: number;
    context: 'initial' | 'medial' | 'final' | 'cluster_reduction';
    expectedPhoneme?: string;
    phoneticProcess?: string; // e.g. "Final Consonant Deletion", "Cluster Reduction", "Weak Syllable Deletion"
  }[];
  additions: {
    inserted: string;
    position: number;
    context: 'epenthesis' | 'initial_addition' | 'final_addition';
    addedPhoneme?: string;
    phoneticProcess?: string;
  }[];
  distortions: {
    target: string;
    type: 'lateralization' | 'nasal_emission' | 'derhotacization' | 'imprecise_formant' | 'pitch_break' | 'vowel_lengthening';
    acousticTrigger: string;
    severity: 'mild' | 'moderate' | 'severe';
    measuredDeviationPercent: number;
    acousticDelta?: {
      frequencyShiftHz?: number;
      energyRatioDelta?: number;
      durationMsDelta?: number;
    };
  }[];
  repetitions: {
    repeatedUnit: string;
    count: number;
    unitType: 'sound' | 'part_word' | 'whole_word' | 'phrase';
    isPerseveration: boolean;
    durationMs: number;
  }[];
}

/**
 * Normalized Acoustic Measurements from DSP Audio Processing
 */
export interface NormalizedAcousticMeasurements {
  avgDecibels: number; // dB SPL estimation
  peakDecibels: number;
  noiseFloorDb: number;
  snrDb: number; // Signal to Noise Ratio
  fundamentalFrequencyHz: number; // F0 Pitch in Hz
  pitchRangeHz: [number, number]; // [minPitch, maxPitch]
  pitchStability: number; // 0 to 100% (jitter / stability metric)
  spectralEnergyRatio: number; // High vs Low frequency ratio (formant balance)
  spectralCentroidHz: number; // Spectral brightness
  voiceOnsetLatencyMs: number; // VOT / Response Latency in milliseconds
  speechDurationMs: number; // Active phonation duration
  silenceDurationMs: number; // Total pause / hesitation time
  totalRecordingDurationMs: number;
  articulationRateSyllablesPerSec: number; // Syllable speech pacing
  formantsEstimate?: {
    f1Hz: number;
    f2Hz: number;
    f3Hz: number;
  };
}

/**
 * Normalized Single Attempt Scoring Result
 * Independently reproducible via deterministic clinical algorithms
 */
export interface DeterministicAttemptScore {
  attemptId: string;
  attemptNumber: number;
  timestamp: number;
  exerciseId: string;
  exerciseTitle: string;
  language: Language;
  provider: SpeechProviderType;

  // 1. Target and Expected Representations
  targetText: string;
  targetWords: string[];
  expectedPhonemes: string[]; // e.g. ["R", "AE", "B", "IH", "T"]
  expectedIpa: string; // e.g. "/ˈræbɪt/"
  targetSyllableCount: number;

  // 2. Recognized Speech and Transcript
  recognizedRawTranscript: string;
  recognizedNormalizedTranscript: string;
  recognizedWords: string[];
  recognizedPhonemes: string[];
  recognizedIpa: string;

  // 3. Clinical Error Classifications
  errors: ClinicalErrorClassification;
  phonemeAlignments: PhonemeAlignmentItem[];

  // 4. Clinical Quantitative Metrics
  accuracy: number; // 0 - 100%
  pronunciationScore: number; // 0 - 100%
  fluencyScore: number; // 0 - 100%
  intelligibilityScore: number; // 0 - 100%
  overallScore: number; // 0 - 100%
  
  // 5. Error Rates
  wordErrorRate: number; // WER (0.0 to 1.0)
  characterErrorRate: number; // CER (0.0 to 1.0)
  phonemeErrorRate: number; // PER (0.0 to 1.0)

  // 6. Timing & Latency
  latencyMs: number; // Voice Onset Latency in milliseconds
  durationMs: number;

  // 7. Acoustic Measurements
  acousticMeasurements: NormalizedAcousticMeasurements;

  // 8. Recognition Confidence
  confidence: number; // 0.0 to 1.0

  // 9. Deterministic Clinical Feedback
  deterministicSummary: string;
  deterministicClinicalNotes: string;
  reproducibleDigest: string; // Deterministic validation hash

  // 10. Optional Qualitative AI Interpretation (Never overrides deterministic scores)
  qualitativeAiAnalysis?: {
    clinicalTips: string[];
    encouragement: string;
    slpRationale?: string;
    parentHomeActivities?: string[];
    aiModelUsed?: string;
    generatedAt?: number;
  };
}

/**
 * Normalized Clinical Session Result Model
 * Aggregates multiple attempts into a standardized clinical session
 */
export interface NormalizedSessionResult {
  sessionId: string;
  profileId: string;
  exerciseId: string;
  exerciseTitle: string;
  language: Language;
  startedAt: number;
  completedAt: number;
  totalDurationMs: number;

  // Attempts
  attempts: DeterministicAttemptScore[];
  totalAttempts: number;
  correctAttempts: number; // Attempts with accuracy >= 85%

  // Aggregated Scores
  meanAccuracy: number;
  meanFluency: number;
  meanPronunciation: number;
  meanOverallScore: number;
  bestAttemptScore: number;
  
  // Aggregate Error Rates & Latency
  meanWordErrorRate: number;
  meanPhonemeErrorRate: number;
  meanLatencyMs: number;

  // SODA Aggregate Counts
  sodaSummary: {
    totalCorrect: number;
    totalSubstitutions: number;
    totalOmissions: number;
    totalDistortions: number;
    totalAdditions: number;
    totalRepetitions: number;
    primaryErrorType: 'None' | 'Substitution' | 'Omission' | 'Distortion' | 'Addition' | 'Repetition' | 'Mixed';
  };

  // Phoneme Mastery Map (e.g. { "R": { attempts: 5, correct: 4, accuracy: 80 } })
  phonemeMastery: Record<string, {
    phoneme: string;
    ipa: string;
    attempts: number;
    correct: number;
    accuracyPercent: number;
  }>;

  // Overall Acoustic Profile
  meanAcousticProfile: {
    avgDecibels: number;
    avgFundamentalFrequencyHz: number;
    avgSpectralRatio: number;
    avgSnrDb: number;
  };

  // Session Progression Trend
  progressionTrend: 'improving' | 'steady' | 'declining';
  
  // Deterministic Reproducibility
  deterministicSessionReport: string;
  sessionHash: string;

  // Optional AI Session Synthesis
  optionalAiSessionSynthesis?: {
    therapeuticProgressSummary: string;
    recommendedTargetSounds: string[];
    nextDifficultyLevel: string;
  };
}

/**
 * Pipeline State Enum
 */
export enum AudioPipelineStage {
  IDLE = 'IDLE',
  AUDIO_CAPTURE = 'AUDIO_CAPTURE',
  AUDIO_PROCESSING = 'AUDIO_PROCESSING',
  SPEECH_RECOGNITION = 'SPEECH_RECOGNITION',
  TRANSCRIPT_NORMALIZATION = 'TRANSCRIPT_NORMALIZATION',
  CLINICAL_SCORING = 'CLINICAL_SCORING',
  OPTIONAL_AI_ANALYSIS = 'OPTIONAL_AI_ANALYSIS',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}
