import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canRegisterDose,
  decrementStock,
  isStockLow,
  daysRemaining,
  calculateAdherence,
  evaluateEscalation,
} from './index';
import type { Medicine, DoseLog } from './types';

describe('AcompañaMed - Domain Engines (TDD Tests)', () => {
  const sampleMedicine: Medicine = {
    id: 'med-01',
    name: 'Losartán Potásico',
    doseDescription: '50 mg',
    intervalHours: 12,
    instructions: 'Tomar con medio vaso de agua después del desayuno',
    visualPill: {
      shape: 'round',
      colorHex: '#FFFFFF',
      colorName: 'Blanco',
    },
    stock: 14,
    minStockAlert: 6,
    createdAt: '2026-10-29T08:00:00.000Z',
  };

  describe('DuplicateGuard: Prevención de tomas duplicadas accidentales', () => {
    it('permite registrar la toma cuando no hay registros previos hoy', () => {
      const logs: DoseLog[] = [];
      const result = canRegisterDose('med-01', logs, new Date('2026-10-29T08:05:00.000Z'));
      assert.equal(result.allowed, true);
    });

    it('bloquea el registro si ya se registró una toma hace menos del intervalo seguro (2 horas)', () => {
      const logs: DoseLog[] = [
        {
          id: 'log-01',
          medicineId: 'med-01',
          scheduledTime: '2026-10-29T08:00:00.000Z',
          takenTime: '2026-10-29T08:05:00.000Z',
          status: 'taken',
          registeredBy: 'patient',
        },
      ];
      // Intenta marcar a las 08:20 (15 min después)
      const result = canRegisterDose('med-01', logs, new Date('2026-10-29T08:20:00.000Z'));
      assert.equal(result.allowed, false);
      assert.match(result.reason || '', /ya fue registrada/i);
    });

    it('permite el registro cuando ha transcurrido el tiempo correspondiente a la siguiente dosis', () => {
      const logs: DoseLog[] = [
        {
          id: 'log-01',
          medicineId: 'med-01',
          scheduledTime: '2026-10-29T08:00:00.000Z',
          takenTime: '2026-10-29T08:05:00.000Z',
          status: 'taken',
          registeredBy: 'patient',
        },
      ];
      // Intenta marcar la siguiente dosis 12 horas después (20:00)
      const result = canRegisterDose('med-01', logs, new Date('2026-10-29T20:02:00.000Z'));
      assert.equal(result.allowed, true);
    });
  });

  describe('StockManager: Gestión de botiquín y alertas preventivas', () => {
    it('decrementa el stock en 1 unidad tras la confirmación', () => {
      const updated = decrementStock(sampleMedicine, 1);
      assert.equal(updated.stock, 13);
    });

    it('no permite que el stock caiga por debajo de cero', () => {
      const emptyMed = { ...sampleMedicine, stock: 0 };
      const updated = decrementStock(emptyMed, 1);
      assert.equal(updated.stock, 0);
    });

    it('detecta correctamente cuando el stock entra en umbral crítico de alerta', () => {
      const normalStockMed = { ...sampleMedicine, stock: 10, minStockAlert: 5 };
      assert.equal(isStockLow(normalStockMed), false);

      const lowStockMed = { ...sampleMedicine, stock: 4, minStockAlert: 5 };
      assert.equal(isStockLow(lowStockMed), true);
    });

    it('calcula los días restantes de medicación basados en la dosis diaria', () => {
      // 14 pastillas, 2 tomas al día (cada 12h) => 7 días restantes
      const days = daysRemaining(14, 2);
      assert.equal(days, 7);
    });
  });

  describe('AdherenceCalculator: Métricas para el médico tratante', () => {
    it('calcula 100% de adherencia cuando todas las dosis programadas fueron tomadas', () => {
      const logs: DoseLog[] = [
        { id: '1', medicineId: 'm1', scheduledTime: '', status: 'taken', registeredBy: 'patient' },
        { id: '2', medicineId: 'm1', scheduledTime: '', status: 'taken', registeredBy: 'patient' },
      ];
      const summary = calculateAdherence(logs);
      assert.equal(summary.totalScheduled, 2);
      assert.equal(summary.totalTaken, 2);
      assert.equal(summary.adherencePercentage, 100);
      assert.equal(summary.statusRating, 'excellent');
    });

    it('calcula porcentaje correcto y calificación warning o critical según omisiones', () => {
      const logs: DoseLog[] = [
        { id: '1', medicineId: 'm1', scheduledTime: '', status: 'taken', registeredBy: 'patient' },
        { id: '2', medicineId: 'm1', scheduledTime: '', status: 'missed', registeredBy: 'patient' },
        { id: '3', medicineId: 'm1', scheduledTime: '', status: 'taken', registeredBy: 'caregiver' },
        { id: '4', medicineId: 'm1', scheduledTime: '', status: 'missed', registeredBy: 'patient' },
      ];
      const summary = calculateAdherence(logs);
      assert.equal(summary.totalScheduled, 4);
      assert.equal(summary.totalTaken, 2);
      assert.equal(summary.totalMissed, 2);
      assert.equal(summary.adherencePercentage, 50);
      assert.equal(summary.statusRating, 'critical');
    });
  });

  describe('EscalationEngine: Escalamiento hacia la red de apoyo / cuidador', () => {
    it('no escala si está dentro de la ventana de gracia (ej. 15 minutos)', () => {
      const scheduled = new Date('2026-10-29T08:00:00.000Z');
      const now = new Date('2026-10-29T08:15:00.000Z');
      const result = evaluateEscalation(scheduled, now, 30);
      assert.equal(result.shouldEscalate, false);
      assert.equal(result.minutesElapsed, 15);
    });

    it('dispara la alerta de escalamiento si han transcurrido más de 30 minutos sin respuesta', () => {
      const scheduled = new Date('2026-10-29T08:00:00.000Z');
      const now = new Date('2026-10-29T08:35:00.000Z');
      const result = evaluateEscalation(scheduled, now, 30);
      assert.equal(result.shouldEscalate, true);
      assert.equal(result.minutesElapsed, 35);
      assert.match(result.message, /35 minutos/);
    });
  });
});
