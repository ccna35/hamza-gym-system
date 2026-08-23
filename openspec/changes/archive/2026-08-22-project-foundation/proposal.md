## Why

The repository currently contains the product documentation but no runnable application foundation. Establishing the workspace, service boundaries, development database, configuration, and quality gates now gives later domain changes a predictable base and prevents authentication or financial work from being built on inconsistent tooling.

## What Changes

- Create a pnpm monorepo with separate `apps/api`, `apps/web`, and a minimal `packages/shared` package.
- Scaffold a strict TypeScript NestJS backend with a versioned `/api/v1` boundary and a basic health endpoint.
- Scaffold a React, Vite, and TypeScript frontend with the Arabic-only RTL document foundation and responsive application-shell structure.
- Add PostgreSQL as the development database through Docker Compose.
- Add Prisma configuration and a reproducible database connection/migration workflow.
- Add validated environment configuration for the API, web app, and local database.
- Add repository scripts and CI coverage for installation, linting, formatting, type checking, tests, and builds.
- Establish basic API-to-web health connectivity without adding domain modules.
- Explicitly defer authentication, members, plans, subscriptions, payments, receipts, balances, audit workflows, and dashboard functionality to later changes.

## Capabilities

### New Capabilities

- `project-foundation`: Runnable monorepo, service scaffolding, development PostgreSQL, configuration, health checks, and baseline quality gates.

### Modified Capabilities

None.

## Impact

- Adds the repository structure and root developer/CI commands described by the project documentation.
- Adds NestJS, React/Vite, TypeScript, Prisma, PostgreSQL, Docker Compose, and the selected lint/format/test tooling as development/runtime dependencies.
- Defines the initial API and web application boundaries without exposing business endpoints.
- Adds local infrastructure configuration for PostgreSQL only; production database vendor selection remains deferred.
- No existing application code or public business behavior is changed because the repository has no implementation yet.