# Database Design — V1

Database: PostgreSQL

Development runs PostgreSQL through Docker Compose. Production uses an external managed PostgreSQL provider through a standard PostgreSQL connection string. No provider-specific schema features should be required beyond PostgreSQL itself.

This document turns the logical ERD into an implementation-oriented physical design. Naming is illustrative and can be adjusted to project conventions.

## 1. Tables

### owners

```text
id                  uuid PK
username            varchar unique not null
password_hash       text not null
must_change_password boolean not null default true
created_at          timestamptz not null
updated_at          timestamptz not null
```

V1 expects one owner but the schema does not need a singleton constraint.

### sessions

```text
id                  uuid PK
owner_id            uuid FK -> owners.id
session_token_hash  char(64) unique not null
expires_at          timestamptz not null
created_at          timestamptz not null
last_seen_at        timestamptz null
```

Indexes:
- `session_token_hash` unique
- `owner_id`
- `expires_at`

Expired sessions can be deleted opportunistically or by a small scheduled maintenance task.

### members

```text
id                  uuid PK
name                varchar not null
phone_display       varchar not null
phone_normalized    varchar unique not null
gender              enum/text not null
date_of_birth       date not null
photo_key           varchar null
height_cm           numeric(5,2) null
weight_kg           numeric(6,2) null
join_date           date not null
is_archived         boolean not null default false
archived_at         timestamptz null
created_at          timestamptz not null
updated_at          timestamptz not null
```

Phone uniqueness is enforced against `phone_normalized`, not formatting.

Canonical format is the local 11-digit Egyptian mobile format `01XXXXXXXXX`. Accept and normalize these common forms server-side:

```text
01012345678    -> 01012345678
+201012345678  -> 01012345678
00201012345678 -> 01012345678
201012345678   -> 01012345678
```

Remove harmless spaces, hyphens, and parentheses before validation. Do not make normalization a frontend responsibility.

Checks:
- height > 0 when present
- weight > 0 when present

### plans

```text
id                  uuid PK
name                varchar unique not null
is_enabled          boolean not null default true
created_at          timestamptz not null
updated_at          timestamptz not null
```

Whether disabled plan names may be reused should default to **no** in V1; historical clarity is more valuable than name reuse.

### plan_prices

```text
id                  uuid PK
plan_id             uuid FK -> plans.id
 duration_months     smallint not null
price_minor         bigint not null
created_at          timestamptz not null
updated_at          timestamptz not null
```

Constraints:
- unique `(plan_id, duration_months)`
- `duration_months IN (1, 3, 6, 12)`
- `price_minor >= 0`

V1 requires exactly four prices per plan: durations 1, 3, 6, and 12 months. Plan creation/update must enforce the complete set transactionally at service level; no V1 plan is considered valid with a missing duration price.

### subscriptions

```text
id                    uuid PK
member_id             uuid FK -> members.id
plan_id               uuid FK -> plans.id
plan_name_snapshot     varchar not null
duration_months       smallint not null
listed_price_minor    bigint not null
agreed_price_minor    bigint not null
start_date             date not null
end_date               date not null
voided_at              timestamptz null
void_reason            text null
created_at             timestamptz not null
updated_at             timestamptz not null
```

Constraints:
- `duration_months IN (1, 3, 6, 12)`
- `listed_price_minor >= 0`
- `agreed_price_minor >= 0`
- `end_date >= start_date`
- `void_reason` required when `voided_at` is set

Snapshots are immutable in meaning: changing a plan later never propagates to prior subscriptions.

### payments

```text
id                        uuid PK
member_id                 uuid FK -> members.id
amount_minor                    bigint not null
balance_after_payment_minor     bigint not null
payment_date                    date not null
payment_method            text not null default 'CASH'
receipt_number            varchar unique not null
verification_token        varchar(32) unique not null
voided_at                  timestamptz null
void_reason                text null
created_at                 timestamptz not null
```

Constraints:
- `amount_minor > 0`
- `payment_method = 'CASH'` in V1
- `void_reason` required when `voided_at` is set

There is intentionally no `subscription_id` on payments.

The optional payment created in the same transaction as a subscription is the subscription's recorded initial payment for immutability purposes. Later debt-only payments remain member-level and are not allocated to subscriptions.

The `balance_after_payment_minor` value is a historical receipt snapshot captured in the payment transaction. It is not the source of truth for current debt and is never recomputed when later subscriptions/payments occur.

### system_counters

```text
key                 varchar PK
next_value          bigint not null
updated_at          timestamptz not null
```

Initial row for each calendar year:

```text
key = 'receipt:2026'
next_value = 1
```

The counter is scoped by calendar year. To allocate a receipt number:

1. lock the counter row for the current year `FOR UPDATE` inside the payment transaction
2. read the current year's value
3. increment it
4. format the number as `REC-YYYY-NNNNNN`

