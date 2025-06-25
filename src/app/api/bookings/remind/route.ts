import { NextRequest, NextResponse } from 'next/server';
import { BaseApiController } from '@/quotation/interfaces/http/controllers/BaseApiController';
import { reminderSchedulerService } from '@/quotation/infrastructure/services/ReminderSchedulerService';

const controller = BaseApiController.getInstance();

// Variable pour suivre l'état du planificateur
let isSchedulerRunning = false;

/**
 * GET /api/bookings/remind - Vérifier l'état du planificateur
 */
export async function GET(request: NextRequest) {
  controller.logRequest('GET', '/api/bookings/remind');
  
  try {
    const response = {
      status: 'success',
      isRunning: isSchedulerRunning
    };
    
    return controller.successResponse(response);
  } catch (error) {
    return controller.handleError(error, 'GET /api/bookings/remind');
  }
}

/**
 * POST /api/bookings/remind - Démarrer/arrêter le planificateur
 */
export async function POST(request: NextRequest) {
  controller.logRequest('POST', '/api/bookings/remind');
  
  try {
    const { body, error } = await controller.parseRequestBody(request);
    if (error) return error;
    
    const action = body.action || 'start';
    const intervalMinutes = body.intervalMinutes || 60; // 1 heure par défaut
    
    switch (action) {
      case 'start':
        if (!isSchedulerRunning) {
          reminderSchedulerService.startScheduler(intervalMinutes);
          isSchedulerRunning = true;
          console.log(`✅ Planificateur de rappels démarré (intervalle: ${intervalMinutes} minutes)`);
          
          return controller.successResponse({
            status: 'success',
            message: `Planificateur de rappels démarré avec succès (intervalle: ${intervalMinutes} minutes)`,
            isRunning: true
          });
        } else {
          return controller.successResponse({
            status: 'info',
            message: 'Le planificateur de rappels est déjà en cours d\'exécution',
            isRunning: true
          });
        }
        
      case 'stop':
        if (isSchedulerRunning) {
          reminderSchedulerService.stopScheduler();
          isSchedulerRunning = false;
          console.log('✅ Planificateur de rappels arrêté');
          
          return controller.successResponse({
            status: 'success',
            message: 'Planificateur de rappels arrêté avec succès',
            isRunning: false
          });
        } else {
          return controller.successResponse({
            status: 'info',
            message: 'Le planificateur de rappels n\'était pas en cours d\'exécution',
            isRunning: false
          });
        }
        
      case 'run-once':
        await reminderSchedulerService.processReminders();
        console.log('✅ Exécution unique des rappels terminée');
        
        return controller.successResponse({
          status: 'success',
          message: 'Exécution unique des rappels terminée avec succès',
          isRunning: isSchedulerRunning
        });
        
      default:
        return NextResponse.json(
          { 
            status: 'error',
            message: `Action non reconnue: ${action}. Utilisez 'start', 'stop' ou 'run-once'.`
          },
          { status: 400 }
        );
    }
  } catch (error) {
    return controller.handleError(error, 'POST /api/bookings/remind');
  }
} 