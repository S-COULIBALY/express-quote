"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FormGenerator, FormGeneratorRef } from '@/components/form-generator';
import { FormStylesSimplified } from '@/components/form-generator/styles/FormStylesSimplified';
import { globalFormPreset } from '@/components/form-generator/presets/_shared/globalPreset';
import { getDemenagementSurMesureServiceConfig } from '@/components/form-generator/presets/demenagement-sur-mesure-service';
import { transformCatalogDataToDemenagementSurMesure } from '@/utils/catalogTransformers';
import { useRealTimePricing } from '@/hooks/shared/useCentralizedPricing';
import { useUnifiedSubmission } from '@/hooks/generic/useUnifiedSubmission';
import { createDemenagementSurMesureSubmissionConfig } from '@/hooks/business';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ServicesNavigation } from '@/components/ServicesNavigation';
import { PaymentCard } from '@/components/PaymentCard';
import { PriceProvider } from '@/components/PriceProvider';

// Service initial (simulation des données catalogue)
const initialService = {
  id: 'demenagement-sur-mesure',
  name: 'Déménagement Sur Mesure',
  description: 'Service de déménagement personnalisé selon vos besoins',
  price: null, // Prix calculé dynamiquement
  duration: null, // Durée calculée selon volume
  workers: null, // Nombre de travailleurs calculé selon besoins
  features: ['Service personnalisé', 'Devis adapté'],
  includes: ['Étude gratuite', 'Options modulables'],
  serviceType: 'demenagement-sur-mesure',
  isPremium: true,
  requiresVolume: true,
  requiresCustomPricing: true,
  isDynamicPricing: true
};

export default function DemenagementSurMesurePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const formRef = useRef<FormGeneratorRef>(null);

  // Effet pour gérer l'hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 1. Transformation des données catalogue
  const transformedService = transformCatalogDataToDemenagementSurMesure({
    catalogSelection: {
      id: initialService.id,
      category: 'DEMENAGEMENT',
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
      workers: 0, // Calculé selon le volume
      duration: 0, // Calculée selon le volume
      popular: false
    },
    template: undefined,
    formDefaults: {}
  });

  // 2. Hook de calcul de prix en temps réel
  const priceCalculator = useRealTimePricing(
    ServiceType.MOVING_PREMIUM,
    0, // Prix de base
    transformedService.__presetSnapshot
  );

  // 3. Hook de soumission unifié (Phase 1)
  const submissionConfig = createDemenagementSurMesureSubmissionConfig(
    transformedService,
    0 // Distance initiale
  );
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
  const formConfig = getDemenagementSurMesureServiceConfig({
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
      <div className="bg-white border-b border-gray-200 pt-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex flex-col items-center justify-center gap-2">
            {/* Texte promotionnel centré */}
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Déménagement Sur Mesure - Devis Instantané !
              </h2>
              <p className="text-xs text-gray-600 max-w-xl">
                Service personnalisé selon vos besoins avec tarification transparente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Amazon - 2 colonnes avec largeur 100% */}
      <div className="w-full mt-8">
        <PriceProvider initialPrice={0}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 p-4 lg:p-0">
            {/* Colonne gauche (75%) - Formulaire de réservation */}
            <div className="lg:col-span-3">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                        icon: '🚛',
                        features: transformedService.includes
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Colonne droite (25%) - Détails du service et paiement */}
            <div className="lg:col-span-1 space-y-6">
              {/* Section paiement */}
              <PaymentCard
                serviceType="DEMENAGEMENT"
                isSubmitting={isSubmitting}
                onSubmit={handleSubmitFromPaymentCard}
                onSave={() => console.log('Sauvegardé')}
              />
            </div>
          </div>
        </PriceProvider>
      </div>

      {/* Section avantages - Compacte */}
      <section className="bg-gradient-to-br from-emerald-50 to-green-50 py-8 mt-8 border-t border-emerald-100 animate-fade-in-up">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête de la section compact */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-3">
              <span>✨</span>
              Nos Garanties
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Une expérience de service exceptionnelle
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Profitez d'un service professionnel avec des garanties qui font la
              différence
            </p>
          </div>

          {/* Grille des avantages compacte */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Réservation instantanée */}
            <div className="group bg-white rounded-xl p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-2 w-10 h-10 mb-4 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                <span className="text-lg text-white">⚡</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Réservation instantanée
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Réservez en quelques clics et recevez votre confirmation
                immédiatement
              </p>
            </div>

            {/* Assurance incluse */}
            <div
              className="group bg-white rounded-xl p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl p-2 w-10 h-10 mb-4 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                <span className="text-lg text-white">🛡️</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Assurance incluse
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Tous nos services sont couverts par une assurance responsabilité
                civile
              </p>
            </div>

            {/* Service premium */}
            <div
              className="group bg-white rounded-xl p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl p-2 w-10 h-10 mb-4 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                <span className="text-lg text-white">⭐</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Service premium
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Équipe professionnelle formée avec matériel de qualité
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}