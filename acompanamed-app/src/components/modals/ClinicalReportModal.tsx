import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Clipboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ClinicalSummaryReport, EmergencyProfile } from '../../domain';
import { showNotice } from '../../data/initialData';

interface Props {
  visible: boolean;
  reportText: string;
  clinicalReport?: ClinicalSummaryReport;
  emergencyProfile?: EmergencyProfile;
  onClose: () => void;
  onExport: () => void;
}

export const ClinicalReportModal: React.FC<Props> = ({
  visible,
  reportText,
  clinicalReport,
  emergencyProfile,
  onClose,
  onExport,
}) => {
  const [showRawText, setShowRawText] = useState(false);

  const overallRate = clinicalReport?.overallAdherencePercentage ?? 100;
  const isOptimal = overallRate >= 85;
  const isRegular = overallRate >= 70 && overallRate < 85;

  const handleCopyReport = () => {
    try {
      const textToCopy = reportText || clinicalReport?.formattedReportText || '';
      Clipboard.setString(textToCopy);
      showNotice(
        'Informe Copiado',
        'El reporte clínico estructurado fue copiado al portapapeles para su uso en historias clínicas o mensajería.'
      );
    } catch {
      showNotice('Aviso', 'No se pudo copiar automáticamente al portapapeles.');
    }
  };

  const patientName =
    clinicalReport?.patientName ||
    emergencyProfile?.patientFullName ||
    'Manuel Jesús Alhua';

  const patientAge =
    clinicalReport?.patientAge ||
    emergencyProfile?.age ||
    74;

  const warnings = clinicalReport?.clinicalWarnings || [];
  const breakdowns = clinicalReport?.medicationBreakdown || [];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdropScrim}>
        <View style={styles.modalSheetBox}>
          {/* Cabecera Médica */}
          <View style={styles.modalSheetTop}>
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons
                  name="file-document-check-outline"
                  size={22}
                  color="#0284C7"
                />
              </View>
              <View>
                <Text style={styles.modalSheetTitle}>Informe Clínico de Adherencia</Text>
                <Text style={styles.modalSheetSubtitle}>
                  Resumen ejecutivo para el médico geriatra y la familia
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Cerrar informe clínico"
            >
              <MaterialCommunityIcons name="close" size={20} color="#334155" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Tarjeta de Filiación y Datos Clínicos */}
            <View style={styles.patientSummaryCard}>
              <View style={styles.patientRow}>
                <MaterialCommunityIcons name="account-circle" size={32} color="#0284C7" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.patientNameText}>{patientName}</Text>
                  <Text style={styles.patientMetaText}>
                    {patientAge} años · Grupo {emergencyProfile?.bloodType || 'O+'} · {emergencyProfile?.healthInsurance || 'EsSalud'}
                  </Text>
                </View>
              </View>

              {Boolean(emergencyProfile?.chronicConditions?.length) && (
                <View style={styles.chronicBadgeContainer}>
                  <Text style={styles.chronicLabel}>Patologías:</Text>
                  <Text style={styles.chronicValue}>
                    {emergencyProfile?.chronicConditions.join(', ')}
                  </Text>
                </View>
              )}
            </View>

            {/* 2. Scorecard de Adherencia General */}
            <View style={styles.scorecardBox}>
              <View style={styles.scorecardLeft}>
                <Text style={styles.scoreNumberText}>{overallRate}%</Text>
                <Text style={styles.scoreLabelText}>Adherencia Terapéutica Global</Text>
              </View>
              <View style={styles.scorecardRight}>
                <View
                  style={[
                    styles.adherenceChip,
                    isOptimal
                      ? styles.adherenceChipOptimal
                      : isRegular
                      ? styles.adherenceChipRegular
                      : styles.adherenceChipCritical,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={isOptimal ? 'check-decagram' : 'alert-circle'}
                    size={16}
                    color={isOptimal ? '#059669' : isRegular ? '#D97706' : '#DC2626'}
                  />
                  <Text
                    style={[
                      styles.adherenceChipText,
                      { color: isOptimal ? '#059669' : isRegular ? '#D97706' : '#DC2626' },
                    ]}
                  >
                    {isOptimal ? 'Óptima (>85%)' : isRegular ? 'Regular (70-84%)' : 'Riesgo Clínico (<70%)'}
                  </Text>
                </View>
              </View>
            </View>

            {/* 3. Alertas Clínicas (si existen omisiones) */}
            {warnings.length > 0 && (
              <View style={styles.warningsCard}>
                <View style={styles.warningsHeader}>
                  <MaterialCommunityIcons name="alert-outline" size={18} color="#DC2626" />
                  <Text style={styles.warningsTitle}>Atención Médica Requerida</Text>
                </View>
                {warnings.map((warn, idx) => (
                  <Text key={idx} style={styles.warningItemText}>
                    • {warn}
                  </Text>
                ))}
              </View>
            )}

            {/* 4. Desglose Detallado por Fármaco */}
            <View style={styles.breakdownSection}>
              <Text style={styles.sectionHeaderTitle}>Desglose Individual por Medicamento</Text>
              {breakdowns.length === 0 ? (
                <Text style={styles.emptyBreakdownText}>
                  No hay fármacos con tomas registradas en este período.
                </Text>
              ) : (
                breakdowns.map((item) => (
                  <View key={item.medicineId} style={styles.medItemCard}>
                    <View style={styles.medItemTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.medItemName}>{item.medicineName}</Text>
                        <Text style={styles.medItemDose}>{item.doseDescription}</Text>
                      </View>
                      <View style={styles.medItemScoreGroup}>
                        <Text style={styles.medItemRateText}>{item.adherenceRate}%</Text>
                        <Text style={styles.medItemFractionText}>
                          {item.totalTaken}/{item.totalScheduled} tomas
                        </Text>
                      </View>
                    </View>

                    {/* Barra de progreso */}
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${item.adherenceRate}%`,
                            backgroundColor:
                              item.adherenceRate >= 85
                                ? '#059669'
                                : item.adherenceRate >= 70
                                ? '#D97706'
                                : '#DC2626',
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* 5. Selector de Texto Formal Monospace (Historia Clínica) */}
            <TouchableOpacity
              style={styles.btnToggleRaw}
              onPress={() => setShowRawText((prev) => !prev)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={showRawText ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#0284C7"
              />
              <Text style={styles.btnToggleRawText}>
                {showRawText
                  ? 'Ocultar formato plano para Historia Clínica'
                  : 'Ver texto estructurado para Historia Clínica (HC)'}
              </Text>
            </TouchableOpacity>

            {showRawText && (
              <View style={styles.monospaceContainer}>
                <Text style={styles.monospaceContentText}>
                  {reportText || clinicalReport?.formattedReportText}
                </Text>
              </View>
            )}

            {/* 6. Botones de Acción */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.btnCopyAction}
                onPress={handleCopyReport}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Copiar informe clínico al portapapeles"
              >
                <MaterialCommunityIcons name="content-copy" size={18} color="#0F172A" />
                <Text style={styles.btnCopyActionText}>Copiar Informe</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnShareWhatsApp}
                onPress={onExport}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Compartir informe con el médico geriatra por WhatsApp"
              >
                <MaterialCommunityIcons name="whatsapp" size={20} color="#FFFFFF" />
                <Text style={styles.btnShareWhatsAppText}>Enviar por WhatsApp al Médico</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdropScrim: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  modalSheetBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 580,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSheetSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  closeBtn: {
    padding: 6,
    minHeight: 40,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollContent: {
    padding: 20,
    gap: 16,
  },
  patientSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  patientMetaText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  chronicBadgeContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chronicLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  chronicValue: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
  },
  scorecardBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scorecardLeft: {
    flex: 1,
  },
  scoreNumberText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
  },
  scoreLabelText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  scorecardRight: {
    alignItems: 'flex-end',
  },
  adherenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  adherenceChipOptimal: {
    backgroundColor: '#ECFDF5',
  },
  adherenceChipRegular: {
    backgroundColor: '#FFFBEB',
  },
  adherenceChipCritical: {
    backgroundColor: '#FEF2F2',
  },
  adherenceChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  warningsCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 6,
  },
  warningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  warningsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  warningItemText: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 18,
  },
  breakdownSection: {
    gap: 10,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyBreakdownText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  medItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  medItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  medItemDose: {
    fontSize: 12,
    color: '#64748B',
  },
  medItemScoreGroup: {
    alignItems: 'flex-end',
  },
  medItemRateText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  medItemFractionText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  btnToggleRaw: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  btnToggleRawText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
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
    fontSize: 11,
    color: '#0F172A',
    lineHeight: 17,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  btnCopyAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnCopyActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  btnShareWhatsApp: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: '#15803D',
  },
  btnShareWhatsAppText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
