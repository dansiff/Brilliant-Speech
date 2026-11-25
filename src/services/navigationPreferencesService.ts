/**
 * Navigation Preferences & Experience Customization Service
 * Allows users to choose between tailored presets (Regular Joe, Kids, Parent, SLP Clinician, Autism)
 * or customize individual module visibility.
 */

export type ExperiencePreset = 
  | 'regular_joe' 
  | 'kids_gamified' 
  | 'parent_home' 
  | 'slp_clinician' 
  | 'autism_sensory' 
  | 'custom';

export interface ModuleVisibilityConfig {
  // Practice & Sounds
  practice: boolean;
  soundLadder: boolean;
  contrastEngine: boolean;
  articulatorAnatomy: boolean;

  // Games & Stories
  stories: boolean;
  matchingGame: boolean;
  bilingualMatch: boolean;
  languageModules: boolean;
  lessons: boolean;
  videos: boolean;

  // Speech & Fluency
  motorSpeech: boolean;
  fluencyLab: boolean;
  vocalLab: boolean;
  receptiveLanguage: boolean;
  voiceMeters: boolean;
  pacingBoard: boolean;

  // AAC & Sensory
  sceneAac: boolean;
  aacPlayground: boolean;
  autismTools: boolean;
  focusSocial: boolean;

  // Clinical & Care
  parentCoaching: boolean;
  clinicalResearch: boolean;
  clinicCrm: boolean;
  marketplace: boolean;
}

export interface NavigationPreferences {
  activePreset: ExperiencePreset;
  modules: ModuleVisibilityConfig;
}

export const PRESET_CONFIGS: Record<ExperiencePreset, { name: string; badge: string; description: string; icon: string; modules: ModuleVisibilityConfig }> = {
  regular_joe: {
    name: 'Everyday Learner (Default)',
    badge: 'Clean & Simple',
    description: 'Clean, approachable experience with daily practice, games, stories, and essential speech tools.',
    icon: '😊',
    modules: {
      practice: true,
      soundLadder: true,
      contrastEngine: true,
      articulatorAnatomy: false,
      stories: true,
      matchingGame: true,
      bilingualMatch: true,
      languageModules: true,
      lessons: true,
      videos: true,
      motorSpeech: false,
      fluencyLab: true,
      vocalLab: true,
      receptiveLanguage: false,
      voiceMeters: true,
      pacingBoard: false,
      sceneAac: true,
      aacPlayground: false,
      autismTools: false,
      focusSocial: true,
      parentCoaching: false,
      clinicalResearch: false,
      clinicCrm: false,
      marketplace: true
    }
  },
  kids_gamified: {
    name: 'Kids Playful Arena',
    badge: 'High Engagement',
    description: 'Gamified visuals, interactive sound ladders, matching games, and bilingual stories.',
    icon: '🎈',
    modules: {
      practice: true,
      soundLadder: true,
      contrastEngine: true,
      articulatorAnatomy: false,
      stories: true,
      matchingGame: true,
      bilingualMatch: true,
      languageModules: true,
      lessons: false,
      videos: true,
      motorSpeech: false,
      fluencyLab: true,
      vocalLab: true,
      receptiveLanguage: false,
      voiceMeters: true,
      pacingBoard: false,
      sceneAac: true,
      aacPlayground: true,
      autismTools: false,
      focusSocial: false,
      parentCoaching: false,
      clinicalResearch: false,
      clinicCrm: false,
      marketplace: false
    }
  },
  parent_home: {
    name: 'Parent & Home Carryover',
    badge: 'Family Guided',
    description: 'Daily practice routines, parent coaching guides ("3 Words, 3 Mins"), and home fluency tools.',
    icon: '👨‍👩‍👧',
    modules: {
      practice: true,
      soundLadder: true,
      contrastEngine: true,
      articulatorAnatomy: false,
      stories: true,
      matchingGame: true,
      bilingualMatch: true,
      languageModules: true,
      lessons: true,
      videos: true,
      motorSpeech: false,
      fluencyLab: true,
      vocalLab: true,
      receptiveLanguage: true,
      voiceMeters: true,
      pacingBoard: true,
      sceneAac: true,
      aacPlayground: false,
      autismTools: false,
      focusSocial: true,
      parentCoaching: true,
      clinicalResearch: false,
      clinicCrm: false,
      marketplace: true
    }
  },
  slp_clinician: {
    name: 'Clinician / SLP Professional',
    badge: 'Full Clinical Suite',
    description: 'Unlocks the entire clinical suite: Apraxia DTTC hierarchy, Anatomy Lab, Research analytics, and Clinic CRM.',
    icon: '🩺',
    modules: {
      practice: true,
      soundLadder: true,
      contrastEngine: true,
      articulatorAnatomy: true,
      stories: true,
      matchingGame: true,
      bilingualMatch: true,
      languageModules: true,
      lessons: true,
      videos: true,
      motorSpeech: true,
      fluencyLab: true,
      vocalLab: true,
      receptiveLanguage: true,
      voiceMeters: true,
      pacingBoard: true,
      sceneAac: true,
      aacPlayground: true,
      autismTools: true,
      focusSocial: true,
      parentCoaching: true,
      clinicalResearch: true,
      clinicCrm: true,
      marketplace: true
    }
  },
  autism_sensory: {
    name: 'Autism & AAC Sensory Suite',
    badge: 'Neurodiversity Focus',
    description: 'Specialized for neurodivergent learners: AAC Playground, Visual Scenes, First/Then task boards, and calming tools.',
    icon: '🧩',
    modules: {
      practice: true,
      soundLadder: false,
      contrastEngine: false,
      articulatorAnatomy: false,
      stories: true,
      matchingGame: true,
      bilingualMatch: false,
      languageModules: false,
      lessons: false,
      videos: true,
      motorSpeech: false,
      fluencyLab: false,
      vocalLab: false,
      receptiveLanguage: true,
      voiceMeters: true,
      pacingBoard: true,
      sceneAac: true,
      aacPlayground: true,
      autismTools: true,
      focusSocial: true,
      parentCoaching: true,
      clinicalResearch: false,
      clinicCrm: false,
      marketplace: false
    }
  },
  custom: {
    name: 'Custom Tailored Workspace',
    badge: 'Personalized',
    description: 'Hand-pick exactly which modules appear in your dropdown navigation menus.',
    icon: '⚙️',
    modules: {
      practice: true,
      soundLadder: true,
      contrastEngine: true,
      articulatorAnatomy: true,
      stories: true,
      matchingGame: true,
      bilingualMatch: true,
      languageModules: true,
      lessons: true,
      videos: true,
      motorSpeech: true,
      fluencyLab: true,
      vocalLab: true,
      receptiveLanguage: true,
      voiceMeters: true,
      pacingBoard: true,
      sceneAac: true,
      aacPlayground: true,
      autismTools: true,
      focusSocial: true,
      parentCoaching: true,
      clinicalResearch: true,
      clinicCrm: true,
      marketplace: true
    }
  }
};

