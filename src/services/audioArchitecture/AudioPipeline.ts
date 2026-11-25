import { Exercise, Language } from '../../types';
import { SpeechProviderType } from '../sttService';
import {
  AudioPipelineStage,
  DeterministicAttemptScore,
  NormalizedSessionResult,
  NormalizedAcousticMeasurements,
} from './types';
import { audioCapture, CapturedAudioPayload } from './AudioCapture';
import { audioProcessor } from './AudioProcessor';
import { speechRecognizer, RecognizedHypothesis } from './SpeechRecognizer';
import { transcriptNormalizer, NormalizedTranscriptResult } from './TranscriptNormalizer';
import { deterministicScorer } from './DeterministicScorer';
import { optionalAiInterpreter } from './OptionalAiInterpreter';

export interface PipelineProgressCallback {
  (stage: AudioPipelineStage, details: string, data?: any): void;
}

export interface RunPipelineOptions {
  exercise: Exercise;
  targetText?: string;
  language?: Language;
  attemptNumber?: number;
  provider?: SpeechProviderType;
  recognitionTimeoutMs?: number;
  childName?: string;
  isAiOptedOut?: boolean;
  enableOptionalAi?: boolean;
  onProgress?: PipelineProgressCallback;
  onInterimRecognition?: (hyp: RecognizedHypothesis) => void;
}

/**
 * Master Clinical Audio Architecture Pipeline
 * Strictly executes the 6-stage decoupled architecture:
 *
 * 1. Audio Capture
 *       ↓
 * 2. Audio Processing (DSP & Acoustics)
 *       ↓
 * 3. Speech Recognition (STT Hypotheses & Confidence)
 *       ↓
 * 4. Transcript (Normalization & Repetitions)
 *       ↓
 * 5. Clinical Scoring (Deterministic SODA, Error Rates, Phonemes, Latency)
 *       ↓
 * 6. Optional AI Analysis (Gemini Qualitative SLP Overlay)
 */
export class AudioPipeline {
  private currentStage: AudioPipelineStage = AudioPipelineStage.IDLE;
  private activeSessionAttempts: DeterministicAttemptScore[] = [];

  public getCurrentStage(): AudioPipelineStage {
    return this.currentStage;
  }

  public getActiveAttempts(): DeterministicAttemptScore[] {
    return [...this.activeSessionAttempts];
  }

  public clearSession(): void {
    this.activeSessionAttempts = [];
    this.currentStage = AudioPipelineStage.IDLE;
  }

