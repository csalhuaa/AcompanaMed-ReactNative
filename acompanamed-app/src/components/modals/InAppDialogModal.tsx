import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { InAppNoticeData, InAppConfirmData } from '../../data/initialData';

interface Props {
  notice: InAppNoticeData | null;
  confirm: InAppConfirmData | null;
  onCloseNotice: () => void;
  onCloseConfirm: () => void;
}

export const InAppDialogModal: React.FC<Props> = ({
  notice,
  confirm,
  onCloseNotice,
  onCloseConfirm,
}) => {
  // Se prioriza el diálogo de confirmación sobre un aviso simple si ambos coinciden
  const isConfirmActive = Boolean(confirm);
  const isNoticeActive = Boolean(notice && !confirm);
  const isVisible = isConfirmActive || isNoticeActive;

  if (!isVisible) {
    return null;
  }

  if (isConfirmActive && confirm) {
    const isDestructive = confirm.isDestructive;
    const iconName = (confirm.iconName as any) || (isDestructive ? 'alert-circle' : 'help-circle');

    const handleConfirm = async () => {
      onCloseConfirm();
      try {
        await confirm.onConfirm();
      } catch (err) {
        console.warn('Error executing confirmation action:', err);
      }
    };

    const handleCancel = () => {
      onCloseConfirm();
      if (confirm.onCancel) {
        confirm.onCancel();
      }
    };

    return (
      <Modal visible={true} animationType="fade" transparent onRequestClose={handleCancel}>
        <View style={styles.modalBackdropScrim}>
          <View style={styles.modalCardBox}>
            {/* Icono de Alerta de Acción */}
            <View
              style={[
                styles.iconWrapper,
                isDestructive ? styles.iconWrapperDestructive : styles.iconWrapperNeutral,
              ]}
            >
              <MaterialCommunityIcons
                name={iconName}
                size={30}
                color={isDestructive ? '#DC2626' : '#0284C7'}
              />
            </View>

            {/* Título y Mensaje */}
            <Text style={styles.dialogTitle}>{confirm.title}</Text>
            <Text style={styles.dialogMessage}>{confirm.message}</Text>

            {/* Botonera de Decisión */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={handleCancel}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={confirm.cancelText || 'Cancelar'}
              >
                <Text style={styles.btnCancelText}>{confirm.cancelText || 'Cancelar'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.btnConfirm,
                  isDestructive ? styles.btnConfirmDestructive : styles.btnConfirmPrimary,
                ]}
                onPress={handleConfirm}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={confirm.confirmText || 'Continuar'}
              >
                <Text style={styles.btnConfirmText}>{confirm.confirmText || 'Continuar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (isNoticeActive && notice) {
    const type = notice.type || 'info';
    let iconName: any = 'information-outline';
    let iconColor = '#0284C7';
    let iconBg = '#F0F9FF';

    if (type === 'success') {
      iconName = 'check-circle-outline';
      iconColor = '#059669';
      iconBg = '#ECFDF5';
    } else if (type === 'warning') {
      iconName = 'alert-circle-outline';
      iconColor = '#D97706';
      iconBg = '#FFFBEB';
    } else if (type === 'error') {
      iconName = 'alert-octagon-outline';
      iconColor = '#DC2626';
      iconBg = '#FEF2F2';
    }

    const handleClose = () => {
      onCloseNotice();
      if (notice.onClose) {
        notice.onClose();
      }
    };

    return (
      <Modal visible={true} animationType="fade" transparent onRequestClose={handleClose}>
        <View style={styles.modalBackdropScrim}>
          <View style={styles.modalCardBox}>
            {/* Icono de Notificación */}
            <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
              <MaterialCommunityIcons name={iconName} size={30} color={iconColor} />
            </View>

            {/* Título y Mensaje */}
            <Text style={styles.dialogTitle}>{notice.title}</Text>
            {Boolean(notice.message) && (
              <Text style={styles.dialogMessage}>{notice.message}</Text>
            )}

            {/* Botón único de confirmación de lectura */}
            <TouchableOpacity
              style={styles.btnNoticePrimary}
              onPress={handleClose}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={notice.buttonText || 'Entendido'}
            >
              <Text style={styles.btnNoticePrimaryText}>
                {notice.buttonText || 'Entendido'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  modalBackdropScrim: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999,
  },
  modalCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 420,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 12,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconWrapperDestructive: {
    backgroundColor: '#FEE2E2',
  },
  iconWrapperNeutral: {
    backgroundColor: '#F0F9FF',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  dialogMessage: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  btnConfirm: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 48,
    borderRadius: 8,
  },
  btnConfirmPrimary: {
    backgroundColor: '#0284C7',
  },
  btnConfirmDestructive: {
    backgroundColor: '#DC2626',
  },
  btnConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnNoticePrimary: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  btnNoticePrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
