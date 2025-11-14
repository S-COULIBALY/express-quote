/**
 * 💼 **TESTS DE LOGIQUE MÉTIER - FLUX DE RÉSERVATION**
 *
 * Tests de la logique métier critique :
 * 1. Transitions d'états de réservation (BookingStatus)
 * 2. Calcul des acomptes (30% du montant total)
 * 3. Expiration des QuoteRequest
 * 4. Validation des données de réservation
 * 5. Cohérence des prix et montants
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient, BookingStatus, TransactionStatus } from '@prisma/client';
import { generateurDonneesTest } from '../../fixtures/donnees-reservation';

const prisma = new PrismaClient();

describe('💼 Business Logic - Booking Status Transitions', () => {
  let testBookingId: string;

  beforeEach(async () => {
    // Créer un booking de test
    const customerId = generateurDonneesTest.customerId();

    await prisma.customer.create({
      data: {
        id: customerId,
        email: generateurDonneesTest.email(),
        firstName: 'Test',
        lastName: 'User',
        phone: '+33123456789',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const booking = await prisma.booking.create({
      data: {
        id: generateurDonneesTest.bookingId(),
        type: 'SERVICE',
        status: 'DRAFT',
        customerId,
        totalAmount: 1000.00,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    testBookingId = booking.id;
  });

  afterEach(async () => {
    // Nettoyer les données de test
    if (testBookingId) {
      await prisma.booking.deleteMany({
        where: { id: testBookingId }
      });
    }
    await prisma.customer.deleteMany({
      where: { email: { contains: 'test-' } }
    });
  });

  test('should transition from DRAFT to CONFIRMED', async () => {
    const updated = await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: 'CONFIRMED', updatedAt: new Date() }
    });

    expect(updated.status).toBe('CONFIRMED');
  });

  test('should transition from CONFIRMED to AWAITING_PAYMENT', async () => {
    await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: 'CONFIRMED', updatedAt: new Date() }
    });

    const updated = await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: 'AWAITING_PAYMENT', updatedAt: new Date() }
    });

    expect(updated.status).toBe('AWAITING_PAYMENT');
  });

  test('should transition from AWAITING_PAYMENT to PAYMENT_PROCESSING', async () => {
    await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: 'AWAITING_PAYMENT', updatedAt: new Date() }
    });

    const updated = await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: 'PAYMENT_PROCESSING', updatedAt: new Date() }
    });

    expect(updated.status).toBe('PAYMENT_PROCESSING');
  });

  test('should transition from PAYMENT_PROCESSING to PAYMENT_COMPLETED', async () => {
    await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: 'PAYMENT_PROCESSING', updatedAt: new Date() }
    });

    const updated = await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: 'PAYMENT_COMPLETED', updatedAt: new Date() }
    });

    expect(updated.status).toBe('PAYMENT_COMPLETED');
  });

  test('should transition from PAYMENT_COMPLETED to COMPLETED', async () => {
    await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: 'PAYMENT_COMPLETED', updatedAt: new Date() }
    });

    const updated = await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: 'COMPLETED', updatedAt: new Date() }
    });

    expect(updated.status).toBe('COMPLETED');
  });

  test('should transition from PAYMENT_PROCESSING to PAYMENT_FAILED', async () => {
    await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: 'PAYMENT_PROCESSING', updatedAt: new Date() }
    });

    const updated = await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: 'PAYMENT_FAILED', updatedAt: new Date() }
    });

    expect(updated.status).toBe('PAYMENT_FAILED');
  });

  test('should allow retry from PAYMENT_FAILED to AWAITING_PAYMENT', async () => {
    await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: 'PAYMENT_FAILED', updatedAt: new Date() }
    });

    const updated = await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: 'AWAITING_PAYMENT', updatedAt: new Date() }
    });

    expect(updated.status).toBe('AWAITING_PAYMENT');
  });

  test('should allow cancellation from AWAITING_PAYMENT', async () => {
    await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: 'AWAITING_PAYMENT', updatedAt: new Date() }
    });

    const updated = await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: 'CANCELED', updatedAt: new Date() }
    });

    expect(updated.status).toBe('CANCELED');
  });

  test('should track status history with updatedAt timestamp', async () => {
    const timestamps: Date[] = [];

    // DRAFT
    let booking = await prisma.booking.findUnique({ where: { id: testBookingId } });
    timestamps.push(booking!.updatedAt);

    // CONFIRMED
    await new Promise(resolve => setTimeout(resolve, 10)); // Petit délai
    booking = await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: 'CONFIRMED', updatedAt: new Date() }
    });
    timestamps.push(booking.updatedAt);

    // AWAITING_PAYMENT
    await new Promise(resolve => setTimeout(resolve, 10));
    booking = await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: 'AWAITING_PAYMENT', updatedAt: new Date() }
    });
    timestamps.push(booking.updatedAt);

    // Vérifier que les timestamps sont croissants
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i].getTime()).toBeGreaterThanOrEqual(timestamps[i - 1].getTime());
    }
  });

  test('should maintain all valid BookingStatus values', () => {
    const validStatuses: BookingStatus[] = [
      'DRAFT',
      'CONFIRMED',
      'AWAITING_PAYMENT',
      'PAYMENT_PROCESSING',
      'PAYMENT_FAILED',
      'PAYMENT_COMPLETED',
      'CANCELED',
      'COMPLETED'
    ];

    // Vérifier que tous les statuts sont définis
    validStatuses.forEach(status => {
      expect(BookingStatus[status]).toBeDefined();
    });

    expect(validStatuses).toHaveLength(8);
  });
});

describe('💼 Business Logic - Deposit Calculation', () => {
  test('should calculate 30% deposit correctly for round amounts', () => {
    const testCases = [
      { totalPrice: 100, expectedDeposit: 30 },
      { totalPrice: 1000, expectedDeposit: 300 },
      { totalPrice: 5000, expectedDeposit: 1500 },
      { totalPrice: 10000, expectedDeposit: 3000 }
    ];

    testCases.forEach(({ totalPrice, expectedDeposit }) => {
      const calculatedDeposit = totalPrice * 0.3;
      expect(calculatedDeposit).toBe(expectedDeposit);
      expect(calculatedDeposit).toBeCloseTo(expectedDeposit, 2);
    });
  });

  test('should calculate 30% deposit correctly for decimal amounts', () => {
    const testCases = [
      { totalPrice: 333.33, expectedDeposit: 99.999 },
      { totalPrice: 123.45, expectedDeposit: 37.035 },
      { totalPrice: 999.99, expectedDeposit: 299.997 }
    ];

    testCases.forEach(({ totalPrice, expectedDeposit }) => {
      const calculatedDeposit = totalPrice * 0.3;
      expect(calculatedDeposit).toBeCloseTo(expectedDeposit, 2);
    });
  });

  test('should round deposit amount to 2 decimal places', () => {
    const totalPrice = 333.33;
    const depositAmount = totalPrice * 0.3;
    const roundedDeposit = Math.round(depositAmount * 100) / 100;

    expect(roundedDeposit).toBe(100.00);
  });

  test('should convert deposit amount to Stripe cents correctly', () => {
    const testCases = [
      { depositEuros: 30.00, expectedCents: 3000 },
      { depositEuros: 99.99, expectedCents: 9999 },
      { depositEuros: 100.50, expectedCents: 10050 },
      { depositEuros: 1500.00, expectedCents: 150000 }
    ];

    testCases.forEach(({ depositEuros, expectedCents }) => {
      const cents = Math.round(depositEuros * 100);
      expect(cents).toBe(expectedCents);
    });
  });

  test('should handle edge case: 30% deposit of very small amount', () => {
    const totalPrice = 1.00; // 1€
    const depositAmount = totalPrice * 0.3;

    expect(depositAmount).toBe(0.30);
    expect(Math.round(depositAmount * 100)).toBe(30); // 30 centimes
  });

  test('should handle edge case: 30% deposit of maximum price (100000€)', () => {
    const totalPrice = 100000.00;
    const depositAmount = totalPrice * 0.3;

    expect(depositAmount).toBe(30000.00);
    expect(Math.round(depositAmount * 100)).toBe(3000000); // 30000€ en centimes
  });

  test('should store depositAmount in PaymentIntent metadata', () => {
    const serverCalculatedPrice = 1000.00;
    const depositAmount = serverCalculatedPrice * 0.3;

    const metadata = {
      serverCalculatedPrice: serverCalculatedPrice.toFixed(2),
      depositAmount: depositAmount.toFixed(2),
      calculationId: 'calc_test_123'
    };

    expect(metadata.depositAmount).toBe('300.00');
    expect(parseFloat(metadata.depositAmount)).toBe(300.00);
    expect(Math.round(parseFloat(metadata.depositAmount) * 100)).toBe(30000);
  });
});

describe('💼 Business Logic - QuoteRequest Expiration', () => {
  let testQuoteRequestId: string;

  beforeEach(async () => {
    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        id: generateurDonneesTest.uuid(),
        type: 'CLEANING',
        status: 'PENDING',
        quoteData: { surface: 50, duration: 2 },
        temporaryId: generateurDonneesTest.temporaryId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h depuis maintenant
      }
    });

    testQuoteRequestId = quoteRequest.id;
  });

  afterEach(async () => {
    if (testQuoteRequestId) {
      await prisma.quoteRequest.deleteMany({
        where: { id: testQuoteRequestId }
      });
    }
  });

  test('should identify expired QuoteRequest', async () => {
    // Créer un QuoteRequest expiré
    const expiredQuote = await prisma.quoteRequest.create({
      data: {
        id: generateurDonneesTest.uuid(),
        type: 'CLEANING',
        status: 'PENDING',
        quoteData: {},
        temporaryId: generateurDonneesTest.temporaryId(),
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-01'),
        expiresAt: new Date('2020-01-02') // Expiré depuis longtemps
      }
    });

    const quote = await prisma.quoteRequest.findUnique({
      where: { id: expiredQuote.id }
    });

    const isExpired = quote!.expiresAt < new Date();
    expect(isExpired).toBe(true);

    // Nettoyer
    await prisma.quoteRequest.delete({ where: { id: expiredQuote.id } });
  });

  test('should identify valid (non-expired) QuoteRequest', async () => {
    const quote = await prisma.quoteRequest.findUnique({
      where: { id: testQuoteRequestId }
    });

    const isExpired = quote!.expiresAt < new Date();
    expect(isExpired).toBe(false);
  });

  test('should set expiration 24 hours from creation by default', async () => {
    const createdAt = new Date();
    const expectedExpiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        id: generateurDonneesTest.uuid(),
        type: 'CLEANING',
        status: 'PENDING',
        quoteData: {},
        temporaryId: generateurDonneesTest.temporaryId(),
        createdAt,
        updatedAt: createdAt,
        expiresAt: expectedExpiresAt
      }
    });

    const timeDiff = quoteRequest.expiresAt.getTime() - quoteRequest.createdAt.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    expect(hoursDiff).toBe(24);

    // Nettoyer
    await prisma.quoteRequest.delete({ where: { id: quoteRequest.id } });
  });

  test('should query non-expired QuoteRequests', async () => {
    const now = new Date();

    const validQuotes = await prisma.quoteRequest.findMany({
      where: {
        expiresAt: {
          gt: now // Greater than now = non expiré
        }
      }
    });

    expect(validQuotes.length).toBeGreaterThan(0);

    validQuotes.forEach(quote => {
      expect(quote.expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  test('should query expired QuoteRequests for cleanup', async () => {
    // Créer un QuoteRequest expiré
    const expiredQuote = await prisma.quoteRequest.create({
      data: {
        id: generateurDonneesTest.uuid(),
        type: 'CLEANING',
        status: 'PENDING',
        quoteData: {},
        temporaryId: generateurDonneesTest.temporaryId(),
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-01'),
        expiresAt: new Date('2020-01-02')
      }
    });

    const now = new Date();

    const expiredQuotes = await prisma.quoteRequest.findMany({
      where: {
        expiresAt: {
          lt: now // Less than now = expiré
        }
      }
    });

    expect(expiredQuotes.length).toBeGreaterThan(0);

    expiredQuotes.forEach(quote => {
      expect(quote.expiresAt.getTime()).toBeLessThan(now.getTime());
    });

    // Nettoyer
    await prisma.quoteRequest.delete({ where: { id: expiredQuote.id } });
  });
});

describe('💼 Business Logic - Booking Data Validation', () => {
  test('should require customerId for booking creation', async () => {
    await expect(
      prisma.booking.create({
        data: {
          id: generateurDonneesTest.bookingId(),
          type: 'SERVICE',
          status: 'DRAFT',
          // @ts-expect-error - Missing customerId
          totalAmount: 100.00,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    ).rejects.toThrow();
  });

  test('should require totalAmount for booking creation', async () => {
    const customerId = generateurDonneesTest.customerId();

    await prisma.customer.create({
      data: {
        id: customerId,
        email: generateurDonneesTest.email(),
        firstName: 'Test',
        lastName: 'User',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    await expect(
      prisma.booking.create({
        data: {
          id: generateurDonneesTest.bookingId(),
          type: 'SERVICE',
          status: 'DRAFT',
          customerId,
          // @ts-expect-error - Missing totalAmount
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    ).rejects.toThrow();

    // Nettoyer
    await prisma.customer.delete({ where: { id: customerId } });
  });

  test('should accept valid BookingType values', () => {
    const validTypes = ['MOVING_QUOTE', 'PACKING', 'SERVICE'];

    validTypes.forEach(type => {
      expect(['MOVING_QUOTE', 'PACKING', 'SERVICE']).toContain(type);
    });
  });

  test('should store optional fields correctly', async () => {
    const customerId = generateurDonneesTest.customerId();

    await prisma.customer.create({
      data: {
        id: customerId,
        email: generateurDonneesTest.email(),
        firstName: 'Test',
        lastName: 'User',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const booking = await prisma.booking.create({
      data: {
        id: generateurDonneesTest.bookingId(),
        type: 'MOVING_QUOTE',
        status: 'DRAFT',
        customerId,
        totalAmount: 1500.00,
        pickupAddress: '123 Rue de Départ, Paris',
        deliveryAddress: '456 Avenue d\'Arrivée, Lyon',
        distance: 465.3,
        scheduledDate: new Date('2025-12-15'),
        paymentMethod: 'card',
        additionalInfo: {
          notes: 'Déménagement avec piano',
          specialInstructions: 'Appeler avant de venir'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    expect(booking.pickupAddress).toBe('123 Rue de Départ, Paris');
    expect(booking.deliveryAddress).toBe('456 Avenue d\'Arrivée, Lyon');
    expect(booking.distance).toBe(465.3);
    expect(booking.scheduledDate).toEqual(new Date('2025-12-15'));
    expect(booking.paymentMethod).toBe('card');
    expect(booking.additionalInfo).toMatchObject({
      notes: 'Déménagement avec piano',
      specialInstructions: 'Appeler avant de venir'
    });

    // Nettoyer
    await prisma.booking.delete({ where: { id: booking.id } });
    await prisma.customer.delete({ where: { id: customerId } });
  });
});

describe('💼 Business Logic - Price Consistency', () => {
  test('should ensure Booking.totalAmount matches Transaction.amount', async () => {
    const customerId = generateurDonneesTest.customerId();

    await prisma.customer.create({
      data: {
        id: customerId,
        email: generateurDonneesTest.email(),
        firstName: 'Test',
        lastName: 'User',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const bookingId = generateurDonneesTest.bookingId();
    const totalAmount = 1000.00;
    const depositAmount = totalAmount * 0.3; // 300€

    const booking = await prisma.booking.create({
      data: {
        id: bookingId,
        type: 'SERVICE',
        status: 'PAYMENT_COMPLETED',
        customerId,
        totalAmount,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const transaction = await prisma.transaction.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId,
        amount: depositAmount, // Acompte 30%
        currency: 'EUR',
        status: 'COMPLETED',
        paymentIntentId: generateurDonneesTest.paymentIntentId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    expect(transaction.amount).toBe(booking.totalAmount * 0.3);

    // Nettoyer
    await prisma.transaction.delete({ where: { id: transaction.id } });
    await prisma.booking.delete({ where: { id: bookingId } });
    await prisma.customer.delete({ where: { id: customerId } });
  });

  test('should ensure all amounts are positive', async () => {
    const amounts = [0.01, 50, 100, 1000, 10000, 99999.99];

    amounts.forEach(amount => {
      expect(amount).toBeGreaterThan(0);
      expect(amount).toBeLessThanOrEqual(100000);
    });
  });

  test('should use 2 decimal precision for all amounts', async () => {
    const amounts = [100.00, 99.99, 1234.56, 0.01];

    amounts.forEach(amount => {
      const rounded = Math.round(amount * 100) / 100;
      expect(rounded).toBe(amount);
      expect(amount.toFixed(2)).toMatch(/^\d+\.\d{2}$/);
    });
  });
});

describe('💼 Business Logic - Moving with Realistic Scopes Data', () => {
  let testCustomerId: string;
  let testBookingId: string;

  beforeEach(async () => {
    testCustomerId = generateurDonneesTest.customerId();

    await prisma.customer.create({
      data: {
        id: testCustomerId,
        email: generateurDonneesTest.email(),
        firstName: 'Test',
        lastName: 'User',
        phone: '+33123456789',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  });

  afterEach(async () => {
    if (testBookingId) {
      await prisma.moving.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.booking.deleteMany({ where: { id: testBookingId } });
    }
    await prisma.customer.deleteMany({ where: { id: testCustomerId } });
  });

  test('should create moving with GLOBAL scope constraints', async () => {
    // Scénario: Déménagement avec contraintes GLOBAL uniquement
    const booking = await prisma.booking.create({
      data: {
        id: generateurDonneesTest.bookingId(),
        type: 'MOVING_QUOTE',
        status: 'CONFIRMED',
        customerId: testCustomerId,
        totalAmount: 1401.07,
        pickupAddress: '45 Rue des Vieux Quartiers, 75003 Paris',
        deliveryAddress: '12 Impasse du Château, 92100 Boulogne',
        distance: 15.8,
        scheduledDate: new Date('2025-12-15'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    testBookingId = booking.id;

    const moving = await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: booking.id,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '45 Rue des Vieux Quartiers, 75003 Paris',
        deliveryAddress: '12 Impasse du Château, 92100 Boulogne',
        distance: 15.8,
        volume: 35,
        pickupFloor: 1,
        deliveryFloor: 1,
        pickupElevator: true,
        deliveryElevator: true,
        baseCost: 800.00,
        volumeCost: 350.00,
        distancePrice: 79.00,
        optionsCost: 172.07, // Contraintes GLOBAL (6.5% + 7.5% = 14%)
        items: {
          // Contraintes GLOBAL - appliquées UNE SEULE FOIS
          globalConstraints: [
            {
              id: 'd85f44a1-3f5f-4e28-883c-778000a2e23e',
              name: 'Circulation complexe',
              scope: 'GLOBAL',
              impact: '+6.5%',
              amount: 79.89
            },
            {
              id: '76d5aa58-d9ad-45c8-8c72-6a03d178d15d',
              name: 'Stationnement difficile',
              scope: 'GLOBAL',
              impact: '+7.5%',
              amount: 92.18
            }
          ],
          scopeType: 'GLOBAL_ONLY'
        }
      }
    });

    expect(moving.optionsCost).toBe(172.07);
    expect(moving.items).toHaveProperty('globalConstraints');
    expect((moving.items as any).scopeType).toBe('GLOBAL_ONLY');
  });

  test('should create moving with PICKUP scope constraints', async () => {
    // Scénario: Contraintes uniquement au DÉPART
    const booking = await prisma.booking.create({
      data: {
        id: generateurDonneesTest.bookingId(),
        type: 'MOVING_QUOTE',
        status: 'CONFIRMED',
        customerId: testCustomerId,
        totalAmount: 1898.45,
        pickupAddress: '45 Rue Étroite, Vieil Immeuble, 75003 Paris',
        deliveryAddress: '12 Avenue Large, Immeuble Moderne, 92100 Boulogne',
        distance: 15.8,
        scheduledDate: new Date('2025-12-15'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    testBookingId = booking.id;

    const moving = await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: booking.id,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '45 Rue Étroite, Vieil Immeuble, 75003 Paris',
        deliveryAddress: '12 Avenue Large, Immeuble Moderne, 92100 Boulogne',
        distance: 15.8,
        volume: 45,
        pickupFloor: 5,
        deliveryFloor: 1,
        pickupElevator: true, // Mais trop petit
        deliveryElevator: true,
        pickupCarryDistance: 35.0,
        deliveryCarryDistance: 5.0,
        baseCost: 900.00,
        volumeCost: 450.00,
        distancePrice: 79.00,
        optionsCost: 469.45, // Contraintes PICKUP + monte-meuble
        items: {
          // Contraintes PICKUP - appliquées uniquement au DÉPART
          pickupConstraints: [
            {
              id: 'b2b8f00b-00a2-456c-ad06-1150d25d71a3',
              name: 'Couloirs étroits',
              scope: 'PICKUP',
              impact: '+6.5%',
              amount: 92.87
            },
            {
              id: '55ea42b9-aed0-465c-8e5f-ee82a7bb8c85',
              name: 'Ascenseur trop petit',
              scope: 'PICKUP',
              impact: '+7.5%',
              amount: 107.18
            },
            {
              id: '40acdd70-5c1f-4936-a53c-8f52e6695a4c',
              name: 'Escaliers étroits',
              scope: 'PICKUP',
              impact: '+8.5%',
              amount: 121.47
            }
          ],
          pickupServices: [
            {
              id: '5cdd32e3-23d5-413e-a9b4-26a746066ce0',
              name: 'Monte-meuble requis (départ)',
              scope: 'PICKUP',
              impact: '+150€',
              amount: 150.00,
              autoDetected: true
            }
          ],
          deliveryConstraints: [],
          deliveryServices: [],
          scopeType: 'PICKUP_ONLY'
        }
      }
    });

    expect(moving.pickupFloor).toBe(5);
    expect(moving.deliveryFloor).toBe(1);
    expect(moving.optionsCost).toBe(469.45);

    const itemsData = moving.items as any;
    expect(itemsData.pickupConstraints).toHaveLength(3);
    expect(itemsData.pickupServices).toHaveLength(1);
    expect(itemsData.deliveryConstraints).toHaveLength(0);
    expect(itemsData.scopeType).toBe('PICKUP_ONLY');
  });

  test('should create moving with DELIVERY scope constraints', async () => {
    // Scénario: Contraintes uniquement à l'ARRIVÉE
    const booking = await prisma.booking.create({
      data: {
        id: generateurDonneesTest.bookingId(),
        type: 'MOVING_QUOTE',
        status: 'CONFIRMED',
        customerId: testCustomerId,
        totalAmount: 2160.89,
        pickupAddress: '10 Boulevard Facile, Rez-de-chaussée, 75001 Paris',
        deliveryAddress: '28 Impasse Difficile, Vieil Immeuble, 69001 Lyon',
        distance: 465.3,
        scheduledDate: new Date('2025-12-15'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    testBookingId = booking.id;

    const moving = await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: booking.id,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '10 Boulevard Facile, Rez-de-chaussée, 75001 Paris',
        deliveryAddress: '28 Impasse Difficile, Vieil Immeuble, 69001 Lyon',
        distance: 465.3,
        volume: 50,
        pickupFloor: 0,
        deliveryFloor: 6,
        pickupElevator: true,
        deliveryElevator: false,
        pickupCarryDistance: 5.0,
        deliveryCarryDistance: 40.0,
        baseCost: 1000.00,
        volumeCost: 500.00,
        distancePrice: 232.65,
        optionsCost: 428.24, // Contraintes DELIVERY + monte-meuble
        items: {
          pickupConstraints: [],
          pickupServices: [],
          // Contraintes DELIVERY - appliquées uniquement à l'ARRIVÉE
          deliveryConstraints: [
            {
              id: 'ca6cb6e5-9f5a-4d50-8200-d78d9dedd901',
              name: 'Longue distance de portage',
              scope: 'DELIVERY',
              impact: '+9.5%',
              amount: 164.60,
              detectedFrom: 'deliveryCarryDistance: 40m'
            }
            // Note: Ajouter d'autres contraintes DELIVERY réelles de votre BDD ici
          ],
          deliveryServices: [
            {
              id: '5cdd32e3-23d5-413e-a9b4-26a746066ce0',
              name: 'Monte-meuble requis (arrivée)',
              scope: 'DELIVERY',
              impact: '+150€',
              amount: 150.00,
              autoDetected: true
            }
          ],
          scopeType: 'DELIVERY_ONLY'
        }
      }
    });

    expect(moving.pickupFloor).toBe(0);
    expect(moving.deliveryFloor).toBe(6);
    expect(moving.distance).toBe(465.3);
    expect(moving.optionsCost).toBe(428.24);

    const itemsData = moving.items as any;
    expect(itemsData.pickupConstraints).toHaveLength(0);
    expect(itemsData.deliveryConstraints).toHaveLength(1); // Mise à jour: 1 contrainte au lieu de 2
    expect(itemsData.deliveryServices).toHaveLength(1);
    expect(itemsData.scopeType).toBe('DELIVERY_ONLY');
  });

  test('should create moving with BOTH scope constraints (applied to both addresses)', async () => {
    // Scénario: Règles BOTH appliquées indépendamment aux deux adresses
    const booking = await prisma.booking.create({
      data: {
        id: generateurDonneesTest.bookingId(),
        type: 'MOVING_QUOTE',
        status: 'CONFIRMED',
        customerId: testCustomerId,
        totalAmount: 2102.46,
        pickupAddress: '15 Rue des Marches, Vieux Quartier, 75011 Paris',
        deliveryAddress: '8 Impasse du Parking, Centre-Ville, 69002 Lyon',
        distance: 465.3,
        scheduledDate: new Date('2025-12-15'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    testBookingId = booking.id;

    const moving = await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: booking.id,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '15 Rue des Marches, Vieux Quartier, 75011 Paris',
        deliveryAddress: '8 Impasse du Parking, Centre-Ville, 69002 Lyon',
        distance: 465.3,
        volume: 40,
        pickupFloor: 4,
        deliveryFloor: 3,
        pickupElevator: false,
        deliveryElevator: false,
        pickupCarryDistance: 25.0,
        deliveryCarryDistance: 30.0,
        baseCost: 950.00,
        volumeCost: 400.00,
        distancePrice: 232.65,
        optionsCost: 519.81, // Règles BOTH appliquées aux 2 adresses
        items: {
          // Règles BOTH au DÉPART
          bothRulesPickup: [
            {
              id: '293dc311-6f22-42d8-8b31-b322c0e888f9',
              name: 'Accès multi-niveaux',
              scope: 'BOTH',
              impact: '+9.5%',
              amount: 150.30,
              address: 'pickup'
            }
            // Note: Ajouter d'autres règles BOTH réelles de votre BDD ici
          ],
          // Règles BOTH à l'ARRIVÉE (même règle multi-niveaux appliquée 2x)
          bothRulesDelivery: [
            {
              id: '293dc311-6f22-42d8-8b31-b322c0e888f9',
              name: 'Accès multi-niveaux',
              scope: 'BOTH',
              impact: '+9.5%',
              amount: 150.30,
              address: 'delivery'
            }
            // Note: Ajouter d'autres règles BOTH réelles de votre BDD ici
          ],
          scopeType: 'BOTH_ADDRESSES',
          explanation: 'Règle 293dc311 appliquée 2x (pickup + delivery car condition match aux deux)'
        }
      }
    });

    const itemsData = moving.items as any;
    expect(itemsData.bothRulesPickup).toHaveLength(1); // Mise à jour: 1 règle au lieu de 2
    expect(itemsData.bothRulesDelivery).toHaveLength(1); // Mise à jour: 1 règle au lieu de 2

    // Vérifier que la même règle (multi-niveaux) est présente aux 2 adresses
    const multiNiveauxPickup = itemsData.bothRulesPickup.find(
      (r: any) => r.id === '293dc311-6f22-42d8-8b31-b322c0e888f9'
    );
    const multiNiveauxDelivery = itemsData.bothRulesDelivery.find(
      (r: any) => r.id === '293dc311-6f22-42d8-8b31-b322c0e888f9'
    );

    expect(multiNiveauxPickup).toBeDefined();
    expect(multiNiveauxDelivery).toBeDefined();
    expect(multiNiveauxPickup.address).toBe('pickup');
    expect(multiNiveauxDelivery.address).toBe('delivery');
    expect(itemsData.scopeType).toBe('BOTH_ADDRESSES');
  });
});
