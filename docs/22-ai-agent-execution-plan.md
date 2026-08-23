# AI Agent Execution Plan — V1

This file is the **entry point for implementation**. An AI coding agent should read this file first whenever it starts or resumes work on the project.

The goal is to prevent the agent from wandering through the documentation, inventing product behavior, or implementing later phases before prerequisites are stable.

---

## 1. Repository Decision

Use **one Git repository containing two separate applications**.

```text
gym-management/
├── apps/
│   ├── api/                 # NestJS backend
│   └── web/                 # React/Vite frontend
├── packages/
│   └── shared/              # tiny shared constants/helpers only
├── docs/                    # all specification files
├── infra/
├── scripts/
├── .github/
│   └── workflows/
├── docker-compose.dev.yml   # development PostgreSQL only
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

This is a **monorepo**, but it is not a single coupled application.

Rules:
- frontend and backend have separate dependencies and build outputs;
- frontend never imports backend source files;
- backend never imports frontend source files;
- both can be deployed/restarted independently;
- shared package must remain very small;
- API contract is the integration boundary between web and API.

Do not split the frontend and backend into separate repositories for V1.

---

## 2. Read Order Before Writing Code

At the start of implementation, read these files in this order:

1. `22-ai-agent-execution-plan.md` — what to work on and in what order
2. `19-implementation-contract.md` — non-negotiable implementation rules
3. `18-implementation-plan.md` — phase definitions and exit criteria
4. `16-project-structure.md` — repository/folder conventions
5. `13-technical-architecture.md` — application architecture
6. `15-security-design.md` — auth, cookies, files, public endpoints
7. `14-database-design.md` — database invariants and physical design
8. `20-ui-rtl-responsive-spec.md` — frontend design rules
9. `08-api-design.md` — exact human-readable API contract
10. `21-api-openapi.yaml` — machine-readable API schema

Do **not** read all product documents on every coding task. Use the task-specific lookup table later in this file.

### Conflict rule

If two files conflict, follow the authority order in `19-implementation-contract.md`.

For API details:
- `08-api-design.md` is the semantic/human-readable authority;
- `21-api-openapi.yaml` should match it and is useful for validation/tooling;
- if they differ, follow `08-api-design.md` and report the OpenAPI mismatch instead of inventing a third behavior.

---

## 3. First Work to Perform

Start with **Phase 0 — Repository and Quality Baseline**.

Do not start authentication, members, plans, subscriptions, payments, receipts, or dashboard work until Phase 0 exit criteria pass.

### Phase 0.1 — Create workspace

Create:

```text
apps/api
apps/web
packages/shared
docs
infra
scripts
.github/workflows
```

Use pnpm workspaces as defined by the existing technical documents.

Root scripts should allow the developer/CI to run at least:

```text
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

The exact implementation may use workspace filters internally.

### Phase 0.2 — Scaffold backend

Create the NestJS API application under `apps/api`.

Required baseline:
- TypeScript strict mode;
- environment configuration + validation;
- Prisma installed/configured;
- global validation behavior;
- global API prefix `/api/v1` where applicable;
- consistent error response foundation;
- health endpoint;
- no business modules implemented yet beyond minimal scaffolding.

### Phase 0.3 — Scaffold frontend

Create the React + Vite + TypeScript application under `apps/web`.

Required baseline:
- `lang="ar"`;
- `dir="rtl"`;
- Tailwind CSS;
- React Router;
- TanStack Query;
- React Hook Form;
- Zod;
- Lucide React;
- no shadcn/ui;
- no Redux/Zustand by default;
- responsive application-shell foundation.

Do not spend Phase 0 building polished feature screens.

### Phase 0.4 — Development PostgreSQL

Create `docker-compose.dev.yml` for PostgreSQL only.

Development model:

```text
React/Vite     -> local process
NestJS         -> local process
PostgreSQL     -> Docker Compose
```

Do not require Docker to run the web/API development servers.

### Phase 0.5 — Prisma baseline

Configure Prisma to use `DATABASE_URL`.

