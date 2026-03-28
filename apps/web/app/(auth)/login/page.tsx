import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = {
  title: '로그인 — My Vibe App',
  description: 'My Vibe App에 로그인하세요',
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">My Vibe App</h1>
          <p className="mt-2 text-sm text-gray-500">
            소셜 계정으로 간편하게 시작하세요
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <Suspense fallback={<p className="text-center text-sm text-gray-500">로딩 중...</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
