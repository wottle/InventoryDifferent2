import { describe, it, expect } from 'vitest';
import { decimalToNumber } from '../../src/resolvers';

describe('decimalToNumber', () => {
    it('returns 0 for null', () => {
        expect(decimalToNumber(null)).toBe(0);
    });

    it('returns 0 for undefined', () => {
        expect(decimalToNumber(undefined)).toBe(0);
    });

    it('passes through number values', () => {
        expect(decimalToNumber(42)).toBe(42);
        expect(decimalToNumber(3.14)).toBe(3.14);
        expect(decimalToNumber(0)).toBe(0);
        expect(decimalToNumber(-10)).toBe(-10);
    });

    it('parses string numbers', () => {
        expect(decimalToNumber('42')).toBe(42);
        expect(decimalToNumber('3.14')).toBe(3.14);
        expect(decimalToNumber('-10.5')).toBe(-10.5);
    });

    it('returns 0 for invalid strings', () => {
        expect(decimalToNumber('abc')).toBe(0);
        expect(decimalToNumber('')).toBe(0);
    });

    it('handles Prisma Decimal objects with .toNumber()', () => {
        const decimal = { toNumber: () => 99.99 };
        expect(decimalToNumber(decimal)).toBe(99.99);
    });

    it('returns 0 for Decimal objects that produce NaN', () => {
        const decimal = { toNumber: () => NaN };
        expect(decimalToNumber(decimal)).toBe(0);
    });

    it('passes through Infinity as a number type', () => {
        // When value is already typeof number, it returns directly without finite check
        expect(decimalToNumber(Infinity)).toBe(Infinity);
        expect(decimalToNumber(-Infinity)).toBe(-Infinity);
    });
});
