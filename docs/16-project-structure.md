# Project Structure — V1

Use **one Git repository** implemented as a TypeScript monorepo with clear application boundaries. The frontend and backend are separate applications (`apps/web` and `apps/api`) with independent dependencies/builds/deployments, but they share the repository, documentation, CI, and workspace tooling. Do not split them into separate repositories for V1.

Example package manager: pnpm workspaces.

```text
gym-management/
├── apps/
│   ├── api/
│   └── web/
├── packages/
│   └── shared/
├── docs/
├── infra/
├── scripts/
├── .github/
│   └── workflows/
├── docker-compose.dev.yml
├── pnpm-workspace.yaml
└── README.md
```

The `shared` package should stay small. Do not turn it into a dumping ground.

## 1. Backend

```text
apps/api/src/
├── main.ts
├── app.module.ts
├── config/
├── common/
│   ├── errors/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── utils/
├── database/
│   ├── database.module.ts
│   └── prisma.service.ts
├── auth/
├── members/
├── plans/
├── subscriptions/
├── payments/
├── receipts/
├── dashboard/
├── audit/
└── storage/
```

Each business module should follow a predictable structure without excessive layering.

Example:

```text
members/
├── members.module.ts
├── members.controller.ts
├── members.service.ts
├── dto/
│   ├── create-member.dto.ts
│   ├── update-member.dto.ts
│   └── list-members-query.dto.ts
├── member.errors.ts
└── member.utils.ts
```

For complicated domain logic, extract focused domain services/helpers rather than creating generic repositories automatically.

Example:

```text
subscriptions/
├── subscriptions.module.ts
├── subscriptions.controller.ts
├── subscriptions.service.ts
├── subscription-date.service.ts
├── subscription-balance.service.ts
├── dto/
└── subscription.errors.ts
```

## 2. Prisma

```text
apps/api/prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

Any future manual SQL constraint should live inside a committed migration with comments explaining why Prisma schema alone is insufficient. Do not add PostgreSQL extensions without a concrete requirement.

## 3. Frontend

Use feature-based organization.

```text
apps/web/src/
├── app/
│   ├── router.tsx
│   ├── query-client.ts
│   └── providers.tsx
├── components/
│   ├── ui/
│   └── shared/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── members/
│   ├── plans/
│   ├── subscriptions/
│   ├── payments/
│   └── receipts/
├── lib/
│   ├── api/
│   ├── money.ts
│   ├── dates.ts
│   └── validation/
├── pages/
├── styles/
└── main.tsx
```

The custom UI layer must not use shadcn/ui. It should stay small and project-specific. Recommended primitives:

```text
components/ui/
├── button.tsx
├── input.tsx
├── select.tsx
├── dialog.tsx
├── card.tsx
├── badge.tsx
├── pagination.tsx
├── empty-state.tsx
└── responsive-data-list.tsx
```

`responsive-data-list` should support a desktop row/table representation and a mobile card representation so feature screens do not implement inconsistent responsive behavior.

Example member feature:

```text
features/members/
├── api/
│   ├── create-member.ts
│   ├── get-member.ts
│   └── list-members.ts
├── components/
│   ├── member-form.tsx
│   ├── member-summary.tsx
│   ├── member-financial-card.tsx
│   └── webcam-photo-field.tsx
├── hooks/
└── schemas/
```

Do not mirror backend folders mechanically. Frontend boundaries should follow user workflows.

Frontend baseline:
- `index.html`: `lang="ar" dir="rtl"`
- Arabic-only strings; no i18n package
- Tailwind responsive breakpoints
- persistent right sidebar at `lg+`, right-side drawer below `lg`
- forms mobile-first
- custom UI only; no shadcn/ui
- TanStack Query for server state; no global store by default


## 4. Shared Package

Potential shared items:

```text
packages/shared/src/
├── durations.ts
├── error-codes.ts
└── money.ts
```

Good shared content:
- allowed duration constants
- stable business error-code constants
- tiny pure value helpers

Avoid sharing:
- Prisma models
- NestJS DTO classes
- React-specific code
- database implementation details

## 5. API Client

Create one HTTP client wrapper.

Responsibilities:
- `/api/v1` base path
- `credentials: 'include'`
- JSON parsing
- consistent API-error parsing
- 401 handling

Do not scatter raw `fetch()` calls through UI components.

## 6. Server State

TanStack Query owns remote/server state:
- members
- member details
- plans
- dashboard
- payments
- subscriptions

After a successful mutation, invalidate only relevant query keys.

Example:

```text
['member', memberId]
['member-payments', memberId]
['member-subscriptions', memberId]
['dashboard-summary']
```

No global Zustand/Redux store is needed for these records.

## 7. Forms

Use React Hook Form + Zod for UX validation.

Backend DTO validation remains authoritative.

Important forms:
- owner login
- member create/edit
- plan create/edit
- subscription create/renew
- record payment
- void payment
- void subscription

## 8. Money Utilities

Keep money conversion in one module.

Example API convention:

```text
amountMinor: 30000
```

Frontend helper:

```text
formatMoney(30000) -> "EGP 300.00"
parseMoneyInput("300") -> 30000
```

Never divide/multiply money ad hoc inside components.

## 9. Date Utilities

Keep display-only date formatting in frontend helpers.

Subscription end-date calculation belongs only on the backend.

Use ISO date strings in the API:

```text
YYYY-MM-DD
```

## 10. UI Route Map

Suggested routes:

```text
/login
/
/members
/members/new
/members/:memberId
/plans
/audit
/verify/:token       public
```

Subscription/payment actions can be dialogs or nested flows from the member detail page rather than standalone routes in V1.

## 11. Testing Layout

Backend:

```text
src/**/*.spec.ts                  unit tests
/test/**/*.e2e-spec.ts            HTTP/e2e tests
```

Critical integration tests should run against real PostgreSQL behavior, especially:
- exclusion constraint
- transactions
- row locking/concurrency
- receipt counter

Frontend:
- component tests only where they add value
- prioritize end-to-end coverage of core workflows over testing trivial components

## 12. Configuration

Validate environment variables on startup.

Example:

```text
NODE_ENV
DATABASE_URL
APP_ORIGIN
SESSION_COOKIE_NAME
SESSION_TTL_SECONDS
PHOTO_STORAGE_PATH
RECEIPT_VERIFY_BASE_URL
```

The application should fail fast on missing/invalid required production configuration.

## 13. Code Style Rule

Optimize for boring, explicit code.

Avoid premature abstractions such as:
- generic CRUD base services
- generic repository framework over Prisma
- command bus for every mutation
- unnecessary domain-event system

The financial rules deserve explicit functions and tests more than architectural ceremony.