Because the counter update is transactional, a rolled-back payment does not consume a number. Voided payments keep their original receipt number.

### audit_logs

```text
id                  uuid PK
actor_owner_id      uuid FK -> owners.id
entity_type         varchar not null
entity_id           uuid/text not null
action              varchar not null
before_json         jsonb null
after_json          jsonb null
metadata_json       jsonb null
request_id          varchar null
created_at          timestamptz not null
```

No update/delete API exists for audit rows.

Indexes:
- `(entity_type, entity_id, created_at desc)`
- `(actor_owner_id, created_at desc)`
- `created_at desc`

## 2. No-Overlap Constraint

The application must reject overlapping non-voided subscription ranges. Every subscription mutation must lock the member row before checking and writing the range, so concurrent service requests use the same serialization boundary.

Do not introduce `btree_gist` or another PostgreSQL extension by default. Reconsider a database exclusion constraint only if a concrete requirement emerges for writers that can bypass the application transaction boundary; document the exact constraint and provider support before adding the extension.

This prevents any two non-voided subscriptions for the same member from sharing a date.

Prisma may require this constraint to be added in a hand-edited SQL migration. That is acceptable and should be documented in the migration.

## 3. Balance Query

Member balance is derived, not stored.

```text
charges = SUM(subscriptions.agreed_price_minor WHERE voided_at IS NULL)
payments = SUM(payments.amount_minor WHERE voided_at IS NULL)
debt = charges - payments
```

Do not add `members.debt` in V1. A stored debt column creates synchronization risk.

For dashboard performance at this scale, indexed aggregate queries are sufficient. Materialized views/caches are unnecessary.

## 4. Per-Member Transaction Lock

Any operation affecting charges or payments should first lock the member row inside the transaction.

Conceptually:

```sql
SELECT id
FROM members
WHERE id = $1
FOR UPDATE;
```

Then perform current balance calculations and write changes.

This ensures two simultaneous payment requests cannot both validate against the same old balance.

Use the same lock order everywhere: member first, then counter/other rows. Consistent lock ordering reduces deadlock risk.

## 5. Subscription + Initial Payment Transaction

Creating a subscription with an initial payment is one atomic transaction:

```text
BEGIN
  lock member
  validate plan is enabled
  load plan price
  calculate end date
  insert subscription snapshot
  if initial payment > 0:
      recompute projected balance
      validate no overpayment
      calculate/store balance-after-payment snapshot
      lock receipt counter
      allocate receipt number
      insert payment
  insert audit rows
COMMIT
```

If any step fails, neither subscription nor payment is persisted.

## 6. Subscription Edits

Allowed subscription edits must run in a transaction and re-check invariants. Once at least one payment has been recorded against a subscription, its plan, plan snapshot, price, start date, and end date are immutable. Only non-financial metadata such as notes may be edited.

Potentially editable:
- non-financial metadata only, after payment
- plan selection, duration, start date, and agreed price only when no payment has been recorded

On edit:
- reload listed plan price if plan/duration changes
- update snapshots intentionally
- recalculate end date server-side
- verify no overlap
- verify resulting member debt is not negative
- append audit log

Do not allow direct `end_date` editing if it is meant to be derived from start + duration. Keeping it derived reduces contradictory data.

## 7. Void Rules

### Void payment

Voiding a valid payment increases debt and is therefore financially safe with respect to the no-credit invariant.

### Void subscription

Only a subscription with no recorded payments may be voided. A subscription with recorded payments is rejected with `SUBSCRIPTION_HAS_PAYMENTS`. Payments must never be deleted merely because a subscription is voided; reversal and refund workflows are outside the MVP.

## 8. Recommended Indexes

### members
- unique `phone_normalized`
- `(is_archived, name)`
- `join_date`

### plans
- `is_enabled`

### plan_prices
- unique `(plan_id, duration_months)`

### subscriptions
- `member_id`
- `(member_id, start_date desc)`
- `start_date`
- `end_date`
- partial index for non-voided subscriptions if query plans benefit

### payments
- `member_id`
- `(member_id, payment_date desc, created_at desc)`
- `payment_date`
- unique `receipt_number`
- unique `verification_token`

### audit_logs
- `(entity_type, entity_id, created_at desc)`

Avoid speculative indexes until real queries justify them.

## 9. Database Migration Rules

- Every schema change is represented by a committed migration.
- Production never uses `db push`-style schema mutation.
- Review generated SQL before applying.
- Back up production database before risky/destructive migrations.
- Never edit a migration already applied to production.
- Seed scripts must be idempotent or clearly separated from migrations.

## 10. Referential Deletion Policy

The application should avoid deleting business records.

Recommended FK behavior:
- member -> subscription/payment: `RESTRICT`
- plan -> plan_price/subscription: `RESTRICT`
- owner -> audit/session: `RESTRICT` or controlled cleanup for sessions only

Members are archived; plans are disabled; payments/subscriptions are voided. This preserves financial history.
