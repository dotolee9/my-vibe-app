'use client';

import { useState } from 'react';
import { useUseCases } from '@/providers/use-case-context';
import type { AuthProvider } from '@repo/domain/entities/user';

export function useLogin() {
  const { auth } = useUseCases();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (provider: AuthProvider) => {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    if (next && next.startsWith('/')) {
      callbackUrl.searchParams.set('next', next);
    }

    const result = await auth.loginWithOAuth(
      provider,
      callbackUrl.toString(),
    );

    if (result.ok) {
      window.location.href = result.value.url;
    } else {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
}
