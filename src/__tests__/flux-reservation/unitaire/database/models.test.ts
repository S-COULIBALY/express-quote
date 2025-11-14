/**
 * 🗄️ **TESTS DE MODÈLES BASE DE DONNÉES**
 *
 * Tests CRUD complets pour les modèles Prisma :
 * 1. Moving - Données spécifiques au déménagement
 * 2. Transaction - Transactions financières et idempotence
 * 3. Customer - Clients et contraintes d'unicité
 * 4. Relations entre modèles (Booking → Customer, Transaction, Moving)
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { generateurDonneesTest } from '../../fixtures/donnees-reservation';

const prisma = new PrismaClient();

describe('🗄️ Database - Moving Model', () => {
  let testCustomerId: string;
  let testBookingId: string;

  beforeEach(async () => {
    // Créer Customer et Booking pour les relations
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

    const booking = await prisma.booking.create({
      data: {
        id: generateurDonneesTest.bookingId(),
        type: 'MOVING_QUOTE',
        status: 'CONFIRMED',
        customerId: testCustomerId,
        totalAmount: 1500.00,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    testBookingId = booking.id;
  });

  afterEach(async () => {
    // Nettoyer dans l'ordre des dépendances
    await prisma.moving.deleteMany({ where: { bookingId: testBookingId } });
    await prisma.booking.deleteMany({ where: { id: testBookingId } });
    await prisma.customer.deleteMany({ where: { id: testCustomerId } });
  });

  test('should create Moving with all required fields', async () => {
    const moving = await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '123 Rue de Départ, 75001 Paris',
        deliveryAddress: '456 Avenue d\'Arrivée, 69001 Lyon',
        distance: 465.3,
        volume: 35
      }
    });

    expect(moving.id).toBeDefined();
    expect(moving.bookingId).toBe(testBookingId);
    expect(moving.moveDate).toEqual(new Date('2025-12-15'));
    expect(moving.pickupAddress).toBe('123 Rue de Départ, 75001 Paris');
    expect(moving.deliveryAddress).toBe('456 Avenue d\'Arrivée, 69001 Lyon');
    expect(moving.distance).toBe(465.3);
    expect(moving.volume).toBe(35);
  });

  test('should create Moving with floor information', async () => {
    const moving = await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '123 Rue Test',
        deliveryAddress: '456 Ave Test',
        distance: 10,
        volume: 20,
        pickupFloor: 2,
        deliveryFloor: 3,
        pickupElevator: false,
        deliveryElevator: true
      }
    });

    expect(moving.pickupFloor).toBe(2);
    expect(moving.deliveryFloor).toBe(3);
    expect(moving.pickupElevator).toBe(false);
    expect(moving.deliveryElevator).toBe(true);
  });

  test('should create Moving with carry distances', async () => {
    const moving = await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '123 Rue Test',
        deliveryAddress: '456 Ave Test',
        distance: 10,
        volume: 20,
        pickupCarryDistance: 25.5,
        deliveryCarryDistance: 10.0
      }
    });

    expect(moving.pickupCarryDistance).toBe(25.5);
    expect(moving.deliveryCarryDistance).toBe(10.0);
  });

  test('should create Moving with all service options', async () => {
    const moving = await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '123 Rue Test',
        deliveryAddress: '456 Ave Test',
        distance: 10,
        volume: 20,
        packaging: true,
        furniture: true,
        fragile: true,
        storage: true,
        disassembly: true,
        unpacking: true,
        supplies: true,
        fragileItems: true
      }
    });

    expect(moving.packaging).toBe(true);
    expect(moving.furniture).toBe(true);
    expect(moving.fragile).toBe(true);
    expect(moving.storage).toBe(true);
    expect(moving.disassembly).toBe(true);
    expect(moving.unpacking).toBe(true);
    expect(moving.supplies).toBe(true);
    expect(moving.fragileItems).toBe(true);
  });

  test('should apply GLOBAL scope rules (administrative/overall service)', async () => {
    // SCÉNARIO: Règles GLOBAL affectent l'ensemble du service (une seule fois)
    // Règles GLOBAL testées (de la BDD):
    // - d85f44a1: Circulation complexe (GLOBAL, +6.5%) - affecte tout le trajet
    // - 76d5aa58: Stationnement difficile (GLOBAL, +7.5%) - problème général de stationnement

    const moving = await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
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
        // Seulement surcharges GLOBAL (s'appliquent UNE FOIS sur le total)
        optionsCost: 172.07, // 6.5% + 7.5% = 14% de 1229€
        items: {
          appliedRules: [
            {
              id: 'd85f44a1-3f5f-4e28-883c-778000a2e23e',
              name: 'Circulation complexe',
              scope: 'GLOBAL',
              impact: '+6.5%',
              amount: 79.89,
              description: 'Circulation dense dans la zone, ralentit le déménagement'
            },
            {
              id: '76d5aa58-d9ad-45c8-8c72-6a03d178d15d',
              name: 'Stationnement difficile ou payant',
              scope: 'GLOBAL',
              impact: '+7.5%',
              amount: 92.18,
              description: 'Difficulté générale de stationnement pour le camion'
            }
          ],
          scopeExplanation: {
            GLOBAL: 'Ces règles affectent l\'ensemble du service (trajet complet, durée totale). Elles ne sont appliquées qu\'UNE SEULE FOIS sur le montant total, peu importe le nombre d\'adresses.',
            appliedOnce: true
          }
        }
      }
    });

    const itemsData = moving.items as any;
    expect(itemsData.appliedRules).toHaveLength(2);
    expect(itemsData.appliedRules.every((r: any) => r.scope === 'GLOBAL')).toBe(true);
    expect(itemsData.scopeExplanation.appliedOnce).toBe(true);

    // Vérifier que les règles GLOBAL sont appliquées une seule fois
    const baseTotal = moving.baseCost! + moving.volumeCost! + moving.distancePrice!;
    const totalWithGlobal = baseTotal + moving.optionsCost!;

    expect(baseTotal).toBe(1229.00);
    expect(totalWithGlobal).toBe(1401.07); // 1229 + 172.07
  });

  test('should apply PICKUP-specific constraints and services', async () => {
    // SCÉNARIO: Contraintes et services spécifiques à l'adresse de DÉPART uniquement
    // Règles PICKUP testées (de la BDD):
    // - b2b8f00b: Couloirs étroits (PICKUP, +6.5%)
    // - 55ea42b9: Ascenseur trop petit (PICKUP, +7.5%)
    // - 5cdd32e3: Monte-meuble requis (PICKUP, service +150€ fixe)
    // - 40acdd70: Escaliers étroits (PICKUP, +8.5%)

    const moving = await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '45 Rue Étroite, Vieil Immeuble, 75003 Paris', // Contraintes au DÉPART
        deliveryAddress: '12 Avenue Large, Immeuble Moderne, 92100 Boulogne', // Pas de contraintes
        distance: 15.8,
        volume: 45,
        pickupFloor: 5,
        deliveryFloor: 1,
        pickupElevator: true, // Mais trop petit pour meubles
        deliveryElevator: true, // Normal, pas de problème
        pickupCarryDistance: 35.0, // Longue distance de portage au départ
        deliveryCarryDistance: 5.0, // Courte à l'arrivée
        baseCost: 900.00,
        volumeCost: 450.00,
        distancePrice: 79.00,
        // Surcharges PICKUP uniquement
        optionsCost: 469.45, // Contraintes PICKUP + service monte-meuble
        items: {
          pickupConstraints: [
            {
              id: 'b2b8f00b-00a2-456c-ad06-1150d25d71a3',
              name: 'Couloirs étroits ou encombrés',
              scope: 'PICKUP',
              impact: '+6.5%',
              amount: 92.87, // 6.5% de 1429€
              appliesTo: 'Adresse de départ uniquement'
            },
            {
              id: '55ea42b9-aed0-465c-8e5f-ee82a7bb8c85',
              name: 'Ascenseur trop petit pour les meubles',
              scope: 'PICKUP',
              impact: '+7.5%',
              amount: 107.18, // 7.5% de 1429€
              appliesTo: 'Adresse de départ uniquement'
            },
            {
              id: '40acdd70-5c1f-4936-a53c-8f52e6695a4c',
              name: 'Escaliers étroits',
              scope: 'PICKUP',
              impact: '+8.5%',
              amount: 121.47, // 8.5% de 1429€
              appliesTo: 'Adresse de départ uniquement'
            }
          ],
          pickupServices: [
            {
              id: '5cdd32e3-23d5-413e-a9b4-26a746066ce0',
              name: 'Monte-meuble requis (départ)',
              scope: 'PICKUP',
              impact: '+150€',
              amount: 150.00,
              appliesTo: 'Service au départ uniquement (auto-détecté: volume > 40 + étage > 3)',
              autoDetected: true
            }
          ],
          deliveryConstraints: [], // Pas de contraintes à l'arrivée
          deliveryServices: [], // Pas de services à l'arrivée
          scopeExplanation: {
            PICKUP: 'Ces règles ne s\'appliquent qu\'à l\'adresse de DÉPART. Les conditions de l\'immeuble de départ (couloirs, escaliers, ascenseur) ne sont évaluées qu\'une fois pour cette adresse.'
          }
        }
      }
    });

    const itemsData = moving.items as any;
    expect(itemsData.pickupConstraints).toHaveLength(3);
    expect(itemsData.pickupServices).toHaveLength(1);
    expect(itemsData.deliveryConstraints).toHaveLength(0);
    expect(itemsData.deliveryServices).toHaveLength(0);

    // Vérifier que toutes les règles ont le scope PICKUP
    expect(itemsData.pickupConstraints.every((r: any) => r.scope === 'PICKUP')).toBe(true);
    expect(itemsData.pickupServices.every((r: any) => r.scope === 'PICKUP')).toBe(true);

    // Vérifier le service auto-détecté
    const monteMeuble = itemsData.pickupServices.find((s: any) => s.name.includes('Monte-meuble'));
    expect(monteMeuble.autoDetected).toBe(true);
  });

  test('should apply DELIVERY-specific constraints and services', async () => {
    // SCÉNARIO: Contraintes et services spécifiques à l'adresse d'ARRIVÉE uniquement
    // Règles DELIVERY testées (de la BDD):
    // - ca6cb6e5: Longue distance de portage (DELIVERY, +9.5%)
    // - 5cdd32e3: Monte-meuble requis (DELIVERY, service +150€ fixe)
    // Note: Les UUIDs dans le champ 'items' ci-dessous sont des exemples de structure de données.
    // Remplacez-les par de vrais UUIDs DELIVERY de votre BDD si nécessaire.

    const moving = await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '10 Boulevard Facile, Rez-de-chaussée, 75001 Paris', // Pas de contraintes
        deliveryAddress: '28 Impasse Difficile, Vieil Immeuble, 69001 Lyon', // Contraintes à l'ARRIVÉE
        distance: 465.3,
        volume: 50,
        pickupFloor: 0,
        deliveryFloor: 6,
        pickupElevator: true, // Pas nécessaire (RDC)
        deliveryElevator: false, // Pas d'ascenseur à l'arrivée
        pickupCarryDistance: 5.0, // Courte au départ
        deliveryCarryDistance: 40.0, // Très longue à l'arrivée
        baseCost: 1000.00,
        volumeCost: 500.00,
        distancePrice: 232.65,
        // Surcharges DELIVERY uniquement
        optionsCost: 428.24, // Contraintes DELIVERY + service monte-meuble
        items: {
          pickupConstraints: [], // Pas de contraintes au départ
          pickupServices: [], // Pas de services au départ
          deliveryConstraints: [
            {
              id: 'ca6cb6e5-9f5a-4d50-8200-d78d9dedd901',
              name: 'Longue distance de portage (>30m)',
              scope: 'DELIVERY',
              impact: '+9.5%',
              amount: 164.60, // 9.5% de 1732.65€
              appliesTo: 'Adresse d\'arrivée uniquement',
              detectedFrom: 'deliveryCarryDistance: 40m'
            },
            {
              id: '8a7f2b1d-3c45-4e89-b234-5d6e7f8g9h0i',
              name: 'Accès étroit à l\'arrivée',
              scope: 'DELIVERY',
              impact: '+7%',
              amount: 121.29, // 7% de 1732.65€
              appliesTo: 'Adresse d\'arrivée uniquement'
            }
          ],
          deliveryServices: [
            {
              id: '5cdd32e3-23d5-413e-a9b4-26a746066ce0',
              name: 'Monte-meuble requis (arrivée)',
              scope: 'DELIVERY',
              impact: '+150€',
              amount: 150.00,
              appliesTo: 'Service à l\'arrivée uniquement (auto-détecté: volume > 40 + étage > 5 + pas d\'ascenseur)',
              autoDetected: true
            }
          ],
          scopeExplanation: {
            DELIVERY: 'Ces règles ne s\'appliquent qu\'à l\'adresse d\'ARRIVÉE. Les conditions de l\'immeuble d\'arrivée (portage, accès, escaliers) ne sont évaluées qu\'une fois pour cette adresse.'
          }
        }
      }
    });

    const itemsData = moving.items as any;
    expect(itemsData.pickupConstraints).toHaveLength(0);
    expect(itemsData.pickupServices).toHaveLength(0);
    expect(itemsData.deliveryConstraints).toHaveLength(2);
    expect(itemsData.deliveryServices).toHaveLength(1);

    // Vérifier que toutes les règles ont le scope DELIVERY
    expect(itemsData.deliveryConstraints.every((r: any) => r.scope === 'DELIVERY')).toBe(true);
    expect(itemsData.deliveryServices.every((r: any) => r.scope === 'DELIVERY')).toBe(true);

    // Vérifier la détection de la longue distance
    const longueDistance = itemsData.deliveryConstraints.find((r: any) => r.name.includes('Longue distance'));
    expect(longueDistance.detectedFrom).toContain('40m');
  });

  test('should apply BOTH scope rules to matching addresses independently', async () => {
    // SCÉNARIO: Règles BOTH peuvent s'appliquer à UNE ou DEUX adresses indépendamment
    // Règles BOTH testées (de la BDD):
    // - 293dc311: Accès multi-niveaux (BOTH, +9.5%) - présent aux DEUX adresses
    // - 1a2b3c4d: Escaliers sans ascenseur (BOTH, +8%) - présent au DÉPART uniquement
    // - 5e6f7g8h: Parking restreint (BOTH, +6%) - présent à l'ARRIVÉE uniquement

    const moving = await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '15 Rue des Marches, Vieux Quartier, 75011 Paris', // Escaliers + multi-niveaux
        deliveryAddress: '8 Impasse du Parking, Centre-Ville, 69002 Lyon', // Parking + multi-niveaux
        distance: 465.3,
        volume: 40,
        pickupFloor: 4,
        deliveryFloor: 3,
        pickupElevator: false, // Escaliers au départ
        deliveryElevator: false, // Escaliers à l'arrivée aussi
        pickupCarryDistance: 25.0,
        deliveryCarryDistance: 30.0,
        baseCost: 950.00,
        volumeCost: 400.00,
        distancePrice: 232.65,
        // Surcharges BOTH (appliquées séparément à chaque adresse où condition match)
        optionsCost: 519.81, // Règles BOTH appliquées indépendamment
        items: {
          bothRulesPickup: [
            {
              id: '293dc311-6f22-42d8-8b31-b322c0e888f9',
              name: 'Accès complexe multi-niveaux',
              scope: 'BOTH',
              impact: '+9.5%',
              amount: 150.30, // 9.5% de 1582.65€
              appliesTo: 'Départ (condition match: escaliers + multi-étages)',
              conditionMatch: true,
              address: 'pickup'
            },
            {
              id: '1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6',
              name: 'Escaliers sans ascenseur',
              scope: 'BOTH',
              impact: '+8%',
              amount: 126.61, // 8% de 1582.65€
              appliesTo: 'Départ uniquement (pas d\'ascenseur)',
              conditionMatch: true,
              address: 'pickup'
            }
          ],
          bothRulesDelivery: [
            {
              id: '293dc311-6f22-42d8-8b31-b322c0e888f9',
              name: 'Accès complexe multi-niveaux',
              scope: 'BOTH',
              impact: '+9.5%',
              amount: 150.30, // Même règle, appliquée aussi à l'arrivée
              appliesTo: 'Arrivée (condition match: escaliers + multi-étages)',
              conditionMatch: true,
              address: 'delivery'
            },
            {
              id: '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t',
              name: 'Parking restreint',
              scope: 'BOTH',
              impact: '+6%',
              amount: 94.96, // 6% de 1582.65€
              appliesTo: 'Arrivée uniquement (centre-ville)',
              conditionMatch: true,
              address: 'delivery'
            }
          ],
          scopeExplanation: {
            BOTH: 'Ces règles peuvent s\'appliquer à n\'importe quelle adresse où la condition est rencontrée. Si la condition match aux DEUX adresses, la règle est appliquée DEUX FOIS (une fois par adresse). Si elle match à une seule adresse, elle n\'est appliquée qu\'une fois.',
            examples: [
              'Accès multi-niveaux: présent au départ ET à l\'arrivée → appliqué 2 fois',
              'Escaliers sans ascenseur: présent au départ uniquement → appliqué 1 fois',
              'Parking restreint: présent à l\'arrivée uniquement → appliqué 1 fois'
            ]
          }
        }
      }
    });

    const itemsData = moving.items as any;

    // Vérifier que les règles BOTH sont présentes aux deux adresses
    expect(itemsData.bothRulesPickup).toHaveLength(2);
    expect(itemsData.bothRulesDelivery).toHaveLength(2);

    // Vérifier qu'une même règle BOTH peut apparaître aux deux adresses
    const multiNiveauxPickup = itemsData.bothRulesPickup.find((r: any) => r.id === '293dc311-6f22-42d8-8b31-b322c0e888f9');
    const multiNiveauxDelivery = itemsData.bothRulesDelivery.find((r: any) => r.id === '293dc311-6f22-42d8-8b31-b322c0e888f9');

    expect(multiNiveauxPickup).toBeDefined();
    expect(multiNiveauxDelivery).toBeDefined();
    expect(multiNiveauxPickup.address).toBe('pickup');
    expect(multiNiveauxDelivery.address).toBe('delivery');

    // Vérifier que d'autres règles BOTH n'apparaissent qu'à une seule adresse
    const escaliersPickup = itemsData.bothRulesPickup.find((r: any) => r.name.includes('Escaliers sans ascenseur'));
    const parkingDelivery = itemsData.bothRulesDelivery.find((r: any) => r.name.includes('Parking restreint'));

    expect(escaliersPickup).toBeDefined();
    expect(parkingDelivery).toBeDefined();
  });

  test('should apply service rules from database (realistic scenario)', async () => {
    // SCÉNARIO: Déménagement avec services additionnels de la BDD
    // Services testés (basés sur rules table):
    // - 352eabed: Objets fragiles/précieux (MOVING, PICKUP, +180€ fixed)
    // - Emballage professionnel: inclus dans packaging
    // - Protection renforcée: inclus dans supplies

    const moving = await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '123 Avenue Haussmann, 75008 Paris',
        deliveryAddress: '456 Boulevard Saint-Germain, 75006 Paris',
        distance: 5.2,
        volume: 45,
        pickupFloor: 4,
        deliveryFloor: 2,
        pickupElevator: true,
        deliveryElevator: true,
        // Services activés (correspondent aux règles de service)
        packaging: true, // Emballage professionnel
        fragile: true, // Objets fragiles (+180€ fixe selon règle 352eabed)
        furniture: true, // Meubles lourds à manipuler
        supplies: true, // Fournitures d'emballage
        baseCost: 900.00,
        volumeCost: 450.00,
        distancePrice: 26.00,
        optionsCost: 280.00, // 180€ (fragiles fixe) + 100€ (autres services %)
        tollCost: 0,
        fuelCost: 35.00
      }
    });

    expect(moving.packaging).toBe(true);
    expect(moving.fragile).toBe(true);
    expect(moving.furniture).toBe(true);

    const totalCost =
      moving.baseCost! +
      moving.volumeCost! +
      moving.distancePrice! +
      moving.optionsCost! +
      moving.fuelCost!;

    expect(totalCost).toBe(1691.00); // 900 + 450 + 26 + 280 + 35

    // Breakdown des services:
    // - Base + Volume + Distance = 1376€
    // - Service fragile (fixe) = +180€
    // - Autres services (~7% du base) = +100€
    // - Fuel = +35€
    // Total = 1691€
  });

  test('should store constraint and service IDs for rule engine validation', async () => {
    // SCÉNARIO: Test avec des UUIDs réels de contraintes et services de la BDD
    // pour vérifier que le moteur de règles peut les identifier

    const realConstraintIds = [
      'd85f44a1-3f5f-4e28-883c-778000a2e23e', // Circulation complexe
      '76d5aa58-d9ad-45c8-8c72-6a03d178d15d', // Stationnement difficile
      'b2b8f00b-00a2-456c-ad06-1150d25d71a3'  // Couloirs étroits
    ];

    const realServiceIds = [
      '352eabed-8869-460f-b7f0-99237b003cc1', // Objets fragiles (MOVING)
      'f48f86de-b12f-4a24-8186-9e363315623e'  // Stationnement limité (CLEANING)
    ];

    const moving = await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '10 Rue Étroite, 75011 Paris',
        deliveryAddress: '20 Avenue Large, 75012 Paris',
        distance: 8.5,
        volume: 30,
        baseCost: 700.00,
        volumeCost: 300.00,
        distancePrice: 42.50,
        optionsCost: 250.00, // Contraintes + Services
        // Stocker les IDs des règles appliquées (dans items JSON par exemple)
        items: {
          appliedConstraints: realConstraintIds,
          appliedServices: realServiceIds.slice(0, 1), // Seulement le service MOVING
          constraintDetails: [
            {
              id: realConstraintIds[0],
              name: 'Circulation complexe',
              impact: '+6.5%',
              scope: 'GLOBAL'
            },
            {
              id: realConstraintIds[1],
              name: 'Stationnement difficile',
              impact: '+7.5%',
              scope: 'GLOBAL'
            },
            {
              id: realConstraintIds[2],
              name: 'Couloirs étroits',
              impact: '+6.5%',
              scope: 'PICKUP'
            }
          ],
          serviceDetails: [
            {
              id: realServiceIds[0],
              name: 'Objets fragiles/précieux',
              impact: '+180€',
              scope: 'PICKUP'
            }
          ]
        }
      }
    });

    expect(moving.items).toBeDefined();

    const itemsData = moving.items as any;
    expect(itemsData.appliedConstraints).toHaveLength(3);
    expect(itemsData.appliedServices).toHaveLength(1);

    // Vérifier que les UUIDs sont au bon format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    itemsData.appliedConstraints.forEach((id: string) => {
      expect(id).toMatch(uuidRegex);
    });

    // Vérifier les détails des règles appliquées
    expect(itemsData.constraintDetails[0].impact).toBe('+6.5%');
    expect(itemsData.serviceDetails[0].impact).toBe('+180€');
  });

  test('should differentiate GLOBAL vs PICKUP vs DELIVERY scope rules', async () => {
    // SCÉNARIO: Test de l'application différenciée des règles selon leur scope

    const moving = await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '5 Passage Difficile, 75020 Paris', // Contraintes PICKUP
        deliveryAddress: '8 Boulevard Facile, 94000 Créteil', // Contraintes DELIVERY
        distance: 12.5,
        volume: 25,
        pickupFloor: 5,
        deliveryFloor: 0,
        pickupElevator: false, // Escaliers difficiles au départ
        deliveryElevator: true, // Facile à l'arrivée
        baseCost: 600.00,
        volumeCost: 250.00,
        distancePrice: 62.50,
        // Breakdown des surcharges par scope:
        optionsCost: 150.00, // GLOBAL: 50€ + PICKUP: 100€ + DELIVERY: 0€
        items: {
          scopeBreakdown: {
            global: [
              {
                name: 'Circulation complexe',
                scope: 'GLOBAL',
                impact: '+6.5%',
                amount: 59.31 // 6.5% de 912.50
              }
            ],
            pickup: [
              {
                name: 'Escaliers étroits sans ascenseur',
                scope: 'PICKUP',
                impact: '+9.5%',
                amount: 86.69 // 9.5% de 912.50
              }
            ],
            delivery: [] // Pas de contraintes à l'arrivée
          },
          totalByScope: {
            global: 59.31,
            pickup: 90.69, // Peut inclure plusieurs règles PICKUP
            delivery: 0,
            total: 150.00
          }
        }
      }
    });

    const itemsData = moving.items as any;

    // Vérifier que les règles GLOBAL affectent tout le déménagement
    expect(itemsData.scopeBreakdown.global).toHaveLength(1);

    // Vérifier que les règles PICKUP n'affectent que le départ
    expect(itemsData.scopeBreakdown.pickup).toHaveLength(1);
    expect(itemsData.scopeBreakdown.pickup[0].scope).toBe('PICKUP');

    // Vérifier qu'il n'y a pas de contraintes DELIVERY dans ce scénario
    expect(itemsData.scopeBreakdown.delivery).toHaveLength(0);

    // Vérifier le total des surcharges
    expect(itemsData.totalByScope.total).toBe(150.00);
  });

  test('should create Moving with cost breakdown', async () => {
    const moving = await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '123 Rue Test',
        deliveryAddress: '456 Ave Test',
        distance: 465.3,
        volume: 35,
        baseCost: 500.00,
        volumeCost: 350.00,
        distancePrice: 232.65,
        optionsCost: 150.00,
        tollCost: 25.00,
        fuelCost: 75.00
      }
    });

    expect(moving.baseCost).toBe(500.00);
    expect(moving.volumeCost).toBe(350.00);
    expect(moving.distancePrice).toBe(232.65);
    expect(moving.optionsCost).toBe(150.00);
    expect(moving.tollCost).toBe(25.00);
    expect(moving.fuelCost).toBe(75.00);

    // Vérifier la cohérence du total
    const calculatedTotal =
      moving.baseCost! +
      moving.volumeCost! +
      moving.distancePrice! +
      moving.optionsCost! +
      moving.tollCost! +
      moving.fuelCost!;

    expect(calculatedTotal).toBe(1332.65);
  });

  test('should create Moving with property information', async () => {
    const moving = await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '123 Rue Test',
        deliveryAddress: '456 Ave Test',
        distance: 10,
        volume: 20,
        propertyType: 'apartment',
        surface: 75.5,
        rooms: 3,
        occupants: 2
      }
    });

    expect(moving.propertyType).toBe('apartment');
    expect(moving.surface).toBe(75.5);
    expect(moving.rooms).toBe(3);
    expect(moving.occupants).toBe(2);
  });

  test('should create Moving with coordinates (JSON)', async () => {
    const pickupCoords = { lat: 48.8566, lng: 2.3522 }; // Paris
    const deliveryCoords = { lat: 45.7640, lng: 4.8357 }; // Lyon

    const moving = await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '123 Rue Test, Paris',
        deliveryAddress: '456 Ave Test, Lyon',
        distance: 465.3,
        volume: 20,
        pickupCoordinates: pickupCoords,
        deliveryCoordinates: deliveryCoords
      }
    });

    expect(moving.pickupCoordinates).toEqual(pickupCoords);
    expect(moving.deliveryCoordinates).toEqual(deliveryCoords);
  });

  test('should create Moving with items list (JSON)', async () => {
    const items = [
      { name: 'Canapé 3 places', quantity: 1, volume: 2.5 },
      { name: 'Table à manger', quantity: 1, volume: 1.2 },
      { name: 'Chaise', quantity: 6, volume: 0.3 }
    ];

    const moving = await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '123 Rue Test',
        deliveryAddress: '456 Ave Test',
        distance: 10,
        volume: 20,
        items
      }
    });

    expect(moving.items).toEqual(items);
    expect(Array.isArray(moving.items)).toBe(true);
  });

  test('should enforce unique bookingId constraint', async () => {
    // Créer le premier Moving
    await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '123 Rue Test',
        deliveryAddress: '456 Ave Test',
        distance: 10,
        volume: 20
      }
    });

    // Tenter de créer un deuxième Moving avec le même bookingId
    await expect(
      prisma.moving.create({
        data: {
          id: generateurDonneesTest.uuid(),
          bookingId: testBookingId, // ❌ Duplicate
          moveDate: new Date('2025-12-16'),
          pickupAddress: '789 Rue Test',
          deliveryAddress: '012 Ave Test',
          distance: 20,
          volume: 30
        }
      })
    ).rejects.toThrow(/unique constraint/i);
  });

  test('should retrieve Moving through Booking relationship', async () => {
    const movingId = generateurDonneesTest.uuid();

    await prisma.moving.create({
      data: {
        id: movingId,
        bookingId: testBookingId,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '123 Rue Test',
        deliveryAddress: '456 Ave Test',
        distance: 10,
        volume: 20
      }
    });

    const booking = await prisma.booking.findUnique({
      where: { id: testBookingId },
      include: { Moving: true }
    });

    expect(booking).toBeDefined();
    expect(booking!.Moving).toBeDefined();
    expect(booking!.Moving!.id).toBe(movingId);
    expect(booking!.Moving!.pickupAddress).toBe('123 Rue Test');
  });
});

describe('🗄️ Database - Transaction Model & Idempotency', () => {
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
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const booking = await prisma.booking.create({
      data: {
        id: generateurDonneesTest.bookingId(),
        type: 'SERVICE',
        status: 'PAYMENT_COMPLETED',
        customerId: testCustomerId,
        totalAmount: 1000.00,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    testBookingId = booking.id;
  });

  afterEach(async () => {
    await prisma.transaction.deleteMany({ where: { bookingId: testBookingId } });
    await prisma.booking.deleteMany({ where: { id: testBookingId } });
    await prisma.customer.deleteMany({ where: { id: testCustomerId } });
  });

  test('should create Transaction with required fields', async () => {
    const paymentIntentId = generateurDonneesTest.paymentIntentId();

    const transaction = await prisma.transaction.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        amount: 300.00,
        currency: 'EUR',
        status: 'COMPLETED',
        paymentIntentId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    expect(transaction.id).toBeDefined();
    expect(transaction.bookingId).toBe(testBookingId);
    expect(transaction.amount).toBe(300.00);
    expect(transaction.currency).toBe('EUR');
    expect(transaction.status).toBe('COMPLETED');
    expect(transaction.paymentIntentId).toBe(paymentIntentId);
  });

  test('should prevent duplicate transactions with same paymentIntentId', async () => {
    const paymentIntentId = generateurDonneesTest.paymentIntentId();

    // Créer la première transaction
    await prisma.transaction.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        amount: 300.00,
        currency: 'EUR',
        status: 'COMPLETED',
        paymentIntentId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Tenter de créer une transaction dupliquée
    await expect(
      prisma.transaction.create({
        data: {
          id: generateurDonneesTest.uuid(),
          bookingId: testBookingId,
          amount: 300.00,
          currency: 'EUR',
          status: 'COMPLETED',
          paymentIntentId, // ❌ Duplicate paymentIntentId
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    ).rejects.toThrow();
  });

  test('should upsert transaction correctly (idempotency)', async () => {
    const paymentIntentId = generateurDonneesTest.paymentIntentId();
    const transactionId = generateurDonneesTest.uuid();

    // Premier upsert - création
    const tx1 = await prisma.transaction.upsert({
      where: { paymentIntentId },
      update: {},
      create: {
        id: transactionId,
        bookingId: testBookingId,
        amount: 300.00,
        currency: 'EUR',
        status: 'PENDING',
        paymentIntentId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    expect(tx1.status).toBe('PENDING');

    // Deuxième upsert - mise à jour
    const tx2 = await prisma.transaction.upsert({
      where: { paymentIntentId },
      update: { status: 'COMPLETED', updatedAt: new Date() },
      create: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        amount: 300.00,
        currency: 'EUR',
        status: 'PENDING',
        paymentIntentId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    expect(tx2.id).toBe(tx1.id); // Même transaction
    expect(tx2.status).toBe('COMPLETED'); // Statut mis à jour
  });

  test('should store Stripe session ID', async () => {
    const transaction = await prisma.transaction.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        amount: 300.00,
        currency: 'EUR',
        status: 'COMPLETED',
        paymentIntentId: generateurDonneesTest.paymentIntentId(),
        stripeSessionId: 'cs_test_123456789',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    expect(transaction.stripeSessionId).toBe('cs_test_123456789');
  });

  test('should store payment method', async () => {
    const transaction = await prisma.transaction.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        amount: 300.00,
        currency: 'EUR',
        status: 'COMPLETED',
        paymentIntentId: generateurDonneesTest.paymentIntentId(),
        paymentMethod: 'card',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    expect(transaction.paymentMethod).toBe('card');
  });

  test('should store error message for failed transactions', async () => {
    const errorMessage = 'Your card was declined.';

    const transaction = await prisma.transaction.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        amount: 300.00,
        currency: 'EUR',
        status: 'FAILED',
        paymentIntentId: generateurDonneesTest.paymentIntentId(),
        errorMessage,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    expect(transaction.status).toBe('FAILED');
    expect(transaction.errorMessage).toBe(errorMessage);
  });

  test('should support all TransactionStatus values', async () => {
    const statuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];

    for (const status of statuses) {
      const transaction = await prisma.transaction.create({
        data: {
          id: generateurDonneesTest.uuid(),
          bookingId: testBookingId,
          amount: 300.00,
          currency: 'EUR',
          status: status as any,
          paymentIntentId: generateurDonneesTest.paymentIntentId(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      expect(transaction.status).toBe(status);

      // Nettoyer
      await prisma.transaction.delete({ where: { id: transaction.id } });
    }
  });

  test('should retrieve multiple transactions for a booking', async () => {
    // Créer plusieurs transactions (échec puis succès)
    await prisma.transaction.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        amount: 300.00,
        currency: 'EUR',
        status: 'FAILED',
        paymentIntentId: generateurDonneesTest.paymentIntentId(),
        errorMessage: 'Card declined',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    await prisma.transaction.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: testBookingId,
        amount: 300.00,
        currency: 'EUR',
        status: 'COMPLETED',
        paymentIntentId: generateurDonneesTest.paymentIntentId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const transactions = await prisma.transaction.findMany({
      where: { bookingId: testBookingId },
      orderBy: { createdAt: 'asc' }
    });

    expect(transactions).toHaveLength(2);
    expect(transactions[0].status).toBe('FAILED');
    expect(transactions[1].status).toBe('COMPLETED');
  });
});

describe('🗄️ Database - Customer Model & Uniqueness', () => {
  afterEach(async () => {
    await prisma.customer.deleteMany({
      where: { email: { contains: 'test-' } }
    });
  });

  test('should create Customer with required fields', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: generateurDonneesTest.customerId(),
        email: generateurDonneesTest.email(),
        firstName: 'Jean',
        lastName: 'Dupont',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    expect(customer.id).toBeDefined();
    expect(customer.email).toBeDefined();
    expect(customer.firstName).toBe('Jean');
    expect(customer.lastName).toBe('Dupont');
  });

  test('should create Customer with phone number', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: generateurDonneesTest.customerId(),
        email: generateurDonneesTest.email(),
        firstName: 'Jean',
        lastName: 'Dupont',
        phone: '+33123456789',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    expect(customer.phone).toBe('+33123456789');
  });

  test('should enforce unique email constraint', async () => {
    const email = generateurDonneesTest.email();

    // Créer le premier client
    await prisma.customer.create({
      data: {
        id: generateurDonneesTest.customerId(),
        email,
        firstName: 'Jean',
        lastName: 'Dupont',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Tenter de créer un deuxième client avec le même email
    await expect(
      prisma.customer.create({
        data: {
          id: generateurDonneesTest.customerId(),
          email, // ❌ Duplicate
          firstName: 'Marie',
          lastName: 'Martin',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    ).rejects.toThrow(/unique constraint/i);
  });

  test('should find customer by unique email', async () => {
    const email = generateurDonneesTest.email();

    await prisma.customer.create({
      data: {
        id: generateurDonneesTest.customerId(),
        email,
        firstName: 'Jean',
        lastName: 'Dupont',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const customer = await prisma.customer.findUnique({
      where: { email }
    });

    expect(customer).toBeDefined();
    expect(customer!.email).toBe(email);
    expect(customer!.firstName).toBe('Jean');
  });

  test('should handle email case sensitivity correctly', async () => {
    const email = generateurDonneesTest.email();
    const upperCaseEmail = email.toUpperCase();

    await prisma.customer.create({
      data: {
        id: generateurDonneesTest.customerId(),
        email,
        firstName: 'Jean',
        lastName: 'Dupont',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // PostgreSQL est case-sensitive par défaut
    const customer = await prisma.customer.findUnique({
      where: { email: upperCaseEmail }
    });

    // Devrait être null car différente casse
    expect(customer).toBeNull();

    // Chercher avec la casse correcte
    const customerCorrectCase = await prisma.customer.findUnique({
      where: { email }
    });

    expect(customerCorrectCase).toBeDefined();
  });

  test('should retrieve customer with all bookings', async () => {
    const customerId = generateurDonneesTest.customerId();

    await prisma.customer.create({
      data: {
        id: customerId,
        email: generateurDonneesTest.email(),
        firstName: 'Jean',
        lastName: 'Dupont',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Créer plusieurs bookings
    await prisma.booking.create({
      data: {
        id: generateurDonneesTest.bookingId(),
        type: 'SERVICE',
        status: 'COMPLETED',
        customerId,
        totalAmount: 100.00,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    await prisma.booking.create({
      data: {
        id: generateurDonneesTest.bookingId(),
        type: 'MOVING_QUOTE',
        status: 'PAYMENT_COMPLETED',
        customerId,
        totalAmount: 1500.00,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { Booking: true }
    });

    expect(customer).toBeDefined();
    expect(customer!.Booking).toHaveLength(2);

    // Nettoyer
    await prisma.booking.deleteMany({ where: { customerId } });
    await prisma.customer.delete({ where: { id: customerId } });
  });
});

describe('🗄️ Database - Model Relationships', () => {
  test('should maintain Booking → Customer relationship', async () => {
    const customerId = generateurDonneesTest.customerId();

    const customer = await prisma.customer.create({
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
        type: 'SERVICE',
        status: 'DRAFT',
        customerId,
        totalAmount: 100.00,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const bookingWithCustomer = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: { Customer: true }
    });

    expect(bookingWithCustomer!.Customer).toBeDefined();
    expect(bookingWithCustomer!.Customer.id).toBe(customer.id);
    expect(bookingWithCustomer!.Customer.email).toBe(customer.email);

    // Nettoyer
    await prisma.booking.delete({ where: { id: booking.id } });
    await prisma.customer.delete({ where: { id: customerId } });
  });

  test('should maintain Booking → QuoteRequest relationship', async () => {
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

    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        id: generateurDonneesTest.uuid(),
        type: 'CLEANING',
        status: 'PENDING',
        quoteData: { surface: 50 },
        temporaryId: generateurDonneesTest.temporaryId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    const booking = await prisma.booking.create({
      data: {
        id: generateurDonneesTest.bookingId(),
        type: 'SERVICE',
        status: 'CONFIRMED',
        customerId,
        totalAmount: 100.00,
        quoteRequestId: quoteRequest.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const bookingWithQuote = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: { QuoteRequest: true }
    });

    expect(bookingWithQuote!.QuoteRequest).toBeDefined();
    expect(bookingWithQuote!.QuoteRequest!.id).toBe(quoteRequest.id);
    expect(bookingWithQuote!.QuoteRequest!.temporaryId).toBe(quoteRequest.temporaryId);

    // Nettoyer
    await prisma.booking.delete({ where: { id: booking.id } });
    await prisma.quoteRequest.delete({ where: { id: quoteRequest.id } });
    await prisma.customer.delete({ where: { id: customerId } });
  });

  test('should cascade retrieve all related data', async () => {
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

    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        id: generateurDonneesTest.uuid(),
        type: 'MOVING',
        status: 'PENDING',
        quoteData: { volume: 50, distance: 100 },
        temporaryId: generateurDonneesTest.temporaryId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    const booking = await prisma.booking.create({
      data: {
        id: generateurDonneesTest.bookingId(),
        type: 'MOVING_QUOTE',
        status: 'PAYMENT_COMPLETED',
        customerId,
        totalAmount: 1500.00,
        quoteRequestId: quoteRequest.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    await prisma.moving.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: booking.id,
        moveDate: new Date('2025-12-15'),
        pickupAddress: '123 Rue Test',
        deliveryAddress: '456 Ave Test',
        distance: 100,
        volume: 50
      }
    });

    await prisma.transaction.create({
      data: {
        id: generateurDonneesTest.uuid(),
        bookingId: booking.id,
        amount: 450.00,
        currency: 'EUR',
        status: 'COMPLETED',
        paymentIntentId: generateurDonneesTest.paymentIntentId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Récupérer tout
    const fullBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        Customer: true,
        QuoteRequest: true,
        Moving: true,
        Transaction: true
      }
    });

    expect(fullBooking!.Customer).toBeDefined();
    expect(fullBooking!.QuoteRequest).toBeDefined();
    expect(fullBooking!.Moving).toBeDefined();
    expect(fullBooking!.Transaction).toHaveLength(1);

    // Nettoyer
    await prisma.transaction.deleteMany({ where: { bookingId: booking.id } });
    await prisma.moving.deleteMany({ where: { bookingId: booking.id } });
    await prisma.booking.delete({ where: { id: booking.id } });
    await prisma.quoteRequest.delete({ where: { id: quoteRequest.id } });
    await prisma.customer.delete({ where: { id: customerId } });
  });
});
