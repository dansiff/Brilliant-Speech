import { Language } from '../../types';
import { PhonemeUnit } from './types';

/**
 * Phoneme Knowledge Base (CMU / Arpabet & IPA mapping for English and Spanish)
 */
export const PHONEME_MAP: Record<string, PhonemeUnit> = {
  // Consonants - Stops
  P: { symbol: 'P', ipa: 'p', type: 'stop', voiced: false, placeOfArticulation: 'bilabial', mannerOfArticulation: 'plosive' },
  B: { symbol: 'B', ipa: 'b', type: 'stop', voiced: true, placeOfArticulation: 'bilabial', mannerOfArticulation: 'plosive' },
  T: { symbol: 'T', ipa: 't', type: 'stop', voiced: false, placeOfArticulation: 'alveolar', mannerOfArticulation: 'plosive' },
  D: { symbol: 'D', ipa: 'd', type: 'stop', voiced: true, placeOfArticulation: 'alveolar', mannerOfArticulation: 'plosive' },
  K: { symbol: 'K', ipa: 'k', type: 'stop', voiced: false, placeOfArticulation: 'velar', mannerOfArticulation: 'plosive' },
  G: { symbol: 'G', ipa: 'ɡ', type: 'stop', voiced: true, placeOfArticulation: 'velar', mannerOfArticulation: 'plosive' },

  // Fricatives
  F: { symbol: 'F', ipa: 'f', type: 'fricative', voiced: false, placeOfArticulation: 'labiodental', mannerOfArticulation: 'fricative' },
  V: { symbol: 'V', ipa: 'v', type: 'fricative', voiced: true, placeOfArticulation: 'labiodental', mannerOfArticulation: 'fricative' },
  TH: { symbol: 'TH', ipa: 'θ', type: 'fricative', voiced: false, placeOfArticulation: 'dental', mannerOfArticulation: 'fricative' },
  DH: { symbol: 'DH', ipa: 'ð', type: 'fricative', voiced: true, placeOfArticulation: 'dental', mannerOfArticulation: 'fricative' },
  S: { symbol: 'S', ipa: 's', type: 'fricative', voiced: false, placeOfArticulation: 'alveolar', mannerOfArticulation: 'fricative' },
  Z: { symbol: 'Z', ipa: 'z', type: 'fricative', voiced: true, placeOfArticulation: 'alveolar', mannerOfArticulation: 'fricative' },
  SH: { symbol: 'SH', ipa: 'ʃ', type: 'fricative', voiced: false, placeOfArticulation: 'postalveolar', mannerOfArticulation: 'fricative' },
  ZH: { symbol: 'ZH', ipa: 'ʒ', type: 'fricative', voiced: true, placeOfArticulation: 'postalveolar', mannerOfArticulation: 'fricative' },
  HH: { symbol: 'HH', ipa: 'h', type: 'fricative', voiced: false, placeOfArticulation: 'glottal', mannerOfArticulation: 'fricative' },

  // Affricates
  CH: { symbol: 'CH', ipa: 'tʃ', type: 'affricate', voiced: false, placeOfArticulation: 'postalveolar', mannerOfArticulation: 'affricate' },
  JH: { symbol: 'JH', ipa: 'dʒ', type: 'affricate', voiced: true, placeOfArticulation: 'postalveolar', mannerOfArticulation: 'affricate' },

  // Nasals
  M: { symbol: 'M', ipa: 'm', type: 'nasal', voiced: true, placeOfArticulation: 'bilabial', mannerOfArticulation: 'nasal' },
  N: { symbol: 'N', ipa: 'n', type: 'nasal', voiced: true, placeOfArticulation: 'alveolar', mannerOfArticulation: 'nasal' },
  NG: { symbol: 'NG', ipa: 'ŋ', type: 'nasal', voiced: true, placeOfArticulation: 'velar', mannerOfArticulation: 'nasal' },
  NY: { symbol: 'NY', ipa: 'ɲ', type: 'nasal', voiced: true, placeOfArticulation: 'palatal', mannerOfArticulation: 'nasal' }, // Spanish 'ñ'

  // Liquids & Glides (Approximants)
  L: { symbol: 'L', ipa: 'l', type: 'liquid', voiced: true, placeOfArticulation: 'alveolar', mannerOfArticulation: 'lateral' },
  R: { symbol: 'R', ipa: 'ɹ', type: 'liquid', voiced: true, placeOfArticulation: 'alveolar', mannerOfArticulation: 'approximant' },
  RR: { symbol: 'RR', ipa: 'r', type: 'liquid', voiced: true, placeOfArticulation: 'alveolar', mannerOfArticulation: 'trill' }, // Spanish trill 'rr'
  W: { symbol: 'W', ipa: 'w', type: 'glide', voiced: true, placeOfArticulation: 'bilabial', mannerOfArticulation: 'glide' },
  Y: { symbol: 'Y', ipa: 'j', type: 'glide', voiced: true, placeOfArticulation: 'palatal', mannerOfArticulation: 'glide' },

  // Vowels - Monophthongs
  IY: { symbol: 'IY', ipa: 'i', type: 'vowel', voiced: true, placeOfArticulation: 'front-high', mannerOfArticulation: 'vowel' },
  IH: { symbol: 'IH', ipa: 'ɪ', type: 'vowel', voiced: true, placeOfArticulation: 'front-high', mannerOfArticulation: 'vowel' },
  EY: { symbol: 'EY', ipa: 'eɪ', type: 'diphthong', voiced: true, placeOfArticulation: 'front-mid', mannerOfArticulation: 'vowel' },
  EH: { symbol: 'EH', ipa: 'ɛ', type: 'vowel', voiced: true, placeOfArticulation: 'front-mid', mannerOfArticulation: 'vowel' },
  AE: { symbol: 'AE', ipa: 'æ', type: 'vowel', voiced: true, placeOfArticulation: 'front-low', mannerOfArticulation: 'vowel' },
  AA: { symbol: 'AA', ipa: 'ɑ', type: 'vowel', voiced: true, placeOfArticulation: 'back-low', mannerOfArticulation: 'vowel' },
  AO: { symbol: 'AO', ipa: 'ɔ', type: 'vowel', voiced: true, placeOfArticulation: 'back-mid', mannerOfArticulation: 'vowel' },
  OW: { symbol: 'OW', ipa: 'oʊ', type: 'diphthong', voiced: true, placeOfArticulation: 'back-mid', mannerOfArticulation: 'vowel' },
  UH: { symbol: 'UH', ipa: 'ʊ', type: 'vowel', voiced: true, placeOfArticulation: 'back-high', mannerOfArticulation: 'vowel' },
  UW: { symbol: 'UW', ipa: 'u', type: 'vowel', voiced: true, placeOfArticulation: 'back-high', mannerOfArticulation: 'vowel' },
  AH: { symbol: 'AH', ipa: 'ʌ', type: 'vowel', voiced: true, placeOfArticulation: 'central-mid', mannerOfArticulation: 'vowel' },
  AX: { symbol: 'AX', ipa: 'ə', type: 'vowel', voiced: true, placeOfArticulation: 'central-mid', mannerOfArticulation: 'vowel' },
  ER: { symbol: 'ER', ipa: 'ɝ', type: 'vowel', voiced: true, placeOfArticulation: 'central-rhotic', mannerOfArticulation: 'vowel' },

  // Diphthongs
  AY: { symbol: 'AY', ipa: 'aɪ', type: 'diphthong', voiced: true, placeOfArticulation: 'diphthong', mannerOfArticulation: 'vowel' },
  AW: { symbol: 'AW', ipa: 'aʊ', type: 'diphthong', voiced: true, placeOfArticulation: 'diphthong', mannerOfArticulation: 'vowel' },
  OY: { symbol: 'OY', ipa: 'ɔɪ', type: 'diphthong', voiced: true, placeOfArticulation: 'diphthong', mannerOfArticulation: 'vowel' },

  // Spanish 5-vowel system
  ES_A: { symbol: 'ES_A', ipa: 'a', type: 'vowel', voiced: true, placeOfArticulation: 'open', mannerOfArticulation: 'vowel' },
  ES_E: { symbol: 'ES_E', ipa: 'e', type: 'vowel', voiced: true, placeOfArticulation: 'mid-front', mannerOfArticulation: 'vowel' },
  ES_I: { symbol: 'ES_I', ipa: 'i', type: 'vowel', voiced: true, placeOfArticulation: 'close-front', mannerOfArticulation: 'vowel' },
  ES_O: { symbol: 'ES_O', ipa: 'o', type: 'vowel', voiced: true, placeOfArticulation: 'mid-back', mannerOfArticulation: 'vowel' },
  ES_U: { symbol: 'ES_U', ipa: 'u', type: 'vowel', voiced: true, placeOfArticulation: 'close-back', mannerOfArticulation: 'vowel' },
};

