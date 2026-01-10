"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FormGenerator, FormGeneratorRef } from '@/components/form-generator';
import { FormStylesSimplified } from '@/components/form-generator/styles/FormStylesSimplified';
import { globalFormPreset } from '@/components/form-generator/presets/_shared/globalPreset';
import { getMenageSurMesureServiceConfig } from '@/components/form-generator/presets/menage-sur-mesure-service';
import { transformCatalogDataToMenageSurMesure } from '@/utils/catalogTransformers';
import { useRealTimePricing } from '@/hooks/shared/useCentralizedPricing';
import { useUnifiedSubmission } from '@/hooks/generic/useUnifiedSubmission';
import { createMenageSurMesureSubmissionConfig } from '@/hooks/business';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ServicesNavigation } from '@/components/ServicesNavigation';
import { PaymentCard } from '@/components/PaymentCard';
import { PriceProvider, usePrice } from '@/components/PriceProvider';

// Service initial (simulation des données catalogue)
const initialService = {
  id: 'menage-sur-mesure',
  name: 'Ménage Sur Mesure',
  description: 'Service de nettoyage personnalisé selon vos besoins',
  price: null, // Prix calculé dynamiquement
  duration: null, // Durée calculée selon surface
  workers: null, // Nombre de travailleurs calculé selon besoins
  features: ['Service personnalisé', 'Devis adapté'],
  includes: ['Étude gratuite', 'Options modulables'],
  serviceType: 'menage-sur-mesure',
  isPremium: true,
  requiresSurface: true,
  requiresCustomPricing: true,
  isDynamicPricing: true
};

// ✅ Composant pour mettre à jour le PriceProvider avec le prix calculé
const PriceUpdater: React.FC<{ priceCalculator: ReturnType<typeof useRealTimePricing> }> = ({ priceCalculator }) => {
  const { updatePrice } = usePrice();
  const calculatedPrice = priceCalculator?.calculatedPrice || 0;
  
  useEffect(() => {
    updatePrice(calculatedPrice, priceCalculator?.priceDetails);
  }, [calculatedPrice, priceCalculator?.priceDetails, updatePrice]);
  
  return null;
};

