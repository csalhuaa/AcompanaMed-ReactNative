import { Platform } from 'react-native';
import {
  scoreSpeechVoice,
  selectBestVoice,
  type VoiceCandidate,
} from './SpeechVoiceEngine';

export { scoreSpeechVoice, selectBestVoice, type VoiceCandidate };

let expoSpeechPromise: Promise<typeof import('expo-speech')> | null = null;
async function getExpoSpeech(): Promise<typeof import('expo-speech') | null> {
  if (Platform.OS === 'web') return null;
  if (!expoSpeechPromise) {
    expoSpeechPromise = import('expo-speech');
  }
  return expoSpeechPromise;
}

export class SpeechService {
  private bestWebVoice: SpeechSynthesisVoice | null = null;
  private bestNativeVoiceId: string | null = null;
  private nativeVoiceChecked = false;

  constructor() {
    this.initWebVoices();
  }

  private initWebVoices(): void {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateBestVoice = () => {
        try {
          const list = window.speechSynthesis.getVoices();
          if (list && list.length > 0) {
            this.bestWebVoice = selectBestVoice(list);
          }
        } catch {}
      };

      updateBestVoice();
      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = updateBestVoice;
      }
    }
  }

  public getSelectedWebVoice(): SpeechSynthesisVoice | null {
    if (!this.bestWebVoice && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const list = window.speechSynthesis.getVoices();
      if (list && list.length > 0) {
        this.bestWebVoice = selectBestVoice(list);
      }
    }
    return this.bestWebVoice;
  }

  async speak(text: string, onDone?: () => void): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        const voice = this.getSelectedWebVoice();
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang || 'es-ES';
        } else {
          utterance.lang = 'es-ES';
        }

        // Ritmo 0.92: entonación natural, humana y clara para adultos mayores
        utterance.rate = 0.92;
        utterance.pitch = 1.0;
        if (onDone) utterance.onend = onDone;
        window.speechSynthesis.speak(utterance);
        return;
      }

      const Speech = await getExpoSpeech();
      if (!Speech) {
        if (onDone) onDone();
        return;
      }

      const isSpeaking = await Speech.isSpeakingAsync().catch(() => false);
      if (isSpeaking) {
        await Speech.stop().catch(() => {});
      }

      let voiceIdentifier: string | undefined = undefined;
      if (!this.nativeVoiceChecked) {
        this.nativeVoiceChecked = true;
        try {
          const available = await Speech.getAvailableVoicesAsync();
          const best = selectBestVoice(available);
          if (best?.identifier) {
            this.bestNativeVoiceId = best.identifier;
          }
        } catch {}
      }
      if (this.bestNativeVoiceId) {
        voiceIdentifier = this.bestNativeVoiceId;
      }

      Speech.speak(text, {
        language: 'es-ES',
        voice: voiceIdentifier,
        rate: 0.92,
        pitch: 1.0,
        onDone,
      });
    } catch (e) {
      console.warn('SpeechService aviso:', e);
      if (onDone) onDone();
    }
  }

  async stop(): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        return;
      }
      const Speech = await getExpoSpeech();
      if (Speech) {
        await Speech.stop();
      }
    } catch {}
  }
}

export const defaultSpeechService = new SpeechService();
