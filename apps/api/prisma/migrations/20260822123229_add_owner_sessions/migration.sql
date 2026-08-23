-- CreateTable
CREATE TABLE "Owner" (
    "id" UUID NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "sessionTokenHash" CHAR(64) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMPTZ(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Owner_username_key" ON "Owner"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionTokenHash_key" ON "Session"("sessionTokenHash");

-- CreateIndex
CREATE INDEX "Session_ownerId_idx" ON "Session"("ownerId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
