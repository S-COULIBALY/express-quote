import { PresetConfig, FormSummaryConfig } from "../../types";

// 📝 Valeurs par défaut pour les formulaires de déménagement
export const movingDefaultValues = {
  // Date et Volume
  movingDate: "",
  volume: "",
  
  // Adresses - Départ
  pickupAddress: "",
  pickupFloor: "0",
  pickupElevator: "no",
  pickupCarryDistance: "",
  pickupHighFloorWarning: false,
  pickupFurnitureLift: false,
  pickupLogisticsConstraints: [],
  
  // Adresses - Arrivée  
  deliveryAddress: "",
  deliveryFloor: "0",
  deliveryElevator: "no",
  deliveryCarryDistance: "",
  deliveryHighFloorWarning: false,
  deliveryFurnitureLift: false,
  deliveryLogisticsConstraints: [],
  
  // Logement
  // propertyType: "",
  // surface: "",
  // rooms: "",
  // occupants: "",
  
  // Services
  // wantsAdditionalServices: false,
  // packaging: false,
  // furniture: false,
  // fragile: false,
  // storage: false,
  // disassembly: false,
  // unpacking: false,
  // supplies: false,
  // fragileItems: false,
  
  // Contact
  email: "",
  phone: "",
  whatsappOptIn: false,
  
  // Commentaires
  additionalComments: ""
};

// 🎨 Styles CSS maintenant intégrés dans globals.css
export const movingStyles = ""; // Styles déplacés vers globals.css pour éviter les conflits

// 📋 Configuration du récapitulatif pour les déménagements
export const movingSummaryConfig: FormSummaryConfig = {
  title: "Récapitulatif du Déménagement",
  sections: [
    {
      title: "Planification",
      icon: "📅",
      fields: [
        {
          key: "movingDate",
          label: "Date prévue",
          format: (value: any) => value ? new Date(value).toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          }) : ""
        },
        {
          key: "volume",
          label: "Volume",
          format: (value: any) => value ? `${value} m³` : ""
        }
      ]
    },
    {
      title: "Adresses",
      icon: "🗺️",
      fields: [
        {
          key: "pickupAddress",
          label: "📍 Départ",
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
            
            return details.length > 0 ? `${result}\n${details.join(' • ')}` : result;
          },
          condition: (value: any) => !!value
        },
        {
          key: "deliveryAddress", 
          label: "📍 Arrivée",
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
            
            return details.length > 0 ? `${result}\n${details.join(' • ')}` : result;
          },
          condition: (value: any) => !!value
        }
      ]
    },
    {
      title: "Informations complémentaires",
      icon: "📝",
      fields: [
        {
          key: "additionalInfo",
          label: "Commentaires",
          condition: (value: any) => !!value && value.trim() !== ""
        }
      ]
    },
    {
      title: "Notifications",
      icon: "📱",
      fields: [
        {
          key: "whatsappOptIn",
          label: "Notifications WhatsApp",
          format: (value: any) => value ? "✅ Activées pour le suivi" : "❌ Désactivées",
          style: "text-sm",
          condition: (value: any) => value !== undefined
        }
      ]
    }
  ]
};

// 🎯 Configuration complète du preset Moving
export const MovingPreset: PresetConfig = {
  form: {
    title: "Devis Déménagement",
    description: "Configurez votre déménagement sur mesure",
    serviceType: "moving"
  },
  defaultValues: movingDefaultValues,
  summary: movingSummaryConfig,
  styles: movingStyles,
  meta: {
    industry: "moving",
    name: "Déménagement",
    description: "Preset complet pour les formulaires de devis de déménagement",
    version: "1.0.0"
  }
}; 