## Purpose

Provide the gym owner with a reliable, searchable member registry that preserves member history and securely manages optional profile photos.

## ADDED Requirements

### Requirement: Member creation

The system SHALL allow an authenticated owner to create a member with a name, unique Egyptian mobile phone number, gender, date of birth, and join date, with optional current height and weight, without requiring a subscription.

#### Scenario: Create a member without a subscription
- **WHEN** the owner submits valid member profile data without a subscription
- **THEN** the system creates the member record
- **AND** the member has no subscription requirement or implicit financial transaction
- **AND** the creation is recorded in the audit history

#### Scenario: Future join date is rejected
- **WHEN** the owner submits a join date after the current business date in `Africa/Cairo`
- **THEN** creation is rejected with `VALIDATION_ERROR`
- **AND** no member record is created

### Requirement: Egyptian phone normalization and uniqueness

The system SHALL normalize accepted Egyptian mobile input on the server to the canonical local 11-digit format `01XXXXXXXXX` and SHALL enforce uniqueness across active and archived members.

#### Scenario: Common Egyptian formats normalize to one value
- **WHEN** the owner submits a phone using local, `+20`, `0020`, or `20` prefix forms with harmless spaces, hyphens, or parentheses
- **THEN** the system removes harmless formatting and stores the canonical local format
- **AND** owner-facing member responses display the canonical normalized phone

#### Scenario: Duplicate normalized phone is rejected
- **WHEN** the normalized phone already belongs to an active or archived member
- **THEN** creation or phone-changing edit is rejected with `MEMBER_PHONE_ALREADY_EXISTS`
- **AND** the existing member record remains unchanged

### Requirement: Member listing and search

The system SHALL provide an authenticated paginated member list with name/phone search, archive filtering, subscription-state filtering, debt filtering, and member summaries.

#### Scenario: Search members by name or phone
- **WHEN** the owner submits a name fragment or canonical/formatting-variant phone search
- **THEN** matching members are returned in the documented `{ items, pagination }` shape
- **AND** phone matching uses the server normalization policy

#### Scenario: Archived members are excluded by default
- **WHEN** the owner requests the member list without an archive filter
- **THEN** only non-archived members are returned
- **AND** the owner can explicitly request archived members

### Requirement: Member profile editing

The system SHALL allow an authenticated owner to edit member profile fields, including archived members, while preserving the member ID and all historical subscription, payment, and audit records.

#### Scenario: Edit an archived member profile
- **WHEN** the owner edits valid profile data for an archived member
- **THEN** the profile update is saved
- **AND** the archived state and historical records remain unchanged
- **AND** an audit event preserves the meaningful before and after values

#### Scenario: Invalid profile data is rejected
- **WHEN** the owner submits an invalid gender, non-positive measurement, malformed date, future join date, or duplicate phone
- **THEN** the system returns a controlled Arabic validation or business error
- **AND** no partial profile update is persisted

### Requirement: Member archive and restore

The system SHALL archive members instead of deleting them and SHALL allow an authenticated owner to restore archived members.

#### Scenario: Archive a member
- **WHEN** the owner confirms archive for an active member
- **THEN** the member is marked archived with an archive timestamp
- **AND** the member is excluded from the default active list
- **AND** subscriptions, payments, debt, photos, and history are not deleted or voided
- **AND** an audit event is created

#### Scenario: Restore an archived member
- **WHEN** the owner confirms restore for an archived member
- **THEN** the member is marked active again
- **AND** the member returns to the default active list
- **AND** historical records remain unchanged
- **AND** an audit event is created

#### Scenario: Repeated archive or restore is rejected
- **WHEN** the owner archives an already archived member or restores an active member
- **THEN** the system returns the documented conflict error
- **AND** no duplicate state transition is recorded

### Requirement: Private member photos

The system SHALL accept optional authenticated member photo uploads, validate actual decodable JPEG, PNG, or WebP content, normalize accepted images to WebP with metadata removed, and store only an opaque private photo key in the database.

#### Scenario: Valid photo is normalized and stored privately
- **WHEN** the owner uploads a decodable image no larger than 5 MB
- **THEN** the system stores a normalized WebP image with maximum dimensions of 1200 by 1200 while preserving aspect ratio
- **AND** strips embedded metadata
- **AND** stores only an opaque photo key in the member record
- **AND** serves the photo only through an authenticated endpoint

#### Scenario: Invalid or oversized photo is rejected
- **WHEN** the uploaded content is not a decodable JPEG, PNG, or WebP or exceeds 5 MB
- **THEN** the system returns `INVALID_MEMBER_PHOTO` or `PHOTO_TOO_LARGE`
- **AND** it does not replace the existing photo

#### Scenario: Replacing a photo preserves the previous file on failed commit
- **WHEN** a replacement upload fails before its database reference is committed
- **THEN** the existing member photo reference and file remain usable
- **AND** cleanup does not remove the current referenced file

### Requirement: Member detail integration

The system SHALL return member profile information with nullable current subscription, next subscription, and outstanding balance integration fields without requiring those later capabilities to exist for member creation.

#### Scenario: Member without later domain records is displayed
- **WHEN** the owner opens a member who has no subscription or payment records
- **THEN** the detail response returns `currentSubscription: null`, `nextSubscription: null`, and `outstandingBalanceMinor: 0`
- **AND** the member profile remains usable

### Requirement: Member audit history

The system SHALL record auditable events for member creation, meaningful profile edits, archive, restore, and photo changes, while retaining the owner actor, entity, timestamp, and relevant before/after information.

#### Scenario: Member history is auditable
- **WHEN** the owner performs a member mutation
- **THEN** a corresponding append-only audit event is created
- **AND** the event does not contain password hashes, session tokens, or private storage paths

### Requirement: Arabic responsive member UI

The system SHALL provide Arabic-only RTL member list, create, edit, and detail experiences that remain usable at 360px without horizontal page scrolling.

#### Scenario: Member list is usable on mobile
- **WHEN** the owner opens the member list at 360px width
- **THEN** search and essential member status/debt information are visible in readable cards
- **AND** the page has no horizontal overflow

#### Scenario: Member form supports camera and file fallback
- **WHEN** the owner creates or edits a member on a supported desktop or mobile browser
- **THEN** the form supports webcam capture where available and camera/file upload fallback
- **AND** validation, loading, success, and error feedback are Arabic

### Requirement: Member scope boundary

The system SHALL not implement subscriptions, payments, receipts, debt mutations, attendance, notifications, member accounts, cancellation, refunds, or credit behavior in the member capability.

#### Scenario: Domain features remain deferred
- **WHEN** the owner uses the member capability
- **THEN** member profile workflows are available
- **AND** no subscription, payment, receipt, or financial mutation is created implicitly
