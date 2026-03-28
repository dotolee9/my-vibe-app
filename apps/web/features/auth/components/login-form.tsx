'use client';

import { useLogin } from '@/features/auth/hooks/use-login';
import type { AuthProvider } from '@repo/domain/entities/user';

const providers: {
  id: AuthProvider;
  label: string;
  icon: string;
  className: string;
}[] = [
  {
    id: 'google',
    label: 'Google로 계속하기',
    icon: 'G',
    className:
      'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
  },
  {
    id: 'kakao',
    label: '카카오로 계속하기',
    icon: 'K',
    className: 'bg-[#FEE500] text-[#191919] hover:bg-[#FDD835]',
  },
  {
    id: 'apple',
    label: 'Apple로 계속하기',
    icon: '',
    className: 'bg-black text-white hover:bg-gray-900',
  },
];

export function LoginForm() {
  const { login, isLoading, error } = useLogin();

  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <button
          key={provider.id}
          type="button"
          onClick={() => login(provider.id)}
          disabled={isLoading}
          className={`flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${provider.className}`}
        >
          <span className="text-lg leading-none">{provider.icon}</span>
          <span>{provider.label}</span>
        </button>
      ))}

      {error && (
        <p className="mt-4 text-center text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
