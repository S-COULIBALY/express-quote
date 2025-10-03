import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * POST /api/recovery/delayed
 * Déclenche une récupération différée pour un abandon
 */
export async function POST(request: NextRequest) {
  try {
    const { eventId, sessionId, stage, data, metadata } = await request.json();
    
    // Validation des données
    if (!sessionId || !stage) {
      return NextResponse.json(
        { error: 'Session ID et stage requis' },
        { status: 400 }
      );
    }

    logger.info(`⏰ Récupération différée déclenchée: ${stage}`, {
      eventId,
      sessionId,
      stage,
      metadata
    });

    // Récupération selon le type d'abandon
    switch (stage) {
      case 'form_incomplete':
        await handleFormIncompleteRecovery(sessionId, data);
        break;
      
      case 'form_partial':
        await handleFormPartialDelayedRecovery(sessionId, data);
        break;
      
      case 'quote_created':
        await handleQuoteCreatedRecovery(sessionId, data);
        break;
      
      case 'quote_viewed':
        await handleQuoteViewedRecovery(sessionId, data);
        break;
      
      case 'booking_created':
        await handleBookingCreatedRecovery(sessionId, data);
        break;
      
      case 'payment_page':
        await handlePaymentPageRecovery(sessionId, data);
        break;
      
      default:
        logger.warn(`Type d'abandon non géré pour récupération différée: ${stage}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Erreur lors de la récupération différée:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * Récupération pour formulaire incomplet (< 50%)
 */
async function handleFormIncompleteRecovery(sessionId: string, data: any): Promise<void> {
  try {
    const { formId, formData, completion } = data;

    logger.info(`📝 Récupération formulaire incomplet: ${formId} (${completion}%)`);

    // Stratégie douce pour formulaire incomplet
    await Promise.all([
      // 1. Email de rappel doux
      sendGentleReminderEmail(formData.email, {
        type: 'form_reminder',
        formId,
        completion,
        incentive: 'consultation_gratuite'
      }),
      
      // 2. Proposer de l'aide
      offerFormAssistance(sessionId, formId, completion)
    ]);

  } catch (error) {
    logger.error('Erreur lors de la récupération de formulaire incomplet:', error);
  }
}

/**
 * Récupération différée pour formulaire partiel (> 50%)
 */
async function handleFormPartialDelayedRecovery(sessionId: string, data: any): Promise<void> {
  try {
    const { formId, formData, completion } = data;

    logger.info(`📝 Récupération différée formulaire partiel: ${formId} (${completion}%)`);

    // Stratégie plus aggressive pour formulaire presque terminé
    await Promise.all([
      // 1. Email avec incentive
      sendIncentiveEmail(formData.email, {
        type: 'form_incentive',
        formId,
        completion,
        incentive: 'reduction_5_percent',
        urgency: 'medium'
      }),
      
      // 2. SMS de rappel
      sendReminderSMS(formData.phone, {
        type: 'form_reminder',
        completion,
        incentive: '5% de réduction'
      })
    ]);

  } catch (error) {
    logger.error('Erreur lors de la récupération différée de formulaire partiel:', error);
  }
}

/**
 * Récupération pour devis créé mais non consulté
 */
async function handleQuoteCreatedRecovery(sessionId: string, data: any): Promise<void> {
  try {
    const { quoteId, quoteData } = data;
    const { totalPrice, customerInfo } = quoteData;

    logger.info(`💰 Récupération devis créé: ${quoteId} (${totalPrice}€)`);

    // Stratégie de rappel de devis
    await Promise.all([
      // 1. Email de rappel de devis
      sendQuoteReminderEmail(customerInfo?.email, {
        type: 'quote_reminder',
        quoteId,
        totalPrice,
        customerName: customerInfo?.firstName,
        expiryHours: 24
      }),
      
      // 2. Notification push
      scheduleNotification(sessionId, {
        type: 'quote_reminder',
        title: 'Votre devis vous attend !',
        message: `Consultez votre devis de ${totalPrice}€`,
        action: 'view_quote',
        quoteId
      })
    ]);

  } catch (error) {
    logger.error('Erreur lors de la récupération de devis créé:', error);
  }
}

/**
 * Récupération pour devis consulté mais non finalisé
 */
async function handleQuoteViewedRecovery(sessionId: string, data: any): Promise<void> {
  try {
    const { quoteId, quoteData } = data;
    const { totalPrice, customerInfo } = quoteData;

    logger.info(`👀 Récupération devis consulté: ${quoteId} (${totalPrice}€)`);

    // Stratégie pour devis consulté
    await Promise.all([
      // 1. Email avec incentive plus fort
      sendIncentiveEmail(customerInfo?.email, {
        type: 'quote_incentive',
        quoteId,
        totalPrice,
        customerName: customerInfo?.firstName,
        incentive: 'reduction_10_percent',
        urgency: 'high'
      }),
      
      // 2. SMS avec offre spéciale
      sendIncentiveSMS(customerInfo?.phone, {
        type: 'quote_incentive',
        amount: totalPrice,
        incentive: '10% de réduction',
        validityHours: 12
      }),
      
      // 3. Programmer appel de suivi
      scheduleFollowUpCall(customerInfo?.phone, {
        reason: 'quote_follow_up',
        quoteId,
        amount: totalPrice,
        delay: 2 * 60 * 60 * 1000 // 2 heures
      })
    ]);

  } catch (error) {
    logger.error('Erreur lors de la récupération de devis consulté:', error);
  }
}

/**
 * Récupération pour réservation créée mais non payée
 */
async function handleBookingCreatedRecovery(sessionId: string, data: any): Promise<void> {
  try {
    const { bookingId, bookingData } = data;
    const { totalAmount, customerInfo } = bookingData;

    logger.info(`🏷️ Récupération réservation créée: ${bookingId} (${totalAmount}€)`);

    // Stratégie urgente pour réservation non payée
    await Promise.all([
      // 1. Email urgent avec deadline
      sendUrgentEmail(customerInfo?.email, {
        type: 'booking_urgent',
        bookingId,
        totalAmount,
        customerName: customerInfo?.firstName,
        deadline: '24 heures'
      }),
      
      // 2. SMS urgent
      sendUrgentSMS(customerInfo?.phone, {
        type: 'booking_urgent',
        amount: totalAmount,
        deadline: '24h'
      }),
      
      // 3. Appel de suivi prioritaire
      scheduleFollowUpCall(customerInfo?.phone, {
        reason: 'booking_payment',
        bookingId,
        amount: totalAmount,
        priority: 'high',
        delay: 30 * 60 * 1000 // 30 minutes
      })
    ]);

  } catch (error) {
    logger.error('Erreur lors de la récupération de réservation créée:', error);
  }
}

/**
 * Récupération pour abandon sur page de paiement
 */
async function handlePaymentPageRecovery(sessionId: string, data: any): Promise<void> {
  try {
    const { bookingId, paymentData } = data;
    const { amount, customerInfo } = paymentData;

    logger.info(`💳 Récupération page paiement: ${bookingId} (${amount}€)`);

    // Stratégie très urgente pour page de paiement
    await Promise.all([
      // 1. Email d'urgence avec aide
      sendPaymentHelpEmail(customerInfo?.email, {
        type: 'payment_help',
        bookingId,
        amount,
        customerName: customerInfo?.firstName,
        supportPhone: process.env.SUPPORT_PHONE
      }),
      
      // 2. SMS d'assistance
      sendPaymentHelpSMS(customerInfo?.phone, {
        type: 'payment_help',
        amount,
        supportPhone: process.env.SUPPORT_PHONE
      }),
      
      // 3. Appel immédiat d'assistance
      scheduleFollowUpCall(customerInfo?.phone, {
        reason: 'payment_assistance',
        bookingId,
        amount,
        priority: 'urgent',
        delay: 5 * 60 * 1000 // 5 minutes
      })
    ]);

  } catch (error) {
    logger.error('Erreur lors de la récupération de page paiement:', error);
  }
}

/**
 * Envoyer un email de rappel doux
 */
async function sendGentleReminderEmail(email: string, data: any): Promise<void> {
  try {
    if (!email) return;

    logger.info(`📧 Email de rappel doux envoyé à ${email}`);
    
    // En production, utiliser un service d'email avec template
    // await emailService.sendGentleReminder(email, data);

  } catch (error) {
    logger.error('Erreur lors de l\'envoi d\'email de rappel doux:', error);
  }
}

/**
 * Envoyer un email avec incentive
 */
async function sendIncentiveEmail(email: string, data: any): Promise<void> {
  try {
    if (!email) return;

    logger.info(`💌 Email avec incentive envoyé à ${email} (${data.incentive})`);
    
    // En production, utiliser un service d'email avec template
    // await emailService.sendIncentiveEmail(email, data);

  } catch (error) {
    logger.error('Erreur lors de l\'envoi d\'email avec incentive:', error);
  }
}

/**
 * Envoyer un SMS de rappel
 */
async function sendReminderSMS(phone: string, data: any): Promise<void> {
  try {
    if (!phone) return;

    logger.info(`📱 SMS de rappel envoyé à ${phone}`);
    
    // En production, utiliser un service SMS
    // await smsService.sendReminder(phone, data);

  } catch (error) {
    logger.error('Erreur lors de l\'envoi de SMS de rappel:', error);
  }
}

/**
 * Envoyer un SMS avec incentive
 */
async function sendIncentiveSMS(phone: string, data: any): Promise<void> {
  try {
    if (!phone) return;

    logger.info(`💰 SMS avec incentive envoyé à ${phone} (${data.incentive})`);
    
    // En production, utiliser un service SMS
    // await smsService.sendIncentive(phone, data);

  } catch (error) {
    logger.error('Erreur lors de l\'envoi de SMS avec incentive:', error);
  }
}

/**
 * Envoyer un email urgent
 */
async function sendUrgentEmail(email: string, data: any): Promise<void> {
  try {
    if (!email) return;

    logger.info(`🚨 Email urgent envoyé à ${email}`);
    
    // En production, utiliser un service d'email avec template urgent
    // await emailService.sendUrgentEmail(email, data);

  } catch (error) {
    logger.error('Erreur lors de l\'envoi d\'email urgent:', error);
  }
}

/**
 * Envoyer un SMS urgent
 */
async function sendUrgentSMS(phone: string, data: any): Promise<void> {
  try {
    if (!phone) return;

    logger.info(`🚨 SMS urgent envoyé à ${phone}`);
    
    // En production, utiliser un service SMS
    // await smsService.sendUrgent(phone, data);

  } catch (error) {
    logger.error('Erreur lors de l\'envoi de SMS urgent:', error);
  }
}

/**
 * Envoyer un email d'aide au paiement
 */
async function sendPaymentHelpEmail(email: string, data: any): Promise<void> {
  try {
    if (!email) return;

    logger.info(`🆘 Email d'aide paiement envoyé à ${email}`);
    
    // En production, utiliser un service d'email avec template d'aide
    // await emailService.sendPaymentHelp(email, data);

  } catch (error) {
    logger.error('Erreur lors de l\'envoi d\'email d\'aide paiement:', error);
  }
}

/**
 * Envoyer un SMS d'aide au paiement
 */
async function sendPaymentHelpSMS(phone: string, data: any): Promise<void> {
  try {
    if (!phone) return;

    logger.info(`🆘 SMS d'aide paiement envoyé à ${phone}`);
    
    // En production, utiliser un service SMS
    // await smsService.sendPaymentHelp(phone, data);

  } catch (error) {
    logger.error('Erreur lors de l\'envoi de SMS d\'aide paiement:', error);
  }
}

/**
 * Envoyer un email de rappel de devis
 */
async function sendQuoteReminderEmail(email: string, data: any): Promise<void> {
  try {
    if (!email) return;

    logger.info(`📋 Email de rappel de devis envoyé à ${email}`);
    
    // En production, utiliser un service d'email avec template
    // await emailService.sendQuoteReminder(email, data);

  } catch (error) {
    logger.error('Erreur lors de l\'envoi d\'email de rappel de devis:', error);
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
 * Programmer un appel de suivi
 */
async function scheduleFollowUpCall(phone: string, options: any): Promise<void> {
  try {
    if (!phone) return;

    const { reason, priority, delay = 0 } = options;

    logger.info(`📞 Appel de suivi programmé pour ${phone} (${priority}) dans ${delay}ms`);
    
    // En production, utiliser un service d'appels automatiques
    // await callService.scheduleFollowUp(phone, options);

  } catch (error) {
    logger.error('Erreur lors de la programmation d\'appel de suivi:', error);
  }
}

/**
 * Proposer de l'aide pour un formulaire
 */
async function offerFormAssistance(sessionId: string, formId: string, completion: number): Promise<void> {
  try {
    logger.info(`🆘 Assistance formulaire proposée: ${formId} (${completion}%)`);
    
    // En production, déclencher un système d'aide
    // await assistanceService.offer(sessionId, formId, completion);

  } catch (error) {
    logger.error('Erreur lors de l\'offre d\'assistance:', error);
  }
} 