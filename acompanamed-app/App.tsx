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
  filterDosesBySlot,
  DayTimeSlot,
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
    visualPill: { shape: 'capsule', colorHex: '#64748B', colorName: 'Blanco / Gris Neutro' },
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
  { hex: '#64748B', name: 'Gris Neutro' },
  { hex: '#D97706', name: 'Ámbar Cálido' },
  { hex: '#DC2626', name: 'Rojo Carmesí' },
  { hex: '#059669', name: 'Verde Médico' },
  { hex: '#7C3AED', name: 'Violeta Suave' },
];

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeRole, setActiveRole] = useState<ActorRole>('patient');
  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES);
  const [scheduleTimes, setScheduleTimes] = useState<Record<string, string>>(INITIAL_SCHEDULE_TIMES);
  const [logs, setLogs] = useState<DoseLog[]>(INITIAL_LOGS);
  const [emergencyProfile, setEmergencyProfile] = useState<EmergencyProfile>(DEFAULT_PROFILE);

  const [selectedSlot, setSelectedSlot] = useState<DayTimeSlot>('morning');
  const [activeDoseMedicineId, setActiveDoseMedicineId] = useState<string>('med-losartan');
  const [lastActionMessage, setLastActionMessage] = useState<string>(
    'Bienvenido a AcompañaMed. Toque su medicamento para confirmar la toma.'
  );

  // Modales
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isIceModalVisible, setIsIceModalVisible] = useState(false);
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

  // Carga inicial asíncrona
  useEffect(() => {
    async function loadStoredData() {
      try {
        const storedRole = await defaultStorageService.loadActiveRole('patient');
        const storedMeds = await defaultStorageService.loadMedicines(INITIAL_MEDICINES);
        const storedTimes = await defaultStorageService.loadSchedules(INITIAL_SCHEDULE_TIMES);
        const storedLogs = await defaultStorageService.loadLogs(INITIAL_LOGS);
        const storedProfile = await defaultStorageService.loadEmergencyProfile(DEFAULT_PROFILE);

        setActiveRole(storedRole);
        setMedicines(storedMeds);
        setScheduleTimes(storedTimes);
        setLogs(storedLogs);
        setEmergencyProfile(storedProfile);
        if (storedMeds.length > 0) {
          setActiveDoseMedicineId(storedMeds[0].id);
        }
      } catch (err) {
        console.warn('Error al cargar datos desde AsyncStorage:', err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadStoredData();
  }, []);

  // Sincronizaciones automáticas
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
    if (isLoaded) defaultStorageService.saveActiveRole(activeRole);
  }, [activeRole, isLoaded]);

  useEffect(() => {
    if (isLoaded) defaultStorageService.saveEmergencyProfile(emergencyProfile);
  }, [emergencyProfile, isLoaded]);

  // Cálculos de agenda y reportes clínicos
  const dailySchedule = buildDailySchedule(medicines, scheduleTimes, logs, new Date());
  const slotDoses = filterDosesBySlot(dailySchedule, selectedSlot);
  const activeMedicine =
    medicines.find((m) => m.id === activeDoseMedicineId) || medicines[0] || INITIAL_MEDICINES[0];
  const activeDoseItem = dailySchedule.find((item) => item.medicine.id === activeMedicine.id);

  const adherence = calculateAdherence(logs);
  const clinicalReport = generateClinicalSummary(medicines, logs, emergencyProfile);

  // Escalamiento simulado (40 minutos transcurridos desde las 08:00 AM)
  const simulatedScheduledTime = new Date('2026-10-29T08:00:00.000Z');
  const simulatedNowTime = new Date('2026-10-29T08:40:00.000Z');
  const escalation = evaluateEscalation(simulatedScheduledTime, simulatedNowTime, 30);

  // Acción: Confirmar toma
  const handleTakeDose = (actor: ActorRole) => {
    const check = canRegisterDose(activeMedicine.id, logs, new Date());
    if (!check.allowed) {
      Alert.alert('Protección de Seguridad Médica', check.reason);
      setLastActionMessage(check.reason || 'Dosis ya registrada previamente.');
      return;
    }

    const updated = decrementStock(activeMedicine, 1);
    setMedicines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));

    const newLog: DoseLog = {
      id: `log-${Date.now()}`,
      medicineId: activeMedicine.id,
      scheduledTime: new Date().toISOString(),
      takenTime: new Date().toISOString(),
      status: 'taken',
      registeredBy: actor,
    };
    setLogs((prev) => [newLog, ...prev]);

    const msg =
      actor === 'patient'
        ? `Dosis confirmada de ${activeMedicine.name}. Quedan ${updated.stock} comprimidos.`
        : `Toma asistida de ${activeMedicine.name} registrada por el cuidador. Stock: ${updated.stock}.`;

    if (actor === 'patient') {
      defaultHapticService.vibrateSuccess();
      defaultSpeechService.speak(formatConfirmationSpeech('Don Manuel', activeMedicine.name, updated.stock));
    }

    setLastActionMessage(msg);
    Alert.alert('Registro Exitoso', msg);
  };

  // Acción: Posponer toma (Snooze sin castigo)
  const handlePostpone = () => {
    const newLog: DoseLog = {
      id: `log-${Date.now()}`,
      medicineId: activeMedicine.id,
      scheduledTime: new Date().toISOString(),
      status: 'postponed',
      registeredBy: 'patient',
      notes: 'Pospuesto 15 minutos por el paciente',
    };
    setLogs((prev) => [newLog, ...prev]);

    defaultHapticService.vibrateWarning();
    defaultSpeechService.speak(`Toma de ${activeMedicine.name} pospuesta 15 minutos.`);

    const msg = `Toma de ${activeMedicine.name} pospuesta 15 minutos. Le avisaremos nuevamente.`;
    setLastActionMessage(msg);
    Alert.alert('Dosis Pospuesta', msg);
  };

  // Acción: Reabastecer stock
  const handleRestockMedicine = (medId: string) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, stock: m.stock + 30 } : m))
    );
    Alert.alert('Inventario Actualizado', 'Se registraron 30 unidades adicionales.');
  };

  // Acción: Eliminar medicina
  const handleDeleteMedicine = (medId: string, name: string) => {
    Alert.alert(
      'Retirar Medicamento',
      `¿Desea desvincular ${name} del pastillero activo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Retirar',
          style: 'destructive',
          onPress: () => {
            setMedicines((prev) => prev.filter((m) => m.id !== medId));
            if (activeDoseMedicineId === medId && medicines.length > 1) {
              const other = medicines.find((m) => m.id !== medId);
              if (other) setActiveDoseMedicineId(other.id);
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
      instructions: newMedInstructions.trim() || 'Tomar según prescripción médica con abundante agua.',
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
    setIsModalVisible(false);
    Alert.alert('Registro Guardado', `${newMed.name} ha sido incorporado al pastillero.`);
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={[styles.safeContainer, styles.centerContent]}>
        <StatusBar style="dark" />
        <MaterialCommunityIcons name="hospital-box-outline" size={48} color="#0F172A" />
        <Text style={styles.loadingTitle}>AcompañaMed</Text>
        <Text style={styles.loadingSubtitle}>Cargando entorno clínico...</Text>
        <ActivityIndicator size="small" color="#0F172A" style={{ marginTop: 20 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="dark" />

      {/* CABECERA CLÍNICA MINIMALISTA (ESTILO SUIZO / APPLE HEALTH) */}
      <View style={styles.clinicalHeader}>
        <View style={styles.headerTopRow}>
          <View style={styles.brandGroup}>
            <View style={styles.brandIconSquare}>
              <MaterialCommunityIcons name="pill" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.brandHeaderTitle}>AcompañaMed</Text>
              <Text style={styles.brandHeaderSub}>Asistencia de Adherencia Geriátrica</Text>
            </View>
          </View>

          <View style={styles.clockPillBadge}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#475569" />
            <Text style={styles.clockPillText}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* SELECTOR SEGMENTADO DE ROL (CONTRASTE WCAG AAA) */}
        <View style={styles.roleSegmentContainer}>
          <TouchableOpacity
            style={[styles.roleSegmentBtn, activeRole === 'patient' && styles.roleSegmentBtnActive]}
            onPress={() => setActiveRole('patient')}
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="account-heart"
              size={18}
              color={activeRole === 'patient' ? '#0F172A' : '#64748B'}
            />
            <Text
              style={[
                styles.roleSegmentText,
                activeRole === 'patient' && styles.roleSegmentTextActive,
              ]}
            >
              Modo Adulto Mayor
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleSegmentBtn, activeRole === 'caregiver' && styles.roleSegmentBtnActive]}
            onPress={() => setActiveRole('caregiver')}
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="stethoscope"
              size={18}
              color={activeRole === 'caregiver' ? '#0F172A' : '#64748B'}
            />
            <Text
              style={[
                styles.roleSegmentText,
                activeRole === 'caregiver' && styles.roleSegmentTextActive,
              ]}
            >
              Modo Cuidador
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.mainScrollBody} showsVerticalScrollIndicator={false}>
        {/* ========================================================= */}
        {/* VISTA 1: MODO ADULTO MAYOR (CLÍNICO, LIMPIO, WCAG AAA)     */}
        {/* ========================================================= */}
        {activeRole === 'patient' && (
          <View style={styles.seniorSectionWrap}>
            {/* 1. Selector de Franja Horaria (Segmented Timeline) */}
            <View style={styles.timelineSegmentRow}>
              <TouchableOpacity
                style={[styles.timelineTab, selectedSlot === 'morning' && styles.timelineTabActive]}
                onPress={() => setSelectedSlot('morning')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="weather-sunny"
                  size={20}
                  color={selectedSlot === 'morning' ? '#0284C7' : '#64748B'}
                />
                <Text style={[styles.timelineTabText, selectedSlot === 'morning' && styles.timelineTabTextActive]}>
                  Mañana
                </Text>
                <Text style={styles.timelineTabHours}>06:00 - 12:00</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.timelineTab, selectedSlot === 'afternoon' && styles.timelineTabActive]}
                onPress={() => setSelectedSlot('afternoon')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="weather-partly-cloudy"
                  size={20}
                  color={selectedSlot === 'afternoon' ? '#0284C7' : '#64748B'}
                />
                <Text style={[styles.timelineTabText, selectedSlot === 'afternoon' && styles.timelineTabTextActive]}>
                  Tarde
                </Text>
                <Text style={styles.timelineTabHours}>12:00 - 18:00</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.timelineTab, selectedSlot === 'night' && styles.timelineTabActive]}
                onPress={() => setSelectedSlot('night')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="weather-night"
                  size={20}
                  color={selectedSlot === 'night' ? '#0284C7' : '#64748B'}
                />
                <Text style={[styles.timelineTabText, selectedSlot === 'night' && styles.timelineTabTextActive]}>
                  Noche
                </Text>
                <Text style={styles.timelineTabHours}>18:00 - 05:00</Text>
              </TouchableOpacity>
            </View>

            {/* 2. Lista Horizontal de Medicamentos en la Franja */}
            <View style={styles.medSelectorStrip}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {slotDoses.map((item) => {
                  const isSelected = item.medicine.id === activeMedicine.id;
                  return (
                    <TouchableOpacity
                      key={item.medicine.id}
                      style={[
                        styles.medPillSelectorCard,
                        isSelected && styles.medPillSelectorCardActive,
                        item.isTakenToday && styles.medPillSelectorCardTaken,
                      ]}
                      onPress={() => setActiveDoseMedicineId(item.medicine.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.pillColorIndicator, { backgroundColor: item.medicine.visualPill.colorHex }]} />
                      <View>
                        <Text style={[styles.medSelectorName, isSelected && styles.medSelectorNameActive]}>
                          {item.medicine.name}
                        </Text>
                        <Text style={styles.medSelectorTime}>
                          {item.scheduledTime} • {item.medicine.doseDescription}
                        </Text>
                      </View>
                      {item.isTakenToday ? (
                        <MaterialCommunityIcons name="check-circle" size={18} color="#059669" style={{ marginLeft: 6 }} />
                      ) : (
                        <MaterialCommunityIcons name="clock-outline" size={16} color="#94A3B8" style={{ marginLeft: 6 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 3. Bandeja Principal de Medicación (Clean White Canvas Card) */}
            <View style={styles.mainMedicationCard}>
              {/* Encabezado con horario y estado */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.timeTag}>
                  <MaterialCommunityIcons name="alarm" size={16} color="#0284C7" />
                  <Text style={styles.timeTagText}>
                    Toma fijada: {scheduleTimes[activeMedicine.id] || '08:00'}
                  </Text>
                </View>

                {activeDoseItem?.isTakenToday ? (
                  <View style={styles.statusBadgeConfirmed}>
                    <MaterialCommunityIcons name="check" size={14} color="#065F46" />
                    <Text style={styles.statusBadgeConfirmedText}>Tomada hoy</Text>
                  </View>
                ) : (
                  <View style={styles.statusBadgePending}>
                    <MaterialCommunityIcons name="bell-ring-outline" size={14} color="#B45309" />
                    <Text style={styles.statusBadgePendingText}>Pendiente</Text>
                  </View>
                )}
              </View>

              {/* Recinto Visual del Fármaco (Visual Pill ID Minimalista) */}
              <View style={styles.pillDisplayStage}>
                <View style={[styles.pillGeometricShape, { borderColor: activeMedicine.visualPill.colorHex }]}>
                  <MaterialCommunityIcons
                    name={
                      activeMedicine.visualPill.shape === 'capsule'
                        ? 'pill'
                        : activeMedicine.visualPill.shape === 'oval'
                        ? 'circle-double'
                        : 'checkbox-blank-circle'
                    }
                    size={48}
                    color={activeMedicine.visualPill.colorHex}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.medPrimaryHeading}>{activeMedicine.name}</Text>
                  <Text style={styles.medPrimaryDosage}>{activeMedicine.doseDescription}</Text>
                  <Text style={styles.medFormatNote}>
                    {activeMedicine.visualPill.shape === 'capsule'
                      ? 'Cápsula'
                      : activeMedicine.visualPill.shape === 'oval'
                      ? 'Comprimido ovalado'
                      : 'Comprimido redondo'}{' '}
                    • {activeMedicine.visualPill.colorName}
                  </Text>
                </View>
              </View>

              {/* Indicación médica estructurada */}
              <View style={styles.instructionContainer}>
                <MaterialCommunityIcons name="information-outline" size={20} color="#0284C7" />
                <Text style={styles.instructionBodyText}>{activeMedicine.instructions}</Text>
              </View>

              {/* Botón Accesible de Lectura por Voz (TTS) */}
              <TouchableOpacity
                style={styles.voiceAssistantBtn}
                onPress={() => {
                  const speechText = formatSeniorInstructionSpeech(
                    'Don Manuel',
                    activeMedicine.name,
                    activeMedicine.doseDescription,
                    activeMedicine.instructions
                  );
                  defaultSpeechService.speak(speechText);
                  Alert.alert('Lectura por Voz', speechText);
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="volume-high" size={20} color="#0284C7" />
                <Text style={styles.voiceAssistantBtnText}>Escuchar indicación en voz alta</Text>
              </TouchableOpacity>

              {/* 4. BOTONES DE ACCIÓN: SOBRIOS, MINIMALISTAS, ERGONÓMICOS */}
              {activeDoseItem?.isTakenToday ? (
                <View style={styles.doseCompleteBox}>
                  <MaterialCommunityIcons name="shield-check" size={24} color="#065F46" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.doseCompleteTitle}>Dosis registrada con éxito</Text>
                    <Text style={styles.doseCompleteSub}>
                      El escudo de seguridad protege su horario. Próxima toma programada a las {scheduleTimes[activeMedicine.id] || '08:00'}.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.actionsStack}>
                  {/* Botón Principal: Alta Autoridad Clínica */}
                  <TouchableOpacity
                    style={styles.actionPrimaryButton}
                    onPress={() => handleTakeDose('patient')}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="check" size={22} color="#FFFFFF" />
                    <Text style={styles.actionPrimaryButtonText}>Confirmar toma de pastilla</Text>
                  </TouchableOpacity>

                  {/* Botón Secundario: Snooze Normalizado */}
                  <TouchableOpacity
                    style={styles.actionSecondaryButton}
                    onPress={handlePostpone}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="clock-fast" size={18} color="#475569" />
                    <Text style={styles.actionSecondaryButtonText}>Posponer 15 minutos</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 5. Ficha Médica de Emergencia (ICE) Card Minimalista */}
            <TouchableOpacity
              style={styles.emergencyCardStrip}
              onPress={() => setIsIceModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.emergencyRedIconBox}>
                <MaterialCommunityIcons name="card-account-details-outline" size={22} color="#991B1B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emergencyCardStripTitle}>Ficha Médica de Emergencia (ICE)</Text>
                <Text style={styles.emergencyCardStripSub}>Grupo O+, alergias farmacológicas y contacto directo</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================= */}
        {/* VISTA 2: MODO CUIDADOR (CONSOLA CLÍNICA LIMPIA)           */}
        {/* ========================================================= */}
        {activeRole === 'caregiver' && (
          <View style={styles.caregiverSectionWrap}>
            {/* 1. Alerta de Escalamiento / Tolerancia */}
            <View style={[styles.whiteCardContainer, escalation.shouldEscalate && styles.alertCardBorder]}>
              <View style={styles.cardHeaderFlex}>
                <MaterialCommunityIcons
                  name={escalation.shouldEscalate ? 'alert-circle' : 'check-circle-outline'}
                  size={24}
                  color={escalation.shouldEscalate ? '#DC2626' : '#059669'}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.cardSectionTitle}>
                    {escalation.shouldEscalate ? 'Alerta de Dosis Vencida' : 'Monitoreo de Adherencia en Curso'}
                  </Text>
                  <Text style={styles.cardSectionBodyText}>{escalation.message}</Text>
                </View>
              </View>
              <View style={styles.clinicalMetaRow}>
                <Text style={styles.metaLabelText}>Tolerancia máxima: 30 minutos</Text>
                <Text style={styles.metaLabelText}>Paciente: Don Manuel (74 años)</Text>
              </View>
            </View>

            {/* 2. Cuadrícula de Adherencia Farmacoterapéutica */}
            <View style={styles.whiteCardContainer}>
              <Text style={styles.cardSectionTitle}>Adherencia Terapéutica Global</Text>
              <View style={styles.adherenceDashboardRow}>
                <View style={styles.adherenceScorePlaque}>
                  <Text style={styles.adherenceScoreNumber}>{adherence.adherencePercentage}%</Text>
                  <View style={styles.adherenceRatingPill}>
                    <Text style={styles.adherenceRatingText}>
                      {adherence.statusRating === 'excellent' ? 'Excelente' : adherence.statusRating === 'good' ? 'Buena' : 'En Riesgo'}
                    </Text>
                  </View>
                </View>

                <View style={styles.adherenceDataGrid}>
                  <View style={styles.dataGridItem}>
                    <Text style={styles.dataGridLabel}>Programadas</Text>
                    <Text style={styles.dataGridValue}>{adherence.totalScheduled}</Text>
                  </View>
                  <View style={styles.dataGridItem}>
                    <Text style={styles.dataGridLabel}>Confirmadas</Text>
                    <Text style={[styles.dataGridValue, { color: '#059669' }]}>{adherence.totalTaken}</Text>
                  </View>
                  <View style={styles.dataGridItem}>
                    <Text style={styles.dataGridLabel}>Pospuestas</Text>
                    <Text style={[styles.dataGridValue, { color: '#D97706' }]}>{adherence.totalPostponed}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.openReportButton}
                onPress={() => setIsReportModalVisible(true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="file-document-outline" size={18} color="#0F172A" />
                <Text style={styles.openReportButtonText}>Generar Informe Completo para la Consulta</Text>
              </TouchableOpacity>
            </View>

            {/* 3. Inventario y Control de Botiquín */}
            <View style={styles.whiteCardContainer}>
              <View style={styles.cardHeaderFlex}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardSectionTitle}>Inventario y Reposición de Stock</Text>
                  <Text style={styles.cardSectionSubtitle}>Días restantes de medicación continua</Text>
                </View>
                <TouchableOpacity
                  style={styles.primaryAddBtn}
                  onPress={() => setIsModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryAddBtnText}>Agregar</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inventoryList}>
                {medicines.map((med) => {
                  const low = isStockLow(med);
                  const days = daysRemaining(med.stock, 1);
                  return (
                    <View key={med.id} style={styles.inventoryItemRow}>
                      <View style={[styles.inventoryShapeBox, { borderColor: med.visualPill.colorHex }]}>
                        <MaterialCommunityIcons
                          name={med.visualPill.shape === 'capsule' ? 'pill' : 'checkbox-blank-circle'}
                          size={18}
                          color={med.visualPill.colorHex}
                        />
                      </View>

                      <View style={{ flex: 1, marginHorizontal: 12 }}>
                        <Text style={styles.inventoryItemName}>{med.name}</Text>
                        <Text style={styles.inventoryItemSub}>
                          {med.doseDescription} • Diaria a las {scheduleTimes[med.id] || '08:00'}
                        </Text>
                        <View style={styles.inventoryStockStatus}>
                          <Text style={[styles.stockPillTag, low && styles.stockPillTagLow]}>
                            {med.stock} unidades ({days} días de reserva)
                          </Text>
                        </View>
                      </View>

                      <View style={styles.inventoryActions}>
                        <TouchableOpacity
                          style={styles.restockOutlineBtn}
                          onPress={() => handleRestockMedicine(med.id)}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name="plus" size={14} color="#059669" />
                          <Text style={styles.restockOutlineBtnText}>+30</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteOutlineBtn}
                          onPress={() => handleDeleteMedicine(med.id, med.name)}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={16} color="#991B1B" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* 4. Enlace a Ficha ICE */}
            <TouchableOpacity
              style={styles.whiteCardContainer}
              onPress={() => setIsIceModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="card-account-details-outline" size={24} color="#0284C7" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.cardSectionTitle}>Ficha Médica de Emergencia (ICE)</Text>
                  <Text style={styles.cardSectionSubtitle}>Alergias severas, grupo sanguíneo y teléfonos</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#64748B" />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ========================================================= */}
      {/* MODAL 1: REGISTRO DE NUEVO MEDICAMENTO                    */}
      {/* ========================================================= */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlayScrim}>
          <View style={styles.modalSheetBox}>
            <View style={styles.modalHeaderBorder}>
              <Text style={styles.modalHeaderTitle}>Registrar Nuevo Medicamento</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputFieldLabel}>Principio Activo</Text>
              <TextInput
                style={styles.clinicalTextInput}
                placeholder="Ej. Enalapril, Glibenclamida"
                placeholderTextColor="#94A3B8"
                value={newMedName}
                onChangeText={setNewMedName}
              />

              <View style={styles.twoColumnRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputFieldLabel}>Dosis</Text>
                  <TextInput
                    style={styles.clinicalTextInput}
                    placeholder="Ej. 10 mg"
                    placeholderTextColor="#94A3B8"
                    value={newMedDose}
                    onChangeText={setNewMedDose}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.inputFieldLabel}>Horario Diario</Text>
                  <TextInput
                    style={styles.clinicalTextInput}
                    placeholder="08:00"
                    placeholderTextColor="#94A3B8"
                    value={newMedTime}
                    onChangeText={setNewMedTime}
                  />
                </View>
              </View>

              <Text style={styles.inputFieldLabel}>Instrucciones de Ingestión</Text>
              <TextInput
                style={[styles.clinicalTextInput, { minHeight: 60 }]}
                placeholder="Ej. Tomar después del desayuno con agua."
                placeholderTextColor="#94A3B8"
                multiline
                value={newMedInstructions}
                onChangeText={setNewMedInstructions}
              />

              <Text style={styles.inputFieldLabel}>Forma del Comprimido</Text>
              <View style={styles.shapeButtonGroup}>
                {(['round', 'capsule', 'oval'] as PillShape[]).map((shape) => (
                  <TouchableOpacity
                    key={shape}
                    style={[
                      styles.shapeButton,
                      newMedShape === shape && styles.shapeButtonSelected,
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
                        styles.shapeButtonText,
                        newMedShape === shape && styles.shapeButtonTextSelected,
                      ]}
                    >
                      {shape === 'round' ? 'Redonda' : shape === 'capsule' ? 'Cápsula' : 'Oval'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputFieldLabel}>Color Distintivo</Text>
              <View style={styles.colorPaletteGrid}>
                {COLOR_PALETTE.map((c) => (
                  <TouchableOpacity
                    key={c.hex}
                    style={[
                      styles.colorDotSwatch,
                      { backgroundColor: c.hex },
                      newMedColor.hex === c.hex && styles.colorDotSwatchSelected,
                    ]}
                    onPress={() => setNewMedColor(c)}
                    activeOpacity={0.8}
                  />
                ))}
              </View>

              <View style={styles.twoColumnRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputFieldLabel}>Stock Inicial</Text>
                  <TextInput
                    style={styles.clinicalTextInput}
                    keyboardType="numeric"
                    value={newMedStock}
                    onChangeText={setNewMedStock}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.inputFieldLabel}>Alerta de Stock</Text>
                  <TextInput
                    style={styles.clinicalTextInput}
                    keyboardType="numeric"
                    value={newMedMinAlert}
                    onChangeText={setNewMedMinAlert}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalPrimaryActionBtn}
                onPress={handleSaveNewMedicine}
                activeOpacity={0.85}
              >
                <Text style={styles.modalPrimaryActionText}>Guardar en el Pastillero</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: FICHA MÉDICA DE EMERGENCIA (ICE)                 */}
      {/* ========================================================= */}
      <Modal visible={isIceModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlayScrim}>
          <View style={styles.modalSheetBox}>
            <View style={styles.modalHeaderBorder}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="card-account-details-outline" size={22} color="#991B1B" />
                <Text style={styles.modalHeaderTitle}>Ficha Médica de Emergencia (ICE)</Text>
              </View>
              <TouchableOpacity onPress={() => setIsIceModalVisible(false)} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollForm} showsVerticalScrollIndicator={false}>
              <View style={styles.patientIDCard}>
                <View style={styles.bloodTypePill}>
                  <Text style={styles.bloodTypeLabel}>GRUPO</Text>
                  <Text style={styles.bloodTypeValue}>{emergencyProfile.bloodType}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.patientFullNameText}>{emergencyProfile.patientFullName}</Text>
                  <Text style={styles.patientAgeMeta}>
                    {emergencyProfile.age} años • {emergencyProfile.healthInsurance}
                  </Text>
                </View>
              </View>

              <View style={styles.allergyWarningCard}>
                <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#991B1B" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.allergyWarningTitle}>Alergias Severas a Medicamentos:</Text>
                  <Text style={styles.allergyWarningBody}>{emergencyProfile.allergies.join(' • ')}</Text>
                </View>
              </View>

              <View style={styles.chronicConditionsCard}>
                <Text style={styles.conditionCardTitle}>Condiciones Médicas Crónicas:</Text>
                {emergencyProfile.chronicConditions.map((cond, idx) => (
                  <Text key={idx} style={styles.conditionCardItem}>• {cond}</Text>
                ))}
              </View>

              <View style={styles.emergencyContactCard}>
                <Text style={styles.contactLabelHeader}>CONTACTO DE AUXILIO INMEDIATO</Text>
                <Text style={styles.contactPersonName}>{emergencyProfile.emergencyContact.name}</Text>
                <Text style={styles.contactPersonRelation}>{emergencyProfile.emergencyContact.relationship}</Text>

                <TouchableOpacity
                  style={styles.callActionButton}
                  onPress={() =>
                    Alert.alert(
                      'Llamada de Emergencia',
                      `Llamando al contacto de auxilio: ${emergencyProfile.emergencyContact.phone}`
                    )
                  }
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="phone" size={18} color="#FFFFFF" />
                  <Text style={styles.callActionButtonText}>Llamar a {emergencyProfile.emergencyContact.phone}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: INFORME CLÍNICO DE ADHERENCIA                   */}
      {/* ========================================================= */}
      <Modal visible={isReportModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlayScrim}>
          <View style={styles.modalSheetBox}>
            <View style={styles.modalHeaderBorder}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="file-document-check-outline" size={22} color="#0F172A" />
                <Text style={styles.modalHeaderTitle}>Informe Clínico de Adherencia</Text>
              </View>
              <TouchableOpacity onPress={() => setIsReportModalVisible(false)} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollForm} showsVerticalScrollIndicator={false}>
              <View style={styles.monospaceReportBox}>
                <Text style={styles.monospaceReportText}>{clinicalReport.formattedReportText}</Text>
              </View>

              <TouchableOpacity
                style={styles.modalPrimaryActionBtn}
                onPress={() =>
                  Alert.alert(
                    'Informe Copiado',
                    'El reporte clínico fue formateado y copiado para compartir por WhatsApp o imprimir para la consulta médica.'
                  )
                }
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="share-variant-outline" size={18} color="#FFFFFF" />
                <Text style={styles.modalPrimaryActionText}>Compartir con el Médico Geriatra</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ESTILOS MINIMALISTAS CLÍNICOS (CONTRASTE WCAG AAA, TIPOGRAFÍA SUIZA, CARDS BLANCAS)
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

  // CABECERA CLÍNICA MINIMALISTA
  clinicalHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconSquare: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  brandHeaderSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  clockPillBadge: {
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
  clockPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },

  // SELECTOR SEGMENTADO DE ROL
  roleSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  roleSegmentBtnActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  roleSegmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  roleSegmentTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },

  // CUERPO PRINCIPAL SCROLL
  mainScrollBody: {
    padding: 16,
    paddingBottom: 40,
  },

  // SECCIÓN MODO ADULTO MAYOR
  seniorSectionWrap: {
    gap: 14,
  },

  // Segmented Timeline (Mañana / Tarde / Noche)
  timelineSegmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timelineTab: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineTabActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  timelineTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 4,
  },
  timelineTabTextActive: {
    color: '#0284C7',
  },
  timelineTabHours: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },

  // Selector de Medicamentos en Franja
  medSelectorStrip: {
    marginVertical: 2,
  },
  medPillSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  medPillSelectorCardActive: {
    borderColor: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  medPillSelectorCardTaken: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  pillColorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  medSelectorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  medSelectorNameActive: {
    color: '#0F172A',
  },
  medSelectorTime: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },

  // TARJETA PRINCIPAL DEL MEDICAMENTO (WHITE CLINICAL CANVAS)
  mainMedicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  timeTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  statusBadgeConfirmed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusBadgeConfirmedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  statusBadgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusBadgePendingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },

  // Escenario Visual de la Pastilla
  pillDisplayStage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  pillGeometricShape: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  medPrimaryHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 24,
  },
  medPrimaryDosage: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 2,
  },
  medFormatNote: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },

  // Instrucción médica clara
  instructionContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionBodyText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    lineHeight: 20,
  },

  // Asistente por Voz
  voiceAssistantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  voiceAssistantBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369A1',
  },

  // BOTONES DE ACCIÓN: MINIMALISTAS, LIMPIOS
  actionsStack: {
    gap: 10,
    marginTop: 4,
  },
  actionPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  actionPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  actionSecondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },

  doseCompleteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 12,
  },
  doseCompleteTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
  },
  doseCompleteSub: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },

  // Acceso Ficha ICE
  emergencyCardStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  emergencyRedIconBox: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyCardStripTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  emergencyCardStripSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // SECCIÓN MODO CUIDADOR
  caregiverSectionWrap: {
    gap: 14,
  },
  whiteCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  alertCardBorder: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF8F8',
  },
  cardHeaderFlex: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardSectionBodyText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    lineHeight: 18,
  },
  clinicalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
  },
  metaLabelText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },

  // Adherencia Dashboard
  adherenceDashboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  adherenceScorePlaque: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  adherenceScoreNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
  },
  adherenceRatingPill: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  adherenceRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  adherenceDataGrid: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dataGridItem: {
    alignItems: 'center',
  },
  dataGridLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  dataGridValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  openReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  openReportButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Inventario y Botiquín
  primaryAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  primaryAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inventoryList: {
    gap: 8,
  },
  inventoryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inventoryShapeBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inventoryItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  inventoryItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  inventoryStockStatus: {
    marginTop: 4,
  },
  stockPillTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  stockPillTagLow: {
    color: '#DC2626',
  },
  inventoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  restockOutlineBtn: {
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
  restockOutlineBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  deleteOutlineBtn: {
    padding: 4,
  },

  // MODALES CLÍNICOS
  modalOverlayScrim: {
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
  modalHeaderBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalScrollForm: {
    padding: 20,
    gap: 12,
  },
  inputFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  clinicalTextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  twoColumnRow: {
    flexDirection: 'row',
  },
  shapeButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  shapeButton: {
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
  shapeButtonSelected: {
    borderColor: '#0F172A',
    backgroundColor: '#F1F5F9',
  },
  shapeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  shapeButtonTextSelected: {
    color: '#0F172A',
    fontWeight: '700',
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorDotSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  colorDotSwatchSelected: {
    borderColor: '#0F172A',
    borderWidth: 3,
  },
  modalPrimaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
  },
  modalPrimaryActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal ICE
  patientIDCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bloodTypePill: {
    width: 52,
    height: 52,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#991B1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodTypeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#991B1B',
  },
  bloodTypeValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#991B1B',
  },
  patientFullNameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  patientAgeMeta: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  allergyWarningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  allergyWarningTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
  },
  allergyWarningBody: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F1D1D',
    marginTop: 1,
  },
  chronicConditionsCard: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  conditionCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  conditionCardItem: {
    fontSize: 13,
    color: '#0F172A',
  },
  emergencyContactCard: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  contactLabelHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  contactPersonName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  contactPersonRelation: {
    fontSize: 12,
    color: '#475569',
  },
  callActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 6,
    gap: 6,
    marginTop: 6,
  },
  callActionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal Reporte Monospace
  monospaceReportBox: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  monospaceReportText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#0F172A',
    lineHeight: 18,
  },
});
