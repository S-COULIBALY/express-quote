import { FormConfig } from '../../types';
import { AutoDetectionService, AddressData } from '@/quotation/domain/services/AutoDetectionService';

// 🏷️ Mapping centralisé des contraintes et services pour l'affichage
const getConstraintLabel = (constraintId: string): string => {
  const constraintLabels: Record<string, string> = {
    // 🚛 Contraintes d'accès véhicule
    'pedestrian_zone': 'Zone piétonne avec restrictions',
    'narrow_inaccessible_street': 'Rue étroite ou inaccessible au camion',
    'difficult_parking': 'Stationnement difficile ou payant',
    'complex_traffic': 'Sens unique ou circulation complexe',
    
    // 🏢 Contraintes bâtiment
    'elevator_unavailable': 'Ascenseur en panne ou hors service',
    'elevator_unsuitable_size': 'Ascenseur trop petit pour les meubles',
    'elevator_forbidden_moving': 'Ascenseur interdit pour déménagement',
    'difficult_stairs': 'Escalier étroit, en colimaçon ou dangereux',
    'narrow_corridors': 'Couloirs étroits ou encombrés (< 1m de large)',
    
    // 📏 Distance et portage
    'long_carrying_distance': 'Distance immeuble-camion supérieure à 30m',
    'indirect_exit': 'Passage par cour, jardin ou sous-sol obligatoire',
    'complex_multilevel_access': 'Accès complexe multi-niveaux',
    
    // 🛡️ Sécurité et autorisations
    'access_control': 'Contrôle d\'accès strict (gardien/interphone)',
    'administrative_permit': 'Autorisation administrative obligatoire',
    'time_restrictions': 'Restrictions horaires strictes',
    'fragile_floor': 'Sol fragile ou délicat (parquet ancien, marbre)',
    
    // 🔧 Services de manutention
    'bulky_furniture': 'Meubles encombrants ou non démontables',
    'furniture_disassembly': 'Démontage de meubles au départ',
    'furniture_reassembly': 'Remontage de meubles à l\'arrivée',
    
    // 📦 Services d'emballage
    'professional_packing_departure': 'Emballage professionnel au départ',
    'professional_unpacking_arrival': 'Déballage professionnel à l\'arrivée',
    'packing_supplies': 'Fournitures d\'emballage complètes',
    
    // 🛡️ Services de protection
    'fragile_valuable_items': 'Objets fragiles ou de grande valeur',
    'heavy_items': 'Objets très lourds (piano, coffre-fort, etc.)',
    'additional_insurance': 'Assurance complémentaire renforcée',
    
    // 🏪 Services annexes
    'temporary_storage_service': 'Stockage temporaire sécurisé',
    
    // Contrainte spéciale
    'furniture_lift_required': 'Monte-meuble',
    
    // Anciennes contraintes pour compatibilité
    'narrow_street': 'Rue étroite',
    'parking_issue': 'Stationnement difficile',
    'loading_zone': 'Zone de chargement',
    'one_way_street': 'Sens unique',
    'busy_street': 'Rue passante',
    'slope_or_stairs': 'Pente / escalier',
    'courtyard_to_cross': 'Cour à traverser',
    'narrow_corridor': 'Couloir étroit',
    'narrow_door': 'Porte étroite',
    'spiral_staircase': 'Escalier colimaçon',
    'multiple_doors': 'Plusieurs portes',
    'time_restriction': 'Restriction horaire',
    'security_check': 'Contrôle sécurité',
    'permit_required': 'Autorisation',
    'interphone': 'Interphone',
    'weather_sensitive': 'Exposé intempéries',
    'shared_access': 'Accès partagé',
    'construction_work': 'Travaux',
    'limited_parking': 'Stationnement limité',
    'no_elevator': 'Absence d\'ascenseur',
    'difficult_building_access': 'Accès difficile au bâtiment',
    'difficult_access': 'Accès difficile',
    'restricted_hours': 'Horaires restreints',
    'animal_presence': 'Présence d\'animaux',
    'mandatory_intercom': 'Interphone obligatoire',
    'intercom_required': 'Interphone obligatoire',
    'pets_present': 'Présence d\'animaux',
    'children_present': 'Présence d\'enfants',
    'fragile_items': 'Objets fragiles',
    'heavy_furniture': 'Meubles lourds',
    'limited_space': 'Espace restreint'
  };
  
  return constraintLabels[constraintId] || constraintId;
};

