CREATE TABLE "Subscription" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "memberId" UUID NOT NULL,
  "planId" UUID NOT NULL,
  "planNameSnapshot" VARCHAR(100) NOT NULL,
  "durationMonths" SMALLINT NOT NULL,
  "listedPriceMinor" BIGINT NOT NULL,
  "agreedPriceMinor" BIGINT NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "voidedAt" TIMESTAMPTZ(3),
  "voidReason" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Subscription_duration_check" CHECK ("durationMonths" IN (1, 3, 6, 12)),
  CONSTRAINT "Subscription_listed_price_check" CHECK ("listedPriceMinor" >= 0),
  CONSTRAINT "Subscription_agreed_price_check" CHECK ("agreedPriceMinor" >= 0),
  CONSTRAINT "Subscription_date_range_check" CHECK ("endDate" >= "startDate"),
  CONSTRAINT "Subscription_void_reason_check" CHECK ("voidedAt" IS NULL OR length(trim("voidReason")) >= 3),
  CONSTRAINT "Subscription_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Subscription_memberId_idx" ON "Subscription"("memberId");
CREATE INDEX "Subscription_memberId_startDate_idx" ON "Subscription"("memberId", "startDate" DESC);
CREATE INDEX "Subscription_startDate_idx" ON "Subscription"("startDate");
CREATE INDEX "Subscription_endDate_idx" ON "Subscription"("endDate");
