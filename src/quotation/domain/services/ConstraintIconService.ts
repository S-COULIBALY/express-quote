/**
 * ============================================================================
 * CONSTRAINT ICON SERVICE - Service centralisé pour les icônes
 * ============================================================================
 *
 * 🎯 OBJECTIF :
 * Centraliser toute la logique de mapping des icônes pour les contraintes
 * et services de déménagement et nettoyage.
 *
 * 📋 FONCTIONNALITÉS :
 * - Mapping intelligent des icônes selon le nom de la règle
 * - Support MOVING (déménagement) et CLEANING (nettoyage)
 * - Gestion des catégories de contraintes et services
 * - Fallback vers icônes par défaut si pas de correspondance
 *
 * 🔧 UTILISATION :
 * ```typescript
 * const icon = ConstraintIconService.getIconForRule(
 *   'Monte-meuble requis',
 *   'MOVING',
 *   'constraint'
 * );
 * // Returns: '🏗️'
 * ```
 */

export type ServiceType = 'MOVING' | 'CLEANING';
export type ItemType = 'constraint' | 'service';

export class ConstraintIconService {
  /**
   * Obtenir l'icône pour une règle métier
   */
  static getIconForRule(
    ruleName: string,
    serviceType: ServiceType,
    itemType: ItemType
  ): string {
    if (serviceType === 'MOVING') {
      return this.getIconForMovingRule(ruleName, itemType);
    } else {
      return this.getIconForCleaningRule(ruleName, itemType);
    }
  }

  /**
   * Obtenir l'icône pour une règle de DÉMÉNAGEMENT
   */
  private static getIconForMovingRule(ruleName: string, itemType: ItemType): string {
    const name = ruleName.toLowerCase();

    if (itemType === 'constraint') {
      // Contraintes spécifiques déménagement
      if (name.includes('monte-meuble') || name.includes('furniture lift')) return '🏗️';
      if (name.includes('distance') && name.includes('portage')) return '📏';
      if (name.includes('zone piétonne') || name.includes('pedestrian')) return '🚶';
      if (name.includes('rue') && (name.includes('étroite') || name.includes('inaccessible'))) return '🚧';
      if (name.includes('stationnement') || name.includes('parking')) return '🅿️';
      if (name.includes('circulation') || name.includes('traffic')) return '🚦';

      // Contraintes bâtiment
      if (name.includes('ascenseur')) return '🏢';
      if (name.includes('escalier')) return '🪜';
      if (name.includes('couloir')) return '🚪';
      if (name.includes('sortie') && name.includes('indirect')) return '🔄';
      if (name.includes('multi-niveaux') || name.includes('multilevel')) return '🏗️';

      // Contraintes administratives
      if (name.includes('contrôle') || name.includes('accès')) return '🔒';
      if (name.includes('autorisation') || name.includes('permis')) return '📋';
      if (name.includes('horaire') || name.includes('restriction')) return '⏰';
      if (name.includes('sol fragile') || name.includes('parquet')) return '⚠️';

      return '⚠️'; // Icône par défaut contraintes déménagement
    } else {
      // Services déménagement
      if (name.includes('meuble') && name.includes('volumineux')) return '🛋️';
      if (name.includes('démontage') || name.includes('disassembly')) return '🔧';
      if (name.includes('remontage') || name.includes('reassembly')) return '🔨';
      if (name.includes('piano')) return '🎹';
      if (name.includes('emballage') && name.includes('départ')) return '📦';
      if (name.includes('déballage') || name.includes('unpacking')) return '📭';
      if (name.includes('fourniture') || name.includes('carton')) return '📦';
      if (name.includes('œuvre') || name.includes('artwork')) return '🖼️';
      if (name.includes('fragile') || name.includes('précieux')) return '💎';
      if (name.includes('lourd') || name.includes('heavy')) return '💪';
      if (name.includes('assurance') || name.includes('insurance')) return '🛡️';
      if (name.includes('inventaire') || name.includes('inventory')) return '📋';
      if (name.includes('stockage') || name.includes('storage')) return '🏪';
      if (name.includes('nettoyage') || name.includes('cleaning')) return '🧹';
      if (name.includes('raccordement') || name.includes('utility')) return '🔌';
      if (name.includes('animaux') || name.includes('pet')) return '🐕';

      return '🔧'; // Icône par défaut services déménagement
    }
  }

