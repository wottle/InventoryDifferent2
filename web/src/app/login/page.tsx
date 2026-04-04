"use client";

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useT } from '../../i18n/context';

function LoginForm() {
    const t = useT();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, isLoading, usernameRequired } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const result = await login(usernameRequired ? username : null, password);

        if (result.success) {
            // Use full page redirect to ensure cookie is sent with fresh request
            // This avoids race conditions with client-side navigation
            const redirectTo = searchParams.get('redirect') || '/';
            window.location.href = redirectTo;
        } else {
            setError(result.error || t.login.loginFailed);
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h1 className="text-center text-3xl font-bold text-[var(--foreground)]">
                        InventoryDifferent
                    </h1>
                    <h2 className="mt-2 text-center text-xl text-[var(--muted-foreground)]">
                        {t.login.adminLogin}
                    </h2>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {usernameRequired && (
                        <div>
                            <label htmlFor="username" className="sr-only">
                                {t.login.username}
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-3 border border-[var(--border)] placeholder-[var(--muted-foreground)] text-[var(--foreground)] bg-[var(--input)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-lg"
                                placeholder={t.login.username}
                                disabled={isSubmitting}
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="password" className="sr-only">
                            {t.login.password}
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="appearance-none relative block w-full px-3 py-3 border border-[var(--border)] placeholder-[var(--muted-foreground)] text-[var(--foreground)] bg-[var(--input)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-lg"
                            placeholder={t.login.password}
                            disabled={isSubmitting}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting || !password || (usernameRequired && !username)}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t.login.signingIn}
                                </span>
                            ) : (
                                t.login.signIn
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <Link
                        href="/"
                        className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                        {t.login.continueAsGuest}
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