At this point:
- establish Prisma client/service wiring;
- establish migrations workflow;
- do not prematurely implement all V1 tables unless the current phase requires them.

### Phase 0.6 — Web-to-API connectivity

The web application must be able to call the API health endpoint through the chosen development configuration.

Do not create a second competing API client pattern. Establish the single HTTP client wrapper described in `16-project-structure.md`.

### Phase 0.7 — Quality baseline

Configure:
- linting;
- formatting;
- strict type-checking;
- test commands;
- CI workflow.

CI must at minimum run install, lint, typecheck, tests, and builds appropriate to the current codebase.

### Phase 0.8 — Phase 0 exit gate

Phase 0 is complete only when all are true:

- fresh checkout installs predictably;
- PostgreSQL starts with the documented Compose command;
- API connects to PostgreSQL;
- API health endpoint succeeds;
- frontend can reach API health endpoint;
- Arabic RTL root is present;
- responsive shell has no horizontal page overflow at 360px;
- no shadcn/ui dependency exists;
- lint passes;
- typecheck passes;
- tests pass;
- builds pass;
- CI is green.

Only then start Phase 1.

---

## 4. Phase Order — Do Not Reorder

Implement in this order:

```text
Phase 0  Repository + quality baseline
Phase 1  Authentication
Phase 2  Members
Phase 3  Plans
Phase 4  Subscription engine
Phase 5  Balance engine + payments
Phase 6  Receipts + verification
Phase 7  Dashboard
Phase 8  Audit UI
Phase 9  Production hardening
Phase 10 Go-live validation
```

The agent must not skip ahead because a later feature appears easier or more visually interesting.

In particular:
- do not build dashboard calculations before subscription/payment invariants exist;
- do not build receipt verification before payments are stable;
- do not implement subscription cancellation in V1;
- do not add attendance, trainers, notifications, member accounts, or new payment methods.

---

## 5. Task-Specific Documentation Map

Use this table to know what to read for each phase.

| Phase / task | Read these files before implementation |
|---|---|
| Repository/tooling | `13`, `16`, `17`, `18`, `19`, `20` |
| Authentication | `08`, `14`, `15`, `19`, `20` |
| Members | `01`, `03`, `04`, `05`, `07`, `08`, `10`, `14`, `19`, `20` |
| Plans | `03`, `04`, `05`, `07`, `08`, `10`, `14`, `19`, `20` |
| Subscriptions | `03`, `04`, `05`, `06`, `08`, `09`, `10`, `12`, `14`, `19` |
| Payments/debt | `03`, `04`, `05`, `06`, `08`, `09`, `10`, `14`, `19` |
| Receipts/verification | `03`, `08`, `09`, `10`, `15`, `19`, `20` |
| Dashboard | `01`, `03`, `07`, `08`, `09`, `10`, `19`, `20` |
| Audit | `03`, `07`, `08`, `09`, `10`, `14`, `19`, `20` |
| Production/deployment | `13`, `15`, `17`, `18`, `19` |

Numbers refer to the file prefixes in `/docs`.

When an endpoint is involved, always check both:
- `08-api-design.md`;
- the relevant section in `21-api-openapi.yaml`.

---

## 6. How to Implement Each Feature

For every feature/vertical slice, work in this sequence unless the phase documentation explicitly requires another order.

### Step A — Identify contract

Before editing code, identify:
- relevant business rules;
- API endpoint(s);
- request payload;
- response payload;
- errors/status codes;
- database constraints;
- audit requirement;
- UI route/screen;
- acceptance criteria.

If any required behavior is absent from the documentation, **do not guess a new business rule**.

### Step B — Database/invariant first when needed

For persistence-heavy features:
1. migration/schema;
2. database constraint/index;
3. service/domain invariant;
4. integration/e2e tests.

Do not rely on frontend validation to preserve financial integrity.

### Step C — Backend endpoint

Implement the exact API contract.

Rules:
- map database objects to response DTOs;
- never expose Prisma records blindly;
- use stable documented error codes;
- use transactions/locks where specified;
- create audit records where required.

