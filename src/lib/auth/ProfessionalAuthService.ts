/**
 * Service d'authentification unifié pour tous les professionnels
 * Gère les permissions basées sur les rôles et services
 */

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  type: 'external_professional' | 'internal_staff';
  
  // Pour les professionnels externes
  businessType?: string;
  isAvailable?: boolean;
  
  // Pour le staff interne
  role?: string;
  department?: string;
  
  // Commun
  serviceTypes: string[];
}

export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

export class ProfessionalAuthService {
  private static getJwtSecret(): string {
    const secret = process.env.JWT_SECRET || process.env.SIGNATURE_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET ou SIGNATURE_SECRET manquant dans la configuration');
    }
    return secret;
  }

  /**
   * Authentifie un utilisateur depuis la requête
   */
  static async authenticateFromRequest(request: NextRequest): Promise<AuthResult> {
    try {
      // Récupérer le token depuis le cookie ou header (case-insensitive)
      const token = request.cookies.get('professional_token')?.value ||
                   request.headers.get('authorization')?.replace('Bearer ', '') ||
                   request.headers.get('Authorization')?.replace('Bearer ', '');

      if (!token) {
        return { success: false, error: 'Token manquant' };
      }

      // Vérifier le token JWT
      const decoded = jwt.verify(token, this.getJwtSecret()) as any;

      if (!decoded.type || !['external_professional', 'internal_staff'].includes(decoded.type)) {
        return { success: false, error: 'Type de token invalide' };
      }

      const user: AuthenticatedUser = {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        type: decoded.type,
        serviceTypes: decoded.serviceTypes || [],
        
        // Champs conditionnels
        ...(decoded.type === 'external_professional' && {
          businessType: decoded.businessType,
          isAvailable: decoded.isAvailable
        }),
        
        ...(decoded.type === 'internal_staff' && {
          role: decoded.role,
          department: decoded.department
        })
      };

      return { success: true, user };

    } catch (error) {
      console.error('Erreur authentification:', error);
      return { success: false, error: 'Token invalide' };
    }
  }

  /**
   * Vérifie si un utilisateur a accès à un service spécifique
   */
  static hasServiceAccess(user: AuthenticatedUser, serviceType: string): boolean {
    // Admin a accès à tout
    if (user.type === 'internal_staff' && user.role === 'ADMIN') {
      return true;
    }

    // Vérifier si le service est dans la liste des services gérés
    return user.serviceTypes.includes(serviceType);
  }

  /**
   * Vérifie si un utilisateur est admin
   */
  static isAdmin(user: AuthenticatedUser): boolean {
    return user.type === 'internal_staff' && user.role === 'ADMIN';
  }

  /**
   * Vérifie si un utilisateur est du staff interne
   */
  static isInternalStaff(user: AuthenticatedUser): boolean {
    return user.type === 'internal_staff';
  }

  /**
   * Vérifie si un utilisateur est un professionnel externe
   */
  static isExternalProfessional(user: AuthenticatedUser): boolean {
    return user.type === 'external_professional';
  }

  /**
   * Détermine l'URL de dashboard appropriée pour un utilisateur
   */
  static getDashboardUrl(user: AuthenticatedUser): string {
    if (user.type === 'internal_staff') {
      return user.role === 'ADMIN' ? '/admin/dashboard' : '/internal/dashboard';
    }
    return '/professional/dashboard';
  }

  /**
   * Vérifie les permissions pour accéder à une réservation
   */
  static canAccessBooking(user: AuthenticatedUser, booking: any): boolean {
    // Admin peut tout voir
    if (this.isAdmin(user)) {
      return true;
    }

    // Professionnel externe : seulement ses propres réservations
    if (this.isExternalProfessional(user)) {
      return booking.professionalId === user.id;
    }

    // Staff interne : réservations de ses services
    if (this.isInternalStaff(user)) {
      const bookingServiceType = this.mapBookingTypeToServiceType(booking.type);
      return this.hasServiceAccess(user, bookingServiceType);
    }

    return false;
  }

  /**
   * Vérifie les permissions pour gérer une attribution
   */
  static canManageAttribution(user: AuthenticatedUser, attribution: any): boolean {
    // Seul le staff interne peut gérer les attributions
    if (!this.isInternalStaff(user)) {
      return false;
    }

    // Admin peut tout gérer
    if (this.isAdmin(user)) {
      return true;
    }

    // Staff : seulement ses services
    return this.hasServiceAccess(user, attribution.serviceType);
  }

  /**
   * Vérifie les permissions pour voir les statistiques globales
   */
  static canViewGlobalStats(user: AuthenticatedUser): boolean {
    // Admin et certains rôles de direction
    return this.isAdmin(user) || 
           (this.isInternalStaff(user) && ['OPERATIONS_MANAGER'].includes(user.role || ''));
  }

  /**
   * Mappe le type de réservation vers le type de service
   */
  private static mapBookingTypeToServiceType(bookingType: string): string {
    const mapping: Record<string, string> = {
      'MOVING_QUOTE': 'MOVING',
      'MOVING': 'MOVING',
      'MOVING_PREMIUM': 'MOVING',
      'PACKING': 'MOVING',
      'SERVICE': 'MOVING'
    };
    return mapping[bookingType] || 'MOVING';
  }

  /**
   * Génère une réponse d'erreur d'autorisation
   */
  static unauthorizedResponse(message: string = 'Accès non autorisé') {
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  /**
   * Génère une réponse d'erreur d'authentification
   */
  static unauthenticatedResponse(message: string = 'Authentification requise') {
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}