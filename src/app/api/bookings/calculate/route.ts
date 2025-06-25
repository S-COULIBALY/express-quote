import { NextRequest, NextResponse } from 'next/server';
import { QuoteContext } from '@/quotation/domain/valueObjects/QuoteContext';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { Money } from '@/quotation/domain/valueObjects/Money';
import { Discount } from '@/quotation/domain/valueObjects/Discount';
import { Quote } from '@/quotation/domain/valueObjects/Quote';
import { logger } from '@/lib/logger';
import { QuoteCalculatorService } from '@/quotation/application/services/QuoteCalculatorService';
import { FallbackCalculatorService } from '@/quotation/application/services/FallbackCalculatorService';

// Log de chargement de la route spécifique
console.log("\n========== MODULE API/BOOKINGS/CALCULATE/ROUTE.TS CHARGÉ ==========\n");

// Initialiser le service de calculateur
const calculatorService = QuoteCalculatorService.getInstance();
// Initialiser le service de fallback
const fallbackService = FallbackCalculatorService.getInstance();

calculatorService.initialize()
  .then(() => {
    logger.info('✅ Service de calculateur initialisé avec succès pour la route calculate');
    console.log("✅ Service de calculateur initialisé avec succès pour la route calculate");
  })
  .catch(error => {
    logger.error('⚠️ Erreur lors de l\'initialisation du service de calculateur:', error);
    console.error('⚠️ Erreur lors de l\'initialisation du service de calculateur:', error);
  });

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
        // Renommer basePrice en defaultPrice si présent, sinon utiliser basePrice pour compatibilité
        if (requestData.data.basePrice && !requestData.data.defaultPrice) {
          context.setValue('defaultPrice', requestData.data.basePrice);
        } else if (requestData.data.defaultPrice) {
          context.setValue('defaultPrice', requestData.data.defaultPrice);
        }
        context.setValue('duration', requestData.data.duration);
        context.setValue('workers', requestData.data.workers);
        context.setValue('baseWorkers', requestData.data.baseWorkers);
        context.setValue('baseDuration', requestData.data.baseDuration);
        context.setValue('distance', requestData.data.distance);
        break;
        
      case ServiceType.SERVICE:
        console.log("VALEURS SERVICE:", {
          defaultPrice: requestData.data.defaultPrice || requestData.data.basePrice,
          duration: requestData.data.duration,
          workers: requestData.data.workers,
          defaultDuration: requestData.data.defaultDuration,
          defaultWorkers: requestData.data.defaultWorkers
        });
        
        // Renommer basePrice en defaultPrice si présent, sinon utiliser basePrice pour compatibilité
        if (requestData.data.basePrice && !requestData.data.defaultPrice) {
          context.setValue('defaultPrice', requestData.data.basePrice);
        } else if (requestData.data.defaultPrice) {
          context.setValue('defaultPrice', requestData.data.defaultPrice);
        }
        context.setValue('duration', requestData.data.duration);
        context.setValue('workers', requestData.data.workers);
        context.setValue('defaultDuration', requestData.data.defaultDuration);
        context.setValue('defaultWorkers', requestData.data.defaultWorkers);
        break;
    }
    
    // Valider le contexte
    context.validate();
    
    console.log("CONTEXTE VALIDÉ AVEC SUCCÈS");
    
    // ===== UTILISATION DU QUOTECALCULATOR VIA LE SERVICE =====
    try {
      console.log("RÉCUPÉRATION DU CALCULATEUR VIA LE SERVICE");
      
      // Obtenir le calculateur depuis le service partagé
      const calculator = await calculatorService.getCalculator();
      
      console.log("CALCULATEUR DISPONIBLE, TENTATIVE DE CALCUL...");
      
      try {
        // Tentative d'utilisation du calculateur
        console.log("APPEL DE calculator.calculate(context)");
        const quote = await calculator.calculate(context);
        
        console.log("CALCUL RÉUSSI AVEC LE CALCULATEUR!");
        console.log("RÉSULTAT:", {
          basePrice: quote.getBasePrice().getAmount(),
          totalPrice: quote.getTotalPrice().getAmount(),
          discounts: quote.getDiscounts().length
        });
        
        // Retourner le résultat calculé par le calculateur
        const responseData = {
          success: true,
          price: quote.getTotalPrice().getAmount(),
          vat: Math.round(quote.getTotalPrice().getAmount() * 0.2), // Calcul de la TVA (20%)
          totalWithVat: Math.round(quote.getTotalPrice().getAmount() * 1.2), // Montant TTC
          quote: {
            basePrice: quote.getBasePrice().getAmount(),
            totalPrice: quote.getTotalPrice().getAmount(),
            vatAmount: Math.round(quote.getTotalPrice().getAmount() * 0.2),
            totalWithVat: Math.round(quote.getTotalPrice().getAmount() * 1.2),
            discounts: quote.getDiscounts().map(d => ({
              description: d.getDescription(),
              amount: d.getAmount().getAmount(),
              type: d.getType()
            })),
            serviceType: quote.getServiceType()
          },
          calculation_type: "factory_calculator"
        };
        
        console.log("✅ RÉPONSE API DÉTAILLÉE:", JSON.stringify(responseData, null, 2));
        
        return NextResponse.json(responseData);
        
      } catch (calculateError) {
        // Log détaillé de l'erreur pour identifier la cause exacte
        console.log("ERREUR DANS calculator.calculate():", calculateError);
        
        if (calculateError instanceof Error) {
          console.log("TYPE D'ERREUR:", calculateError.constructor.name);
          console.log("MESSAGE D'ERREUR:", calculateError.message);
          console.log("STACK TRACE:", calculateError.stack);
          
          // ===== ANALYSE DE L'ERREUR POUR IDENTIFIER LA CAUSE =====
          // Analyse et logs d'erreurs diverses
          if (calculateError.message.includes('Opération non supportée')) {
            console.log("DÉTECTION DE L'ERREUR 'Opération non supportée'");
            
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
          
          if (calculateError.message.includes('Cannot find module')) {
            console.log("ERREUR DE MODULE MANQUANT DÉTECTÉE");
            console.log("MODULE MANQUANT:", calculateError.message.match(/Cannot find module '([^']+)'/)?.[1]);
          }
          
          if (calculateError.message.includes('is not a function')) {
            console.log("ERREUR DE FONCTION MANQUANTE DÉTECTÉE");
            const funcMatch = calculateError.message.match(/([^\s]+) is not a function/);
            console.log("FONCTION MANQUANTE:", funcMatch?.[1]);
          }
        }
        
        // Fallback sur notre calcul via le FallbackCalculatorService
        console.log("UTILISATION DU FALLBACK CALCULATOR SERVICE");
      }
    } catch (initError) {
      console.log("ERREUR LORS DE L'INITIALISATION DU CALCULATEUR:", initError);
      if (initError instanceof Error) {
        console.log("TYPE D'ERREUR:", initError.constructor.name);
        console.log("MESSAGE D'ERREUR:", initError.message);
        console.log("STACK TRACE:", initError.stack);
      }
      
      // Continuer avec le calcul via le FallbackCalculatorService
      console.log("UTILISATION DU FALLBACK CALCULATOR SERVICE APRÈS ERREUR D'INITIALISATION");
    }
    
    // ===== UTILISATION DU FALLBACKCALCULATORSERVICE =====
    console.log("EXÉCUTION DU CALCUL VIA FALLBACKCALCULATORSERVICE");
    
    let result;
    
    // Appel du service de fallback selon le type de service
    if (serviceType === ServiceType.SERVICE) {
      result = fallbackService.calculateServiceFallback({
        defaultPrice: context.getValue<number>('defaultPrice') || 0,
        duration: context.getValue<number>('duration') || 1,
        workers: context.getValue<number>('workers') || 1,
        defaultDuration: context.getValue<number>('defaultDuration') || 1,
        defaultWorkers: context.getValue<number>('defaultWorkers') || 1
      });
    } 
    else if (serviceType === ServiceType.PACK) {
      result = fallbackService.calculatePackFallback({
        defaultPrice: context.getValue<number>('defaultPrice') || 0,
        workers: context.getValue<number>('workers') || 2,
        duration: context.getValue<number>('duration') || 1,
        baseWorkers: context.getValue<number>('baseWorkers') || 2,
        baseDuration: context.getValue<number>('baseDuration') || 1,
        distance: context.getValue<number>('distance') || 0,
        pickupNeedsLift: context.getValue<boolean>('pickupNeedsLift') || false,
        deliveryNeedsLift: context.getValue<boolean>('deliveryNeedsLift') || false
      });
    }
    else { // ServiceType.MOVING
      result = fallbackService.calculateMovingFallback({
        volume: context.getValue<number>('volume') || 0,
        distance: context.getValue<number>('distance') || 0,
        workers: context.getValue<number>('workers') || 2,
        defaultPrice: context.getValue<number>('defaultPrice') || 0,
        options: context.getValue<Record<string, boolean>>('options') || {},
        pickupNeedsLift: context.getValue<boolean>('pickupNeedsLift') || false,
        deliveryNeedsLift: context.getValue<boolean>('deliveryNeedsLift') || false
      });
    }
    
    // Créer la réponse API à partir des résultats de calcul
    const responseData = fallbackService.createApiResponse(
      serviceType,
      result.quote, 
      result.details,
      requestData
    );
    
    console.log("✅ RÉPONSE API DÉTAILLÉE (FALLBACK SERVICE):", JSON.stringify(responseData, null, 2));
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.log("ERREUR GLOBALE:", error);
    
    // Log plus détaillé des erreurs
    if (error instanceof Error) {
      console.log("TYPE D'ERREUR:", error.constructor.name);
      console.log("MESSAGE:", error.message);
      console.log("STACK:", error.stack);
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors du calcul du prix', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 400 }
    );
  } finally {
    console.log("\n========== FIN POST /api/bookings/calculate ==========\n");
  }
} 