import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { pairingStyles as styles } from './pairingStyles';

interface Props {
  activeRole: 'patient' | 'caregiver';
  onSelectRole: (role: 'patient' | 'caregiver') => void;
}

export const RoleSelectorSection: React.FC<Props> = ({ activeRole, onSelectRole }) => {
  return (
    <View style={styles.sectionBox}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="badge-account-horizontal" size={20} color="#7C3AED" />
        <Text style={styles.sectionTitle}>Modo de Operación en este Dispositivo</Text>
      </View>

      <Text style={styles.sectionDesc}>
        Indique quién utiliza este teléfono para adaptar los botones y niveles de seguridad:
      </Text>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <TouchableOpacity
          style={[styles.roleCard, activeRole === 'patient' && styles.roleCardActive]}
          onPress={() => onSelectRole('patient')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="account-heart"
            size={28}
            color={activeRole === 'patient' ? '#0284C7' : '#64748B'}
          />
          <Text style={[styles.roleCardTitle, activeRole === 'patient' && styles.roleCardTitleActive]}>
            Soy el Paciente
          </Text>
          <Text style={styles.roleCardSub}>
            Botones gigantes (54dp), lectura por voz y botiquín protegido.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, activeRole === 'caregiver' && styles.roleCardActive]}
          onPress={() => onSelectRole('caregiver')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="shield-check"
            size={28}
            color={activeRole === 'caregiver' ? '#059669' : '#64748B'}
          />
          <Text style={[styles.roleCardTitle, activeRole === 'caregiver' && styles.roleCardTitleActive]}>
            Soy el Cuidador
          </Text>
          <Text style={styles.roleCardSub}>
            Gestión total del botiquín, informes clínicos y adherencia.
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
