import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  reportText: string;
  onClose: () => void;
  onExport: () => void;
}

export const ClinicalReportModal: React.FC<Props> = ({
  visible,
  reportText,
  onClose,
  onExport,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdropScrim}>
        <View style={styles.modalSheetBox}>
          {/* Cabecera */}
          <View style={styles.modalSheetTop}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons
                name="file-document-check-outline"
                size={22}
                color="#0F172A"
              />
              <Text style={styles.modalSheetTitle}>Informe Clínico de Adherencia</Text>
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

          {/* Contenido Monospace */}
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.monospaceContainer}>
              <Text style={styles.monospaceContentText}>{reportText}</Text>
            </View>

            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={onExport}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Compartir informe clínico con el médico geriatra"
            >
              <MaterialCommunityIcons
                name="share-variant-outline"
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.modalSubmitButtonText}>
                Compartir con el Médico Geriatra
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdropScrim: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheetBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    gap: 8,
  },
  modalSheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
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
    gap: 14,
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
    fontSize: 12,
    color: '#0F172A',
    lineHeight: 18,
  },
  modalSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    minHeight: 52,
    borderRadius: 8,
    gap: 8,
  },
  modalSubmitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
