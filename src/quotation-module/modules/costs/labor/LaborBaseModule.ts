import { QuoteContext, QuoteModule } from '../../types/quote-types';
import { MODULES_CONFIG } from '../../../config/modules.config';

/**
 * LaborBaseModule - Calcule le coût de base de la main-d'œuvre
 *
 * TYPE : A (systématique)
 * PRIORITÉ : 62 (PHASE 6 - Main d'œuvre)
 * DÉPENDANCES : Nécessite que le volume soit calculé (VolumeEstimationModule) et le nombre de déménageurs (WorkersCalculationModule)
 *
 * RESPONSABILITÉS :
 * - Utilise le nombre de déménageurs calculé par WorkersCalculationModule
 * - Calcule le coût de base de la main-d'œuvre (taux horaire × 7h × nombre de déménageurs)
 */
export class LaborBaseModule implements QuoteModule {
  readonly id = 'labor-base';
  readonly description = "Calcule le coût de base de la main-d'œuvre";
  readonly priority = 62;
  readonly dependencies = ['volume-estimation', 'workers-calculation'];

  apply(ctx: QuoteContext): QuoteContext {
    // Vérifier que le volume est disponible
    const adjustedVolume = ctx.computed?.adjustedVolume;
    if (!adjustedVolume || adjustedVolume <= 0) {
      // Volume non calculé, ne pas appliquer ce module
      return ctx;
    }

    // Utiliser le nombre de déménageurs déjà calculé par WorkersCalculationModule
    const workersCount = ctx.computed?.workersCount;
    if (!workersCount || workersCount <= 0) {
      // Nombre de déménageurs non calculé, ne pas appliquer ce module
      return ctx;
    }

    const laborConfig = MODULES_CONFIG.labor;
    const baseHourlyRate = laborConfig.BASE_HOURLY_RATE;
    const baseWorkHours = laborConfig.BASE_WORK_HOURS;
    
    // Heures de travail : 7h (une journée fixe)
    const estimatedWorkHours = baseWorkHours;
    
    // Calcul du coût de base : taux horaire × heures × nombre de déménageurs
    const baseLaborCost = baseHourlyRate * estimatedWorkHours * workersCount;

    // Logs détaillés du calcul
    console.log(`   💰 CALCUL COÛT MAIN-D'ŒUVRE:`);
    console.log(`      Nombre déménageurs: ${workersCount} (calculé par WorkersCalculationModule)`);
    console.log(`      Heures de travail: ${baseWorkHours}h (une journée)`);
    console.log(`      Taux horaire: ${baseHourlyRate}€/h`);
    console.log(`      Calcul: ${baseHourlyRate}€/h × ${baseWorkHours}h × ${workersCount} pers. = ${baseLaborCost.toFixed(2)}€`);
    console.log(`      = Coût total: ${baseLaborCost.toFixed(2)}€`);

    return {
      ...ctx,
      computed: {
        ...ctx.computed,
        // Mettre à jour le nombre de déménageurs calculé
        workersCount,
        // Utiliser la structure standard : costs est un tableau
        costs: [
          ...(ctx.computed?.costs || []),
          {
            moduleId: this.id,
            label: 'Main-d\'œuvre de base',
            amount: parseFloat(baseLaborCost.toFixed(2)),
            category: 'LABOR',
            metadata: {
              hourlyRate: baseHourlyRate,
              estimatedHours: estimatedWorkHours,
              workersCount,
              volumeUsed: parseFloat(adjustedVolume.toFixed(2)),
            }
          }
        ],
        // Préserver les autres champs
        adjustments: ctx.computed?.adjustments || [],
        riskContributions: ctx.computed?.riskContributions || [],
        legalImpacts: ctx.computed?.legalImpacts || [],
        insuranceNotes: ctx.computed?.insuranceNotes || [],
        requirements: ctx.computed?.requirements || [],
        crossSellProposals: ctx.computed?.crossSellProposals || [],
        operationalFlags: ctx.computed?.operationalFlags || [],
        activatedModules: [
          ...(ctx.computed?.activatedModules || []),
          this.id // String uniquement
        ],
        metadata: {
          ...(ctx.computed?.metadata || {}),
          baseDurationHours: estimatedWorkHours,
        }
      }
    };
  }

}