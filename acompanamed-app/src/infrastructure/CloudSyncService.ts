import { Medicine, DoseLog, EmergencyProfile } from '../domain/types';
import { sanitizeEmergencyProfile } from '../domain/LocalWorkflow';

export const FIREBASE_RTDB_URL = 'https://acompanamed-unsa-2026-default-rtdb.firebaseio.com';

export interface ConnectedDevice {
  deviceId: string;
  role: 'patient' | 'caregiver';
  deviceName: string;
  platform: string;
  connectedAt: string;
  lastSeen: string;
}

export interface DeviceStatusFormat {
  isOnline: boolean;
  statusLabel: string;
  badgeColor: string;
}

export function formatDeviceActivityStatus(
  lastSeenIso: string,
  now: Date = new Date()
): DeviceStatusFormat {
  const lastTime = new Date(lastSeenIso).getTime();
  const diffMs = now.getTime() - lastTime;
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return { isOnline: true, statusLabel: 'En línea ahora', badgeColor: '#059669' };
  }
  if (diffMs <= 45_000) {
    return { isOnline: true, statusLabel: 'En línea ahora', badgeColor: '#059669' };
  }
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 60) {
    return {
      isOnline: false,
      statusLabel: `Visto hace ${diffMins} min`,
      badgeColor: '#D97706',
    };
  }
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return {
      isOnline: false,
      statusLabel: `Visto hace ${diffHours} h`,
      badgeColor: '#64748B',
    };
  }
  return { isOnline: false, statusLabel: 'Desconectado', badgeColor: '#94A3B8' };
}

export interface FamilySyncPayload {
  familyCode: string;
  updatedAt: string;
  updatedBy: string; // 'patient' | 'caregiver'
  patientName: string;
  medicines: Medicine[];
  schedules: Record<string, string>;
  logs: DoseLog[];
  emergencyProfile?: EmergencyProfile;
  connectedDevices?: Record<string, ConnectedDevice>;
}

export function sanitizeFamilyCode(code: string): string {
  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildMemorableFamilyCode(
  patientName = '',
  age?: number | string
): string {
  const cleanName = patientName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();

  const namePart = cleanName.length >= 3 ? cleanName.slice(0, 4) : 'MANU';

  const numericAge = typeof age === 'number' ? age : parseInt(String(age || ''), 10);
  const agePart =
    !isNaN(numericAge) && numericAge > 0 && numericAge < 130
      ? String(numericAge)
      : '74';

  return `MED-${namePart}-${agePart}`;
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

      const rawProfile = data.emergencyProfile;
      const emergencyProfile = rawProfile
        ? sanitizeEmergencyProfile(rawProfile, data.patientName || 'Paciente')
        : undefined;

      return {
        familyCode: data.familyCode || familyCode,
        updatedAt: data.updatedAt || new Date().toISOString(),
        updatedBy: data.updatedBy || 'unknown',
        patientName: data.patientName || (emergencyProfile ? emergencyProfile.patientFullName : 'Paciente'),
        medicines,
        schedules,
        logs,
        emergencyProfile,
      };
    } catch (error) {
      console.warn('CloudSyncService fetch error:', error);
      throw error;
    }
  }

  /**
   * Registra un dispositivo conectado bajo /families/{code}/connectedDevices/{deviceId}
   */
  async registerDevice(familyCode: string, device: ConnectedDevice): Promise<boolean> {
    try {
      const cleanCode = sanitizeFamilyCode(familyCode);
      const url = `${FIREBASE_RTDB_URL}/families/${cleanCode}/connectedDevices/${device.deviceId}.json`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(device),
      });
      return res.ok;
    } catch (error) {
      console.warn('CloudSyncService registerDevice error:', error);
      return false;
    }
  }

  /**
   * Actualiza el ping/heartbeat de un dispositivo conectado
   */
  async updateDeviceHeartbeat(familyCode: string, deviceId: string): Promise<boolean> {
    try {
      const cleanCode = sanitizeFamilyCode(familyCode);
      const url = `${FIREBASE_RTDB_URL}/families/${cleanCode}/connectedDevices/${deviceId}/lastSeen.json`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(new Date().toISOString()),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene la lista de todos los dispositivos conectados a la familia
   */
  async fetchConnectedDevices(familyCode: string): Promise<ConnectedDevice[]> {
    try {
      const cleanCode = sanitizeFamilyCode(familyCode);
      const url = `${FIREBASE_RTDB_URL}/families/${cleanCode}/connectedDevices.json`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return [];
      const data = await res.json();
      if (!data || typeof data !== 'object') return [];
      const list = Object.values(data) as ConnectedDevice[];
      return list.sort((a, b) => new Date(b.lastSeen || 0).getTime() - new Date(a.lastSeen || 0).getTime());
    } catch {
      return [];
    }
  }

  /**
   * Desvincula / Revoca un dispositivo de la familia
   */
  async revokeDevice(familyCode: string, deviceId: string): Promise<boolean> {
    try {
      const cleanCode = sanitizeFamilyCode(familyCode);
      const url = `${FIREBASE_RTDB_URL}/families/${cleanCode}/connectedDevices/${deviceId}.json`;
      const res = await fetch(url, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
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
