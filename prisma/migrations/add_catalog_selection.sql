-- CreateEnum
CREATE TYPE "CatalogCategory" AS ENUM ('DEMENAGEMENT', 'MENAGE', 'TRANSPORT', 'LIVRAISON');

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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
CREATE UNIQUE INDEX "unique_pack_per_category" ON "CatalogSelection"("category", "packId");

-- CreateIndex
CREATE UNIQUE INDEX "unique_service_per_category" ON "CatalogSelection"("category", "serviceId");

-- AddForeignKey
ALTER TABLE "CatalogSelection" ADD CONSTRAINT "CatalogSelection_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogSelection" ADD CONSTRAINT "CatalogSelection_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Contrainte pour s'assurer qu'un CatalogSelection a soit un Pack soit un Service
ALTER TABLE "CatalogSelection" ADD CONSTRAINT "catalog_selection_pack_or_service_check" 
CHECK (
    (packId IS NOT NULL AND serviceId IS NULL) OR 
    (packId IS NULL AND serviceId IS NOT NULL)
); 