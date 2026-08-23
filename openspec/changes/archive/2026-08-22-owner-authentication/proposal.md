## Why

The gym system now has a runnable foundation but no access control for the owner-facing application. Adding owner authentication establishes the security boundary before member, subscription, and financial workflows are introduced.

## What Changes

- Add the single owner account and bootstrap path with a temporary password.
- Add Argon2id password hashing and verification.
- Add database-backed sessions with hashed random tokens and an eight-hour absolute expiry.
- Add public login and protected logout, current-owner, and password-change API endpoints under `/api/v1/auth`.
- Set and clear secure HttpOnly session cookies with SameSite=Lax and production-only Secure behavior.
- Add global authentication protection for future owner-facing routes and a controlled `mustChangePassword` warning state.
- Add login rate limiting of five attempts per 15 minutes keyed by source IP and username.
- Add Origin/Referer validation for state-changing browser requests to provide CSRF protection.
- Add Arabic RTL login and authenticated application-shell states with responsive behavior.
- Do not implement MFA, password recovery, roles, SSO, member authentication, or any gym domain functionality.

## Capabilities

### New Capabilities

- `owner-authentication`: Secure owner login, sessions, logout, password change, bootstrap, and protected-route behavior.

### Modified Capabilities

None.

## Impact

- Adds `owners` and `sessions` persistence and migrations to the NestJS/Prisma backend.
- Adds authentication guards, security middleware, rate limiting, and API error responses.
- Adds authentication dependencies for Argon2id hashing and secure session handling.
- Adds `/login` and authenticated shell behavior to the React frontend.
- Changes future protected API access from unrestricted foundation behavior to owner-session authorization.
- Leaves all member, plan, subscription, payment, receipt, balance, audit, and dashboard workflows for later changes.
