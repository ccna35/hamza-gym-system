# AI Agent Implementation Contract — V1

Purpose: remove ambiguity when these files are given to an implementation agent.

## 1. Authority Order

If documents conflict, use this order:

1. `19-implementation-contract.md`
2. `08-api-design.md`
3. `03-business-rules.md` and `09-financial-and-audit-rules.md`
4. `10-acceptance-criteria.md`
5. `14-database-design.md`
6. `13-technical-architecture.md`, `16-project-structure.md`, `17-deployment-design.md`
7. remaining product/UI documents

If a behavior is truly unspecified after checking these files, do **not** invent a new business rule. Add a TODO/open question and use the least destructive implementation that does not change financial meaning.

## 2. Product Constants

```text
UI_LANGUAGE = ar
UI_DIRECTION = rtl
CURRENCY = EGP
MONEY_SCALE = 100 minor units per EGP
BUSINESS_TIMEZONE = Africa/Cairo
SUPPORTED_DURATIONS_MONTHS = [1, 3, 6, 12]
PAYMENT_METHODS_V1 = [CASH]
MEMBER_GENDERS = [MALE, FEMALE]
```

No attendance, trainers, member portal, notifications, freezing, subscription cancellation, online payments, overpayment/credit, or multi-branch logic.

## 3. Frontend Contract

Required stack:
- React + Vite + TypeScript
- React Router
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS
- Lucide React

Do not use:
- shadcn/ui
- Redux/Zustand unless a later documented requirement needs global client state
- i18n framework

Headless accessibility primitives may be used selectively, but styling must remain project-owned.

Global HTML:

```html
<html lang="ar" dir="rtl">
```

Frontend routes:

```text
/login
/
/members
/members/new
/members/:memberId
/members/:memberId/edit
/plans
/plans/new
/plans/:planId/edit
/audit
/verify/:token            public
```

Subscription/payment flows may be nested routes or responsive panels launched from member profile, but URL-driven full-page flows are preferred on mobile over tiny modals.

## 4. API Contract

`08-api-design.md` is exact.

Rules:
- Do not rename response fields.
- Do not wrap defined resources in an extra `{ data: ... }` envelope.
- Do not return ORM/Prisma objects directly without mapping to the contract.
- Do not expose `phone_normalized`, password hashes, session hashes/tokens, database-only counters, or internal storage paths.
- Errors use stable error code + Arabic message.
- Business money is integer minor units everywhere across API/service/database boundaries.

## 5. Database Contract

Development:
- PostgreSQL via Docker Compose.

Production:
- external managed PostgreSQL through `DATABASE_URL`.
- no provider-specific auth/query SDK.

Persistence rules:
- member archived, not deleted
- plan disabled, not deleted
- payment voided, never amount-edited/deleted
- subscription mistaken -> voided
- subscription cancellation absent in V1
- audit logs append-only at application level

Financial source of truth:

```text
memberDebt = SUM(non-voided subscription agreedPriceMinor)
             - SUM(non-voided payment amountMinor)
```

`memberDebt` must never become negative.

## 6. Subscription Contract

- Exactly one of durations 1/3/6/12 selected.
- End date is backend-calculated.
- Example: `2026-08-20 + 1 month => 2026-09-19`.
- No overlapping non-voided subscriptions for same member.
- Plan name/listed price are snapshotted.
- Agreed price is owner-editable and may be zero.
- Access is date-based, not payment-based.
- Early renewal chains to day after latest active/scheduled subscription end.
- After expiration, normal creation lets owner choose start date.
- Mid-subscription upgrade/downgrade workflow absent.

## 7. Payment and Receipt Contract

- Cash only.
- Payment may be recorded without subscription creation.
- Payment date may be past, not future.
- Overpayment rejected inside transaction after current debt is recalculated.
- Subscription + optional initial payment is atomic.
- Payment amount never edited.
- Receipt number sequential human identifier.
- Receipt number format is `REC-YYYY-NNNNNN`; the sequence may restart each calendar year.
- Receipt verification token is random, unique, high entropy, stored so receipt can be reprinted, and is the QR lookup identifier.
- Public verification reveals only status, receipt number, member name, masked phone, amount, and payment date. It never reveals the full phone number, internal IDs, notes, debt, or other member information.
- Receipt/PDF includes no gym or owner profile data.
- `balanceAfterPaymentMinor` is historical snapshot and must not change on reprint.

## 8. Photo Contract

Expected scale: <1,000 members.

Use VPS/server persistent storage, not object storage in V1.

- DB stores opaque photo key only.
- Photo bytes live outside public web root and outside disposable container layer.
- API authenticates photo retrieval.
- Normalize/re-encode images to WebP with Sharp and strip metadata.
- Photo directory backed up separately from PostgreSQL.

## 9. Responsive/RTL Contract

The following must work at 360px width without horizontal page scroll:
- login
- dashboard
- member search/list
- create/edit member
- member profile
- subscription creation/renewal
- record payment
- receipt detail
- plans list/form
- audit list
- public receipt verification

Desktop (`lg+`): persistent right sidebar.
Mobile/tablet (`<lg`): right off-canvas drawer.

Desktop data tables that cannot fit naturally must switch to mobile cards/list presentation below `md`.

Primary controls should be touch-friendly and essential actions must never depend on hover.

## 10. Quality Gates

Before a feature is complete:
- TypeScript compiles in strict mode.
- Backend validates input independently from frontend.
- API matches exact contract.
- Business errors use defined codes.
- Financial mutations have tests for invariants.
- Relevant mutation writes audit entry.
- Loading, empty, error, and success states exist in Arabic UI.
- Responsive behavior is checked at 360, 768, 1024 and desktop widths.
- No horizontal page overflow on core routes.

## 11. Never Guess These

The agent must not infer or invent:
- subscription cancellation behavior
- credit/refund behavior
- payment allocation to subscriptions
- new roles
- new payment methods
- extra plan durations
- member self-service
- receipt/gym branding fields
- attendance

Record them as deferred requirements instead.
