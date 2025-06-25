"use client";

import React, { useState } from "react";
import { FormGenerator } from "@/components/form-generator";

// Données d'exemple pour différents types de services
const cleaningServiceDetails = {
  id: "service-menage-complet",
  name: "Ménage complet professionnel",
  description: "Service de ménage approfondi pour votre domicile",
  price: 85,
  duration: 3,
  workers: 2,
  type: 'cleaning' as const
};

const movingServiceDetails = {
  id: "service-demenagement",
  name: "Déménagement résidentiel",
  description: "Service de déménagement complet avec équipe professionnelle",
  price: 280,
  duration: 6,
  workers: 4,
  type: 'moving' as const
};

const packageServiceDetails = {
  id: "service-pack-premium",
  name: "Pack Premium Maintenance",
  description: "Pack complet de maintenance avec garantie étendue",
  price: 150,
  duration: 2,
  workers: 1,
  type: 'package' as const
};

// Données d'exemple pour les devis
const cleaningQuoteDetails = {
  id: "quote-cleaning-123456",
  scheduledDate: "2024-02-15T14:00:00Z",
  duration: 4, // 1h supplémentaire
  workers: 3,  // 1 professionnel supplémentaire
  location: "123 Avenue des Champs-Élysées, 75008 Paris",
  additionalInfo: "Appartement de 90m² avec 3 pièces. Attention: présence d'un chat. Clés disponibles chez la gardienne (Mme Dupont, loge rez-de-chaussée).",
  calculatedPrice: 145  // Prix de base + suppléments
};

const movingQuoteDetails = {
  id: "quote-moving-789012",
  scheduledDate: "2024-02-20T08:00:00Z",
  duration: 8, // 2h supplémentaires
  workers: 5,  // 1 déménageur supplémentaire
  location: "456 Rue de la République, 69001 Lyon → 789 Boulevard Saint-Germain, 75006 Paris",
  additionalInfo: "Déménagement T3 (70m²) vers T4 (85m²). Piano droit à transporter. Ascenseur disponible dans les deux immeubles. Cartons à fournir.",
  calculatedPrice: 370  // Prix de base + suppléments
};

const packageQuoteDetails = {
  id: "quote-package-345678",
  scheduledDate: "2024-02-10T10:00:00Z",
  duration: 2,
  workers: 1,
  location: "321 Place Bellecour, 69002 Lyon",
  additionalInfo: "Maintenance préventive système de chauffage. Accès par cour intérieure, codes fournis.",
  calculatedPrice: 175  // Prix pack + options
};

type ServiceType = 'cleaning' | 'moving' | 'package';

export default function ServiceSummaryDemo() {
  const [selectedService, setSelectedService] = useState<ServiceType>('cleaning');
  const [customerData, setCustomerData] = useState<any>(null);
  const [hasInsurance, setHasInsurance] = useState(false);

  const getCurrentServiceData = () => {
    switch (selectedService) {
      case 'cleaning':
        return { serviceDetails: cleaningServiceDetails, quoteDetails: cleaningQuoteDetails };
      case 'moving':
        return { serviceDetails: movingServiceDetails, quoteDetails: movingQuoteDetails };
      case 'package':
        return { serviceDetails: packageServiceDetails, quoteDetails: packageQuoteDetails };
      default:
        return { serviceDetails: cleaningServiceDetails, quoteDetails: cleaningQuoteDetails };
    }
  };

  const handleEditQuote = () => {
    alert("Redirection vers l'édition du devis...");
  };

  const handleConfirmQuote = (customerData: any, hasInsurance: boolean) => {
    setCustomerData(customerData);
    setHasInsurance(hasInsurance);
    
    console.log("Service:", selectedService);
    console.log("Données client:", customerData);
    console.log("Assurance:", hasInsurance);
    
    alert(`Devis ${selectedService} confirmé pour ${customerData.firstName} ${customerData.lastName} (${customerData.email})\nAssurance: ${hasInsurance ? 'Oui' : 'Non'}`);
  };

  const handleInsuranceChange = (hasInsurance: boolean, newTotal: number) => {
    console.log("Assurance changée:", hasInsurance, "Nouveau total:", newTotal);
  };

  const handleBack = () => {
    alert("Retour vers la page précédente...");
  };

  const { serviceDetails, quoteDetails } = getCurrentServiceData();

  const config = {
    title: `Récapitulatif de votre devis ${selectedService}`,
    description: "Vérifiez tous les détails avant de confirmer votre demande",
    serviceType: selectedService as "cleaning" | "moving" | "package",
    layout: {
      type: "service-summary" as const,
      serviceSummaryOptions: {
        serviceDetails,
        quoteDetails,
        onEditQuote: handleEditQuote,
        onConfirmQuote: handleConfirmQuote,
        onInsuranceChange: handleInsuranceChange,
        onBack: handleBack,
        sections: {
          showPrestations: true,
          showGaranties: true,
          showCustomerForm: true
        }
      }
    }
  };

  const getServiceLabel = (type: ServiceType) => {
    switch (type) {
      case 'cleaning': return '🧹 Ménage';
      case 'moving': return '📦 Déménagement';
      case 'package': return '🔧 Pack Maintenance';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Contrôles de démo */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Démo ServiceSummaryLayout Adaptable</h2>
              <p className="text-sm text-gray-600">
                Layout adaptable pour différents types de services avec prestations et prix configurables
              </p>
            </div>

            {/* Sélecteur de type de service */}
            <div className="flex gap-2 ml-auto">
              {(['cleaning', 'moving', 'package'] as ServiceType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedService(type)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedService === type
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getServiceLabel(type)}
                </button>
              ))}
            </div>

            {customerData && (
              <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm">
                ✓ Confirmé pour {customerData.firstName} {customerData.lastName}
                {hasInsurance && " + Assurance"}
              </div>
            )}
            
            {/* Indicateur du serviceType configuré */}
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              📋 Service: {selectedService}
            </div>
          </div>
          
          {/* Indicateur du service actuel */}
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">Service sélectionné: {getServiceLabel(selectedService)}</h3>
                <p className="text-sm text-blue-700">{serviceDetails.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-600">Prix de base</p>
                <p className="font-bold text-blue-900">{serviceDetails.price}€</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ServiceSummaryLayout adaptable */}
      <FormGenerator config={config} />
    </div>
  );
} 