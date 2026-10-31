import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateMedicineForm } from './MedicineFormValidation';

const validForm = {
  name: ' Losartán ',
  dose: ' 50 mg ',
  scheduleTime: '08:00',
  stock: '30',
  minAlert: '6',
};

describe('Medicine form validation', () => {
  it('preserves the existing normal add/edit values and trims required text', () => {
    assert.deepEqual(validateMedicineForm(validForm), {
      valid: true,
      value: { name: 'Losartán', doseDescription: '50 mg', scheduleTime: '08:00', stock: 30, minStockAlert: 6 },
    });
  });

  it('keeps zero inventory and zero alert threshold instead of replacing them', () => {
    const result = validateMedicineForm({ ...validForm, stock: '0', minAlert: '0', scheduleTime: '00:00' });
    assert.equal(result.valid, true);
    if (result.valid) {
      assert.equal(result.value.stock, 0);
      assert.equal(result.value.minStockAlert, 0);
      assert.equal(result.value.scheduleTime, '00:00');
    }
  });

  it('rejects negative, fractional, malformed and missing inventory without mutating input', () => {
    for (const value of ['-1', '1.5', '12abc', '1e3', '', '9007199254740992']) {
      for (const field of ['stock', 'minAlert'] as const) {
        const input = { ...validForm, [field]: value };
        const before = { ...input };
        const result = validateMedicineForm(input);
        assert.equal(result.valid, false, `${field}=${value}`);
        if (!result.valid) assert.ok(result.errors[field]);
        assert.deepEqual(input, before);
      }
    }
  });

  it('accepts only an explicit valid 24-hour HH:MM schedule', () => {
    for (const scheduleTime of ['24:00', '23:60', '8:00', '08:0', '12:30oops', '', '-1:00']) {
      const result = validateMedicineForm({ ...validForm, scheduleTime });
      assert.equal(result.valid, false, scheduleTime);
      if (!result.valid) assert.ok(result.errors.scheduleTime);
    }
    assert.equal(validateMedicineForm({ ...validForm, scheduleTime: '23:59' }).valid, true);
  });

  it('rejects a blank name or prescribed dose with field-specific errors', () => {
    const result = validateMedicineForm({ ...validForm, name: '   ', dose: '' });
    assert.equal(result.valid, false);
    if (!result.valid) {
      assert.ok(result.errors.name);
      assert.ok(result.errors.dose);
    }
  });

  it('validates clinical medicine presets have valid visual pill definitions with photos', () => {
    const losartan = validForm;
    const validated = validateMedicineForm(losartan);
    assert.equal(validated.valid, true);
    if (validated.valid) {
      assert.equal(validated.value.name, 'Losartán');
      assert.equal(validated.value.stock, 30);
    }
  });
});
