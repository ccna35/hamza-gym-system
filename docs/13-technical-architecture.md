# Technical Architecture — V1

Status: Proposed implementation baseline for V1.

## 1. Architectural Style

Use a **modular monolith**.

The product does not need microservices, an event bus, Redis, queues, or distributed infrastructure in V1. Financial operations benefit from one transactional boundary and one relational database.

```text
Browser
  |
  v
Nginx / HTTPS on application VPS
  |--------------------|
  v                    v
React SPA            NestJS API
                       |\
                       | \__ persistent private member-photo storage on VPS
                       |
                       v
          Managed PostgreSQL provider
          (standard PostgreSQL / DATABASE_URL)
```

All application traffic should use one origin in production. Example:

```text
https://gym.example.com/          -> React application
https://gym.example.com/api/v1/*  -> NestJS API
```

This avoids unnecessary CORS complexity and makes cookie authentication straightforward.

## 2. Recommended Stack

### Frontend

- React
- Vite
- TypeScript
- React Router
- TanStack Query for server state
- React Hook Form
- Zod for client-side form validation
- Tailwind CSS
- Custom project UI components
- Lucide React icons
- Optional headless accessibility primitives (for example Radix Dialog) only where they reduce accessibility risk; no shadcn/ui

Do not introduce a global state library unless a concrete client-side state problem appears. Server data belongs in TanStack Query.

### Backend

- Node.js
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Argon2id password hashing
- Sharp for member photo normalization
- A PDF library or HTML-to-PDF renderer for receipts
- QR-code generation library for receipt verification QR codes

### Infrastructure

Development:
- Docker Compose for PostgreSQL only
- React/Vite and NestJS run directly with development commands unless there is a concrete reason to containerize them

Production:
- Nginx
- Ubuntu VPS for web/API and persistent member-photo storage
- External managed PostgreSQL provider accessed through a normal PostgreSQL `DATABASE_URL`
- Provider-specific Supabase APIs/auth are not part of the architecture
- Let's Encrypt TLS certificates
- Automated logical PostgreSQL backups plus photo backups copied off the VPS

## 3. UI Architecture Constraints

V1 is Arabic-only, RTL-only, and responsive/mobile-friendly.

- Root HTML: `<html lang="ar" dir="rtl">`.
- No i18n package or language switcher.
- Tailwind styles should use RTL-safe logical layout patterns; avoid assuming left/right semantics in reusable components.
- Desktop navigation is a persistent right sidebar; below `lg` it becomes a right-side drawer.
- Server data is TanStack Query state; local UI state stays local React state.
- Do not add Zustand/Redux unless a concrete requirement appears.
- No shadcn/ui. Build a small custom component layer (`Button`, `Input`, `Select`, `Dialog`, `Card`, `Badge`, `DataList/DataTable`, `Pagination`, `EmptyState`).
- Forms are one column on mobile and may expand to two columns on larger screens.
- Dense desktop tables must have explicit mobile card/list renderers.
- Use an Arabic-capable font (recommended: Noto Sans Arabic or equivalent) with system fallback.

## 4. Backend Module Boundaries

```text
AuthModule
MembersModule
PlansModule
SubscriptionsModule
PaymentsModule
ReceiptsModule
DashboardModule
AuditModule
StorageModule
DatabaseModule
```

### AuthModule

Responsibilities:
- owner login/logout
- session creation/revocation
- current-user resolution
- authentication guards
- login rate limiting

### MembersModule

Responsibilities:
- member CRUD allowed by V1 rules
- phone normalization/uniqueness
- archive/restore
- member summary
- member financial balance query
- member photo association

### PlansModule

Responsibilities:
- plan creation/editing
- plan prices for 1/3/6/12 months
- enable/disable
- supplying enabled plans for subscription creation

### SubscriptionsModule

Responsibilities:
- create/renew subscription
- calculate end date
- snapshot commercial terms
- prevent overlap
- edit allowed fields
- void mistaken subscription
- derive scheduled/active/expired state

### PaymentsModule

Responsibilities:
- record cash payments
- prevent overpayment
- backdated payment date
- void incorrect payment
- receipt number allocation
- financial consistency

### ReceiptsModule

Responsibilities:
- receipt data/PDF
- QR generation
- public verification endpoint
- valid/void receipt presentation

### DashboardModule

Responsibilities:
- active/expired counts
- upcoming expirations
- new members
- cash revenue
- total debt
- debtor list

### AuditModule

Responsibilities:
- append immutable audit events
- owner-facing audit queries

### StorageModule

Responsibilities:
- validate and normalize captured member photos
- generate opaque storage keys
- read/delete private files according to application rules

## 5. Authentication Model

Use **server-side database sessions**, not long-lived JWTs.

Flow:

1. Owner submits username + password.
2. API verifies Argon2id password hash.
3. API generates a cryptographically random session token.
4. Only a hash of the token is stored in the database.
5. Raw token is sent in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
6. Every protected request resolves the session from the cookie.
7. Logout deletes/revokes the session and clears the cookie.

