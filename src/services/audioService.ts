export interface AudioAnalyzerResult {
  db: number;
  pitch: number;
  spectralRatio: number;
}

class AudioService {
  private audioContext: AudioContext | null = null;

  /**
   * Safe getter or constructor for AudioContext
   */
  public getOrCreateContext(): AudioContext {
    if (typeof window === 'undefined') {
      throw new Error('AudioContext is not supported in non-browser environments');
    }
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
    }
    return this.audioContext;
  }

  /**
   * Resumes context if suspended (common browser restriction)
   */
  public async resumeContext(): Promise<void> {
    const ctx = this.getOrCreateContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  /**
   * Pitch Tracking via Autocorrelation algorithm (YIN-like time domain check)
   */
  public detectPitch(timeDomainData: Float32Array, sampleRate: number, minFreq = 80, maxFreq = 650, threshold = 0.15): number {
    const size = timeDomainData.length;
    const r = new Float32Array(size);

    // Compute autocorrelation
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size - i; j++) {
        r[i] += timeDomainData[j] * timeDomainData[j + i];
      }
    }

    // Find the first zero crossing or valley
    let d = 0;
    while (d < size - 1 && r[d] > r[d + 1]) {
      d++;
    }

    // Find absolute maximum peak after valley
    let maxval = -1;
    let maxpos = -1;
    for (let i = d; i < size - 1; i++) {
      if (r[i] > r[i - 1] && r[i] > r[i + 1]) {
        if (r[i] > maxval) {
          maxval = r[i];
          maxpos = i;
        }
      }
    }

    // Convert peak position to frequency
    if (maxpos !== -1 && maxval > threshold) {
      const pitch = sampleRate / maxpos;
      if (pitch >= minFreq && pitch <= maxFreq) {
        return pitch;
      }
    }

    return -1;
  }

  /**
   * Computes Root-Mean-Square (RMS) and decibels from time domain buffer
   */
  public calculateDecibels(timeDomainData: Float32Array): number {
    let sumSquares = 0;
    for (let i = 0; i < timeDomainData.length; i++) {
      sumSquares += timeDomainData[i] * timeDomainData[i];
    }
    const rms = Math.sqrt(sumSquares / timeDomainData.length);
    // Standard conversion to dB (with noise floor of -100dB)
    return rms > 0 ? 20 * Math.log10(rms) + 90 : 0;
  }

  /**
   * Analyzes spectral energy levels (e.g. low voice vs high fricatives)
   */
  public analyzeSpectralEnergy(frequencyData: Uint8Array, sampleRate: number): { lowEnergy: number; highEnergy: number; ratio: number } {
    const totalBins = frequencyData.length;
    const hzPerBin = sampleRate / (totalBins * 2);
    let lowEnergy = 0;
    let highEnergy = 0;

    for (let i = 0; i < totalBins; i++) {
      const freq = i * hzPerBin;
      const val = frequencyData[i];
      if (freq < 1500) {
        lowEnergy += val;
      } else {
        highEnergy += val;
      }
    }

    const total = lowEnergy + highEnergy;
    const ratio = total > 0 ? highEnergy / total : 0;

    return { lowEnergy, highEnergy, ratio };
  }

  /**
   * Play a synthetically generated tone of standard frequency and duration (e.g., metronome pace sound, achievement beep, or error prompt)
   */
  public playTone(frequency: number, durationSeconds: number, type: OscillatorType = 'sine', volume = 0.1): void {
    try {
      const ctx = this.getOrCreateContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.value = frequency;

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      // Clean decay curve to prevent audio pop clicks
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSeconds);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationSeconds);
    } catch (e) {
      console.warn('Tone synthesis is disabled or blocked:', e);
    }
  }

  /**
   * Play simple diagnostic beeps (success vs error sound triggers)
   */
  public playSuccessTone(): void {
    this.playTone(880, 0.15, 'sine', 0.12); // High A pitch
    setTimeout(() => this.playTone(1320, 0.25, 'sine', 0.08), 100); // E pitch chord
  }

  public playErrorTone(): void {
    this.playTone(220, 0.3, 'sawtooth', 0.15); // Low buzz tone
  }
}

export const audioService = new AudioService();
