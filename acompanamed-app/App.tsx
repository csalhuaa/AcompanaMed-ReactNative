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
    visualPill: { shape: 'round', colorHex: '#38BDF8', colorName: 'Azul Celeste' },
    stock: 14,
    minStockAlert: 6,
    createdAt: '2026-10-29T08:00:00.000Z',
  },
  {
    id: 'med-metformina',
    name: 'Metformina',
    doseDescription: '850 mg',
    intervalHours: 24,
    instructions: 'Tomar inmediatamente con el almuerzo para proteger el estómago.',
    visualPill: { shape: 'capsule', colorHex: '#F8FAFC', colorName: 'Blanco Nácar' },
    stock: 22,
    minStockAlert: 5,
    createdAt: '2026-10-29T08:00:00.000Z',
  },
  {
    id: 'med-atorvastatina',
    name: 'Atorvastatina',
    doseDescription: '20 mg',
    intervalHours: 24,
    instructions: 'Tomar antes de acostarse con un sorbo de agua.',
    visualPill: { shape: 'oval', colorHex: '#FACC15', colorName: 'Amarillo Cálido' },
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
  { hex: '#38BDF8', name: 'Azul Celeste' },
  { hex: '#F8FAFC', name: 'Blanco Nácar' },
  { hex: '#FACC15', name: 'Amarillo Cálido' },
  { hex: '#F87171', name: 'Rojo Coral' },
  { hex: '#4ADE80', name: 'Verde Menta' },
  { hex: '#FB923C', name: 'Naranja Cítrico' },
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
    'Bienvenido a AcompañaMed. Toque su pastilla para confirmar la toma.'
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

  // Carga inicial persistente
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
        ? `¡Muy bien, Don Manuel! Dosis de ${activeMedicine.name} confirmada. Quedan ${updated.stock} pastillas.`
        : `Toma asistida de ${activeMedicine.name} registrada por el cuidador. Stock: ${updated.stock}.`;

    if (actor === 'patient') {
      defaultHapticService.vibrateSuccess();
      defaultSpeechService.speak(formatConfirmationSpeech('Don Manuel', activeMedicine.name, updated.stock));
    }

    setLastActionMessage(msg);
    Alert.alert('Registro Exitoso', msg);
  };

  // Acción: Posponer toma (Snooze sin castigo moral)
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
    Alert.alert('Botiquín Actualizado', 'Se agregaron 30 pastillas al inventario.');
  };

  // Acción: Eliminar medicina
  const handleDeleteMedicine = (medId: string, name: string) => {
    Alert.alert(
      'Dar de baja medicamento',
      `¿Desea retirar ${name} del pastillero?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
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
      Alert.alert('Campos requeridos', 'Por favor ingrese el nombre del medicamento y la dosis.');
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
    setIsModalVisible(false);
    Alert.alert('Medicamento Añadido', `${newMed.name} ha sido guardado en el pastillero.`);
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={[styles.safeContainer, styles.centerContent]}>
        <StatusBar style="light" />
        <MaterialCommunityIcons name="alarm-panel" size={54} color="#0284C7" />
        <Text style={styles.loadingTitle}>AcompañaMed</Text>
        <Text style={styles.loadingSubtitle}>Cargando pastillero inteligente...</Text>
        <ActivityIndicator size="small" color="#0284C7" style={{ marginTop: 24 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="light" />

      {/* CHASSIS HEADER: Reloj de Velador con Interruptor Físico de Modo */}
      <View style={styles.chassisHeader}>
        <View style={styles.applianceTopBar}>
          <View style={styles.brandBadge}>
            <MaterialCommunityIcons name="shield-check" size={20} color="#10B981" />
            <Text style={styles.brandTitle}>AcompañaMed</Text>
          </View>
          <View style={styles.clockDigitalDisplay}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#94A3B8" />
            <Text style={styles.clockDigitalTime}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* Interruptor Físico de Modo (Senior / Cuidador) */}
        <View style={styles.modeSwitchConsole}>
          <TouchableOpacity
            style={[styles.modeSwitchBtn, activeRole === 'patient' && styles.modeSwitchBtnActiveSenior]}
            onPress={() => setActiveRole('patient')}
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="account-heart"
              size={20}
              color={activeRole === 'patient' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              style={[
                styles.modeSwitchText,
                activeRole === 'patient' && styles.modeSwitchTextActive,
              ]}
            >
              Modo Adulto Mayor
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeSwitchBtn, activeRole === 'caregiver' && styles.modeSwitchBtnActiveCaregiver]}
            onPress={() => setActiveRole('caregiver')}
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="stethoscope"
              size={20}
              color={activeRole === 'caregiver' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              style={[
                styles.modeSwitchText,
                activeRole === 'caregiver' && styles.modeSwitchTextActive,
              ]}
            >
              Modo Cuidador
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.appContent} showsVerticalScrollIndicator={false}>
        {/* ========================================================= */}
        {/* VISTA 1: MODO ADULTO MAYOR (RELOJ TÁCTIL DE VELADOR)      */}
        {/* ========================================================= */}
        {activeRole === 'patient' && (
          <View style={styles.seniorViewContainer}>
            {/* 1. Selector de Franja Diaria (Botones Mecánicos con Iconos Vectoriales) */}
            <View style={styles.slotRack}>
              <TouchableOpacity
                style={[styles.slotSlide, selectedSlot === 'morning' && styles.slotSlideActive]}
                onPress={() => setSelectedSlot('morning')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="weather-sunny"
                  size={24}
                  color={selectedSlot === 'morning' ? '#0284C7' : '#64748B'}
                />
                <Text style={[styles.slotSlideLabel, selectedSlot === 'morning' && styles.slotSlideLabelActive]}>
                  Mañana
                </Text>
                <Text style={styles.slotTimeSub}>06:00 - 12:00</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.slotSlide, selectedSlot === 'afternoon' && styles.slotSlideActive]}
                onPress={() => setSelectedSlot('afternoon')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="weather-partly-cloudy"
                  size={24}
                  color={selectedSlot === 'afternoon' ? '#0284C7' : '#64748B'}
                />
                <Text style={[styles.slotSlideLabel, selectedSlot === 'afternoon' && styles.slotSlideLabelActive]}>
                  Tarde
                </Text>
                <Text style={styles.slotTimeSub}>12:00 - 18:00</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.slotSlide, selectedSlot === 'night' && styles.slotSlideActive]}
                onPress={() => setSelectedSlot('night')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="weather-night"
                  size={24}
                  color={selectedSlot === 'night' ? '#0284C7' : '#64748B'}
                />
                <Text style={[styles.slotSlideLabel, selectedSlot === 'night' && styles.slotSlideLabelActive]}>
                  Noche
                </Text>
                <Text style={styles.slotTimeSub}>18:00 - 05:00</Text>
              </TouchableOpacity>
            </View>

            {/* 2. Fila de Selección Táctil de Medicamentos en la Franja */}
            <View style={styles.chipRackContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRackContent}>
                {slotDoses.map((item) => {
                  const isSelected = item.medicine.id === activeMedicine.id;
                  return (
                    <TouchableOpacity
                      key={item.medicine.id}
                      style={[
                        styles.medicineChipButton,
                        isSelected && styles.medicineChipButtonSelected,
                        item.isTakenToday && styles.medicineChipButtonTaken,
                      ]}
                      onPress={() => setActiveDoseMedicineId(item.medicine.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.pillColorDot, { backgroundColor: item.medicine.visualPill.colorHex }]} />
                      <View>
                        <Text style={[styles.chipTitleText, isSelected && styles.chipTitleTextSelected]}>
                          {item.medicine.name}
                        </Text>
                        <Text style={styles.chipDoseMeta}>
                          {item.scheduledTime} • {item.medicine.doseDescription}
                        </Text>
                      </View>
                      {item.isTakenToday ? (
                        <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" style={{ marginLeft: 8 }} />
                      ) : (
                        <MaterialCommunityIcons name="clock-outline" size={18} color="#64748B" style={{ marginLeft: 8 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 3. Bandeja Central del Medicamento: Relieve Táctil de Alta Visibilidad */}
            <View style={styles.applianceMainCard}>
              {/* Encabezado con hora programada y estado */}
              <View style={styles.cardScheduleHeader}>
                <View style={styles.scheduleBadge}>
                  <MaterialCommunityIcons name="alarm" size={18} color="#38BDF8" />
                  <Text style={styles.scheduleBadgeText}>
                    HORA FIJADA: {scheduleTimes[activeMedicine.id] || '08:00'}
                  </Text>
                </View>

                {activeDoseItem?.isTakenToday ? (
                  <View style={styles.statusPillTaken}>
                    <MaterialCommunityIcons name="check" size={16} color="#10B981" />
                    <Text style={styles.statusPillTakenText}>TOMADA HOY</Text>
                  </View>
                ) : (
                  <View style={styles.statusPillPending}>
                    <MaterialCommunityIcons name="bell-ring" size={16} color="#F59E0B" />
                    <Text style={styles.statusPillPendingText}>PENDIENTE</Text>
                  </View>
                )}
              </View>

              {/* Contenedor Visual de la Pastilla (Tangible Visual Pill Chamber) */}
              <View style={styles.pillChamber}>
                <View style={[styles.pillVisualDisc, { borderColor: activeMedicine.visualPill.colorHex }]}>
                  <MaterialCommunityIcons
                    name={
                      activeMedicine.visualPill.shape === 'capsule'
                        ? 'pill'
                        : activeMedicine.visualPill.shape === 'oval'
                        ? 'circle-double'
                        : 'checkbox-blank-circle'
                    }
                    size={64}
                    color={activeMedicine.visualPill.colorHex}
                  />
                </View>

                <View style={styles.pillIdentityBox}>
                  <Text style={styles.medicineMainName}>{activeMedicine.name}</Text>
                  <Text style={styles.medicineMainDose}>{activeMedicine.doseDescription}</Text>
                  <View style={styles.pillAttributesRow}>
                    <Text style={styles.pillShapeBadge}>
                      {activeMedicine.visualPill.shape === 'capsule'
                        ? 'Cápsula'
                        : activeMedicine.visualPill.shape === 'oval'
                        ? 'Comprimido Oval'
                        : 'Comprimido Redondo'}
                    </Text>
                    <Text style={styles.pillColorBadge}>• {activeMedicine.visualPill.colorName}</Text>
                  </View>
                </View>
              </View>

              {/* Indicación médica clara en tamaño legible */}
              <View style={styles.instructionDisplay}>
                <MaterialCommunityIcons name="information" size={24} color="#0284C7" />
                <Text style={styles.instructionDisplayText}>{activeMedicine.instructions}</Text>
              </View>

              {/* Botón Táctil de Audio en Voz Alta (TTS Accesible) */}
              <TouchableOpacity
                style={styles.voiceSpeakerBtn}
                onPress={() => {
                  const speechText = formatSeniorInstructionSpeech(
                    'Don Manuel',
                    activeMedicine.name,
                    activeMedicine.doseDescription,
                    activeMedicine.instructions
                  );
                  defaultSpeechService.speak(speechText);
                  Alert.alert('Lectura en Voz Alta', speechText);
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="volume-high" size={24} color="#38BDF8" />
                <Text style={styles.voiceSpeakerText}>Escuchar Instrucción con Voz Clara</Text>
              </TouchableOpacity>

              {/* 4. BOTONES TÁCTILES GIGANTES CON RELIEVE FÍSICO */}
              {activeDoseItem?.isTakenToday ? (
                <View style={styles.completedDosePlaque}>
                  <MaterialCommunityIcons name="check-decagram" size={32} color="#10B981" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.completedDoseTitle}>Dosis Completada con Éxito</Text>
                    <Text style={styles.completedDoseSubtitle}>
                      El escudo antidobles tomas protege a Don Manuel. Próxima toma mañana a las {scheduleTimes[activeMedicine.id] || '08:00'}.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.actionButtonsCol}>
                  {/* Botón Gigante de Toma (Relieve 3D Físico Esmeralda) */}
                  <TouchableOpacity
                    style={styles.primaryTakeButton}
                    onPress={() => handleTakeDose('patient')}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="check-bold" size={30} color="#FFFFFF" />
                    <Text style={styles.primaryTakeButtonText}>¡YA ME TOMÉ ESTA PASTILLA!</Text>
                  </TouchableOpacity>

                  {/* Botón de Posponer (Snooze Bar Ámbar sin castigo) */}
                  <TouchableOpacity
                    style={styles.snoozeButton}
                    onPress={handlePostpone}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="clock-fast" size={22} color="#F59E0B" />
                    <Text style={styles.snoozeButtonText}>Posponer 15 minutos (Avisar luego)</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 5. Acceso Inmediato a la Ficha Médica de Emergencia (ICE) */}
            <TouchableOpacity
              style={styles.emergencyAccessPill}
              onPress={() => setIsIceModalVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="shield-alert" size={24} color="#EF4444" />
              <View style={{ flex: 1 }}>
                <Text style={styles.emergencyAccessTitle}>Ver Mi Ficha Médica de Emergencia (ICE)</Text>
                <Text style={styles.emergencyAccessSub}>Alergias, grupo sanguíneo y contacto directo de auxilio</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================= */}
        {/* VISTA 2: MODO CUIDADOR (PANEL CLÍNICO & GESTIÓN DE STOCK)  */}
        {/* ========================================================= */}
        {activeRole === 'caregiver' && (
          <View style={styles.caregiverViewContainer}>
            {/* 1. Alerta de Escalamiento Clínico */}
            <View style={styles.escalationCard}>
              <View style={styles.escalationHeader}>
                <MaterialCommunityIcons
                  name={escalation.shouldEscalate ? 'alert-decagram' : 'clock-check'}
                  size={26}
                  color={escalation.shouldEscalate ? '#EF4444' : '#10B981'}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.escalationTitle}>
                    {escalation.shouldEscalate
                      ? 'Alerta de Escalamiento: Dosis Demorada'
                      : 'Monitoreo de Adherencia en Tiempo Real'}
                  </Text>
                  <Text style={styles.escalationMessage}>{escalation.message}</Text>
                </View>
              </View>
              <View style={styles.escalationStatsRow}>
                <Text style={styles.escalationStatItem}>
                  Tolerancia Máxima: <Text style={{ color: '#F8FAFC', fontWeight: '700' }}>30 minutos</Text>
                </Text>
                <Text style={styles.escalationStatItem}>
                  Paciente: <Text style={{ color: '#F8FAFC', fontWeight: '700' }}>Don Manuel (74 años)</Text>
                </Text>
              </View>
            </View>

            {/* 2. Métricas Globales de Adherencia Farmacoterapéutica */}
            <View style={styles.adherenceDashboardCard}>
              <Text style={styles.sectionHeaderTitle}>Adherencia Terapéutica Global</Text>
              <View style={styles.adherenceMetricRow}>
                <View style={styles.adherenceBigNumberBox}>
                  <Text style={styles.adherenceBigNumber}>{adherence.adherencePercentage}%</Text>
                  <Text style={styles.adherenceStatusLabel}>
                    Calificación: {adherence.statusRating === 'excellent' ? 'Excelente' : adherence.statusRating === 'good' ? 'Buena' : 'En Riesgo'}
                  </Text>
                </View>
                <View style={styles.adherenceCountersCol}>
                  <Text style={styles.adherenceCounterText}>
                    Programadas: <Text style={{ color: '#F8FAFC', fontWeight: '700' }}>{adherence.totalScheduled}</Text>
                  </Text>
                  <Text style={styles.adherenceCounterText}>
                    Confirmadas: <Text style={{ color: '#10B981', fontWeight: '700' }}>{adherence.totalTaken}</Text>
                  </Text>
                  <Text style={styles.adherenceCounterText}>
                    Pospuestas: <Text style={{ color: '#F59E0B', fontWeight: '700' }}>{adherence.totalPostponed}</Text>
                  </Text>
                </View>
              </View>

              {/* Botón para Abrir Reporte Clínico Formal */}
              <TouchableOpacity
                style={styles.openClinicalReportBtn}
                onPress={() => setIsReportModalVisible(true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="file-document-outline" size={20} color="#38BDF8" />
                <Text style={styles.openClinicalReportBtnText}>Generar Informe Completo para la Consulta Médica</Text>
              </TouchableOpacity>
            </View>

            {/* 3. Botiquín e Inventario de Stock Farmacológico */}
            <View style={styles.stockSectionCard}>
              <View style={styles.stockSectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionHeaderTitle}>Pastillero e Inventario de Stock</Text>
                  <Text style={styles.stockSectionSubtitle}>Control de existencias y días de medicación restantes</Text>
                </View>
                <TouchableOpacity
                  style={styles.addMedHeaderBtn}
                  onPress={() => setIsModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
                  <Text style={styles.addMedHeaderBtnText}>Agregar</Text>
                </TouchableOpacity>
              </View>

              {medicines.map((med) => {
                const low = isStockLow(med);
                const days = daysRemaining(med.stock, 1);
                return (
                  <View key={med.id} style={styles.medicineInventoryRow}>
                    <View style={[styles.pillColorPlaque, { backgroundColor: med.visualPill.colorHex }]}>
                      <MaterialCommunityIcons
                        name={med.visualPill.shape === 'capsule' ? 'pill' : 'checkbox-blank-circle'}
                        size={22}
                        color="#0B132B"
                      />
                    </View>

                    <View style={{ flex: 1, marginHorizontal: 12 }}>
                      <Text style={styles.medInventoryName}>{med.name}</Text>
                      <Text style={styles.medInventoryDose}>
                        {med.doseDescription} • Toma diaria a las {scheduleTimes[med.id] || '08:00'}
                      </Text>
                      <View style={styles.stockBadgeRow}>
                        <Text style={[styles.stockStatusBadge, low && styles.stockStatusBadgeLow]}>
                          Stock: {med.stock} unidades ({days} días restantes)
                        </Text>
                      </View>
                    </View>

                    <View style={styles.inventoryActionButtons}>
                      <TouchableOpacity
                        style={styles.restockSmallBtn}
                        onPress={() => handleRestockMedicine(med.id)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="plus-box" size={18} color="#10B981" />
                        <Text style={styles.restockSmallBtnText}>+30</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteSmallBtn}
                        onPress={() => handleDeleteMedicine(med.id, med.name)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* 4. Acceso a la Ficha ICE en Modo Cuidador */}
            <TouchableOpacity
              style={styles.iceCardCaregiver}
              onPress={() => setIsIceModalVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="card-account-details-outline" size={24} color="#38BDF8" />
              <View style={{ flex: 1 }}>
                <Text style={styles.iceCardCaregiverTitle}>Ficha Médica de Emergencia (ICE)</Text>
                <Text style={styles.iceCardCaregiverSub}>Grupo sanguíneo, alergias severas y contacto de auxilio</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ========================================================= */}
      {/* MODAL 1: REGISTRO DE NUEVO MEDICAMENTO                    */}
      {/* ========================================================= */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialCommunityIcons name="pill" size={24} color="#0284C7" />
                <Text style={styles.modalSheetTitle}>Nuevo Medicamento</Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.modalCloseBtn}>
                <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Nombre del Principio Activo</Text>
              <TextInput
                style={styles.tactileInput}
                placeholder="Ej. Enalapril, Glibenclamida, Levotiroxina"
                placeholderTextColor="#64748B"
                value={newMedName}
                onChangeText={setNewMedName}
              />

              <View style={styles.twoColumnInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Dosis Prescrita</Text>
                  <TextInput
                    style={styles.tactileInput}
                    placeholder="Ej. 10 mg, 1 comp"
                    placeholderTextColor="#64748B"
                    value={newMedDose}
                    onChangeText={setNewMedDose}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.fieldLabel}>Horario Diario (HH:MM)</Text>
                  <TextInput
                    style={styles.tactileInput}
                    placeholder="08:00"
                    placeholderTextColor="#64748B"
                    value={newMedTime}
                    onChangeText={setNewMedTime}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Instrucciones de Toma para el Adulto Mayor</Text>
              <TextInput
                style={[styles.tactileInput, { minHeight: 70 }]}
                placeholder="Ej. Tomar con medio vaso de agua después del almuerzo."
                placeholderTextColor="#64748B"
                multiline
                value={newMedInstructions}
                onChangeText={setNewMedInstructions}
              />

              {/* Selector de Forma Geométrica de la Pastilla */}
              <Text style={styles.fieldLabel}>Forma Visual de la Pastilla</Text>
              <View style={styles.shapeSelectorRow}>
                {(['round', 'capsule', 'oval'] as PillShape[]).map((shape) => (
                  <TouchableOpacity
                    key={shape}
                    style={[
                      styles.shapeSelectorBtn,
                      newMedShape === shape && styles.shapeSelectorBtnActive,
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
                      size={24}
                      color={newMedShape === shape ? '#38BDF8' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.shapeSelectorText,
                        newMedShape === shape && styles.shapeSelectorTextActive,
                      ]}
                    >
                      {shape === 'round' ? 'Redonda' : shape === 'capsule' ? 'Cápsula' : 'Oval'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Selector de Color de la Pastilla */}
              <Text style={styles.fieldLabel}>Color Distintivo del Comprimido</Text>
              <View style={styles.paletteSelectorRow}>
                {COLOR_PALETTE.map((c) => (
                  <TouchableOpacity
                    key={c.hex}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c.hex },
                      newMedColor.hex === c.hex && styles.colorSwatchActive,
                    ]}
                    onPress={() => setNewMedColor(c)}
                    activeOpacity={0.8}
                  />
                ))}
              </View>
              <Text style={styles.selectedColorHint}>Color seleccionado: {newMedColor.name}</Text>

              <View style={styles.twoColumnInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Stock Inicial</Text>
                  <TextInput
                    style={styles.tactileInput}
                    keyboardType="numeric"
                    value={newMedStock}
                    onChangeText={setNewMedStock}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.fieldLabel}>Alerta Stock Mínimo</Text>
                  <TextInput
                    style={styles.tactileInput}
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
                <MaterialCommunityIcons name="content-save" size={22} color="#FFFFFF" />
                <Text style={styles.modalSubmitButtonText}>Guardar en el Pastillero</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: FICHA MÉDICA DE EMERGENCIA (ICE)                 */}
      {/* ========================================================= */}
      <Modal visible={isIceModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialCommunityIcons name="shield-cross" size={26} color="#EF4444" />
                <Text style={styles.modalSheetTitle}>Ficha Médica de Emergencia (ICE)</Text>
              </View>
              <TouchableOpacity onPress={() => setIsIceModalVisible(false)} style={styles.modalCloseBtn}>
                <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false}>
              <View style={styles.iceHeaderCard}>
                <View style={styles.bloodTypeDisc}>
                  <Text style={styles.bloodTypeDiscTitle}>GRUPO</Text>
                  <Text style={styles.bloodTypeDiscValue}>{emergencyProfile.bloodType}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.icePatientFullName}>{emergencyProfile.patientFullName}</Text>
                  <Text style={styles.icePatientSub}>
                    {emergencyProfile.age} años • {emergencyProfile.healthInsurance}
                  </Text>
                </View>
              </View>

              <View style={styles.iceAllergiesBox}>
                <MaterialCommunityIcons name="alert-octagon" size={24} color="#EF4444" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.iceAllergiesTitle}>Alergias Severas a Fármacos:</Text>
                  <Text style={styles.iceAllergiesList}>{emergencyProfile.allergies.join(' • ')}</Text>
                </View>
              </View>

              <View style={styles.iceConditionsBox}>
                <Text style={styles.iceConditionsTitle}>Condiciones Médicas Crónicas:</Text>
                {emergencyProfile.chronicConditions.map((cond, idx) => (
                  <Text key={idx} style={styles.iceConditionItem}>• {cond}</Text>
                ))}
              </View>

              <View style={styles.iceContactCard}>
                <Text style={styles.iceContactHeading}>CONTACTO DE AUXILIO INMEDIATO:</Text>
                <Text style={styles.iceContactName}>{emergencyProfile.emergencyContact.name}</Text>
                <Text style={styles.iceContactRelation}>{emergencyProfile.emergencyContact.relationship}</Text>

                <TouchableOpacity
                  style={styles.iceCallButton}
                  onPress={() =>
                    Alert.alert(
                      'Llamada de Emergencia',
                      `Conectando con ${emergencyProfile.emergencyContact.name}: ${emergencyProfile.emergencyContact.phone}`
                    )
                  }
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="phone" size={22} color="#FFFFFF" />
                  <Text style={styles.iceCallButtonText}>Llamar a {emergencyProfile.emergencyContact.phone}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: INFORME CLÍNICO FORMAL PARA EL GERIATRA          */}
      {/* ========================================================= */}
      <Modal visible={isReportModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialCommunityIcons name="file-document-check" size={24} color="#0284C7" />
                <Text style={styles.modalSheetTitle}>Informe Clínico de Adherencia</Text>
              </View>
              <TouchableOpacity onPress={() => setIsReportModalVisible(false)} style={styles.modalCloseBtn}>
                <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false}>
              <View style={styles.reportTerminalBox}>
                <Text style={styles.reportTerminalText}>{clinicalReport.formattedReportText}</Text>
              </View>

              <TouchableOpacity
                style={styles.shareReportSubmitBtn}
                onPress={() =>
                  Alert.alert(
                    'Informe Exportado',
                    'El reporte de adherencia ha sido formateado y copiado para compartir por WhatsApp o imprimir en la consulta geriátrica.'
                  )
                }
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="share-variant" size={20} color="#FFFFFF" />
                <Text style={styles.shareReportSubmitBtnText}>Compartir con el Médico Geriatra</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ESTILOS TÁCTILES: DIRECCIÓN VISUAL "RELOJ DESPERTADOR DE VELADOR"
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 16,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 6,
  },

  // Encabezado Chasis de Velador
  chassisHeader: {
    backgroundColor: '#0E1726',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  applianceTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  clockDigitalDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#182234',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  clockDigitalTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38BDF8',
  },

  // Interruptor Físico de Modo
  modeSwitchConsole: {
    flexDirection: 'row',
    backgroundColor: '#182234',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  modeSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  modeSwitchBtnActiveSenior: {
    backgroundColor: '#0284C7',
    borderBottomWidth: 2,
    borderBottomColor: '#0369A1',
  },
  modeSwitchBtnActiveCaregiver: {
    backgroundColor: '#059669',
    borderBottomWidth: 2,
    borderBottomColor: '#047857',
  },
  modeSwitchText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modeSwitchTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Contenedor Scroll Principal
  appContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // VISTA ADULTO MAYOR
  seniorViewContainer: {
    gap: 16,
  },

  // Selector de Franja Diaria
  slotRack: {
    flexDirection: 'row',
    gap: 10,
  },
  slotSlide: {
    flex: 1,
    backgroundColor: '#0E1726',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  slotSlideActive: {
    backgroundColor: '#132338',
    borderColor: '#0284C7',
    borderBottomWidth: 3,
    borderBottomColor: '#0284C7',
  },
  slotSlideLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 4,
  },
  slotSlideLabelActive: {
    color: '#F8FAFC',
  },
  slotTimeSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },

  // Fila de Chips de Medicamentos
  chipRackContainer: {
    marginVertical: 4,
  },
  chipRackContent: {
    gap: 10,
  },
  medicineChipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E1726',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 10,
  },
  medicineChipButtonSelected: {
    borderColor: '#38BDF8',
    backgroundColor: '#182436',
  },
  medicineChipButtonTaken: {
    borderColor: '#059669',
    backgroundColor: '#0C201A',
  },
  pillColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  chipTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  chipTitleTextSelected: {
    color: '#38BDF8',
  },
  chipDoseMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  // BANDEJA PRINCIPAL DE LA PASTILLA (Relieve y Ergonomía de Velador)
  applianceMainCard: {
    backgroundColor: '#0E1726',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 16,
  },
  cardScheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#182234',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  scheduleBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  statusPillTaken: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C201A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  statusPillTakenText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
  },
  statusPillPending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#261C0D',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  statusPillPendingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
  },

  // Cámara Visual de la Pastilla
  pillChamber: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#070B14',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#182436',
    gap: 16,
  },
  pillVisualDisc: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#131B2E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  pillIdentityBox: {
    flex: 1,
  },
  medicineMainName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    lineHeight: 26,
  },
  medicineMainDose: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38BDF8',
    marginTop: 4,
  },
  pillAttributesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  pillShapeBadge: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  pillColorBadge: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Instrucción clara
  instructionDisplay: {
    flexDirection: 'row',
    backgroundColor: '#131F33',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  instructionDisplayText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#E2E8F0',
    lineHeight: 20,
  },

  // Botón Altavoz TTS
  voiceSpeakerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#182436',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  voiceSpeakerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#38BDF8',
  },

  // BOTONES TÁCTILES GIGANTES
  actionButtonsCol: {
    gap: 12,
    marginTop: 6,
  },
  primaryTakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    borderBottomWidth: 4,
    borderBottomColor: '#047857',
  },
  primaryTakeButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  snoozeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#182234',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderBottomWidth: 3,
    borderBottomColor: '#B45309',
  },
  snoozeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FBBF24',
  },

  // Placa de toma completada
  completedDosePlaque: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C201A',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#10B981',
    gap: 14,
  },
  completedDoseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  completedDoseSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
  },

  // Acceso Emergencia ICE
  emergencyAccessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1116',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#7F1D1D',
    gap: 14,
  },
  emergencyAccessTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F87171',
  },
  emergencyAccessSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  // VISTA MODO CUIDADOR
  caregiverViewContainer: {
    gap: 16,
  },
  escalationCard: {
    backgroundColor: '#0E1726',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
  },
  escalationHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  escalationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  escalationMessage: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  escalationStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#070B14',
    padding: 10,
    borderRadius: 10,
  },
  escalationStatItem: {
    fontSize: 12,
    color: '#64748B',
  },

  adherenceDashboardCard: {
    backgroundColor: '#0E1726',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 14,
  },
  sectionHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  adherenceMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  adherenceBigNumberBox: {
    backgroundColor: '#070B14',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  adherenceBigNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#10B981',
  },
  adherenceStatusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
    marginTop: 2,
  },
  adherenceCountersCol: {
    flex: 1,
    gap: 6,
  },
  adherenceCounterText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  openClinicalReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#182436',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  openClinicalReportBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38BDF8',
  },

  stockSectionCard: {
    backgroundColor: '#0E1726',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 14,
  },
  stockSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockSectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addMedHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addMedHeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  medicineInventoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#070B14',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#182436',
  },
  pillColorPlaque: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medInventoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  medInventoryDose: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  stockBadgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  stockStatusBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    backgroundColor: '#0C201A',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  stockStatusBadgeLow: {
    color: '#EF4444',
    backgroundColor: '#2A1116',
  },
  inventoryActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  restockSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C201A',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  restockSmallBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
  },
  deleteSmallBtn: {
    backgroundColor: '#1E1418',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
  },

  iceCardCaregiver: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E1726',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
  },
  iceCardCaregiverTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  iceCardCaregiverSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  // MODALES
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheetContainer: {
    backgroundColor: '#0E1726',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalFormContent: {
    padding: 20,
    gap: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tactileInput: {
    backgroundColor: '#070B14',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  twoColumnInputs: {
    flexDirection: 'row',
  },
  shapeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shapeSelectorBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#070B14',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 6,
  },
  shapeSelectorBtnActive: {
    borderColor: '#0284C7',
    backgroundColor: '#132338',
  },
  shapeSelectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  shapeSelectorTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  paletteSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  colorSwatchActive: {
    borderColor: '#38BDF8',
    transform: [{ scale: 1.15 }],
  },
  selectedColorHint: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  modalSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 10,
  },
  modalSubmitButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Modal ICE
  iceHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#070B14',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  bloodTypeDisc: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#181216',
    borderWidth: 2,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodTypeDiscTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
  },
  bloodTypeDiscValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  icePatientFullName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  icePatientSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  iceAllergiesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#261217',
    padding: 14,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  iceAllergiesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
  },
  iceAllergiesList: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FECACA',
    marginTop: 2,
  },
  iceConditionsBox: {
    backgroundColor: '#070B14',
    padding: 14,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  iceConditionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  iceConditionItem: {
    fontSize: 14,
    color: '#F8FAFC',
  },
  iceContactCard: {
    backgroundColor: '#070B14',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 6,
  },
  iceContactHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  iceContactName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  iceContactRelation: {
    fontSize: 13,
    color: '#94A3B8',
  },
  iceCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  iceCallButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Modal Reporte
  reportTerminalBox: {
    backgroundColor: '#070B14',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  reportTerminalText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#38BDF8',
    lineHeight: 18,
  },
  shareReportSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  shareReportSubmitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
