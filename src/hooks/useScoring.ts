import { useState, useCallback } from "react";
import { audioPipeline } from "../services/audioArchitecture";
import { SpeechProviderType } from "../services/sttService";
import { Exercise } from "../types";

export interface ScoringResult {
  overallScore: number;
  pronunciationScore: number;
  fluencyScore: number;
  intelligibilityScore: number;
  errors: {
    substitutions: unknown[];
    omissions: unknown[];
    additions: unknown[];
    distortions: unknown[];
    repetitions: unknown[];
  };
  rawAccuracy: number;
  wordErrorRate: number;
  phonemeErrorRate: number;
  summary: string;
}

/**
 * Hook that records a short utterance, runs STT, then scores it deterministically.
 * Returns a `score` function and the latest `result` + loading / error flags.
 */
export function useScoring() {
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const score = useCallback(
    async (exercise: Exercise, recognitionTimeoutMs = 8000): Promise<ScoringResult> => {
      setLoading(true);
      setError(null);
      try {
        const attempt = await audioPipeline.executeAttemptTrial({
          exercise,
          recognitionTimeoutMs,
          enableOptionalAi: false,
        });

        if (
          attempt.provider === SpeechProviderType.ACOUSTIC_PHONETIC ||
          attempt.provider === SpeechProviderType.MANUAL_EVALUATION
        ) {
          throw new Error("Live speech recognition is unavailable in this browser.");
        }
        if (!attempt.recognizedRawTranscript.trim()) {
          throw new Error("No speech was detected. Try again and speak after listening starts.");
        }

        const scoringResult: ScoringResult = {
          overallScore: attempt.overallScore,
          pronunciationScore: attempt.pronunciationScore,
          fluencyScore: attempt.fluencyScore,
          intelligibilityScore: attempt.intelligibilityScore,
          errors: attempt.errors,
          rawAccuracy: attempt.accuracy,
          wordErrorRate: attempt.wordErrorRate,
          phonemeErrorRate: attempt.phonemeErrorRate,
          summary: attempt.deterministicSummary,
        };
        setResult(scoringResult);
        return scoringResult;
      } catch (caughtError) {
        const scoringError = caughtError instanceof Error
          ? caughtError
          : new Error("Scoring failed");
        setError(scoringError.message);
        throw scoringError;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { result, loading, error, score };
}
