import { Language, Difficulty } from "../types";
import { handleError, ErrorType } from "../utils/errorHandler";
import { extractJsonFromResponse, validateSpeechAnalysis } from "../utils/aiUtils";
import { aiSafetyGuardrailsService, ClinicalSanitizationResult } from "./aiSafetyGuardrailsService";
import { privacyGovernanceService } from "./privacyGovernanceService";

export interface SpeechAnalysisResult {
  score: number;
  accuracy: number;
  fluency: number;
  pronunciation: number;
  feedback: string;
  isPerfect: boolean;
  geminiEnhanced?: {
    clinicalTips: string[];
    encouragement: string;
    slpRationale?: string;
    safetyGuardrails?: ClinicalSanitizationResult;
  };
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Optional Gemini Enhanced Speech Analysis with AI Safety Guardrails, Quota Capping & Hallucination Filtering.
 * Safely wraps API calls and gracefully falls back if disabled, capped, or offline.
 */
export async function analyzeSpeech(
  userId: string,
  audioBlob: Blob,
  targetWord: string,
  language: Language,
  difficulty: Difficulty,
  targetSentence?: string,
  mouthPosition?: string,
  tonguePlacement?: string,
  tip?: string
): Promise<SpeechAnalysisResult | null> {
  try {
    if (audioBlob.size < 100) {
      return null;
    }

    // 1. Guardrail: Check privacy AI opt-out
    if (privacyGovernanceService.isAiOptedOut()) {
      console.info("AI speech evaluation skipped (AI Opt-Out enforced by Parent/District policy).");
      return null;
    }

    // 2. Guardrail: Per-Child Usage Capping
    const quotaCheck = aiSafetyGuardrailsService.consumeChildAiQuota(userId, 1);
    if (!quotaCheck.allowed) {
      console.warn(`Per-child AI quota limit reached for profile ${userId}. Using deterministic clinical DSP engine.`);
      return null;
    }

    const base64Audio = await blobToBase64(audioBlob);

    const prompt = `
      You are a professional Speech-Language Pathologist (SLP) specializing in pediatric articulation and fluency.
      Analyze this audio recording of a child attempting to say: "${targetWord}" ${targetSentence ? `(within the sentence: "${targetSentence}")` : ""}.
      
      Language: ${language === Language.ENGLISH ? "English" : "Spanish"}
      Difficulty Level: ${difficulty}
      
      TARGET CLINICAL NOTES:
      - Mouth Position: ${mouthPosition || "Not specified"}
      - Tongue Placement: ${tonguePlacement || "Not specified"}
      - Professional Tip: ${tip || "Not specified"}
      
      CLINICAL SAFETY MANDATES:
      - Do NOT make diagnostic claims outside articulation/fluency.
      - Do NOT recommend medications or invasive procedures.
      - Use standard S.O.D.A. taxonomy (Substitution, Omission, Distortion, Addition).
      - Maintain constructive, child-affirming reinforcement.

      Provide a highly detailed, clinical but child-friendly assessment:
      1. Overall Score (0-100)
      2. Accuracy (0-100): Phonetic precision. Check if the child hit the target phonemes.
      3. Fluency (0-100): Smoothness, speed, and rhythm.
      4. Pronunciation (0-100): Clarity of vowels and consonants.
      5. Feedback: Positive encouragement and specific phonetic coaching.
      6. Clinical Tips: Array of 1-3 concise SLP coaching points.
      
      Return ONLY a JSON object:
      {
        "score": number,
        "accuracy": number,
        "fluency": number,
        "pronunciation": number,
        "feedback": string,
        "isPerfect": boolean,
        "clinicalTips": ["string"]
      }
    `;

    const response = await fetch('/api/ai/analyze-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, audioBase64: base64Audio, prompt })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.warn("Gemini Speech Analysis skipped/failed (using deterministic clinical engine fallback):", err.error || response.statusText);
      return null;
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = extractJsonFromResponse(rawText);
    const validated = validateSpeechAnalysis(parsed);

    // 3. Guardrail: Clinical Hallucination & Content Sanitization Layer
    const tipsArray = Array.isArray(parsed?.clinicalTips) ? parsed.clinicalTips : [validated.feedback];
    const sanitized = aiSafetyGuardrailsService.sanitizeAndValidateAiFeedback(
      validated.feedback,
      validated.score,
      tipsArray,
      undefined,
      targetWord
    );

    return {
      ...validated,
      score: sanitized.sanitizedScore,
      feedback: sanitized.sanitizedFeedback,
      geminiEnhanced: {
        clinicalTips: sanitized.sanitizedTips,
        encouragement: sanitized.sanitizedFeedback,
        slpRationale: `Pediatric assessment for target "${targetWord}" (${language}) - S.O.D.A. Verified`,
        safetyGuardrails: sanitized
      }
    };
  } catch (error) {
    console.warn("Gemini Speech Analysis network error (using deterministic clinical engine):", error);
    return null;
  }
}
