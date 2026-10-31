import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPairingUrl, generateQrDataUrl, extractCodeFromQrPayload } from './QrCodeService';

describe('AcompañaMed - QrCodeService (QR Pairing and Deep Link)', () => {
  it('construye la URL de vinculación con el código familiar limpio', () => {
    const url = buildPairingUrl('med-manu-74');
    assert.equal(url, 'https://acompanamed-unsa-2026.web.app/?pair=MED-MANU-74');
  });

  it('permite definir una URL base personalizada para pruebas locales o LAN', () => {
    const url = buildPairingUrl('MED-MANU-74', 'http://192.168.18.119:5056/');
    assert.equal(url, 'http://192.168.18.119:5056/?pair=MED-MANU-74');
  });

  it('extrae el código familiar desde una URL completa con parámetro ?pair=', () => {
    const code = extractCodeFromQrPayload('https://acompanamed-unsa-2026.web.app/?pair=MED-MANU-74');
    assert.equal(code, 'MED-MANU-74');
  });

  it('extrae el código familiar si el QR contiene solo el código alfanumérico', () => {
    const code = extractCodeFromQrPayload('  med-manu-74  ');
    assert.equal(code, 'MED-MANU-74');
  });

  it('maneja URLs complejas o parámetros adicionales sin perder el código', () => {
    const code = extractCodeFromQrPayload('http://localhost:5056/?source=qr&pair=MED-CARL-80#scanner');
    assert.equal(code, 'MED-CARL-80');
  });

  it('genera un Data URL válido en formato base64 para renderizar con Image de React Native', async () => {
    const pairUrl = buildPairingUrl('MED-MANU-74');
    const qrDataUrl = await generateQrDataUrl(pairUrl);
    assert.ok(qrDataUrl.startsWith('data:image/png;base64,'));
    assert.ok(qrDataUrl.length > 100);
  });
});
