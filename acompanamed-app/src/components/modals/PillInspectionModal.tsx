import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Medicine } from '../../domain';
import { CLINICAL_MEDICINE_PRESETS } from '../../domain/medicineAssets';
import { PillVisualRenderer } from '../timeline/PillVisualRenderer';
import { defaultSpeechService } from '../../infrastructure';

interface Props {
  visible: boolean;
  medicine: Medicine | null;
  onClose: () => void;
  onUpdatePhoto?: (medicineId: string, newPhotoUri: string) => void;
}

export const PillInspectionModal: React.FC<Props> = ({
  visible,
  medicine,
  onClose,
  onUpdatePhoto,
}) => {
  const [selectedPresetPhoto, setSelectedPresetPhoto] = useState<string | null>(null);

  if (!medicine) return null;

  const currentPhoto =
    selectedPresetPhoto ||
    medicine.visualPill.photoUri ||
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80';

  const handleSpeakDescription = async () => {
    const splitAdvice = medicine.visualPill.canSplit
      ? 'Tiene ranura central y se puede partir a la mitad si el médico lo indicó.'
      : 'Debe tomarse entera, no masticar ni triturar.';

    const speechText = `Don Manuel, está inspeccionando ${medicine.name} de ${medicine.doseDescription}. Es una pastilla de forma ${medicine.visualPill.shape} y color ${medicine.visualPill.colorName}. ${splitAdvice} Recuerde: ${medicine.instructions}`;

    await defaultSpeechService.speak(speechText);
  };

  const handleSelectPreset = (photoUri: string) => {
    setSelectedPresetPhoto(photoUri);
    if (onUpdatePhoto) {
      onUpdatePhoto(medicine.id, photoUri);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Encabezado con Botón Accesible */}
          <View style={styles.header}>
            <View style={styles.headerTitleBox}>
              <View style={styles.iconBadge}>
                <MaterialCommunityIcons name="magnify-scan" size={24} color="#0284C7" />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.title}>Lupa de Inspección</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {medicine.name} • {medicine.doseDescription}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar lupa de inspección"
            >
              <MaterialCommunityIcons name="close" size={24} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Comparación Visual: Render 3D vs. Foto Real de Farmacia */}
            <View style={styles.comparisonGrid}>
              {/* Panel 1: Render 3D Volumétrico */}
              <View style={styles.visualCard}>
                <Text style={styles.cardSectionTag}>MODELO ANATÓMICO 3D</Text>
                <View style={styles.renderShowcaseBox}>
                  <PillVisualRenderer visualPill={medicine.visualPill} size="xlarge" />
                </View>
                <View style={styles.anatomyBadgeRow}>
                  <Text style={styles.pillFormBadge}>
                    Forma: {medicine.visualPill.shape.toUpperCase()}
                  </Text>
                  <Text style={styles.pillColorBadge}>
                    {medicine.visualPill.colorName}
                  </Text>
                </View>
                {medicine.visualPill.imprint && (
                  <Text style={styles.imprintTag}>
                    Grabado: &ldquo;{medicine.visualPill.imprint}&rdquo;
                  </Text>
                )}
              </View>

              {/* Panel 2: Fotografía Real del Blíster / Empaque */}
              <View style={styles.visualCard}>
                <Text style={styles.cardSectionTag}>FOTO REAL DE BLÍSTER</Text>
                <View style={styles.realPhotoWrapper}>
                  <Image
                    source={{ uri: currentPhoto }}
                    style={styles.realPhotoImage}
                    resizeMode="cover"
                  />
                  <View style={styles.verifiedWatermark}>
                    <MaterialCommunityIcons name="check-decagram" size={14} color="#0284C7" />
                    <Text style={styles.watermarkText}>Empaque de Farmacia</Text>
                  </View>
                </View>
                <Text style={styles.photoTipText}>
                  Compare la pastilla física contra el blíster original.
                </Text>
              </View>
            </View>

            {/* Ficha Clínica de Seguridad para Ancianos */}
            <View style={styles.safetyCard}>
              <Text style={styles.safetyTitle}>Directrices de Ingesta Segura</Text>

              {/* Regla de Fraccionamiento (¿Se puede partir?) */}
              <View
                style={[
                  styles.splitRuleBox,
                  medicine.visualPill.canSplit
                    ? styles.splitRuleAllowed
                    : styles.splitRuleForbidden,
                ]}
              >
                <MaterialCommunityIcons
                  name={medicine.visualPill.canSplit ? 'content-cut' : 'cancel'}
                  size={22}
                  color={medicine.visualPill.canSplit ? '#15803D' : '#B91C1C'}
                />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text
                    style={[
                      styles.splitRuleTitle,
                      { color: medicine.visualPill.canSplit ? '#15803D' : '#B91C1C' },
                    ]}
                  >
                    {medicine.visualPill.canSplit
                      ? 'COMPRIMIDO RANURADO: SÍ SE PUEDE PARTIR'
                      : 'NO ABRIR NI MASTICAR LA CÁPSULA / COMPRIMIDO'}
                  </Text>
                  <Text style={styles.splitRuleDescription}>
                    {medicine.visualPill.canSplit
                      ? 'Tiene una ranura central de dosificación. Puede partirlo a la mitad limpiamente si requiere media dosis.'
                      : 'Su recubrimiento protege el estómago o libera el fármaco lentamente. Tragar entera con agua.'}
                  </Text>
                </View>
              </View>

              {/* Dimensión Física Estimada */}
              <View style={styles.metricRow}>
                <MaterialCommunityIcons name="ruler" size={18} color="#64748B" />
                <Text style={styles.metricLabel}>Tamaño físico real:</Text>
                <Text style={styles.metricValue}>
                  {medicine.visualPill.sizeLabel || 'Estándar (~10 mm)'}
                </Text>
              </View>

              {/* Indicación de Ingesta */}
              <View style={styles.metricRow}>
                <MaterialCommunityIcons name="glass-cocktail" size={18} color="#0284C7" />
                <Text style={styles.metricLabel}>Forma de toma:</Text>
                <Text style={[styles.metricValue, { color: '#0369A1' }]}>
                  {medicine.visualPill.intakeAdvice || medicine.instructions}
                </Text>
              </View>
            </View>

            {/* Botón de Asistencia Auditiva por Voz */}
            <TouchableOpacity
              style={styles.speechActionBtn}
              onPress={handleSpeakDescription}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Escuchar descripción de la pastilla"
            >
              <MaterialCommunityIcons name="volume-high" size={22} color="#FFFFFF" />
              <Text style={styles.speechActionBtnText}>
                Escuchar descripción en voz alta
              </Text>
            </TouchableOpacity>

            {/* Galería de Selección Rápida de Blíster Real */}
            <View style={styles.presetSection}>
              <Text style={styles.presetSectionTitle}>
                Seleccionar foto de empaque de referencia:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
                {CLINICAL_MEDICINE_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetThumbBox,
                      currentPhoto === preset.visualPill.photoUri && styles.presetThumbActive,
                    ]}
                    onPress={() => preset.visualPill.photoUri && handleSelectPreset(preset.visualPill.photoUri)}
                  >
                    <Image
                      source={{ uri: preset.visualPill.photoUri }}
                      style={styles.presetThumbImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.presetThumbText} numberOfLines={1}>
                      {preset.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          {/* Botón de Cierre Inferior */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.okButton} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.okButtonText}>Entendido • Cerrar Lupa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 580,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  comparisonGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  visualCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  cardSectionTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  renderShowcaseBox: {
    height: 105,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anatomyBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
    justifyContent: 'center',
  },
  pillFormBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillColorBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  imprintTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  realPhotoWrapper: {
    width: '100%',
    height: 105,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  realPhotoImage: {
    width: '100%',
    height: '100%',
  },
  verifiedWatermark: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  watermarkText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0369A1',
  },
  photoTipText: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
  },
  safetyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  splitRuleBox: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  splitRuleAllowed: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  splitRuleForbidden: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  splitRuleTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  splitRuleDescription: {
    fontSize: 11,
    color: '#334155',
    marginTop: 2,
    lineHeight: 15,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 'auto',
  },
  speechActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginBottom: 16,
    minHeight: 52,
  },
  speechActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  presetSection: {
    marginBottom: 8,
  },
  presetSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
  },
  presetThumbBox: {
    width: 68,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 3,
  },
  presetThumbActive: {
    borderColor: '#0284C7',
    backgroundColor: '#E0F2FE',
  },
  presetThumbImage: {
    width: '100%',
    height: 44,
    borderRadius: 6,
  },
  presetThumbText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 3,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  okButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  okButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
