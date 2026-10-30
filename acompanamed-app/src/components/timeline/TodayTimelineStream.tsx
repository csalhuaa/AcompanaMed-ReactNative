import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScheduledDoseItem } from '../../domain';
import { DoseTimelineCard } from './DoseTimelineCard';

interface Props {
  dailySchedule: ScheduledDoseItem[];
  expandedMedId: string;
  onToggleExpand: (id: string) => void;
  onTakeDose: (id: string) => void;
  onPostponeDose: (id: string) => void;
  adherencePercentage: number;
}

export const TodayTimelineStream: React.FC<Props> = ({
  dailySchedule,
  expandedMedId,
  onToggleExpand,
  onTakeDose,
  onPostponeDose,
  adherencePercentage,
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
          <Text style={styles.adherenceMiniBadgeLabel}>Adherencia</Text>
        </View>
      </View>

      {/* Hilo Cronológico de Dosis */}
      {dailySchedule.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="pill-off" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Sin Dosis Programadas</Text>
          <Text style={styles.emptyText}>
            No hay medicamentos agendados para el día de hoy.
          </Text>
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
              />
            );
          })}
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
});
