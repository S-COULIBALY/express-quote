/**
 * ❌ API CANCEL NOTIFICATION - Route dédiée
 * Route pour annuler une notification planifiée
 */

import { NextRequest } from 'next/server';
import { NotificationController } from '../../../../notifications/interfaces/http/NotificationController';

// Instance singleton du contrôleur
const controller = new NotificationController();

export async function POST(request: NextRequest) {
  // Force l'action cancel dans le body et utilise le nouveau contrôleur
  const body = await request.json();
  const bodyWithAction = { ...body, action: 'cancel' };
  
  const newRequest = new NextRequest(request.url, {
    method: request.method,
    headers: request.headers,
    body: JSON.stringify(bodyWithAction)
  });
  
  return controller.handlePost(newRequest);
}