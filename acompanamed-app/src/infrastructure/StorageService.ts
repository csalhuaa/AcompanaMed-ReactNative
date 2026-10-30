import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medicine, DoseLog, ActorRole, EmergencyProfile } from '../domain/types';

export interface IStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class MemoryStorageAdapter implements IStorageAdapter {
  private store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

export class AsyncStorageAdapter implements IStorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    return AsyncStorage.clear();
  }
}

export const STORAGE_KEYS = {
  MEDICINES: '@acompanamed:medicines',
  SCHEDULES: '@acompanamed:schedules',
  LOGS: '@acompanamed:logs',
  ROLE: '@acompanamed:active_role',
  PROFILE: '@acompanamed:emergency_profile',
  ONBOARDING: '@acompanamed:onboarding_completed',
  FAMILY_CODE: '@acompanamed:family_code',
} as const;

export class StorageService {
  constructor(private adapter: IStorageAdapter = new AsyncStorageAdapter()) {}

  async saveMedicines(medicines: Medicine[]): Promise<void> {
    await this.adapter.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
  }

  async loadMedicines(defaultMedicines: Medicine[] = []): Promise<Medicine[]> {
    try {
      const raw = await this.adapter.getItem(STORAGE_KEYS.MEDICINES);
      if (raw === null) return defaultMedicines;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return defaultMedicines;
    } catch {
      return defaultMedicines;
    }
  }

  async saveSchedules(schedules: Record<string, string>): Promise<void> {
    await this.adapter.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  }

  async loadSchedules(
    defaultSchedules: Record<string, string> = {}
  ): Promise<Record<string, string>> {
    try {
      const raw = await this.adapter.getItem(STORAGE_KEYS.SCHEDULES);
      if (!raw) return defaultSchedules;
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? parsed : defaultSchedules;
    } catch {
      return defaultSchedules;
    }
  }

  async saveLogs(logs: DoseLog[]): Promise<void> {
    await this.adapter.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }

  async loadLogs(defaultLogs: DoseLog[] = []): Promise<DoseLog[]> {
    try {
      const raw = await this.adapter.getItem(STORAGE_KEYS.LOGS);
      if (!raw) return defaultLogs;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return defaultLogs;
    } catch {
      return defaultLogs;
    }
  }

  async saveActiveRole(role: ActorRole): Promise<void> {
    await this.adapter.setItem(STORAGE_KEYS.ROLE, role);
  }

  async loadActiveRole(defaultRole: ActorRole = 'patient'): Promise<ActorRole> {
    try {
      const role = await this.adapter.getItem(STORAGE_KEYS.ROLE);
      if (role === 'patient' || role === 'caregiver') {
        return role;
      }
      return defaultRole;
    } catch {
      return defaultRole;
    }
  }

  async saveEmergencyProfile(profile: EmergencyProfile): Promise<void> {
    await this.adapter.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }

  async loadEmergencyProfile(
    defaultProfile: EmergencyProfile = {
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
    }
  ): Promise<EmergencyProfile> {
    try {
      const raw = await this.adapter.getItem(STORAGE_KEYS.PROFILE);
      if (!raw) return defaultProfile;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.patientFullName) {
        return parsed;
      }
      return defaultProfile;
    } catch {
      return defaultProfile;
    }
  }

  async saveOnboardingCompleted(completed: boolean): Promise<void> {
    await this.adapter.setItem(STORAGE_KEYS.ONBOARDING, completed ? 'true' : 'false');
  }

  async loadOnboardingCompleted(): Promise<boolean> {
    try {
      const val = await this.adapter.getItem(STORAGE_KEYS.ONBOARDING);
      return val === 'true';
    } catch {
      return false;
    }
  }

  async saveFamilyCode(code: string): Promise<void> {
    await this.adapter.setItem(STORAGE_KEYS.FAMILY_CODE, code);
  }

  async loadFamilyCode(defaultCode = ''): Promise<string> {
    try {
      const val = await this.adapter.getItem(STORAGE_KEYS.FAMILY_CODE);
      return val ? val.trim() : defaultCode;
    } catch {
      return defaultCode;
    }
  }

  async clearAllData(): Promise<void> {
    await this.adapter.removeItem(STORAGE_KEYS.MEDICINES);
    await this.adapter.removeItem(STORAGE_KEYS.SCHEDULES);
    await this.adapter.removeItem(STORAGE_KEYS.LOGS);
    await this.adapter.removeItem(STORAGE_KEYS.ROLE);
    await this.adapter.removeItem(STORAGE_KEYS.PROFILE);
    await this.adapter.removeItem(STORAGE_KEYS.ONBOARDING);
    await this.adapter.removeItem(STORAGE_KEYS.FAMILY_CODE);
  }
}

export const defaultStorageService = new StorageService();
