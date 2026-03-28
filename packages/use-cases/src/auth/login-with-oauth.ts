import type { AuthProvider } from '@repo/domain/entities/user';
import type { AuthRepository } from '@repo/domain/ports/auth-repository';

export const loginWithOAuthUseCase =
  (authRepo: AuthRepository) =>
  (provider: AuthProvider, redirectTo: string) =>
    authRepo.signInWithOAuth(provider, redirectTo);
