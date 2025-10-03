/**
 * ⏰ API RAPPEL DE SERVICE - Nouveau système simple
 * Route métier pour les rappels de service
 */

import { NextRequest } from 'next/server';
// import { POST as mainPost } from '../../route'; // Temporairement désactivé

export async function POST(request: NextRequest) {
  // Parse le body et ajoute l'action
  const body = await request.json();
  body.action = 'service-reminder';

  // TODO: Implémenter la logique de rappel de service
  return new Response(JSON.stringify({
    success: true,
    message: 'Service reminder received',
    data: body
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}