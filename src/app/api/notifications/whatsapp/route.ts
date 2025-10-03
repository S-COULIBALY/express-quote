/**
 * 📲 API WHATSAPP - Nouveau système simple
 * Route dédiée aux envois WhatsApp
 */

import { NextRequest } from 'next/server';
import { NotificationController } from '../../../../notifications/interfaces/http/NotificationController';

// Instance singleton du contrôleur
const controller = new NotificationController();

export async function POST(request: NextRequest) {
  // Parse le body et ajoute l'action
  const body = await request.json();
  body.action = 'whatsapp';
  
  // Créer une nouvelle requête avec le body modifié
  const newRequest = new NextRequest(request.url, {
    method: request.method,
    headers: {
      ...Object.fromEntries(request.headers.entries()),
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  return controller.handlePost(newRequest);
}