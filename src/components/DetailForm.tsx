'use client';

/**
 * DetailForm - Version refactorisée (Phase 3)
 *
 * Réduction de 674 → ~250 lignes via extraction de logique dans hooks dédiés:
 * - useServiceConfig: Configuration service (preset, transformer, submission)
 * - useFormBusinessLogic: Logique métier (distance, fusion contraintes)
 */

import React, { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import { CatalogData } from '@/hooks/useCatalogPreFill';
import { FormGenerator, FormGeneratorRef } from '@/components/form-generator';
import { getPresetForCategory } from '@/utils/catalogTransformers';
import { useRealTimePricing } from '@/hooks/shared/useCentralizedPricing';
import { toast } from 'react-hot-toast';
import { useUnifiedSubmission } from '@/hooks/generic/useUnifiedSubmission';
import { usePrice } from './PriceProvider';
import { devLog } from '@/lib/conditional-logger';
import { useFormBusinessLogic } from '@/hooks/business/useFormBusinessLogic';
import { useServiceConfig } from '@/hooks/business/useServiceConfig';

interface DetailFormProps {
  catalogData: CatalogData;
  onFormReady?: (submitHandler: (insuranceSelected: boolean) => Promise<void>) => void;
}

const DetailFormComponent: React.FC<DetailFormProps> = ({ catalogData, onFormReady }) => {
  devLog.debug('DetailForm', 'Initialisation du formulaire personnalisé');

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updatePrice } = usePrice();
  const formRef = useRef<FormGeneratorRef>(null);

  // 1. DÉTERMINATION DU TYPE DE PRESET
  const presetType = getPresetForCategory(
    catalogData.catalogSelection.category,
    catalogData.catalogSelection.subcategory
  );

  // 2. ✅ HOOK DE CONFIGURATION SERVICE (NOUVEAU - PHASE 3)
  // Remplace 50+ lignes de switch case pour transformer + serviceType + submissionConfig
  const { formData: businessFormData, handleFieldChange } = useFormBusinessLogic(
    catalogData,
    presetType
  );

  const [localFormData, setLocalFormData] = useState<any>({});

  // Surveillance de l'état du formulaire
  useEffect(() => {
    devLog.debug('DetailForm', 'État formulaire:', {
      fieldsCount: Object.keys(localFormData).length
    });
  }, [localFormData]);

  // 3. CONFIGURATION SERVICE (transformer, serviceType, submissionConfig)
  const calculatedDistance = businessFormData.distance || localFormData.distance || 0;

  const { formConfig, transformedData, serviceType, submissionConfig } = useServiceConfig(
    presetType,
    catalogData,
    calculatedDistance
  );

  // 4. GESTION DES PRIX
  const basePrice = useMemo(() => transformedData?.price || 0, [transformedData?.price]);
  const presetSnapshot = useMemo(() => transformedData?.__presetSnapshot, [transformedData?.__presetSnapshot]);

  const rawPriceCalculator = useRealTimePricing(serviceType, basePrice, presetSnapshot);

  const calculatedPriceRef = useRef(basePrice);
  const calculatedPrice = rawPriceCalculator?.calculatedPrice || basePrice;

  useEffect(() => {
    if (calculatedPrice !== calculatedPriceRef.current) {
      calculatedPriceRef.current = calculatedPrice;
    }
  }, [calculatedPrice]);

  useEffect(() => {
    updatePrice(calculatedPrice, rawPriceCalculator?.priceDetails);
  }, [calculatedPrice, rawPriceCalculator?.priceDetails, updatePrice]);

  // 5. HOOK DE SOUMISSION UNIFIÉ
  const submissionHook = useUnifiedSubmission(
    submissionConfig,
    calculatedPriceRef.current,
    { catalogId: catalogData.catalogSelection.id }
  );

  const submissionHookRef = useRef(submissionHook);
  submissionHookRef.current = submissionHook;

  // 6. CONFIGURATION DU CALCULATEUR DE PRIX
  const priceCalculator = useMemo(() => ({
    calculatePrice: rawPriceCalculator?.calculatePrice || (async () => basePrice),
    calculatedPrice: calculatedPriceRef.current,
    priceDetails: null,
    isPriceLoading: rawPriceCalculator?.isPriceLoading || false
  }), [rawPriceCalculator?.calculatePrice, rawPriceCalculator?.isPriceLoading, basePrice]);

  // 7. GESTIONNAIRES
  const handleFormDataChangeRef = useRef<any>();

  const handleFormDataChange = useCallback(async (fieldName: string, value: any, currentFormData: any) => {
    devLog.debug('DetailForm', 'Changement de champ:', fieldName);

    // Utiliser la logique métier du hook
    const enrichedData = await handleFieldChange(fieldName, value, currentFormData);

    setLocalFormData(enrichedData);

    if (!transformedData || !priceCalculator || !priceCalculator.calculatePrice) {
      return;
    }

    // Vérification des données minimales
    const hasEnoughData = presetType === 'catalogueMovingItem-service'
      ? !!(enrichedData.scheduledDate && enrichedData.pickupAddress && enrichedData.deliveryAddress)
      : !!(enrichedData.scheduledDate && enrichedData.location);

    if (hasEnoughData) {
      try {
        await priceCalculator.calculatePrice(enrichedData);
      } catch (error) {
        devLog.error('Erreur calcul prix:', error);
      }
    }
  }, [handleFieldChange, transformedData, priceCalculator, presetType]);

  handleFormDataChangeRef.current = handleFormDataChange;

  const handlePriceCalculated = useCallback((price: number, details: any) => {
    devLog.debug('DetailForm', 'Prix calculé:', price);
  }, []);

  const handleSubmitSuccess = useCallback((data: any) => {
    devLog.debug('DetailForm', 'Soumission réussie');
    setIsSubmitting(false);
  }, []);

  const handleError = useCallback((error: any) => {
    toast.error('Une erreur est survenue. Veuillez réessayer.');
    devLog.error('Erreur formulaire:', error);
  }, []);

  // Handler pour soumission depuis PaymentCard
  const handleSubmitFromPaymentCard = useCallback(async (insuranceSelected: boolean) => {
    devLog.info('\n\n\n═══ DEBUT DetailForm.handleSubmitFromPaymentCard ═══');
    devLog.info('📁 [DetailForm.tsx] ▶️ Début soumission formulaire depuis PaymentCard');
    devLog.info(`📁 [DetailForm.tsx] Assurance sélectionnée: ${insuranceSelected}`);
    
    setIsSubmitting(true);
    try {
      const formData = formRef.current?.getFormData() || {};
      devLog.info('📁 [DetailForm.tsx] ✅ Données du formulaire récupérées');
      
      const dataWithInsurance = {
        ...formData,
        insurance: insuranceSelected,
        insuranceAmount: insuranceSelected ? 25 : 0
      };
      
      await submissionHookRef.current.submit(dataWithInsurance);
      toast.success('Demande créée avec succès !');
      devLog.info('📁 [DetailForm.tsx] ✅ Soumission réussie');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création de la demande';
      toast.error(`Erreur: ${errorMessage}`);
      devLog.error('📁 [DetailForm.tsx] ❌ Erreur lors de la soumission:', error);
    } finally {
      setIsSubmitting(false);
      devLog.info('📁 [DetailForm.tsx] ⏹ Fin DetailForm.handleSubmitFromPaymentCard');
      devLog.info('═══⏹ FIN DetailForm.handleSubmitFromPaymentCard ═══\n\n\n');
    }
  }, []);

  // Exposer le handler via onFormReady
  useEffect(() => {
    if (onFormReady) {
      onFormReady(handleSubmitFromPaymentCard);
    }
  }, [onFormReady, handleSubmitFromPaymentCard]);

  // 8. CONFIGURATION DU FORMULAIRE
  const catalogDefaults = useMemo(() => ({
    ...transformedData,
    ...localFormData,
    calculatedPrice: calculatedPriceRef.current
  }), [transformedData, localFormData]);

  const additionalLayoutConfig = useMemo(() => {
    return {
      priceDisplay: {
        show: true,
        price: calculatedPriceRef.current,
        originalPrice: catalogData.catalogSelection.originalPrice,
        priceCalculator: priceCalculator
      },
      submitButton: {
        text: "Continuer vers le paiement",
        onClick: (formData: any) => {
          setIsSubmitting(true);
          submissionHookRef.current.submit(formData);
        },
        isLoading: isSubmitting || submissionHook.isSubmitting
      }
    };
  }, [catalogData.catalogSelection.originalPrice, priceCalculator, isSubmitting, submissionHook.isSubmitting]);

  const baseConfig = {
    customDefaults: catalogDefaults,
    serviceType: serviceType, // 🎯 AJOUT DU SERVICE TYPE POUR LA PERSISTANCE
    onChange: (fieldName: string, value: any, currentFormData: any) => {
      handleFormDataChangeRef.current?.(fieldName, value, currentFormData);
    },
    onValidationError: handleError
  };

  // 9. CONFIGURATION ENRICHIE SELON LE PRESET
  // ✅ UTILISE formConfig DE useServiceConfig (plus besoin de switch case)
  const enrichedConfig = useMemo(() => {
    devLog.debug('DetailForm', 'Configuration du formulaire - Utilisation de formConfig');

    // Vérification: formConfig doit exister
    if (!formConfig) {
      console.error('DetailForm: formConfig est null, impossible de générer enrichedConfig');
      return null;
    }

    return {
      ...formConfig,
      ...baseConfig,
      layout: {
        ...formConfig.layout,
        ...additionalLayoutConfig,
        ...(presetType === 'catalogueMovingItem-service' && {
          serviceInfo: {
            ...formConfig.layout?.serviceInfo,
            description: transformedData?.description || catalogData.item?.description,
            originalPrice: catalogData.catalogSelection.originalPrice || transformedData?.originalPrice
          }
        })
      }
    }
  }, [
    formConfig,
    presetType,
    catalogData.catalogSelection.id,
    transformedData,
    baseConfig,
    additionalLayoutConfig
  ]);

  // 10. RENDU
  return (
    <div className="w-full max-w-none lg:max-w-7xl mx-auto px-0 sm:px-0 lg:px-8">
      {enrichedConfig ? (
        <FormGenerator
          ref={formRef}
          config={{
            ...enrichedConfig,
            isLoading: isSubmitting,
            hideDefaultSubmit: true
          }}
        />
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">Chargement du formulaire...</p>
        </div>
      )}
    </div>
  );
};

// Optimisation des performances
export const DetailForm = memo(DetailFormComponent, (prevProps, nextProps) => {
  const shouldSkipRender = (
    prevProps.catalogData.catalogSelection.id === nextProps.catalogData.catalogSelection.id &&
    prevProps.catalogData.item.id === nextProps.catalogData.item.id
  );

  return shouldSkipRender;
});
