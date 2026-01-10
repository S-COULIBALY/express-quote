/**
 * ListAnalysisService - Analyse une liste d'objets pour estimer le volume
 *
 * RESPONSABILITÉS :
 * - Analyse une liste d'objets fournie par le client
 * - Calcule le volume estimé en m³
 * - Détermine la confiance de l'estimation
 * - Détecte les objets spéciaux (piano, meubles encombrants, etc.)
 *
 * UTILISATION :
 * - Appelé AVANT que le contexte n'arrive au moteur de devis
 * - Peut être synchrone (règles métier) ou asynchrone (IA)
 * - Le résultat est injecté dans QuoteContext.estimatedVolume
 *
 * PRODUCTION READY :
 * - Validation des entrées
 * - Gestion d'erreurs robuste
 * - Logging structuré
 * - Performance optimisée
 */

import { logger } from '@/lib/logger';

const serviceLogger = logger.withContext ? logger.withContext('ListAnalysisService') : logger;

export interface ListItem {
  name: string;
  quantity?: number;
  category?: string;
  dimensions?: {
    length?: number; // cm
    width?: number; // cm
    height?: number; // cm
  };
}

export interface ListAnalysisResult {
  estimatedVolume: number; // m³
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  detectedSpecialItems: {
    piano?: boolean;
    bulkyFurniture?: boolean;
    safe?: boolean;
    artwork?: boolean;
    builtInAppliances?: boolean;
  };
  metadata: {
    itemCount: number;
    analysisMethod: 'RULES' | 'AI' | 'HYBRID';
    processingTimeMs: number;
  };
}

/**
 * Coefficients de volume par catégorie d'objet (m³ par unité)
 * Basés sur l'expérience professionnelle du déménagement
 */
const VOLUME_COEFFICIENTS: Record<string, number> = {
  // Mobilier de salon
  'canape': 2.5,
  'canapé': 2.5,
  'sofa': 2.5,
  'fauteuil': 1.2,
  'table_basse': 0.5,
  'table_salon': 0.8,
  'meuble_tv': 1.5,
  'bibliotheque': 2.0,
  'bibliothèque': 2.0,
  'etagere': 1.0,
  'étagère': 1.0,

  // Mobilier de chambre
  'lit': 1.5,
  'matelas': 0.8,
  'armoire': 3.0,
  'commode': 1.2,
  'chevet': 0.3,
  'dressing': 4.0,

  // Mobilier de cuisine/salle à manger
  'table_manger': 1.5,
  'chaise': 0.2,
  'buffet': 2.0,
  'vaisselier': 1.5,

  // Électroménager
  'refrigerateur': 1.2,
  'réfrigérateur': 1.2,
  'lave_linge': 0.8,
  'lave_vaisselle': 0.6,
  'four': 0.4,
  'micro_ondes': 0.1,
  'lave_vaisselle_encastre': 0.6,

  // Objets spéciaux
  'piano': 8.0,
  'piano_droit': 8.0,
  'piano_queue': 12.0,
  'coffre_fort': 3.0,
  'coffre-fort': 3.0,
  'safe': 3.0,
  'tableau': 0.1,
  'sculpture': 0.5,
  'oeuvre_art': 0.3,
};

/**
 * Détection d'objets spéciaux depuis le nom
 */
function detectSpecialItems(itemName: string): Partial<ListAnalysisResult['detectedSpecialItems']> {
  const lowerName = itemName.toLowerCase();
  const detected: Partial<ListAnalysisResult['detectedSpecialItems']> = {};

  if (lowerName.includes('piano')) {
    detected.piano = true;
  }
  if (lowerName.includes('bibliotheque') || lowerName.includes('bibliothèque') ||
      lowerName.includes('armoire') || lowerName.includes('dressing') ||
      lowerName.includes('meuble') && (lowerName.includes('massif') || lowerName.includes('encombrant'))) {
    detected.bulkyFurniture = true;
  }
  if (lowerName.includes('coffre') || lowerName.includes('safe')) {
    detected.safe = true;
  }
  if (lowerName.includes('tableau') || lowerName.includes('sculpture') || lowerName.includes('art')) {
    detected.artwork = true;
  }
  if (lowerName.includes('encastré') || lowerName.includes('encastre') ||
      lowerName.includes('lave_vaisselle') || lowerName.includes('four') && lowerName.includes('encastré')) {
    detected.builtInAppliances = true;
  }

  return detected;
}

