-- CreateTable
CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "referredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_email_key" ON "Waitlist"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_walletAddress_key" ON "Waitlist"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_referralCode_key" ON "Waitlist"("referralCode");

-- CreateIndex
CREATE INDEX "Waitlist_referralCode_idx" ON "Waitlist"("referralCode");

-- CreateIndex
CREATE INDEX "Waitlist_referredBy_idx" ON "Waitlist"("referredBy");

-- AddForeignKey
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_referredBy_fkey" FOREIGN KEY ("referredBy") REFERENCES "Waitlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
