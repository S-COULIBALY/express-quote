/**
 * Données de test communes pour les tests d'intégration
 * 
 * Ce fichier contient des données réutilisables dans les différents tests
 */

import { BookingType } from '@/quotation/domain/enums/BookingType';
import { BookingStatus } from '@/quotation/domain/enums/BookingStatus';
import { TEST_IDS } from './HttpMocks';

/**
 * Données de test pour les tests d'intégration
 * 
 * Ce fichier contient les jeux de données utilisés pour les tests des différents types de réservation.
 */

/**
 * Données de test pour les réservations de type déménagement
 */
export const movingBookingData = {
  type: BookingType.MOVING_QUOTE,
  customer: {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    phone: '0612345678',
    address: '123 Rue de Paris, 75001 Paris'
  },
  movingDetails: {
    pickupAddress: '123 Rue de Paris, 75001 Paris',
    deliveryAddress: '456 Avenue de Lyon, 69002 Lyon',
    pickupDate: '2025-05-01',
    pickupTime: '09:00',
    volume: 25, // m3
    distance: 450, // km
    pickupFloor: 2,
    deliveryFloor: 3,
    pickupElevator: true,
    deliveryElevator: false,
    additionalServices: ['packaging', 'furniture_disassembly']
  },
  totalPrice: {
    amount: 1450,
    currency: 'EUR'
  }
};

/**
 * Données de test pour les réservations de type pack
 */
export const packBookingData = {
  type: BookingType.PACK,
  customer: {
    firstName: 'Marie',
    lastName: 'Martin',
    email: 'marie.martin@example.com',
    phone: '0623456789',
    address: '789 Boulevard Haussmann, 75008 Paris'
  },
  packDetails: {
    serviceDate: '2025-05-15',
    serviceTime: '14:00',
    packType: 'standard',
    roomCount: 4,
    floorNumber: 2,
    hasElevator: true,
    squareMeters: 80,
    specialRequests: 'Attention aux objets fragiles'
  },
  totalPrice: {
    amount: 350,
    currency: 'EUR'
  }
};

/**
 * Données de test pour les réservations de type service
 */
export const serviceBookingData = {
  type: BookingType.SERVICE,
  customer: {
    firstName: 'Pierre',
    lastName: 'Durand',
    email: 'pierre.durand@example.com',
    phone: '0634567890',
    address: '101 Rue de Rivoli, 75001 Paris'
  },
  serviceDetails: {
    serviceType: 'cleaning',
    serviceDate: '2025-06-01',
    serviceTime: '10:00',
    duration: 3, // heures
    squareMeters: 120,
    specialRequests: 'Nettoyage des vitres inclus'
  },
  totalPrice: {
    amount: 180,
    currency: 'EUR'
  }
}; 