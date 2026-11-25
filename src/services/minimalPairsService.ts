import { Language, Difficulty, Exercise, ExerciseType } from '../types';

export interface MinimalPairRule {
  phonologicalProcess: string;
  targetPhoneme: string;
  errorPhoneme: string;
  description: string;
  pairs: Array<{
    targetWord: string;
    contrastWord: string;
    targetIpa: string;
    contrastIpa: string;
    promptText: string;
    targetImageEmoji: string;
    contrastImageEmoji: string;
  }>;
}

/**
 * Phonological process rules table for dynamic minimal-pair generation
 */
export const PHONOLOGICAL_ERROR_RULES: MinimalPairRule[] = [
  {
    phonologicalProcess: 'Velar Fronting (k → t, g → d)',
    targetPhoneme: '/k/',
    errorPhoneme: '/t/',
    description: 'Replacing back sounds (velar /k/, /g/) with front sounds (alveolar /t/, /d/).',
    pairs: [
      {
        targetWord: 'Key',
        contrastWord: 'Tea',
        targetIpa: '/ki/',
        contrastIpa: '/ti/',
        promptText: 'Use your tongue back for "Key", front for "Tea"',
        targetImageEmoji: '🔑',
        contrastImageEmoji: '🍵'
      },
      {
        targetWord: 'Cape',
        contrastWord: 'Tape',
        targetIpa: '/keɪp/',
        contrastIpa: '/teɪp/',
        promptText: 'Feel the tap in the back for "Cape"',
        targetImageEmoji: '🦸‍♂️',
        contrastImageEmoji: '📼'
      },
      {
        targetWord: 'Coat',
        contrastWord: 'Toat',
        targetIpa: '/koʊt/',
        contrastIpa: '/toʊt/',
        promptText: 'Put on your warm "Coat"',
        targetImageEmoji: '🧥',
        contrastImageEmoji: '👜'
      },
      {
        targetWord: 'Call',
        contrastWord: 'Tall',
        targetIpa: '/kɔːl/',
        contrastIpa: '/tɔːl/',
        promptText: 'Give someone a "Call"',
        targetImageEmoji: '📞',
        contrastImageEmoji: '🦒'
      }
    ]
  },
  {
    phonologicalProcess: 'Liquid Gliding (r → w, l → w)',
    targetPhoneme: '/r/',
    errorPhoneme: '/w/',
    description: 'Replacing liquid sounds (/r/, /l/) with glides (/w/, /j/).',
    pairs: [
      {
        targetWord: 'Ring',
        contrastWord: 'Wing',
        targetIpa: '/rɪŋ/',
        contrastIpa: '/wɪŋ/',
        promptText: 'Retract tongue sides for "Ring", round lips for "Wing"',
        targetImageEmoji: '💍',
        contrastImageEmoji: '🪽'
      },
      {
        targetWord: 'Rock',
        contrastWord: 'Wok',
        targetIpa: '/rɑːk/',
        contrastIpa: '/wɑːk/',
        promptText: 'Strong tongue curve for "Rock"',
        targetImageEmoji: '🪨',
        contrastImageEmoji: '🍳'
      },
      {
        targetWord: 'Red',
        contrastWord: 'Wed',
        targetIpa: '/rɛd/',
        contrastIpa: '/wɛd/',
        promptText: 'Bright color "Red"',
        targetImageEmoji: '🔴',
        contrastImageEmoji: '💒'
      },
      {
        targetWord: 'Row',
        contrastWord: 'Woe',
        targetIpa: '/roʊ/',
        contrastIpa: '/woʊ/',
        promptText: 'Use your oars to "Row"',
        targetImageEmoji: '🚣',
        contrastImageEmoji: '😢'
      }
    ]
  },
  {
    phonologicalProcess: 'Stopping of Fricatives (s → t, f → p)',
    targetPhoneme: '/s/',
    errorPhoneme: '/t/',
    description: 'Stopping continuous airflow (/s/, /f/) with a stop plosive (/t/, /p/).',
    pairs: [
      {
        targetWord: 'Sun',
        contrastWord: 'Ton',
        targetIpa: '/sʌn/',
        contrastIpa: '/tʌn/',
        promptText: 'Keep the continuous airflow hissing for "Sun"',
        targetImageEmoji: '☀️',
        contrastImageEmoji: '🏋️'
      },
      {
        targetWord: 'Sea',
        contrastWord: 'Tea',
        targetIpa: '/siː/',
        contrastIpa: '/tiː/',
        promptText: 'Deep blue "Sea"',
        targetImageEmoji: '🌊',
        contrastImageEmoji: '🫖'
      },
      {
        targetWord: 'Sick',
        contrastWord: 'Tick',
        targetIpa: '/sɪk/',
        contrastIpa: '/tɪk/',
        promptText: 'Continuous air sound for "Sick"',
        targetImageEmoji: '🤒',
        contrastImageEmoji: '⏱️'
      },
      {
        targetWord: 'Sock',
        contrastWord: 'Talk',
        targetIpa: '/sɑːk/',
        contrastIpa: '/tɔːk/',
        promptText: 'Warm cozy "Sock"',
        targetImageEmoji: '🧦',
        contrastImageEmoji: '🗣️'
      }
    ]
  },
  {
    phonologicalProcess: 'Cluster Reduction (sp → p, st → t)',
    targetPhoneme: '/sp/',
    errorPhoneme: '/p/',
    description: 'Omitting one consonant in a consonant cluster.',
    pairs: [
      {
        targetWord: 'Spot',
        contrastWord: 'Pot',
        targetIpa: '/spɑːt/',
        contrastIpa: '/pɑːt/',
        promptText: 'Include the snake sound /s/ before "pot" → "Spot"',
        targetImageEmoji: '⚪',
        contrastImageEmoji: '🍲'
      },
      {
        targetWord: 'Spin',
        contrastWord: 'Pin',
        targetIpa: '/spɪn/',
        contrastIpa: '/pɪn/',
        promptText: 'Two sounds together: /s/ + /p/ → "Spin"',
        targetImageEmoji: '🌀',
        contrastImageEmoji: '📍'
      }
    ]
  }
];

