/**
 * Helpers pour faciliter l'utilisation des services dans les tests
 *
 * Ces helpers permettent d'utiliser facilement les providers MOCK
 * dans les tests sans configuration complexe
 */

import { VideoAnalysisService } from "./VideoAnalysisService";
import { ListAnalysisService } from "./ListAnalysisService";
import type { VideoAnalysisOptions } from "./VideoAnalysisService";
import type { ListItem } from "./ListAnalysisService";

/**
 * Crée une instance de VideoAnalysisService configurée pour les tests
 * Utilise automatiquement le provider MOCK
 *
 * @param options Options additionnelles pour le service
 * @returns Instance configurée pour les tests
 */
export function createTestVideoAnalysisService(
  options?: VideoAnalysisOptions,
): VideoAnalysisService {
  return new VideoAnalysisService({
    ...options,
    provider: "CUSTOM" as const, // Utiliser CUSTOM pour les tests (MOCK n'est pas dans le type)
  });
}

/**
 * Crée une instance de ListAnalysisService pour les tests
 * (Pas de configuration spéciale nécessaire, mais helper pour cohérence)
 *
 * @returns Instance du service
 */
export function createTestListAnalysisService(): ListAnalysisService {
  return new ListAnalysisService();
}

/**
 * Données de test prédéfinies pour faciliter les tests
 */
export const TEST_DATA = {
  /**
   * Liste d'objets standard pour tests
   */
  standardItems: [
    { name: "Canapé 3 places", quantity: 1, category: "canape" },
    { name: "Table basse", quantity: 1, category: "table_basse" },
    { name: "Bibliothèque", quantity: 1, category: "bibliotheque" },
    { name: "Armoire", quantity: 1, category: "armoire" },
    { name: "Chaise", quantity: 6, category: "chaise" },
  ] as ListItem[],

  /**
   * Liste avec objets spéciaux pour tests
   */
  itemsWithSpecial: [
    { name: "Canapé", quantity: 1, category: "canape" },
    { name: "Piano droit", quantity: 1, category: "piano" },
    { name: "Coffre-fort", quantity: 1, category: "coffre_fort" },
    { name: "Tableau", quantity: 3, category: "tableau" },
  ] as ListItem[],

  /**
   * URL de vidéo de test (mock)
   */
  testVideoUrl: "https://example.com/test-video.mp4",

  /**
   * URL de vidéo avec piano pour tests spécifiques
   */
  testVideoUrlWithPiano: "https://example.com/test-video-piano.mp4",
};

/**
 * Configuration de test par défaut
 */
export const TEST_CONFIG = {
  /**
   * Force l'utilisation de MOCK dans les tests
   */
  forceMockProvider: () => {
    process.env.VIDEO_ANALYSIS_PROVIDER = "MOCK";
  },

  /**
   * Restaure la configuration originale
   */
  restoreProvider: () => {
    delete process.env.VIDEO_ANALYSIS_PROVIDER;
  },
};
