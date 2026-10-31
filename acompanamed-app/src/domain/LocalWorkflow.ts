import { ActorRole, EmergencyProfile, EscalationResult } from './types';
import { ScheduledDoseItem } from './ScheduleTimelineEngine';
import { evaluateEscalation } from './EscalationEngine';

export type AppNavTab = 'today' | 'caregiver' | 'stock' | 'emergency';

export function getVisibleTabsForRole(role: ActorRole): AppNavTab[] {
  if (role === 'patient') {
    return ['today', 'emergency'];
  }
  return ['today', 'caregiver', 'stock', 'emergency'];
}

export function createEmptyProfile(patientName = ''): EmergencyProfile {
  return {
    patientFullName: patientName.trim(),
    patientPhone: '',
    age: 0,
    bloodType: '',
    allergies: [],
    chronicConditions: [],
    healthInsurance: '',
    emergencyContact: { name: '', relationship: '', phone: '' },
  };
}

export function sanitizeEmergencyProfile(
  raw?: Partial<EmergencyProfile> | null,
  fallbackName = 'Paciente'
): EmergencyProfile {
  if (!raw || typeof raw !== 'object') {
    return createEmptyProfile(fallbackName);
  }

  const patientFullName =
    typeof raw.patientFullName === 'string' && raw.patientFullName.trim()
      ? raw.patientFullName.trim()
      : fallbackName;

  const age =
    typeof raw.age === 'number' && !isNaN(raw.age)
      ? raw.age
      : Number(raw.age) || 0;

  const bloodType = typeof raw.bloodType === 'string' ? raw.bloodType : '';

  const parseStringArray = (input: unknown): string[] => {
    if (Array.isArray(input)) {
      return input.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
    if (input && typeof input === 'object') {
      return Object.values(input).filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
    if (typeof input === 'string' && input.trim()) {
      return input.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const allergies = parseStringArray(raw.allergies);
  const chronicConditions = parseStringArray(raw.chronicConditions);
  const healthInsurance = typeof raw.healthInsurance === 'string' ? raw.healthInsurance : '';

  const patientPhone =
    typeof raw.patientPhone === 'string' && raw.patientPhone.trim()
      ? raw.patientPhone.trim()
      : '';

  const rawContact =
    raw.emergencyContact && typeof raw.emergencyContact === 'object'
      ? raw.emergencyContact
      : undefined;

  const emergencyContact = {
    name: typeof rawContact?.name === 'string' ? rawContact.name : '',
    relationship: typeof rawContact?.relationship === 'string' ? rawContact.relationship : '',
    phone: typeof rawContact?.phone === 'string' ? rawContact.phone : '',
  };

  return {
    patientFullName,
    patientPhone,
    age,
    bloodType,
    allergies,
    chronicConditions,
    healthInsurance,
    emergencyContact,
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
