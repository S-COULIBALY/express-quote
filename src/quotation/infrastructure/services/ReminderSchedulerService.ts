import { PrismaBookingRepository } from '../repositories/PrismaBookingRepository';
import { sendEmail } from '@/lib/sendEmail';
import { logger } from '@/lib/logger';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { emailRecipients } from '@/config/email-recipients';

// Logger
const reminderLogger = logger.withContext ? 
  logger.withContext('ReminderScheduler') : 
  {
    debug: (msg: string, ...args: any[]) => console.debug('[ReminderScheduler]', msg, ...args),
    info: (msg: string, ...args: any[]) => console.info('[ReminderScheduler]', msg, ...args),
    warn: (msg: string, ...args: any[]) => console.warn('[ReminderScheduler]', msg, ...args),
    error: (msg: string | Error, ...args: any[]) => console.error('[ReminderScheduler]', msg, ...args)
  };

/**
 * Service responsable de la planification et de l'envoi des rappels de rendez-vous
 */
export class ReminderSchedulerService {
  private bookingRepository: PrismaBookingRepository;
  private intervalId: NodeJS.Timeout | null = null;
  
  constructor(bookingRepository: PrismaBookingRepository) {
    this.bookingRepository = bookingRepository;
  }
  
  /**
   * Démarre le planificateur de rappels qui s'exécute périodiquement
   * @param intervalInMinutes Intervalle entre chaque vérification des rappels (en minutes)
   */
  startScheduler(intervalInMinutes: number = 60): void {
    // Si un planificateur est déjà en cours, l'arrêter d'abord
    if (this.intervalId) {
      this.stopScheduler();
    }
    
    reminderLogger.info(`Démarrage du planificateur de rappels (intervalle: ${intervalInMinutes} minutes)`);
    
    // Exécuter immédiatement une première fois
    this.processReminders();
    
    // Puis planifier les exécutions suivantes
    const intervalInMs = intervalInMinutes * 60 * 1000;
    this.intervalId = setInterval(() => this.processReminders(), intervalInMs);
  }
  
  /**
   * Arrête le planificateur de rappels
   */
  stopScheduler(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      reminderLogger.info('Planificateur de rappels arrêté');
    }
  }
  
  /**
   * Traite les rappels pour les réservations à venir
   */
  async processReminders(): Promise<void> {
    try {
      reminderLogger.info('Début du traitement des rappels');
      
      // Calcul des dates pour lesquelles on doit envoyer des rappels
      const today = new Date();
      const reminderDays = emailRecipients.reminderDays;
      const targetDates = reminderDays.map(days => addDays(today, days));
      
      reminderLogger.debug(
        `Recherche des réservations pour les dates: ${targetDates.map(d => format(d, 'dd/MM/yyyy')).join(', ')}`
      );
      
      // Récupérer toutes les réservations pour les dates cibles
      const bookings = await this.bookingRepository.findUpcomingBookings(targetDates);
      
      reminderLogger.info(`Nombre de réservations trouvées pour les rappels: ${bookings.length}`);
      
      // Si aucune réservation, rien à faire
      if (bookings.length === 0) {
        reminderLogger.info('Aucune réservation trouvée pour les rappels');
        return;
      }
      
      // Envoyer les rappels via le service d'email
      // TODO: Implémenter l'envoi des rappels de rendez-vous
      reminderLogger.info(`${bookings.length} rappels à envoyer`);
      
      reminderLogger.info('Traitement des rappels terminé avec succès');
    } catch (error) {
      reminderLogger.error('Erreur lors du traitement des rappels:', error);
    }
  }
}

// Export d'une instance unique pour utilisation globale
export const reminderSchedulerService = new ReminderSchedulerService(
  new PrismaBookingRepository()
); 