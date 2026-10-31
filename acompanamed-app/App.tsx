import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  AppState,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaProvider,
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  Medicine,
  DoseLog,
  ActorRole,
  EmergencyProfile,
  buildDailySchedule,
  calculateAdherence,
  generateClinicalSummary,
} from './src/domain';
import {
  defaultStorageService,
  defaultNotificationService,
  defaultCloudSyncService,
  FamilySyncPayload,
  CommunicationService,
  buildMemorableFamilyCode,
} from './src/infrastructure';
import {
  AppNavTab,
  BottomNavBar,
  TodayTimelineStream,
  CaregiverDashboard,
  MedicineInventoryPanel,
  EmergencyProfileCard,
  AddMedicineModal,
  ClinicalReportModal,
  ConfirmDialogModal,
  InAppDialogModal,
  RestockModal,
  FamilyPairingModal,
  PillInspectionModal,
  OnboardingModal,
} from './src/components';
import { createEmptyProfile, getScheduleEscalation } from './src/domain/LocalWorkflow';
import {
  INITIAL_MEDICINES,
  INITIAL_SCHEDULE_TIMES,
  INITIAL_LOGS,
  DEFAULT_PROFILE,
  showNotice,
  registerDialogListener,
  InAppNoticeData,
  InAppConfirmData,
} from './src/data/initialData';
import { AppHeader } from './src/components/navigation/AppHeader';
import { useCloudSync } from './src/hooks/useCloudSync';
import { useMedicationActions } from './src/hooks/useMedicationActions';
import { appStyles as styles } from './src/styles/appStyles';

