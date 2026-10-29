import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getTimeSlot,
  buildDailySchedule,
  filterDosesBySlot,
  getNextDueDose,
} from './ScheduleTimelineEngine';
import type { Medicine, DoseLog } from './types';

describe('AcompañaMed - ScheduleTimelineEngine (TDD Tests)', () => {
  const sampleMedicines: Medicine[] = [
    {
      id: 'med-losartan',
      name: 'Losartán Potásico',
      doseDescription: '50 mg',
      intervalHours: 24,
      instructions: 'Tomar con agua en el desayuno',
      visualPill: { shape: 'round', colorHex: '#38BDF8', colorName: 'Azul Celeste' },
      stock: 14,
      minStockAlert: 6,
      createdAt: '2026-10-29T08:00:00.000Z',
    },
    {
      id: 'med-metformina',
      name: 'Metformina',
      doseDescription: '850 mg',
      intervalHours: 24,
      instructions: 'Tomar con el almuerzo para evitar malestar gástrico',
      visualPill: { shape: 'capsule', colorHex: '#FFFFFF', colorName: 'Blanco' },
      stock: 20,
      minStockAlert: 5,
      createdAt: '2026-10-29T08:00:00.000Z',
    },
    {
      id: 'med-atorvastatina',
      name: 'Atorvastatina',
      doseDescription: '20 mg',
      intervalHours: 24,
      instructions: 'Tomar antes de dormir',
      visualPill: { shape: 'oval', colorHex: '#FACC15', colorName: 'Amarillo' },
      stock: 5,
      minStockAlert: 6,
      createdAt: '2026-10-29T08:00:00.000Z',
    },
  ];

  describe('getTimeSlot: Clasificación de franjas horarias geriátricas', () => {
    it('clasifica correctamente mañana (06:00 - 11:59)', () => {
      assert.equal(getTimeSlot(8), 'morning');
      assert.equal(getTimeSlot(11), 'morning');
    });

    it('clasifica correctamente tarde (12:00 - 17:59)', () => {
      assert.equal(getTimeSlot(12), 'afternoon');
      assert.equal(getTimeSlot(14), 'afternoon');
    });

    it('clasifica correctamente noche (18:00 - 05:59)', () => {
      assert.equal(getTimeSlot(20), 'night');
      assert.equal(getTimeSlot(23), 'night');
      assert.equal(getTimeSlot(2), 'night');
    });
  });

  describe('buildDailySchedule: Generación de agenda ordenada del día', () => {
    it('construye la agenda cronológica con los 3 medicamentos ordenados por horario', () => {
      const scheduleTimes: Record<string, string> = {
        'med-losartan': '08:00',
        'med-metformina': '13:00',
        'med-atorvastatina': '21:00',
      };
      const logs: DoseLog[] = [];
      const refDate = new Date('2026-10-29T10:00:00.000Z');

      const timeline = buildDailySchedule(sampleMedicines, scheduleTimes, logs, refDate);

      assert.equal(timeline.length, 3);
      assert.equal(timeline[0].medicine.id, 'med-losartan');
      assert.equal(timeline[0].timeSlot, 'morning');
      assert.equal(timeline[1].medicine.id, 'med-metformina');
      assert.equal(timeline[1].timeSlot, 'afternoon');
      assert.equal(timeline[2].medicine.id, 'med-atorvastatina');
      assert.equal(timeline[2].timeSlot, 'night');
    });

    it('marca la dosis como tomada si existe un log de hoy con status taken', () => {
      const scheduleTimes: Record<string, string> = {
        'med-losartan': '08:00',
      };
      const logs: DoseLog[] = [
        {
          id: 'log-1',
          medicineId: 'med-losartan',
          scheduledTime: '2026-10-29T08:00:00.000Z',
          takenTime: '2026-10-29T08:04:00.000Z',
          status: 'taken',
          registeredBy: 'patient',
        },
      ];
      const refDate = new Date('2026-10-29T10:00:00.000Z');

      const timeline = buildDailySchedule([sampleMedicines[0]], scheduleTimes, logs, refDate);
      assert.equal(timeline[0].isTakenToday, true);
      assert.equal(timeline[0].isPastDue, false);
    });

    it('marca como vencida (pastDue) si la hora ya pasó y no ha sido tomada', () => {
      const scheduleTimes: Record<string, string> = {
        'med-losartan': '08:00',
      };
      const logs: DoseLog[] = [];
      // Hora actual son las 10:00 (ya pasaron 2 horas desde las 08:00)
      const refDate = new Date('2026-10-29T10:00:00');

      const timeline = buildDailySchedule([sampleMedicines[0]], scheduleTimes, logs, refDate);
      assert.equal(timeline[0].isTakenToday, false);
      assert.equal(timeline[0].isPastDue, true);
    });
  });

  describe('getNextDueDose y filterDosesBySlot', () => {
    it('filtra correctamente las dosis por franja horaria', () => {
      const scheduleTimes: Record<string, string> = {
        'med-losartan': '08:00',
        'med-metformina': '13:00',
        'med-atorvastatina': '21:00',
      };
      const timeline = buildDailySchedule(sampleMedicines, scheduleTimes, [], new Date('2026-10-29T07:00:00'));

      const morningDoses = filterDosesBySlot(timeline, 'morning');
      assert.equal(morningDoses.length, 1);
      assert.equal(morningDoses[0].medicine.id, 'med-losartan');

      const afternoonDoses = filterDosesBySlot(timeline, 'afternoon');
      assert.equal(afternoonDoses.length, 1);
      assert.equal(afternoonDoses[0].medicine.id, 'med-metformina');
    });

    it('obtiene la siguiente dosis pendiente prioritaria', () => {
      const scheduleTimes: Record<string, string> = {
        'med-losartan': '08:00',
        'med-metformina': '13:00',
      };
      const logs: DoseLog[] = [
        {
          id: 'log-1',
          medicineId: 'med-losartan',
          scheduledTime: '2026-10-29T08:00:00.000Z',
          takenTime: '2026-10-29T08:02:00.000Z',
          status: 'taken',
          registeredBy: 'patient',
        },
      ];
      const timeline = buildDailySchedule(
        [sampleMedicines[0], sampleMedicines[1]],
        scheduleTimes,
        logs,
        new Date('2026-10-29T09:00:00')
      );

      const nextDue = getNextDueDose(timeline);
      assert.ok(nextDue);
      assert.equal(nextDue.medicine.id, 'med-metformina');
    });
  });
});
