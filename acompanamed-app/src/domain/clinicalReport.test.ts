import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateClinicalSummary,
  validateEmergencyProfile,
} from './ClinicalReportEngine';
import type { Medicine, DoseLog, EmergencyProfile } from './types';

describe('AcompañaMed - ClinicalReportEngine (TDD Tests)', () => {
  const sampleProfile: EmergencyProfile = {
    patientFullName: 'Manuel Jesús Alhua',
    age: 74,
    bloodType: 'O+',
    allergies: ['Penicilina', 'Ibuprofeno (AINEs)'],
    chronicConditions: ['Hipertensión Arterial', 'Diabetes Mellitus Tipo 2'],
    healthInsurance: 'EsSalud - Policlínico Yanahuara',
    emergencyContact: {
      name: 'María Alhua',
      relationship: 'Hija / Cuidadora Principal',
      phone: '+51 954 123 456',
    },
  };

  const sampleMeds: Medicine[] = [
    {
      id: 'med-losartan',
      name: 'Losartán',
      doseDescription: '50 mg',
      intervalHours: 24,
      instructions: 'Mañana',
      visualPill: { shape: 'round', colorHex: '#38BDF8', colorName: 'Azul' },
      stock: 14,
      minStockAlert: 6,
      createdAt: '2026-10-29T08:00:00.000Z',
    },
    {
      id: 'med-metformina',
      name: 'Metformina',
      doseDescription: '850 mg',
      intervalHours: 24,
      instructions: 'Almuerzo',
      visualPill: { shape: 'capsule', colorHex: '#FFFFFF', colorName: 'Blanco' },
      stock: 20,
      minStockAlert: 5,
      createdAt: '2026-10-29T08:00:00.000Z',
    },
  ];

  describe('validateEmergencyProfile: Validación de ficha de emergencia', () => {
    it('valida con éxito un perfil médico completo', () => {
      const result = validateEmergencyProfile(sampleProfile);
      assert.equal(result.isValid, true);
      assert.equal(result.errors.length, 0);
    });

    it('detecta errores si falta el teléfono de contacto de auxilio o el nombre', () => {
      const invalid = {
        ...sampleProfile,
        emergencyContact: { name: '', relationship: '', phone: '' },
      };
      const result = validateEmergencyProfile(invalid);
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some((e) => /contacto de emergencia/i.test(e)));
    });
  });

  describe('generateClinicalSummary: Desglose por fármaco y alertas para el médico', () => {
    it('calcula la adherencia desglosada para cada medicamento', () => {
      const logs: DoseLog[] = [
        { id: '1', medicineId: 'med-losartan', scheduledTime: '', status: 'taken', registeredBy: 'patient' },
        { id: '2', medicineId: 'med-losartan', scheduledTime: '', status: 'taken', registeredBy: 'patient' },
        { id: '3', medicineId: 'med-metformina', scheduledTime: '', status: 'missed', registeredBy: 'patient' },
        { id: '4', medicineId: 'med-metformina', scheduledTime: '', status: 'taken', registeredBy: 'patient' },
      ];

      const summary = generateClinicalSummary(sampleMeds, logs, sampleProfile);

      assert.equal(summary.medicationBreakdown.length, 2);

      const losartan = summary.medicationBreakdown.find((b) => b.medicineId === 'med-losartan');
      assert.ok(losartan);
      assert.equal(losartan.adherenceRate, 100);

      const metformina = summary.medicationBreakdown.find((b) => b.medicineId === 'med-metformina');
      assert.ok(metformina);
      assert.equal(metformina.adherenceRate, 50);
    });

    it('genera advertencia clínica cuando un fármaco cae por debajo del 80% de adherencia', () => {
      const logs: DoseLog[] = [
        { id: '1', medicineId: 'med-metformina', scheduledTime: '', status: 'missed', registeredBy: 'patient' },
        { id: '2', medicineId: 'med-metformina', scheduledTime: '', status: 'missed', registeredBy: 'patient' },
      ];

      const summary = generateClinicalSummary(sampleMeds, logs, sampleProfile);
      assert.ok(summary.clinicalWarnings.some((w) => /Metformina/i.test(w)));
    });

    it('genera texto formal del informe médico estructurado', () => {
      const summary = generateClinicalSummary(sampleMeds, [], sampleProfile);
      assert.ok(summary.formattedReportText.includes('Manuel Jesús Alhua'));
      assert.ok(summary.formattedReportText.includes('EsSalud'));
      assert.ok(summary.formattedReportText.includes('Penicilina'));
    });
  });
});
