import { EscalationResult } from './types';

export function evaluateEscalation(
  scheduledTime: Date,
  currentTime: Date = new Date(),
  gracePeriodMinutes: number = 30
): EscalationResult {
  const diffMs = currentTime.getTime() - scheduledTime.getTime();
  const minutesElapsed = Math.floor(diffMs / (1000 * 60));

  if (minutesElapsed >= gracePeriodMinutes) {
    return {
      shouldEscalate: true,
      minutesElapsed,
      message: `Atención: Han transcurrido ${minutesElapsed} minutos desde la hora programada sin confirmación de toma. Se activa notificación a la red de apoyo.`,
    };
  }

  return {
    shouldEscalate: false,
    minutesElapsed: Math.max(0, minutesElapsed),
    message: `Dentro del margen de tolerancia clínica (${minutesElapsed} / ${gracePeriodMinutes} min transcurridos).`,
  };
}
