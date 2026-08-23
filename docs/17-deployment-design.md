# Deployment Design — V1

Target: one application VPS plus one external managed PostgreSQL database.

The production database may be Supabase PostgreSQL or another managed/free PostgreSQL provider, but the application must use it as standard PostgreSQL through `DATABASE_URL`. Do not couple application logic to provider-specific auth/database SDK features.

## 1. Development Topology

```text
React/Vite     -> npm/pnpm dev process
NestJS API     -> npm/pnpm dev process
PostgreSQL     -> Docker Compose service
```

Development Docker Compose is primarily for PostgreSQL. Containerizing web/API in development is optional and not required by the baseline.

## 2. Production Topology

```text
Internet
   |
   v
Nginx :443 on VPS
   |-----------------------------|
   |                             |
   v                             v
React static files           NestJS API
                                  |
                     |------------|-------------|
                     v                          v
        Managed PostgreSQL              Persistent photo directory
        via DATABASE_URL                on VPS/host volume
```

Public ports on VPS:
- 80 -> HTTPS redirect / ACME
- 443 -> application
- SSH -> restricted administration

There is no public PostgreSQL port on the VPS because production PostgreSQL is managed externally.

## 3. Production Services

Recommended production runtime:
- `nginx`
- `api`

React is built during CI/release and served as static assets by Nginx.

The API may run in Docker or as a managed system process; Docker is recommended for reproducibility but PostgreSQL is **not** a production Compose service.

No Redis service.

## 4. Persistent Member Photos

Expected member count is under ~1,000, so local persistent server storage is sufficient.

Recommended host directory:

```text
/var/lib/gym-management/member-photos/
```

Requirements:
- directory exists outside container writable layer
- API receives path through `PHOTO_STORAGE_PATH`
- random opaque filenames/keys
- not served directly by Nginx as public static files
- authenticated API endpoint serves member photos
- photo backup is independent from DB backup

If API runs in Docker, bind-mount the host directory into the API container.

Object storage can be introduced later only if deployment becomes ephemeral, multiple API replicas are needed, or operations justify it.

## 5. Managed PostgreSQL Requirements

The provider must expose a normal PostgreSQL connection string compatible with Prisma.

Application requirements:
- no Supabase Auth dependency
- no Supabase client query layer
- no provider-specific business logic
- Prisma migrations remain the schema source of truth
- Do not introduce PostgreSQL extensions without a concrete requirement. If `btree_gist` is later considered for overlap exclusion, document the exact constraint it supports and whether the invariant can reasonably be enforced without it before selecting a provider.

Changing providers should require primarily changing `DATABASE_URL`, not rewriting services.

## 6. HTTPS and Same-Origin Routing

Use Let's Encrypt certificates and automatic renewal.

Nginx:
- HTTP -> HTTPS redirect
- proxy `/api/` to NestJS
- serve SPA assets
- SPA fallback to `index.html`
- request-body limit compatible with member photo upload

Recommended single origin:

```text
https://gym.example.com/          -> React
https://gym.example.com/api/v1/*  -> NestJS
```

This keeps session-cookie handling simple.

## 7. Environment Secrets

Production secrets are not committed.

Minimum:

```text
DATABASE_URL
APP_ORIGIN
SESSION_COOKIE_NAME
SESSION_TTL_SECONDS
PHOTO_STORAGE_PATH
RECEIPT_VERIFY_BASE_URL
```

If the managed database requires TLS options, configure them through the database connection settings without embedding secrets in code.

## 8. Database Migrations

Production deployment order:
1. create/verify backup for risky migration
2. build/test release
3. run `prisma migrate deploy` against managed production DB
4. deploy/start API
5. run health check
6. serve/continue traffic

Never use `prisma migrate dev` or schema push commands against production.

## 9. CI/CD

Simple GitHub Actions is enough.

On PR/push:
- install locked dependencies
- lint
- typecheck
- backend tests
- frontend tests where present
- frontend production build
- API production build

On authorized deploy:
- deliver release/image to VPS
- run production migration
- restart API safely
- verify `/api/v1/health` (or configured health path)

No private deployment key belongs in repository source.

## 10. Backups

A free managed DB tier must not be assumed to provide sufficient backup retention. Keep application-controlled backups.

Minimum V1 policy:
- daily PostgreSQL logical `pg_dump` from managed DB
- daily photo archive/sync from VPS directory
- copy both to storage outside the application VPS and outside the database provider where practical
- retain multiple generations
- encrypt transfer/storage where supported

The DB backup and photo backup are separate artifacts.

## 11. Restore Procedure

Document and test:

```text
1. provision/select clean PostgreSQL database
2. restore chosen pg_dump
3. restore member-photo directory with original storage keys
4. configure DATABASE_URL/PHOTO_STORAGE_PATH
5. deploy compatible application version
6. run health checks
7. sample-check members, balances, receipts, and photos
```

A backup strategy is not complete until restore has been tested.

## 12. Logs and Operational Checks

Use structured API stdout logs and host/container log rotation.

Minimum checks:
- API health endpoint
- managed DB connectivity
- VPS disk usage (especially photo/log directories)
- backup freshness
- TLS renewal

Do not add a metrics stack until operations justify it.

## 13. Resource Protection

Configure:
- firewall
- SSH key authentication
- non-root deployment user
- OS security updates
- API/container log limits
- Nginx upload limits
- database connection pool appropriate to the managed provider's connection limit

Because free managed PostgreSQL providers may have lower connection limits, keep the Prisma/API pool conservative and confirm provider limits before production launch.

## 14. Production Data Safety

- never use production credentials in local `.env`
- no hard-delete UI for member/payment/subscription financial history
- use archive/disable/void rules from business documents
- identify target environment explicitly before migration/seed/admin scripts

## 15. Future Scaling Path

Only when measurements justify it:
1. tune SQL/indexes
2. increase VPS resources
3. move managed DB tier/provider if limits become restrictive
4. move photos to object storage
5. run multiple stateless API replicas
6. add external session/cache infrastructure only when needed
