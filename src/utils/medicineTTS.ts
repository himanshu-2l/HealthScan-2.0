/**
 * Web Speech API TTS Service
 * 
 * Provides native, browser-level text-to-speech for medicine explanations.
 * Zero external API cost, ultra-low latency, and client-side privacy.
 * Grounded in docs/MEDICINE_LENS.md
 */

import { SupportedLanguage } from '../types/medicineLens';

class MedicineTTSManager {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState = false;
  private isPausedState = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isSupported(): boolean {
    return this.synth !== null;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState && !this.isPausedState;
  }

  public isPaused(): boolean {
    return this.isPausedState;
  }

  /**
   * Speak a localized explanation text using the best matching speech voice.
   */
  public speak(
    text: string,
    language: SupportedLanguage = 'en',
    onEnd?: () => void,
    onError?: (err: any) => void
  ): void {
    if (!this.synth) {
      onError?.(new Error('Speech synthesis is not supported on this browser.'));
      return;
    }

    // Stop any ongoing speech
    this.stop();

    if (!text || text.trim().length === 0) return;

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Pick best voice for target language
    const voices = this.synth.getVoices();
    let targetLang = 'en-IN';
    if (language === 'hi') {
      targetLang = 'hi-IN';
    } else if (language === 'hinglish') {
      targetLang = 'en-IN'; // Indian-accented English works well for Hinglish transliteration
    }

    const matchedVoice = voices.find(v => v.lang === targetLang || v.lang.startsWith(targetLang.split('-')[0]));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.lang = targetLang;
    utterance.rate = 0.95; // Slightly slower for clarity with pharmaceutical terms
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeakingState = true;
      this.isPausedState = false;
    };

    utterance.onend = () => {
      this.isSpeakingState = false;
      this.isPausedState = false;
      this.currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeakingState = false;
      this.isPausedState = false;
      this.currentUtterance = null;
      onError?.(e);
    };

    this.synth.speak(utterance);
  }

  public pause(): void {
    if (this.synth && this.isSpeakingState && !this.isPausedState) {
      this.synth.pause();
      this.isPausedState = true;
    }
  }

  public resume(): void {
    if (this.synth && this.isPausedState) {
      this.synth.resume();
      this.isPausedState = false;
    }
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeakingState = false;
      this.isPausedState = false;
      this.currentUtterance = null;
    }
  }
}

export const medicineTTS = new MedicineTTSManager();
