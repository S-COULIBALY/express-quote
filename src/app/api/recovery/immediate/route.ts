import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * POST /api/recovery/immediate
 * Déclenche une récupération immédiate pour un abandon
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId, stage, data, metadata } = await request.json();
    
    // Validation des données
    if (!sessionId || !stage) {
      return NextResponse.json(
        { error: 'Session ID et stage requis' },
        { status: 400 }
      );
    }

    logger.info(`🚨 Récupération immédiate déclenchée: ${stage}`, {
      sessionId,
      stage,
      metadata
    });

    // Récupération selon le type d'abandon
    switch (stage) {
      case 'form_partial':
        await handleFormPartialRecovery(sessionId, data);
        break;
      
      case 'quote_with_contact':
        await handleQuoteContactRecovery(sessionId, data);
        break;
      
      case 'payment_abandoned':
        await handlePaymentAbandonRecovery(sessionId, data);
        break;
      
      default:
        logger.warn(`Type d'abandon non géré pour récupération immédiate: ${stage}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Erreur lors de la récupération immédiate:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * Récupération immédiate pour abandon de formulaire partiel
 */
async function handleFormPartialRecovery(sessionId: string, data: any): Promise<void> {
  try {
    const { formId, formData, completion } = data;

    // Enregistrer l'événement
    logger.info(`📝 Récupération formulaire partiel: ${formId} (${completion}%)`);

    // Déclencher les actions immédiates
    await Promise.all([
      // 1. Sauvegarder le brouillon
      saveFormDraft(formId, formData),
      
      // 2. Programmer une notification push si disponible
      scheduleNotification(sessionId, {
        type: 'form_recovery',
        title: 'Votre demande est en cours...',
        message: `Continuez où vous en étiez (${completion}% terminé)`,
        action: 'continue_form',
        formId
      }),
      
      // 3. Marquer pour suivi
      markForFollowUp(sessionId, 'form_partial', { formId, completion })
    ]);

  } catch (error) {
    logger.error('Erreur lors de la récupération de formulaire partiel:', error);
  }
}

/**
 * Récupération immédiate pour abandon de devis avec contact
 */
async function handleQuoteContactRecovery(sessionId: string, data: any): Promise<void> {
  try {
    const { quoteId, quoteData } = data;
    const { customerInfo, totalPrice } = quoteData;

    logger.info(`💰 Récupération devis avec contact: ${quoteId} (${totalPrice}€)`);

    // Actions immédiates
    await Promise.all([
      // 1. Notification push urgente
      scheduleNotification(sessionId, {
        type: 'quote_recovery',
        title: 'Votre devis expire bientôt !',
        message: `Finalisez votre demande de ${totalPrice}€ maintenant`,
        action: 'continue_quote',
        quoteId
      }),
      
      // 2. Envoyer email de récupération immédiate
      sendImmediateRecoveryEmail(customerInfo.email, {
        type: 'quote_recovery',
        quoteId,
        totalPrice,
        customerName: customerInfo.firstName
      }),
      
      // 3. Programmer appel si numéro disponible
      schedulePhoneCall(customerInfo.phone, {
        priority: 'high',
        reason: 'quote_recovery',
        quoteId,
        amount: totalPrice
      })
    ]);

  } catch (error) {
    logger.error('Erreur lors de la récupération de devis avec contact:', error);
  }
}

/**
 * Récupération immédiate pour abandon de paiement
 */
async function handlePaymentAbandonRecovery(sessionId: string, data: any): Promise<void> {
  try {
    const { bookingId, paymentData } = data;
    const { amount, customerInfo } = paymentData;

    logger.info(`💳 Récupération paiement abandonné: ${bookingId} (${amount}€)`);

    // Actions immédiates urgentes
    await Promise.all([
      // 1. Notification push critique
      scheduleNotification(sessionId, {
        type: 'payment_recovery',
        title: 'Paiement interrompu !',
        message: `Finalisez votre paiement de ${amount}€ maintenant`,
        action: 'continue_payment',
        bookingId,
        urgent: true
      }),
      
      // 2. Email de récupération urgente
      sendImmediateRecoveryEmail(customerInfo.email, {
        type: 'payment_recovery',
        bookingId,
        amount,
        customerName: customerInfo.firstName,
        urgency: 'high'
      }),
      
      // 3. SMS de récupération
      sendRecoverySMS(customerInfo.phone, {
        type: 'payment_recovery',
        bookingId,
        amount
      }),
      
      // 4. Programmer appel immédiat
      schedulePhoneCall(customerInfo.phone, {
        priority: 'urgent',
        reason: 'payment_recovery',
        bookingId,
        amount,
        delay: 60000 // 1 minute
      })
    ]);

  } catch (error) {
    logger.error('Erreur lors de la récupération de paiement abandonné:', error);
  }
}

/**
 * Sauvegarder un brouillon de formulaire
 */
async function saveFormDraft(formId: string, formData: any): Promise<void> {
  try {
    // Sauvegarder via l'API de progrès
    await fetch('/api/analytics/form-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formId,
        fields: formData,
        completion: calculateFormCompletion(formData),
        lastUpdated: new Date(),
        timeSpent: Date.now() - (formData.startTime || Date.now())
      })
    });

  } catch (error) {
    logger.error('Erreur lors de la sauvegarde du brouillon:', error);
  }
}

/**
 * Programmer une notification push
 */
async function scheduleNotification(sessionId: string, notification: any): Promise<void> {
  try {
    logger.info(`🔔 Notification programmée: ${notification.type} pour ${sessionId}`);
    
    // En production, utiliser un service de notifications push
    // await pushNotificationService.send(sessionId, notification);

  } catch (error) {
    logger.error('Erreur lors de la programmation de notification:', error);
  }
}

/**
 * Envoyer un email de récupération immédiate
 */
async function sendImmediateRecoveryEmail(email: string, data: any): Promise<void> {
  try {
    if (!email) return;

    logger.info(`📧 Email de récupération immédiate envoyé à ${email}`);
    
    // En production, utiliser un service d'email
    // await emailService.sendRecoveryEmail(email, data);

  } catch (error) {
    logger.error('Erreur lors de l\'envoi d\'email de récupération:', error);
  }
}

/**
 * Envoyer un SMS de récupération
 */
async function sendRecoverySMS(phone: string, data: any): Promise<void> {
  try {
    if (!phone) return;

    logger.info(`📱 SMS de récupération envoyé à ${phone}`);
    
    // En production, utiliser un service SMS
    // await smsService.sendRecoveryMessage(phone, data);

  } catch (error) {
    logger.error('Erreur lors de l\'envoi de SMS de récupération:', error);
  }
}

/**
 * Programmer un appel téléphonique
 */
async function schedulePhoneCall(phone: string, options: any): Promise<void> {
  try {
    if (!phone) return;

    const { priority, reason, delay = 0 } = options;

    logger.info(`📞 Appel programmé pour ${phone} (${priority}) dans ${delay}ms`);
    
    // En production, utiliser un service d'appels automatiques
    // await callService.scheduleCall(phone, options);

  } catch (error) {
    logger.error('Erreur lors de la programmation d\'appel:', error);
  }
}

/**
 * Marquer pour suivi
 */
async function markForFollowUp(sessionId: string, type: string, data: any): Promise<void> {
  try {
    logger.info(`📋 Marqué pour suivi: ${type} - ${sessionId}`);
    
    // En production, enregistrer dans un système de suivi
    // await followUpService.mark(sessionId, type, data);

  } catch (error) {
    logger.error('Erreur lors du marquage pour suivi:', error);
  }
}

/**
 * Calculer le pourcentage de completion d'un formulaire
 */
function calculateFormCompletion(formData: any): number {
  const fields = Object.entries(formData);
  const filledFields = fields.filter(([key, value]) => {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });
  
  return Math.round((filledFields.length / fields.length) * 100);
} 