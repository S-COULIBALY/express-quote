"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CheckBadgeIcon,
  ArrowLeftIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";

// Types locaux pour éviter les dépendances
interface ServiceDetails {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  workers: number;
  type?: 'cleaning' | 'moving' | 'package' | 'maintenance' | 'other';
}

interface QuoteDetails {
  id: string;
  scheduledDate?: string;
  duration?: number;
  workers?: number;
  location?: string;
  additionalInfo?: string;
  calculatedPrice: number;
}

interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// Nouvelles interfaces pour la configuration adaptable
interface PricingRule {
  type: 'hourly' | 'per_worker' | 'flat_fee' | 'custom';
  rate: number;
  label: string;
  unit?: string;
}

interface Prestation {
  icon?: React.ReactNode;
  text: string;
  included: boolean;
}

interface Garantie {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface ServiceConfig {
  prestations?: Prestation[];
  garanties?: Garantie[];
  pricingRules?: {
    extraHours?: PricingRule;
    extraWorkers?: PricingRule;
    customRules?: PricingRule[];
  };
  insuranceConfig?: {
    show: boolean;
    price: number;
    label: string;
    description: string;
  };
}

interface ServiceSummaryLayoutProps {
  // Données du service
  serviceDetails: ServiceDetails;
  
  // Données du devis
  quoteDetails: QuoteDetails;
  
  // Configuration adaptable par type de service
  serviceConfig?: ServiceConfig;
  
  // Configuration d'affichage (legacy, maintenant dans serviceConfig)
  showInsurance?: boolean;
  insurancePrice?: number;
  vatRate?: number;
  
  // Callbacks
  onEditQuote?: () => void;
  onConfirmQuote?: (customerData: CustomerFormData, hasInsurance: boolean) => void;
  onInsuranceChange?: (hasInsurance: boolean, newTotal: number) => void;
  onBack?: () => void;
  
  // Customisation
  title?: string;
  description?: string;
  sections?: {
    showPrestations?: boolean;
    showGaranties?: boolean;
    showCustomerForm?: boolean;
  };
  
