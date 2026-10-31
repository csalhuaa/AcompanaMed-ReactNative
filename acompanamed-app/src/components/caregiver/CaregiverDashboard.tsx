import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EscalationResult, AdherenceSummary, ClinicalSummaryReport, EmergencyContact } from '../../domain';

interface Props {
  escalation: EscalationResult;
  adherence: AdherenceSummary;
  clinicalReport: ClinicalSummaryReport;
  onOpenReport: () => void;
  onSimulateEscalationAlert?: () => void;
  onSendEscalationAlert?: () => void;
  onCallCaregiver?: () => void;
  onOpenFamilyPairing?: () => void;
  onTestNotification?: () => void;
  contact?: EmergencyContact;
}

export const CaregiverDashboard: React.FC<Props> = ({
  escalation,
  adherence,
  clinicalReport,
  onOpenReport,
  onSimulateEscalationAlert,
  onSendEscalationAlert,
  onCallCaregiver,
  onOpenFamilyPairing,
  contact,
}) => {
  const onSendAlert = onSendEscalationAlert || onSimulateEscalationAlert;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Monitor de Supervisión en Tiempo Real y Red de Apoyo */}
      <View
        style={[
          styles.panelCard,
          escalation.shouldEscalate && styles.panelCardAlert,
        ]}
      >
        <View style={styles.panelCardHeader}>
          <MaterialCommunityIcons
            name={escalation.shouldEscalate ? 'alert-circle' : 'shield-check-outline'}
            size={26}
            color={escalation.shouldEscalate ? '#DC2626' : '#059669'}
          />
          <View style={styles.headerTextGroup}>
            <Text style={styles.panelCardTitle}>
              {escalation.shouldEscalate
                ? 'Alerta de Dosis Atrasada (> 30 min)'
                : 'Supervisión en Tiempo Real'}
            </Text>
            <Text style={styles.panelCardBody}>{escalation.message}</Text>
          </View>
        </View>

        {/* Indicador de tolerancia de gracia */}
        <View style={styles.escalationMetricBar}>
          <MaterialCommunityIcons name="clock-outline" size={15} color="#475569" />
          <Text style={styles.metricBarText}>
            Margen de tolerancia: 30 minutos de gracia antes de activar alerta de escalamiento.
          </Text>
        </View>

        {/* Ficha del contacto de apoyo */}
        <View style={styles.caregiverContactCard}>
          <View style={styles.caregiverAvatar}>
            <MaterialCommunityIcons name="account-heart" size={24} color="#0284C7" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.caregiverNameText}>
              {contact?.name || 'Contacto de apoyo no configurado'}
            </Text>
            <Text style={styles.caregiverPhoneText}>
              {contact?.phone || 'Agregue un teléfono en Ajustes y Perfil'}
            </Text>
          </View>
        </View>

        {/* Acciones de contacto directo (WhatsApp y Llamada) */}
        <View style={styles.actionButtonsRow}>
          {onSendAlert && (
            <TouchableOpacity
              style={[
                styles.btnAlertWhatsApp,
                (!contact?.phone || !escalation.shouldEscalate) && styles.btnDisabled,
              ]}
              onPress={onSendAlert}
              disabled={!contact?.phone || !escalation.shouldEscalate}
              accessibilityState={{ disabled: !contact?.phone || !escalation.shouldEscalate }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Enviar aviso por WhatsApp sobre la dosis pendiente"
            >
              <MaterialCommunityIcons name="whatsapp" size={18} color="#FFFFFF" />
              <Text style={styles.btnAlertWhatsAppText}>
                {escalation.shouldEscalate ? 'Avisar por WhatsApp' : 'WhatsApp al Paciente'}
              </Text>
            </TouchableOpacity>
          )}

          {onCallCaregiver && (
            <TouchableOpacity
              style={[
                styles.btnCallCaregiver,
                !contact?.phone && styles.btnDisabled,
              ]}
              onPress={onCallCaregiver}
              disabled={!contact?.phone}
              accessibilityState={{ disabled: !contact?.phone }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Llamar al teléfono de contacto"
            >
              <MaterialCommunityIcons name="phone" size={18} color="#FFFFFF" />
              <Text style={styles.btnCallCaregiverText}>Llamar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Acceso directo a vinculación familiar */}
        {onOpenFamilyPairing && (
          <TouchableOpacity
            style={styles.btnPairingAction}
            onPress={onOpenFamilyPairing}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Ver código de enlace familiar"
          >
            <MaterialCommunityIcons name="cellphone-link" size={16} color="#0284C7" />
            <Text style={styles.btnPairingActionText}>Código de Enlace Familiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Dashboard Cuantitativo de Adherencia */}
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
                  : adherence.statusRating === 'warning'
                  ? 'En Riesgo'
                  : 'Crítica'}
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

      {/* 3. Desglose Individual por Principio Activo */}
      <View style={styles.panelCard}>
        <Text style={styles.panelCardTitle}>Desglose Individual por Principio Activo</Text>
        {clinicalReport.medicationBreakdown.length === 0 ? (
          <Text style={styles.emptyBreakdownText}>
            No hay medicamentos registrados en el plan de hoy.
          </Text>
        ) : (
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
        )}
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
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricBarText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
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
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnAlertWhatsApp: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    minHeight: 46,
    borderRadius: 6,
    gap: 8,
  },
  btnAlertWhatsAppText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnCallCaregiver: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    minHeight: 46,
    borderRadius: 6,
    gap: 6,
  },
  btnCallCaregiverText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnPairingAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 10,
    minHeight: 42,
    borderRadius: 6,
    gap: 6,
  },
  btnPairingActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
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
  emptyBreakdownText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
    paddingVertical: 8,
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
