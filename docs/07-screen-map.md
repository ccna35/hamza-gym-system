# Screen Map and Responsive UI Behavior — V1

This document defines the owner-facing screens and their responsive behavior. The application is **Arabic-only, RTL-only, and mobile-friendly**.

## Global Application Shell

### Desktop (`lg` and above, approximately 1024px+)
- Persistent navigation sidebar on the **right**.
- Top bar for page title and contextual actions.
- Main content uses the remaining width and may be constrained to a comfortable maximum width.
- Sidebar must not rely on LTR-specific positioning.

### Mobile/tablet below `lg`
- Sidebar becomes a right-side off-canvas drawer.
- Top bar contains menu trigger, page title, and only the most important page action.
- Opening the drawer adds a backdrop and traps focus; Escape/backdrop closes it.
- Main pages must not require horizontal page scrolling.

### Shared responsive rules
- Use `lang="ar"` and `dir="rtl"` at document root.
- Use logical CSS/Tailwind RTL-safe positioning where possible.
- Forms: one column on small screens; two columns only when space allows.
- Buttons/interactive controls: touch-friendly, target height around 44px minimum for primary controls.
- Long button groups wrap/stack on mobile.
- Destructive actions are never hidden behind hover-only interactions.
- Desktop tables that are too dense become mobile cards/list rows below `md` rather than shrinking text excessively.
- Empty/loading/error states are responsive and Arabic.

## 1. Login

Purpose:
- Authenticate owner.

Responsive behavior:
- Centered login card on desktop.
- Full-width card with page padding on mobile.
- Username/password fields remain comfortably tappable.

## 2. Dashboard

Widgets/sections:
- Active members.
- Expired memberships.
- Expiring in next 7 days.
- New members this month.
- Revenue today.
- Revenue this month.
- Total outstanding debt.
- Members with outstanding balances.

Primary shortcuts:
- Add member.
- Record payment through member search/selection.
- View expiring members.

Responsive behavior:
- KPI cards: 1 column on very small screens, 2 columns on tablet, 3–4 columns on desktop as space allows.
- Debtor/expiring tables become stacked cards on mobile.
- Monetary values remain visually prominent and never truncate silently.

## 3. Members List

Features:
- Search by name or phone.
- Active/archived filter.
- Subscription state filter.
- Debt filter.
- Outstanding balance display.
- Add member button.

Desktop:
- Table/list with name, phone, subscription state, expiration, debt, and row action.

Mobile:
- Member cards showing name, phone, subscription badge, expiration, and debt.
- Search input spans full width.
- Filters may collapse into a filter drawer/popover.
- Entire card or explicit button opens member profile.

## 4. Add/Edit Member

Fields:
- Name.
- Phone.
- Gender.
- Date of birth.
- Webcam/camera photo capture.
- Height.
- Weight.
- Join date.

Registration may be completed without a subscription.

Responsive behavior:
- One-column form on mobile.
- Two-column form on wider screens where related fields fit naturally.
- Photo capture area is full-width on mobile.
- Desktop uses `getUserMedia` webcam capture.
- Mobile should also support device camera capture; provide a file/camera fallback if live camera APIs are unavailable.
- Save/cancel actions stack on narrow screens.

## 5. Member Profile

Header:
- Photo.
- Name.
- Phone.
- Age/date of birth.
- Height/weight.
- Join date.

Summary cards:
- Current subscription/status.
- Expiration date.
- Outstanding balance.

Actions:
- Create/Renew Subscription.
- Record Payment.
- Edit Member.
- Archive/Restore.

Sections/tabs:
- Subscription history.
- Payment history.
- Receipts.
- Audit history.

Responsive behavior:
- Header becomes stacked on mobile.
- Summary cards stack or use a 2-column compact grid where space permits.
- Primary actions become full-width/stacked or wrap without overflow.
- History tables render as cards on mobile.

## 6. Create/Renew Subscription

Fields:
- Plan: enabled plans only.
- Duration: 1/3/6/12 months.
- Listed price: loaded from server/current plan.
- Agreed price: editable.
- Start date for normal creation.
- Calculated end date (read-only, server authoritative).
- Optional amount paid now.
- Optional payment date when initial payment is provided.

Warnings:
- Existing debt.
- Overlapping subscription.
- Disabled/stale plan data if concurrent change occurs.

Responsive behavior:
- Use a full page or large responsive panel rather than a tiny modal.
- On mobile all fields are single column and summary totals remain visible before submit.

## 7. Record Payment

Displays:
- Member.
- Current outstanding balance.

Fields:
- Amount.
- Payment date.
- Payment method fixed to Cash; no selectable payment-method control is needed.

After save:
- New balance.
- Receipt preview/download/print.

Responsive behavior:
- Mobile-first single-column form.
- Amount and current debt are visually prominent.
- Submit is disabled during mutation to prevent accidental double submission.

## 8. Payment/Receipt Detail

Displays:
- Receipt number.
- Verification code/QR.
- Member.
- Amount.
- Payment date.
- Recorded timestamp.
- Status.
- Historical balance after this payment.

Actions:
- Print/download PDF.
- Void payment.

Responsive behavior:
- Receipt preview scales to viewport without sideways scrolling.
- QR remains large enough for phone scanning.
- Print/PDF stylesheet is independent from responsive screen styling.

## 9. Plans List

Displays:
- Plan name.
- Enabled state.
- Price for 1, 3, 6, and 12 months.

Actions:
- Add plan.
- Edit plan.
- Enable/disable.

Responsive behavior:
- Desktop may use a table.
- Mobile uses one card per plan with a compact 2x2 duration-price grid.

## 10. Plan Form

Fields:
- Name.
- 1-month price.
- 3-month price.
- 6-month price.
- 12-month price.

Enabled/disabled state is changed using explicit enable/disable actions, not mixed into the create/edit form.

## 11. Audit Log

Filters:
- Date range.
- Entity type.
- Action.

Displays before/after details where applicable.

Responsive behavior:
- Desktop table/detail drawer is acceptable.
- Mobile uses stacked audit cards with expandable before/after data.

## 12. Public Receipt Verification

No authentication required.

Loaded directly from QR verification token.

Displays:
- Verified / Voided / Invalid status.
- Receipt number.
- Member name.
- Amount.
- Payment date.

Responsive behavior:
- Designed mobile-first because QR verification is likely to be opened on a phone.
- Large status indicator and readable receipt summary.
- No private member data beyond the defined verification fields.