/**
 * Built-in Core Speech Vocabulary Phonetic Pronunciation Lexicon
 */
export const CORE_LEXICON_EN: Record<string, { phonemes: string[]; ipa: string }> = {
  rabbit: { phonemes: ['R', 'AE', 'B', 'IH', 'T'], ipa: '/ˈɹæbɪt/' },
  wabbit: { phonemes: ['W', 'AE', 'B', 'IH', 'T'], ipa: '/ˈwæbɪt/' },
  red: { phonemes: ['R', 'EH', 'D'], ipa: '/ɹɛd/' },
  wed: { phonemes: ['W', 'EH', 'D'], ipa: '/wɛd/' },
  run: { phonemes: ['R', 'AH', 'N'], ipa: '/ɹʌn/' },
  sun: { phonemes: ['S', 'AH', 'N'], ipa: '/sʌn/' },
  thun: { phonemes: ['TH', 'AH', 'N'], ipa: '/θʌn/' },
  snake: { phonemes: ['S', 'N', 'EY', 'K'], ipa: '/sneɪk/' },
  thnake: { phonemes: ['TH', 'N', 'EY', 'K'], ipa: '/θneɪk/' },
  nake: { phonemes: ['N', 'EY', 'K'], ipa: '/neɪk/' },
  stop: { phonemes: ['S', 'T', 'AA', 'P'], ipa: '/stɑp/' },
  top: { phonemes: ['T', 'AA', 'P'], ipa: '/tɑp/' },
  star: { phonemes: ['S', 'T', 'AA', 'R'], ipa: '/stɑɹ/' },
  tar: { phonemes: ['T', 'AA', 'R'], ipa: '/tɑɹ/' },
  cat: { phonemes: ['K', 'AE', 'T'], ipa: '/kæt/' },
  tat: { phonemes: ['T', 'AE', 'T'], ipa: '/tæt/' },
  ca: { phonemes: ['K', 'AE'], ipa: '/kæ/' },
  dog: { phonemes: ['D', 'AO', 'G'], ipa: '/dɔɡ/' },
  gog: { phonemes: ['G', 'AO', 'G'], ipa: '/ɡɔɡ/' },
  do: { phonemes: ['D', 'UW'], ipa: '/du/' },
  fish: { phonemes: ['F', 'IH', 'SH'], ipa: '/fɪʃ/' },
  pish: { phonemes: ['P', 'IH', 'SH'], ipa: '/pɪʃ/' },
  fit: { phonemes: ['F', 'IH', 'T'], ipa: '/fɪt/' },
  blue: { phonemes: ['B', 'L', 'UW'], ipa: '/blu/' },
  bue: { phonemes: ['B', 'UW'], ipa: '/bu/' },
  balue: { phonemes: ['B', 'AH', 'L', 'UW'], ipa: '/bəˈlu/' },
  ball: { phonemes: ['B', 'AO', 'L'], ipa: '/bɔl/' },
  tree: { phonemes: ['T', 'R', 'IY'], ipa: '/tɹi/' },
  twee: { phonemes: ['T', 'W', 'IY'], ipa: '/twi/' },
  tee: { phonemes: ['T', 'IY'], ipa: '/ti/' },
  water: { phonemes: ['W', 'AO', 'T', 'ER'], ipa: '/ˈwɔtɚ/' },
  banana: { phonemes: ['B', 'AX', 'N', 'AE', 'N', 'AX'], ipa: '/bəˈnænə/' },
  nana: { phonemes: ['N', 'AE', 'N', 'AX'], ipa: '/ˈnænə/' },
  apple: { phonemes: ['AE', 'P', 'AX', 'L'], ipa: '/ˈæpəl/' },
  cookie: { phonemes: ['K', 'UH', 'K', 'IY'], ipa: '/ˈkʊki/' },
  tootie: { phonemes: ['T', 'UH', 'T', 'IY'], ipa: '/ˈtʊti/' },
  train: { phonemes: ['T', 'R', 'EY', 'N'], ipa: '/tɹeɪn/' },
  twain: { phonemes: ['T', 'W', 'EY', 'N'], ipa: '/tweɪn/' },
  spoon: { phonemes: ['S', 'P', 'UW', 'N'], ipa: '/spun/' },
  poon: { phonemes: ['P', 'UW', 'N'], ipa: '/pun/' },
  shoe: { phonemes: ['SH', 'UW'], ipa: '/ʃu/' },
  sue: { phonemes: ['S', 'UW'], ipa: '/su/' },
  chair: { phonemes: ['CH', 'EH', 'R'], ipa: '/tʃɛɹ/' },
  tair: { phonemes: ['T', 'EH', 'R'], ipa: '/tɛɹ/' },
  jump: { phonemes: ['JH', 'AH', 'M', 'P'], ipa: '/dʒʌmp/' },
  yump: { phonemes: ['Y', 'AH', 'M', 'P'], ipa: '/jʌmp/' },
  duck: { phonemes: ['D', 'AH', 'K'], ipa: '/dʌk/' },
  dut: { phonemes: ['D', 'AH', 'T'], ipa: '/dʌt/' },
  car: { phonemes: ['K', 'AA', 'R'], ipa: '/kɑɹ/' },
  tar_car: { phonemes: ['T', 'AA', 'R'], ipa: '/tɑɹ/' },
  lion: { phonemes: ['L', 'AY', 'AX', 'N'], ipa: '/ˈlaɪən/' },
  yion: { phonemes: ['Y', 'AY', 'AX', 'N'], ipa: '/ˈjaɪən/' },
  zebra: { phonemes: ['Z', 'IY', 'B', 'R', 'AX'], ipa: '/ˈzibɹə/' },
  sebra: { phonemes: ['S', 'IY', 'B', 'R', 'AX'], ipa: '/ˈsibɹə/' },
  monkey: { phonemes: ['M', 'AH', 'NG', 'K', 'IY'], ipa: '/ˈmʌŋki/' },
  elephant: { phonemes: ['EH', 'L', 'AX', 'F', 'AX', 'N', 'T'], ipa: '/ˈɛləfənt/' },
  bubble: { phonemes: ['B', 'AH', 'B', 'AX', 'L'], ipa: '/ˈbʌbəl/' },
  happy: { phonemes: ['HH', 'AE', 'P', 'IY'], ipa: '/ˈhæpi/' },
};

