'use server'

import type { CleaningFormData } from '@/types/quote'
import { QuoteContext } from '@/quotation/domain/valueObjects/QuoteContext'
import { ServiceType } from '@/quotation/domain/enums/ServiceType'
import { DiscountType } from '@/quotation/domain/valueObjects/Discount'
import { QuoteFactory } from '@/quotation/application/factories/QuoteFactory'
import { Rule } from '@/quotation/domain/valueObjects/Rule'

// Mapper pour convertir la fréquence du formulaire au format du contexte
const frequencyMapper = {
  oneTime: 'ONCE',
  weekly: 'WEEKLY',
  biweekly: 'BIWEEKLY',
  monthly: 'MONTHLY'
} as const

export async function calculateCleaningQuote(formData: CleaningFormData) {
  try {
    // Créer le factory de calculateurs avec un tableau de règles vide
    // Dans une implémentation réelle, on récupérerait les règles depuis une BDD
    const quoteFactory = new QuoteFactory([]);

    // Créer le calculateur pour le service de nettoyage
    const calculator = quoteFactory.createCalculator(ServiceType.CLEANING);
    
    // Créer le contexte avec les champs requis
    const context = new QuoteContext({
      serviceType: ServiceType.CLEANING,
      squareMeters: parseFloat(formData.squareMeters),
      numberOfRooms: parseInt(formData.numberOfRooms),
      frequency: frequencyMapper[formData.frequency as keyof typeof frequencyMapper],
      hasBalcony: formData.hasBalcony || false,
      hasPets: formData.hasPets || false
    });

    // Calculer le devis
    const quote = await calculator.calculate(context);

    // Utiliser les getters pour accéder aux propriétés privées
    const frequencyDiscount = quote.getDiscounts()
      .find((d) => d.getType() === DiscountType.PERCENTAGE)
      ?.apply(quote.getBasePrice())
      .getAmount() || 0;

    return {
      basePrice: quote.getBasePrice().getAmount(),
      frequencyDiscount: frequencyDiscount,
      totalCost: quote.getTotalPrice().getAmount()
    };

  } catch (error) {
    console.error('Error calculating cleaning quote:', error);
    throw error;
  }
} 