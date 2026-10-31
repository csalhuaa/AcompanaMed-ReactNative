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

  // Hook de Sincronización en la Nube y Dispositivos
  const {
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
  });

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
    const contactPhone = emergencyProfile?.emergencyContact?.phone;
    if (!contactPhone) {
      showNotice('Falta el contacto', 'Agregue un teléfono en Ajustes para compartir el informe.');
      return;
    }
    const summary = generateClinicalSummary(medicines, logs, emergencyProfile);
    CommunicationService.openWhatsApp(contactPhone, summary.formattedReportText);
  };

  const handleSimulateEscalationAlert = () => {
    if (!escalation.shouldEscalate) {
      showNotice('Sin tomas atrasadas', 'No hay una dosis pendiente que haya superado los 30 minutos de espera.');
      return;
    }
    const contactPhone = emergencyProfile?.emergencyContact?.phone || '';
    const message = `AcompañaMed — ${emergencyProfile?.patientFullName || 'Paciente'}\n${escalation.message}\nPor favor, revise el plan de hoy.`;
    CommunicationService.openWhatsApp(contactPhone, message);
  };

  const handleCallCaregiver = () => {
    const contactPhone = emergencyProfile?.emergencyContact?.phone;
    if (!contactPhone) return;
    CommunicationService.makePhoneCall(contactPhone);
  };

  const handleUpdateProfile = (updated: EmergencyProfile) => {
    setEmergencyProfile(updated);
    defaultStorageService.saveEmergencyProfile(updated);
    syncToCloud(undefined, undefined, undefined, updated);
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
        const newCode = `MED-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

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
              />
            </View>

            <View style={styles.splitVerticalDivider} />

            <View style={styles.splitRightColumn}>
              {(() => {
                const effectiveRightTab = activeTab === 'today' ? 'caregiver' : activeTab;
                return (
                  <>
                    <View style={styles.splitSubTabsHeader}>
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
                          escalation={escalation}
                          adherence={adherence}
                          clinicalReport={clinicalReport}
                          onOpenReport={() => setIsReportModalVisible(true)}
                          onSimulateEscalationAlert={handleSimulateEscalationAlert}
                          onCallCaregiver={handleCallCaregiver}
                          onOpenFamilyPairing={() => setIsFamilyPairingModalVisible(true)}
                          onTestNotification={handleTestNotification}
                        />
                      )}
                      {effectiveRightTab === 'stock' &&
                        (activeRole === 'patient' ? (
                          <View style={styles.protectedRoleContainer}>
                            <MaterialCommunityIcons name="shield-lock-outline" size={48} color="#0284C7" />
                            <Text style={styles.protectedRoleTitle}>Área Protegida de la Cuidadora</Text>
                            <Text style={styles.protectedRoleSubtitle}>
                              Cambie al modo Cuidador para gestionar el botiquín y evitar cambios accidentales en la receta.
                            </Text>
                            <TouchableOpacity
                              style={styles.btnUnlockRole}
                              onPress={() => setActiveRole('caregiver')}
                            >
                              <MaterialCommunityIcons name="shield-check" size={16} color="#FFFFFF" />
                              <Text style={styles.btnUnlockRoleText}>Desbloquear como Cuidadora</Text>
                            </TouchableOpacity>
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
                          onCallEmergency={handleCallEmergency}
                          onOpenFamilyPairing={() => setIsFamilyPairingModalVisible(true)}
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
                onSwitchRole={() => setActiveRole(activeRole === 'patient' ? 'caregiver' : 'patient')}
              />
            )}

            {activeTab === 'caregiver' && (
              <CaregiverDashboard
                contact={emergencyProfile.emergencyContact}
                escalation={escalation}
                adherence={adherence}
                clinicalReport={clinicalReport}
                onOpenReport={() => setIsReportModalVisible(true)}
                onSimulateEscalationAlert={handleSimulateEscalationAlert}
                onCallCaregiver={handleCallCaregiver}
                onOpenFamilyPairing={() => setIsFamilyPairingModalVisible(true)}
                onTestNotification={handleTestNotification}
              />
            )}

            {activeTab === 'stock' &&
              (activeRole === 'patient' ? (
                <View style={styles.protectedRoleContainer}>
                  <MaterialCommunityIcons name="shield-lock-outline" size={48} color="#0284C7" />
                  <Text style={styles.protectedRoleTitle}>Área Protegida de la Cuidadora</Text>
                  <Text style={styles.protectedRoleSubtitle}>
                    Cambie al modo Cuidador para gestionar el botiquín y evitar cambios accidentales en la receta.
                  </Text>
                  <TouchableOpacity
                    style={styles.btnUnlockRole}
                    onPress={() => setActiveRole('caregiver')}
                  >
                    <MaterialCommunityIcons name="shield-check" size={16} color="#FFFFFF" />
                    <Text style={styles.btnUnlockRoleText}>Desbloquear como Cuidadora</Text>
                  </TouchableOpacity>
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
                onCallEmergency={handleCallEmergency}
                onOpenFamilyPairing={() => setIsFamilyPairingModalVisible(true)}
              />
            )}

            <BottomNavBar activeTab={activeTab} onSelectTab={setActiveTab} />
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
        onSelectRole={setActiveRole}
        familyCode={familyCode}
        onConnectFamilyCode={handleConnectFamilyCode}
        isSyncing={isCloudSyncing}
        lastSyncTime={lastCloudSyncTime}
        currentDeviceId={deviceId}
        onRevokeDevice={handleRevokeDevice}
      />

      <PillInspectionModal
        visible={!!inspectingMedicine}
        medicine={inspectingMedicine}
        onClose={() => setInspectingMedicine(null)}
      />

      <OnboardingModal
        visible={isOnboardingVisible}
        busy={isOnboardingBusy}
        error={onboardingError}
        onFinishOnboarding={handleFinishOnboarding}
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
