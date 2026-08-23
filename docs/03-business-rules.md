# Business Rules

## BR-001 — Single Gym
The system serves one gym only in V1.

## BR-002 — Owner Only
Only the owner uses the application in V1.

## BR-003 — Unique Member Phone
Every non-archived or archived member record must retain a globally unique phone number unless the business rule is intentionally changed later.

## BR-004 — Archive Instead of Delete
Members with history are not permanently deleted. They are archived.

## BR-005 — Fixed Durations
Allowed subscription durations are exactly 1, 3, 6, or 12 months.

## BR-006 — Disabled Plan Visibility
Disabled plans must not appear when creating a new subscription.

## BR-007 — Historical Snapshot
Changing a plan does not alter an existing subscription's historical listed price, agreed price, duration, or dates.

## BR-008 — Owner Chooses Start Date
The owner chooses the subscription start date, except early renewal where the next start date is derived from the current subscription's end date.

## BR-009 — Inclusive End Date
A subscription beginning August 20 for one month is active through September 19.

## BR-010 — No Overlap
Two non-voided subscriptions for the same member must not have overlapping date ranges.

## BR-011 — Early Renewal
If renewed before current expiration, the next subscription starts the day after the current subscription ends.

## BR-012 — Renewal After Expiration
If no active/future subscription blocks the requested period, the owner may choose the renewal start date.

## BR-013 — Any Enabled Plan on Renewal
A member may renew using any enabled plan and any supported duration.

## BR-014 — No Mid-Subscription Plan Change Workflow
V1 does not implement upgrade/downgrade behavior during an active subscription.

## BR-015 — Partial Payment Allowed
A subscription becomes valid regardless of whether the member pays the full agreed amount.

## BR-016 — Zero Initial Payment Allowed
A subscription may be created without a payment.

## BR-017 — Zero Agreed Price Allowed
The owner may set the agreed subscription price to zero.

## BR-018 — No Discount Field
Discount is derived from listed price minus agreed price when needed.

## BR-019 — Debt Is Member-Level
Payments are not allocated to individual subscriptions. Debt is tracked at the member level.

## BR-020 — Debt Carries Forward
Unpaid debt remains after a subscription expires and across future renewals.

## BR-021 — Debt-Only Payment Allowed
A member may make a payment without creating a new subscription.

## BR-022 — Cash Only
All V1 payments use cash as the payment method.

## BR-023 — No Overpayment
Payment amount must be greater than zero and no greater than the member's current outstanding balance.

## BR-024 — Payments Are Immutable
A recorded payment amount/date is not edited in place for correction.

## BR-025 — Void Instead of Delete
Incorrect payments are voided and retained in history.

## BR-026 — Voided Payment Has No Financial Effect
A voided payment must not reduce member debt or count toward revenue.

## BR-027 — Revenue Means Cash Received
Revenue reports sum valid payments by payment date, not subscription charges.

## BR-028 — Payment Date May Be Backdated
The owner may enter a business payment date earlier than the record creation timestamp.

## BR-029 — Record Creation Timestamp Is Immutable
The system keeps the actual time a payment was entered separately from its business payment date.

## BR-030 — Receipt Comes From Payment
Every receipt represents one payment. No standalone receipt exists without a payment.

## BR-031 — Receipt Authenticity
Receipt authenticity is verified using a random verification token, not the sequential receipt number.

## BR-032 — Voided Receipt Verification
If a payment is voided, receipt verification must show that receipt/payment as voided or invalid.

## BR-033 — Expiring Soon
Expiring soon means active subscription with end date within the next 7 days.

## BR-034 — Subscription Access Based on Dates
Member access state is determined by subscription dates, not debt or payment completion.

## BR-035 — Cancellation Deferred
Subscription cancellation is not implemented in V1. No cancellation financial policy should be inferred.

## BR-036 — Paid Subscription Terms Are Immutable
Once at least one payment has been recorded against a subscription, its plan, plan snapshot, price, start date, and end date are immutable. Non-financial metadata such as notes may still be edited.

## BR-037 — Subscription Void Rules
A subscription with no recorded payments may be voided. A subscription with recorded payments must not be voided directly. Payments are never deleted because a subscription is voided. Payment reversal and refund workflows are outside the MVP.
