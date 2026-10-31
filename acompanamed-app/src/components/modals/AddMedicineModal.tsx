import React, { useState, useEffect, useRef } from 'react';
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
  Image,
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
  const [errors, setErrors] = useState<MedicineFormErrors>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isEditing = !!initialMedicine;

  useEffect(() => {
    if (visible) {
      setErrors({});
      if (initialMedicine) {
        setName(initialMedicine.name);
        setDose(initialMedicine.doseDescription);
        setScheduleTime(initialScheduleTime || '08:00');
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
  };

  const triggerPhotoPick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: any) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      if (typeof window !== 'undefined' && 'Image' in window) {
        const img = new (window as any).Image();
        img.onload = () => {
          try {
            const maxDim = 600;
            let targetWidth = img.width;
            let targetHeight = img.height;
            if (targetWidth > maxDim || targetHeight > maxDim) {
              if (targetWidth > targetHeight) {
                targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
                targetWidth = maxDim;
              } else {
                targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
                targetHeight = maxDim;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
              setPhotoUri(compressedDataUrl);
            } else {
              setPhotoUri(dataUrl);
            }
          } catch {
            setPhotoUri(dataUrl);
          }
        };
        img.onerror = () => {
          setPhotoUri(dataUrl);
        };
        img.src = dataUrl;
      } else {
        setPhotoUri(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Desglose de hora y minutos
  const [hStr, mStr] = (scheduleTime || '08:00').split(':');
  const currentHour = (hStr || '08').padStart(2, '0');
  const currentMinute = (mStr || '00').padStart(2, '0');

  const adjustHour = (delta: number) => {
    let h = parseInt(currentHour, 10);
    if (isNaN(h)) h = 8;
    h = (h + delta + 24) % 24;
    setScheduleTime(`${h.toString().padStart(2, '0')}:${currentMinute}`);
    if (errors.scheduleTime) {
      setErrors((prev) => ({ ...prev, scheduleTime: undefined }));
    }
  };

  const adjustMinute = (delta: number) => {
    let m = parseInt(currentMinute, 10);
    if (isNaN(m)) m = 0;
    m = (m + delta + 60) % 60;
    setScheduleTime(`${currentHour}:${m.toString().padStart(2, '0')}`);
    if (errors.scheduleTime) {
      setErrors((prev) => ({ ...prev, scheduleTime: undefined }));
    }
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
      imprint: initialMedicine?.visualPill.imprint,
      canSplit: initialMedicine?.visualPill.canSplit ?? true,
    });

    onClose();
  };

  const fieldError = (field: keyof MedicineFormErrors) =>
    errors[field] ? (
      <Text style={styles.fieldError} accessibilityLiveRegion="polite">
        {errors[field]}
      </Text>
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
                <Text style={styles.presetsTitle}>Plantillas de medicamentos comunes (1 toque):</Text>
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

            {/* SECCIÓN 1: DATOS CLÍNICOS DE LA RECETA */}
            <View style={styles.sectionDivider}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={16} color="#0F172A" />
              <Text style={styles.sectionDividerTitle}>Prescripción Médica</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formInputLabel}>Principio Activo (Nombre Comercial o Genérico)</Text>
              <TextInput
                style={[styles.formTextInput, errors.name && styles.invalidInput]}
                placeholder="Ej. Losartán, Metformina, Atorvastatina"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                accessibilityLabel="Nombre del principio activo"
              />
              {fieldError('name')}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formInputLabel}>Dosis Prescrita por el Médico</Text>
              <TextInput
                style={[styles.formTextInput, errors.dose && styles.invalidInput]}
                placeholder="Ej. 50 mg cada 24 horas, 1 tableta"
                placeholderTextColor="#94A3B8"
                value={dose}
                onChangeText={(val) => {
                  setDose(val);
                  if (errors.dose) setErrors((prev) => ({ ...prev, dose: undefined }));
                }}
                accessibilityLabel="Dosis prescrita"
              />
              {fieldError('dose')}
            </View>

            {/* SELECTOR ERGONÓMICO DE HORARIO */}
            <View style={styles.formGroup}>
              <Text style={styles.formInputLabel}>Horario de la Toma Diaria</Text>
              
              <View style={[styles.timeSelectorCard, errors.scheduleTime && styles.invalidTimeCard]}>
                {/* 1. Selector de Hora y Minutos (Centrado y amplio sin comprimirse) */}
                <View style={styles.timeInputsRow}>
                  {/* Selector de Hora */}
                  <View style={styles.timeUnitCol}>
                    <Text style={styles.timeUnitLabel}>Hora</Text>
                    <View style={styles.timeNumberBox}>
                      <TouchableOpacity
                        style={styles.timeArrowBtn}
                        onPress={() => adjustHour(-1)}
                        accessibilityRole="button"
                        accessibilityLabel="Restar 1 hora"
                      >
                        <MaterialCommunityIcons name="minus" size={18} color="#0F172A" />
                      </TouchableOpacity>
                      <Text style={styles.timeBigDigit}>{currentHour}</Text>
                      <TouchableOpacity
                        style={styles.timeArrowBtn}
                        onPress={() => adjustHour(1)}
                        accessibilityRole="button"
                        accessibilityLabel="Sumar 1 hora"
                      >
                        <MaterialCommunityIcons name="plus" size={18} color="#0F172A" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.timeColonSeparator}>:</Text>

                  {/* Selector de Minutos */}
                  <View style={styles.timeUnitCol}>
                    <Text style={styles.timeUnitLabel}>Minuto</Text>
                    <View style={styles.timeNumberBox}>
                      <TouchableOpacity
                        style={styles.timeArrowBtn}
                        onPress={() => adjustMinute(-5)}
                        accessibilityRole="button"
                        accessibilityLabel="Restar 5 minutos"
                      >
                        <MaterialCommunityIcons name="minus" size={18} color="#0F172A" />
                      </TouchableOpacity>
                      <Text style={styles.timeBigDigit}>{currentMinute}</Text>
                      <TouchableOpacity
                        style={styles.timeArrowBtn}
                        onPress={() => adjustMinute(5)}
                        accessibilityRole="button"
                        accessibilityLabel="Sumar 5 minutos"
                      >
                        <MaterialCommunityIcons name="plus" size={18} color="#0F172A" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* 2. Selector nativo del navegador en su propia fila independiente */}
                {Platform.OS === 'web' && (
                  <View style={styles.nativeTimeBar}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color="#0284C7" />
                    <Text style={styles.nativeTimeBarLabel}>O elija con el reloj del sistema:</Text>
                    {/* @ts-ignore */}
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e: any) => {
                        if (e.target.value) {
                          setScheduleTime(e.target.value);
                          if (errors.scheduleTime) {
                            setErrors((prev) => ({ ...prev, scheduleTime: undefined }));
                          }
                        }
                      }}
                      style={{
                        height: 36,
                        fontSize: 14,
                        fontWeight: '700',
                        color: '#0F172A',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #0284C7',
                        borderRadius: 6,
                        padding: '0 8px',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    />
                  </View>
                )}

                {/* 3. Carrusel horizontal de Pautas Habituales (1 toque) */}
                <View style={styles.quickTimeChipsContainer}>
                  <Text style={styles.quickTimeChipsTitle}>Pautas habituales (1 toque):</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.quickTimeChipsScroll}
                  >
                    {[
                      { time: '08:00', label: '08:00 Desayuno' },
                      { time: '13:00', label: '13:00 Almuerzo' },
                      { time: '18:00', label: '18:00 Tarde' },
                      { time: '20:00', label: '20:00 Noche' },
                      { time: '22:00', label: '22:00 Dormir' },
                    ].map((preset) => {
                      const isSelected = scheduleTime === preset.time;
                      return (
                        <TouchableOpacity
                          key={preset.time}
                          style={[styles.quickPresetChip, isSelected && styles.quickPresetChipActive]}
                          onPress={() => {
                            setScheduleTime(preset.time);
                            if (errors.scheduleTime) {
                              setErrors((prev) => ({ ...prev, scheduleTime: undefined }));
                            }
                          }}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityLabel={`Pauta horaria ${preset.label}`}
                        >
                          <MaterialCommunityIcons
                            name={isSelected ? 'check-circle' : 'clock-outline'}
                            size={12}
                            color={isSelected ? '#FFFFFF' : '#0284C7'}
                          />
                          <Text style={[styles.quickPresetChipText, isSelected && styles.quickPresetChipTextActive]}>
                            {preset.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
              {fieldError('scheduleTime')}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formInputLabel}>Instrucciones de Ingestión</Text>
              <TextInput
                style={[styles.formTextInput, { minHeight: 64 }]}
                placeholder="Ej. Tomar después del desayuno con medio vaso de agua."
                placeholderTextColor="#94A3B8"
                multiline
                value={instructions}
                onChangeText={setInstructions}
                accessibilityLabel="Instrucciones médicas de ingestión"
              />
            </View>

            {/* SECCIÓN 2: RECONOCIMIENTO VISUAL (FORMA Y COLOR) */}
            <View style={styles.sectionDivider}>
              <MaterialCommunityIcons name="eye-outline" size={16} color="#0F172A" />
              <Text style={styles.sectionDividerTitle}>Reconocimiento Visual de la Pastilla</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formInputLabel}>Forma Anatómica</Text>
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
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formInputLabel}>Color Distintivo</Text>
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
                  >
                    {color.hex === c.hex && (
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color={c.hex === '#E2E8F0' ? '#0F172A' : '#FFFFFF'}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* SECCIÓN 3: FOTOGRAFÍA DEL BLÍSTER / EMPAQUE */}
            <View style={styles.sectionDivider}>
              <MaterialCommunityIcons name="camera-outline" size={16} color="#0F172A" />
              <Text style={styles.sectionDividerTitle}>Foto del Blíster o Empaque</Text>
            </View>

            <Text style={styles.photoHelperText}>
              Una foto real ayuda al paciente a verificar con la Lupa de Inspección y no confundirse de medicamento.
            </Text>

            {Platform.OS === 'web' &&
              React.createElement('input', {
                ref: fileInputRef,
                type: 'file',
                accept: 'image/*',
                style: { display: 'none' },
                onChange: handleFileChange,
              })}

            {photoUri ? (
              <View style={styles.photoPreviewCard}>
                <Image source={{ uri: photoUri }} style={styles.photoThumbnail} resizeMode="cover" />
                <View style={styles.photoInfoCol}>
                  <View style={styles.photoBadgeRow}>
                    <MaterialCommunityIcons name="check-decagram" size={15} color="#0284C7" />
                    <Text style={styles.photoBadgeText}>Foto adjunta activa</Text>
                  </View>
                  <Text style={styles.photoSubtext}>Visible en la lupa de inspección.</Text>
                  <View style={styles.photoActionsRow}>
                    <TouchableOpacity
                      style={styles.photoActionBtnSecondary}
                      onPress={triggerPhotoPick}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Cambiar foto con cámara o archivo"
                    >
                      <MaterialCommunityIcons name="camera-retake-outline" size={14} color="#0284C7" />
                      <Text style={styles.photoActionBtnSecondaryText}>Cambiar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoActionBtnDestructive}
                      onPress={() => setPhotoUri('')}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Quitar foto actual"
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={14} color="#DC2626" />
                      <Text style={styles.photoActionBtnDestructiveText}>Quitar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadPhotoBtn}
                onPress={triggerPhotoPick}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Tomar foto con la cámara o subir imagen"
              >
                <View style={styles.uploadPhotoIconCircle}>
                  <MaterialCommunityIcons name="camera-plus" size={20} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadPhotoTitle}>Tomar Foto con Cámara o Subir Imagen Real</Text>
                  <Text style={styles.uploadPhotoSubtitle}>Fotografía la caja o blíster físico de tu paciente</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* SECCIÓN 4: CONTROL DE BOTIQUÍN E INVENTARIO */}
            <View style={styles.sectionDivider}>
              <MaterialCommunityIcons name="medical-bag" size={16} color="#0F172A" />
              <Text style={styles.sectionDividerTitle}>Control de Botiquín y Existencias</Text>
            </View>

            <View style={styles.inventoryRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formInputLabel}>Stock Inicial (unid.)</Text>
                <TextInput
                  style={[styles.formTextInput, errors.stock && styles.invalidInput]}
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={(val) => {
                    setStock(val);
                    if (errors.stock) setErrors((prev) => ({ ...prev, stock: undefined }));
                  }}
                  accessibilityLabel="Cantidad inicial en inventario"
                />
                {fieldError('stock')}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.formInputLabel}>Alerta Crítica (unid.)</Text>
                <TextInput
                  style={[styles.formTextInput, errors.minAlert && styles.invalidInput]}
                  keyboardType="numeric"
                  value={minAlert}
                  onChangeText={(val) => {
                    setMinAlert(val);
                    if (errors.minAlert) setErrors((prev) => ({ ...prev, minAlert: undefined }));
                  }}
                  accessibilityLabel="Umbral de alerta de reposición"
                />
                {fieldError('minAlert')}
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
    maxWidth: 520,
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
    backgroundColor: '#F8FAFC',
  },
  modalSheetTitle: {
    flexShrink: 1,
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
    gap: 14,
  },
  formGroup: {
    gap: 6,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 2,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionDividerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  formInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  formTextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    minHeight: 44,
  },
  invalidInput: {
    borderColor: '#B91C1C',
  },
  fieldError: {
    fontSize: 12.5,
    color: '#991B1B',
    marginTop: 2,
  },
  validationSummary: {
    fontSize: 13,
    color: '#991B1B',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  /* SELECTOR ERGONÓMICO DE TIEMPO */
  timeSelectorCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    padding: 12,
    gap: 10,
  },
  invalidTimeCard: {
    borderColor: '#B91C1C',
  },
  timeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 4,
  },
  timeUnitCol: {
    alignItems: 'center',
  },
  timeUnitLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  timeNumberBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    borderRadius: 6,
    paddingHorizontal: 4,
  },
  timeBigDigit: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
    paddingHorizontal: 12,
  },
  timeArrowBtn: {
    width: 34,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
  },
  timeColonSeparator: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 14,
  },
  nativeTimeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  nativeTimeBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  quickTimeChipsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    gap: 6,
  },
  quickTimeChipsTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0369A1',
  },
  quickTimeChipsScroll: {
    flexDirection: 'row',
  },
  quickPresetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0284C7',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 14,
    marginRight: 6,
  },
  quickPresetChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  quickPresetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  quickPresetChipTextActive: {
    color: '#FFFFFF',
  },
  /* FORMAS Y COLORES */
  shapeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shapeOptionBtn: {
    width: '31%',
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
    gap: 12,
    paddingVertical: 4,
  },
  colorCircleSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSwatchActive: {
    borderColor: '#0F172A',
    transform: [{ scale: 1.15 }],
  },
  /* INVENTARIO */
  inventoryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  /* PRESETS COMUNES */
  presetsBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  presetsTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 6,
  },
  presetsScroll: {
    flexDirection: 'row',
  },
  presetChip: {
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
  /* FOTOGRAFÍA DEL BLÍSTER */
  photoHelperText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  photoPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    padding: 10,
    gap: 12,
  },
  photoThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  photoInfoCol: {
    flex: 1,
    gap: 4,
  },
  photoBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  photoSubtext: {
    fontSize: 11,
    color: '#64748B',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  photoActionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  photoActionBtnSecondaryText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0369A1',
  },
  photoActionBtnDestructive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  photoActionBtnDestructiveText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  uploadPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0284C7',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  uploadPhotoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPhotoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  uploadPhotoSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  /* BOTÓN GUARDAR */
  modalSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    minHeight: 50,
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
