import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Contrôleur de base pour les API
 * Version simplifiée pour les contrôleurs DDD
 */
export abstract class BaseApiController {
  constructor() {
    // Base constructor
  }


  /**
   * Surcharge pour les handlers sans request (avec params uniquement)
   */
  protected async handleRequest(handler: () => Promise<any>): Promise<NextResponse>;
  protected async handleRequest(request: NextRequest, handler: (data: any) => Promise<any>): Promise<NextResponse>;
  protected async handleRequest(
    requestOrHandler: NextRequest | (() => Promise<any>),
    handler?: (data: any) => Promise<any>
  ): Promise<NextResponse> {
    try {
      let result: any;

      if (typeof requestOrHandler === 'function') {
        // Cas 1: handleRequest(handler)
        result = await requestOrHandler();
      } else {
        // Cas 2: handleRequest(request, handler)
        const request = requestOrHandler;
        if (!handler) throw new Error('Handler manquant');

        // Parser le body de la requête si c'est POST/PUT
        let data: any = {};
        if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
          const contentType = request.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            data = await request.json();
          }
        }

        // Ajouter les query parameters
        const url = request.nextUrl;
        const queryParams: Record<string, string> = {};
        url.searchParams.forEach((value, key) => {
          queryParams[key] = value;
        });

        if (Object.keys(queryParams).length > 0) {
          data = { ...data, ...queryParams };
        }

        result = await handler(data);
      }

      // Format DDD standardisé pour compatibilité frontend admin
      return this.successResponse(result);
    } catch (error) {
      return this.errorResponse(error, 'Erreur lors du traitement de la requête');
    }
  }

  /**
   * Réponse de succès standardisée DDD
   */
  protected successResponse(data: any, message?: string, status: number = 200): NextResponse {
    const response = {
      success: true,
      data,
      ...(message && { message }),
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Réponse d'erreur standardisée DDD
   */
  protected errorResponse(error: any, defaultMessage: string = 'Erreur serveur', status: number = 500): NextResponse {
    const errorMessage = error instanceof Error ? error.message : defaultMessage;
    logger.error(`${defaultMessage}: ${errorMessage}`);

    const response = {
      success: false,
      error: errorMessage,
      message: defaultMessage,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Réponse 404 standardisée
   */
  protected notFoundResponse(message: string = 'Ressource non trouvée'): NextResponse {
    return this.errorResponse(new Error(message), message, 404);
  }

  /**
   * Réponse 400 standardisée
   */
  protected badRequestResponse(message: string = 'Requête invalide'): NextResponse {
    return this.errorResponse(new Error(message), message, 400);
  }
} 