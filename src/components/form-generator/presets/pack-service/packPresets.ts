import { PresetConfig, FormSummaryConfig } from "../../types";

// 📝 Valeurs par défaut pour les formulaires de packs
export const packDefaultValues = {
  // Planification
  scheduledDate: '',
  
  // Adresses - Départ
  pickupAddress: '',
  pickupFloor: '0',
  pickupElevator: 'no',
  pickupCarryDistance: '',
  pickupLogisticsConstraints: [],
  
  // Adresses - Arrivée  
  deliveryAddress: '',
  deliveryFloor: '0',
  deliveryElevator: 'no',
  deliveryCarryDistance: '',
  deliveryLogisticsConstraints: [],
  
  // Configuration du pack
  duration: '',
  workers: '',
  
  // Contact et notifications
  whatsappOptIn: false,
  
  // Commentaires
  additionalInfo: ''
};

// 🎨 Styles CSS maintenant intégrés dans globals.css
export const packStyles = ""; // Styles déplacés vers globals.css pour éviter les conflits

// 📋 Configuration du récapitulatif pour les packs
export const packSummaryConfig: FormSummaryConfig = {
  title: "Récapitulatif du Pack",
  sections: [
    {
      title: "Pack Sélectionné",
      icon: "📦",
      fields: [
        {
          key: "packName",
          label: "Pack",
          format: (value: any, formData: any) => formData.packName || "Pack personnalisé"
        },
        {
          key: "packDescription", 
          label: "Description",
          format: (value: any, formData: any) => formData.packDescription || "",
          condition: (value: any, formData: any) => !!formData.packDescription
        },
        {
          key: "duration",
          label: "Durée",
          format: (value: any) => value ? `${value} jour${value > 1 ? 's' : ''}` : "",
          condition: (value: any) => !!value
        },
        {
          key: "workers",
          label: "Équipe",
          format: (value: any) => value ? `${value} travailleur${value > 1 ? 's' : ''}` : "",
          condition: (value: any) => !!value
        }
      ]
    },
    {
      title: "Planification",
      icon: "📅",
      fields: [
        {
          key: "scheduledDate",
          label: "Date prévue",
          format: (value: any) => value ? new Date(value).toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          }) : "",
          condition: (value: any) => !!value
        }
      ]
    },
    {
      title: "Adresses",
      icon: "📍",
      fields: [
        {
          key: "pickupAddress",
          label: "Adresse de départ",
          format: (value: any, formData: any) => {
            let result = value;
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
            
            // Vérifier si monte-meuble dans les contraintes
            if (formData.pickupLogisticsConstraints && formData.pickupLogisticsConstraints.includes('furniture_lift_required')) {
              details.push('🏗️ Monte-meuble');
            }
            
            return details.length > 0 ? `${result}\n${details.join(' • ')}` : result;
          },
          condition: (value: any) => !!value
        },
        {
          key: "deliveryAddress",
          label: "Détails arrivée",
          format: (value: any, formData: any) => {
            let result = value;
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
            
            // Vérifier si monte-meuble dans les contraintes
            if (formData.deliveryLogisticsConstraints && formData.deliveryLogisticsConstraints.includes('furniture_lift_required')) {
              details.push('🏗️ Monte-meuble');
            }
            
            return details.length > 0 ? `${result}\n${details.join(' • ')}` : result;
          },
          condition: (value: any) => !!value
        }
      ]
    },
    {
      title: "Contact",
      icon: "📞",
      fields: [
        {
          key: "whatsappOptIn",
          label: "📱 Notifications WhatsApp",
          format: (value: any) => value ? "Activées" : "Désactivées",
          style: "text-xs text-gray-500"
        }
      ]
    }
  ]
};

// 🎯 Configuration complète du preset Pack
export const PackPreset: PresetConfig = {
  form: {
    title: "Réservation Pack",
    description: "Configurez votre pack de déménagement",
    serviceType: "package"
  },
  defaultValues: packDefaultValues,
  summary: packSummaryConfig,
  styles: packStyles,
  meta: {
    industry: "pack",
    name: "Pack Déménagement",
    description: "Preset complet pour les formulaires de réservation de packs",
    version: "1.0.0"
  }
}; 