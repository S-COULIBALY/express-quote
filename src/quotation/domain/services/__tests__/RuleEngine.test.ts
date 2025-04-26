import { RuleEngine } from '../RuleEngine';
import { Rule } from '../../valueObjects/Rule';
import { Money } from '../../valueObjects/Money';
import { QuoteContext } from '../../valueObjects/QuoteContext';
import { Address } from '../../valueObjects/Address';
import { ContactInfo } from '../../valueObjects/ContactInfo';
import { ServiceType } from '../../enums/ServiceType';

describe('RuleEngine', () => {
    let ruleEngine: RuleEngine;
    let context: QuoteContext;

    beforeEach(() => {
        // Créer un contexte commun pour tous les tests
        context = new QuoteContext({
            serviceType: ServiceType.MOVING,
            pickupAddress: new Address(
                '123 Rue de Départ',
                'Ville de Départ',
                '12345',
                'France',
                undefined,
                2,
                false,
                50
            ),
            deliveryAddress: new Address(
                '456 Rue d\'Arrivée',
                'Ville d\'Arrivée',
                '67890',
                'France',
                undefined,
                3,
                false,
                75
            ),
            contactInfo: new ContactInfo(
                'Jean',
                'Dupont',
                'jean.dupont@example.com',
                '0123456789'
            ),
            moveDate: new Date('2024-03-23'), // Samedi
            volume: 30,
            distance: 100,
            tollCost: 15,
            fuelCost: 25,
            pickupElevator: false,
            deliveryElevator: false,
            pickupFloor: 2,
            deliveryFloor: 3,
            pickupCarryDistance: 50,
            deliveryCarryDistance: 75,
            options: {
                packaging: true,
                furniture: true,
                fragile: true,
                storage: false,
                disassembly: true,
                unpacking: false,
                supplies: true,
                fragileItems: true
            }
        });
    });

    it('devrait appliquer correctement une règle de pourcentage', () => {
        // Règle de majoration week-end (25%)
        const weekendRule = new Rule(
            'Majoration week-end',
            25, // 25% de supplément
            undefined,
            (context) => {
                const moveDate = context.getMoveDate();
                return moveDate && (moveDate.getDay() === 0 || moveDate.getDay() === 6);
            }
        );

        ruleEngine = new RuleEngine([weekendRule]);
        const basePrice = new Money(400);
        const result = ruleEngine.execute(context, basePrice);

        // Assertions
        expect(result.finalPrice.getAmount()).toBe(500); // 400 + (400 * 0.25) = 500
        expect(result.appliedRules).toContain('Majoration week-end');
        expect(result.appliedRules!.length).toBe(1);
        expect(result.discounts.length).toBe(0); // Pas de réduction car c'est un supplément
    });

    it('devrait appliquer correctement une règle de montant fixe', () => {
        // Règle de majoration pour étages sans ascenseur
        const floorRule = new Rule(
            'Majoration étages sans ascenseur',
            undefined,
            30, // 30€ par étage
            (context) => {
                const pickupElevator = context.getValue('pickupElevator');
                const deliveryElevator = context.getValue('deliveryElevator');
                const pickupFloor = context.getValue('pickupFloor') || 0;
                const deliveryFloor = context.getValue('deliveryFloor') || 0;
                
                return (!pickupElevator && pickupFloor > 0) || (!deliveryElevator && deliveryFloor > 0);
            }
        );

        ruleEngine = new RuleEngine([floorRule]);
        const basePrice = new Money(400);
        const result = ruleEngine.execute(context, basePrice);

        // Assertions
        expect(result.finalPrice.getAmount()).toBe(430); // 400 + 30 = 430
        expect(result.appliedRules).toContain('Majoration étages sans ascenseur');
        expect(result.appliedRules!.length).toBe(1);
    });

    it('devrait appliquer correctement une règle de réduction', () => {
        // Règle de réduction en pourcentage
        const discountRule = new Rule(
            'Réduction fidélité',
            -10, // -10% de réduction
            undefined,
            () => true // Toujours appliquée
        );

        ruleEngine = new RuleEngine([discountRule]);
        const basePrice = new Money(400);
        const result = ruleEngine.execute(context, basePrice);

        // Assertions
        expect(result.finalPrice.getAmount()).toBe(360); // 400 - (400 * 0.1) = 360
        expect(result.appliedRules).toContain('Réduction fidélité');
        expect(result.discounts.length).toBe(1);
        expect(result.discounts[0].getValue()).toBe(10);
    });

    it('devrait appliquer correctement une règle de tarif minimum', () => {
        // Règle de tarif minimum
        const minimumPriceRule = new Rule(
            'Tarif minimum',
            undefined,
            200, // 200€ minimum
            (context) => {
                const price = context.getValue('currentPrice');
                if (!price) return false;
                return price.getAmount() < 200;
            }
        );

        ruleEngine = new RuleEngine([minimumPriceRule]);
        const basePrice = new Money(150);
        const result = ruleEngine.execute(context, basePrice);

        // Assertions
        expect(result.finalPrice.getAmount()).toBe(200); // Ajustement au tarif minimum
        expect(result.appliedRules).toContain('Tarif minimum');
    });

    it('devrait appliquer plusieurs règles correctement', () => {
        // Plusieurs règles à appliquer
        const rules = [
            new Rule(
                'Majoration week-end',
                25, // 25% de supplément
                undefined,
                (context) => {
                    const moveDate = context.getMoveDate();
                    return moveDate && (moveDate.getDay() === 0 || moveDate.getDay() === 6);
                }
            ),
            new Rule(
                'Majoration étages sans ascenseur',
                undefined,
                30, // 30€ par étage
                (context) => {
                    const pickupElevator = context.getValue('pickupElevator');
                    const deliveryElevator = context.getValue('deliveryElevator');
                    const pickupFloor = context.getValue('pickupFloor') || 0;
                    const deliveryFloor = context.getValue('deliveryFloor') || 0;
                    
                    return (!pickupElevator && pickupFloor > 0) || (!deliveryElevator && deliveryFloor > 0);
                }
            ),
            new Rule(
                'Réduction fidélité',
                -10, // -10% de réduction
                undefined,
                () => true // Toujours appliquée
            ),
            new Rule(
                'Tarif minimum',
                undefined,
                200, // 200€ minimum
                (context) => {
                    const price = context.getValue('currentPrice');
                    if (!price) return false;
                    return price.getAmount() < 200;
                }
            )
        ];

        ruleEngine = new RuleEngine(rules);
        const basePrice = new Money(400);
        const result = ruleEngine.execute(context, basePrice);

        // Assertions pour les règles appliquées
        expect(result.finalPrice.getAmount()).toBe(490); // 400 + (400 * 0.25) - (400 * 0.10) + 30 = 490
        expect(result.appliedRules).toContain('Majoration week-end');
        expect(result.appliedRules).toContain('Réduction fidélité');
        expect(result.appliedRules).toContain('Majoration étages sans ascenseur');
        expect(result.appliedRules).not.toContain('Tarif minimum'); // Pas appliqué car le prix final > 200
        expect(result.discounts.length).toBe(1);
    });

    it('devrait appliquer les règles dans le bon ordre', () => {
        // Règles avec ordre spécifique
        const rules = [
            new Rule(
                'Réduction volume',
                -15, // -15% de réduction
                undefined,
                () => true // Toujours appliquée
            ),
            new Rule(
                'Majoration distance',
                10, // +10% de majoration
                undefined,
                () => true // Toujours appliquée
            ),
            new Rule(
                'Tarif minimum',
                undefined,
                300, // 300€ minimum
                (context) => {
                    const price = context.getValue('currentPrice');
                    if (!price) return false;
                    return price.getAmount() < 300;
                }
            )
        ];

        ruleEngine = new RuleEngine(rules);
        const basePrice = new Money(200);
        const result = ruleEngine.execute(context, basePrice);

        // Vérifier que la règle de tarif minimum est appliquée en dernier
        // 200 - (200 * 0.15) + (200 * 0.10) = 200 - 30 + 20 = 190
        // Comme 190 < 300, la règle de tarif minimum s'applique
        expect(result.finalPrice.getAmount()).toBe(300);
        expect(result.appliedRules).toContain('Tarif minimum');
    });

    it('devrait valider le contexte correctement', () => {
        // Contexte invalide sans volume
        const invalidContext = new QuoteContext({
            serviceType: ServiceType.MOVING,
            pickupAddress: new Address(
                '123 Rue de Départ',
                'Ville de Départ',
                '12345',
                'France',
                undefined,
                2,
                false,
                50
            ),
            deliveryAddress: new Address(
                '456 Rue d\'Arrivée',
                'Ville d\'Arrivée',
                '67890',
                'France',
                undefined,
                3,
                false,
                75
            ),
            contactInfo: new ContactInfo(
                'Jean',
                'Dupont',
                'jean.dupont@example.com',
                '0123456789'
            ),
            moveDate: new Date('2024-03-23'),
            // volume est manquant
            distance: 100
        });

        ruleEngine = new RuleEngine([]);
        const basePrice = new Money(400);

        // La validation devrait échouer
        expect(() => {
            ruleEngine.execute(invalidContext, basePrice);
        }).toThrow(/Missing required field/);
    });

    it('devrait permettre d\'ajouter et supprimer des règles', () => {
        const weekendRule = new Rule(
            'Majoration week-end',
            25,
            undefined,
            (context) => {
                const moveDate = context.getMoveDate();
                return moveDate && (moveDate.getDay() === 0 || moveDate.getDay() === 6);
            }
        );

        // Initialiser avec aucune règle
        ruleEngine = new RuleEngine([]);
        
        // Ajouter une règle
        ruleEngine.addRule(weekendRule);
        
        // Vérifier que la règle est appliquée
        const basePrice = new Money(400);
        let result = ruleEngine.execute(context, basePrice);
        expect(result.finalPrice.getAmount()).toBe(500);
        expect(result.appliedRules).toContain('Majoration week-end');
        
        // Supprimer la règle
        ruleEngine.removeRule(weekendRule);
        
        // Vérifier que la règle n'est plus appliquée
        result = ruleEngine.execute(context, basePrice);
        expect(result.finalPrice.getAmount()).toBe(400);
        expect(result.appliedRules!.length).toBe(0);
    });
}); 