/**
 * Ce fichier fournit un adaptateur transitoire pour faciliter la migration
 * de l'ancien système bookingManager vers le nouveau système basé sur l'API
 */

import { getCurrentBooking as legacyGetCurrentBooking } from '@/actions/bookingManager';
import { logger } from '@/lib/logger';

/**
 * Récupère la réservation en cours en essayant d'abord le nouveau système,
 * puis si nécessaire fait un fallback sur l'ancien système
 */
export async function getBookingWithFallback() {
  try {
    // Essayer d'abord le nouveau système
    const response = await fetch('/api/bookings/current', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    // Fallback sur l'ancien système avec log d'avertissement
    logger.warn('Fallback vers le système legacy bookingManager.ts');
    return legacyGetCurrentBooking();
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error('Erreur inconnue');
    logger.error('Erreur de récupération de la réservation', errorObj);
    return null;
  }
}

/**
 * Récupère une réservation par ID en essayant d'abord le nouveau système,
 * puis si nécessaire fait un fallback sur l'ancien système
 */
export async function getBookingByIdWithFallback(id: string) {
  try {
    // Essayer d'abord le nouveau système
    const response = await fetch(`/api/bookings/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    // Fallback sur l'ancien système avec log d'avertissement
    logger.warn(`Fallback vers le système legacy pour la réservation ${id}`);
    const { getBookingById } = await import('@/actions/bookingManager');
    return getBookingById(id);
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(`Erreur de récupération de la réservation ${id}`);
    logger.error(`Erreur de récupération de la réservation ${id}`, errorObj);
    return null;
  }
}

/**
 * Ajoute un service à la réservation en essayant d'abord le nouveau système,
 * puis si nécessaire fait un fallback sur l'ancien système
 */
export async function addServiceWithFallback(serviceData: any) {
  try {
    // Récupérer la réservation en cours
    const booking = await getBookingWithFallback();
    
    if (!booking) {
      // Créer une nouvelle réservation via le nouveau système
      const createResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SERVICE',
          status: 'DRAFT'
        })
      });
      
      if (!createResponse.ok) {
        throw new Error('Erreur lors de la création de la réservation');
      }
      
      const newBooking = await createResponse.json();
      
      // Ajouter le service à la nouvelle réservation
      const addResponse = await fetch(`/api/bookings/${newBooking.id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });
      
      if (!addResponse.ok) {
        throw new Error('Erreur lors de l\'ajout du service');
      }
      
      return addResponse.json();
    }
    
    // Si une réservation existe déjà, utiliser son ID
    const bookingId = booking.id;
    
    // Essayer d'ajouter le service via le nouveau système
    const response = await fetch(`/api/bookings/${bookingId}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceData)
    });
    
    if (response.ok) {
      return response.json();
    }
    
    // Fallback sur l'ancien système avec log d'avertissement
    logger.warn('Fallback vers le système legacy pour l\'ajout du service');
    const { addServiceToBooking } = await import('@/actions/bookingManager');
    return addServiceToBooking(serviceData);
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error('Erreur lors de l\'ajout du service');
    logger.error('Erreur lors de l\'ajout du service', errorObj);
    throw error;
  }
} 