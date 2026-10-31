export interface VoiceCandidate {
  name: string;
  lang?: string;
  language?: string;
  quality?: string;
  identifier?: string;
}

/**
 * Evalúa la calidad y naturalidad de una voz para el público hispanohablante
 * priorizando voces neuronales (Natural/Neural/Online/Enhanced) y entonación humana.
 */
export function scoreSpeechVoice(voice: VoiceCandidate): number {
  if (!voice) return -1;
  const lang = (voice.lang || voice.language || '').toLowerCase().trim();
  const name = (voice.name || '').toLowerCase();
  const quality = (voice.quality || '').toLowerCase();

  // 1. Debe corresponder al idioma español
  const isSpanish =
    lang.startsWith('es') ||
    name.includes('spanish') ||
    name.includes('español');

  if (!isSpanish) {
    return -1; // Descalificado
  }

  let score = 50;

  // 2. Afinidad regional: Latinoamérica / Perú / México / US Hispanic
  if (
    lang.includes('419') ||
    lang.includes('pe') ||
    lang.includes('mx') ||
    lang.includes('co') ||
    lang.includes('cl')
  ) {
    score += 25;
  } else if (lang.includes('us')) {
    score += 20;
  } else if (lang.includes('es')) {
    score += 15;
  }

  // 3. Indicadores de síntesis neuronal moderna y alta definición
  if (name.includes('natural')) score += 100;
  if (name.includes('neural')) score += 95;
  if (name.includes('online')) score += 90; // Microsoft Edge Online (Azure Neural)
  if (name.includes('enhanced') || quality.includes('enhanced')) score += 85;
  if (name.includes('premium')) score += 80;

  // 4. Proveedores con modelos de dicción de alta fidelidad
  if (name.includes('google')) score += 70;
  if (name.includes('siri') || name.includes('apple')) score += 65;

  // 5. Catálogo de voces en español de calidad superior comprobada
  const highQualityNames = [
    'sabina',
    'laura',
    'jorge',
    'paulina',
    'monica',
    'mónica',
    'paloma',
    'camila',
    'sofia',
    'sofía',
    'diego',
    'carlos',
    'gonzalo',
    'elena',
  ];
  const nameTokens = name.split(/[\s\-_(),.]+/);
  for (const hqName of highQualityNames) {
    if (nameTokens.includes(hqName)) {
      score += 40;
      break;
    }
  }

  // 6. Penalizar fuertemente voces sintéticas robóticas heredadas (legacy desktop 16kHz)
  if (name.includes('desktop')) score -= 60;
  if (name.includes('compact')) score -= 30;
  if (name.includes('espeak')) score -= 50;

  return score;
}

/**
 * Selecciona la mejor voz en español a partir de una lista de candidatos
 */
export function selectBestVoice<T extends VoiceCandidate>(voices: T[]): T | null {
  if (!voices || voices.length === 0) return null;

  let bestVoice: T | null = null;
  let highestScore = -1;

  for (const v of voices) {
    const score = scoreSpeechVoice(v);
    if (score > highestScore) {
      highestScore = score;
      bestVoice = v;
    }
  }

  return bestVoice;
}
