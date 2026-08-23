# Implementation Plan — V1

This is the recommended build order after requirements and technical design are accepted.

The sequence intentionally builds financial invariants before dashboard polish.

## Phase 0 — Repository and Quality Baseline

Deliverables:
- pnpm workspace/monorepo
- NestJS API app
- React/Vite web app with Arabic RTL root and responsive application shell
- PostgreSQL-only development Compose service
- Prisma configured
- TypeScript strict settings
- lint/format/typecheck scripts
- environment validation
- CI workflow
- basic health endpoint

Exit criteria:
- fresh checkout can be installed and run predictably
- API connects to PostgreSQL
- web app calls health endpoint
- CI is green

## Phase 1 — Authentication

Deliverables:
- `owners` table
- `sessions` table
- owner bootstrap command/seed path
- Argon2id password verification
- login/logout/me endpoints
- HttpOnly session cookie
- auth guard
- Arabic RTL login page
- protected responsive application shell (desktop right sidebar, mobile right drawer)
- login rate limiting

UI baseline checks:
- `lang="ar"` and `dir="rtl"` present
- no shadcn/ui dependency/import
- core shell usable at 360px and desktop widths

Critical tests:
- valid login
- invalid login
- expired session rejected
- logout revokes session
- protected routes reject unauthenticated access

## Phase 2 — Members

Deliverables:
- members migration
- phone normalization
- create/edit member
- archive/restore
- list/search/filter with desktop table + mobile card layout
- responsive member detail page shell
- webcam photo capture/upload
- private photo serving

Critical tests:
- normalized phone uniqueness
- archive does not delete record
- archived member remains historically accessible
- invalid image rejected

## Phase 3 — Plans

Deliverables:
- plans + plan_prices
- fixed duration constants: 1/3/6/12
- create/edit plan
- enable/disable plan
- responsive plan management UI without shadcn/ui
- enabled-plan query for subscription form

Critical tests:
- invalid duration rejected
- disabled plan excluded from new-subscription choices
- historical plan data unaffected by later edits

## Phase 4 — Subscription Engine

This is the first core financial phase.

Deliverables:
- subscriptions table
- PostgreSQL no-overlap exclusion constraint
- authoritative month/end-date calculator
- subscription creation
- renewal flow
- snapshot plan name/listed price
- custom agreed price including zero
- scheduled/active/expired derivation
- edit + audit
- void with safety rules
- responsive current-subscription/member summary UI
- subscription history

Critical tests:
- Aug 20 + 1 month -> Sep 19
- month-end/leap-year cases
- overlapping ranges rejected by service/database
- early renewal starts after current end when renewal action is used
- expired-member start date can be owner-selected
- disabled plan cannot create new subscription
- existing subscription survives later plan edits
- paid subscriptions cannot have financial or contractual fields edited
- subscriptions with recorded payments cannot be voided

## Phase 5 — Balance Engine and Payments

Deliverables:
- payments table
- system receipt counter
- member row-lock transaction pattern
- derive member debt
- capture balance-after-payment receipt snapshot
- record standalone payment
- initial payment inside subscription transaction
- backdated payment date
- reject overpayment
- void payment
- responsive payment history
- debt summary on member page
- audit entries

Critical tests:
- partial payment accepted
- zero payment on subscription allowed by omitting payment record
- debt carries across subscriptions
- standalone debt payment works
- overpayment rejected
- two concurrent payments cannot overpay together
- payment amount cannot be edited
- voided payment increases debt
- reprinted receipt preserves original post-payment balance

## Phase 6 — Receipts and Verification

Deliverables:
- sequential receipt number allocation
- random verification token generation
- random verification-token storage for stable receipt reprinting
- receipt view/PDF
- QR code
- public `/verify/:token` UI
- public verification API
- voided receipt presentation
- endpoint rate limiting

Critical tests:
- committed payments receive unique `REC-YYYY-NNNNNN` receipt numbers
- rolled-back payment does not advance transactional counter
- token cannot be derived from receipt number/payment ID
- valid token resolves correct receipt
- unknown token reveals no extra data
- voided payment verifies as VOIDED, not VALID

## Phase 7 — Dashboard

Deliverables:
- active member count
- expired memberships count
- expiring within next 7 days
- new members this month
- cash revenue today
- cash revenue this month
- total outstanding debt
- debtor list
- expiring list

Critical tests:
- revenue counts valid payments by payment date, not subscription price
- voided payments excluded from revenue
- voided subscriptions excluded from charges/status counts
- expiring uses rolling 7-day window
- debt total equals sum of member balances

## Phase 8 — Audit UI

Deliverables:
- audit log query endpoint
- audit page
- entity/member audit history
- readable action labels/diffs for important events

Critical events to audit:
- member create/edit/archive/restore
- plan create/edit/enable/disable
- subscription create/edit/void
- payment create/void

Audit records should be created in the same DB transaction as the business mutation where practical.

## Phase 9 — Production Hardening

Deliverables:
- Nginx production config
- HTTPS
- external managed PostgreSQL configuration via DATABASE_URL
- production API runtime + persistent VPS photo bind mount
- non-root/runtime security settings
- log rotation
- backup jobs
- offsite backup destination
- restore runbook
- health/deployment checks
- production owner bootstrap/password change

Before go-live:
- verify all core screens at 360px, 768px, 1024px, and desktop widths without horizontal page overflow
- restore a backup into a clean environment
- test receipt verification from a phone camera
- test webcam member photo capture on the actual reception device/browser
- test printer/PDF receipt workflow
- test all acceptance criteria against production-like data

## Phase 10 — Go-Live Validation

Run a small realistic scenario end-to-end:

```text
1. Create owner session
2. Create Standard plan with four durations
3. Register Ahmed
4. Capture Ahmed photo
5. Create 1-month subscription for 300 EGP
6. Record 100 EGP initial payment
7. Confirm debt = 200 EGP
8. Print receipt and verify QR
9. Renew early for another subscription
10. Confirm no date overlap
11. Record debt-only payment
12. Void an intentionally incorrect payment
13. Confirm dashboard revenue/debt values
14. Archive and restore member
15. Inspect audit trail
```

The system is ready for real use only when the financial values remain correct through this workflow.

## Definition of Done for Every Financial Mutation

A financial mutation is not done unless it has:
- DTO/input validation
- domain-rule validation
- transaction where required
- concurrency protection where required
- audit record
- stable business error code
- integration/e2e test
- frontend success/error handling

## What Not to Build During V1

Do not interrupt this plan to add:
- attendance
- trainers
- member portal
- notifications
- subscription freeze
- subscription cancellation
- card/online payment
- multi-branch support
- analytics beyond agreed dashboard

Add these only through a deliberate requirements change/version update.
