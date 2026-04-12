"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { API_BASE_URL } from './config';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    authRequired: boolean;
    login: (password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token storage keys
const ACCESS_TOKEN_KEY = 'showcase_access_token';
const REFRESH_TOKEN_KEY = 'showcase_refresh_token';
const TOKEN_EXPIRY_KEY = 'showcase_token_expiry';

// Buffer time before token expiry to trigger refresh (5 minutes)
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

// Helper to write the auth cookie (server-readable only via HttpOnly)
const writeAuthCookie = (token: string, expiresInSec: number) => {
    if (typeof window === 'undefined') return;
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `${ACCESS_TOKEN_KEY}=${token}; path=/; max-age=${expiresInSec}; SameSite=Lax; HttpOnly${isSecure ? '; Secure' : ''}`;
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [authRequired, setAuthRequired] = useState(true);

    // Get tokens from storage
    const getStoredTokens = useCallback(() => {
        if (typeof window === 'undefined') return { accessToken: null, refreshToken: null, expiry: null };
        return {
            accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
            refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
            expiry: localStorage.getItem(TOKEN_EXPIRY_KEY),
        };
    }, []);

    // Store tokens
    const storeTokens = useCallback((accessToken: string, refreshToken: string, expiresIn: number) => {
        const expiry = Date.now() + (expiresIn * 1000);
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());

        // Also store access token in cookie for middleware access
        writeAuthCookie(accessToken, expiresIn);
    }, []);

    // Clear tokens
    const clearTokens = useCallback(() => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);

        // Also clear the cookie
        writeAuthCookie('', 0);
    }, []);

    // Refresh access token
    const refreshAccessToken = useCallback(async (): Promise<boolean> => {
        const { refreshToken } = getStoredTokens();
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) {
                clearTokens();
                return false;
            }

            const data = await response.json();
            const expiry = Date.now() + (data.expiresIn * 1000);
            localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
            localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
            if (data.refreshToken) {
                localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
            }

            // Also update the cookie with new access token
            writeAuthCookie(data.accessToken, data.expiresIn);

            return true;
        } catch {
            clearTokens();
            return false;
        }
    }, [getStoredTokens, clearTokens]);

    // Ensure the cookie is set with the current access token
    const ensureCookieSet = useCallback((accessToken: string, expiresInMs: number) => {
        writeAuthCookie(accessToken, Math.floor(expiresInMs / 1000));
    }, []);

    // Check and refresh token if needed
    const ensureValidToken = useCallback(async (): Promise<boolean> => {
        const { accessToken, expiry } = getStoredTokens();
        if (!accessToken) return false;

        const expiryTime = expiry ? parseInt(expiry, 10) : 0;
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;

        // If token is expired, try to refresh
        if (timeUntilExpiry <= 0) {
            return refreshAccessToken();
        }

        // If token expires within buffer time, refresh it
        if (timeUntilExpiry < REFRESH_BUFFER_MS) {
            return refreshAccessToken();
        }

        // Token is valid - ensure cookie is set for middleware
        ensureCookieSet(accessToken, timeUntilExpiry);
        return true;
    }, [getStoredTokens, refreshAccessToken, ensureCookieSet]);

    // Check auth status on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const statusResponse = await fetch(`${API_BASE_URL}/auth/status`);
                const statusData = await statusResponse.json();

                setAuthRequired(statusData.authRequired);

                // If auth is not required, everyone is authenticated
                if (!statusData.authRequired) {
                    setIsAuthenticated(true);
                    setIsLoading(false);
                    return;
                }

                // Check if we have a valid token
                const hasValidToken = await ensureValidToken();
                setIsAuthenticated(hasValidToken);
            } catch {
                // If we can't reach the API, assume auth is required
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [ensureValidToken]);

    // Set up token refresh interval
    useEffect(() => {
        if (!isAuthenticated) return;

        const interval = setInterval(async () => {
            const valid = await ensureValidToken();
            if (!valid) {
                setIsAuthenticated(false);
            }
        }, 60 * 1000); // Check every minute

        return () => clearInterval(interval);
    }, [isAuthenticated, ensureValidToken]);

    // Login function (password only — showcase admin doesn't need username)
    const login = useCallback(async (password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.error || 'Login failed' };
            }

            storeTokens(data.accessToken, data.refreshToken, data.expiresIn);
            setIsAuthenticated(true);
            return { success: true };
        } catch {
            return { success: false, error: 'Unable to connect to server' };
        }
    }, [storeTokens]);

    // Logout function
    const logout = useCallback(() => {
        clearTokens();
        setIsAuthenticated(false);
    }, [clearTokens]);

    // Get access token for API calls
    const getAccessToken = useCallback((): string | null => {
        const { accessToken } = getStoredTokens();
        return accessToken;
    }, [getStoredTokens]);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            isLoading,
            authRequired,
            login,
            logout,
            getAccessToken,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
