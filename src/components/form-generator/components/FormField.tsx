"use client";

import { devLog } from "@/lib/conditional-logger";

import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormField as FormFieldType } from "../types";

// Imports pour les composants métier spécifiques
import {
  PickupAddressAutocomplete,
  DeliveryAddressAutocomplete,
} from "@/components/AddressAutocomplete";
import { WhatsAppOptInConsent } from "@/components/WhatsAppOptInConsent";
import { AccessConstraintsModal } from "./AccessConstraintsModal";
import { CrossSellingButton } from "./CrossSellingButton";
import { FurnitureLiftCheckbox } from "./FurnitureLiftCheckbox";

interface FormFieldProps {
  field: FormFieldType;
  register: UseFormRegister<Record<string, unknown>>;
  errors: FieldErrors;
  value?: unknown;
  onChange?: (value: unknown) => void;
  formData?: Record<string, unknown>;
}

export const FormField: React.FC<FormFieldProps> = ({
  field,
  register,
  errors,
  value,
  onChange,
  formData,
}) => {
  // Vérification de la fonction register
  if (typeof register !== "function") {
    console.error("❌ [FormField] register is not a function:", register);
    return (
      <div className="text-red-500 p-2 border border-red-300 rounded">
        Erreur: register n'est pas une fonction pour le champ {field.name}
      </div>
    );
  }

  const error = errors[field.name]?.message as string | undefined;

  // Déterminer si le label flottant doit être affiché
  const excludedLabelTypes: string[] = [
    "checkbox",
    "radio",
    "whatsapp-consent",
    "separator",
  ];
  const hasLabel: boolean =
    field.label !== undefined && field.label !== null && field.label !== "";
  const shouldShowFloatingLabel: boolean =
    !excludedLabelTypes.includes(field.type) && hasLabel;
  const labelText: string =
    typeof field.label === "string" ? field.label : String(field.label ?? "");
  const isRequired: boolean =
    typeof field.required === "boolean" ? field.required : false;

  devLog.debug(
    "FormField",
    "🔧 [ÉTAPE 9.2] FormField - Rendu champ individuel:",
    {
      fieldName: field.name,
      type: field.type,
      register: typeof register,
      value: value,
      hasError: !!error,
      required: field.required,
      hasOptions: !!field.options?.length,
    },
  );

  // Props communs pour tous les champs - style minimaliste adaptatif
  const getInputWidth = () => {
    // En mode grille, les inputs prennent toute la largeur de leur colonne
    // En mode normal, ils gardent une taille fixe optimale
    switch (field.type) {
      case "email":
      case "text":
      case "number":
      case "date":
      case "select":
        return "w-full"; // S'adapte à la colonne (grille) ou largeur optimale
      case "textarea":
      case "address-pickup":
      case "address-delivery":
        return "w-full"; // Toujours pleine largeur
      default:
        return "w-full"; // Par défaut adaptatif
    }
  };

  const cleanInputClasses = [
    // Base styling avec largeur adaptative
    `block ${getInputWidth()} rounded-lg border bg-white transition-all duration-200`,
    "px-3 py-3 text-gray-900 text-sm",
    "placeholder:text-gray-400 placeholder:text-xs",

    // États et interactions - style très propre
    error
      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
      : "border-gray-300 hover:border-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",

    // Focus et outline
    "focus:outline-none",
    "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",

    // Classes personnalisées
    field.className || "",
  ].join(" ");

  // Gestionnaire de changement personnalisé qui combine register et onChange
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const newValue =
      e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
    devLog.debug(
      "FormField",
      "🎯 [ÉTAPE 9.3] FormField handleChange - User input détecté:",
      {
        fieldName: field.name,
        oldValue: value,
        newValue: newValue,
        valueType: typeof newValue,
      },
    );
    // Appeler le callback onChange personnalisé
    onChange?.(newValue);
  };

  // Props de react-hook-form
  const registerProps = register(
    field.name,
    field.type === "number"
      ? {
          setValueAs: (value) => {
            // Convertir en nombre seulement si la valeur n'est pas vide
            if (value === "" || value === null || value === undefined) {
              return "";
            }
            const numValue = Number(value);
            return isNaN(numValue) ? "" : numValue;
          },
        }
      : undefined,
  );

  // 📊 Log des props register pour debug
  devLog.debug("FormField", "⚙️ [ÉTAPE 9.2] Register Hook Form binding:", {
    fieldName: field.name,
    propsValue: value,
    finalValue: value !== undefined ? value : "",
    willBeControlled: value !== undefined,
  });

  // Props communes sans le onChange de register
  const commonProps = {
    id: field.name,
    name: field.name,
    className: cleanInputClasses,
    "aria-invalid": !!error || undefined,
    "aria-describedby": error ? `${field.name}-error` : undefined,
    // Ne pas inclure value ici, sera géré individuellement par type
  };

  // Rendu du champ selon son type
  const renderInput = () => {
    // Props pour les composants personnalisés
    const fieldProps = {
      ...commonProps,
      ...(field.componentProps || {}),
      value,
      onChange,
      error,
    };

    switch (field.type) {
      case "text":
      case "email":
      case "password":
      case "date":
        return (
          <input
            type={field.type}
            {...commonProps}
            {...registerProps}
            onChange={(e) => {
              registerProps.onChange(e); // Appeler le onChange de register
              handleChange(e); // Appeler notre gestionnaire personnalisé
            }}
            value={value !== undefined && value !== null ? String(value) : ""} // Utiliser value contrôlée
          />
        );

      case "number":
        return (
          <input
            type="number"
            {...commonProps}
            {...registerProps}
            min={field.validation?.min}
            max={field.validation?.max}
            onChange={(e) => {
              registerProps.onChange(e); // Appeler le onChange de register
              handleChange(e); // Appeler notre gestionnaire personnalisé
            }}
            value={value !== undefined && value !== null ? String(value) : ""}
          />
        );

      case "textarea":
        return (
          <textarea
            {...commonProps}
            {...registerProps}
            rows={4}
            className={`${cleanInputClasses} resize-none min-h-[120px] leading-relaxed`}
            onChange={(e) => {
              registerProps.onChange(e); // Appeler le onChange de register
              handleChange(e); // Appeler notre gestionnaire personnalisé
            }}
            value={value !== undefined && value !== null ? String(value) : ""}
          />
        );

      case "select":
        return (
          <select
            {...commonProps}
            {...registerProps}
            className={`${cleanInputClasses} bg-white cursor-pointer w-full`}
            style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}
            onChange={(e) => {
              registerProps.onChange(e); // Appeler le onChange de register
              handleChange(e); // Appeler notre gestionnaire personnalisé
            }}
            value={value !== undefined && value !== null ? String(value) : ""}
          >
            <option value="" className="text-gray-400">
              Sélectionnez une option
            </option>
            {field.options?.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="text-gray-800"
              >
                {option.label}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <div className="relative">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                {...commonProps}
                {...registerProps}
                onChange={(e) => {
                  registerProps.onChange(e); // Appeler le onChange de register
                  onChange?.(e.target.checked); // Appeler notre gestionnaire personnalisé
                }}
                checked={value !== undefined ? !!value : false}
                className="h-4 w-4 rounded border border-gray-300 text-emerald-600 
                         focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 
                         transition-all duration-200 
                         group-hover:border-emerald-400 mt-0.5"
              />
              <span className="text-sm text-gray-900 leading-relaxed group-hover:text-gray-700 transition-colors">
                {field.label}
                {field.required && (
                  <span className="text-emerald-600 ml-1">*</span>
                )}
              </span>
            </label>
          </div>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="radio"
                  value={option.value}
                  {...registerProps}
                  onChange={(e) => {
                    registerProps.onChange(e); // Appeler le onChange de register
                    onChange?.(e.target.value); // Appeler notre gestionnaire personnalisé
                  }}
                  className="h-4 w-4 border border-gray-300 text-emerald-600 
                           focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 
                           transition-all duration-200
                           group-hover:border-emerald-400"
                />
                <span className="text-sm text-gray-900 leading-relaxed group-hover:text-gray-700 transition-colors">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        );

      // Pour vos cas d'usage spécifiques
      case "address-pickup":
        return (
          <PickupAddressAutocomplete
            id={field.name}
            label={typeof field.label === "string" ? field.label : ""}
            value={value ? String(value) : ""}
            onChange={(value, _place) => onChange?.(value)}
            required={
              typeof field.required === "boolean" ? field.required : false
            }
            hideLabel={true}
            {...(field.componentProps || {})}
          />
        );

      case "address-delivery":
        return (
          <DeliveryAddressAutocomplete
            id={field.name}
            label={typeof field.label === "string" ? field.label : ""}
            value={value ? String(value) : ""}
            onChange={(value, _place) => onChange?.(value)}
            required={
              typeof field.required === "boolean" ? field.required : false
            }
            hideLabel={true}
            {...(field.componentProps || {})}
          />
        );

      case "access-constraints":
        // ✅ Extraire les données du formulaire pour l'auto-détection
        const type = field.componentProps?.type || "pickup";
        const prefix = type === "pickup" ? "pickup" : "delivery";

        // Récupérer les valeurs du formulaire
        const floor = formData?.[`${prefix}Floor`] as number | undefined;
        const elevator = formData?.[`${prefix}Elevator`] as
          | "no"
          | "small"
          | "medium"
          | "large"
          | undefined;
        const carryDistance = formData?.[`${prefix}CarryDistance`] as
          | "0-10"
          | "10-30"
          | "30+"
          | undefined;
        const volume = formData?.["volume"] as number | undefined;

        // 🔧 CORRECTION: Récupérer le serviceType depuis componentProps
        const serviceTypeFromProps = field.componentProps?.serviceType;

        devLog.debug(
          "FormField",
          `🏗️ [FormField] AccessConstraintsModal - Données extraites:`,
          {
            type,
            floor,
            elevator,
            carryDistance,
            volume,
            serviceTypeFromProps,
            componentProps: field.componentProps,
            formData,
          },
        );

        // Wrapper pour gérer la séparation contraintes/services
        const handleAccessConstraintsChange = (separatedData: any) => {
          devLog.debug(
            "FormField",
            `🔄 [FormField] Réception données séparées du modal ${type}:`,
            separatedData,
          );

          // Si separatedData contient addressConstraints et globalServices (nouvelle structure)
          if (
            separatedData &&
            typeof separatedData === "object" &&
            ("addressConstraints" in separatedData ||
              "globalServices" in separatedData)
          ) {
            // Appeler onChange avec la structure séparée
            // Le FormGenerator/DetailForm va gérer la fusion
            onChange?.(separatedData);
          } else {
            // Ancienne structure (fallback)
            onChange?.(separatedData);
          }
        };

        return (
          <div className="w-full">
            <AccessConstraintsModal
              type={type}
              buttonLabel={field.componentProps?.buttonLabel || field.label}
              modalTitle={field.componentProps?.modalTitle || field.label}
              value={value}
              onChange={handleAccessConstraintsChange}
              showServices={field.componentProps?.showServices !== false}
              floor={floor}
              elevator={elevator}
              carryDistance={carryDistance}
              volume={volume}
              formData={formData}
              serviceType={serviceTypeFromProps} // 🔧 Passer le serviceType
            />
          </div>
        );

      case "whatsapp-consent":
        return (
          <WhatsAppOptInConsent
            onOptInChange={(optedIn) => onChange?.(optedIn)}
            initialValue={typeof value === "boolean" ? value : false}
            required={
              typeof field.required === "boolean" ? field.required : false
            }
            {...(field.componentProps || {})}
          />
        );

      case "separator":
        return (
          <div className="flex items-center my-2 sm:my-4">
            <div className="flex-grow border-t border-blue-600"></div>
            {field.label && (
              <span className="px-4 text-sm text-blue-700 bg-white">
                {field.label}
              </span>
            )}
            <div className="flex-grow border-t border-blue-600"></div>
          </div>
        );

      case "cross-selling":
        return (
          <CrossSellingButton
            formData={formData}
            onChange={onChange}
            value={value}
          />
        );

      case "furniture-lift-checkbox":
        return (
          <FurnitureLiftCheckbox
            addressType={field.componentProps?.addressType || "pickup"}
            floorFieldName={field.componentProps?.floorFieldName || ""}
            elevatorFieldName={field.componentProps?.elevatorFieldName || ""}
            thresholds={
              field.componentProps?.thresholds || { HIGH: 3, CRITICAL: 5 }
            }
            value={typeof value === "boolean" ? value : false}
            onChange={onChange}
            formData={formData}
            error={error}
          />
        );

      case "custom":
        if (field.component) {
          const CustomComponent = field.component;
          return <CustomComponent {...fieldProps} />;
        }
        return null;

      default:
        return <input type="text" {...commonProps} />;
    }
  };

  return (
    <div className={`relative ${field.className || ""}`}>
      {/* Champ de saisie */}
      <div className="relative">
        {renderInput()}

        {/* Label flottant en overlay sur la bordure - optimisé mobile */}
        {shouldShowFloatingLabel && (
          <label
            htmlFor={field.name}
            className="absolute -top-2 left-2 sm:left-3 px-1.5 sm:px-1.5 md:px-1 py-0.5 md:py-0 bg-white text-[10px] sm:text-[10px] md:text-[10px] font-medium text-gray-900 z-10"
          >
            {labelText}
            {isRequired && <span className="text-emerald-600">*</span>}
          </label>
        )}

        {/* Indicateur de validation visuel - plus discret */}
        {Boolean(value) &&
          !error &&
          (field.type === "email" || field.type === "text") && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg
                className="w-4 h-4 text-emerald-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-start space-x-1 mt-2">
          <svg
            className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p
            id={`${field.name}-error`}
            className="text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        </div>
      )}
    </div>
  );
};
