/*
  Warnings:

  - You are about to drop the column `packId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `serviceId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `packId` on the `CatalogSelection` table. All the data in the column will be lost.
  - You are about to drop the column `serviceId` on the `CatalogSelection` table. All the data in the column will be lost.
  - You are about to drop the `Pack` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Service` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_packId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogSelection" DROP CONSTRAINT "CatalogSelection_packId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogSelection" DROP CONSTRAINT "CatalogSelection_serviceId_fkey";

-- DropIndex
DROP INDEX "Booking_packId_idx";

-- DropIndex
DROP INDEX "Booking_serviceId_idx";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "packId",
DROP COLUMN "serviceId";

-- AlterTable
ALTER TABLE "CatalogSelection" DROP COLUMN "packId",
DROP COLUMN "serviceId";

-- AlterTable
ALTER TABLE "QuoteRequest" ADD COLUMN     "catalogSelectionId" TEXT;

-- DropTable
DROP TABLE "Pack";

-- DropTable
DROP TABLE "Service";

-- CreateIndex
CREATE INDEX "QuoteRequest_catalogSelectionId_idx" ON "QuoteRequest"("catalogSelectionId");

-- AddForeignKey
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_catalogSelectionId_fkey" FOREIGN KEY ("catalogSelectionId") REFERENCES "CatalogSelection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
