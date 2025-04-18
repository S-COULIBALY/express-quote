import { NextResponse } from 'next/server'

/**
 * GET /api/debug - Endpoint pour vérifier la connectivité API
 */
export async function GET() {
  console.log('🔍 DEBUG API: Cet endpoint a été appelé!')
  
  // Vérifier si on peut charger et exécuter un timestamp
  const timestamp = new Date().toISOString()
  
  // Retourner une réponse simple
  return NextResponse.json({ 
    success: true,
    message: 'API debug is working correctly',
    timestamp,
    environment: process.env.NODE_ENV || 'unknown'
  })
} 