### Step D — Frontend API function

Add endpoint access through the central API layer/feature API functions.

Do not call raw `fetch()` directly from feature UI components.

### Step E — Frontend workflow

Implement:
- loading state;
- error state in Arabic;
- empty state where relevant;
- success behavior;
- responsive behavior;
- RTL correctness.

### Step F — Tests and acceptance criteria

A feature is incomplete until its relevant acceptance criteria pass.

Financial mutations additionally require the Definition of Done in `18-implementation-plan.md`.

---

## 7. Backend-First vs Frontend-First Rule

Do **not** build the entire backend first and then the entire frontend.

After Phase 0, use **vertical slices within each phase**.

Example for Members:

```text
1. member DB migration/model
2. create/list/detail backend endpoints + tests
3. frontend member API layer
4. member list/detail UI
5. create-member form
6. edit/archive/restore
7. photo workflow
8. phase acceptance tests
```

This keeps API and UI aligned while still putting domain invariants before presentation.

For core financial phases, backend/domain work leads the slice because correctness matters more than UI speed.

---

## 8. AI Agent Work-Session Protocol

At the beginning of a coding session/task, the agent should state internally or in its work log:

```text
Current phase:
Current task:
Docs consulted:
API endpoints involved:
Business invariants involved:
Files expected to change:
Open questions/blockers:
```

If `Open questions/blockers` contains a missing business rule that changes money, access, deletion, cancellation, refund, credit, or audit meaning, stop that specific behavior and surface the question rather than guessing.

For ordinary technical details that do not change product meaning, choose the simplest implementation consistent with the architecture.

---

## 9. Scope Control

The agent must not add these during V1 unless documentation is explicitly updated first:

- subscription cancellation;
- refunds;
- member credit/overpayment;
- attendance/check-in;
- trainers;
- member login/portal;
- notifications;
- subscription freezing;
- multi-branch support;
- card/online payment methods;
- arbitrary plan durations;
- i18n/language switcher;
- shadcn/ui;
- Redis;
- queues;
- microservices;
- object storage solely for member-photo scale.

If an implementation would be significantly easier by introducing one of these, that is **not** sufficient reason to introduce it.

---

## 10. Mobile/RTL Gate for Every Frontend Phase

Before marking a frontend phase complete, verify relevant screens at:

```text
360px
768px
1024px
desktop width
```

Required:
- no horizontal page overflow;
- important actions are reachable without hover;
- touch targets are usable;
- desktop tables become cards/list representations where specified;
- right sidebar/drawer behavior matches `20-ui-rtl-responsive-spec.md`;
- forms do not rely on two-column layout on narrow screens;
- Arabic labels/errors are present;
- no accidental LTR-only positioning assumptions.

---

## 11. Git / Change Discipline

Prefer small, phase-scoped changes.

Good change units:

```text
chore: scaffold pnpm workspace
chore: add development postgres compose
feat(auth): add session login API
feat(auth): add Arabic login screen
feat(members): add member create/list API
feat(members): add responsive members list
```

Do not mix unrelated future-phase features into the same change simply because the files are nearby.

Never rewrite existing migrations that may have been applied; create a new migration instead.

---

## 12. Definition of "Ready to Start Coding"

The project is ready to start implementation when the agent has:

- this execution plan;
- the implementation contract;
- exact API design/OpenAPI contract;
- database design;
- UI/RTL responsive specification;
- architecture/project-structure documents;
- working repository access.

No additional product discovery is required for the documented V1 scope.

---

## 13. Immediate Next Action

**Start Phase 0.1.**

Create the pnpm monorepo/workspace and scaffold only the repository baseline described in Section 3.

Do **not** implement authentication or any gym business feature in the first task.

The first implementation milestone is:

> A clean monorepo where the React Arabic RTL frontend and NestJS API run locally, the API connects to Docker Compose PostgreSQL, the frontend reaches the health endpoint, and lint/typecheck/test/build/CI are green.

Once that milestone passes, proceed to **Phase 1 — Authentication**.
