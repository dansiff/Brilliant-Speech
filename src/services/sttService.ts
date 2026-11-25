import { Language } from '../types';

export enum SpeechProviderType {
  WEB_SPEECH_API = 'web-speech-api',
  ACOUSTIC_PHONETIC = 'acoustic-phonetic-engine',
  MANUAL_EVALUATION = 'manual-eval-mode',
  MOCK_TEST_PROVIDER = 'mock-test-provider',
}

export type MicPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export type SpeechRecognitionAvailability = 'readily' | 'after-download' | 'no' | 'unsupported' | 'unknown';

export interface WebSpeechCapabilityReport {
  isSupported: boolean;
  hasStandardConstructor: boolean; // window.SpeechRecognition
  hasWebkitConstructor: boolean;   // window.webkitSpeechRecognition
  supportsProcessLocally: boolean; // recognition.processLocally
  hasStaticAvailable: boolean;     // SpeechRecognition.available()
  hasStaticInstall: boolean;       // SpeechRecognition.install()
  availabilityStatus: SpeechRecognitionAvailability;
  detectedEngine: 'SpeechRecognition' | 'webkitSpeechRecognition' | 'None';
  supportedLocales: string[];
}

export interface SpeechRecognitionResultPayload {
  transcript: string;
  isFinal: boolean;
  confidence: number;
  provider: SpeechProviderType;
  alternatives?: string[];
  rawEvent?: any;
  isProcessedLocally?: boolean;
}

export interface STTErrorPayload {
  code: 
    | 'not-allowed'
    | 'permission-denied'
    | 'service-not-allowed'
    | 'language-not-supported'
    | 'network'
    | 'audio-capture'
    | 'no-speech'
    | 'aborted'
    | 'bad-grammar'
    | 'unexpected-end'
    | 'unknown-error';
  message: string;
  provider: SpeechProviderType;
  recoverable?: boolean;
  originalEvent?: any;
}

export interface STTServiceOptions {
  language: Language;
  continuous?: boolean;
  interimResults?: boolean;
  preferLocalProcessing?: boolean;
  onResult?: (result: SpeechRecognitionResultPayload) => void;
  onError?: (error: STTErrorPayload) => void;
  onEnd?: () => void;
  onUnexpectedEnd?: () => void;
  onProviderChange?: (provider: SpeechProviderType) => void;
  onAvailabilityChange?: (status: SpeechRecognitionAvailability) => void;
}

