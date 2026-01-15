/**
 * API endpoint pour l'authentification des professionnels
 * Route: POST /api/professional/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation des paramètres
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase();
    let user: any = null;
    let userType: 'external' | 'internal' = 'external';

    // 1. Rechercher d'abord dans les professionnels externes
    const professional = await prisma.professional.findUnique({
      where: { email: emailLower },
      select: {
        id: true,
        companyName: true,
        email: true,
        password: true,
        verified: true,
        is_available: true,
        city: true,
        service_types: true,
        businessType: true,
        phone: true,
        last_login_at: true
      }
    });

    if (professional && professional.password) {
      user = professional;
      userType = 'external';
    } else {
      // 2. Rechercher dans le staff interne
      const internalStaff = await prisma.internal_staff.findUnique({
        where: { email: emailLower },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          password: true,
          role: true,
          department: true,
          service_types: true,
          is_active: true,
          phone: true,
          last_login_at: true
        }
      });

      if (internalStaff && internalStaff.password) {
        user = internalStaff;
        userType = 'internal';
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Identifiants invalides' },
        { status: 401 }
      );
    }

    // Vérifications spécifiques selon le type
    if (userType === 'external' && !user.verified) {
      return NextResponse.json(
        { success: false, error: 'Compte non vérifié. Contactez l\'administration.' },
        { status: 403 }
      );
    }

    if (userType === 'internal' && !user.is_active) {
      return NextResponse.json(
        { success: false, error: 'Compte désactivé. Contactez l\'administration.' },
        { status: 403 }
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Identifiants invalides' },
        { status: 401 }
      );
    }

    // Générer le token JWT avec informations du type
    const jwtSecret = process.env.JWT_SECRET || process.env.SIGNATURE_SECRET;

    if (!jwtSecret) {
      console.error('❌ ERREUR CRITIQUE: JWT_SECRET ou SIGNATURE_SECRET manquant');
      return NextResponse.json(
        { success: false, error: 'Configuration serveur manquante' },
        { status: 500 }
      );
    }
    const tokenPayload = userType === 'external' ? {
      userId: user.id,
      email: user.email,
      name: user.companyName,
      type: 'external_professional',
      businessType: user.businessType,
      service_types: user.service_types
    } : {
      userId: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      type: 'internal_staff',
      role: user.role,
      department: user.department,
      service_types: user.service_types
    };

    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '24h' });

    // Mettre à jour la dernière connexion
    if (userType === 'external') {
      await prisma.professional.update({
        where: { id: user.id },
        data: { last_login_at: new Date() }
      });
    } else {
      await prisma.internal_staff.update({
        where: { id: user.id },
        data: { last_login_at: new Date() }
      });
    }

    // Déterminer l'URL de redirection selon le rôle
    let redirectUrl = '/professional/dashboard'; // Par défaut

    if (userType === 'internal') {
      if (user.role === 'ADMIN') {
        redirectUrl = '/admin/dashboard';
      } else {
        redirectUrl = '/internal/dashboard';
      }
    }

    console.log(`✅ Connexion ${userType}: ${user.companyName || `${user.firstName} ${user.lastName}`} (${user.email})`);

    // Réponse avec informations selon le type
    const responseData = userType === 'external' ? {
      id: user.id,
      companyName: user.companyName,
      email: user.email,
      verified: user.verified,
      is_available: user.is_available,
      city: user.city,
      businessType: user.businessType,
      phone: user.phone,
      service_types: user.service_types,
      type: 'external'
    } : {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.department,
      service_types: user.service_types,
      isActive: user.isActive,
      phone: user.phone,
      type: 'internal'
    };

    const response = NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      user: responseData,
      userType,
      token,
      redirectUrl
    });

    // Définir le cookie de session
    response.cookies.set('professional_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 heures
    });

    return response;

  } catch (error) {
    console.error('❌ Erreur lors de la connexion professionnel:', error);

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}