import { Language } from '../types';

export const speakText = (text: string, language: Language = Language.ENGLISH) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech synthesis not supported in this environment');
    return;
  }

  // Cancel any ongoing speech to prevent overlap
  window.speechSynthesis.cancel();

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = language === Language.SPANISH ? 'es-ES' : 'en-US';
    utterance.lang = langCode;

    // Get current voices
    const voices = window.speechSynthesis.getVoices();
    
    // Common female voice names across different browsers/OS
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
      // Fallback: just try to match language if female voice not found
      const fallbackVoice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
      if (fallbackVoice) utterance.voice = fallbackVoice;
    }

    utterance.rate = 0.9; // Slightly slower for children
    utterance.pitch = 1.1; // Slightly higher/friendlier pitch

    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Chrome/Safari often return empty array initially
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null; // Prevent multi-trigger
      speak();
    };
    // Fallback if event never fires
    setTimeout(speak, 100);
  } else {
    speak();
  }
};
