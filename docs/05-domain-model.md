# Domain Model

## Core Entities

### Owner
Represents the single authenticated application user.

Suggested attributes:
- id
- email/username
- passwordHash
- createdAt
- updatedAt

### Member
Represents a gym member.

Suggested attributes:
- id
- name
- phone
- gender
- dateOfBirth
- photoPath/photoKey
- heightCm
- weightKg
- joinDate
- isArchived
- archivedAt
- createdAt
- updatedAt

### Plan
Represents a named membership plan.

Suggested attributes:
- id
- name
- isEnabled
- createdAt
- updatedAt

### PlanPrice
Represents the current default price for one supported duration of a plan.

Suggested attributes:
- id
- planId
- durationMonths: 1 | 3 | 6 | 12
- price
- createdAt
- updatedAt

Constraint:
- unique(planId, durationMonths)

### Subscription
Represents a member's membership period and snapshots commercial terms.

Suggested attributes:
- id
- memberId
- planId nullable only if future historical strategy requires it; normally keep relation
- planNameSnapshot
- durationMonths
- listedPriceSnapshot
- agreedPrice
- startDate
- endDate
- isVoided
- voidedAt
- voidReason
- createdAt
- updatedAt

Derived state:
- Scheduled
- Active
- Expired
- Voided

### Payment
Represents cash received from a member.

Suggested attributes:
- id
- memberId
- amount
- paymentDate
- recordedAt/createdAt
- paymentMethod = CASH
- receiptNumber
- verificationToken (random, unique public opaque receipt-verification identifier)
- isVoided
- voidedAt
- voidReason

Payments are member-level and are not allocated across subscriptions. The optional initial payment created atomically with a subscription is considered recorded against that subscription for the paid-subscription immutability rule; later standalone debt payments remain member-level.

### AuditLog
Represents important state changes.

Suggested attributes:
- id
- actorOwnerId
- entityType
- entityId
- action
- beforeJson
- afterJson
- metadataJson
- createdAt

## Derived Concepts

### Member Outstanding Balance

Conceptually:

`SUM(non-voided subscription agreed prices) - SUM(non-voided payments)`

A production implementation may optimize this later, but the source-of-truth model should remain reconstructable from immutable financial records.

### Current Subscription

The non-voided subscription where:

`startDate <= today <= endDate`

There must be at most one because overlapping subscriptions are prohibited.

### Next Subscription

A non-voided future subscription with the nearest start date.

## Important Modeling Principle

Do not use the mutable Plan price as the historical subscription charge.

Subscription must preserve its own listed-price snapshot and agreed price.