const STORAGE_KEY = 'speechflow_navigation_preferences';

class NavigationPreferencesService {
  private static instance: NavigationPreferencesService;

  public static getInstance(): NavigationPreferencesService {
    if (!NavigationPreferencesService.instance) {
      NavigationPreferencesService.instance = new NavigationPreferencesService();
    }
    return NavigationPreferencesService.instance;
  }

  public loadPreferences(): NavigationPreferences {
    if (typeof window === 'undefined') {
      return {
        activePreset: 'regular_joe',
        modules: PRESET_CONFIGS.regular_joe.modules
      };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.activePreset && PRESET_CONFIGS[parsed.activePreset as ExperiencePreset]) {
          return {
            activePreset: parsed.activePreset,
            modules: {
              ...PRESET_CONFIGS[parsed.activePreset as ExperiencePreset].modules,
              ...(parsed.modules || {})
            }
          };
        }
      }
    } catch (e) {}

    return {
      activePreset: 'regular_joe',
      modules: PRESET_CONFIGS.regular_joe.modules
    };
  }

  public savePreferences(prefs: NavigationPreferences): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {}
  }

  public applyPreset(preset: ExperiencePreset): NavigationPreferences {
    const config = PRESET_CONFIGS[preset];
    const newPrefs: NavigationPreferences = {
      activePreset: preset,
      modules: { ...config.modules }
    };
    this.savePreferences(newPrefs);
    return newPrefs;
  }

  public toggleModule(moduleKey: keyof ModuleVisibilityConfig, isVisible: boolean): NavigationPreferences {
    const current = this.loadPreferences();
    const updated: NavigationPreferences = {
      activePreset: 'custom',
      modules: {
        ...current.modules,
        [moduleKey]: isVisible
      }
    };
    this.savePreferences(updated);
    return updated;
  }
}

export const navPreferencesService = NavigationPreferencesService.getInstance();