  /**
   * Execute the full end-to-end 6-stage audio pipeline
   */
  public async executeAttemptTrial(options: RunPipelineOptions): Promise<DeterministicAttemptScore> {
    const { onProgress, onInterimRecognition, exercise } = options;
    const language = options.language || exercise.language || Language.ENGLISH;
    const targetText = options.targetText || exercise.targetSentence || exercise.targetWord || exercise.title;

    try {
      // ----------------------------------------------------
      // STAGE 1: Audio Capture
      // ----------------------------------------------------
      this.currentStage = AudioPipelineStage.AUDIO_CAPTURE;
      onProgress?.(AudioPipelineStage.AUDIO_CAPTURE, 'Initializing microphone & audio buffer stream...');

      if (audioCapture.getState() !== 'recording') {
        await audioCapture.startCapture();
      }
      
      const recognitionPromise = speechRecognizer.recognizeSpeech({
        language,
        expectedTarget: targetText,
        continuous: false,
        interimResults: true,
        timeoutMs: options.recognitionTimeoutMs,
      }, (interim) => {
        onInterimRecognition?.(interim);
      });

      // ----------------------------------------------------
      // STAGE 3: Speech Recognition
      // ----------------------------------------------------
      this.currentStage = AudioPipelineStage.SPEECH_RECOGNITION;
      onProgress?.(AudioPipelineStage.SPEECH_RECOGNITION, 'Transcribing phonemes and speech candidates...');

      const recognizedHypothesis: RecognizedHypothesis = await recognitionPromise;
      if (recognizedHypothesis.error) {
        throw new Error(`Speech recognition failed: ${recognizedHypothesis.error}`);
      }
      if (
        recognizedHypothesis.provider === SpeechProviderType.ACOUSTIC_PHONETIC ||
        recognizedHypothesis.provider === SpeechProviderType.MANUAL_EVALUATION
      ) {
        throw new Error('Live speech recognition is unavailable in this browser.');
      }
      if (!recognizedHypothesis.transcript.trim()) {
        throw new Error('No speech was detected.');
      }

      // ----------------------------------------------------
      // STAGE 2: Audio Processing (DSP / Acoustics)
      // ----------------------------------------------------
      this.currentStage = AudioPipelineStage.AUDIO_PROCESSING;
      onProgress?.(AudioPipelineStage.AUDIO_PROCESSING, 'Computing digital signal processing & acoustic metrics...');

      const capturedPayload: CapturedAudioPayload = await audioCapture.stopCapture();
      const acousticMetrics: NormalizedAcousticMeasurements = audioProcessor.processAcousticMetrics(
        capturedPayload,
        2
      );

      // ----------------------------------------------------
      // STAGE 4: Transcript Normalization
      // ----------------------------------------------------
      this.currentStage = AudioPipelineStage.TRANSCRIPT_NORMALIZATION;
      onProgress?.(AudioPipelineStage.TRANSCRIPT_NORMALIZATION, 'Normalizing transcript & detecting dysfluencies...');
      
      const normalizedTranscript: NormalizedTranscriptResult = transcriptNormalizer.normalize(
        recognizedHypothesis.transcript,
        language
      );

      // ----------------------------------------------------
      // STAGE 5: Clinical Scoring (Pure Deterministic Engine)
      // ----------------------------------------------------
      this.currentStage = AudioPipelineStage.CLINICAL_SCORING;
      onProgress?.(AudioPipelineStage.CLINICAL_SCORING, 'Aligning expected phonemes, S.O.D.A. classification & error rates...');
      
      const deterministicResult: DeterministicAttemptScore = deterministicScorer.scoreAttempt({
        exercise,
        targetText,
        recognizedHypothesis,
        acousticMeasurements: acousticMetrics,
        attemptNumber: options.attemptNumber || this.activeSessionAttempts.length + 1,
        provider: options.provider || recognizedHypothesis.provider,
        language,
      });

      // ----------------------------------------------------
      // STAGE 6: Optional AI Analysis (Gemini Interpretation)
      // ----------------------------------------------------
      let finalResult = deterministicResult;
      if (options.enableOptionalAi !== false) {
        this.currentStage = AudioPipelineStage.OPTIONAL_AI_ANALYSIS;
        onProgress?.(AudioPipelineStage.OPTIONAL_AI_ANALYSIS, 'Requesting optional qualitative clinical coaching...');
        
        finalResult = await optionalAiInterpreter.interpretAttempt(deterministicResult, exercise, {
          isAiOptedOut: options.isAiOptedOut,
          childName: options.childName,
        });
      }

      this.currentStage = AudioPipelineStage.COMPLETED;
      onProgress?.(AudioPipelineStage.COMPLETED, 'Attempt evaluation complete.', finalResult);

      this.activeSessionAttempts.push(finalResult);
      return finalResult;
    } catch (err: any) {
      if (audioCapture.getState() === 'recording') {
        await audioCapture.stopCapture();
      }
      this.currentStage = AudioPipelineStage.ERROR;
      onProgress?.(AudioPipelineStage.ERROR, `Pipeline Error: ${err.message}`);
      throw err;
    }
  }

  public async startRecording(config?: any): Promise<MediaStream> {
    return audioCapture.startCapture(config);
  }

  public async stopRecording(): Promise<Blob> {
    const payload = await audioCapture.stopCapture();
    return payload.audioBlob;
  }

  /**
   * Finalize the current practice session and generate aggregated NormalizedSessionResult
   */
  public finalizeSession(
    sessionId: string,
    profileId: string,
    exercise: Exercise
  ): NormalizedSessionResult {
    if (this.activeSessionAttempts.length === 0) {
      throw new Error('No attempts have been recorded in this session.');
    }

    return deterministicScorer.aggregateSession(
      sessionId,
      profileId,
      exercise,
      this.activeSessionAttempts
    );
  }
}

export const audioPipeline = new AudioPipeline();
