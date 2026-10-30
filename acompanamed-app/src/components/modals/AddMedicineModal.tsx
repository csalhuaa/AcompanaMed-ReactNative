import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PillShape, Medicine } from '../../domain';

export const COLOR_PALETTE = [
  { hex: '#0284C7', name: 'Azul Clínico' },
  { hex: '#E2E8F0', name: 'Blanco Nácar' },
  { hex: '#D97706', name: 'Ámbar Cálido' },
  { hex: '#DC2626', name: 'Rojo Carmesí' },
  { hex: '#059669', name: 'Verde Médico' },
  { hex: '#7C3AED', name: 'Violeta Suave' },
];

export interface NewMedicineData {
  id?: string;
  name: string;
  doseDescription: string;
  scheduleTime: string;
  instructions: string;
  shape: PillShape;
  color: { hex: string; name: string };
  stock: number;
  minStockAlert: number;
}

interface Props {
  visible: boolean;
  initialMedicine?: Medicine | null;
  initialScheduleTime?: string;
  onClose: () => void;
  onSave: (data: NewMedicineData) => void;
}

export const AddMedicineModal: React.FC<Props> = ({
  visible,
  initialMedicine,
  initialScheduleTime = '08:00',
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [instructions, setInstructions] = useState('');
  const [shape, setShape] = useState<PillShape>('round');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [stock, setStock] = useState('30');
  const [minAlert, setMinAlert] = useState('6');

  const isEditing = !!initialMedicine;

  useEffect(() => {
    if (visible) {
      if (initialMedicine) {
        setName(initialMedicine.name);
        setDose(initialMedicine.doseDescription);
        setScheduleTime(initialScheduleTime);
        setInstructions(initialMedicine.instructions);
        setShape(initialMedicine.visualPill.shape);
        const foundColor = COLOR_PALETTE.find((c) => c.hex === initialMedicine.visualPill.colorHex) || {
          hex: initialMedicine.visualPill.colorHex,
          name: initialMedicine.visualPill.colorName,
        };
        setColor(foundColor);
        setStock(String(initialMedicine.stock));
        setMinAlert(String(initialMedicine.minStockAlert));
      } else {
        setName('');
        setDose('');
        setScheduleTime('08:00');
        setInstructions('');
        setShape('round');
        setColor(COLOR_PALETTE[0]);
        setStock('30');
        setMinAlert('6');
      }
    }
  }, [visible, initialMedicine, initialScheduleTime]);

  const handleSave = () => {
    if (!name.trim() || !dose.trim()) {
      Alert.alert('Campos Obligatorios', 'Por favor indique el nombre y la dosis prescrita.');
      return;
    }

    onSave({
      id: initialMedicine?.id,
      name: name.trim(),
      doseDescription: dose.trim(),
      scheduleTime: scheduleTime.trim() || '08:00',
      instructions: instructions.trim() || 'Tomar según prescripción médica con agua.',
      shape,
      color,
      stock: parseInt(stock, 10) || 30,
      minStockAlert: parseInt(minAlert, 10) || 6,
    });

    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalBackdropScrim}>
        <View style={styles.modalSheetBox}>
          {/* Barra Superior del Modal */}
          <View style={styles.modalSheetTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons
                name={isEditing ? 'pencil-box-outline' : 'pill'}
                size={22}
                color="#0F172A"
              />
              <Text style={styles.modalSheetTitle}>
                {isEditing ? 'Modificar Fármaco Prescrito' : 'Registrar Nuevo Medicamento'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Cerrar ventana"
            >
              <MaterialCommunityIcons name="close" size={20} color="#334155" />
            </TouchableOpacity>
          </View>

          {/* Formulario */}
          <ScrollView
            contentContainerStyle={styles.modalFormContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.formInputLabel}>Principio Activo (Nombre Comercial / Genérico)</Text>
            <TextInput
              style={styles.formTextInput}
              placeholder="Ej. Enalapril, Glibenclamida, Losartán"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
              accessibilityLabel="Nombre del principio activo"
            />

            <View style={styles.twoColumnInputs}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formInputLabel}>Dosis Prescrita</Text>
                <TextInput
                  style={styles.formTextInput}
                  placeholder="Ej. 10 mg, 500 mg"
                  placeholderTextColor="#94A3B8"
                  value={dose}
                  onChangeText={setDose}
                  accessibilityLabel="Dosis prescrita"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.formInputLabel}>Horario Diario (HH:MM)</Text>
                <TextInput
                  style={styles.formTextInput}
                  placeholder="08:00"
                  placeholderTextColor="#94A3B8"
                  value={scheduleTime}
                  onChangeText={setScheduleTime}
                  accessibilityLabel="Horario diario de la toma"
                />
              </View>
            </View>

            <Text style={styles.formInputLabel}>Instrucciones de Ingestión</Text>
            <TextInput
              style={[styles.formTextInput, { minHeight: 60 }]}
              placeholder="Ej. Tomar después del desayuno con medio vaso de agua."
              placeholderTextColor="#94A3B8"
              multiline
              value={instructions}
              onChangeText={setInstructions}
              accessibilityLabel="Instrucciones médicas de ingestión"
            />

            <Text style={styles.formInputLabel}>Forma Anatómica del Comprimido</Text>
            <View style={styles.shapeSelectorRow} accessibilityRole="radiogroup">
              {(['round', 'capsule', 'oval'] as PillShape[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.shapeOptionBtn,
                    shape === s && styles.shapeOptionBtnActive,
                  ]}
                  onPress={() => setShape(s)}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: shape === s }}
                  accessibilityLabel={`Forma: ${s === 'round' ? 'Pastilla Redonda' : s === 'capsule' ? 'Cápsula' : 'Comprimido Oval'}`}
                >
                  <MaterialCommunityIcons
                    name={
                      s === 'capsule'
                        ? 'pill'
                        : s === 'oval'
                        ? 'circle-double'
                        : 'checkbox-blank-circle'
                    }
                    size={20}
                    color={shape === s ? '#0F172A' : '#334155'}
                  />
                  <Text
                    style={[
                      styles.shapeOptionText,
                      shape === s && styles.shapeOptionTextActive,
                    ]}
                  >
                    {s === 'round' ? 'Redonda' : s === 'capsule' ? 'Cápsula' : 'Oval'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formInputLabel}>Color Distintivo de la Presentación</Text>
            <View style={styles.colorPaletteGrid} accessibilityRole="radiogroup">
              {COLOR_PALETTE.map((c) => (
                <TouchableOpacity
                  key={c.hex}
                  style={[
                    styles.colorCircleSwatch,
                    { backgroundColor: c.hex },
                    color.hex === c.hex && styles.colorCircleSwatchActive,
                  ]}
                  onPress={() => setColor(c)}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: color.hex === c.hex }}
                  accessibilityLabel={`Color distintivo: ${c.name}`}
                />
              ))}
            </View>

            <View style={styles.twoColumnInputs}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formInputLabel}>Stock Inicial en Botiquín</Text>
                <TextInput
                  style={styles.formTextInput}
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={setStock}
                  accessibilityLabel="Cantidad inicial en inventario"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.formInputLabel}>Alerta de Stock Crítico</Text>
                <TextInput
                  style={styles.formTextInput}
                  keyboardType="numeric"
                  value={minAlert}
                  onChangeText={setMinAlert}
                  accessibilityLabel="Umbral de alerta de reposición"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleSave}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Guardar fármaco en el pastillero"
            >
              <MaterialCommunityIcons name="content-save-outline" size={18} color="#FFFFFF" />
              <Text style={styles.modalSubmitButtonText}>
                {isEditing ? 'Guardar Modificaciones' : 'Incorporar al Pastillero Familiar'}
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
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalSheetBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: '100%',
    maxWidth: 520, // NUNCA se estira en pantallas anchas
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
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
  modalSheetTitle: {
    fontSize: 16,
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
  modalFormContent: {
    padding: 20,
    gap: 12,
  },
  formInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  formTextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  twoColumnInputs: {
    flexDirection: 'row',
  },
  shapeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  shapeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
    minHeight: 44,
  },
  shapeOptionBtnActive: {
    borderColor: '#0F172A',
    backgroundColor: '#F1F5F9',
  },
  shapeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  shapeOptionTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorCircleSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  colorCircleSwatchActive: {
    borderColor: '#0F172A',
    borderWidth: 3,
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
    marginTop: 8,
  },
  modalSubmitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
