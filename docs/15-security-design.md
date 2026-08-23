# Security Design — V1

The system contains member personal data and financial history. V1 security should be simple, explicit, and testable.

## 1. Trust Model

Protected application:
- only the gym owner authenticates
- all member, plan, subscription, payment, dashboard, audit, and photo endpoints require owner authentication

Public application surface:
- receipt verification page/API only
- health endpoint with minimal information

## 2. Owner Credentials

- username unique
- password hashed using Argon2id
- never log passwords
- enforce a reasonable minimum password length
- bootstrap first owner with a temporary password
- require password change after first login

No password reset/email recovery flow in V1 unless operationally required before go-live. Recovery can be done through a documented server-side administration command.

## 3. Session Security

Session token:
- generated with cryptographically secure randomness
- at least 256 bits of entropy
- raw value exists only in browser cookie/request
- database stores SHA-256 hash of token

Cookie:

```text
HttpOnly = true
Secure = true in production
SameSite = Lax
Path = /
```

Use a finite expiry, e.g. one workday/session window, and support explicit logout.

Regenerate/create a fresh session after successful login.

## 4. Login Abuse Protection

Rate limit login attempts by source IP and username combination.

Return a generic authentication error so the endpoint does not reveal whether a username exists.

Log repeated failed-login events without logging passwords.

## 5. CSRF

Production should use a same-origin deployment and `SameSite=Lax` cookies.

For state-changing endpoints, additionally validate `Origin`/`Referer` against the configured application origin. If deployment later requires cross-site cookies, add a real CSRF token mechanism rather than weakening cookie settings casually.

## 6. CORS

If frontend and API share one origin, do not enable permissive CORS.

Never use:

```text
Access-Control-Allow-Origin: *
```

with credentialed private endpoints.

## 7. HTTP Security Headers

Use Helmet or equivalent and configure:
- Content-Security-Policy appropriate to the SPA
- X-Content-Type-Options
- Referrer-Policy
- frame-ancestors / clickjacking protection
- HSTS after HTTPS is stable

Nginx terminates TLS and redirects HTTP to HTTPS.

## 8. Input Validation

Backend validation is authoritative.

Validate:
- UUIDs
- phone format/normalization
- enum values
- allowed subscription durations
- dates
- money bounds
- pagination limits
- void reasons
- photo type and size

Unknown DTO properties should be rejected or stripped consistently.

Never trust:
- client-calculated debt
- client-calculated end date
- client-provided listed price
- client-provided receipt number
- client-provided subscription status

## 9. Database Safety

- Prisma/query parameterization for normal access
- parameterize any raw SQL
- application DB user should not be PostgreSQL superuser
- production credentials only through secret/environment configuration
- do not expose PostgreSQL port publicly

## 10. Member Photo Security

For the expected V1 scale (under roughly 1,000 members), persistent application-server/VPS storage is sufficient. Object storage is not required for scale. The important requirements are persistence and independent backups.

Photo upload pipeline:

1. enforce upload size limit
2. inspect actual image, not filename extension
3. decode/re-encode through Sharp
4. strip metadata
5. constrain dimensions
6. save using random opaque key
7. keep storage directory outside public static root

Member photo download requires authenticated owner session.

Do not trust webcam MIME metadata sent by the browser.

## 11. Receipt Verification Token

Use a random token with high entropy, e.g. 24–32 random bytes encoded base64url.

Do not use:
- payment ID
- receipt number
- member ID
- predictable counters
- short random PIN as the primary verifier

Store the random token itself as an opaque public lookup identifier. It is printed/encoded on the receipt and therefore is not treated like a password or session secret. Keeping the token allows exact receipt reprinting without storing generated PDFs.

When verifying:

```text
received random token -> exact indexed lookup of payment
```

The security property is high entropy + non-predictability + rate limiting, not secrecy from the receipt holder.

Public endpoint is rate limited.

Unknown token returns a generic `NOT_FOUND/INVALID` result without revealing nearby receipt information.

## 12. Public Receipt Privacy

The verification page should expose only what is necessary to detect a forged receipt.

Recommended V1 fields:
- receipt number
- status: VALID or VOIDED
- member name
- masked phone, such as `010******42`
- payment amount
- payment date

Do not expose:
- DOB
- full phone number
- address
- subscription history
- debt balance
- audit logs

If the gym later considers member name too sensitive for public verification, display a partially masked name/phone instead. This is a presentation decision and does not change token design.

## 13. Receipt PDF

The PDF is not the source of truth. The database payment record is.

PDF should contain:
- receipt number
- member name
- payment amount
- payment date
- remaining balance at receipt-generation time or clearly labeled current balance if generated later
- QR verification URL
- short verification code only if desired for manual lookup

A forged PDF without a matching verification token fails verification.

## 14. Audit Security

Audit logs are append-only at application level.

Audit events should include:
- actor owner ID
- action
- entity type/id
- before/after snapshots when relevant
- timestamp
- request ID

Do not put raw secrets/tokens/password hashes/photo bytes in audit JSON.

## 15. Logging

Structured logs may include:
- request ID
- HTTP method/path
- response status
- duration
- owner ID after authentication
- business error code

Redact:
- Cookie header
- Authorization header if ever added
- session tokens
- verification tokens
- password fields

## 16. Backup Security

A backup is sensitive because it contains member data and financial history.

Minimum V1:
- automated daily PostgreSQL backup
- automated photo backup
- encrypted transfer/storage for offsite copy
- backup destination separate from the application VPS
- retention policy
- periodic restore test

Do not consider a backup successful merely because a cron command exited; verify artifacts exist and can be restored.

## 17. Dependency and Deployment Hygiene

- lock dependency versions
- commit lockfile
- run dependency/security scanning in CI when practical
- run app as non-root container user where possible
- keep OS/container images patched
- firewall VPS so only SSH and HTTP/HTTPS are publicly reachable
- restrict SSH authentication to keys

## 18. Security Features Deferred

- MFA
- multiple roles/permissions
- SSO
- member authentication
- device management UI
- sophisticated fraud detection
- WAF

These are not necessary for V1 unless the real deployment environment demands them.
