import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { pairingStyles as styles } from './pairingStyles';

interface Props {
  patientName: string;
  setPatientName: (name: string) => void;
  age: string;
  setAge: (age: string) => void;
  bloodType: string;
  setBloodType: (bloodType: string) => void;
  allergiesText: string;
  setAllergiesText: (text: string) => void;
  caregiverName: string;
  setCaregiverName: (name: string) => void;
  caregiverPhone: string;
  setCaregiverPhone: (phone: string) => void;
  onSaveProfile: () => void;
}

export const PatientProfileSection: React.FC<Props> = ({
  patientName,
  setPatientName,
  age,
  setAge,
  bloodType,
  setBloodType,
  allergiesText,
  setAllergiesText,
  caregiverName,
  setCaregiverName,
  caregiverPhone,
  setCaregiverPhone,
  onSaveProfile,
}) => {
  return (
    <View style={styles.sectionBox}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="account-edit" size={20} color="#059669" />
        <Text style={styles.sectionTitle}>2. Personalizar Paciente y Contacto Real</Text>
      </View>

      <Text style={styles.sectionDesc}>
        Configure los nombres y números reales para que la aplicación deje de ser una demo genérica y se adapte a su familiar.
      </Text>

      <View style={styles.formRow}>
        <View style={{ flex: 2 }}>
          <Text style={styles.inputLabel}>Nombre del Paciente:</Text>
          <TextInput
            style={styles.textInput}
            value={patientName}
            onChangeText={setPatientName}
            placeholder="Ej. Don Manuel / Carlos Salhua"
            placeholderTextColor="#94A3B8"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>Edad:</Text>
          <TextInput
            style={styles.textInput}
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            placeholder="82"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>Grupo Sanguíneo:</Text>
          <TextInput
            style={styles.textInput}
            value={bloodType}
            onChangeText={setBloodType}
            placeholder="O+ / A+"
            placeholderTextColor="#94A3B8"
          />
        </View>
        <View style={{ flex: 2 }}>
          <Text style={styles.inputLabel}>Alergias Severas (separadas por coma):</Text>
          <TextInput
            style={styles.textInput}
            value={allergiesText}
            onChangeText={setAllergiesText}
            placeholder="Penicilina, Sulfas"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>Nombre del Cuidador:</Text>
          <TextInput
            style={styles.textInput}
            value={caregiverName}
            onChangeText={setCaregiverName}
            placeholder="Ej. María Alhua"
            placeholderTextColor="#94A3B8"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>Teléfono WhatsApp:</Text>
          <TextInput
            style={styles.textInput}
            value={caregiverPhone}
            onChangeText={setCaregiverPhone}
            keyboardType="phone-pad"
            placeholder="+51 954 123 456"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.btnSaveProfile} onPress={onSaveProfile} activeOpacity={0.85}>
        <MaterialCommunityIcons name="content-save" size={18} color="#FFFFFF" />
        <Text style={styles.btnSaveProfileText}>Guardar Datos en Base de Datos Local</Text>
      </TouchableOpacity>
    </View>
  );
};
