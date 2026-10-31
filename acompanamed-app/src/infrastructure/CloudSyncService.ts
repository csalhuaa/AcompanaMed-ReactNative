import { Medicine, DoseLog, EmergencyProfile } from '../domain/types';

export const FIREBASE_RTDB_URL = 'https://acompanamed-unsa-2026-default-rtdb.firebaseio.com';

export interface FamilySyncPayload {
  familyCode: string;
  updatedAt: string;
  updatedBy: string; // 'patient' | 'caregiver'
  patientName: string;
  medicines: Medicine[];
  schedules: Record<string, string>;
  logs: DoseLog[];
  emergencyProfile: EmergencyProfile;
}

export function sanitizeFamilyCode(code: string): string {
  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildFamilyUrl(code: string): string {
  const cleanCode = sanitizeFamilyCode(code);
  return `${FIREBASE_RTDB_URL}/families/${cleanCode}.json`;
}

export function isStateNewer(
  candidate: FamilySyncPayload,
  current?: FamilySyncPayload | null
): boolean {
  if (!current || !current.updatedAt) return true;
  return new Date(candidate.updatedAt).getTime() > new Date(current.updatedAt).getTime();
}

export class CloudSyncService {
  /**
   * Sube el estado completo de la familia a Firebase RTDB
   */
  async pushFamilyState(payload: FamilySyncPayload): Promise<boolean> {
    try {
      const url = buildFamilyUrl(payload.familyCode);
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (error) {
      console.warn('CloudSyncService push error:', error);
      return false;
    }
  }

  /**
   * Descarga el estado de la familia desde Firebase RTDB por su código
   */
  async fetchFamilyState(familyCode: string): Promise<FamilySyncPayload | null> {
    try {
      const url = buildFamilyUrl(familyCode);
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error(`Family download failed: ${res.status}`);
      const data = await res.json();
      if (!data || typeof data !== 'object') return null;

      // Sanitizar arreglos en caso de que Firebase los serialice con formato indexado
      const medicines: Medicine[] = Array.isArray(data.medicines)
        ? data.medicines.filter(Boolean)
        : data.medicines ? Object.values(data.medicines) : [];

      const logs: DoseLog[] = Array.isArray(data.logs)
        ? data.logs.filter(Boolean)
        : data.logs ? Object.values(data.logs) : [];

      const schedules: Record<string, string> =
        data.schedules && typeof data.schedules === 'object' ? data.schedules : {};

      return {
        familyCode: data.familyCode || familyCode,
        updatedAt: data.updatedAt || new Date().toISOString(),
        updatedBy: data.updatedBy || 'unknown',
        patientName: data.patientName || 'Paciente',
        medicines,
        schedules,
        logs,
        emergencyProfile: data.emergencyProfile,
      };
    } catch (error) {
      console.warn('CloudSyncService fetch error:', error);
      throw error;
    }
  }

  /**
   * Sondeo periódico resiliente para sincronizar cambios en segundo plano entre dispositivos
   */
  startSyncPolling(
    familyCode: string,
    onUpdate: (payload: FamilySyncPayload) => void,
    intervalMs = 4000
  ): () => void {
    let isCancelled = false;

    const poll = async () => {
      if (isCancelled) return;
      try {
        const data = await this.fetchFamilyState(familyCode);
        if (data && !isCancelled) onUpdate(data);
      } catch {
        // Keep local records and retry on the next interval.
      }
    };

    const intervalId = setInterval(poll, intervalMs);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }
}

export const defaultCloudSyncService = new CloudSyncService();