export const CORE_LEXICON_ES: Record<string, { phonemes: string[]; ipa: string }> = {
  perro: { phonemes: ['P', 'ES_E', 'RR', 'ES_O'], ipa: '/ˈpero/' },
  pero: { phonemes: ['P', 'ES_E', 'R', 'ES_O'], ipa: '/ˈpeɾo/' },
  raton: { phonemes: ['RR', 'ES_A', 'T', 'ES_O', 'N'], ipa: '/raˈton/' },
  waton: { phonemes: ['W', 'ES_A', 'T', 'ES_O', 'N'], ipa: '/waˈton/' },
  gato: { phonemes: ['G', 'ES_A', 'T', 'ES_O'], ipa: '/ˈɡato/' },
  tato: { phonemes: ['T', 'ES_A', 'T', 'ES_O'], ipa: '/ˈtato/' },
  sol: { phonemes: ['S', 'ES_O', 'L'], ipa: '/sol/' },
  tol: { phonemes: ['T', 'ES_O', 'L'], ipa: '/tol/' },
  casa: { phonemes: ['K', 'ES_A', 'S', 'ES_A'], ipa: '/ˈkasa/' },
  tasa: { phonemes: ['T', 'ES_A', 'S', 'ES_A'], ipa: '/ˈtasa/' },
  agua: { phonemes: ['ES_A', 'G', 'W', 'ES_A'], ipa: '/ˈaɡwa/' },
  pato: { phonemes: ['P', 'ES_A', 'T', 'ES_O'], ipa: '/ˈpato/' },
  zapato: { phonemes: ['S', 'ES_A', 'P', 'ES_A', 'T', 'ES_O'], ipa: '/saˈpato/' },
  arbol: { phonemes: ['ES_A', 'R', 'B', 'ES_O', 'L'], ipa: '/ˈaɾβol/' },
  flor: { phonemes: ['F', 'L', 'ES_O', 'R'], ipa: '/floɾ/' },
  luna: { phonemes: ['L', 'ES_U', 'N', 'ES_A'], ipa: '/ˈluna/' },
  leche: { phonemes: ['L', 'ES_E', 'CH', 'ES_E'], ipa: '/ˈletʃe/' },
  nino: { phonemes: ['N', 'ES_I', 'NY', 'ES_O'], ipa: '/ˈniɲo/' },
  mesa: { phonemes: ['M', 'ES_E', 'S', 'ES_A'], ipa: '/ˈmesa/' },
  boca: { phonemes: ['B', 'ES_O', 'K', 'ES_A'], ipa: '/ˈboka/' },
};

