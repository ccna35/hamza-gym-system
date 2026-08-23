# Financial and Audit Rules

## 1. Financial Source of Truth

Financial history must be reconstructable from persisted transactions.

### Charges
Every non-voided subscription contributes its `agreedPrice` to member charges.

### Payments
Every non-voided payment reduces member balance.

### Debt

`Outstanding Debt = Valid Subscription Charges - Valid Payments`

V1 does not support a negative balance/credit.

## 2. Money Representation

Use integer minor units throughout the application.

- Database monetary columns use `BIGINT`.
- API monetary values are integer minor units.
- `300 EGP = 30000` minor units.

Do not use JavaScript floating-point arithmetic as the authoritative money representation.

Currency for V1: EGP.

## 3. Subscription Creation With Initial Payment

Subscription creation and optional initial payment must be atomic.

Either both records are created successfully or neither is created.

## 4. Overpayment Protection

Before inserting a payment:
1. Calculate/retrieve current outstanding balance.
2. Validate `0 < payment <= outstanding balance`.
3. Protect against concurrent payment submissions with a transaction/locking or equivalent serialization strategy.

## 5. Payment Immutability

After creation, the financial amount is immutable.

Correction workflow:
- Void incorrect payment.
- Record reason.
- Create correct payment.

## 6. Revenue Calculation

Revenue reports count valid payments by `paymentDate`.

A payment entered on August 20 with `paymentDate = August 19` contributes to August 19 business revenue, while its `createdAt` remains August 20 for audit purposes.

Voided payments are excluded.

## 7. Receipt Number and Verification

Use two concepts:

### Receipt Number
Human-readable identifier in the format `REC-YYYY-NNNNNN`, such as:
- `REC-2026-000001`

The sequence may restart each calendar year. Receipt numbers are public/business identifiers and are separate from internal database IDs.

### Verification Token
Random, unique, unpredictable token used by QR/public verification.

Do not expose sequential database IDs as verification secrets.

## 8. Receipt Status

Receipt validity follows payment status.

- Valid payment -> valid receipt.
- Voided payment -> voided/invalid receipt.

## 9. Audit Events

At minimum create audit events for:
- Member created/edited/archived/restored.
- Plan created/edited/enabled/disabled.
- Subscription created/edited/voided.
- Payment created/voided.

Financial corrections must always be auditable.

## 10. Audit Event Structure

Recommended fields:
- actor owner ID.
- action.
- entity type.
- entity ID.
- before state.
- after state.
- reason/metadata.
- timestamp.

## 11. Audit Retention

V1 should not offer UI actions to delete audit events.

## 12. Subscription Cancellation

No cancellation transaction or debt-forgiveness adjustment is implemented in V1.

If the real gym later needs cancellation/refund/forgiveness, define its accounting behavior before implementation.

## 13. Voiding a Subscription With Existing Payments

Only a subscription with no recorded payments may be voided.

A subscription with recorded payments must not be voided directly. Payments must never be deleted merely because a subscription is voided. Since payment reversal and refund workflows are outside the MVP, attempts to void a subscription whose paid amount is greater than zero are rejected.

Voiding a subscription with no recorded payments removes its charge from current debt calculations while preserving the historical record.


## Balance-after-payment snapshot

When a payment is recorded, store the member's outstanding balance immediately after that payment as a historical receipt snapshot. This value is not used to calculate the member's current debt; current debt is always derived from valid subscriptions minus valid payments. The snapshot exists so a receipt reprinted later shows the same post-payment balance that was shown when the payment was originally recorded.