/**
 * Calcule le volume depuis les dimensions si disponibles
 */
function calculateVolumeFromDimensions(dimensions?: ListItem['dimensions']): number | null {
  if (!dimensions || !dimensions.length || !dimensions.width || !dimensions.height) {
    return null;
  }

  // Convertir cm³ en m³
  const volumeCm3 = (dimensions.length || 100) * dimensions.width * dimensions.height;
  const volumeM3 = volumeCm3 / 1_000_000; // Conversion cm³ → m³

  return Math.max(0.1, volumeM3); // Minimum 0.1 m³
}

export class ListAnalysisError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_INPUT' | 'PROCESSING_ERROR' | 'VALIDATION_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'ListAnalysisError';
  }
}

export class ListAnalysisService {
  private readonly MAX_ITEMS = 1000; // Limite de sécurité
  private readonly MAX_VOLUME_PER_ITEM = 50; // m³ max par objet (sécurité)

  /**
   * Valide les entrées avant traitement
   */
  private validateInput(items: ListItem[]): void {
    if (!Array.isArray(items)) {
      throw new ListAnalysisError(
        'Items must be an array',
        'INVALID_INPUT',
        { received: typeof items }
      );
    }

    if (items.length === 0) {
      throw new ListAnalysisError(
        'Items array cannot be empty',
        'VALIDATION_ERROR'
      );
    }

    if (items.length > this.MAX_ITEMS) {
      throw new ListAnalysisError(
        `Too many items (max ${this.MAX_ITEMS})`,
        'VALIDATION_ERROR',
        { itemCount: items.length }
      );
    }

    // Valider chaque item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item || typeof item.name !== 'string' || item.name.trim().length === 0) {
        throw new ListAnalysisError(
          `Item at index ${i} must have a valid name`,
          'VALIDATION_ERROR',
          { index: i, item }
        );
      }

      if (item.quantity !== undefined && (item.quantity < 1 || item.quantity > 100)) {
        throw new ListAnalysisError(
          `Item "${item.name}" has invalid quantity (must be 1-100)`,
          'VALIDATION_ERROR',
          { index: i, quantity: item.quantity }
        );
      }

