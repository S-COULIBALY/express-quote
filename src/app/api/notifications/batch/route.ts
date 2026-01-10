/**
 * 📦 API BATCH NOTIFICATIONS - Envoi groupé de notifications
 * Route dédiée pour le traitement par lots de notifications
 * Délègue au NotificationController pour bénéficier de BullMQ et résilience
 */

import { NextRequest } from 'next/server';
import { NotificationController } from '@/notifications/interfaces/http/NotificationController';

const controller = new NotificationController();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    body.action = 'batch';

    // Créer une nouvelle requête avec l'action ajoutée
    const newRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    return await controller.handlePost(newRequest);
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Erreur lors du traitement du batch de notifications',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

