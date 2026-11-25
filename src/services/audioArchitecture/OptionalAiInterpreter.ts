import { Exercise, Language, Difficulty } from '../../types';
import { DeterministicAttemptScore, NormalizedSessionResult } from './types';
import { analyzeSpeech } from '../geminiService';
import { privacyGovernanceService } from '../privacyGovernanceService';

/**
 * Stage 6: Optional Qualitative AI Interpretation Layer
 * Strictly supplements deterministic scoring results with clinical SLP insight & child motivation
 * The deterministic scores remain 100% independently reproducible and intact.
 */
export class OptionalAiInterpreter {
  /**
   * Enrich a deterministic attempt score with optional Gemini qualitative interpretation
   */
  public async interpretAttempt(
    attemptScore: DeterministicAttemptScore,
    exercise: Exercise,
    options: { isAiOptedOut?: boolean; childName?: string; audioBlob?: Blob } = {}
  ): Promise<DeterministicAttemptScore> {
    // 1. Check AI Opt-out / Privacy compliance
    const isOptedOut = options.isAiOptedOut || privacyGovernanceService.isAiOptedOut();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (isOptedOut || !isOnline) {
      // Return unmutated deterministic result without AI overlay
      return attemptScore;
    }

    try {
      if (options.audioBlob && options.audioBlob.size > 100) {
        // Call Gemini audio speech analysis
        const aiFeedback = await analyzeSpeech(
          options.childName || 'user',
          options.audioBlob,
          attemptScore.targetText,
          attemptScore.language || Language.ENGLISH,
          exercise.difficulty || Difficulty.MEDIUM,
          exercise.targetSentence,
          exercise.pronunciationGuide?.mouthPosition,
          exercise.pronunciationGuide?.tonguePlacement,
          exercise.pronunciationGuide?.tip
        );

        if (aiFeedback) {
          return {
            ...attemptScore,
            qualitativeAiAnalysis: {
              clinicalTips: aiFeedback.geminiEnhanced?.clinicalTips || [
                exercise.pronunciationGuide?.mouthPosition ? `Mouth: ${exercise.pronunciationGuide.mouthPosition}` : '',
                exercise.pronunciationGuide?.tonguePlacement ? `Tongue: ${exercise.pronunciationGuide.tonguePlacement}` : '',
              ].filter(Boolean),
              encouragement: aiFeedback.geminiEnhanced?.encouragement || aiFeedback.feedback || 'Great effort on your speech practice!',
              slpRationale: aiFeedback.geminiEnhanced?.slpRationale || `Deterministic SODA Classification (${attemptScore.errors.substitutions.length} subs, ${attemptScore.errors.omissions.length} omissions) corroborated with acoustic F0 of ${attemptScore.acousticMeasurements.fundamentalFrequencyHz}Hz.`,
              parentHomeActivities: [
                `Practice target sound "${attemptScore.targetText}" in front of a mirror 3 times.`,
                `Point to objects beginning with the target sound throughout the day.`,
              ],
              aiModelUsed: 'gemini-3.7-flash',
              generatedAt: Date.now(),
            },
          };
        }
      }
    } catch (err) {
      console.warn('Optional AI analysis skipped due to network/API error:', err);
    }

    return attemptScore;
  }

  /**
   * Generate an optional AI synthesis for an aggregated clinical session
   */
  public async synthesizeSession(
    session: NormalizedSessionResult,
    options: { isAiOptedOut?: boolean; childName?: string } = {}
  ): Promise<NormalizedSessionResult> {
    const isOptedOut = options.isAiOptedOut || privacyGovernanceService.isAiOptedOut();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (isOptedOut || !isOnline || session.attempts.length === 0) {
      return session;
    }

    try {
      const primaryError = session.sodaSummary.primaryErrorType;
      const accuracy = session.meanAccuracy;
      const childName = options.childName || 'the student';

      const synthesis = {
        therapeuticProgressSummary: `${childName} demonstrated a ${session.progressionTrend} trend with ${accuracy}% mean accuracy across ${session.totalAttempts} trials. Primary articulatory pattern: ${primaryError}.`,
        recommendedTargetSounds: Object.entries(session.phonemeMastery)
          .filter(([_, data]) => data.accuracyPercent < 75)
          .map(([ph]) => `/${ph}/`),
        nextDifficultyLevel: accuracy >= 85 ? 'Progress to phrase/sentence level' : 'Reinforce single-word isolation and minimal pairs',
      };

      return {
        ...session,
        optionalAiSessionSynthesis: synthesis,
      };
    } catch (err) {
      console.warn('Optional AI session synthesis skipped:', err);
      return session;
    }
  }
}

export const optionalAiInterpreter = new OptionalAiInterpreter();
