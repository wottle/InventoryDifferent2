import { describe, it, expect } from 'vitest';
import { filterDeviceSensitiveFields } from '../../src/resolvers';

const mockDevice = {
    id: 1,
    name: 'Macintosh SE',
    manufacturer: 'Apple',
    priceAcquired: 150,
    estimatedValue: 300,
    soldPrice: 250,
    whereAcquired: 'eBay',
    notes: [{ id: 1, content: 'Works great', date: new Date() }],
    status: 'COLLECTION',
};

describe('filterDeviceSensitiveFields', () => {
    it('returns device unchanged when authenticated', () => {
        const result = filterDeviceSensitiveFields(mockDevice, true);
        expect(result).toEqual(mockDevice);
        expect(result.priceAcquired).toBe(150);
        expect(result.estimatedValue).toBe(300);
        expect(result.soldPrice).toBe(250);
        expect(result.whereAcquired).toBe('eBay');
        expect(result.notes).toHaveLength(1);
    });

    it('nullifies sensitive fields when unauthenticated', () => {
        const result = filterDeviceSensitiveFields(mockDevice, false);
        expect(result.priceAcquired).toBeNull();
        expect(result.estimatedValue).toBeNull();
        expect(result.soldPrice).toBeNull();
        expect(result.whereAcquired).toBeNull();
        expect(result.notes).toEqual([]);
    });

    it('preserves non-sensitive fields when unauthenticated', () => {
        const result = filterDeviceSensitiveFields(mockDevice, false);
        expect(result.id).toBe(1);
        expect(result.name).toBe('Macintosh SE');
        expect(result.manufacturer).toBe('Apple');
        expect(result.status).toBe('COLLECTION');
    });
});
