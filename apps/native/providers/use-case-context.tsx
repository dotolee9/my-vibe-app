import { createContext, useContext, type ReactNode } from 'react';
import { SupabaseAuthRepository } from '@repo/adapters/supabase/auth-repository';
import { getCurrentUserUseCase } from '@repo/use-cases/auth/get-current-user';
import { handleOAuthCallbackUseCase } from '@repo/use-cases/auth/handle-oauth-callback';
import { loginWithOAuthUseCase } from '@repo/use-cases/auth/login-with-oauth';
import { logoutUseCase } from '@repo/use-cases/auth/logout';
import { supabase } from '@/lib/supabase';

const authRepo = new SupabaseAuthRepository(supabase);

const useCases = {
  auth: {
    loginWithOAuth: loginWithOAuthUseCase(authRepo),
    handleOAuthCallback: handleOAuthCallbackUseCase(authRepo),
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
