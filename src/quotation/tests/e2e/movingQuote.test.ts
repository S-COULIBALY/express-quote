import { QuoteController } from '../../application/controllers/QuoteController';
import { QuoteFactory } from '../../application/factories/QuoteFactory';
import { ServiceType } from '../../domain/entities/Service';
import { Rule } from '../../domain/valueObjects/Rule';
import { Money } from '../../domain/valueObjects/Money';
import { Quote } from '../../domain/valueObjects/Quote';
import { QuoteContext } from '../../domain/valueObjects/QuoteContext';

describe('Moving Quote E2E Test', () => {
  let quoteController: QuoteController;
  
  const baseRequestData = {
    serviceType: ServiceType.MOVING,
    contact: {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@email.com',
      phone: '+33612345678'
    },
    pickupAddress: {
      street: '123 Rue de Paris',
      city: 'Paris',
      postalCode: '75001',
      country: 'France'
    },
    deliveryAddress: {
      street: '456 Avenue de Lyon',
      city: 'Lyon',
      postalCode: '69001',
      country: 'France'
    }
  };

  beforeAll(() => {
    // Configuration des règles de test
    const testRules = [
      // Règles de réduction volume
      new Rule(
        "small_volume_discount",
        -10,
        undefined,
        (context: QuoteContext) => {
          const volume = context.getValue<number>('volume') ?? 0;
          return volume < 10;
        }
      ),
      new Rule(
        "large_volume_discount",
        -5,
        undefined,
        (context: QuoteContext) => {
          const volume = context.getValue<number>('volume') ?? 0;
          return volume > 50;
        }
      ),
      // Règles temporelles
      new Rule(
        "weekend_surcharge",
        25,
        undefined,
        (context: QuoteContext) => {
          const movingDate = context.getValue<Date>('movingDate');
          if (!movingDate) return false;
          return movingDate.getDay() === 0 || movingDate.getDay() === 6;
        }
      ),
      new Rule(
        "high_season",
        30,
        undefined,
        (context: QuoteContext) => {
          const movingDate = context.getValue<Date>('movingDate');
          if (!movingDate) return false;
          const month = movingDate.getMonth() + 1;
          return month >= 6 && month <= 9;
        }
      ),
      new Rule(
        "night_hours",
        15,
        undefined,
        (context: QuoteContext) => {
          const movingDate = context.getValue<Date>('movingDate');
          if (!movingDate) return false;
          const hour = movingDate.getHours();
          return hour < 8 || hour >= 19;
        }
      ),
      // Règles d'accès
      new Rule(
        "pickup_furniture_lift",
        undefined,
        100,
        (context: QuoteContext) => {
          const pickupElevator = context.getValue<boolean>('pickupElevator') ?? false;
          const pickupFloor = context.getValue<number>('pickupFloor') ?? 0;
          return !pickupElevator && pickupFloor > 3;
        }
      ),
      new Rule(
        "delivery_furniture_lift",
        undefined,
        100,
        (context: QuoteContext) => {
          const deliveryElevator = context.getValue<boolean>('deliveryElevator') ?? false;
          const deliveryFloor = context.getValue<number>('deliveryFloor') ?? 0;
          return !deliveryElevator && deliveryFloor > 3;
        }
      ),
      new Rule(
        "pickup_floor_charge",
        undefined,
        5,
        (context: QuoteContext) => {
          const pickupElevator = context.getValue<boolean>('pickupElevator') ?? false;
          const pickupFloor = context.getValue<number>('pickupFloor') ?? 0;
          return !pickupElevator && pickupFloor > 0 && pickupFloor <= 3;
        }
      ),
      new Rule(
        "delivery_floor_charge",
        undefined,
        5,
        (context: QuoteContext) => {
          const deliveryElevator = context.getValue<boolean>('deliveryElevator') ?? false;
          const deliveryFloor = context.getValue<number>('deliveryFloor') ?? 0;
          return !deliveryElevator && deliveryFloor > 0 && deliveryFloor <= 3;
        }
      ),
      // Règles de portage
      new Rule(
        "pickup_long_carry",
        undefined,
        30,
        (context: QuoteContext) => {
          const pickupCarryDistance = context.getValue<number>('pickupCarryDistance') ?? 0;
          return pickupCarryDistance > 100;
        }
      ),
      new Rule(
        "delivery_long_carry",
        undefined,
        30,
        (context: QuoteContext) => {
          const deliveryCarryDistance = context.getValue<number>('deliveryCarryDistance') ?? 0;
          return deliveryCarryDistance > 100;
        }
      ),
      // Règles escaliers étroits
      new Rule(
        "pickup_narrow_stairs",
        undefined,
        50,
        (context: QuoteContext) => {
          const pickupNarrowStairs = context.getValue<boolean>('pickupNarrowStairs') ?? false;
          const pickupElevator = context.getValue<boolean>('pickupElevator') ?? false;
          const pickupFloor = context.getValue<number>('pickupFloor') ?? 0;
          return pickupNarrowStairs && !pickupElevator && pickupFloor <= 3;
        }
      ),
      new Rule(
        "delivery_narrow_stairs",
        undefined,
        50,
        (context: QuoteContext) => {
          const deliveryNarrowStairs = context.getValue<boolean>('deliveryNarrowStairs') ?? false;
          const deliveryElevator = context.getValue<boolean>('deliveryElevator') ?? false;
          const deliveryFloor = context.getValue<number>('deliveryFloor') ?? 0;
          return deliveryNarrowStairs && !deliveryElevator && deliveryFloor <= 3;
        }
      ),
      // Règles supplémentaires
      new Rule(
        "long_distance",
        undefined,
        1.5,
        (context: QuoteContext) => {
          const distance = context.getValue<number>('distance') ?? 0;
          return distance > 50;
        }
      ),
      new Rule(
        "fragile_items",
        undefined,
        50,
        (context: QuoteContext) => {
          const fragileItems = context.getValue<number>('fragileItems') ?? 0;
          return fragileItems > 0;
        }
      ),
      new Rule(
        "minimum_price",
        undefined,
        150,
        (context: QuoteContext) => {
          const volume = context.getValue<number>('volume') ?? 0;
          const distance = context.getValue<number>('distance') ?? 0;
          const basePrice = volume * 10 + distance * 2;
          return basePrice < 150;
        }
      )
    ];

    const quoteFactory = new QuoteFactory(testRules);
    quoteController = new QuoteController(quoteFactory);
  });

  test('should calculate a complex quote with multiple rules', async () => {
    const complexRequestData = {
      ...baseRequestData,
      volume: 12,
      movingDate: new Date('2023-07-15T19:00:00'), // Samedi 15 juillet à 19h
      distance: 60,
      pickupElevator: false,
      pickupFloor: 4,
      pickupCarryDistance: 120,
      pickupNarrowStairs: false,
      deliveryElevator: false,
      deliveryFloor: 2,
      deliveryCarryDistance: 80,
      deliveryNarrowStairs: true,
      fragileItems: 1
    };

    const quote = await quoteController.calculateQuote(complexRequestData);

    // Prix attendu :
    // Base price:
    // - Volume (12m³ * 10€): 120€
    // - Distance (60km * 2€): 120€
    // - Frais de carburant: 
    //   * Consommation: (60km * 25L/100km) / 100 = 15L
    //   * Coût: 15L * 1.8€/L = 27€
    // - Frais de péage:
    //   * Distance sur autoroute: 60km * 0.7 = 42km
    //   * Coût: 42km * 0.15€/km = 6.3€ ≈ 6€
    // Prix de base total: 120€ + 120€ + 27€ + 6€ = 273€
    
    // Majorations en pourcentage (calculées sur le prix de base 273€) :
    // - Weekend (25%): +68.25€
    // - Haute saison juillet (30%): +81.9€
    // - Horaire soirée 19h (15%): +40.95€
    // Total des majorations en pourcentage (70% de 273€): +191.1€ ≈ 191€
    
    // Majorations fixes :
    // - Monte-meuble départ (4e étage sans ascenseur): +100€
    // - Étages arrivée (2e étage sans ascenseur, 5€ * 2): +10€
    // - Portage long départ (120m > 100m): +30€
    // - Escaliers étroits arrivée (2e étage sans ascenseur): +50€
    // - Distance > 50km (10km * 1.5€): +15€
    // - Objets fragiles: +50€
    // Total des majorations fixes: +255€
    
    // Total final: 
    // Prix de base (273€) + Majorations % (191€) + Majorations fixes (255€) = 719€
    
    // Note: Pas de réduction car:
    // - Volume pas < 10m³ (pas de réduction petit volume)
    // - Volume pas > 50m³ (pas de réduction grand volume)

    expect(quote.getBasePrice().getAmount()).toBe(273);
    expect(quote.getTotalPrice().getAmount()).toBe(719);
    expect(quote.hasDiscounts()).toBe(false);
  });
});
