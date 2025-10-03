import { FormField } from "../../types";

// 📋 Champs partagés entre différents services
// Séparation claire entre logique métier et style

// 📏 Champ taille générique (adaptable selon le contexte)
export const sizeField: FormField = {
  name: 'size',
  label: 'Taille',
  type: 'select',
  options: [
    { 
      label: 'Petit', 
      value: 'small'
    },
    { 
      label: 'Moyen', 
      value: 'medium'
    },
    { 
      label: 'Grand', 
      value: 'large'
    },
    { 
      label: 'Très grand', 
      value: 'extra-large'
    }
  ],
  defaultValue: 'medium',
  className: 'mobile-list',
  required: true
};

// 📅 Champ date générique
export const dateField: FormField = {
  name: 'date',
  label: 'Date souhaitée',
  type: 'date',
  required: true,
  // Note: validation sera gérée par sharedValidation.ts
};

// 🕐 Champ heure générique
export const timeField: FormField = {
  name: 'time',
  label: 'Heure souhaitée',
  type: 'text', // Utiliser 'text' en attendant le support 'time'
  required: true,
  defaultValue: '09:00'
};

// 📍 Champs d'adresse complets
export const addressFields = {
  origin: {
    name: 'origin_address',
    label: 'Adresse de départ',
    type: 'text' as const, // Utiliser 'text' en attendant le support 'address'
    required: true
  },
  destination: {
    name: 'destination_address', 
    label: 'Adresse d\'arrivée',
    type: 'text' as const, // Utiliser 'text' en attendant le support 'address'
    required: true
  },
  single: {
    name: 'address',
    label: 'Adresse',
    type: 'text' as const, // Utiliser 'text' en attendant le support 'address'
    required: true
  }
};

// 📝 Champ commentaires générique
export const commentsField: FormField = {
  name: 'comments',
  label: 'Informations complémentaires',
  type: 'textarea',
  required: false
};

// 📞 Champs contact
export const contactFields = {
  phone: {
    name: 'phone',
    label: 'Téléphone',
    type: 'text' as const, // Utiliser 'text' pour compatibilité
    required: true
  },
  email: {
    name: 'email',
    label: 'Email',
    type: 'email' as const,
    required: true
  }
};

// 🏠 Champs spécifiques logement
export const housingFields = {
  floor: {
    name: 'floor',
    label: 'Étage',
    type: 'select' as const,
    options: [
      { label: 'Rez-de-chaussée', value: '0' },
      { label: '1er étage', value: '1' },
      { label: '2ème étage', value: '2' },
      { label: '3ème étage', value: '3' },
      { label: '4ème étage et +', value: '4+' }
    ],
    defaultValue: '0'
  },
  elevator: {
    name: 'elevator',
    label: 'Ascenseur disponible',
    type: 'radio' as const,
    options: [
      { label: 'Oui', value: 'yes' },
      { label: 'Non', value: 'no' }
    ],
    required: true
  },
  access: {
    name: 'access_difficulty',
    label: 'Difficulté d\'accès',
    type: 'select' as const,
    options: [
      { label: 'Facile', value: 'easy' },
      { label: 'Modéré', value: 'moderate' },
      { label: 'Difficile', value: 'difficult' }
    ],
    defaultValue: 'easy'
  }
};

// 🎯 Factory functions pour créer des variantes
export const createSizeFieldForService = (
  serviceType: 'moving' | 'cleaning' | 'delivery',
  customOptions?: Array<{label: string, value: string}>
): FormField => {
  const serviceLabels = {
    moving: {
      small: 'Studio / 1 pièce',
      medium: '2-3 pièces', 
      large: '4-5 pièces',
      'extra-large': '6+ pièces'
    },
    cleaning: {
      small: 'Petit espace (< 30m²)',
      medium: 'Moyen espace (30-70m²)',
      large: 'Grand espace (70-120m²)',
      'extra-large': 'Très grand espace (120m²+)'
    },
    delivery: {
      small: 'Petit colis',
      medium: 'Colis standard',
      large: 'Gros colis',
      'extra-large': 'Colis volumineux'
    }
  };

  return {
    ...sizeField,
    options: customOptions || Object.entries(serviceLabels[serviceType]).map(([value, label]) => ({
      label,
      value
    }))
  };
};

// 📋 Collections prêtes à l'emploi
export const commonFieldCollections = {
  // Pour services avec déplacement (moving, delivery)
  withMovement: [
    addressFields.origin,
    addressFields.destination,
    dateField,
    timeField,
    housingFields.floor,
    housingFields.elevator,
    contactFields.phone,
    commentsField
  ],
  
  // Pour services sur place (cleaning)
  onSite: [
    addressFields.single,
    dateField, 
    timeField,
    housingFields.floor,
    housingFields.elevator,
    housingFields.access,
    contactFields.phone,
    commentsField
  ],
  
  // Minimum vital pour tous services
  essential: [
    dateField,
    timeField,
    contactFields.phone
  ]
};

// 🛠️ Utilitaires
export const getFieldByName = (name: string): FormField | undefined => {
  const allFields = [
    sizeField,
    dateField,
    timeField,
    ...Object.values(addressFields),
    commentsField,
    ...Object.values(contactFields),
    ...Object.values(housingFields)
  ];
  
  return allFields.find(field => field.name === name);
};

export const createFieldCollection = (fieldNames: string[]): FormField[] => {
  return fieldNames.map(name => getFieldByName(name)).filter(Boolean) as FormField[];
};