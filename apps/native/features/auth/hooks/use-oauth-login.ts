import { useCallback, useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { AuthProvider, User } from '@repo/domain/entities/user';
import { useUseCases } from '@/providers/use-case-context';

function getRedirectUrl() {
  return Linking.createURL('/auth/callback');
}

export function useOAuthLogin() {
  const { auth } = useUseCases();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const refreshCurrentUser = useCallback(async () => {
    const result = await auth.getCurrentUser();
    if (result.ok) {
      setUser(result.value);
    }
  }, [auth]);

  useEffect(() => {
    refreshCurrentUser();
  }, [refreshCurrentUser]);

  const login = async (provider: AuthProvider) => {
    setIsLoading(true);
    setError(null);

    const redirectTo = getRedirectUrl();
    const result = await auth.loginWithOAuth(provider, redirectTo);

    if (!result.ok) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    const sessionResult = await WebBrowser.openAuthSessionAsync(
      result.value.url,
      redirectTo,
    );

    if (sessionResult.type !== 'success' || !sessionResult.url) {
      setError('로그인이 취소되었어요. 다시 시도해 주세요.');
      setIsLoading(false);
      return;
    }

    const callbackUrl = new URL(sessionResult.url);
    const code = callbackUrl.searchParams.get('code');
    if (!code) {
      setError('인증 코드를 확인하지 못했어요.');
      setIsLoading(false);
      return;
    }

    const callbackResult = await auth.handleOAuthCallback(code);
    if (!callbackResult.ok) {
      setError(callbackResult.error);
      setIsLoading(false);
      return;
    }

    setUser(callbackResult.value);
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    const result = await auth.logout();
    if (!result.ok) {
      setError(result.error);
      setIsLoading(false);
      return;
    }
    setUser(null);
    setIsLoading(false);
  };

  return { login, logout, refreshCurrentUser, isLoading, error, user };
}
