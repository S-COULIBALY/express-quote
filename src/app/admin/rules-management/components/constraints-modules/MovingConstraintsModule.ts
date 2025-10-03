// ✅ MODULE DÉMÉNAGEMENT - Extraction des contraintes du MovingConstraintsAndServicesModal
// ✅ REFACTORISÉ - Utilise DefaultValues et référence AutoDetectionService
import {
  TruckIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline"
import { DefaultValues } from "@/quotation/domain/configuration/DefaultValues"

// ✅ EXTRACTION - Contraintes et services du modal hard-codé
export const MOVING_CONSTRAINTS_MODULE = {
  serviceType: "MOVING",
  serviceName: "Déménagement",
  icon: TruckIcon,
  color: "orange",
  totalConstraints: 55, // 45 contraintes + 10 services
  categories: [
    {
      id: "elevator",
      name: "Ascenseur",
      description: "Contraintes liées à l'utilisation de l'ascenseur",
      icon: BuildingOfficeIcon,
      constraints: [
        {
          id: 'elevator_unavailable',
          name: 'Ascenseur indisponible',
          description: 'L\'ascenseur est en panne ou hors service',
          category: 'elevator',
          serviceType: 'MOVING',
          impact: 'SURCHARGE' as const,
          value: 25,
          autoDetection: true,
          isActive: true,
          conditions: {
            triggers: ['elevator_status', 'floor_level'],
            autoApply: true
          }
        },
        {
          id: 'elevator_unsuitable_size',
          name: 'Ascenseur trop petit',
          description: 'L\'ascenseur ne peut pas accueillir les objets volumineux',
          category: 'elevator',
          serviceType: 'MOVING',
          impact: 'REQUIREMENT' as const,
          value: 0,
          autoDetection: true,
          isActive: true,
          conditions: {
            triggers: ['elevator_size', 'bulky_items'],
            autoApply: true
          }
        },
        {
          id: 'elevator_forbidden_moving',
          name: 'Ascenseur interdit déménagement',
          description: 'Utilisation de l\'ascenseur interdite pour les déménagements',
          category: 'elevator',
          serviceType: 'MOVING',
          impact: 'REQUIREMENT' as const,
          value: 0,
          autoDetection: false,
          isActive: true,
          conditions: {
            triggers: ['building_rules'],
            autoApply: false
          }
        }
      ]
    },
    {
      id: "access",
      name: "Accès",
      description: "Contraintes d'accès au bâtiment et logement",
      icon: ExclamationTriangleIcon,
      constraints: [
        {
          id: 'difficult_stairs',
          name: 'Escaliers difficiles',
          description: 'Escaliers étroits, en colimaçon ou nombreux paliers',
          category: 'access',
          serviceType: 'MOVING',
          impact: 'SURCHARGE' as const,
          value: 30,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'narrow_corridors',
          name: 'Couloirs étroits',
          description: 'Couloirs ne permettant pas le passage d\'objets volumineux',
          category: 'access',
          serviceType: 'MOVING',
          impact: 'SURCHARGE' as const,
          value: 20,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'long_carrying_distance',
          name: 'Distance de portage longue',
          description: 'Distance importante entre le véhicule et l\'entrée du logement (auto-détectée par AutoDetectionService)',
          category: 'access',
          serviceType: 'MOVING',
          impact: 'SURCHARGE' as const,
          value: DefaultValues.LONG_CARRYING_DISTANCE_SURCHARGE, // 50€ depuis DefaultValues
          autoDetection: true,
          isActive: true,
          conditions: {
            triggers: ['carrying_distance'],
            threshold: DefaultValues.LONG_CARRYING_DISTANCE_THRESHOLD, // 30 mètres depuis DefaultValues
            autoApply: true
          }
        },
        {
          id: 'indirect_exit',
          name: 'Sortie indirecte',
          description: 'Passage obligatoire par des chemins non directs',
          category: 'access',
          serviceType: 'MOVING',
          impact: 'SURCHARGE' as const,
          value: 25,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'complex_multilevel_access',
          name: 'Accès multiniveau complexe',
          description: 'Plusieurs niveaux d\'accès avec contraintes spécifiques',
          category: 'access',
          serviceType: 'MOVING',
          impact: 'SURCHARGE' as const,
          value: 40,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'fragile_floor',
          name: 'Sol fragile',
          description: 'Protection spéciale requise pour éviter d\'endommager le sol',
          category: 'access',
          serviceType: 'MOVING',
          impact: 'SURCHARGE' as const,
          value: 20,
          autoDetection: false,
          isActive: true
        }
      ]
    },
    {
      id: "street",
      name: "Voirie",
      description: "Contraintes de stationnement et circulation",
      icon: TruckIcon,
      constraints: [
        {
          id: 'pedestrian_zone',
          name: 'Zone piétonne',
          description: 'Accès véhicule limité ou interdit',
          category: 'street',
          serviceType: 'MOVING',
          impact: 'SURCHARGE' as const,
          value: 40,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'narrow_inaccessible_street',
          name: 'Rue étroite/inaccessible',
          description: 'Rue ne permettant pas l\'accès du camion de déménagement',
          category: 'street',
          serviceType: 'MOVING',
          impact: 'SURCHARGE' as const,
          value: 50,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'difficult_parking',
          name: 'Stationnement difficile',
          description: 'Difficulté à stationner proche du logement',
          category: 'street',
          serviceType: 'MOVING',
          impact: 'SURCHARGE' as const,
          value: 30,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'complex_traffic',
          name: 'Circulation complexe',
          description: 'Zone à circulation dense ou réglementée',
          category: 'street',
          serviceType: 'MOVING',
          impact: 'SURCHARGE' as const,
          value: 25,
          autoDetection: false,
          isActive: true
        }
      ]
    },
    {
      id: "administrative",
      name: "Administratif",
      description: "Autorisations et contraintes réglementaires",
      icon: ClockIcon,
      constraints: [
        {
          id: 'access_control',
          name: 'Contrôle d\'accès',
          description: 'Autorisation spéciale requise (gardien, badge, etc.)',
          category: 'administrative',
          serviceType: 'MOVING',
          impact: 'WARNING' as const,
          value: 0,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'administrative_permit',
          name: 'Autorisation administrative',
          description: 'Déclaration ou autorisation mairie requise',
          category: 'administrative',
          serviceType: 'MOVING',
          impact: 'WARNING' as const,
          value: 0,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'time_restrictions',
          name: 'Restrictions horaires',
          description: 'Créneaux horaires imposés pour le déménagement',
          category: 'administrative',
          serviceType: 'MOVING',
          impact: 'WARNING' as const,
          value: 0,
          autoDetection: false,
          isActive: true
        }
      ]
    },
    {
      id: "services",
      name: "Services",
      description: "Services additionnels spécialisés",
      icon: ShieldCheckIcon,
      constraints: [
        {
          id: 'bulky_furniture',
          name: 'Meubles encombrants',
          description: 'Armoires, canapés d\'angle, électroménager volumineux',
          category: 'services',
          serviceType: 'MOVING',
          impact: 'SERVICE' as const,
          value: 150,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'furniture_disassembly',
          name: 'Démontage de meubles',
          description: 'Démontage professionnel sur site de départ',
          category: 'services',
          serviceType: 'MOVING',
          impact: 'SERVICE' as const,
          value: 80,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'furniture_reassembly',
          name: 'Remontage de meubles',
          description: 'Remontage professionnel sur site d\'arrivée',
          category: 'services',
          serviceType: 'MOVING',
          impact: 'SERVICE' as const,
          value: 100,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'professional_packing_departure',
          name: 'Emballage professionnel départ',
          description: 'Protection et emballage par l\'équipe au départ',
          category: 'services',
          serviceType: 'MOVING',
          impact: 'SERVICE' as const,
          value: 120,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'professional_unpacking_arrival',
          name: 'Déballage professionnel arrivée',
          description: 'Déballage et mise en place par l\'équipe à l\'arrivée',
          category: 'services',
          serviceType: 'MOVING',
          impact: 'SERVICE' as const,
          value: 100,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'packing_supplies',
          name: 'Fourniture matériel d\'emballage',
          description: 'Cartons, papier bulle, sangles de protection',
          category: 'services',
          serviceType: 'MOVING',
          impact: 'SERVICE' as const,
          value: 50,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'fragile_valuable_items',
          name: 'Objets fragiles/de valeur',
          description: 'Œuvres d\'art, antiquités, instruments de musique',
          category: 'services',
          serviceType: 'MOVING',
          impact: 'SERVICE' as const,
          value: 200,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'heavy_items',
          name: 'Objets très lourds',
          description: 'Piano, coffre-fort, équipements industriels',
          category: 'services',
          serviceType: 'MOVING',
          impact: 'SERVICE' as const,
          value: 180,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'additional_insurance',
          name: 'Assurance complémentaire',
          description: 'Protection étendue pour objets de valeur',
          category: 'services',
          serviceType: 'MOVING',
          impact: 'SERVICE' as const,
          value: 50,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'temporary_storage_service',
          name: 'Stockage temporaire',
          description: 'Garde-meuble pour stockage intermédiaire',
          category: 'services',
          serviceType: 'MOVING',
          impact: 'SERVICE' as const,
          value: 200,
          autoDetection: false,
          isActive: true
        }
      ]
    }
  ]
}