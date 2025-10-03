/**
 * API endpoint pour la déconnexion des professionnels
 * Route: POST /api/professional/auth/logout
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔓 Déconnexion professionnel');

    // Créer la réponse de déconnexion
    const response = NextResponse.json({
      success: true,
      message: 'Déconnexion réussie',
      redirectUrl: '/professional/login'
    });

    // Supprimer le cookie de session
    response.cookies.set('professional_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Expirer immédiatement
    });

    return response;

  } catch (error) {
    console.error('❌ Erreur lors de la déconnexion:', error);

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur'
      },
      { status: 500 }
    );
  }
}