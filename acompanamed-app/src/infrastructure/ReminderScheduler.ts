import type { Medicine } from '../domain/types';
import { buildDoseNotificationPayload, type NotificationPayload } from './SpeechNotificationEngines';

export interface ReminderRequest {
  identifier: string;
  content: NotificationPayload;
  trigger: { type: 'daily'; hour: number; minute: number } | { type: 'date'; date: Date };
}

export interface ReminderAdapter {
  supported: boolean;
  permission(request: boolean): Promise<boolean>;
  list(): Promise<Array<{ identifier: string; content: { data: Record<string, unknown> } }>>;
  schedule(request: ReminderRequest): Promise<string>;
  cancel(identifier: string): Promise<void>;
}

const PREFIX = 'acompanamed:';
const dailyId = (id: string) => `${PREFIX}dose:${encodeURIComponent(id)}`;
const snoozeId = (id: string) => `${PREFIX}snooze:${encodeURIComponent(id)}`;
const validTime = (time: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

export class ReminderScheduler {
  private pending: Promise<unknown> = Promise.resolve();

  constructor(private adapter: ReminderAdapter, private now: () => Date = () => new Date()) {}

  // Serialize native mutations so an earlier sync cannot recreate a deleted alarm.
  private enqueue<T>(action: () => Promise<T>): Promise<T> {
    const result = this.pending.then(action);
    this.pending = result.catch(() => undefined);
    return result;
  }

  private dailyRequest(medicine: Medicine, time: string): ReminderRequest {
    const content = buildDoseNotificationPayload(medicine, time);
    const [hour, minute] = time.split(':').map(Number);
    content.data.reminderSignature = JSON.stringify([time, content.title, content.body]);
    return { identifier: dailyId(medicine.id), content, trigger: { type: 'daily', hour, minute } };
  }

  async scheduleDoseReminder(medicine: Medicine, time: string): Promise<string | null> {
    return this.enqueue(async () => {
      if (!this.adapter.supported || !validTime(time)) return null;
      try {
        if (!await this.adapter.permission(true)) return null;
        const request = this.dailyRequest(medicine, time);
        await this.adapter.cancel(request.identifier);
        await this.adapter.cancel(snoozeId(medicine.id));
        return await this.adapter.schedule(request);
      } catch { return null; }
    });
  }

  async scheduleSnoozeReminder(medicine: Medicine, minutes = 15): Promise<string | null> {
    return this.enqueue(async () => {
      if (!this.adapter.supported || !Number.isFinite(minutes) || minutes <= 0) return null;
      try {
        if (!await this.adapter.permission(true)) return null;
        const date = new Date(this.now().getTime() + minutes * 60_000);
        if (!Number.isFinite(date.getTime())) return null;
        const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        const content = buildDoseNotificationPayload(medicine, time);
        content.data.type = 'dose_snooze';
        const identifier = snoozeId(medicine.id);
        await this.adapter.cancel(identifier);
        return await this.adapter.schedule({ identifier, content, trigger: { type: 'date', date } });
      } catch { return null; }
    });
  }

  // The argument is the medicine ID, not the notification identifier.
  async cancelSnoozeReminder(medicineId: string): Promise<void> {
    return this.enqueue(async () => {
      if (this.adapter.supported) await this.adapter.cancel(snoozeId(medicineId));
    });
  }

  async cancelMedicineReminders(medicineId: string): Promise<void> {
    return this.enqueue(async () => {
      if (!this.adapter.supported) return;
      await this.adapter.cancel(dailyId(medicineId));
      await this.adapter.cancel(snoozeId(medicineId));
    });
  }

  async syncDoseReminders(medicines: Medicine[], times: Record<string, string>): Promise<boolean> {
    return this.enqueue(async () => {
      if (!this.adapter.supported) return false;
      try {
        // Startup and background reconciliation must never open a permission prompt.
        if (!await this.adapter.permission(false)) return false;
        if (medicines.some((medicine) => !validTime(times[medicine.id] ?? '08:00'))) return false;
        const desired = medicines.map((medicine) => this.dailyRequest(medicine, times[medicine.id] ?? '08:00'));
        const retained = new Set(medicines.flatMap((medicine) => [dailyId(medicine.id), snoozeId(medicine.id)]));
        const existing = await this.adapter.list();
        for (const alarm of existing) {
          if ((alarm.identifier.startsWith(`${PREFIX}dose:`) || alarm.identifier.startsWith(`${PREFIX}snooze:`)) && !retained.has(alarm.identifier)) {
            await this.adapter.cancel(alarm.identifier);
          }
        }
        for (const request of desired) {
          const previous = existing.find((alarm) => alarm.identifier === request.identifier);
          if (previous?.content.data.reminderSignature === request.content.data.reminderSignature) continue;
          await this.adapter.cancel(request.identifier);
          await this.adapter.schedule(request);
        }
        return true;
      } catch { return false; }
    });
  }
}
