'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { SupabaseAuthRepository } from '@repo/adapters/supabase/auth-repository';
import { loginWithOAuthUseCase } from '@repo/use-cases/auth/login-with-oauth';
import { getCurrentUserUseCase } from '@repo/use-cases/auth/get-current-user';
import { logoutUseCase } from '@repo/use-cases/auth/logout';

const supabase = createBrowserSupabase();
const authRepo = new SupabaseAuthRepository(supabase);

const useCases = {
  auth: {
    loginWithOAuth: loginWithOAuthUseCase(authRepo),
    getCurrentUser: getCurrentUserUseCase(authRepo),
    logout: logoutUseCase(authRepo),
  },
};

type UseCases = typeof useCases;

const UseCaseContext = createContext<UseCases | null>(null);

export function UseCaseProvider({ children }: { children: ReactNode }) {
  return (
    <UseCaseContext.Provider value={useCases}>
      {children}
    </UseCaseContext.Provider>
  );
}

export function useUseCases(): UseCases {
  const ctx = useContext(UseCaseContext);
  if (!ctx) throw new Error('UseCaseProvider not found');
  return ctx;
}
