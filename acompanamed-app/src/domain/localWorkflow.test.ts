import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyProfile, getScheduleEscalation, getScheduledDate } from './LocalWorkflow';
import { buildDailySchedule } from './ScheduleTimelineEngine';
import type { Medicine } from './types';

const medicine: Medicine = {
  id: 'daily', name: 'Prescription', doseDescription: 'As prescribed', intervalHours: 24,
  instructions: '', stock: 5, minStockAlert: 0, createdAt: '2026-10-30T00:00:00Z',
  visualPill: { shape: 'round', colorHex: '#FFFFFF', colorName: 'White' },
};

describe('Everyday local workflows', () => {
  it('starts a real profile without invented medical or emergency details', () => {
    const profile = createEmptyProfile(' Ana ');
    assert.equal(profile.patientFullName, 'Ana');
    assert.equal(profile.age, 0);
    assert.equal(profile.bloodType, '');
    assert.deepEqual(profile.allergies, []);
    assert.deepEqual(profile.chronicConditions, []);
    assert.equal(profile.healthInsurance, '');
    assert.deepEqual(profile.emergencyContact, { name: '', relationship: '', phone: '' });
  });

  it('keeps midnight and the existing daytime schedule in local time', () => {
    const now = new Date(2026, 9, 31, 0, 40);
    const midnight = buildDailySchedule([medicine], { daily: '00:15' }, [], now)[0];
    assert.equal(midnight.isPastDue, true);
    assert.equal(midnight.timeSlot, 'night');
    assert.equal(getScheduledDate('00:15', now).getHours(), 0);
    const daytime = buildDailySchedule([medicine], { daily: '08:00' }, [], now)[0];
    assert.equal(daytime.isPastDue, false);
    assert.equal(daytime.timeSlot, 'morning');
  });

  it('shows no overdue alert for an empty plan, a future dose, or a confirmed dose', () => {
    const now = new Date(2026, 9, 31, 8, 40);
    assert.equal(getScheduleEscalation([], now).shouldEscalate, false);
    const future = buildDailySchedule([medicine], { daily: '21:00' }, [], now);
    assert.equal(getScheduleEscalation(future, now).shouldEscalate, false);
    const taken = future.map(item => ({ ...item, isTakenToday: true }));
    assert.equal(getScheduleEscalation(taken, now).shouldEscalate, false);
  });

  it('derives the thirty-minute alert from the oldest unconfirmed dose today', () => {
    const now = new Date(2026, 9, 31, 8, 30);
    const schedule = buildDailySchedule([medicine], { daily: '08:00' }, [], now);
    assert.equal(getScheduleEscalation(schedule, new Date(2026, 9, 31, 8, 29)).shouldEscalate, false);
    const result = getScheduleEscalation(schedule, now);
    assert.equal(result.shouldEscalate, true);
    assert.equal(result.minutesElapsed, 30);
  });
});
