/*
  Warnings:

  - The values [MOVER,PACKER,SERVICE_PROVIDER,ADMIN] on the enum `ProfessionalType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `createdBy` on the `CatalogSelection` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('DEMENAGEMENT', 'MENAGE', 'TRANSPORT', 'LIVRAISON');

-- AlterEnum
BEGIN;
CREATE TYPE "ProfessionalType_new" AS ENUM ('MOVING_COMPANY', 'CLEANING_SERVICE', 'HANDYMAN', 'STORAGE_COMPANY', 'OTHER');
ALTER TABLE "Professional" ALTER COLUMN "businessType" TYPE "ProfessionalType_new" USING ("businessType"::text::"ProfessionalType_new");
ALTER TYPE "ProfessionalType" RENAME TO "ProfessionalType_old";
ALTER TYPE "ProfessionalType_new" RENAME TO "ProfessionalType";
DROP TYPE "ProfessionalType_old";
COMMIT;

-- DropIndex
DROP INDEX "CatalogSelection_category_packId_key";

-- DropIndex
DROP INDEX "CatalogSelection_category_serviceId_key";

-- DropIndex
DROP INDEX "idx_active_featured";

-- DropIndex
DROP INDEX "idx_category_order";

-- AlterTable
ALTER TABLE "CatalogSelection" DROP COLUMN "createdBy",
ADD COLUMN     "itemId" TEXT,
ALTER COLUMN "badgeColor" DROP NOT NULL,
ALTER COLUMN "badgeColor" DROP DEFAULT;

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "type" "ItemType" NOT NULL,
    "template_id" TEXT,
    "customer_id" TEXT,
    "booking_id" TEXT,
    "parent_item_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "workers" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "included_distance" INTEGER,
    "distance_unit" TEXT DEFAULT 'km',
    "includes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category_id" TEXT,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "image_path" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "type" "ItemType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "workers" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "included_distance" INTEGER,
    "distance_unit" TEXT DEFAULT 'km',
    "includes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category_id" TEXT,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "image_path" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "items_type_idx" ON "items"("type");

-- CreateIndex
CREATE INDEX "items_template_id_idx" ON "items"("template_id");

-- CreateIndex
CREATE INDEX "items_customer_id_idx" ON "items"("customer_id");

-- CreateIndex
CREATE INDEX "items_is_active_idx" ON "items"("is_active");

-- CreateIndex
CREATE INDEX "items_type_is_active_idx" ON "items"("type", "is_active");

-- CreateIndex
CREATE INDEX "items_parent_item_id_idx" ON "items"("parent_item_id");

-- CreateIndex
CREATE INDEX "templates_type_idx" ON "templates"("type");

-- CreateIndex
CREATE INDEX "templates_is_active_idx" ON "templates"("is_active");

-- CreateIndex
CREATE INDEX "templates_type_is_active_idx" ON "templates"("type", "is_active");

-- CreateIndex
CREATE INDEX "templates_popular_idx" ON "templates"("popular");

-- CreateIndex
CREATE INDEX "CatalogSelection_category_idx" ON "CatalogSelection"("category");

-- CreateIndex
CREATE INDEX "CatalogSelection_isActive_idx" ON "CatalogSelection"("isActive");

-- CreateIndex
CREATE INDEX "CatalogSelection_isFeatured_idx" ON "CatalogSelection"("isFeatured");

-- CreateIndex
CREATE INDEX "CatalogSelection_displayOrder_idx" ON "CatalogSelection"("displayOrder");

-- AddForeignKey
ALTER TABLE "CatalogSelection" ADD CONSTRAINT "CatalogSelection_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_parent_item_id_fkey" FOREIGN KEY ("parent_item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_visibility" RENAME TO "CatalogSelection_isVisible_startDate_endDate_idx";
