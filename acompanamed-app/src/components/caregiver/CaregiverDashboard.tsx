import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EscalationResult, AdherenceSummary, ClinicalSummaryReport } from '../../domain';

interface Props {
  escalation: EscalationResult;
  adherence: AdherenceSummary;
  clinicalReport: ClinicalSummaryReport;
  onOpenReport: () => void;
}

export const CaregiverDashboard: React.FC<Props> = ({
  escalation,
  adherence,
  clinicalReport,
  onOpenReport,
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
                ? 'Alerta de Escalamiento Clínico'
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

      {/* 2. Dashboard Cuantitativo de Adherencia Terapéutica */}
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

      {/* 3. Desglose Individual por Principio Activo */}
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
