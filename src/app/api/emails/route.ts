import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { pdfService, emailService } from '@/config/services';

// Rediriger vers la route de notification consolidée
export async function POST(request: NextRequest) {
  // Logger pour tracer la redirection
  const emailLogger = logger.withContext ? 
    logger.withContext('EmailsAPI') : 
    {
      info: (msg: string, ...args: any[]) => console.info('[EmailsAPI]', msg, ...args),
      warn: (msg: string, ...args: any[]) => console.warn('[EmailsAPI]', msg, ...args),
    };

  // Générer un message de dépréciation
  emailLogger.warn('Route /api/emails dépréciée - utiliser /api/notifications/email à la place');
  
  // Rediriger vers la nouvelle API
  try {
    // Récupérer les données de la requête
    const body = await request.json();
    
    // Adapter le format si nécessaire
    const adaptedBody = {
      ...body,
      type: body.type,
      email: body.recipient || body.email,
      clientName: body.firstName && body.lastName 
        ? `${body.firstName} ${body.lastName}` 
        : body.clientName || 'Client',
      bookingId: body.bookingId,
      quoteId: body.quoteId,
      paymentDetails: body.transactionId ? {
        transactionId: body.transactionId,
        depositAmount: body.depositAmount || 0
      } : undefined,
      cancellationReason: body.reason
    };
    
    emailLogger.info('Redirection de la requête vers /api/notifications/email');
    
    // Faire une requête à la nouvelle API
    const response = await fetch(
      new URL('/api/notifications/email', request.url).toString(), 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adaptedBody)
      }
    );
    
    // Renvoyer la réponse de la nouvelle API
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    emailLogger.warn('Erreur lors de la redirection:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la redirection vers la nouvelle API',
      details: 'Cette route est dépréciée, veuillez utiliser /api/notifications/email à la place',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 