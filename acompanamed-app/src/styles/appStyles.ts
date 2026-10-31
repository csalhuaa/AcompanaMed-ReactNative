import { StyleSheet } from 'react-native';

export const appStyles = StyleSheet.create({
  // CANVAS EXTERIOR DE ESCRITORIO
  desktopOuterCanvas: {
    flex: 1,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // CHASIS DE LA APLICACIÓN (RESPONSIVE SHELL)
  appShellFrame: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F8FAFC',
  },
  appShellFrameLarge: {
    maxWidth: 480,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  appShellFrameSplit: {
    maxWidth: 1040,
  },

  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },

  // CABECERA SUPERIOR
  topAppHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitleGroup: {
    gap: 2,
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  appNameLabel: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  patientSubLabel: {
    fontSize: 11,
    color: '#64748B',
  },

  // Selector de Rol Activo (Paciente vs Cuidador)
  roleSelectorPill: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 2,
  },
  roleOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    gap: 3,
  },
  roleOptionBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  roleOptionText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  roleOptionTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },

  // Selector de Modo Desktop
  desktopModeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    gap: 4,
  },
  modeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  modeButtonText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },

  btnHeaderSettings: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnHeaderSettingsText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },

  clockHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clockHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },

  mainContainer: {
    flex: 1,
  },

  // PROTECCIÓN DE ROL: PANTALLA DE ACCESO RESTRINGIDO
  protectedRoleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  protectedRoleTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  protectedRoleSubtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 360,
  },
  btnUnlockRole: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 6,
    gap: 6,
    marginTop: 6,
  },
  btnUnlockRoleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ESTRUCTURA SPLIT DE 2 COLUMNAS PARA ESCRITORIO
  splitDesktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },
  splitLeftColumn: {
    flex: 5.5,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  columnHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  columnHeaderTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  splitVerticalDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  splitRightColumn: {
    flex: 4.5,
    backgroundColor: '#FFFFFF',
  },
  splitSubTabsHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    padding: 6,
    gap: 6,
  },
  splitSubTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  splitSubTabItemActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  splitSubTabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  splitSubTabLabelActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
});
