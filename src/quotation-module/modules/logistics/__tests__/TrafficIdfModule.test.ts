import { TrafficIdfModule } from '../TrafficIdfModule';
import { QuoteContext } from '../../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';

describe('TrafficIdfModule', () => {
  const module = new TrafficIdfModule();

  it('devrait avoir les bonnes propriétés', () => {
    expect(module.id).toBe('traffic-idf');
    expect(module.description).toBe('Détecte si le trafic IDF impacte le déménagement');
    expect(module.priority).toBe(46);
  });

  it('devrait être applicable si heure de pointe matin (8h)', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      movingDate: '2026-03-15T08:00:00Z', // 8h du matin
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(true);
  });

  it('devrait être applicable si heure de pointe soir (18h)', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      movingDate: '2026-03-15T18:00:00Z', // 18h
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(true);
  });

  it('devrait être applicable si vendredi après-midi', () => {
    // 2026-03-13 est un vendredi
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      movingDate: '2026-03-13T15:00:00Z', // Vendredi 15h
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(true);
  });

  it('ne devrait pas être applicable si heure normale', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      movingDate: '2026-03-15T14:00:00Z', // 14h (hors heures de pointe)
      computed: createEmptyComputedContext(),
    };

    expect(module.isApplicable(ctx)).toBe(false);
  });

  it('devrait appliquer un surcoût de 1% en heures de pointe', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      movingDate: '2026-03-15T08:00:00Z', // 8h
      computed: {
        ...createEmptyComputedContext(),
        costs: [
          {
            moduleId: 'fuel-cost',
            category: 'TRANSPORT',
            label: 'Carburant',
            amount: 100,
          }
        ],
      },
    };

    const result = module.apply(ctx);
    const trafficCost = result.computed?.costs.find(c => c.moduleId === 'traffic-idf');
    expect(trafficCost).toBeDefined();
    expect(trafficCost?.amount).toBe(1.00); // 1% de 100
    expect(result.computed?.operationalFlags).toContain('TRAFFIC_IDF_IMPACT');
  });

  it('devrait appliquer un surcoût de 2% vendredi après-midi', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      movingDate: '2026-03-13T15:00:00Z', // Vendredi 15h
      computed: {
        ...createEmptyComputedContext(),
        costs: [
          {
            moduleId: 'fuel-cost',
            category: 'TRANSPORT',
            label: 'Carburant',
            amount: 100,
          }
        ],
      },
    };

    const result = module.apply(ctx);
    const trafficCost = result.computed?.costs.find(c => c.moduleId === 'traffic-idf');
    expect(trafficCost).toBeDefined();
    expect(trafficCost?.amount).toBe(2.00); // 2% de 100
    expect(result.computed?.operationalFlags).toContain('TRAFFIC_IDF_IMPACT');
  });

  it('devrait prioriser vendredi après-midi (2%) sur heures de pointe (1%) si les deux conditions sont vraies', () => {
    const ctx: QuoteContext = {
      serviceType: 'MOVING',
      region: 'IDF',
      departureAddress: '123 Rue de Paris',
      arrivalAddress: '456 Avenue Montaigne',
      movingDate: '2026-03-13T17:00:00Z', // Vendredi 17h (heure de pointe ET vendredi après-midi)
      computed: {
        ...createEmptyComputedContext(),
        costs: [
          {
            moduleId: 'fuel-cost',
            category: 'TRANSPORT',
            label: 'Carburant',
            amount: 100,
          }
        ],
      },
    };

    const result = module.apply(ctx);
    const trafficCost = result.computed?.costs.find(c => c.moduleId === 'traffic-idf');
    expect(trafficCost).toBeDefined();
    // Le vendredi après-midi (2%) est prioritaire sur les heures de pointe (1%)
    expect(trafficCost?.amount).toBe(2.00); // 2% de 100, pas 1%
    expect(trafficCost?.metadata.isFridayAfternoon).toBe(true);
    expect(trafficCost?.metadata.isRushHour).toBe(true);
  });
});

