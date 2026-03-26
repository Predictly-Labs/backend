/*
  Warnings:

  - Made the column `walletAddress` on table `User` required. This step will fail if there are existing NULL values in that column.

*/

-- Step 1: Update existing users with NULL walletAddress to use a placeholder
-- This ensures backward compatibility during migration
UPDATE "User" 
SET "walletAddress" = CONCAT('migration_', "id") 
WHERE "walletAddress" IS NULL;

-- Step 2: AlterTable
ALTER TABLE "PredictionMarket" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Step 3: AlterTable - Make privyId nullable and walletAddress required
ALTER TABLE "User" ALTER COLUMN "privyId" DROP NOT NULL,
ALTER COLUMN "walletAddress" SET NOT NULL;

-- Step 4: CreateTable
CREATE TABLE "InitializationLock" (
    "marketId" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InitializationLock_pkey" PRIMARY KEY ("marketId")
);

-- Step 5: CreateIndex
CREATE INDEX "InitializationLock_expiresAt_idx" ON "InitializationLock"("expiresAt");
