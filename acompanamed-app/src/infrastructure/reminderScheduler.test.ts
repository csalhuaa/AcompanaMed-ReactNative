import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ReminderScheduler, type ReminderAdapter, type ReminderRequest } from './ReminderScheduler';
import type { Medicine } from '../domain/types';

const medicine: Medicine = {
  id: 'med-1', name: 'Treatment', doseDescription: '1 tablet', instructions: 'With water',
  intervalHours: 24, stock: 10, minStockAlert: 2, createdAt: '2026-10-30',
  visualPill: { shape: 'round', colorHex: '#FFFFFF', colorName: 'White' },
};

class FakeAdapter implements ReminderAdapter {
  supported = true;
  granted = true;
  permissionRequests: boolean[] = [];
  scheduled = new Map<string, ReminderRequest>();
  writes = 0;
  async permission(request: boolean) { this.permissionRequests.push(request); return this.granted; }
  async list() { return [...this.scheduled.values()]; }
  async schedule(request: ReminderRequest) {
    this.writes++;
    this.scheduled.set(request.identifier, request);
    return request.identifier;
  }
  async cancel(identifier: string) { this.scheduled.delete(identifier); }
}

describe('ReminderScheduler', () => {
  it('schedules midnight daily at the chosen local hour and keeps the existing payload', async () => {
    const adapter = new FakeAdapter();
    const scheduler = new ReminderScheduler(adapter);
    const id = await scheduler.scheduleDoseReminder(medicine, '00:15');
    assert.ok(id);
    const request = adapter.scheduled.get(id)!;
    assert.deepEqual(request.trigger, { type: 'daily', hour: 0, minute: 15 });
    assert.equal(request.content.data.medicineId, medicine.id);
    assert.match(request.content.body, /00:15/);
    assert.match(request.content.body, /With water/);
    assert.deepEqual(adapter.permissionRequests, [true]);
  });

  it('replaces an edited alarm, syncs idempotently, and removes only owned obsolete alarms', async () => {
    const adapter = new FakeAdapter();
    const scheduler = new ReminderScheduler(adapter);
    const id = await scheduler.scheduleDoseReminder(medicine, '08:00');
    assert.equal(await scheduler.scheduleDoseReminder(medicine, '21:30'), id);
    assert.equal(adapter.scheduled.size, 1);
    const writes = adapter.writes;
    assert.equal(await scheduler.syncDoseReminders([medicine], { [medicine.id]: '21:30' }), true);
    assert.equal(adapter.writes, writes);
    const unrelated = { ...adapter.scheduled.get(id!)!, identifier: 'other-app-event' };
    adapter.scheduled.set(unrelated.identifier, unrelated);
    await scheduler.syncDoseReminders([], {});
    assert.deepEqual([...adapter.scheduled.keys()], ['other-app-event']);
    assert.equal(adapter.permissionRequests.at(-1), false);
  });

  it('snoozes for fifteen minutes, replaces repeated snoozes and cancels only snooze on taking', async () => {
    const adapter = new FakeAdapter();
    const now = new Date(2026, 9, 31, 9, 10);
    const scheduler = new ReminderScheduler(adapter, () => now);
    const daily = await scheduler.scheduleDoseReminder(medicine, '09:00');
    const snooze = await scheduler.scheduleSnoozeReminder(medicine);
    assert.ok(snooze);
    assert.deepEqual(adapter.scheduled.get(snooze)!.trigger, {
      type: 'date', date: new Date(now.getTime() + 15 * 60_000),
    });
    assert.equal(await scheduler.scheduleSnoozeReminder(medicine), snooze);
    assert.equal(adapter.scheduled.size, 2);
    await scheduler.cancelSnoozeReminder(medicine.id);
    assert.deepEqual([...adapter.scheduled.keys()], [daily]);
    await scheduler.scheduleSnoozeReminder(medicine);
    await scheduler.cancelMedicineReminders(medicine.id);
    assert.equal(adapter.scheduled.size, 0);
  });

  it('does not schedule or claim success when permissions are denied or background web scheduling is unsupported', async () => {
    const adapter = new FakeAdapter();
    const scheduler = new ReminderScheduler(adapter);
    adapter.granted = false;
    assert.equal(await scheduler.scheduleDoseReminder(medicine, '08:00'), null);
    assert.equal(await scheduler.scheduleSnoozeReminder(medicine), null);
    assert.equal(await scheduler.syncDoseReminders([medicine], {}), false);
    assert.equal(adapter.scheduled.size, 0);
    adapter.supported = false;
    adapter.granted = true;
    assert.equal(await scheduler.scheduleDoseReminder(medicine, '08:00'), null);
    assert.equal(adapter.scheduled.size, 0);
  });

  it('rejects invalid times and snooze delays without replacing a valid alarm', async () => {
    const adapter = new FakeAdapter();
    const scheduler = new ReminderScheduler(adapter);
    await scheduler.scheduleDoseReminder(medicine, '08:00');
    const original = [...adapter.scheduled.values()];
    for (const time of ['24:00', '12:60', '8:00', 'x']) {
      assert.equal(await scheduler.scheduleDoseReminder(medicine, time), null);
    }
    assert.equal(await scheduler.scheduleSnoozeReminder(medicine, -1), null);
    assert.deepEqual([...adapter.scheduled.values()], original);
  });

  it('serializes configuration sync and deletion so removed medicines cannot regain alarms', async () => {
    const adapter = new FakeAdapter();
    const scheduler = new ReminderScheduler(adapter);
    await Promise.all([
      scheduler.syncDoseReminders([medicine], { [medicine.id]: '08:00' }),
      scheduler.cancelMedicineReminders(medicine.id),
    ]);
    assert.equal(adapter.scheduled.size, 0);
  });
});
