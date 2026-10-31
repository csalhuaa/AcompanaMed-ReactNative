import { EmergencyProfile, EscalationResult } from './types';
import { ScheduledDoseItem } from './ScheduleTimelineEngine';
import { evaluateEscalation } from './EscalationEngine';

export function createEmptyProfile(patientName = ''): EmergencyProfile {
  return {
    patientFullName: patientName.trim(), age: 0, bloodType: '', allergies: [],
    chronicConditions: [], healthInsurance: '',
    emergencyContact: { name: '', relationship: '', phone: '' },
  };
}

export function getScheduledDate(time: string, referenceDate: Date): Date {
  const [hour, minute] = time.split(':').map(Number);
  const scheduled = new Date(referenceDate);
  scheduled.setHours(hour, minute, 0, 0);
  return scheduled;
}

export function getScheduleEscalation(items: ScheduledDoseItem[], now: Date): EscalationResult {
  const pending = items.find(item => !item.isTakenToday && getScheduledDate(item.scheduledTime, now) <= now);
  if (!pending) {
    return {
      shouldEscalate: false, minutesElapsed: 0,
      message: items.length ? 'No hay tomas atrasadas pendientes de confirmar.' : 'Agregue medicamentos para comenzar el seguimiento.',
    };
  }
  const result = evaluateEscalation(getScheduledDate(pending.scheduledTime, now), now, 30);
  return {
    ...result,
    message: result.shouldEscalate
      ? `${pending.medicine.name}: han pasado ${result.minutesElapsed} minutos desde la hora prevista sin confirmación. Puede contactar al cuidador.`
      : `${pending.medicine.name}: ${result.minutesElapsed} minutos desde la hora prevista. Margen de espera: 30 minutos.`,
  };
}
