/**
 * 🧪 **TESTS UNITAIRES - Endpoints API**
 * 
 * Tests unitaires pour les endpoints API critiques
 * du flux de réservation.
 */

import { NextRequest } from 'next/server';
import { POST as createQuoteRequest } from '@/app/api/quotesRequest/route';
import { POST as createPaymentSession } from '@/app/api/payment/create-session/route';
import { POST as finalizeBooking } from '@/app/api/bookings/finalize/route';
import { GET as getPaymentStatus } from '@/app/api/payment/status/route';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    customer: {
      create: jest.fn(),
      findUnique: jest.fn()
    },
    quoteRequest: {
      create: jest.fn(),
      findUnique: jest.fn()
    },
    booking: {
      create: jest.fn(),
      findUnique: jest.fn()
    },
    transaction: {
      create: jest.fn(),
      findFirst: jest.fn()
    }
  }
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn()
    }
  }));
});

import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/quotesRequest', () => {
    test('création réussie d\'un QuoteRequest', async () => {
      const mockQuoteRequest = {
        id: 'quote_123',
        type: 'CLEANING',
        status: 'PENDING',
        quoteData: { surface: 50, duration: 2 },
        temporaryId: 'temp_123',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        catalogSelectionId: 'catalog_123'
      };

      mockPrisma.quoteRequest.create.mockResolvedValue(mockQuoteRequest);

      const request = new NextRequest('http://localhost:3000/api/quotesRequest', {
        method: 'POST',
        body: JSON.stringify({
          type: 'CLEANING',
          quoteData: { surface: 50, duration: 2 },
          catalogSelectionId: 'catalog_123'
        })
      });

      const response = await createQuoteRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockQuoteRequest);
    });

    test('erreur de validation des données', async () => {
      const request = new NextRequest('http://localhost:3000/api/quotesRequest', {
        method: 'POST',
        body: JSON.stringify({
          // Données manquantes
        })
      });

      const response = await createQuoteRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('validation');
    });

    test('erreur de base de données', async () => {
      mockPrisma.quoteRequest.create.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/quotesRequest', {
        method: 'POST',
        body: JSON.stringify({
          type: 'CLEANING',
          quoteData: { surface: 50, duration: 2 },
          catalogSelectionId: 'catalog_123'
        })
      });

      const response = await createQuoteRequest(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/payment/create-session', () => {
    test('création réussie d\'une session Stripe', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 12000,
        currency: 'eur'
      };

      const mockStripe = {
        paymentIntents: {
          create: jest.fn().mockResolvedValue(mockPaymentIntent)
        }
      };

      // Mock du module Stripe
      jest.doMock('stripe', () => jest.fn(() => mockStripe));

      const request = new NextRequest('http://localhost:3000/api/payment/create-session', {
        method: 'POST',
        body: JSON.stringify({
          temporaryId: 'temp_123',
          customerData: {
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean.dupont@email.com',
            phone: '+33123456789'
          },
          amount: 120,
          quoteData: { surface: 50, duration: 2 }
        })
      });

      const response = await createPaymentSession(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessionId).toBe('pi_test_123');
      expect(data.clientSecret).toBe('pi_test_123_secret');
    });

    test('erreur de validation des données', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment/create-session', {
        method: 'POST',
        body: JSON.stringify({
          // Données manquantes
        })
      });

      const response = await createPaymentSession(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('temporaryId requis');
    });

    test('QuoteRequest non trouvé', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment/create-session', {
        method: 'POST',
        body: JSON.stringify({
          temporaryId: 'temp_invalid',
          customerData: {
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean.dupont@email.com',
            phone: '+33123456789'
          },
          amount: 120,
          quoteData: { surface: 50, duration: 2 }
        })
      });

      // Mock de la réponse 404 pour le QuoteRequest
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404
      });

      const response = await createPaymentSession(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Devis non trouvé');
    });
  });

  describe('POST /api/bookings/finalize', () => {
    test('finalisation réussie d\'un Booking', async () => {
      const mockBooking = {
        id: 'booking_123',
        type: 'SERVICE',
        status: 'CONFIRMED',
        customerId: 'customer_123',
        totalAmount: 120,
        createdAt: new Date(),
        updatedAt: new Date(),
        quoteRequestId: 'quote_123'
      };

      mockPrisma.booking.create.mockResolvedValue(mockBooking);

      const request = new NextRequest('http://localhost:3000/api/bookings/finalize', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'cs_test_123',
          temporaryId: 'temp_123',
          paymentIntentId: 'pi_test_123',
          paymentStatus: 'paid',
          amount: 120,
          customerData: {
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean.dupont@email.com',
            phone: '+33123456789'
          },
          quoteType: 'CLEANING',
          metadata: {}
        })
      });

      const response = await finalizeBooking(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.bookingId).toBe('booking_123');
    });

    test('erreur de validation des données', async () => {
      const request = new NextRequest('http://localhost:3000/api/bookings/finalize', {
        method: 'POST',
        body: JSON.stringify({
          // Données manquantes
        })
      });

      const response = await finalizeBooking(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/payment/status', () => {
    test('Booking trouvé', async () => {
      const mockTransaction = {
        id: 'transaction_123',
        bookingId: 'booking_123',
        status: 'COMPLETED',
        amount: 120,
        createdAt: new Date(),
        Booking: {
          id: 'booking_123',
          status: 'CONFIRMED',
          quoteRequestId: 'quote_123'
        }
      };

      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransaction);

      const request = new NextRequest('http://localhost:3000/api/payment/status?payment_intent=pi_test_123');

      const response = await getPaymentStatus(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.bookingId).toBe('booking_123');
      expect(data.bookingStatus).toBe('CONFIRMED');
    });

    test('Booking pas encore créé', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/payment/status?payment_intent=pi_test_123');

      const response = await getPaymentStatus(request);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Booking en cours de création');
    });

    test('PaymentIntent manquant', async () => {
      const request = new NextRequest('http://localhost:3000/api/payment/status');

      const response = await getPaymentStatus(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('payment_intent requis');
    });

    test('erreur de base de données', async () => {
      mockPrisma.transaction.findFirst.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/payment/status?payment_intent=pi_test_123');

      const response = await getPaymentStatus(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
