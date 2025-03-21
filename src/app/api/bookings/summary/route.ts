import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type BookingStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';

type StatusCount = {
  [key in BookingStatus]: number;
};

interface ServiceCount {
  [key: string]: number;
}

// GET /api/bookings/summary - Obtenir des statistiques sur les réservations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // 'day', 'week', 'month', 'year'
    const formatType = searchParams.get('format') || 'json'; // 'json' ou 'chart'

    // Déterminer la date de début basée sur la période
    const startDate = new Date();
    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - startDate.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'year') {
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
    }

    // Récupérer toutes les réservations pour la période
    const bookings = await prisma.booking.findMany({
      where: {
        scheduledDate: {
          gte: startDate,
        },
      },
      include: {
        quote: true,
        pack: true,
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    // Compter les réservations par statut
    const bookingsByStatus: StatusCount = {
      SCHEDULED: 0,
      CONFIRMED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELED: 0,
    };

    bookings.forEach(booking => {
      const status = booking.status as BookingStatus;
      if (Object.keys(bookingsByStatus).includes(status)) {
        bookingsByStatus[status]++;
      }
    });

    // Calculer le revenu total
    let totalRevenue = 0;
    bookings.forEach(booking => {
      // Ajouter le prix du devis si disponible
      if (booking.quote) {
        totalRevenue += booking.quote.finalPrice;
      }
      
      // Ajouter le prix du pack si disponible
      if (booking.pack) {
        totalRevenue += booking.pack.price;
      }
      
      // Ajouter le prix des services
      booking.services.forEach(bookingService => {
        totalRevenue += bookingService.service.price;
      });
    });

    // Obtenir la répartition des types de réservation
    const bookingTypes = {
      quote: bookings.filter(b => b.quoteId).length,
      pack: bookings.filter(b => b.packId).length,
      serviceOnly: bookings.filter(b => !b.quoteId && !b.packId).length,
    };

    // Les services les plus populaires
    const serviceCount: ServiceCount = {};
    bookings.forEach(booking => {
      booking.services.forEach(bs => {
        const serviceName = bs.service.name;
        serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1;
      });
    });

    const topServices = Object.entries(serviceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Construire le résumé
    const summary = {
      period,
      totalBookings: bookings.length,
      bookingsByStatus,
      totalRevenue,
      bookingTypes,
      topServices,
    };

    // Si le format est pour un graphique, restructurer les données
    if (formatType === 'chart') {
      const chartData = {
        statusChart: {
          labels: Object.keys(bookingsByStatus),
          datasets: [{
            label: 'Réservations par statut',
            data: Object.values(bookingsByStatus),
          }],
        },
        typeChart: {
          labels: ['Devis', 'Pack', 'Service uniquement'],
          datasets: [{
            label: 'Types de réservation',
            data: [bookingTypes.quote, bookingTypes.pack, bookingTypes.serviceOnly],
          }],
        },
        servicesChart: {
          labels: topServices.map(s => s.name),
          datasets: [{
            label: 'Services les plus populaires',
            data: topServices.map(s => s.count),
          }],
        },
      };
      
      return NextResponse.json(chartData);
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error generating booking summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate booking summary' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 