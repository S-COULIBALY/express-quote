import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * API pour initialiser/réinitialiser les configurations système en BDD
 * Appelle le script init-system.ts et parse les résultats
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Début de l\'initialisation des configurations...');

    // Chemin vers le script init-system.ts
    const scriptPath = path.join(process.cwd(), 'scripts', 'init-system.ts');

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

    // Parser le JSON de résultat depuis stdout
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

    console.log('✅ Initialisation des configurations terminée avec succès');

    // Si on a réussi à parser les résultats, les inclure dans la réponse
    if (result) {
      return NextResponse.json({
        success: true,
        message: `${result.addedCount} configuration(s) ajoutée(s) | ${result.existingCount} déjà présente(s) | Total: ${result.totalCount}`,
        stats: {
          existingCount: result.existingCount,
          addedCount: result.addedCount,
          totalCount: result.totalCount,
          addedConfigs: result.addedConfigs
        },
        output: stdout,
        warnings: stderr || null
      });
    } else {
      // Fallback si parsing échoue
      return NextResponse.json({
        success: true,
        message: 'Configurations système initialisées avec succès',
        output: stdout,
        warnings: stderr || null
      });
    }

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'initialisation des configurations:', error);

    return NextResponse.json({
      success: false,
      message: 'Erreur lors de l\'initialisation des configurations',
      error: error.message,
      details: error.stderr || error.stdout
    }, { status: 500 });
  }
}
