/**
 * Motores puros de comunicación canónica (WhatsApp Deep Linking y Marcación Telefónica)
 */

export function formatWhatsAppNumber(phone: string): string {
  const cleanDigits = phone.replace(/[^0-9]/g, '');
  if (cleanDigits.length === 9) {
    return `51${cleanDigits}`;
  }
  return cleanDigits;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const formattedPhone = formatWhatsAppNumber(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encoded}`;
}

export function buildPhoneCallUrl(phone: string): string {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  return `tel:${cleanPhone}`;
}
