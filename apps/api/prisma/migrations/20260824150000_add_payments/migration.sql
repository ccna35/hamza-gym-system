CREATE TYPE "PaymentMethod" AS ENUM ('CASH');

CREATE TABLE "Payment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "memberId" UUID NOT NULL,
  "amountMinor" BIGINT NOT NULL,
  "balanceAfterPaymentMinor" BIGINT NOT NULL,
  "paymentDate" DATE NOT NULL,
  "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
  "receiptNumber" VARCHAR(32) NOT NULL,
  "verificationToken" VARCHAR(32) NOT NULL,
  "voidedAt" TIMESTAMPTZ(3),
  "voidReason" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Payment_amount_check" CHECK ("amountMinor" > 0),
  CONSTRAINT "Payment_balance_check" CHECK ("balanceAfterPaymentMinor" >= 0),
  CONSTRAINT "Payment_void_reason_check" CHECK ("voidedAt" IS NULL OR length(trim("voidReason")) >= 3),
  CONSTRAINT "Payment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "SystemCounter" (
  "key" VARCHAR(64) NOT NULL,
  "nextValue" BIGINT NOT NULL,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "SystemCounter_pkey" PRIMARY KEY ("key"),
  CONSTRAINT "SystemCounter_next_value_check" CHECK ("nextValue" > 0)
);
CREATE UNIQUE INDEX "Payment_receiptNumber_key" ON "Payment"("receiptNumber");
CREATE UNIQUE INDEX "Payment_verificationToken_key" ON "Payment"("verificationToken");
CREATE INDEX "Payment_memberId_paymentDate_createdAt_idx" ON "Payment"("memberId", "paymentDate" DESC, "createdAt" DESC);
CREATE INDEX "Payment_paymentDate_idx" ON "Payment"("paymentDate");
