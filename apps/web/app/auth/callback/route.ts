import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { SupabaseAuthRepository } from '@repo/adapters/supabase/auth-repository';
import { handleOAuthCallbackUseCase } from '@repo/use-cases/auth/handle-oauth-callback';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createServerSupabase();
    const authRepo = new SupabaseAuthRepository(supabase);
    const handleCallback = handleOAuthCallbackUseCase(authRepo);
    const result = await handleCallback(code);

    if (result.ok) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
