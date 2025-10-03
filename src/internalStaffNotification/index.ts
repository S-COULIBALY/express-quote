/**
 * 👥 Module de notification équipe interne
 *
 * Exports publics du module internalStaffNotification
 */

export {
  InternalStaffNotificationService,
  type InternalStaffNotificationData,
  type NotificationResult
} from './InternalStaffNotificationService';

// Types utilitaires pour l'importation
export type InternalStaffNotificationModule = {
  InternalStaffNotificationService: typeof InternalStaffNotificationService;
};

export default InternalStaffNotificationService;