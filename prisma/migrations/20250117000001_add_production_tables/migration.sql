-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('CLIENT_7_DAYS', 'CLIENT_24_HOURS', 'CLIENT_1_HOUR', 'PROFESSIONAL_DAY_J', 'PROFESSIONAL_ATTRIBUTION_FOLLOW_UP');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('SCHEDULED', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('QUOTE_CONFIRMATION', 'BOOKING_CONFIRMATION', 'PAYMENT_CONFIRMATION', 'SERVICE_REMINDER', 'PROFESSIONAL_ATTRIBUTION', 'MISSION_ACCEPTED', 'ACCOUNTING_DOCUMENT', 'CLIENT_REMINDER_7D', 'CLIENT_REMINDER_24H', 'CLIENT_REMINDER_1H', 'PROFESSIONAL_DAY_J');

-- CreateTable
CREATE TABLE "scheduled_reminders" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "professional_id" TEXT,
    "attribution_id" TEXT,
    "reminder_type" "ReminderType" NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "service_date" TIMESTAMP(3) NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "recipient_phone" TEXT,
    "full_client_data" JSONB NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'SCHEDULED',
    "sent_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "last_error" TEXT,
    "next_retry_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TemplateType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "subject" TEXT,
    "html_content" TEXT,
    "text_content" TEXT,
    "sms_content" TEXT,
    "required_vars" TEXT[],
    "optional_vars" TEXT[],
    "version" TEXT NOT NULL DEFAULT '1.0',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "tags" TEXT[],
    "author_id" TEXT,
    "business_rules" JSONB,
    "trigger_events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_metrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hour" INTEGER,
    "channel" "NotificationChannel" NOT NULL,
    "template_type" "TemplateType",
    "total_sent" INTEGER NOT NULL DEFAULT 0,
    "total_delivered" INTEGER NOT NULL DEFAULT 0,
    "total_failed" INTEGER NOT NULL DEFAULT 0,
    "total_bounced" INTEGER NOT NULL DEFAULT 0,
    "total_opened" INTEGER NOT NULL DEFAULT 0,
    "total_clicked" INTEGER NOT NULL DEFAULT 0,
    "avg_processing_ms" INTEGER,
    "max_processing_ms" INTEGER,
    "min_processing_ms" INTEGER,
    "total_cost" DOUBLE PRECISION,
    "avg_cost_per_msg" DOUBLE PRECISION,
    "success_rate" DOUBLE PRECISION,
    "delivery_rate" DOUBLE PRECISION,
    "open_rate" DOUBLE PRECISION,
    "click_rate" DOUBLE PRECISION,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_providers" (
    "id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "daily_limit" INTEGER,
    "monthly_limit" INTEGER,
    "cost_per_message" DOUBLE PRECISION,
    "config" JSONB NOT NULL,
    "credentials" JSONB NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "total_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_healthy" BOOLEAN NOT NULL DEFAULT true,
    "last_health_check" TIMESTAMP(3),
    "health_status" TEXT,
    "current_day_usage" INTEGER NOT NULL DEFAULT 0,
    "last_reset_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_audits" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "referer" TEXT,
    "before_data" JSONB,
    "after_data" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "country" TEXT,
    "city" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_reminders_scheduled_date_idx" ON "scheduled_reminders"("scheduled_date");

-- CreateIndex
CREATE INDEX "scheduled_reminders_status_idx" ON "scheduled_reminders"("status");

-- CreateIndex
CREATE INDEX "scheduled_reminders_reminder_type_idx" ON "scheduled_reminders"("reminder_type");

-- CreateIndex
CREATE INDEX "scheduled_reminders_booking_id_idx" ON "scheduled_reminders"("booking_id");

-- CreateIndex
CREATE INDEX "scheduled_reminders_professional_id_idx" ON "scheduled_reminders"("professional_id");

-- CreateIndex
CREATE INDEX "scheduled_reminders_attribution_id_idx" ON "scheduled_reminders"("attribution_id");

-- CreateIndex
CREATE INDEX "scheduled_reminders_status_scheduled_date_idx" ON "scheduled_reminders"("status", "scheduled_date");

-- CreateIndex
CREATE INDEX "scheduled_reminders_recipient_email_idx" ON "scheduled_reminders"("recipient_email");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_name_key" ON "notification_templates"("name");

-- CreateIndex
CREATE INDEX "notification_templates_type_idx" ON "notification_templates"("type");

-- CreateIndex
CREATE INDEX "notification_templates_channel_idx" ON "notification_templates"("channel");

-- CreateIndex
CREATE INDEX "notification_templates_is_active_idx" ON "notification_templates"("is_active");

-- CreateIndex
CREATE INDEX "notification_templates_is_default_idx" ON "notification_templates"("is_default");

-- CreateIndex
CREATE INDEX "notification_templates_type_channel_idx" ON "notification_templates"("type", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "notification_metrics_date_hour_channel_template_type_key" ON "notification_metrics"("date", "hour", "channel", "template_type");

-- CreateIndex
CREATE INDEX "notification_metrics_date_idx" ON "notification_metrics"("date");

-- CreateIndex
CREATE INDEX "notification_metrics_channel_idx" ON "notification_metrics"("channel");

-- CreateIndex
CREATE INDEX "notification_metrics_template_type_idx" ON "notification_metrics"("template_type");

-- CreateIndex
CREATE INDEX "notification_metrics_date_channel_idx" ON "notification_metrics"("date", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "notification_providers_channel_name_key" ON "notification_providers"("channel", "name");

-- CreateIndex
CREATE INDEX "notification_providers_channel_idx" ON "notification_providers"("channel");

-- CreateIndex
CREATE INDEX "notification_providers_is_active_priority_idx" ON "notification_providers"("is_active", "priority");

-- CreateIndex
CREATE INDEX "notification_providers_is_healthy_idx" ON "notification_providers"("is_healthy");

-- CreateIndex
CREATE INDEX "notification_audits_notification_id_idx" ON "notification_audits"("notification_id");

-- CreateIndex
CREATE INDEX "notification_audits_user_id_idx" ON "notification_audits"("user_id");

-- CreateIndex
CREATE INDEX "notification_audits_action_idx" ON "notification_audits"("action");

-- CreateIndex
CREATE INDEX "notification_audits_created_at_idx" ON "notification_audits"("created_at");

-- CreateIndex
CREATE INDEX "notification_audits_action_created_at_idx" ON "notification_audits"("action", "created_at");

-- AddForeignKey
ALTER TABLE "scheduled_reminders" ADD CONSTRAINT "scheduled_reminders_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_reminders" ADD CONSTRAINT "scheduled_reminders_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_reminders" ADD CONSTRAINT "scheduled_reminders_attribution_id_fkey" FOREIGN KEY ("attribution_id") REFERENCES "booking_attributions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_audits" ADD CONSTRAINT "notification_audits_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;