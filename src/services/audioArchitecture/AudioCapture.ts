import { SpeechProviderType } from '../sttService';

export interface AudioCaptureConfig {
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export interface CapturedAudioPayload {
  audioBlob: Blob;
  audioBuffer?: AudioBuffer;
  pcmFloat32Array?: Float32Array;
  sampleRate: number;
  durationMs: number;
  startTime: number;
  endTime: number;
}

export type AudioCaptureState = 'idle' | 'requesting' | 'recording' | 'paused' | 'stopped';

/**
 * Stage 1: Audio Capture Module
 * Responsible solely for microphone stream lifecycle, buffer acquisition, and raw audio encoding
 */
export class AudioCapture {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private state: AudioCaptureState = 'idle';
  private startTime = 0;
  private endTime = 0;
  private pcmChunks: Float32Array[] = [];
  private audioContext: AudioContext | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  public getState(): AudioCaptureState {
    return this.state;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Request microphone stream and start recording raw PCM and MediaRecorder blobs
   */
  public async startCapture(config: AudioCaptureConfig = {}): Promise<MediaStream> {
    if (this.state === 'recording') {
      await this.stopCapture();
    }

    this.state = 'requesting';
    this.audioChunks = [];
    this.pcmChunks = [];

    const constraints: MediaStreamConstraints = {
      audio: {
        channelCount: config.channelCount ?? 1,
        sampleRate: config.sampleRate ?? 44100,
        echoCancellation: config.echoCancellation ?? true,
        noiseSuppression: config.noiseSuppression ?? true,
        autoGainControl: config.autoGainControl ?? true,
      },
      video: false,
    };

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.startTime = performance.now();

      // Initialize MediaRecorder for compressed audio storage/playback
      if (typeof MediaRecorder !== 'undefined') {
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : 'audio/webm';

        this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };
        this.mediaRecorder.start(100); // 100ms slices
      }

      // Initialize AudioContext PCM buffer capture for high precision DSP
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
        this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.scriptNode = this.audioContext.createScriptProcessor(2048, 1, 1);

        this.scriptNode.onaudioprocess = (audioProcessingEvent) => {
          if (this.state !== 'recording') return;
          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
          this.pcmChunks.push(new Float32Array(inputData));
        };

        this.sourceNode.connect(this.scriptNode);
        this.scriptNode.connect(this.audioContext.destination);
      }

      this.state = 'recording';
      return this.mediaStream;
    } catch (err: any) {
      this.state = 'idle';
      this.cleanup();
      throw new Error(`Audio Capture Failed: ${err.message || 'Microphone access denied'}`);
    }
  }

  /**
   * Stop audio capture and assemble raw PCM and Blob payloads
   */
  public async stopCapture(): Promise<CapturedAudioPayload> {
    if (this.state === 'idle' || this.state === 'stopped') {
      return this.createEmptyPayload();
    }

    this.endTime = performance.now();
    const durationMs = Math.max(10, Math.round(this.endTime - this.startTime));
    this.state = 'stopped';

    // Stop MediaRecorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        if (!this.mediaRecorder) return resolve();
        this.mediaRecorder.onstop = () => resolve();
        this.mediaRecorder.stop();
      });
    }

    // Stop Tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
    }

    // Assemble PCM Float32Array
    let totalPcmLength = 0;
    for (const chunk of this.pcmChunks) {
      totalPcmLength += chunk.length;
    }

    const mergedPcm = new Float32Array(totalPcmLength);
    let offset = 0;
    for (const chunk of this.pcmChunks) {
      mergedPcm.set(chunk, offset);
      offset += chunk.length;
    }

    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
    const audioBlob = new Blob(this.audioChunks, { type: mimeType });
    const sampleRate = this.audioContext?.sampleRate || 44100;

    this.cleanup();
    this.state = 'idle';

    return {
      audioBlob,
      pcmFloat32Array: mergedPcm,
      sampleRate,
      durationMs,
      startTime: this.startTime,
      endTime: this.endTime,
    };
  }

  /**
   * Cleanup nodes and streams
   */
  public cleanup(): void {
    if (this.scriptNode) {
      this.scriptNode.disconnect();
      this.scriptNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    this.mediaRecorder = null;
    this.pcmChunks = [];
  }

  private createEmptyPayload(): CapturedAudioPayload {
    return {
      audioBlob: new Blob([], { type: 'audio/webm' }),
      pcmFloat32Array: new Float32Array(0),
      sampleRate: 44100,
      durationMs: 0,
      startTime: 0,
      endTime: 0,
    };
  }
}

export const audioCapture = new AudioCapture();
