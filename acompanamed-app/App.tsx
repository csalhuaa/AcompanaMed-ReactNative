import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Medicine,
  DoseLog,
  ActorRole,
  canRegisterDose,
  decrementStock,
  isStockLow,
  daysRemaining,
  calculateAdherence,
  evaluateEscalation,
} from './src/domain';

const INITIAL_MEDICINE: Medicine = {
  id: 'med-losartan',
  name: 'Losartán Potásico',
  doseDescription: '50 mg',
  intervalHours: 12,
  instructions: 'Tomar con medio vaso de agua después del desayuno.',
  visualPill: {
    shape: 'round',
    colorHex: '#38BDF8',
    colorName: 'Azul Celeste',
  },
  stock: 14,
  minStockAlert: 6,
  createdAt: '2026-10-29T08:00:00.000Z',
};

const INITIAL_LOGS: DoseLog[] = [
  {
    id: 'log-0',
    medicineId: 'med-losartan',
    scheduledTime: '2026-10-28T20:00:00.000Z',
    takenTime: '2026-10-28T20:05:00.000Z',
    status: 'taken',
    registeredBy: 'patient',
  },
];

export default function App() {
  const [activeRole, setActiveRole] = useState<ActorRole>('patient');
  const [medicine, setMedicine] = useState<Medicine>(INITIAL_MEDICINE);
  const [logs, setLogs] = useState<DoseLog[]>(INITIAL_LOGS);
  const [lastActionMessage, setLastActionMessage] = useState<string>(
    'Bienvenido a AcompañaMed. Presione los botones grandes para registrar su toma.'
  );

  const adherence = calculateAdherence(logs);
  const stockIsLow = isStockLow(medicine);
  const daysLeft = daysRemaining(medicine.stock, 2);

  // Escalamiento simulado (40 minutos transcurridos desde las 08:00 AM)
  const simulatedScheduledTime = new Date('2026-10-29T08:00:00.000Z');
  const simulatedNowTime = new Date('2026-10-29T08:40:00.000Z');
  const escalation = evaluateEscalation(simulatedScheduledTime, simulatedNowTime, 30);

  // Acción: Confirmar toma
  const handleTakeDose = (actor: ActorRole) => {
    const check = canRegisterDose(medicine.id, logs, new Date());
    if (!check.allowed) {
      Alert.alert('Protección de Seguridad Médica', check.reason);
      setLastActionMessage(check.reason || 'Dosis ya registrada previamente.');
      return;
    }

    const updatedMedicine = decrementStock(medicine, 1);
    setMedicine(updatedMedicine);

    const newLog: DoseLog = {
      id: `log-${Date.now()}`,
      medicineId: medicine.id,
      scheduledTime: new Date().toISOString(),
      takenTime: new Date().toISOString(),
      status: 'taken',
      registeredBy: actor,
    };
    setLogs((prev) => [newLog, ...prev]);

    const msg =
      actor === 'patient'
        ? `¡Muy bien, Don Manuel! Dosis de ${medicine.name} registrada con éxito. Quedan ${updatedMedicine.stock} pastillas.`
        : `Toma presencial asistida registrada por el cuidador. Stock actualizado: ${updatedMedicine.stock}.`;

    setLastActionMessage(msg);
    Alert.alert('Registro Exitoso', msg);
  };

  // Acción: Posponer toma 15 minutos
  const handlePostpone = () => {
    const newLog: DoseLog = {
      id: `log-${Date.now()}`,
      medicineId: medicine.id,
      scheduledTime: new Date().toISOString(),
      status: 'postponed',
      registeredBy: 'patient',
      notes: 'Pospuesto 15 minutos por el paciente',
    };
    setLogs((prev) => [newLog, ...prev]);
    const msg = 'Dosis pospuesta 15 minutos. Le volveremos a avisar con voz cálida.';
    setLastActionMessage(msg);
    Alert.alert('Dosis Pospuesta', msg);
  };

  // Acción: Reabastecer stock (Cuidador)
  const handleRestock = () => {
    setMedicine((prev) => ({ ...prev, stock: prev.stock + 30 }));
    Alert.alert('Botiquín Actualizado', 'Se han agregado 30 pastillas al inventario.');
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="light" />

      {/* Header Principal con conmutador de rol */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <MaterialCommunityIcons name="pill-multiple" size={28} color="#38BDF8" />
          <Text style={styles.appTitle}>AcompañaMed</Text>
        </View>
        <Text style={styles.appSubtitle}>
          Plataforma Multiplataforma de Adherencia Geriátrica
        </Text>

        {/* Selector de Rol Dual */}
        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[styles.roleTab, activeRole === 'patient' && styles.roleTabActive]}
            onPress={() => setActiveRole('patient')}
            accessibilityRole="button"
            accessibilityLabel="Activar Modo Adulto Mayor"
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
            accessibilityLabel="Activar Modo Cuidador"
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
            {/* Banner de Estado Accesible */}
            <View style={styles.accessibilityBanner}>
              <MaterialCommunityIcons name="volume-high" size={26} color="#0284C7" />
              <Text style={styles.bannerText}>
                {lastActionMessage}
              </Text>
            </View>

            {/* Tarjeta de la Dosis Actual con Visual Pill ID */}
            <View style={styles.seniorDoseCard}>
              <View style={styles.seniorDoseHeader}>
                <Text style={styles.seniorDoseTag}>DOSIS PROGRAMADA • 08:00 AM</Text>
              </View>

              <View style={styles.pillVisualContainer}>
                <View
                  style={[
                    styles.pillShape,
                    { backgroundColor: medicine.visualPill.colorHex },
                  ]}
                >
                  <MaterialCommunityIcons name="pill" size={42} color="#0F172A" />
                </View>
                <View style={styles.pillMeta}>
                  <Text style={styles.medicineName}>{medicine.name}</Text>
                  <Text style={styles.medicineDose}>{medicine.doseDescription}</Text>
                  <Text style={styles.pillColorText}>
                    Forma: Pastilla redonda • Color: {medicine.visualPill.colorName}
                  </Text>
                </View>
              </View>

              <View style={styles.instructionBox}>
                <MaterialCommunityIcons name="information" size={24} color="#0369A1" />
                <Text style={styles.instructionText}>{medicine.instructions}</Text>
              </View>

              {/* Botón de Audio para Lectura en Voz Alta */}
              <TouchableOpacity
                style={styles.voiceButton}
                onPress={() =>
                  Alert.alert(
                    'Lectura por Voz (Text-to-Speech)',
                    `"Don Manuel, le corresponde tomar ${medicine.name} de ${medicine.doseDescription}. ${medicine.instructions}"`
                  )
                }
              >
                <MaterialCommunityIcons name="bullhorn" size={24} color="#0369A1" />
                <Text style={styles.voiceButtonText}>Escuchar Instrucción en Voz Alta</Text>
              </TouchableOpacity>

              {/* Botones Gigantes de Acción */}
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
            </View>

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
                    onPress={() =>
                      Alert.alert('Llamada en progreso', 'Marcando a Don Manuel...')
                    }
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
                  <Text style={styles.adherenceDetailItem}>
                    • Dosis tomadas: {adherence.totalTaken}
                  </Text>
                  <Text style={styles.adherenceDetailItem}>
                    • Pospuestas: {adherence.totalPostponed}
                  </Text>
                  <Text style={styles.adherenceDetailItem}>
                    • Omitidas: {adherence.totalMissed}
                  </Text>
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

            {/* Control de Botiquín e Inventario */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="medical-bag" size={24} color="#0284C7" />
                <Text style={styles.cardTitle}>Inventario & Stock del Botiquín</Text>
              </View>

              <View style={styles.stockInfoRow}>
                <View>
                  <Text style={styles.medicineNameCaregiver}>{medicine.name}</Text>
                  <Text style={styles.stockCountText}>
                    Existencias: {medicine.stock} pastillas ({daysLeft} días restantes)
                  </Text>
                </View>
                <TouchableOpacity style={styles.restockButton} onPress={handleRestock}>
                  <MaterialCommunityIcons name="plus-box" size={20} color="#FFFFFF" />
                  <Text style={styles.restockButtonText}>+30 Pastillas</Text>
                </TouchableOpacity>
              </View>

              {stockIsLow && (
                <View style={styles.lowStockWarning}>
                  <MaterialCommunityIcons name="alert" size={20} color="#B45309" />
                  <Text style={styles.lowStockWarningText}>
                    Alerta de reposición: Quedan menos de {medicine.minStockAlert} unidades.
                    Comprar nueva caja pronto.
                  </Text>
                </View>
              )}
            </View>

            {/* Historial de Registro de Tomas */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="history" size={24} color="#0284C7" />
                <Text style={styles.cardTitle}>Bitácora de Eventos Recientes</Text>
              </View>
              {logs.map((log) => (
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
                      {log.status === 'taken'
                        ? 'Dosis Tomada'
                        : log.status === 'postponed'
                        ? 'Dosis Pospuesta'
                        : 'Dosis Omitida'}
                    </Text>
                    <Text style={styles.logTime}>
                      Registrado por: {log.registeredBy === 'patient' ? 'Paciente' : 'Cuidador'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
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
  stockInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medicineNameCaregiver: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  stockCountText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  restockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  restockButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  lowStockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  lowStockWarningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
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
});
