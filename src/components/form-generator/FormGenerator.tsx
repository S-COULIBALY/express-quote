"use client";

import { devLog } from '@/lib/conditional-logger';

import React, { useMemo, useCallback, useImperativeHandle, forwardRef } from "react";
import { useForm } from "react-hook-form";
import { FormGeneratorProps, FormSection as FormSectionType } from "./types";
import { SidebarLayout } from "./layouts/SidebarLayout";
import { ServiceSummaryLayout } from "./layouts/ServiceSummaryLayout";
import { FormStylesSimplified } from "./styles/FormStylesSimplified";
import { FormSection } from "./components/FormSection";

export interface FormGeneratorRef {
  getFormData: () => Record<string, unknown>;
  submitForm: () => Promise<void>;
}

/**
 * 🎨 FormGenerator - Générateur de formulaires dynamiques
 *
 * Ce composant centralise la logique de rendu des formulaires
 * en fonction de la configuration fournie.
 *
 * ✅ OPTIMISATIONS APPLIQUÉES:
 * - Mémorisation des FormStyles pour éviter les re-renders
 * - Utilisation de FormStylesSimplified pour de meilleures performances
 * - Gestion des fallbacks pour tous les layouts
 * - Validation des données requises
 * - Exposition des méthodes via ref pour soumission externe
 */
