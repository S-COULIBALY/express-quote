import { FormConfig } from '../../types';

export interface CleaningServicePresetOptions {
  onPriceCalculated?: (price: number, details: any) => void;
  onSubmitSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  editMode?: boolean;
  sessionStorageKey?: string;
}

export const getCleaningServiceConfig = (options: CleaningServicePresetOptions = {}): FormConfig => {
  const { onPriceCalculated, onSubmitSuccess, onError, editMode, sessionStorageKey } = options;

  // Auto-détection des valeurs par défaut depuis sessionStorage si en mode édition
  const getDefaultValues = () => {
    if (editMode && sessionStorageKey && typeof window !== 'undefined') {
      const storedData = window.sessionStorage.getItem(sessionStorageKey);
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          window.sessionStorage.removeItem(sessionStorageKey);
          return parsedData;
        } catch (error) {
          console.error('Erreur lors du parsing des données stockées:', error);
        }
      }
    }
    return {
      cleaningType: 'standard',
      frequency: 'oneTime',
      propertyState: 'normal',
      hasBalcony: false,
      hasPets: false
    };
  };

  const config: FormConfig = {
    title: "Devis Service de Nettoyage",
    description: "Obtenez un devis personnalisé pour votre service de nettoyage",
    serviceType: "cleaning",
    preset: "cleaning",
    customDefaults: getDefaultValues(),
    
    layout: {
      type: "sidebar",
      showPriceCalculation: true,
      showConstraintsByAddress: false,
      showModificationsSummary: false,
      onPriceCalculated: onPriceCalculated ? (price: number) => onPriceCalculated(price, {}) : undefined,
      initialPrice: 0,
      
      summaryConfig: {
        title: "Votre Service de Nettoyage",
        sections: [
          {
            title: "Service",
            icon: "🧹",
            fields: [
              {
                key: "cleaningType",
                label: "Type de nettoyage",
                format: (value: any) => {
                  const types: Record<string, string> = {
                    'standard': 'Nettoyage standard',
                    'deep': 'Grand nettoyage',
                    'maintenance': 'Nettoyage d\'entretien',
                    'post_construction': 'Nettoyage après travaux'
                  };
                  return types[value] || value;
                }
              },
              {
                key: "squareMeters",
                label: "Surface",
                format: (value: any) => `${value} m²`
              },
              {
                key: "frequency",
                label: "Fréquence",
                format: (value: any) => {
                  const freq: Record<string, string> = {
                    'oneTime': 'Ponctuel',
                    'weekly': 'Hebdomadaire',
                    'biweekly': 'Bi-mensuel',
                    'monthly': 'Mensuel'
                  };
                  return freq[value] || value;
                }
              }
            ]
          }
        ]
      }
    },

    sections: [
      {
        title: "📅 Planification",
        fields: [
          {
            name: "cleaningDate",
            type: "date",
            label: "Date souhaitée",
            required: true,
            validation: {
              min: new Date().toISOString().split('T')[0]
            } as any
          },
          {
            name: "cleaningType",
            type: "select",
            label: "Type de nettoyage",
            required: true,
            options: [
              { value: "standard", label: "Nettoyage standard" },
              { value: "deep", label: "Grand nettoyage" },
              { value: "movingOut", label: "Fin de bail" },
              { value: "postConstruction", label: "Après travaux" }
            ]
          },
          {
            name: "frequency",
            type: "select",
            label: "Fréquence",
            required: true,
            options: [
              { value: "oneTime", label: "Une fois" },
              { value: "weekly", label: "Hebdomadaire" },
              { value: "biweekly", label: "Bi-mensuel" },
              { value: "monthly", label: "Mensuel" }
            ]
          }
        ]
      },
      
      {
        title: "🏠 Logement",
        fields: [
          {
            name: "address",
            type: "text",
            label: "Adresse",
            required: true,
            columnSpan: 2
          },
          {
            name: "squareMeters",
            type: "number",
            label: "Surface (m²)",
            required: true,
            validation: {
              min: 10,
              max: 1000
            }
          },
          {
            name: "numberOfRooms",
            type: "number",
            label: "Nombre de pièces",
            required: true,
            validation: {
              min: 1,
              max: 20
            }
          },
          {
            name: "numberOfBathrooms",
            type: "number",
            label: "Salles de bain",
            required: true,
            validation: {
              min: 1,
              max: 10
            }
          },
          {
            name: "propertyState",
            type: "select",
            label: "État du logement",
            required: true,
            options: [
              { value: "normal", label: "État normal" },
              { value: "dirty", label: "Très sale" },
              { value: "construction", label: "Après travaux" },
              { value: "moving", label: "Fin de bail" }
            ]
          }
        ]
      },

      {
        title: "🧽 Options de nettoyage",
        fields: [
          {
            name: "windows",
            type: "checkbox",
            label: "Nettoyage des vitres"
          },
          {
            name: "deepCleaning",
            type: "checkbox",
            label: "Nettoyage en profondeur"
          },
          {
            name: "carpets",
            type: "checkbox",
            label: "Nettoyage des tapis"
          },
          {
            name: "furniture",
            type: "checkbox",
            label: "Nettoyage des meubles"
          },
          {
            name: "appliances",
            type: "checkbox",
            label: "Nettoyage des électroménagers"
          },
          {
            name: "ironing",
            type: "checkbox",
            label: "Repassage du linge"
          },
          {
            name: "dishes",
            type: "checkbox",
            label: "Vaisselle"
          },
          {
            name: "bedding",
            type: "checkbox",
            label: "Changement des draps"
          },
          {
            name: "garbage",
            type: "checkbox",
            label: "Sortie des poubelles"
          },
          {
            name: "sanitizing",
            type: "checkbox",
            label: "Désinfection approfondie"
          }
        ]
      },

      {
        title: "ℹ️ Informations complémentaires",
        fields: [
          {
            name: "hasBalcony",
            type: "checkbox",
            label: "Balcon/Terrasse à nettoyer"
          },
          {
            name: "balconySize",
            type: "number",
            label: "Taille du balcon (m²)",
            conditional: {
              dependsOn: "hasBalcony",
              condition: (value) => value === true
            },
            validation: {
              min: 1,
              max: 100
            }
          },
          {
            name: "hasPets",
            type: "checkbox",
            label: "Présence d'animaux domestiques"
          }
        ]
      }
    ],

    // Gestionnaire de soumission
    onSubmit: async (data: any) => {
      try {
        console.log('📤 Soumission du formulaire de nettoyage:', data);
        
        // 1. Validation des données
        if (!data.squareMeters && !data.duration) {
          throw new Error('Veuillez remplir la surface ou la durée du service');
        }
        
        // 2. Préparer les données pour l'API
        const submissionData = {
          // Données de base
          cleaningType: data.cleaningType || 'standard',
          squareMeters: parseFloat(data.squareMeters) || 0,
          duration: parseFloat(data.duration) || 2,
          frequency: data.frequency || 'oneTime',
          
          // Données du logement
          propertyType: data.propertyType,
          numberOfRooms: parseInt(data.numberOfRooms) || 1,
          propertyState: data.propertyState || 'normal',
          
          // Services additionnels
          hasBalcony: data.hasBalcony || false,
          balconySize: data.hasBalcony ? parseFloat(data.balconySize) || 0 : 0,
          hasPets: data.hasPets || false,
          
          // Contraintes de service
          serviceConstraints: data.serviceConstraints || [],
          
          // Informations additionnelles
          additionalInfo: data.additionalInfo,
          whatsappOptIn: data.whatsappOptIn
        };
        
        // 3. Appel API pour créer le devis
        console.log('🌐 Appel API pour créer le devis de nettoyage...');
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'CLEANING',
            data: submissionData
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la création du devis');
        }
        
        const result = await response.json();
        console.log('✅ Devis de nettoyage créé avec succès:', result);
        
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

  return config;
}; 