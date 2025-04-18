/*
  Warnings:

  - You are about to drop the column `additionalInfo` on the `Pack` table. All the data in the column will be lost.
  - You are about to drop the column `bookingId` on the `Pack` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryAddress` on the `Pack` table. All the data in the column will be lost.
  - You are about to drop the column `distance` on the `Pack` table. All the data in the column will be lost.
  - You are about to drop the column `pickupAddress` on the `Pack` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledDate` on the `Pack` table. All the data in the column will be lost.
  - You are about to drop the column `bookingId` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledDate` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `rules` table. All the data in the column will be lost.
  - Added the required column `category` to the `rules` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('MOVING', 'PACKING', 'CLEANING', 'DELIVERY', 'PACK', 'SERVICE');

-- CreateEnum
CREATE TYPE "RuleCategory" AS ENUM ('REDUCTION', 'SURCHARGE', 'MINIMUM', 'MAXIMUM', 'FIXED', 'PERCENTAGE');

-- DropForeignKey
ALTER TABLE "Pack" DROP CONSTRAINT "Pack_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_bookingId_fkey";

-- DropIndex
DROP INDEX "Pack_bookingId_idx";

-- DropIndex
DROP INDEX "Pack_bookingId_key";

-- DropIndex
DROP INDEX "Pack_scheduledDate_idx";

-- DropIndex
DROP INDEX "Service_bookingId_idx";

-- DropIndex
DROP INDEX "Service_bookingId_key";

-- DropIndex
DROP INDEX "Service_scheduledDate_idx";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "quoteRequestId" TEXT;

-- AlterTable
ALTER TABLE "Pack" DROP COLUMN "additionalInfo",
DROP COLUMN "bookingId",
DROP COLUMN "deliveryAddress",
DROP COLUMN "distance",
DROP COLUMN "pickupAddress",
DROP COLUMN "scheduledDate",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "content" TEXT,
ADD COLUMN     "distanceUnit" TEXT NOT NULL DEFAULT 'km',
ADD COLUMN     "features" TEXT[],
ADD COLUMN     "imagePath" TEXT,
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "popular" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workersNeeded" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "includedDistance" SET DEFAULT 0,
ALTER COLUMN "workers" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "bookingId",
DROP COLUMN "location",
DROP COLUMN "scheduledDate",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "features" TEXT[],
ADD COLUMN     "imagePath" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "workers" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "rules" DROP COLUMN "type",
ADD COLUMN     "category" "RuleCategory" NOT NULL,
ADD COLUMN     "condition" TEXT,
ADD COLUMN     "percentBased" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "serviceType" "ServiceType" NOT NULL DEFAULT 'SERVICE';

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "quoteData" JSONB NOT NULL,
    "temporaryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuration" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceBooking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "additionalInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackBooking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "additionalInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequest_temporaryId_key" ON "QuoteRequest"("temporaryId");

-- CreateIndex
CREATE INDEX "QuoteRequest_temporaryId_idx" ON "QuoteRequest"("temporaryId");

-- CreateIndex
CREATE INDEX "QuoteRequest_status_idx" ON "QuoteRequest"("status");

-- CreateIndex
CREATE INDEX "QuoteRequest_type_idx" ON "QuoteRequest"("type");

-- CreateIndex
CREATE INDEX "Configuration_category_idx" ON "Configuration"("category");

-- CreateIndex
CREATE INDEX "Configuration_isActive_idx" ON "Configuration"("isActive");

-- CreateIndex
CREATE INDEX "Configuration_validFrom_validTo_idx" ON "Configuration"("validFrom", "validTo");

-- CreateIndex
CREATE UNIQUE INDEX "Configuration_category_key_key" ON "Configuration"("category", "key");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceBooking_bookingId_key" ON "ServiceBooking"("bookingId");

-- CreateIndex
CREATE INDEX "ServiceBooking_bookingId_idx" ON "ServiceBooking"("bookingId");

-- CreateIndex
CREATE INDEX "ServiceBooking_scheduledDate_idx" ON "ServiceBooking"("scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "PackBooking_bookingId_key" ON "PackBooking"("bookingId");

-- CreateIndex
CREATE INDEX "PackBooking_bookingId_idx" ON "PackBooking"("bookingId");

-- CreateIndex
CREATE INDEX "PackBooking_scheduledDate_idx" ON "PackBooking"("scheduledDate");

-- CreateIndex
CREATE INDEX "Booking_quoteRequestId_idx" ON "Booking"("quoteRequestId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceBooking" ADD CONSTRAINT "ServiceBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackBooking" ADD CONSTRAINT "PackBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
