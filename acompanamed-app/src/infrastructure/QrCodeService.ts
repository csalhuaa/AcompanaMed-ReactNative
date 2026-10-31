import QRCode from 'qrcode';
import { sanitizeFamilyCode } from './CloudSyncService';

export const OFFICIAL_WEB_URL = 'https://acompanamed-unsa-2026.web.app';

export function buildPairingUrl(familyCode: string, baseUrl: string = OFFICIAL_WEB_URL): string {
  const cleanCode = sanitizeFamilyCode(familyCode);
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  return `${normalizedBase}/?pair=${encodeURIComponent(cleanCode)}`;
}

export function extractCodeFromQrPayload(payload: string): string {
  if (!payload || typeof payload !== 'string') return '';
  const trimmed = payload.trim();

  // Si es una URL completa con el query param ?pair= o &pair=
  const match = trimmed.match(/[?&]pair=([^&#\s]+)/i);
  if (match && match[1]) {
    try {
      return sanitizeFamilyCode(decodeURIComponent(match[1]));
    } catch {
      return sanitizeFamilyCode(match[1]);
    }
  }

  // Si contiene ruta o barra al final
  const lastSegment = trimmed.split('/').pop() || trimmed;
  return sanitizeFamilyCode(lastSegment);
}

export async function generateQrDataUrl(payload: string): Promise<string> {
  try {
    return await QRCode.toDataURL(payload, {
      margin: 1,
      width: 260,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    });
  } catch (error) {
    console.warn('QRCode.toDataURL error, using fallback image service:', error);
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(payload)}`;
  }
}
