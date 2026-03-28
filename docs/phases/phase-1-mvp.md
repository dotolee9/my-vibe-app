# Phase 1 — MVP

## 기능: OAuth 인증
- use-case: login-with-oauth
- use-case: handle-oauth-callback
- use-case: get-current-user
- use-case: logout
- 완료 기준:
  - web에서 OAuth 로그인/콜백/로그아웃이 동작한다.
  - 인증이 필요한 경로 접근 시 `/login?next=...`로 이동하고, 로그인 성공 후 원래 경로로 복귀한다.
  - 콜백 라우트는 안전한 내부 경로만 next로 허용한다.
  - 계층별 진행 상태가 `docs/progress.md`에 반영된다.
