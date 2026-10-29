import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export class SpeechService {
  async speak(text: string, onDone?: () => void): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.85; // Ritmo pausado y comprensible para adultos mayores
        if (onDone) utterance.onend = onDone;
        window.speechSynthesis.speak(utterance);
        return;
      }

      const isSpeaking = await Speech.isSpeakingAsync().catch(() => false);
      if (isSpeaking) {
        await Speech.stop().catch(() => {});
      }

      Speech.speak(text, {
        language: 'es-ES',
        rate: 0.85,
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
      await Speech.stop();
    } catch {}
  }
}

export const defaultSpeechService = new SpeechService();
