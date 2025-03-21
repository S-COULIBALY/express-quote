import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, BookingType } from '@prisma/client';

const prisma = new PrismaClient();

// Interface pour les propriétés personnalisées des services
interface ServiceData {
  id: string;
  type: BookingType;
  status: string;
  serviceId?: string;
  serviceName?: string;
  description?: string;
  totalAmount: number;
  items?: any;
  createdAt: Date;
  location?: string;
  scheduledTime?: string;
  [key: string]: any; // Pour d'autres propriétés possibles
}

// GET /api/services - Récupérer tous les services actifs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    // Construire la requête pour le nouveau modèle
    const where: any = {
      type: BookingType.SERVICE
    };
    
    // Ajouter le filtre par type de service s'il est spécifié
    if (type) {
      where.description = { contains: type };
    }

    // Récupérer les services depuis le modèle de booking unifié
    const rawServices = await prisma.booking.findMany({
      where,
      orderBy: { totalAmount: 'asc' },
    });
    
    // Utiliser une assertion de type pour gérer les propriétés personnalisées
    const services = rawServices as unknown as ServiceData[];

    // Filtrer pour obtenir des services uniques
    const uniqueServices: ServiceData[] = [];
    const serviceMap = new Map<string, boolean>();
    
    for (const service of services) {
      const serviceId = service.serviceId || service.id;
      if (serviceMap.has(serviceId)) continue;
      
      serviceMap.set(serviceId, true);
      uniqueServices.push(service);
    }

    // Transformer les données pour être compatibles avec l'ancienne structure
    const formattedServices = uniqueServices.map(service => {
      // Extraire les métadonnées des items
      const itemsData = service.items ? 
        (typeof service.items === 'string' ? JSON.parse(service.items) : service.items) : 
        {};

      return {
        id: service.serviceId || service.id,
        name: service.serviceName || 'Service sans nom',
        description: service.description || '',
        price: service.totalAmount,
        serviceType: itemsData.serviceType || 'OTHER',
        durationDays: itemsData.durationDays || null,
        peopleCount: itemsData.peopleCount || null,
        active: true,
        createdAt: service.createdAt
      };
    });

    return NextResponse.json(formattedServices);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/services - Créer un nouveau service
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, description, price, serviceType, durationDays, peopleCount } = data;

    // Validation des données
    if (!name || !description || !price || !serviceType) {
      return NextResponse.json(
        { error: 'Name, description, price and serviceType are required' },
        { status: 400 }
      );
    }

    // Générer un ID unique pour le service
    const serviceId = `service_${Date.now()}`;

    // Créer une réservation de type SERVICE qui servira de modèle
    const serviceData = {
      type: BookingType.SERVICE,
      status: 'DRAFT',
      totalAmount: parseFloat(price),
      items: JSON.stringify({
        serviceType,
        durationDays: durationDays ? parseInt(durationDays) : null,
        peopleCount: peopleCount ? parseInt(peopleCount) : null
      })
    };
    
    // Ajouter les données personnalisées via une assertion de type
    const fullServiceData = {
      ...serviceData,
      serviceId: serviceId,
      serviceName: name,
      description: `${description} [Type: ${serviceType}]`,
    };

    const service = await prisma.booking.create({
      data: fullServiceData as any,
    });

    // Retourner au format attendu par le frontend
    const formattedService = {
      id: serviceId,
      name: name,
      description: description,
      price: parseFloat(price),
      serviceType,
      durationDays: durationDays ? parseInt(durationDays) : null,
      peopleCount: peopleCount ? parseInt(peopleCount) : null,
      active: true,
      createdAt: service.createdAt
    };

    return NextResponse.json(formattedService, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 