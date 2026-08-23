## Purpose

Provide secure owner-only access to the gym management application before any member or financial workflows are exposed.

## ADDED Requirements

### Requirement: Owner bootstrap

The system SHALL provide a documented bootstrap path that creates the initial owner account with a temporary password, stores only an Argon2id password hash, and marks the owner as requiring a password change.

#### Scenario: Initial owner is bootstrapped
- **WHEN** an operator runs the bootstrap path with valid owner credentials
- **THEN** exactly one owner account is created with an Argon2id password hash
- **AND** the stored record marks `mustChangePassword` as true
- **AND** the temporary password is not written to logs or returned by the API

#### Scenario: Bootstrap does not overwrite an existing owner
- **WHEN** the bootstrap path runs after an owner already exists
- **THEN** it refuses to overwrite the existing password or account
- **AND** it reports a controlled configuration/operational error

### Requirement: Owner login

The system SHALL expose a public owner login endpoint that validates username and password, establishes a database-backed session on success, and returns the authenticated owner summary without password data.

#### Scenario: Valid owner credentials create a session
- **WHEN** the owner submits valid credentials to `POST /api/v1/auth/login`
- **THEN** the system creates a session with a cryptographically random token of at least 256-bit entropy
- **AND** stores only a SHA-256 hash of the token
- **AND** sets the raw token in an HttpOnly cookie with `SameSite=Lax`, `Path=/`, and `Secure` in production
- **AND** returns the owner ID, username, and `mustChangePassword` state

#### Scenario: Invalid credentials do not reveal account existence
- **WHEN** a client submits an unknown username or an incorrect password
- **THEN** the endpoint returns `401 INVALID_CREDENTIALS`
- **AND** the response does not reveal which credential was incorrect
- **AND** no authenticated session is created

#### Scenario: Login attempts are rate limited
- **WHEN** five failed login attempts occur for the same source IP and username within 15 minutes
- **THEN** subsequent attempts in that window return `429 TOO_MANY_LOGIN_ATTEMPTS`
- **AND** the rate-limit key does not depend only on a user-controlled identifier

### Requirement: Session authentication and expiry

The system SHALL authenticate protected requests using active database sessions with an eight-hour absolute lifetime.

#### Scenario: Valid session authorizes a protected request
- **WHEN** a request includes a valid, unexpired session cookie
- **THEN** the system resolves the owner from the hashed session token
- **AND** allows the protected request to continue

#### Scenario: Missing, invalid, or expired session is rejected
- **WHEN** a protected request has no valid active session
- **THEN** the system returns `401 UNAUTHORIZED`
- **AND** does not expose protected response data

#### Scenario: Session lifetime is absolute
- **WHEN** eight hours have elapsed since session creation
- **THEN** the session is rejected even if it was recently used
- **AND** the session record is no longer treated as active

### Requirement: Logout and session revocation

The system SHALL provide explicit logout that revokes the current database session and clears the browser cookie.

#### Scenario: Owner logs out
- **WHEN** the owner submits `POST /api/v1/auth/logout` with a valid session
- **THEN** the current session is revoked
- **AND** the response clears the session cookie
- **AND** reuse of that cookie receives `401 UNAUTHORIZED`

### Requirement: Current owner endpoint

The system SHALL provide `GET /api/v1/auth/me` for retrieving the authenticated owner summary.

#### Scenario: Authenticated owner reads their identity
- **WHEN** the owner requests `/api/v1/auth/me` with a valid session
- **THEN** the response contains only the owner ID, username, and `mustChangePassword` state
- **AND** it does not contain a password hash or session token

### Requirement: Password change

The system SHALL allow the authenticated owner to change the password by supplying the current password and a new password of at least 10 characters.

#### Scenario: Owner changes a valid password
- **WHEN** the owner submits valid current credentials and a compliant new password
- **THEN** the system stores an Argon2id hash for the new password
- **AND** clears `mustChangePassword`
- **AND** revokes all other owner sessions while keeping the current session active
- **AND** returns `204 No Content`

#### Scenario: Incorrect current password is rejected
- **WHEN** the current password does not match
- **THEN** the endpoint returns `400 CURRENT_PASSWORD_INCORRECT`
- **AND** the password and session state remain unchanged

#### Scenario: Weak new password is rejected
- **WHEN** the new password is shorter than 10 characters
- **THEN** the endpoint returns `400 PASSWORD_TOO_WEAK`
- **AND** the existing password remains valid

### Requirement: State-changing request protection

The system SHALL protect browser state-changing requests by validating the request `Origin` or `Referer` against the configured same-origin policy, while allowing safe requests and non-browser operational bootstrap use as documented.

#### Scenario: Cross-origin state-changing request is rejected
- **WHEN** an unauthenticated or authenticated browser sends a state-changing request with a disallowed origin
- **THEN** the request is rejected with a controlled CSRF error
- **AND** no state mutation occurs

### Requirement: Temporary-password warning

The system SHALL expose `mustChangePassword` to the frontend and show an Arabic warning after login without blocking access to the authenticated application shell or other currently available owner routes.

#### Scenario: Owner has a temporary password
- **WHEN** login succeeds for an owner whose `mustChangePassword` is true
- **THEN** the authenticated shell displays an Arabic password-change warning
- **AND** the owner may continue using the available application routes
- **AND** the warning is cleared after a successful password change

### Requirement: Arabic RTL authentication UI

The system SHALL provide an Arabic-only RTL login experience and authenticated shell that is usable at a 360px viewport without horizontal page scrolling.

#### Scenario: Owner uses login on a mobile viewport
- **WHEN** the login page is opened at 360px width
- **THEN** labels, validation errors, loading states, and actions are Arabic
- **AND** the document has `lang="ar"` and `dir="rtl"`
- **AND** the primary login flow has no horizontal overflow

### Requirement: Authentication scope boundary

The system SHALL not add MFA, password recovery, SSO, additional roles, member authentication, or gym domain functionality in this change.

#### Scenario: Non-authentication features remain deferred
- **WHEN** the owner inspects the available API and UI in this change
- **THEN** only owner authentication and foundation routes are present
- **AND** members, plans, subscriptions, payments, receipts, balances, audit workflows, and dashboard behavior remain unavailable