export interface MovingServicePresetOptions {
  onPriceCalculated?: (price: number, details: any) => void;
  onSubmitSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  editMode?: boolean;
  sessionStorageKey?: string;
}

export const getMovingServiceConfig = (options: MovingServicePresetOptions = {}): FormConfig => {
  const { onPriceCalculated, onSubmitSuccess, onError, editMode, sessionStorageKey } = options;

  // Auto-détection des valeurs par défaut depuis sessionStorage si en mode édition
  const getDefaultValues = () => {
    if (editMode && sessionStorageKey && typeof window !== 'undefined') {
      const storedData = window.sessionStorage.getItem(sessionStorageKey);
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          return parsedData;
        } catch (error) {
          console.error('Erreur lors de la lecture du sessionStorage:', error);
        }
      }
    }
    return {};
  };

  // Configuration de base utilisant MovingPreset
  const baseConfig: FormConfig = {
    title: "Devis Déménagement",
    description: "Obtenez votre devis personnalisé en quelques minutes",
    serviceType: "moving",
    preset: "moving",
    customDefaults: getDefaultValues(),
    
    layout: {
      type: "sidebar",
      showPriceCalculation: true,
      showConstraintsByAddress: true,
      showModificationsSummary: false, // Pas de modifications prédéfinies pour déménagement
      onPriceCalculated: onPriceCalculated ? (price: number) => onPriceCalculated(price, {}) : undefined,
      initialPrice: 0, // Pas de prix de base prédéfini, calculé selon les caractéristiques
      // Pas de serviceInfo car le client définit ses propres caractéristiques
      summaryConfig: {
        title: "Votre Déménagement", // Titre neutre
        sections: [
          // Section Planification (Date + Volume)
          {
            title: "",
            icon: "",
            fields: [
              {
                key: "movingDate",
                label: "",
                format: (value: any, formData: any) => {
                  const parts = [];
                  if (value) {
                    const dateFormatted = new Date(value).toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    });
                    parts.push(`📅 Date : ${dateFormatted}`);
                  }
                  if (formData.volume) {
                    parts.push(`📦 Volume : ${formData.volume} m³`);
                  }
                  return parts.join(' • ');
                },
                condition: (value: any, formData: any) => !!value || !!formData.volume
              }
            ]
          },
          // Section Logement
          {
            title: "Logement",
            icon: "🏠",
            fields: [
              {
                key: "propertyType",
                label: "Type",
                format: (value: any, formData: any) => {
                  const types: Record<string, string> = {
                    'apartment': 'Appartement',
                    'house': 'Maison',
                    'office': 'Bureau'
                  };
                  const result = types[value] || value;
                  
                  const details = [];
                  if (formData.surface) details.push(`${formData.surface} m²`);
                  if (formData.rooms) details.push(`${formData.rooms} pièces`);
                  if (formData.occupants) details.push(`${formData.occupants} occupants`);
                  
                  return details.length > 0 ? `${result}\n${details.join(' • ')}` : result;
                },
                condition: (value: any) => !!value
              }
            ]
          },
          // Section Adresses (sera fusionnée avec les contraintes affichées automatiquement)
          {
            title: "Adresses",
            icon: "📍",
            fields: [
              {
                key: "pickupAddress",
                label: "Adresse de départ",
                format: (value: any, formData: any) => {
                  const result = value;
                  const details = [];
                  
                  if (formData.pickupFloor && formData.pickupFloor !== '0') {
                    details.push(`Étage ${formData.pickupFloor}`);
                  }
                  if (formData.pickupElevator && formData.pickupElevator !== 'no') {
                    const elevatorLabels: Record<string, string> = {
                      'small': 'Petit ascenseur',
                      'medium': 'Ascenseur moyen',
                      'large': 'Grand ascenseur'
                    };
                    details.push(elevatorLabels[formData.pickupElevator] || 'Ascenseur');
                  }
                  if (formData.pickupCarryDistance) {
                    details.push(`Portage ${formData.pickupCarryDistance.replace('-', ' à ').replace('+', '+ de ')}m`);
                  }
                  
                  // Ajouter les contraintes logistiques de départ
                  if (formData.pickupLogisticsConstraints && formData.pickupLogisticsConstraints.length > 0) {
                    const constraints = formData.pickupLogisticsConstraints.map((c: string) => 
                      getConstraintLabel(c)
                    );
                    if (constraints.length > 0) {
                      const constraintsText = constraints.map((c: string) => `🔸 ${c}`).join('\n');
                      details.push(`\nContraintes de départ :\n${constraintsText}`);
                    }
                  }
                  
                  return details.length > 0 ? `${result}\n${details.join(' • ')}` : result;
                },
                condition: (value: any) => !!value
              },
              {
                key: "deliveryAddress",
                label: "Adresse d'arrivée",
                format: (value: any, formData: any) => {
                  const result = value;
                  const details = [];
                  
                  if (formData.deliveryFloor && formData.deliveryFloor !== '0') {
                    details.push(`Étage ${formData.deliveryFloor}`);
                  }
                  if (formData.deliveryElevator && formData.deliveryElevator !== 'no') {
                    const elevatorLabels: Record<string, string> = {
                      'small': 'Petit ascenseur',
                      'medium': 'Ascenseur moyen',
                      'large': 'Grand ascenseur'
                    };
                    details.push(elevatorLabels[formData.deliveryElevator] || 'Ascenseur');
                  }
                  if (formData.deliveryCarryDistance) {
                    details.push(`Portage ${formData.deliveryCarryDistance.replace('-', ' à ').replace('+', '+ de ')}m`);
                  }
                  
                  // Ajouter les contraintes logistiques d'arrivée
                  if (formData.deliveryLogisticsConstraints && formData.deliveryLogisticsConstraints.length > 0) {
                    const constraints = formData.deliveryLogisticsConstraints.map((c: string) => 
                      getConstraintLabel(c)
                    );
                    if (constraints.length > 0) {
                      const constraintsText = constraints.map((c: string) => `🔸 ${c}`).join('\n');
                      details.push(`\nContraintes d'arrivée :\n${constraintsText}`);
                    }
                  }
                  
                  return details.length > 0 ? `${result}\n${details.join(' • ')}` : result;
                },
                condition: (value: any) => !!value
              }
            ]
          },
          // Section Informations complémentaires
          {
            title: "Commentaires",
            icon: "📝",
            fields: [
              {
                key: "additionalInfo",
                label: "Commentaires et questions",
                format: (value: any) => value || "Aucun commentaire",
                condition: (value: any) => !!value
              }
            ]
          },
          // Section Notifications
          {
            title: "Notifications",
            icon: "📱",
            fields: [
              {
                key: "whatsappOptIn",
                label: "Notifications WhatsApp",
                format: (value: any) => value ? "✅ Activées" : "❌ À cocher pour recevoir votre devis et rappels (facultatif)",
                condition: () => true
              }
            ]
          },
          // Section Prix dynamique qui se remplit au fur et à mesure
          {
            title: "Estimation",
            icon: "💰",
            fields: [
              { 
                key: "totalPrice", 
                label: "Prix estimé", 
                format: () => "Complétez le formulaire pour voir l'estimation", // Message initial
                style: "font-bold text-emerald-600",
                condition: () => true // Toujours afficher le champ prix
              }
            ]
          }
        ]
      }
    },

    sections: [
      {
        title: "📅 Date et Volume",
        columns: 2,
        fields: [
          {
            name: "movingDate",
            type: "date",
            label: "Date de déménagement",
            required: true,
            validation: {
              custom: (value: any) => {
                if (!value) return "La date est requise";
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return selectedDate >= today || "La date ne peut pas être dans le passé";
              }
            }
          },
          {
            name: "volume",
            type: "number",
            label: "Volume (m³)",
            required: true,
            validation: {
              min: 1,
              custom: (value: any) => value >= 1 || "Le volume doit être d'au moins 1 m³"
            },
            componentProps: {
              placeholder: "30"
            }
          }
        ]
      },
      {
        title: "🗺️ Adresses",
        fields: [
          // 📦 Section DÉPART avec styling spécial
          {
            name: "pickupAddress",
            type: "address-pickup",
            label: "📍 Adresse de départ",
            required: true,
            columnSpan: 2,
            className: "pickup-section",
            componentProps: {
              iconColor: "#10b981" // Vert pour le départ
            }
          },
          {
            name: "pickupFloor",
            type: "select",
            label: "Étage départ",
            className: "pickup-field",
            options: [
              { value: '-1', label: 'Sous-sol' },
              { value: '0', label: 'RDC' },
              { value: '1', label: '1er étage' },
              { value: '2', label: '2ème étage' },
              { value: '3', label: '3ème étage' },
              { value: '4', label: '4ème étage' },
              { value: '5', label: '5ème étage' },
              { value: '6', label: '6ème étage' },
              { value: '7', label: '7ème étage' },
              { value: '8', label: '8ème étage' },
              { value: '9', label: '9ème étage' },
              { value: '10', label: '10ème étage' }
            ]
          },
          {
            name: "pickupElevator",
            type: "select",
            label: "Ascenseur départ",
            className: "pickup-field",
            options: [
              { value: 'no', label: 'Aucun' },
              { value: 'small', label: 'Petit (1-3 pers)' },
              { value: 'medium', label: 'Moyen (3-6 pers)' },
              { value: 'large', label: 'Grand (+6 pers)' }
            ]
          },
          // 🚚 Ligne combinée: Distance + Contraintes DÉPART
          {
            name: "pickupCarryDistance",
            type: "select",
            label: "Distance de portage départ",
            className: "pickup-field",
            options: [
              { value: '', label: 'Aucune' },
              { value: '0-10', label: '0-10m' },
              { value: '10-30', label: '10-30m' },
              { value: '30+', label: '30m+' }
            ]
          },
          {
            name: "pickupLogisticsConstraints",
            type: "service-constraints",
            label: "Contraintes d'accès au départ",
            className: "pickup-field",
            componentProps: {
              id: "pickup",
              buttonLabel: "Contraintes d'accès au départ",
              modalTitle: "Contraintes d'accès et services - Logement de départ"
            }
          },
          // Séparateur entre départ et arrivée
          {
            name: "address-separator",
            type: "separator",
            columnSpan: 2
          },
          // 🚚 Section ARRIVÉE avec styling différentiel  
          {
            name: "deliveryAddress",
            type: "address-delivery",
            label: "📍 Adresse d'arrivée",
            required: true,
            columnSpan: 2,
            className: "delivery-section",
            componentProps: {
              iconColor: "#ef4444" // Rouge pour l'arrivée
            }
          },
          {
            name: "deliveryFloor",
            type: "select",
            label: "Étage arrivée",
            className: "delivery-field",
            options: [
              { value: '-1', label: 'Sous-sol' },
              { value: '0', label: 'RDC' },
              { value: '1', label: '1er étage' },
              { value: '2', label: '2ème étage' },
              { value: '3', label: '3ème étage' },
              { value: '4', label: '4ème étage' },
              { value: '5', label: '5ème étage' },
              { value: '6', label: '6ème étage' },
              { value: '7', label: '7ème étage' },
              { value: '8', label: '8ème étage' },
              { value: '9', label: '9ème étage' },
              { value: '10', label: '10ème étage' }
            ]
          },
          {
            name: "deliveryElevator",
            type: "select",
            label: "Ascenseur arrivée",
            className: "delivery-field",
            options: [
              { value: 'no', label: 'Aucun' },
              { value: 'small', label: 'Petit (1-3 pers)' },
              { value: 'medium', label: 'Moyen (3-6 pers)' },
              { value: 'large', label: 'Grand (+6 pers)' }
            ]
          },
          // 🚚 Ligne combinée: Distance + Contraintes ARRIVÉE
          {
            name: "deliveryCarryDistance",
            type: "select",
            label: "Distance de portage arrivée",
            className: "delivery-field",
            options: [
              { value: '', label: 'Aucune' },
              { value: '0-10', label: '0-10m' },
              { value: '10-30', label: '10-30m' },
              { value: '30+', label: '30m+' }
            ]
          },
          {
            name: "deliveryLogisticsConstraints",
            type: "service-constraints",
            label: "Contraintes d'accès à l'arrivée",
            className: "delivery-field",
            componentProps: {
              id: "delivery",
              buttonLabel: "Contraintes d'accès à l'arrivée",
              modalTitle: "Contraintes d'accès et services - Logement d'arrivée"
            }
          }
        ]
      },
      {
        title: "📝 Informations complémentaires",
        fields: [
          {
            name: "additionalInfo",
            type: "textarea",
            label: "Commentaires et questions",
            columnSpan: 2,
            componentProps: {
              rows: 4,
              placeholder: "Informations complémentaires: type de meubles, contraintes spécifiques, vos coordonnées..."
            }
          }
        ]
      },
      {
        title: "📱 Notifications",
        fields: [
          {
            name: "whatsappOptIn",
            type: "whatsapp-consent",
            label: "Notifications WhatsApp",
            columnSpan: 2
          }
        ]
      }
    ],

    // ✅ REFACTORISÉ: Handlers qui utilisent le service centralisé AutoDetectionService
    onChange: onPriceCalculated ? async (fieldName: string, value: any, formData: any) => {
      const priceRelevantFields = [
        'volume', 'movingDate', 'pickupAddress', 'deliveryAddress',
        'pickupFloor', 'deliveryFloor', 'pickupElevator', 'deliveryElevator',
        'pickupCarryDistance', 'deliveryCarryDistance',
        'pickupLogisticsConstraints', 'deliveryLogisticsConstraints'
      ];

      // ✅ REFACTORISÉ: Logique automatique utilisant AutoDetectionService
      const autoDetectionRelevantFields = [
        'pickupFloor', 'deliveryFloor', 'pickupElevator', 'deliveryElevator',
        'pickupCarryDistance', 'deliveryCarryDistance',
        'pickupLogisticsConstraints', 'deliveryLogisticsConstraints'
      ];

      if (autoDetectionRelevantFields.includes(fieldName)) {
        try {
          // Construire les données d'adresse pour le service centralisé
          const pickupAddressData: AddressData = {
            floor: parseInt(formData.pickupFloor) || 0,
            elevator: (formData.pickupElevator || 'no') as 'no' | 'small' | 'medium' | 'large',
            carryDistance: formData.pickupCarryDistance as '0-10' | '10-30' | '30+' | undefined,
            constraints: formData.pickupLogisticsConstraints || []
          };

          const deliveryAddressData: AddressData = {
            floor: parseInt(formData.deliveryFloor) || 0,
            elevator: (formData.deliveryElevator || 'no') as 'no' | 'small' | 'medium' | 'large',
            carryDistance: formData.deliveryCarryDistance as '0-10' | '10-30' | '30+' | undefined,
            constraints: formData.deliveryLogisticsConstraints || []
          };

          // Utiliser le service centralisé pour détecter les contraintes automatiques
          const detectionResult = AutoDetectionService.detectAutomaticConstraints(
            pickupAddressData,
            deliveryAddressData,
            formData.volume ? parseFloat(formData.volume) : undefined
          );

          // Appliquer les contraintes détectées
          const updatedPickupConstraints = [...(formData.pickupLogisticsConstraints || [])];
          const updatedDeliveryConstraints = [...(formData.deliveryLogisticsConstraints || [])];

          // Ajouter monte-meuble au départ si requis
          if (detectionResult.pickup.furnitureLiftRequired &&
              !updatedPickupConstraints.includes('furniture_lift_required')) {
            updatedPickupConstraints.push('furniture_lift_required');
            formData.pickupLogisticsConstraints = updatedPickupConstraints;
            console.log('🏗️ [PICKUP] Monte-meuble ajouté:', detectionResult.pickup.furnitureLiftReason);
          }

          // Ajouter monte-meuble à l'arrivée si requis
          if (detectionResult.delivery.furnitureLiftRequired &&
              !updatedDeliveryConstraints.includes('furniture_lift_required')) {
            updatedDeliveryConstraints.push('furniture_lift_required');
            formData.deliveryLogisticsConstraints = updatedDeliveryConstraints;
            console.log('🏗️ [DELIVERY] Monte-meuble ajouté:', detectionResult.delivery.furnitureLiftReason);
          }

          // Ajouter distance portage au départ si requise
          if (detectionResult.pickup.longCarryingDistance &&
              !updatedPickupConstraints.includes('long_carrying_distance')) {
            updatedPickupConstraints.push('long_carrying_distance');
            formData.pickupLogisticsConstraints = updatedPickupConstraints;
            console.log('📏 [PICKUP] Distance portage ajoutée:', detectionResult.pickup.carryingDistanceReason);
          }

          // Ajouter distance portage à l'arrivée si requise
          if (detectionResult.delivery.longCarryingDistance &&
              !updatedDeliveryConstraints.includes('long_carrying_distance')) {
            updatedDeliveryConstraints.push('long_carrying_distance');
            formData.deliveryLogisticsConstraints = updatedDeliveryConstraints;
            console.log('📏 [DELIVERY] Distance portage ajoutée:', detectionResult.delivery.carryingDistanceReason);
          }

          // Afficher le résumé des détections
          const summary = AutoDetectionService.getSummary(detectionResult);
          console.log('✅ Auto-détection complète:', summary);

        } catch (error) {
          console.error('❌ Erreur lors de l\'auto-détection:', error);
        }
      }

      if (priceRelevantFields.includes(fieldName)) {
        try {
          // Le hook externe gérera le calcul réel
          onPriceCalculated(0, formData);
        } catch (error) {
          onError?.(error);
        }
      }
    } : undefined,

    onSubmit: async (data: any) => {
      try {
        console.log('📤 Soumission du formulaire de déménagement:', data);
        
        // 1. Validation des données
        if (!data.volume || !data.pickupAddress || !data.deliveryAddress) {
          throw new Error('Veuillez remplir tous les champs obligatoires');
        }
        
        // 2. Préparer les données pour l'API
        const submissionData = {
          // Données de base
          movingDate: data.movingDate,
          volume: parseFloat(data.volume),
          pickupAddress: data.pickupAddress,
          deliveryAddress: data.deliveryAddress,
          
          // Données d'étage et ascenseur
          pickupFloor: data.pickupFloor,
          deliveryFloor: data.deliveryFloor,
          pickupElevator: data.pickupElevator,
          deliveryElevator: data.deliveryElevator,
          
          // Distances de portage
          pickupCarryDistance: data.pickupCarryDistance,
          deliveryCarryDistance: data.deliveryCarryDistance,
          
          // Contraintes
          pickupLogisticsConstraints: data.pickupLogisticsConstraints || [],
          deliveryLogisticsConstraints: data.deliveryLogisticsConstraints || [],
          
          // Informations additionnelles
          additionalInfo: data.additionalInfo,
          whatsappOptIn: data.whatsappOptIn,
          
          // Données du logement
          propertyType: data.propertyType,
          surface: data.surface,
          rooms: data.rooms,
          occupants: data.occupants
        };
        
        // 3. Appel API pour créer le devis
        console.log('🌐 Appel API pour créer le devis de déménagement...');
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'MOVING',
            data: submissionData
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la création du devis');
        }
        
        const result = await response.json();
        console.log('✅ Devis créé avec succès:', result);
        
        // 4. Appeler le callback de succès si fourni
        if (onSubmitSuccess) {
          onSubmitSuccess(result);
        }
        
      } catch (error) {
        console.error('❌ Erreur lors de la soumission:', error);
        if (onError) {
          onError(error);
        } else {
          alert('Erreur lors de la création du devis: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
        }
      }
    },

    submitLabel: "Valider le devis",
    cancelLabel: "Annuler"
  };

  return baseConfig;
}; 