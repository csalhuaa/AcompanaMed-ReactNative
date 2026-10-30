import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActorRole } from '../../domain';

interface Props {
  visible: boolean;
  onFinishOnboarding: (data: {
    role: ActorRole;
    startMode: 'empty' | 'demo';
    patientName: string;
  }) => void;
}

export const OnboardingModal: React.FC<Props> = ({
  visible,
  onFinishOnboarding,
}) => {
  const [selectedRole, setSelectedRole] = useState<ActorRole>('patient');
  const [startMode, setStartMode] = useState<'empty' | 'demo'>('empty');
  const [patientName, setPatientName] = useState('');

  const handleStart = () => {
    onFinishOnboarding({
      role: selectedRole,
      startMode,
      patientName: patientName.trim() || (startMode === 'demo' ? 'Manuel Jesús Alhua' : 'Mi Paciente'),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Cabecera de Bienvenida */}
          <View style={styles.headerBox}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="pill" size={32} color="#0284C7" />
            </View>
            <Text style={styles.appTitle}>AcompañaMed</Text>
            <Text style={styles.welcomeSubtitle}>
              Asistente de Adherencia Farmacológica y Cuidado Familiar
            </Text>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* PASO 1: SELECCIONAR ROL */}
            <Text style={styles.stepTitle}>1. ¿Quién usará principalmente este teléfono?</Text>
            <View style={styles.roleSelectionRow}>
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  selectedRole === 'patient' && styles.roleCardActive,
                ]}
                onPress={() => setSelectedRole('patient')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="account-heart"
                  size={30}
                  color={selectedRole === 'patient' ? '#0284C7' : '#64748B'}
                />
                <Text
                  style={[
                    styles.roleCardTitle,
                    selectedRole === 'patient' && styles.roleCardTitleActive,
                  ]}
                >
                  Paciente / Senior
                </Text>
                <Text style={styles.roleCardDesc}>
                  Botones grandes de auxilio, lectura por voz y botiquín protegido.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleCard,
                  selectedRole === 'caregiver' && styles.roleCardActive,
                ]}
                onPress={() => setSelectedRole('caregiver')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="shield-check"
                  size={30}
                  color={selectedRole === 'caregiver' ? '#059669' : '#64748B'}
                />
                <Text
                  style={[
                    styles.roleCardTitle,
                    selectedRole === 'caregiver' && styles.roleCardTitleActive,
                  ]}
                >
                  Cuidador / Familiar
                </Text>
                <Text style={styles.roleCardDesc}>
                  Control total de botiquín, informes gerontológicos y telemetría.
                </Text>
              </TouchableOpacity>
            </View>

            {/* PASO 2: MODO DE INICIO (REAL VS DEMO) */}
            <Text style={[styles.stepTitle, { marginTop: 18 }]}>
              2. ¿Cómo desea configurar los medicamentos iniciales?
            </Text>

            <TouchableOpacity
              style={[
                styles.modeCard,
                startMode === 'empty' && styles.modeCardActive,
              ]}
              onPress={() => setStartMode('empty')}
              activeOpacity={0.85}
            >
              <View style={styles.modeCardHeader}>
                <MaterialCommunityIcons
                  name="plus-circle-outline"
                  size={20}
                  color={startMode === 'empty' ? '#0284C7' : '#64748B'}
                />
                <Text
                  style={[
                    styles.modeCardTitle,
                    startMode === 'empty' && styles.modeCardTitleActive,
                  ]}
                >
                  Iniciar con Botiquín Vacío (Uso Real)
                </Text>
              </View>
              <Text style={styles.modeCardDesc}>
                Recomendado para pacientes reales. Comienza desde cero para ingresar los fármacos de su prescripción médica.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeCard,
                startMode === 'demo' && styles.modeCardActive,
                { marginTop: 10 },
              ]}
              onPress={() => setStartMode('demo')}
              activeOpacity={0.85}
            >
              <View style={styles.modeCardHeader}>
                <MaterialCommunityIcons
                  name="flask-outline"
                  size={20}
                  color={startMode === 'demo' ? '#0284C7' : '#64748B'}
                />
                <Text
                  style={[
                    styles.modeCardTitle,
                    startMode === 'demo' && styles.modeCardTitleActive,
                  ]}
                >
                  Cargar Caso Clínico de Ejemplo (Don Manuel)
                </Text>
              </View>
              <Text style={styles.modeCardDesc}>
                Carga 3 medicamentos de prueba (Losartán, Metformina, Atorvastatina) para evaluar el sistema de inmediato.
              </Text>
            </TouchableOpacity>

            {/* PASO 3: NOMBRE DEL PACIENTE */}
            <Text style={[styles.stepTitle, { marginTop: 18 }]}>
              3. Nombre del paciente:
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={startMode === 'demo' ? 'Manuel Jesús Alhua' : 'Ej. Rosa Martínez'}
              placeholderTextColor="#94A3B8"
              value={patientName}
              onChangeText={setPatientName}
            />

            {/* BOTÓN COMENZAR */}
            <TouchableOpacity
              style={styles.btnStart}
              onPress={handleStart}
              activeOpacity={0.85}
            >
              <Text style={styles.btnStartText}>Comenzar a usar AcompañaMed</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: '100%',
    maxWidth: 520,
    maxHeight: '92%',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  headerBox: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  scrollBody: {
    padding: 18,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  roleSelectionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  roleCardActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  roleCardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#334155',
    textAlign: 'center',
  },
  roleCardTitleActive: {
    color: '#0284C7',
  },
  roleCardDesc: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 14,
  },
  modeCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  modeCardActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  modeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeCardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#334155',
  },
  modeCardTitleActive: {
    color: '#0284C7',
  },
  modeCardDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    paddingLeft: 28,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  btnStart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  btnStartText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
