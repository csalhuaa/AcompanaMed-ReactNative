import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { pairingStyles as styles } from './pairingStyles';

interface Props {
  onClearDemoData: () => void;
  onRestoreDemoData: () => void;
}

export const DemoScenariosSection: React.FC<Props> = ({
  onClearDemoData,
  onRestoreDemoData,
}) => {
  return (
    <View style={styles.sectionBox}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="database-sync" size={20} color="#D97706" />
        <Text style={styles.sectionTitle}>3. Selector de Escenario: ¿Uso Real o Demo?</Text>
      </View>

      <Text style={styles.sectionDesc}>
        Si desea usar la app con un paciente real, puede vaciar los 3 medicamentos de prueba y registrar su propia receta. En cualquier momento puede restaurar el caso de prueba para el profesor.
      </Text>

      <View style={styles.actionButtonGroup}>
        <TouchableOpacity
          style={[styles.btnScenario, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
          onPress={onClearDemoData}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#DC2626" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.btnScenarioTitle, { color: '#991B1B' }]}>
              Vaciar Datos Demo (Empezar desde cero)
            </Text>
            <Text style={styles.btnScenarioSub}>
              Borra los fármacos de ejemplo para cargar una receta médica real.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnScenario, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}
          onPress={onRestoreDemoData}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="refresh" size={20} color="#0284C7" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.btnScenarioTitle, { color: '#0369A1' }]}>
              Restaurar Caso Demo (Don Manuel - 3 fármacos)
            </Text>
            <Text style={styles.btnScenarioSub}>
              Recarga el escenario clínico geriátrico para evaluación académica.
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};
