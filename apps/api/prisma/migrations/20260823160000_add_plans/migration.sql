CREATE TABLE "Plan" (
  "id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanPrice" (
  "id" UUID NOT NULL,
  "planId" UUID NOT NULL,
  "durationMonths" SMALLINT NOT NULL,
  "priceMinor" BIGINT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "PlanPrice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlanPrice_durationMonths_check" CHECK ("durationMonths" IN (1, 3, 6, 12)),
  CONSTRAINT "PlanPrice_priceMinor_check" CHECK ("priceMinor" >= 0),
  CONSTRAINT "PlanPrice_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");
CREATE INDEX "Plan_isEnabled_idx" ON "Plan"("isEnabled");
CREATE UNIQUE INDEX "PlanPrice_planId_durationMonths_key" ON "PlanPrice"("planId", "durationMonths");
