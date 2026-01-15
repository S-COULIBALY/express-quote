// @ts-nocheck
/**
 * Helper pour déterminer les services inclus/optionnels/non disponibles par scénario
 * Basé sur le tableau restructuré (lecture orientée client)
 */

export interface ServiceStatus {
  id: string;
  label: string;
  status: 'included' | 'optional' | 'disabled' | 'conditional';
  description?: string;
}

export interface ScenarioServices {
  included: ServiceStatus[];
  optional: ServiceStatus[];
  disabled: ServiceStatus[];
  conditional: ServiceStatus[];
}

const SERVICES = [
  { id: 'packing', label: 'Emballage', description: 'Emballage professionnel' },
  { id: 'supplies', label: 'Fournitures', description: 'Cartons, protections' },
  { id: 'dismantling', label: 'Démontage', description: 'Démontage des meubles' },
  { id: 'reassembly', label: 'Remontage', description: 'Remontage des meubles' },
  { id: 'high-value', label: 'Objets de valeur', description: 'Objets fragiles / de valeur' },
  { id: 'insurance', label: 'Assurance renforcée', description: 'Assurance valeur déclarée' },
  { id: 'cleaning', label: 'Nettoyage', description: 'Nettoyage fin de prestation' },
  { id: 'furniture-lift', label: 'Monte-meubles', description: 'Monte-meubles (si requis)' },
  { id: 'overnight', label: 'Étape / nuit', description: 'Arrêt nuit intermédiaire' },
  { id: 'flexibility', label: 'Flexibilité équipe', description: 'Flexibilité planning' },
] as const;

/**
 * Détermine les services pour un scénario donné
 */
