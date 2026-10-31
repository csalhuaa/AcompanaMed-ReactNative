import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Medicine, isStockLow, daysRemaining } from '../../domain';
import { PillVisualRenderer } from '../timeline/PillVisualRenderer';

interface Props {
  medicines: Medicine[];
  scheduleTimes: Record<string, string>;
  onOpenRestock: (med: Medicine) => void;
  onRequestDelete: (med: Medicine) => void;
  onEdit: (med: Medicine) => void;
  onOpenAddModal: () => void;
  onInspect?: (med: Medicine) => void;
}

export const MedicineInventoryPanel: React.FC<Props> = ({
  medicines,
  scheduleTimes,
  onOpenRestock,
  onRequestDelete,
  onEdit,
  onOpenAddModal,
  onInspect,
}) => {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.panelCard}>
        {/* Cabecera del Botiquín */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="medical-bag" size={22} color="#0F172A" />
              <Text style={styles.panelTitle}>Botiquín Familiar</Text>
            </View>
            <Text style={styles.panelSubtitle}>
              Gestión de stock, días de autonomía y alertas preventivas de compra
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

        {/* Resumen Global del Botiquín */}
        <View style={styles.overviewStatsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{medicines.length}</Text>
            <Text style={styles.statLabel}>Fármacos Activos</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#059669' }]}>
              {medicines.filter((m) => !isStockLow(m)).length}
            </Text>
            <Text style={styles.statLabel}>Stock Óptimo</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#DC2626' }]}>
              {medicines.filter((m) => isStockLow(m)).length}
            </Text>
            <Text style={styles.statLabel}>Por Reponer</Text>
          </View>
        </View>

        {/* Lista de Fármacos con Autonomía y Acciones Claras */}
        {medicines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="pill-off" size={40} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Botiquín Vacío</Text>
            <Text style={styles.emptySubtitle}>
              Presione el botón "Agregar" para registrar los medicamentos prescritos.
            </Text>
          </View>
        ) : (
          <View style={styles.itemList}>
            {medicines.map((med) => {
              const low = isStockLow(med);
              const days = daysRemaining(med.stock, 1);
              const progressRatio = Math.min(100, Math.round((med.stock / 30) * 100));

              let statusColor = '#059669'; // Verde
              let statusText = `${days} días (Óptimo)`;
              if (days < 5) {
                statusColor = '#DC2626'; // Rojo
                statusText = `${days} días restantes (Stock crítico)`;
              } else if (days <= 10) {
                statusColor = '#D97706'; // Ámbar
                statusText = `${days} días restantes (Reponer pronto)`;
              }

              return (
                <View key={med.id} style={styles.itemRow}>
                  {/* Fila Superior: Icono Anatómico y Datos */}
                  <View style={styles.itemTopRow}>
                    <View style={styles.pillBox}>
                      <PillVisualRenderer visualPill={med.visualPill} size="small" />
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.medName}>{med.name}</Text>
                      <Text style={styles.medDetail}>
                        {med.doseDescription} • Toma a las {scheduleTimes[med.id] || '08:00'}
                      </Text>
                    </View>

                    {/* Stock badge en números tabulares */}
                    <View style={[styles.stockBadgePill, { borderColor: statusColor }]}>
                      <Text style={[styles.stockBadgePillNumber, { color: statusColor }]}>
                        {med.stock}
                      </Text>
                      <Text style={styles.stockBadgePillUnit}>unid.</Text>
                    </View>
                  </View>

                  {/* Barra de Autonomía de Medicación */}
                  <View style={styles.gaugeContainer}>
                    <View style={styles.gaugeBarBackground}>
                      <View
                        style={[
                          styles.gaugeBarFill,
                          { width: `${progressRatio}%`, backgroundColor: statusColor },
                        ]}
                      />
                    </View>
                    <View style={styles.gaugeLabelsRow}>
                      <Text style={[styles.gaugeStatusLabel, { color: statusColor }]}>
                        {statusText}
                      </Text>
                      <Text style={styles.gaugeDaysRatio}>
                        Mínimo alerta: {med.minStockAlert}u
                      </Text>
                    </View>
                  </View>

                  {/* Fila Inferior: Botonera de Gestión en 2 Filas Espaciosas */}
                  <View style={styles.cardActionsGrid}>
                    {/* Fila 1: Acciones Operativas (Reponer Stock + Lupa/Foto) */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={styles.actionBtnRestock}
                        onPress={() => onOpenRestock(med)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={`Reponer unidades de ${med.name}`}
                      >
                        <MaterialCommunityIcons name="package-variant-closed-plus" size={17} color="#065F46" />
                        <Text style={styles.actionBtnRestockText}>Reponer Stock</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtnInspect}
                        onPress={() => onInspect && onInspect(med)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={`Inspeccionar pastilla y ver foto de ${med.name}`}
                      >
                        <MaterialCommunityIcons name="magnify-scan" size={17} color="#0369A1" />
                        <Text style={styles.actionBtnInspectText}>Lupa / Foto</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Fila 2: Gestión de la Prescripción (Editar Horario/Dosis + Retirar) */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={styles.actionBtnEdit}
                        onPress={() => onEdit(med)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={`Editar prescripción de ${med.name}`}
                      >
                        <MaterialCommunityIcons name="pencil-outline" size={16} color="#0F172A" />
                        <Text style={styles.actionBtnEditText}>Editar Horario</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtnDelete}
                        onPress={() => onRequestDelete(med)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Retirar ${med.name} del pastillero`}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
                        <Text style={styles.actionBtnDeleteText}>Retirar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
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
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitle: {
    fontSize: 17,
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
    gap: 6,
  },
  btnAddMedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overviewStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  itemList: {
    gap: 12,
  },
  itemRow: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillBox: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  medDetail: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  stockBadgePill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1.5,
    gap: 3,
  },
  stockBadgePillNumber: {
    fontSize: 16,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  stockBadgePillUnit: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  gaugeContainer: {
    gap: 4,
  },
  gaugeBarBackground: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  gaugeBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  gaugeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gaugeStatusLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  gaugeDaysRatio: {
    fontSize: 11,
    color: '#64748B',
  },
  cardActionsGrid: {
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnRestock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 6,
    minHeight: 42,
  },
  actionBtnRestockText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#065F46',
  },
  actionBtnInspect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 6,
    minHeight: 42,
  },
  actionBtnInspectText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0369A1',
  },
  actionBtnEdit: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 6,
    minHeight: 42,
  },
  actionBtnEditText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionBtnDelete: {
    flex: 0.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 6,
    minHeight: 42,
  },
  actionBtnDeleteText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#991B1B',
  },
});
