import { QuoteContext } from '../quotation/domain/valueObjects/QuoteContext';
import { ServiceType } from '../quotation/domain/enums/ServiceType';
import { RuleEngine } from '../quotation/domain/services/RuleEngine';
import { Money } from '../quotation/domain/valueObjects/Money';
import { createServiceRules } from '../quotation/domain/rules/ServiceRules';

/**
 * Test pour vérifier le fonctionnement de la règle "Tarif minimum"
 * La règle doit garantir que le prix final n'est jamais inférieur à 90% du prix de base
 */
describe('Règle Tarif minimum', () => {
  
  test('Le prix final ne doit pas être inférieur à 90% du prix de base', async () => {
    // Créer un contexte de test
    const context = new QuoteContext();
    context.setServiceType(ServiceType.SERVICE);
    context.setValue('defaultPrice', 200);
    context.setValue('duration', 10);
    context.setValue('workers', 4);
    
    // Prix de base (ajusté pour durée et travailleurs)
    const basePrice = new Money(1215); // Prix calculé dans MovingQuoteCalculator
    
    // Créer un moteur de règles avec les règles de service
    const ruleEngine = new RuleEngine(createServiceRules());
    
    // Exécuter les règles
    const result = ruleEngine.execute(context, basePrice);
    
    // Le prix minimum attendu est 90% du prix de base
    const minimumExpectedPrice = Math.round(basePrice.getAmount() * 0.9);
    
    // Vérifier que le prix final n'est pas inférieur au minimum
    expect(result.finalPrice.getAmount()).toBeGreaterThanOrEqual(minimumExpectedPrice);
    
    // Loguer les résultats pour vérification
    console.log('Test "Tarif minimum"');
    console.log('Prix de base:', basePrice.getAmount());
    console.log('Prix minimum attendu (90%):', minimumExpectedPrice);
    console.log('Prix final obtenu:', result.finalPrice.getAmount());
    console.log('Réductions appliquées:', result.discounts.map(d => ({ 
      name: d.getName(), 
      amount: d.getAmount().getAmount() 
    })));
  });
  
  test('Les réductions peuvent s\'appliquer mais le prix ne descend pas sous 90%', async () => {
    // Créer un contexte avec réductions applicables
    const context = new QuoteContext();
    context.setServiceType(ServiceType.SERVICE);
    context.setValue('defaultPrice', 200);
    context.setValue('duration', 8); // Déclenche "Réduction longue durée"
    context.setValue('workers', 2);
    context.setValue('isReturningCustomer', true); // Déclenche "Réduction client fidèle"
    
    // Prix de base (ajusté pour durée et travailleurs)
    const basePrice = new Money(1000);
    
    // Créer un moteur de règles
    const ruleEngine = new RuleEngine(createServiceRules());
    
    // Exécuter les règles
    const result = ruleEngine.execute(context, basePrice);
    
    // Le prix minimum attendu
    const minimumExpectedPrice = Math.round(basePrice.getAmount() * 0.9);
    
    // Vérifier que les réductions sont appliquées 
    expect(result.discounts.length).toBeGreaterThan(0);
    
    // Mais le prix final ne doit pas descendre sous le minimum
    expect(result.finalPrice.getAmount()).toBeGreaterThanOrEqual(minimumExpectedPrice);
    
    // Loguer les résultats
    console.log('Test "Réductions avec plancher"');
    console.log('Prix de base:', basePrice.getAmount());
    console.log('Prix minimum (90%):', minimumExpectedPrice);
    console.log('Prix final:', result.finalPrice.getAmount());
    console.log('Réductions appliquées:', result.discounts.map(d => ({ 
      name: d.getName(), 
      amount: d.getAmount().getAmount() 
    })));
  });
}); 