/**
 * Phonetic Dictionary and Grapheme-to-Phoneme (G2P) Service
 */
export class PhoneticDictionary {
  /**
   * Deterministic Grapheme to Phonemes (G2P) Rule Engine
   */
  public getPhonemesForWord(rawWord: string, language: Language = Language.ENGLISH): { phonemes: string[]; ipa: string } {
    const word = rawWord.toLowerCase().trim().replace(/[^a-záéíóúñ]/g, '');
    if (!word) {
      return { phonemes: [], ipa: '' };
    }

    // 1. Check exact lexicon lookup
    const lexicon = language === Language.SPANISH ? CORE_LEXICON_ES : CORE_LEXICON_EN;
    if (lexicon[word]) {
      return lexicon[word];
    }

    // 2. Rule-based G2P Transduction for unseen words
    if (language === Language.SPANISH) {
      return this.transduceSpanishG2P(word);
    } else {
      return this.transduceEnglishG2P(word);
    }
  }

  /**
   * Transduce English orthography to Arpabet phonemes & IPA
   */
  private transduceEnglishG2P(word: string): { phonemes: string[]; ipa: string } {
    const phonemes: string[] = [];
    const ipaParts: string[] = [];
    let i = 0;

    while (i < word.length) {
      const c = word[i];
      const next = word[i + 1] || '';
      const pair = c + next;

      // Digraph rules
      if (pair === 'sh') {
        phonemes.push('SH');
        ipaParts.push('ʃ');
        i += 2;
      } else if (pair === 'ch') {
        phonemes.push('CH');
        ipaParts.push('tʃ');
        i += 2;
      } else if (pair === 'th') {
        phonemes.push('TH');
        ipaParts.push('θ');
        i += 2;
      } else if (pair === 'ph') {
        phonemes.push('F');
        ipaParts.push('f');
        i += 2;
      } else if (pair === 'wh') {
        phonemes.push('W');
        ipaParts.push('w');
        i += 2;
      } else if (pair === 'ck') {
        phonemes.push('K');
        ipaParts.push('k');
        i += 2;
      } else if (pair === 'ng') {
        phonemes.push('NG');
        ipaParts.push('ŋ');
        i += 2;
      } else if (pair === 'ee' || pair === 'ea') {
        phonemes.push('IY');
        ipaParts.push('i');
        i += 2;
      } else if (pair === 'oo') {
        phonemes.push('UW');
        ipaParts.push('u');
        i += 2;
      } else if (pair === 'ai' || pair === 'ay') {
        phonemes.push('EY');
        ipaParts.push('eɪ');
        i += 2;
      } else if (pair === 'ou' || pair === 'ow') {
        phonemes.push('AW');
        ipaParts.push('aʊ');
        i += 2;
      } else if (pair === 'oi' || pair === 'oy') {
        phonemes.push('OY');
        ipaParts.push('ɔɪ');
        i += 2;
      } else {
        // Single character rules
        switch (c) {
          case 'a':
            phonemes.push('AE');
            ipaParts.push('æ');
            break;
          case 'b':
            phonemes.push('B');
            ipaParts.push('b');
            break;
          case 'c':
            if (next === 'e' || next === 'i' || next === 'y') {
              phonemes.push('S');
              ipaParts.push('s');
            } else {
              phonemes.push('K');
              ipaParts.push('k');
            }
            break;
          case 'd':
            phonemes.push('D');
            ipaParts.push('d');
            break;
          case 'e':
            if (i === word.length - 1 && word.length > 2) {
              // Silent final 'e'
            } else {
              phonemes.push('EH');
              ipaParts.push('ɛ');
            }
            break;
          case 'f':
            phonemes.push('F');
            ipaParts.push('f');
            break;
          case 'g':
            if (next === 'e' || next === 'i') {
              phonemes.push('JH');
              ipaParts.push('dʒ');
            } else {
              phonemes.push('G');
              ipaParts.push('ɡ');
            }
            break;
          case 'h':
            phonemes.push('HH');
            ipaParts.push('h');
            break;
          case 'i':
            phonemes.push('IH');
            ipaParts.push('ɪ');
            break;
          case 'j':
            phonemes.push('JH');
            ipaParts.push('dʒ');
            break;
          case 'k':
            phonemes.push('K');
            ipaParts.push('k');
            break;
          case 'l':
            phonemes.push('L');
            ipaParts.push('l');
            break;
          case 'm':
            phonemes.push('M');
            ipaParts.push('m');
            break;
          case 'n':
            phonemes.push('N');
            ipaParts.push('n');
            break;
          case 'o':
            phonemes.push('AA');
            ipaParts.push('ɑ');
            break;
          case 'p':
            phonemes.push('P');
            ipaParts.push('p');
            break;
          case 'q':
            phonemes.push('K');
            ipaParts.push('k');
            break;
          case 'r':
            phonemes.push('R');
            ipaParts.push('ɹ');
            break;
          case 's':
            phonemes.push('S');
            ipaParts.push('s');
            break;
          case 't':
            phonemes.push('T');
            ipaParts.push('t');
            break;
          case 'u':
            phonemes.push('AH');
            ipaParts.push('ʌ');
            break;
          case 'v':
            phonemes.push('V');
            ipaParts.push('v');
            break;
          case 'w':
            phonemes.push('W');
            ipaParts.push('w');
            break;
          case 'x':
            phonemes.push('K', 'S');
            ipaParts.push('ks');
            break;
          case 'y':
            if (i === 0) {
              phonemes.push('Y');
              ipaParts.push('j');
            } else {
              phonemes.push('IY');
              ipaParts.push('i');
            }
            break;
          case 'z':
            phonemes.push('Z');
            ipaParts.push('z');
            break;
          default:
            break;
        }
        i++;
      }
    }

    return {
      phonemes,
      ipa: `/${ipaParts.join('')}/`,
    };
  }

