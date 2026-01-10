/**
 * 🔧 ENDPOINT DE DÉVELOPPEMENT - Prévisualisation PDF
 * 
 * GET /api/dev/pdf-preview/[path]
 * 
 * Permet de visualiser directement les PDF générés dans le navigateur
 * pour faciliter le développement et l'ajustement de la mise en page.
 * 
 * ⚠️ À utiliser UNIQUEMENT en mode développement
 * 
 * Exemple d'utilisation :
 * - http://localhost:3000/api/dev/pdf-preview/bookings/abc123/facture_xyz.pdf
 * - http://localhost:3000/api/dev/pdf-preview/attributions/def456/mission_abc.pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '@/lib/logger';

// Vérifier si on est en mode développement
const isDevelopment = process.env.NODE_ENV === 'development';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Sécurité : bloquer en production
  if (!isDevelopment) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Cet endpoint est uniquement disponible en mode développement' 
      },
      { status: 403 }
    );
  }

  try {
    const filePath = params.path.join('/');
    
    // Chemins de stockage possibles
    const storagePaths = [
      process.env.PDF_STORAGE_PATH || './storage/documents',
      process.env.PROFESSIONAL_PDF_STORAGE_PATH || './storage/professional-documents',
      './storage/documents',
      './storage/professional-documents'
    ];

    let pdfBuffer: Buffer | null = null;
    let foundPath: string | null = null;

    // Chercher le fichier dans tous les chemins de stockage
    for (const basePath of storagePaths) {
      const fullPath = path.join(process.cwd(), basePath, filePath);
      
      if (fs.existsSync(fullPath)) {
        pdfBuffer = fs.readFileSync(fullPath);
        foundPath = fullPath;
        break;
      }
    }

    if (!pdfBuffer) {
      logger.warn('📄 PDF non trouvé pour prévisualisation', {
        requestedPath: filePath,
        searchedPaths: storagePaths
      });

      return NextResponse.json(
        { 
          success: false, 
          error: 'PDF non trouvé',
          searchedPaths: storagePaths,
          requestedPath: filePath
        },
        { status: 404 }
      );
    }

    logger.info('👁️ Prévisualisation PDF', {
      path: filePath,
      foundAt: foundPath,
      size: `${Math.round(pdfBuffer.length / 1024)}KB`
    });

    // Retourner le PDF avec headers pour visualisation dans le navigateur
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${path.basename(filePath)}"`, // inline = afficher dans le navigateur
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache',
        'X-Dev-Preview': 'true',
        'X-Found-Path': foundPath || ''
      }
    });

  } catch (error) {
    logger.error('❌ Erreur lors de la prévisualisation PDF', {
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      path: params.path
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la prévisualisation PDF',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