export const FormGenerator = forwardRef<FormGeneratorRef, FormGeneratorProps>(({ config }, ref) => {
  // Hooks React
  const hasInitialized = React.useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    reset,
  } = useForm({
    defaultValues: config?.customDefaults || {},
    mode: "onChange",
  });

  const formData = watch();

  // Callbacks
  const handleFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      devLog.debug('FormGenerator', 
        "🔄 [ÉTAPE 10] Interaction utilisateur - Changement de champ",
      );
      devLog.debug('FormGenerator', 
        "🎯 [ÉTAPE 10] Field change:",
        fieldName,
        "=",
        value,
        typeof value,
      );
      setValue(fieldName, value, { shouldValidate: true, shouldDirty: true });
      const current = getValues();
      devLog.debug('FormGenerator', "📊 [ÉTAPE 10] Données complètes après changement:", current);
      devLog.debug('FormGenerator', "🔗 [ÉTAPE 10] Synchronisation avec DetailForm...");
      config?.onChange?.(fieldName, value, current);
    },
    [config, setValue, getValues],
  );

  const onSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      await config?.onSubmit?.(data);
    },
    [config],
  );

  const onError = useCallback(
    (formErrors: Record<string, unknown>) => {
      config?.onValidationError?.(formErrors);
    },
    [config],
  );

  // Exposer les méthodes via ref
  useImperativeHandle(ref, () => ({
    getFormData: () => getValues(),
    submitForm: async () => {
      await handleSubmit(onSubmit, onError)();
    }
  }), [getValues, handleSubmit, onSubmit, onError]);

  // Rendu d'une section
  const renderSection = useCallback(
    (section: FormSectionType, layoutType?: "default" | "sidebar") => (
      <FormSection
        key={section.title || Math.random().toString(36)}
        section={section}
        register={register}
        errors={errors}
        formData={formData}
        onFieldChange={(name, value) => handleFieldChange(name, value)}
        layoutType={layoutType}
      />
    ),
    [register, errors, formData, handleFieldChange],
  );

  // Effets
  React.useEffect(() => {
    if (config?.customDefaults && !hasInitialized.current) {
      devLog.debug('FormGenerator', 
        "🔄 [ÉTAPE 8.1] Reset initial du formulaire avec valeurs par défaut",
      );
      devLog.debug('FormGenerator', "📊 [ÉTAPE 8.1] CustomDefaults appliqués:", {
        totalValues: Object.keys(config.customDefaults).length,
        hasImportantValues: !!(
          config.customDefaults.duration || config.customDefaults.workers
        ),
        sampleValues: Object.entries(config.customDefaults)
          .slice(0, 5)
          .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
      });
      reset(config.customDefaults);
      hasInitialized.current = true;
      devLog.debug('FormGenerator', "✅ [ÉTAPE 8.1] Formulaire initialisé avec succès");
    }
  }, [config?.customDefaults, reset]);

  React.useEffect(() => {
    devLog.debug('FormGenerator', 
      "📊 [ÉTAPE 11] Surveillance état formulaire - watch() déclenché",
    );
    devLog.debug('FormGenerator', "📋 [SURVEILLANCE] État actuel du formulaire:", formData);
    devLog.debug('FormGenerator', 
      "🎯 [SURVEILLANCE] Champs avec valeurs:",
      Object.entries(formData).filter(
        ([_, value]) => value !== "" && value !== null && value !== undefined,
      ),
    );

    const filledFieldsCount = Object.entries(formData).filter(
      ([_, value]) =>
        value !== "" &&
        value !== null &&
        value !== undefined &&
        value !== false,
    ).length;
    devLog.debug('FormGenerator', "📈 [SURVEILLANCE] Statistiques:", {
      totalFields: Object.keys(formData).length,
      filledFields: filledFieldsCount,
      completionPercentage:
        Object.keys(formData).length > 0
          ? Math.round(
              (filledFieldsCount / Object.keys(formData).length) * 100,
            ) + "%"
          : "0%",
    });
  }, [formData]);

  // 🎨 Rendu du contenu du formulaire (à placer comme children des layouts)
  const formElement = useMemo(() => {
    if (!config) return null;

    const hasSections =
      Array.isArray(config.sections) && config.sections.length > 0;
    const hasFields = Array.isArray(config.fields) && config.fields.length > 0;

    const content = (
      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
        {hasSections ? (
          config.sections!.map((section) =>
            renderSection(
              section,
              config.layout?.type === "sidebar" ? "sidebar" : "default",
            ),
          )
        ) : hasFields ? (
          renderSection({ fields: config.fields! })
        ) : (
          <div className="p-4 text-center">
            <p className="text-gray-600">Aucun champ à afficher</p>
          </div>
        )}

        {/* Actions par défaut si pas gérées par le layout */}
        {config.layout?.type !== "sidebar" && !config.hideDefaultSubmit && (
          <div className="pt-2">
            <button
              type="submit"
              disabled={!!config.isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-60"
            >
              {config.isLoading
                ? config.loadingText || "Envoi en cours..."
                : config.submitLabel || "Valider"}
            </button>
            {config.onCancel && (
              <button
                type="button"
                onClick={config.onCancel}
                className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors"
              >
                {config.cancelLabel || "Annuler"}
              </button>
            )}
          </div>
        )}
      </form>
    );

    return content;
  }, [config, handleSubmit, onSubmit, onError, renderSection]);

  // 🎨 Props communes pour tous les layouts
  const layoutProps = useMemo(
    () => ({
      //title: config?.title || "Formulaire",
      title: config?.title,
      description: config?.description,
      className: config?.className,
      formData,
    }),
    [config?.title, config?.description, config?.className, formData],
  );

  // ✅ OPTIMISÉ: Mémoriser FormStylesSimplified pour éviter les re-renders
  const memoizedFormStyles = useMemo(
    () => (
      <FormStylesSimplified
        preset={config?.preset}
        customStyles={config?.customStyles}
        globalConfig={config?.globalConfig}
      />
    ),
    [config?.preset, config?.customStyles, config?.globalConfig],
  );

  // 🎨 Validation de la configuration
  if (!config) {
    console.error("❌ [FormGenerator] Configuration manquante");
    return (
      <div className="form-generator p-4 text-center">
        <p className="text-red-600">Erreur: Configuration manquante</p>
      </div>
    );
  }

  devLog.debug('FormGenerator', "🎨 [ÉTAPE 8] FormGenerator - Initialisation React Hook Form");
  devLog.debug('FormGenerator', "📋 [ÉTAPE 8] Configuration reçue:", {
    title: config.title,
    hasFields: !!config.fields,
    hasSections: !!config.sections,
    hasCustomDefaults: !!config.customDefaults,
    layoutType: config.layout?.type,
    sectionsCount: config.sections?.length || 0,
    fieldsCount: config.fields?.length || 0,
    defaultValuesCount: Object.keys(config.customDefaults || {}).length,
  });

  devLog.debug('FormGenerator', "⚙️ [ÉTAPE 8] React Hook Form setup avec mode: onChange");

  // 🎨 Rendu du layout approprié
  const renderLayout = () => {
    const layoutType = config.layout?.type || "sidebar";

    switch (layoutType) {
      case "sidebar": {
        // ✅ Créer les actions pour le sidebar
        const sidebarActions = !config.hideDefaultSubmit ? (
          <div className="space-y-2">
            <button
              type="button"
              disabled={!!config.isLoading}
              className="w-full py-3 px-4 rounded-xl transition-colors disabled:opacity-60 font-semibold text-white"
              style={{
                backgroundColor: config.isLoading ? "#6B7280" : "#059669",
                borderColor: config.isLoading ? "#6B7280" : "#059669",
              }}
              onMouseEnter={(e) => {
                if (!config.isLoading) {
                  e.currentTarget.style.backgroundColor = "#047857";
                }
              }}
              onMouseLeave={(e) => {
                if (!config.isLoading) {
                  e.currentTarget.style.backgroundColor = "#059669";
                }
              }}
              onClick={handleSubmit(onSubmit, onError)}
            >
              {config.isLoading
                ? config.loadingText || "Envoi en cours..."
                : config.submitLabel || "Réserver"}
            </button>
            {config.onCancel && (
              <button
                type="button"
                onClick={config.onCancel}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors"
              >
                {config.cancelLabel || "Annuler"}
              </button>
            )}
          </div>
        ) : null;

        const sidebarProps = {
          ...layoutProps,
          ...config.layout,
          actions: sidebarActions,
        };

        return <SidebarLayout {...sidebarProps}>{formElement}</SidebarLayout>;
      }

      case "service-summary": {
        const serviceSummaryOptions = config.layout?.serviceSummaryOptions;
        if (
          !serviceSummaryOptions?.serviceDetails ||
          !serviceSummaryOptions?.quoteDetails
        ) {
          return <SidebarLayout {...layoutProps}>{formElement}</SidebarLayout>;
        }
        const enhancedServiceDetails = {
          ...serviceSummaryOptions.serviceDetails,
          ...(config.serviceType &&
            !serviceSummaryOptions.serviceDetails.type && {
              type: config.serviceType as string,
            }),
        };
        return (
          <ServiceSummaryLayout
            {...serviceSummaryOptions}
            serviceDetails={enhancedServiceDetails}
          />
        );
      }

      case "custom": {
        if (config.layout?.component) {
          const CustomLayout = config.layout.component;
          return <CustomLayout {...layoutProps}>{formElement}</CustomLayout>;
        }
        return <SidebarLayout {...layoutProps}>{formElement}</SidebarLayout>;
      }

      default:
        return <SidebarLayout {...layoutProps}>{formElement}</SidebarLayout>;
    }
  };

  return (
    <div className="form-generator">
      {/* 🎨 Styles iOS 18 simplifiés - OPTIMISÉ */}
      {memoizedFormStyles}

      {/* Layout et formulaire */}
      {renderLayout()}
    </div>
  );
});

FormGenerator.displayName = 'FormGenerator';
