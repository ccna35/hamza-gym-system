## Context

The repository is documentation-only and has no existing application structure. The project documentation defines a pnpm monorepo with independent NestJS and React/Vite applications, PostgreSQL for development, Prisma for persistence, Arabic RTL UI, and strict quality gates. The foundation must establish those boundaries without prematurely modeling or implementing gym-domain workflows.

## Goals / Non-Goals

**Goals:**

- Create a reproducible workspace that can be installed and run from a fresh checkout.
- Keep frontend and backend independently buildable while using the API as their integration boundary.
- Provide a NestJS `/api/v1` health surface and a single frontend API client path for connectivity checks.
- Configure PostgreSQL through Docker Compose for local development and Prisma through `DATABASE_URL`.
- Validate environment configuration early and make lint, formatting, type checking, tests, and builds part of local and CI workflows.
- Establish the Arabic RTL document foundation and a responsive shell that does not overflow at 360px.

**Non-Goals:**

- Authentication, owner sessions, authorization, or password handling.
- Members, plans, subscriptions, payments, receipts, balances, audit logs, dashboard metrics, or domain APIs.
- Production PostgreSQL vendor selection, production deployment, backups, or HTTPS.
- PostgreSQL extensions, including `btree_gist`, because no foundation requirement needs one.
- A large shared domain package or duplicated frontend/backend models.

## Decisions

### Monorepo boundaries

Use pnpm workspaces with `apps/api`, `apps/web`, and `packages/shared`. The shared package stays limited to genuinely cross-cutting constants or helpers; the API contract remains the boundary between applications. This preserves independent dependency graphs and follows the documented repository decision.

### Backend scaffold

Use NestJS with strict TypeScript, a global `/api/v1` prefix, global validation behavior, a health controller, and a Prisma service/configuration boundary. Configuration is loaded and validated at startup. The health check should include application availability and a controlled database connectivity signal without exposing credentials or stack traces.

### Frontend scaffold

Use React, Vite, TypeScript, React Router, TanStack Query, React Hook Form, Zod, Tailwind CSS, and Lucide React as documented. Set `lang="ar"` and `dir="rtl"` at the document root. Establish a small responsive shell and one API client rather than adding global client state or a feature-specific design system. Do not add shadcn/ui or an i18n framework.

### Local database and Prisma

Run only PostgreSQL in Docker Compose; run web and API processes directly on the host. Configure Prisma using `DATABASE_URL`, generate the client, and establish migration commands. Keep the initial schema/migration baseline minimal so later changes can add domain tables deliberately. Production remains a standard PostgreSQL connection concern and is not selected here.

### Configuration

Keep environment parsing in the owning application, with checked-in example environment files that contain no secrets. The API requires its database connection configuration; the web app requires its API base URL. Local defaults may be documented only where they are non-sensitive and deterministic. Invalid required values fail startup or the appropriate build-time check.

### Quality and CI

Use one consistent formatter/linter configuration at the repository level where practical, with strict TypeScript checks and workspace-aware scripts. CI runs dependency installation, lint, typecheck, tests, and builds. Foundation tests cover health behavior, invalid configuration, RTL document attributes, API client connectivity states, and the PostgreSQL/Prisma baseline.

### No PostgreSQL extension by default

The no-overlap subscription constraint belongs to a later domain change. The foundation must not install `btree_gist` or any other extension. That later change must evaluate whether the invariant can be enforced with the chosen application transaction boundary before requiring an extension or provider support.

## Risks / Trade-offs

- Keeping the initial Prisma schema minimal means later domain changes must add migrations carefully, but it avoids locking in unfinished business models.
- A host-run web/API plus Docker-only PostgreSQL is simple for local development, but contributors need Node/pnpm and Docker separately documented.
- A single owner-facing RTL shell is intentionally small in this change; visual polish and domain workflows should be added with their respective capabilities.
- Database connectivity in a health check can make the service report degraded when PostgreSQL is unavailable. This is useful for local diagnosis, provided the response remains controlled and does not reveal connection details.
- CI may need a PostgreSQL service or a focused database test setup once Prisma connectivity tests are added; the chosen setup must remain reproducible without selecting a production vendor.