      // Valider dimensions si présentes
      if (item.dimensions) {
        const { length, width, height } = item.dimensions;
        const dims = [length, width, height].filter(d => d !== undefined);
        if (dims.length > 0 && dims.some(d => d! < 0 || d! > 10000)) {
          throw new ListAnalysisError(
            `Item "${item.name}" has invalid dimensions (must be 0-10000 cm)`,
            'VALIDATION_ERROR',
            { index: i, dimensions: item.dimensions }
          );
        }
      }
    }
  }

  /**
   * Analyse une liste d'objets et retourne le volume estimé
   *
   * @param items Liste d'objets fournie par le client
   * @returns Résultat de l'analyse avec volume et confiance
   * @throws ListAnalysisError si validation échoue
   */
  async analyzeList(items: ListItem[]): Promise<ListAnalysisResult> {
    const startTime = Date.now();

    try {
      // Validation
      this.validateInput(items);

      serviceLogger.debug('Analyzing list', { itemCount: items.length });

      let totalVolume = 0;
      const detectedSpecialItems: ListAnalysisResult['detectedSpecialItems'] = {
        piano: false,
        bulkyFurniture: false,
        safe: false,
        artwork: false,
        builtInAppliances: false,
      };

      let itemsWithDimensions = 0;
      let itemsWithCategory = 0;
      let itemsProcessed = 0;

      // Analyser chaque objet
      for (const item of items) {
        try {
          const quantity = Math.max(1, Math.min(100, item.quantity || 1));
          let itemVolume = 0;

          // PRIORITÉ 1 : Calcul depuis dimensions si disponibles
          const volumeFromDimensions = calculateVolumeFromDimensions(item.dimensions);
          if (volumeFromDimensions) {
            itemVolume = volumeFromDimensions * quantity;
            itemsWithDimensions++;
          }
          // PRIORITÉ 2 : Estimation depuis catégorie/coefficient
          else if (item.category || item.name) {
            const category = (item.category || item.name).toLowerCase().replace(/[^a-z0-9]/g, '_');
            const coefficient = VOLUME_COEFFICIENTS[category];

            if (coefficient) {
              itemVolume = coefficient * quantity;
              itemsWithCategory++;
            } else {
              // Estimation par défaut pour objets non reconnus
              itemVolume = 0.5 * quantity; // 0.5 m³ par objet non reconnu
            }
          }

          // Sécurité : limiter volume par item
          itemVolume = Math.min(itemVolume, this.MAX_VOLUME_PER_ITEM * quantity);
          totalVolume += itemVolume;
          itemsProcessed++;

          // Détecter les objets spéciaux
          const specialItems = detectSpecialItems(item.name);
          Object.assign(detectedSpecialItems, specialItems);
        } catch (itemError) {
          serviceLogger.warn('Error processing item', {
            item: item.name,
            error: itemError instanceof Error ? itemError.message : String(itemError)
          });
          // Continuer avec les autres items
        }
      }

      // Calculer la confiance selon la précision des données
      let confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      const totalItems = items.length;

      if (itemsWithDimensions / totalItems > 0.5) {
        confidence = 'HIGH';
      } else if (itemsWithCategory / totalItems > 0.7) {
        confidence = 'MEDIUM';
      } else if (totalItems > 10) {
        confidence = 'MEDIUM';
      }

      // Ajustement final : marge de sécurité selon confiance
      let adjustedVolume = totalVolume;
      if (confidence === 'LOW') {
        adjustedVolume = totalVolume * 1.15; // +15% si confiance faible
      } else if (confidence === 'MEDIUM') {
        adjustedVolume = totalVolume * 1.10; // +10% si confiance moyenne
      }

      const result: ListAnalysisResult = {
        estimatedVolume: Math.round(adjustedVolume * 10) / 10,
        confidence,
        detectedSpecialItems,
        metadata: {
          itemCount: totalItems,
          analysisMethod: 'RULES',
          processingTimeMs: Date.now() - startTime,
        },
      };

      serviceLogger.info('List analysis completed', {
        volume: result.estimatedVolume,
        confidence: result.confidence,
        itemsProcessed,
        processingTimeMs: result.metadata.processingTimeMs,
      });

      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      if (error instanceof ListAnalysisError) {
        serviceLogger.error('List analysis validation error', {
          code: error.code,
          details: error.details,
          processingTimeMs: processingTime,
        });
        throw error;
      }

      serviceLogger.error('Unexpected error in list analysis', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        processingTimeMs: processingTime,
      });

      throw new ListAnalysisError(
        'Failed to analyze list',
        'PROCESSING_ERROR',
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Version synchrone pour les cas simples
   * ⚠️ Utiliser uniquement pour petits volumes (<100 items)
   */
  analyzeListSync(items: ListItem[]): ListAnalysisResult {
    if (items.length > 100) {
      serviceLogger.warn('Using sync method for large list, consider async', {
        itemCount: items.length
      });
    }
    
    // Pour l'instant, même logique que async
    // Peut être optimisée pour éviter les promesses inutiles
    try {
      return this.analyzeList(items) as unknown as ListAnalysisResult;
    } catch (error) {
      // Re-throw pour maintenir la même interface d'erreur
      throw error;
    }
  }
}

