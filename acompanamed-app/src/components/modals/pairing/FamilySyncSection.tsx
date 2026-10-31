import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ConnectedDevice, formatDeviceActivityStatus } from '../../../infrastructure';
import { pairingStyles as styles } from './pairingStyles';

interface Props {
  effectiveFamilyCode: string;
  lastSyncTime?: string;
  pairingTab: 'qr' | 'code';
  setPairingTab: (tab: 'qr' | 'code') => void;
  isLoadingQr: boolean;
  qrDataUrl: string;
  onCopyDirectLink: () => void;
  onCopyCode: () => void;
  onActivateFamilyCode: () => void;
  isConnecting: boolean;
  isSyncing?: boolean;
  connectedDevices: ConnectedDevice[];
  isLoadingDevices: boolean;
  currentDeviceId?: string;
  onRefreshDevices: () => void;
  onRevokeDevice: (device: ConnectedDevice) => void;
  enteredPairingCode: string;
  setEnteredPairingCode: (code: string) => void;
  onConnectCaregiver: () => void;
  onOpenScanner: () => void;
  pairingSuccessMsg: string;
  activeRole?: 'patient' | 'caregiver';
}

export const FamilySyncSection: React.FC<Props> = ({
  effectiveFamilyCode,
  lastSyncTime,
  pairingTab,
  setPairingTab,
  isLoadingQr,
  qrDataUrl,
  onCopyDirectLink,
  onCopyCode,
  onActivateFamilyCode,
  isConnecting,
  isSyncing,
  connectedDevices,
  isLoadingDevices,
  currentDeviceId,
  onRefreshDevices,
  onRevokeDevice,
  enteredPairingCode,
  setEnteredPairingCode,
  onConnectCaregiver,
  onOpenScanner,
  pairingSuccessMsg,
  activeRole,
}) => {
  return (
    <View style={styles.sectionBox}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="cellphone-link" size={20} color="#0284C7" />
        <Text style={styles.sectionTitle}>1. Enlace Familiar Multi-Dispositivo</Text>
      </View>

      <Text style={styles.sectionDesc}>
        Conecte el teléfono de la cuidadora o hijos al de Don Manuel para recibir confirmaciones de tomas en vivo, supervisar el stock y gestionar el botiquín en tiempo real.
      </Text>

      {/* Selector de Modo: QR vs Código */}
      <View style={styles.pairingTabRow}>
        <TouchableOpacity
          style={[styles.pairingTabBtn, pairingTab === 'qr' && styles.pairingTabBtnActive]}
          onPress={() => setPairingTab('qr')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={16}
            color={pairingTab === 'qr' ? '#FFFFFF' : '#475569'}
          />
          <Text style={[styles.pairingTabBtnText, pairingTab === 'qr' && styles.pairingTabBtnTextActive]}>
            Código QR
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pairingTabBtn, pairingTab === 'code' && styles.pairingTabBtnActive]}
          onPress={() => setPairingTab('code')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="form-textbox"
            size={16}
            color={pairingTab === 'code' ? '#FFFFFF' : '#475569'}
          />
          <Text style={[styles.pairingTabBtnText, pairingTab === 'code' && styles.pairingTabBtnTextActive]}>
            Código de texto
          </Text>
        </TouchableOpacity>
      </View>

      {pairingTab === 'qr' ? (
        <View style={styles.qrContainer}>
          {isLoadingQr ? (
            <ActivityIndicator size="large" color="#0284C7" style={{ marginVertical: 40 }} />
          ) : qrDataUrl ? (
            <Image source={{ uri: qrDataUrl }} style={styles.qrImage} resizeMode="contain" />
          ) : null}

          {effectiveFamilyCode ? (
            <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700' }}>CÓDIGO DE ENLACE:</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0284C7', letterSpacing: 1 }}>
                {effectiveFamilyCode}
              </Text>
            </View>
          ) : null}

          <Text style={styles.qrHintText}>
            Apunte con la cámara del celular hacia este código QR para abrir y conectar AcompañaMed de forma directa.
          </Text>

          <TouchableOpacity style={styles.btnCopyLink} onPress={onCopyDirectLink} activeOpacity={0.85}>
            <MaterialCommunityIcons name="link-variant" size={16} color="#0284C7" />
            <Text style={styles.btnCopyLinkText}>Copiar enlace directo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.pairingCodeCard}>
          <Text style={styles.pairingCodeLabel}>CÓDIGO ÚNICO DE ESTE PACIENTE:</Text>
          <Text style={styles.pairingCodeValue}>{effectiveFamilyCode}</Text>
          {lastSyncTime ? (
            <Text style={{ fontSize: 10, color: '#38BDF8', marginTop: 2, marginBottom: 6 }}>
              Sincronizado en la nube: {lastSyncTime}
            </Text>
          ) : null}
          <TouchableOpacity style={styles.btnCopyCode} onPress={onCopyCode} activeOpacity={0.85}>
            <MaterialCommunityIcons name="content-copy" size={16} color="#FFFFFF" />
            <Text style={styles.btnCopyCodeText}>Copiar código familiar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnCopyCode}
            disabled={isConnecting || isSyncing}
            accessibilityRole="button"
            onPress={onActivateFamilyCode}
          >
            <Text style={styles.btnCopyCodeText}>
              {isConnecting ? 'Conectando…' : 'Activar enlace de este botiquín'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de Dispositivos Conectados */}
      <View style={styles.devicesHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="devices" size={18} color="#0284C7" />
          <Text style={styles.devicesTitle}>
            Dispositivos Vinculados ({connectedDevices.length})
          </Text>
        </View>
        <TouchableOpacity
          onPress={onRefreshDevices}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="refresh" size={16} color="#0284C7" />
          <Text style={{ fontSize: 11, color: '#0284C7', fontWeight: '700' }}>Actualizar</Text>
        </TouchableOpacity>
      </View>

      {isLoadingDevices ? (
        <ActivityIndicator size="small" color="#0284C7" style={{ marginVertical: 12 }} />
      ) : connectedDevices.length === 0 ? (
        <View style={styles.emptyDevicesCard}>
          <MaterialCommunityIcons name="cellphone-information" size={20} color="#94A3B8" />
          <Text style={styles.emptyDevicesText}>
            Aún no hay otros dispositivos registrados. Escanee el código QR o ingrese el código desde el otro teléfono para vincularlo.
          </Text>
        </View>
      ) : (
        connectedDevices.map((dev) => {
          const isCurrent = dev.deviceId === currentDeviceId;
          const status = formatDeviceActivityStatus(dev.lastSeen);
          return (
            <View key={dev.deviceId} style={styles.deviceCard}>
              <View style={styles.deviceLeftCol}>
                <View style={styles.deviceIconCircle}>
                  <MaterialCommunityIcons
                    name={dev.role === 'patient' ? 'account-heart' : 'shield-account'}
                    size={20}
                    color={dev.role === 'patient' ? '#0284C7' : '#059669'}
                  />
                </View>
                <View style={styles.deviceInfoCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={[styles.deviceNameText, { flexShrink: 1 }]}>{dev.deviceName}</Text>
                    {isCurrent && (
                      <View style={styles.thisDeviceBadge}>
                        <Text style={styles.thisDeviceText}>Este celular</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.deviceMetaText}>
                    {dev.role === 'patient' ? 'Paciente' : 'Cuidador'} · {dev.platform || 'Móvil'}
                  </Text>
                </View>
              </View>

              <View style={styles.deviceRightCol}>
                <View style={[styles.deviceStatusBadge, { backgroundColor: `${status.badgeColor}15` }]}>
                  <View style={[styles.statusDot, { backgroundColor: status.badgeColor }]} />
                  <Text style={[styles.deviceStatusText, { color: status.badgeColor }]}>
                    {status.statusLabel}
                  </Text>
                </View>
                {!isCurrent && (
                  <TouchableOpacity
                    style={styles.btnRevokeDevice}
                    onPress={() => onRevokeDevice(dev)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.btnRevokeDeviceText}>Desvincular</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
      )}

      {/* Input para conectar desde el celular del cuidador */}
      {activeRole !== 'patient' && (
        <View style={styles.connectCaregiverBox}>
          <Text style={styles.inputLabel}>Enlazar este teléfono al paciente:</Text>
          <TextInput
            style={styles.textInputFull}
            placeholder="Ej. MED-MANU-74"
            placeholderTextColor="#94A3B8"
            value={enteredPairingCode}
            onChangeText={setEnteredPairingCode}
            autoCapitalize="characters"
          />
          <View style={styles.connectActionRow}>
            <TouchableOpacity
              style={styles.btnScanCamera}
              onPress={onOpenScanner}
              activeOpacity={0.85}
              accessibilityLabel="Escanear código QR con la cámara"
            >
              <MaterialCommunityIcons name="camera-outline" size={16} color="#0284C7" />
              <Text style={styles.btnScanCameraText}>Escanear QR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnConnect, isConnecting && { opacity: 0.6 }]}
              onPress={onConnectCaregiver}
              disabled={isConnecting || !enteredPairingCode.trim()}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="link-variant" size={16} color="#FFFFFF" />
              <Text style={styles.btnConnectText}>
                {isConnecting ? 'Conectando…' : 'Conectar'}
              </Text>
            </TouchableOpacity>
          </View>
          {pairingSuccessMsg ? (
            <Text style={styles.pairingSuccessText}>{pairingSuccessMsg}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
};
