/**
 * Test d'intégration pour la gestion des erreurs dans le processus de réservation
 * 
 * Ce test vérifie que les erreurs sont correctement gérées à chaque étape du flux
 */

import { NextRequest } from 'next/server';
import { BookingType, BookingStatus } from '@/quotation/domain/entities/Booking';
import { GET as getBooking, POST as createBooking } from '@/app/api/bookings/route';
import { POST as processPayment } from '@/app/api/payment/webhook/route';
import { MockNextRequest, asNextRequest, createStripeSuccessEvent } from '../mocks/HttpMocks';
import { movingBookingData } from '../mocks/TestData';

// On mock uniquement les services externes non testables
jest.mock('../../../quotation/infrastructure/services/StripePaymentService');

describe('Gestion des erreurs dans le processus de réservation', () => {
  let invalidBookingData: any;
  let validBookingData: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Données de test
    validBookingData = { ...movingBookingData };
    
    invalidBookingData = { 
      // Données invalides : pas de type ni de client
      moveDate: new Date(),
      pickupAddress: {
        street: '123 Rue Test',
        city: 'Ville Test',
        postalCode: '12345',
        country: 'Pays Test'
      }
    };
  });

  describe('Validation des données', () => {
    it('devrait rejeter une réservation avec des données invalides', async () => {
      const request = new MockNextRequest(
        'http://localhost:3000/api/bookings',
        invalidBookingData
      );
      
      const response = await createBooking(asNextRequest(request));
      const data = await response.json();
      
      // Vérifier que la requête est rejetée avec un statut 400
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    it('devrait rejeter une réservation sans date de déménagement', async () => {
      const incompleteData = { ...validBookingData };
      delete incompleteData.moveDate;
      
      const request = new MockNextRequest(
        'http://localhost:3000/api/bookings',
        incompleteData
      );
      
      const response = await createBooking(asNextRequest(request));
      const data = await response.json();
      
      // Vérifier que la requête est rejetée avec un statut 400
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });
  });

  describe('Récupération des réservations', () => {
    it('devrait renvoyer une erreur 404 pour une réservation inexistante', async () => {
      const request = new MockNextRequest(
        'http://localhost:3000/api/bookings?id=non_existent_id_12345'
      );
      
      const response = await getBooking(asNextRequest(request));
      const data = await response.json();
      
      // Vérifier que la requête est rejetée avec un statut 404
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error');
    });
  });

  describe('Webhook de paiement', () => {
    it('devrait rejeter un événement de paiement invalide', async () => {
      const invalidEvent = {
        type: 'unknown_event',
        data: {
          object: {}
        }
      };
      
      const request = new MockNextRequest(
        'http://localhost:3000/api/payment/webhook',
        invalidEvent,
        {'stripe-signature': 'invalid_sig'}
      );
      
      const response = await processPayment(asNextRequest(request));
      const data = await response.json();
      
      // Vérifier que la requête est rejetée
      expect(response.status).not.toBe(200);
      expect(data).toHaveProperty('error');
    });

    it('devrait gérer le cas où la réservation n\'existe pas', async () => {
      // Créer un événement de paiement pour une réservation inexistante
      const stripeEvent = createStripeSuccessEvent('non_existent_id_12345', 'cs_test_invalid');
      
      const request = new MockNextRequest(
        'http://localhost:3000/api/payment/webhook',
        stripeEvent,
        {'stripe-signature': 'sig_test'}
      );
      
      const response = await processPayment(asNextRequest(request));
      const data = await response.json();
      
      // Le webhook doit toujours renvoyer 200 pour Stripe (convention API), mais avec une erreur en interne
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('received', true);
      // Il peut y avoir un avertissement ou non selon l'implémentation
    });
  });
}); 