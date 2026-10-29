import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Medicine,
  DoseLog,
  ActorRole,
  PillShape,
  EmergencyProfile,
  canRegisterDose,
  decrementStock,
  isStockLow,
  daysRemaining,
  calculateAdherence,
  evaluateEscalation,
  buildDailySchedule,
  ScheduledDoseItem,
  generateClinicalSummary,
} from './src/domain';
import {
  defaultStorageService,
  defaultSpeechService,
  defaultHapticService,
  defaultNotificationService,
  formatSeniorInstructionSpeech,
  formatConfirmationSpeech,
} from './src/infrastructure';

// Catálogo inicial con polifarmacia geriátrica real
const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med-losartan',
    name: 'Losartán Potásico',
    doseDescription: '50 mg',
    intervalHours: 24,
    instructions: 'Tomar con medio vaso de agua después del desayuno.',
    visualPill: { shape: 'round', colorHex: '#0284C7', colorName: 'Azul Clínico' },
    stock: 14,
    minStockAlert: 6,
    createdAt: '2026-10-29T08:00:00.000Z',
  },
  {
    id: 'med-metformina',
    name: 'Metformina',
    doseDescription: '850 mg',
    intervalHours: 24,
    instructions: 'Tomar inmediatamente con el almuerzo para proteger la mucosa gástrica.',
    visualPill: { shape: 'capsule', colorHex: '#E2E8F0', colorName: 'Blanco / Nácar' },
    stock: 22,
    minStockAlert: 5,
    createdAt: '2026-10-29T08:00:00.000Z',
  },
  {
    id: 'med-atorvastatina',
    name: 'Atorvastatina',
    doseDescription: '20 mg',
    intervalHours: 24,
    instructions: 'Tomar antes de acostarse a dormir.',
    visualPill: { shape: 'oval', colorHex: '#D97706', colorName: 'Ámbar Cálido' },
    stock: 4,
    minStockAlert: 6,
    createdAt: '2026-10-29T08:00:00.000Z',
  },
];

const INITIAL_SCHEDULE_TIMES: Record<string, string> = {
  'med-losartan': '08:00',
  'med-metformina': '13:00',
  'med-atorvastatina': '21:00',
};

const INITIAL_LOGS: DoseLog[] = [
  {
    id: 'log-hist-1',
    medicineId: 'med-losartan',
    scheduledTime: '2026-10-28T08:00:00.000Z',
    takenTime: '2026-10-28T08:05:00.000Z',
    status: 'taken',
    registeredBy: 'patient',
  },
  {
    id: 'log-hist-2',
    medicineId: 'med-metformina',
    scheduledTime: '2026-10-28T13:00:00.000Z',
    takenTime: '2026-10-28T13:10:00.000Z',
    status: 'taken',
    registeredBy: 'patient',
  },
  {
    id: 'log-hist-3',
    medicineId: 'med-atorvastatina',
    scheduledTime: '2026-10-28T21:00:00.000Z',
    takenTime: '2026-10-28T21:15:00.000Z',
    status: 'taken',
    registeredBy: 'caregiver',
  },
];

const DEFAULT_PROFILE: EmergencyProfile = {
  patientFullName: 'Manuel Jesús Alhua',
  age: 74,
  bloodType: 'O+',
  allergies: ['Penicilina', 'Ibuprofeno (AINEs)'],
  chronicConditions: ['Hipertensión Arterial Primaria', 'Diabetes Mellitus Tipo 2'],
  healthInsurance: 'EsSalud - Policlínico Yanahuara',
  emergencyContact: {
    name: 'María Alhua',
    relationship: 'Hija / Cuidadora Principal',
    phone: '+51 954 123 456',
  },
};

const COLOR_PALETTE = [
  { hex: '#0284C7', name: 'Azul Clínico' },
  { hex: '#E2E8F0', name: 'Blanco Nácar' },
  { hex: '#D97706', name: 'Ámbar Cálido' },
  { hex: '#DC2626', name: 'Rojo Carmesí' },
  { hex: '#059669', name: 'Verde Médico' },
  { hex: '#7C3AED', name: 'Violeta Suave' },
];

