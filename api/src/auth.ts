import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Token expiry times
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '90d';

// Get JWT secret from env or generate a random one (not recommended for production)
function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (secret) return secret;

    // Generate a random secret if not set (will invalidate tokens on restart)
    console.warn('WARNING: JWT_SECRET not set. Generating random secret. Tokens will be invalidated on server restart.');
    return crypto.randomBytes(32).toString('hex');
}

let jwtSecret: string | null = null;
function getSecret(): string {
    if (!jwtSecret) {
        jwtSecret = getJwtSecret();
    }
    return jwtSecret;
}

// Get the admin username from environment
export function getAdminUsername(): string | null {
    return process.env.AUTH_USERNAME || null;
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

    return password === adminPassword;
}

// Legacy function for backward compatibility
export function verifyAdminPassword(password: string): boolean {
    return verifyAdminCredentials(null, password);
}

// Token payload interface
interface TokenPayload {
    type: 'access' | 'refresh';
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

// Generate a refresh token
export function generateRefreshToken(): string {
    const payload: TokenPayload = {
        type: 'refresh',
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
