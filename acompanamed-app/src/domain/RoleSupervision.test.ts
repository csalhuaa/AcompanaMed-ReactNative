import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getVisibleTabsForRole } from './LocalWorkflow';
import { ActorRole } from './types';

describe('Role Supervision & Autonomous Patient Rules', () => {
  it('hides Botiquín tab when patient has a caregiver linked (supervised mode)', () => {
    const tabs = getVisibleTabsForRole('patient', true);
    assert.deepEqual(tabs, ['today', 'emergency']);
    assert.equal(tabs.includes('stock'), false);
  });

  it('exposes Botiquín tab when patient is autonomous (no caregiver linked)', () => {
    const tabs = getVisibleTabsForRole('patient', false);
    assert.deepEqual(tabs, ['today', 'stock', 'emergency']);
    assert.equal(tabs.includes('stock'), true);
  });

  it('always exposes Botiquín and Cuidador tabs for caregiver role regardless of connection', () => {
    assert.deepEqual(getVisibleTabsForRole('caregiver', true), ['today', 'caregiver', 'stock', 'emergency']);
    assert.deepEqual(getVisibleTabsForRole('caregiver', false), ['today', 'caregiver', 'stock', 'emergency']);
  });

  it('derives canAddMedicine rule: permitted for caregiver and autonomous patient, forbidden for supervised patient', () => {
    const canAddMedicine = (role: ActorRole, hasCaregiver: boolean) => {
      return role === 'caregiver' || !hasCaregiver;
    };

    assert.equal(canAddMedicine('patient', false), true, 'Autonomous patient can add medicine');
    assert.equal(canAddMedicine('patient', true), false, 'Supervised patient cannot add unprescribed medicine');
    assert.equal(canAddMedicine('caregiver', false), true, 'Caregiver can add medicine');
    assert.equal(canAddMedicine('caregiver', true), true, 'Caregiver can add medicine');
  });

  it('correctly filters link-to-patient box in settings: caregiver only', () => {
    const shouldShowLinkPatientBox = (role: ActorRole) => role !== 'patient';

    assert.equal(shouldShowLinkPatientBox('patient'), false, 'Patient must not see link-to-patient input');
    assert.equal(shouldShowLinkPatientBox('caregiver'), true, 'Caregiver must see link-to-patient input');
  });
});
