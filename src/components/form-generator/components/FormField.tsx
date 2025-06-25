"use client";

import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormField as FormFieldType } from "../types";

// Imports pour les composants métier spécifiques
import { PickupAddressAutocomplete, DeliveryAddressAutocomplete } from "@/components/AddressAutocomplete";
import MovingConstraintsAndServicesModal from "@/components/MovingConstraintsAndServicesModal";
import { WhatsAppOptInConsent } from "@/components/WhatsAppOptInConsent";

interface FormFieldProps {
  field: FormFieldType;
  register: UseFormRegister<any>;
  errors: FieldErrors;
  value?: any;
  onChange?: (value: any) => void;
  formData?: any;
}

export const FormField: React.FC<FormFieldProps> = ({
  field,
  register,
  errors,
  value,
  onChange,
  formData
}) => {
  const error = errors[field.name]?.message as string | undefined;

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
    field.className || ""
  ].join(" ");

  const commonProps = {
    ...register(
      field.name,
      field.type === "number" ? { 
        setValueAs: (value) => {
          // Convertir en nombre seulement si la valeur n'est pas vide
          if (value === "" || value === null || value === undefined) {
            return "";
          }
          const numValue = Number(value);
          return isNaN(numValue) ? "" : numValue;
        }
      } : undefined
    ),
    id: field.name,
    name: field.name,
    className: cleanInputClasses,
    "aria-invalid": !!error || undefined,
    "aria-describedby": error ? `${field.name}-error` : undefined
  };

  // Rendu du champ selon son type
  const renderInput = () => {
    // Props pour les composants personnalisés
    const fieldProps = {
      ...commonProps,
      ...(field.componentProps || {}),
      value,
      onChange,
      error
    };

    switch (field.type) {
      case "text":
      case "email":
      case "password":
      case "date":
        return <input type={field.type} {...commonProps} />;

      case "number":
        // Créer des props spéciales pour les champs numériques pour éviter NaN
        const numberProps = {
          ...commonProps,
          value: (value === null || value === undefined || isNaN(value)) ? "" : value
        };
        return (
          <input 
            type="number" 
            {...numberProps}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case "textarea":
        return (
          <textarea 
            {...commonProps}
            rows={4}
            className={`${cleanInputClasses} resize-none min-h-[120px] leading-relaxed`}
          />
        );

      case "select":
        return (
          <select 
            {...commonProps}
            className={`${cleanInputClasses} bg-white/70 cursor-pointer`}
          >
            <option value="" className="text-gray-400">-- Sélectionnez une option --</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value} className="text-gray-800">
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
                {...register(field.name)}
                className="h-4 w-4 rounded border border-gray-300 text-emerald-600 
                         focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 
                         transition-all duration-200 
                         group-hover:border-emerald-400 mt-0.5"
              />
              <span className="text-sm text-gray-900 leading-relaxed group-hover:text-gray-700 transition-colors">
                {field.label}
                {field.required && <span className="text-emerald-600 ml-1">*</span>}
              </span>
            </label>
          </div>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  value={option.value}
                  {...register(field.name)}
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
            label={field.label || ""}
            value={value || ""}
            onChange={(value, place) => onChange?.(value)}
            required={field.required}
            hideLabel={true}
            className={field.className || ""}
            {...(field.componentProps || {})}
          />
        );

      case "address-delivery":
        return (
          <DeliveryAddressAutocomplete
            id={field.name}
            label={field.label || ""}
            value={value || ""}
            onChange={(value, place) => onChange?.(value)}
            required={field.required}
            hideLabel={true}
            className={field.className || ""}
            {...(field.componentProps || {})}
          />
        );

      case "logistics-modal":
        return (
          <MovingConstraintsAndServicesModal
            id={field.componentProps?.id || "pickup"}
            onChange={(values: string[]) => onChange?.(values)}
            buttonLabel={field.label || "Difficultés d'accès"}
            modalTitle={field.componentProps?.modalTitle || "Contraintes d'accès et services"}
            formData={formData}
            {...(field.componentProps || {})}
          />
        );

      case "service-constraints":
        return (
          <MovingConstraintsAndServicesModal
            id={field.componentProps?.id || "pickup"}
            onChange={(values: string[]) => onChange?.(values)}
            buttonLabel={field.componentProps?.buttonLabel || "Difficultés d'accès"}
            modalTitle={field.componentProps?.modalTitle || "Difficultés d'accès"}
            formData={formData}
            {...(field.componentProps || {})}
          />
        );

      case "whatsapp-consent":
        return (
          <WhatsAppOptInConsent
            onOptInChange={(optedIn) => onChange?.(optedIn)}
            initialValue={value || false}
            required={field.required}
            {...(field.componentProps || {})}
          />
        );

      case "separator":
        return (
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-blue-600"></div>
            {field.label && (
              <span className="px-4 text-sm text-blue-700 bg-white">
                {field.label}
              </span>
            )}
            <div className="flex-grow border-t border-blue-600"></div>
          </div>
        );

      case "custom":
        if (field.component) {
          const CustomComponent = field.component;
          return (
            <CustomComponent
              {...fieldProps}
            />
          );
        }
        return null;

      default:
        return <input type="text" {...commonProps} />;
    }
  };

  return (
    <div className={`relative ${field.className || ''}`}>
      {/* Champ de saisie */}
      <div className="relative">
        {renderInput()}
        
        {/* Label flottant en overlay sur la bordure - comme dans la capture */}
        {field.type !== "checkbox" && 
         field.type !== "radio" && 
         field.type !== "whatsapp-consent" && 
         field.type !== "separator" && 
         field.label && (
          <label 
            htmlFor={field.name} 
            className="absolute -top-2 left-3 px-2 bg-white text-sm font-medium text-gray-900 z-10"
          >
            {field.label}
            {field.required && (
              <span className="text-emerald-600">*</span>
            )}
          </label>
        )}
        
        {/* Indicateur de validation visuel - plus discret */}
        {value && !error && (field.type === "email" || field.type === "text") && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-start space-x-1 mt-2">
          <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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