'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import { CatalogData } from '@/hooks/useCatalogPreFill';
import { FormGenerator } from '@/components/form-generator';
import { 
  getDemenagementSurMesureServiceConfig,
  getMenageSurMesureServiceConfig,
  getCatalogueMovingItemConfig,
  getCatalogueCleaningItemConfig,
  getCatalogueDeliveryItemServiceConfig
} from '@/components/form-generator';
import { 
  getPresetForCategory, 
  transformCatalogDataToCatalogueMovingItem,
  transformCatalogDataToCatalogueCleaningItem,
  transformCatalogDataToCatalogueDeliveryItem,
  transformCatalogDataToDemenagementSurMesure,
  transformCatalogDataToMenageSurMesure
} from '@/utils/catalogTransformers';
import { useRealTimePricing } from '@/hooks/shared/useCentralizedPricing';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { toast } from 'react-hot-toast';
import { 
  useCatalogueCleaningItemSubmission,
  useCatalogueDeliveryItemSubmission,
  useCatalogueMovingItemSubmission,
  useDemenagementSurMesureSubmission,
  useMenageSurMesureSubmission
} from '@/hooks/business';

interface DetailFormProps {
  catalogData: CatalogData;
}

const DetailFormComponent: React.FC<DetailFormProps> = ({ catalogData }) => {
  console.log('🎯 [ÉTAPE 4] DetailForm - Initialisation du formulaire personnalisé');
  console.log('📍 [ÉTAPE 4] catalogData reçu:', {
    catalogId: catalogData.catalogSelection.id,
    category: catalogData.catalogSelection.category,
    subcategory: catalogData.catalogSelection.subcategory,
    hasItem: !!catalogData.item,
    hasTemplate: !!catalogData.template
  });
  
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // 📊 Console.log pour surveiller l'état local du DetailForm
  React.useEffect(() => {
    console.log('📊 [ÉTAPE 11] État du formulaire - Surveillance continue');
    console.log('🏠 [SURVEILLANCE] État local formData:', formData);
    console.log('🔢 [SURVEILLANCE] Nombre de champs remplis:', Object.keys(formData).length);
    console.log('📝 [SURVEILLANCE] Champs non-vides:', 
      Object.entries(formData)
        .filter(([key, value]) => value !== '' && value !== null && value !== undefined && value !== false)
        .map(([key, value]) => `${key}: ${value}`)
    );
  }, [formData]);
  
  // 1. DÉTERMINATION DU TYPE DE PRESET
  // Détermine quel preset utiliser selon la catégorie et sous-catégorie du catalogue
  // Ex: 'catalogueMovingItem-service', 'demenagement-sur-mesure', etc.
  console.log('⚙️ [ÉTAPE 4.1] Détermination du type de preset');
  const presetType = getPresetForCategory(catalogData.catalogSelection.category, catalogData.catalogSelection.subcategory);
  console.log('✅ [ÉTAPE 4.1] Type de preset déterminé:', {
    category: catalogData.catalogSelection.category,
    subcategory: catalogData.catalogSelection.subcategory,
    presetType: presetType,
    isCustomService: presetType.includes('sur-mesure')
  });
  
  // 2. TRANSFORMATION DES DONNÉES
  // Transforme les données du catalogue en format approprié selon le type de service
  // Les données transformées contiennent les informations spécifiques au service (prix, durée, etc.)
  console.log('🔄 [ÉTAPE 5] Transformation des données catalogue');
  const transformedData = useMemo(() => {
    switch (presetType) {
      case 'catalogueMovingItem-service':
        return transformCatalogDataToCatalogueMovingItem(catalogData);
      case 'catalogueCleaningItem-service':
        return transformCatalogDataToCatalogueCleaningItem(catalogData);
      case 'catalogueDeliveryItem-service':
        return transformCatalogDataToCatalogueDeliveryItem(catalogData);
      case 'demenagement-sur-mesure':
        return transformCatalogDataToDemenagementSurMesure(catalogData);
      case 'menage-sur-mesure':
        return transformCatalogDataToMenageSurMesure(catalogData);
      default:
        return transformCatalogDataToCatalogueCleaningItem(catalogData);
    }
  }, [catalogData.catalogSelection.id, catalogData.item.id, presetType]);

  // 3. DÉTERMINATION DU TYPE DE SERVICE
  // Mappe le presetType vers le ServiceType enum pour la logique métier
  // Utilisé pour le calcul de prix et la soumission
  const serviceType = useMemo(() => {
    switch (presetType) {
      case 'catalogueMovingItem-service':
        return ServiceType.PACKING;
      case 'catalogueCleaningItem-service':
        return ServiceType.CLEANING;
      case 'catalogueDeliveryItem-service':
        return ServiceType.DELIVERY;
      case 'demenagement-sur-mesure':
        return ServiceType.MOVING_PREMIUM;
      case 'menage-sur-mesure':
        return ServiceType.CLEANING_PREMIUM;
      default:
        return ServiceType.CLEANING;
    }
  }, [presetType]);

  // 4. GESTION DES PRIX
  // Prix de base extrait des données transformées
  const basePrice = useMemo(() => transformedData?.price || 0, [transformedData?.price]);

  // ✅ Ajout du __presetSnapshot pour la comparaison PACKING non modifié
  const presetSnapshot = useMemo(() => transformedData?.__presetSnapshot, [transformedData?.__presetSnapshot]);

  // Hook de calcul de prix en temps réel (remplace le calculateur factice)
  const rawPriceCalculator = useRealTimePricing(serviceType, basePrice, presetSnapshot);
  
  // Référence stable pour le prix calculé (évite les re-renders)
  const calculatedPriceRef = useRef(basePrice);
  const calculatedPrice = rawPriceCalculator?.calculatedPrice || basePrice;
  
  // Mise à jour de la référence du prix calculé
  useEffect(() => {
    if (calculatedPrice !== calculatedPriceRef.current) {
      calculatedPriceRef.current = calculatedPrice;
    }
  }, [calculatedPrice]);

  // 5. PRÉPARATION DES DONNÉES STABLES
  // Création de références stables pour éviter les re-renders des hooks
  const calculatedDistance = formData.distance || 0;
  
  const stableTransformedData = useMemo(() => transformedData, [transformedData]);
  const stableCalculatedPrice = calculatedPriceRef.current;
  const stableDistance = useMemo(() => calculatedDistance, [calculatedDistance]);
  
  // 6. INITIALISATION DES HOOKS DE SOUMISSION
  // Chaque type de service a son propre hook de soumission avec sa logique métier
  const movingSubmissionHook = useCatalogueMovingItemSubmission(stableTransformedData as any, stableCalculatedPrice, stableDistance);
  const cleaningSubmissionHook = useCatalogueCleaningItemSubmission(stableTransformedData as any, stableCalculatedPrice);
  const deliverySubmissionHook = useCatalogueDeliveryItemSubmission(stableTransformedData as any, stableCalculatedPrice, stableDistance);
  
  // Hooks pour les services sur mesure
  const demenagementSurMesureSubmissionHook = useDemenagementSurMesureSubmission(stableTransformedData as any, stableCalculatedPrice, stableDistance);
  const menageSurMesureSubmissionHook = useMenageSurMesureSubmission(stableTransformedData as any, stableCalculatedPrice);

  // 7. CONFIGURATION DU CALCULATEUR DE PRIX
  // Interface unifiée pour le calcul de prix, utilisée par les presets
  const priceCalculator = useMemo(() => ({
    calculatePrice: rawPriceCalculator?.calculatePrice || (async () => basePrice),
    calculatedPrice: calculatedPriceRef.current,
    priceDetails: null,
    isPriceLoading: rawPriceCalculator?.isPriceLoading || false
  }), [
    rawPriceCalculator?.calculatePrice,
    rawPriceCalculator?.isPriceLoading,
    basePrice
  ]);
  
  // 8. SÉLECTION DU HOOK DE SOUMISSION
  // Sélectionne le hook approprié selon le type de service
  const submissionHook = useMemo(() => {
    switch (presetType) {
      case 'catalogueMovingItem-service':
        return movingSubmissionHook;
      case 'catalogueCleaningItem-service':
        return cleaningSubmissionHook;
      case 'catalogueDeliveryItem-service':
        return deliverySubmissionHook;
      case 'demenagement-sur-mesure':
        return demenagementSurMesureSubmissionHook;
      case 'menage-sur-mesure':
        return menageSurMesureSubmissionHook;
      default:
        return cleaningSubmissionHook;
    }
  }, [presetType, movingSubmissionHook, cleaningSubmissionHook, deliverySubmissionHook, demenagementSurMesureSubmissionHook, menageSurMesureSubmissionHook]);

  // 9. RÉFÉRENCE STABLE POUR LE HOOK DE SOUMISSION
  // Permet d'accéder au hook de soumission dans les callbacks
  const submissionHookRef = useRef(submissionHook);
  submissionHookRef.current = submissionHook;

  // 10. GESTIONNAIRE DE CHANGEMENTS DE DONNÉES
  // Appelé quand l'utilisateur modifie le formulaire
  // Gère le calcul automatique de distance et le déclenchement du calcul de prix
  const handleFormDataChange = useCallback(async (fieldName: string, value: any, currentFormData: any) => {
    console.log('🔗 [ÉTAPE 10.1] DetailForm - Synchronisation depuis FormGenerator');
    console.log('🔄 [ÉTAPE 10.1] handleFormDataChange:', {
      field: fieldName,
      newValue: value,
      totalFieldsCount: Object.keys(currentFormData).length
    });
    
    // Mettre à jour le state local avec toutes les données actuelles
    setFormData(currentFormData);
    
    if (!transformedData) {
      return;
    }
    
    const enrichedFormData = { ...currentFormData };
    
    console.log('🧮 [ÉTAPE 10.2] Vérification calculs automatiques requis');
    
    // Calcul automatique de distance pour les services avec deux adresses
    if ((presetType === 'catalogueMovingItem-service' || presetType === 'catalogueDeliveryItem-service') && 
        currentFormData.pickupAddress && 
        currentFormData.deliveryAddress &&
        currentFormData.pickupAddress !== currentFormData.deliveryAddress) {
      
      console.log('📏 [ÉTAPE 10.2] Calcul de distance requis:', {
        pickup: currentFormData.pickupAddress.substring(0, 30) + '...',
        delivery: currentFormData.deliveryAddress.substring(0, 30) + '...'
      });
      
      try {
        const { calculateDistance } = await import('@/actions/distanceCalculator');
        const calculatedDistance = await calculateDistance(
          currentFormData.pickupAddress, 
          currentFormData.deliveryAddress
        );
        
        enrichedFormData.distance = calculatedDistance;
        console.log('✅ [ÉTAPE 10.2] Distance calculée:', calculatedDistance + ' km');
        setFormData(enrichedFormData);
        
      } catch (error) {
        console.log('❌ [ÉTAPE 10.2] Erreur calcul distance:', error);
        enrichedFormData.distance = 0;
      }
    }
    
    // Vérification des données minimales pour déclencher le calcul de prix
    const hasEnoughData = presetType === 'catalogueMovingItem-service' 
      ? !!(enrichedFormData.scheduledDate && enrichedFormData.pickupAddress && enrichedFormData.deliveryAddress)
      : !!(enrichedFormData.scheduledDate && enrichedFormData.location);

    console.log('💰 [ÉTAPE 10.3] Vérification calcul de prix:', {
      hasEnoughData,
      hasPriceCalculator: !!priceCalculator,
      presetType,
      requiredFields: presetType === 'catalogueMovingItem-service' 
        ? ['scheduledDate', 'pickupAddress', 'deliveryAddress']
        : ['scheduledDate', 'location']
    });
    
    // Déclenchement du calcul de prix si suffisamment de données
    if (hasEnoughData) {
      if (!priceCalculator || !priceCalculator.calculatePrice) {
        console.log('⚠️ [ÉTAPE 10.3] Prix calculator non disponible');
        return;
      }
      
      console.log('🚀 [ÉTAPE 10.3] Lancement calcul de prix avec données:', {
        serviceType,
        formDataKeys: Object.keys(enrichedFormData),
        enrichedFormDataSample: {
          scheduledDate: enrichedFormData.scheduledDate,
          location: enrichedFormData.location?.substring(0, 30),
          distance: enrichedFormData.distance,
          duration: enrichedFormData.duration,
          workers: enrichedFormData.workers
        }
      });
      
      try {
        // Utiliser le hook de calcul de prix en temps réel
        await priceCalculator.calculatePrice(enrichedFormData);
        console.log('✅ [ÉTAPE 10.3] Calcul de prix terminé avec succès');
      } catch (error) {
        console.log('❌ [ÉTAPE 10.3] Erreur lors du calcul de prix:', error);
      }
    } else {
      console.log('⏸️ [ÉTAPE 10.3] Calcul de prix non déclenché (données insuffisantes)');
    }
  }, [presetType, transformedData]);

  // 11. GESTIONNAIRE DE PRIX CALCULÉ
  // Appelé quand un nouveau prix est calculé (par les presets)
  const handlePriceCalculated = useCallback(async (price: number, details: any) => {
    console.log('💰 [PRIX CALCULÉ] Nouveau prix reçu:', {
      price,
      details,
      currentCalculatedPrice: rawPriceCalculator.calculatedPrice,
      basePrice
    });
    
    // Le prix est déjà géré par le hook useRealTimePricing
    // Cette fonction sert principalement de callback pour les presets
  }, [catalogData.catalogSelection.id, catalogData.catalogSelection.category, rawPriceCalculator.calculatedPrice, basePrice]);

  // 12. GESTIONNAIRE DE SOUMISSION
  // Appelé quand l'utilisateur soumet le formulaire
  // Utilise le hook de soumission approprié et gère les erreurs
  const handleSubmitSuccess = useCallback(async (formDataSubmit: any) => {
    setIsSubmitting(true);
    
    try {
      if (!formDataSubmit) {
        throw new Error('Données de formulaire manquantes');
      }

      const currentSubmissionHook = submissionHookRef.current;
      if (!currentSubmissionHook) {
        throw new Error('Hook de soumission non disponible');
      }
      await currentSubmissionHook.submit(formDataSubmit);
      
      toast.success('Demande créée avec succès !');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création de la demande';
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    catalogData.catalogSelection.id,
    presetType
  ]);

  // 13. GESTIONNAIRE D'ERREUR
  // Gestion centralisée des erreurs avec notification utilisateur
  const handleError = useCallback((error: any) => {
    toast.error('Une erreur est survenue. Veuillez réessayer.');
  }, []);

  // 14. GESTIONNAIRE DE CHANGEMENTS DE CHAMPS
  // Interface pour les changements de champs individuels
  const handleFormDataChangeRef = useRef(handleFormDataChange);
  handleFormDataChangeRef.current = handleFormDataChange;
  
  const handleChange = useCallback((fieldName: string, value: any, currentFormData: any) => {
    const updatedFormData = {
      ...currentFormData,
      [fieldName]: value
    };
    handleFormDataChangeRef.current(fieldName, value, updatedFormData);
  }, []);

  // 15. CONFIGURATION DU FORMULAIRE
  // Création de la configuration complète du formulaire selon le type de service
  // Cette configuration est passée au FormGenerator pour générer l'interface
  const enrichedConfig = useMemo(() => {
    if (!transformedData) {
      return null;
    }

    // Configuration de base commune avec les données du catalogue
    const catalogDefaults = {
      // Mapper les données du catalogue vers les champs du formulaire
      serviceName: transformedData.name,
      serviceDescription: transformedData.description,
      basePrice: transformedData.price,
      scheduledDate: transformedData.scheduledDate ? transformedData.scheduledDate.toISOString().split('T')[0] : '',
      location: transformedData.location || '',
      pickupAddress: transformedData.pickupAddress || '',
      deliveryAddress: transformedData.deliveryAddress || '',
      additionalInfo: transformedData.additionalInfo || '',
      
      // Mapper les données spécifiques selon le type de service
      duration: transformedData.duration || '',
      workers: transformedData.workers || '',
      surface: transformedData.surface || '',
      nombrePieces: transformedData.nombrePieces || '',
      
      // ✅ Ajouter les IDs du catalogue pour le linking
      catalogId: catalogData.catalogSelection.id,
      catalogSelectionId: catalogData.catalogSelection.id,
      itemId: catalogData.item.id,
      
      // Ajouter les données actuelles du formulaire
      ...formData
    };

    // 📊 Log détaillé des données pour debug
    console.log('✅ [ÉTAPE 5] Données transformées avec succès:', {
      presetType: presetType,
      serviceName: transformedData.name,
      serviceType: transformedData.source,
      duration: transformedData.duration,
      workers: transformedData.workers,
      price: transformedData.price,
      hasScheduledDate: !!transformedData.scheduledDate
    });
    
    console.log('🎯 [ÉTAPE 6] Génération des valeurs par défaut (catalogDefaults)');
    console.log('📋 [ÉTAPE 6] CatalogDefaults générés:', catalogDefaults);
    console.log('🎯 [ÉTAPE 6] Mapping spécifique des données métier:', {
      duration: transformedData.duration,
      workers: transformedData.workers,
      surface: transformedData.surface,
      nombrePieces: transformedData.nombrePieces,
      price: transformedData.price
    });

    // ✅ Configuration layout additionnelle (sera mergée avec le preset)
    const additionalLayoutConfig = {
      externalCalculatedPrice: calculatedPriceRef.current,
      showPriceCalculation: true,
      onPriceCalculated: (price: number) => {
        console.log('💰 [SIDEBAR] Prix mis à jour dans la sidebar:', price);
      },
      // ✅ Ajouter l'originalPrice pour l'affichage barré
      serviceInfo: {
        name: transformedData?.name || catalogData.item.name,
        description: transformedData?.description || catalogData.item.description,
        originalPrice: catalogData.catalogSelection.originalPrice || transformedData?.originalPrice
      }
    };

    const baseConfig = {
      customDefaults: catalogDefaults, // Utiliser les données du catalogue et du formulaire
      onChange: (fieldName: string, value: any, currentFormData: any) => {
        handleFormDataChange(fieldName, value, currentFormData);
      }, // Callback pour synchroniser les changements
      onValidationError: handleError
    };

    console.log('⚙️ [ÉTAPE 7] Configuration du formulaire - Sélection du preset');
    console.log('➡️ [FLUX] Passage à FormGenerator avec configuration enrichie');
    
    // Sélection de la fonction de configuration appropriée selon le presetType
    switch (presetType) {
      case 'demenagement-sur-mesure': {
        const presetConfig = getDemenagementSurMesureServiceConfig({
          service: transformedData as any,
          onPriceCalculated: (price: number, details: any) => handlePriceCalculated(price, details),
          onSubmitSuccess: handleSubmitSuccess,
          onError: handleError
        });
        return {
          ...presetConfig,
          ...baseConfig,
          // ✅ Merger intelligemment le layout en préservant le type du preset
          layout: {
            ...presetConfig.layout,
            ...additionalLayoutConfig
          }
        };
      }

      case 'menage-sur-mesure': {
        const presetConfig = getMenageSurMesureServiceConfig({
          service: transformedData as any,
          onPriceCalculated: (price: number, details: any) => handlePriceCalculated(price, details),
          onSubmitSuccess: handleSubmitSuccess,
          onError: handleError
        });
        return {
          ...presetConfig,
          ...baseConfig,
          // ✅ Merger intelligemment le layout en préservant le type du preset
          layout: {
            ...presetConfig.layout,
            ...additionalLayoutConfig
          }
        };
      }

      case 'catalogueMovingItem-service': {
        const presetConfig = getCatalogueMovingItemConfig({
          pack: transformedData as any,
          onPriceCalculated: (price: number, details: any) => handlePriceCalculated(price, details),
          onSubmitSuccess: handleSubmitSuccess,
          onError: handleError
        });
        return {
          ...presetConfig,
          ...baseConfig,
          // ✅ Merger intelligemment le layout en préservant le type du preset
          layout: {
            ...presetConfig.layout,
            ...additionalLayoutConfig
          }
        };
      }

      case 'catalogueCleaningItem-service': {
        const presetConfig = getCatalogueCleaningItemConfig({
          service: transformedData as any,
          onPriceCalculated: (price: number, details: any) => handlePriceCalculated(price, details),
          onSubmitSuccess: handleSubmitSuccess,
          onError: handleError
        });
        return {
          ...presetConfig,
          ...baseConfig,
          // ✅ Merger intelligemment le layout en préservant le type du preset
          layout: {
            ...presetConfig.layout,
            ...additionalLayoutConfig
          }
        };
      }

      case 'catalogueDeliveryItem-service': {
        const presetConfig = getCatalogueDeliveryItemServiceConfig({
          service: transformedData as any,
          onPriceCalculated: (price: number, details: any) => handlePriceCalculated(price, details),
          onSubmitSuccess: handleSubmitSuccess,
          onError: handleError
        });
        return {
          ...presetConfig,
          ...baseConfig,
          // ✅ Merger intelligemment le layout en préservant le type du preset
          layout: {
            ...presetConfig.layout,
            ...additionalLayoutConfig
          }
        };
      }

      default: {
        const presetConfig = getCatalogueCleaningItemConfig({
          service: transformedData as any,
          onPriceCalculated: (price: number, details: any) => handlePriceCalculated(price, details),
          onSubmitSuccess: handleSubmitSuccess,
          onError: handleError
        });
        return {
          ...presetConfig,
          ...baseConfig,
          // ✅ Merger intelligemment le layout en préservant le type du preset
          layout: {
            ...presetConfig.layout,
            ...additionalLayoutConfig
          }
        };
      }
    }
  }, [
    presetType,
    catalogData.catalogSelection.id,
    transformedData,
    formData, // Ajouter formData comme dépendance
    calculatedPriceRef.current, // ✅ Ajouter le prix calculé comme dépendance
    handlePriceCalculated,
    handleSubmitSuccess,
    handleError
    // Pas besoin de handleFormDataChange car on utilise handleFormDataChangeRef
  ]);

  // 16. RENDU DU COMPOSANT
  // Interface utilisateur avec titre dynamique et formulaire généré
  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-1 sm:py-8">
      {/* En-tête avec titre dynamique basé sur le service sélectionné */}
      <div className="text-center mb-1 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5 sm:mb-2">
          Personnalisez votre réservation
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Configurez les détails de votre {catalogData.catalogSelection.marketingTitle || catalogData.item.name} selon vos besoins
        </p>
      </div>

      {/* Debug information - à supprimer en production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Debug:</strong> PresetType = {presetType}, ServiceType = {serviceType}
          </p>
          <p className="text-sm text-blue-800">
            <strong>TransformedData:</strong> {transformedData ? 'Disponible' : 'Null'}
          </p>
          <p className="text-sm text-blue-800">
            <strong>Config:</strong> {enrichedConfig ? 'Disponible' : 'Null'}
          </p>
        </div>
      )}

      {/* Génération dynamique du formulaire selon la configuration */}
      {enrichedConfig ? (
        <FormGenerator 
          config={{
            ...enrichedConfig,
            isLoading: isSubmitting
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

// 17. OPTIMISATION DES PERFORMANCES
// Mémorisation du composant pour éviter les re-renders inutiles
// Le composant ne se re-rend que si l'ID du catalogue ou de l'item change
export const DetailForm = memo(DetailFormComponent, (prevProps, nextProps) => {
  const shouldSkipRender = (
    prevProps.catalogData.catalogSelection.id === nextProps.catalogData.catalogSelection.id &&
    prevProps.catalogData.item.id === nextProps.catalogData.item.id
  );
  
  return shouldSkipRender;
}); 