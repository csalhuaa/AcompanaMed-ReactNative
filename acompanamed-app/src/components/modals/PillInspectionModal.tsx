import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Medicine } from '../../domain';
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
}) => {
  if (!medicine) return null;

  const realPhotoUri = medicine.visualPill.photoUri?.trim() || null;
  const [activeView, setActiveView] = useState<'photo' | 'pill'>(realPhotoUri ? 'photo' : 'pill');

  useEffect(() => {
    if (visible && medicine) {
      const hasPhoto = !!medicine.visualPill.photoUri?.trim();
      setActiveView(hasPhoto ? 'photo' : 'pill');
    }
  }, [visible, medicine]);

  const handleSpeakDescription = async () => {
    const splitAdvice = medicine.visualPill.canSplit
      ? 'Tiene ranura central y se puede partir a la mitad si el médico lo indicó.'
      : 'Debe tomarse entera, no masticar ni triturar.';

    const speechText = `Don Manuel, está inspeccionando ${medicine.name} de ${medicine.doseDescription}. Es una pastilla de forma ${medicine.visualPill.shape} y color ${medicine.visualPill.colorName}. ${splitAdvice} Recuerde: ${medicine.instructions}`;

    await defaultSpeechService.speak(speechText);
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
            {/* Si el medicamento tiene foto real, ofrecemos el selector de vista amplio */}
            {realPhotoUri && (
              <View style={styles.viewModeTabsRow} accessibilityRole="tablist">
                <TouchableOpacity
                  style={[styles.viewModeTab, activeView === 'photo' && styles.viewModeTabActive]}
                  onPress={() => setActiveView('photo')}
                  activeOpacity={0.8}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeView === 'photo' }}
                  accessibilityLabel="Ver foto real del empaque"
                >
                  <MaterialCommunityIcons
                    name="camera"
                    size={16}
                    color={activeView === 'photo' ? '#0284C7' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.viewModeTabText,
                      activeView === 'photo' && styles.viewModeTabTextActive,
                    ]}
                  >
                    Foto de su Caja / Blíster
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.viewModeTab, activeView === 'pill' && styles.viewModeTabActive]}
                  onPress={() => setActiveView('pill')}
                  activeOpacity={0.8}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeView === 'pill' }}
                  accessibilityLabel="Ver modelo volumétrico de la pastilla"
                >
                  <MaterialCommunityIcons
                    name="pill"
                    size={16}
                    color={activeView === 'pill' ? '#0284C7' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.viewModeTabText,
                      activeView === 'pill' && styles.viewModeTabTextActive,
                    ]}
                  >
                    Pastilla 3D (Forma y Color)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Vista 1: Foto Real de la Caja en tamaño completo */}
            {realPhotoUri && activeView === 'photo' ? (
              <View style={styles.largeInspectionCard}>
                <View style={styles.largePhotoWrapper}>
                  <Image
                    source={{ uri: realPhotoUri }}
                    style={styles.largePhotoImage}
                    resizeMode="contain"
                  />
                  <View style={styles.verifiedWatermark}>
                    <MaterialCommunityIcons name="check-decagram" size={15} color="#0284C7" />
                    <Text style={styles.watermarkText}>Caja física de su botiquín</Text>
                  </View>
                </View>
                <Text style={styles.photoTipText}>
                  Compare la caja o blíster físico que tiene en sus manos con la foto de arriba.
                </Text>
              </View>
            ) : (
              /* Vista 2: Modelo Anatómico 3D en tamaño completo */
              <View style={styles.largeInspectionCard}>
                <Text style={styles.cardSectionTag}>FORMA, COLOR Y RANURA DE SU PASTILLA</Text>
                <View style={styles.largeRenderShowcaseBox}>
                  <PillVisualRenderer visualPill={medicine.visualPill} size="xlarge" />
                </View>
                <View style={styles.anatomyBadgeRow}>
                  <Text style={styles.pillFormBadge}>
                    Forma: {medicine.visualPill.shape.toUpperCase()}
                  </Text>
                  <Text style={styles.pillColorBadge}>
                    Color: {medicine.visualPill.colorName}
                  </Text>
                </View>
                {medicine.visualPill.imprint && (
                  <Text style={styles.imprintTag}>
                    Grabado en la pastilla: &ldquo;{medicine.visualPill.imprint}&rdquo;
                  </Text>
                )}
                <Text style={styles.photoTipText}>
                  Verifique que su comprimido coincida con el color y la forma mostrados.
                </Text>
              </View>
            )}

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
                  size={24}
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
                      ? 'COMPRIMIDO CON RANURA: SÍ SE PUEDE PARTIR'
                      : 'TRAGAR ENTERA: NO ABRIR NI MASTICAR'}
                  </Text>
                  <Text style={styles.splitRuleDescription}>
                    {medicine.visualPill.canSplit
                      ? 'Tiene una ranura central de dosificación. Puede partirlo a la mitad limpiamente si el médico indicó media dosis.'
                      : 'Su recubrimiento protege el estómago o mantiene la liberación prolongada. Tragar con agua.'}
                  </Text>
                </View>
              </View>

              {/* Indicación Médica de Ingesta */}
              <View style={styles.intakeAdviceBox}>
                <MaterialCommunityIcons name="glass-cocktail" size={20} color="#0284C7" />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.intakeAdviceLabel}>Instrucción médica de toma:</Text>
                  <Text style={styles.intakeAdviceText}>
                    {medicine.instructions || medicine.visualPill.intakeAdvice || 'Tomar según prescripción médica con agua.'}
                  </Text>
                </View>
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
    borderRadius: 20,
    width: '100%',
    maxWidth: 520,
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
    backgroundColor: '#F8FAFC',
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
  viewModeTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 14,
    gap: 4,
  },
  viewModeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  viewModeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  viewModeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  viewModeTabTextActive: {
    fontWeight: '800',
    color: '#0284C7',
  },
  largeInspectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  cardSectionTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  largeRenderShowcaseBox: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  largePhotoWrapper: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largePhotoImage: {
    width: '100%',
    height: '100%',
  },
  verifiedWatermark: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  watermarkText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0369A1',
  },
  photoTipText: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
  },
  anatomyBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  pillFormBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pillColorBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  imprintTag: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
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
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
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
    fontSize: 12.5,
    fontWeight: '800',
  },
  splitRuleDescription: {
    fontSize: 11.5,
    color: '#334155',
    marginTop: 3,
    lineHeight: 16,
  },
  intakeAdviceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  intakeAdviceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  intakeAdviceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  speechActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginBottom: 10,
    minHeight: 52,
  },
  speechActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
