## 1. Workspace and Repository Setup

- [x] 1.1 Create the pnpm workspace manifest, root package scripts, and package boundaries for `apps/api`, `apps/web`, and `packages/shared`; verify workspace discovery succeeds with `pnpm install`.
- [x] 1.2 Add repository-level TypeScript, formatting, linting, ignore, and environment-example configuration without secrets; verify the configuration files are present and the root scripts resolve.
- [x] 1.3 Add a minimal shared package containing only approved cross-cutting constants/helpers; verify the frontend and backend do not import each other's source files.

## 2. Backend Foundation

- [x] 2.1 Scaffold the strict TypeScript NestJS application under `apps/api`; verify the API starts with the documented development command and strict type checking passes.
- [x] 2.2 Add validated backend environment configuration and a versioned `/api/v1` prefix; verify missing or invalid required configuration prevents unsafe startup with a controlled error.
- [x] 2.3 Add global request validation and a basic health endpoint that reports controlled application/database availability without secrets or stack traces; verify the endpoint returns the documented success or degraded response.
- [x] 2.4 Configure Prisma for PostgreSQL using `DATABASE_URL`, generate the client, and establish the migration workflow without domain tables; verify Prisma generation and a local database connectivity check succeed.

## 3. Frontend Foundation

- [x] 3.1 Scaffold the React, Vite, and strict TypeScript application under `apps/web`; verify the web development server and production build succeed.
- [x] 3.2 Add React Router, TanStack Query, React Hook Form, Zod, Tailwind CSS, and Lucide React using the documented frontend boundary; verify no shadcn/ui, i18n framework, or default global state library is introduced.
- [x] 3.3 Establish the Arabic RTL document root and responsive application shell; verify `lang="ar"`, `dir="rtl"`, and no horizontal page overflow at 360px.
- [x] 3.4 Add the single frontend API client and foundation health connectivity state; verify loading, success, and retryable error states against the backend health endpoint.

## 4. Local PostgreSQL Infrastructure

- [x] 4.1 Add Docker Compose configuration for PostgreSQL development only, including documented non-production credentials and persistent local volume behavior; verify the database starts with the documented Compose command.
- [x] 4.2 Connect the API Prisma baseline to the Compose database and document the local startup order; verify the API health/database check succeeds while PostgreSQL is running and fails in a controlled way when it is unavailable.
- [x] 4.3 Confirm no production database vendor, provider-specific SDK, or PostgreSQL extension is required by the foundation; verify the dependency/configuration scan contains none of these additions.

## 5. Quality Gates and CI

- [x] 5.1 Add focused backend and frontend foundation tests for health behavior, invalid configuration handling, RTL attributes, API connectivity states, and the Prisma baseline; verify `pnpm test` passes.
- [x] 5.2 Add workspace-aware lint, format-check, strict typecheck, and build commands; verify `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass from the repository root.
- [x] 5.3 Add CI workflow for dependency installation, linting, type checking, tests, and builds with the required PostgreSQL test service/configuration; verify CI passes on a clean checkout.
- [x] 5.4 Run the complete foundation exit check from a clean environment, including PostgreSQL startup, API health, web-to-API connectivity, RTL/360px verification, and all quality commands; verify no domain endpoints or domain functionality are present.
