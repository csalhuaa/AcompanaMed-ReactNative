import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActorRole, AppNavTab, getVisibleTabsForRole } from '../../domain';

export type { AppNavTab };

interface Props {
  activeTab: AppNavTab;
  onSelectTab: (tab: AppNavTab) => void;
  activeRole?: ActorRole;
}

interface TabConfig {
  key: AppNavTab;
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  accessibilityLabel: string;
}

const TABS: TabConfig[] = [
  {
    key: 'today',
    label: 'Hoy',
    iconName: 'pill',
    accessibilityLabel: 'Pestaña Hoy, plan diario de medicación',
  },
  {
    key: 'caregiver',
    label: 'Cuidador',
    iconName: 'chart-timeline-variant',
    accessibilityLabel: 'Pestaña Cuidador, panel de supervisión y adherencia',
  },
  {
    key: 'stock',
    label: 'Botiquín',
    iconName: 'medical-bag',
    accessibilityLabel: 'Pestaña Botiquín, inventario y reposición de dosis',
  },
  {
    key: 'emergency',
    label: 'Emergencia',
    iconName: 'shield-alert-outline',
    accessibilityLabel: 'Pestaña Emergencia, ficha médica hospitalaria ICE',
  },
];

export const BottomNavBar: React.FC<Props> = ({ activeTab, onSelectTab, activeRole = 'caregiver' }) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);

  const allowedTabs = new Set(getVisibleTabsForRole(activeRole));
  const visibleTabs = TABS.filter((tab) => allowedTabs.has(tab.key));
  const isPatient = activeRole === 'patient';

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]} accessibilityRole="tablist">
      {visibleTabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabItem,
              isPatient && styles.tabItemPatient,
              isActive && styles.tabItemActive,
            ]}
            onPress={() => onSelectTab(tab.key)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityLabel={tab.accessibilityLabel}
            accessibilityState={{ selected: isActive }}
          >
            <MaterialCommunityIcons
              name={tab.iconName}
              size={isPatient ? 26 : 22}
              color={isActive ? '#0F172A' : '#334155'}
            />
            <Text
              style={[
                styles.tabLabel,
                isPatient && styles.tabLabelPatient,
                isActive && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    minHeight: 48,
  },
  tabItemPatient: {
    minHeight: 54,
    paddingVertical: 8,
  },
  tabItemActive: {
    backgroundColor: '#F1F5F9',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
  },
  tabLabelPatient: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
});