  /**
   * Transduce Spanish regular orthography to phonemes & IPA
   */
  private transduceSpanishG2P(word: string): { phonemes: string[]; ipa: string } {
    const phonemes: string[] = [];
    const ipaParts: string[] = [];
    let i = 0;

    while (i < word.length) {
      const c = word[i];
      const next = word[i + 1] || '';
      const pair = c + next;

      if (pair === 'ch') {
        phonemes.push('CH');
        ipaParts.push('tʃ');
        i += 2;
      } else if (pair === 'rr') {
        phonemes.push('RR');
        ipaParts.push('r');
        i += 2;
      } else if (pair === 'll') {
        phonemes.push('Y');
        ipaParts.push('ʝ');
        i += 2;
      } else if (pair === 'gu' && (word[i + 2] === 'e' || word[i + 2] === 'i')) {
        phonemes.push('G');
        ipaParts.push('ɡ');
        i += 2;
      } else if (pair === 'qu' && (word[i + 2] === 'e' || word[i + 2] === 'i')) {
        phonemes.push('K');
        ipaParts.push('k');
        i += 2;
      } else {
        switch (c) {
          case 'a':
          case 'á':
            phonemes.push('ES_A');
            ipaParts.push('a');
            break;
          case 'e':
          case 'é':
            phonemes.push('ES_E');
            ipaParts.push('e');
            break;
          case 'i':
          case 'í':
            phonemes.push('ES_I');
            ipaParts.push('i');
            break;
          case 'o':
          case 'ó':
            phonemes.push('ES_O');
            ipaParts.push('o');
            break;
          case 'u':
          case 'ú':
          case 'ü':
            phonemes.push('ES_U');
            ipaParts.push('u');
            break;
          case 'ñ':
            phonemes.push('NY');
            ipaParts.push('ɲ');
            break;
          case 'b':
          case 'v':
            phonemes.push('B');
            ipaParts.push('b');
            break;
          case 'c':
            if (next === 'e' || next === 'i') {
              phonemes.push('S');
              ipaParts.push('s');
            } else {
              phonemes.push('K');
              ipaParts.push('k');
            }
            break;
          case 'd':
            phonemes.push('D');
            ipaParts.push('d');
            break;
          case 'f':
            phonemes.push('F');
            ipaParts.push('f');
            break;
          case 'g':
            if (next === 'e' || next === 'i') {
              phonemes.push('HH');
              ipaParts.push('x');
            } else {
              phonemes.push('G');
              ipaParts.push('ɡ');
            }
            break;
          case 'h':
            // Spanish 'h' is silent
            break;
          case 'j':
            phonemes.push('HH');
            ipaParts.push('x');
            break;
          case 'k':
            phonemes.push('K');
            ipaParts.push('k');
            break;
          case 'l':
            phonemes.push('L');
            ipaParts.push('l');
            break;
          case 'm':
            phonemes.push('M');
            ipaParts.push('m');
            break;
          case 'n':
            phonemes.push('N');
            ipaParts.push('n');
            break;
          case 'p':
            phonemes.push('P');
            ipaParts.push('p');
            break;
          case 'r':
            if (i === 0) {
              phonemes.push('RR');
              ipaParts.push('r');
            } else {
              phonemes.push('R');
              ipaParts.push('ɾ');
            }
            break;
          case 's':
          case 'z':
            phonemes.push('S');
            ipaParts.push('s');
            break;
          case 't':
            phonemes.push('T');
            ipaParts.push('t');
            break;
          case 'w':
            phonemes.push('W');
            ipaParts.push('w');
            break;
          case 'x':
            phonemes.push('K', 'S');
            ipaParts.push('ks');
            break;
          case 'y':
            phonemes.push('Y');
            ipaParts.push('ʝ');
            break;
          default:
            break;
        }
        i++;
      }
    }

    return {
      phonemes,
      ipa: `/${ipaParts.join('')}/`,
    };
  }

