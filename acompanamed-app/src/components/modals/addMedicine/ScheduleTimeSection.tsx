import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHorizontalScroll } from '../../../hooks';
import { addMedicineStyles as styles } from '../addMedicineStyles';

export interface ScheduleTimeSectionProps {
  scheduleTime: string;
  onChangeScheduleTime: (newTime: string) => void;
  error?: string;
}

export const ScheduleTimeSection: React.FC<ScheduleTimeSectionProps> = ({
  scheduleTime,
  onChangeScheduleTime,
  error,
}) => {
  const pautasScroll = useHorizontalScroll();

  const [currentHour = '08', currentMinute = '00'] = scheduleTime.split(':');

  const adjustHour = (delta: number) => {
    let h = parseInt(currentHour, 10) + delta;
    if (h < 0) h = 23;
    if (h > 23) h = 0;
    const newH = h.toString().padStart(2, '0');
    onChangeScheduleTime(`${newH}:${currentMinute}`);
  };

  const adjustMinute = (delta: number) => {
    let m = parseInt(currentMinute, 10) + delta;
    if (m < 0) m = 55;
    if (m > 55) m = 0;
    const newM = m.toString().padStart(2, '0');
    onChangeScheduleTime(`${currentHour}:${newM}`);
  };

  return (
    <View style={styles.formGroup}>
      <Text style={styles.formInputLabel}>Horario de la Toma Diaria</Text>

      <View style={[styles.timeSelectorCard, !!error && styles.invalidTimeCard]}>
        {/* 1. Selector de Hora y Minutos */}
        <View style={styles.timeInputsRow}>
          {/* Selector de Hora */}
          <View style={styles.timeUnitCol}>
            <Text style={styles.timeUnitLabel}>Hora</Text>
            <View style={styles.timeNumberBox}>
              <TouchableOpacity
                style={styles.timeArrowBtn}
                onPress={() => adjustHour(-1)}
                accessibilityRole="button"
                accessibilityLabel="Restar 1 hora"
              >
                <MaterialCommunityIcons name="minus" size={18} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.timeBigDigit}>{currentHour}</Text>
              <TouchableOpacity
                style={styles.timeArrowBtn}
                onPress={() => adjustHour(1)}
                accessibilityRole="button"
                accessibilityLabel="Sumar 1 hora"
              >
                <MaterialCommunityIcons name="plus" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.timeColonSeparator}>:</Text>

          {/* Selector de Minutos */}
          <View style={styles.timeUnitCol}>
            <Text style={styles.timeUnitLabel}>Minuto</Text>
            <View style={styles.timeNumberBox}>
              <TouchableOpacity
                style={styles.timeArrowBtn}
                onPress={() => adjustMinute(-5)}
                accessibilityRole="button"
                accessibilityLabel="Restar 5 minutos"
              >
                <MaterialCommunityIcons name="minus" size={18} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.timeBigDigit}>{currentMinute}</Text>
              <TouchableOpacity
                style={styles.timeArrowBtn}
                onPress={() => adjustMinute(5)}
                accessibilityRole="button"
                accessibilityLabel="Sumar 5 minutos"
              >
                <MaterialCommunityIcons name="plus" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 2. Selector nativo del navegador */}
        {Platform.OS === 'web' && (
          <View style={styles.nativeTimeBar}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#0284C7" />
            <Text style={styles.nativeTimeBarLabel}>O elija con el reloj del sistema:</Text>
            {/* @ts-ignore */}
            <input
              type="time"
              value={scheduleTime}
              onChange={(e: any) => {
                if (e.target.value) {
                  onChangeScheduleTime(e.target.value);
                }
              }}
              style={{
                height: 36,
                fontSize: 14,
                fontWeight: '700',
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #0284C7',
                borderRadius: 6,
                padding: '0 8px',
                cursor: 'pointer',
                outline: 'none',
              }}
            />
          </View>
        )}

        {/* 3. Carrusel horizontal de Pautas Habituales (1 toque) */}
        <View style={styles.quickTimeChipsContainer}>
          <View style={styles.carouselHeaderRow}>
            <Text style={styles.quickTimeChipsTitle}>Pautas habituales (1 toque):</Text>
            <View style={styles.carouselNavRow}>
              <TouchableOpacity
                style={styles.btnCarouselNav}
                onPress={() => pautasScroll.scrollBy(-140)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Deslizar pautas hacia la izquierda"
              >
                <MaterialCommunityIcons name="chevron-left" size={16} color="#0284C7" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnCarouselNav}
                onPress={() => pautasScroll.scrollBy(140)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Deslizar pautas hacia la derecha"
              >
                <MaterialCommunityIcons name="chevron-right" size={16} color="#0284C7" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            ref={pautasScroll.scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickTimeChipsScroll}
            {...(pautasScroll.webHandlers as any)}
          >
            {[
              { time: '08:00', label: '08:00 Desayuno' },
              { time: '13:00', label: '13:00 Almuerzo' },
              { time: '18:00', label: '18:00 Tarde' },
              { time: '20:00', label: '20:00 Noche' },
              { time: '22:00', label: '22:00 Dormir' },
            ].map((preset) => {
              const isSelected = scheduleTime === preset.time;
              return (
                <TouchableOpacity
                  key={preset.time}
                  style={[styles.quickPresetChip, isSelected && styles.quickPresetChipActive]}
                  onPress={() => {
                    if (pautasScroll.isDragging.current) return;
                    onChangeScheduleTime(preset.time);
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Pauta horaria ${preset.label}`}
                >
                  <MaterialCommunityIcons
                    name={isSelected ? 'check-circle' : 'clock-outline'}
                    size={12}
                    color={isSelected ? '#FFFFFF' : '#0284C7'}
                  />
                  <Text style={[styles.quickPresetChipText, isSelected && styles.quickPresetChipTextActive]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
};
