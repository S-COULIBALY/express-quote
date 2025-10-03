// ✅ SYSTÈME DE PRÉCHARGEMENT INTELLIGENT
// Précharge les contraintes et optimise les performances des modaux

import { loadConstraintsWithCache, loadAllConstraintsWithCache } from './constraints-cache';
import { performanceTracker } from './performance-metrics';

interface PreloadConfig {
  enableBackgroundPreload: boolean;
  preloadDelay: number;
  priorityServices: ('moving' | 'cleaning')[];
  enablePredictivePreload: boolean;
}

class ConstraintsPreloader {
  private config: PreloadConfig;
  private preloadPromises = new Map<string, Promise<any>>();
  private isPreloading = false;

  constructor(config?: Partial<PreloadConfig>) {
    this.config = {
      enableBackgroundPreload: true,
      preloadDelay: 2000, // 2 secondes après le chargement initial
      priorityServices: ['moving', 'cleaning'],
      enablePredictivePreload: true,
      ...config
    };
  }

  // ✅ DÉMARRER LE PRÉCHARGEMENT AUTOMATIQUE
  startBackgroundPreload(): void {
    if (!this.config.enableBackgroundPreload || this.isPreloading) {
      return;
    }

    this.isPreloading = true;
    console.log('🚀 [PRELOADER] Démarrage du préchargement en arrière-plan');

    // Attendre un délai avant de commencer le préchargement
    setTimeout(() => {
      this.preloadAllConstraints();
    }, this.config.preloadDelay);
  }

  // ✅ PRÉCHARGER TOUTES LES CONTRAINTES
  async preloadAllConstraints(): Promise<void> {
    if (this.preloadPromises.has('all-constraints')) {
      return this.preloadPromises.get('all-constraints');
    }

    const preloadPromise = this.executePreloadAll();
    this.preloadPromises.set('all-constraints', preloadPromise);

    try {
      await preloadPromise;
      console.log('✅ [PRELOADER] Préchargement complet terminé');
    } catch (error) {
      console.warn('⚠️ [PRELOADER] Erreur lors du préchargement:', error);
    }
  }

  private async executePreloadAll(): Promise<void> {
    performanceTracker.startTimer('preload-all-constraints');

    try {
      // Utiliser l'API groupée pour charger toutes les contraintes d'un coup
      await loadAllConstraintsWithCache();

      const metric = performanceTracker.endTimer(
        'preload-all-constraints',
        'cache',
        true,
        { strategy: 'bulk-load' }
      );

      console.log(`📊 [PRELOADER] Toutes les contraintes préchargées en ${metric.duration.toFixed(2)}ms`);

    } catch (error) {
      performanceTracker.endTimer('preload-all-constraints', 'cache', false, { error: String(error) });
      throw error;
    }
  }

  // ✅ PRÉCHARGER UN SERVICE SPÉCIFIQUE
  async preloadService(serviceType: 'moving' | 'cleaning'): Promise<void> {
    if (this.preloadPromises.has(serviceType)) {
      return this.preloadPromises.get(serviceType);
    }

    const preloadPromise = this.executePreloadService(serviceType);
    this.preloadPromises.set(serviceType, preloadPromise);

    try {
      await preloadPromise;
      console.log(`✅ [PRELOADER] Service ${serviceType} préchargé`);
    } catch (error) {
      console.warn(`⚠️ [PRELOADER] Erreur préchargement ${serviceType}:`, error);
    }
  }

  private async executePreloadService(serviceType: 'moving' | 'cleaning'): Promise<void> {
    performanceTracker.startTimer(`preload-${serviceType}`);

    try {
      await loadConstraintsWithCache(serviceType);

      const metric = performanceTracker.endTimer(
        `preload-${serviceType}`,
        'cache',
        true,
        { strategy: 'individual-load' }
      );

      console.log(`📊 [PRELOADER] Service ${serviceType} préchargé en ${metric.duration.toFixed(2)}ms`);

    } catch (error) {
      performanceTracker.endTimer(`preload-${serviceType}`, 'cache', false, { error: String(error) });
      throw error;
    }
  }