export default function MenageSurMesurePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const formRef = useRef<FormGeneratorRef>(null);

  // Effet pour gérer l'hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 1. Transformation des données catalogue
  const transformedService = transformCatalogDataToMenageSurMesure({
    catalogSelection: {
      id: initialService.id,
      category: 'MENAGE',
      subcategory: 'sur-mesure',
      marketingTitle: initialService.name,
      marketingSubtitle: 'Service personnalisé',
      marketingDescription: initialService.description,
      marketingPrice: 0,
      isFeatured: true,
      isNewOffer: false
    },
    item: {
      ...initialService,
      type: 'service',
      price: 0, // Prix calculé dynamiquement
      workers: 0, // Calculé selon la surface
      duration: 0, // Calculée selon la surface
      popular: false
    },
    template: undefined,
    formDefaults: {}
  });

  // 2. Hook de calcul de prix en temps réel
  const priceCalculator = useRealTimePricing(
    ServiceType.CLEANING_PREMIUM,
    0, // Prix de base
    transformedService.__presetSnapshot
  );

  // 3. Hook de soumission
  const submissionConfig = createMenageSurMesureSubmissionConfig(transformedService);
  const submissionHook = useUnifiedSubmission(
    submissionConfig,
    priceCalculator.calculatedPrice
  );

  // 4. Handlers
  const handlePriceCalculated = async (price: number, details: any) => {
    console.log('💰 Prix calculé:', price, details);
  };

  const handleSubmitFromPaymentCard = async (insuranceSelected: boolean) => {
    setIsSubmitting(true);
    try {
      // Récupérer les données du formulaire
      const formData = formRef.current?.getFormData() || {};

      // Ajouter l'option assurance
      const dataWithInsurance = {
        ...formData,
        insurance: insuranceSelected,
        insuranceAmount: insuranceSelected ? 25 : 0
      };

      await submissionHook.submit(dataWithInsurance);
      toast.success('Demande créée avec succès !');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création de la demande';
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSuccess = async (data: any) => {
    // Appelé par le bouton invisible du FormGenerator
    setIsSubmitting(true);
    try {
      await submissionHook.submit(data);
      toast.success('Demande créée avec succès !');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création de la demande';
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleError = (error: any) => {
    toast.error('Une erreur est survenue. Veuillez réessayer.');
  };

  // 5. Configuration du formulaire avec le preset
  const formConfig = getMenageSurMesureServiceConfig({
    service: transformedService,
    onPriceCalculated: handlePriceCalculated,
    onSubmitSuccess: handleSubmitSuccess,
    onError: handleError
  });

  // Éviter le rendu pendant l'hydration
  if (!isClient) {
    return null;
  }

  return (
    <div className="form-generator min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 font-ios">
      {/* 🎨 Styles iOS 18 simplifiés */}
      <FormStylesSimplified globalConfig={globalFormPreset} />

      {/* Barre de navigation principale */}

      {/* Barre de navigation des services */}
      <ServicesNavigation />

      {/* Section promotionnelle compacte */}
      <div className="bg-white border-b border-gray-200 pt-16 sm:pt-20">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-2 sm:gap-3">
            {/* Texte promotionnel principal */}
            <div className="text-center lg:text-left flex-1">
              <h2 className="text-base font-bold text-gray-900 mb-0.5 sm:mb-1">
                <span className="sm:hidden">⭐ Devis instantané</span>
                <span className="hidden sm:inline">⭐ Ménage Sur Mesure - Devis Instantané !</span>
              </h2>
              <p className="text-xs text-gray-600 max-w-2xl">
                <span className="sm:hidden">Configurez et obtenez votre prix en temps réel.</span>
                <span className="hidden sm:inline">Service de nettoyage personnalisé selon vos besoins avec tarification transparente.</span>
              </p>
            </div>
            
            {/* Encart promotionnel - visible uniquement sur desktop */}
            <div className="hidden lg:block bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-2 rounded-lg shadow-lg">
              <div className="text-center">
                <div className="text-lg font-bold">💰</div>
                <div className="text-xs font-medium">Prix en temps réel</div>
                <div className="text-xs opacity-90">Mise à jour instantanée</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Amazon - 2 colonnes avec largeur 100% */}
      <div className="w-full mt-6 sm:mt-8">
        <PriceProvider initialPrice={0}>
          <PriceUpdater priceCalculator={priceCalculator} />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 px-0 sm:px-4 lg:px-0">
            {/* Colonne gauche (75%) - Formulaire de réservation */}
            <div className="lg:col-span-3 w-full">
              <div className="w-full max-w-none lg:max-w-7xl mx-auto px-0 sm:px-0 lg:px-8">
                <FormGenerator
                  ref={formRef}
                  config={{
                    ...formConfig,
                    isLoading: isSubmitting,
                    hideDefaultSubmit: true,
                    layout: {
                      ...formConfig.layout,
                      showPriceCalculation: true,
                      showConstraintsByAddress: true,
                      showModificationsSummary: true,
                      serviceInfo: {
                        name: transformedService.name,
                        description: transformedService.description,
                        icon: '🧹',
                        features: transformedService.includes
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Colonne droite (25%) - Détails du service et paiement */}
            <div className="lg:col-span-1 w-full space-y-6 mt-0 lg:mt-0">
              {/* Section paiement */}
              <PaymentCard
                serviceType="MENAGE"
                isSubmitting={isSubmitting}
                onSubmit={handleSubmitFromPaymentCard}
                onSave={() => console.log('Sauvegardé')}
              />
            </div>
          </div>
        </PriceProvider>
      </div>

      {/* Section avantages - Compacte */}
      <section className="bg-gradient-to-br from-emerald-50 to-green-50 py-4 sm:py-8 mt-4 sm:mt-8 border-t border-emerald-100 animate-fade-in-up">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* En-tête de la section compact */}
          <div className="text-center mb-4 sm:mb-8">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-emerald-100 text-emerald-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
              <span>✨</span>
              Nos Garanties
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
              Une expérience de service exceptionnelle
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              Profitez d'un service professionnel avec des garanties qui font la
              différence
            </p>
          </div>

          {/* Grille des avantages compacte */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Réservation instantanée */}
            <div className="group bg-white rounded-xl p-3 sm:p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-1.5 sm:p-2 w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-4 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                <span className="text-base sm:text-lg text-white">⚡</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">
                Réservation instantanée
              </h3>
              <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                Réservez en quelques clics et recevez votre confirmation
                immédiatement
              </p>
            </div>

            {/* Assurance incluse */}
            <div
              className="group bg-white rounded-xl p-3 sm:p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl p-1.5 sm:p-2 w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-4 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                <span className="text-base sm:text-lg text-white">🛡️</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">
                Assurance incluse
              </h3>
              <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                Tous nos services sont couverts par une assurance responsabilité
                civile
              </p>
            </div>

            {/* Service premium */}
            <div
              className="group bg-white rounded-xl p-3 sm:p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl p-1.5 sm:p-2 w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-4 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                <span className="text-base sm:text-lg text-white">⭐</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">
                Service premium
              </h3>
              <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                Équipe professionnelle formée avec matériel de qualité
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}