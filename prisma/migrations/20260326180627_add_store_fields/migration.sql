-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "prospectStatus" TEXT,
ADD COLUMN     "storeType" TEXT NOT NULL DEFAULT 'burning';
