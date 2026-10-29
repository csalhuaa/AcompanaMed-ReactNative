import { Medicine, DoseLog } from './types';

export type DayTimeSlot = 'morning' | 'afternoon' | 'night';

export interface ScheduledDoseItem {
  medicine: Medicine;
  scheduledTime: string; // "HH:MM" en formato 24h
  timeSlot: DayTimeSlot;
  isTakenToday: boolean;
  isPastDue: boolean;
  takenTime?: string;
}

export function getTimeSlot(hour: number): DayTimeSlot {
  if (hour >= 6 && hour < 12) {
    return 'morning';
  }
  if (hour >= 12 && hour < 18) {
    return 'afternoon';
  }
  return 'night';
}

export function buildDailySchedule(
  medicines: Medicine[],
  scheduleTimes: Record<string, string>,
  logs: DoseLog[],
  referenceDate: Date = new Date()
): ScheduledDoseItem[] {
  const currentHour = referenceDate.getHours();
  const currentMinute = referenceDate.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  // Filtrar logs del día de referencia (formato YYYY-MM-DD)
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const refDay = referenceDate.getDate();

  const items: ScheduledDoseItem[] = medicines.map((med) => {
    const timeStr = scheduleTimes[med.id] || '08:00';
    const [hStr, mStr] = timeStr.split(':');
    const doseHour = parseInt(hStr, 10) || 8;
    const doseMinute = parseInt(mStr, 10) || 0;
    const doseTotalMinutes = doseHour * 60 + doseMinute;

    const timeSlot = getTimeSlot(doseHour);

    // Buscar si ya se tomó hoy
    const todayTakenLog = logs.find((l) => {
      if (l.medicineId !== med.id || l.status !== 'taken' || !l.takenTime) {
        return false;
      }
      const logDate = new Date(l.takenTime);
      return (
        logDate.getFullYear() === refYear &&
        logDate.getMonth() === refMonth &&
        logDate.getDate() === refDay
      );
    });

    const isTakenToday = Boolean(todayTakenLog);
    const isPastDue = !isTakenToday && currentTotalMinutes > doseTotalMinutes;

    return {
      medicine: med,
      scheduledTime: timeStr,
      timeSlot,
      isTakenToday,
      isPastDue,
      takenTime: todayTakenLog?.takenTime,
    };
  });

  // Ordenar por hora programada cronológicamente
  return items.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

export function filterDosesBySlot(
  items: ScheduledDoseItem[],
  slot: DayTimeSlot
): ScheduledDoseItem[] {
  return items.filter((item) => item.timeSlot === slot);
}

export function getNextDueDose(items: ScheduledDoseItem[]): ScheduledDoseItem | null {
  const pending = items.filter((item) => !item.isTakenToday);
  if (pending.length === 0) return null;
  return pending[0];
}
