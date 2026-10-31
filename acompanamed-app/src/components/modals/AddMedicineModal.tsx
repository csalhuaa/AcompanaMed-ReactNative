import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PillShape, Medicine } from '../../domain';
import { CLINICAL_MEDICINE_PRESETS, MedicinePreset } from '../../domain/medicineAssets';
import { validateMedicineForm, MedicineFormErrors } from '../../domain/MedicineFormValidation';

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
  photoUri?: string;
  imprint?: string;
  canSplit?: boolean;
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
  const [photoUri, setPhotoUri] = useState('');
  const [imprint, setImprint] = useState('');
  const [canSplit, setCanSplit] = useState(true);
  const [errors, setErrors] = useState<MedicineFormErrors>({});
  const { width } = useWindowDimensions();
  const stackFields = width < 400;

  const isEditing = !!initialMedicine;

  useEffect(() => {
    if (visible) {
      setErrors({});
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
        setPhotoUri(initialMedicine.visualPill.photoUri || '');
        setImprint(initialMedicine.visualPill.imprint || '');
        setCanSplit(initialMedicine.visualPill.canSplit ?? true);
      } else {
        setName('');
        setDose('');
        setScheduleTime('08:00');
        setInstructions('');
        setShape('round');
        setColor(COLOR_PALETTE[0]);
        setStock('30');
        setMinAlert('6');
        setPhotoUri('');
        setImprint('');
        setCanSplit(true);
      }
    }
  }, [visible, initialMedicine, initialScheduleTime]);

  const applyPreset = (preset: MedicinePreset) => {
    setErrors({});
    setName(preset.name);
    setDose(preset.doseDescription);
    setInstructions(preset.instructions);
    setShape(preset.visualPill.shape);
    const foundColor = COLOR_PALETTE.find((c) => c.hex === preset.visualPill.colorHex) || {
      hex: preset.visualPill.colorHex,
      name: preset.visualPill.colorName,
    };
    setColor(foundColor);
    setStock(String(preset.stock));
    setMinAlert(String(preset.minStockAlert));
    setPhotoUri(preset.visualPill.photoUri || '');
    setImprint(preset.visualPill.imprint || '');
    setCanSplit(preset.visualPill.canSplit ?? true);
  };

  const handleSave = () => {
    const result = validateMedicineForm({ name, dose, scheduleTime, stock, minAlert });
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    setErrors({});

    onSave({
      id: initialMedicine?.id,
      ...result.value,
      instructions: instructions.trim() || 'Tomar según prescripción médica con agua.',
      shape,
      color,
      photoUri: photoUri.trim() || undefined,
      imprint: imprint.trim() || undefined,
      canSplit,
    });

    onClose();
  };

  const fieldError = (field: keyof MedicineFormErrors) => errors[field] ? (
    <Text style={styles.fieldError} accessibilityLiveRegion="polite">{errors[field]}</Text>
  ) : null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdropScrim}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalSheetBox}>
          {/* Barra Superior del Modal */}
          <View style={styles.modalSheetTop}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
            keyboardShouldPersistTaps="handled"
          >
            {Object.keys(errors).length > 0 ? (
              <Text style={styles.validationSummary} accessibilityRole="alert" accessibilityLiveRegion="assertive">
                Revise los campos indicados. El medicamento todavía no se guardó.
              </Text>
            ) : null}
            {!isEditing && (
              <View style={styles.presetsBox}>
                <Text style={styles.presetsTitle}>Plantillas de medicamentos comunes:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
                  {CLINICAL_MEDICINE_PRESETS.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.presetChip}
                      onPress={() => applyPreset(p)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="pill" size={13} color="#0284C7" />
                      <Text style={styles.presetChipText}>
                        {p.name.split(' ')[0]} {p.doseDescription}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.formInputLabel}>Principio Activo (Nombre Comercial / Genérico)</Text>
            <TextInput
              style={[styles.formTextInput, errors.name && styles.invalidInput]}
              placeholder="Ej. Enalapril, Glibenclamida, Losartán"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
              accessibilityLabel="Nombre del principio activo"
            />
            {fieldError('name')}

            <View style={[styles.twoColumnInputs, stackFields && styles.stackedInputs]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formInputLabel}>Dosis Prescrita</Text>
                <TextInput
                  style={[styles.formTextInput, errors.dose && styles.invalidInput]}
                  placeholder="Ej. 10 mg, 500 mg"
                  placeholderTextColor="#94A3B8"
                  value={dose}
                  onChangeText={setDose}
                  accessibilityLabel="Dosis prescrita"
                />
                {fieldError('dose')}
              </View>
              <View style={{ flex: 1, marginLeft: stackFields ? 0 : 12 }}>
                <Text style={styles.formInputLabel}>Horario Diario (HH:MM)</Text>
                <TextInput
                  style={[styles.formTextInput, errors.scheduleTime && styles.invalidInput]}
                  placeholder="08:00"
                  placeholderTextColor="#94A3B8"
                  value={scheduleTime}
                  onChangeText={setScheduleTime}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Horario diario de la toma"
                />
                {fieldError('scheduleTime')}
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

            <Text style={styles.formInputLabel}>Forma Anatómica y Presentación Farmacológica</Text>
            <View style={styles.shapeSelectorRow} accessibilityRole="radiogroup">
              {(
                [
                  { id: 'round', label: 'Redonda', icon: 'checkbox-blank-circle' },
                  { id: 'capsule', label: 'Cápsula', icon: 'pill' },
                  { id: 'oval', label: 'Ovalada', icon: 'circle-double' },
                  { id: 'scored', label: 'Ranurada', icon: 'plus-circle-outline' },
                  { id: 'diamond', label: 'Romboide', icon: 'rhombus-outline' },
                  { id: 'drop', label: 'Gotas', icon: 'water' },
                ] as const
              ).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.shapeOptionBtn,
                    shape === item.id && styles.shapeOptionBtnActive,
                  ]}
                  onPress={() => setShape(item.id)}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: shape === item.id }}
                  accessibilityLabel={`Presentación: ${item.label}`}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={18}
                    color={shape === item.id ? '#0F172A' : '#475569'}
                  />
                  <Text
                    style={[
                      styles.shapeOptionText,
                      shape === item.id && styles.shapeOptionTextActive,
                    ]}
                  >
                    {item.label}
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

            <View style={[styles.twoColumnInputs, stackFields && styles.stackedInputs]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formInputLabel}>Stock Inicial en Botiquín</Text>
                <TextInput
                  style={[styles.formTextInput, errors.stock && styles.invalidInput]}
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={setStock}
                  accessibilityLabel="Cantidad inicial en inventario"
                />
                {fieldError('stock')}
              </View>
              <View style={{ flex: 1, marginLeft: stackFields ? 0 : 12 }}>
                <Text style={styles.formInputLabel}>Alerta de Stock Crítico</Text>
                <TextInput
                  style={[styles.formTextInput, errors.minAlert && styles.invalidInput]}
                  keyboardType="numeric"
                  value={minAlert}
                  onChangeText={setMinAlert}
                  accessibilityLabel="Umbral de alerta de reposición"
                />
                {fieldError('minAlert')}
              </View>
            </View>

            <View style={[styles.twoColumnInputs, stackFields && styles.stackedInputs]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formInputLabel}>Grabado en Pastilla (Imprint)</Text>
                <TextInput
                  style={styles.formTextInput}
                  placeholder="Ej. 50, 850, OM-20"
                  placeholderTextColor="#94A3B8"
                  value={imprint}
                  onChangeText={setImprint}
                  accessibilityLabel="Código o grabado en la pastilla"
                />
              </View>
              <View style={{ flex: 1.5 }}>
                <Text style={styles.formInputLabel}>Foto del Blíster (URL)</Text>
                <TextInput
                  style={styles.formTextInput}
                  placeholder="https://..."
                  placeholderTextColor="#94A3B8"
                  value={photoUri}
                  onChangeText={setPhotoUri}
                  accessibilityLabel="URL de fotografía del empaque"
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
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    minHeight: 48,
    minWidth: 48,
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
    fontSize: 16,
    color: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  twoColumnInputs: {
    flexDirection: 'row',
  },
  stackedInputs: {
    flexDirection: 'column',
    gap: 12,
  },
  invalidInput: {
    borderColor: '#B91C1C',
  },
  fieldError: {
    fontSize: 14,
    color: '#991B1B',
    marginTop: 6,
  },
  validationSummary: {
    fontSize: 14,
    color: '#991B1B',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 6,
  },
  shapeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shapeOptionBtn: {
    width: '31%',
    minWidth: 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
    minHeight: 48,
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
    flexWrap: 'wrap',
    gap: 8,
  },
  colorCircleSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  colorCircleSwatchActive: {
    borderColor: '#0F172A',
    borderWidth: 3,
  },
  presetsBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  presetsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 6,
  },
  presetsScroll: {
    flexDirection: 'row',
  },
  presetChip: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6,
    gap: 4,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
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
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
