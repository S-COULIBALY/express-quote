import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';
import { recommendSupplyPack } from '@/config/services-catalog';

/**
 * SuppliesCostModule - Ajoute le coût des fournitures sélectionnées dans le catalogue
 *
 * TYPE : A (exécution directe basée sur données d'entrée)
 * PRIORITÉ : 90 (PHASE 9 - Finalisation, après tous les autres modules)
 * DÉPENDANCES : aucune
 *
 * RESPONSABILITÉS :
 * - Ajoute le total des fournitures cross-selling au coût final
 * - STANDARD : Si le client a sélectionné des fournitures → utilise son total réel
 * - CONFORT/PREMIUM/SECURITY_PLUS : Toujours utilise un pack recommandé basé sur le volume
 *   (les fournitures sont incluses dans la formule, donc on ignore la sélection client)
 *
 * NOTE : Dans les formules haut de gamme, les fournitures sont incluses dans le pack,
 * donc on ne facture pas les fournitures sélectionnées par le client en plus.
 */
export class SuppliesCostModule implements QuoteModule {
  readonly id = 'supplies-cost';
  readonly description = 'Ajoute le coût des fournitures cross-selling';
  readonly priority = 90; // PHASE 9 - Finalisation (après cross-selling services)
  readonly dependencies: string[] = [];

