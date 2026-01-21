/**
 * 🔧 ENDPOINT DE DÉVELOPPEMENT - Prévisualisation PDF
 *
 * GET /api/dev/pdf-preview/[path]
 *
 * Permet de visualiser directement les PDF générés dans le navigateur
 * pour faciliter le développement et l'ajustement de la mise en page.
 *
 * ⚠️ À utiliser UNIQUEMENT en mode développement
 */

import { NextRequest, NextResponse } from "next/server";

// Route désactivée en production pour réduire la taille du bundle serverless
export async function GET(
  _request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  // En production, retourner 404 sans charger les dépendances lourdes
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { success: false, error: "Route disponible uniquement en développement" },
      { status: 404 },
    );
  }

  // Import dynamique uniquement en développement pour éviter d'inclure
  // fs et path dans le bundle serverless de production
  const fs = await import("fs");
  const path = await import("path");
  const { logger } = await import("@/lib/logger");

  try {
    const filePath = params.path.join("/");

    const storagePaths = [
      process.env.PDF_STORAGE_PATH || "./storage/documents",
      process.env.PROFESSIONAL_PDF_STORAGE_PATH ||
        "./storage/professional-documents",
      "./storage/documents",
      "./storage/professional-documents",
    ];

    let pdfBuffer: Buffer | null = null;
    let foundPath: string | null = null;

    for (const basePath of storagePaths) {
      const fullPath = path.join(process.cwd(), basePath, filePath);

      if (fs.existsSync(fullPath)) {
        pdfBuffer = fs.readFileSync(fullPath);
        foundPath = fullPath;
        break;
      }
    }

    if (!pdfBuffer) {
      logger.warn("📄 PDF non trouvé pour prévisualisation", {
        requestedPath: filePath,
        searchedPaths: storagePaths,
      });

      return NextResponse.json(
        { success: false, error: "PDF non trouvé" },
        { status: 404 },
      );
    }

    logger.info("👁️ Prévisualisation PDF", {
      path: filePath,
      foundAt: foundPath,
      size: `${Math.round(pdfBuffer.length / 1024)}KB`,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${path.basename(filePath)}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erreur lors de la prévisualisation PDF" },
      { status: 500 },
    );
  }
}
