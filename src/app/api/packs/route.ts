import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, BookingType } from '@prisma/client';

const prisma = new PrismaClient();

// Interface pour les propriétés personnalisées des packs
interface PackData {
  id: string;
  type: BookingType;
  status: string;
  packId?: string;
  packName?: string;
  description?: string;
  totalAmount: number;
  items?: any;
  createdAt: Date;
  [key: string]: any; // Pour d'autres propriétés possibles
}

// GET /api/packs - Récupérer tous les packs actifs
export async function GET(request: NextRequest) {
  try {
    // Récupérer les packs à partir des réservations de type PACK
    const rawPacks = await prisma.booking.findMany({
      where: { 
        type: BookingType.PACK
      },
      orderBy: { totalAmount: 'asc' },
    });
    
    // Utiliser une assertion de type pour gérer les propriétés personnalisées
    const packs = rawPacks as unknown as PackData[];

    // Filtrer pour obtenir des packs uniques par packId ou packName
    const uniquePacks: PackData[] = [];
    const packMap = new Map<string, boolean>();
    
    for (const pack of packs) {
      const packId = pack.packId || '';
      if (!packId || packMap.has(packId)) continue;
      
      packMap.set(packId, true);
      uniquePacks.push(pack);
    }

    // Transformer les données pour être compatibles avec l'ancienne structure
    const formattedPacks = uniquePacks.map(pack => {
      // Récupérer les metadonnées stockées dans items si disponible
      const itemsData = pack.items ? 
        (typeof pack.items === 'string' ? JSON.parse(pack.items) : pack.items) : 
        {};

      return {
        id: pack.packId || pack.id,
        name: pack.packName || 'Pack sans nom',
        description: pack.description || '',
        price: pack.totalAmount,
        truckSize: itemsData.truckSize || null,
        moversCount: itemsData.moversCount || null,
        driverIncluded: itemsData.driverIncluded || false,
        active: true,
        createdAt: pack.createdAt
      };
    });

    return NextResponse.json(formattedPacks);
  } catch (error) {
    console.error('Error fetching packs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packs' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/packs - Créer un nouveau pack
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, description, price, truckSize, moversCount, driverIncluded } = data;

    // Validation des données
    if (!name || !description || !price) {
      return NextResponse.json(
        { error: 'Name, description and price are required' },
        { status: 400 }
      );
    }

    // Générer un ID unique pour le pack
    const packId = `pack_${Date.now()}`;

    // Créer une réservation de type PACK qui servira de modèle
    const packData = {
      type: BookingType.PACK,
      status: 'DRAFT',
      totalAmount: parseFloat(price),
      items: JSON.stringify({
        truckSize: truckSize ? parseInt(truckSize) : null,
        moversCount: moversCount ? parseInt(moversCount) : null,
        driverIncluded: Boolean(driverIncluded)
      })
    };

    // Ajouter les données personnalisées via une assertion de type
    const fullPackData = {
      ...packData,
      packId: packId,
      packName: name,
      description: description,
    };

    const pack = await prisma.booking.create({
      data: fullPackData as any,
    });

    // Retourner au format attendu par le frontend
    const formattedPack = {
      id: packId,
      name: name,
      description: description,
      price: parseFloat(price),
      truckSize: truckSize ? parseInt(truckSize) : null,
      moversCount: moversCount ? parseInt(moversCount) : null,
      driverIncluded: Boolean(driverIncluded),
      active: true,
      createdAt: pack.createdAt
    };

    return NextResponse.json(formattedPack, { status: 201 });
  } catch (error) {
    console.error('Error creating pack:', error);
    return NextResponse.json(
      { error: 'Failed to create pack' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 