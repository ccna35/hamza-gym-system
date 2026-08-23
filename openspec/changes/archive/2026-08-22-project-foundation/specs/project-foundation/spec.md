## Purpose

Provide a reproducible technical foundation for the gym management system so the frontend, backend, local database, and quality checks can be developed and run independently before domain features are added.

## ADDED Requirements

### Requirement: Workspace structure

The repository SHALL provide a pnpm workspace with separate frontend and backend applications and a minimal shared package, using the documented monorepo boundaries.

#### Scenario: Fresh checkout exposes the foundation structure
- **WHEN** a developer inspects a fresh checkout
- **THEN** `apps/api`, `apps/web`, and `packages/shared` exist as separate workspace packages
- **AND** frontend code does not import backend source files
- **AND** backend code does not import frontend source files

### Requirement: Development commands

The repository SHALL provide root commands for development, building, linting, type checking, and testing across the workspace.

#### Scenario: Developer runs the standard quality commands
- **WHEN** a developer runs the documented root commands
- **THEN** `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, and `pnpm test` are available
- **AND** each command targets the current workspace packages without requiring domain features

### Requirement: Backend foundation

The backend SHALL be a strict TypeScript NestJS application with a versioned `/api/v1` API boundary, validated environment configuration, global request validation, and a health endpoint.

#### Scenario: API health check succeeds
- **WHEN** the API is running with valid local configuration
- **AND** a client requests the health endpoint under `/api/v1`
- **THEN** the API returns a successful response describing that the service is available
- **AND** the response does not expose secrets or internal stack traces

#### Scenario: Invalid backend configuration prevents unsafe startup
- **WHEN** a required backend environment variable is missing or invalid
- **THEN** startup fails with a clear configuration error
- **AND** the backend does not start with an unsafe implicit value

### Requirement: Frontend foundation

The frontend SHALL be a React, Vite, and strict TypeScript application whose document is Arabic-only and RTL, with a responsive application-shell foundation.

#### Scenario: Frontend document establishes Arabic RTL
- **WHEN** a user opens the web application
- **THEN** the root document has `lang="ar"` and `dir="rtl"`
- **AND** the initial shell is usable at a 360px viewport without horizontal page overflow

#### Scenario: Frontend reaches the backend health endpoint
- **WHEN** the web application runs with valid API configuration
- **AND** the shell performs its foundation connectivity check
- **THEN** it uses the single configured API client path to request the backend health endpoint
- **AND** it presents loading, success, and retryable error states without inventing domain data

### Requirement: Development PostgreSQL

The repository SHALL provide Docker Compose configuration for a PostgreSQL development database only, while allowing the web and API processes to run directly on the host.

#### Scenario: Developer starts the local database
- **WHEN** a developer runs the documented Docker Compose command
- **THEN** a PostgreSQL service starts with the configured development database credentials
- **AND** the service exposes only the documented local development connection
- **AND** no production database vendor or provider-specific service is required

### Requirement: Prisma baseline

The backend SHALL configure Prisma against the PostgreSQL `DATABASE_URL` and provide a reproducible migration/client workflow without adding domain tables prematurely.

#### Scenario: API connects to the development database
- **WHEN** PostgreSQL is running and `DATABASE_URL` is valid
- **THEN** the Prisma client can be generated and the API can verify database connectivity
- **AND** the connection failure is reported as a controlled health/configuration failure rather than an unhandled secret-bearing error

### Requirement: Environment and quality baseline

The repository SHALL validate environment variables and configure consistent formatting, linting, strict type checking, tests, and CI checks for the foundation.

#### Scenario: CI validates a clean foundation
- **WHEN** CI runs for the foundation change
- **THEN** it installs workspace dependencies
- **AND** runs linting, type checking, tests, and builds
- **AND** fails when any required check fails

### Requirement: Domain scope boundary

The foundation SHALL not implement authentication, member management, plans, subscriptions, payments, receipts, balances, audit workflows, or dashboard functionality.

#### Scenario: Domain endpoints are not included
- **WHEN** a client inspects the foundation API
- **THEN** only foundation/health behavior is available
- **AND** no domain data model or domain workflow is required for the foundation checks to pass
