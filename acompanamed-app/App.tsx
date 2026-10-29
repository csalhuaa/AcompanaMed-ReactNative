import React, { useState } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Medicine,
  DoseLog,
  ActorRole,
  PillShape,
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
} from './src/domain';

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
    instructions: 'Tomar inmediatamente con el almuerzo para evitar acidez.',
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
    instructions: 'Tomar antes de acostarse a dormir.',
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

const COLOR_PALETTE = [
  { hex: '#38BDF8', name: 'Azul Celeste' },
  { hex: '#F8FAFC', name: 'Blanco' },
  { hex: '#FACC15', name: 'Amarillo' },
  { hex: '#F87171', name: 'Rojo Coral' },
  { hex: '#4ADE80', name: 'Verde Menta' },
  { hex: '#FB923C', name: 'Naranja' },
];

export default function App() {
  const [activeRole, setActiveRole] = useState<ActorRole>('patient');
  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES);
  const [scheduleTimes, setScheduleTimes] = useState<Record<string, string>>(INITIAL_SCHEDULE_TIMES);
  const [logs, setLogs] = useState<DoseLog[]>(INITIAL_LOGS);
  const [selectedSlot, setSelectedSlot] = useState<DayTimeSlot>('morning');
  const [activeDoseMedicineId, setActiveDoseMedicineId] = useState<string>('med-losartan');
  const [lastActionMessage, setLastActionMessage] = useState<string>(
    'Bienvenido a AcompañaMed. Toque su medicamento para registrar su toma.'
  );

  // Estado para modal de nuevo medicamento (Modo Cuidador)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedTime, setNewMedTime] = useState('08:00');
  const [newMedInstructions, setNewMedInstructions] = useState('');
  const [newMedShape, setNewMedShape] = useState<PillShape>('round');
  const [newMedColor, setNewMedColor] = useState(COLOR_PALETTE[0]);
  const [newMedStock, setNewMedStock] = useState('30');
  const [newMedMinAlert, setNewMedMinAlert] = useState('6');

  // Agenda diaria calculada dinámicamente
  const dailySchedule = buildDailySchedule(medicines, scheduleTimes, logs, new Date());
  const slotDoses = filterDosesBySlot(dailySchedule, selectedSlot);

  // Medicamento actualmente activo para la vista Senior
  const activeMedicine =
    medicines.find((m) => m.id === activeDoseMedicineId) || medicines[0] || INITIAL_MEDICINES[0];
  const activeDoseItem = dailySchedule.find((item) => item.medicine.id === activeMedicine.id);

  // Métricas para cuidador
  const adherence = calculateAdherence(logs);

  // Escalamiento simulado (40 minutos transcurridos desde las 08:00 AM)
  const simulatedScheduledTime = new Date('2026-10-29T08:00:00.000Z');
  const simulatedNowTime = new Date('2026-10-29T08:40:00.000Z');
  const escalation = evaluateEscalation(simulatedScheduledTime, simulatedNowTime, 30);

  // Acción: Confirmar toma del medicamento activo
  const handleTakeDose = (actor: ActorRole) => {
    const check = canRegisterDose(activeMedicine.id, logs, new Date());
    if (!check.allowed) {
      Alert.alert('Protección de Seguridad Médica', check.reason);
      setLastActionMessage(check.reason || 'Dosis ya registrada previamente.');
      return;
    }

    // Decrementar stock
    const updated = decrementStock(activeMedicine, 1);
    setMedicines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));

    // Registrar log
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

    setLastActionMessage(msg);
    Alert.alert('Registro Exitoso', msg);
  };

  // Acción: Posponer toma 15 minutos
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
    const msg = `Toma de ${activeMedicine.name} pospuesta 15 minutos. Le avisaremos nuevamente.`;
    setLastActionMessage(msg);
    Alert.alert('Dosis Pospuesta', msg);
  };

  // Acción: Reabastecer stock de un medicamento
  const handleRestockMedicine = (medId: string) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, stock: m.stock + 30 } : m))
    );
    Alert.alert('Botiquín Actualizado', 'Se agregaron 30 pastillas al inventario.');
  };

  // Acción: Eliminar medicamento del tratamiento
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
      Alert.alert('Campos incompletos', 'Por favor ingrese el nombre y la dosis.');
      return;
    }

    const newId = `med-${Date.now()}`;
    const newMed: Medicine = {
      id: newId,
      name: newMedName.trim(),
      doseDescription: newMedDose.trim(),
      intervalHours: 24,
      instructions: newMedInstructions.trim() || 'Tomar según prescripción médica.',
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

    // Reset y cerrar modal
    setNewMedName('');
    setNewMedDose('');
    setNewMedInstructions('');
    setIsModalVisible(false);
    Alert.alert('Medicamento Agregado', `${newMed.name} ha sido añadido al pastillero diario.`);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="light" />

      {/* Header Principal con selector de rol */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <MaterialCommunityIcons name="pill-multiple" size={28} color="#38BDF8" />
          <Text style={styles.appTitle}>AcompañaMed</Text>
        </View>
        <Text style={styles.appSubtitle}>
          Plataforma Multiplataforma de Adherencia Geriátrica • Lab 05
        </Text>

        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[styles.roleTab, activeRole === 'patient' && styles.roleTabActive]}
            onPress={() => setActiveRole('patient')}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="account-heart"
              size={20}
              color={activeRole === 'patient' ? '#FFFFFF' : '#94A3B8'}
            />
            <Text
              style={[
                styles.roleTabText,
                activeRole === 'patient' && styles.roleTabTextActive,
              ]}
            >
              Modo Senior
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, activeRole === 'caregiver' && styles.roleTabActive]}
            onPress={() => setActiveRole('caregiver')}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="shield-account"
              size={20}
              color={activeRole === 'caregiver' ? '#FFFFFF' : '#94A3B8'}
            />
            <Text
              style={[
                styles.roleTabText,
                activeRole === 'caregiver' && styles.roleTabTextActive,
              ]}
            >
              Modo Cuidador
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ========================================================= */}
        {/* MODO ADULTO MAYOR (ALTA ACCESIBILIDAD WCAG AAA)           */}
        {/* ========================================================= */}
        {activeRole === 'patient' && (
          <View style={styles.patientView}>
            {/* Banner de Estado Accesible con Voz */}
            <View style={styles.accessibilityBanner}>
              <MaterialCommunityIcons name="volume-high" size={26} color="#0284C7" />
              <Text style={styles.bannerText}>{lastActionMessage}</Text>
            </View>

            {/* Selector de Franjas del Día (Mañana, Tarde, Noche) */}
            <View style={styles.slotSelectorRow}>
              <TouchableOpacity
                style={[
                  styles.slotTab,
                  selectedSlot === 'morning' && styles.slotTabActive,
                ]}
                onPress={() => setSelectedSlot('morning')}
              >
                <Text style={styles.slotTabIcon}>☀️</Text>
                <Text
                  style={[
                    styles.slotTabText,
                    selectedSlot === 'morning' && styles.slotTabTextActive,
                  ]}
                >
                  Mañana
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.slotTab,
                  selectedSlot === 'afternoon' && styles.slotTabActive,
                ]}
                onPress={() => setSelectedSlot('afternoon')}
              >
                <Text style={styles.slotTabIcon}>🌤️</Text>
                <Text
                  style={[
                    styles.slotTabText,
                    selectedSlot === 'afternoon' && styles.slotTabTextActive,
                  ]}
                >
                  Tarde
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.slotTab,
                  selectedSlot === 'night' && styles.slotTabActive,
                ]}
                onPress={() => setSelectedSlot('night')}
              >
                <Text style={styles.slotTabIcon}>🌙</Text>
                <Text
                  style={[
                    styles.slotTabText,
                    selectedSlot === 'night' && styles.slotTabTextActive,
                  ]}
                >
                  Noche
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selector horizontal de pastillas en esta franja */}
            <View style={styles.pillListInSlot}>
              {slotDoses.length === 0 ? (
                <View style={styles.emptySlotCard}>
                  <Text style={styles.emptySlotText}>
                    No tiene medicamentos programados en la {selectedSlot === 'morning' ? 'mañana' : selectedSlot === 'afternoon' ? 'tarde' : 'noche'}.
                  </Text>
                </View>
              ) : (
                slotDoses.map((doseItem: ScheduledDoseItem) => {
                  const isSelected = doseItem.medicine.id === activeMedicine.id;
                  return (
                    <TouchableOpacity
                      key={doseItem.medicine.id}
                      style={[
                        styles.slotPillChip,
                        isSelected && styles.slotPillChipSelected,
                        doseItem.isTakenToday && styles.slotPillChipTaken,
                      ]}
                      onPress={() => setActiveDoseMedicineId(doseItem.medicine.id)}
                    >
                      <View
                        style={[
                          styles.chipPillCircle,
                          { backgroundColor: doseItem.medicine.visualPill.colorHex },
                        ]}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.chipPillName}>{doseItem.medicine.name}</Text>
                        <Text style={styles.chipPillTime}>
                          {doseItem.scheduledTime} • {doseItem.medicine.doseDescription}
                        </Text>
                      </View>
                      {doseItem.isTakenToday ? (
                        <MaterialCommunityIcons name="check-bold" size={20} color="#16A34A" />
                      ) : doseItem.isPastDue ? (
                        <MaterialCommunityIcons name="clock-alert" size={20} color="#DC2626" />
                      ) : (
                        <MaterialCommunityIcons name="clock-outline" size={18} color="#64748B" />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* Tarjeta de la Dosis Actual con Visual Pill ID */}
            {activeMedicine && (
              <View style={styles.seniorDoseCard}>
                <View style={styles.seniorDoseHeader}>
                  <Text style={styles.seniorDoseTag}>
                    DOSIS SELECCIONADA • {scheduleTimes[activeMedicine.id] || '08:00'}
                  </Text>
                </View>

                <View style={styles.pillVisualContainer}>
                  <View
                    style={[
                      styles.pillShape,
                      { backgroundColor: activeMedicine.visualPill.colorHex },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        activeMedicine.visualPill.shape === 'capsule'
                          ? 'pill'
                          : 'checkbox-blank-circle'
                      }
                      size={42}
                      color="#0F172A"
                    />
                  </View>
                  <View style={styles.pillMeta}>
                    <Text style={styles.medicineName}>{activeMedicine.name}</Text>
                    <Text style={styles.medicineDose}>{activeMedicine.doseDescription}</Text>
                    <Text style={styles.pillColorText}>
                      Forma: {activeMedicine.visualPill.shape === 'capsule' ? 'Cápsula' : activeMedicine.visualPill.shape === 'oval' ? 'Comprimido Ovalado' : 'Comprimido Redondo'} • Color: {activeMedicine.visualPill.colorName}
                    </Text>
                  </View>
                </View>

                <View style={styles.instructionBox}>
                  <MaterialCommunityIcons name="information" size={24} color="#0369A1" />
                  <Text style={styles.instructionText}>{activeMedicine.instructions}</Text>
                </View>

                {/* Botón de Audio para Lectura en Voz Alta */}
                <TouchableOpacity
                  style={styles.voiceButton}
                  onPress={() =>
                    Alert.alert(
                      'Lectura por Voz (Text-to-Speech)',
                      `"Don Manuel, le corresponde tomar ${activeMedicine.name} de ${activeMedicine.doseDescription}. ${activeMedicine.instructions}"`
                    )
                  }
                >
                  <MaterialCommunityIcons name="bullhorn" size={24} color="#0369A1" />
                  <Text style={styles.voiceButtonText}>Escuchar Instrucción en Voz Alta</Text>
                </TouchableOpacity>

                {/* Botones Gigantes de Acción */}
                {activeDoseItem?.isTakenToday ? (
                  <View style={styles.alreadyTakenNotice}>
                    <MaterialCommunityIcons name="check-decagram" size={28} color="#15803D" />
                    <Text style={styles.alreadyTakenNoticeText}>
                      Esta dosis ya fue confirmada el día de hoy. ¡Buen trabajo!
                    </Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.bigConfirmButton}
                      onPress={() => handleTakeDose('patient')}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="check-circle" size={32} color="#FFFFFF" />
                      <Text style={styles.bigConfirmText}>SÍ, YA LA TOMÉ</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.postponeButton}
                      onPress={handlePostpone}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="clock-outline" size={24} color="#0F172A" />
                      <Text style={styles.postponeText}>Posponer 15 Minutos</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* Botón SOS de Emergencia Familiar */}
            <TouchableOpacity
              style={styles.sosButton}
              onPress={() =>
                Alert.alert(
                  'Contacto de Emergencia SOS',
                  'Llamando a Hija / Cuidadora Principal: +51 954 123 456\nLínea médica SAMU: 106'
                )
              }
            >
              <MaterialCommunityIcons name="phone-alert" size={28} color="#FFFFFF" />
              <Text style={styles.sosText}>BOTÓN SOS: LLAMAR A FAMILIAR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================= */}
        {/* MODO CUIDADOR (GESTIÓN, INVENTARIO Y ESCALAMIENTO)        */}
        {/* ========================================================= */}
        {activeRole === 'caregiver' && (
          <View style={styles.caregiverView}>
            {/* Alerta de Escalamiento Remoto */}
            {escalation.shouldEscalate && (
              <View style={styles.escalationCard}>
                <View style={styles.escalationTitleRow}>
                  <MaterialCommunityIcons name="alert-octagon" size={28} color="#EF4444" />
                  <Text style={styles.escalationTitle}>Alerta de Escalamiento Activa</Text>
                </View>
                <Text style={styles.escalationBody}>{escalation.message}</Text>
                <View style={styles.escalationActions}>
                  <TouchableOpacity
                    style={styles.callPatientBtn}
                    onPress={() => Alert.alert('Llamada en curso', 'Marcando a Don Manuel...')}
                  >
                    <MaterialCommunityIcons name="phone" size={18} color="#FFFFFF" />
                    <Text style={styles.callPatientText}>Llamar a Don Manuel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.assistedTakeBtn}
                    onPress={() => handleTakeDose('caregiver')}
                  >
                    <MaterialCommunityIcons name="hand-heart" size={18} color="#0F172A" />
                    <Text style={styles.assistedTakeText}>Registrar Toma Asistida</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Botón para Abrir Modal de Nuevo Medicamento */}
            <TouchableOpacity
              style={styles.addMedButton}
              onPress={() => setIsModalVisible(true)}
            >
              <MaterialCommunityIcons name="plus-circle" size={24} color="#FFFFFF" />
              <Text style={styles.addMedButtonText}>+ Agregar Nuevo Medicamento al Pastillero</Text>
            </TouchableOpacity>

            {/* Catálogo de Medicamentos en Tratamiento */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="pill" size={24} color="#0284C7" />
                <Text style={styles.cardTitle}>
                  Catálogo de Medicamentos ({medicines.length} activos)
                </Text>
              </View>

              {medicines.map((med) => {
                const isLow = isStockLow(med);
                const daysLeft = daysRemaining(med.stock, 1);
                return (
                  <View key={med.id} style={styles.medCatalogItem}>
                    <View style={styles.medCatalogTop}>
                      <View
                        style={[
                          styles.medCatalogColorDot,
                          { backgroundColor: med.visualPill.colorHex },
                        ]}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.medCatalogName}>{med.name}</Text>
                        <Text style={styles.medCatalogDose}>
                          {med.doseDescription} • Horario: {scheduleTimes[med.id] || '08:00'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteMedicine(med.id, med.name)}
                        style={styles.deleteMedBtn}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#DC2626" />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.medCatalogInstruction}>{med.instructions}</Text>

                    <View style={styles.medStockRow}>
                      <Text style={[styles.medStockText, isLow && styles.medStockTextLow]}>
                        Stock: {med.stock} pastillas ({daysLeft} días)
                        {isLow ? ' ⚠️ Reponer pronto' : ''}
                      </Text>
                      <TouchableOpacity
                        style={styles.restockSmallBtn}
                        onPress={() => handleRestockMedicine(med.id)}
                      >
                        <MaterialCommunityIcons name="plus" size={16} color="#0284C7" />
                        <Text style={styles.restockSmallBtnText}>+30</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Métrica de Adherencia para el Médico */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="chart-box-outline" size={24} color="#0284C7" />
                <Text style={styles.cardTitle}>Reporte de Adherencia Terapéutica</Text>
              </View>
              <View style={styles.adherenceStatsRow}>
                <View style={styles.adherenceCircle}>
                  <Text style={styles.adherencePercentage}>
                    {adherence.adherencePercentage}%
                  </Text>
                  <Text style={styles.adherenceLabel}>Cumplimiento</Text>
                </View>
                <View style={styles.adherenceDetails}>
                  <Text style={styles.adherenceDetailItem}>• Dosis tomadas: {adherence.totalTaken}</Text>
                  <Text style={styles.adherenceDetailItem}>• Pospuestas: {adherence.totalPostponed}</Text>
                  <Text style={styles.adherenceDetailItem}>• Omitidas: {adherence.totalMissed}</Text>
                  <Text
                    style={[
                      styles.statusBadge,
                      adherence.statusRating === 'excellent' && styles.statusBadgeGreen,
                      adherence.statusRating === 'warning' && styles.statusBadgeYellow,
                      adherence.statusRating === 'critical' && styles.statusBadgeRed,
                    ]}
                  >
                    Evaluación: {adherence.statusRating.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Historial de Registro de Tomas */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="history" size={24} color="#0284C7" />
                <Text style={styles.cardTitle}>Bitácora de Eventos Recientes</Text>
              </View>
              {logs.slice(0, 5).map((log) => {
                const med = medicines.find((m) => m.id === log.medicineId);
                return (
                  <View key={log.id} style={styles.logItem}>
                    <MaterialCommunityIcons
                      name={
                        log.status === 'taken'
                          ? 'check-circle'
                          : log.status === 'postponed'
                          ? 'clock-alert'
                          : 'close-circle'
                      }
                      size={20}
                      color={
                        log.status === 'taken'
                          ? '#16A34A'
                          : log.status === 'postponed'
                          ? '#CA8A04'
                          : '#DC2626'
                      }
                    />
                    <View style={styles.logInfo}>
                      <Text style={styles.logStatus}>
                        {med?.name || 'Medicamento'}: {log.status === 'taken' ? 'Tomada' : log.status === 'postponed' ? 'Pospuesta' : 'Omitida'}
                      </Text>
                      <Text style={styles.logTime}>
                        Por: {log.registeredBy === 'patient' ? 'Don Manuel' : 'Cuidador'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ========================================================= */}
      {/* MODAL: REGISTRAR NUEVO MEDICAMENTO (MODO CUIDADOR)        */}
      {/* ========================================================= */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Medicamento</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Nombre del Medicamento</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej. Enalapril, Glibenclamida"
                placeholderTextColor="#94A3B8"
                value={newMedName}
                onChangeText={setNewMedName}
              />

              <Text style={styles.inputLabel}>Dosis Prescrita</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej. 10 mg, 1 tableta, 5 gotas"
                placeholderTextColor="#94A3B8"
                value={newMedDose}
                onChangeText={setNewMedDose}
              />

              <Text style={styles.inputLabel}>Horario Diario (HH:MM)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="08:00"
                placeholderTextColor="#94A3B8"
                value={newMedTime}
                onChangeText={setNewMedTime}
              />

              <Text style={styles.inputLabel}>Instrucciones de Toma</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej. Tomar después del desayuno con agua"
                placeholderTextColor="#94A3B8"
                value={newMedInstructions}
                onChangeText={setNewMedInstructions}
              />

              {/* Selector Visual Pill ID: Forma */}
              <Text style={styles.inputLabel}>Forma de la Pastilla</Text>
              <View style={styles.pillShapeOptions}>
                {(['round', 'capsule', 'oval'] as PillShape[]).map((shape) => (
                  <TouchableOpacity
                    key={shape}
                    style={[
                      styles.shapeOptionBtn,
                      newMedShape === shape && styles.shapeOptionBtnActive,
                    ]}
                    onPress={() => setNewMedShape(shape)}
                  >
                    <MaterialCommunityIcons
                      name={
                        shape === 'capsule'
                          ? 'pill'
                          : shape === 'oval'
                          ? 'circle-outline'
                          : 'checkbox-blank-circle'
                      }
                      size={22}
                      color={newMedShape === shape ? '#0284C7' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.shapeOptionText,
                        newMedShape === shape && styles.shapeOptionTextActive,
                      ]}
                    >
                      {shape === 'round' ? 'Redonda' : shape === 'capsule' ? 'Cápsula' : 'Ovalada'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Selector Visual Pill ID: Color */}
              <Text style={styles.inputLabel}>Color Distintivo</Text>
              <View style={styles.colorPaletteRow}>
                {COLOR_PALETTE.map((c) => (
                  <TouchableOpacity
                    key={c.hex}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: c.hex },
                      newMedColor.hex === c.hex && styles.colorCircleSelected,
                    ]}
                    onPress={() => setNewMedColor(c)}
                  />
                ))}
              </View>
              <Text style={styles.selectedColorLabel}>Seleccionado: {newMedColor.name}</Text>

              {/* Stock Inicial y Alerta */}
              <View style={styles.rowTwoInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Stock Inicial</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={newMedStock}
                    onChangeText={setNewMedStock}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.inputLabel}>Alerta si quedan</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={newMedMinAlert}
                    onChangeText={setNewMedMinAlert}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveMedSubmitBtn}
                onPress={handleSaveNewMedicine}
              >
                <Text style={styles.saveMedSubmitText}>Guardar en el Pastillero</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 12,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    gap: 6,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  roleTabActive: {
    backgroundColor: '#0284C7',
  },
  roleTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  roleTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    backgroundColor: '#F1F5F9',
  },
  patientView: {
    gap: 16,
  },
  accessibilityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  bannerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0369A1',
    lineHeight: 20,
  },
  slotSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  slotTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  slotTabActive: {
    borderColor: '#0284C7',
    backgroundColor: '#E0F2FE',
  },
  slotTabIcon: {
    fontSize: 18,
  },
  slotTabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  slotTabTextActive: {
    color: '#0369A1',
  },
  pillListInSlot: {
    gap: 8,
  },
  emptySlotCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptySlotText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  slotPillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  slotPillChipSelected: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  slotPillChipTaken: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  chipPillCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#94A3B8',
  },
  chipPillName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  chipPillTime: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  seniorDoseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  seniorDoseHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  seniorDoseTag: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 1,
  },
  pillVisualContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  pillShape: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0284C7',
  },
  pillMeta: {
    flex: 1,
  },
  medicineName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  medicineDose: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 2,
  },
  pillColorText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 14,
    borderRadius: 10,
    gap: 10,
    marginBottom: 16,
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0C4A6E',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 16,
  },
  voiceButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0369A1',
  },
  alreadyTakenNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  alreadyTakenNoticeText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#15803D',
  },
  bigConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 18,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#16A34A',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bigConfirmText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  postponeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  postponeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 18,
    borderRadius: 14,
    gap: 10,
  },
  sosText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  caregiverView: {
    gap: 16,
  },
  escalationCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
  },
  escalationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  escalationTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#991B1B',
  },
  escalationBody: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 20,
    marginBottom: 14,
  },
  escalationActions: {
    flexDirection: 'row',
    gap: 10,
  },
  callPatientBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  callPatientText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  assistedTakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  assistedTakeText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '700',
  },
  addMedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addMedButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  medCatalogItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  medCatalogTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  medCatalogColorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
  },
  medCatalogName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  medCatalogDose: {
    fontSize: 13,
    color: '#0284C7',
    marginTop: 2,
    fontWeight: '600',
  },
  deleteMedBtn: {
    padding: 6,
  },
  medCatalogInstruction: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
  },
  medStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  medStockText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  medStockTextLow: {
    color: '#DC2626',
    fontWeight: '700',
  },
  restockSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 2,
  },
  restockSmallBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  adherenceStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  adherenceCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F0F9FF',
    borderWidth: 4,
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adherencePercentage: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0284C7',
  },
  adherenceLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  adherenceDetails: {
    flex: 1,
    gap: 4,
  },
  adherenceDetailItem: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  statusBadge: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '800',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeGreen: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  statusBadgeYellow: {
    backgroundColor: '#FEF9C3',
    color: '#A16207',
  },
  statusBadgeRed: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logInfo: {
    flex: 1,
  },
  logStatus: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  logTime: {
    fontSize: 12,
    color: '#64748B',
  },
  // Estilos del Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalScroll: {
    padding: 16,
    gap: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
  },
  pillShapeOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  shapeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  shapeOptionBtnActive: {
    borderColor: '#0284C7',
    backgroundColor: '#E0F2FE',
  },
  shapeOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  shapeOptionTextActive: {
    color: '#0369A1',
    fontWeight: '700',
  },
  colorPaletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  colorCircleSelected: {
    borderColor: '#0284C7',
    borderWidth: 3,
  },
  selectedColorLabel: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  rowTwoInputs: {
    flexDirection: 'row',
  },
  saveMedSubmitBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  saveMedSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
