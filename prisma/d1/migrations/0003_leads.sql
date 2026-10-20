-- CreateTable
CREATE TABLE IF NOT EXISTS "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "plan" TEXT,
    "note" TEXT,
    "calcInput" TEXT,
    "calcResult" TEXT,
    "source" TEXT NOT NULL DEFAULT '/',
    "status" TEXT NOT NULL DEFAULT 'new',
    "ownerNote" TEXT,
    "proposalId" TEXT,
    "ipHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE INDEX IF NOT EXISTS "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Lead_phone_createdAt_idx" ON "Lead"("phone", "createdAt");
CREATE INDEX IF NOT EXISTS "Lead_ipHash_createdAt_idx" ON "Lead"("ipHash", "createdAt");
