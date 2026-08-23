# Development Backlog

This backlog is ordered to reduce risk by implementing domain rules before dashboards and polish.

## Epic 0 — Technical Foundation

- Choose frontend/backend/database stack.
- Repository setup.
- Environment configuration.
- Database migrations.
- Authentication strategy.
- Error response conventions.
- Logging.
- Validation.
- Test setup.

## Epic 1 — Owner Authentication

- Seed/create initial owner.
- Login.
- Logout.
- Session/token validation.
- Route protection.

## Epic 2 — Members

- Member schema/migration.
- Create member API.
- Unique phone validation.
- Member list/search.
- Member detail.
- Edit member.
- Archive/restore member.
- Webcam photo capture/storage.
- Height/weight fields.

## Epic 3 — Plans

- Plan schema.
- Plan price schema.
- Fixed duration validation.
- Create plan.
- Edit plan.
- Enable/disable.
- Enabled-plan query for subscription form.

## Epic 4 — Subscription Domain

- Subscription schema.
- Month-based end-date calculation.
- Snapshot plan name/listed price.
- Agreed price override.
- Zero-price support.
- Date-derived state helper.
- Overlap detection.
- Subscription creation.
- Early renewal behavior.
- Expired renewal behavior.
- Subscription edit + audit.
- Subscription void + audit.

## Epic 5 — Member Balance

- Member-level charge calculation.
- Member-level valid payment calculation.
- Outstanding balance service/query.
- Debt shown on member profile.

## Epic 6 — Payments

- Payment schema.
- Cash-only payment creation.
- Backdated payment date.
- Overpayment validation.
- Transaction/concurrency protection.
- Debt-only payment flow.
- Initial payment in subscription transaction.
- Payment history.
- Void payment.
- Audit payment events.

## Epic 7 — Receipts

- Receipt numbering strategy.
- Verification token generation.
- QR generation.
- Receipt UI/PDF/print layout.
- Public verification endpoint.
- Public verification page.
- Voided receipt state.

## Epic 8 — Dashboard

- Active member count.
- Expired membership count.
- Expiring-next-7-days query.
- New members this month.
- Revenue today.
- Revenue this month.
- Total debt.
- Debtor list.

## Epic 9 — Audit UI

- Audit log query.
- Member audit timeline.
- Global audit screen.
- Before/after rendering.

## Epic 10 — Hardening

- Authorization tests.
- Financial rule tests.
- Subscription overlap tests.
- Date boundary tests.
- Concurrent payment tests.
- Receipt verification abuse/rate-limit protection.
- Input sanitization.
- Backup strategy.
- Production database migration strategy.
- Error monitoring/logging.

## Epic 11 — Deployment

- Production environment.
- HTTPS.
- Database backup.
- Photo storage backup.
- Secrets management.
- Deployment process.
- Restore test.

## Recommended Build Order

1. Foundation/auth.
2. Members.
3. Plans.
4. Subscriptions.
5. Balance/debt.
6. Payments.
7. Receipts.
8. Dashboard.
9. Audit UI.
10. Hardening/deployment.

Do not start dashboard work before subscription/payment/debt rules are proven by tests.
