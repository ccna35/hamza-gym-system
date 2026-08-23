CREATE TYPE "AuditEntityType" AS ENUM ('MEMBER', 'PLAN', 'SUBSCRIPTION', 'PAYMENT');

CREATE TYPE "AuditAction" AS ENUM (
  'MEMBER_CREATED',
  'MEMBER_UPDATED',
  'MEMBER_ARCHIVED',
  'MEMBER_RESTORED',
  'PLAN_CREATED',
  'PLAN_UPDATED',
  'PLAN_ENABLED',
  'PLAN_DISABLED',
  'SUBSCRIPTION_CREATED',
  'SUBSCRIPTION_UPDATED',
  'SUBSCRIPTION_VOIDED',
  'PAYMENT_CREATED',
  'PAYMENT_VOIDED'
);

CREATE TABLE "AuditLog" (
  "id" UUID NOT NULL,
  "actorOwnerId" UUID NOT NULL,
  "entityType" "AuditEntityType" NOT NULL,
  "entityId" VARCHAR(255) NOT NULL,
  "action" "AuditAction" NOT NULL,
  "beforeJson" JSONB,
  "afterJson" JSONB,
  "metadataJson" JSONB,
  "requestId" VARCHAR(255),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuditLog_actorOwnerId_fkey" FOREIGN KEY ("actorOwnerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt" DESC);
CREATE INDEX "AuditLog_actorOwnerId_createdAt_idx" ON "AuditLog"("actorOwnerId", "createdAt" DESC);
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" DESC);
