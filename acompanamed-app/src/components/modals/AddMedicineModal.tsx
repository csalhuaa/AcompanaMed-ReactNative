import React, { useState, useEffect, useRef } from 'react';
import {
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
import { useHorizontalScroll } from '../../hooks';
import { addMedicineStyles as styles } from './addMedicineStyles';
import {
  ScheduleTimeSection,
  PillAppearanceSection,
  COLOR_PALETTE,
} from './addMedicine';

export { COLOR_PALETTE };

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
  const presetsScroll = useHorizontalScroll();
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
      photoUri: photoUri.trim(),
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
                <View style={styles.carouselHeaderRow}>
                  <Text style={styles.presetsTitle}>Plantillas de medicamentos comunes (1 toque):</Text>
                  <View style={styles.carouselNavRow}>
                    <TouchableOpacity
                      style={styles.btnCarouselNav}
                      onPress={() => presetsScroll.scrollBy(-150)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Deslizar plantillas hacia la izquierda"
                    >
                      <MaterialCommunityIcons name="chevron-left" size={16} color="#0284C7" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.btnCarouselNav}
                      onPress={() => presetsScroll.scrollBy(150)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Deslizar plantillas hacia la derecha"
                    >
                      <MaterialCommunityIcons name="chevron-right" size={16} color="#0284C7" />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  ref={presetsScroll.scrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.presetsScroll}
                  {...(presetsScroll.webHandlers as any)}
                >
                  {CLINICAL_MEDICINE_PRESETS.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.presetChip}
                      onPress={() => {
                        if (presetsScroll.isDragging.current) return;
                        applyPreset(p);
                      }}
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
            <ScheduleTimeSection
              scheduleTime={scheduleTime}
              onChangeScheduleTime={(newTime) => {
                setScheduleTime(newTime);
                if (errors.scheduleTime) {
                  setErrors((prev) => ({ ...prev, scheduleTime: undefined }));
                }
              }}
              error={errors.scheduleTime}
            />

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
            <PillAppearanceSection
              shape={shape}
              onChangeShape={setShape}
              selectedColorHex={color.hex}
              onChangeColor={setColor}
              name={name}
              dose={dose}
              photoUri={photoUri}
            />

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
