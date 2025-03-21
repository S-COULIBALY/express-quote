import { MovingQuoteCalculator } from '../../calculators/MovingQuoteCalculator';
import { QuoteContext } from '../../valueObjects/QuoteContext';
import { ServiceType } from '../../entities/Service';
import { Money } from '../../valueObjects/Money';
import { Rule } from '../../valueObjects/Rule';
import { ContactInfo } from '../../valueObjects/ContactInfo';
import { Address } from '../../valueObjects/Address';

describe('MovingQuoteCalculator', () => {
  let calculator: MovingQuoteCalculator;

  const mockContact = new ContactInfo(
    'Jean',
    'Dupont',
    'jean.dupont@email.com',
    '+33612345678'
  );

  const mockAddresses = {
    pickup: new Address('123 Rue de Paris', 'Paris', 4, '75001'),
    delivery: new Address('456 Avenue de Lyon', 'Lyon', 2, '69001')
  };

  beforeEach(() => {
    calculator = new MovingQuoteCalculator([]);
  });

  describe('calculate', () => {
    it('should calculate a complex quote with multiple rules', async () => {
      const context = new QuoteContext({
        serviceType: ServiceType.MOVING,
        volume: 12, // 12 m³
        movingDate: "2023-07-15T19:00:00", // Samedi 15 juillet à 19h
        distance: 60, // 60 km
        pickupElevator: false, // Pas d'ascenseur au départ
        pickupFloor: 4, // 4ᵉ étage au départ
        pickupCarryDistance: 120, // 120 mètres de portage au départ
        pickupNarrowStairs: false, // Pas d'escaliers étroits au départ
        deliveryElevator: false, // Pas d'ascenseur à l'arrivée
        deliveryFloor: 2, // 2ᵉ étage à l'arrivée
        deliveryCarryDistance: 80, // 80 mètres de portage à l'arrivée
        deliveryNarrowStairs: true, // Escaliers étroits à l'arrivée
        fragileItems: 1, // 1 objet fragile (piano)
        contact: mockContact,
        addresses: mockAddresses
      });

      const quote = await calculator.calculate(context);

      // Prix de base : 40€
      expect(quote.getBasePrice().getAmount()).toBe(40);

      // Vérification des majorations
      const totalPrice = quote.getTotalPrice().getAmount();
      expect(totalPrice).toBe(320);

      // Vérification des règles appliquées dans le prix total
      const discounts = quote.getDiscounts();
      const basePrice = quote.getBasePrice().getAmount();
      const finalPrice = quote.getTotalPrice().getAmount();

      // Vérification des majorations week-end et haute saison
      expect(finalPrice).toBeGreaterThan(basePrice * 1.25); // Majoration week-end
      expect(finalPrice).toBeGreaterThan(basePrice * 1.3); // Majoration haute saison

      // Vérification des majorations fixes
      const fixedCharges = [
        100, // Monte-meuble départ
        30,  // Distance de portage départ
        10,  // Étages arrivée
        50,  // Escaliers étroits arrivée
        15,  // Distance longue
        50   // Objets fragiles
      ];

      const totalFixedCharges = fixedCharges.reduce((sum, charge) => sum + charge, 0);
      expect(finalPrice).toBeGreaterThanOrEqual(basePrice + totalFixedCharges);
    });

    it('should calculate quote with base price and volume discount', async () => {
      const context = new QuoteContext({
        serviceType: ServiceType.MOVING,
        volume: 50,
        distance: 100,
        floorNumber: 3,
        hasElevator: false,
        hasLongCarry: true,
        contact: mockContact,
        addresses: mockAddresses
      });

      const quote = await calculator.calculate(context);
      
      // Base price should be: (50m³ * 10) + (100km * 2) = 700
      // With floor (+15% per floor above ground): 700 * (1 + 0.15 * 3) = 1015
      // With long carry (+20%): 1015 * 1.2 = 1218
      expect(quote.getBasePrice().getAmount()).toBeCloseTo(1218);
      
      // Volume > 30m³ should give 10% discount
      expect(quote.getDiscounts()).toHaveLength(1);
      expect(quote.getDiscounts()[0].getName()).toBe('large_volume');
      expect(quote.getDiscounts()[0].getValue()).toBe(10);
      
      // Final price should be base price - 10%
      expect(quote.getTotalPrice().getAmount()).toBeCloseTo(1218 * 0.9);
    });

    it('should calculate quote with elevator and no discounts', async () => {
      const context = new QuoteContext({
        serviceType: ServiceType.MOVING,
        volume: 20,
        distance: 50,
        floorNumber: 5,
        hasElevator: true,
        hasLongCarry: false,
        contact: mockContact,
        addresses: mockAddresses
      });

      const quote = await calculator.calculate(context);
      
      // Base price should be: (20m³ * 10) + (50km * 2) = 300
      // With elevator (only +5% per floor): 300 * (1 + 0.05 * 5) = 375
      expect(quote.getBasePrice().getAmount()).toBe(375);
      
      // No discounts should apply
      expect(quote.getDiscounts()).toHaveLength(0);
      
      // Final price should equal base price
      expect(quote.getTotalPrice().getAmount()).toBe(375);
    });
  });
}); 