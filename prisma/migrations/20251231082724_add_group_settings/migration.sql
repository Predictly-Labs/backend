-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "allowedMarketTypes" "MarketType"[] DEFAULT ARRAY['STANDARD', 'NO_LOSS']::"MarketType"[],
ADD COLUMN     "defaultMarketType" "MarketType" NOT NULL DEFAULT 'STANDARD';