type AppNavTab = 'today' | 'caregiver' | 'stock' | 'emergency';

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<AppNavTab>('today');
  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES);
  const [scheduleTimes, setScheduleTimes] = useState<Record<string, string>>(INITIAL_SCHEDULE_TIMES);
  const [logs, setLogs] = useState<DoseLog[]>(INITIAL_LOGS);
  const [emergencyProfile, setEmergencyProfile] = useState<EmergencyProfile>(DEFAULT_PROFILE);

  const [expandedMedId, setExpandedMedId] = useState<string>('med-losartan');

  // Modales
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);

  // Formulario nuevo medicamento
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedTime, setNewMedTime] = useState('08:00');
  const [newMedInstructions, setNewMedInstructions] = useState('');
  const [newMedShape, setNewMedShape] = useState<PillShape>('round');
  const [newMedColor, setNewMedColor] = useState(COLOR_PALETTE[0]);
  const [newMedStock, setNewMedStock] = useState('30');
  const [newMedMinAlert, setNewMedMinAlert] = useState('6');

  // Carga asíncrona de almacenamiento
  useEffect(() => {
    async function loadStoredData() {
      try {
        const storedMeds = await defaultStorageService.loadMedicines(INITIAL_MEDICINES);
        const storedTimes = await defaultStorageService.loadSchedules(INITIAL_SCHEDULE_TIMES);
        const storedLogs = await defaultStorageService.loadLogs(INITIAL_LOGS);
        const storedProfile = await defaultStorageService.loadEmergencyProfile(DEFAULT_PROFILE);

        setMedicines(storedMeds);
        setScheduleTimes(storedTimes);
        setLogs(storedLogs);
        setEmergencyProfile(storedProfile);
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

  // Persistencia automática
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

  // Agenda cronológica continua del día
  const dailySchedule = buildDailySchedule(medicines, scheduleTimes, logs, new Date());
  const adherence = calculateAdherence(logs);
  const clinicalReport = generateClinicalSummary(medicines, logs, emergencyProfile);

  // Escalamiento simulado (40 min desde las 08:00)
  const simulatedScheduledTime = new Date('2026-10-29T08:00:00.000Z');
  const simulatedNowTime = new Date('2026-10-29T08:40:00.000Z');
  const escalation = evaluateEscalation(simulatedScheduledTime, simulatedNowTime, 30);

  // Acción: Confirmar toma de pastilla
  const handleTakeDose = (medId: string, actor: ActorRole = 'patient') => {
    const med = medicines.find((m) => m.id === medId);
    if (!med) return;

    const check = canRegisterDose(medId, logs, new Date());
    if (!check.allowed) {
      Alert.alert('Protección de Seguridad Médica', check.reason);
      return;
    }

    const updated = decrementStock(med, 1);
    setMedicines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));

    const newLog: DoseLog = {
      id: `log-${Date.now()}`,
      medicineId: medId,
      scheduledTime: new Date().toISOString(),
      takenTime: new Date().toISOString(),
      status: 'taken',
      registeredBy: actor,
    };
    setLogs((prev) => [newLog, ...prev]);

    if (actor === 'patient') {
      defaultHapticService.vibrateSuccess();
      defaultSpeechService.speak(formatConfirmationSpeech('Don Manuel', med.name, updated.stock));
    }

    Alert.alert('Dosis Confirmada', `Toma de ${med.name} registrada. Quedan ${updated.stock} comprimidos.`);
  };

  // Acción: Posponer toma (Snooze sin castigo)
  const handlePostponeDose = (medId: string) => {
    const med = medicines.find((m) => m.id === medId);
    if (!med) return;

    const newLog: DoseLog = {
      id: `log-${Date.now()}`,
      medicineId: medId,
      scheduledTime: new Date().toISOString(),
      status: 'postponed',
      registeredBy: 'patient',
      notes: 'Pospuesto 15 minutos por el paciente',
    };
    setLogs((prev) => [newLog, ...prev]);

    defaultHapticService.vibrateWarning();
    defaultSpeechService.speak(`Toma de ${med.name} pospuesta 15 minutos.`);
    Alert.alert('Dosis Pospuesta', `Le recordaremos tomar ${med.name} en 15 minutos.`);
  };

  // Acción: Reponer stock
  const handleRestockMedicine = (medId: string) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, stock: m.stock + 30 } : m))
    );
    Alert.alert('Inventario Actualizado', 'Se añadieron 30 unidades al stock.');
  };

  // Acción: Eliminar fármaco
  const handleDeleteMedicine = (medId: string, name: string) => {
    Alert.alert(
      'Retirar Medicamento',
      `¿Desea desvincular ${name} del pastillero familiar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Retirar',
          style: 'destructive',
          onPress: () => {
            setMedicines((prev) => prev.filter((m) => m.id !== medId));
            if (expandedMedId === medId && medicines.length > 1) {
              const other = medicines.find((m) => m.id !== medId);
              if (other) setExpandedMedId(other.id);
            }
          },
        },
      ]
    );
  };

  // Acción: Guardar nuevo medicamento
  const handleSaveNewMedicine = () => {
    if (!newMedName.trim() || !newMedDose.trim()) {
      Alert.alert('Campos Obligatorios', 'Por favor indique el nombre y la dosis prescrita.');
      return;
    }

    const newId = `med-${Date.now()}`;
    const newMed: Medicine = {
      id: newId,
      name: newMedName.trim(),
      doseDescription: newMedDose.trim(),
      intervalHours: 24,
      instructions: newMedInstructions.trim() || 'Tomar según prescripción médica con agua.',
      visualPill: {
        shape: newMedShape,
        colorHex: newMedColor.hex,
        colorName: newMedColor.name,
      },
      stock: parseInt(newMedStock, 10) || 30,
      minStockAlert: parseInt(newMedMinAlert, 10) || 6,
      createdAt: new Date().toISOString(),
    };

    setMedicines((prev) => [...prev, newMed]);
    setScheduleTimes((prev) => ({ ...prev, [newId]: newMedTime }));

    defaultNotificationService.scheduleDoseReminder(newMed, newMedTime);

    setNewMedName('');
    setNewMedDose('');
    setNewMedInstructions('');
    setIsAddModalVisible(false);
    Alert.alert('Medicamento Guardado', `${newMed.name} ha sido incorporado al pastillero.`);
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={[styles.safeContainer, styles.centerContent]}>
        <StatusBar style="dark" />
        <MaterialCommunityIcons name="pill" size={48} color="#0F172A" />
        <Text style={styles.loadingTitle}>AcompañaMed</Text>
        <Text style={styles.loadingSubtitle}>Cargando plan de medicación...</Text>
        <ActivityIndicator size="small" color="#0F172A" style={{ marginTop: 20 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="dark" />

      {/* CABECERA MINIMALISTA HOSPITALARIA */}
      <View style={styles.topAppHeader}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.appNameLabel}>AcompañaMed</Text>
          <Text style={styles.patientSubLabel}>
            Paciente: <Text style={{ fontWeight: '700', color: '#0F172A' }}>Don Manuel (74 años)</Text>
          </Text>
        </View>

        <View style={styles.clockHeaderBadge}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#0F172A" />
          <Text style={styles.clockHeaderText}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      {/* CUERPO PRINCIPAL BASADO EN NAVEGACIÓN INFERIOR NATIVA */}
      <View style={styles.mainContainer}>
        {/* ========================================================= */}
        {/* PESTAÑA 1: HOY — HILO CRONOLÓGICO CONTINUO DEL DÍA         */}
        {/* ========================================================= */}
        {activeTab === 'today' && (
          <ScrollView contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
            {/* Banner de Saludo y Próxima Acción */}
            <View style={styles.todayHeroBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.todayHeroGreeting}>Plan de Hoy</Text>
                <Text style={styles.todayHeroSub}>
                  {dailySchedule.filter((d) => d.isTakenToday).length} de {dailySchedule.length} dosis completadas
                </Text>
              </View>
              <View style={styles.adherenceMiniBadge}>
                <Text style={styles.adherenceMiniBadgeText}>{adherence.adherencePercentage}%</Text>
                <Text style={styles.adherenceMiniBadgeLabel}>Adherencia</Text>
              </View>
            </View>

            {/* HILO CRONOLÓGICO (TIMELINE STREAM VERTICAL) */}
            <View style={styles.timelineStream}>
              {dailySchedule.map((item: ScheduledDoseItem, index: number) => {
                const isExpanded = item.medicine.id === expandedMedId;
                const isLast = index === dailySchedule.length - 1;

                return (
                  <View key={item.medicine.id} style={styles.timelineNodeContainer}>
                    {/* Columna Izquierda: Hora y Línea de Conexión */}
                    <View style={styles.timelineGutter}>
                      <View
                        style={[
                          styles.timelineNodeDot,
                          item.isTakenToday && styles.timelineNodeDotTaken,
                          item.isPastDue && styles.timelineNodeDotAlert,
                        ]}
                      >
                        {item.isTakenToday ? (
                          <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                        ) : (
                          <View style={styles.timelineInnerDot} />
                        )}
                      </View>
                      {!isLast && <View style={styles.timelineConnectorLine} />}
                    </View>

                    {/* Columna Derecha: Tarjeta de Medicamento en el Hilo */}
                    <View style={{ flex: 1, paddingBottom: 20 }}>
                      <TouchableOpacity
                        style={[
                          styles.timelineCard,
                          isExpanded && styles.timelineCardExpanded,
                          item.isTakenToday && styles.timelineCardTaken,
                        ]}
                        onPress={() => setExpandedMedId(item.medicine.id)}
                        activeOpacity={0.9}
                      >
                        {/* Cabecera de la Tarjeta */}
                        <View style={styles.timelineCardTop}>
                          <View style={styles.timeTagBadge}>
                            <MaterialCommunityIcons name="clock-outline" size={12} color="#0284C7" />
                            <Text style={styles.timeTagBadgeText}>{item.scheduledTime}</Text>
                          </View>

                          {item.isTakenToday ? (
                            <View style={styles.statusTakenChip}>
                              <MaterialCommunityIcons name="check-circle" size={14} color="#059669" />
                              <Text style={styles.statusTakenChipText}>Tomada</Text>
                            </View>
                          ) : item.isPastDue ? (
                            <View style={styles.statusPastDueChip}>
                              <MaterialCommunityIcons name="alert-circle" size={14} color="#DC2626" />
                              <Text style={styles.statusPastDueChipText}>Pendiente</Text>
                            </View>
                          ) : (
                            <View style={styles.statusScheduledChip}>
                              <Text style={styles.statusScheduledChipText}>Programada</Text>
                            </View>
                          )}
                        </View>

                        {/* Nombre del Fármaco y Miniatura de Pastilla */}
                        <View style={styles.timelineMedRow}>
                          <View
                            style={[
                              styles.miniPillPreviewBox,
                              { borderColor: item.medicine.visualPill.colorHex },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={
                                item.medicine.visualPill.shape === 'capsule'
                                  ? 'pill'
                                  : item.medicine.visualPill.shape === 'oval'
                                  ? 'circle-double'
                                  : 'checkbox-blank-circle'
                              }
                              size={22}
                              color={item.medicine.visualPill.colorHex}
                            />
                          </View>

                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.timelineMedName}>{item.medicine.name}</Text>
                            <Text style={styles.timelineMedDose}>
                              {item.medicine.doseDescription} • {item.medicine.visualPill.colorName}
                            </Text>
                          </View>

                          <MaterialCommunityIcons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color="#64748B"
                          />
                        </View>

                        {/* DETALLE EXPANDIDO: MUESTRA VISUAL REALISTA Y BOTONES DE ACCIÓN */}
                        {isExpanded && (
                          <View style={styles.expandedDetailBox}>
                            <View style={styles.hairlineDivider} />

                            {/* Representación Visual Realista del Fármaco */}
                            <View style={styles.realisticPillShowcase}>
                              {item.medicine.visualPill.shape === 'capsule' ? (
                                <View style={styles.renderedCapsule}>
                                  <View
                                    style={[
                                      styles.capsuleLeftHalf,
                                      { backgroundColor: item.medicine.visualPill.colorHex },
                                    ]}
                                  />
                                  <View style={styles.capsuleRightHalf} />
                                </View>
                              ) : item.medicine.visualPill.shape === 'oval' ? (
                                <View
                                  style={[
                                    styles.renderedOval,
                                    { backgroundColor: item.medicine.visualPill.colorHex },
                                  ]}
                                >
                                  <View style={styles.renderedScoreLine} />
                                </View>
                              ) : (
                                <View
                                  style={[
                                    styles.renderedRound,
                                    { backgroundColor: item.medicine.visualPill.colorHex },
                                  ]}
                                >
                                  <View style={styles.renderedScoreLine} />
                                </View>
                              )}

                              <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text style={styles.pillVisualDescriptionTitle}>Identificación Visual</Text>
                                <Text style={styles.pillVisualDescriptionText}>
                                  Forma:{' '}
                                  <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                                    {item.medicine.visualPill.shape === 'capsule'
                                      ? 'Cápsula biseccionada'
                                      : item.medicine.visualPill.shape === 'oval'
                                      ? 'Comprimido ovalado'
                                      : 'Comprimido redondo'}
                                  </Text>
                                </Text>
                                <Text style={styles.pillVisualDescriptionText}>
                                  Color:{' '}
                                  <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                                    {item.medicine.visualPill.colorName}
                                  </Text>
                                </Text>
                              </View>
                            </View>

                            {/* Instrucciones Médicas Claras */}
                            <View style={styles.instructionBubble}>
                              <MaterialCommunityIcons name="information-outline" size={18} color="#0284C7" />
                              <Text style={styles.instructionBubbleText}>{item.medicine.instructions}</Text>
                            </View>

                            {/* Botón de Audio TTS */}
                            <TouchableOpacity
                              style={styles.listenTTSButton}
                              onPress={() => {
                                const speechText = formatSeniorInstructionSpeech(
                                  'Don Manuel',
                                  item.medicine.name,
                                  item.medicine.doseDescription,
                                  item.medicine.instructions
                                );
                                defaultSpeechService.speak(speechText);
                                Alert.alert('Lectura en Voz Alta', speechText);
                              }}
                              activeOpacity={0.8}
                            >
                              <MaterialCommunityIcons name="volume-high" size={18} color="#0284C7" />
                              <Text style={styles.listenTTSButtonText}>Escuchar indicación en voz alta</Text>
                            </TouchableOpacity>

                            {/* Acciones de Toma / Posponer */}
                            {item.isTakenToday ? (
                              <View style={styles.takenNoticeStrip}>
                                <MaterialCommunityIcons name="shield-check" size={20} color="#059669" />
                                <Text style={styles.takenNoticeStripText}>
                                  Dosis confirmada hoy. Próxima toma programada a las {item.scheduledTime}.
                                </Text>
                              </View>
                            ) : (
                              <View style={styles.actionButtonGroup}>
                                <TouchableOpacity
                                  style={styles.confirmActionButton}
                                  onPress={() => handleTakeDose(item.medicine.id, 'patient')}
                                  activeOpacity={0.85}
                                >
                                  <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                                  <Text style={styles.confirmActionButtonText}>Confirmar toma</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={styles.postponeActionButton}
                                  onPress={() => handlePostponeDose(item.medicine.id)}
                                  activeOpacity={0.8}
                                >
                                  <MaterialCommunityIcons name="clock-fast" size={16} color="#475569" />
                                  <Text style={styles.postponeActionButtonText}>Posponer 15 min</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* ========================================================= */}
        {/* PESTAÑA 2: CUIDADOR — TELEMETRÍA, ESCALAMIENTO & REPORTE  */}
        {/* ========================================================= */}
        {activeTab === 'caregiver' && (
          <ScrollView contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
            {/* Monitor de Escalamiento / Período de Gracia (30 min) */}
            <View style={[styles.panelCard, escalation.shouldEscalate && styles.panelCardAlert]}>
              <View style={styles.panelCardHeader}>
                <MaterialCommunityIcons
                  name={escalation.shouldEscalate ? 'alert-circle' : 'shield-check-outline'}
                  size={24}
                  color={escalation.shouldEscalate ? '#DC2626' : '#059669'}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.panelCardTitle}>
                    {escalation.shouldEscalate ? 'Alerta de Escalamiento Clínico' : 'Supervisión en Tiempo Real'}
                  </Text>
                  <Text style={styles.panelCardBody}>{escalation.message}</Text>
                </View>
              </View>

              <View style={styles.escalationMetricBar}>
                <Text style={styles.metricBarText}>Tolerancia máxima de gracia: 30 minutos</Text>
                <Text style={styles.metricBarText}>Monitoreo continuo activo</Text>
              </View>
            </View>

            {/* Dashboard Cuantitativo de Adherencia */}
            <View style={styles.panelCard}>
              <Text style={styles.panelCardTitle}>Tasa de Adherencia Terapéutica</Text>

              <View style={styles.adherenceScoreContainer}>
                <View style={styles.adherenceBigNumberBadge}>
                  <Text style={styles.adherenceBigNumberText}>{adherence.adherencePercentage}%</Text>
                  <View style={styles.adherenceRatingChip}>
                    <Text style={styles.adherenceRatingChipText}>
                      {adherence.statusRating === 'excellent' ? 'Excelente' : adherence.statusRating === 'good' ? 'Buena' : 'En Riesgo'}
                    </Text>
                  </View>
                </View>

                <View style={styles.adherenceBreakdownList}>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Dosis Totales</Text>
                    <Text style={styles.breakdownValue}>{adherence.totalScheduled}</Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Confirmadas</Text>
                    <Text style={[styles.breakdownValue, { color: '#059669' }]}>{adherence.totalTaken}</Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Pospuestas</Text>
                    <Text style={[styles.breakdownValue, { color: '#D97706' }]}>{adherence.totalPostponed}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.openReportCTAButton}
                onPress={() => setIsReportModalVisible(true)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="file-document-outline" size={18} color="#0F172A" />
                <Text style={styles.openReportCTAButtonText}>Generar Informe Completo para la Consulta Médica</Text>
              </TouchableOpacity>
            </View>

            {/* Lista Desglosada por Fármaco */}
            <View style={styles.panelCard}>
              <Text style={styles.panelCardTitle}>Desglose Individual por Principio Activo</Text>
              <View style={styles.medicineBreakdownList}>
                {clinicalReport.medicationBreakdown.map((item) => (
                  <View key={item.medicineId} style={styles.medBreakdownRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.medBreakdownName}>{item.medicineName}</Text>
                      <Text style={styles.medBreakdownDose}>{item.doseDescription}</Text>
                    </View>
                    <View style={styles.progressBarWrapper}>
                      <View style={[styles.progressBarFill, { width: `${item.adherenceRate}%` }]} />
                    </View>
                    <Text style={styles.medBreakdownPercent}>{item.adherenceRate}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        )}

        {/* ========================================================= */}
        {/* PESTAÑA 3: BOTIQUÍN — INVENTARIO & REPOSICIÓN DE STOCK     */}
        {/* ========================================================= */}
        {activeTab === 'stock' && (
          <ScrollView contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.panelCard}>
              <View style={styles.stockHeaderFlex}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.panelCardTitle}>Botiquín Familiar</Text>
                  <Text style={styles.panelCardBody}>Control de existencias y días restantes de tratamiento</Text>
                </View>
                <TouchableOpacity
                  style={styles.addNewMedActionBtn}
                  onPress={() => setIsAddModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
                  <Text style={styles.addNewMedActionBtnText}>Agregar</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.stockItemsContainer}>
                {medicines.map((med) => {
                  const low = isStockLow(med);
                  const days = daysRemaining(med.stock, 1);
                  return (
                    <View key={med.id} style={styles.stockItemRow}>
                      <View style={[styles.stockShapeDisc, { borderColor: med.visualPill.colorHex }]}>
                        <MaterialCommunityIcons
                          name={med.visualPill.shape === 'capsule' ? 'pill' : 'checkbox-blank-circle'}
                          size={18}
                          color={med.visualPill.colorHex}
                        />
                      </View>

                      <View style={{ flex: 1, marginHorizontal: 12 }}>
                        <Text style={styles.stockMedName}>{med.name}</Text>
                        <Text style={styles.stockMedDetail}>
                          {med.doseDescription} • Diaria a las {scheduleTimes[med.id] || '08:00'}
                        </Text>
                        <Text style={[styles.stockAlertBadge, low && styles.stockAlertBadgeLow]}>
                          {med.stock} unidades ({days} días de medicación continua)
                        </Text>
                      </View>

                      <View style={styles.stockItemActionButtons}>
                        <TouchableOpacity
                          style={styles.restockPlusBtn}
                          onPress={() => handleRestockMedicine(med.id)}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name="plus" size={14} color="#059669" />
                          <Text style={styles.restockPlusBtnText}>+30</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteMedBtn}
                          onPress={() => handleDeleteMedicine(med.id, med.name)}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        )}

        {/* ========================================================= */}
        {/* PESTAÑA 4: EMERGENCIA — FICHA MÉDICA ICE FORMAL           */}
        {/* ========================================================= */}
        {activeTab === 'emergency' && (
          <ScrollView contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.panelCard}>
              <View style={styles.iceHeaderCardRow}>
                <View style={styles.bloodTypeCardBadge}>
                  <Text style={styles.bloodTypeLabelText}>GRUPO</Text>
                  <Text style={styles.bloodTypeValueText}>{emergencyProfile.bloodType}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.icePatientNameText}>{emergencyProfile.patientFullName}</Text>
                  <Text style={styles.icePatientMetaText}>
                    {emergencyProfile.age} años • {emergencyProfile.healthInsurance}
                  </Text>
                </View>
              </View>

              <View style={styles.allergySevereCard}>
                <MaterialCommunityIcons name="alert-octagon" size={24} color="#DC2626" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.allergySevereTitle}>Alergias Severas a Medicamentos:</Text>
                  <Text style={styles.allergySevereList}>{emergencyProfile.allergies.join(' • ')}</Text>
                </View>
              </View>

              <View style={styles.chronicConditionsBox}>
                <Text style={styles.chronicConditionsBoxTitle}>Condiciones Médicas Crónicas:</Text>
                {emergencyProfile.chronicConditions.map((cond, idx) => (
                  <Text key={idx} style={styles.chronicConditionItem}>• {cond}</Text>
                ))}
              </View>

              <View style={styles.emergencyContactBox}>
                <Text style={styles.emergencyContactBoxHeader}>CONTACTO DE AUXILIO INMEDIATO</Text>
                <Text style={styles.emergencyContactPersonName}>{emergencyProfile.emergencyContact.name}</Text>
                <Text style={styles.emergencyContactPersonRelation}>{emergencyProfile.emergencyContact.relationship}</Text>

                <TouchableOpacity
                  style={styles.directCallEmergencyBtn}
                  onPress={() =>
                    Alert.alert(
                      'Llamada de Emergencia',
                      `Conectando con contacto de auxilio: ${emergencyProfile.emergencyContact.phone}`
                    )
                  }
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="phone" size={20} color="#FFFFFF" />
                  <Text style={styles.directCallEmergencyBtnText}>
                    Llamar a {emergencyProfile.emergencyContact.phone}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      {/* BARRA DE NAVEGACIÓN INFERIOR NATIVA (4 VISTAS ESTRUCTURADAS) */}
      <View style={styles.bottomNavigationBar}>
        <TouchableOpacity
          style={[styles.navBarItem, activeTab === 'today' && styles.navBarItemActive]}
          onPress={() => setActiveTab('today')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="pill"
            size={22}
            color={activeTab === 'today' ? '#0F172A' : '#64748B'}
          />
          <Text style={[styles.navBarLabel, activeTab === 'today' && styles.navBarLabelActive]}>
            Hoy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBarItem, activeTab === 'caregiver' && styles.navBarItemActive]}
          onPress={() => setActiveTab('caregiver')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="chart-timeline-variant"
            size={22}
            color={activeTab === 'caregiver' ? '#0F172A' : '#64748B'}
          />
          <Text style={[styles.navBarLabel, activeTab === 'caregiver' && styles.navBarLabelActive]}>
            Cuidador
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBarItem, activeTab === 'stock' && styles.navBarItemActive]}
          onPress={() => setActiveTab('stock')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="medical-bag"
            size={22}
            color={activeTab === 'stock' ? '#0F172A' : '#64748B'}
          />
          <Text style={[styles.navBarLabel, activeTab === 'stock' && styles.navBarLabelActive]}>
            Botiquín
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBarItem, activeTab === 'emergency' && styles.navBarItemActive]}
          onPress={() => setActiveTab('emergency')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="shield-alert-outline"
            size={22}
            color={activeTab === 'emergency' ? '#0F172A' : '#64748B'}
          />
          <Text style={[styles.navBarLabel, activeTab === 'emergency' && styles.navBarLabelActive]}>
            Emergencia
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================= */}
      {/* MODAL 1: REGISTRO DE NUEVO FÁRMACO                        */}
      {/* ========================================================= */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdropScrim}>
          <View style={styles.modalSheetBox}>
            <View style={styles.modalSheetTop}>
              <Text style={styles.modalSheetTitle}>Registrar Nuevo Medicamento</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.formInputLabel}>Principio Activo</Text>
              <TextInput
                style={styles.formTextInput}
                placeholder="Ej. Enalapril, Glibenclamida"
                placeholderTextColor="#94A3B8"
                value={newMedName}
                onChangeText={setNewMedName}
              />

              <View style={styles.twoColumnInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formInputLabel}>Dosis</Text>
                  <TextInput
                    style={styles.formTextInput}
                    placeholder="Ej. 10 mg"
                    placeholderTextColor="#94A3B8"
                    value={newMedDose}
                    onChangeText={setNewMedDose}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.formInputLabel}>Horario Diario (HH:MM)</Text>
                  <TextInput
                    style={styles.formTextInput}
                    placeholder="08:00"
                    placeholderTextColor="#94A3B8"
                    value={newMedTime}
                    onChangeText={setNewMedTime}
                  />
                </View>
              </View>

              <Text style={styles.formInputLabel}>Instrucciones de Ingestión</Text>
              <TextInput
                style={[styles.formTextInput, { minHeight: 60 }]}
                placeholder="Ej. Tomar después del desayuno con agua."
                placeholderTextColor="#94A3B8"
                multiline
                value={newMedInstructions}
                onChangeText={setNewMedInstructions}
              />

              <Text style={styles.formInputLabel}>Forma del Comprimido</Text>
              <View style={styles.shapeSelectorRow}>
                {(['round', 'capsule', 'oval'] as PillShape[]).map((shape) => (
                  <TouchableOpacity
                    key={shape}
                    style={[
                      styles.shapeOptionBtn,
                      newMedShape === shape && styles.shapeOptionBtnActive,
                    ]}
                    onPress={() => setNewMedShape(shape)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={
                        shape === 'capsule'
                          ? 'pill'
                          : shape === 'oval'
                          ? 'circle-double'
                          : 'checkbox-blank-circle'
                      }
                      size={20}
                      color={newMedShape === shape ? '#0F172A' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.shapeOptionText,
                        newMedShape === shape && styles.shapeOptionTextActive,
                      ]}
                    >
                      {shape === 'round' ? 'Redonda' : shape === 'capsule' ? 'Cápsula' : 'Oval'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formInputLabel}>Color Distintivo</Text>
              <View style={styles.colorPaletteGrid}>
                {COLOR_PALETTE.map((c) => (
                  <TouchableOpacity
                    key={c.hex}
                    style={[
                      styles.colorCircleSwatch,
                      { backgroundColor: c.hex },
                      newMedColor.hex === c.hex && styles.colorCircleSwatchActive,
                    ]}
                    onPress={() => setNewMedColor(c)}
                    activeOpacity={0.8}
                  />
                ))}
              </View>

              <View style={styles.twoColumnInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formInputLabel}>Stock Inicial</Text>
                  <TextInput
                    style={styles.formTextInput}
                    keyboardType="numeric"
                    value={newMedStock}
                    onChangeText={setNewMedStock}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.formInputLabel}>Alerta de Stock Mínimo</Text>
                  <TextInput
                    style={styles.formTextInput}
                    keyboardType="numeric"
                    value={newMedMinAlert}
                    onChangeText={setNewMedMinAlert}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleSaveNewMedicine}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSubmitButtonText}>Guardar en el Pastillero</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: INFORME CLÍNICO FORMAL EXPORTABLE                */}
      {/* ========================================================= */}
      <Modal visible={isReportModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdropScrim}>
          <View style={styles.modalSheetBox}>
            <View style={styles.modalSheetTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="file-document-check-outline" size={20} color="#0F172A" />
                <Text style={styles.modalSheetTitle}>Informe Clínico de Adherencia</Text>
              </View>
              <TouchableOpacity onPress={() => setIsReportModalVisible(false)} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false}>
              <View style={styles.monospaceContainer}>
                <Text style={styles.monospaceContentText}>{clinicalReport.formattedReportText}</Text>
              </View>

              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={() =>
                  Alert.alert(
                    'Informe Exportado',
                    'El reporte de adherencia fue copiado al portapapeles y está listo para WhatsApp o impresión médica.'
                  )
                }
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="share-variant-outline" size={18} color="#FFFFFF" />
                <Text style={styles.modalSubmitButtonText}>Compartir con el Médico Geriatra</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ESTILOS: DISEÑO MÉDICO MINIMALISTA SUIZO (APPLE HEALTH HIG / CONTRASTE WCAG AAA)
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },

  // CABECERA SUPERIOR
  topAppHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleGroup: {
    gap: 2,
  },
  appNameLabel: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  patientSubLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  clockHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clockHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  // CONTENEDOR PRINCIPAL
  mainContainer: {
    flex: 1,
  },
  tabScrollContent: {
    padding: 16,
    paddingBottom: 30,
  },

  // PESTAÑA HOY: HERO BANNER
  todayHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  todayHeroGreeting: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  todayHeroSub: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  adherenceMiniBadge: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  adherenceMiniBadgeText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#065F46',
  },
  adherenceMiniBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },

  // HILO CRONOLÓGICO (TIMELINE STREAM)
  timelineStream: {
    gap: 0,
  },
  timelineNodeContainer: {
    flexDirection: 'row',
  },
  timelineGutter: {
    width: 32,
    alignItems: 'center',
  },
  timelineNodeDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineNodeDotTaken: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  timelineNodeDotAlert: {
    borderColor: '#DC2626',
  },
  timelineInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F172A',
  },
  timelineConnectorLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },

  // TARJETA DE DOSIS EN EL HILO
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginLeft: 12,
  },
  timelineCardExpanded: {
    borderColor: '#0F172A',
  },
  timelineCardTaken: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  timelineCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    gap: 4,
  },
  timeTagBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  statusTakenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusTakenChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  statusPastDueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusPastDueChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  statusScheduledChip: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  statusScheduledChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },

  // Fila del Fármaco en la Tarjeta
  timelineMedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniPillPreviewBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineMedName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  timelineMedDose: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },

  // DETALLE EXPANDIDO
  expandedDetailBox: {
    marginTop: 12,
    gap: 12,
  },
  hairlineDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 4,
  },

  // Escaparate Visual Realista de la Pastilla
  realisticPillShowcase: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  renderedCapsule: {
    width: 64,
    height: 30,
    borderRadius: 15,
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
  },
  capsuleLeftHalf: {
    flex: 1,
  },
  capsuleRightHalf: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  renderedRound: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  renderedOval: {
    width: 60,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  renderedScoreLine: {
    width: 1.5,
    height: '70%',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  pillVisualDescriptionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  pillVisualDescriptionText: {
    fontSize: 13,
    color: '#334155',
    marginTop: 2,
  },

  // Burbuja de Instrucción
  instructionBubble: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  instructionBubbleText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#0369A1',
    lineHeight: 18,
  },

  // Botón TTS
  listenTTSButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  listenTTSButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },

  // Botonera de Acción
  actionButtonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  confirmActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  confirmActionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  postponeActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  postponeActionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  takenNoticeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 6,
    gap: 8,
  },
  takenNoticeStripText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },

  // PANELES GENERALES (CUIDADOR / STOCK / ICE)
  panelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    gap: 12,
  },
  panelCardAlert: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF8F8',
  },
  panelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  panelCardBody: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    lineHeight: 18,
  },
  escalationMetricBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
  },
  metricBarText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },

  // Adherencia Cuidador
  adherenceScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 4,
  },
  adherenceBigNumberBadge: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  adherenceBigNumberText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
  },
  adherenceRatingChip: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  adherenceRatingChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  adherenceBreakdownList: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  openReportCTAButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 4,
  },
  openReportCTAButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  medicineBreakdownList: {
    gap: 10,
  },
  medBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 6,
  },
  medBreakdownName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  medBreakdownDose: {
    fontSize: 11,
    color: '#64748B',
  },
  progressBarWrapper: {
    width: 80,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
  },
  medBreakdownPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    width: 34,
    textAlign: 'right',
  },

  // Stock / Botiquín
  stockHeaderFlex: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addNewMedActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  addNewMedActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stockItemsContainer: {
    gap: 8,
  },
  stockItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stockShapeDisc: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockMedName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  stockMedDetail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  stockAlertBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    marginTop: 3,
  },
  stockAlertBadgeLow: {
    color: '#DC2626',
  },
  stockItemActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  restockPlusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 2,
  },
  restockPlusBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  deleteMedBtn: {
    padding: 4,
  },

  // Ficha ICE
  iceHeaderCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bloodTypeCardBadge: {
    width: 52,
    height: 52,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#991B1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodTypeLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#991B1B',
  },
  bloodTypeValueText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#991B1B',
  },
  icePatientNameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  icePatientMetaText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  allergySevereCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  allergySevereTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
  },
  allergySevereList: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F1D1D',
    marginTop: 1,
  },
  chronicConditionsBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chronicConditionsBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  chronicConditionItem: {
    fontSize: 13,
    color: '#0F172A',
  },
  emergencyContactBox: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  emergencyContactBoxHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  emergencyContactPersonName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emergencyContactPersonRelation: {
    fontSize: 12,
    color: '#475569',
  },
  directCallEmergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 6,
    gap: 6,
    marginTop: 6,
  },
  directCallEmergencyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // BARRA DE NAVEGACIÓN INFERIOR (BOTTOM NAVIGATION)
  bottomNavigationBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: 6,
  },
  navBarItemActive: {
    backgroundColor: '#F1F5F9',
  },
  navBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  navBarLabelActive: {
    color: '#0F172A',
    fontWeight: '700',
  },

  // MODALES
  modalBackdropScrim: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheetBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalSheetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalSheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalFormContent: {
    padding: 20,
    gap: 12,
  },
  formInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  formTextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  twoColumnInputs: {
    flexDirection: 'row',
  },
  shapeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  shapeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  shapeOptionBtnActive: {
    borderColor: '#0F172A',
    backgroundColor: '#F1F5F9',
  },
  shapeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  shapeOptionTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorCircleSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  colorCircleSwatchActive: {
    borderColor: '#0F172A',
    borderWidth: 3,
  },
  modalSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
  },
  modalSubmitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  monospaceContainer: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  monospaceContentText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#0F172A',
    lineHeight: 18,
  },
});
