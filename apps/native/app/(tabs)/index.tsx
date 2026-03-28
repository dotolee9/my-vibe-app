import { Pressable, Text, View } from 'react-native';
import type { AuthProvider } from '@repo/domain/entities/user';
import { useOAuthLogin } from '@/features/auth/hooks/use-oauth-login';

export default function TabOneScreen() {
  const { login, logout, isLoading, error, user } = useOAuthLogin();
  const providers: { id: AuthProvider; label: string }[] = [
    { id: 'google', label: 'Google로 로그인' },
    { id: 'kakao', label: '카카오로 로그인' },
    { id: 'apple', label: 'Apple로 로그인' },
  ];

  return (
    <View className="flex-1 items-center justify-center gap-3 px-5">
      <Text className="text-xl font-bold text-zinc-900">OAuth 로그인</Text>
      {user ? (
        <>
          <Text className="mb-2 text-sm text-zinc-600">
            {user.email || user.name || '로그인됨'}
          </Text>
          <Pressable
            className="w-full max-w-72 rounded-xl bg-zinc-200 px-4 py-3"
            onPress={logout}
            disabled={isLoading}
          >
            <Text className="text-center font-semibold text-zinc-900">
              로그아웃
            </Text>
          </Pressable>
        </>
      ) : (
        providers.map((provider) => (
          <Pressable
            key={provider.id}
            className="w-full max-w-72 rounded-xl bg-zinc-900 px-4 py-3"
            onPress={() => login(provider.id)}
            disabled={isLoading}
          >
            <Text className="text-center font-semibold text-white">
              {provider.label}
            </Text>
          </Pressable>
        ))
      )}
      {error ? (
        <Text className="mt-2 text-center text-sm text-red-500">{error}</Text>
      ) : null}
    </View>
  );
}
