import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { StorageService, MemoryStorageAdapter } from './StorageService';
import type { Medicine, DoseLog } from '../domain/types';

describe('AcompañaMed - StorageService (Offline-First Persistence Tests)', () => {
  let adapter: MemoryStorageAdapter;
  let service: StorageService;

  const sampleMedicine: Medicine = {
    id: 'med-test-1',
    name: 'Enalapril',
    doseDescription: '10 mg',
    intervalHours: 24,
    instructions: 'Tomar en la mañana con agua',
    visualPill: { shape: 'round', colorHex: '#F87171', colorName: 'Rojo Coral' },
    stock: 28,
    minStockAlert: 5,
    createdAt: '2026-10-29T08:00:00.000Z',
  };

  const sampleLog: DoseLog = {
    id: 'log-test-1',
    medicineId: 'med-test-1',
    scheduledTime: '2026-10-29T08:00:00.000Z',
    takenTime: '2026-10-29T08:05:00.000Z',
    status: 'taken',
    registeredBy: 'patient',
  };

  beforeEach(() => {
    adapter = new MemoryStorageAdapter();
    service = new StorageService(adapter);
  });

  it('retorna los medicamentos por defecto si el almacenamiento está vacío', async () => {
    const loaded = await service.loadMedicines([sampleMedicine]);
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].name, 'Enalapril');
  });

  it('persiste y recupera medicamentos correctamente', async () => {
    await service.saveMedicines([sampleMedicine]);

    const loaded = await service.loadMedicines([]);
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].id, 'med-test-1');
    assert.equal(loaded[0].stock, 28);
  });

  it('persiste y recupera bitácora de tomas (DoseLogs)', async () => {
    await service.saveLogs([sampleLog]);

    const loaded = await service.loadLogs([]);
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].id, 'log-test-1');
    assert.equal(loaded[0].status, 'taken');
    assert.equal(loaded[0].registeredBy, 'patient');
  });

  it('persiste y recupera horarios de programación de fármacos', async () => {
    const schedules = { 'med-test-1': '07:30' };
    await service.saveSchedules(schedules);

    const loaded = await service.loadSchedules({});
    assert.equal(loaded['med-test-1'], '07:30');
  });

  it('persiste y recupera el rol activo seleccionado (Senior vs Cuidador)', async () => {
    await service.saveActiveRole('caregiver');
    const role = await service.loadActiveRole();
    assert.equal(role, 'caregiver');
  });

  it('maneja datos corruptos de forma resiliente retornando el valor por defecto sin fallar', async () => {
    // Simular que el almacenamiento se corrompió con texto no JSON
    await adapter.setItem('@acompanamed:medicines', '{invalid_json');

    const loaded = await service.loadMedicines([sampleMedicine]);
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].id, 'med-test-1');
  });
});
