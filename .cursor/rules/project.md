---
description: 프로젝트 맥락, 아키텍처, 코드 규칙. 모든 세션에서 자동 주입.
globs: "**/*"
alwaysApply: true
---

# Project Context

## 아키텍처: 4계층 Clean Architecture

의존성은 반드시 안쪽으로만 향한다: apps → adapters → use-cases → domain.
바깥 계층이 안쪽 계층을 알 수 있지만, 안쪽은 바깥을 절대 모른다.

```
my-vibe-app/
├── packages/
│   ├── domain/            # 계층 1 — 엔티티, 검증, 변환, 포트(인터페이스)
│   │   └── src/
│   │       ├── entities/        # 타입 정의 (User, Post 등)
│   │       ├── validation/      # 순수 검증 함수
│   │       ├── formatters/      # 순수 변환/포맷 함수
│   │       └── ports/           # 리포지토리 인터페이스 (구현 없음)
│   ├── use-cases/         # 계층 2 — 비즈니스 시나리오 (domain 조합)
│   │   └── src/
│   │       ├── auth/            # login, register, logout 등
│   │       └── ...
│   ├── adapters/          # 계층 3 — 외부 서비스 구현체
│   │   └── src/
│   │       └── supabase/        # SupabaseAuthRepo implements AuthRepository
│   ├── ui/                # 공유 UI 컴포넌트 (NativeWind)
│   ├── eslint-config/
│   └── typescript-config/
├── apps/
│   ├── native/            # 계층 4 — Expo 모바일 앱 (DI wiring + 화면)
│   ├── web/               # 계층 4 — Next.js 웹 앱
│   └── docs/              # 문서 사이트
└── docs/                  # 프로젝트 설계 문서 (phases, progress 등)
```

## 의존성 규칙

| 패키지 | import 가능 | import 금지 |
|--------|-------------|-------------|
| `@repo/domain` | 없음 (최내부) | use-cases, adapters, apps, ui |
| `@repo/use-cases` | `@repo/domain` | adapters, apps, ui |
| `@repo/adapters` | `@repo/domain` | use-cases, apps, ui |
| `@repo/ui` | `@repo/domain` (타입만) | use-cases, adapters, apps |
| `apps/*` | 모든 packages | 다른 apps |

- adapters는 domain의 포트(인터페이스)를 구현하되, use-cases를 직접 import하지 않는다.
- apps에서 use-cases에 adapters 구현체를 주입(DI)하여 연결한다.

## 기술 스택

| 영역 | 스택 |
|------|------|
| 모바일 | Expo 54, React Native 0.81, Expo Router 6 |
| 웹 | Next.js 16, React 19 |
| 스타일링 | NativeWind (Tailwind CSS — web/native 공유) |
| 백엔드 | Supabase (Auth, DB, Storage) |
| 언어 | TypeScript 5.9 (strict) |
| 패키지 매니저 | pnpm 9 |
| 빌드 | Turborepo |
| 서버 상태 | TanStack Query (React Query) |
| 실시간 | Supabase Realtime |
| 클라이언트 상태 | Zustand |
| 테스트 | Vitest |

## 프로그래밍 패러다임 (FP + OOP 하이브리드)

### 계층별 패러다임

| 계층 | 패러다임 | 이유 |
|------|----------|------|
| domain | **FP** — 타입 + 순수 함수 | 부수효과 없음, 테스트 100% 가능 |
| use-cases | **FP** — 순수 함수 (의존성 주입) | domain 함수를 조합, DB 없이 테스트 가능 |
| adapters | **OOP** — class implements interface | 외부 서비스 캡슐화에 적합 |
| apps | **FP** — 함수형 컴포넌트 + hooks | React 방식 |

### FP 원칙
- 비즈니스 로직은 순수 함수로 작성한다 (같은 입력 → 같은 출력, 부수효과 없음).
- 불변 데이터를 기본으로 한다. 배열/객체 변경 시 spread 또는 `map`/`filter`/`reduce` 사용.
- use-case는 domain의 순수 함수를 **조합**한다. 로직을 중복 구현하지 않는다.

### OOP 원칙 (adapters 한정)
- class 사용 시 반드시 domain/ports의 interface를 구현한다.
- 상속보다 합성(composition)을 우선한다.

## 크로스 플랫폼 스타일링 (NativeWind)

- `tailwind.config.ts`가 single source of truth. 색상, 간격, 반경 등 디자인 토큰을 여기서 관리.
- `packages/ui` 컴포넌트는 `className` prop으로 스타일링한다.
- web(Tailwind CSS)과 native(NativeWind)가 동일한 className을 공유한다.
- 플랫폼별 분기가 필요하면 `Platform.select` 또는 `.native.tsx` / `.web.tsx` 파일 분리를 사용한다.

## 에러 처리 전략 (Result 패턴)

throw 대신 Result 타입으로 성공/실패를 명시적으로 반환한다.

