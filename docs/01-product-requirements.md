# Gym Management System — Product Requirements

Version: 1.1  
Date: 2026-08-20  
Status: Requirements frozen for V1

## 1. Product Summary

A single-gym, owner-only web application for managing members, membership plans, subscriptions, cash payments, outstanding member debt, receipts, and high-level business reporting.

The system is intended for real operational use by one gym.

## 2. Primary User

### Owner

The owner is the only authenticated system user in V1.

The owner can:
- Create and manage members.
- Create and manage membership plans.
- Create and renew subscriptions.
- Record cash payments.
- View member debt.
- Void incorrect payments.
- Print or download receipts.
- Verify issued receipts.
- View dashboard metrics and financial summaries.
- Review audit history.
- Archive members.

## 3. Member Data

Each member contains:
- Full name.
- Unique phone number.
- Gender.
- Date of birth.
- Photo captured from a webcam.
- Height in centimeters.
- Weight in kilograms.
- Join date.
- Archived flag/status.

V1 stores only the member's current height and weight. Historical body measurements are out of scope.

## 4. Membership Plans

A plan has:
- Name.
- Enabled/disabled state.
- Prices for the supported durations.

Supported durations are fixed:
- 1 month.
- 3 months.
- 6 months.
- 12 months.

Example:

| Duration | Price |
|---|---:|
| 1 month | 300 EGP |
| 3 months | 800 EGP |
| 6 months | 1,500 EGP |
| 12 months | 2,800 EGP |

The owner can:
- Create plans.
- Rename plans.
- Change prices.
- Enable or disable plans.

Disabled plans must not appear as options when creating a new subscription. Existing subscriptions retain their historical plan information.

## 5. Subscriptions

A member may have multiple subscriptions over time, but subscriptions must not overlap.

When a subscription is created, the owner selects:
- Member.
- Plan.
- Duration.
- Start date.
- Final agreed price.
- Optional initial cash payment.

The subscription snapshots the commercial terms at creation time so later plan changes do not alter historical subscriptions.

A subscription stores or preserves conceptually:
- Selected plan identity/name.
- Selected duration.
- Listed/default plan price at creation time.
- Final agreed price.
- Start date.
- End date.

There is no separate discount field. Any discount can be derived as:

`listed price - agreed price`

The agreed price may be zero.

### Subscription Dates

A subscription starting on August 20 for one month is active through September 19. September 20 is the first expired day.

### Subscription State

V1 uses these concepts:
- Scheduled: start date is in the future.
- Active: current date is within the subscription period.
- Expired: current date is after the end date.
- Voided: manually invalidated because it was created incorrectly.

Scheduled, active, and expired should preferably be derived from dates rather than maintained through frequent status updates.

### Access Rule

Subscription access is determined by subscription dates, not payment completion.

A member may have an active subscription while still owing money.

### Renewal Rules

If a member renews before the current subscription expires, the next subscription starts immediately after the current subscription ends.

If a member renews after expiration, the owner chooses the new start date.

A member may renew using any currently enabled plan and any supported duration.

Mid-subscription plan upgrades or downgrades are not supported in V1. Keep the workflow simple and handle future plan changes through renewal.

## 6. Payments and Debt

Payments are cash only in V1.

Payments apply to the member's overall balance rather than being allocated to a specific subscription.

Debt is conceptually:

`total valid subscription charges - total valid cash payments`

The owner may:
- Record payment during subscription creation.
- Create a subscription with zero initial payment.
- Record a debt-only payment later without creating a subscription.

Overpayment is not allowed. A payment amount must not exceed the member's outstanding balance at the time the payment is recorded.

Existing debt carries forward across subscription renewals.

## 7. Payment Corrections

Payments must not be edited or deleted after creation.

If a payment was entered incorrectly:
1. Void the incorrect payment.
2. Preserve it in history.
3. Record a new correct payment if needed.

Voided payments do not reduce member debt and must be visibly marked as voided.

## 8. Receipts

A receipt is generated from a valid payment. It is not an independent financial transaction.

A receipt should include:
- Human-readable receipt number.
- Member name.
- Member phone number on the owner receipt; public verification uses a masked phone number only.
- Amount received.
- Payment method: Cash.
- Payment date.
- Outstanding balance after the payment.
- Verification code.
- QR code for verification.

Do not include owner or gym profile data in the V1 receipt.

Receipt verification should use a random, non-predictable verification token. Sequential receipt numbers are for human/accounting convenience and are not a security feature.

A public verification page should display enough information to establish authenticity, for example:
- Receipt number.
- Member name.
- Masked phone number.
- Amount.
- Payment date.
- Valid or voided status.

## 9. Dashboard

Dashboard metrics:
- Active members.
- Expired memberships.
- Subscriptions expiring within the next 7 days.
- New members this month.
- Revenue today.
- Revenue this month.
- Total outstanding debt.
- List of members with outstanding balances.

Revenue means cash actually received, not subscription charges created.

"Expiring soon" means active subscriptions whose end date falls within the next 7 calendar days.

Most popular plan is deferred.

## 10. User Interface and Device Requirements

The application is Arabic-only and RTL-only in V1.

Requirements:
- All owner-facing visible text is Arabic.
- The root document uses `lang="ar"` and `dir="rtl"`.
- No language switcher or i18n framework is required.
- Layouts use logical CSS directions (`inline-start` / `inline-end`) rather than hard-coded left/right assumptions where possible.
- The UI is mobile-friendly and must remain fully usable on common phone, tablet, laptop, and desktop widths.
- Primary workflows — member search, member creation, subscription creation/renewal, payment recording, receipt viewing/verification, and dashboard review — must work without horizontal page scrolling on mobile.
- Desktop uses a persistent right-side navigation sidebar; mobile uses a right-side off-canvas navigation drawer.
- Dense desktop data tables use a mobile card/list representation where necessary instead of forcing a wide table onto a small screen.
- Forms are single-column on small screens and may become multi-column on larger screens.
- Interactive controls should provide touch-friendly target sizes.
- Member photo capture should support desktop webcams and mobile device cameras/fallback image capture.
- The component styling is custom; shadcn/ui is not used.

The receipt print/PDF layout is separate from the responsive application layout and should remain clean when printed.

## 11. Auditability

The system must keep an audit trail for important business changes, including at minimum:
- Subscription edits.
- Payment voids.
- Member archival/restoration.
- Significant member changes.
- Plan price/name/state changes.

Each audit event should preserve:
- Actor.
- Action.
- Entity type.
- Entity ID.
- Timestamp.
- Relevant before/after values when applicable.

## 12. Out of Scope for V1

- Attendance/check-in.
- Trainers.
- Trainer schedules or commissions.
- Member accounts/member portal.
- Notifications.
- Subscription freezing.
- Subscription cancellation policy.
- Multi-branch support.
- Online/card/bank payments.
- Advance credit/overpayments.
- Mid-subscription plan upgrade/downgrade workflow.
- Weight/height history.
- Most-popular-plan reporting.

## 13. Deferred Decision

### Subscription Cancellation

The cancellation policy is intentionally deferred until V2 or until the real gym owner defines the expected business behavior.

Do not invent cancellation behavior during implementation.