  // État de chargement
  isLoading?: boolean;
  saveStatus?: 'saving' | 'saved' | 'error' | null;
}

// Fonction utilitaire pour obtenir la configuration par défaut selon le type de service
const getDefaultServiceConfig = (serviceType: string): ServiceConfig => {
  switch (serviceType) {
    case 'cleaning':
      return {
        prestations: [
          { text: "Expertise professionnelle qualifiée", included: true },
          { text: "Matériel et équipement standard", included: true },
          { text: "Frais de déplacement inclus", included: true },
          { text: "Garantie de satisfaction 7 jours", included: true },
          { text: "Produits ou matériaux spécifiques non standard", included: false },
          { text: "Interventions supplémentaires non prévues", included: false }
        ],
        garanties: [
          { title: "Garantie de service", description: "Tous nos services sont garantis 7 jours." },
          { title: "Conditions d'annulation", description: "Annulation sans frais jusqu'à 24h avant le rendez-vous." },
          { title: "Professionnels vérifiés", description: "Tous nos intervenants sont certifiés et assurés." }
        ],
        pricingRules: {
          extraHours: { type: 'hourly', rate: 35, label: "Heures supplémentaires", unit: "h" },
          extraWorkers: { type: 'per_worker', rate: 35, label: "Professionnels supplémentaires", unit: "professionnel(s)" }
        },
        insuranceConfig: {
          show: true,
          price: 30,
          label: "Assurance intervention",
          description: "Protection contre les dommages pendant 30 jours"
        }
      };
    
    case 'moving':
      return {
        prestations: [
          { text: "Équipe de déménageurs professionnels", included: true },
          { text: "Matériel de protection et sangles", included: true },
          { text: "Démontage/remontage mobilier standard", included: true },
          { text: "Transport sécurisé", included: true },
          { text: "Assurance objets de valeur", included: false },
          { text: "Cartons et emballages spéciaux", included: false },
          { text: "Stockage temporaire", included: false }
        ],
        garanties: [
          { title: "Assurance transport", description: "Couverture complète pendant le transport." },
          { title: "Garantie casse", description: "Remboursement en cas de dommage de nos équipes." },
          { title: "Ponctualité garantie", description: "Respect des créneaux convenus ou geste commercial." }
        ],
        pricingRules: {
          extraHours: { type: 'hourly', rate: 45, label: "Heures supplémentaires", unit: "h" },
          extraWorkers: { type: 'per_worker', rate: 45, label: "Déménageurs supplémentaires", unit: "déménageur(s)" }
        },
        insuranceConfig: {
          show: true,
          price: 50,
          label: "Assurance objets de valeur",
          description: "Protection renforcée pour vos biens précieux"
        }
      };
    
    case 'package':
      return {
        prestations: [
          { text: "Service selon forfait sélectionné", included: true },
          { text: "Prestations définies dans le pack", included: true },
          { text: "Support client dédié", included: true },
          { text: "Garantie qualité", included: true },
          { text: "Options supplémentaires", included: false },
          { text: "Services premium", included: false }
        ],
        garanties: [
          { title: "Garantie forfait", description: "Toutes les prestations du forfait sont garanties." },
          { title: "Satisfaction client", description: "Reprise gratuite si non-conformité aux spécifications." },
          { title: "Support technique", description: "Assistance et conseil pendant toute la prestation." }
        ],
        pricingRules: {
          customRules: [
            { type: 'flat_fee', rate: 25, label: "Options supplémentaires" },
            { type: 'flat_fee', rate: 15, label: "Frais de modification" }
          ]
        },
        insuranceConfig: {
          show: true,
          price: 25,
          label: "Extension de garantie",
          description: "Garantie étendue à 30 jours"
        }
      };
    
    case 'maintenance':
      return {
        prestations: [
          { text: "Diagnostic professionnel", included: true },
          { text: "Intervention technique qualifiée", included: true },
          { text: "Pièces standard incluses", included: true },
          { text: "Garantie intervention 15 jours", included: true },
          { text: "Pièces spécifiques ou coûteuses", included: false },
          { text: "Interventions d'urgence", included: false }
        ],
        garanties: [
          { title: "Garantie technique", description: "Intervention garantie 15 jours." },
          { title: "Pièces garanties", description: "Pièces remplacées garanties selon fabricant." },
          { title: "Intervention certifiée", description: "Techniciens agréés et assurés." }
        ],
        pricingRules: {
          extraHours: { type: 'hourly', rate: 65, label: "Heures supplémentaires", unit: "h" },
          customRules: [
            { type: 'flat_fee', rate: 50, label: "Déplacement d'urgence" }
          ]
        },
        insuranceConfig: {
          show: true,
          price: 40,
          label: "Assurance dommages",
          description: "Protection contre les dommages lors de l'intervention"
        }
      };
    
    default:
      return {
        prestations: [
          { text: "Service professionnel", included: true },
          { text: "Équipement fourni", included: true },
          { text: "Garantie standard", included: true }
        ],
        garanties: [
          { title: "Garantie service", description: "Service garanti selon nos conditions générales." }
        ],
        pricingRules: {
          extraHours: { type: 'hourly', rate: 40, label: "Heures supplémentaires", unit: "h" }
        },
        insuranceConfig: {
          show: true,
          price: 30,
          label: "Assurance",
          description: "Protection supplémentaire"
        }
      };
  }
};

export const ServiceSummaryLayout: React.FC<ServiceSummaryLayoutProps> = ({
  serviceDetails,
  quoteDetails,
  serviceConfig,
  showInsurance = true,
  insurancePrice = 30,
  vatRate = 0.20,
  onEditQuote,
  onConfirmQuote,
  onInsuranceChange,
  onBack,
  title = "Récapitulatif du devis",
  description = "Vérifiez les détails ci-dessous avant de confirmer votre devis",
  sections = {
    showPrestations: true,
    showGaranties: true,
    showCustomerForm: true
  },
  isLoading = false,
  saveStatus = null
}) => {
  // Utiliser la configuration fournie ou celle par défaut selon le type de service
  const config = serviceConfig || getDefaultServiceConfig(serviceDetails.type || 'other');
  
  // Utiliser les valeurs de config pour l'assurance (priorité à serviceConfig)
  const effectiveInsuranceConfig = config.insuranceConfig || {
    show: showInsurance,
    price: insurancePrice,
    label: "Assurance",
    description: "Protection supplémentaire"
  };

  // États pour les sections accordéon
  const [expandedSections, setExpandedSections] = useState({
    garanties: false,
    prestations: false,
    additionalInfo: false,
    customerInfo: false
  });
  
  // États pour le formulaire client
  const [customerData, setCustomerData] = useState<CustomerFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
  // États pour la validation
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [touchedFields, setTouchedFields] = useState<{[key: string]: boolean}>({});
  const [showFormError, setShowFormError] = useState(false);
  
  // États pour l'assurance et les prix
  const [hasInsurance, setHasInsurance] = useState(false);
  const [totalPriceHT, setTotalPriceHT] = useState(0);
  const [totalPriceTTC, setTotalPriceTTC] = useState(0);

  // Calcul des prix au chargement et lors des changements
  useEffect(() => {
    calculateTotals();
  }, [quoteDetails, hasInsurance, effectiveInsuranceConfig.price, vatRate]);

  const calculateTotals = () => {
    let basePrice = quoteDetails.calculatedPrice;
    
    // Ajouter l'assurance si sélectionnée
    if (hasInsurance) {
      basePrice += effectiveInsuranceConfig.price;
    }
    
    setTotalPriceHT(basePrice);
    setTotalPriceTTC(basePrice * (1 + vatRate));
  };

  // Calculer les suppléments selon les règles configurées
  const calculateExtraCharges = () => {
    const extras = [];
    
    // Heures supplémentaires
    if (quoteDetails.duration && quoteDetails.duration > serviceDetails.duration && config.pricingRules?.extraHours) {
      const extraHours = quoteDetails.duration - serviceDetails.duration;
      const rule = config.pricingRules.extraHours;
      const workers = quoteDetails.workers || serviceDetails.workers;
      const extraCost = rule.type === 'hourly' ? rule.rate * extraHours * workers : rule.rate * extraHours;
      
      extras.push({
        label: rule.label,
        description: `+${extraHours}${rule.unit || 'h'}`,
        amount: extraCost
      });
    }
    
    // Professionnels/personnel supplémentaire
    if (quoteDetails.workers && quoteDetails.workers > serviceDetails.workers && config.pricingRules?.extraWorkers) {
      const extraWorkers = quoteDetails.workers - serviceDetails.workers;
      const rule = config.pricingRules.extraWorkers;
      const duration = quoteDetails.duration || serviceDetails.duration;
      const extraCost = rule.type === 'per_worker' ? rule.rate * extraWorkers * duration : rule.rate * extraWorkers;
      
      extras.push({
        label: rule.label,
        description: `+${extraWorkers} ${rule.unit || 'personne(s)'}`,
        amount: extraCost
      });
    }
    
    // Règles personnalisées
    if (config.pricingRules?.customRules) {
      config.pricingRules.customRules.forEach(rule => {
        extras.push({
          label: rule.label,
          description: rule.unit ? `1 ${rule.unit}` : '',
          amount: rule.rate
        });
      });
    }
    
    return extras;
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCustomerInputChange = (field: keyof CustomerFormData, value: string) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));
    
