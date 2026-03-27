---
description: Phase-Gate 바이브코딩 워크플로. Clean Architecture 계층 순서에 따른 설계/구현/검증 프로세스.
globs: "**/*"
alwaysApply: true
---

# Phase-Gate Workflow

## 핵심 원칙

- 설계 없이 구현하지 않는다.
- 사용자 승인 없이 다음 단계로 넘어가지 않는다.
- 기능 하나 완료 시 반드시 progress 업데이트 후 커밋을 제안한다.
- 구현은 항상 안쪽 계층부터 바깥으로: domain → use-cases → adapters → apps.

## Phase 문서 구조

```
docs/
├── phases/
│   ├── phase-1-mvp.md        # Phase별 기능 목록 + use-case 목록 + 완료 기준
│   ├── phase-2-beta.md
│   └── ...
├── design/
│   ├── screens.md            # 화면 목록 + 라우팅 구조
│   ├── data-model.md         # Supabase 테이블·관계
│   └── api.md                # API 엔드포인트 목록
└── progress.md               # 전체 진행률 대시보드
```

### Phase 문서 형식

```markdown
# Phase 1 — MVP

## 기능: 인증
- use-case: login
- use-case: register
- use-case: logout
- 완료 기준: 로그인/회원가입/로그아웃이 동작하고, domain+use-cases 테스트 통과

## 기능: 온보딩
- use-case: complete-profile
- use-case: set-preferences
- 완료 기준: ...
```

## 변경 규모별 프로세스

### Hotfix (1~3개 파일, 단일 계층)

대상: 타입 오타 수정, 검증 로직 버그 수정, 스타일 조정, 텍스트 변경 등.

1. Plan 생략 가능. Agent에서 바로 수정한다.
2. 해당 계층의 테스트가 있으면 통과를 확인한다.
3. 커밋 후 progress.md 갱신 불필요.

### Feature (4개+ 파일, 여러 계층)

대상: 새 기능 추가, 기존 기능 확장, 여러 계층에 걸친 리팩터링 등.

반드시 아래 3단계 프로세스를 따른다.

## 3단계 프로세스 (Feature 전용)

### 1단계: 설계 (Plan 모드)

1. 사용자가 기능을 요청하면 `docs/phases/` 문서가 있는지 확인한다.
2. 없으면 Phase 문서 초안을 먼저 제안한다 (기능 + use-case 목록 포함).
3. Phase 문서를 읽고 해당 기능의 **구현 계획**을 계층 순서로 출력한다:

```
[구현 계획 예시: 인증 기능]

1. domain 계층
   - entities/user.ts (User 타입 정의)
   - validation/email.ts + test (이메일 검증 순수 함수)
   - validation/password.ts + test (비밀번호 검증 순수 함수)
   - ports/auth-repository.ts (AuthRepository 인터페이스)

2. use-cases 계층
   - auth/login.ts + test (loginUseCase)
   - auth/register.ts + test (registerUseCase)

3. adapters 계층
   - supabase/auth-repository.ts (SupabaseAuthRepository)

4. apps 계층
   - native: DI wiring (providers/), hooks, 화면 UI
   - web: (필요 시)
```

4. **사용자 승인을 기다린다.** 승인 전에 코드를 작성하지 않는다.

### 2단계: 구현 (Agent 모드)

계층 순서를 반드시 지킨다:

**Step A: domain (순수 함수 + 테스트)**
1. entities에 타입 정의
2. validation/formatters에 순수 함수 작성
3. 순수 함수마다 테스트 작성 및 통과 확인
4. ports에 인터페이스 정의

**Step B: use-cases (시나리오 조합 + 테스트)**
1. domain의 순수 함수를 조합하여 use-case 작성
2. 포트 인터페이스의 fake 구현체로 테스트 작성 및 통과 확인

**Step C: adapters (외부 연결)**
1. domain/ports 인터페이스를 구현하는 class 작성
2. Supabase 등 외부 서비스 연결

**Step D: apps (화면 + DI wiring)**
1. providers/ 에서 adapter 인스턴스 생성 및 use-case에 주입
2. hooks에서 use-case 호출
3. 화면 UI 구현 (NativeWind)

각 Step 완료 시:
- `docs/progress.md` 해당 항목 갱신
- 커밋 제안 (사용자가 지시할 때만 실행)

구현 중 계획 밖의 변경이 필요하면 **사용자에게 알리고 승인**을 받는다.

### 3단계: 검증 (Ask 모드)

1. Phase 완료 기준과 현재 구현 상태를 비교한다.
2. 계층별 체크리스트로 보고한다:

```markdown
## 검증: 인증 기능
### domain
- [x] User 엔티티 정의
- [x] validateEmail + 테스트 통과
- [x] validatePassword + 테스트 통과
- [x] AuthRepository 포트 정의

### use-cases
- [x] loginUseCase + 테스트 통과
- [x] registerUseCase + 테스트 통과

### adapters
- [x] SupabaseAuthRepository 구현

### apps/native
- [x] DI wiring
- [ ] 로그인 화면 UI ← 미완료
```

3. 모두 통과하면 다음 기능 또는 다음 Phase로 진행한다.
4. 미통과 항목이 있으면 2단계의 해당 Step으로 돌아간다.

## 금지사항

- Phase 문서에 정의되지 않은 기능을 임의로 구현하지 않는다.
- Phase 순서를 건너뛰지 않는다.
- 계층 순서를 건너뛰지 않는다 (adapters부터 만들고 domain을 나중에 만들지 않는다).
- 안쪽 계층에서 바깥 계층을 import하지 않는다.
- 사용자 확인 없이 파일을 삭제하지 않는다.
- 사용자 확인 없이 의존성을 추가/제거하지 않는다.
- progress.md 갱신을 생략하지 않는다.

## progress.md 형식

```markdown
# Progress

## Phase 1 — MVP

### 인증
| 계층 | 항목 | 상태 | 날짜 |
|------|------|------|------|
| domain | User 엔티티 | DONE | 2026-03-28 |
| domain | validateEmail | DONE | 2026-03-28 |
| use-cases | loginUseCase | DONE | 2026-03-28 |
| adapters | SupabaseAuthRepo | DOING | - |
| apps/native | 로그인 화면 | TODO | - |

### 온보딩
| 계층 | 항목 | 상태 | 날짜 |
|------|------|------|------|
| ... | ... | TODO | - |
```

## 새 세션 시작 시

1. `docs/progress.md`를 읽어 현재 Phase와 진행 상태를 파악한다.
2. 마지막으로 DOING 상태인 항목의 **계층**을 확인하고, 해당 계층부터 이어서 작업할지 사용자에게 확인한다.
