import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Medicine, isStockLow, daysRemaining } from '../../domain';

interface Props {
  medicines: Medicine[];
  scheduleTimes: Record<string, string>;
  onRestock: (medId: string) => void;
  onDelete: (medId: string, name: string) => void;
  onOpenAddModal: () => void;
}

export const MedicineInventoryPanel: React.FC<Props> = ({
  medicines,
  scheduleTimes,
  onRestock,
  onDelete,
  onOpenAddModal,
}) => {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.panelCard}>
        {/* Cabecera del Panel */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.panelTitle}>Botiquín Familiar</Text>
            <Text style={styles.panelSubtitle}>
              Control de existencias y autonomía en días de tratamiento
            </Text>
          </View>
          <TouchableOpacity
            style={styles.btnAddMed}
            onPress={onOpenAddModal}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Agregar nuevo medicamento al pastillero"
            accessibilityHint="Abre el formulario para registrar un nuevo fármaco con su horario y dosis"
          >
            <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.btnAddMedText}>Agregar</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Medicamentos en Stock */}
        <View style={styles.itemList}>
          {medicines.map((med) => {
            const low = isStockLow(med);
            const days = daysRemaining(med.stock, 1);

            return (
              <View key={med.id} style={styles.itemRow}>
                {/* Indicador de Forma/Color */}
                <View
                  style={[
                    styles.shapeDisc,
                    { borderColor: med.visualPill.colorHex },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      med.visualPill.shape === 'capsule'
                        ? 'pill'
                        : med.visualPill.shape === 'oval'
                        ? 'circle-double'
                        : 'checkbox-blank-circle'
                    }
                    size={18}
                    color={med.visualPill.colorHex}
                  />
                </View>

                {/* Datos del Fármaco */}
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={styles.medName}>{med.name}</Text>
                  <Text style={styles.medDetail}>
                    {med.doseDescription} • Toma a las {scheduleTimes[med.id] || '08:00'}
                  </Text>
                  <Text
                    style={[
                      styles.stockBadge,
                      low && styles.stockBadgeLow,
                    ]}
                  >
                    {med.stock} unidades ({days} días de medicación)
                  </Text>
                </View>

                {/* Acciones */}
                <View style={styles.actionsGroup}>
                  <TouchableOpacity
                    style={styles.btnRestock}
                    onPress={() => onRestock(med.id)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Añadir 30 unidades al stock de ${med.name}`}
                    accessibilityHint="Incrementa el inventario en 30 unidades"
                  >
                    <MaterialCommunityIcons name="plus" size={14} color="#059669" />
                    <Text style={styles.btnRestockText}>+30</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnDelete}
                    onPress={() => onDelete(med.id, med.name)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Retirar ${med.name} del pastillero familiar`}
                    accessibilityHint="Abre confirmación para retirar el fármaco del pastillero"
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={18}
                      color="#DC2626"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 84,
  },
  panelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  panelSubtitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    lineHeight: 18,
  },
  btnAddMed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 6,
    gap: 4,
  },
  btnAddMedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemList: {
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shapeDisc: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  medDetail: {
    fontSize: 11,
    color: '#334155',
    marginTop: 1,
  },
  stockBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 3,
  },
  stockBadgeLow: {
    color: '#DC2626',
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnRestock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 2,
    minHeight: 40,
  },
  btnRestockText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  btnDelete: {
    padding: 8,
    minHeight: 40,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
