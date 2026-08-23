## Why

The authentication boundary now protects the application, but the gym owner still has no way to register or maintain member records. A focused member-management capability provides the operational identity and history needed by later subscription and payment changes without mixing those financial workflows into this change.

## What Changes

- Add member records with name, unique normalized Egyptian phone, gender, date of birth, optional current height and weight, join date, photo reference, and archive state.
- Add owner-protected member create, list/search/filter, detail, edit, archive, and restore workflows.
- Enforce server-side phone normalization to the canonical local 11-digit format `01XXXXXXXXX` and preserve uniqueness across archived and active members.
- Reject future join dates using the `Africa/Cairo` business date.
- Allow profile edits for archived members while preserving all historical records.
- Add private member photo upload and retrieval with image validation, Sharp normalization to WebP, metadata stripping, size/dimension limits, opaque storage keys, and authenticated access.
- Add member summaries that can display derived subscription state and outstanding balance when later capabilities provide those records, without implementing subscription or payment workflows here.
- Add Arabic RTL responsive member list, detail, create, and edit experiences; use readable mobile cards and owner-facing form dialogs where appropriate.
- Add audit events for member creation, meaningful edits, archival, restoration, and photo changes.
- Explicitly defer subscriptions, payments, receipts, balances, attendance, notifications, member accounts, and cancellation/refund behavior.

## Capabilities

### New Capabilities

- `members`: Owner-managed member profiles, search, archive/restore, private photos, and member audit events.

### Modified Capabilities

None.

## Impact

- Adds the `members` persistence model and migration to the NestJS/Prisma backend.
- Adds member API endpoints, DTO validation, Egyptian phone normalization, and audit integration points.
- Adds Sharp and private filesystem photo-storage dependencies/configuration.
- Adds member API client methods, routes, pages, responsive list/detail/form components, and tests to the React frontend.
- Integrates with the existing owner authentication guard and Arabic RTL shell.
- Leaves financial fields as read-only/derived integration surfaces; no subscription or payment mutation is introduced.