  /**
   * Diagnostic Phonological Error Process Identifier
   */
  public identifyPhonologicalProcess(targetPhoneme: string, recognizedPhoneme: string): string {
    const t = PHONEME_MAP[targetPhoneme];
    const r = PHONEME_MAP[recognizedPhoneme];

    if (!t || !r) {
      if (targetPhoneme === 'R' && recognizedPhoneme === 'W') return 'Gliding (/r/ → /w/)';
      if (targetPhoneme === 'L' && recognizedPhoneme === 'W') return 'Gliding (/l/ → /w/)';
      if (targetPhoneme === 'S' && recognizedPhoneme === 'TH') return 'Fronting / Interdental Lisp';
      return `Sound substitution (${targetPhoneme} → ${recognizedPhoneme})`;
    }

    // Fronting (velar or palatal produced as alveolar)
    if ((t.placeOfArticulation === 'velar' || t.placeOfArticulation === 'postalveolar') && 
        (r.placeOfArticulation === 'alveolar' || r.placeOfArticulation === 'bilabial')) {
      return `Fronting (${t.ipa} → ${r.ipa})`;
    }

    // Backing (alveolar produced as velar)
    if (t.placeOfArticulation === 'alveolar' && r.placeOfArticulation === 'velar') {
      return `Backing (${t.ipa} → ${r.ipa})`;
    }

    // Stopping (fricative or affricate produced as stop)
    if ((t.mannerOfArticulation === 'fricative' || t.mannerOfArticulation === 'affricate') && 
        r.mannerOfArticulation === 'plosive') {
      return `Stopping (${t.ipa} → ${r.ipa})`;
    }

    // Gliding (liquid produced as glide)
    if (t.type === 'liquid' && r.type === 'glide') {
      return `Gliding (${t.ipa} → ${r.ipa})`;
    }

    // Deaffrication (affricate produced as fricative or stop)
    if (t.type === 'affricate' && (r.type === 'fricative' || r.type === 'stop')) {
      return `Deaffrication (${t.ipa} → ${r.ipa})`;
    }

    // Voicing / Devoicing
    if (t.voiced !== r.voiced) {
      return t.voiced ? `Devoicing (${t.ipa} → ${r.ipa})` : `Prevocalic Voicing (${t.ipa} → ${r.ipa})`;
    }

    return `Substitution (${t.ipa} → ${r.ipa})`;
  }
}

export const phoneticDictionary = new PhoneticDictionary();
