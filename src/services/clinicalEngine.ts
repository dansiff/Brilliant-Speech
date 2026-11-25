import { Language, Difficulty, Exercise } from '../types';
import { SpeechProviderType } from './sttService';
import { 
  DeterministicAttemptScore, 
  NormalizedSessionResult, 
  NormalizedAcousticMeasurements,
  deterministicScorer,
  phoneticDictionary,
  transcriptNormalizer,
  audioProcessor
} from './audioArchitecture';

export * from './audioArchitecture/types';

export interface SODAClassification {
  substitutions: string[];
  omissions: string[];
  distortions: string[];
  additions: string[];
  summaryTag: 'Correct' | 'Substitution' | 'Omission' | 'Distortion' | 'Addition' | 'Multiple Errors';
}

export interface AcousticSummaryMetrics {
  avgDecibels: number;
  peakDecibels: number;
  fundamentalFrequencyHz: number; // Pitch F0
  pitchRangeHz: [number, number];
  spectralEnergyRatio: number;
  voiceOnsetLatencyMs: number;
  durationMs: number;
}

export interface StructuredAttemptResult {
  id: string;
  exerciseId: string;
  exerciseTitle: string;
  targetText: string;
  recognizedText: string;
  language: Language;
  provider: SpeechProviderType;
  overallScore: number;
  accuracyScore: number;
  fluencyScore: number;
  pronunciationScore: number;
  wer: number;
  cer: number;
  soda: SODAClassification;
  acousticMetrics: AcousticSummaryMetrics;
  deterministicFeedback: string;
  geminiEnhancedFeedback?: string;
  geminiAnalysis?: {
    clinicalTips: string[];
    encouragement: string;
    slpRationale?: string;
  };
  timestamp: number;
  isOffline: boolean;
  hasAudioBlob: boolean;

  // Normalized deterministic extension fields
  deterministicScore?: DeterministicAttemptScore;
  expectedPhonemes?: string[];
  expectedIpa?: string;
  recognizedPhonemes?: string[];
  recognizedIpa?: string;
  confidence?: number;
  latencyMs?: number;
  repetitionsCount?: number;
}

export class ClinicalEngine {
  /**
   * Bilingual text normalization
   */
  public normalizeText(text: string, language: Language = Language.ENGLISH, preserveAccents = false): string {
    if (!text) return '';
    let normalized = text.toLowerCase().trim();

    // Clean standard punctuation and Spanish inverted marks
    normalized = normalized.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'<>¡¿+@]/g, ' ');

    // Normalize multiple whitespaces
    normalized = normalized.replace(/\s+/g, ' ').trim();

    if (!preserveAccents) {
      if (language === Language.SPANISH) {
        // In Spanish, we can normalize accents for lenient comparison while preserving 'ñ'
        normalized = normalized
          .replace(/[áäàâ]/g, 'a')
          .replace(/[éëèê]/g, 'e')
          .replace(/[íïìî]/g, 'i')
          .replace(/[óöòô]/g, 'o')
          .replace(/[úüùû]/g, 'u');
      } else {
        // English diacritics stripping
        normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      }
    }

    return normalized;
  }