// Global declaration for experimental / vendor-prefixed SpeechRecognition APIs
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export class STTService {
  private recognition: any = null;
  private activeProvider: SpeechProviderType = SpeechProviderType.ACOUSTIC_PHONETIC;
  private forcedProvider: SpeechProviderType | null = null;
  private isListening = false;
  private shouldBeListening = false; // Tracks intentional user state for unexpected end detection
  private currentLanguage: Language = Language.ENGLISH;
  private currentCallbacks: STTServiceOptions | null = null;
  private unexpectedEndRetryCount = 0;
  private maxUnexpectedRetries = 2;
  private retryTimeoutId: any = null;
  private lastKnownTranscript = '';

  constructor() {
    this.detectBestAvailableProvider();
  }

  /**
   * Get constructor class safely without throwing
   */
  public getSpeechRecognitionConstructor(): any {
    if (typeof window === 'undefined') return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  /**
   * Capability Detection: Web Speech API support
   * NEVER assumes universal availability. Checks explicit constructors.
   */
  public isWebSpeechSupported(): boolean {
    return this.getSpeechRecognitionConstructor() !== null;
  }

  public isMediaRecorderSupported(): boolean {
    if (typeof window === 'undefined' || !navigator) return false;
    return !!(navigator.mediaDevices && typeof window.MediaRecorder !== 'undefined');
  }

  public isAudioContextSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  }

  /**
   * Comprehensive Web Speech API Capability Detection
   * Evaluates standard vs webkit, processLocally, static available(), and static install()
   */
  public async getCapabilityReport(lang: Language = Language.ENGLISH): Promise<WebSpeechCapabilityReport> {
    if (typeof window === 'undefined') {
      return {
        isSupported: false,
        hasStandardConstructor: false,
        hasWebkitConstructor: false,
        supportsProcessLocally: false,
        hasStaticAvailable: false,
        hasStaticInstall: false,
        availabilityStatus: 'unsupported',
        detectedEngine: 'None',
        supportedLocales: ['en-US', 'es-ES'],
      };
    }

    const hasStandard = typeof window.SpeechRecognition !== 'undefined';
    const hasWebkit = typeof window.webkitSpeechRecognition !== 'undefined';
    const SpeechConstructor = this.getSpeechRecognitionConstructor();

    let hasStaticAvailable = false;
    let hasStaticInstall = false;
    let availabilityStatus: SpeechRecognitionAvailability = 'unknown';

    if (SpeechConstructor) {
      hasStaticAvailable = typeof SpeechConstructor.available === 'function';
      hasStaticInstall = typeof SpeechConstructor.install === 'function';

      // Probe static available() if supported by browser (e.g. modern on-device specs)
      if (hasStaticAvailable) {
        try {
          const locale = this.getLocale(lang);
          const availResult = await SpeechConstructor.available({ language: locale, processLocally: true });
          if (typeof availResult === 'string') {
            availabilityStatus = availResult as SpeechRecognitionAvailability;
          } else if (typeof availResult === 'boolean') {
            availabilityStatus = availResult ? 'readily' : 'no';
          }
        } catch {
          availabilityStatus = 'unknown';
        }
      } else {
        availabilityStatus = 'readily'; // Standard fallback availability for native browsers
      }
    } else {
      availabilityStatus = 'unsupported';
    }

    // Check processLocally instance capability
    let supportsProcessLocally = false;
    if (SpeechConstructor) {
      try {
        if (SpeechConstructor.prototype && 'processLocally' in SpeechConstructor.prototype) {
          supportsProcessLocally = true;
        }
      } catch {
        supportsProcessLocally = false;
      }
    }

    return {
      isSupported: Boolean(SpeechConstructor),
      hasStandardConstructor: hasStandard,
      hasWebkitConstructor: hasWebkit,
      supportsProcessLocally,
      hasStaticAvailable,
      hasStaticInstall,
      availabilityStatus,
      detectedEngine: hasStandard ? 'SpeechRecognition' : hasWebkit ? 'webkitSpeechRecognition' : 'None',
      supportedLocales: ['en-US', 'es-ES', 'en-GB', 'es-MX', 'es-419'],
    };
  }

  /**
   * Request language model installation if browser supports SpeechRecognition.install()
   */
  public async installLanguagePack(language: Language = Language.ENGLISH, processLocally = true): Promise<{ success: boolean; message: string }> {
    const SpeechConstructor = this.getSpeechRecognitionConstructor();
    if (!SpeechConstructor) {
      return { success: false, message: 'Web Speech API is not supported on this device/browser.' };
    }

    if (typeof SpeechConstructor.install !== 'function') {
      return { 
        success: true, 
        message: 'Browser uses built-in cloud/native speech recognition service; manual installation not required.' 
      };
    }

    try {
      const locale = this.getLocale(language);
      await SpeechConstructor.install({ language: locale, processLocally });
      return { success: true, message: `Successfully installed on-device language pack for ${locale}.` };
    } catch (err: any) {
      return { 
        success: false, 
        message: `Failed to install language pack: ${err.message || 'Unknown installation error'}` 
      };
    }
  }

  /**
   * Determine the best available provider dynamically
   */
  public detectBestAvailableProvider(): SpeechProviderType {
    if (this.forcedProvider) {
      this.activeProvider = this.forcedProvider;
      return this.activeProvider;
    }

    if (this.isWebSpeechSupported()) {
      this.activeProvider = SpeechProviderType.WEB_SPEECH_API;
    } else if (this.isMediaRecorderSupported() || this.isAudioContextSupported()) {
      this.activeProvider = SpeechProviderType.ACOUSTIC_PHONETIC;
    } else {
      this.activeProvider = SpeechProviderType.MANUAL_EVALUATION;
    }

    return this.activeProvider;
  }

  public setForcedProvider(provider: SpeechProviderType | null): void {
    this.forcedProvider = provider;
    this.detectBestAvailableProvider();
  }

  public getActiveProvider(): SpeechProviderType {
    return this.activeProvider;
  }

  public getProviderLabel(provider: SpeechProviderType = this.activeProvider): string {
    switch (provider) {
      case SpeechProviderType.WEB_SPEECH_API:
        return 'Browser Web Speech API (Real-time)';
      case SpeechProviderType.ACOUSTIC_PHONETIC:
        return 'Acoustic-Phonetic Clinical Engine';
      case SpeechProviderType.MANUAL_EVALUATION:
        return 'Manual / Audio-Only Fallback';
      case SpeechProviderType.MOCK_TEST_PROVIDER:
        return 'Automated Mock Test Provider';
      default:
        return 'Unknown Provider';
    }
  }

  /**
   * Query microphone permission status safely
   */
  public async getMicPermissionStatus(): Promise<MicPermissionState> {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      return 'unsupported';
    }

    try {
      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (status.state === 'granted') return 'granted';
        if (status.state === 'denied') return 'denied';
        return 'prompt';
      }
    } catch {
      // Some browsers (e.g. Safari / Firefox) do not implement microphone permission query
    }

    return 'prompt';
  }

  /**
   * Explicitly request microphone access with structured error classification
   */
  public async requestMicPermission(): Promise<{ granted: boolean; stream?: MediaStream; error?: string; code?: string }> {
    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { 
        granted: false, 
        error: 'MediaDevices getUserMedia is not supported in this browser.', 
        code: 'unsupported' 
      };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      return { granted: true, stream };
    } catch (err: any) {
      const errorName = err.name || '';
      const isDenied = errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError';
      const isNotFound = errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError';
      const isBusy = errorName === 'NotReadableError' || errorName === 'TrackStartError';

      let errorMessage = 'Failed to acquire microphone access.';
      let code = 'unknown';

      if (isDenied) {
        errorMessage = 'Microphone permission was denied. Please allow microphone access in your browser or device settings.';
        code = 'not-allowed';
      } else if (isNotFound) {
        errorMessage = 'No microphone device was detected on your computer or mobile device.';
        code = 'audio-capture';
      } else if (isBusy) {
        errorMessage = 'Microphone is currently in use by another application or tab.';
        code = 'audio-capture';
      }

      return {
        granted: false,
        error: errorMessage,
        code
      };
    }
  }

  /**
   * Get BCP-47 language tag
   */
  public getLocale(language: Language): string {
    return language === Language.SPANISH ? 'es-ES' : 'en-US';
  }

  /**
   * Start Speech Recognition listener with capability check, local processing, and error handling
   */
  public startListening(options: STTServiceOptions): void {
    this.stopListening();
    this.currentCallbacks = options;
    this.currentLanguage = options.language;
    this.shouldBeListening = true;
    this.lastKnownTranscript = '';
    this.unexpectedEndRetryCount = 0;

    this.detectBestAvailableProvider();
    options.onProviderChange?.(this.activeProvider);

    // Mock test provider
    if (this.activeProvider === SpeechProviderType.MOCK_TEST_PROVIDER) {
      this.isListening = true;
      return;
    }

    // Web Speech API
    if (this.activeProvider === SpeechProviderType.WEB_SPEECH_API && this.isWebSpeechSupported()) {
      try {
        const SpeechConstructor = this.getSpeechRecognitionConstructor();
        if (!SpeechConstructor) {
          throw new Error('SpeechRecognition constructor unavailable');
        }

        const recognition = new SpeechConstructor();
        this.recognition = recognition;

        recognition.continuous = options.continuous ?? true;
        recognition.interimResults = options.interimResults ?? true;
        recognition.lang = this.getLocale(options.language);
        recognition.maxAlternatives = 3;

        // Apply processLocally if supported and requested
        if (options.preferLocalProcessing !== false && 'processLocally' in recognition) {
          try {
            recognition.processLocally = true;
          } catch {
            // Safe ignore if browser ignores setter
          }
        }

        recognition.onstart = () => {
          this.isListening = true;
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          let highestConfidence = 0.85;
          const alternatives: string[] = [];

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            const transcriptChunk = res[0]?.transcript || '';
            const conf = res[0]?.confidence || 0.85;
            if (conf > highestConfidence) highestConfidence = conf;

            for (let a = 0; a < Math.min(res.length, 3); a++) {
              if (res[a]?.transcript) {
                const altText = res[a].transcript.trim();
                if (altText && !alternatives.includes(altText)) {
                  alternatives.push(altText);
                }
              }
            }

            if (res.isFinal) {
              finalTranscript += transcriptChunk;
            } else {
              interimTranscript += transcriptChunk;
            }
          }

          const chosenText = finalTranscript.trim() || interimTranscript.trim();
          const isFinal = Boolean(finalTranscript.trim());

          if (chosenText) {
            this.lastKnownTranscript = chosenText;
            this.currentCallbacks?.onResult?.({
              transcript: chosenText,
              isFinal,
              confidence: highestConfidence,
              provider: SpeechProviderType.WEB_SPEECH_API,
              alternatives,
              rawEvent: event,
              isProcessedLocally: recognition.processLocally === true
            });
          }
        };

        recognition.onerror = (event: any) => {
          const rawError = event.error || 'unknown-error';
          console.warn('[STTService] Speech Recognition error caught:', rawError, event);

          let parsedCode: STTErrorPayload['code'] = 'unknown-error';
          let message = event.message || `Speech recognition error: ${rawError}`;
          let recoverable = true;

          switch (rawError) {
            case 'not-allowed':
            case 'permission-denied':
              parsedCode = 'not-allowed';
              message = 'Microphone permission was denied. Please allow microphone access to practice speech.';
              recoverable = false;
              // Fallback to Acoustic Engine
              this.activeProvider = SpeechProviderType.ACOUSTIC_PHONETIC;
              options.onProviderChange?.(this.activeProvider);
              break;

            case 'service-not-allowed':
              parsedCode = 'service-not-allowed';
              message = 'The browser speech recognition service is not permitted on this network or system.';
              recoverable = false;
              this.activeProvider = SpeechProviderType.ACOUSTIC_PHONETIC;
              options.onProviderChange?.(this.activeProvider);
              break;

            case 'language-not-supported':
              parsedCode = 'language-not-supported';
              message = `The requested language (${recognition.lang}) is not supported by your browser's speech recognition engine.`;
              recoverable = false;
              // Fallback to acoustic engine or default locale
              this.activeProvider = SpeechProviderType.ACOUSTIC_PHONETIC;
              options.onProviderChange?.(this.activeProvider);
              break;

            case 'network':
              parsedCode = 'network';
              message = 'Speech recognition network service error. Switching to on-device acoustic pipeline.';
              recoverable = false;
              this.activeProvider = SpeechProviderType.ACOUSTIC_PHONETIC;
              options.onProviderChange?.(this.activeProvider);
              break;

            case 'audio-capture':
              parsedCode = 'audio-capture';
              message = 'No microphone was found or audio capture failed. Ensure your mic is connected.';
              recoverable = false;
              break;

            case 'no-speech':
              parsedCode = 'no-speech';
              message = 'No speech detected within the timeout window.';
              recoverable = true;
              break;

            case 'aborted':
              parsedCode = 'aborted';
              message = 'Speech listening session was aborted.';
              recoverable = true;
              break;

            case 'bad-grammar':
              parsedCode = 'bad-grammar';
              message = 'Grammar parsing failed for speech recognition.';
              recoverable = false;
              break;

            default:
              parsedCode = 'unknown-error';
              break;
          }

          options.onError?.({
            code: parsedCode,
            message,
            provider: SpeechProviderType.WEB_SPEECH_API,
            recoverable,
            originalEvent: event
          });
        };

        recognition.onend = () => {
          this.isListening = false;

          // Check for Recognition Ending Unexpectedly
          // If the user did not invoke stopListening() (shouldBeListening is true)
          // and we haven't exceeded retry limits, handle graceful auto-recovery or finish
          if (this.shouldBeListening) {
            if (this.unexpectedEndRetryCount < this.maxUnexpectedRetries) {
              this.unexpectedEndRetryCount++;
              console.log(`[STTService] Recognition ended unexpectedly. Auto-recovering (attempt ${this.unexpectedEndRetryCount}/${this.maxUnexpectedRetries})...`);
              
              options.onUnexpectedEnd?.();

              this.retryTimeoutId = setTimeout(() => {
                if (this.shouldBeListening) {
                  try {
                    this.recognition?.start();
                    this.isListening = true;
                  } catch {
                    // If restarting native fails, switch gracefully to acoustic phonetic
                    this.activeProvider = SpeechProviderType.ACOUSTIC_PHONETIC;
                    options.onProviderChange?.(this.activeProvider);
                    options.onEnd?.();
                  }
                }
              }, 150);
              return;
            } else {
              // Finalize session if retries exhausted
              this.shouldBeListening = false;
              options.onEnd?.();
            }
          } else {
            options.onEnd?.();
          }
        };

        recognition.start();
        this.isListening = true;
        return;
      } catch (err: any) {
        console.warn('[STTService] Native SpeechRecognition start failed, falling back to Acoustic Engine:', err);
        this.activeProvider = SpeechProviderType.ACOUSTIC_PHONETIC;
        options.onProviderChange?.(this.activeProvider);
      }
    }

    // Fallback: Acoustic mode
    this.isListening = true;
  }

  /**
   * Stop Speech Recognition explicitly
   */
  public stopListening(): void {
    this.shouldBeListening = false;
    this.isListening = false;

    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        try {
          this.recognition.abort();
        } catch {
          // Safe ignore
        }
      }
      this.recognition = null;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public getLastKnownTranscript(): string {
    return this.lastKnownTranscript;
  }
}

export const sttService = new STTService();
