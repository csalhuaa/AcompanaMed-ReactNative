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
import {
  extractCodeFromQrPayload,
  OFFICIAL_WEB_URL,
} from '../../infrastructure/QrCodeService';

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (extractedCode: string) => void;
}

type CameraStatus =
  | 'initializing'
  | 'active'
  | 'permission_denied'
  | 'unavailable'
  | 'unsupported';

export const CameraQrScannerModal: React.FC<Props> = ({
  visible,
  onClose,
  onScanSuccess,
}) => {
  const [status, setStatus] = useState<CameraStatus>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const isScannedRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isHttpInsecure =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.location.protocol === 'http:' &&
    !window.isSecureContext;

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
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

  const triggerNativeCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileCapture = (e: any) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    setPhotoError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setIsProcessingPhoto(false);
        setPhotoError('No se pudo leer el archivo de la cámara.');
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1200;
          let targetWidth = img.width;
          let targetHeight = img.height;
          if (targetWidth > maxDim || targetHeight > maxDim) {
            if (targetWidth > targetHeight) {
              targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
              targetWidth = maxDim;
            } else {
              targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
              targetHeight = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            setIsProcessingPhoto(false);
            setPhotoError('No se pudo inicializar el procesador de imágenes.');
            return;
          }

          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);

          // 1. Probar detector nativo si está disponible
          if ('BarcodeDetector' in window) {
            try {
              const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
              detector
                .detect(img)
                .then((barcodes: any[]) => {
                  if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                    setIsProcessingPhoto(false);
                    handleDetectedCode(barcodes[0].rawValue);
                    return;
                  }
                  tryJsQr();
                })
                .catch(() => tryJsQr());
              return;
            } catch {
              tryJsQr();
              return;
            }
          }

          tryJsQr();

          function tryJsQr() {
            const result = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: 'attemptBoth',
            });
            setIsProcessingPhoto(false);
            if (result && result.data) {
              handleDetectedCode(result.data);
            } else {
              setPhotoError(
                'No se detectó ningún código QR nítido. Enfoque de más cerca y con buena iluminación.'
              );
            }
          }
        } catch {
          setIsProcessingPhoto(false);
          setPhotoError('Error al decodificar la foto.');
        }
      };
      img.onerror = () => {
        setIsProcessingPhoto(false);
        setPhotoError('No se pudo cargar la fotografía tomada.');
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setIsProcessingPhoto(false);
      setPhotoError('Error al leer la foto.');
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!visible) {
      stopCamera();
      setStatus('initializing');
      setErrorMessage('');
      setPhotoError('');
      setIsProcessingPhoto(false);
      isScannedRef.current = false;
      return;
    }

    isScannedRef.current = false;
    setPhotoError('');

    // Si no hay WebRTC o getUserMedia (ej. HTTP en red local en el teléfono)
    if (
      Platform.OS !== 'web' ||
      typeof window === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
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
          } catch {}
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

          // Detección nativa por hardware si BarcodeDetector está disponible (Chrome Android)
          if ('BarcodeDetector' in window) {
            try {
              const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
              const barcodes = await detector.detect(video);
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                handleDetectedCode(barcodes[0].rawValue);
                return;
              }
            } catch {}
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
          setErrorMessage('No se encontró un sensor de cámara en este dispositivo.');
        } else {
          setStatus('unavailable');
          setErrorMessage('No fue posible iniciar el video de la cámara.');
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

          {/* Input oculto para captura nativa directa con la cámara */}
          {Platform.OS === 'web' &&
            React.createElement('input', {
              ref: fileInputRef,
              type: 'file',
              accept: 'image/*',
              capture: 'environment',
              style: { display: 'none' },
              onChange: handleFileCapture,
            })}

          {/* Contenido del Escáner */}
          <View style={styles.body}>
            {status === 'initializing' && (
              <View style={styles.centeredMessage}>
                <ActivityIndicator size="large" color="#0284C7" />
                <Text style={styles.statusText}>Iniciando cámara...</Text>
              </View>
            )}

            {status === 'active' && (
              <>
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

                {/* Opción alternativa para tomar foto si hay problemas de foco */}
                <TouchableOpacity
                  style={styles.btnSecondaryPhoto}
                  onPress={triggerNativeCamera}
                  disabled={isProcessingPhoto}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="camera" size={16} color="#0284C7" />
                  <Text style={styles.btnSecondaryPhotoText}>
                    {isProcessingPhoto ? 'Procesando foto…' : '¿No enfoca? Tomar foto del QR'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {status === 'permission_denied' && (
              <View style={styles.centeredMessage}>
                <MaterialCommunityIcons name="camera-off-outline" size={36} color="#DC2626" />
                <Text style={styles.errorTitle}>Permiso de Cámara Denegado</Text>
                <Text style={styles.errorDescription}>
                  {errorMessage ||
                    'Autorice el acceso a la cámara en el navegador para video en vivo.'}
                </Text>

                <TouchableOpacity
                  style={styles.btnAction}
                  onPress={triggerNativeCamera}
                  disabled={isProcessingPhoto}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="camera" size={18} color="#FFFFFF" />
                  <Text style={styles.btnActionText}>
                    {isProcessingPhoto ? 'Procesando…' : 'Tomar Foto con Cámara'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {status === 'unavailable' && (
              <View style={styles.centeredMessage}>
                <MaterialCommunityIcons name="alert-circle-outline" size={36} color="#D97706" />
                <Text style={styles.errorTitle}>Cámara no disponible</Text>
                <Text style={styles.errorDescription}>
                  {errorMessage || 'No se pudo iniciar el sensor de video en este navegador.'}
                </Text>

                <TouchableOpacity
                  style={styles.btnAction}
                  onPress={triggerNativeCamera}
                  disabled={isProcessingPhoto}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="camera" size={18} color="#FFFFFF" />
                  <Text style={styles.btnActionText}>
                    {isProcessingPhoto ? 'Procesando…' : 'Tomar Foto del QR'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {status === 'unsupported' && (
              <View style={styles.unsupportedContainer}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name="camera" size={32} color="#0284C7" />
                </View>
                <Text style={styles.errorTitle}>
                  {isHttpInsecure ? 'Cámara en Vivo Requiere HTTPS' : 'Captura con Cámara del Teléfono'}
                </Text>
                <Text style={styles.errorDescription}>
                  {isHttpInsecure
                    ? 'Los navegadores móviles requieren conexión segura HTTPS para video continuo en vivo. Puede capturar una foto del QR directamente con su cámara:'
                    : 'Tome una fotografía del código QR del paciente con la cámara de su teléfono:'}
                </Text>

                {/* Botón Principal para tomar foto */}
                <TouchableOpacity
                  style={styles.btnAction}
                  onPress={triggerNativeCamera}
                  disabled={isProcessingPhoto}
                  activeOpacity={0.85}
                >
                  {isProcessingPhoto ? (
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
                  ) : (
                    <MaterialCommunityIcons name="camera" size={18} color="#FFFFFF" />
                  )}
                  <Text style={styles.btnActionText}>
                    {isProcessingPhoto ? 'Decodificando código…' : 'Tomar Foto del QR con Cámara'}
                  </Text>
                </TouchableOpacity>

                {photoError ? (
                  <View style={styles.photoErrorBox}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={15} color="#B91C1C" />
                    <Text style={styles.photoErrorText}>{photoError}</Text>
                  </View>
                ) : null}

                {isHttpInsecure ? (
                  <View style={styles.httpsBox}>
                    <MaterialCommunityIcons name="shield-check-outline" size={16} color="#059669" />
                    <Text style={styles.httpsText}>
                      Para escaneo de video continuo en vivo, use la dirección segura:{'\n'}
                      <Text style={{ fontWeight: '700', color: '#0284C7' }}>{OFFICIAL_WEB_URL}</Text>
                    </Text>
                  </View>
                ) : null}
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
    maxWidth: 390,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
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
    backgroundColor: '#F8FAFC',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
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
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
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
    width: 190,
    height: 190,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
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
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  unsupportedContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  statusText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 12.5,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 2,
    marginBottom: 8,
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 8,
    marginTop: 8,
    width: '100%',
    maxWidth: 280,
  },
  btnActionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnSecondaryPhoto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  btnSecondaryPhotoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  photoErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginTop: 8,
    maxWidth: 280,
  },
  photoErrorText: {
    fontSize: 11.5,
    color: '#B91C1C',
    lineHeight: 15,
    flex: 1,
  },
  httpsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    marginTop: 10,
    maxWidth: 280,
  },
  httpsText: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 15,
    flex: 1,
  },
  instructionText: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 15,
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
