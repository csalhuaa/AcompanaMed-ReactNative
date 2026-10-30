import { VisualPill } from './types';

export interface MedicinePreset {
  id: string;
  name: string;
  doseDescription: string;
  instructions: string;
  intervalHours: number;
  stock: number;
  minStockAlert: number;
  visualPill: VisualPill;
}

// Catálogo clínico geriátrico con fotos reales y datos galénicos
export const CLINICAL_MEDICINE_PRESETS: MedicinePreset[] = [
  {
    id: 'med-losartan',
    name: 'Losartán Potásico',
    doseDescription: '50 mg',
    intervalHours: 24,
    instructions: 'Tomar con medio vaso de agua después del desayuno.',
    stock: 14,
    minStockAlert: 6,
    visualPill: {
      shape: 'scored',
      colorHex: '#38BDF8',
      colorName: 'Azul Celeste',
      imprint: '50',
      sizeCategory: 'medium',
      sizeLabel: 'Mediana (~9 mm)',
      canSplit: true,
      intakeAdvice: 'Tomar con abundante agua. Se puede partir en dos por la ranura central si el médico lo indicó.',
      photoUri: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    },
  },
  {
    id: 'med-metformina',
    name: 'Metformina Clorhidrato',
    doseDescription: '850 mg',
    intervalHours: 24,
    instructions: 'Tomar inmediatamente con el almuerzo para proteger la mucosa gástrica.',
    stock: 22,
    minStockAlert: 5,
    visualPill: {
      shape: 'oval',
      colorHex: '#F1F5F9',
      colorName: 'Blanco Tiza',
      imprint: '850',
      sizeCategory: 'large',
      sizeLabel: 'Grande (~19 mm)',
      canSplit: false,
      intakeAdvice: 'No masticar ni triturar. Tomar con alimentos para reducir las molestias estomacales.',
      photoUri: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80',
    },
  },
  {
    id: 'med-omeprazol',
    name: 'Omeprazol',
    doseDescription: '20 mg',
    intervalHours: 24,
    instructions: 'Tomar en ayunas, 30 minutos antes del desayuno.',
    stock: 28,
    minStockAlert: 7,
    visualPill: {
      shape: 'capsule',
      colorHex: '#EC4899',
      secondaryColorHex: '#F8FAFC',
      colorName: 'Rosa y Blanco',
      imprint: 'OM-20',
      sizeCategory: 'medium',
      sizeLabel: 'Cápsula estándar (~15 mm)',
      canSplit: false,
      intakeAdvice: 'Tragar la cápsula entera con agua. NUNCA abrirla ni triturar los microgránulos interiores.',
      photoUri: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=600&q=80',
    },
  },
  {
    id: 'med-atorvastatina',
    name: 'Atorvastatina Cálcica',
    doseDescription: '20 mg',
    intervalHours: 24,
    instructions: 'Tomar antes de acostarse a dormir.',
    stock: 8,
    minStockAlert: 6,
    visualPill: {
      shape: 'round',
      colorHex: '#F59E0B',
      colorName: 'Ámbar Cálido',
      imprint: '20',
      sizeCategory: 'medium',
      sizeLabel: 'Mediana (~10 mm)',
      canSplit: false,
      intakeAdvice: 'Tomar por la noche. Ayuda a regular los niveles de colesterol durante el descanso.',
      photoUri: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80',
    },
  },
  {
    id: 'med-enalapril',
    name: 'Enalapril Maleato',
    doseDescription: '10 mg',
    intervalHours: 12,
    instructions: 'Tomar cada 12 horas con agua fresca.',
    stock: 20,
    minStockAlert: 8,
    visualPill: {
      shape: 'scored',
      colorHex: '#FBBF24',
      colorName: 'Amarillo Pastel',
      imprint: 'E-10',
      sizeCategory: 'tiny',
      sizeLabel: 'Pequeña (~7 mm)',
      canSplit: true,
      intakeAdvice: 'Comprimido pequeño ranurado. Se parte fácilmente con las yemas de los dedos si toma media dosis.',
      photoUri: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    },
  },
  {
    id: 'med-lagrimas',
    name: 'Lágrimas Artificiales (Gotas)',
    doseDescription: '2 gotas',
    intervalHours: 8,
    instructions: 'Aplicar en ambos ojos para combatir la resequedad ocular.',
    stock: 45,
    minStockAlert: 10,
    visualPill: {
      shape: 'drop',
      colorHex: '#06B6D4',
      colorName: 'Celeste Hialino',
      sizeCategory: 'medium',
      sizeLabel: 'Frasco gotero 15 ml',
      canSplit: false,
      intakeAdvice: 'Inclinar la cabeza hacia atrás, tirar del párpado inferior y aplicar 1 gota sin tocar el ojo con la punta.',
      photoUri: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
    },
  },
];
