import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, isAuthConfigured } from '../auth';

// Extend Express Request to include isAuthenticated
declare global {
    namespace Express {
        interface Request {
            isAuthenticated?: boolean;
        }
    }
}

/**
 * Authentication middleware that extracts and verifies JWT from Authorization header.
 * Sets req.isAuthenticated = true if valid token, false otherwise.
 * Does NOT block requests - let resolvers/routes decide what to do.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Default to not authenticated
    req.isAuthenticated = false;

    // If auth is not configured, allow all requests (for backwards compatibility)
    if (!isAuthConfigured()) {
        req.isAuthenticated = true;
        next();
        return;
    }

    // Extract Bearer token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token
    if (verifyAccessToken(token)) {
        req.isAuthenticated = true;
    }

    next();
}

/**
 * Middleware that requires authentication.
 * Returns 401 if not authenticated.
 * Use this for routes that should be completely blocked without auth.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    // If auth is not configured, allow all requests
    if (!isAuthConfigured()) {
        next();
        return;
    }

    // Check if already authenticated by authMiddleware
    if (req.isAuthenticated) {
        next();
        return;
    }

    // Extract and verify token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    const token = authHeader.substring(7);
    if (!verifyAccessToken(token)) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
    }

    req.isAuthenticated = true;
    next();
}
