import { HttpRequest, HttpResponse } from "../types";
import { QuoteRequestService } from "../../../application/services/QuoteRequestService";
import { ValidationError } from "../../../domain/errors/ValidationError";
import { logger } from "@/lib/logger";
import { priceSignatureService } from "../../../application/services/PriceSignatureService";
// Nouveau système de calcul modulaire
import { BaseCostEngine } from "@/quotation-module/core/BaseCostEngine";
import { FormAdapter } from "@/quotation-module/adapters/FormAdapter";
import { getAllModules } from "@/quotation-module/core/ModuleRegistry";
import { MultiQuoteService } from "@/quotation-module/multi-offers/MultiQuoteService";
import { STANDARD_SCENARIOS } from "@/quotation-module/multi-offers/QuoteScenario";

/**
 * Contrôleur HTTP pour la gestion des demandes de devis
 * Endpoints REST pour le cycle de vie complet des QuoteRequest
 */
export class QuoteRequestController {
  private readonly baseCostEngine: BaseCostEngine;

  constructor(private readonly quoteRequestService: QuoteRequestService) {
    this.baseCostEngine = new BaseCostEngine(getAllModules());
  }

  /**
   * POST /api/quotesRequest/
   * Crée une nouvelle demande de devis
   */
  async createQuoteRequest(
    req: HttpRequest,
    res: HttpResponse,
  ): Promise<HttpResponse> {
    logger.info(
      "\n\n\n═══ DEBUT QuoteRequestController.createQuoteRequest ═══",
    );
    logger.info(
      "📁 [QuoteRequestController.ts] ▶️ Début création demande de devis",
    );

    try {
      // Valider les données d'entrée
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          error: "Les données de la demande de devis sont requises",
        });
      }

      // ✅ LOG DÉTAILLÉ: Données reçues du frontend (soumission)
      const quoteData = req.body.quoteData || {};
      const clientCalculatedPrice =
        quoteData.calculatedPrice || quoteData.totalPrice || 0;

      logger.info(
        "📁 [QuoteRequestController.ts] 📥 Données reçues du frontend:",
        {
          serviceType: req.body.serviceType || quoteData.serviceType,
          clientCalculatedPrice,
          hasPickupAddress: !!quoteData.pickupAddress,
          hasDeliveryAddress: !!quoteData.deliveryAddress,
        },
      );

      // 🔒 SÉCURITÉ: Recalculer le prix côté serveur pour validation
      const serviceType = req.body.serviceType || quoteData.serviceType;
      if (!serviceType) {
        throw new ValidationError("ServiceType manquant dans la requête");
      }

      // Extraire les services cross-selling (flags plats dans quoteData)
      const additionalServices: Record<string, boolean> = {};
      const crossSellingFlags = [
        "packing",
        "dismantling",
        "reassembly",
        "cleaningEnd",
        "temporaryStorage",
        "piano",
        "safe",
        "artwork",
      ] as const;
      crossSellingFlags.forEach((flag) => {
        if (quoteData[flag] === true) {
          additionalServices[flag] = true;
        }
      });

      // Créer un objet avec toutes les données nécessaires pour le calcul
      const priceCalculationRequest = {
        ...quoteData,
        serviceType,
        // ✅ CORRECTION CRITIQUE: Ajouter les globalServices extraits comme additionalServices
        additionalServices:
          Object.keys(additionalServices).length > 0
            ? additionalServices
            : undefined,
      };

      // Étape 1 : Calcul du coût opérationnel de base (21 modules)
      const context = FormAdapter.toQuoteContext(priceCalculationRequest);
      const engineResult = this.baseCostEngine.execute(context);
      const calculationId = crypto.randomUUID();
      const serverBaseCost = engineResult.baseCost || 0;

      // Étape 2 : Recalcul du prix scénario complet côté serveur
      const selectedScenarioId = quoteData.selectedScenario || "STANDARD";
      const scenario = STANDARD_SCENARIOS.find(
        (s) => s.id === selectedScenarioId,
      );
      let serverScenarioPrice = serverBaseCost;

      if (scenario) {
        const multiService = new MultiQuoteService(getAllModules());
        const variants = multiService.generateMultipleQuotesFromBaseCost(
          engineResult.context,
          [scenario],
          serverBaseCost,
        );
        if (variants.length > 0) {
          serverScenarioPrice = variants[0].finalPrice;
        }
      } else {
        logger.warn(
          `⚠️ Scénario inconnu: ${selectedScenarioId} - Utilisation du baseCost`,
        );
      }

      // Étape 3 : Comparer prix serveur vs prix client
      const clientPrice =
        quoteData.calculatedPrice || quoteData.totalPrice || 0;
      const priceDiff = Math.abs(serverScenarioPrice - clientPrice);
      if (priceDiff > 1) {
        logger.warn("⚠️ Écart prix client/serveur détecté", {
          clientPrice,
          serverScenarioPrice,
          difference: priceDiff.toFixed(2),
          scenario: selectedScenarioId,
          note: "Le prix serveur fait autorité",
        });
      }

      // Étape 4 : Signer le prix scénario recalculé (le serveur fait autorité)
      const securedPrice = priceSignatureService.createSecuredPrice(
        {
          total: serverScenarioPrice,
          base: serverBaseCost,
          calculationId,
        },
        priceCalculationRequest,
      );

      // Stocker le prix sécurisé et écraser le prix client par le prix serveur
      req.body.quoteData.securedPrice = securedPrice;
      req.body.quoteData.serverBaseCost = serverBaseCost;
      req.body.quoteData.calculatedPrice = serverScenarioPrice;
      // totalPrice = calculatedPrice + options (assurance, protection)
      // Si le client a ajouté des options, conserver l'écart
      const clientOptionsAmount =
        (quoteData.totalPrice || 0) - (quoteData.calculatedPrice || 0);
      if (clientOptionsAmount > 0) {
        req.body.quoteData.totalPrice =
          serverScenarioPrice + clientOptionsAmount;
      } else {
        req.body.quoteData.totalPrice = serverScenarioPrice;
      }

      logger.info("✅ Prix scénario recalculé et signé:", {
        serverBaseCost,
        serverScenarioPrice,
        clientPrice,
        totalPrice: req.body.quoteData.totalPrice,
        selectedScenario: selectedScenarioId,
        calculationId: securedPrice.calculationId,
        signature: securedPrice.signature.substring(0, 16) + "...",
      });

      // Créer la demande via le service
      const quoteRequest = await this.quoteRequestService.createQuoteRequest(
        req.body,
      );

      // Réponse avec les informations essentielles
      const response = {
        success: true,
        message: "Demande de devis créée avec succès",
        data: {
          id: quoteRequest.getId(),
          temporaryId: quoteRequest.getTemporaryId(),
          type: quoteRequest.getType(),
          status: quoteRequest.getStatus(),
          expiresAt: quoteRequest.getExpiresAt(),
          createdAt: quoteRequest.getCreatedAt(),
        },
      };

      logger.info(
        `📁 [QuoteRequestController.ts] ✅ Demande de devis créée: ${quoteRequest.getTemporaryId()}`,
      );
      logger.info(
        "📁 [QuoteRequestController.ts] ⏹ Fin QuoteRequestController.createQuoteRequest",
      );
      logger.info(
        "═══⏹ FIN QuoteRequestController.createQuoteRequest ═══\n\n\n",
      );
      return res.status(201).json(response);
    } catch (error) {
      logger.error(
        "📁 [QuoteRequestController.ts] ❌ Erreur création demande de devis:",
        error,
      );

      if (error instanceof ValidationError) {
        logger.info(
          "📁 [QuoteRequestController.ts] ⏹ Fin QuoteRequestController.createQuoteRequest (validation échouée)",
        );
        logger.info(
          "═══⏹ FIN QuoteRequestController.createQuoteRequest ═══\n\n\n",
        );
        return res.status(400).json({
          error: "Données invalides",
          message: error.message,
        });
      }

      logger.info(
        "📁 [QuoteRequestController.ts] ⏹ Fin QuoteRequestController.createQuoteRequest (erreur)",
      );
      logger.info(
        "═══⏹ FIN QuoteRequestController.createQuoteRequest ═══\n\n\n",
      );
      return res.status(500).json({
        error: "Erreur interne du serveur",
        message: "Une erreur inattendue s'est produite",
      });
    }
  }

  /**
   * GET /api/quotesRequest/[temporaryId]
   * Récupère une demande de devis par son ID temporaire
   */
  async getQuoteRequest(
    req: HttpRequest,
    res: HttpResponse,
  ): Promise<HttpResponse> {
    const temporaryId = req.params.temporaryId;
    logger.info(
      `🔍 GET /api/quotesRequest/${temporaryId} - Récupération demande`,
    );

    try {
      // Valider le paramètre
      if (!temporaryId) {
        return res.status(400).json({
          error: "ID temporaire requis",
        });
      }

      // Récupérer la demande via le service
      const quoteRequest =
        await this.quoteRequestService.getQuoteRequestByTemporaryId(
          temporaryId,
        );

      if (!quoteRequest) {
        return res.status(404).json({
          error: "Demande de devis non trouvée",
          message: "La demande de devis n'existe pas ou a expiré",
        });
      }

      // Récupérer les prix stockés (recalculés et signés par le serveur au POST)
      // securedPrice.totalPrice = prix scénario recalculé serveur
      // securedPrice.basePrice = baseCost opérationnel
      // quoteData.totalPrice = prix scénario + options assurance/protection
      const quoteData = quoteRequest.getQuoteData();

      const calculatedPrice = {
        basePrice:
          quoteData.securedPrice?.basePrice || quoteData.serverBaseCost || 0,
        totalPrice:
          quoteData.totalPrice || quoteData.securedPrice?.totalPrice || 0,
        currency: "EUR",
        calculationId: quoteData.securedPrice?.calculationId,
        calculatedAt: quoteData.securedPrice?.calculatedAt,
        serverBaseCost: quoteData.serverBaseCost,
        selectedScenario: quoteData.selectedScenario,
      };

      logger.info(`✅ [QuoteRequestController] Prix récupéré`, {
        temporaryId,
        totalPrice: calculatedPrice.totalPrice,
        serverBaseCost: calculatedPrice.serverBaseCost,
        selectedScenario: calculatedPrice.selectedScenario,
      });

      // API catalogue supprimée (2026-02) - catalogSelection non renseigné
      const catalogSelection = null;

      // Réponse complète avec toutes les données formatées pour l'UI
      const response = {
        success: true,
        data: {
          id: quoteRequest.getId(),
          temporaryId: quoteRequest.getTemporaryId(),
          type: quoteRequest.getType(),
          status: quoteRequest.getStatus(),
          quoteData: quoteRequest.getQuoteData(),
          createdAt: quoteRequest.getCreatedAt(),
          updatedAt: quoteRequest.getUpdatedAt(),
          expiresAt: quoteRequest.getExpiresAt(),
          isExpired: quoteRequest.isExpired(),
          // Ajout des données pour l'UI de la page summary
          calculatedPrice,
          catalogSelection,
        },
      };

      logger.info(`✅ Demande trouvée: ${temporaryId}`, {
        hasCalculatedPrice: !!calculatedPrice,
        totalPrice: calculatedPrice?.totalPrice,
        hasSecuredPrice: !!quoteData.securedPrice,
      });
      return res.status(200).json(response);
    } catch (error) {
      logger.error(`❌ Erreur récupération demande ${temporaryId}:`, error);

      return res.status(500).json({
        error: "Erreur interne du serveur",
        message: "Une erreur inattendue s'est produite",
      });
    }
  }

  /**
   * POST /api/quotesRequest/[temporaryId]/calculate
   * Calcule le prix pour une demande de devis
   */
  async calculateQuotePrice(
    req: HttpRequest,
    res: HttpResponse,
  ): Promise<HttpResponse> {
    const temporaryId = req.params.temporaryId;
    logger.info(
      `🧮 POST /api/quotesRequest/${temporaryId}/calculate - Calcul prix`,
    );

    try {
      // Valider le paramètre
      if (!temporaryId) {
        return res.status(400).json({
          error: "ID temporaire requis",
        });
      }

      // Calculer le prix via le service (avec données optionnelles du body)
      const quote = await this.quoteRequestService.calculateQuotePrice(
        temporaryId,
        req.body,
      );

      // Réponse avec les détails du calcul
      const response = {
        success: true,
        message: "Prix calculé avec succès",
        data: {
          calculation: {
            basePrice: {
              amount: quote.getBasePrice().getAmount(),
              currency: quote.getBasePrice().getCurrency(),
            },
            totalPrice: {
              amount: quote.getTotalPrice().getAmount(),
              currency: quote.getTotalPrice().getCurrency(),
            },
            details: quote.getDetails(),
            serviceType: quote.getServiceType(),
            calculatedAt: quote.getCalculationDate(),
          },
        },
      };

      logger.info(
        `✅ Prix calculé pour ${temporaryId}: ${quote.getTotalPrice().getAmount()}€`,
      );
      return res.status(200).json(response);
    } catch (error) {
      logger.error(`❌ Erreur calcul prix ${temporaryId}:`, error);

      if (error instanceof ValidationError) {
        return res.status(400).json({
          error: "Données invalides",
          message: error.message,
        });
      }

      return res.status(500).json({
        error: "Erreur de calcul",
        message: "Impossible de calculer le prix pour cette demande",
      });
    }
  }

  /**
   * PUT /api/quotesRequest/[temporaryId]
   * Met à jour une demande de devis existante
   */
  async updateQuoteRequest(
    req: HttpRequest,
    res: HttpResponse,
  ): Promise<HttpResponse> {
    const temporaryId = req.params.temporaryId;
    logger.info(
      `📝 PUT /api/quotesRequest/${temporaryId} - Mise à jour demande`,
    );

    try {
      // Valider le paramètre
      if (!temporaryId) {
        return res.status(400).json({
          error: "ID temporaire requis",
        });
      }

      // Valider les données de mise à jour
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          error: "Données de mise à jour requises",
        });
      }

      // Mettre à jour via le service
      const updatedQuoteRequest =
        await this.quoteRequestService.updateQuoteRequest(
          temporaryId,
          req.body,
        );

      // Réponse avec les données mises à jour
      const response = {
        success: true,
        message: "Demande de devis mise à jour avec succès",
        data: {
          id: updatedQuoteRequest.getId(),
          temporaryId: updatedQuoteRequest.getTemporaryId(),
          type: updatedQuoteRequest.getType(),
          status: updatedQuoteRequest.getStatus(),
          quoteData: updatedQuoteRequest.getQuoteData(),
          updatedAt: updatedQuoteRequest.getUpdatedAt(),
          expiresAt: updatedQuoteRequest.getExpiresAt(),
        },
      };

      logger.info(`✅ Demande mise à jour: ${temporaryId}`);
      return res.status(200).json(response);
    } catch (error) {
      logger.error(`❌ Erreur mise à jour demande ${temporaryId}:`, error);

      if (error instanceof ValidationError) {
        return res.status(400).json({
          error: "Données invalides",
          message: error.message,
        });
      }

      return res.status(500).json({
        error: "Erreur interne du serveur",
        message: "Une erreur inattendue s'est produite",
      });
    }
  }

  /**
   * DELETE /api/quotesRequest/[temporaryId]
   * Supprime une demande de devis
   */
  async deleteQuoteRequest(
    req: HttpRequest,
    res: HttpResponse,
  ): Promise<HttpResponse> {
    const temporaryId = req.params.temporaryId;
    logger.info(
      `🗑️ DELETE /api/quotesRequest/${temporaryId} - Suppression demande`,
    );

    try {
      // Valider le paramètre
      if (!temporaryId) {
        return res.status(400).json({
          error: "ID temporaire requis",
        });
      }

      // Supprimer via le service
      await this.quoteRequestService.deleteQuoteRequest(temporaryId);

      // Réponse de confirmation
      const response = {
        success: true,
        message: "Demande de devis supprimée avec succès",
      };

      logger.info(`✅ Demande supprimée: ${temporaryId}`);
      return res.status(200).json(response);
    } catch (error) {
      logger.error(`❌ Erreur suppression demande ${temporaryId}:`, error);

      if (error instanceof ValidationError) {
        return res.status(404).json({
          error: "Demande non trouvée",
          message: error.message,
        });
      }

      return res.status(500).json({
        error: "Erreur interne du serveur",
        message: "Une erreur inattendue s'est produite",
      });
    }
  }

  /**
   * POST /api/quotesRequest/[temporaryId]/confirm
   * Confirme une demande de devis (endpoint bonus)
   */
  async confirmQuoteRequest(
    req: HttpRequest,
    res: HttpResponse,
  ): Promise<HttpResponse> {
    const temporaryId = req.params.temporaryId;
    logger.info(
      `✅ POST /api/quotesRequest/${temporaryId}/confirm - Confirmation demande`,
    );

    try {
      if (!temporaryId) {
        return res.status(400).json({
          error: "ID temporaire requis",
        });
      }

      // Confirmer via le service
      const confirmedQuoteRequest =
        await this.quoteRequestService.confirmQuoteRequest(temporaryId);

      const response = {
        success: true,
        message: "Demande de devis confirmée avec succès",
        data: {
          id: confirmedQuoteRequest.getId(),
          temporaryId: confirmedQuoteRequest.getTemporaryId(),
          status: confirmedQuoteRequest.getStatus(),
          updatedAt: confirmedQuoteRequest.getUpdatedAt(),
        },
      };

      logger.info(`✅ Demande confirmée: ${temporaryId}`);
      return res.status(200).json(response);
    } catch (error) {
      logger.error(`❌ Erreur confirmation demande ${temporaryId}:`, error);

      if (error instanceof ValidationError) {
        return res.status(404).json({
          error: "Demande non trouvée",
          message: error.message,
        });
      }

      return res.status(500).json({
        error: "Erreur interne du serveur",
        message: "Une erreur inattendue s'est produite",
      });
    }
  }

  /**
   * POST /api/quotesRequest/[temporaryId]/extend
   * Prolonge la durée de validité d'une demande (endpoint bonus)
   */
  async extendQuoteRequest(
    req: HttpRequest,
    res: HttpResponse,
  ): Promise<HttpResponse> {
    const temporaryId = req.params.temporaryId;
    const additionalHours = req.body?.hours || 24;
    logger.info(
      `⏰ POST /api/quotesRequest/${temporaryId}/extend - Prolongation demande`,
    );

    try {
      if (!temporaryId) {
        return res.status(400).json({
          error: "ID temporaire requis",
        });
      }

      // Prolonger via le service
      const extendedQuoteRequest =
        await this.quoteRequestService.extendQuoteRequest(
          temporaryId,
          additionalHours,
        );

      const response = {
        success: true,
        message: `Demande de devis prolongée de ${additionalHours}h`,
        data: {
          temporaryId: extendedQuoteRequest.getTemporaryId(),
          newExpiresAt: extendedQuoteRequest.getExpiresAt(),
          updatedAt: extendedQuoteRequest.getUpdatedAt(),
        },
      };

      logger.info(`✅ Demande prolongée: ${temporaryId}`);
      return res.status(200).json(response);
    } catch (error) {
      logger.error(`❌ Erreur prolongation demande ${temporaryId}:`, error);

      if (error instanceof ValidationError) {
        return res.status(404).json({
          error: "Demande non trouvée",
          message: error.message,
        });
      }

      return res.status(500).json({
        error: "Erreur interne du serveur",
        message: "Une erreur inattendue s'est produite",
      });
    }
  }
}