  /**
   * Obtenir l'icône pour une règle de NETTOYAGE
   */
  private static getIconForCleaningRule(ruleName: string, itemType: ItemType): string {
    const name = ruleName.toLowerCase();

    if (itemType === 'constraint') {
      // Contraintes d'accès
      if (name.includes('stationnement') || name.includes('parking')) return '🅿️';
      if (name.includes('ascenseur')) return '🏢';
      if (name.includes('accès') || name.includes('contrôle') || name.includes('sécurité')) return '🔒';
      if (name.includes('interphone')) return '📞';

      // Contraintes environnementales
      if (name.includes('animaux') || name.includes('chien') || name.includes('chat')) return '🐕';
      if (name.includes('enfants') || name.includes('bébé')) return '👶';
      if (name.includes('allergie') || name.includes('allergique')) return '🤧';
      if (name.includes('fragile') || name.includes('précieux')) return '💎';
      if (name.includes('lourds') || name.includes('meubles')) return '💪';
      if (name.includes('espace') || name.includes('restreint')) return '📏';
      if (name.includes('accumulation') || name.includes('encombré')) return '📦';

      // Contraintes temporelles
      if (name.includes('horaire') || name.includes('matinale') || name.includes('créneau')) return '⏰';
      if (name.includes('soirée') || name.includes('evening')) return '🌆';
      if (name.includes('weekend')) return '📅';
      if (name.includes('urgence')) return '🚨';

      // Contraintes liées au lieu
      if (name.includes('saleté') || name.includes('sale')) return '🧽';
      if (name.includes('construction') || name.includes('travaux')) return '🔨';
      if (name.includes('eau') || name.includes('dégâts')) return '💧';
      if (name.includes('moisissure') || name.includes('champignon')) return '🦠';

      // Contraintes matérielles
      if (name.includes('électricité') || name.includes('courant')) return '⚡';
      if (name.includes('équipement') || name.includes('industriel')) return '🏭';
      if (name.includes('produits') || name.includes('spécifiques')) return '🧪';
      if (name.includes('hauteur') || name.includes('échelle')) return '🪜';

      return '⚠️'; // Icône par défaut contraintes nettoyage
    } else {
      // Services nettoyage (ordre important: spécifique → général)
      if (name.includes('grand nettoyage') || name.includes('printemps')) return '🌸';
      if (name.includes('vitres') || name.includes('fenêtres')) return '🪟';
      if (name.includes('tapis') || name.includes('moquettes')) return '🏠';
      if (name.includes('électroménager') || name.includes('four') || name.includes('frigo')) return '🔌';
      if (name.includes('nettoyage')) return '🧽'; // Plus général, doit être après les cas spécifiques
      if (name.includes('argenterie') || name.includes('bijoux')) return '💍';
      if (name.includes('désinfection') || name.includes('virus') || name.includes('bactéries')) return '🦠';
      if (name.includes('protocole') || name.includes('sanitaire') || name.includes('covid')) return '😷';
      if (name.includes('traitement') || name.includes('allergènes')) return '🤧';
      if (name.includes('entretien') || name.includes('mobilier') || name.includes('cuir')) return '🪑';
      if (name.includes('rangement') || name.includes('organisation')) return '📦';
      if (name.includes('évacuation') || name.includes('déchets')) return '🗑️';
      if (name.includes('réapprovisionnement') || name.includes('achat')) return '🛒';
      if (name.includes('trousseau') || name.includes('clés')) return '🔑';

      return '🧽'; // Icône par défaut services nettoyage
    }
  }

  /**
   * Obtenir le label de catégorie formaté
   */
  static getCategoryLabel(category: string, serviceType: ServiceType): string {
    const categoryMap: Record<string, Record<string, string>> = {
      MOVING: {
        'elevator': 'Ascenseur',
        'access': 'Accès',
        'street': 'Voirie',
        'administrative': 'Administratif',
        'services': 'Services',
        'handling': 'Manutention',
        'packing': 'Emballage',
        'protection': 'Protection',
        'logistics': 'Logistique',
        'other': 'Autres'
      },
      CLEANING: {
        'access': 'Accès',
        'work': 'Conditions de travail',
        'schedule': 'Horaires',
        'location': 'État du lieu',
        'utilities': 'Matériel',
        'specialized': 'Services spécialisés',
        'disinfection': 'Désinfection',
        'maintenance': 'Entretien',
        'logistics': 'Logistique',
        'other': 'Autres'
      }
    };

    return categoryMap[serviceType]?.[category] || category;
  }

  /**
   * Obtenir l'icône pour une catégorie
   */
  static getIconForCategory(category: string, itemType: ItemType): string {
    const categoryIconMap: Record<string, string> = {
      // Déménagement
      'elevator': '🏢',
      'access': '📏',
      'street': '🚛',
      'administrative': '🛡️',
      'services': '🔧',
      'handling': '💪',
      'packing': '📦',
      'protection': '🛡️',

      // Nettoyage
      'work': '👥',
      'schedule': '⏰',
      'location': '🏠',
      'utilities': '⚡',
      'specialized': '🧽',
      'disinfection': '🦠',
      'maintenance': '🪑',
      'logistics': '🚚'
    };

    return categoryIconMap[category] || (itemType === 'constraint' ? '⚠️' : '🔧');
  }

  /**
   * Vérifier si une règle doit être classée comme contrainte ou service
   */
  static classifyRule(ruleName: string, ruleCategory: string, serviceType: ServiceType): ItemType {
    const name = ruleName.toLowerCase();
    const category = ruleCategory.toLowerCase();

    // Classification par catégorie
    if (category === 'surcharge' || category === 'contrainte' || category === 'difficulte') {
      return 'constraint';
    }
    if (category === 'fixed' || category === 'service' || category === 'prestation') {
      return 'service';
    }

    // Classification par mots-clés communs
    const constraintKeywords = [
      'contrainte', 'difficulté', 'obstacle', 'problème', 'restriction',
      'majoration', 'surcharge', 'surcoût', 'supplément'
    ];

    const serviceKeywords = [
      'service', 'prestation', 'option', 'formule', 'nettoyage',
      'désinfection', 'traitement', 'entretien', 'organisation'
    ];

    for (const keyword of constraintKeywords) {
      if (name.includes(keyword)) return 'constraint';
    }

    for (const keyword of serviceKeywords) {
      if (name.includes(keyword)) return 'service';
    }

    // Fallback : si incertain, considérer comme contrainte par défaut
    return 'constraint';
  }
}
