import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFamilyUrl,
  sanitizeFamilyCode,
  isStateNewer,
  CloudSyncService,
} from './CloudSyncService';
import type { FamilySyncPayload } from './CloudSyncService';

describe('AcompañaMed - CloudSyncService (Inter-Device Cloud Sync)', () => {
  it('distinguishes a missing family from a failed download before any upload', async () => {
    const originalFetch = globalThis.fetch;
    const service = new CloudSyncService();
    try {
      globalThis.fetch = async () => new Response('null', { status: 200 });
      assert.equal(await service.fetchFamilyState('TEST-LOCAL'), null);
      globalThis.fetch = async () => new Response('unavailable', { status: 503 });
      await assert.rejects(() => service.fetchFamilyState('TEST-LOCAL'));
      globalThis.fetch = async () => { throw new Error('offline'); };
      await assert.rejects(() => service.fetchFamilyState('TEST-LOCAL'));
    } finally { globalThis.fetch = originalFetch; }
  });
  it('limpia y normaliza el código de familia a mayúsculas sin caracteres inválidos', () => {
    assert.equal(sanitizeFamilyCode('  med-manu-74  '), 'MED-MANU-74');
    assert.equal(sanitizeFamilyCode('med_manu/74!'), 'MED-MANU-74');
  });

  it('construye la URL REST canónica de Firebase Realtime Database para el código de familia', () => {
    const url = buildFamilyUrl('MED-MANU-74');
    assert.equal(
      url,
      'https://acompanamed-unsa-2026-default-rtdb.firebaseio.com/families/MED-MANU-74.json'
    );
  });

  it('compara timestamps ISO correctamente para evitar sobrescribir con datos antiguos', () => {
    const stateA: FamilySyncPayload = {
      familyCode: 'MED-MANU-74',
      updatedAt: '2026-10-30T05:00:00.000Z',
      updatedBy: 'patient',
      patientName: 'Manuel Jesús Alhua',
      medicines: [],
      schedules: {},
      logs: [],
      emergencyProfile: {
        patientFullName: 'Manuel Jesús Alhua',
        age: 74,
        bloodType: 'O+',
        allergies: [],
        chronicConditions: [],
        healthInsurance: 'EsSalud',
        emergencyContact: { name: 'María', relationship: 'Hija', phone: '954123456' },
      },
    };

    const stateB: FamilySyncPayload = {
      ...stateA,
      updatedAt: '2026-10-30T05:05:00.000Z',
      updatedBy: 'caregiver',
    };

    assert.equal(isStateNewer(stateB, stateA), true);
    assert.equal(isStateNewer(stateA, stateB), false);
  });
});
