-- CreateEnum
CREATE TYPE "MemberGender" AS ENUM ('MALE', 'FEMALE');

-- CreateTable
CREATE TABLE "Member" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "phoneDisplay" VARCHAR(20) NOT NULL,
    "phoneNormalized" VARCHAR(11) NOT NULL,
    "gender" "MemberGender" NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "photoKey" VARCHAR(255),
    "heightCm" DECIMAL(5,2),
    "weightKg" DECIMAL(6,2),
    "joinDate" DATE NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- AddCheckConstraints
ALTER TABLE "Member"
ADD CONSTRAINT "Member_heightCm_positive"
CHECK ("heightCm" IS NULL OR "heightCm" > 0),
ADD CONSTRAINT "Member_weightKg_positive"
CHECK ("weightKg" IS NULL OR "weightKg" > 0);

-- CreateIndex
CREATE UNIQUE INDEX "Member_phoneNormalized_key" ON "Member"("phoneNormalized");

-- CreateIndex
CREATE INDEX "Member_isArchived_name_idx" ON "Member"("isArchived", "name");

-- CreateIndex
CREATE INDEX "Member_joinDate_idx" ON "Member"("joinDate");
