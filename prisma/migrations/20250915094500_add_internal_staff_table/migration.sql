-- CreateEnum
DO $$ BEGIN
 CREATE TYPE "InternalRole" AS ENUM ('MOVING_MANAGER', 'CLEANING_MANAGER', 'DELIVERY_MANAGER', 'OPERATIONS_MANAGER', 'CUSTOMER_SERVICE', 'ACCOUNTING', 'ADMIN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE "internal_staff" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" "InternalRole" NOT NULL,
    "department" TEXT,
    "service_types" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "receive_email" BOOLEAN NOT NULL DEFAULT true,
    "receive_sms" BOOLEAN NOT NULL DEFAULT false,
    "receive_whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "working_hours" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "internal_staff_email_key" ON "internal_staff"("email");

-- CreateIndex
CREATE INDEX "internal_staff_role_idx" ON "internal_staff"("role");

-- CreateIndex
CREATE INDEX "internal_staff_is_active_idx" ON "internal_staff"("is_active");

-- CreateIndex
CREATE INDEX "internal_staff_role_is_active_idx" ON "internal_staff"("role", "is_active");

-- CreateIndex
CREATE INDEX "internal_staff_email_idx" ON "internal_staff"("email");