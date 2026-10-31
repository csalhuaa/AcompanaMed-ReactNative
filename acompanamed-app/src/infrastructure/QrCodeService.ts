import QRCode from 'qrcode';

export const OFFICIAL_WEB_URL = 'https://acompanamed-unsa-2026.web.app';

export function buildPairingUrl(familyCode: string, baseUrl: string = OFFICIAL_WEB_URL): string {
  const cleanCode = familyCode.trim().toUpperCase();
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  return `${normalizedBase}/?pair=${encodeURIComponent(cleanCode)}`;
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
