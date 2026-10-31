import React, { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Medicine, DoseLog, EmergencyProfile, ActorRole } from '../domain/types';
import {
  defaultCloudSyncService,
  defaultStorageService,
  FamilySyncPayload,
  sanitizeFamilyCode,
} from '../infrastructure';

interface UseCloudSyncProps {
  isLoaded: boolean;
  isOnboardingVisible: boolean;
  activeRole: ActorRole;
  medicines: Medicine[];
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  scheduleTimes: Record<string, string>;
  setScheduleTimes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  logs: DoseLog[];
  setLogs: React.Dispatch<React.SetStateAction<DoseLog[]>>;
  emergencyProfile: EmergencyProfile;
  setEmergencyProfile: React.Dispatch<React.SetStateAction<EmergencyProfile>>;
  onAfterSyncMedicines?: (firstMedId?: string) => void;
}

export function useCloudSync({
  isLoaded,
  isOnboardingVisible,
  activeRole,
  medicines,
  setMedicines,
  scheduleTimes,
  setScheduleTimes,
  logs,
  setLogs,
  emergencyProfile,
  setEmergencyProfile,
  onAfterSyncMedicines,
}: UseCloudSyncProps) {
  const [familyCode, setFamilyCode] = useState<string>('');
  const [isFamilyConnected, setIsFamilyConnected] = useState(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string>('');
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [deviceId, setDeviceId] = useState<string>('');

  const localStateRef = useRef({
    medicines,
    logs,
    scheduleTimes,
    emergencyProfile,
    lastUpdateIso: new Date().toISOString(),
  });

  useEffect(() => {
    localStateRef.current = {
      medicines,
      logs,
      scheduleTimes,
      emergencyProfile,
      lastUpdateIso: localStateRef.current.lastUpdateIso,
    };
  }, [medicines, logs, scheduleTimes, emergencyProfile]);

  // Inicialización de deviceId y familyCode
  useEffect(() => {
    async function initDevice() {
      try {
        const devId = await defaultStorageService.loadOrCreateDeviceId();
        setDeviceId(devId);
        const storedCode = await defaultStorageService.loadFamilyCode();
        if (storedCode) {
          setFamilyCode(storedCode);
          setIsFamilyConnected(true);
        }
      } catch (err) {
        console.warn('Error al inicializar ID de dispositivo:', err);
      }
    }
    initDevice();
  }, []);

  const syncToCloud = async (
    overrideMeds?: Medicine[],
    overrideLogs?: DoseLog[],
    overrideTimes?: Record<string, string>,
    overrideProfile?: EmergencyProfile
  ) => {
    if (!familyCode || !isFamilyConnected) return;
    const nowIso = new Date().toISOString();
    localStateRef.current.lastUpdateIso = nowIso;
    try {
      const payload: FamilySyncPayload = {
        familyCode,
        updatedAt: nowIso,
        updatedBy: activeRole,
        patientName: (overrideProfile || emergencyProfile).patientFullName,
        medicines: overrideMeds || medicines,
        schedules: overrideTimes || scheduleTimes,
        logs: overrideLogs || logs,
        emergencyProfile: overrideProfile || emergencyProfile,
      };
      const success = await defaultCloudSyncService.pushFamilyState(payload);
      if (!success) {
        setLastCloudSyncTime('');
        return;
      }
      setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.warn('Sync to cloud error:', e);
    }
  };

  // Sondeo en tiempo real cada 3.5 segundos entre dispositivos
  useEffect(() => {
    if (!isLoaded || !familyCode || !isFamilyConnected || isOnboardingVisible) return;

    const stopPolling = defaultCloudSyncService.startSyncPolling(
      familyCode,
      (cloudData) => {
        if (!cloudData || !cloudData.updatedAt) return;

        const currentLocal = localStateRef.current;
        const cloudTime = new Date(cloudData.updatedAt).getTime();
        const localTime = new Date(currentLocal.lastUpdateIso).getTime();

        const localMedsStr = JSON.stringify(currentLocal.medicines);
        const cloudMedsStr = JSON.stringify(cloudData.medicines || []);
        const localLogsStr = JSON.stringify(currentLocal.logs);
        const cloudLogsStr = JSON.stringify(cloudData.logs || []);
        const localTimesStr = JSON.stringify(currentLocal.scheduleTimes);
        const cloudTimesStr = JSON.stringify(cloudData.schedules || {});

        const hasDifference =
          localMedsStr !== cloudMedsStr ||
          localLogsStr !== cloudLogsStr ||
          localTimesStr !== cloudTimesStr ||
          JSON.stringify(currentLocal.emergencyProfile) !== JSON.stringify(cloudData.emergencyProfile);

        if (hasDifference && cloudTime >= localTime) {
          localStateRef.current.lastUpdateIso = cloudData.updatedAt;
          setMedicines(cloudData.medicines || []);
          setScheduleTimes(cloudData.schedules || {});
          setLogs(cloudData.logs || []);
          if (cloudData.emergencyProfile) {
            setEmergencyProfile(cloudData.emergencyProfile);
          }
          setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }

        if (deviceId) {
          defaultCloudSyncService.updateDeviceHeartbeat(familyCode, deviceId);
        }
      },
      3500
    );

    return () => stopPolling();
  }, [isLoaded, familyCode, isFamilyConnected, isOnboardingVisible, deviceId]);

  const handleRevokeDevice = async (targetDeviceId: string): Promise<boolean> => {
    if (!familyCode) return false;
    return await defaultCloudSyncService.revokeDevice(familyCode, targetDeviceId);
  };

  const handleConnectFamilyCode = async (
    targetCode: string,
    connectingRole: ActorRole = activeRole
  ): Promise<{ success: boolean; message: string }> => {
    const clean = sanitizeFamilyCode(targetCode);
    if (!clean) return { success: false, message: 'Por favor ingrese un código válido.' };

    setIsCloudSyncing(true);
    try {
      const cloudData = await defaultCloudSyncService.fetchFamilyState(clean);
      if (!cloudData) {
        if (clean !== familyCode) {
          setIsCloudSyncing(false);
          const targetLabel = connectingRole === 'caregiver' ? 'paciente' : 'familiar o cuidador';
          return {
            success: false,
            message: `No se encontró ningún botiquín con el código [${clean}]. Verifique que su ${targetLabel} tenga AcompañaMed configurado con dicho código.`,
          };
        }

        const nowIso = new Date().toISOString();
        const payload: FamilySyncPayload = {
          familyCode: clean,
          updatedAt: nowIso,
          updatedBy: connectingRole,
          patientName: emergencyProfile.patientFullName,
          medicines,
          schedules: scheduleTimes,
          logs,
          emergencyProfile,
        };
        const saved = await defaultCloudSyncService.pushFamilyState(payload);
        if (!saved) return { success: false, message: 'No se pudo activar el enlace. Sus datos siguen guardados en este teléfono.' };
        setFamilyCode(clean);
        await defaultStorageService.saveFamilyCode(clean);
        setIsFamilyConnected(true);
        localStateRef.current.lastUpdateIso = nowIso;

        if (deviceId) {
          const devName = connectingRole === 'patient'
            ? `Teléfono de ${emergencyProfile.patientFullName || 'Don Manuel'} (Paciente)`
            : `Celular de ${emergencyProfile.emergencyContact?.name || 'Cuidadora'} (Cuidador)`;
          defaultCloudSyncService.registerDevice(clean, {
            deviceId,
            role: connectingRole,
            deviceName: devName,
            platform: Platform.OS === 'web' ? 'Navegador Web' : Platform.OS === 'android' ? 'Android' : 'iOS',
            connectedAt: nowIso,
            lastSeen: nowIso,
          });
        }

        setIsCloudSyncing(false);
        setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        return {
          success: true,
          message: `Código [${clean}] activado en Firebase. Comparta este código con el otro dispositivo.`,
        };
      }

      // Código existente en la nube: descargar y aplicar
      const downloadedMeds = cloudData.medicines || [];
      const downloadedSchedules = cloudData.schedules || {};
      const downloadedLogs = cloudData.logs || [];
      const downloadedProfile = cloudData.emergencyProfile || emergencyProfile;

      setMedicines(downloadedMeds);
      setScheduleTimes(downloadedSchedules);
      setLogs(downloadedLogs);
      if (cloudData.emergencyProfile) {
        setEmergencyProfile(downloadedProfile);
        await defaultStorageService.saveEmergencyProfile(downloadedProfile);
      }
      setFamilyCode(clean);
      await defaultStorageService.saveFamilyCode(clean);
      setIsFamilyConnected(true);
      await defaultStorageService.saveMedicines(downloadedMeds);
      await defaultStorageService.saveSchedules(downloadedSchedules);
      await defaultStorageService.saveLogs(downloadedLogs);

      if (onAfterSyncMedicines && downloadedMeds.length > 0) {
        onAfterSyncMedicines(downloadedMeds[0].id);
      }

      localStateRef.current = {
        medicines: downloadedMeds,
        logs: downloadedLogs,
        scheduleTimes: downloadedSchedules,
        emergencyProfile: downloadedProfile,
        lastUpdateIso: cloudData.updatedAt || new Date().toISOString(),
      };

      if (deviceId) {
        const devName = connectingRole === 'patient'
          ? `Teléfono de ${downloadedProfile.patientFullName || 'Don Manuel'} (Paciente)`
          : `Celular de ${downloadedProfile.emergencyContact?.name || 'Cuidadora'} (Cuidador)`;
        defaultCloudSyncService.registerDevice(clean, {
          deviceId,
          role: connectingRole,
          deviceName: devName,
          platform: Platform.OS === 'web' ? 'Navegador Web' : Platform.OS === 'android' ? 'Android' : 'iOS',
          connectedAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
        });
      }

      setIsCloudSyncing(false);
      setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      return {
        success: true,
        message: `¡Conectado con éxito a la familia de ${downloadedProfile.patientFullName || 'Don Manuel'}!`,
      };
    } catch (err: any) {
      setIsCloudSyncing(false);
      return {
        success: false,
        message: `Error al conectar con Firebase: ${err?.message || 'Verifique su conexión'}`,
      };
    }
  };

  // Detección automática de emparejamiento por Código QR (?pair=CODIGO)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && isLoaded) {
      try {
        const params = new URLSearchParams(window.location.search);
        const pairParam = params.get('pair');
        if (pairParam) {
          const clean = sanitizeFamilyCode(pairParam);
          if (clean) {
            handleConnectFamilyCode(clean, 'caregiver');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } catch (err) {
        console.warn('URL pair param error:', err);
      }
    }
  }, [isLoaded]);

  return {
    familyCode,
    setFamilyCode,
    isFamilyConnected,
    setIsFamilyConnected,
    lastCloudSyncTime,
    isCloudSyncing,
    deviceId,
    syncToCloud,
    handleConnectFamilyCode,
    handleRevokeDevice,
  };
}
