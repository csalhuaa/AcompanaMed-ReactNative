import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreSpeechVoice,
  selectBestVoice,
  type VoiceCandidate,
} from './SpeechVoiceEngine';

describe('AcompañaMed - SpeechVoiceEngine (Natural Voice Selector Tests)', () => {
  const sampleVoices: VoiceCandidate[] = [
    {
      name: 'Microsoft David Desktop - English (United States)',
      lang: 'en-US',
      quality: 'Default',
      identifier: 'en-us-david',
    },
    {
      name: 'Microsoft Helena Desktop - Spanish (Spain)',
      lang: 'es-ES',
      quality: 'Default',
      identifier: 'es-es-helena-desktop',
    },
    {
      name: 'Google español',
      lang: 'es-ES',
      quality: 'Default',
      identifier: 'google-es',
    },
    {
      name: 'Microsoft Sabina Online (Natural) - Spanish (Mexico)',
      lang: 'es-MX',
      quality: 'Enhanced',
      identifier: 'es-mx-sabina-natural',
    },
    {
      name: 'Apple Paulina (Enhanced)',
      lang: 'es-MX',
      quality: 'Enhanced',
      identifier: 'apple-paulina-enhanced',
    },
  ];

  it('descalifica voces de idiomas no hispanohablantes', () => {
    const englishVoice: VoiceCandidate = {
      name: 'Microsoft Zira - English (United States)',
      lang: 'en-US',
    };
    const score = scoreSpeechVoice(englishVoice);
    assert.equal(score, -1);
  });

  it('penaliza voces sintetizadas obsoletas tipo Desktop 16kHz', () => {
    const desktopVoice: VoiceCandidate = {
      name: 'Microsoft Helena Desktop - Spanish (Spain)',
      lang: 'es-ES',
    };
    const standardVoice: VoiceCandidate = {
      name: 'Microsoft Pablo - Spanish (Spain)',
      lang: 'es-ES',
    };

    assert.ok(scoreSpeechVoice(standardVoice) > scoreSpeechVoice(desktopVoice));
  });

  it('prioriza voces neuronales con etiquetas Natural, Neural, Online o Enhanced', () => {
    const naturalVoice: VoiceCandidate = {
      name: 'Microsoft Sabina Online (Natural) - Spanish (Mexico)',
      lang: 'es-MX',
    };
    const standardVoice: VoiceCandidate = {
      name: 'Microsoft Pablo - Spanish (Spain)',
      lang: 'es-ES',
    };

    const naturalScore = scoreSpeechVoice(naturalVoice);
    const standardScore = scoreSpeechVoice(standardVoice);

    assert.ok(naturalScore > standardScore + 100);
  });

  it('selecciona automáticamente la mejor voz neuronal disponible de la lista', () => {
    const best = selectBestVoice(sampleVoices);
    assert.ok(best !== null);
    // Sabina Online Natural reúne: español + latam + online + natural + sabina + enhanced
    assert.equal(best.identifier, 'es-mx-sabina-natural');
  });

  it('devuelve null de forma segura ante listas vacías o nulas', () => {
    assert.equal(selectBestVoice([]), null);
    assert.equal(selectBestVoice(null as unknown as VoiceCandidate[]), null);
  });
});
