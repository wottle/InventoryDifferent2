"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/i18n/context';

function LoginForm() {
  const { login, isLoading, authRequired, usernameRequired } = useAuth();
  const searchParams = useSearchParams();
  const t = useT();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !authRequired) {
      window.location.href = '/admin/journeys';
    }
  }, [isLoading, authRequired]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await login(password, usernameRequired ? username : undefined);
    if (result.success) {
      const redirect = searchParams.get('redirect') || '/admin/journeys';
      window.location.href = redirect;
    } else {
      setError(result.error || 'Login failed');
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface px-4">
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-lg p-8">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-headline font-bold tracking-tight text-on-surface mb-1">
            {t.adminLogin.title}
          </h1>
          <p className="text-sm text-on-surface-variant">{t.adminLogin.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {usernameRequired && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-on-surface mb-1.5">
                {t.adminLogin.usernameLabel}
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface-container px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                placeholder={t.adminLogin.usernamePlaceholder}
                required
                autoFocus
              />
            </div>
          )}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-on-surface mb-1.5">
              {t.adminLogin.passwordLabel}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              placeholder={t.adminLogin.passwordPlaceholder}
              required
              autoFocus={!usernameRequired}
            />
          </div>

          {error && (
            <p className="text-sm text-error bg-error/10 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !password || (usernameRequired && !username)}
            className="w-full bg-primary text-on-primary font-semibold rounded-full py-2.5 px-6 hover:opacity-90 disabled:opacity-50 transition"
          >
            {submitting ? t.adminLogin.signingIn : t.adminLogin.signIn}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
