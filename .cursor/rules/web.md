---
description: Next.js 웹 전용 컨벤션. apps/web 작업 시 자동 적용.
globs: "apps/web/**"
---

# Web (Next.js) Rules

## 라우팅

Next.js 16 App Router 파일 기반 라우팅을 사용한다.

```
apps/web/app/
├── layout.tsx            # Root Layout (Providers 래핑)
├── page.tsx              # 홈 페이지
├── globals.css           # Tailwind 글로벌 스타일
├── (auth)/               # 인증 관련 라우트 그룹
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── (dashboard)/          # 대시보드 라우트 그룹
│   ├── layout.tsx
│   └── page.tsx
└── not-found.tsx         # 404
```

- 라우트 그룹은 `(group-name)/` 괄호 디렉토리로 구분한다.
- 각 그룹에 `layout.tsx`를 둘 수 있다.
- `page.tsx`는 기본적으로 Server Component이다.

## Server Component vs Client Component

| 구분 | Server Component (기본) | Client Component |
|------|------------------------|------------------|
| 선언 | 별도 지시어 없음 | 파일 최상단에 `'use client'` |
| 용도 | 데이터 fetching, SEO, 정적 UI | 인터랙션, hooks, 브라우저 API |
| Supabase | 요청별 client 생성 | Provider에서 주입된 client |
| 상태 | 없음 | useState, Zustand, TanStack Query |

### 규칙
- `page.tsx`와 `layout.tsx`는 가능한 Server Component로 유지한다.
- `'use client'`는 필요한 최소 범위의 컴포넌트에만 선언한다. page 전체에 붙이지 않는다.
- Server Component에서 Client Component를 children으로 합성하는 패턴을 우선한다.

## 디렉토리 구조

```
apps/web/
├── app/                  # 라우팅 (페이지 진입점만, 비즈니스 로직 금지)
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
├── lib/                  # 서버 전용 유틸 (Supabase 서버 client 등)
│   └── supabase-server.ts
└── public/               # 정적 파일
```

### 역할 정리

| 디렉토리 | 역할 | 금지 |
|----------|------|------|
| `app/` | 라우팅 진입점, Server Component | 비즈니스 로직, 직접 API 호출 |
| `features/` | hooks + 앱 전용 Client 컴포넌트 | 순수 함수 (domain에 둔다), Supabase 직접 호출 |
| `providers/` | Context Provider로 DI 연결 (`'use client'`) | 비즈니스 로직 |
| `stores/` | Zustand — 클라이언트 전용 로컬 상태 | 서버 상태 (TanStack Query가 담당) |
| `lib/` | 서버 전용 유틸 (Server Component에서만 import) | Client Component에서 import |
| `components/` | 범용 앱 전용 UI | 비즈니스 로직 |

- 순수 함수(검증, 변환)는 `packages/domain`에 둔다. features 안에 두지 않는다.
- 두 곳 이상에서 쓰이는 컴포넌트는 `packages/ui`로 올릴지 검토한다.

## 스타일링 (Tailwind CSS)

- 표준 Tailwind CSS로 스타일링한다 (NativeWind 아님).
- `tailwind.config.ts`의 theme이 디자인 토큰의 single source of truth (native와 공유).
- 색상, 간격, 반경을 className으로 표현한다.
- CSS Modules는 사용하지 않는다. Tailwind className을 기본으로 한다.

```tsx
export default function LoginButton({ onClick }: Props) {
  return (
    <button
      className="bg-primary px-6 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition"
      onClick={onClick}
    >
      로그인
    </button>
  );
}
```

## DI (의존성 주입) 패턴

### Client Component — Context Provider (native와 동일)

```tsx
'use client';
// apps/web/providers/use-case-context.tsx
import { createContext, useContext, type ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SupabaseAuthRepository } from '@repo/adapters/supabase/auth-repository';
import { loginUseCase, registerUseCase } from '@repo/use-cases/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
// apps/web/app/layout.tsx — Root Layout에서 Provider 래핑
import { UseCaseProvider } from '@/providers/use-case-context';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <UseCaseProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </UseCaseProvider>
      </body>
    </html>
  );
}
```

### Server Component — 요청별 Supabase client (SSR 안전)

Server Component에서는 Provider를 사용할 수 없다. 요청마다 새 client를 생성하여 유저 간 상태 누출을 방지한다.

```typescript
// apps/web/lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    },
  );
}
```

```tsx
// Server Component에서 사용
import { createServerSupabase } from '@/lib/supabase-server';
import { SupabaseAuthRepository } from '@repo/adapters/supabase/auth-repository';
import { getProfileUseCase } from '@repo/use-cases/profile';

export default async function ProfilePage() {
  const supabase = await createServerSupabase();
  const profileRepo = new SupabaseAuthRepository(supabase);
  const result = await getProfileUseCase(profileRepo)();

  if (!result.ok) return <div>에러: {result.error}</div>;
  return <ProfileView user={result.value} />;
}
```

## 데이터 관리

native와 동일한 전략을 따른다.

| 도구 | 역할 | 사용 위치 |
|------|------|-----------|
| TanStack Query | 서버 상태 캐싱 | Client Component |
| Supabase Realtime | 실시간 → Query invalidation | Client Component |
| Zustand | 클라이언트 전용 로컬 상태 | Client Component |
| Server Component fetch | SSR 데이터, SEO 필요 시 | Server Component |

### hook 패턴 (Client Component)

```tsx
'use client';
import { useMutation } from '@tanstack/react-query';
import { useUseCases } from '@/providers/use-case-context';

export const useLogin = () => {
  const { auth } = useUseCases();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      auth.login(email, password),
  });
};
```

## 환경변수

- 클라이언트에서 접근 가능한 변수는 `NEXT_PUBLIC_` 접두사를 사용한다.
- 서버 전용 변수(시크릿 등)는 접두사 없이 사용한다.
- `.env.local`에 실제 값을 넣고, `.env`에는 placeholder만 둔다.

```
# .env
NEXT_PUBLIC_SUPABASE_URL=your-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here  # 서버 전용
```