export class MinimalPairsService {
  /**
   * Automatically generate contrastive minimal-pair exercises based on SODA substitutions
   */
  public getMinimalPairsForError(targetPhoneme: string, errorPhoneme?: string): MinimalPairRule | null {
    const cleanTarget = targetPhoneme.replace(/[/]/g, '').toLowerCase();
    const cleanError = (errorPhoneme || '').replace(/[/]/g, '').toLowerCase();

    // Match exact target & error pair
    const exactMatch = PHONOLOGICAL_ERROR_RULES.find(rule => {
      const ruleTarget = rule.targetPhoneme.replace(/[/]/g, '').toLowerCase();
      const ruleError = rule.errorPhoneme.replace(/[/]/g, '').toLowerCase();
      return ruleTarget === cleanTarget && (!cleanError || ruleError === cleanError);
    });

    if (exactMatch) return exactMatch;

    // Fallback to target sound rule
    return PHONOLOGICAL_ERROR_RULES.find(rule => 
      rule.targetPhoneme.replace(/[/]/g, '').toLowerCase() === cleanTarget
    ) || null;
  }

  /**
   * Convert minimal pair into standard Exercise entity for LessonPlayer
   */
  public generateContrastiveExercise(rule: MinimalPairRule, pairIndex = 0): Exercise {
    const pair = rule.pairs[pairIndex % rule.pairs.length];
    return {
      id: `mp-${rule.targetPhoneme.replace(/[/]/g, '')}-${Date.now()}`,
      title: `Minimal Pair: "${pair.targetWord}" vs "${pair.contrastWord}"`,
      description: `${rule.description} (${pair.promptText})`,
      type: ExerciseType.MINIMAL_PAIRS,
      category: 'Minimal Pairs',
      targetWord: pair.targetWord,
      language: Language.ENGLISH,
      difficulty: Difficulty.EASY,
      targetPhonemes: [rule.targetPhoneme, rule.errorPhoneme],
      imageUrl: '',
      isPremium: false
    };
  }
}

export const minimalPairsService = new MinimalPairsService();
