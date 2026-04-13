import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We need to set env vars before importing auth module
const originalEnv = { ...process.env };

describe('auth module', () => {
    beforeEach(() => {
        // Reset module cache to re-read env vars
        vi.resetModules();
        process.env.JWT_SECRET = 'test-secret-key';
        process.env.AUTH_PASSWORD = 'testpassword';
        process.env.AUTH_USERNAME = 'testuser';
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    describe('verifyAdminCredentials', () => {
        it('returns true for correct credentials', async () => {
            const { verifyAdminCredentials } = await import('../../src/auth');
            expect(verifyAdminCredentials('testuser', 'testpassword')).toBe(true);
        });

        it('returns false for wrong password', async () => {
            const { verifyAdminCredentials } = await import('../../src/auth');
            expect(verifyAdminCredentials('testuser', 'wrongpassword')).toBe(false);
        });

        it('returns false for wrong username when username is configured', async () => {
            const { verifyAdminCredentials } = await import('../../src/auth');
            expect(verifyAdminCredentials('wronguser', 'testpassword')).toBe(false);
        });

        it('accepts null username when AUTH_USERNAME is not set', async () => {
            delete process.env.AUTH_USERNAME;
            const { verifyAdminCredentials } = await import('../../src/auth');
            expect(verifyAdminCredentials(null, 'testpassword')).toBe(true);
        });

        it('returns false when AUTH_PASSWORD is not set', async () => {
            delete process.env.AUTH_PASSWORD;
            const { verifyAdminCredentials } = await import('../../src/auth');
            expect(verifyAdminCredentials('admin', 'testpassword')).toBe(false);
        });
    });

    describe('isAuthConfigured', () => {
        it('returns true when AUTH_PASSWORD is set', async () => {
            const { isAuthConfigured } = await import('../../src/auth');
            expect(isAuthConfigured()).toBe(true);
        });

        it('returns false when AUTH_PASSWORD is not set', async () => {
            delete process.env.AUTH_PASSWORD;
            const { isAuthConfigured } = await import('../../src/auth');
            expect(isAuthConfigured()).toBe(false);
        });
    });

    describe('token generation and verification', () => {
        it('generates and verifies access tokens', async () => {
            const { generateAccessToken, verifyAccessToken } = await import('../../src/auth');
            const token = generateAccessToken();
            expect(typeof token).toBe('string');
            expect(verifyAccessToken(token)).toBe(true);
        });

        it('generates and verifies refresh tokens', async () => {
            const { generateRefreshToken, verifyRefreshToken } = await import('../../src/auth');
            const token = generateRefreshToken();
            expect(typeof token).toBe('string');
            expect(verifyRefreshToken(token)).toBe(true);
        });

        it('rejects access token as refresh token', async () => {
            const { generateAccessToken, verifyRefreshToken } = await import('../../src/auth');
            const token = generateAccessToken();
            expect(verifyRefreshToken(token)).toBe(false);
        });

        it('rejects refresh token as access token', async () => {
            const { generateRefreshToken, verifyAccessToken } = await import('../../src/auth');
            const token = generateRefreshToken();
            expect(verifyAccessToken(token)).toBe(false);
        });

        it('rejects invalid tokens', async () => {
            const { verifyAccessToken, verifyRefreshToken } = await import('../../src/auth');
            expect(verifyAccessToken('invalid-token')).toBe(false);
            expect(verifyRefreshToken('invalid-token')).toBe(false);
        });
    });
});
