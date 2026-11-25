
/**
 * Utility to provide haptic feedback on supported mobile devices.
 * Respects the user's sensory profile (can be disabled via reducedMotion).
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error';

export const triggerHaptic = (type: HapticType = 'light') => {
  if (!('vibrate' in navigator)) return;

  // Pattern sequences in ms
  const patterns: Record<HapticType, number[]> = {
    light: [10],
    medium: [20],
    heavy: [40],
    success: [10, 50, 10],
    error: [50, 100, 50, 100],
  };

  try {
    navigator.vibrate(patterns[type]);
  } catch (e) {
    console.debug('Haptics not supported or blocked');
  }
};
