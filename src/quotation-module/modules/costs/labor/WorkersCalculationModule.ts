import { QuoteContext, QuoteModule } from '../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

/**
 * WorkersCalculationModule - Calcule le nombre de déménageurs nécessaires
 *
 * TYPE : A (systématique)
 * PRIORITÉ : 61 (PHASE 6 - Main d'œuvre)
 * DÉPENDANCES : Nécessite que le volume soit calculé (VolumeEstimationModule)
 *
 * RESPONSABILITÉS :
 * - Calcule le nombre de déménageurs selon le volume (volume / 5 m³) - même logique que LaborBaseModule
 */
export class WorkersCalculationModule implements QuoteModule {
  readonly id = 'workers-calculation';
  readonly description = "Calcule le nombre de déménageurs nécessaires";
  readonly priority = 61;
  readonly dependencies = ['volume-estimation'];

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();
    const laborConfig = MODULES_CONFIG.labor;
    
    // Vérifier que le volume est disponible
    const adjustedVolume = computed.adjustedVolume;
    if (!adjustedVolume || adjustedVolume <= 0) {
      // Volume non calculé, utiliser le nombre par défaut
      return {
        ...ctx,
        computed: {
          ...computed,
          workersCount: laborConfig.DEFAULT_WORKERS_COUNT,
          activatedModules: [
            ...computed.activatedModules,
            this.id
          ],
          metadata: {
            ...computed.metadata,
            baseWorkers: laborConfig.DEFAULT_WORKERS_COUNT,
            workforceComplexity: this.evaluateWorkforceComplexity(laborConfig.DEFAULT_WORKERS_COUNT),
          }
        }
      };
    }

    // Calcul du nombre de déménageurs : volume / 5 m³ (même logique que LaborBaseModule)
    // Arrondi standard : si partie décimale > 0.5 → arrondi au supérieur, sinon arrondi à l'inférieur
    const volumePerWorker = laborConfig.VOLUME_PER_WORKER;
    let baseWorkersCount = Math.round(adjustedVolume / volumePerWorker);
    
    // Détecter le scénario depuis les métadonnées
    const scenarioId = ctx.metadata?.scenarioId as string | undefined;
    
    // Appliquer les règles spécifiques selon le scénario
    let workersCount = baseWorkersCount;
    let scenarioAdjustment: { type: string; value: number; final: number } | undefined;
    
    if (scenarioId === 'ECO') {
      // Scénario ECO : maximum défini dans MODULES_CONFIG
      const maxWorkers = laborConfig.SCENARIO_RULES.ECO_MAX_WORKERS;
      if (baseWorkersCount > maxWorkers) {
        scenarioAdjustment = {
          type: 'ECO_MAX_LIMIT',
          value: maxWorkers,
          final: maxWorkers,
        };
        workersCount = maxWorkers;
      }
    } else if (scenarioId === 'STANDARD') {
      // Scénario STANDARD : facteur de réduction défini dans MODULES_CONFIG
      // Arrondi standard : si partie décimale > 0.5 → arrondi au supérieur, sinon arrondi à l'inférieur
      const factor = laborConfig.SCENARIO_RULES.STANDARD_WORKERS_FACTOR;
      const adjustedWorkers = Math.round(baseWorkersCount * factor);
      scenarioAdjustment = {
        type: 'STANDARD_HALF',
        value: adjustedWorkers,
        final: adjustedWorkers,
      };
      workersCount = adjustedWorkers;
    }
    
    // Logs détaillés du calcul
    const baseCalculation = adjustedVolume / volumePerWorker;
    const decimalPart = baseCalculation % 1;
    console.log(`   🔧 CALCUL NOMBRE DÉMÉNAGEURS:`);
    console.log(`      Volume ajusté: ${adjustedVolume.toFixed(2)} m³`);
    console.log(`      Volume par déménageur: ${volumePerWorker} m³`);
    console.log(`      Calcul de base: ${adjustedVolume.toFixed(2)} m³ / ${volumePerWorker} m³ = ${baseCalculation.toFixed(2)}`);
    if (decimalPart > 0) {
      const roundingDirection = decimalPart > 0.5 ? 'arrondi au supérieur' : decimalPart < 0.5 ? 'arrondi à l\'inférieur' : 'exact';
      console.log(`      Arrondi: ${baseCalculation.toFixed(2)} → ${baseWorkersCount} déménageur(s) (${roundingDirection})`);
    } else {
      console.log(`      Résultat exact: ${baseWorkersCount} déménageur(s)`);
    }
    
    if (scenarioId) {
      console.log(`      Scénario détecté: ${scenarioId}`);
      if (scenarioAdjustment) {
        if (scenarioId === 'ECO') {
          const maxWorkers = laborConfig.SCENARIO_RULES.ECO_MAX_WORKERS;
          console.log(`      Règle ECO: Maximum ${maxWorkers} déménageurs`);
          console.log(`      Ajustement: ${baseWorkersCount} → ${scenarioAdjustment.final} (plafonné)`);
        } else if (scenarioId === 'STANDARD') {
          const factor = laborConfig.SCENARIO_RULES.STANDARD_WORKERS_FACTOR;
          const standardCalculation = baseWorkersCount * factor;
          console.log(`      Règle STANDARD: Facteur ${(factor * 100).toFixed(0)}% du nombre calculé`);
          console.log(`      Calcul: ${baseWorkersCount} × ${factor} = ${standardCalculation.toFixed(2)}`);
          console.log(`      Arrondi: ${standardCalculation.toFixed(2)} → ${scenarioAdjustment.final} ${standardCalculation % 1 > 0.5 ? '(arrondi au supérieur)' : standardCalculation % 1 < 0.5 ? '(arrondi à l\'inférieur)' : '(exact)'}`);
        }
      } else {
        console.log(`      Aucun ajustement nécessaire pour ce scénario`);
      }
    }
    
    console.log(`      = Nombre final: ${workersCount} déménageur(s)`);
    
    return {
      ...ctx,
      computed: {
        ...computed,
        // Utiliser la structure standard : workersCount
        workersCount,
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          baseWorkers: baseWorkersCount,
          volumePerWorker,
          scenarioId: scenarioId || null,
          scenarioAdjustment: scenarioAdjustment || null,
          workforceComplexity: this.evaluateWorkforceComplexity(workersCount),
        }
      }
    };
  }

  /**
   * Évalue la complexité de la main-d'œuvre
   */
  private evaluateWorkforceComplexity(workers: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (workers <= 2) return 'LOW';
    if (workers <= 3) return 'MEDIUM';
    return 'HIGH';
  }
}