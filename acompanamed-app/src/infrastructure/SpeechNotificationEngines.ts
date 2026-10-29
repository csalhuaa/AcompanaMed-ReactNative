import { Medicine } from '../domain/types';

export function formatSeniorInstructionSpeech(
  patientName: string,
  medicineName: string,
  doseDescription: string,
  instructions: string
): string {
  return `Hola ${patientName}. Le corresponde tomar su ${medicineName} de ${doseDescription}. Recuerde: ${instructions}`;
}

export function formatConfirmationSpeech(
  patientName: string,
  medicineName: string,
  remainingStock: number
): string {
  return `Muy bien, ${patientName}. Dosis de ${medicineName} registrada con éxito. Le quedan ${remainingStock} pastillas en su botiquín.`;
}

export interface NotificationPayload {
  title: string;
  body: string;
  sound: boolean;
  priority: 'high' | 'normal';
  data: Record<string, unknown>;
}

export function buildDoseNotificationPayload(
  medicine: Medicine,
  timeStr: string
): NotificationPayload {
  return {
    title: `Hora de su medicina • ${medicine.name}`,
    body: `Programada para las ${timeStr}. Dosis: ${medicine.doseDescription}. ${medicine.instructions}`,
    sound: true,
    priority: 'high',
    data: {
      type: 'dose_reminder',
      medicineId: medicine.id,
      scheduledTime: timeStr,
    },
  };
}

export function buildEscalationNotificationPayload(
  patientName: string,
  medicine: Medicine,
  timeStr: string,
  gracePeriodMinutes: number = 30
): NotificationPayload {
  return {
    title: `⚠️ Alerta de Omisión: ${medicine.name}`,
    body: `${patientName} no ha confirmado su dosis de las ${timeStr}. Han transcurrido ${gracePeriodMinutes} minutos sin registro.`,
    sound: true,
    priority: 'high',
    data: {
      type: 'caregiver_escalation',
      medicineId: medicine.id,
      patientName,
      scheduledTime: timeStr,
      gracePeriodMinutes,
    },
  };
}

export function calculateEscalationTriggerDate(
  scheduledDate: Date,
  gracePeriodMinutes: number = 30
): Date {
  return new Date(scheduledDate.getTime() + gracePeriodMinutes * 60 * 1000);
}
