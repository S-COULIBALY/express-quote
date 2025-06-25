import { NextRequest, NextResponse } from 'next/server';
import { ConsentService } from '../../../application/services/ConsentService';
import { ConsentType } from '../../../domain/enums/ConsentType';
import { CreateConsentDTO } from '../../../application/dtos/CreateConsentDTO';

/**
 * Contrôleur pour gérer les opérations de consentement via l'API.
 */
export class ConsentController {
  constructor(private consentService: ConsentService) {}

  /**
   * Enregistre un nouveau consentement.
   * @param req Requête entrante
   * @returns Réponse HTTP avec le consentement enregistré
   */
  async recordConsent(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';
      
      const dto: CreateConsentDTO = {
        ...body,
        ipAddress,
        userAgent
      };

      const consent = await this.consentService.recordConsent(dto);
      
      return NextResponse.json({ success: true, data: consent.toJSON() }, { status: 201 });
    } catch (error) {
      console.error('Error recording consent:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to record consent' },
        { status: 500 }
      );
    }
  }

  /**
   * Vérifie si un utilisateur a donné un consentement valide.
   * @param req Requête entrante
   * @returns Réponse HTTP avec le statut de la vérification
   */
  async verifyConsent(req: NextRequest): Promise<NextResponse> {
    try {
      const { userIdentifier, type } = await req.json();
      
      const isValid = await this.consentService.verifyConsent(
        userIdentifier,
        type as ConsentType
      );
      
      return NextResponse.json({ success: true, isValid });
    } catch (error) {
      console.error('Error verifying consent:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to verify consent' },
        { status: 500 }
      );
    }
  }

  /**
   * Récupère l'historique des consentements pour un utilisateur.
   * @param req Requête entrante
   * @returns Réponse HTTP avec l'historique des consentements
   */
  async getConsentHistory(req: NextRequest): Promise<NextResponse> {
    try {
      const { userIdentifier, type } = await req.json();
      
      const history = await this.consentService.getConsentHistory(
        userIdentifier,
        type as ConsentType
      );
      
      return NextResponse.json({
        success: true,
        data: history.map(consent => consent.toJSON())
      });
    } catch (error) {
      console.error('Error fetching consent history:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch consent history' },
        { status: 500 }
      );
    }
  }
} 