import { useState, useEffect, useCallback, useRef } from 'react';
import { useAbandonTracking } from '@/lib/abandonTracking';
import { logger } from '@/lib/logger';

export interface FormWithAbandonTrackingConfig {
  formId: string;
  formType: 'moving' | 'cleaning' | 'delivery' | 'generic';
  autoSaveInterval?: number; // en millisecondes
  abandonDetectionDelay?: number; // en millisecondes
  onAbandonDetected?: (stage: string, data: any) => void;
  onFormRecovered?: (data: any) => void;
}

export interface FormProgress {
  completion: number;
  timeSpent: number;
  lastSaved: Date;
  isRecovered: boolean;
}

export const useFormWithAbandonTracking = (config: FormWithAbandonTrackingConfig) => {
  const {
    formId,
    formType,
    autoSaveInterval = 10000, // 10 secondes par défaut
    abandonDetectionDelay = 30000, // 30 secondes par défaut
    onAbandonDetected,
    onFormRecovered
  } = config;

  const abandonTracker = useAbandonTracking();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [progress, setProgress] = useState<FormProgress>({
    completion: 0,
    timeSpent: 0,
    lastSaved: new Date(),
    isRecovered: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Refs pour les timers
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abandonTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const lastActivityRef = useRef<number>(Date.now());

  // Initialisation du tracking
  useEffect(() => {
    // Démarrer le tracking du formulaire
    abandonTracker.startTracking('form_filling', {
      formId,
      formType
    });

    // Récupérer un éventuel progrès existant
    loadExistingProgress();

    // Écouter les événements de restauration
    const handleRestore = (event: CustomEvent) => {
      if (event.detail.formId === formId) {
        restoreFormProgress(event.detail.progress);
      }
    };

    window.addEventListener('restoreFormProgress', handleRestore as EventListener);

    return () => {
      // Nettoyer les timers
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      if (abandonTimerRef.current) {
        clearTimeout(abandonTimerRef.current);
      }

      window.removeEventListener('restoreFormProgress', handleRestore as EventListener);
    };
  }, [formId, formType]);

  // Auto-sauvegarde
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      if (Object.keys(formData).length > 0) {
        saveFormProgress();
      }
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, autoSaveInterval]);

  // Détection d'abandon
  useEffect(() => {
    const resetAbandonTimer = () => {
      if (abandonTimerRef.current) {
        clearTimeout(abandonTimerRef.current);
      }

      abandonTimerRef.current = setTimeout(() => {
        const completion = calculateCompletion(formData);
        
        // Déclencher la détection d'abandon
        if (completion > 0) {
          const stage = completion > 50 ? 'form_partial' : 'form_incomplete';
          
          abandonTracker.trackFormAbandon(formId, formData);
          
          if (onAbandonDetected) {
            onAbandonDetected(stage, {
              formId,
              formData,
              completion,
              timeSpent: Date.now() - startTimeRef.current
            });
          }
        }
      }, abandonDetectionDelay);
    };

    resetAbandonTimer();
    lastActivityRef.current = Date.now();

    return () => {
      if (abandonTimerRef.current) {
        clearTimeout(abandonTimerRef.current);
      }
    };
  }, [formData, abandonDetectionDelay, onAbandonDetected]);

  /**
   * Charger un progrès existant
   */
  const loadExistingProgress = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Vérifier localement d'abord
      const localProgress = abandonTracker.getFormProgress(formId);
      if (localProgress) {
        restoreFormProgress(localProgress);
        return;
      }

      // Vérifier sur le serveur
      const response = await fetch(`/api/analytics/form-progress?formId=${formId}`);
      if (response.ok) {
        const { data } = await response.json();
        if (data && !data.isExpired) {
          restoreFormProgress(data);
        }
      }
    } catch (error) {
      logger.error('Erreur lors du chargement du progrès existant:', error);
    } finally {
      setIsLoading(false);
    }
  }, [formId]);

  /**
   * Restaurer le progrès du formulaire
   */
  const restoreFormProgress = useCallback((progressData: any) => {
    setFormData(progressData.fields);
    setProgress({
      completion: progressData.completion,
      timeSpent: progressData.timeSpent,
      lastSaved: new Date(progressData.lastUpdated),
      isRecovered: true
    });

    if (onFormRecovered) {
      onFormRecovered(progressData);
    }

    logger.info(`📋 Progrès restauré pour formulaire ${formId}`, {
      completion: progressData.completion,
      timeSpent: progressData.timeSpent
    });
  }, [formId, onFormRecovered]);

  /**
   * Sauvegarder le progrès du formulaire
   */
  const saveFormProgress = useCallback(async () => {
    try {
      setIsSaving(true);
      
      const completion = calculateCompletion(formData);
      const timeSpent = Date.now() - startTimeRef.current;
      
      // Sauvegarder localement
      abandonTracker.autoSaveForm(formId, formData);
      
      // Sauvegarder sur le serveur si assez de progrès
      if (completion >= 20) {
        await fetch('/api/analytics/form-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formId,
            fields: formData,
            completion,
            timeSpent,
            lastUpdated: new Date()
          })
        });
      }

      setProgress(prev => ({
        ...prev,
        completion,
        timeSpent,
        lastSaved: new Date()
      }));

    } catch (error) {
      logger.error('Erreur lors de la sauvegarde du progrès:', error);
    } finally {
      setIsSaving(false);
    }
  }, [formId, formData]);

  /**
   * Mettre à jour un champ du formulaire
   */
  const updateField = useCallback((fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Réinitialiser le timer d'abandon
    lastActivityRef.current = Date.now();
  }, []);

  /**
   * Mettre à jour plusieurs champs
   */
  const updateFields = useCallback((updates: Record<string, any>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
    
    // Réinitialiser le timer d'abandon
    lastActivityRef.current = Date.now();
  }, []);

  /**
   * Finaliser le formulaire (succès)
   */
  const completeForm = useCallback(async () => {
    try {
      // Marquer le formulaire comme terminé
      abandonTracker.completeStage('form_filling', {
        formId,
        completion: 100,
        timeSpent: Date.now() - startTimeRef.current
      });

      // Nettoyer le progrès sauvegardé
      abandonTracker.clearFormProgress(formId);
      
      // Nettoyer sur le serveur
      await fetch(`/api/analytics/form-progress?formId=${formId}`, {
        method: 'DELETE'
      });

      logger.info(`✅ Formulaire ${formId} terminé avec succès`);

    } catch (error) {
      logger.error('Erreur lors de la finalisation du formulaire:', error);
    }
  }, [formId]);

  /**
   * Abandonner explicitement le formulaire
   */
  const abandonForm = useCallback((reason?: string) => {
    const completion = calculateCompletion(formData);
    const stage = completion > 50 ? 'form_partial' : 'form_incomplete';
    
    abandonTracker.recordAbandon(stage, {
      formId,
      formData,
      completion,
      reason
    });

    logger.info(`🚫 Formulaire ${formId} abandonné (${reason || 'manuel'})`);
  }, [formId, formData]);

  /**
   * Obtenir les statistiques du formulaire
   */
  const getFormStats = useCallback(() => {
    const completion = calculateCompletion(formData);
    const timeSpent = Date.now() - startTimeRef.current;
    const timeSinceLastActivity = Date.now() - lastActivityRef.current;
    
    return {
      completion,
      timeSpent,
      timeSinceLastActivity,
      fieldsCount: Object.keys(formData).length,
      filledFields: Object.values(formData).filter(value => 
        value !== null && value !== undefined && value !== ''
      ).length,
      isIdle: timeSinceLastActivity > 60000, // 1 minute
      riskLevel: getRiskLevel(completion, timeSinceLastActivity)
    };
  }, [formData]);

  /**
   * Calculer le pourcentage de completion
   */
  const calculateCompletion = useCallback((data: Record<string, any>): number => {
    const totalFields = getExpectedFieldsCount(formType);
    const filledFields = Object.values(data).filter(value => 
      value !== null && value !== undefined && value !== ''
    ).length;
    
    return Math.round((filledFields / totalFields) * 100);
  }, [formType]);

  /**
   * Obtenir le nombre de champs attendus selon le type
   */
  const getExpectedFieldsCount = (type: string): number => {
    const fieldCounts = {
      'moving': 15,
      'cleaning': 10,
      'delivery': 8,
      'generic': 5
    };
    
    return fieldCounts[type as keyof typeof fieldCounts] || 5;
  };

  /**
   * Obtenir le niveau de risque d'abandon
   */
  const getRiskLevel = (completion: number, timeSinceLastActivity: number): 'low' | 'medium' | 'high' => {
    if (completion < 20) return 'low';
    if (completion > 70) return 'high';
    if (timeSinceLastActivity > 120000) return 'high'; // 2 minutes
    return 'medium';
  };

  return {
    // État du formulaire
    formData,
    progress,
    isLoading,
    isSaving,
    
    // Actions
    updateField,
    updateFields,
    completeForm,
    abandonForm,
    saveFormProgress,
    
    // Utilitaires
    getFormStats,
    
    // Flags
    hasProgress: Object.keys(formData).length > 0,
    isRecovered: progress.isRecovered,
    completion: progress.completion,
    timeSpent: progress.timeSpent
  };
};

// Hook simplifié pour les formulaires basiques
export const useFormAutoSave = (formId: string, formType: string) => {
  return useFormWithAbandonTracking({
    formId,
    formType: formType as any,
    autoSaveInterval: 15000, // 15 secondes
    abandonDetectionDelay: 60000 // 1 minute
  });
}; 