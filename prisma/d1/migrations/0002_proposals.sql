-- CreateTable
CREATE TABLE IF NOT EXISTS "Proposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "enterpriseId" TEXT,
    "companyName" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "inputs" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "serviceFee" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "planId" TEXT,
    "remark" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Proposal_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Proposal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AppSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Proposal_code_key" ON "Proposal"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Proposal_enterpriseId_createdAt_idx" ON "Proposal"("enterpriseId", "createdAt");
