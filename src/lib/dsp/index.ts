/**
 * Digital Signal Processing (DSP) & Acoustic Extraction Engine
 * Provides pure mathematical & signal processing utilities for speech pathology:
 * - Time-domain & Frequency-domain feature extraction
 * - YIN / Autocorrelation fundamental vocal pitch (F0 in Hz) tracking
 * - Root-Mean-Square (RMS) Decibel calculation
 * - Spectral Centroid (timbre/sharpness) & Energy distribution
 * - Formant estimation (F1, F2) for vowel articulatory spaces
 */

export interface DspSignalMetrics {
  rmsDb: number;
  peakDb: number;
  pitchHz: number;
  pitchConfidence: number;
  spectralCentroidHz: number;
  spectralEnergyRatio: number;
  voiceOnsetDetected: boolean;
  snrEstimateDb: number;
}

export interface FormantFrequencies {
  f1Hz: number; // Tongue height (high vs low vowel)
  f2Hz: number; // Tongue backness (front vs back vowel)
  vowelEstimate?: string;
}

export class DspAudioProcessor {
  /**
   * Convert linear amplitude to calibrated Decibels (dB SPL relative)
   */
  public calculateRmsDecibels(buffer: Float32Array): number {
    let sumSquares = 0;
    for (let i = 0; i < buffer.length; i++) {
      sumSquares += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sumSquares / buffer.length);
    if (rms <= 0.00001) return 0;
    // Normalized 0-100 dB SPL clinical representation
    const db = 20 * Math.log10(rms) + 90;
    return Math.max(0, Math.min(100, Math.round(db)));
  }

  /**
   * Detect fundamental frequency (F0 in Hz) using normalized square difference autocorrelation (YIN-like)
   * Pediatric voice baseline: 120 Hz to 550 Hz
   */
  public detectPitchAutocorrelation(
    buffer: Float32Array,
    sampleRate: number,
    minFreq = 75,
    maxFreq = 600,
    threshold = 0.15
  ): { pitchHz: number; confidence: number } {
    const minPeriod = Math.floor(sampleRate / maxFreq);
    const maxPeriod = Math.floor(sampleRate / minFreq);
    const bufferSize = buffer.length;

    // Check if buffer has sufficient vocal energy
    let energy = 0;
    for (let i = 0; i < bufferSize; i++) {
      energy += buffer[i] * buffer[i];
    }
    if (energy < 0.001) {
      return { pitchHz: 0, confidence: 0 };
    }

    // Difference function
    const diff = new Float32Array(maxPeriod);
    for (let tau = 0; tau < maxPeriod; tau++) {
      for (let i = 0; i < bufferSize - maxPeriod; i++) {
        const delta = buffer[i] - buffer[i + tau];
        diff[tau] += delta * delta;
      }
    }

    // Cumulative mean normalized difference function (CMNDF)
    const cmndf = new Float32Array(maxPeriod);
    cmndf[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < maxPeriod; tau++) {
      runningSum += diff[tau];
      cmndf[tau] = diff[tau] / ((1 / tau) * runningSum || 1);
    }

    // Absolute thresholding
    let tauEstimate = -1;
    for (let tau = minPeriod; tau < maxPeriod; tau++) {
      if (cmndf[tau] < threshold) {
        while (tau + 1 < maxPeriod && cmndf[tau + 1] < cmndf[tau]) {
          tau++;
        }
        tauEstimate = tau;
        break;
      }
    }

    if (tauEstimate === -1) {
      // Fallback to absolute minimum within search space
      let minVal = 1.0;
      for (let tau = minPeriod; tau < maxPeriod; tau++) {
        if (cmndf[tau] < minVal) {
          minVal = cmndf[tau];
          tauEstimate = tau;
        }
      }
      if (minVal > 0.65) {
        return { pitchHz: 0, confidence: 0 }; // Unvoiced / noise
      }
    }

    // Parabolic interpolation for sub-bin frequency accuracy
    let finalTau = tauEstimate;
    if (tauEstimate > 0 && tauEstimate < maxPeriod - 1) {
      const s0 = cmndf[tauEstimate - 1];
      const s1 = cmndf[tauEstimate];
      const s2 = cmndf[tauEstimate + 1];
      const delta = (s2 - s0) / (2 * (2 * s1 - s2 - s0) || 1);
      if (Math.abs(delta) < 1) {
        finalTau += delta;
      }
    }

    const pitchHz = Math.round(sampleRate / finalTau);
    const confidence = Math.max(0, Math.min(1, 1 - cmndf[tauEstimate]));

    if (pitchHz < minFreq || pitchHz > maxFreq) {
      return { pitchHz: 0, confidence: 0 };
    }

    return { pitchHz, confidence };
  }