export function getScenarioServices(scenarioId: string): ScenarioServices {
  const result: ScenarioServices = {
    included: [],
    optional: [],
    disabled: [],
    conditional: [],
  };

  switch (scenarioId) {
    case 'ECO':
      // ECO : Transport uniquement
      result.disabled = [
        SERVICES.find(s => s.id === 'packing')!,
        SERVICES.find(s => s.id === 'supplies')!,
        SERVICES.find(s => s.id === 'dismantling')!,
        SERVICES.find(s => s.id === 'reassembly')!,
        SERVICES.find(s => s.id === 'high-value')!,
        SERVICES.find(s => s.id === 'cleaning')!,
        SERVICES.find(s => s.id === 'overnight')!,
        SERVICES.find(s => s.id === 'flexibility')!,
      ].filter(Boolean);
      result.optional = [
        SERVICES.find(s => s.id === 'insurance')!,
      ].filter(Boolean);
      result.conditional = [
        SERVICES.find(s => s.id === 'furniture-lift')!,
      ].filter(Boolean);
      break;

    case 'STANDARD':
      // STANDARD : Participation client
      result.optional = [
        SERVICES.find(s => s.id === 'packing')!,
        SERVICES.find(s => s.id === 'supplies')!,
        SERVICES.find(s => s.id === 'dismantling')!,
        SERVICES.find(s => s.id === 'reassembly')!,
        SERVICES.find(s => s.id === 'high-value')!,
        SERVICES.find(s => s.id === 'insurance')!,
        SERVICES.find(s => s.id === 'overnight')!,
        SERVICES.find(s => s.id === 'flexibility')!,
      ].filter(Boolean);
      result.disabled = [
        SERVICES.find(s => s.id === 'cleaning')!,
      ].filter(Boolean);
      result.conditional = [
        SERVICES.find(s => s.id === 'furniture-lift')!,
      ].filter(Boolean);
      break;

    case 'CONFORT':
      // CONFORT : Déménageur fait l'essentiel
      result.included = [
        SERVICES.find(s => s.id === 'packing')!,
        SERVICES.find(s => s.id === 'supplies')!,
        SERVICES.find(s => s.id === 'dismantling')!,
        SERVICES.find(s => s.id === 'reassembly')!,
      ].filter(Boolean);
      result.optional = [
        SERVICES.find(s => s.id === 'high-value')!,
        SERVICES.find(s => s.id === 'insurance')!,
        SERVICES.find(s => s.id === 'cleaning')!,
        SERVICES.find(s => s.id === 'overnight')!,
        SERVICES.find(s => s.id === 'flexibility')!,
      ].filter(Boolean);
      result.conditional = [
        SERVICES.find(s => s.id === 'furniture-lift')!,
      ].filter(Boolean);
      break;

    case 'PREMIUM':
      // PREMIUM : Prise en charge complète
      result.included = [
        SERVICES.find(s => s.id === 'packing')!,
        SERVICES.find(s => s.id === 'supplies')!,
        SERVICES.find(s => s.id === 'dismantling')!,
        SERVICES.find(s => s.id === 'reassembly')!,
        SERVICES.find(s => s.id === 'high-value')!,
        SERVICES.find(s => s.id === 'insurance')!,
        SERVICES.find(s => s.id === 'cleaning')!,
      ].filter(Boolean);
      result.optional = [
        SERVICES.find(s => s.id === 'overnight')!,
        SERVICES.find(s => s.id === 'flexibility')!,
      ].filter(Boolean);
      result.conditional = [
        SERVICES.find(s => s.id === 'furniture-lift')!,
      ].filter(Boolean);
      break;

    case 'SECURITY_PLUS':
    case 'SECURITY': // Support de l'ancien nom pour compatibilité
      // SÉCURITÉ+ : Premium + Protection maximale
      result.included = [
        SERVICES.find(s => s.id === 'packing')!,
        SERVICES.find(s => s.id === 'supplies')!,
        SERVICES.find(s => s.id === 'dismantling')!,
        SERVICES.find(s => s.id === 'reassembly')!,
        SERVICES.find(s => s.id === 'high-value')!,
        SERVICES.find(s => s.id === 'insurance')!,
        SERVICES.find(s => s.id === 'cleaning')!,
      ].filter(Boolean);
      result.optional = [
        SERVICES.find(s => s.id === 'overnight')!,
        SERVICES.find(s => s.id === 'flexibility')!,
      ].filter(Boolean);
      result.conditional = [
        SERVICES.find(s => s.id === 'furniture-lift')!,
      ].filter(Boolean);
      break;

    case 'FLEX':
      // FLEX : Devis sur mesure
      result.included = [
        SERVICES.find(s => s.id === 'dismantling')!,
        SERVICES.find(s => s.id === 'reassembly')!,
        SERVICES.find(s => s.id === 'overnight')!,
        SERVICES.find(s => s.id === 'flexibility')!,
      ].filter(Boolean);
      result.optional = [
        SERVICES.find(s => s.id === 'packing')!,
        SERVICES.find(s => s.id === 'supplies')!,
        SERVICES.find(s => s.id === 'high-value')!,
        SERVICES.find(s => s.id === 'insurance')!,
        SERVICES.find(s => s.id === 'cleaning')!,
      ].filter(Boolean);
      result.conditional = [
        SERVICES.find(s => s.id === 'furniture-lift')!,
      ].filter(Boolean);
      break;

    default:
      // Par défaut, tous les services sont optionnels
      result.optional = [...SERVICES];
  }

  return result;
}

/**
 * Retourne la liste des services inclus pour un scénario (pour badges)
 */
export function getIncludedServicesLabels(scenarioId: string): string[] {
  const services = getScenarioServices(scenarioId);
  return services.included.map(s => s.label);
}

/**
 * Retourne le statut d'un service pour un scénario
 */
export function getServiceStatus(
  serviceId: string,
  scenarioId: string
): 'included' | 'optional' | 'disabled' | 'conditional' | null {
  const services = getScenarioServices(scenarioId);
  
  if (services.included.find(s => s.id === serviceId)) return 'included';
  if (services.optional.find(s => s.id === serviceId)) return 'optional';
  if (services.disabled.find(s => s.id === serviceId)) return 'disabled';
  if (services.conditional.find(s => s.id === serviceId)) return 'conditional';
  
  return null;
}

