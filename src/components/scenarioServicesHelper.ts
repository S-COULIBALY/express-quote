/**
 * Helper pour déterminer les services inclus/optionnels/non disponibles par scénario
 * Basé sur le tableau restructuré (lecture orientée client)
 */

export interface ServiceStatus {
  id: string;
  label: string;
  status: "included" | "optional" | "disabled" | "conditional";
  description?: string;
}

export interface ScenarioServices {
  included: ServiceStatus[];
  optional: ServiceStatus[];
  disabled: ServiceStatus[];
  conditional: ServiceStatus[];
}

// Définition des services de base (sans status, ajouté dynamiquement)
interface ServiceBase {
  id: string;
  label: string;
  description: string;
}

const SERVICES: ServiceBase[] = [
  { id: "packing", label: "Emballage", description: "Emballage professionnel" },
  { id: "supplies", label: "Fournitures", description: "Cartons, protections" },
  {
    id: "dismantling",
    label: "Démontage",
    description: "Démontage des meubles",
  },
  {
    id: "reassembly",
    label: "Remontage",
    description: "Remontage des meubles",
  },
  {
    id: "high-value",
    label: "Objets de valeur",
    description: "Objets fragiles / de valeur",
  },
  {
    id: "insurance",
    label: "Assurance renforcée",
    description: "Assurance valeur déclarée",
  },
  {
    id: "cleaning",
    label: "Nettoyage",
    description: "Nettoyage fin de prestation",
  },
  {
    id: "furniture-lift",
    label: "Monte-meubles",
    description: "Monte-meubles (si requis)",
  },
  {
    id: "overnight",
    label: "Étape / nuit",
    description: "Arrêt nuit intermédiaire",
  },
  {
    id: "flexibility",
    label: "Flexibilité équipe",
    description: "Flexibilité planning",
  },
];

// Helper pour trouver un service et le convertir en ServiceStatus
function findService(
  id: string,
  status: ServiceStatus["status"],
): ServiceStatus | null {
  const service = SERVICES.find((s) => s.id === id);
  if (!service) return null;
  return { ...service, status };
}

// Helper pour convertir une liste d'IDs en ServiceStatus[]
function toServiceStatusList(
  ids: string[],
  status: ServiceStatus["status"],
): ServiceStatus[] {
  return ids
    .map((id) => findService(id, status))
    .filter((s): s is ServiceStatus => s !== null);
}

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
    case "ECO":
      // ECO : Transport uniquement (prix le plus bas)
      // Aligné sur QuoteScenario.ts : tous les services désactivés sauf monte-meubles (conditionnel)
      result.disabled = toServiceStatusList(
        [
          "packing",
          "supplies",
          "dismantling",
          "reassembly",
          "high-value",
          "insurance",
          "cleaning",
          "overnight",
          "flexibility",
        ],
        "disabled",
      );
      result.conditional = toServiceStatusList(
        ["furniture-lift"],
        "conditional",
      );
      break;

    case "STANDARD":
      // STANDARD : Participation client - Meilleur rapport qualité-prix
      // Aligné sur QuoteScenario.ts : pas de disabledModules, tout est disponible en option
      result.optional = toServiceStatusList(
        [
          "packing",
          "supplies",
          "dismantling",
          "reassembly",
          "high-value",
          "insurance",
          "cleaning",
          "overnight",
          "flexibility",
        ],
        "optional",
      );
      result.conditional = toServiceStatusList(
        ["furniture-lift"],
        "conditional",
      );
      break;

    case "CONFORT":
      // CONFORT : Déménageur fait l'essentiel (emballage + démontage/remontage)
      // Aligné sur QuoteScenario.ts : enabledModules = packing, dismantling, reassembly, supplies
      result.included = toServiceStatusList(
        ["packing", "supplies", "dismantling", "reassembly"],
        "included",
      );
      result.optional = toServiceStatusList(
        ["high-value", "insurance", "cleaning"],
        "optional",
      );
      result.disabled = toServiceStatusList(
        ["overnight", "flexibility"],
        "disabled",
      );
      result.conditional = toServiceStatusList(
        ["furniture-lift"],
        "conditional",
      );
      break;

    case "PREMIUM":
      // PREMIUM : Prise en charge complète
      result.included = toServiceStatusList(
        [
          "packing",
          "supplies",
          "dismantling",
          "reassembly",
          "high-value",
          "insurance",
          "cleaning",
        ],
        "included",
      );
      result.optional = toServiceStatusList(
        ["overnight", "flexibility"],
        "optional",
      );
      result.conditional = toServiceStatusList(
        ["furniture-lift"],
        "conditional",
      );
      break;

    case "SECURITY_PLUS":
    case "SECURITY": // Support de l'ancien nom pour compatibilité
      // SÉCURITÉ+ : Premium + Protection maximale
      result.included = toServiceStatusList(
        [
          "packing",
          "supplies",
          "dismantling",
          "reassembly",
          "high-value",
          "insurance",
          "cleaning",
        ],
        "included",
      );
      result.optional = toServiceStatusList(
        ["overnight", "flexibility"],
        "optional",
      );
      result.conditional = toServiceStatusList(
        ["furniture-lift"],
        "conditional",
      );
      break;

    case "FLEX":
      // FLEX : Devis sur mesure
      result.included = toServiceStatusList(
        ["dismantling", "reassembly", "overnight", "flexibility"],
        "included",
      );
      result.optional = toServiceStatusList(
        ["packing", "supplies", "high-value", "insurance", "cleaning"],
        "optional",
      );
      result.conditional = toServiceStatusList(
        ["furniture-lift"],
        "conditional",
      );
      break;

    default:
      // Par défaut, tous les services sont optionnels
      result.optional = toServiceStatusList(
        SERVICES.map((s) => s.id),
        "optional",
      );
  }

  return result;
}

/**
 * Retourne la liste des services inclus pour un scénario (pour badges)
 */
export function getIncludedServicesLabels(scenarioId: string): string[] {
  const services = getScenarioServices(scenarioId);
  return services.included.map((s) => s.label);
}

/**
 * Retourne le statut d'un service pour un scénario
 */
export function getServiceStatus(
  serviceId: string,
  scenarioId: string,
): "included" | "optional" | "disabled" | "conditional" | null {
  const services = getScenarioServices(scenarioId);

  if (services.included.find((s) => s.id === serviceId)) return "included";
  if (services.optional.find((s) => s.id === serviceId)) return "optional";
  if (services.disabled.find((s) => s.id === serviceId)) return "disabled";
  if (services.conditional.find((s) => s.id === serviceId))
    return "conditional";

  return null;
}
