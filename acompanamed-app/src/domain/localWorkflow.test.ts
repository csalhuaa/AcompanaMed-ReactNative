import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyProfile,
  sanitizeEmergencyProfile,
  getScheduleEscalation,
  getScheduledDate,
  getVisibleTabsForRole,
} from './LocalWorkflow';
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

  it('sanitizes missing, undefined and indexed fields from remote sync or storage into a valid EmergencyProfile', () => {
    // Escenario 1: Perfil completamente undefined o null
    const empty1 = sanitizeEmergencyProfile(undefined);
    assert.equal(empty1.patientFullName, 'Paciente');
    assert.deepEqual(empty1.allergies, []);
    assert.deepEqual(empty1.chronicConditions, []);
    assert.deepEqual(empty1.emergencyContact, { name: '', relationship: '', phone: '' });

    // Escenario 2: RTDB de Firebase serializa arrays vacíos como undefined
    const rtdbProfile = {
      patientFullName: 'Manuel Jesús',
      age: 74,
      bloodType: 'O+',
      allergies: undefined as unknown as string[],
      chronicConditions: undefined as unknown as string[],
      healthInsurance: 'EsSalud',
      emergencyContact: {
        name: 'María',
        relationship: 'Hija',
        phone: '954123456',
      },
    };
    const sanitizedRtdb = sanitizeEmergencyProfile(rtdbProfile);
    assert.equal(sanitizedRtdb.patientFullName, 'Manuel Jesús');
    assert.equal(sanitizedRtdb.age, 74);
    assert.deepEqual(sanitizedRtdb.allergies, []);
    assert.deepEqual(sanitizedRtdb.chronicConditions, []);
    assert.equal(sanitizedRtdb.emergencyContact.phone, '954123456');

    // Escenario 3: Objeto indexado tipo Firebase { "0": "Penicilina" } o strings
    const indexedProfile = {
      patientFullName: 'Rosa',
      age: '80' as unknown as number,
      allergies: { '0': 'Penicilina', '1': 'Ibuprofeno' } as unknown as string[],
      chronicConditions: 'Hipertensión, Diabetes' as unknown as string[],
      emergencyContact: undefined,
    };
    const sanitizedIndexed = sanitizeEmergencyProfile(indexedProfile as any);
    assert.equal(sanitizedIndexed.age, 80);
    assert.deepEqual(sanitizedIndexed.allergies, ['Penicilina', 'Ibuprofeno']);
    assert.deepEqual(sanitizedIndexed.chronicConditions, ['Hipertensión', 'Diabetes']);
    assert.deepEqual(sanitizedIndexed.emergencyContact, { name: '', relationship: '', phone: '' });
  });

  it('filters navigation tabs by role: patient only gets today and emergency, caregiver gets all tabs', () => {
    assert.deepEqual(getVisibleTabsForRole('patient'), ['today', 'emergency']);
    assert.deepEqual(getVisibleTabsForRole('patient', true), ['today', 'emergency']);
    assert.deepEqual(getVisibleTabsForRole('patient', false), ['today', 'stock', 'emergency']);
    assert.deepEqual(getVisibleTabsForRole('caregiver'), ['today', 'caregiver', 'stock', 'emergency']);
    assert.deepEqual(getVisibleTabsForRole('caregiver', false), ['today', 'caregiver', 'stock', 'emergency']);
  });
});
