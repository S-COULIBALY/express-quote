import { SubmissionConfig } from "@/utils/submissionUtils";
import { CatalogueCleaningItem } from "@/types/booking";
import {
  UnifiedDataService,
  ServiceType,
} from "@/quotation/infrastructure/services/UnifiedDataService";
import { ConstraintTransformerService } from "@/quotation/domain/configuration";

export interface CatalogueCleaningItemSubmissionExtraData {
  service: CatalogueCleaningItem;
}

export const createCatalogueCleaningItemSubmissionConfig = (
  service: CatalogueCleaningItem,
): SubmissionConfig => ({
  submissionType: "SERVICE",

  validateFormData: (
    formData: any,
    extraData?: CatalogueCleaningItemSubmissionExtraData,
  ) => {
    if (!formData.scheduledDate || !formData.location) {
      return "Please fill in all required fields";
    }

    if (!service) {
      return "Service non disponible.";
    }

    return true;
  },

  prepareRequestData: (
    formData: any,
    extraData?: CatalogueCleaningItemSubmissionExtraData,
  ) => {
    return {
      serviceId: service.id,
      scheduledDate: formData.scheduledDate,
      location: formData.location,
      duration: formData.duration,
      workers: formData.workers,
      // ✅ Ajouter les valeurs par défaut du service pour le calcul des suppléments
      defaultDuration: service.duration,
      defaultWorkers: service.workers,
      defaultPrice: service.price,
      additionalInfo: formData.additionalInfo,
      calculatedPrice: formData.calculatedPrice,
      whatsappOptIn: formData.whatsappOptIn,
      serviceConstraints: formData.serviceConstraints || [],
    };
  },

  getSuccessRedirectUrl: (responseData: any) => {
    return `/services/summary?quoteRequestId=${encodeURIComponent(responseData.id)}`;
  },

  getNotificationData: async (
    formData: any,
    responseData: any,
    extraData?: CatalogueCleaningItemSubmissionExtraData,
  ) => {
    // Préparer le texte des contraintes pour l'email en utilisant le nouveau système de règles
    let constraintsText = "";
    if (formData.serviceConstraints && formData.serviceConstraints.length > 0) {
      try {
        // Récupérer les règles depuis le service unifié
        const unifiedService = UnifiedDataService.getInstance();
        const allBusinessRules = await unifiedService.getBusinessRules(
          ServiceType.CLEANING,
        );

        // Transformer les règles pour obtenir les noms des contraintes
        const transformedRules =
          ConstraintTransformerService.transformRulesToApiFormat(
            allBusinessRules,
            "CLEANING",
          );

        // Récupérer les noms des contraintes
        const constraintNames = formData.serviceConstraints.map(
          (id: string) => {
            const rule = transformedRules.data.allItems.find(
              (item: any) => item.id === id,
            );
            return rule ? rule.name : id;
          },
        );

        constraintsText = `Contraintes: ${constraintNames.join(", ")}`;
      } catch (error) {
        console.error(
          "❌ Erreur lors de la récupération des noms de contraintes:",
          error,
        );
        constraintsText = `Contraintes: ${formData.serviceConstraints.join(", ")}`;
      }
    }

    return {
      serviceDate: formData.scheduledDate,
      serviceAddress: formData.location,
      additionalDetails: constraintsText,
    };
  },
});