Benefits for this product:
- simple logout/revocation
- no refresh-token machinery
- no Redis requirement
- one owner / low session volume

No public owner registration is required in V1. Initial owner credentials should be created through a deployment/bootstrap command and the owner should change the temporary password on first use.

## 6. Financial Consistency Boundary

All operations that can change a member's balance must serialize on that member.

Use a transaction and lock the member row before:
- creating a subscription
- creating subscription + initial payment
- editing price-affecting subscription fields
- voiding a subscription
- recording a payment
- voiding a payment

The invariant is:

```text
outstandingDebt = sum(non-voided subscription agreed prices)
                  - sum(non-voided payments)

outstandingDebt >= 0
```

This keeps concurrent requests from accidentally producing overpayment.

## 7. Subscription State

Do not continuously update an `ACTIVE`/`EXPIRED` status column.

Persist:
- start date
- end date
- void state

Derive:

```text
voided -> VOIDED
startDate > businessDate -> SCHEDULED
startDate <= businessDate <= endDate -> ACTIVE
businessDate > endDate -> EXPIRED
```

This avoids cron jobs and stale status data.

## 8. Dates and Timezones

Use two different concepts deliberately.

### Business dates

Store as PostgreSQL `DATE`:
- member join date
- date of birth
- subscription start/end
- payment date

These represent calendar dates, not moments in time.

### System timestamps

Store as `TIMESTAMPTZ` in UTC:
- createdAt
- updatedAt
- archivedAt
- voidedAt
- audit timestamps
- session expiry

Store timestamps in UTC and display them using the business timezone `Africa/Cairo`. Calendar-based business calculations, including today, daily revenue, and monthly revenue, use `Africa/Cairo`.

## 9. Month Duration Rule

Allowed durations are fixed:

```text
1, 3, 6, 12 calendar months
```

The end date must be computed by a single backend domain helper and covered by tests.

Normal example:

```text
start: 2026-08-20
duration: 1 month
end: 2026-09-19
```

For end-of-month starts, use calendar-month clamping so the subscription does not jump unpredictably into another month. This logic must have explicit tests for Jan 29/30/31, February, and leap years.

The client never calculates the authoritative end date.

## 10. Money Representation

Never use floating-point values for persisted or calculated money.

Recommended representation:
- PostgreSQL: `BIGINT` minor units
- 1 EGP = 100 minor units
- API domain: integer minor units

Examples:

```text
300.00 EGP -> 30000
750.50 EGP -> 75050
```

The UI formats minor units as EGP. Validation rejects more than two decimal places.

This avoids rounding errors and makes balance arithmetic exact.

## 11. Photo Storage

Member photos are private application files.

V1 recommendation:
- capture via browser webcam
- upload image blob to API
- validate actual image content
- limit upload size
- re-encode with Sharp to a standard format
- strip EXIF metadata
- generate an opaque random storage key
- store file outside the public web root
- serve it through an authenticated API endpoint

Do not store base64 images in PostgreSQL.

## 12. Receipt Architecture

A receipt is a representation of a payment, not an independent financial entity.

On payment creation:
- allocate receipt number transactionally
- generate random verification token
- store the random verification token as the receipt's public opaque lookup identifier so receipts can be reprinted later
- generate the verification URL from that stored token

Example human identifier:

```text
REC-2026-000143
```

Example public verification URL:

```text
/verify/<unguessable-token>
```

The QR code encodes the verification URL.

The public verification response should expose only the minimum useful information:
- valid / voided status
- receipt number
- member name
- amount
- payment date

The endpoint must be rate limited.

## 13. Error Contract

Use one consistent API error shape.

Example:

```json
{
  "statusCode": 409,
  "code": "SUBSCRIPTION_OVERLAP",
  "message": "The member already has a subscription covering this period.",
  "details": null
}
```

Business error codes should be stable so the frontend does not parse human-readable messages.

Important codes include:
- `PHONE_ALREADY_EXISTS`
- `PLAN_DISABLED`
- `PLAN_PRICE_NOT_FOUND`
- `SUBSCRIPTION_OVERLAP`
- `PAYMENT_EXCEEDS_BALANCE`
- `SUBSCRIPTION_HAS_PAYMENTS`
- `PAYMENT_ALREADY_VOIDED`
- `SUBSCRIPTION_ALREADY_VOIDED`

## 14. Observability

V1 should have basic operational visibility without adding a monitoring platform dependency:
- structured JSON logs
- request ID/correlation ID
- request method/path/status/duration
- startup and database connection logs
- unexpected error stack traces server-side
- health endpoint

Do not log:
- passwords
- session tokens
- receipt verification tokens
- raw photo data

## 15. Health Endpoint

Provide:

```text
GET /api/v1/health
```

It should verify process health and database connectivity. It should not expose sensitive environment/configuration data.

## 16. Architectural Decisions Explicitly Rejected for V1

- Microservices
- Redis
- Message queues
- Kubernetes
- Event sourcing
- CQRS framework
- Separate reporting database
- Object storage dependency for photos
- Member mobile application
- Real-time WebSockets

These can be reconsidered only when a real requirement appears.
