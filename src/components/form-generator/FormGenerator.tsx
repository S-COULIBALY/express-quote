"use client";

import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormConfig, FormGeneratorProps, IndustryPreset, FormSection as FormSectionType } from "./types";
import { generateSchema, generateConditionalSchema } from "./utils";
import { FormSection } from "./components";
import { DefaultLayout, SidebarLayout, AuthLayout, PackageLayout, PackageEditLayout, PackageCardLayout } from "./layouts";
import { ServiceSummaryLayout } from "./layouts/ServiceSummaryLayout";
import { FormStyles } from "./styles/FormStyles";
import { getPresetDefaults, getPresetStyles, getPresetSummary } from "./presets";

export const FormGenerator: React.FC<FormGeneratorProps> = ({ config }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Récupérer les valeurs par défaut depuis les presets si configuré
  const defaultValues = useMemo(() => {
    if (config.preset) {
      const presetDefaults = getPresetDefaults(config.preset);
      return { ...presetDefaults, ...(config.customDefaults || {}) };
    }
    return config.customDefaults || {};
  }, [config.preset, config.customDefaults]);

  // Collecter tous les champs depuis les sections ou directement depuis fields
  const allFields = useMemo(() => {
    if (config.sections) {
      return config.sections.flatMap((section: FormSectionType) => section.fields);
    }
    return config.fields || [];
  }, [config.sections, config.fields]);

  // Générer le schéma de validation avec React Hook Form et Zod
  const schema = useMemo(() => generateSchema(allFields), [allFields]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange"
  });

  // Observer toutes les valeurs pour les conditions et récapitulatifs
  const formData = watch();

  // Mettre à jour le schéma pour les validations conditionnelles
  const conditionalSchema = useMemo(
    () => generateConditionalSchema(allFields, formData),
    [allFields, formData]
  );

  // Gestion des changements de champs
  const handleFieldChange = (fieldName: string, value: any) => {
    setValue(fieldName, value, { shouldValidate: true, shouldDirty: true });
    config.onChange?.(fieldName, value, formData);
  };

  // Helper pour obtenir le layoutType compatible avec FormSection
  const getFormSectionLayoutType = (): "default" | "sidebar" | "tabs" | "wizard" | undefined => {
    const layoutType = config.layout?.type;
    // Filtrer les types spéciaux car FormSection ne les accepte pas
    if (layoutType === "custom" || layoutType === "auth" || 
        layoutType === "package" || layoutType === "package-edit" || 
        layoutType === "package-card" || layoutType === "service-summary") {
      return "default"; // Fallback vers default pour FormSection
    }
    return layoutType;
  };

  // Gestion de la soumission
  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Ajouter le serviceType aux données si configuré
      const submitData = {
        ...data,
        ...(config.serviceType && { serviceType: config.serviceType })
      };
      
      await config.onSubmit?.(submitData);
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gestion des erreurs de validation
  const onError = (errors: any) => {
    config.onValidationError?.(errors);
  };

  // Boutons d'action
  const renderActions = () => (
    <>
      {config.onCancel && (
        <button
          type="button"
          onClick={config.onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          {config.cancelLabel || "Annuler"}
        </button>
      )}
      <button
        type="submit"
        disabled={isSubmitting || config.isLoading}
        className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting || config.isLoading
          ? config.loadingText || "Chargement..."
          : config.submitLabel || "Valider"}
      </button>
    </>
  );

  // Contenu du formulaire
  const renderForm = () => (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
      {config.sections ? (
        // Rendu avec sections
        config.sections.map((section: FormSectionType, index: number) => {
          // Vérifier les conditions d'affichage de la section
          const shouldShowSection = section.conditional
            ? section.conditional.condition(formData[section.conditional.dependsOn], formData)
            : true;

          if (!shouldShowSection) {
            return null;
          }

          return (
            <FormSection
              key={index}
              section={section}
              register={register}
              errors={errors}
              formData={formData}
              onFieldChange={handleFieldChange}
              layoutType={getFormSectionLayoutType()}
            />
          );
        })
      ) : (
        // Rendu simple avec fields
        config.fields && (
          <FormSection
            section={{ fields: config.fields }}
            register={register}
            errors={errors}
            formData={formData}
            onFieldChange={handleFieldChange}
            layoutType={getFormSectionLayoutType()}
          />
        )
      )}
    </form>
  );

  // Configuration du layout
  const layoutType = config.layout?.type || "default";
  const layoutProps = {
    title: config.title,
    description: config.description,
    actions: renderActions(),
    formData,
    className: config.className,
    serviceType: config.serviceType
  };

  // Rendu selon le type de layout
  const renderLayout = () => {
    switch (layoutType) {
      case "sidebar":
        const sidebarProps = {
          ...layoutProps,
          autoSummary: config.layout?.autoSummary,
          summaryConfig: config.layout?.summaryConfig,
          // Nouvelles propriétés du SidebarLayout amélioré
          showPriceCalculation: config.layout?.showPriceCalculation,
          showConstraintsByAddress: config.layout?.showConstraintsByAddress,
          showModificationsSummary: config.layout?.showModificationsSummary,
          initialPrice: config.layout?.initialPrice,
          onPriceCalculated: config.layout?.onPriceCalculated,
          priceModifications: config.layout?.priceModifications,
          headerActions: config.layout?.headerActions,
          serviceInfo: config.layout?.serviceInfo,
        };
        
        // Utiliser le layout personnalisé du preset si disponible
        if (config.preset) {
          const summaryConfig = getPresetSummary(config.preset);
          if (summaryConfig && !config.layout?.summaryConfig) {
            sidebarProps.summaryConfig = summaryConfig;
          }
        }
        
        return (
          <SidebarLayout {...sidebarProps}>
            {renderForm()}
          </SidebarLayout>
        );

      case "auth":
        const authOptions = config.layout?.authOptions || {};
        return (
          <AuthLayout 
            {...layoutProps}
            {...authOptions}
            trustedProviders={authOptions.trustedProviders}
          >
            {renderForm()}
          </AuthLayout>
        );

      case "package":
        const packageOptions = config.layout?.packageOptions;
        if (!packageOptions?.packages || packageOptions.packages.length === 0) {
          // Fallback au layout par défaut si aucun package n'est fourni
          return (
            <DefaultLayout {...layoutProps}>
              {renderForm()}
            </DefaultLayout>
          );
        }
        return (
          <PackageLayout 
            {...layoutProps}
            packages={packageOptions.packages}
            selectedPackage={packageOptions.selectedPackage}
            onKeepPackage={packageOptions.onKeepPackage}
            onCustomizePackage={packageOptions.onCustomizePackage}
            customizationTitle={packageOptions.customizationTitle}
          >
            {renderForm()}
          </PackageLayout>
        );

      case "package-edit":
        const packageEditOptions = config.layout?.packageEditOptions;
        if (!packageEditOptions?.selectedPackage) {
          // Fallback au layout par défaut si aucun package sélectionné
          return (
            <DefaultLayout {...layoutProps}>
              {renderForm()}
            </DefaultLayout>
          );
        }
        return (
          <PackageEditLayout 
            {...layoutProps}
            {...packageEditOptions}
          >
            {renderForm()}
          </PackageEditLayout>
        );

      case "package-card":
        const packageCardOptions = config.layout?.packageCardOptions;
        if (!packageCardOptions?.packages || packageCardOptions.packages.length === 0) {
          // Fallback au layout par défaut si aucun package n'est fourni
          return (
            <DefaultLayout {...layoutProps}>
              {renderForm()}
            </DefaultLayout>
          );
        }
        const { packages: cardPackages, ...otherCardOptions } = packageCardOptions;
        return (
          <PackageCardLayout 
            {...layoutProps}
            packages={cardPackages}
            {...otherCardOptions}
          />
        );

      case "service-summary":
        const serviceSummaryOptions = config.layout?.serviceSummaryOptions;
        if (!serviceSummaryOptions?.serviceDetails || !serviceSummaryOptions?.quoteDetails) {
          // Fallback au layout par défaut si les données requises ne sont pas fournies
          return (
            <DefaultLayout {...layoutProps}>
              {renderForm()}
            </DefaultLayout>
          );
        }
        
        // Ajouter le serviceType aux serviceDetails si pas déjà défini
        const enhancedServiceDetails = {
          ...serviceSummaryOptions.serviceDetails,
          ...(config.serviceType && !serviceSummaryOptions.serviceDetails.type && { 
            type: config.serviceType as any 
          })
        };
        
        return (
          <ServiceSummaryLayout 
            {...serviceSummaryOptions}
            serviceDetails={enhancedServiceDetails}
          />
        );

      case "custom":
        if (config.layout?.component) {
          const CustomLayout = config.layout.component;
          return (
            <CustomLayout {...layoutProps}>
              {renderForm()}
            </CustomLayout>
          );
        }
        // Fallback au layout par défaut si le composant personnalisé n'est pas fourni
        return (
          <DefaultLayout {...layoutProps}>
            {renderForm()}
          </DefaultLayout>
        );

      default:
        return (
          <DefaultLayout {...layoutProps}>
            {renderForm()}
          </DefaultLayout>
        );
    }
  };

  return (
    <>
      {/* Styles automatiques basés sur les presets */}
      <FormStyles 
        preset={config.preset} 
        customStyles={config.customStyles} 
      />
      
      {/* Layout et formulaire */}
      {renderLayout()}
    </>
  );
}; 