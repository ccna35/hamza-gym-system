# API Contract — V1

Status: **Authoritative implementation contract**. The implementation agent must not invent alternate field names, envelopes, enum values, status codes, or mutation behavior when this document defines them.

Base path: `/api/v1`

## 1. Global Conventions

### Authentication
All endpoints require the owner session cookie unless explicitly marked **PUBLIC**.

### Content types
- JSON endpoints: `application/json`
- Photo upload: `multipart/form-data`
- Receipt PDF: `application/pdf`

### IDs
All entity IDs are UUID strings.

### Dates and timestamps
- Business date: `YYYY-MM-DD` (example `2026-08-20`)
- System timestamp: ISO-8601 UTC string (example `2026-08-20T14:30:15.000Z`)

### Money
All API monetary values use **integer minor units**.

```text
1 EGP = 100 minor units
300.00 EGP = 30000
750.50 EGP = 75050
```

Field names that contain money end with `Minor`.

### JSON naming
Use camelCase.

### Nullability
If a response field exists in the defined shape but has no value, return it as `null`; do not randomly omit it.

### Pagination
List endpoints use 1-based pagination.

Default:
- `page=1`
- `limit=20`
- maximum `limit=100`

Response:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

### Error shape
Every handled API error uses:

```json
{
  "statusCode": 422,
  "code": "PAYMENT_EXCEEDS_BALANCE",
  "message": "قيمة الدفع أكبر من المبلغ المستحق",
  "details": null
}
```

`code` is stable and machine-readable. `message` is Arabic user-facing text. Frontend logic must use `code`, not parse `message`.

