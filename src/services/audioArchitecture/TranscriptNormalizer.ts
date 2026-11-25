import { Language } from '../../types';

export interface NormalizedTranscriptResult {
  rawTranscript: string;
  normalizedTranscript: string;
  tokens: string[];
  detectedRepetitions: {
    repeatedUnit: string;
    count: number;
    unitType: 'sound' | 'part_word' | 'whole_word' | 'phrase';
    isPerseveration: boolean;
    durationMs: number;
  }[];
  language: Language;
}

/**
 * Stage 4: Transcript Normalization Layer
 * Cleans, tokenizes, and analyzes speech transcripts for dysfluencies / repetitions deterministically
 */
export class TranscriptNormalizer {
  /**
   * Bilingual normalization & tokenization
   */
  public normalize(rawTranscript: string, language: Language = Language.ENGLISH): NormalizedTranscriptResult {
    if (!rawTranscript) {
      return {
        rawTranscript: '',
        normalizedTranscript: '',
        tokens: [],
        detectedRepetitions: [],
        language,
      };
    }

    let cleaned = rawTranscript.toLowerCase().trim();

    // Expand common English contractions
    if (language === Language.ENGLISH) {
      cleaned = cleaned
        .replace(/can't/g, 'cannot')
        .replace(/won't/g, 'will not')
        .replace(/n't/g, ' not')
        .replace(/'re/g, ' are')
        .replace(/'s/g, ' is')
        .replace(/'d/g, ' would')
        .replace(/'ll/g, ' will')
        .replace(/'ve/g, ' have')
        .replace(/'m/g, ' am');
    }

    // Number word replacements
    cleaned = cleaned
      .replace(/\b1\b/g, language === Language.SPANISH ? 'uno' : 'one')
      .replace(/\b2\b/g, language === Language.SPANISH ? 'dos' : 'two')
      .replace(/\b3\b/g, language === Language.SPANISH ? 'tres' : 'three')
      .replace(/\b4\b/g, language === Language.SPANISH ? 'cuatro' : 'four')
      .replace(/\b5\b/g, language === Language.SPANISH ? 'cinco' : 'five');

    // Strip punctuation marks (including Spanish inverted ¡¿)
    cleaned = cleaned.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'<>¡¿+@]/g, ' ');

    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Diacritic normalization while preserving 'ñ'
    if (language === Language.SPANISH) {
      cleaned = cleaned
        .replace(/[áäàâ]/g, 'a')
        .replace(/[éëèê]/g, 'e')
        .replace(/[íïìî]/g, 'i')
        .replace(/[óöòô]/g, 'o')
        .replace(/[úüùû]/g, 'u');
    } else {
      cleaned = cleaned.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    const tokens = cleaned.split(' ').filter(Boolean);

    // 3. Detect Repetitions / Dysfluencies
    const detectedRepetitions = this.detectRepetitions(rawTranscript, tokens);

    return {
      rawTranscript,
      normalizedTranscript: cleaned,
      tokens,
      detectedRepetitions,
      language,
    };
  }

  /**
   * Deterministic Repetition and Dysfluency Detector
   * Detects:
   * 1. Whole-word repetitions (e.g. "ball ball ball", "the the cat")
   * 2. Part-word / syllable repetitions (e.g. "ba-ball", "b-b-baby")
   * 3. Phrase repetitions (e.g. "I want I want a car")
   */
  private detectRepetitions(
    rawText: string,
    tokens: string[]
  ): NormalizedTranscriptResult['detectedRepetitions'] {
    const repetitions: NormalizedTranscriptResult['detectedRepetitions'] = [];

    // 1. Check raw hyphenated or stuttered sound strings (e.g. "b-b-ball", "r-r-rabbit")
    const stutterRegex = /\b([a-zA-Z]{1,3})[-—\s]+(?:\1[-—\s]+)+([a-zA-Z]+)\b/gi;
    let match: RegExpExecArray | null;
    while ((match = stutterRegex.exec(rawText)) !== null) {
      const repeatedSound = match[1].toLowerCase();
      repetitions.push({
        repeatedUnit: repeatedSound,
        count: match[0].split(/[-—\s]+/).length - 1,
        unitType: repeatedSound.length === 1 ? 'sound' : 'part_word',
        isPerseveration: match[0].split(/[-—\s]+/).length > 3,
        durationMs: (match[0].split(/[-—\s]+/).length - 1) * 350,
      });
    }

    // 2. Check Whole-Word Repetitions in tokens
    let currentWord = '';
    let count = 1;

    for (let i = 0; i < tokens.length; i++) {
      const w = tokens[i];
      if (w === currentWord) {
        count++;
      } else {
        if (count > 1 && currentWord) {
          repetitions.push({
            repeatedUnit: currentWord,
            count,
            unitType: 'whole_word',
            isPerseveration: count > 3,
            durationMs: count * 400,
          });
        }
        currentWord = w;
        count = 1;
      }
    }

    if (count > 1 && currentWord) {
      repetitions.push({
        repeatedUnit: currentWord,
        count,
        unitType: 'whole_word',
        isPerseveration: count > 3,
        durationMs: count * 400,
      });
    }

    return repetitions;
  }
}

export const transcriptNormalizer = new TranscriptNormalizer();
