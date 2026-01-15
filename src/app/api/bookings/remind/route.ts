import { NextRequest, NextResponse } from 'next/server';
import { reminderSchedulerService } from '@/quotation/infrastructure/services/ReminderSchedulerService';
import { logger } from '@/lib/logger';

// Variable pour suivre l'état du planificateur
let isSchedulerRunning = false;

/**
 * GET /api/bookings/remind - Vérifier l'état du planificateur
 */
export async function GET() {
  logger.info('GET /api/bookings/remind');

  try {
    return NextResponse.json({
      success: true,
      data: {
        status: 'success',
        isRunning: isSchedulerRunning
      }
    });
  } catch (error) {
    logger.error('Erreur GET /api/bookings/remind:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings/remind - Démarrer/arrêter le planificateur
 */
export async function POST(request: NextRequest) {
  logger.info('POST /api/bookings/remind');

  try {
    const body = await request.json();
    const action = body.action || 'start';
    const intervalMinutes = body.intervalMinutes || 60; // 1 heure par défaut

    switch (action) {
      case 'start':
        if (!isSchedulerRunning) {
          reminderSchedulerService.startScheduler(intervalMinutes);
          isSchedulerRunning = true;
          console.log(`✅ Planificateur de rappels démarré (intervalle: ${intervalMinutes} minutes)`);

          return NextResponse.json({
            success: true,
            data: {
              status: 'success',
              message: `Planificateur de rappels démarré avec succès (intervalle: ${intervalMinutes} minutes)`,
              isRunning: true
            }
          });
        } else {
          return NextResponse.json({
            success: true,
            data: {
              status: 'info',
              message: "Le planificateur de rappels est déjà en cours d'exécution",
              isRunning: true
            }
          });
        }

      case 'stop':
        if (isSchedulerRunning) {
          reminderSchedulerService.stopScheduler();
          isSchedulerRunning = false;
          console.log('✅ Planificateur de rappels arrêté');

          return NextResponse.json({
            success: true,
            data: {
              status: 'success',
              message: 'Planificateur de rappels arrêté avec succès',
              isRunning: false
            }
          });
        } else {
          return NextResponse.json({
            success: true,
            data: {
              status: 'info',
              message: "Le planificateur de rappels n'était pas en cours d'exécution",
              isRunning: false
            }
          });
        }

      case 'run-once':
        await reminderSchedulerService.processReminders();
        console.log('✅ Exécution unique des rappels terminée');

        return NextResponse.json({
          success: true,
          data: {
            status: 'success',
            message: 'Exécution unique des rappels terminée avec succès',
            isRunning: isSchedulerRunning
          }
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Action non reconnue: ${action}. Utilisez 'start', 'stop' ou 'run-once'.`
          },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Erreur POST /api/bookings/remind:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
