import "reflect-metadata";
import { NextRequest, NextResponse } from 'next/server';
import { ProfessionalType as PrismaProfessionalType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { container } from 'tsyringe';
import { ProfessionalService } from '@/quotation/application/services/ProfessionalService';
import { UpdateProfessionalEmailDTO } from '@/quotation/application/dtos/ProfessionalDTO';
import { ProfessionalType as DomainProfessionalType } from '@/quotation/domain/entities/Professional';

// Fonction pour convertir le type PrismaType en type du domaine
function mapToDomainProfessionalType(prismaType: PrismaProfessionalType | null): DomainProfessionalType | null {
  if (!prismaType) return null;
  
  // Conversion directe si les valeurs sont identiques dans les deux énums
  // Si les valeurs ne sont pas identiques, ajoutez un mapping spécifique ici
  return prismaType as unknown as DomainProfessionalType;
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Récupérer les paramètres de filtre de l'URL
    const url = new URL(request.url);
    const typeFilter = url.searchParams.get('type') as PrismaProfessionalType | null;
    const verifiedOnly = url.searchParams.get('verified') === 'true';

    // Obtenir le service depuis le conteneur d'injection de dépendances
    const professionalService = container.resolve(ProfessionalService);
    
    let professionals;
    
    if (typeFilter) {
      // Convertir le type Prisma en type du domaine
      const domainTypeFilter = mapToDomainProfessionalType(typeFilter);
      professionals = await professionalService.getProfessionalsByBusinessType(domainTypeFilter as DomainProfessionalType);
    } else if (verifiedOnly) {
      professionals = await professionalService.getVerifiedProfessionals();
    } else {
      professionals = await professionalService.getAllProfessionals();
    }

    return NextResponse.json(professionals);
  } catch (error: any) {
    console.error('Error fetching professionals:', error);
    return NextResponse.json(
      { error: `Erreur: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Obtenir le service depuis le conteneur d'injection de dépendances
    const professionalService = container.resolve(ProfessionalService);
    
    const body = await request.json();
    
    // Traiter différentes opérations possibles
    if (body.operation === 'updateEmails' && Array.isArray(body.updates)) {
      const updates: UpdateProfessionalEmailDTO[] = body.updates.map((update: any) => ({
        id: update.id,
        email: update.email
      }));
      
      const updatedCount = await professionalService.updateProfessionalEmails(updates);
      
      return NextResponse.json({
        success: true,
        message: `${updatedCount} emails de professionnels mis à jour avec succès`
      });
    } else if (body.operation === 'updateEmail' && body.id && body.email) {
      const update: UpdateProfessionalEmailDTO = {
        id: body.id,
        email: body.email
      };
      
      await professionalService.updateProfessionalEmail(update);
      
      return NextResponse.json({
        success: true,
        message: 'Email du professionnel mis à jour avec succès'
      });
    } else {
      return NextResponse.json(
        { error: 'Opération non reconnue ou paramètres manquants' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error updating professionals:', error);
    return NextResponse.json(
      { error: `Erreur: ${error.message}` },
      { status: 500 }
    );
  }
} 