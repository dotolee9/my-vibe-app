import type { Result } from '../types/result';
import type { AuthProvider, User } from '../entities/user';

export type AuthRepository = {
  signInWithOAuth: (
    provider: AuthProvider,
    redirectTo: string,
  ) => Promise<Result<{ url: string }>>;
  exchangeCodeForSession: (code: string) => Promise<Result<User>>;
  getUser: () => Promise<Result<User | null>>;
  signOut: () => Promise<Result<void>>;
};