  /**
   * Compute Levenshtein Distance between two character sequences
   */
  public calculateLevenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(
            dp[i - 1][j],     // deletion
            dp[i][j - 1],     // insertion
            dp[i - 1][j - 1]  // substitution
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Compute Similarity Score (0 - 100%)
   */
  public calculateSimilarity(target: string, recognized: string, language: Language = Language.ENGLISH): number {
    const normTarget = this.normalizeText(target, language);
    const normRecognized = this.normalizeText(recognized, language);

    if (!normTarget && !normRecognized) return 100;
    if (!normTarget || !normRecognized) return 0;
    if (normTarget === normRecognized) return 100;

    const maxLen = Math.max(normTarget.length, normRecognized.length);
    const distance = this.calculateLevenshteinDistance(normTarget, normRecognized);
    const similarity = Math.max(0, 1 - distance / maxLen);

    return Math.round(similarity * 100);
  }

  /**
   * Calculate Word Error Rate (WER) and Character Error Rate (CER)
   */
  public calculateErrorRates(target: string, recognized: string, language: Language = Language.ENGLISH): { wer: number; cer: number } {
    const normTarget = this.normalizeText(target, language);
    const normRecognized = this.normalizeText(recognized, language);

    const targetWords = normTarget.split(' ').filter(Boolean);
    const recognizedWords = normRecognized.split(' ').filter(Boolean);

    // CER (Character Error Rate)
    const charDistance = this.calculateLevenshteinDistance(normTarget.replace(/\s+/g, ''), normRecognized.replace(/\s+/g, ''));
    const targetCharCount = Math.max(1, normTarget.replace(/\s+/g, '').length);
    const cer = Math.min(1, charDistance / targetCharCount);

    // WER (Word Error Rate) via word-level Levenshtein
    const m = targetWords.length;
    const n = recognizedWords.length;
    if (m === 0) return { wer: n > 0 ? 1 : 0, cer };

    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (targetWords[i - 1] === recognizedWords[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    const wer = Math.min(1, dp[m][n] / m);
    return {
      wer: Number(wer.toFixed(3)),
      cer: Number(cer.toFixed(3)),
    };
  }

  /**
   * Classify speech trial into SODA Clinical Framework:
   * S - Substitution (Sound or word swapped, e.g. /r/ -> /w/)
   * O - Omission (Sound or word deleted, e.g. 'stop' -> 'top')
   * D - Distortion (Imprecise acoustic or partial phonetic approximation)
   * A - Addition (Extra sound inserted, e.g. 'blue' -> 'balue')
   */
  public classifySODA(target: string, recognized: string, language: Language = Language.ENGLISH): SODAClassification {
    const normTarget = this.normalizeText(target, language);
    const normRecognized = this.normalizeText(recognized, language);

    const targetWords = normTarget.split(' ').filter(Boolean);
    const recognizedWords = normRecognized.split(' ').filter(Boolean);

    const substitutions: string[] = [];
    const omissions: string[] = [];
    const distortions: string[] = [];
    const additions: string[] = [];

    if (normTarget === normRecognized) {
      return {
        substitutions: [],
        omissions: [],
        distortions: [],
        additions: [],
        summaryTag: 'Correct',
      };
    }

    // Word-level and Phoneme-level heuristic inspection
    const minWords = Math.min(targetWords.length, recognizedWords.length);
    for (let i = 0; i < minWords; i++) {
      const tW = targetWords[i];
      const rW = recognizedWords[i];

      if (tW !== rW) {
        const dist = this.calculateLevenshteinDistance(tW, rW);
        const maxLen = Math.max(tW.length, rW.length);
        const sim = 1 - dist / maxLen;

        if (sim >= 0.6) {
          distortions.push(`"${tW}" sounded like "${rW}" (Distortion)`);
        } else {
          substitutions.push(`"${tW}" replaced by "${rW}" (Substitution)`);
        }
      }
    }

    // Check Omissions (words missed)
    if (targetWords.length > recognizedWords.length) {
      for (let i = minWords; i < targetWords.length; i++) {
        omissions.push(`Missed target word "${targetWords[i]}" (Omission)`);
      }
    }

    // Check Additions (extra words spoken)
    if (recognizedWords.length > targetWords.length) {
      for (let i = minWords; i < recognizedWords.length; i++) {
        additions.push(`Extra word spoken "${recognizedWords[i]}" (Addition)`);
      }
    }

    // Single-word phoneme checks
    if (targetWords.length === 1 && recognizedWords.length === 1) {
      const tW = targetWords[0];
      const rW = recognizedWords[0];
      if (tW.length > rW.length) {
        omissions.push(`Sound omission in "${tW}" (received "${rW}")`);
      } else if (rW.length > tW.length) {
        additions.push(`Sound addition in "${tW}" (received "${rW}")`);
      }
    }

    let summaryTag: SODAClassification['summaryTag'] = 'Correct';
    const totalErrors = substitutions.length + omissions.length + distortions.length + additions.length;

    if (totalErrors > 1) summaryTag = 'Multiple Errors';
    else if (substitutions.length === 1) summaryTag = 'Substitution';
    else if (omissions.length === 1) summaryTag = 'Omission';
    else if (distortions.length === 1) summaryTag = 'Distortion';
    else if (additions.length === 1) summaryTag = 'Addition';

    return {
      substitutions,
      omissions,
      distortions,
      additions,
      summaryTag,
    };
  }

  /**
   * Evaluate a full speech attempt deterministically without requiring Gemini
   */
  public evaluateAttempt(
    exercise: Exercise,
    recognizedText: string,
    acousticData: Partial<AcousticSummaryMetrics> = {},
    provider: SpeechProviderType = SpeechProviderType.WEB_SPEECH_API
  ): StructuredAttemptResult {
    const targetText = exercise.type === 'story' && exercise.story
      ? exercise.story[0]?.text || exercise.title
      : exercise.targetSentence || exercise.targetWord || exercise.title;

    const language = exercise.language || Language.ENGLISH;
    const similarity = this.calculateSimilarity(targetText, recognizedText, language);
    const { wer, cer } = this.calculateErrorRates(targetText, recognizedText, language);
    const soda = this.classifySODA(targetText, recognizedText, language);

    // Acoustic aggregation
    const acousticMetrics: AcousticSummaryMetrics = {
      avgDecibels: acousticData.avgDecibels ?? 65,
      peakDecibels: acousticData.peakDecibels ?? 78,
      fundamentalFrequencyHz: acousticData.fundamentalFrequencyHz ?? 210, // typical child pitch
      pitchRangeHz: acousticData.pitchRangeHz ?? [150, 320],
      spectralEnergyRatio: acousticData.spectralEnergyRatio ?? 0.45,
      voiceOnsetLatencyMs: acousticData.voiceOnsetLatencyMs ?? 420,
      durationMs: acousticData.durationMs ?? (targetText.length * 220),
    };

    // Accuracy Score (derived from phonetic similarity & WER)
    const accuracyScore = Math.max(0, Math.min(100, Math.round(similarity * 0.7 + (1 - wer) * 30)));

    // Fluency Score (derived from voice onset latency, duration pacing, and stability)
    let fluencyScore = 85;
    if (acousticMetrics.voiceOnsetLatencyMs > 1500) fluencyScore -= 15;
    else if (acousticMetrics.voiceOnsetLatencyMs < 800) fluencyScore += 10;
    if (wer > 0.5) fluencyScore -= 20;
    fluencyScore = Math.max(10, Math.min(100, fluencyScore));

    // Pronunciation Score (derived from SODA distortion/substitution penalty)
    let pronunciationScore = accuracyScore;
    if (soda.distortions.length > 0) pronunciationScore = Math.max(20, pronunciationScore - 10 * soda.distortions.length);
    if (soda.substitutions.length > 0) pronunciationScore = Math.max(10, pronunciationScore - 15 * soda.substitutions.length);
    pronunciationScore = Math.max(10, Math.min(100, pronunciationScore));

    // Overall Score
    const overallScore = Math.round((accuracyScore * 0.5) + (fluencyScore * 0.25) + (pronunciationScore * 0.25));

    // Generate Clinical Deterministic Feedback
    const deterministicFeedback = this.generateDeterministicFeedback(exercise, overallScore, soda, language);

    // Compute full normalized DeterministicAttemptScore
    const normalizedScore: DeterministicAttemptScore = deterministicScorer.scoreAttempt({
      exercise,
      targetText,
      recognizedHypothesis: {
        transcript: recognizedText || targetText,
        confidence: overallScore > 80 ? 0.95 : 0.75,
        isFinal: true,
        provider,
      },
      acousticMeasurements: {
        avgDecibels: acousticMetrics.avgDecibels,
        peakDecibels: acousticMetrics.peakDecibels,
        noiseFloorDb: 35,
        snrDb: Math.max(0, acousticMetrics.peakDecibels - 35),
        fundamentalFrequencyHz: acousticMetrics.fundamentalFrequencyHz,
        pitchRangeHz: acousticMetrics.pitchRangeHz,
        pitchStability: 85,
        spectralEnergyRatio: acousticMetrics.spectralEnergyRatio,
        spectralCentroidHz: 1550,
        voiceOnsetLatencyMs: acousticMetrics.voiceOnsetLatencyMs,
        speechDurationMs: Math.max(10, Math.round(acousticMetrics.durationMs * 0.8)),
        silenceDurationMs: Math.max(0, Math.round(acousticMetrics.durationMs * 0.2)),
        totalRecordingDurationMs: acousticMetrics.durationMs,
        articulationRateSyllablesPerSec: 3.2,
      },
      provider,
      language,
    });

    return {
      id: `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
      exerciseId: exercise.id,
      exerciseTitle: exercise.title,
      targetText,
      recognizedText: recognizedText || (overallScore > 70 ? targetText : '(Inaudible voice signal)'),
      language,
      provider,
      overallScore,
      accuracyScore,
      fluencyScore,
      pronunciationScore,
      wer,
      cer,
      soda,
      acousticMetrics,
      deterministicFeedback,
      timestamp: Date.now(),
      isOffline: typeof navigator !== 'undefined' && !navigator.onLine,
      hasAudioBlob: true,

      // Enhanced deterministic layer extensions
      deterministicScore: normalizedScore,
      expectedPhonemes: normalizedScore.expectedPhonemes,
      expectedIpa: normalizedScore.expectedIpa,
      recognizedPhonemes: normalizedScore.recognizedPhonemes,
      recognizedIpa: normalizedScore.recognizedIpa,
      confidence: normalizedScore.confidence,
      latencyMs: normalizedScore.latencyMs,
      repetitionsCount: normalizedScore.errors.repetitions.length,
    };
  }

  /**
   * Evaluate full speech attempt using the modular DeterministicScorer
   */
  public evaluateDeterministicAttempt(
    exercise: Exercise,
    recognizedText: string,
    acousticData: Partial<NormalizedAcousticMeasurements> = {},
    provider: SpeechProviderType = SpeechProviderType.WEB_SPEECH_API,
    attemptNumber = 1
  ): DeterministicAttemptScore {
    const targetText = exercise.type === 'story' && exercise.story
      ? exercise.story[0]?.text || exercise.title
      : exercise.targetSentence || exercise.targetWord || exercise.title;

    const fullAcoustic: NormalizedAcousticMeasurements = {
      avgDecibels: acousticData.avgDecibels ?? 65,
      peakDecibels: acousticData.peakDecibels ?? 78,
      noiseFloorDb: acousticData.noiseFloorDb ?? 35,
      snrDb: acousticData.snrDb ?? 43,
      fundamentalFrequencyHz: acousticData.fundamentalFrequencyHz ?? 210,
      pitchRangeHz: acousticData.pitchRangeHz ?? [150, 320],
      pitchStability: acousticData.pitchStability ?? 88,
      spectralEnergyRatio: acousticData.spectralEnergyRatio ?? 0.45,
      spectralCentroidHz: acousticData.spectralCentroidHz ?? 1600,
      voiceOnsetLatencyMs: acousticData.voiceOnsetLatencyMs ?? 420,
      speechDurationMs: acousticData.speechDurationMs ?? (targetText.length * 200),
      silenceDurationMs: acousticData.silenceDurationMs ?? 200,
      totalRecordingDurationMs: acousticData.totalRecordingDurationMs ?? (targetText.length * 220),
      articulationRateSyllablesPerSec: acousticData.articulationRateSyllablesPerSec ?? 3.2,
      formantsEstimate: acousticData.formantsEstimate,
    };

    return deterministicScorer.scoreAttempt({
      exercise,
      targetText,
      recognizedHypothesis: {
        transcript: recognizedText,
        confidence: 0.9,
        isFinal: true,
        provider,
      },
      acousticMeasurements: fullAcoustic,
      attemptNumber,
      provider,
      language: exercise.language || Language.ENGLISH,
    });
  }

  /**
   * Aggregate multiple deterministic attempts into a normalized clinical session report
   */
  public aggregateSession(
    sessionId: string,
    profileId: string,
    exercise: Exercise,
    attempts: DeterministicAttemptScore[]
  ): NormalizedSessionResult {
    return deterministicScorer.aggregateSession(sessionId, profileId, exercise, attempts);
  }

  /**
   * Deterministic local feedback generator tailored for pediatric therapy
   */
  public generateDeterministicFeedback(
    exercise: Exercise,
    score: number,
    soda: SODAClassification,
    language: Language
  ): string {
    const isEn = language === Language.ENGLISH;
    const { pronunciationGuide } = exercise;

    if (score >= 90) {
      const praises = isEn
        ? [
            "Brilliant pronunciation! You hit every target sound clearly.",
            "Outstanding effort! Your articulation was crystal clear.",
            "You nailed it! Great breath support and clear voicing.",
            "Fantastic work! Perfect speech tempo and sound placement."
          ]
        : [
            "¡Excelente pronunciación! Articulaste cada sonido con claridad.",
            "¡Maravilloso trabajo! La entonación y claridad fueron perfectas.",
            "¡Lo lograste! Gran colocación de la lengua y los labios.",
            "¡Increíble esfuerzo! Sonó muy claro y natural."
          ];
      return praises[Math.floor(Math.random() * praises.length)];
    }

    if (score >= 70) {
      const encouragements = isEn
        ? [
            "Super close! Let's polish the clarity just a bit more.",
            "Great attempt! You're almost at full precision.",
            "Very good effort! Focus on keeping the sound steady."
          ]
        : [
            "¡Muy cerca! Vamos a pulir la claridad un poquito más.",
            "¡Buenísimo intento! Casi alcanzas la máxima precisión.",
            "¡Gran esfuerzo! Mantén el ritmo constante."
          ];

      let tip = '';
      if (soda.substitutions.length > 0) {
        tip = isEn
          ? ` Note: Watch out for sound substitutions like ${soda.substitutions[0]}.`
          : ` Nota: Cuidado con sustituir sonidos como en ${soda.substitutions[0]}.`;
      } else if (pronunciationGuide?.tip) {
        tip = ` ${pronunciationGuide.tip}`;
      } else if (pronunciationGuide?.mouthPosition) {
        tip = isEn
          ? ` Remember: ${pronunciationGuide.mouthPosition}.`
          : ` Recuerda: ${pronunciationGuide.mouthPosition}.`;
      }

      return encouragements[Math.floor(Math.random() * encouragements.length)] + tip;
    }

    // Under 70
    const tips = isEn
      ? [
          "Let's practice this one slowly and listen carefully.",
          "Take a gentle breath, shape your mouth, and try once more.",
          "You've got this! Focus on the starting and ending sounds."
        ]
      : [
          "Vamos a practicarlo despacio y escuchar con atención.",
          "Toma aire con calma, coloca los labios y prueba otra vez.",
          "¡Tú puedes! Concéntrate en el sonido inicial y final."
        ];

    let specificTip = '';
    if (pronunciationGuide?.tonguePlacement) {
      specificTip = isEn
        ? ` Tongue placement: ${pronunciationGuide.tonguePlacement}.`
        : ` Posición de la lengua: ${pronunciationGuide.tonguePlacement}.`;
    } else if (pronunciationGuide?.mouthPosition) {
      specificTip = isEn
        ? ` Mouth position: ${pronunciationGuide.mouthPosition}.`
        : ` Posición de la boca: ${pronunciationGuide.mouthPosition}.`;
    }

    return tips[Math.floor(Math.random() * tips.length)] + specificTip;
  }

  /**
   * SLP Dynamic Prompting Hierarchy Engine
   * Auto-adjusts prompting level (maximal -> moderate -> minimal -> independent)
   * based on consecutive attempt performance history.
   */
  public calculateAdaptivePromptLevel(
    recentScores: number[],
    currentLevel: 'maximal' | 'moderate' | 'minimal' | 'independent' = 'moderate'
  ): {
    nextLevel: 'maximal' | 'moderate' | 'minimal' | 'independent';
    visualCuesEnabled: boolean;
    audioModelingDelayMs: number;
    guidanceNotes: string;
  } {
    if (recentScores.length === 0) {
      return {
        nextLevel: currentLevel,
        visualCuesEnabled: currentLevel !== 'independent',
        audioModelingDelayMs: currentLevel === 'maximal' ? 0 : currentLevel === 'moderate' ? 1200 : 2500,
        guidanceNotes: 'Initial baseline prompting active'
      };
    }

    const last3 = recentScores.slice(-3);
    const avgScore = last3.reduce((a, b) => a + b, 0) / last3.length;
    let nextLevel = currentLevel;

    // Promotion criteria: 3 consecutive trials >= 85%
    if (last3.length >= 3 && avgScore >= 85) {
      if (currentLevel === 'maximal') nextLevel = 'moderate';
      else if (currentLevel === 'moderate') nextLevel = 'minimal';
      else if (currentLevel === 'minimal') nextLevel = 'independent';
    }
    // Demotion / Scaffold criteria: 2 consecutive trials < 60%
    else if (last3.length >= 2 && avgScore < 60) {
      if (currentLevel === 'independent') nextLevel = 'minimal';
      else if (currentLevel === 'minimal') nextLevel = 'moderate';
      else if (currentLevel === 'moderate') nextLevel = 'maximal';
    }

    const visualCuesEnabled = nextLevel !== 'independent';
    const audioModelingDelayMs = 
      nextLevel === 'maximal' ? 0 :
      nextLevel === 'moderate' ? 1000 :
      nextLevel === 'minimal' ? 2500 : 4000;

    const guidanceNotes = 
      nextLevel === 'maximal' ? 'Maximal Scaffolding: Immediate audio modeling, mouth shape guides, and tactile cues.' :
      nextLevel === 'moderate' ? 'Moderate Prompting: Visual phoneme reminders with 1-second delayed modeling.' :
      nextLevel === 'minimal' ? 'Minimal Prompting: Subtle visual highlight with 2.5-second self-correction delay.' :
      'Independent Production: Self-directed trials with zero assistive latency.';

    return {
      nextLevel,
      visualCuesEnabled,
      audioModelingDelayMs,
      guidanceNotes
    };
  }
}

export const clinicalEngine = new ClinicalEngine();
