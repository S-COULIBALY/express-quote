-- Table Configuration
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

-- Indices pour Configuration
CREATE UNIQUE INDEX "Configuration_category_key_key" ON "Configuration"("category", "key");
CREATE INDEX "Configuration_category_idx" ON "Configuration"("category");
CREATE INDEX "Configuration_isActive_idx" ON "Configuration"("isActive");
CREATE INDEX "Configuration_validFrom_validTo_idx" ON "Configuration"("validFrom", "validTo");

-- Table QuoteRequest
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

-- Indices pour QuoteRequest
CREATE UNIQUE INDEX "QuoteRequest_temporaryId_key" ON "QuoteRequest"("temporaryId");
CREATE INDEX "QuoteRequest_temporaryId_idx" ON "QuoteRequest"("temporaryId");
CREATE INDEX "QuoteRequest_status_idx" ON "QuoteRequest"("status");
CREATE INDEX "QuoteRequest_type_idx" ON "QuoteRequest"("type");

-- Relation entre Booking et QuoteRequest
ALTER TABLE "Booking" ADD COLUMN "quoteRequestId" TEXT;
CREATE INDEX "Booking_quoteRequestId_idx" ON "Booking"("quoteRequestId");
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
