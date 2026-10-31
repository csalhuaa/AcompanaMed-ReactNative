import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActorRole } from '../../domain/types';
import { appStyles as styles } from '../../styles/appStyles';

interface Props {
  isDesktop: boolean;
  topInset: number;
  activeRole: ActorRole;
  patientFullName: string;
  isFamilyConnected: boolean;
  lastCloudSyncTime: string;
  desktopLayoutMode: 'mobile_shell' | 'desktop_split';
  setDesktopLayoutMode: (mode: 'mobile_shell' | 'desktop_split') => void;
  onOpenSettings: () => void;
}

export const AppHeader: React.FC<Props> = ({
  isDesktop,
  topInset,
  activeRole,
  patientFullName,
  isFamilyConnected,
  lastCloudSyncTime,
  desktopLayoutMode,
  setDesktopLayoutMode,
  onOpenSettings,
}) => {
  return (
    <View style={[styles.topAppHeader, { paddingTop: isDesktop ? 12 : topInset + 6 }]}>
      <View style={styles.headerTitleGroup}>
        <Text style={styles.appNameLabel}>AcompañaMed</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <MaterialCommunityIcons
            name={activeRole === 'patient' ? 'account-heart' : 'shield-account'}
            size={14}
            color={activeRole === 'patient' ? '#0284C7' : '#059669'}
          />
          <Text style={styles.patientSubLabel}>
            {activeRole === 'patient'
              ? `Modo Paciente (${patientFullName || 'Don Manuel'})`
              : `Modo Cuidador · ${patientFullName || 'Configure el perfil'}`}
          </Text>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#94A3B8' }} />
          <MaterialCommunityIcons
            name={isFamilyConnected && lastCloudSyncTime ? 'cloud-check' : 'cellphone'}
            size={12}
            color="#475569"
          />
          <Text style={{ fontSize: 10, color: '#059669', fontWeight: '700' }}>
            {isFamilyConnected && lastCloudSyncTime ? 'Enlace activo' : 'Guardado en este teléfono'}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {/* Selector de Modo en Desktop */}
        {isDesktop && (
          <View style={styles.desktopModeSelector}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                desktopLayoutMode === 'mobile_shell' && styles.modeButtonActive,
              ]}
              onPress={() => setDesktopLayoutMode('mobile_shell')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="cellphone"
                size={14}
                color={desktopLayoutMode === 'mobile_shell' ? '#0F172A' : '#64748B'}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  desktopLayoutMode === 'mobile_shell' && styles.modeButtonTextActive,
                ]}
              >
                Móvil
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                desktopLayoutMode === 'desktop_split' && styles.modeButtonActive,
              ]}
              onPress={() => setDesktopLayoutMode('desktop_split')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="monitor-dashboard"
                size={14}
                color={desktopLayoutMode === 'desktop_split' ? '#0F172A' : '#64748B'}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  desktopLayoutMode === 'desktop_split' && styles.modeButtonTextActive,
                ]}
              >
                PC Split
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botón Ajustes / Perfil */}
        <TouchableOpacity
          style={styles.btnHeaderSettings}
          onPress={onOpenSettings}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Configuración, cambio de rol y ajustes"
        >
          <MaterialCommunityIcons name="cog-outline" size={16} color="#0F172A" />
          <Text style={styles.btnHeaderSettingsText}>Ajustes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
