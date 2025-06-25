import { z } from "zod";
import { FormField } from "../types";

export const generateSchema = (fields: FormField[]) => {
  const shape: Record<string, any> = {};

  fields.forEach(field => {
    const isRequired = field.required ?? false;
    let baseSchema: z.ZodTypeAny;

    switch (field.type) {
      case "email":
        baseSchema = z.string().email("Email invalide");
        break;

      case "number":
        let numberSchema = z.coerce.number({ 
          invalid_type_error: "Doit être un nombre" 
        });
        
        // Ajouter les validations min/max si spécifiées
        if (field.validation?.min !== undefined) {
          numberSchema = numberSchema.min(field.validation.min, 
            `Minimum ${field.validation.min}`);
        }
        if (field.validation?.max !== undefined) {
          numberSchema = numberSchema.max(field.validation.max, 
            `Maximum ${field.validation.max}`);
        }
        
        baseSchema = numberSchema;
        break;

      case "checkbox":
        baseSchema = isRequired 
          ? z.literal(true, { errorMap: () => ({ message: "Obligatoire" }) })
          : z.boolean();
        break;

      case "date":
        baseSchema = z.string().refine(
          (val) => !isNaN(Date.parse(val)),
          "Date invalide"
        );
        break;

      case "select":
      case "radio":
        if (field.options && field.options.length > 0) {
          const validValues = field.options.map(opt => opt.value);
          baseSchema = z.enum(validValues as [string, ...string[]], {
            errorMap: () => ({ message: "Sélection invalide" })
          });
        } else {
          baseSchema = z.string();
        }
        break;

      case "custom":
        // Pour les composants personnalisés, utiliser une validation basique
        baseSchema = z.any();
        break;

      case "address-pickup":
      case "address-delivery":
      case "logistics-modal":
      case "whatsapp-consent":
        // Pour les composants métier spécifiques, utiliser une validation basique
        // La validation spécifique sera gérée par le composant lui-même
        baseSchema = z.any();
        break;

      case "service-constraints":
        // Les contraintes de service sont un tableau de strings
        baseSchema = z.array(z.string());
        break;

      default:
        let stringSchema = z.string();
        
        // Ajouter validation de pattern si spécifiée
        if (field.validation?.pattern) {
          stringSchema = stringSchema.regex(
            new RegExp(field.validation.pattern),
            "Format invalide"
          );
        }
        
        // Ajouter validation de longueur minimale pour les champs requis
        if (isRequired) {
          stringSchema = stringSchema.min(1, "Champ requis");
        }
        
        baseSchema = stringSchema;
        break;
    }

    // Ajouter validation personnalisée si spécifiée
    if (field.validation?.custom) {
      baseSchema = baseSchema.refine(
        (val) => {
          const result = field.validation!.custom!(val, {});
          return typeof result === 'boolean' ? result : false;
        },
        {
          message: "Validation personnalisée échouée"
        }
      );
    }

    // Rendre optionnel si pas requis (sauf pour les checkboxes)
    if (!isRequired && field.type !== "checkbox") {
      baseSchema = baseSchema.optional();
    }

    shape[field.name] = baseSchema;
  });

  return z.object(shape);
};

export const generateConditionalSchema = (
  fields: FormField[], 
  formData: Record<string, any>
) => {
  const shape: Record<string, any> = {};

  fields.forEach(field => {
    let baseSchema = generateFieldSchema(field);

    // Appliquer la validation conditionnelle
    if (field.conditional) {
      const dependentValue = formData[field.conditional.dependsOn];
      const shouldValidate = field.conditional.condition(dependentValue, formData);

      if (!shouldValidate) {
        // Si la condition n'est pas remplie, rendre le champ optionnel
        baseSchema = baseSchema.optional();
      } else if (field.conditional.validation) {
        // Appliquer la validation conditionnelle
        const condValidation = field.conditional.validation;
        
        if (condValidation.required && field.type === "checkbox") {
          baseSchema = z.literal(true, { errorMap: () => ({ message: "Ce champ est obligatoire" }) });
        }
        if (condValidation.min !== undefined && field.type === "number") {
          const numberSchema = baseSchema as z.ZodNumber;
          baseSchema = numberSchema.min(condValidation.min);
        }
        if (condValidation.max !== undefined && field.type === "number") {
          const numberSchema = baseSchema as z.ZodNumber;
          baseSchema = numberSchema.max(condValidation.max);
        }
        if (condValidation.custom) {
          baseSchema = baseSchema.refine(
            (val) => condValidation.custom!(val, formData),
            "Validation conditionnelle échouée"
          );
        }
      }
    }

    shape[field.name] = baseSchema;
  });

  return z.object(shape);
};

const generateFieldSchema = (field: FormField): z.ZodTypeAny => {
  const isRequired = field.required ?? false;

  switch (field.type) {
    case "email":
      return isRequired
        ? z.string().email("Email invalide")
        : z.string().email("Email invalide").optional();

    case "number":
      return isRequired
        ? z.coerce.number({ invalid_type_error: "Doit être un nombre" })
        : z.coerce.number({ invalid_type_error: "Doit être un nombre" }).optional();

    case "checkbox":
      return isRequired
        ? z.literal(true, { errorMap: () => ({ message: "Obligatoire" }) })
        : z.boolean().optional();

    case "service-constraints":
      return isRequired
        ? z.array(z.string()).min(1, "Au moins une contrainte requise")
        : z.array(z.string()).optional();

    default:
      return isRequired
        ? z.string().min(1, "Champ requis")
        : z.string().optional();
  }
}; 