  // ✅ PRÉCHARGEMENT PRÉDICTIF BASÉ SUR L'ACTIVITÉ UTILISATEUR
  handleUserActivity(activity: {
    page?: string;
    action?: string;
    serviceType?: 'moving' | 'cleaning';
  }): void {
    if (!this.config.enablePredictivePreload) {
      return;
    }

    // Prédictions basées sur l'activité
    if (activity.page?.includes('moving') || activity.serviceType === 'moving') {
      this.preloadService('moving');
    }

    if (activity.page?.includes('cleaning') || activity.serviceType === 'cleaning') {
      this.preloadService('cleaning');
    }

    // Si l'utilisateur navigue vers une page de devis, précharger tout
    if (activity.page?.includes('quote') || activity.action === 'start-quote') {
      this.preloadAllConstraints();
    }
  }

  // ✅ VÉRIFIER LE STATUT DU PRÉCHARGEMENT
  getPreloadStatus(): {
    isPreloading: boolean;
    preloadedServices: string[];
    pendingPreloads: string[];
  } {
    const preloadedServices: string[] = [];
    const pendingPreloads: string[] = [];

    this.preloadPromises.forEach((promise, key) => {
      // Vérifier si la promesse est résolue (méthode approximative)
      const isResolved = promise === promise.then(() => promise, () => promise);
      if (isResolved) {
        preloadedServices.push(key);
      } else {
        pendingPreloads.push(key);
      }
    });

    return {
      isPreloading: this.isPreloading,
      preloadedServices,
      pendingPreloads
    };
  }

  // ✅ NETTOYER LES PROMESSES TERMINÉES
  cleanup(): void {
    const expiredKeys: string[] = [];

    this.preloadPromises.forEach((promise, key) => {
      promise.finally(() => {
        expiredKeys.push(key);
      });
    });

    // Supprimer les promesses expirées après un délai
    setTimeout(() => {
      expiredKeys.forEach(key => {
        this.preloadPromises.delete(key);
      });
    }, 5000);
  }
}

// ✅ INSTANCE SINGLETON DU PRÉCHARGEUR
export const constraintsPreloader = new ConstraintsPreloader();

// ✅ HOOK REACT POUR LE PRÉCHARGEMENT
export function useConstraintsPreloader() {
  return {
    startBackgroundPreload: () => constraintsPreloader.startBackgroundPreload(),
    preloadService: (serviceType: 'moving' | 'cleaning') =>
      constraintsPreloader.preloadService(serviceType),
    preloadAll: () => constraintsPreloader.preloadAllConstraints(),
    trackActivity: (activity: any) => constraintsPreloader.handleUserActivity(activity),
    getStatus: () => constraintsPreloader.getPreloadStatus()
  };
}

// ✅ FONCTIONS UTILITAIRES POUR L'OPTIMISATION

// Démarrer le préchargement automatiquement si on est côté client
if (typeof window !== 'undefined') {
  // Attendre que la page soit complètement chargée
  if (document.readyState === 'complete') {
    constraintsPreloader.startBackgroundPreload();
  } else {
    window.addEventListener('load', () => {
      constraintsPreloader.startBackgroundPreload();
    });
  }

  // Nettoyer périodiquement
  setInterval(() => {
    constraintsPreloader.cleanup();
  }, 30000); // Toutes les 30 secondes
}

// ✅ OPTIMISATION POUR LES PAGES SPÉCIFIQUES
export function optimizeForPage(pageName: string): void {
  const optimizations: Record<string, () => void> = {
    'moving': () => constraintsPreloader.preloadService('moving'),
    'cleaning': () => constraintsPreloader.preloadService('cleaning'),
    'quote': () => constraintsPreloader.preloadAllConstraints(),
    'home': () => constraintsPreloader.startBackgroundPreload()
  };

  const optimization = optimizations[pageName];
  if (optimization) {
    console.log(`🎯 [PRELOADER] Optimisation pour la page: ${pageName}`);
    optimization();
  }
}

// ✅ DÉTECTER LES INTERACTIONS UTILISATEUR POUR LE PRÉCHARGEMENT PRÉDICTIF
if (typeof window !== 'undefined') {
  // Écouter les survols de boutons et liens
  document.addEventListener('mouseover', (event) => {
    const target = event.target as HTMLElement;

    if (target.closest('[data-service-type]')) {
      const serviceType = target.closest('[data-service-type]')?.getAttribute('data-service-type');
      if (serviceType === 'moving' || serviceType === 'cleaning') {
        constraintsPreloader.preloadService(serviceType);
      }
    }

    if (target.closest('[data-preload="all"]')) {
      constraintsPreloader.preloadAllConstraints();
    }
  });
}