  /**
   * Spectral Centroid: Weighted center of mass of the frequency spectrum
   * Useful for diagnosing nasal resonance and consonant sibilance (e.g. /s/, /sh/, /z/)
   */
  public calculateSpectralCentroid(freqMagnitudes: Uint8Array | Float32Array, sampleRate: number): number {
    const binCount = freqMagnitudes.length;
    const nyquist = sampleRate / 2;
    const binWidthHz = nyquist / binCount;

    let weightedSum = 0;
    let totalMagnitude = 0;

    for (let i = 0; i < binCount; i++) {
      const magnitude = freqMagnitudes[i];
      const frequencyHz = i * binWidthHz;
      weightedSum += frequencyHz * magnitude;
      totalMagnitude += magnitude;
    }

    if (totalMagnitude === 0) return 0;
    return Math.round(weightedSum / totalMagnitude);
  }

  /**
   * Estimates vowel formant frequencies (F1 & F2) for articulatory vowel quadrilateral mapping
   */
  public estimateFormants(freqMagnitudes: Uint8Array | Float32Array, sampleRate: number): FormantFrequencies {
    const binCount = freqMagnitudes.length;
    const binWidthHz = (sampleRate / 2) / binCount;

    // Search F1 in 250Hz - 900Hz range
    let f1PeakMag = -1;
    let f1Hz = 500;
    const f1MinBin = Math.floor(250 / binWidthHz);
    const f1MaxBin = Math.floor(900 / binWidthHz);

    for (let i = f1MinBin; i <= f1MaxBin && i < binCount; i++) {
      if (freqMagnitudes[i] > f1PeakMag) {
        f1PeakMag = freqMagnitudes[i];
        f1Hz = Math.round(i * binWidthHz);
      }
    }

    // Search F2 in 950Hz - 2600Hz range
    let f2PeakMag = -1;
    let f2Hz = 1500;
    const f2MinBin = Math.floor(950 / binWidthHz);
    const f2MaxBin = Math.floor(2600 / binWidthHz);

    for (let i = f2MinBin; i <= f2MaxBin && i < binCount; i++) {
      if (freqMagnitudes[i] > f2PeakMag) {
        f2PeakMag = freqMagnitudes[i];
        f2Hz = Math.round(i * binWidthHz);
      }
    }

    // Simplified vowel inference based on Peterson & Barney vowel formant charts
    let vowelEstimate = 'Open Vowel';
    if (f1Hz < 400 && f2Hz > 2000) vowelEstimate = '/i/ (as in "see")';
    else if (f1Hz < 450 && f2Hz < 1100) vowelEstimate = '/u/ (as in "boot")';
    else if (f1Hz > 650 && f2Hz > 1200 && f2Hz < 1700) vowelEstimate = '/a/ (as in "father")';
    else if (f1Hz > 450 && f1Hz < 650 && f2Hz > 1700) vowelEstimate = '/e/ (as in "bed")';

    return { f1Hz, f2Hz, vowelEstimate };
  }
}

export const dspProcessor = new DspAudioProcessor();
