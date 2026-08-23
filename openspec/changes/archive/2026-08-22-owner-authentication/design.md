## Context

The foundation provides a NestJS API, React/Vite web app, Prisma configured for PostgreSQL, and an Arabic RTL shell, but it has no identity boundary. V1 has one gym and one owner role. The authentication design must protect future owner-facing routes without introducing member accounts, roles, or domain workflows.

The confirmed operational decisions are an eight-hour absolute session lifetime, five failed login attempts per 15 minutes per source IP plus username, revocation of all other sessions after a password change, and a warning-only `mustChangePassword` state.

## Goals / Non-Goals

**Goals:**

- Bootstrap one owner safely with a temporary password.
- Authenticate with username/password using Argon2id hashes.
- Use revocable database sessions rather than JWTs.
- Protect future API routes with a reusable session guard.
- Provide login, logout, current-owner, and password-change flows with the documented error contract.
- Protect browser state-changing requests with Origin/Referer validation.
- Provide Arabic RTL login and authenticated-shell states at mobile and desktop widths.

**Non-Goals:**

- MFA, password reset, email recovery, SSO, or social login.
- Multiple roles, permissions, owner registration, or member authentication.
- Account lockout administration beyond the login rate limiter.
- Authentication for public receipt verification or future public endpoints.
- Members, plans, subscriptions, payments, receipts, balances, audit, and dashboard features.

## Decisions

### Database model

Add `owners` and `sessions` tables following the project database design. An owner stores a username, Argon2id password hash, `mustChangePassword`, and timestamps. A session stores an owner reference, SHA-256 hash of the raw token, creation/expiry timestamps, and optional last-seen metadata. The schema may support more than one owner row structurally, but the V1 bootstrap path creates only the single configured owner and never overwrites an existing owner.

### Password handling

Use Argon2id through a maintained Node package. The bootstrap path and password-change service hash passwords; login and password-change verification compare against the stored hash. Raw passwords, session tokens, hashes, and cookie values must not appear in logs, error details, API responses, or audit payloads.

### Session cookie

Generate at least 32 cryptographically random bytes for each session token. Store only its SHA-256 digest. Send the raw token in a cookie with a documented name, `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` when `NODE_ENV=production`. Use an eight-hour absolute expiry from session creation; activity must not extend the expiry. Logout deletes or revokes the session and clears the cookie.

The cookie name and exact bootstrap command are implementation details to document in the application README/configuration. They do not alter the API contract.

### Authentication boundary

Implement a reusable NestJS guard that extracts the session cookie, hashes it, looks up a non-expired session, and attaches the owner summary to the request. Apply it to protected controllers/routes and leave login plus any explicitly public route unprotected. Missing, unknown, revoked, or expired sessions return the standard Arabic `401 UNAUTHORIZED` response.

### Password change and temporary password

The password-change service locks or updates the owner in a transaction, verifies the current password, hashes the replacement, clears `mustChangePassword`, keeps the current session active, and revokes all other sessions for that owner. The frontend shows a warning when the flag is true but does not restrict currently available routes.

### Rate limiting

Use a small application-level limiter for failed login attempts keyed by normalized source IP and submitted username, with five failures per 15-minute window. Successful login clears the relevant failure record. Return the stable `TOO_MANY_LOGIN_ATTEMPTS` code without revealing whether a username exists. The implementation should keep limiter state bounded and suitable for the single-instance MVP; a later multi-instance change can replace it with a shared store.

### CSRF protection

For authenticated state-changing requests, accept only requests whose `Origin` or, when Origin is absent, `Referer` matches the configured application origin. Reject disallowed browser origins before mutation with a stable Arabic error. Same-origin requests and safe methods remain usable. The non-browser owner bootstrap command is outside cookie-authenticated request handling.

### Frontend integration

Add an auth API client using the existing single HTTP-client pattern and `credentials: 'include'`. Add an auth query for `/auth/me`, login mutation, logout mutation, and password-change mutation. Unauthenticated responses route to `/login`; authenticated responses render the existing shell with the temporary-password warning when applicable. Keep all visible strings Arabic and use responsive, touch-friendly controls.

## Risks / Trade-offs

- Database sessions add a lookup per protected request, but they provide simple revocation and are appropriate for one owner and fewer than 1,000 members.
- An in-memory rate limiter is not shared across replicas or restarts; that is acceptable for the single-instance MVP and must remain behind a service boundary.
- Strict Origin/Referer checks can affect unusual local proxy setups, so the application origin must be explicit and tested in development and production-like environments.
- Warning-only temporary-password behavior favors operational continuity but relies on the owner eventually changing the bootstrap password; the warning must be persistent and visible.
- Session cookie `Secure` behavior differs between local HTTP and production HTTPS, so both environments require explicit integration tests.
