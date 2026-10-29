import { DoseLog, DuplicateCheckResult } from './types';

export function canRegisterDose(
  medicineId: string,
  logs: DoseLog[],
  targetTime: Date = new Date(),
  minHoursBetweenDoses: number = 2
): DuplicateCheckResult {
  const medicineLogs = logs
    .filter((l) => l.medicineId === medicineId && l.status === 'taken' && l.takenTime)
    .sort((a, b) => new Date(b.takenTime!).getTime() - new Date(a.takenTime!).getTime());

  if (medicineLogs.length === 0) {
    return { allowed: true };
  }

  const lastTaken = medicineLogs[0];
  const lastTakenDate = new Date(lastTaken.takenTime!);
  const diffMs = targetTime.getTime() - lastTakenDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < minHoursBetweenDoses) {
    return {
      allowed: false,
      reason: `Esta dosis ya fue registrada recientemente. Evite tomas duplicadas accidentales por seguridad médica.`,
      lastTakenAt: lastTaken.takenTime,
    };
  }

  return { allowed: true };
}
