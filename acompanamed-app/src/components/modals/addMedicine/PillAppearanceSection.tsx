import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PillShape } from '../../../domain';
import { PillVisualRenderer } from '../../timeline/PillVisualRenderer';
import { addMedicineStyles as styles } from '../addMedicineStyles';

export const COLOR_PALETTE = [
  { hex: '#0284C7', name: 'Azul Clínico' },
  { hex: '#E2E8F0', name: 'Blanco Nácar' },
  { hex: '#D97706', name: 'Ámbar Cálido' },
  { hex: '#DC2626', name: 'Rojo Carmesí' },
  { hex: '#059669', name: 'Verde Médico' },
  { hex: '#7C3AED', name: 'Violeta Suave' },
];

export const SHAPE_OPTIONS = [
  { id: 'round', label: 'Redonda', icon: 'checkbox-blank-circle' },
  { id: 'capsule', label: 'Cápsula', icon: 'pill' },
  { id: 'oval', label: 'Ovalada', icon: 'circle-double' },
  { id: 'scored', label: 'Ranurada', icon: 'plus-circle-outline' },
  { id: 'diamond', label: 'Romboide', icon: 'rhombus-outline' },
  { id: 'drop', label: 'Gotas', icon: 'water' },
] as const;

export interface PillAppearanceSectionProps {
  shape: PillShape;
  onChangeShape: (shape: PillShape) => void;
  selectedColorHex: string;
  onChangeColor: (color: { hex: string; name: string }) => void;
  name: string;
  dose: string;
  photoUri?: string;
}

export const PillAppearanceSection: React.FC<PillAppearanceSectionProps> = ({
  shape,
  onChangeShape,
  selectedColorHex,
  onChangeColor,
  name,
  dose,
  photoUri,
}) => {
  return (
    <>
      <View style={styles.sectionDivider}>
        <MaterialCommunityIcons name="eye-outline" size={16} color="#0F172A" />
        <Text style={styles.sectionDividerTitle}>Reconocimiento Visual de la Pastilla</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formInputLabel}>Forma Anatómica</Text>
        <View style={styles.shapeSelectorRow} accessibilityRole="radiogroup">
          {SHAPE_OPTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.shapeOptionBtn,
                shape === item.id && styles.shapeOptionBtnActive,
              ]}
              onPress={() => onChangeShape(item.id)}
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
                selectedColorHex === c.hex && styles.colorCircleSwatchActive,
              ]}
              onPress={() => onChangeColor(c)}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedColorHex === c.hex }}
              accessibilityLabel={`Color: ${c.name}`}
            >
              {selectedColorHex === c.hex && (
                <MaterialCommunityIcons
                  name="check"
                  size={16}
                  color={c.hex === '#E2E8F0' ? '#0F172A' : '#FFFFFF'}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );
};
