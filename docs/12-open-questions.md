# Deferred and Open Questions

These items are intentionally not implemented until the real gym owner provides a business decision or they become part of V2.

## 1. Subscription Cancellation

Questions to ask the gym owner:
- Can an active subscription be cancelled for a legitimate business reason?
- Does access stop immediately or on a chosen date?
- Does remaining unpaid debt stay due?
- Can debt be waived?
- Can already-paid cash be refunded?
- If refunds exist, how should they be recorded and reported?

Until answered, V1 has no cancellation feature.

## 2. Refunds

V1 has no refund transaction type. If the gym needs refunds, define the accounting rules before implementation.

## 3. Future Candidate Features

Not part of V1:
- Attendance/check-in.
- Subscription freezing.
- Notifications.
- Trainers.
- Member portal.
- Multiple branches.
- Digital payments.
- Credits/overpayments.
- Refunds.
- Cancellation.
- Historical body measurements.
- Most-popular-plan analytics.


## 4. Production PostgreSQL Provider Selection

Deferred until deployment. The application must remain standard-PostgreSQL compatible. Before choosing a provider, verify support for the project's Prisma version, SSL, connection limits, backups, restoration, and any PostgreSQL features actually required by the final schema. Do not introduce PostgreSQL extensions without a concrete requirement. If `btree_gist` is considered for overlap enforcement, document the exact constraint it supports and whether the invariant can reasonably be enforced without it first.
