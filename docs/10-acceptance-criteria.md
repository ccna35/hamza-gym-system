# Acceptance Criteria

## Members

### AC-M-001
Given a phone number already belongs to a member, when the owner tries to create another member with the same phone, then creation is rejected.

### AC-M-002
Given valid member information, when the owner saves without creating a subscription, then the member is successfully created.

### AC-M-003
When a member is archived, their subscriptions and payments remain accessible in history.

## Plans

### AC-P-001
A plan must support prices for exactly 1, 3, 6, and 12 months.

### AC-P-002
When a plan is disabled, it no longer appears in the new subscription plan selector.

### AC-P-003
When a plan price changes, existing subscriptions retain their previous listed-price snapshot and agreed price.

## Subscriptions

### AC-S-001
Owner can create a subscription with zero payment.

### AC-S-002
Owner can create a subscription with agreed price zero.

### AC-S-003
For a one-month subscription beginning 2026-08-20, the calculated end date is 2026-09-19.

### AC-S-004
If an existing non-voided subscription overlaps a requested subscription date range, creation is rejected.

### AC-S-005
If a member renews before expiration, the new subscription begins the day after the current subscription end date.

### AC-S-006
If a member has no active blocking subscription, the owner can choose the new start date.

### AC-S-007
A member with unpaid debt may still have an active subscription.

### AC-S-008
Editing a subscription creates an audit event containing enough information to understand what changed. After any payment has been recorded against it, its plan, snapshot, price, start date, and end date cannot be edited; non-financial metadata may still be edited.

### AC-S-009
Voiding a mistaken subscription removes its charge from debt calculations while preserving the historical record.

### AC-S-011
A subscription with recorded payments cannot be voided, and no payment is deleted as a result of voiding a subscription.

## Payments

### AC-PAY-001
Owner can record a payment without creating a subscription.

### AC-PAY-002
A payment greater than member outstanding debt is rejected.

### AC-PAY-003
A payment equal to outstanding debt is accepted and leaves zero balance.

### AC-PAY-004
A payment may use a prior business payment date.

### AC-PAY-005
After a payment is recorded, its amount cannot be edited.

### AC-PAY-006
Voiding a payment restores its amount to the member's outstanding balance.

### AC-PAY-007
Voided payments are excluded from revenue reports.

## Receipts

### AC-R-001
Every valid payment has a unique human-readable receipt number.

### AC-R-002
Every receipt has a unique unpredictable verification token/code.

### AC-R-003
Scanning the receipt QR opens a public verification result.

### AC-R-004
A valid receipt verification shows receipt number, member name, amount, payment date, and valid status.

### AC-R-005
If the underlying payment is voided, receipt verification shows voided/invalid status.

### AC-R-006
An unknown verification token does not reveal private member data.

## Dashboard

### AC-D-001
Revenue today equals the sum of valid payments whose payment date is today.

### AC-D-002
Revenue this month equals the sum of valid payments whose payment date falls in the current month.

### AC-D-003
Total outstanding debt equals the sum of member positive outstanding balances.

### AC-D-004
Expiring list includes active subscriptions ending within the next 7 days.

### AC-D-005
Dashboard shows both total debt and a member-level debt list.

## Scope

### AC-SCOPE-001
No V1 screen or endpoint implements subscription cancellation.

### AC-SCOPE-002
No V1 functionality depends on attendance, trainers, member accounts, notifications, or online payments.

### AC-S-010
Given that a subscription has recorded payments, when the owner tries to void it, then the system rejects the operation with `SUBSCRIPTION_HAS_PAYMENTS` and does not delete or reverse any payment.


## API Contract

### AC-API-001
All persisted/calculated monetary values exposed through the API are integer minor units; no financial API field uses floating-point EGP amounts.

### AC-API-002
All handled errors follow the documented `{ statusCode, code, message, details }` contract and user-facing messages are Arabic.

### AC-API-003
All paginated endpoints use the documented `{ items, pagination }` shape with 1-based pages.

### AC-API-004
The frontend does not invent debt, end dates, listed prices, receipt numbers, or subscription status; authoritative values come from the API.

## Arabic / RTL / Responsive UI

### AC-UI-001
The application root renders with `lang="ar"` and `dir="rtl"`, and all owner-facing product text is Arabic.

### AC-UI-002
At 360px viewport width, login, member search/list, member create/edit, member profile, subscription creation/renewal, payment creation, plan management, receipt view, and public receipt verification are usable without horizontal page scrolling.

### AC-UI-003
Below the desktop breakpoint, the persistent right sidebar is replaced by a right-side off-canvas navigation drawer with backdrop and keyboard/focus-safe close behavior.

### AC-UI-004
Dense desktop tables use a mobile card/list representation or another explicitly responsive layout rather than forcing unreadably small columns.

### AC-UI-005
Primary form controls and actions are touch-friendly and do not require hover to discover essential functionality.

### AC-UI-006
Member photo capture works with a desktop webcam and provides a mobile camera/file capture fallback.

### AC-UI-007
No shadcn/ui component is imported or generated in the frontend codebase.
