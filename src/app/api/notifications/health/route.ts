/**
 * 🏥 API HEALTH CHECK - Nouveau système simple
 * Route pour vérifier la santé du système de notifications
 */

import { NextRequest } from 'next/server';
import { NotificationController } from '../../../../notifications/interfaces/http/NotificationController';

// Instance singleton du contrôleur
const controller = new NotificationController();

export async function GET(request: NextRequest) {
  // Force le paramètre health et utilise le nouveau contrôleur
  const url = new URL(request.url);
  url.searchParams.set('health', 'true');
  
  const newRequest = new NextRequest(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  
  return controller.handleGet(newRequest);
}