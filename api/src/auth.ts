import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

// Token expiry times
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '90d';

let jwtSecret: string | null = null;

function getSecret(): string {
    if (jwtSecret) return jwtSecret;
    // Allow tests (and direct JWT_SECRET env usage) to work without initializeAuth()
    if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
    throw new Error('Auth not initialized — call initializeAuth() before starting the server.');
}

function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// Load JWT secret from DB on startup; generate and persist it if none exists yet.
// Must be called once before any token operations.
// When JWT_SECRET env var is explicitly set it always wins — this keeps test environments
// predictable (tokens signed by test helpers use the same secret the server uses).
export async function initializeAuth(prisma: PrismaClient): Promise<void> {
    if (process.env.JWT_SECRET) {
        jwtSecret = process.env.JWT_SECRET;
        return;
    }
    let config = await prisma.systemConfig.findUnique({ where: { key: 'jwt_secret' } });
    if (!config) {
        const secret = crypto.randomBytes(32).toString('hex');
        config = await prisma.systemConfig.create({ data: { key: 'jwt_secret', value: secret } });
        console.log('JWT secret generated and persisted to database.');
    }
    jwtSecret = config.value;
}

// Store a refresh token hash in the DB. Cleans up any already-expired tokens.
export async function storeRefreshToken(prisma: PrismaClient, token: string): Promise<void> {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await prisma.refreshToken.create({ data: { tokenHash: hashToken(token), expiresAt } });
}

// Validate a refresh token against the DB and delete it (single-use rotation).
// Returns false if the token is not found, already used, or expired.
export async function consumeRefreshToken(prisma: PrismaClient, token: string): Promise<boolean> {
    const record = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record) return false;
    await prisma.refreshToken.delete({ where: { tokenHash: hashToken(token) } });
    if (record.expiresAt < new Date()) return false;
    return true;
}

// Revoke all active refresh tokens (used by logout-all / credential change).
export async function revokeAllRefreshTokens(prisma: PrismaClient): Promise<void> {
    await prisma.refreshToken.deleteMany({});
}

// Get the admin username from environment.
// Returns null if not set or set to the default "admin" — a username of "admin"
// adds no security value and would require every client UI to show a username field.
export function getAdminUsername(): string | null {
    const username = process.env.AUTH_USERNAME;
    if (!username || username === 'admin') return null;
    return username;
}

// Get the admin password from environment
export function getAdminPassword(): string | null {
    return process.env.AUTH_PASSWORD || null;
}

// Hash a password (for potential future use if storing hashed passwords)
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
}

// Verify a password against a hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// Verify credentials against the env vars (simple single-user auth)
export function verifyAdminCredentials(username: string | null, password: string): boolean {
    const adminUsername = getAdminUsername();
    const adminPassword = getAdminPassword();

    if (!adminPassword) {
        console.error('AUTH_PASSWORD environment variable not set');
        return false;
    }

    // If username is configured, verify it
    if (adminUsername && username !== adminUsername) {
        return false;
    }

    const a = Buffer.from(password);
    const b = Buffer.from(adminPassword);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

// Legacy function for backward compatibility
export function verifyAdminPassword(password: string): boolean {
    return verifyAdminCredentials(null, password);
}

// Token payload interface
interface TokenPayload {
    type: 'access' | 'refresh';
    jti?: string;
    iat?: number;
    exp?: number;
}

// Generate an access token
export function generateAccessToken(): string {
    const payload: TokenPayload = {
        type: 'access',
    };
    return jwt.sign(payload, getSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY });
}

// Generate a refresh token — includes a random jti so tokens generated within the same
// second have distinct payloads and thus distinct hashes in the DB.
export function generateRefreshToken(): string {
    const payload: TokenPayload = {
        type: 'refresh',
        jti: crypto.randomBytes(16).toString('hex'),
    };
    return jwt.sign(payload, getSecret(), { expiresIn: REFRESH_TOKEN_EXPIRY });
}

// Verify a token and return the payload
export function verifyToken(token: string): TokenPayload | null {
    try {
        const payload = jwt.verify(token, getSecret()) as TokenPayload;
        return payload;
    } catch (error) {
        return null;
    }
}

// Verify specifically an access token
export function verifyAccessToken(token: string): boolean {
    const payload = verifyToken(token);
    return payload !== null && payload.type === 'access';
}

// Verify specifically a refresh token
export function verifyRefreshToken(token: string): boolean {
    const payload = verifyToken(token);
    return payload !== null && payload.type === 'refresh';
}

// Check if authentication is configured
export function isAuthConfigured(): boolean {
    return !!getAdminPassword();
}