  /**
   * Le module s'applique si :
   * - Des fournitures ont été sélectionnées par le client (crossSellingSuppliesTotal > 0)
   * - OU le scénario force les fournitures (forceSupplies: true)
   */
  isApplicable(ctx: QuoteContext): boolean {
    const suppliesTotal = ctx.crossSellingSuppliesTotal;
    const hasClientSupplies = suppliesTotal !== undefined && suppliesTotal > 0;
    const isForcedByScenario = ctx.forceSupplies === true;
    
    return hasClientSupplies || isForcedByScenario;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    const suppliesTotal = ctx.crossSellingSuppliesTotal || 0;
    const suppliesDetails = ctx.crossSellingSuppliesDetails || [];
    const isForcedByScenario = ctx.forceSupplies === true;
    const hasClientSupplies = suppliesTotal > 0 && suppliesDetails.length > 0;
    
    // Récupérer le scénario depuis les métadonnées (injecté par MultiQuoteService)
    const scenarioId = ctx.metadata?.scenarioId as string | undefined;
    const isHighEndScenario = scenarioId === 'CONFORT' || scenarioId === 'PREMIUM' || scenarioId === 'SECURITY_PLUS';
    const isStandardScenario = scenarioId === 'STANDARD';

    let finalSuppliesTotal: number;
    let finalSuppliesDetails: Array<{
      id: string;
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    // CAS 1 : Scénarios haut de gamme (CONFORT, PREMIUM, SECURITY_PLUS) → Toujours pack recommandé
    // Les fournitures sont incluses dans la formule, donc on ignore la sélection client
    if (isHighEndScenario) {
      // Récupérer le volume depuis le contexte computed (calculé par VolumeEstimationModule)
      const volume = computed.metadata?.adjustedVolume || computed.metadata?.estimatedVolume || ctx.estimatedVolume || 0;
      
      // Recommander un pack selon le volume
      const recommendedPack = recommendSupplyPack(volume);
      
      if (recommendedPack) {
        // Prix du pack de base
        const packPrice = recommendedPack.price;
        
        // Ajouter une marge pour protections additionnelles selon le volume
        // - Volume ≤ 15 m³ : 20€ (protections de base)
        // - Volume 15-35 m³ : 30€ (protections moyennes)
        // - Volume 35-60 m³ : 50€ (protections complètes)
        // - Volume > 60 m³ : 70€ (protections complètes + marge)
        let protectionMargin = 20;
        if (volume > 15 && volume <= 35) {
          protectionMargin = 30;
        } else if (volume > 35 && volume <= 60) {
          protectionMargin = 50;
        } else if (volume > 60) {
          protectionMargin = 70;
        }
        
        finalSuppliesTotal = packPrice + protectionMargin;
        
        // Créer les détails du pack recommandé
        finalSuppliesDetails = [{
          id: recommendedPack.id,
          name: recommendedPack.title,
          quantity: 1,
          unitPrice: packPrice,
          totalPrice: packPrice,
        }];
        
        if (protectionMargin > 0) {
          finalSuppliesDetails.push({
            id: 'protections-additionnelles',
            name: 'Protections additionnelles',
            quantity: 1,
            unitPrice: protectionMargin,
            totalPrice: protectionMargin,
          });
        }

        // Log du pack recommandé
        console.log(`   📦 FOURNITURES CROSS-SELLING (PACK RECOMMANDÉ):`);
        console.log(`      Scénario: ${scenarioId} (fournitures incluses dans la formule)`);
        console.log(`      Volume: ${volume.toFixed(2)} m³`);
        console.log(`      Pack recommandé: ${recommendedPack.title} (${recommendedPack.recommendedForVolume?.min}-${recommendedPack.recommendedForVolume?.max} m³)`);
        console.log(`      Prix pack: ${packPrice.toFixed(2)}€`);
        if (protectionMargin > 0) {
          console.log(`      Protections additionnelles: ${protectionMargin.toFixed(2)}€`);
        }
        console.log(`      = Total fournitures: ${finalSuppliesTotal.toFixed(2)}€`);
      } else {
        // Fallback : si aucun pack recommandé (volume hors limites), utiliser un pack par défaut
        const defaultPackPrice = 89; // Pack Famille par défaut
        const defaultProtectionMargin = 30;
        finalSuppliesTotal = defaultPackPrice + defaultProtectionMargin;
        
        finalSuppliesDetails = [{
          id: 'pack-default',
          name: 'Pack fournitures (par défaut)',
          quantity: 1,
          unitPrice: defaultPackPrice,
          totalPrice: defaultPackPrice,
        }, {
          id: 'protections-additionnelles',
          name: 'Protections additionnelles',
          quantity: 1,
          unitPrice: defaultProtectionMargin,
          totalPrice: defaultProtectionMargin,
        }];

        console.log(`   📦 FOURNITURES CROSS-SELLING (PACK PAR DÉFAUT):`);
        console.log(`      Scénario: ${scenarioId} (fournitures incluses dans la formule)`);
        console.log(`      Volume: ${volume.toFixed(2)} m³ (hors limites recommandées)`);
        console.log(`      Pack par défaut: ${defaultPackPrice.toFixed(2)}€`);
        console.log(`      Protections additionnelles: ${defaultProtectionMargin.toFixed(2)}€`);
        console.log(`      = Total fournitures: ${finalSuppliesTotal.toFixed(2)}€`);
      }
    }
    // CAS 2 : Scénario STANDARD → Utiliser le total réel si le client a sélectionné
    else if (isStandardScenario && hasClientSupplies) {
      finalSuppliesTotal = typeof suppliesTotal === 'number' ? suppliesTotal : parseFloat(String(suppliesTotal)) || 0;
      finalSuppliesDetails = suppliesDetails.map(item => {
        const itemTotal = (item as any).totalPrice ?? (item as any).total ?? 0;
        return {
          id: item.id || 'unknown',
          name: item.name || 'Article sans nom',
          quantity: item.quantity || 0,
          unitPrice: item.unitPrice || 0,
          totalPrice: Number(itemTotal),
        };
      });

      // Log détaillé des fournitures sélectionnées par le client
      console.log(`   📦 FOURNITURES CROSS-SELLING:`);
      console.log(`      Scénario: STANDARD (total réel du client)`);
      console.log(`      Nombre d'articles: ${suppliesDetails.length}`);
      suppliesDetails.forEach((item) => {
        const itemTotal = (item as any).totalPrice ?? (item as any).total ?? 0;
        const itemName = item.name || 'Article sans nom';
        const itemQuantity = item.quantity || 0;
        
        if (itemTotal > 0) {
          console.log(`      - ${itemName} x${itemQuantity}: ${Number(itemTotal).toFixed(2)}€`);
        } else {
          console.log(`      - ${itemName} x${itemQuantity}: (prix non défini)`);
        }
      });
      console.log(`      = Total fournitures: ${finalSuppliesTotal.toFixed(2)}€`);
    } else {
      // Cas non applicable (ne devrait pas arriver grâce à isApplicable)
      return ctx;
    }

    return {
      ...ctx,
      computed: {
        ...computed,
        costs: [
          ...computed.costs,
          {
            moduleId: this.id,
            category: 'SERVICE', // Fournitures = service optionnel client
            label: 'Fournitures d\'emballage',
            amount: parseFloat(finalSuppliesTotal.toFixed(2)),
            metadata: {
              type: 'SUPPLIES', // Sous-type pour distinction
              itemsCount: finalSuppliesDetails.length,
              isRecommended: isHighEndScenario, // Indique si c'est un pack recommandé (scénarios haut de gamme)
              details: finalSuppliesDetails,
            }
          }
        ],
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          crossSellingSuppliesTotal: finalSuppliesTotal,
          crossSellingSuppliesCount: finalSuppliesDetails.length,
        }
      }
    };
  }
}
