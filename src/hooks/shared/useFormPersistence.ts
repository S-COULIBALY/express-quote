'use client';

import { useCallback, useEffect, useState } from 'react';

interface FormPersistenceOptions {
  serviceType: string;
  serviceId?: string;
  maxAge?: number; // en millisecondes, défaut 24h
}

interface StoredData {
  data: any;
  timestamp: number;
}

/**
 * Hook pour gérer la persistance des données de formulaire
 * Sauvegarde automatiquement les données dans localStorage
 * et les restaure au chargement du composant
 */
export const useFormPersistence = (options: FormPersistenceOptions) => {
  const { serviceType, serviceId = 'default', maxAge = 24 * 60 * 60 * 1000 } = options;
  
  const [isDataSaved, setIsDataSaved] = useState(false);
  const storageKey = `form_data_${serviceType}_${serviceId}`;

  // Récupérer les données sauvegardées
  const getStoredData = useCallback((): any => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: StoredData = JSON.parse(stored);
        
        // Vérifier l'âge des données
        if (parsed.timestamp && (Date.now() - parsed.timestamp) < maxAge) {
          return parsed.data;
        } else {
          // Nettoyer les données expirées
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération des données sauvegardées:', error);
      localStorage.removeItem(storageKey);
    }
    
    return null;
  }, [storageKey, maxAge]);

  // Sauvegarder les données
  const saveData = useCallback((data: any) => {
    if (typeof window === 'undefined') return;
    
    try {
      const dataToStore: StoredData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
      setIsDataSaved(true);
      
      // Reset l'indicateur après 2 secondes
      setTimeout(() => setIsDataSaved(false), 2000);
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde des données:', error);
    }
  }, [storageKey]);

  // Nettoyer les données sauvegardées
  const clearData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Erreur lors du nettoyage des données:', error);
    }
  }, [storageKey]);

  // Nettoyer automatiquement les données expirées au montage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: StoredData = JSON.parse(stored);
        if (parsed.timestamp && (Date.now() - parsed.timestamp) >= maxAge) {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      // Ignorer les erreurs de parsing
    }
  }, [storageKey, maxAge]);

  return {
    getStoredData,
    saveData,
    clearData,
    isDataSaved
  };
};
