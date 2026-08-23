## Context

The authenticated NestJS API and React/Vite Arabic RTL shell are in place. Prisma currently contains owner and session data, while the member capability needs a new member model, owner-protected CRUD-style endpoints, archive/restore transitions, private image storage, and responsive member screens. Later subscription and payment capabilities will add historical and derived data, but this change must not create or mutate financial records.

Confirmed business decisions for this change are: join dates cannot be future-dated, archived members remain editable, and owner-facing phone values use the canonical local Egyptian format `01XXXXXXXXX`.

## Goals / Non-Goals

**Goals:**

- Persist and validate member profiles with globally unique normalized Egyptian phones.
- Provide authenticated create, search/list, detail, edit, archive, restore, and private-photo workflows.
- Preserve history through archive rather than deletion.
- Normalize and privately store photos as metadata-free WebP files.
- Record member mutations through the existing audit integration boundary.
- Keep member pages Arabic-only, RTL, responsive, and usable at 360px.
- Expose nullable/read-only integration points for future subscriptions and balances.

**Non-Goals:**

- Subscription creation, renewal, date calculations, or access state mutation.
- Payment recording, allocation, receipts, debt mutation, refunds, credits, or cancellation.
- Attendance, notifications, member accounts, trainers, or historical body measurements.
- Public member or photo access.
- A new client-side global state library or a second API client pattern.

## Decisions

### Member persistence

Add a `Member` Prisma model with UUID identity, display name, canonical `phoneNormalized` unique across all rows, gender enum/text, date of birth, optional numeric current height/weight, join date, opaque nullable photo key, archive flag/timestamp, and creation/update timestamps. Keep the database field for the canonical phone separate from the API response mapping; never expose an internal normalization field name.

Allow profile edits regardless of archive state. Archive and restore are explicit state transitions, not deletes. Foreign-key history remains intact. Enforce future-date, measurement, gender, and phone rules in DTO/service validation and with database constraints where practical.

### Phone normalization

Implement one backend normalizer that removes spaces, hyphens, and parentheses, accepts local `01XXXXXXXXX` plus `+20`, `0020`, and `20` prefix forms, and returns only the local 11-digit form. Use it for create, edit, and phone search. Store and return the canonical form so the owner sees stable values. Add table-driven tests for accepted, invalid, and duplicate variants.

### API and derived integration

Create a feature-owned controller/service and map Prisma records into the exact documented response shapes. Use the existing auth guard on all member endpoints. List queries use server pagination and filters; default archive filtering is non-archived. Detail mapping returns null subscription fields and zero balance until later domain modules provide data. Do not add subscription or payment foreign keys to this change.

### Photo storage

Add Sharp and a storage service configured by `PHOTO_STORAGE_PATH`. Validate decoded image content rather than trusting MIME or filename extensions, enforce the 5 MB input limit, resize to a maximum 1200 by 1200 while preserving aspect ratio, strip metadata, and encode WebP. Generate an opaque random key and store only that key in the database. Keep bytes outside the public web root and serve them through an authenticated endpoint.

For replacement, write and validate the new file first, update the database reference in a transaction, and remove the old file only after the reference commit succeeds. On validation or commit failure, retain the existing reference/file and clean up only the unreferenced new temporary file. Member archival does not remove a photo.

### Audit integration

Use the existing audit boundary if present, or establish a small append-only member audit adapter without implementing the full audit UI. Member create/edit/archive/restore/photo mutations include actor, entity, action, timestamp, and relevant before/after data. Redact private storage paths and all auth secrets.

### Frontend structure

Add feature-oriented member API functions, query keys, route pages, and reusable components under the existing frontend architecture. Use `/members`, `/members/new`, `/members/:memberId`, and `/members/:memberId/edit`. The list uses a semantic table at desktop widths and cards below the mobile breakpoint. Create/edit workflows use responsive project-owned modal/form components where they fit; member detail remains a route-driven page on mobile. Use camera capture with an `<input capture>`/file fallback and preview before upload.

### Validation and error contract

Keep backend validation authoritative and return stable codes such as `MEMBER_PHONE_ALREADY_EXISTS`, `MEMBER_ALREADY_ARCHIVED`, `MEMBER_NOT_ARCHIVED`, `INVALID_MEMBER_PHOTO`, and `PHOTO_TOO_LARGE` within the existing four-field Arabic error shape. Frontend branches on codes and renders Arabic loading, empty, error, and success states.

## Risks / Trade-offs

- A canonical phone display loses the owner’s original formatting, but it eliminates ambiguity and matches the confirmed decision.
- Editing archived records improves correction workflows but requires clear archived-state treatment in the UI and audit trail.
- Filesystem storage is appropriate for fewer than 1,000 members but requires deployment backup documentation and careful cleanup sequencing.
- Read-only nullable subscription/balance fields avoid coupling changes, but later modules must own their authoritative calculations and mapping.
- Image processing adds CPU and dependency surface; Sharp’s bounded dimensions and 5 MB input limit keep the risk proportionate to the expected scale.
