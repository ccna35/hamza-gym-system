## 1. Authentication Data and Configuration

- [x] 1.1 Add the `owners` and `sessions` Prisma models and migration with hashed-session-token uniqueness, owner password-hash fields, `mustChangePassword`, timestamps, and session expiry; verify Prisma migration/generation succeeds without storing raw secrets.
- [x] 1.2 Add authentication environment configuration for the application origin, cookie behavior, and session policy; verify invalid required values fail controlled startup validation and development/production cookie settings are deterministic.
- [x] 1.3 Add the documented owner bootstrap command/service with Argon2id hashing and idempotent refusal to overwrite an existing owner; verify the bootstrap test confirms the temporary password is never returned or logged.

## 2. Authentication Services and API

- [x] 2.1 Add password hashing and verification services using Argon2id with no raw password/hash logging; verify unit tests cover matching and non-matching credentials.
- [x] 2.2 Add secure session creation, SHA-256 token hashing, absolute eight-hour expiry, lookup, revocation, and cookie helpers; verify tests cover token entropy/storage, expiry, logout revocation, and cookie attributes.
- [x] 2.3 Add the owner authentication guard and request owner context; verify missing, invalid, revoked, and expired cookies return the documented Arabic `401 UNAUTHORIZED` error.
- [x] 2.4 Implement `POST /api/v1/auth/login` with generic invalid-credential behavior and secure session cookie issuance; verify valid login returns the owner summary and invalid login does not enumerate usernames.
- [x] 2.5 Implement `POST /api/v1/auth/logout` and `GET /api/v1/auth/me`; verify logout revokes the current session and `/auth/me` exposes only the documented owner fields.
- [x] 2.6 Implement `POST /api/v1/auth/change-password`, including ten-character minimum validation, current-password verification, `mustChangePassword` clearing, and revocation of all other sessions; verify success and both documented failure cases.

## 3. Request Security Controls

- [x] 3.1 Add failed-login rate limiting keyed by source IP and username at five failures per 15-minute window, with successful-login reset and bounded in-memory state; verify threshold, window, reset, and generic response tests.
- [x] 3.2 Add Origin/Referer validation for authenticated browser state-changing requests; verify disallowed origins are rejected before mutation and same-origin/safe requests remain allowed.
- [x] 3.3 Add controlled Arabic API error mapping and security logging redaction; verify responses and logs contain no passwords, tokens, password hashes, connection strings, or stack traces.

## 4. Frontend Authentication Experience

- [x] 4.1 Add auth API methods and credentialed request handling to the single frontend API client; verify cookies are included and `401` responses route to the login state.
- [x] 4.2 Add the Arabic RTL `/login` route with username/password validation, loading, generic error, rate-limit, and success states; verify the login flow is usable at 360px without horizontal overflow.
- [x] 4.3 Add authenticated route/shell handling using `/auth/me`, logout, and password-change mutations; verify unauthenticated users see login and authenticated users see the owner shell.
- [x] 4.4 Add a persistent Arabic warning for `mustChangePassword` without blocking currently available authenticated routes; verify it disappears after successful password change.

## 5. Verification and Integration

- [x] 5.1 Add backend integration tests for bootstrap, login, protected access, session expiry, logout, password change, rate limiting, and CSRF checks; verify the API authentication suite passes against PostgreSQL.
- [x] 5.2 Add frontend tests for RTL metadata, login validation/loading/error/success states, auth redirects, logout, and the temporary-password warning; verify the web test suite passes.
- [x] 5.3 Run workspace lint, typecheck, format-check, tests, and builds with authentication enabled; verify all root quality commands pass.
- [x] 5.4 Perform an end-to-end authentication check at desktop and 360px mobile widths, including bootstrap, login, `/auth/me`, warning-only temporary-password behavior, password change, logout, and rejection of unauthenticated protected requests; verify no member or financial functionality was added.
