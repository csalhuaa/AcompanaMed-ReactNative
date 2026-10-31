import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import jsQR from 'jsqr';
import { extractCodeFromQrPayload } from '../../infrastructure/QrCodeService';

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (extractedCode: string) => void;
}

type CameraStatus = 'initializing' | 'active' | 'permission_denied' | 'unavailable' | 'unsupported';

export const CameraQrScannerModal: React.FC<Props> = ({
  visible,
  onClose,
  onScanSuccess,
}) => {
  const [status, setStatus] = useState<CameraStatus>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const isScannedRef = useRef<boolean>(false);

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignorar errores de detención
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleDetectedCode = (rawPayload: string) => {
    if (isScannedRef.current) return;
    const cleanCode = extractCodeFromQrPayload(rawPayload);
    if (!cleanCode) return;

    isScannedRef.current = true;
    stopCamera();
    onScanSuccess(cleanCode);
  };

  useEffect(() => {
    if (!visible) {
      stopCamera();
      setStatus('initializing');
      setErrorMessage('');
      isScannedRef.current = false;
      return;
    }

    isScannedRef.current = false;

    if (Platform.OS !== 'web' || typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      return;
    }

    let isCancelled = false;
    setStatus('initializing');

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch {
            // Error de reproducción automática
          }
        }

        setStatus('active');

        // Bucle de lectura de frames cada 200 ms
        const offscreenCanvas = document.createElement('canvas');
        const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });

        scanIntervalRef.current = setInterval(async () => {
          if (isScannedRef.current || !videoRef.current) return;
          const video = videoRef.current;
          if (video.readyState < 2) return;

          const width = video.videoWidth;
          const height = video.videoHeight;
          if (width === 0 || height === 0) return;

          // Detección nativa por hardware si BarcodeDetector está disponible (ej. Chrome en Android)
          if ('BarcodeDetector' in window) {
            try {
              const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
              const barcodes = await detector.detect(video);
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                handleDetectedCode(barcodes[0].rawValue);
                return;
              }
            } catch {
              // Si falla o no tiene soporte nativo, continúa con jsQR
            }
          }

          // Detección universal mediante jsQR
          if (offscreenCtx) {
            offscreenCanvas.width = width;
            offscreenCanvas.height = height;
            offscreenCtx.drawImage(video, 0, 0, width, height);
            const imgData = offscreenCtx.getImageData(0, 0, width, height);
            const result = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: 'dontInvert',
            });
            if (result && result.data) {
              handleDetectedCode(result.data);
            }
          }
        }, 200);
      } catch (err: any) {
        if (isCancelled) return;
        const errName = err?.name || '';
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          setStatus('permission_denied');
          setErrorMessage('Permiso de cámara denegado en el navegador.');
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          setStatus('unavailable');
          setErrorMessage('No se encontró una cámara en este dispositivo.');
        } else {
          setStatus('unavailable');
          setErrorMessage('No fue posible acceder a la cámara del dispositivo.');
        }
      }
    }

    initCamera();

    return () => {
      isCancelled = true;
      stopCamera();
    };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Cabecera */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <MaterialCommunityIcons name="camera-outline" size={20} color="#0284C7" />
              <Text style={styles.headerTitle}>Escanear Código QR</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.btnClose}
              accessibilityLabel="Cerrar escáner"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Contenido del Escáner */}
          <View style={styles.body}>
            {status === 'initializing' && (
              <View style={styles.centeredMessage}>
                <ActivityIndicator size="large" color="#0284C7" />
                <Text style={styles.statusText}>Iniciando cámara...</Text>
              </View>
            )}

            {status === 'active' && (
              <View style={styles.viewportContainer}>
                {Platform.OS === 'web' &&
                  React.createElement('video', {
                    ref: (el: HTMLVideoElement | null) => {
                      videoRef.current = el;
                      if (el && streamRef.current && el.srcObject !== streamRef.current) {
                        el.srcObject = streamRef.current;
                        el.play().catch(() => {});
                      }
                    },
                    autoPlay: true,
                    playsInline: true,
                    muted: true,
                    style: {
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    },
                  })}

                {/* Recuadro de Enfoque */}
                <View style={styles.reticleOverlay} pointerEvents="none">
                  <View style={styles.reticleFrame}>
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                  </View>
                </View>
              </View>
            )}

            {status === 'permission_denied' && (
              <View style={styles.centeredMessage}>
                <MaterialCommunityIcons name="camera-off-outline" size={36} color="#DC2626" />
                <Text style={styles.errorTitle}>Permiso de Cámara Denegado</Text>
                <Text style={styles.errorDescription}>
                  {errorMessage || 'Autorice el acceso a la cámara en la configuración de su navegador para escanear.'}
                </Text>
                <Text style={styles.errorHint}>
                  También puede ingresar el código familiar alfanumérico manualmente.
                </Text>
              </View>
            )}

            {status === 'unavailable' && (
              <View style={styles.centeredMessage}>
                <MaterialCommunityIcons name="alert-circle-outline" size={36} color="#D97706" />
                <Text style={styles.errorTitle}>Cámara no disponible</Text>
                <Text style={styles.errorDescription}>
                  {errorMessage || 'No se pudo iniciar el sensor de cámara en este dispositivo.'}
                </Text>
              </View>
            )}

            {status === 'unsupported' && (
              <View style={styles.centeredMessage}>
                <MaterialCommunityIcons name="cellphone-information" size={36} color="#64748B" />
                <Text style={styles.errorTitle}>Cámara web no soportada</Text>
                <Text style={styles.errorDescription}>
                  Utilice la cámara nativa del teléfono o ingrese el código alfanumérico manualmente.
                </Text>
              </View>
            )}

            <Text style={styles.instructionText}>
              Apunte la cámara hacia el código QR visible en el teléfono del paciente.
            </Text>
          </View>

          {/* Pie con botón de Cancelar */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  btnClose: {
    padding: 4,
    borderRadius: 6,
  },
  body: {
    padding: 16,
    alignItems: 'center',
  },
  viewportContainer: {
    width: 280,
    height: 280,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticleFrame: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#38BDF8',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  centeredMessage: {
    width: 280,
    minHeight: 240,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  errorDescription: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorHint: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  instructionText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'flex-end',
  },
  btnCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
});
