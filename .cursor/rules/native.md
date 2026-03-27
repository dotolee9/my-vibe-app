---
description: Expo / React Native 전용 컨벤션. apps/native 작업 시 자동 적용.
globs: "apps/native/**"
---

# Native (Expo) Rules

## 라우팅

Expo Router 6 파일 기반 라우팅을 사용한다.

```
apps/native/app/
├── _layout.tsx           # Root Layout (Providers 래핑)
├── (tabs)/
│   ├── _layout.tsx       # Tab Navigator
│   ├── index.tsx         # 첫 번째 탭
│   └── ...
├── (auth)/               # 인증 관련 화면 그룹
│   ├── _layout.tsx
│   ├── login.tsx
│   └── register.tsx
├── modal.tsx             # 모달 화면
└── +not-found.tsx        # 404
```

- 화면 그룹은 `(group-name)/` 괄호 디렉토리로 구분한다.
- 각 그룹에 `_layout.tsx`를 반드시 둔다.
- 딥링크가 필요한 화면은 `app/` 루트에 직접 배치한다.

## 디렉토리 구조

```
apps/native/
├── app/                  # 라우팅 (화면 진입점만, 비즈니스 로직 금지)
├── components/           # 앱 전용 UI 컴포넌트
├── features/             # 기능별 화면 로직 (hooks + components만)
│   └── auth/
│       ├── hooks/
│       │   └── use-login.ts
│       └── components/
│           └── login-form.tsx
├── providers/            # DI wiring — Context Provider로 use-case 주입
│   └── use-case-context.tsx
├── stores/               # Zustand stores (클라이언트 전용 상태)
│   └── ui-store.ts
├── constants/            # native 전용 테마 확장
└── assets/               # 폰트, 이미지
```

### 역할 정리

| 디렉토리 | 역할 | 금지 |
|----------|------|------|
| `app/` | 라우팅 진입점 | 비즈니스 로직, 직접 API 호출 |
| `features/` | hooks + 앱 전용 컴포넌트 | 순수 함수 (domain에 둔다), Supabase 직접 호출 |
| `providers/` | Context Provider로 DI 연결 | 비즈니스 로직 |
| `stores/` | Zustand — 클라이언트 전용 로컬 상태 | 서버 상태 (TanStack Query가 담당) |
| `components/` | 범용 앱 전용 UI | 비즈니스 로직 |

- 순수 함수(검증, 변환)는 `packages/domain`에 둔다. features 안에 두지 않는다.
- 두 곳 이상에서 쓰이는 컴포넌트는 `packages/ui`로 올릴지 검토한다.

## 스타일링 (NativeWind)

- NativeWind를 사용하여 Tailwind className으로 스타일링한다.
- `tailwind.config.ts`의 theme이 디자인 토큰의 single source of truth.
- 색상, 간격, 반경을 className으로 표현한다. StyleSheet.create를 기본으로 사용하지 않는다.
- 복잡한 애니메이션/동적 스타일이 필요한 경우에만 StyleSheet를 허용한다.

```tsx
// NativeWind 사용 예시
export default function LoginButton({ onPress }: Props) {
  return (
    <Pressable className="bg-primary px-6 py-3 rounded-lg" onPress={onPress}>
      <Text className="text-white text-center font-semibold">로그인</Text>
    </Pressable>
  );
}
```

## DI (의존성 주입) 패턴

앱에서 Supabase를 직접 호출하지 않는다. Context Provider로 adapter → use-case를 연결한다.

### Provider 구성

```tsx
// apps/native/providers/use-case-context.tsx
import { createContext, useContext, type ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SupabaseAuthRepository } from '@repo/adapters/supabase/auth-repository';
import { loginUseCase, registerUseCase } from '@repo/use-cases/auth';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
);

const authRepo = new SupabaseAuthRepository(supabase);

const useCases = {
  auth: {
    login: loginUseCase(authRepo),
    register: registerUseCase(authRepo),
  },
};

type UseCases = typeof useCases;
const UseCaseContext = createContext<UseCases | null>(null);

export function UseCaseProvider({ children }: { children: ReactNode }) {
  return (
    <UseCaseContext.Provider value={useCases}>
      {children}
    </UseCaseContext.Provider>
  );
}

export function useUseCases(): UseCases {
  const ctx = useContext(UseCaseContext);
  if (!ctx) throw new Error('UseCaseProvider not found');
  return ctx;
}
```

```tsx
// apps/native/app/_layout.tsx — Root Layout에서 Provider 래핑
import { UseCaseProvider } from '@/providers/use-case-context';

export default function RootLayout() {
  return (
    <UseCaseProvider>
      <QueryClientProvider client={queryClient}>
        <Stack />
      </QueryClientProvider>
    </UseCaseProvider>
  );
}
```

### hook에서 use-case 호출 (Result 패턴)

```tsx
// apps/native/features/auth/hooks/use-login.ts
import { useMutation } from '@tanstack/react-query';
import { useUseCases } from '@/providers/use-case-context';

export const useLogin = () => {
  const { auth } = useUseCases();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      auth.login(email, password),
  });
};

// 화면에서 사용
const { mutate: login, isPending, error, data } = useLogin();
```

- hook은 `useUseCases()`로 use-case에 접근한다. Supabase, fetch 등을 직접 호출하지 않는다.
- TanStack Query의 `useMutation`/`useQuery`를 사용하여 loading/error/data 상태를 일관되게 관리한다.
- adapter 교체 시 Provider 파일만 수정하면 된다.
- 테스트 시 Provider에 fake use-case를 주입할 수 있다.

## 데이터 관리

### 서버 데이터 (TanStack Query)

```tsx
// 조회: useQuery
const { data, isLoading, error } = useQuery({
  queryKey: ['profile', userId],
  queryFn: () => profile.getById(userId),
  staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
});
```

### 실시간 데이터 (Supabase Realtime → Query invalidation)

```tsx
// apps/native/features/chat/hooks/use-realtime-messages.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/providers/use-case-context';

export const useRealtimeMessages = (channelId: string) => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        () => queryClient.invalidateQueries({ queryKey: ['messages', channelId] })
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [channelId]);
};
```

### 로컬 상태 (Zustand)

서버와 무관한 앱 내부 상태만 Zustand로 관리한다.

```tsx
// apps/native/stores/ui-store.ts
import { create } from 'zustand';

interface UIStore {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isDarkMode: false,
  toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
}));
```

## 플랫폼 분기

- `Platform.select({})`를 우선 사용한다.
- 분기가 크면 (50줄 이상) `.ios.tsx` / `.android.tsx` 파일 분리를 허용한다.

## 네비게이션 타입 안전

- `expo-router`의 `useRouter`, `useLocalSearchParams`에 제네릭 타입을 명시한다.
- 라우트 파라미터 타입은 `@repo/domain/entities/`의 타입을 기반으로 정의한다.

## 환경변수

- 환경변수는 `EXPO_PUBLIC_` 접두사를 사용한다.
- `.env.local`에 실제 값을 넣고, `.env`에는 placeholder만 둔다.
