/**
 * 🔍 API EXTERNAL ID LOOKUP - Route dédiée
 * Route pour récupérer une notification par son ID externe (provider)
 */

import { NextRequest } from 'next/server';
import { NotificationController } from '../../../../../notifications/interfaces/http/NotificationController';

// Instance singleton du contrôleur
const controller = new NotificationController();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Force le paramètre externalId et utilise le nouveau contrôleur
  const url = new URL(request.url);
  url.searchParams.set('externalId', params.id);
  
  const newRequest = new NextRequest(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  
  return controller.handleGet(newRequest);
}