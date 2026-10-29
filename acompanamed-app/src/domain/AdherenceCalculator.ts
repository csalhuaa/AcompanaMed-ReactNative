import { DoseLog, AdherenceSummary } from './types';

export function calculateAdherence(logs: DoseLog[]): AdherenceSummary {
  const totalScheduled = logs.length;
  if (totalScheduled === 0) {
    return {
      totalScheduled: 0,
      totalTaken: 0,
      totalPostponed: 0,
      totalMissed: 0,
      adherencePercentage: 100,
      statusRating: 'excellent',
    };
  }

  const totalTaken = logs.filter((l) => l.status === 'taken').length;
  const totalPostponed = logs.filter((l) => l.status === 'postponed').length;
  const totalMissed = logs.filter((l) => l.status === 'missed').length;

  const percentage = Math.round((totalTaken / totalScheduled) * 100);

  let statusRating: 'excellent' | 'good' | 'warning' | 'critical';
  if (percentage >= 90) {
    statusRating = 'excellent';
  } else if (percentage >= 75) {
    statusRating = 'good';
  } else if (percentage >= 60) {
    statusRating = 'warning';
  } else {
    statusRating = 'critical';
  }

  return {
    totalScheduled,
    totalTaken,
    totalPostponed,
    totalMissed,
    adherencePercentage: percentage,
    statusRating,
  };
}
