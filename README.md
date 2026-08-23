# Hamza Gym System

## Local development

Use Corepack's pinned pnpm version for workspace commands:

```text
corepack pnpm install
docker compose -f docker-compose.dev.yml up -d
corepack pnpm dev
```

The API reads `apps/api/.env` and the web app reads `apps/web/.env`. Copy each `.env.example` file before starting local services.

PostgreSQL is the only container in local development. The web and API applications run as host processes.