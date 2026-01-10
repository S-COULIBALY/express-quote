import { logger } from '@/lib/logger';

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  details?: any;
  retryable?: boolean;
  recoveryActions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export class QuoteRequestError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly retryable: boolean;
  public readonly details?: any;

  constructor(
    code: string,
    message: string,
    userMessage: string,
    retryable: boolean = false,
    details?: any
  ) {
    super(message);
    this.name = 'QuoteRequestError';
    this.code = code;
    this.userMessage = userMessage;
    this.retryable = retryable;
    this.details = details;
  }
}

export const ErrorCodes = {
  // Erreurs de QuoteRequest
  QUOTE_NOT_FOUND: 'QUOTE_NOT_FOUND',
  QUOTE_EXPIRED: 'QUOTE_EXPIRED',
  QUOTE_ALREADY_CONVERTED: 'QUOTE_ALREADY_CONVERTED',
  INVALID_QUOTE_DATA: 'INVALID_QUOTE_DATA',
  
  // Erreurs de validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PHONE: 'INVALID_PHONE',
  
  // Erreurs de paiement
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_TIMEOUT: 'PAYMENT_TIMEOUT',
  PAYMENT_CANCELLED: 'PAYMENT_CANCELLED',
  
  // Erreurs système
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Erreurs de session
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Erreurs de service
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
} as const;

export const createQuoteRequestError = (
  code: keyof typeof ErrorCodes,
  details?: any
): QuoteRequestError => {
  switch (code) {
    case 'QUOTE_NOT_FOUND':
      return new QuoteRequestError(
        code,
        'Quote request not found',
        'Ce devis n\'existe pas ou a été supprimé.',
        false,
        details
      );
      
    case 'QUOTE_EXPIRED':
      return new QuoteRequestError(
        code,
        'Quote request has expired',
        'Ce devis a expiré. Vous pouvez créer un nouveau devis.',
        false,
        details
      );
      
    case 'QUOTE_ALREADY_CONVERTED':
      return new QuoteRequestError(
        code,
        'Quote request already converted to booking',
        'Ce devis a déjà été confirmé. Vous ne pouvez pas le confirmer à nouveau.',
        false,
        details
      );
      
    case 'VALIDATION_ERROR':
      return new QuoteRequestError(
        code,
        'Validation error',
        'Veuillez vérifier les informations saisies.',
        true,
        details
      );
      
    case 'MISSING_REQUIRED_FIELDS':
      return new QuoteRequestError(
        code,
        'Required fields missing',
        'Veuillez remplir tous les champs obligatoires.',
        true,
        details
      );
      
    case 'PAYMENT_FAILED':
      return new QuoteRequestError(
        code,
        'Payment failed',
        'Le paiement a échoué. Veuillez réessayer.',
        true,
        details
      );
      
    case 'NETWORK_ERROR':
      return new QuoteRequestError(
        code,
        'Network error',
        'Problème de connexion. Vérifiez votre connexion internet.',
        true,
        details
      );
      
    case 'SERVER_ERROR':
      return new QuoteRequestError(
        code,
        'Server error',
        'Erreur technique temporaire. Veuillez réessayer dans quelques minutes.',
        true,
        details
      );
      
    case 'SERVICE_UNAVAILABLE':
      return new QuoteRequestError(
        code,
        'Service unavailable',
        'Service temporairement indisponible. Réessayez plus tard.',
        true,
        details
      );
      
    default:
      return new QuoteRequestError(
        'UNKNOWN_ERROR',
        'Unknown error',
        'Une erreur inattendue s\'est produite.',
        true,
        details
      );
  }
};

