## 1. Member Data and Validation

- [ ] 1.1 Add the `Member` Prisma model and migration with UUID identity, canonical unique phone, profile fields, optional measurements/photo key, archive state, and timestamps; verify Prisma generation/migration succeeds without adding subscription or payment relations.
- [ ] 1.2 Add member DTOs and backend validation for required fields, `MALE | FEMALE`, positive optional measurements, valid dates, and join date not after the `Africa/Cairo` business date; verify invalid inputs return the documented Arabic validation contract.
- [ ] 1.3 Implement and test the Egyptian phone normalizer for local, `+20`, `0020`, and `20` prefix forms plus harmless formatting characters; verify all accepted variants produce the canonical `01XXXXXXXXX` value.
- [ ] 1.4 Enforce normalized phone uniqueness across active and archived members during create and edit; verify duplicate normalized variants return `MEMBER_PHONE_ALREADY_EXISTS` and preserve the existing record.

## 2. Member API Workflows

- [ ] 2.1 Add an owner-protected member service and controller for create, paginated list/search/filter, detail, and partial profile edit; verify responses match the documented member shapes and no domain mutation occurs implicitly.
- [ ] 2.2 Add archive and restore transitions with idempotency/conflict errors; verify archive preserves member history and photo, hides the member from the default list, and restore reverses only the archive state.
- [ ] 2.3 Add member detail integration mapping for nullable current/next subscription and zero outstanding balance when later modules are absent; verify a new member detail returns the documented empty integration fields.
- [ ] 2.4 Add authenticated member history endpoints/adapters for subscription, payment, and audit data without implementing their mutations; verify empty histories are returned safely and protected access requires an owner session.

## 3. Private Photo Storage

- [ ] 3.1 Add `PHOTO_STORAGE_PATH` configuration and a private storage service using opaque random keys outside the public web root; verify invalid/missing storage configuration fails clearly without exposing paths.
- [ ] 3.2 Add Sharp-based photo validation and normalization for decodable JPEG/PNG/WebP input, 5 MB maximum input, metadata stripping, WebP output, and 1200x1200 maximum dimensions; verify invalid and oversized uploads return stable errors.
- [ ] 3.3 Add authenticated photo upload/retrieval and safe replacement sequencing; verify failed validation/commit retains the previous photo and successful replacement removes only the old unreferenced file after commit.
- [ ] 3.4 Add photo cleanup and private-access tests; verify unauthenticated retrieval is rejected, database stores only the opaque key, and photo bytes are not served as public static files.

## 4. Audit Integration

- [ ] 4.1 Add append-only member audit events for create, meaningful edit, archive, restore, and photo changes using the authenticated owner actor; verify before/after data is preserved without storage paths or auth secrets.
- [ ] 4.2 Expose protected member audit history in the documented shape; verify audit records cannot be updated or deleted through the member capability.

## 5. Frontend Member Experience

- [ ] 5.1 Add member API client methods, query keys, and route definitions for `/members`, `/members/new`, `/members/:memberId`, and `/members/:memberId/edit`; verify unauthenticated responses route through the existing auth boundary.
- [ ] 5.2 Build the Arabic RTL member list with search, archive/subscription/debt filters, pagination, desktop table, and mobile card representation; verify loading, empty, error, and success states are Arabic.
- [ ] 5.3 Build reusable member profile and responsive create/edit form components with canonical phone display, profile validation, current measurements, archive actions, and photo preview; verify forms remain usable at 360px.
- [ ] 5.4 Add webcam/camera/file fallback capture and authenticated photo upload UI; verify preview, invalid-file, upload, replacement, and failure states are handled in Arabic.
- [ ] 5.5 Use project-owned modal components for member create/edit forms where appropriate and route-driven detail on mobile; verify modal close/cancel, submit loading, validation, and success navigation behavior.

## 6. Verification and Integration

- [ ] 6.1 Add backend integration tests for member creation without subscription, normalized uniqueness, future join-date rejection, archived edits, archive/restore, protected endpoints, and photo processing against PostgreSQL/filesystem fixtures; verify the member suite passes.
- [ ] 6.2 Add frontend tests for member routes, search/list states, profile rendering, form validation, modal behavior, photo fallback, and 360px no-overflow behavior; verify the web member suite passes.
- [ ] 6.3 Run workspace format-check, lint, typecheck, tests, and builds with the members capability enabled; verify all root quality commands pass.
- [ ] 6.4 Perform an end-to-end member workflow at desktop and 360px mobile widths: create without subscription, search, open/edit, upload photo, archive, restore, and inspect audit/history; verify no subscription, payment, receipt, or debt mutation is introduced.
