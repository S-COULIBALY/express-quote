/**
 * Health Check API endpoint
 *
 * Vérifie la santé générale de l'application et des services critiques
 * incluant le nouveau système de notification v2.0
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Vérification de base de données
    const dbHealth = await checkDatabaseHealth();

    // Vérification du système de notification (si activé)
    const notificationHealth = await checkNotificationSystemHealth();

    // Vérification des services externes
    const externalServicesHealth = await checkExternalServices();

    const responseTime = Date.now() - startTime;

    const isHealthy =
      dbHealth.isHealthy &&
      notificationHealth.isHealthy &&
      externalServicesHealth.isHealthy;

    const healthData = {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        database: dbHealth,
        notifications: notificationHealth,
        external: externalServicesHealth,
      },
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
    };

    return NextResponse.json(healthData, {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime: `${Date.now() - startTime}ms`,
      },
      { status: 503 },
    );
  }
}

/**
 * Vérifie la santé de la base de données
 */
async function checkDatabaseHealth() {
  try {
    const { PrismaClient } = await import("@prisma/client");
    // Test simple de connexion
    await prisma.$queryRaw`SELECT 1`;

    // Test spécifique table notifications
    const notificationCount = await prisma.notifications.count();

    await prisma.$disconnect();

    return {
      isHealthy: true,
      status: "connected",
      message: "Database connection successful",
      notifications_table: `${notificationCount} records`,
    };
  } catch (error) {
    return {
      isHealthy: false,
      status: "error",
      message:
        error instanceof Error ? error.message : "Database connection failed",
    };
  }
}

/**
 * Vérifie la santé du système de notification
 */
async function checkNotificationSystemHealth() {
  try {
    // Vérifier si le système de notification est activé
    const isEnabled = process.env.ENABLE_NEW_NOTIFICATION_SYSTEM === "true";

    if (!isEnabled) {
      return {
        isHealthy: true,
        status: "disabled",
        message: "Notification system is disabled",
      };
    }

    // Vérifier Redis si configuré
    const redisHealth = await checkRedisHealth();

    // Vérifier la configuration email
    const emailHealth = await checkEmailConfig();

    return {
      isHealthy: redisHealth.isHealthy && emailHealth.isHealthy,
      status: "operational",
      message: "Notification system v2.0 enabled",
      redis: redisHealth,
      email: emailHealth,
    };
  } catch (error) {
    return {
      isHealthy: false,
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Notification system check failed",
    };
  }
}

/**
 * Vérifie la santé de Redis (pour les queues)
 */
async function checkRedisHealth() {
  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      return {
        isHealthy: true,
        status: "not-configured",
        message: "Redis not configured, using fallback",
      };
    }

    return {
      isHealthy: true,
      status: "configured",
      message: `Redis configured at ${redisUrl}`,
      url: redisUrl,
    };
  } catch (error) {
    return {
      isHealthy: false,
      status: "error",
      message: "Redis health check failed",
    };
  }
}

/**
 * Vérifie la configuration email
 */
async function checkEmailConfig() {
  try {
    const smtpHost = process.env.SMTP_HOST;
    const emailEnabled = process.env.ENABLE_EMAIL_NOTIFICATIONS === "true";

    if (!emailEnabled) {
      return {
        isHealthy: true,
        status: "disabled",
        message: "Email notifications disabled",
      };
    }

    if (!smtpHost) {
      return {
        isHealthy: false,
        status: "misconfigured",
        message: "SMTP_HOST not configured",
      };
    }

    return {
      isHealthy: true,
      status: "configured",
      message: `SMTP configured for ${smtpHost}`,
      host: smtpHost,
      port: process.env.SMTP_PORT || "587",
    };
  } catch (error) {
    return {
      isHealthy: false,
      status: "error",
      message: "Email configuration check failed",
    };
  }
}

/**
 * Vérifie les services externes
 */
async function checkExternalServices() {
  const services = [];
  const allHealthy = true;

  try {
    // Vérification Stripe si configuré
    if (process.env.STRIPE_SECRET_KEY) {
      services.push({
        name: "Stripe",
        status: "configured",
        isHealthy: true,
        version: "v3",
      });
    }

    // Vérification Google Maps si configuré
    if (process.env.GOOGLE_MAPS_API_KEY) {
      services.push({
        name: "Google Maps",
        status: "configured",
        isHealthy: true,
      });
    }

    return {
      isHealthy: allHealthy,
      services,
      status: allHealthy ? "operational" : "degraded",
      count: services.length,
    };
  } catch (error) {
    return {
      isHealthy: false,
      status: "error",
      services,
      message: "External services check failed",
    };
  }
}
