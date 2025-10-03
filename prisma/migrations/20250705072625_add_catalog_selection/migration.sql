/*
  Warnings:

  - You are about to drop the `PackBooking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceBooking` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CatalogCategory" AS ENUM ('DEMENAGEMENT', 'MENAGE', 'TRANSPORT', 'LIVRAISON');

-- DropForeignKey
ALTER TABLE "PackBooking" DROP CONSTRAINT "PackBooking_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceBooking" DROP CONSTRAINT "ServiceBooking_bookingId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "additionalInfo" JSONB,
ADD COLUMN     "deliveryAddress" TEXT,
ADD COLUMN     "distance" DOUBLE PRECISION,
ADD COLUMN     "locationAddress" TEXT,
ADD COLUMN     "packId" TEXT,
ADD COLUMN     "pickupAddress" TEXT,
ADD COLUMN     "scheduledDate" TIMESTAMP(3),
ADD COLUMN     "serviceId" TEXT;

-- DropTable
DROP TABLE "PackBooking";

-- DropTable
DROP TABLE "ServiceBooking";

-- CreateTable
CREATE TABLE "CatalogSelection" (
    "id" TEXT NOT NULL,
    "packId" TEXT,
    "serviceId" TEXT,
    "category" "CatalogCategory" NOT NULL,
    "subcategory" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isNewOffer" BOOLEAN NOT NULL DEFAULT false,
    "marketingTitle" TEXT,
    "marketingSubtitle" TEXT,
    "marketingDescription" TEXT,
    "marketingPrice" DOUBLE PRECISION,
    "originalPrice" DOUBLE PRECISION,
    "badgeText" TEXT,
    "badgeColor" TEXT NOT NULL DEFAULT '#E67E22',
    "promotionText" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "targetAudience" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "CatalogSelection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_category_order" ON "CatalogSelection"("category", "displayOrder");

-- CreateIndex
CREATE INDEX "idx_active_featured" ON "CatalogSelection"("isActive", "isFeatured");

-- CreateIndex
CREATE INDEX "idx_visibility" ON "CatalogSelection"("isVisible", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogSelection_category_packId_key" ON "CatalogSelection"("category", "packId");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogSelection_category_serviceId_key" ON "CatalogSelection"("category", "serviceId");

-- CreateIndex
CREATE INDEX "Booking_packId_idx" ON "Booking"("packId");

-- CreateIndex
CREATE INDEX "Booking_scheduledDate_idx" ON "Booking"("scheduledDate");

-- CreateIndex
CREATE INDEX "Booking_serviceId_idx" ON "Booking"("serviceId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogSelection" ADD CONSTRAINT "CatalogSelection_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogSelection" ADD CONSTRAINT "CatalogSelection_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
