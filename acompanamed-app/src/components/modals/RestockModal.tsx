import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
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
  { label: '+10', amount: 10, subtext: 'Blíster (10u)' },
  { label: '+20', amount: 20, subtext: 'Blíster (20u)' },
  { label: '+30', amount: 30, subtext: 'Caja 1 mes (30u)' },
  { label: '+60', amount: 60, subtext: 'Caja 2 meses (60u)' },
];

export const RestockModal: React.FC<Props> = ({
  visible,
  medicine,
  onClose,
  onConfirmRestock,
}) => {
  const [amount, setAmount] = useState(30);

  useEffect(() => {
    if (visible) {
      setAmount(30);
    }
  }, [visible]);

  if (!medicine) return null;

  const currentStock = medicine.stock;
  const newStock = currentStock + amount;
  const newDays = daysRemaining(newStock, 1);

  const handleStep = (delta: number) => {
    setAmount((prev) => Math.max(1, prev + delta));
  };

  const handleConfirm = () => {
    if (amount <= 0) return;
    onConfirmRestock(medicine.id, amount);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdropScrim}>
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

          {/* Resumen del Medicamento Seleccionado */}
          <View style={styles.medSummaryCard}>
            <View style={styles.pillIconBox}>
              <PillVisualRenderer visualPill={medicine.visualPill} size="small" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.medName}>{medicine.name}</Text>
              <Text style={styles.medDose}>{medicine.doseDescription}</Text>
              <Text style={styles.currentStockText}>
                Stock actual: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{currentStock} unidades</Text> ({daysRemaining(currentStock, 1)} días)
              </Text>
            </View>
          </View>

          {/* Opciones Rápidas de Farmacia */}
          <Text style={styles.sectionLabel}>Presentación Adquirida en Farmacia:</Text>
          <View style={styles.quickPacksGrid}>
            {QUICK_PACKS.map((pack) => {
              const isSelected = amount === pack.amount;
              return (
                <TouchableOpacity
                  key={pack.label}
                  style={[styles.packCard, isSelected && styles.packCardActive]}
                  onPress={() => setAmount(pack.amount)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.packCardAmount, isSelected && styles.packCardAmountActive]}>
                    {pack.label}
                  </Text>
                  <Text style={[styles.packCardSub, isSelected && styles.packCardSubActive]}>
                    {pack.subtext}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Contador de Ajuste Personalizado */}
          <Text style={styles.sectionLabel}>Cantidad a Ingresar al Botiquín:</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => handleStep(-5)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Restar 5 unidades"
            >
              <Text style={styles.stepBtnText}>-5</Text>
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
                value={String(amount)}
                onChangeText={(val) => {
                  const num = parseInt(val, 10);
                  setAmount(isNaN(num) ? 0 : num);
                }}
              />
              <Text style={styles.unitLabel}>unidades</Text>
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
              onPress={() => handleStep(5)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Sumar 5 unidades"
            >
              <Text style={styles.stepBtnText}>+5</Text>
            </TouchableOpacity>
          </View>

          {/* Proyección del Nuevo Nivel de Stock */}
          <View style={styles.projectionBox}>
            <MaterialCommunityIcons name="shield-check" size={20} color="#059669" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.projectionTitle}>Nuevo Stock Proyectado:</Text>
              <Text style={styles.projectionBody}>
                <Text style={{ fontWeight: '800', color: '#065F46' }}>{newStock} comprimidos</Text> ({newDays} días de tratamiento continuo asegurado).
              </Text>
            </View>
          </View>

          {/* Botón de Confirmación */}
          <TouchableOpacity
            style={styles.btnConfirm}
            onPress={handleConfirm}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Confirmar ingreso de ${amount} unidades al botiquín`}
          >
            <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
            <Text style={styles.btnConfirmText}>
              Ingresar {amount} Unidades al Botiquín
            </Text>
          </TouchableOpacity>
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
    padding: 16,
  },
  modalCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: '100%',
    maxWidth: 480, // Nunca se estira en desktop
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
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
    marginTop: 4,
  },
  quickPacksGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  packCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  packCardActive: {
    borderColor: '#0F172A',
    backgroundColor: '#F1F5F9',
  },
  packCardAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
  },
  packCardAmountActive: {
    color: '#0F172A',
  },
  packCardSub: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  packCardSubActive: {
    color: '#0F172A',
    fontWeight: '600',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  amountDisplayBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    borderRadius: 6,
    paddingVertical: 6,
  },
  amountInput: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    minWidth: 60,
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
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  projectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  projectionBody: {
    fontSize: 12,
    color: '#065F46',
    marginTop: 1,
  },
  btnConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
  },
  btnConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
