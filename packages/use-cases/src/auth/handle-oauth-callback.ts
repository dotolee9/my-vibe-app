import type { AuthRepository } from '@repo/domain/ports/auth-repository';

export const handleOAuthCallbackUseCase =
  (authRepo: AuthRepository) => (code: string) =>
    authRepo.exchangeCodeForSession(code);
