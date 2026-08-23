# Arabic RTL Responsive UI Specification — V1

## 1. Design Goal

Create a simple, premium-feeling operational dashboard for a gym owner. It should feel fast and calm rather than decorative. The user must be able to complete financial/member workflows comfortably from a desktop reception computer or a phone.

Language: Arabic only. Direction: RTL only.

## 2. Visual Foundation

Recommended typography:
- `Noto Sans Arabic` (bundled through a package such as `@fontsource/noto-sans-arabic`) or an equivalent high-quality Arabic sans font.
- Fallback: `system-ui, sans-serif`.

General style:
- neutral background
- white/elevated surfaces
- restrained borders/shadows
- one primary accent color
- strong contrast for money/status
- limited animation, mostly drawer/dialog/feedback transitions
- avoid excessive gradients, glassmorphism, and dashboard decoration

Do not use shadcn/ui.

## 3. Breakpoints

Use Tailwind defaults unless implementation needs a documented adjustment:

```text
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

Behavior is mobile-first.

## 4. Application Shell

### Mobile `< lg`
- top app bar height around 56–64px
- menu button on the right/start side
- page title
- optional single primary action on opposite side
- navigation drawer opens from right
- backdrop covers content
- drawer width: `min(85vw, 320px)`
- body scrolling locked while drawer open

### Desktop `>= lg`
- fixed/sticky right sidebar around 250–280px
- main content fills remaining width
- top header inside content region
- optional sidebar collapse is not required for V1

## 5. Spacing and Sizing

Recommended page padding:
- mobile: 16px
- tablet: 20–24px
- desktop: 24–32px

Primary inputs/buttons:
- minimum practical control height ~44px
- clear focus ring
- label above field
- validation message directly below field

Cards:
- rounded but not pill-like
- consistent padding
- no cramped 8px desktop-only spacing patterns on mobile

## 6. Navigation

Suggested items:
- لوحة التحكم
- الأعضاء
- الخطط
- سجل العمليات
- تسجيل الخروج

Use Lucide icons consistently.

Active item should be recognizable by more than color alone (background/indicator/font weight).

## 7. Tables vs Mobile Lists

For `md+`, data-heavy pages may use semantic tables.

Below `md`, use cards/list rows for:
- members
- subscriptions
- payments
- debtors
- expiring memberships
- plans
- audit logs

A mobile card should show only the information needed to identify/action the record; additional fields belong on detail page.

Never solve mobile tables by shrinking font below comfortable reading size.

## 8. Forms

Mobile:
- single-column fields
- full-width primary action
- secondary action beneath or beside if it fits
- avoid multi-step wizard unless form becomes genuinely too long

Desktop:
- use two columns for naturally paired fields (height/weight, dates where appropriate)
- keep name/phone/photo areas readable rather than maximizing density

Money fields:
- visible `ج.م` context in UI
- user enters EGP decimal representation; frontend converts safely to integer minor units for API
- backend remains authoritative

Dates:
- display in Arabic UI format, but send API as `YYYY-MM-DD`
- do not let locale formatting leak into API payloads

## 9. Member List

Desktop row:
- name/photo
- phone
- subscription status
- expiry
- debt
- open action

Mobile card:
- name + small photo
- phone
- status badge
- `ينتهي في ...` or `لا يوجد اشتراك`
- debt line if > 0
- tap/open action

Search stays visible at top. Filters may open a compact sheet/popover on mobile.

## 10. Member Profile

Mobile order:
1. identity/photo/name/phone
2. current subscription card
3. debt card
4. primary actions
5. profile facts
6. history sections

Desktop may place identity + financial cards side by side.

Primary actions:
- تجديد / إضافة اشتراك
- تسجيل دفعة

Secondary actions:
- تعديل البيانات
- أرشفة / استعادة

## 11. Subscription Form

Show a clear price summary:
- plan
- duration
- listed price
- agreed price
- calculated start/end dates
- existing debt
- optional payment now
- projected debt after operation when server response is available; do not duplicate authoritative financial calculations client-side before submit beyond presentation hints

If early renewal endpoint is used, start date is read-only and explained as the day after the latest subscription ends.

## 12. Payment Form

Top summary:
- member name
- outstanding balance

Fields:
- amount
- payment date

Do not render a payment-method selector because V1 is cash-only; show `الدفع نقدي` as static context if needed.

After success, navigate/show receipt detail rather than leaving the user uncertain whether the payment was recorded.

## 13. Receipt Screen

Mobile-first.

Show:
- clear `إيصال صالح` or `إيصال ملغي`
- receipt number
- member
- amount
- payment date
- balance after payment
- verification QR
- verification code
- print/download actions for owner view

Public verification screen excludes balance and phone; it shows only contract-defined public fields.

## 14. Dashboard

KPI cards:
- active
- expired
- expiring 7 days
- new this month
- revenue today
- revenue month
- total debt

Mobile: 1 or 2 columns depending card content; never squeeze large money values.

Below metrics:
- debtors list
- expiring list

Avoid charts in V1 unless a later requirement adds a real decision-making use case.

## 15. Status Language

Recommended Arabic labels:

```text
ACTIVE     -> نشط
SCHEDULED  -> قادم
EXPIRED    -> منتهي
VOIDED     -> ملغي
NONE       -> بدون اشتراك
VALID receipt -> صالح
VOIDED receipt -> ملغي
Enabled plan  -> مفعلة
Disabled plan -> معطلة
```

Code enums remain English; only presentation labels are Arabic.

## 16. Feedback States

Every server-driven page needs:
- skeleton/loading state
- empty state
- retryable error state

Mutations need:
- disabled/submitting control
- success feedback
- Arabic error message from stable error mapping/API message

Do not use browser `alert()`/`confirm()` for production UX. Use project-owned dialog/feedback components.

## 17. Accessibility

- keyboard-focus visible
- dialog focus management
- labels associated with inputs
- icon-only buttons have Arabic accessible labels
- color is not the only state signal
- adequate contrast
- respect reduced-motion preference for nonessential animation

## 18. Mobile Verification Checklist

At 360px width verify:
- no horizontal body overflow
- drawer usable
- all form labels/inputs visible
- sticky/fixed elements do not cover content
- member cards readable
- money values do not clip
- QR receipt stays fully visible
- primary buttons are tappable
- dialogs/panels fit viewport and can scroll internally when necessary
