export interface SensorySettings {
  highContrast: boolean;
  sensoryFriendlyMode: boolean; // lowers bright animations, dampens audio
  vocalSensitivity: number; // sensitivity divisor for voice meters
  volume: number; // audio playback volume (0 to 1)
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
}

const DEFAULT_SETTINGS: SensorySettings = {
  highContrast: false,
  sensoryFriendlyMode: false,
  vocalSensitivity: 1,
  volume: 0.8,
  fontSize: 'md',
};

class SettingsService {
  private key = 'sensory_settings_config';

  public loadSettings(): SensorySettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem(this.key);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Return default if error parsing
    }
    return DEFAULT_SETTINGS;
  }

  public saveSettings(settings: SensorySettings): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.key, JSON.stringify(settings));
      this.applyThemeSettings(settings);
    } catch (e) {
      console.error('Failed to save sensory settings:', e);
    }
  }

  /**
   * Dynamically inject classes or styling adjustments onto HTML document body to reflect preferences
   */
  public applyThemeSettings(settings: SensorySettings): void {
    if (typeof document === 'undefined') return;
    const body = document.body;

    // High Contrast class toggle
    if (settings.highContrast) {
      body.classList.add('high-contrast-mode');
    } else {
      body.classList.remove('high-contrast-mode');
    }

    // Sensory Friendly animations toggle
    if (settings.sensoryFriendlyMode) {
      body.classList.add('sensory-friendly-animations');
    } else {
      body.classList.remove('sensory-friendly-animations');
    }

    // Apply text base scaling
    body.classList.remove('text-size-sm', 'text-size-md', 'text-size-lg', 'text-size-xl');
    body.classList.add(`text-size-${settings.fontSize}`);
  }
}

export const settingsService = new SettingsService();
export { DEFAULT_SETTINGS };
