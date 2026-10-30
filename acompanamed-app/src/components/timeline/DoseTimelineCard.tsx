import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScheduledDoseItem } from '../../domain';
import { PillVisualRenderer } from './PillVisualRenderer';
import { defaultSpeechService, formatSeniorInstructionSpeech } from '../../infrastructure';

interface Props {
  item: ScheduledDoseItem;
  isExpanded: boolean;
  isLast: boolean;
  onToggleExpand: () => void;
  onTakeDose: (medId: string) => void;
  onPostponeDose: (medId: string) => void;
}

export const DoseTimelineCard: React.FC<Props> = ({
  item,
  isExpanded,
  isLast,
  onToggleExpand,
  onTakeDose,
  onPostponeDose,
}) => {
  const { medicine, scheduledTime, isTakenToday, isPastDue } = item;

  const handleSpeech = () => {
    const text = formatSeniorInstructionSpeech(
      'Don Manuel',
      medicine.name,
      medicine.doseDescription,
      medicine.instructions
    );
    defaultSpeechService.speak(text);
    Alert.alert('Lectura en Voz Alta', text);
  };

  return (
    <View style={styles.nodeContainer}>
      {/* Columna Izquierda: Eje Temporal y Punto */}
      <View style={styles.spineGutter}>
        <View
          style={[
            styles.spineDot,
            isTakenToday && styles.spineDotTaken,
            isPastDue && !isTakenToday && styles.spineDotAlert,
            isExpanded && !isTakenToday && styles.spineDotActive,
          ]}
        >
          {isTakenToday ? (
            <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
          ) : isPastDue ? (
            <MaterialCommunityIcons name="alert" size={12} color="#FFFFFF" />
          ) : (
            <View style={styles.spineInnerDot} />
          )}
        </View>
        {!isLast && <View style={styles.spineLine} />}
      </View>

      {/* Columna Derecha: Tarjeta Clínica */}
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          style={[
            styles.card,
            isExpanded && styles.cardExpanded,
            isTakenToday && styles.cardTaken,
          ]}
          onPress={onToggleExpand}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={`Toma de ${scheduledTime}, ${medicine.name} ${medicine.doseDescription}. Estado: ${
            isTakenToday ? 'Dosis completada' : isPastDue ? 'Dosis pendiente con retraso' : 'Dosis programada'
          }`}
          accessibilityHint="Toca para expandir los detalles de la pastilla y registrar la toma"
        >
          {/* Fila Superior: Horario y Chip de Estado */}
          <View style={styles.cardHeader}>
            <View style={styles.timeTag}>
              <MaterialCommunityIcons name="clock-outline" size={13} color="#0284C7" />
              <Text style={styles.timeTagText}>{scheduledTime}</Text>
            </View>

            {isTakenToday ? (
              <View style={styles.statusTakenChip}>
                <MaterialCommunityIcons name="check-circle" size={14} color="#059669" />
                <Text style={styles.statusTakenChipText}>Tomada</Text>
              </View>
            ) : isPastDue ? (
              <View style={styles.statusAlertChip}>
                <MaterialCommunityIcons name="alert-circle" size={14} color="#DC2626" />
                <Text style={styles.statusAlertChipText}>Pendiente</Text>
              </View>
            ) : (
              <View style={styles.statusScheduledChip}>
                <Text style={styles.statusScheduledChipText}>Programada</Text>
              </View>
            )}
          </View>

          {/* Fila del Fármaco */}
          <View style={styles.medRow}>
            <View style={[styles.miniPreviewBox, { borderColor: medicine.visualPill.colorHex }]}>
              <PillVisualRenderer visualPill={medicine.visualPill} size="small" />
            </View>

            <View style={styles.medInfo}>
              <Text style={styles.medName}>{medicine.name}</Text>
              <Text style={styles.medDose}>
                {medicine.doseDescription} • {medicine.visualPill.colorName}
              </Text>
            </View>

            <MaterialCommunityIcons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#334155"
            />
          </View>

          {/* Detalle Expandido */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              <View style={styles.divider} />

              {/* Muestra Anatómica Realista */}
              <View style={styles.pillAnatomyShowcase}>
                <PillVisualRenderer visualPill={medicine.visualPill} size="large" />
                <View style={styles.pillAnatomyMeta}>
                  <Text style={styles.anatomyTitle}>Identificación Visual</Text>
                  <Text style={styles.anatomyText}>
                    Forma:{' '}
                    <Text style={styles.anatomyBold}>
                      {medicine.visualPill.shape === 'capsule'
                        ? 'Cápsula biseccionada'
                        : medicine.visualPill.shape === 'oval'
                        ? 'Comprimido oval'
                        : 'Comprimido redondo'}
                    </Text>
                  </Text>
                  <Text style={styles.anatomyText}>
                    Color: <Text style={styles.anatomyBold}>{medicine.visualPill.colorName}</Text>
                  </Text>
                </View>
              </View>

              {/* Instrucción Médica de Ingestión */}
              <View style={styles.instructionBox}>
                <MaterialCommunityIcons name="information-outline" size={18} color="#0284C7" />
                <Text style={styles.instructionText}>{medicine.instructions}</Text>
              </View>

              {/* Botón TTS Asistivo */}
              <TouchableOpacity
                style={styles.ttsButton}
                onPress={handleSpeech}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Escuchar en voz alta indicación de ${medicine.name}`}
              >
                <MaterialCommunityIcons name="volume-high" size={20} color="#0284C7" />
                <Text style={styles.ttsButtonText}>Escuchar indicación en voz alta</Text>
              </TouchableOpacity>

              {/* Acciones de Toma (Botonera Vertical Apilada - Cero Desborde) */}
              {isTakenToday ? (
                <View style={styles.verifiedNoticeStrip}>
                  <MaterialCommunityIcons name="shield-check" size={22} color="#059669" />
                  <Text style={styles.verifiedNoticeText}>
                    Dosis confirmada hoy. Próxima toma programada a las {scheduledTime}.
                  </Text>
                </View>
              ) : (
                <View style={styles.actionColumn}>
                  {/* Botón Primario: Confirmar toma (54dp alto, 100% ancho) */}
                  <TouchableOpacity
                    style={styles.btnConfirm}
                    onPress={() => onTakeDose(medicine.id)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Confirmar toma de ${medicine.name} ${medicine.doseDescription}`}
                    accessibilityHint="Registra la dosis en el historial y descuenta del inventario"
                  >
                    <MaterialCommunityIcons name="check" size={22} color="#FFFFFF" />
                    <Text style={styles.btnConfirmText}>Confirmar toma</Text>
                  </TouchableOpacity>

                  {/* Botón Secundario: Posponer 15 min (48dp alto, 100% ancho) */}
                  <TouchableOpacity
                    style={styles.btnPostpone}
                    onPress={() => onPostponeDose(medicine.id)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Posponer toma de ${medicine.name} por 15 minutos`}
                    accessibilityHint="Pospone el recordatorio sin penalizar tu adherencia"
                  >
                    <MaterialCommunityIcons name="clock-fast" size={18} color="#334155" />
                    <Text style={styles.btnPostponeText}>Posponer 15 minutos</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nodeContainer: {
    flexDirection: 'row',
  },
  spineGutter: {
    width: 32,
    alignItems: 'center',
  },
  spineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  spineDotActive: {
    borderColor: '#0284C7',
    borderWidth: 2.5,
  },
  spineDotTaken: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  spineDotAlert: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  spineInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F172A',
  },
  spineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  cardWrapper: {
    flex: 1,
    paddingBottom: 20,
    marginLeft: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardExpanded: {
    borderColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTaken: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    gap: 4,
  },
  timeTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
    fontVariant: ['tabular-nums'],
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
  statusAlertChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusAlertChipText: {
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
    color: '#334155',
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniPreviewBox: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medInfo: {
    flex: 1,
    marginLeft: 12,
  },
  medName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  medDose: {
    fontSize: 13,
    color: '#334155',
    marginTop: 2,
  },
  expandedContent: {
    marginTop: 14,
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  pillAnatomyShowcase: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
  },
  pillAnatomyMeta: {
    flex: 1,
  },
  anatomyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  anatomyText: {
    fontSize: 13,
    color: '#334155',
    marginTop: 2,
  },
  anatomyBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  instructionBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#0369A1',
    lineHeight: 18,
  },
  ttsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    minHeight: 48,
    borderRadius: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  ttsButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  actionColumn: {
    gap: 8,
    marginTop: 4,
  },
  btnConfirm: {
    width: '100%',
    height: 54,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnConfirmText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnPostpone: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPostponeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  verifiedNoticeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
});