    setTouchedFields(prev => ({
      ...prev,
      [field]: true
    }));
    
    validateField(field, value);
  };

  const validateField = (field: keyof CustomerFormData, value: string) => {
    let error = '';
    
    if (!value.trim()) {
      error = 'Ce champ est requis';
    } else if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = 'Adresse email invalide';
    } else if (field === 'phone' && !/^(\+33|0)[1-9](\d{2}){4}$/.test(value)) {
      error = 'Numéro de téléphone invalide';
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
    
    return !error;
  };

  const validateForm = () => {
    const fields = ['firstName', 'lastName', 'email', 'phone'] as const;
    let isValid = true;
    const errors: {[key: string]: string} = {};
    
    const allTouched = fields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as {[key: string]: boolean});
    
    setTouchedFields(allTouched);
    
    fields.forEach(field => {
      const value = customerData[field];
      
      if (field === 'email' && (!value || !value.trim())) {
        errors[field] = 'L\'adresse email est obligatoire';
        isValid = false;
      } else {
        const fieldValid = validateField(field, value);
        if (!fieldValid) {
          isValid = false;
          errors[field] = validationErrors[field] || 'Ce champ est requis';
        }
      }
    });
    
    setValidationErrors(errors);
    
    if (!isValid && !expandedSections.customerInfo) {
      setExpandedSections(prev => ({
        ...prev,
        customerInfo: true
      }));
      
      setShowFormError(true);
      setTimeout(() => setShowFormError(false), 5000);
    }
    
    return isValid;
  };

  const handleInsuranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setHasInsurance(isChecked);
    
    if (onInsuranceChange) {
      const newTotal = isChecked 
        ? totalPriceHT + effectiveInsuranceConfig.price 
        : totalPriceHT - effectiveInsuranceConfig.price;
      onInsuranceChange(isChecked, newTotal);
    }
  };

  const handleConfirmQuote = () => {
    if (sections?.showCustomerForm && !validateForm()) {
      return;
    }
    
    if (onConfirmQuote) {
      onConfirmQuote(customerData, hasInsurance);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full flex flex-col items-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-emerald-500 border-t-transparent mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800">Préparation de votre récapitulatif</h3>
          <p className="text-gray-600 text-center mt-2">Nous récupérons les détails de votre devis...</p>
          <div className="w-full bg-gray-200 h-2 rounded-full mt-6 overflow-hidden">
            <div className="bg-emerald-500 h-full animate-pulse" style={{width: '70%'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          {onBack && (
            <button 
              onClick={onBack}
              className="inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              <span>Retour</span>
            </button>
          )}
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>
        
        <div className="space-y-6">
          {/* Section Service et Coûts */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 px-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">{serviceDetails.name}</h2>
                {onEditQuote && (
                  <button 
                    onClick={onEditQuote}
                    className="text-white/90 hover:text-white text-sm font-medium transition-colors"
                  >
                    Modifier
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-6">
              {/* Informations principales */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-emerald-500 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-medium">
                      {quoteDetails.scheduledDate 
                        ? format(new Date(quoteDetails.scheduledDate), 'dd MMMM yyyy', { locale: fr }) 
                        : 'Non spécifiée'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <ClockIcon className="h-5 w-5 text-emerald-500 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Durée</p>
                    <p className="font-medium">{quoteDetails.duration || serviceDetails.duration}h</p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <UserGroupIcon className="h-5 w-5 text-emerald-500 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Professionnels</p>
                    <p className="font-medium">{quoteDetails.workers || serviceDetails.workers}</p>
                  </div>
                </div>
              </div>
              
              {/* Adresse */}
              {quoteDetails.location && (
                <div className="flex items-start p-4 bg-blue-50 rounded-lg mb-6">
                  <MapPinIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-700">Adresse d'intervention</p>
                    <p className="text-gray-700">{quoteDetails.location}</p>
                  </div>
                </div>
              )}
              
              {/* Informations supplémentaires */}
              {quoteDetails.additionalInfo && (
                <div className="mb-6">
                  <button 
                    className="flex w-full items-center justify-between text-sm text-gray-600 hover:text-gray-900"
                    onClick={() => toggleSection('additionalInfo')}
                  >
                    <span className="font-medium">Informations supplémentaires</span>
                    {expandedSections.additionalInfo ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </button>
                  
                  {expandedSections.additionalInfo && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700">{quoteDetails.additionalInfo}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Séparateur */}
              <div className="border-t border-gray-200 my-6"></div>
              
              {/* Détail des coûts */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Détail des coûts</h3>
                
                {/* Prix de base */}
                <div className="flex justify-between py-3 px-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Prix de base</p>
                    <p className="text-sm text-gray-600">{serviceDetails.name}</p>
                  </div>
                  <span className="font-medium">{formatPrice(serviceDetails.price)}</span>
                </div>
                
                {/* Suppléments configurables */}
                {calculateExtraCharges().map((extra, index) => (
                  <div key={index} className="flex justify-between py-3 px-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{extra.label}</p>
                      {extra.description && (
                        <p className="text-sm text-gray-600">{extra.description}</p>
                      )}
                    </div>
                    <span className="font-medium text-orange-600">
                      +{formatPrice(extra.amount)}
                    </span>
                  </div>
                ))}
                
                {/* Assurance */}
                {effectiveInsuranceConfig.show && (
                  <div className="mt-4">
                    <label className="flex items-center justify-between p-4 border border-emerald-100 rounded-lg bg-emerald-50/50 hover:bg-emerald-50 transition-all cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={hasInsurance}
                          onChange={handleInsuranceChange}
                          className="w-4 h-4 text-emerald-600 border-2 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <div className="ml-3">
                          <span className="font-medium text-gray-900">{effectiveInsuranceConfig.label}</span>
                          <p className="text-xs text-gray-600">{effectiveInsuranceConfig.description}</p>
                        </div>
                      </div>
                      <span className="font-medium">+{formatPrice(effectiveInsuranceConfig.price)}</span>
                    </label>
                  </div>
                )}
                
                {/* Totaux */}
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-600">Sous-total HT</span>
                    <span className="font-medium">{formatPrice(totalPriceHT)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-600">TVA ({Math.round(vatRate * 100)}%)</span>
                    <span className="font-medium">{formatPrice(totalPriceHT * vatRate)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold pt-3 border-t border-gray-200">
                    <span>Total TTC</span>
                    <span className="text-emerald-600">{formatPrice(totalPriceTTC)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Accordéon Prestations incluses */}
          {sections?.showPrestations && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <button 
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={() => toggleSection('prestations')}
              >
                <div className="flex items-center">
                  <CheckBadgeIcon className="h-5 w-5 text-emerald-500 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Prestations incluses</h2>
                </div>
                {expandedSections.prestations ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
              
              {expandedSections.prestations && (
                <div className="px-4 pb-4">
                  <div className="space-y-3">
                    {/* Prestations incluses */}
                    {config.prestations?.filter(p => p.included).map((prestation, index) => (
                      <div key={`included-${index}`} className="flex items-start">
                        <CheckBadgeIcon className="h-4 w-4 text-emerald-500 mr-2 mt-0.5" />
                        <p className="text-sm text-gray-700">{prestation.text}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Prestations non incluses */}
                  {config.prestations?.some(p => !p.included) && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Non inclus</h3>
                      <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                        {config.prestations?.filter(p => !p.included).map((prestation, index) => (
                          <li key={`excluded-${index}`}>{prestation.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Accordéon Garanties */}
          {sections?.showGaranties && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <button 
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={() => toggleSection('garanties')}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">Garanties et conditions</h2>
                </div>
                {expandedSections.garanties ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
              
              {expandedSections.garanties && (
                <div className="px-4 pb-4 space-y-3">
                  {config.garanties?.map((garantie, index) => (
                    <div key={index}>
                      <h3 className="text-sm font-medium text-gray-900">{garantie.title}</h3>
                      <p className="text-xs text-gray-600">{garantie.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Formulaire client */}
          {sections?.showCustomerForm && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <button 
                className={`w-full flex items-center justify-between p-4 text-left ${showFormError ? 'bg-red-50' : ''}`}
                onClick={() => toggleSection('customerInfo')}
              >
                <div className="flex items-center">
                  <UserIcon className={`h-5 w-5 ${showFormError ? 'text-red-500' : 'text-emerald-500'} mr-2`} />
                  <h2 className={`text-lg font-semibold ${showFormError ? 'text-red-700' : 'text-gray-900'}`}>
                    Vos coordonnées
                    {showFormError && <span className="ml-2 text-red-600 text-sm font-normal">⚠️ Informations requises</span>}
                  </h2>
                </div>
                {expandedSections.customerInfo ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
              
              {expandedSections.customerInfo && (
                <div className="px-4 pb-6">
                  {showFormError && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                        <p className="text-sm text-red-700">
                          Veuillez compléter tous les champs pour finaliser votre devis.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <form className="space-y-6">
                    {/* Nom et prénom */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 flex items-center">
                          <UserIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                          Prénom <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          value={customerData.firstName}
                          onChange={(e) => handleCustomerInputChange('firstName', e.target.value)}
                          className={`block w-full rounded-lg shadow-sm sm:text-sm 
                            ${touchedFields.firstName && validationErrors.firstName 
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                              : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'}`}
                          placeholder="Votre prénom"
                          required
                        />
                        {touchedFields.firstName && validationErrors.firstName && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 flex items-center">
                          <UserIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                          Nom <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          value={customerData.lastName}
                          onChange={(e) => handleCustomerInputChange('lastName', e.target.value)}
                          className={`block w-full rounded-lg shadow-sm sm:text-sm 
                            ${touchedFields.lastName && validationErrors.lastName 
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                              : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'}`}
                          placeholder="Votre nom"
                          required
                        />
                        {touchedFields.lastName && validationErrors.lastName && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Email et téléphone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Email <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={customerData.email}
                          onChange={(e) => handleCustomerInputChange('email', e.target.value)}
                          className={`block w-full rounded-lg shadow-sm sm:text-sm 
                            ${touchedFields.email && validationErrors.email 
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                              : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'}`}
                          placeholder="votre.email@exemple.com"
                          required
                        />
                        {touchedFields.email && validationErrors.email && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Téléphone <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          value={customerData.phone}
                          placeholder="0612345678"
                          onChange={(e) => handleCustomerInputChange('phone', e.target.value)}
                          className={`block w-full rounded-lg shadow-sm sm:text-sm 
                            ${touchedFields.phone && validationErrors.phone 
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                              : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'}`}
                          required
                        />
                        {touchedFields.phone && validationErrors.phone && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">Format: 0612345678 ou +33612345678</p>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-600">
                          <span className="text-red-500 mr-1">*</span>
                          Champs obligatoires pour finaliser votre demande de devis
                        </p>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Boutons d'action */}
        <div className="flex justify-between items-center mt-8 p-4 bg-white rounded-xl shadow-md border border-gray-100">
          <div>
            <p className="text-gray-600 text-sm">Total TTC</p>
            <p className="text-2xl font-bold text-emerald-600">{formatPrice(totalPriceTTC)}</p>
          </div>
          
          <div className="flex gap-3">
            {onEditQuote && (
              <button
                onClick={onEditQuote}
                className="px-4 py-2 border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Modifier
              </button>
            )}
            <button
              onClick={handleConfirmQuote}
              disabled={saveStatus === 'saving'}
              className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saveStatus === 'saving' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Traitement...
                </>
              ) : (
                <>
                  <ArrowRightIcon className="h-4 w-4" />
                  Confirmer le devis
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 