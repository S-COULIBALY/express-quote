import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ProfessionalAuthService } from "@/lib/auth/ProfessionalAuthService";

// Force le rendu dynamique (évite erreur de build Vercel)
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  // 🔓 AUTHENTIFICATION DÉSACTIVÉE TEMPORAIREMENT
  try {
    const { searchParams } = new URL(request.url);

    // Mode rapide pour page d'accueil (stats basiques seulement)
    const quickMode = searchParams.get("quick") === "true";

    // Paramètres de période
    const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d, 1y
    const compareWith = searchParams.get("compare") || "previous"; // previous, year_ago

    // Calculer les dates de début et fin
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Dates de comparaison
    const compareEndDate = new Date(startDate);
    const compareStartDate = new Date(startDate);
    const periodDays = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (compareWith === "previous") {
      compareStartDate.setDate(compareStartDate.getDate() - periodDays);
    } else {
      compareStartDate.setFullYear(compareStartDate.getFullYear() - 1);
      compareEndDate.setFullYear(compareEndDate.getFullYear() - 1);
    }

    // Mode rapide : récupération des données essentielles seulement
    if (quickMode) {
      const [
        totalBookings,
        totalCustomers,
        currentPeriodRevenue,
        // Données pour taux de conversion
        totalQuoteRequests,
        paidBookings,
        // Demandes en attente
        pendingRequests,
      ] = await Promise.all([
        prisma.booking.count(),
        prisma.customer.count(),
        prisma.booking.aggregate({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: { totalAmount: true },
        }),
        // Total devis générés
        prisma.quoteRequest.count(),
        // Bookings payés (conversion réussie)
        prisma.booking.count({
          where: {
            status: {
              in: ["PAYMENT_COMPLETED", "COMPLETED"],
            },
          },
        }),
        // Demandes en attente (QuoteRequests temporaires)
        prisma.quoteRequest.count({
          where: {
            status: "TEMPORARY",
          },
        }),
      ]);

      // Calcul des vrais taux
      const conversionRate =
        totalQuoteRequests > 0
          ? parseFloat(((paidBookings / totalQuoteRequests) * 100).toFixed(1))
          : 0;

      const recoveryRate =
        totalBookings > 0
          ? parseFloat(((paidBookings / totalBookings) * 100).toFixed(1))
          : 0;

      console.log("🔍 DEBUG API Stats:", {
        totalCustomers,
        totalBookings,
        monthlyRevenue: currentPeriodRevenue._sum.totalAmount,
        period: { startDate, endDate },
      });

      return Response.json({
        success: true,
        data: {
          totalCustomers,
          totalBookings,
          monthlyRevenue: parseFloat(
            (currentPeriodRevenue._sum.totalAmount || 0).toFixed(2),
          ),
          conversionRate,
          recoveryRate,
          pendingRequests,
        },
      });
    }

    // Mode complet : récupération de toutes les données
    const [
      // Statistiques générales
      totalBookings,
      totalCustomers,

      // Statistiques de la période actuelle
      currentPeriodBookings,
      currentPeriodRevenue,

      // Statistiques de la période de comparaison
      comparePeriodBookings,
      comparePeriodRevenue,

      // Répartition par type
      bookingsByType,

      // Activité récente
      recentActivity,

      // Données pour calcul des taux
      totalQuoteRequestsComplete,
      paidBookingsComplete,
      // Demandes en attente (mode complet)
      pendingRequestsComplete,
    ] = await Promise.all([
      // Totaux généraux
      prisma.booking.count(),
      prisma.customer.count(),

      // Période actuelle
      prisma.booking.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.booking.aggregate({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { totalAmount: true },
      }),

      // Période de comparaison
      prisma.booking.count({
        where: {
          createdAt: {
            gte: compareStartDate,
            lte: compareEndDate,
          },
        },
      }),
      prisma.booking.aggregate({
        where: {
          createdAt: {
            gte: compareStartDate,
            lte: compareEndDate,
          },
        },
        _sum: { totalAmount: true },
      }),

      // Répartition par type de service
      prisma.booking.groupBy({
        by: ["type"],
        _count: { id: true },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
      }),

      // Activité récente (dernières réservations)
      prisma.booking.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          Customer: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),

      // Données pour calcul des taux (mode complet)
      prisma.quoteRequest.count(),
      prisma.booking.count({
        where: {
          status: {
            in: ["PAYMENT_COMPLETED", "COMPLETED"],
          },
        },
      }),
      // Demandes en attente (QuoteRequests temporaires - mode complet)
      prisma.quoteRequest.count({
        where: {
          status: "TEMPORARY",
        },
      }),
    ]);

    // Calcul des pourcentages de variation
    const bookingsGrowth =
      comparePeriodBookings > 0
        ? (
            ((currentPeriodBookings - comparePeriodBookings) /
              comparePeriodBookings) *
            100
          ).toFixed(1)
        : currentPeriodBookings > 0
          ? "100.0"
          : "0.0";

    const revenueGrowth =
      (comparePeriodRevenue._sum.totalAmount || 0) > 0
        ? (
            (((currentPeriodRevenue._sum.totalAmount || 0) -
              (comparePeriodRevenue._sum.totalAmount || 0)) /
              (comparePeriodRevenue._sum.totalAmount || 0)) *
            100
          ).toFixed(1)
        : (currentPeriodRevenue._sum.totalAmount || 0) > 0
          ? "100.0"
          : "0.0";

    // Calcul des vrais taux pour le mode complet
    const conversionRateComplete =
      totalQuoteRequestsComplete > 0
        ? parseFloat(
            ((paidBookingsComplete / totalQuoteRequestsComplete) * 100).toFixed(
              1,
            ),
          )
        : 0;

    const recoveryRateComplete =
      totalBookings > 0
        ? parseFloat(((paidBookingsComplete / totalBookings) * 100).toFixed(1))
        : 0;

    // Calcul des tendances par jour
    const dailyTrends = [];
    for (let i = 0; i < periodDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayBookings = await prisma.booking.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      const dayRevenue = await prisma.booking.aggregate({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        _sum: { totalAmount: true },
      });

      dailyTrends.push({
        date: date.toISOString().split("T")[0],
        bookings: dayBookings,
        revenue: parseFloat((dayRevenue._sum.totalAmount || 0).toFixed(2)),
      });
    }

    // Compilation des résultats
    const stats = {
      overview: {
        totalBookings,
        totalCustomers,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days: periodDays,
        },
      },

      currentPeriod: {
        bookings: currentPeriodBookings,
        revenue: parseFloat(
          (currentPeriodRevenue._sum.totalAmount || 0).toFixed(2),
        ),
        avgOrderValue:
          currentPeriodBookings > 0
            ? parseFloat(
                (
                  (currentPeriodRevenue._sum.totalAmount || 0) /
                  currentPeriodBookings
                ).toFixed(2),
              )
            : 0.0,
      },

      comparison: {
        period: compareWith,
        bookings: {
          current: currentPeriodBookings,
          previous: comparePeriodBookings,
          growth: bookingsGrowth + "%",
          isPositive: parseFloat(bookingsGrowth) >= 0,
        },
        revenue: {
          current: parseFloat(
            (currentPeriodRevenue._sum.totalAmount || 0).toFixed(2),
          ),
          previous: parseFloat(
            (comparePeriodRevenue._sum.totalAmount || 0).toFixed(2),
          ),
          growth: revenueGrowth + "%",
          isPositive: parseFloat(revenueGrowth) >= 0,
        },
      },

      breakdown: {
        byServiceType: bookingsByType.map((type) => ({
          serviceType: type.type,
          count: type._count.id,
          totalRevenue: parseFloat((type._sum.totalAmount || 0).toFixed(2)),
          avgAmount: parseFloat((type._avg.totalAmount || 0).toFixed(2)),
        })),
      },

      recentActivity: recentActivity.map((booking) => ({
        id: booking.id,
        type: booking.type,
        totalAmount: booking.totalAmount,
        status: booking.status,
        createdAt: booking.createdAt,
        customer: booking.Customer,
      })),

      trends: {
        daily: dailyTrends,
      },
    };

    return Response.json({
      success: true,
      data: {
        totalCustomers,
        totalBookings,
        monthlyRevenue: stats.currentPeriod.revenue,
        conversionRate: conversionRateComplete,
        recoveryRate: recoveryRateComplete,
        pendingRequests: pendingRequestsComplete,
        detailed: stats,
      },
    });
  } catch (error) {
    console.error("Erreur API /api/admin/stats:", error);
    return Response.json(
      {
        success: false,
        error: "Erreur lors de la récupération des statistiques",
      },
      { status: 500 },
    );
  }
}
