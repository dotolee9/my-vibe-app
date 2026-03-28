import type { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import type { AuthProvider, User } from '@repo/domain/entities/user';
import type { AuthRepository } from '@repo/domain/ports/auth-repository';
import { ok, fail } from '@repo/domain/types/result';

function mapToUser(raw: SupabaseUser): User {
  return {
    id: raw.id,
    email: raw.email ?? '',
    name:
      (raw.user_metadata?.full_name as string) ??
      (raw.user_metadata?.name as string) ??
      null,
    avatarUrl: (raw.user_metadata?.avatar_url as string) ?? null,
    provider: (raw.app_metadata?.provider as AuthProvider) ?? 'google',
  };
}

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private client: SupabaseClient) {}

  async signInWithOAuth(provider: AuthProvider, redirectTo: string) {
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) return fail(error.message);
    return ok({ url: data.url });
  }

  async exchangeCodeForSession(code: string) {
    const { data, error } =
      await this.client.auth.exchangeCodeForSession(code);
    if (error) return fail(error.message);
    return ok(mapToUser(data.user));
  }

  async getUser() {
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser();
    if (error) return fail(error.message);
    if (!user) return ok(null);
    return ok(mapToUser(user));
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) return fail(error.message);
    return ok(undefined);
  }
}
