import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * API pour générer les fallbacks (contraintes et services) depuis la BDD
 * Appelle le script generate-fallbacks.ts et parse les résultats
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Début de la génération des fallbacks...');

    // Chemin vers le script generate-fallbacks.ts
    const scriptPath = path.join(process.cwd(), 'scripts', 'generate-fallbacks.ts');

    // Exécuter le script via tsx (TypeScript execution)
    const { stdout, stderr } = await execAsync(`npx tsx "${scriptPath}"`, {
      cwd: process.cwd(),
      env: { ...process.env },
      timeout: 60000 // 60 secondes max
    });

    console.log('📋 Sortie du script:', stdout);
    if (stderr) {
      console.warn('⚠️ Warnings:', stderr);
    }

    // Parser les statistiques depuis stdout
    let result = null;
    const resultMatch = stdout.match(/RESULT_JSON:\s*({.*})/);
    if (resultMatch) {
      try {
        result = JSON.parse(resultMatch[1]);
        console.log('📊 Résultats parsés:', result);
      } catch (parseError) {
        console.warn('⚠️ Impossible de parser le JSON de résultat:', parseError);
      }
    }

    console.log('✅ Génération des fallbacks terminée avec succès');

    // Si on a réussi à parser les résultats, les inclure dans la réponse
    if (result) {
      return NextResponse.json({
        success: true,
        message: `Fallbacks générés: ${result.movingTotal} items MOVING | ${result.cleaningTotal} items CLEANING`,
        stats: {
          moving: {
            constraints: result.movingConstraints,
            services: result.movingServices,
            total: result.movingTotal
          },
          cleaning: {
            constraints: result.cleaningConstraints,
            services: result.cleaningServices,
            total: result.cleaningTotal
          },
          filesGenerated: result.filesGenerated
        },
        output: stdout,
        warnings: stderr || null
      });
    } else {
      // Fallback si parsing échoue
      return NextResponse.json({
        success: true,
        message: 'Fallbacks générés avec succès',
        output: stdout,
        warnings: stderr || null
      });
    }

  } catch (error: any) {
    console.error('❌ Erreur lors de la génération des fallbacks:', error);

    return NextResponse.json({
      success: false,
      message: 'Erreur lors de la génération des fallbacks',
      error: error.message,
      details: error.stderr || error.stdout
    }, { status: 500 });
  }
}
