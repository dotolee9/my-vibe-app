import type { AuthRepository } from '@repo/domain/ports/auth-repository';

export const logoutUseCase =
  (authRepo: AuthRepository) => () =>
    authRepo.signOut();
