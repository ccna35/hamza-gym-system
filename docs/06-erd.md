# ERD

The following is a proposed V1 logical ERD. Column details may change during technical design, but the business relationships should remain stable.

```mermaid
erDiagram
    OWNER ||--o{ AUDIT_LOG : creates
    MEMBER ||--o{ SUBSCRIPTION : has
    MEMBER ||--o{ PAYMENT : makes
    PLAN ||--o{ PLAN_PRICE : defines
    PLAN ||--o{ SUBSCRIPTION : selected_for

    OWNER {
        uuid id PK
        string username
        string passwordHash
        datetime createdAt
        datetime updatedAt
    }

    MEMBER {
        uuid id PK
        string name
        string phone UK
        string gender
        date dateOfBirth
        string photoKey
        decimal heightCm
        decimal weightKg
        date joinDate
        boolean isArchived
        datetime archivedAt
        datetime createdAt
        datetime updatedAt
    }

    PLAN {
        uuid id PK
        string name
        boolean isEnabled
        datetime createdAt
        datetime updatedAt
    }

    PLAN_PRICE {
        uuid id PK
        uuid planId FK
        int durationMonths
        bigint priceMinor
        datetime createdAt
        datetime updatedAt
    }

    SUBSCRIPTION {
        uuid id PK
        uuid memberId FK
        uuid planId FK
        string planNameSnapshot
        int durationMonths
        bigint listedPriceMinor
        bigint agreedPriceMinor
        date startDate
        date endDate
        boolean isVoided
        datetime voidedAt
        string voidReason
        datetime createdAt
        datetime updatedAt
    }

    PAYMENT {
        uuid id PK
        uuid memberId FK
        bigint amountMinor
        bigint balanceAfterPaymentMinor
        date paymentDate
        string paymentMethod
        string receiptNumber UK
        string verificationToken UK
        boolean isVoided
        datetime voidedAt
        string voidReason
        datetime createdAt
    }

    AUDIT_LOG {
        uuid id PK
        uuid actorOwnerId FK
        string entityType
        string entityId
        string action
        json beforeJson
        json afterJson
        json metadataJson
        datetime createdAt
    }
```

## Key Constraints

- `member.phone` unique.
- `plan_price(planId, durationMonths)` unique.
- `durationMonths` restricted to 1, 3, 6, 12.
- Monetary values are integer minor units (1 EGP = 100 minor units) and must be non-negative.
- Payment amount must be greater than zero.
- Receipt number unique.
- Verification token unique, randomly generated, and unpredictable.
- Overlapping non-voided subscriptions for the same member are prohibited by application/domain validation, with transactional protection against race conditions.

## Deliberately Not Modeled in V1

- Attendance.
- Trainers.
- Notifications.
- Subscription cancellation.
- Payment allocation.
- Credit balance.
- Gym settings/profile.