export const handleApiError = (error: any): QuoteRequestError => {
  logger.error('API Error:', error);
  
  if (error instanceof QuoteRequestError) {
    return error;
  }
  
  // Analyser les erreurs HTTP
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 400:
        if (data?.code === 'QUOTE_EXPIRED') {
          return createQuoteRequestError('QUOTE_EXPIRED', data);
        }
        return createQuoteRequestError('VALIDATION_ERROR', data);
        
      case 401:
        return createQuoteRequestError('UNAUTHORIZED', data);
        
      case 404:
        return createQuoteRequestError('QUOTE_NOT_FOUND', data);
        
      case 429:
        return createQuoteRequestError('RATE_LIMIT_EXCEEDED', data);
        
      case 500:
        return createQuoteRequestError('SERVER_ERROR', data);
        
      case 503:
        return createQuoteRequestError('SERVICE_UNAVAILABLE', data);
        
      default:
        return createQuoteRequestError('SERVER_ERROR', data);
    }
  }
  
  // Analyser les erreurs fetch
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return createQuoteRequestError('NETWORK_ERROR', error);
  }
  
  // Analyser les erreurs de validation
  if (error.name === 'ValidationError') {
    return createQuoteRequestError('VALIDATION_ERROR', error);
  }
  
  // Erreur inconnue
  return createQuoteRequestError('SERVER_ERROR', error);
};

export const isRetryableError = (error: any): boolean => {
  if (error instanceof QuoteRequestError) {
    return error.retryable;
  }
  
  return false;
};

export const getErrorMessage = (error: any): string => {
  if (error instanceof QuoteRequestError) {
    return error.userMessage;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Une erreur inattendue s\'est produite.';
};

export const logError = (error: any, context?: string) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    details: error.details,
    context
  };
  
  const logMessage = `Application Error${context ? ` (${context})` : ''}: ${JSON.stringify(errorData, null, 2)}`;
  logger.error(logMessage);
  
  // En production, envoyer à un service de monitoring
  if (process.env.NODE_ENV === 'production') {
    // Exemple: Sentry, LogRocket, etc.
    // Sentry.captureException(error, { extra: errorData });
  }
};

export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, context);
      throw handleApiError(error);
    }
  }) as T;
};

export const formatErrorForUser = (error: any): {
  title: string;
  message: string;
  actions: Array<{
    label: string;
    variant: 'default' | 'outline' | 'destructive';
    action: () => void;
  }>;
} => {
  const appError = error instanceof QuoteRequestError ? error : handleApiError(error);

  const baseActions = [
    {
      label: 'Accueil',
      variant: 'outline' as const,
      action: () => { window.location.href = '/'; }
    }
  ];

  switch (appError.code) {
    case 'QUOTE_EXPIRED':
      return {
        title: 'Devis expiré',
        message: appError.userMessage,
        actions: [
          {
            label: 'Nouveau devis',
            variant: 'default' as const,
            action: () => { window.location.href = '/catalogue'; }
          },
          ...baseActions
        ]
      };

    case 'QUOTE_NOT_FOUND':
      return {
        title: 'Devis introuvable',
        message: appError.userMessage,
        actions: [
          {
            label: 'Créer un devis',
            variant: 'default' as const,
            action: () => { window.location.href = '/catalogue'; }
          },
          ...baseActions
        ]
      };

    case 'NETWORK_ERROR':
      return {
        title: 'Problème de connexion',
        message: appError.userMessage,
        actions: [
          {
            label: 'Réessayer',
            variant: 'default' as const,
            action: () => { window.location.reload(); }
          },
          ...baseActions
        ]
      };

    default:
      return {
        title: 'Erreur',
        message: appError.userMessage,
        actions: appError.retryable ? [
          {
            label: 'Réessayer',
            variant: 'default' as const,
            action: () => { window.location.reload(); }
          },
          ...baseActions
        ] : baseActions
      };
  }
};

/**
 * Options pour le retry automatique
 */
interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff?: boolean;
}

/**
 * Retry automatique avec backoff exponentiel
 * Utilisé par useUnifiedSubmission pour retry automatique
 */
export const retryAsync = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Ne pas retry sur les erreurs de validation
      if (error instanceof QuoteRequestError && !error.retryable) {
        throw error;
      }

      // Si ce n'est pas la dernière tentative, attendre avant de réessayer
      if (attempt < options.maxAttempts) {
        const delayMs = options.backoff
          ? options.delay * attempt
          : options.delay;

        console.log(`⚠️ Tentative ${attempt}/${options.maxAttempts} échouée. Nouvelle tentative dans ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}; 