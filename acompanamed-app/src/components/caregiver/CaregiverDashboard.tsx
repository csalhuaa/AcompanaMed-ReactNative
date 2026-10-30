import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EscalationResult, AdherenceSummary, ClinicalSummaryReport } from '../../domain';

interface Props {
  escalation: EscalationResult;
  adherence: AdherenceSummary;
  clinicalReport: ClinicalSummaryReport;
  onOpenReport: () => void;
  onSimulateEscalationAlert: () => void;
  onOpenFamilyPairing?: () => void;
  onTestNotification?: () => void;
}

export const CaregiverDashboard: React.FC<Props> = ({
  escalation,
  adherence,
  clinicalReport,
  onOpenReport,
  onSimulateEscalationAlert,
  onOpenFamilyPairing,
  onTestNotification,
}) => {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Monitor de Escalamiento / Período de Gracia (30 min) */}
      <View
        style={[
          styles.panelCard,
          escalation.shouldEscalate && styles.panelCardAlert,
        ]}
      >
        <View style={styles.panelCardHeader}>
          <MaterialCommunityIcons
            name={escalation.shouldEscalate ? 'alert-circle' : 'shield-check-outline'}
            size={24}
            color={escalation.shouldEscalate ? '#DC2626' : '#059669'}
          />
          <View style={styles.headerTextGroup}>
            <Text style={styles.panelCardTitle}>
              {escalation.shouldEscalate
                ? 'Alerta de Escalamiento Clínico Activa'
                : 'Supervisión en Tiempo Real'}
            </Text>
            <Text style={styles.panelCardBody}>{escalation.message}</Text>
          </View>
        </View>

        <View style={styles.escalationMetricBar}>
          <Text style={styles.metricBarText}>Tolerancia máxima de gracia: 30 minutos</Text>
          <Text style={styles.metricBarText}>Monitoreo continuo activo</Text>
        </View>
      </View>

      {/* 2. Canal de Notificaciones y Enlace Telemétrico */}
      <View style={styles.panelCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialCommunityIcons name="cellphone-wireless" size={20} color="#0F172A" />
          <Text style={styles.panelCardTitle}>Canal de Alertas del Cuidador</Text>
        </View>

        <View style={styles.caregiverContactCard}>
          <View style={styles.caregiverAvatar}>
            <MaterialCommunityIcons name="account-heart" size={24} color="#0284C7" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.caregiverNameText}>María Alhua (Hija / Cuidadora Principal)</Text>
            <Text style={styles.caregiverPhoneText}>WhatsApp / Teléfono: +51 954 123 456</Text>
            <Text style={styles.syncStatusText}>Estado: Sincronización telemétrica activa</Text>
          </View>
        </View>

        <View style={styles.protocolList}>
          <View style={styles.protocolStepRow}>
            <View style={styles.stepBullet}><Text style={styles.stepBulletText}>1</Text></View>
            <Text style={styles.protocolStepText}>
              <Text style={{ fontWeight: '700' }}>Minuto 0:</Text> Alarma sonora + Lectura por voz en el velador de Don Manuel.
            </Text>
          </View>
          <View style={styles.protocolStepRow}>
            <View style={styles.stepBullet}><Text style={styles.stepBulletText}>2</Text></View>
            <Text style={styles.protocolStepText}>
              <Text style={{ fontWeight: '700' }}>Minutos 1 a 30:</Text> Ventana de gracia respetuosa (sin molestar al cuidador).
            </Text>
          </View>
          <View style={styles.protocolStepRow}>
            <View style={[styles.stepBullet, { backgroundColor: '#DC2626' }]}>
              <Text style={styles.stepBulletText}>3</Text>
            </View>
            <Text style={styles.protocolStepText}>
              <Text style={{ fontWeight: '700', color: '#991B1B' }}>Minuto 30:</Text> Push Notification y Alerta WhatsApp directa a María.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.btnSimulateAlert}
          onPress={onSimulateEscalationAlert}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Simular envío de alerta de escalamiento a WhatsApp"
        >
          <MaterialCommunityIcons name="whatsapp" size={18} color="#FFFFFF" />
          <Text style={styles.btnSimulateAlertText}>
            Simular Disparo de Alerta a WhatsApp del Cuidador
          </Text>
        </TouchableOpacity>

        <View style={styles.caregiverSecondaryActionsRow}>
          {onOpenFamilyPairing && (
            <TouchableOpacity
              style={styles.btnPairingAction}
              onPress={onOpenFamilyPairing}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Ver código de enlace familiar"
            >
              <MaterialCommunityIcons name="cellphone-link" size={16} color="#0284C7" />
              <Text style={styles.btnPairingActionText}>Código de Enlace</Text>
            </TouchableOpacity>
          )}

          {onTestNotification && (
            <TouchableOpacity
              style={styles.btnTestNotifAction}
              onPress={onTestNotification}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Probar notificación local"
            >
              <MaterialCommunityIcons name="bell-ring-outline" size={16} color="#059669" />
              <Text style={styles.btnTestNotifActionText}>Probar Notificación</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 3. Dashboard Cuantitativo de Adherencia */}
      <View style={styles.panelCard}>
        <Text style={styles.panelCardTitle}>Tasa de Adherencia Terapéutica</Text>

        <View style={styles.adherenceScoreContainer}>
          <View style={styles.adherenceBigNumberBadge}>
            <Text style={styles.adherenceBigNumberText}>
              {adherence.adherencePercentage}%
            </Text>
            <View style={styles.adherenceRatingChip}>
              <Text style={styles.adherenceRatingChipText}>
                {adherence.statusRating === 'excellent'
                  ? 'Excelente'
                  : adherence.statusRating === 'good'
                  ? 'Buena'
                  : 'En Riesgo'}
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
              <Text style={[styles.breakdownValue, { color: '#059669' }]}>
                {adherence.totalTaken}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Pospuestas</Text>
              <Text style={[styles.breakdownValue, { color: '#D97706' }]}>
                {adherence.totalPostponed}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.openReportCTAButton}
          onPress={onOpenReport}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Generar informe completo de adherencia para la consulta médica"
          accessibilityHint="Abre la ventana con el informe médico estructurado y opción de exportación"
        >
          <MaterialCommunityIcons name="file-document-outline" size={18} color="#0F172A" />
          <Text style={styles.openReportCTAButtonText}>
            Generar Informe Completo para la Consulta Médica
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Desglose Individual por Principio Activo */}
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
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${item.adherenceRate}%`,
                      backgroundColor:
                        item.adherenceRate >= 80 ? '#059669' : '#D97706',
                    },
                  ]}
                />
              </View>
              <Text style={styles.medBreakdownPercent}>{item.adherenceRate}%</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 84,
    gap: 14,
  },
  panelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  headerTextGroup: {
    flex: 1,
    marginLeft: 12,
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
  caregiverContactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  caregiverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caregiverNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  caregiverPhoneText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 1,
  },
  syncStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  protocolList: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  protocolStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBulletText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  protocolStepText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  btnSimulateAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    minHeight: 46,
    borderRadius: 6,
    gap: 8,
    marginTop: 2,
  },
  btnSimulateAlertText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  caregiverSecondaryActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  btnPairingAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  btnPairingActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  btnTestNotifAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  btnTestNotifActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
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
    fontVariant: ['tabular-nums'],
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
    color: '#334155',
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  openReportCTAButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    minHeight: 48,
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
    color: '#334155',
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
  },
  medBreakdownPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    width: 36,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
