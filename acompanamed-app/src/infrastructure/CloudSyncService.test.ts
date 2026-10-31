import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFamilyUrl,
  sanitizeFamilyCode,
  buildMemorableFamilyCode,
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

  it('genera códigos de familia memorables basados en el paciente para facilitar la recuperación tras borrar la app', () => {
    assert.equal(buildMemorableFamilyCode('Manuel Jesús Alhua', 74), 'MED-MANU-74');
    assert.equal(buildMemorableFamilyCode('Rosa María', 82), 'MED-ROSA-82');
    assert.equal(buildMemorableFamilyCode('Don Carlos', '68'), 'MED-DONC-68');
    assert.equal(buildMemorableFamilyCode('Ana', 0), 'MED-ANA-74');
    assert.equal(buildMemorableFamilyCode('', undefined), 'MED-MANU-74');
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

  it('formatea el estado de actividad de los dispositivos en vivo (online / visto hace X min)', () => {
    const { formatDeviceActivityStatus } = require('./CloudSyncService');
    const now = new Date('2026-10-31T12:00:00.000Z');

    // 10 segundos atrás -> En línea ahora
    const recent = formatDeviceActivityStatus('2026-10-31T11:59:50.000Z', now);
    assert.equal(recent.isOnline, true);
    assert.equal(recent.statusLabel, 'En línea ahora');

    // 15 minutos atrás -> Visto hace 15 min
    const minsAgo = formatDeviceActivityStatus('2026-10-31T11:45:00.000Z', now);
    assert.equal(minsAgo.isOnline, false);
    assert.equal(minsAgo.statusLabel, 'Visto hace 15 min');

    // 3 horas atrás -> Visto hace 3 h
    const hoursAgo = formatDeviceActivityStatus('2026-10-31T09:00:00.000Z', now);
    assert.equal(hoursAgo.isOnline, false);
    assert.equal(hoursAgo.statusLabel, 'Visto hace 3 h');
  });

  it('permite registrar, listar y revocar dispositivos conectados a la familia', async () => {
    const service = new CloudSyncService();
    const originalFetch = globalThis.fetch;
    const mockStore: Record<string, any> = {};

    try {
      globalThis.fetch = async (url: any, init?: any) => {
        const urlStr = String(url);
        if (init?.method === 'PUT') {
          mockStore[urlStr] = JSON.parse(init.body);
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        if (init?.method === 'DELETE') {
          delete mockStore[urlStr];
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        // GET
        const path = urlStr;
        const matching = Object.entries(mockStore)
          .filter(([k]) => k.startsWith(path.replace('.json', '')))
          .map(([_, v]) => v);
        return new Response(JSON.stringify(matching.reduce((acc, curr) => ({ ...acc, [curr.deviceId]: curr }), {})), { status: 200 });
      };

      const dev1 = {
        deviceId: 'dev-1',
        role: 'patient' as const,
        deviceName: 'Teléfono de Don Manuel',
        platform: 'Android',
        connectedAt: '2026-10-31T10:00:00Z',
        lastSeen: '2026-10-31T12:00:00Z',
      };

      const registered = await service.registerDevice('MED-MANU-74', dev1);
      assert.equal(registered, true);

      const devices = await service.fetchConnectedDevices('MED-MANU-74');
      assert.equal(devices.length, 1);
      assert.equal(devices[0].deviceName, 'Teléfono de Don Manuel');

      const revoked = await service.revokeDevice('MED-MANU-74', 'dev-1');
      assert.equal(revoked, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('sanitiza el emergencyProfile descargado si Firebase omite arreglos vacíos', async () => {
    const service = new CloudSyncService();
    const originalFetch = globalThis.fetch;
    try {
      const mockPayload = {
        familyCode: 'MED-TEST-01',
        updatedAt: '2026-10-31T12:00:00.000Z',
        patientName: 'Manuel Alhua',
        emergencyProfile: {
          patientFullName: 'Manuel Alhua',
          age: 74,
          bloodType: 'O+',
          emergencyContact: {
            name: 'María',
            phone: '954123456',
          },
        },
      };
      globalThis.fetch = async () => new Response(JSON.stringify(mockPayload), { status: 200 });
      const result = await service.fetchFamilyState('MED-TEST-01');
      assert.ok(result);
      assert.ok(result.emergencyProfile);
      assert.deepEqual(result.emergencyProfile.allergies, []);
      assert.deepEqual(result.emergencyProfile.chronicConditions, []);
      assert.equal(result.emergencyProfile.emergencyContact.phone, '954123456');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