function MainApp() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 16);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isLargeScreen = width >= 600;

  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<AppNavTab>('today');
  const [activeRole, setActiveRole] = useState<ActorRole>('caregiver');
  const [desktopLayoutMode, setDesktopLayoutMode] = useState<'mobile_shell' | 'desktop_split'>('mobile_shell');

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [scheduleTimes, setScheduleTimes] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [emergencyProfile, setEmergencyProfile] = useState<EmergencyProfile>(createEmptyProfile());
  const [expandedMedId, setExpandedMedId] = useState<string>('');
  const [now, setNow] = useState(() => new Date());
  const [isOnboardingBusy, setIsOnboardingBusy] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');

  // Modales adicionales
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isFamilyPairingModalVisible, setIsFamilyPairingModalVisible] = useState(false);
  const [inspectingMedicine, setInspectingMedicine] = useState<Medicine | null>(null);
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);
  const [activeNotice, setActiveNotice] = useState<InAppNoticeData | null>(null);
  const [activeConfirm, setActiveConfirm] = useState<InAppConfirmData | null>(null);

  useEffect(() => {
    registerDialogListener({
      onNotice: (notice) => setActiveNotice(notice),
      onConfirm: (confirm) => setActiveConfirm(confirm),
    });
    return () => {
      registerDialogListener(null);
    };
  }, []);

  const handleRemoteRevocation = async () => {
    try {
      await defaultStorageService.clearAllData();
      setMedicines([]);
      setScheduleTimes({});
      setLogs([]);
      setExpandedMedId('');
      setEmergencyProfile(createEmptyProfile());
      setActiveRole('patient');
      setActiveTab('today');
      setIsFamilyPairingModalVisible(false);
      setIsOnboardingVisible(true);
      showNotice(
        'Dispositivo Desvinculado',
        'Este teléfono ha sido desvinculado del botiquín familiar por el administrador. Ha vuelto a la pantalla inicial de bienvenida.'
      );
    } catch (error) {
      console.warn('Error handling remote revocation:', error);
      setIsOnboardingVisible(true);
    }
  };

  // Hook de Sincronización en la Nube y Dispositivos
  const {
    familyCode,
    setFamilyCode,
    isFamilyConnected,
    setIsFamilyConnected,
    lastCloudSyncTime,
    isCloudSyncing,
    deviceId,
    hasCaregiverConnected,
    syncToCloud,
    handleConnectFamilyCode,
    handleRevokeDevice,
  } = useCloudSync({
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
    onAfterSyncMedicines: (firstId) => {
      if (firstId) setExpandedMedId(firstId);
    },
    onDeviceRevokedRemotely: handleRemoteRevocation,
  });

  // Restricciones de navegación según rol y supervisión:
  // - Un paciente nunca accede al panel de telemetría de cuidador.
  // - Un paciente con cuidador vinculado (supervisado) no accede al botiquín.
  // - Un paciente autónomo (sin cuidador vinculado) tiene acceso pleno a su botiquín.
  useEffect(() => {
    if (activeRole === 'patient') {
      if (activeTab === 'caregiver' || (activeTab === 'stock' && hasCaregiverConnected)) {
        setActiveTab('today');
      }
    }
  }, [activeRole, hasCaregiverConnected, activeTab]);

  // Cálculos de Dominio
  const dailySchedule = buildDailySchedule(medicines, scheduleTimes, logs, now);
  const adherence = calculateAdherence(logs);
  const dailyProgress = dailySchedule.length
    ? Math.round((dailySchedule.filter((item) => item.isTakenToday).length / dailySchedule.length) * 100)
    : 0;
  const clinicalReport = generateClinicalSummary(medicines, logs, emergencyProfile);
  const escalation = getScheduleEscalation(dailySchedule, now);

  // Hook de Acciones de Medicación y Dosificación
  const {
    isAddModalVisible,
    setIsAddModalVisible,
    editingMedicine,
    setEditingMedicine,
    isRestockModalVisible,
    setIsRestockModalVisible,
    restockingMedicine,
    setRestockingMedicine,
    isDeleteConfirmVisible,
    setIsDeleteConfirmVisible,
    deletingMedicine,
    setDeletingMedicine,
    handleTakeDose,
    handlePostponeDose,
    handleOpenRestockModal,
    handleConfirmRestock,
    handleOpenAddModal,
    handleOpenEditModal,
    handleSaveMedicine,
    handleRequestDelete,
    handleConfirmDelete,
  } = useMedicationActions({
    medicines,
    setMedicines,
    scheduleTimes,
    setScheduleTimes,
    logs,
    setLogs,
    emergencyProfile,
    activeRole,
    dailySchedule,
    syncToCloud,
    setExpandedMedId,
  });

  // Carga asíncrona de almacenamiento local
  useEffect(() => {
    async function loadStoredData() {
      try {
        const storedMeds = await defaultStorageService.loadMedicines([]);
        const storedTimes = await defaultStorageService.loadSchedules({});
        const storedLogs = await defaultStorageService.loadLogs([]);
        const storedProfile = await defaultStorageService.loadEmergencyProfile(createEmptyProfile());
        const storedRole = await defaultStorageService.loadActiveRole('caregiver');

        setMedicines(storedMeds);
        setScheduleTimes(storedTimes);
        setLogs(storedLogs);
        setEmergencyProfile(storedProfile);
        setActiveRole(storedRole);

        const hasCompleted = await defaultStorageService.loadOnboardingCompleted();
        if (!hasCompleted) {
          setIsOnboardingVisible(true);
        }

        if (storedMeds.length > 0) {
          setExpandedMedId(storedMeds[0].id);
        }
      } catch (err) {
        console.warn('Error al cargar datos desde AsyncStorage:', err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadStoredData();
  }, []);

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = setInterval(refresh, 30000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  // Persistencia automática local
  useEffect(() => {
    if (isLoaded) defaultStorageService.saveMedicines(medicines);
  }, [medicines, isLoaded]);

  useEffect(() => {
    if (isLoaded) defaultStorageService.saveLogs(logs);
  }, [logs, isLoaded]);

  useEffect(() => {
    if (isLoaded) defaultStorageService.saveSchedules(scheduleTimes);
  }, [scheduleTimes, isLoaded]);

  useEffect(() => {
    if (isLoaded) defaultStorageService.saveEmergencyProfile(emergencyProfile);
  }, [emergencyProfile, isLoaded]);

  useEffect(() => {
    if (isLoaded) defaultStorageService.saveActiveRole(activeRole);
  }, [activeRole, isLoaded]);

  useEffect(() => {
    if (isLoaded && !isOnboardingVisible) {
      defaultNotificationService.syncDoseReminders(medicines, scheduleTimes).catch(() => {
        console.warn('Reminder synchronization unavailable');
      });
    }
  }, [isLoaded, isOnboardingVisible, medicines, scheduleTimes]);

  const handleCallEmergency = (phone: string) => {
    CommunicationService.makePhoneCall(phone);
  };

  const handleExportReport = () => {
    const contactPhone =
      activeRole === 'caregiver'
        ? emergencyProfile?.emergencyContact?.phone || emergencyProfile?.patientPhone
        : emergencyProfile?.emergencyContact?.phone;

    if (!contactPhone) {
      showNotice(
        'Falta el contacto',
        'Por favor registre un número de teléfono en Ajustes para enviar el informe médico por WhatsApp.'
      );
      return;
    }
    const summary = generateClinicalSummary(medicines, logs, emergencyProfile);
    CommunicationService.openWhatsApp(contactPhone, summary.formattedReportText);
  };

  const handleSimulateEscalationAlert = () => {
    const isCaregiver = activeRole === 'caregiver';
    const targetPhone = isCaregiver
      ? emergencyProfile?.patientPhone || emergencyProfile?.emergencyContact?.phone
      : emergencyProfile?.emergencyContact?.phone;

    if (!targetPhone) {
      showNotice(
        'Falta el número de contacto',
        isCaregiver
          ? 'Por favor registre el teléfono del paciente en Ajustes para enviarle recordatorios por WhatsApp.'
          : 'Por favor registre el teléfono de su cuidador en Ajustes para comunicarse por WhatsApp.'
      );
      return;
    }

    const patientName = emergencyProfile?.patientFullName || 'Don Manuel';
    let message = '';
    if (isCaregiver) {
      if (escalation.shouldEscalate) {
        message = `AcompañaMed — Recordatorio para ${patientName}:\n${escalation.message}\nPor favor confirme su toma en la aplicación.`;
      } else {
        message = `Hola ${patientName}, te saluda tu cuidador desde AcompañaMed. ¿Cómo te encuentras hoy? Recuerda seguir tu horario de tomas.`;
      }
    } else {
      const caregiverName = emergencyProfile?.emergencyContact?.name || 'mi Cuidador';
      message = `Hola ${caregiverName}, te escribo desde mi aplicación AcompañaMed. Necesito consultarte sobre mis pastillas de hoy.`;
    }

    CommunicationService.openWhatsApp(targetPhone, message);
  };

  const handleCallCaregiver = () => {
    const isCaregiver = activeRole === 'caregiver';
    const targetPhone = isCaregiver
      ? emergencyProfile?.patientPhone || emergencyProfile?.emergencyContact?.phone
      : emergencyProfile?.emergencyContact?.phone;

    if (!targetPhone) {
      showNotice(
        'Falta el número de contacto',
        isCaregiver
          ? 'Por favor registre el teléfono del paciente en Ajustes para llamarlo.'
          : 'Por favor registre el teléfono de su cuidador en Ajustes para llamarlo.'
      );
      return;
    }
    CommunicationService.makePhoneCall(targetPhone);
  };

  const handleUpdateProfile = (updated: EmergencyProfile) => {
    setEmergencyProfile(updated);
    defaultStorageService.saveEmergencyProfile(updated);
    syncToCloud(undefined, undefined, undefined, updated);
  };

  const handleSwitchActiveRole = async (newRole: ActorRole) => {
    setActiveRole(newRole);
    await defaultStorageService.saveActiveRole(newRole);
    if (familyCode && deviceId) {
      const devName =
        newRole === 'patient'
          ? `Teléfono de ${emergencyProfile?.patientFullName || 'Paciente'} (Paciente)`
          : `Celular de Cuidador`;
      await defaultCloudSyncService.registerDevice(familyCode, {
        deviceId,
        role: newRole,
        deviceName: devName,
        platform:
          Platform.OS === 'web'
            ? 'Navegador Web'
            : Platform.OS === 'android'
            ? 'Android'
            : 'iOS',
        connectedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      });
    }
  };

  const handleResetDevice = async () => {
    try {
      if (familyCode && deviceId) {
        await defaultCloudSyncService.revokeDevice(familyCode, deviceId);
      }
      await defaultStorageService.clearAllData();

      setMedicines([]);
      setScheduleTimes({});
      setLogs([]);
      setExpandedMedId('');
      setEmergencyProfile(createEmptyProfile());
      setFamilyCode('');
      setIsFamilyConnected(false);
      setActiveRole('patient');
      setActiveTab('today');
      setIsFamilyPairingModalVisible(false);
      setIsOnboardingVisible(true);
      showNotice(
        'Dispositivo desvinculado',
        'Este teléfono volvió a la pantalla inicial. Sus datos permanecen respaldados en la nube.'
      );
    } catch (error) {
      console.warn('Error resetting device:', error);
      setIsOnboardingVisible(true);
    }
  };

  const handleClearDemoData = () => {
    setMedicines([]);
    setScheduleTimes({});
    setLogs([]);
    setExpandedMedId('');
    defaultStorageService.saveMedicines([]);
    defaultStorageService.saveSchedules({});
    defaultStorageService.saveLogs([]);
    syncToCloud([], [], {});
    setIsFamilyPairingModalVisible(false);
    showNotice('Datos Vaciados', 'Se eliminaron los datos de prueba. Ahora puede registrar su propia receta médica real.');
  };

  const handleRestoreDemoData = () => {
    setMedicines(INITIAL_MEDICINES);
    setScheduleTimes(INITIAL_SCHEDULE_TIMES);
    setLogs(INITIAL_LOGS);
    setExpandedMedId(INITIAL_MEDICINES[0].id);
    defaultStorageService.saveMedicines(INITIAL_MEDICINES);
    defaultStorageService.saveSchedules(INITIAL_SCHEDULE_TIMES);
    defaultStorageService.saveLogs(INITIAL_LOGS);
    syncToCloud(INITIAL_MEDICINES, INITIAL_LOGS, INITIAL_SCHEDULE_TIMES);
    setIsFamilyPairingModalVisible(false);
    showNotice('Caso Demo Restaurado', 'Se cargaron los 3 medicamentos de prueba de Don Manuel.');
  };

  const handleFinishOnboarding = async (data: {
    role: ActorRole;
    startMode: 'empty' | 'demo' | 'pair';
    patientName: string;
    pairCode?: string;
  }) => {
    if (isOnboardingBusy) return;
    setIsOnboardingBusy(true);
    setOnboardingError('');
    try {
      if (data.startMode === 'pair') {
        const result = await handleConnectFamilyCode(data.pairCode || '', data.role);
        if (!result.success) {
          setOnboardingError(result.message);
          return;
        }
      } else {
        const demo = data.startMode === 'demo';
        const profile = demo
          ? { ...DEFAULT_PROFILE, patientFullName: data.patientName }
          : createEmptyProfile(data.patientName);
        const nextMeds = demo ? INITIAL_MEDICINES : [];
        const nextTimes = demo ? INITIAL_SCHEDULE_TIMES : {};
        const nextLogs = demo ? INITIAL_LOGS : [];
        const newCode = buildMemorableFamilyCode(profile.patientFullName, profile.age);

        await Promise.all([
          defaultStorageService.saveEmergencyProfile(profile),
          defaultStorageService.saveMedicines(nextMeds),
          defaultStorageService.saveSchedules(nextTimes),
          defaultStorageService.saveLogs(nextLogs),
          defaultStorageService.saveFamilyCode(newCode),
        ]);

        // Publicar inmediatamente a Firebase para que el código esté activo desde el segundo 0
        const nowIso = new Date().toISOString();
        const payload: FamilySyncPayload = {
          familyCode: newCode,
          updatedAt: nowIso,
          updatedBy: data.role,
          patientName: profile.patientFullName,
          medicines: nextMeds,
          schedules: nextTimes,
          logs: nextLogs,
          emergencyProfile: profile,
        };
        await defaultCloudSyncService.pushFamilyState(payload);

        if (deviceId) {
          const devName =
            data.role === 'patient'
              ? `Teléfono de ${profile.patientFullName || 'Don Manuel'} (Paciente)`
              : `Celular de Cuidador`;
          await defaultCloudSyncService.registerDevice(newCode, {
            deviceId,
            role: data.role,
            deviceName: devName,
            platform:
              Platform.OS === 'web'
                ? 'Navegador Web'
                : Platform.OS === 'android'
                ? 'Android'
                : 'iOS',
            connectedAt: nowIso,
            lastSeen: nowIso,
          });
        }

        setEmergencyProfile(profile);
        setMedicines(nextMeds);
        setScheduleTimes(nextTimes);
        setLogs(nextLogs);
        setExpandedMedId(nextMeds[0]?.id || '');
        setFamilyCode(newCode);
        setIsFamilyConnected(true);
      }

      await defaultStorageService.saveActiveRole(data.role);
      await defaultStorageService.saveOnboardingCompleted(true);
      setActiveRole(data.role);
      setIsOnboardingVisible(false);
    } catch {
      setOnboardingError('No se pudo guardar la configuración inicial.');
    } finally {
      setIsOnboardingBusy(false);
    }
  };

  const handleTestNotification = async () => {
    const success = await defaultNotificationService.triggerImmediateTestNotification(
      'AcompañaMed: prueba de notificación',
      'Este es un aviso de prueba. No indica que deba tomar un medicamento.'
    );
    if (success) {
      showNotice('Notificación Emitida', 'Se disparó una notificación de prueba.');
    } else {
      showNotice('Permiso de Notificación', 'Por favor habilite los permisos de notificaciones.');
    }
  };

  if (!isLoaded) {
    return (
      <View style={styles.desktopOuterCanvas}>
        <View style={[styles.appShellFrame, styles.centerContent, { paddingTop: topInset }]}>
          <StatusBar style="dark" />
          <MaterialCommunityIcons name="pill" size={48} color="#0F172A" />
          <Text style={styles.loadingTitle}>AcompañaMed</Text>
          <Text style={styles.loadingSubtitle}>Cargando plan de medicación...</Text>
          <ActivityIndicator size="small" color="#0F172A" style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  const isSplitModeActive = isDesktop && desktopLayoutMode === 'desktop_split';

  return (
    <View style={styles.desktopOuterCanvas}>
      <StatusBar style="dark" />

      <View
        style={[
          styles.appShellFrame,
          isLargeScreen && styles.appShellFrameLarge,
          isSplitModeActive && styles.appShellFrameSplit,
        ]}
      >
        <AppHeader
          isDesktop={isDesktop}
          topInset={topInset}
          activeRole={activeRole}
          patientFullName={emergencyProfile.patientFullName}
          isFamilyConnected={isFamilyConnected}
          lastCloudSyncTime={lastCloudSyncTime}
          desktopLayoutMode={desktopLayoutMode}
          setDesktopLayoutMode={setDesktopLayoutMode}
          onOpenSettings={() => setIsFamilyPairingModalVisible(true)}
        />

        {isSplitModeActive ? (
          <View style={styles.splitDesktopContainer}>
            <View style={styles.splitLeftColumn}>
              <View style={styles.columnHeaderTitleRow}>
                <MaterialCommunityIcons name="pill" size={18} color="#0F172A" />
                <Text style={styles.columnHeaderTitleText}>Plan Cronológico de Hoy</Text>
              </View>
              <TodayTimelineStream
                dailySchedule={dailySchedule}
                expandedMedId={expandedMedId}
                onToggleExpand={(id) => setExpandedMedId((prev) => (prev === id ? '' : id))}
                onTakeDose={(id) => handleTakeDose(id, 'patient')}
                onPostponeDose={handlePostponeDose}
                adherencePercentage={dailyProgress}
                onOpenAddMedicine={handleOpenAddModal}
                onInspectMedicine={(med) => setInspectingMedicine(med)}
                activeRole={activeRole}
                onSwitchRole={() => setActiveRole(activeRole === 'patient' ? 'caregiver' : 'patient')}
                hasCaregiverConnected={hasCaregiverConnected}
              />
            </View>

            <View style={styles.splitVerticalDivider} />

            <View style={styles.splitRightColumn}>
              {(() => {
                const effectiveRightTab =
                  activeTab === 'today'
                    ? activeRole === 'patient'
                      ? 'emergency'
                      : 'caregiver'
                    : activeRole === 'patient' && hasCaregiverConnected && activeTab === 'stock'
                    ? 'emergency'
                    : activeRole === 'patient' && activeTab === 'caregiver'
                    ? 'emergency'
                    : activeTab;
                return (
                  <>
                    <View style={styles.splitSubTabsHeader}>
                      {activeRole === 'caregiver' && (
                        <TouchableOpacity
                          style={[
                            styles.splitSubTabItem,
                            effectiveRightTab === 'caregiver' && styles.splitSubTabItemActive,
                          ]}
                          onPress={() => setActiveTab('caregiver')}
                        >
                          <MaterialCommunityIcons
                            name="chart-timeline-variant"
                            size={16}
                            color={effectiveRightTab === 'caregiver' ? '#0F172A' : '#64748B'}
                          />
                          <Text
                            style={[
                              styles.splitSubTabLabel,
                              effectiveRightTab === 'caregiver' && styles.splitSubTabLabelActive,
                            ]}
                          >
                            Cuidador
                          </Text>
                        </TouchableOpacity>
                      )}

                      {(activeRole === 'caregiver' || !hasCaregiverConnected) && (
                        <TouchableOpacity
                          style={[
                            styles.splitSubTabItem,
                            effectiveRightTab === 'stock' && styles.splitSubTabItemActive,
                          ]}
                          onPress={() => setActiveTab('stock')}
                        >
                          <MaterialCommunityIcons
                            name="medical-bag"
                            size={16}
                            color={effectiveRightTab === 'stock' ? '#0F172A' : '#64748B'}
                          />
                          <Text
                            style={[
                              styles.splitSubTabLabel,
                              effectiveRightTab === 'stock' && styles.splitSubTabLabelActive,
                            ]}
                          >
                            Botiquín
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[
                          styles.splitSubTabItem,
                          effectiveRightTab === 'emergency' && styles.splitSubTabItemActive,
                        ]}
                        onPress={() => setActiveTab('emergency')}
                      >
                        <MaterialCommunityIcons
                          name="shield-alert-outline"
                          size={16}
                          color={effectiveRightTab === 'emergency' ? '#0F172A' : '#64748B'}
                        />
                        <Text
                          style={[
                            styles.splitSubTabLabel,
                            effectiveRightTab === 'emergency' && styles.splitSubTabLabelActive,
                          ]}
                        >
                          Emergencia
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ flex: 1 }}>
                      {effectiveRightTab === 'caregiver' && (
                        <CaregiverDashboard
                          contact={emergencyProfile.emergencyContact}
                          patientName={emergencyProfile.patientFullName}
                          patientPhone={emergencyProfile.patientPhone}
                          activeRole={activeRole}
                          escalation={escalation}
                          adherence={adherence}
                          clinicalReport={clinicalReport}
                          onOpenReport={() => setIsReportModalVisible(true)}
                          onSendEscalationAlert={handleSimulateEscalationAlert}
                          onCallCaregiver={handleCallCaregiver}
                          onOpenFamilyPairing={() => setIsFamilyPairingModalVisible(true)}
                        />
                      )}
                      {effectiveRightTab === 'stock' &&
                        (activeRole === 'patient' && hasCaregiverConnected ? (
                          <View style={styles.protectedRoleContainer}>
                            <MaterialCommunityIcons name="shield-lock-outline" size={48} color="#0284C7" />
                            <Text style={styles.protectedRoleTitle}>Área Protegida del Botiquín</Text>
                            <Text style={styles.protectedRoleSubtitle}>
                              La gestión de recetas, inventario y reposición está supervisada por su cuidador para proteger su seguridad.
                            </Text>
                          </View>
                        ) : (
                          <MedicineInventoryPanel
                            medicines={medicines}
                            scheduleTimes={scheduleTimes}
                            onOpenRestock={handleOpenRestockModal}
                            onRequestDelete={handleRequestDelete}
                            onEdit={handleOpenEditModal}
                            onOpenAddModal={handleOpenAddModal}
                            onInspect={(med) => setInspectingMedicine(med)}
                          />
                        ))}
                      {effectiveRightTab === 'emergency' && (
                        <EmergencyProfileCard
                          emergencyProfile={emergencyProfile}
                          familyCode={familyCode}
                          onCallEmergency={handleCallEmergency}
                          onOpenFamilyPairing={() => setIsFamilyPairingModalVisible(true)}
                          activeRole={activeRole}
                        />
                      )}
                    </View>
                  </>
                );
              })()}
            </View>
          </View>
        ) : (
          <View style={styles.mainContainer}>
            {activeTab === 'today' && (
              <TodayTimelineStream
                dailySchedule={dailySchedule}
                expandedMedId={expandedMedId}
                onToggleExpand={(id) => setExpandedMedId((prev) => (prev === id ? '' : id))}
                onTakeDose={(id) => handleTakeDose(id, 'patient')}
                onPostponeDose={handlePostponeDose}
                adherencePercentage={dailyProgress}
                onOpenAddMedicine={handleOpenAddModal}
                onInspectMedicine={(med) => setInspectingMedicine(med)}
                activeRole={activeRole}
                hasCaregiverConnected={hasCaregiverConnected}
              />
            )}

            {activeTab === 'caregiver' && (
              <CaregiverDashboard
                contact={emergencyProfile.emergencyContact}
                patientName={emergencyProfile.patientFullName}
                patientPhone={emergencyProfile.patientPhone}
                activeRole={activeRole}
                escalation={escalation}
                adherence={adherence}
                clinicalReport={clinicalReport}
                onOpenReport={() => setIsReportModalVisible(true)}
                onSendEscalationAlert={handleSimulateEscalationAlert}
                onCallCaregiver={handleCallCaregiver}
                onOpenFamilyPairing={() => setIsFamilyPairingModalVisible(true)}
              />
            )}

            {activeTab === 'stock' &&
              (activeRole === 'patient' && hasCaregiverConnected ? (
                <View style={styles.protectedRoleContainer}>
                  <MaterialCommunityIcons name="shield-lock-outline" size={48} color="#0284C7" />
                  <Text style={styles.protectedRoleTitle}>Área Protegida del Botiquín</Text>
                  <Text style={styles.protectedRoleSubtitle}>
                    La gestión de recetas, inventario y reposición está supervisada por su cuidador para proteger su seguridad.
                  </Text>
                </View>
              ) : (
                <MedicineInventoryPanel
                  medicines={medicines}
                  scheduleTimes={scheduleTimes}
                  onOpenRestock={handleOpenRestockModal}
                  onRequestDelete={handleRequestDelete}
                  onEdit={handleOpenEditModal}
                  onOpenAddModal={handleOpenAddModal}
                  onInspect={(med) => setInspectingMedicine(med)}
                />
              ))}

            {activeTab === 'emergency' && (
              <EmergencyProfileCard
                emergencyProfile={emergencyProfile}
                familyCode={familyCode}
                onCallEmergency={handleCallEmergency}
                onOpenFamilyPairing={() => setIsFamilyPairingModalVisible(true)}
                activeRole={activeRole}
              />
            )}

            <BottomNavBar
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              activeRole={activeRole}
              hasCaregiverConnected={hasCaregiverConnected}
            />
          </View>
        )}
      </View>

      {/* MODALES */}
      <AddMedicineModal
        visible={isAddModalVisible}
        initialMedicine={editingMedicine}
        initialScheduleTime={editingMedicine ? scheduleTimes[editingMedicine.id] : '08:00'}
        onClose={() => {
          setIsAddModalVisible(false);
          setEditingMedicine(null);
        }}
        onSave={handleSaveMedicine}
      />

      <ClinicalReportModal
        visible={isReportModalVisible}
        reportText={clinicalReport.formattedReportText}
        clinicalReport={clinicalReport}
        emergencyProfile={emergencyProfile}
        onClose={() => setIsReportModalVisible(false)}
        onExport={handleExportReport}
      />

      <RestockModal
        visible={isRestockModalVisible}
        medicine={restockingMedicine}
        onClose={() => {
          setIsRestockModalVisible(false);
          setRestockingMedicine(null);
        }}
        onConfirmRestock={handleConfirmRestock}
      />

      <ConfirmDialogModal
        visible={isDeleteConfirmVisible}
        title="Retirar del Pastillero Familiar"
        message={`¿Desea desvincular ${deletingMedicine?.name || 'este medicamento'} (${deletingMedicine?.doseDescription || ''})? Se conservará su historial médico de tomas anteriores.`}
        confirmText="Sí, retirar"
        cancelText="Cancelar"
        isDestructive={true}
        iconName="trash-can-outline"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteConfirmVisible(false);
          setDeletingMedicine(null);
        }}
      />

      <FamilyPairingModal
        visible={isFamilyPairingModalVisible}
        onClose={() => setIsFamilyPairingModalVisible(false)}
        emergencyProfile={emergencyProfile}
        onUpdateProfile={handleUpdateProfile}
        onClearDemoData={handleClearDemoData}
        onRestoreDemoData={handleRestoreDemoData}
        onTestNotification={handleTestNotification}
        activeRole={activeRole}
        onSelectRole={handleSwitchActiveRole}
        familyCode={familyCode}
        onConnectFamilyCode={handleConnectFamilyCode}
        isSyncing={isCloudSyncing}
        lastSyncTime={lastCloudSyncTime}
        currentDeviceId={deviceId}
        onRevokeDevice={handleRevokeDevice}
        onResetDevice={handleResetDevice}
      />

      <PillInspectionModal
        visible={!!inspectingMedicine}
        medicine={inspectingMedicine}
        onClose={() => setInspectingMedicine(null)}
        onUpdatePhoto={(medId, newPhoto) => {
          const updatedMeds = medicines.map((m) =>
            m.id === medId
              ? {
                  ...m,
                  visualPill: {
                    ...m.visualPill,
                    photoUri: newPhoto,
                  },
                }
              : m
          );
          setMedicines(updatedMeds);
          syncToCloud(updatedMeds);
          if (inspectingMedicine && inspectingMedicine.id === medId) {
            setInspectingMedicine({
              ...inspectingMedicine,
              visualPill: {
                ...inspectingMedicine.visualPill,
                photoUri: newPhoto,
              },
            });
          }
        }}
      />

      <OnboardingModal
        visible={isOnboardingVisible}
        busy={isOnboardingBusy}
        error={onboardingError}
        onFinishOnboarding={handleFinishOnboarding}
      />

      <InAppDialogModal
        notice={activeNotice}
        confirm={activeConfirm}
        onCloseNotice={() => setActiveNotice(null)}
        onCloseConfirm={() => setActiveConfirm(null)}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics ?? undefined}>
      <MainApp />
    </SafeAreaProvider>
  );
}
