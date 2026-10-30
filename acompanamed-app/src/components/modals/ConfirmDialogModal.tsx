import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialogModal: React.FC<Props> = ({
  visible,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
  iconName = 'alert-circle-outline',
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalBackdropScrim}>
        <View style={styles.modalCardBox}>
          {/* Icono de Alerta / Acción */}
          <View
            style={[
              styles.iconWrapper,
              isDestructive ? styles.iconWrapperDestructive : styles.iconWrapperNeutral,
            ]}
          >
            <MaterialCommunityIcons
              name={iconName}
              size={28}
              color={isDestructive ? '#DC2626' : '#0F172A'}
            />
          </View>

          {/* Título y Mensaje */}
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogMessage}>{message}</Text>

          {/* Botonera de Decisión */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.btnCancel}
              onPress={onCancel}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={cancelText}
            >
              <Text style={styles.btnCancelText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btnConfirm,
                isDestructive ? styles.btnConfirmDestructive : styles.btnConfirmPrimary,
              ]}
              onPress={onConfirm}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={confirmText}
            >
              <Text style={styles.btnConfirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdropScrim: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: '100%',
    maxWidth: 420, // Ergonómico en desktop y móvil
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconWrapperDestructive: {
    backgroundColor: '#FEE2E2',
  },
  iconWrapperNeutral: {
    backgroundColor: '#F1F5F9',
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  btnCancel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 46,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  btnConfirm: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 46,
    borderRadius: 6,
  },
  btnConfirmPrimary: {
    backgroundColor: '#0F172A',
  },
  btnConfirmDestructive: {
    backgroundColor: '#DC2626',
  },
  btnConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
