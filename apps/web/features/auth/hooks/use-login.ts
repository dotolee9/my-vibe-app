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

    const result = await auth.loginWithOAuth(
      provider,
      `${window.location.origin}/auth/callback`,
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
