import { Language } from '../types';

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  voiceName?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (e: any) => void;
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
    }
  }

  public isSupported(): boolean {
    return !!this.synth;
  }

  public cancel(): void {
    if (this.synth) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public speak(text: string, language: Language = Language.ENGLISH, options: SpeakOptions = {}): void {
    if (!this.synth) {
      console.warn('Speech synthesis not supported in this environment');
      options.onError?.(new Error('Speech synthesis not supported'));
      return;
    }

    // Cancel ongoing speech to avoid overlaps
    this.synth.cancel();

    const runSpeak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      const langCode = language === Language.SPANISH ? 'es-ES' : 'en-US';
      utterance.lang = langCode;

      const voices = this.synth!.getVoices();
      
      // Look for custom voice or search default friendly female voice
      if (options.voiceName) {
        const found = voices.find(v => v.name === options.voiceName);
        if (found) utterance.voice = found;
      }

      if (!utterance.voice) {
        const femaleKeywords = ['female', 'samantha', 'victoria', 'monica', 'google us english', 'google español', 'helena', 'zira', 'karen'];
        const femaleVoice = voices.find(v => {
          const name = v.name.toLowerCase();
          const lang = v.lang.toLowerCase();
          return lang.startsWith(langCode.split('-')[0]) && 
                 femaleKeywords.some(keyword => name.includes(keyword));
        });

        if (femaleVoice) {
          utterance.voice = femaleVoice;
        } else {
          const fallbackVoice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
          if (fallbackVoice) utterance.voice = fallbackVoice;
        }
      }

      // Configure parameters
      utterance.rate = options.rate ?? 0.9; // slower rate is generally better for speech therapy
      utterance.pitch = options.pitch ?? 1.1; // slightly higher/friendlier child pitch

      // Setup callbacks
      if (options.onStart) utterance.onstart = options.onStart;
      if (options.onEnd) utterance.onend = options.onEnd;
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        options.onError?.(e);
      };

      this.synth!.speak(utterance);
    };

    // Chrome/Safari voice lazy-loading workaround
    if (this.synth.getVoices().length === 0) {
      this.synth.onvoiceschanged = () => {
        if (this.synth) this.synth.onvoiceschanged = null;
        runSpeak();
      };
      setTimeout(runSpeak, 100);
    } else {
      runSpeak();
    }
  }
}

export const speechService = new SpeechService();
