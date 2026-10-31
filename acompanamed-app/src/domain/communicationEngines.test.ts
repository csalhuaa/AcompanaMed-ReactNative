import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatWhatsAppNumber,
  buildWhatsAppUrl,
  buildPhoneCallUrl,
} from './communicationEngines';

describe('AcompañaMed - CommunicationEngines (TDD Tests)', () => {
  it('formatea correctamente números locales de 9 dígitos anteponiendo el código de Perú (51)', () => {
    const rawNumber = '954 123 456';
    const formatted = formatWhatsAppNumber(rawNumber);
    assert.strictEqual(formatted, '51954123456');
  });

  it('preserva el prefijo internacional si el número ya incluye código de país', () => {
    const rawNumber = '+51 987 654 321';
    const formatted = formatWhatsAppNumber(rawNumber);
    assert.strictEqual(formatted, '51987654321');
  });

  it('construye la URL canónica de wa.me codificando caracteres especiales y saltos de línea', () => {
    const phone = '+51 954 123 456';
    const message = 'Alerta Médica: Don Manuel olvidó su dosis de Losartán.';
    const url = buildWhatsAppUrl(phone, message);

    assert.ok(url.startsWith('https://wa.me/51954123456?text='));
    assert.ok(url.includes(encodeURIComponent(message)));
  });

  it('construye el esquema nativo de llamada tel: sin caracteres extraños', () => {
    const phone = '+51 954 123 456';
    const url = buildPhoneCallUrl(phone);
    assert.strictEqual(url, 'tel:+51954123456');
  });
});