### Validation-error shape
Invalid DTO/input:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "البيانات المدخلة غير صحيحة",
  "details": {
    "fields": {
      "phone": ["رقم الهاتف غير صحيح"]
    }
  }
}
```

### Common protected errors
- `401 UNAUTHORIZED`
- `400 VALIDATION_ERROR`
- `404 RESOURCE_NOT_FOUND` only when no more specific code is defined
- `500 INTERNAL_ERROR` with a generic Arabic message; never expose stack traces

---

## 2. Shared Response Types

### Owner

```json
{
  "id": "uuid",
  "username": "owner",
  "mustChangePassword": false
}
```

### MemberSummary

```json
{
  "id": "uuid",
  "name": "أحمد محمد",
  "phone": "01012345678",
  "photoUrl": "/api/v1/members/uuid/photo",
  "isArchived": false,
  "subscriptionState": "ACTIVE",
  "subscriptionEndDate": "2026-09-19",
  "outstandingBalanceMinor": 20000
}
```

`subscriptionState` is one of `NONE | SCHEDULED | ACTIVE | EXPIRED` for member summaries. A voided subscription does not become the member's current state.

### MemberDetail

```json
{
  "id": "uuid",
  "name": "أحمد محمد",
  "phone": "01012345678",
  "gender": "MALE",
  "dateOfBirth": "1995-06-12",
  "photoUrl": null,
  "heightCm": 178.0,
  "weightKg": 82.5,
  "joinDate": "2026-08-20",
  "isArchived": false,
  "archivedAt": null,
  "currentSubscription": null,
  "nextSubscription": null,
  "outstandingBalanceMinor": 0,
  "createdAt": "2026-08-20T14:30:15.000Z",
  "updatedAt": "2026-08-20T14:30:15.000Z"
}
```

`gender`: `MALE | FEMALE`.

### Plan

```json
{
  "id": "uuid",
  "name": "العادي",
  "isEnabled": true,
  "prices": [
    { "durationMonths": 1, "priceMinor": 30000 },
    { "durationMonths": 3, "priceMinor": 80000 },
    { "durationMonths": 6, "priceMinor": 150000 },
    { "durationMonths": 12, "priceMinor": 280000 }
  ],
  "createdAt": "2026-08-20T14:30:15.000Z",
  "updatedAt": "2026-08-20T14:30:15.000Z"
}
```

Every plan has exactly four price entries: durations `1`, `3`, `6`, `12`, sorted ascending.

### Subscription

```json
{
  "id": "uuid",
  "memberId": "uuid",
  "planId": "uuid",
  "planNameSnapshot": "العادي",
  "durationMonths": 1,
  "listedPriceMinor": 30000,
  "agreedPriceMinor": 25000,
  "startDate": "2026-08-20",
  "endDate": "2026-09-19",
  "state": "ACTIVE",
  "voidedAt": null,
  "voidReason": null,
  "createdAt": "2026-08-20T14:30:15.000Z",
  "updatedAt": "2026-08-20T14:30:15.000Z"
}
```

`state`: `SCHEDULED | ACTIVE | EXPIRED | VOIDED`.

### Payment

```json
{
  "id": "uuid",
  "memberId": "uuid",
  "amountMinor": 10000,
  "paymentDate": "2026-08-20",
  "paymentMethod": "CASH",
  "receiptNumber": "REC-2026-000001",
  "balanceAfterPaymentMinor": 20000,
  "status": "VALID",
  "voidedAt": null,
  "voidReason": null,
  "createdAt": "2026-08-20T14:30:15.000Z"
}
```

`status`: `VALID | VOIDED`.

---

# 3. Authentication

## POST `/auth/login`
**PUBLIC**

Request:

```json
{
  "username": "owner",
  "password": "secret-password"
}
```

Validation:
- `username`: required string, 1–100 chars
- `password`: required string

Success: `200 OK`
- Sets owner session cookie.

```json
{
  "owner": {
    "id": "uuid",
    "username": "owner",
    "mustChangePassword": false
  }
}
```

Errors:
- `401 INVALID_CREDENTIALS`
- `429 TOO_MANY_LOGIN_ATTEMPTS`

## POST `/auth/logout`
Protected.

Request body: none.

Success: `204 No Content` and clears/revokes session.

## GET `/auth/me`
Protected.

Success: `200 OK`

```json
{
  "owner": {
    "id": "uuid",
    "username": "owner",
    "mustChangePassword": false
  }
}
```

## POST `/auth/change-password`
Protected.

Request:

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

Validation:
- `newPassword`: minimum 10 characters

Success: `204 No Content`.

Errors:
- `400 CURRENT_PASSWORD_INCORRECT`
- `400 PASSWORD_TOO_WEAK`

---

# 4. Members

## GET `/members`
Protected.

Query parameters:
- `search?: string` — case-insensitive name search or normalized phone search
- `archived?: true | false` — default `false`
- `subscriptionState?: NONE | SCHEDULED | ACTIVE | EXPIRED`
- `hasDebt?: true | false`
- `page?: integer` — default 1
- `limit?: integer` — default 20, max 100

Success: `200 OK`

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "أحمد محمد",
      "phone": "01012345678",
      "photoUrl": "/api/v1/members/uuid/photo",
      "isArchived": false,
      "subscriptionState": "ACTIVE",
      "subscriptionEndDate": "2026-09-19",
      "outstandingBalanceMinor": 20000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

## POST `/members`
Protected.

Request:

```json
{
  "name": "أحمد محمد",
  "phone": "01012345678",
  "gender": "MALE",
  "dateOfBirth": "1995-06-12",
  "heightCm": 178,
  "weightKg": 82.5,
  "joinDate": "2026-08-20"
}
```

Validation:
- `name`: required, trimmed, 2–150 chars
- `phone`: required, normalized server-side to the local 11-digit Egyptian format `01XXXXXXXXX`; normalized value must be unique
- Accepted common forms include local `01XXXXXXXXX`, `+20`, `0020`, and `20` prefixes; spaces, hyphens, and parentheses are ignored before validation
- `gender`: `MALE | FEMALE`
- `dateOfBirth`: required valid date, not in future
- `heightCm`: optional nullable number, `> 0`, sensible upper bound 300
- `weightKg`: optional nullable number, `> 0`, sensible upper bound 500
- `joinDate`: required valid date
- Unknown properties rejected.

Success: `201 Created` returning `MemberDetail`.

Errors:
- `409 MEMBER_PHONE_ALREADY_EXISTS`

Photo is uploaded separately after member creation.

## GET `/members/:memberId`
Protected.

Success: `200 OK` returning `MemberDetail`.

Errors:
- `404 MEMBER_NOT_FOUND`

## PATCH `/members/:memberId`
Protected.

Request: any subset of editable fields. `null` is allowed only for height/weight.

```json
{
  "name": "أحمد علي",
  "phone": "01012345678",
  "gender": "MALE",
  "dateOfBirth": "1995-06-12",
  "heightCm": 179,
  "weightKg": 81.5,
  "joinDate": "2026-08-20"
}
```

Success: `200 OK` returning `MemberDetail`.

Errors:
- `404 MEMBER_NOT_FOUND`
- `409 MEMBER_PHONE_ALREADY_EXISTS`

Audit: record meaningful before/after values.

## POST `/members/:memberId/archive`
Protected.

Request body: none.

Success: `200 OK` returning updated `MemberDetail`.

Rules:
- Does not delete or void subscriptions/payments.
- Does not erase debt.

Errors:
- `404 MEMBER_NOT_FOUND`
- `409 MEMBER_ALREADY_ARCHIVED`

## POST `/members/:memberId/restore`
Protected.

Request body: none.

Success: `200 OK` returning updated `MemberDetail`.

Errors:
- `404 MEMBER_NOT_FOUND`
- `409 MEMBER_NOT_ARCHIVED`

## POST `/members/:memberId/photo`
Protected. `multipart/form-data`.

Form field:
- `file`: required image blob/file

Server rules:
- maximum upload size: 5 MB
- accept only decodable JPEG/PNG/WebP input
- normalize using Sharp
- strip metadata
- output WebP
- max output dimension: 1200x1200, preserving aspect ratio
- store outside public web root under opaque generated key
- replacing a photo removes the previous file only after the new DB reference is successfully committed

Success: `200 OK`

```json
{
  "photoUrl": "/api/v1/members/uuid/photo"
}
```

Errors:
- `404 MEMBER_NOT_FOUND`
- `400 INVALID_MEMBER_PHOTO`
- `413 PHOTO_TOO_LARGE`

## GET `/members/:memberId/photo`
Protected.

Success: `200 OK`, binary `image/webp`.

Errors:
- `404 MEMBER_NOT_FOUND`
- `404 MEMBER_PHOTO_NOT_FOUND`

## GET `/members/:memberId/subscriptions`
Protected.

Query: pagination only.

Success: paginated `Subscription[]`, newest start date first.

## GET `/members/:memberId/payments`
Protected.

Query: pagination only.

Success: paginated `Payment[]`, newest payment date/created time first.

## GET `/members/:memberId/audit-log`
Protected.

Query: pagination only.

Success: paginated `AuditLogItem[]` as defined in Audit section.

---

# 5. Plans

## GET `/plans`
Protected.

Query:
- `enabled?: true | false`
- `page?: integer`
- `limit?: integer`

Success: paginated `Plan[]`.

For subscription forms call `GET /plans?enabled=true&limit=100`.

## POST `/plans`
Protected.

Request:

```json
{
  "name": "العادي",
  "prices": [
    { "durationMonths": 1, "priceMinor": 30000 },
    { "durationMonths": 3, "priceMinor": 80000 },
    { "durationMonths": 6, "priceMinor": 150000 },
    { "durationMonths": 12, "priceMinor": 280000 }
  ]
}
```

Validation:
- name required, trimmed, unique, 2–100 chars
- prices must contain exactly four entries
- durations must be exactly `1,3,6,12`, each once
- every `priceMinor` is integer `>= 0`

Success: `201 Created` returning `Plan`.

Errors:
- `409 PLAN_NAME_ALREADY_EXISTS`

## GET `/plans/:planId`
Protected.

Success: `200 OK` returning `Plan`.

Errors:
- `404 PLAN_NOT_FOUND`

## PATCH `/plans/:planId`
Protected.

Request may contain `name`, `prices`, or both. If `prices` is present it must contain all four durations exactly once.

```json
{
  "name": "العادي بلس",
  "prices": [
    { "durationMonths": 1, "priceMinor": 35000 },
    { "durationMonths": 3, "priceMinor": 90000 },
    { "durationMonths": 6, "priceMinor": 165000 },
    { "durationMonths": 12, "priceMinor": 300000 }
  ]
}
```

Success: `200 OK` returning `Plan`.

Rules:
- Existing subscriptions are not modified.
- Audit old/new values.

Errors:
- `404 PLAN_NOT_FOUND`
- `409 PLAN_NAME_ALREADY_EXISTS`

## POST `/plans/:planId/enable`
Protected. No body.

Success: `200 OK` returning `Plan`.

Errors:
- `404 PLAN_NOT_FOUND`
- `409 PLAN_ALREADY_ENABLED`

## POST `/plans/:planId/disable`
Protected. No body.

Success: `200 OK` returning `Plan`.

Errors:
- `404 PLAN_NOT_FOUND`
- `409 PLAN_ALREADY_DISABLED`

---

# 6. Subscriptions

## POST `/members/:memberId/subscriptions`
Protected.

Use this endpoint when the owner chooses the start date (first subscription or subscription after expiration).

Request:

```json
{
  "planId": "uuid",
  "durationMonths": 3,
  "startDate": "2026-08-20",
  "agreedPriceMinor": 75000,
  "initialPayment": {
    "amountMinor": 30000,
    "paymentDate": "2026-08-20"
  }
}
```

`initialPayment` may be omitted. To create with zero payment, omit it; do not create a zero-value Payment row.

Validation/rules:
- member exists
- plan exists and is enabled
- duration is one of `1|3|6|12`
- requested duration exists in plan (all V1 plans have all four)
- `agreedPriceMinor` integer `>= 0`
- listed price is loaded from DB and snapshotted; client cannot supply it
- end date calculated server-side
- non-voided subscription ranges cannot overlap
- if initial payment exists: `amountMinor > 0`, payment date not in future, payment must not exceed projected member debt after adding subscription
- whole subscription + initial payment + receipt allocation + audit is one DB transaction

Success: `201 Created`

```json
{
  "subscription": {
    "id": "uuid",
    "memberId": "uuid",
    "planId": "uuid",
    "planNameSnapshot": "العادي",
    "durationMonths": 3,
    "listedPriceMinor": 80000,
    "agreedPriceMinor": 75000,
    "startDate": "2026-08-20",
    "endDate": "2026-11-19",
    "state": "ACTIVE",
    "voidedAt": null,
    "voidReason": null,
    "createdAt": "2026-08-20T14:30:15.000Z",
    "updatedAt": "2026-08-20T14:30:15.000Z"
  },
  "initialPayment": {
    "id": "uuid",
    "memberId": "uuid",
    "amountMinor": 30000,
    "paymentDate": "2026-08-20",
    "paymentMethod": "CASH",
    "receiptNumber": "REC-2026-000143",
    "balanceAfterPaymentMinor": 45000,
    "status": "VALID",
    "voidedAt": null,
    "voidReason": null,
    "createdAt": "2026-08-20T14:30:15.000Z"
  },
  "outstandingBalanceMinor": 45000
}
```

If initial payment is provided, `initialPayment` contains the `Payment` response and balance reflects it.

Errors:
- `404 MEMBER_NOT_FOUND`
- `404 PLAN_NOT_FOUND`
- `409 PLAN_DISABLED`
- `409 SUBSCRIPTION_OVERLAP`
- `422 PAYMENT_EXCEEDS_BALANCE`

## POST `/members/:memberId/subscriptions/renew`
Protected.

Use this only for an early renewal when the member has a current active subscription or an already-scheduled subscription chain. The server starts the new subscription **one day after the latest non-voided active/scheduled subscription ends**.

Request has no `startDate`:

```json
{
  "planId": "uuid",
  "durationMonths": 1,
  "agreedPriceMinor": 30000,
  "initialPayment": null
}
```

`initialPayment` may be omitted or provided using the same shape as normal creation.

Success: same response shape as normal subscription creation.

Errors:
- `409 NO_RENEWABLE_SUBSCRIPTION` — no active/scheduled subscription exists; use normal creation with owner-selected start date
- plus normal plan/payment errors

## GET `/subscriptions/:subscriptionId`
Protected.

Success: `200 OK` returning `Subscription`.

Errors:
- `404 SUBSCRIPTION_NOT_FOUND`

## PATCH `/subscriptions/:subscriptionId`
Protected.

Request may contain any subset:

```json
{
  "planId": "uuid",
  "durationMonths": 6,
  "startDate": "2026-08-21",
  "agreedPriceMinor": 140000
}
```

Rules:
- If at least one payment has been recorded against the subscription, its plan, plan snapshot, price, start date, and end date are immutable. Non-financial metadata such as notes may still be edited.
- `endDate` is never client-editable; recalculate from start + duration
- if `planId` or `durationMonths` changes, target plan must be enabled and plan name/listed price snapshots are refreshed from current plan data
- if only start/agreed price changes, existing plan snapshots remain
- re-check no-overlap
- re-check member balance cannot become negative
- write audit before/after in same transaction
- voided subscriptions cannot be edited

Success: `200 OK` returning `Subscription`.

Errors:
- `404 SUBSCRIPTION_NOT_FOUND`
- `409 SUBSCRIPTION_HAS_PAYMENTS`
- `409 SUBSCRIPTION_ALREADY_VOIDED`
- `409 PLAN_DISABLED`
- `409 SUBSCRIPTION_OVERLAP`
- `422 SUBSCRIPTION_EDIT_CREATES_CREDIT`

## POST `/subscriptions/:subscriptionId/void`
Protected.

Request:

```json
{
  "reason": "تم إنشاء الاشتراك للعضو الخطأ"
}
```

Validation:
- reason required, trimmed, 3–500 chars

Rules:
- void means the subscription was a mistake, not an early cancellation
- voided subscription contributes no charge and gives no access
- reject if any payment has been recorded against the subscription; payments are never deleted because a subscription is voided
- preserve record and audit event

Success: `200 OK` returning updated `Subscription` with `state="VOIDED"`.

Errors:
- `404 SUBSCRIPTION_NOT_FOUND`
- `409 SUBSCRIPTION_HAS_PAYMENTS`
- `409 SUBSCRIPTION_ALREADY_VOIDED`

There is **no subscription cancellation endpoint in V1**.

---

# 7. Payments

## POST `/members/:memberId/payments`
Protected.

Request:

```json
{
  "amountMinor": 15000,
  "paymentDate": "2026-08-19"
}
```

Validation/rules:
- `amountMinor`: integer `> 0`
- `paymentDate`: valid business date, may be in the past, may not be in the future
- lock member financial boundary in transaction
- recalculate current outstanding balance inside transaction
- reject amount above current balance
- allocate receipt number and random verification token in same transaction
- store historical balance-after-payment snapshot
- create audit event

Success: `201 Created` returning `Payment`.

Errors:
- `404 MEMBER_NOT_FOUND`
- `422 MEMBER_HAS_NO_OUTSTANDING_BALANCE`
- `422 PAYMENT_EXCEEDS_BALANCE`

## GET `/payments/:paymentId`
Protected.

Success: `200 OK`

```json
{
  "payment": {
    "id": "uuid",
    "memberId": "uuid",
    "amountMinor": 15000,
    "paymentDate": "2026-08-19",
    "paymentMethod": "CASH",
    "receiptNumber": "REC-2026-000143",
    "balanceAfterPaymentMinor": 25000,
    "status": "VALID",
    "voidedAt": null,
    "voidReason": null,
    "createdAt": "2026-08-20T14:30:15.000Z"
  },
  "member": {
    "id": "uuid",
    "name": "أحمد محمد",
    "phone": "01012345678"
  }
}
```

Errors:
- `404 PAYMENT_NOT_FOUND`

## POST `/payments/:paymentId/void`
Protected.

Request:

```json
{
  "reason": "تم تسجيل 500 بدلاً من 50"
}
```

Validation:
- reason required, trimmed, 3–500 chars

Rules:
- payment amount is never edited/deleted
- voided payment no longer reduces debt and is excluded from revenue
- receipt remains historically identifiable but verifies as `VOIDED`
- audit in same transaction

Success: `200 OK` returning updated `Payment`.

Errors:
- `404 PAYMENT_NOT_FOUND`
- `409 PAYMENT_ALREADY_VOIDED`

---

# 8. Receipts

## GET `/payments/:paymentId/receipt`
Protected.

Returns receipt data for screen preview/reprint.

Success: `200 OK`

```json
{
  "receiptNumber": "REC-2026-000143",
  "status": "VALID",
  "member": {
    "id": "uuid",
    "name": "أحمد محمد",
    "phone": "01012345678"
  },
  "amountMinor": 15000,
  "paymentMethod": "CASH",
  "paymentDate": "2026-08-19",
  "balanceAfterPaymentMinor": 25000,
  "verificationCode": "7K4M2-P9QXT-N6J3D-H8R5C",
  "verificationUrl": "https://example.com/verify/7K4M2P9QXTN6J3DH8R5C",
  "createdAt": "2026-08-20T14:30:15.000Z"
}
```

No owner/gym profile data is included.

The verification code is a random, unique, high-entropy token generated by the server. The canonical token may be displayed in grouped form for readability; the URL uses the ungrouped canonical token.

## GET `/payments/:paymentId/receipt.pdf`
Protected.

Success: `200 OK`, `Content-Type: application/pdf`.

The PDF contains the same business fields as the receipt view, plus QR code for `verificationUrl`. It does not contain gym/owner profile data.

## GET `/receipts/verify/:token`
**PUBLIC** and rate-limited.

Success for known token: `200 OK`

```json
{
  "status": "VALID",
  "receiptNumber": "REC-2026-000143",
  "memberName": "أحمد محمد",
  "maskedPhone": "010******42",
  "amountMinor": 15000,
  "paymentDate": "2026-08-19"
}
```

If payment was voided:

```json
{
  "status": "VOIDED",
  "receiptNumber": "REC-2026-000143",
  "memberName": "أحمد محمد",
  "maskedPhone": "010******42",
  "amountMinor": 15000,
  "paymentDate": "2026-08-19"
}
```

Unknown/malformed token: `404`

```json
{
  "statusCode": 404,
  "code": "RECEIPT_NOT_FOUND",
  "message": "الإيصال غير موجود أو رمز التحقق غير صحيح",
  "details": null
}
```

---

# 9. Dashboard

## GET `/dashboard/summary`
Protected.

Success: `200 OK`

```json
{
  "activeMembers": 128,
  "expiredMemberships": 42,
  "expiringWithin7Days": 11,
  "newMembersThisMonth": 14,
  "revenueTodayMinor": 125000,
  "revenueThisMonthMinor": 1850000,
  "totalOutstandingDebtMinor": 420000
}
```

Definitions:
- `activeMembers`: non-archived members with a current non-voided active subscription
- `expiredMemberships`: non-archived members whose latest non-voided subscription is expired and who have no active/scheduled subscription
- `expiringWithin7Days`: non-archived active subscriptions ending from today through today+7 days inclusive
- `newMembersThisMonth`: members whose `joinDate` falls in current calendar month
- revenue: sum of non-voided payments by `paymentDate`
- debt: sum of positive balances across all members, including archived members because archive does not erase debt

## GET `/dashboard/debtors`
Protected.

Query:
- `page`, `limit`
- `sort=balance_desc` default; only this sort required V1

Success:

```json
{
  "items": [
    {
      "memberId": "uuid",
      "name": "أحمد محمد",
      "phone": "01012345678",
      "isArchived": false,
      "outstandingBalanceMinor": 40000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

## GET `/dashboard/expiring`
Protected.

Query: `page`, `limit`.

Success:

```json
{
  "items": [
    {
      "memberId": "uuid",
      "memberName": "أحمد محمد",
      "phone": "01012345678",
      "subscriptionId": "uuid",
      "planName": "العادي",
      "endDate": "2026-08-24",
      "daysRemaining": 4
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

---

# 10. Audit

### AuditLogItem

```json
{
  "id": "uuid",
  "actorOwnerId": "uuid",
  "entityType": "SUBSCRIPTION",
  "entityId": "uuid",
  "action": "SUBSCRIPTION_UPDATED",
  "before": { "agreedPriceMinor": 80000 },
  "after": { "agreedPriceMinor": 75000 },
  "metadata": { "reason": null },
  "createdAt": "2026-08-20T14:30:15.000Z"
}
```

`entityType`: `MEMBER | PLAN | SUBSCRIPTION | PAYMENT`.

Required action values:
- `MEMBER_CREATED`
- `MEMBER_UPDATED`
- `MEMBER_ARCHIVED`
- `MEMBER_RESTORED`
- `PLAN_CREATED`
- `PLAN_UPDATED`
- `PLAN_ENABLED`
- `PLAN_DISABLED`
- `SUBSCRIPTION_CREATED`
- `SUBSCRIPTION_UPDATED`
- `SUBSCRIPTION_VOIDED`
- `PAYMENT_CREATED`
- `PAYMENT_VOIDED`

## GET `/audit-logs`
Protected.

Query:
- `entityType?: MEMBER|PLAN|SUBSCRIPTION|PAYMENT`
- `action?: one of defined actions`
- `entityId?: uuid`
- `from?: YYYY-MM-DD`
- `to?: YYYY-MM-DD`
- `page`, `limit`

Success: paginated `AuditLogItem[]`, newest first.

---

# 11. Health

## GET `/health`
**PUBLIC**.

Success: `200 OK`

```json
{
  "status": "ok",
  "database": "ok"
}
```

Failure should return non-2xx without exposing credentials/configuration.

---

# 12. Stable Business Error Codes

The implementation must use these exact codes where applicable:

```text
VALIDATION_ERROR
UNAUTHORIZED
INVALID_CREDENTIALS
TOO_MANY_LOGIN_ATTEMPTS
CURRENT_PASSWORD_INCORRECT
PASSWORD_TOO_WEAK
MEMBER_NOT_FOUND
MEMBER_PHONE_ALREADY_EXISTS
MEMBER_ALREADY_ARCHIVED
MEMBER_NOT_ARCHIVED
MEMBER_PHOTO_NOT_FOUND
INVALID_MEMBER_PHOTO
PHOTO_TOO_LARGE
PLAN_NOT_FOUND
PLAN_NAME_ALREADY_EXISTS
PLAN_DISABLED
PLAN_ALREADY_ENABLED
PLAN_ALREADY_DISABLED
SUBSCRIPTION_NOT_FOUND
SUBSCRIPTION_OVERLAP
SUBSCRIPTION_ALREADY_VOIDED
NO_RENEWABLE_SUBSCRIPTION
SUBSCRIPTION_HAS_PAYMENTS
PAYMENT_NOT_FOUND
MEMBER_HAS_NO_OUTSTANDING_BALANCE
PAYMENT_EXCEEDS_BALANCE
PAYMENT_ALREADY_VOIDED
RECEIPT_NOT_FOUND
RESOURCE_NOT_FOUND
INTERNAL_ERROR
```

Do not add a new business error code merely for different wording. Add a new code only when frontend behavior genuinely needs to distinguish the case, and update this contract first.
