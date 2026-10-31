import { Platform, Alert } from 'react-native';
import { Medicine, DoseLog, EmergencyProfile } from '../domain/types';

export const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med-losartan',
    name: 'Losartán Potásico',
    doseDescription: '50 mg',
    intervalHours: 24,
    instructions: 'Tomar con medio vaso de agua después del desayuno.',
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
    stock: 14,
    minStockAlert: 6,
    createdAt: '2026-10-29T08:00:00.000Z',
  },
  {
    id: 'med-metformina',
    name: 'Metformina',
    doseDescription: '850 mg',
    intervalHours: 24,
    instructions: 'Tomar inmediatamente con el almuerzo para proteger la mucosa gástrica.',
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
    stock: 22,
    minStockAlert: 5,
    createdAt: '2026-10-29T08:00:00.000Z',
  },
  {
    id: 'med-atorvastatina',
    name: 'Atorvastatina',
    doseDescription: '20 mg',
    intervalHours: 24,
    instructions: 'Tomar antes de acostarse a dormir.',
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
    stock: 4,
    minStockAlert: 6,
    createdAt: '2026-10-29T08:00:00.000Z',
  },
];

export const INITIAL_SCHEDULE_TIMES: Record<string, string> = {
  'med-losartan': '08:00',
  'med-metformina': '13:00',
  'med-atorvastatina': '21:00',
};

export const INITIAL_LOGS: DoseLog[] = [
  {
    id: 'log-hist-1',
    medicineId: 'med-losartan',
    scheduledTime: '2026-10-28T08:00:00.000Z',
    takenTime: '2026-10-28T08:05:00.000Z',
    status: 'taken',
    registeredBy: 'patient',
  },
  {
    id: 'log-hist-2',
    medicineId: 'med-metformina',
    scheduledTime: '2026-10-28T13:00:00.000Z',
    takenTime: '2026-10-28T13:10:00.000Z',
    status: 'taken',
    registeredBy: 'patient',
  },
  {
    id: 'log-hist-3',
    medicineId: 'med-atorvastatina',
    scheduledTime: '2026-10-28T21:00:00.000Z',
    takenTime: '2026-10-28T21:15:00.000Z',
    status: 'taken',
    registeredBy: 'caregiver',
  },
];

export const DEFAULT_PROFILE: EmergencyProfile = {
  patientFullName: 'Manuel Jesús Alhua',
  age: 74,
  bloodType: 'O+',
  allergies: ['Penicilina', 'Ibuprofeno (AINEs)'],
  chronicConditions: ['Hipertensión Arterial Primaria', 'Diabetes Mellitus Tipo 2'],
  healthInsurance: 'EsSalud - Policlínico Yanahuara',
  emergencyContact: {
    name: 'María Alhua',
    relationship: 'Hija / Cuidadora Principal',
    phone: '+51 954 123 456',
  },
};

export function showNotice(title: string, message?: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert([title, message].filter(Boolean).join('\n\n'));
  } else {
    Alert.alert(title, message);
  }
}

export function askConfirmation(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  confirmText = 'Continuar',
  cancelText = 'Cancelar'
) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const ok = window.confirm([title, message].filter(Boolean).join('\n\n'));
    if (ok) {
      void onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    {
      text: confirmText,
      style: 'destructive',
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}
