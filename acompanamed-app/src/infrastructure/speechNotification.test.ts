import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatSeniorInstructionSpeech,
  formatConfirmationSpeech,
  buildDoseNotificationPayload,
  buildEscalationNotificationPayload,
  calculateEscalationTriggerDate,
} from './SpeechNotificationEngines';
import type { Medicine } from '../domain/types';

describe('AcompañaMed - Speech & Notification Engines (TDD Tests)', () => {
  const sampleMed: Medicine = {
    id: 'med-losartan',
    name: 'Losartán Potásico',
    doseDescription: '50 mg',
    intervalHours: 24,
    instructions: 'Tomar con medio vaso de agua después del desayuno.',
    visualPill: { shape: 'round', colorHex: '#38BDF8', colorName: 'Azul Celeste' },
    stock: 14,
    minStockAlert: 6,
    createdAt: '2026-10-29T08:00:00.000Z',
  };

  describe('formatSeniorInstructionSpeech: Síntesis de voz respetuosa y accesible', () => {
    it('genera la frase de voz pausada con saludo, nombre del fármaco e instrucción', () => {
      const speech = formatSeniorInstructionSpeech(
        'Don Manuel',
        sampleMed.name,
        sampleMed.doseDescription,
        sampleMed.instructions
      );

      assert.ok(speech.includes('Don Manuel'));
      assert.ok(speech.includes('Losartán Potásico'));
      assert.ok(speech.includes('50 mg'));
      assert.ok(speech.includes('medio vaso de agua'));
    });

    it('genera la frase de confirmación tranquilizadora', () => {
      const speech = formatConfirmationSpeech('Don Manuel', sampleMed.name, 13);
      assert.ok(speech.includes('Don Manuel'));
      assert.ok(speech.includes('registrada con éxito'));
      assert.ok(speech.includes('13'));
    });
  });

  describe('NotificationPayloads & Triggers: Recordatorios y Escalamiento', () => {
    it('construye el payload de recordatorio de dosis con sonido y categoría médica', () => {
      const payload = buildDoseNotificationPayload(sampleMed, '08:00');
      assert.equal(payload.title, 'Hora de su medicina • Losartán Potásico');
      assert.ok(payload.body.includes('08:00'));
      assert.ok(payload.body.includes('50 mg'));
      assert.equal(payload.data.medicineId, 'med-losartan');
    });

    it('construye el payload de alerta de escalamiento al cuidador', () => {
      const payload = buildEscalationNotificationPayload(
        'Don Manuel',
        sampleMed,
        '08:00',
        30
      );
      assert.ok(payload.title.includes('Alerta de Omisión'));
      assert.ok(payload.body.includes('Don Manuel'));
      assert.ok(payload.body.includes('30 minutos'));
      assert.equal(payload.data.type, 'caregiver_escalation');
    });

    it('calcula la fecha y hora exacta del trigger de escalamiento (+30 min)', () => {
      const baseDate = new Date('2026-10-29T08:00:00.000Z');
      const triggerDate = calculateEscalationTriggerDate(baseDate, 30);

      const diffMinutes = (triggerDate.getTime() - baseDate.getTime()) / (1000 * 60);
      assert.equal(diffMinutes, 30);
    });
  });
});
