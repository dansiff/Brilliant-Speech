
/**
 * Utility to interface with native mobile sharing capabilities.
 */

export interface ShareData {
  title: string;
  text: string;
  url?: string;
  files?: File[];
}

export const shareAchievement = async (data: ShareData): Promise<boolean> => {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
      return false;
    }
  } else {
    // Fallback for desktop: Copy to clipboard
    try {
      await navigator.clipboard.writeText(`${data.title}\n${data.text}\n${data.url || ''}`);
      return true;
    } catch (e) {
      return false;
    }
  }
};

/**
 * Keeps the screen awake during long practice sessions
 */
export const requestWakeLock = async () => {
  if ('wakeLock' in navigator) {
    try {
      const wakeLock = await (navigator as any).wakeLock.request('screen');
      return wakeLock;
    } catch (err) {
      console.error(`${(err as Error).name}, ${(err as Error).message}`);
    }
  }
  return null;
};
