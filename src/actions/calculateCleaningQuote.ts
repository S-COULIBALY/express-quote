'use server'

import type { CleaningFormData } from '@/types/quote'
import { createConnections } from '@/quotation/infrastructure/config/database'
import { QuoteCalculatorFactory } from '@/quotation/application/factories/QuoteCalculatorFactory'
import { RuleService } from '@/quotation/application/services/RuleService'
import { CacheService } from '@/quotation/application/services/CacheService'
import { QuoteContext } from '@/quotation/domain/valueObjects/QuoteContext'
import { ServiceType } from '@/quotation/domain/entities/Service'
import { DiscountType } from '@/quotation/domain/valueObjects/Discount'

// Mapper pour convertir la fréquence du formulaire au format du contexte
const frequencyMapper = {
  oneTime: 'ONCE',
  weekly: 'WEEKLY',
  biweekly: 'BIWEEKLY',
  monthly: 'MONTHLY'
} as const

export async function calculateCleaningQuote(formData: CleaningFormData) {
  // Établir les connexions
  const { dbClient, redisClient } = await createConnections()
  
  try {
    // Initialiser les services
    const ruleService = new RuleService(dbClient)
    const cacheService = new CacheService(redisClient)
    const calculatorFactory = new QuoteCalculatorFactory(ruleService, cacheService)

    // Créer le calculateur et préparer le contexte
    const calculator = await calculatorFactory.createCalculator('cleaning')
    
    // Créer le contexte avec les champs requis
    const context = new QuoteContext({
      serviceType: ServiceType.CLEANING,
      squareMeters: parseFloat(formData.squareMeters),
      numberOfRooms: parseInt(formData.numberOfRooms),
      frequency: frequencyMapper[formData.frequency],
      hasBalcony: formData.hasBalcony || false,
      hasPets: formData.hasPets || false
    })

    // Calculer le devis
    const quote = await calculator.calculate(context)

    // Utiliser les getters pour accéder aux propriétés privées
    const frequencyDiscount = quote.getDiscounts()
      .find(d => d.getType() === DiscountType.PERCENTAGE)
      ?.apply(quote.getBasePrice())
      .getAmount() || 0

    return {
      basePrice: quote.getBasePrice().getAmount(),
      frequencyDiscount: frequencyDiscount,
      totalCost: quote.getTotalPrice().getAmount()
    }

  } catch (error) {
    console.error('Error calculating cleaning quote:', error)
    throw error
  } finally {
    // Fermer les connexions
    await Promise.all([
      dbClient.end(),
      redisClient.quit()
    ])
  }
} 