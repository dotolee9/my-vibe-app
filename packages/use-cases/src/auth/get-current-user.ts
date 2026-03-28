import type { AuthRepository } from '@repo/domain/ports/auth-repository';

export const getCurrentUserUseCase =
  (authRepo: AuthRepository) => () =>
    authRepo.getUser();
