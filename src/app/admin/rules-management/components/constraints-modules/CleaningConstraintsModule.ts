// ✅ MODULE NETTOYAGE - Extraction des contraintes du CleaningConstraintsModal
import {
  SparklesIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon
} from "@heroicons/react/24/outline"

// ✅ EXTRACTION - Contraintes du modal CleaningConstraintsModal (30+ contraintes)
export const CLEANING_CONSTRAINTS_MODULE = {
  serviceType: "CLEANING",
  serviceName: "Nettoyage",
  icon: SparklesIcon,
  color: "emerald",
  totalConstraints: 30,
  categories: [
    {
      id: "access",
      name: "Accès",
      description: "Contraintes d'accès au site de nettoyage",
      icon: BuildingOfficeIcon,
      constraints: [
        {
          id: 'limited_parking',
          name: 'Stationnement limité',
          description: 'Difficultés de stationnement pour l\'équipe de nettoyage',
          category: 'access',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 15,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'no_elevator',
          name: 'Absence d\'ascenseur',
          description: 'Accès par escaliers uniquement avec matériel de nettoyage',
          category: 'access',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 20,
          autoDetection: true,
          isActive: true,
          conditions: {
            triggers: ['floor_level', 'elevator_status'],
            threshold: 1,
            autoApply: true
          }
        },
        {
          id: 'difficult_access',
          name: 'Accès difficile au bâtiment',
          description: 'Entrée complexe ou passages étroits',
          category: 'access',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 25,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'security_check',
          name: 'Contrôle de sécurité',
          description: 'Procédures de sécurité à respecter (badge, vérification)',
          category: 'access',
          serviceType: 'CLEANING',
          impact: 'WARNING' as const,
          value: 0,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'intercom_required',
          name: 'Interphone obligatoire',
          description: 'Accès par interphone uniquement',
          category: 'access',
          serviceType: 'CLEANING',
          impact: 'WARNING' as const,
          value: 0,
          autoDetection: false,
          isActive: true
        }
      ]
    },
    {
      id: "work_conditions",
      name: "Conditions de travail",
      description: "Contraintes liées à l'environnement de travail",
      icon: ExclamationTriangleIcon,
      constraints: [
        {
          id: 'pets_present',
          name: 'Présence d\'animaux',
          description: 'Animaux domestiques présents pendant le nettoyage',
          category: 'work_conditions',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 10,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'children_present',
          name: 'Présence d\'enfants',
          description: 'Enfants présents nécessitant des précautions spéciales',
          category: 'work_conditions',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 15,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'allergies',
          name: 'Allergies à signaler',
          description: 'Produits spécifiques à éviter pour causes d\'allergies',
          category: 'work_conditions',
          serviceType: 'CLEANING',
          impact: 'WARNING' as const,
          value: 0,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'fragile_items',
          name: 'Objets fragiles/précieux',
          description: 'Objets nécessitant une attention particulière',
          category: 'work_conditions',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 20,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'heavy_furniture',
          name: 'Meubles lourds à déplacer',
          description: 'Mobilier nécessitant plusieurs personnes pour déplacement',
          category: 'work_conditions',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 30,
          autoDetection: false,
          isActive: true
        }
      ]
    },
    {
      id: "time_constraints",
      name: "Contraintes horaires",
      description: "Limitations temporelles spécifiques",
      icon: ClockIcon,
      constraints: [
        {
          id: 'specific_time_window',
          name: 'Créneau horaire spécifique',
          description: 'Intervention uniquement sur créneaux restreints',
          category: 'time_constraints',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 25,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'early_morning',
          name: 'Intervention matinale requise',
          description: 'Service très tôt le matin (avant 8h)',
          category: 'time_constraints',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 20,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'evening_service',
          name: 'Service en soirée uniquement',
          description: 'Intervention uniquement après 18h',
          category: 'time_constraints',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 15,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'weekend_only',
          name: 'Uniquement le weekend',
          description: 'Service disponible weekend uniquement',
          category: 'time_constraints',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 30,
          autoDetection: false,
          isActive: true
        }
      ]
    },
    {
      id: "site_conditions",
      name: "État du site",
      description: "Contraintes liées à l'état du lieu à nettoyer",
      icon: ExclamationTriangleIcon,
      constraints: [
        {
          id: 'very_dirty',
          name: 'Saleté importante/tenace',
          description: 'Nettoyage intensif requis pour saleté incrustée',
          category: 'site_conditions',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 40,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'post_construction',
          name: 'Post-construction/travaux',
          description: 'Nettoyage après travaux de construction ou rénovation',
          category: 'site_conditions',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 60,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'water_damage',
          name: 'Dégâts des eaux',
          description: 'Nettoyage suite à dégâts des eaux',
          category: 'site_conditions',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 80,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'mold_presence',
          name: 'Présence de moisissure',
          description: 'Traitement spécialisé anti-moisissure requis',
          category: 'site_conditions',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 100,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'limited_space',
          name: 'Espace de travail restreint',
          description: 'Espaces très petits ou encombrés',
          category: 'site_conditions',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 25,
          autoDetection: false,
          isActive: true
        }
      ]
    },
    {
      id: "equipment",
      name: "Équipement",
      description: "Contraintes matérielles et d'équipement",
      icon: WrenchScrewdriverIcon,
      constraints: [
        {
          id: 'no_water_supply',
          name: 'Pas d\'accès à l\'eau',
          description: 'Absence de point d\'eau sur site',
          category: 'equipment',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 50,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'no_power_supply',
          name: 'Pas d\'accès à l\'électricité',
          description: 'Absence de prise électrique fonctionnelle',
          category: 'equipment',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 40,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'special_products_required',
          name: 'Produits spécifiques nécessaires',
          description: 'Produits de nettoyage spécialisés requis',
          category: 'equipment',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 35,
          autoDetection: false,
          isActive: true
        },
        {
          id: 'special_equipment_needed',
          name: 'Équipement spécial requis',
          description: 'Matériel de nettoyage spécialisé nécessaire',
          category: 'equipment',
          serviceType: 'CLEANING',
          impact: 'SURCHARGE' as const,
          value: 60,
          autoDetection: false,
          isActive: true
        }
      ]
    }
  ]
}