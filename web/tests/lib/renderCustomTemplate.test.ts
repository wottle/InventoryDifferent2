import { describe, it, expect } from 'vitest';
import { renderCustomTemplate } from '../../src/lib/renderCustomTemplate';

const DEVICE = {
  id: 42,
  name: 'Macintosh 128K',
  additionalName: 'Mac 128K',
  manufacturer: 'Apple',
  modelNumber: 'M0001',
  serialNumber: 'F4200XYZ',
  releaseYear: 1984,
  info: 'The original Macintosh.',
  condition: 'Good',
  status: 'COLLECTION',
  category: { name: 'Computer' },
  location: { name: 'Shelf A' },
};

describe('renderCustomTemplate', () => {
  it('replaces device.name', () => {
    const result = renderCustomTemplate('<h1>{{device.name}}</h1>', DEVICE);
    expect(result).toBe('<h1>Macintosh 128K</h1>');
  });

  it('replaces multiple placeholders', () => {
    const html = '{{device.manufacturer}} — {{device.name}} ({{device.releaseYear}})';
    const result = renderCustomTemplate(html, DEVICE);
    expect(result).toBe('Apple — Macintosh 128K (1984)');
  });

  it('replaces device.category with category name', () => {
    const result = renderCustomTemplate('{{device.category}}', DEVICE);
    expect(result).toBe('Computer');
  });

  it('replaces device.location with location name', () => {
    const result = renderCustomTemplate('{{device.location}}', DEVICE);
    expect(result).toBe('Shelf A');
  });

  it('replaces device.serialNumber', () => {
    const result = renderCustomTemplate('S/N: {{device.serialNumber}}', DEVICE);
    expect(result).toBe('S/N: F4200XYZ');
  });

  it('replaces device.id', () => {
    const result = renderCustomTemplate('ID: {{device.id}}', DEVICE);
    expect(result).toBe('ID: 42');
  });

  it('replaces {{qr}} with img tag when qrDataUri provided', () => {
    const result = renderCustomTemplate('{{qr}}', DEVICE, 'data:image/svg+xml;base64,ABC');
    expect(result).toContain('<img src="data:image/svg+xml;base64,ABC"');
  });

  it('replaces {{qr}} with empty string when no qrDataUri', () => {
    const result = renderCustomTemplate('before{{qr}}after', DEVICE);
    expect(result).toBe('beforeafter');
  });

  it('leaves unrecognized placeholders unchanged (unknown keys not replaced)', () => {
    // Unrecognized keys are left as literal text so authors can see the typo
    const result = renderCustomTemplate('{{device.unknownField}}', DEVICE);
    expect(result).toBe('{{device.unknownField}}');
  });

  it('replaces all occurrences of the same placeholder', () => {
    const html = '{{device.name}} - {{device.name}}';
    const result = renderCustomTemplate(html, DEVICE);
    expect(result).toBe('Macintosh 128K - Macintosh 128K');
  });

  it('handles undefined optional fields gracefully', () => {
    const minDevice = { id: 1, name: 'Test' };
    const result = renderCustomTemplate('{{device.manufacturer}}: {{device.name}}', minDevice);
    expect(result).toBe(': Test');
  });

  it('handles null category gracefully', () => {
    const deviceNoCategory = { ...DEVICE, category: null };
    const result = renderCustomTemplate('{{device.category}}', deviceNoCategory);
    expect(result).toBe('');
  });

  it('handles null location gracefully', () => {
    const deviceNoLocation = { ...DEVICE, location: null };
    const result = renderCustomTemplate('{{device.location}}', deviceNoLocation);
    expect(result).toBe('');
  });

  it('does not modify HTML without placeholders', () => {
    const html = '<p>No placeholders here.</p>';
    const result = renderCustomTemplate(html, DEVICE);
    expect(result).toBe(html);
  });
});
