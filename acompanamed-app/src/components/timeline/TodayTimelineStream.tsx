import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScheduledDoseItem, Medicine } from '../../domain';
import { DoseTimelineCard } from './DoseTimelineCard';

interface Props {
  dailySchedule: ScheduledDoseItem[];
  expandedMedId: string;
  onToggleExpand: (id: string) => void;
  onTakeDose: (id: string) => void;
  onPostponeDose: (id: string) => void;
  adherencePercentage: number;
  onOpenAddMedicine?: () => void;
  onInspectMedicine?: (medicine: Medicine) => void;
  activeRole?: 'patient' | 'caregiver';
  onSwitchRole?: () => void;
}

export const TodayTimelineStream: React.FC<Props> = ({
  dailySchedule,
  expandedMedId,
  onToggleExpand,
  onTakeDose,
  onPostponeDose,
  adherencePercentage,
  onOpenAddMedicine,
  onInspectMedicine,
  activeRole,
  onSwitchRole,
}) => {
  const completedCount = dailySchedule.filter((d) => d.isTakenToday).length;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Banner de Saludo y Resumen Diario */}
      <View style={styles.todayHeroBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.todayHeroGreeting}>Plan de Hoy</Text>
          <Text style={styles.todayHeroSub}>
            {completedCount} de {dailySchedule.length} dosis completadas
          </Text>
        </View>
        <View style={styles.adherenceMiniBadge}>
          <Text style={styles.adherenceMiniBadgeText}>{adherencePercentage}%</Text>
          <Text style={styles.adherenceMiniBadgeLabel}>Progreso de hoy</Text>
        </View>
      </View>

      {/* Hilo Cronológico de Dosis */}
      {dailySchedule.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="pill-off" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Sin Medicamentos Registrados</Text>
          <Text style={styles.emptyText}>
            El botiquín está vacío. Agregue el primer medicamento recetado por el médico tratante.
          </Text>
          {onOpenAddMedicine && (
            <TouchableOpacity
              style={styles.btnAddFirstMed}
              onPress={onOpenAddMedicine}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="plus-circle" size={18} color="#FFFFFF" />
              <Text style={styles.btnAddFirstMedText}>Registrar Primer Medicamento</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.timelineStream}>
          {dailySchedule.map((item: ScheduledDoseItem, index: number) => {
            const isExpanded = item.medicine.id === expandedMedId;
            const isLast = index === dailySchedule.length - 1;

            return (
              <DoseTimelineCard
                key={item.medicine.id}
                item={item}
                isExpanded={isExpanded}
                isLast={isLast}
                onToggleExpand={() => onToggleExpand(item.medicine.id)}
                onTakeDose={onTakeDose}
                onPostponeDose={onPostponeDose}
                onInspectMedicine={onInspectMedicine}
              />
            );
          })}
        </View>
      )}

      {/* Enlace discreto para el cuidador al pie de pantalla */}
      {activeRole === 'patient' && onSwitchRole && (
        <View style={styles.caregiverSwitchFooter}>
          <TouchableOpacity
            style={styles.caregiverSwitchBtn}
            onPress={onSwitchRole}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Cambiar al modo de supervisión de cuidador"
          >
            <MaterialCommunityIcons name="shield-account-outline" size={14} color="#64748B" />
            <Text style={styles.caregiverSwitchText}>¿Es usted el cuidador? Toca para cambiar de modo</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 84,
  },
  caregiverSwitchFooter: {
    marginTop: 28,
    marginBottom: 20,
    alignItems: 'center',
  },
  caregiverSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  caregiverSwitchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  todayHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  todayHeroGreeting: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  todayHeroSub: {
    fontSize: 13,
    color: '#334155',
    marginTop: 2,
  },
  adherenceMiniBadge: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  adherenceMiniBadgeText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#065F46',
    fontVariant: ['tabular-nums'],
  },
  adherenceMiniBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  timelineStream: {
    gap: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
    textAlign: 'center',
  },
  btnAddFirstMed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 8,
    marginTop: 16,
  },
  btnAddFirstMedText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
