import { NextRequest, NextResponse } from "next/server";
import { CatalogueController } from "@/quotation/interfaces/http/controllers/CatalogueController";
import { logger } from "@/lib/logger";

// Force le rendu dynamique (évite erreur de build Vercel)
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    logger.info("🔍 GET /api/catalogue/featured - Début");

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // Créer une nouvelle URL avec les paramètres required pour le controller
    const controllerUrl = new URL(request.url);
    controllerUrl.searchParams.set("featured", "true");
    controllerUrl.searchParams.set("limit", limit.toString());
    controllerUrl.searchParams.set("offset", "0");

    // Créer une nouvelle requête avec les bons searchParams
    const modifiedRequest = new NextRequest(controllerUrl.toString(), {
      method: "GET",
      headers: request.headers,
    });

    const controller = new CatalogueController();
    const response = await controller.getAllCatalogues(modifiedRequest);
    const data = await response.json();

    logger.info("🔍 Données reçues du controller", "Controller", {
      hasData: !!data,
      success: data.success,
      hasCatalogues: data.data?.catalogues,
      cataloguesCount: data.data?.catalogues?.length || 0,
    });

    if (!data.success || !data.data || !data.data.catalogues) {
      logger.warn("⚠️ Format de réponse inattendu du controller");
      return NextResponse.json([]);
    }

    // Transformer les données du format Catalogue vers le format CatalogItem attendu par l'interface
    const catalogItems = data.data.catalogues.map(
      (catalogue: {
        id: string;
        category: string;
        subcategory: string | null;
        marketingTitle: string | null;
        marketingSubtitle: string | null;
        marketingDescription: string | null;
        marketingPrice: number | null;
        originalPrice: number | null;
        badgeText: string | null;
        badgeColor: string | null;
        promotionText: string | null;
        targetAudience: string | null;
        isFeatured: boolean;
        isNewOffer: boolean;
      }) => {
        // Mapping intelligent des données
        const categoryTitles = {
          DEMENAGEMENT: "Déménagement",
          MENAGE: "Ménage",
          TRANSPORT: "Transport",
          LIVRAISON: "Livraison",
        };

        const title =
          catalogue.marketingTitle ||
          `${categoryTitles[catalogue.category as keyof typeof categoryTitles]} ${catalogue.subcategory || ""}`.trim();

        const subtitle =
          catalogue.marketingSubtitle ||
          (catalogue.category === "DEMENAGEMENT"
            ? "Service de déménagement professionnel"
            : catalogue.category === "MENAGE"
              ? "Service de nettoyage personnalisé"
              : catalogue.category === "TRANSPORT"
                ? "Transport sécurisé d'objets"
                : "Service de livraison rapide");

        return {
          id: catalogue.id,
          catalogId: catalogue.id, // Utiliser l'ID comme catalogId pour la navigation
          title,
          subtitle,
          description: catalogue.marketingDescription || subtitle,
          price: catalogue.marketingPrice || 0,
          originalPrice: catalogue.originalPrice || undefined,
          duration:
            catalogue.category === "DEMENAGEMENT"
              ? 4
              : catalogue.category === "MENAGE"
                ? 3
                : 2,
          workers:
            catalogue.category === "DEMENAGEMENT"
              ? 3
              : catalogue.category === "MENAGE"
                ? 2
                : 1,
          features: [
            "Service professionnel",
            "Prix transparents",
            "Équipe qualifiée",
          ],
          includedDistance: catalogue.category === "DEMENAGEMENT" ? 30 : 0,
          distanceUnit: "km",
          isFeatured: catalogue.isFeatured || false,
          isNewOffer: catalogue.isNewOffer || false,
          badgeText:
            catalogue.badgeText ||
            (catalogue.isFeatured ? "Populaire" : undefined),
          badgeColor:
            catalogue.badgeColor ||
            (catalogue.isFeatured ? "#f97316" : undefined),
          promotionText: catalogue.promotionText || undefined,
          category: catalogue.category,
          subcategory: catalogue.subcategory || "standard",
          targetAudience: catalogue.targetAudience || "particuliers",
          type: "service" as const,
        };
      },
    );

    return NextResponse.json(catalogItems);
  } catch (error) {
    logger.error("❌ Erreur dans GET /api/catalogue/featured", "Error", error);

    // En cas d'erreur, retourner un tableau vide pour éviter de casser l'interface
    return NextResponse.json([]);
  }
}
