/**
 * 💰 API CONFIRMATION DE DEVIS - Nouveau système simple
 * Route métier pour les confirmations de devis
 */

import { NextRequest } from 'next/server';
// import { POST as mainPost } from '../../route'; // Temporairement désactivé

export async function POST(request: NextRequest) {
  // Parse le body et ajoute l'action
  const body = await request.json();
  body.action = 'quote-confirmation';

  // TODO: Implémenter la logique de confirmation de devis
  return new Response(JSON.stringify({
    success: true,
    message: 'Quote confirmation received',
    data: body
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}