### Result 타입

```typescript
// packages/domain/src/types/result.ts
export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const fail = <E>(error: E): Result<never, E> => ({ ok: false, error });
```

### 계층별 에러 흐름

| 계층 | 에러 처리 방식 |
|------|----------------|
| domain | 비즈니스 에러 타입을 정의하고, 검증 함수가 `Result`를 반환 |
| use-cases | domain 에러를 조합하여 `Result`를 반환. throw 하지 않음 |
| adapters | 외부 에러(Supabase 등)를 catch하여 domain 에러 타입으로 변환 후 `Result` 반환 |
| apps | Result를 받아 `ok`이면 데이터 표시, `ok`가 아니면 에러 메시지 표시 |

### 예상 못한 에러

React ErrorBoundary로 처리한다. 각 앱의 `_layout.tsx`에 ErrorBoundary를 배치한다.

## 데이터 관리 전략

서버 상태, 실시간 데이터, 클라이언트 상태를 도구별로 분리한다.

| 도구 | 역할 | 예시 |
|------|------|------|
| TanStack Query | 서버 상태 캐싱, 재검증, 로딩/에러 관리 | 프로필, 게시물 목록, 설정 |
| Supabase Realtime | 실시간 구독 → Query cache invalidation | 채팅 메시지, 알림, 실시간 카운트 |
| Zustand | 클라이언트 전용 로컬 상태 (서버 무관) | UI 토글, 폼 입력, 다크모드 |

### 데이터 분류 기준

- **자주 변하지 않음 + 내가 요청할 때만 필요** → TanStack Query (staleTime 길게)
- **다른 사용자의 변경이 실시간으로 보여야 함** → Supabase Realtime → Query cache invalidation
- **서버와 무관한 앱 내부 상태** → Zustand

### Realtime + Query 연동 패턴

Realtime은 "변경 신호"만 보내고, 데이터 fetching과 캐싱은 TanStack Query가 담당한다.

```typescript
supabase
  .channel('table-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' },
    () => queryClient.invalidateQueries({ queryKey: ['messages'] })
  )
  .subscribe();
```

## DI (의존성 주입) 전략

### 원칙

- adapter class는 **생성자로 외부 client를 받는다** (직접 생성하지 않는다).
- 앱에서 Context Provider를 통해 adapter → use-case를 연결한다.
- native와 web 모두 동일한 패턴을 사용한다 (SSR 안전).

### adapter class 패턴

```typescript
// packages/adapters/src/supabase/auth-repository.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthRepository } from '@repo/domain/ports/auth-repository';

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private client: SupabaseClient) {}

  async login(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) return fail(error.message);
    return ok(mapToUser(data.user));
  }
}
```

### 앱에서 Provider로 주입

```tsx
// apps/native/providers/app-provider.tsx 또는 apps/web/providers/app-provider.tsx
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const authRepo = new SupabaseAuthRepository(supabase);

const useCases = {
  auth: {
    login: loginUseCase(authRepo),
    register: registerUseCase(authRepo),
  },
};

<UseCaseProvider value={useCases}>
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
</UseCaseProvider>
```

## 코드 규칙

- `any` 타입 금지. 반드시 명시적 타입 또는 제네릭 사용.
- 새 컴포넌트 작성 전 `packages/ui/src/`에 공유 가능한 것이 있는지 먼저 확인.
- 재사용 가능한 컴포넌트는 `packages/ui`에 배치, 앱 전용은 해당 앱의 `components/`에 배치.
- 파일명: kebab-case, 컴포넌트: PascalCase, 함수/변수: camelCase.
- 한 파일에 하나의 export default 컴포넌트.

## 테스트 전략

### 테스트 대상 — 계층별 우선순위

| 우선순위 | 대상 | 위치 | 필수 여부 |
|----------|------|------|-----------|
| 1 | domain 순수 함수 (검증, 변환) | `packages/domain/src/**/*.test.ts` | 필수 |
| 2 | use-case 시나리오 | `packages/use-cases/src/**/*.test.ts` | 필수 |
| 3 | adapters | `packages/adapters/src/**/*.test.ts` | 선택 |
| 4 | custom hooks | `apps/*/hooks/*.test.ts` | 선택 |

### 규칙
- 테스트 파일은 소스와 같은 디렉토리에 `*.test.ts`로 co-locate한다.
- 테스트는 given/when/then 구조로 작성한다.
- domain과 use-cases는 모킹 없이 테스트한다 (순수 함수이므로).
- use-case 테스트 시 포트 인터페이스의 fake 구현체를 사용한다.
- 모킹이 필요하면 로직 분리가 부족한 신호로 본다.

## 커밋 컨벤션

```
<type>(<scope>): <subject>

type: feat | fix | refactor | style | docs | chore | test
scope: domain | use-cases | adapters | native | web | ui | config | docs
```
