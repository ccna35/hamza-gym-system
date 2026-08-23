# V1 Scope

## Goal

Deliver the smallest reliable system that can replace manual membership/payment tracking for a single gym owner.

## In Scope

### User Interface
- Arabic-only interface.
- RTL-only layout.
- Responsive/mobile-friendly owner workflows.
- Desktop right-side sidebar and mobile right-side navigation drawer.
- Custom Tailwind-based UI components; no shadcn/ui.

### Authentication
- One owner account.
- Login/logout.
- Protected admin application.

### Members
- Create member.
- View member.
- Edit member.
- Archive member.
- Restore archived member.
- Search/list members.
- Unique phone number.
- Webcam photo capture.
- Current height and weight.

### Plans
- Create plan.
- Edit plan name.
- Edit price for 1, 3, 6, and 12 months.
- Enable/disable plan.
- Hide disabled plans from new subscription forms.

### Subscriptions
- Create subscription.
- Choose plan.
- Choose duration from fixed list.
- Choose start date.
- Override final agreed price, including zero.
- Calculate end date.
- Prevent overlapping subscriptions.
- Renew before expiration.
- Renew after expiration.
- Edit subscription with audit trail.
- Void mistakenly-created subscription.

### Payments
- Cash only.
- Record initial payment with subscription.
- Record later debt payment.
- Reject overpayment.
- Void incorrect payment.
- Keep payment history.

### Debt
- Maintain member-level running debt.
- Carry debt across renewals.
- Show debt on member profile.
- Show gym-wide outstanding debt.

### Receipts
- Generate printable/downloadable receipt from payment.
- Human-readable receipt number.
- Random verification token/code.
- QR-based verification.
- Public receipt verification page.
- Show receipt as voided if underlying payment was voided.

### Dashboard
- Active members.
- Expired memberships.
- Expiring within next 7 days.
- New members this month.
- Revenue today.
- Revenue this month.
- Total outstanding debt.
- Members with outstanding balances.

### Audit Log
- Track meaningful changes to members, plans, subscriptions, and payments.

### Deployment Baseline
- Development PostgreSQL runs through Docker Compose.
- React and NestJS may run directly with local dev commands for faster development.
- Production PostgreSQL is an external managed PostgreSQL service accessed through a standard `DATABASE_URL`.
- Production must remain provider-agnostic and must not depend on Supabase-specific database/auth APIs.
- Member photos are stored on persistent server/VPS storage and backed up separately from PostgreSQL.

## Explicitly Out of Scope

- Check-in/attendance.
- Trainers.
- Member login.
- Notifications.
- Freezing.
- Subscription cancellation.
- Multi-gym/multi-branch.
- Online payment methods.
- Payment allocation per subscription.
- Credit balance/overpayment.
- Gym profile/settings on receipts.
- Most popular plan metric.

## Scope Guardrails

During V1 implementation, a feature should not be added unless it is required to complete one of the in-scope workflows.

If a new business question is discovered, record it as an open question instead of silently designing new behavior.
