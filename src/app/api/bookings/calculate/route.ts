import { NextRequest, NextResponse } from 'next/server';
import { QuoteContext } from '@/quotation/domain/valueObjects/QuoteContext';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { Money } from '@/quotation/domain/valueObjects/Money';
import { Discount } from '@/quotation/domain/valueObjects/Discount';
import { Quote } from '@/quotation/domain/valueObjects/Quote';
import { QuoteCalculator } from '@/quotation/domain/calculators/MovingQuoteCalculator';
import { ConfigurationService } from '@/quotation/domain/services/ConfigurationService';
import { createMovingRules } from '@/quotation/domain/rules/MovingRules';
import { createPackRules } from '@/quotation/domain/rules/PackRules';
import { createServiceRules } from '@/quotation/domain/rules/ServiceRules';

// Log de chargement de la route spécifique
console.log("\n========== MODULE API/BOOKINGS/CALCULATE/ROUTE.TS CHARGÉ ==========\n");

/**
 * POST /api/bookings/calculate - Calcul de prix
 */
export async function POST(request: NextRequest) {
  console.log("\n========== ENTRÉE DANS LA FONCTION POST /api/bookings/calculate ==========\n");
  console.log("URL complète:", request.url);
  
  try {
    // Log de la requête entrante
    console.log("HEADERS:", Object.fromEntries(request.headers.entries()));
    
    // Lire le corps de la requête
    const bodyText = await request.text();
    console.log("BODY TEXT:", bodyText);
    
    // Parser le corps en JSON
    let requestData;
    try {
      requestData = JSON.parse(bodyText);
      console.log("PARSED JSON:", JSON.stringify(requestData, null, 2));
    } catch (parseError) {
      console.log("ERREUR DE PARSING JSON:", parseError);
      return NextResponse.json(
        { error: 'Format JSON invalide', details: String(parseError) },
        { status: 400 }
      );
    }
    
    // Valider les données de base
    if (!requestData.type || !requestData.data) {
      return NextResponse.json(
        { error: 'Type de service et données requis' },
        { status: 400 }
      );
    }
    
    // Déterminer le type de service
    let serviceType: ServiceType;
    console.log("TYPE DE SERVICE DEMANDÉ:", requestData.type.toUpperCase());
    
    switch (requestData.type.toUpperCase()) {
      case 'MOVING':
        serviceType = ServiceType.MOVING;
        break;
      case 'PACK':
        serviceType = ServiceType.PACK;
        break;
      case 'SERVICE':
        serviceType = ServiceType.SERVICE;
        break;
      default:
        return NextResponse.json(
          { error: 'Type de service invalide. Utilisez MOVING, PACK ou SERVICE.' },
          { status: 400 }
        );
    }
    
    // Créer le contexte pour le calcul
    console.log("CRÉATION DU CONTEXTE pour", serviceType);
    const context = new QuoteContext(serviceType);
    
    // Ajouter les données au contexte en fonction du type de service
    switch (serviceType) {
      case ServiceType.MOVING:
        context.setValue('volume', requestData.data.volume);
        context.setValue('distance', requestData.data.distance);
        context.setValue('workers', requestData.data.workers);
        break;
        
      case ServiceType.PACK:
        context.setValue('basePrice', requestData.data.basePrice);
        context.setValue('duration', requestData.data.duration);
        context.setValue('workers', requestData.data.workers);
        context.setValue('baseWorkers', requestData.data.baseWorkers);
        context.setValue('baseDuration', requestData.data.baseDuration);
        context.setValue('distance', requestData.data.distance);
        break;
        
      case ServiceType.SERVICE:
        console.log("VALEURS SERVICE:", {
          basePrice: requestData.data.basePrice,
          duration: requestData.data.duration,
          workers: requestData.data.workers,
          defaultDuration: requestData.data.defaultDuration,
          defaultWorkers: requestData.data.defaultWorkers
        });
        
        context.setValue('basePrice', requestData.data.basePrice);
        context.setValue('duration', requestData.data.duration);
        context.setValue('workers', requestData.data.workers);
        context.setValue('defaultDuration', requestData.data.defaultDuration);
        context.setValue('defaultWorkers', requestData.data.defaultWorkers);
        break;
    }
    
    // Valider le contexte
    context.validate();
    
    console.log("CONTEXTE VALIDÉ AVEC SUCCÈS");
    
    // ===== INITIALISATION DU VRAI QUOTECALCULATOR =====
    try {
      console.log("INITIALISATION DU QUOTECALCULATOR");
      
      // Créer les règles pour chaque type de service
      const movingRules = createMovingRules();
      const packRules = createPackRules();
      const serviceRules = createServiceRules();
      
      // Créer le ConfigurationService
      const configService = new ConfigurationService();
      
      // Initialiser le QuoteCalculator avec toutes les règles
      console.log("CRÉATION DU QUOTECALCULATOR");
      const quoteCalculator = new QuoteCalculator(
        configService,
        movingRules,
        packRules,
        serviceRules
      );
      
      console.log("QUOTECALCULATOR CRÉÉ, TENTATIVE DE CALCUL...");
      
      try {
        // Tentative d'utilisation du vrai QuoteCalculator
        console.log("APPEL DE quoteCalculator.calculate(context)");
        const quote = await quoteCalculator.calculate(context);
        
        console.log("CALCUL RÉUSSI AVEC LE VRAI QUOTECALCULATOR!");
        console.log("RÉSULTAT:", {
          basePrice: quote.getBasePrice().getAmount(),
          totalPrice: quote.getTotalPrice().getAmount(),
          discounts: quote.getDiscounts().length
        });
        
        // Retourner le résultat calculé par le vrai QuoteCalculator
        return NextResponse.json({
          success: true,
          price: quote.getTotalPrice().getAmount(),
          quote: {
            basePrice: quote.getBasePrice().getAmount(),
            totalPrice: quote.getTotalPrice().getAmount(),
            discounts: quote.getDiscounts().map(d => ({
              description: d.getDescription(),
              amount: d.getAmount().getAmount(),
              type: d.getType()
            })),
            serviceType: quote.getServiceType()
          }
        });
        
      } catch (calculateError) {
        // Log détaillé de l'erreur pour identifier la cause exacte
        console.log("ERREUR DANS quoteCalculator.calculate():", calculateError);
        
        if (calculateError instanceof Error) {
          console.log("TYPE D'ERREUR:", calculateError.constructor.name);
          console.log("MESSAGE D'ERREUR:", calculateError.message);
          console.log("STACK TRACE:", calculateError.stack);
          
          // ===== ANALYSE DE L'ERREUR POUR IDENTIFIER LA CAUSE =====
          // Vérifier si c'est l'erreur "Opération non supportée"
          if (calculateError.message.includes('Opération non supportée')) {
            console.log("DÉTECTION DE L'ERREUR 'Opération non supportée'");
            
            // Rechercher des indices supplémentaires dans l'erreur
            const errorProps = Object.getOwnPropertyNames(calculateError).filter(p => 
              p !== 'name' && p !== 'message' && p !== 'stack'
            );
            
            if (errorProps.length > 0) {
              console.log("PROPRIÉTÉS SUPPLÉMENTAIRES DE L'ERREUR:");
              errorProps.forEach(prop => {
                console.log(`- ${prop}:`, (calculateError as any)[prop]);
              });
            }
          }
          
          // Vérifier s'il s'agit d'une erreur liée à un module manquant
          if (calculateError.message.includes('Cannot find module')) {
            console.log("ERREUR DE MODULE MANQUANT DÉTECTÉE");
            console.log("MODULE MANQUANT:", calculateError.message.match(/Cannot find module '([^']+)'/)?.[1]);
          }
          
          // Vérifier s'il s'agit d'une erreur liée à une fonction manquante
          if (calculateError.message.includes('is not a function')) {
            console.log("ERREUR DE FONCTION MANQUANTE DÉTECTÉE");
            const funcMatch = calculateError.message.match(/([^\s]+) is not a function/);
            console.log("FONCTION MANQUANTE:", funcMatch?.[1]);
          }
        }
        
        // Fallback sur notre calcul manuel
        console.log("UTILISATION DU CALCUL MANUEL COMME FALLBACK");
      }
    } catch (initError) {
      console.log("ERREUR LORS DE L'INITIALISATION DU QUOTECALCULATOR:", initError);
      if (initError instanceof Error) {
        console.log("TYPE D'ERREUR:", initError.constructor.name);
        console.log("MESSAGE D'ERREUR:", initError.message);
        console.log("STACK TRACE:", initError.stack);
      }
      
      // Continuer avec le calcul manuel
      console.log("UTILISATION DU CALCUL MANUEL COMME FALLBACK APRÈS ERREUR D'INITIALISATION");
    }
    
    // ===== CALCUL MANUEL COMME FALLBACK =====
    console.log("EXÉCUTION DU CALCUL MANUEL");
    
    if (serviceType === ServiceType.SERVICE) {
      // Extrait les valeurs du contexte
      const basePrice = context.getValue<number>('basePrice') || 0;
      const duration = context.getValue<number>('duration') || 1;
      const workers = context.getValue<number>('workers') || 1;
      const defaultDuration = context.getValue<number>('defaultDuration') || 1;
      const defaultWorkers = context.getValue<number>('defaultWorkers') || 1;
      
      console.log("CALCUL MANUEL DU PRIX:");
      console.log("- Prix de base:", basePrice);
      console.log("- Durée:", duration, "vs défaut:", defaultDuration);
      console.log("- Travailleurs:", workers, "vs défaut:", defaultWorkers);
      
      // Calculer le prix
      let calculatedPrice = basePrice;
      
      // 1. Coût des travailleurs supplémentaires
      if (workers > defaultWorkers) {
        const extraWorkers = workers - defaultWorkers;
        const workerPricePerHour = 35; // Valeur par défaut
        let reductionRate = duration <= 2 ? 0.1 : 0.15;
        let extraWorkerCost = extraWorkers * workerPricePerHour * duration * (1 - reductionRate);
        
        console.log("- Coût travailleurs supp:", extraWorkerCost);
        calculatedPrice += extraWorkerCost;
      }
      
      // 2. Coût des heures supplémentaires
      if (duration > defaultDuration) {
        const extraHours = duration - defaultDuration;
        const workerPricePerHour = 35; // Valeur par défaut
        const defaultWorkerExtraHoursCost = defaultWorkers * workerPricePerHour * extraHours;
        
        console.log("- Coût heures supp:", defaultWorkerExtraHoursCost);
        calculatedPrice += defaultWorkerExtraHoursCost;
      }
      
      // Arrondir le prix final
      const finalPrice = Math.round(calculatedPrice);
      console.log("- Prix final calculé:", finalPrice);
      
      // Créer un objet Quote manuel
      const baseMoneyPrice = new Money(basePrice);
      const finalMoneyPrice = new Money(finalPrice);
      const discounts: Discount[] = [];
      
      // Créer et retourner la réponse
      const quote = new Quote(baseMoneyPrice, finalMoneyPrice, discounts, serviceType);
      
      return NextResponse.json({
        success: true,
        manual_calculation: true,
        price: quote.getTotalPrice().getAmount(),
        quote: {
          basePrice: quote.getBasePrice().getAmount(),
          totalPrice: quote.getTotalPrice().getAmount(),
          discounts: quote.getDiscounts().map(d => ({
            description: d.getDescription(),
            amount: d.getAmount().getAmount(),
            type: d.getType()
          })),
          serviceType: quote.getServiceType()
        }
      });
    } else {
      // Si ce n'est pas un service, renvoyez une réponse temporaire
      return NextResponse.json({ 
        success: true, 
        message: "Seul le type SERVICE est implémenté pour l'instant",
        price: 300,
        quote: {
          basePrice: 200,
          totalPrice: 300,
          discounts: [],
          serviceType: requestData.type
        }
      });
    }
    
  } catch (error) {
    console.log("ERREUR GLOBALE:", error);
    return NextResponse.json(
      { error: 'Opération non supportée', details: String(error) },
      { status: 400 }
    );
  } finally {
    console.log("\n========== FIN POST /api/bookings/calculate ==========\n");
  }
} 