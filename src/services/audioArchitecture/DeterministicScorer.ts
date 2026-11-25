import { Language, Exercise } from '../../types';
import { SpeechProviderType } from '../sttService';
import { 
  DeterministicAttemptScore, 
  NormalizedSessionResult, 
  NormalizedAcousticMeasurements, 
  ClinicalErrorClassification, 
  PhonemeAlignmentItem 
} from './types';
import { phoneticDictionary, PHONEME_MAP } from './PhoneticDictionary';
import { transcriptNormalizer, NormalizedTranscriptResult } from './TranscriptNormalizer';
import { RecognizedHypothesis } from './SpeechRecognizer';

export interface ScoreAttemptInput {
  exercise: Exercise;
  targetText?: string;
  recognizedHypothesis: RecognizedHypothesis;
  acousticMeasurements: NormalizedAcousticMeasurements;
  attemptNumber?: number;
  provider?: SpeechProviderType;
  language?: Language;
}

/**
 * Stage 5: Deterministic Clinical Scoring Layer
 * 100% pure function, independently reproducible clinical scoring engine
 */
export class DeterministicScorer {
  /**
   * Evaluate and score an individual speech attempt deterministically
   */
  public scoreAttempt(input: ScoreAttemptInput): DeterministicAttemptScore {
    const { exercise, recognizedHypothesis, acousticMeasurements } = input;
    const language = input.language || exercise.language || Language.ENGLISH;
    const provider = input.provider || recognizedHypothesis.provider || SpeechProviderType.WEB_SPEECH_API;
    const attemptNumber = input.attemptNumber ?? 1;

    // 1. Target representation
    const targetText = (input.targetText || exercise.targetSentence || exercise.targetWord || exercise.title || '').trim();
    const normalizedTarget = transcriptNormalizer.normalize(targetText, language);
    const targetWords = normalizedTarget.tokens;

    // Extract Expected Phonemes & IPA
    const expectedPhonemesList: string[] = [];
    const expectedIpaList: string[] = [];
    let targetSyllableCount = 0;

    for (const w of targetWords) {
      const { phonemes, ipa } = phoneticDictionary.getPhonemesForWord(w, language);
      expectedPhonemesList.push(...phonemes);
      if (ipa) expectedIpaList.push(ipa.replace(/\//g, ''));
      targetSyllableCount += this.estimateSyllables(w, language);
    }
    const expectedIpa = expectedIpaList.length > 0 ? `/${expectedIpaList.join(' ')}/` : '';

    // 2. Recognized Speech representation
    const rawTranscript = recognizedHypothesis.transcript || '';
    const normalizedRecognized = transcriptNormalizer.normalize(rawTranscript, language);
    const recognizedWords = normalizedRecognized.tokens;

    const recognizedPhonemesList: string[] = [];
    const recognizedIpaList: string[] = [];

    for (const w of recognizedWords) {
      const { phonemes, ipa } = phoneticDictionary.getPhonemesForWord(w, language);
      recognizedPhonemesList.push(...phonemes);
      if (ipa) recognizedIpaList.push(ipa.replace(/\//g, ''));
    }
    const recognizedIpa = recognizedIpaList.length > 0 ? `/${recognizedIpaList.join(' ')}/` : '';

    // 3. Phoneme Alignment (Needleman-Wunsch dynamic programming)
    const { alignments, substitutions, omissions, additions, correctPhonemes } = this.alignPhonemes(
      expectedPhonemesList,
      recognizedPhonemesList
    );

    // 4. Measurable Acoustic Distortions
    const distortions = this.detectMeasurableDistortions(
      targetWords,
      expectedPhonemesList,
      acousticMeasurements,
      alignments
    );

    // 5. Repetitions from transcript normalizer
    const repetitions = normalizedRecognized.detectedRepetitions;

    // Build Clinical Error Classification
    const errors: ClinicalErrorClassification = {
      correctProductions: correctPhonemes.map((cp) => ({
        unit: cp.phoneme,
        type: 'phoneme' as const,
        position: cp.index,
        ipa: PHONEME_MAP[cp.phoneme]?.ipa || cp.phoneme,
      })),
      substitutions,
      omissions,
      additions,
      distortions,
      repetitions,
    };

    // 6. Error Rates (WER, CER, PER)
    const wer = this.calculateWordErrorRate(targetWords, recognizedWords);
    const cer = this.calculateCharacterErrorRate(normalizedTarget.normalizedTranscript, normalizedRecognized.normalizedTranscript);
    const per = this.calculatePhonemeErrorRate(expectedPhonemesList, recognizedPhonemesList, errors);

    // 7. Clinical Quantitative Metrics
    const rawAccuracy = Math.max(0, Math.min(100, Math.round((1 - per) * 80 + (1 - wer) * 20)));
    
    // Pronunciation Score (Penalize substitutions and distortions)
    let pronunciationScore = rawAccuracy;
    if (substitutions.length > 0) pronunciationScore = Math.max(15, pronunciationScore - substitutions.length * 15);
    if (distortions.length > 0) pronunciationScore = Math.max(20, pronunciationScore - distortions.length * 10);
    if (omissions.length > 0) pronunciationScore = Math.max(10, pronunciationScore - omissions.length * 12);
    pronunciationScore = Math.max(0, Math.min(100, Math.round(pronunciationScore)));

    // Fluency Score (Voice Onset Latency, Speech Pacing, Repetitions)
    let fluencyScore = 85;
    if (acousticMeasurements.voiceOnsetLatencyMs > 1400) fluencyScore -= 15;
    else if (acousticMeasurements.voiceOnsetLatencyMs < 600) fluencyScore += 10;
    if (repetitions.length > 0) fluencyScore -= Math.min(35, repetitions.length * 12);
    if (acousticMeasurements.silenceDurationMs > acousticMeasurements.speechDurationMs) fluencyScore -= 15;
    fluencyScore = Math.max(10, Math.min(100, Math.round(fluencyScore)));

    // Intelligibility Score (Combination of accuracy, SNR, and confidence)
    const confidence = Math.max(0.1, Math.min(1.0, recognizedHypothesis.confidence || (acousticMeasurements.snrDb > 20 ? 0.92 : 0.75)));
    const intelligibilityScore = Math.max(0, Math.min(100, Math.round(rawAccuracy * 0.7 + confidence * 30)));

    // Overall Score
    const overallScore = Math.round(rawAccuracy * 0.45 + pronunciationScore * 0.25 + fluencyScore * 0.20 + intelligibilityScore * 0.10);

    // 8. Deterministic Clinical Summaries
    const deterministicSummary = this.generateDeterministicSummary(exercise, targetText, overallScore, errors, language);
    const deterministicClinicalNotes = this.generateClinicalObjectiveNotes(targetText, errors, wer, per, acousticMeasurements, latencyMsFor(acousticMeasurements));

    // 9. Deterministic Digest
    const reproducibleDigest = this.computeDigest(targetText, rawTranscript, overallScore, wer, per, acousticMeasurements.voiceOnsetLatencyMs);

    const attemptId = `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    return {
      attemptId,
      attemptNumber,
      timestamp: Date.now(),
      exerciseId: exercise.id,
      exerciseTitle: exercise.title,
      language,
      provider,
      targetText,
      targetWords,
      expectedPhonemes: expectedPhonemesList,
      expectedIpa,
      targetSyllableCount: Math.max(1, targetSyllableCount),
      recognizedRawTranscript: rawTranscript,
      recognizedNormalizedTranscript: normalizedRecognized.normalizedTranscript,
      recognizedWords,
      recognizedPhonemes: recognizedPhonemesList,
      recognizedIpa,
      errors,
      phonemeAlignments: alignments,
      accuracy: rawAccuracy,
      pronunciationScore,
      fluencyScore,
      intelligibilityScore,
      overallScore,
      wordErrorRate: wer,
      characterErrorRate: cer,
      phonemeErrorRate: per,
      latencyMs: acousticMeasurements.voiceOnsetLatencyMs,
      durationMs: acousticMeasurements.totalRecordingDurationMs || acousticMeasurements.speechDurationMs,
      acousticMeasurements,
      confidence: Number(confidence.toFixed(2)),
      deterministicSummary,
      deterministicClinicalNotes,
      reproducibleDigest,
    };
  }

  /**
   * Aggregate multiple attempts into a normalized Clinical Session Result
   */
  public aggregateSession(
    sessionId: string,
    profileId: string,
    exercise: Exercise,
    attempts: DeterministicAttemptScore[]
  ): NormalizedSessionResult {
    const totalAttempts = attempts.length;
    if (totalAttempts === 0) {
      throw new Error('Cannot aggregate an empty session without attempts');
    }

    const language = exercise.language || Language.ENGLISH;
    const startedAt = attempts[0].timestamp;
    const completedAt = attempts[attempts.length - 1].timestamp;
    const totalDurationMs = attempts.reduce((sum, a) => sum + (a.durationMs || 1000), 0);

    const correctAttempts = attempts.filter((a) => a.overallScore >= 80).length;

    const meanAccuracy = Math.round(attempts.reduce((sum, a) => sum + a.accuracy, 0) / totalAttempts);
    const meanFluency = Math.round(attempts.reduce((sum, a) => sum + a.fluencyScore, 0) / totalAttempts);
    const meanPronunciation = Math.round(attempts.reduce((sum, a) => sum + a.pronunciationScore, 0) / totalAttempts);
    const meanOverallScore = Math.round(attempts.reduce((sum, a) => sum + a.overallScore, 0) / totalAttempts);
    const bestAttemptScore = Math.max(...attempts.map((a) => a.overallScore));

    const meanWordErrorRate = Number((attempts.reduce((sum, a) => sum + a.wordErrorRate, 0) / totalAttempts).toFixed(3));
    const meanPhonemeErrorRate = Number((attempts.reduce((sum, a) => sum + a.phonemeErrorRate, 0) / totalAttempts).toFixed(3));
    const meanLatencyMs = Math.round(attempts.reduce((sum, a) => sum + a.latencyMs, 0) / totalAttempts);

    // Aggregate SODA errors
    let totalCorrect = 0;
    let totalSubstitutions = 0;
    let totalOmissions = 0;
    let totalDistortions = 0;
    let totalAdditions = 0;
    let totalRepetitions = 0;

    const phonemeMasteryMap: NormalizedSessionResult['phonemeMastery'] = {};

    for (const att of attempts) {
      totalCorrect += att.errors.correctProductions.length;
      totalSubstitutions += att.errors.substitutions.length;
      totalOmissions += att.errors.omissions.length;
      totalDistortions += att.errors.distortions.length;
      totalAdditions += att.errors.additions.length;
      totalRepetitions += att.errors.repetitions.length;

      // Track individual phoneme accuracy
      for (const al of att.phonemeAlignments) {
        const ph = al.expectedPhoneme;
        if (!phonemeMasteryMap[ph]) {
          phonemeMasteryMap[ph] = {
            phoneme: ph,
            ipa: al.expectedIpa || ph,
            attempts: 0,
            correct: 0,
            accuracyPercent: 0,
          };
        }
        phonemeMasteryMap[ph].attempts++;
        if (al.status === 'correct') {
          phonemeMasteryMap[ph].correct++;
        }
        phonemeMasteryMap[ph].accuracyPercent = Math.round(
          (phonemeMasteryMap[ph].correct / phonemeMasteryMap[ph].attempts) * 100
        );
      }
    }

    // Determine primary error type
    let primaryErrorType: NormalizedSessionResult['sodaSummary']['primaryErrorType'] = 'None';
    const maxErrors = Math.max(totalSubstitutions, totalOmissions, totalDistortions, totalAdditions, totalRepetitions);
    if (maxErrors > 0) {
      if (maxErrors === totalSubstitutions) primaryErrorType = 'Substitution';
      else if (maxErrors === totalOmissions) primaryErrorType = 'Omission';
      else if (maxErrors === totalDistortions) primaryErrorType = 'Distortion';
      else if (maxErrors === totalAdditions) primaryErrorType = 'Addition';
      else if (maxErrors === totalRepetitions) primaryErrorType = 'Repetition';
    }

    // Progression trend
    let progressionTrend: 'improving' | 'steady' | 'declining' = 'steady';
    if (attempts.length >= 3) {
      const firstScore = attempts[0].overallScore;
      const lastScore = attempts[attempts.length - 1].overallScore;
      if (lastScore - firstScore >= 10) progressionTrend = 'improving';
      else if (firstScore - lastScore >= 10) progressionTrend = 'declining';
    }

    // Mean Acoustic Profile
    const meanAcousticProfile = {
      avgDecibels: Number((attempts.reduce((sum, a) => sum + a.acousticMeasurements.avgDecibels, 0) / totalAttempts).toFixed(1)),
      avgFundamentalFrequencyHz: Math.round(attempts.reduce((sum, a) => sum + a.acousticMeasurements.fundamentalFrequencyHz, 0) / totalAttempts),
      avgSpectralRatio: Number((attempts.reduce((sum, a) => sum + a.acousticMeasurements.spectralEnergyRatio, 0) / totalAttempts).toFixed(3)),
      avgSnrDb: Number((attempts.reduce((sum, a) => sum + a.acousticMeasurements.snrDb, 0) / totalAttempts).toFixed(1)),
    };

    const sessionReport = `Clinical Session ${sessionId} for "${exercise.title}": ${totalAttempts} attempts completed (${correctAttempts}/${totalAttempts} mastered). Mean Accuracy: ${meanAccuracy}%, Mean PER: ${meanPhonemeErrorRate}, Mean Response Latency: ${meanLatencyMs}ms. Primary pattern: ${primaryErrorType}. Progression: ${progressionTrend}.`;
    const sessionHash = `ses-hash-${this.computeDigest(exercise.title, sessionId, meanOverallScore, meanWordErrorRate, meanPhonemeErrorRate, meanLatencyMs)}`;

    return {
      sessionId,
      profileId,
      exerciseId: exercise.id,
      exerciseTitle: exercise.title,
      language,
      startedAt,
      completedAt,
      totalDurationMs,
      attempts,
      totalAttempts,
      correctAttempts,
      meanAccuracy,
      meanFluency,
      meanPronunciation,
      meanOverallScore,
      bestAttemptScore,
      meanWordErrorRate,
      meanPhonemeErrorRate,
      meanLatencyMs,
      sodaSummary: {
        totalCorrect,
        totalSubstitutions,
        totalOmissions,
        totalDistortions,
        totalAdditions,
        totalRepetitions,
        primaryErrorType,
      },
      phonemeMastery: phonemeMasteryMap,
      meanAcousticProfile,
      progressionTrend,
      deterministicSessionReport: sessionReport,
      sessionHash,
    };
  }

  /**
   * Dynamic programming Needleman-Wunsch Alignment between expected and recognized phonemes
   */
  private alignPhonemes(
    expected: string[],
    recognized: string[]
  ): {
    alignments: PhonemeAlignmentItem[];
    substitutions: ClinicalErrorClassification['substitutions'];
    omissions: ClinicalErrorClassification['omissions'];
    additions: ClinicalErrorClassification['additions'];
    correctPhonemes: { phoneme: string; index: number }[];
  } {
    const alignments: PhonemeAlignmentItem[] = [];
    const substitutions: ClinicalErrorClassification['substitutions'] = [];
    const omissions: ClinicalErrorClassification['omissions'] = [];
    const additions: ClinicalErrorClassification['additions'] = [];
    const correctPhonemes: { phoneme: string; index: number }[] = [];

    const m = expected.length;
    const n = recognized.length;

    // DP Matrix for alignment
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i * 2; // Deletion penalty
    for (let j = 0; j <= n; j++) dp[0][j] = j * 2; // Insertion penalty

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const matchCost = expected[i - 1] === recognized[j - 1] ? 0 : 3; // Match vs substitution
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + matchCost, // Match/Sub
          dp[i - 1][j] + 2, // Deletion / Omission
          dp[i][j - 1] + 2 // Insertion / Addition
        );
      }
    }

    // Backtracking aligned sequence
    let i = m;
    let j = n;
    const alignedExpected: (string | null)[] = [];
    const alignedRecognized: (string | null)[] = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + (expected[i - 1] === recognized[j - 1] ? 0 : 3)) {
        alignedExpected.unshift(expected[i - 1]);
        alignedRecognized.unshift(recognized[j - 1]);
        i--;
        j--;
      } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 2) {
        alignedExpected.unshift(expected[i - 1]);
        alignedRecognized.unshift(null); // Omission
        i--;
      } else {
        alignedExpected.unshift(null); // Addition
        alignedRecognized.unshift(recognized[j - 1]);
        j--;
      }
    }

    // Classify alignments into S.O.D.A.
    for (let idx = 0; idx < alignedExpected.length; idx++) {
      const exp = alignedExpected[idx];
      const rec = alignedRecognized[idx];

      const expIpa = exp && PHONEME_MAP[exp] ? PHONEME_MAP[exp].ipa : exp || '';
      const recIpa = rec && PHONEME_MAP[rec] ? PHONEME_MAP[rec].ipa : rec || '';

      const context: 'initial' | 'medial' | 'final' = idx === 0 ? 'initial' : idx === alignedExpected.length - 1 ? 'final' : 'medial';

      if (exp && rec) {
        if (exp === rec) {
          alignments.push({
            index: idx,
            expectedPhoneme: exp,
            expectedIpa: expIpa,
            producedPhoneme: rec,
            producedIpa: recIpa,
            status: 'correct',
          });
          correctPhonemes.push({ phoneme: exp, index: idx });
        } else {
          const process = phoneticDictionary.identifyPhonologicalProcess(exp, rec);
          alignments.push({
            index: idx,
            expectedPhoneme: exp,
            expectedIpa: expIpa,
            producedPhoneme: rec,
            producedIpa: recIpa,
            status: 'substitution',
            notes: process,
          });
          substitutions.push({
            target: exp,
            recognized: rec,
            position: idx,
            context,
            phonemeTarget: exp,
            phonemeRecognized: rec,
            phoneticProcess: process,
          });
        }
      } else if (exp && !rec) {
        // Omission
        alignments.push({
          index: idx,
          expectedPhoneme: exp,
          expectedIpa: expIpa,
          status: 'omission',
          notes: `Omitted target sound ${expIpa}`,
        });
        omissions.push({
          target: exp,
          position: idx,
          context,
          expectedPhoneme: exp,
          phoneticProcess: context === 'final' ? 'Final Consonant Deletion' : 'Sound Omission',
        });
      } else if (!exp && rec) {
        // Addition
        alignments.push({
          index: idx,
          expectedPhoneme: '(none)',
          expectedIpa: '',
          producedPhoneme: rec,
          producedIpa: recIpa,
          status: 'addition',
          notes: `Extra sound inserted ${recIpa}`,
        });
        additions.push({
          inserted: rec,
          position: idx,
          context: 'epenthesis',
          addedPhoneme: rec,
          phoneticProcess: 'Sound Insertion / Epenthesis',
        });
      }
    }

    return {
      alignments,
      substitutions,
      omissions,
      additions,
      correctPhonemes,
    };
  }

  /**
   * Detect measurable acoustic distortions (lateralization, derhotacization, pitch breaks, formant shift)
   */
  private detectMeasurableDistortions(
    targetWords: string[],
    expectedPhonemes: string[],
    acoustic: NormalizedAcousticMeasurements,
    alignments: PhonemeAlignmentItem[]
  ): ClinicalErrorClassification['distortions'] {
    const distortions: ClinicalErrorClassification['distortions'] = [];

    // 1. Derhotacization (Check for /R/ target with abnormal spectral ratio or formant shift)
    const hasRTarget = expectedPhonemes.includes('R') || expectedPhonemes.includes('ER') || expectedPhonemes.includes('RR');
    if (hasRTarget && acoustic.spectralEnergyRatio < 0.28) {
      distortions.push({
        target: '/ɹ/ (r sound)',
        type: 'derhotacization',
        acousticTrigger: 'Low spectral energy ratio < 0.28 indicating weak rhotic resonance',
        severity: acoustic.spectralEnergyRatio < 0.20 ? 'severe' : 'mild',
        measuredDeviationPercent: Math.round((0.38 - acoustic.spectralEnergyRatio) * 100),
        acousticDelta: {
          energyRatioDelta: Number((0.38 - acoustic.spectralEnergyRatio).toFixed(3)),
        },
      });
    }

    // 2. Lateralization / Interdental Lisping on /S/, /Z/, /SH/
    const hasSibilant = expectedPhonemes.includes('S') || expectedPhonemes.includes('Z') || expectedPhonemes.includes('SH');
    if (hasSibilant && (acoustic.spectralCentroidHz < 1200 || acoustic.spectralEnergyRatio < 0.25)) {
      distortions.push({
        target: '/s/ /z/ sibilant',
        type: 'lateralization',
        acousticTrigger: 'Spectral centroid shifted below 1200Hz indicating air leakage or lateral emission',
        severity: 'moderate',
        measuredDeviationPercent: 35,
        acousticDelta: {
          frequencyShiftHz: 1600 - acoustic.spectralCentroidHz,
        },
      });
    }

    // 3. Pitch Breaks & Vocal Instability
    if (acoustic.pitchStability < 60) {
      distortions.push({
        target: 'Vocal cord phonation',
        type: 'pitch_break',
        acousticTrigger: `Pitch stability dropped to ${acoustic.pitchStability}% with vocal tremor / jitter`,
        severity: acoustic.pitchStability < 40 ? 'severe' : 'mild',
        measuredDeviationPercent: Math.round(100 - acoustic.pitchStability),
      });
    }

    // 4. Abnormal Vowel Lengthening / Prolongation
    if (acoustic.speechDurationMs > 3500 && targetWords.length <= 1) {
      distortions.push({
        target: targetWords[0] || 'word',
        type: 'vowel_lengthening',
        acousticTrigger: `Speech duration (${acoustic.speechDurationMs}ms) significantly exceeded normal phonation window for single word`,
        severity: 'mild',
        measuredDeviationPercent: Math.round(((acoustic.speechDurationMs - 1200) / 1200) * 100),
        acousticDelta: {
          durationMsDelta: acoustic.speechDurationMs - 1200,
        },
      });
    }

    return distortions;
  }

  /**
   * Word Error Rate (WER) Calculation
   */
  public calculateWordErrorRate(targetWords: string[], recognizedWords: string[]): number {
    const m = targetWords.length;
    const n = recognizedWords.length;
    if (m === 0) return n > 0 ? 1 : 0;

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

    return Number(Math.min(1.0, dp[m][n] / m).toFixed(3));
  }

  /**
   * Character Error Rate (CER) Calculation
   */
  public calculateCharacterErrorRate(targetStr: string, recognizedStr: string): number {
    const s1 = targetStr.replace(/\s+/g, '');
    const s2 = recognizedStr.replace(/\s+/g, '');
    if (s1.length === 0) return s2.length > 0 ? 1 : 0;

    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = s1[i - 1] === s2[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }

    return Number(Math.min(1.0, dp[m][n] / m).toFixed(3));
  }

  /**
   * Phoneme Error Rate (PER) Calculation: (Substitutions + Omissions + Additions) / Total Expected Phonemes
   */
  public calculatePhonemeErrorRate(
    expectedPhonemes: string[],
    recognizedPhonemes: string[],
    errors: ClinicalErrorClassification
  ): number {
    const totalExpected = Math.max(1, expectedPhonemes.length);
    const errorCount = errors.substitutions.length + errors.omissions.length + errors.additions.length;
    return Number(Math.min(1.0, errorCount / totalExpected).toFixed(3));
  }

  /**
   * Syllable counting heuristic
   */
  private estimateSyllables(word: string, language: Language): number {
    if (!word) return 1;
    if (language === Language.SPANISH) {
      // In Spanish, vowels correspond closely to syllable nuclei
      const vowels = word.match(/[aeiouáéíóú]/gi);
      return Math.max(1, vowels ? vowels.length : 1);
    }
    // English rule
    const cleaned = word.toLowerCase().replace(/(?:[^laeiouy]|ed|es|e)$/, '').replace(/^y/, '');
    const matches = cleaned.match(/[aeiouy]{1,2}/g);
    return Math.max(1, matches ? matches.length : 1);
  }

  /**
   * Pediatric friendly deterministic feedback summary
   */
  private generateDeterministicSummary(
    exercise: Exercise,
    targetText: string,
    score: number,
    errors: ClinicalErrorClassification,
    language: Language
  ): string {
    const isEn = language === Language.ENGLISH;

    if (score >= 90) {
      return isEn
        ? `Brilliant articulation of "${targetText}"! All sounds and phonemes were produced clearly.`
        : `¡Articulación brillante de "${targetText}"! Todos los fonemas se produjeron con claridad.`;
    }

    if (errors.substitutions.length > 0) {
      const sub = errors.substitutions[0];
      return isEn
        ? `Great attempt! We noticed a sound substitution: ${sub.phoneticProcess || `${sub.target} → ${sub.recognized}`}. Focus on placement.`
        : `¡Buen intento! Notamos una sustitución de sonido: ${sub.phoneticProcess || `${sub.target} → ${sub.recognized}`}. Practica la posición de la boca.`;
    }

    if (errors.omissions.length > 0) {
      const om = errors.omissions[0];
      return isEn
        ? `Almost there! Remember to include the ending/starting sound: "${om.target}".`
        : `¡Casi perfecto! Recuerda incluir el sonido "${om.target}".`;
    }

    if (errors.distortions.length > 0) {
      const dist = errors.distortions[0];
      return isEn
        ? `Good effort! Keep the air flow steady to refine the clarity on ${dist.target}.`
        : `¡Gran esfuerzo! Mantén el flujo de aire constante para afinar el sonido ${dist.target}.`;
    }

    if (errors.repetitions.length > 0) {
      return isEn
        ? `Take a gentle, easy breath before speaking to keep your pacing smooth.`
        : `Toma una respiración suave antes de hablar para mantener un ritmo fluido.`;
    }

    return isEn
      ? `Good practice on "${targetText}". Let's try once more with clear vocal volume.`
      : `Buena práctica en "${targetText}". Probemos otra vez con voz clara.`;
  }

  /**
   * Objective clinical rationale notes for SLPs / Diagnostic Reports
   */
  private generateClinicalObjectiveNotes(
    targetText: string,
    errors: ClinicalErrorClassification,
    wer: number,
    per: number,
    acoustic: NormalizedAcousticMeasurements,
    latencyMs: number
  ): string {
    const errorDetails: string[] = [];
    if (errors.substitutions.length > 0) {
      errorDetails.push(`Substitutions (${errors.substitutions.length}): ${errors.substitutions.map((s) => s.phoneticProcess || `${s.target}→${s.recognized}`).join(', ')}`);
    }
    if (errors.omissions.length > 0) {
      errorDetails.push(`Omissions (${errors.omissions.length}): ${errors.omissions.map((o) => o.target).join(', ')}`);
    }
    if (errors.distortions.length > 0) {
      errorDetails.push(`Distortions (${errors.distortions.length}): ${errors.distortions.map((d) => `${d.type} on ${d.target}`).join(', ')}`);
    }
    if (errors.additions.length > 0) {
      errorDetails.push(`Additions (${errors.additions.length}): ${errors.additions.map((a) => a.inserted).join(', ')}`);
    }
    if (errors.repetitions.length > 0) {
      errorDetails.push(`Repetitions (${errors.repetitions.length}): ${errors.repetitions.map((r) => `"${r.repeatedUnit}" x${r.count}`).join(', ')}`);
    }

    const errorsSummary = errorDetails.length > 0 ? errorDetails.join(' | ') : 'No phonological errors detected (Production is Articulated Accurately)';

    return `Target: "${targetText}" | PER: ${(per * 100).toFixed(1)}% | WER: ${(wer * 100).toFixed(1)}% | VOT Latency: ${latencyMs}ms | F0: ${acoustic.fundamentalFrequencyHz}Hz | Volume: ${acoustic.avgDecibels}dB | SNR: ${acoustic.snrDb}dB | Errors: [${errorsSummary}]`;
  }

  /**
   * Pure deterministic checksum hash
   */
  private computeDigest(...args: any[]): string {
    const str = JSON.stringify(args);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

function latencyMsFor(acoustic: NormalizedAcousticMeasurements): number {
  return acoustic.voiceOnsetLatencyMs;
}

export const deterministicScorer = new DeterministicScorer();
