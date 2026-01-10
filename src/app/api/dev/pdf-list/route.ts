/**
 * 🔧 ENDPOINT DE DÉVELOPPEMENT - Liste des PDF disponibles
 * 
 * GET /api/dev/pdf-list
 * 
 * Liste tous les PDF générés pour faciliter la navigation et la prévisualisation.
 * 
 * ⚠️ À utiliser UNIQUEMENT en mode développement
 * 
 * Query params :
 * - ?limit=10 : Limite le nombre de résultats
 * - ?type=bookings|attributions : Filtre par type
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '@/lib/logger';

// Vérifier si on est en mode développement
const isDevelopment = process.env.NODE_ENV === 'development';

interface PDFFile {
  name: string;
  path: string;
  previewUrl: string;
  size: number;
  sizeFormatted: string;
  modified: Date;
  type: 'booking' | 'attribution' | 'other';
}

function findPDFFiles(dir: string, basePath: string = '', maxDepth: number = 3, currentDepth: number = 0): PDFFile[] {
  const files: PDFFile[] = [];

  if (currentDepth >= maxDepth || !fs.existsSync(dir)) {
    return files;
  }

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        // Récursif pour les sous-dossiers
        files.push(...findPDFFiles(fullPath, relativePath, maxDepth, currentDepth + 1));
      } else if (entry.isFile() && entry.name.endsWith('.pdf')) {
        const stats = fs.statSync(fullPath);
        const type = basePath.includes('bookings') ? 'booking' 
                   : basePath.includes('attributions') ? 'attribution' 
                   : 'other';

        files.push({
          name: entry.name,
          path: relativePath,
          previewUrl: `/api/dev/pdf-preview/${relativePath.replace(/\\/g, '/')}`,
          size: stats.size,
          sizeFormatted: `${Math.round(stats.size / 1024)}KB`,
          modified: stats.mtime,
          type
        });
      }
    }
  } catch (error) {
    logger.warn('Erreur lors de la lecture du répertoire', { dir, error });
  }

  return files;
}

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const typeFilter = searchParams.get('type') as 'bookings' | 'attributions' | null;

    // Chemins de stockage possibles
    const storagePaths = [
      { path: process.env.PDF_STORAGE_PATH || './storage/documents', name: 'documents' },
      { path: process.env.PROFESSIONAL_PDF_STORAGE_PATH || './storage/professional-documents', name: 'professional-documents' }
    ];

    let allFiles: PDFFile[] = [];

    // Chercher dans tous les chemins de stockage
    for (const storage of storagePaths) {
      const fullPath = path.join(process.cwd(), storage.path);
      
      if (fs.existsSync(fullPath)) {
        const files = findPDFFiles(fullPath, '', 3);
        allFiles.push(...files);
      }
    }

    // Filtrer par type si demandé
    if (typeFilter) {
      allFiles = allFiles.filter(file => {
        if (typeFilter === 'bookings') return file.type === 'booking';
        if (typeFilter === 'attributions') return file.type === 'attribution';
        return true;
      });
    }

    // Trier par date de modification (plus récents en premier)
    allFiles.sort((a, b) => b.modified.getTime() - a.modified.getTime());

    // Limiter les résultats
    const limitedFiles = allFiles.slice(0, limit);

    logger.info('📋 Liste des PDF générée', {
      total: allFiles.length,
      returned: limitedFiles.length,
      typeFilter
    });

    return NextResponse.json({
      success: true,
      data: {
        files: limitedFiles,
        total: allFiles.length,
        returned: limitedFiles.length,
        limit,
        typeFilter
      },
      _dev: {
        note: 'Utilisez ?limit=10&type=bookings pour filtrer',
        previewExample: limitedFiles[0]?.previewUrl || 'Aucun PDF disponible'
      }
    });

  } catch (error) {
    logger.error('❌ Erreur lors de la liste des PDF', {
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la liste des PDF',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

