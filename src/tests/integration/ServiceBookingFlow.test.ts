/**
 * Test d'intégration du flux complet de réservation de service
 * 
 * Ce test couvre toutes les étapes du parcours client pour une réservation
 * de type service, de la création jusqu'à la confirmation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { BookingType } from '@/quotation/domain/enums/BookingType';
import { BookingStatus } from '@/quotation/domain/enums/BookingStatus';
import { GET as getBooking, POST as createBooking } from '@/app/api/bookings/route';
import { POST as processPayment } from '@/app/api/payment/webhook/route';
import { HttpRequest, HttpResponse } from '@/quotation/interfaces/http/types';
import { MockNextRequest, asNextRequest, TEST_IDS } from '../mocks/HttpMocks';
import { serviceBookingData } from '../mocks/TestData';

// On mock uniquement les services externes non testables
jest.mock('@/quotation/infrastructure/services/StripePaymentService');
jest.mock('@/quotation/infrastructure/services/MailService');
jest.mock('@/quotation/infrastructure/services/PdfGeneratorService');
jest.mock('@/quotation/infrastructure/services/StorageService');
// Ne pas mocker nos services internes pour tester l'intégration complète

// Import des services mockés pour les assertions
import { MailService } from '@/quotation/infrastructure/services/MailService';
import { PdfGeneratorService } from '@/quotation/infrastructure/services/PdfGeneratorService';
import { StorageService } from '@/quotation/infrastructure/services/StorageService';

describe('Flux de réservation de service', () => {
  let stripeSessionId: string;

  // Configuration avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Réinitialiser les mocks des services
    (MailService as any).resetMock();
    (PdfGeneratorService as any).resetMock();
    (StorageService as any).resetMock();

    // ID de session Stripe utilisé dans les tests
    stripeSessionId = TEST_IDS.SERVICE.STRIPE_SESSION_ID;
  });

  it('devrait compléter tout le flux de réservation de service avec succès', async () => {
    // 1. Créer une réservation
    const createRequest = new MockNextRequest(
      'http://localhost:3000/api/bookings',
      serviceBookingData
    );
    
    const createResponse = await createBooking(asNextRequest(createRequest));
    const createData = await createResponse.json();
    
    // Vérifier que la réservation a été créée avec succès
    expect(createResponse.status).toBe(201);
    expect(createData).toHaveProperty('id');
    expect(createData).toHaveProperty('type', BookingType.SERVICE);
    expect(createData).toHaveProperty('status', BookingStatus.DRAFT);
    
    // Récupérer l'ID généré lors de la création
    const generatedBookingId = createData.id;
    
    // 2. Récupérer la réservation pour vérification
    const getRequest = new MockNextRequest(
      `http://localhost:3000/api/bookings?id=${generatedBookingId}`
    );
    
    const getResponse = await getBooking(asNextRequest(getRequest));
    const getData = await getResponse.json();
    
    // Vérifier les détails de la réservation
    expect(getResponse.status).toBe(200);
    expect(getData).toHaveProperty('id', generatedBookingId);
    expect(getData).toHaveProperty('customer');
    expect(getData.customer).toHaveProperty('email', serviceBookingData.customer.email);
    
    // 3. Simuler un webhook de paiement réussi
    const stripeEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: stripeSessionId,
          metadata: {
            bookingId: generatedBookingId
          },
          status: 'complete',
          payment_status: 'paid'
        }
      }
    };
    
    const paymentRequest = new MockNextRequest(
      'http://localhost:3000/api/payment/webhook',
      stripeEvent,
      {'stripe-signature': 'sig_123456'}
    );
    
    const paymentResponse = await processPayment(asNextRequest(paymentRequest));
    const paymentData = await paymentResponse.json();
    
    // Vérifier que le paiement a été traité
    expect(paymentResponse.status).toBe(200);
    expect(paymentData).toHaveProperty('received', true);
    
    // 4. Vérifier la mise à jour du statut de la réservation
    const finalGetRequest = new MockNextRequest(
      `http://localhost:3000/api/bookings?id=${generatedBookingId}`
    );
    
    const finalGetResponse = await getBooking(asNextRequest(finalGetRequest));
    const finalGetData = await finalGetResponse.json();
    
    // Vérifier que le statut a été mis à jour après le paiement
    expect(finalGetResponse.status).toBe(200);
    expect(finalGetData).toHaveProperty('status', BookingStatus.PAYMENT_COMPLETED);
  });
}); 