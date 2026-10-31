import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Medicine, daysRemaining } from '../../domain';
import { PillVisualRenderer } from '../timeline/PillVisualRenderer';

interface Props {
  visible: boolean;
  medicine: Medicine | null;
  onClose: () => void;
  onConfirmRestock: (medId: string, amountToAdd: number) => void;
}

const QUICK_PACKS = [
  { label: '10 unid.', desc: '1 Blíster', amount: 10 },
  { label: '20 unid.', desc: '2 Blísters', amount: 20 },
  { label: '30 unid.', desc: '1 Caja (1 mes)', amount: 30 },
  { label: '60 unid.', desc: '2 Cajas (2 meses)', amount: 60 },
];

export const RestockModal: React.FC<Props> = ({
  visible,
  medicine,
  onClose,
  onConfirmRestock,
}) => {
  const [amountText, setAmountText] = useState('30');

  useEffect(() => {
    if (visible) {
      setAmountText('30');
    }
  }, [visible]);

  if (!medicine) return null;

  const currentStock = medicine.stock;
  const parsedAmount = parseInt(amountText, 10) || 0;
  const newStock = currentStock + parsedAmount;
  const newDays = daysRemaining(newStock, 1);

  const handleStep = (delta: number) => {
    const next = Math.max(1, parsedAmount + delta);
    setAmountText(String(next));
  };

  const handleTextChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    setAmountText(clean);
  };

  const handleConfirm = () => {
    if (parsedAmount <= 0) return;
    onConfirmRestock(medicine.id, parsedAmount);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdropScrim}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalCardBox}>
          {/* Cabecera */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="package-variant-closed-plus" size={22} color="#0F172A" />
              <Text style={styles.modalTitle}>Reponer Existencias</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Cerrar ventana de reposición"
            >
              <MaterialCommunityIcons name="close" size={20} color="#334155" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Resumen del Medicamento Seleccionado */}
            <View style={styles.medSummaryCard}>
              <View style={styles.pillIconBox}>
                <PillVisualRenderer visualPill={medicine.visualPill} size="small" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.medName}>{medicine.name}</Text>
                <Text style={styles.medDose}>{medicine.doseDescription}</Text>
                <Text style={styles.currentStockText}>
                  Stock actual en botiquín: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{currentStock} unidades</Text> ({daysRemaining(currentStock, 1)} días)
                </Text>
              </View>
            </View>

            {/* Opciones Rápidas de Presentación Farmacéutica */}
            <Text style={styles.sectionLabel}>Presentación adquirida en farmacia (1 toque):</Text>
            <View style={styles.quickPacksGrid}>
              {QUICK_PACKS.map((pack) => {
                const isSelected = parsedAmount === pack.amount;
                return (
                  <TouchableOpacity
                    key={pack.label}
                    style={[styles.packCard, isSelected && styles.packCardActive]}
                    onPress={() => setAmountText(String(pack.amount))}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Seleccionar ${pack.label} (${pack.desc})`}
                  >
                    <Text style={[styles.packCardAmount, isSelected && styles.packCardAmountActive]}>
                      {pack.label}
                    </Text>
                    <Text style={[styles.packCardSub, isSelected && styles.packCardSubActive]}>
                      {pack.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Contador de Ajuste Personalizado */}
            <Text style={styles.sectionLabel}>Cantidad exacta a ingresar al botiquín:</Text>
            <View style={styles.counterRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => handleStep(-10)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Restar 10 unidades"
              >
                <Text style={styles.stepBtnText}>-10</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => handleStep(-1)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Restar 1 unidad"
              >
                <MaterialCommunityIcons name="minus" size={18} color="#0F172A" />
              </TouchableOpacity>

              <View style={styles.amountDisplayBox}>
                <TextInput
                  style={styles.amountInput}
                  keyboardType="numeric"
                  value={amountText}
                  onChangeText={handleTextChange}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  accessibilityLabel="Cantidad de unidades a reponer"
                />
                <Text style={styles.unitLabel}>comprimidos</Text>
              </View>

              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => handleStep(1)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Sumar 1 unidad"
              >
                <MaterialCommunityIcons name="plus" size={18} color="#0F172A" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => handleStep(10)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Sumar 10 unidades"
              >
                <Text style={styles.stepBtnText}>+10</Text>
              </TouchableOpacity>
            </View>

            {/* Proyección del Nuevo Nivel de Stock */}
            <View style={styles.projectionBox}>
              <MaterialCommunityIcons name="shield-check" size={22} color="#059669" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.projectionTitle}>Nuevo balance proyectado en botiquín:</Text>
                <Text style={styles.projectionBody}>
                  {currentStock} actuales + {parsedAmount} nuevos = <Text style={{ fontWeight: '900', color: '#065F46' }}>{newStock} comprimidos</Text> ({newDays} días de tratamiento continuo).
                </Text>
              </View>
            </View>

            {/* Botón de Confirmación */}
            <TouchableOpacity
              style={[styles.btnConfirm, parsedAmount <= 0 && styles.btnConfirmDisabled]}
              onPress={handleConfirm}
              activeOpacity={0.85}
              disabled={parsedAmount <= 0}
              accessibilityRole="button"
              accessibilityLabel={`Confirmar ingreso de ${parsedAmount} unidades al botiquín`}
            >
              <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              <Text style={styles.btnConfirmText}>
                {parsedAmount > 0
                  ? `Ingresar +${parsedAmount} Unidades (Total: ${newStock})`
                  : 'Ingrese una cantidad válida'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdropScrim: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    minHeight: 36,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  medSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  medDose: {
    fontSize: 12,
    color: '#475569',
  },
  currentStockText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 2,
  },
  quickPacksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  packCard: {
    flexBasis: '48%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  packCardActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  packCardAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  packCardAmountActive: {
    color: '#0284C7',
  },
  packCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  packCardSubActive: {
    color: '#0369A1',
    fontWeight: '700',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  stepBtn: {
    width: 40,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  amountDisplayBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    borderRadius: 6,
    paddingVertical: 4,
    minHeight: 44,
  },
  amountInput: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    minWidth: 70,
    padding: 0,
  },
  unitLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  projectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  projectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  projectionBody: {
    fontSize: 12.5,
    color: '#065F46',
    marginTop: 2,
    lineHeight: 16,
  },
  btnConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 6,
    minHeight: 48,
  },
  btnConfirmDisabled: {
    backgroundColor: '#94A3B8',
  },
  btnConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
