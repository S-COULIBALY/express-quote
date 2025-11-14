import { useState, useEffect } from 'react';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { RuleType } from '@/quotation/domain/enums/RuleType';
import { movingConstraintsFallback, movingServicesFallback } from '@/data/fallbacks/movingFallback';
import { cleaningConstraintsFallback, cleaningServicesFallback } from '@/data/fallbacks/cleaningFallback';
import { rulesCache, initializeRulesNameMap } from '@/lib/caches';
import { logger } from '@/lib/logger';

interface UseUnifiedRulesOptions {
  ruleType: RuleType;
  serviceType: ServiceType;
  condition?: {
    type?: 'pickup' | 'delivery';
    scope?: 'GLOBAL' | 'PICKUP' | 'DELIVERY' | 'BOTH';
  };
  enabled?: boolean; // ✅ Nouveau: permet de désactiver le hook
}

export const useUnifiedRules = ({ ruleType, serviceType, condition, enabled = true }: UseUnifiedRulesOptions) => {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(enabled); // Ne pas charger si désactivé
  const [error, setError] = useState<Error | null>(null);

  // Fonction pour obtenir les règles de fallback selon le type et le service
  const getFallbackRules = () => {
    if (serviceType === ServiceType.MOVING || serviceType === ServiceType.PACKING) {
      return ruleType === RuleType.CONSTRAINT ? movingConstraintsFallback : movingServicesFallback;
    } else if (serviceType === ServiceType.CLEANING) {
      return ruleType === RuleType.CONSTRAINT ? cleaningConstraintsFallback : cleaningServicesFallback;
    }
    return [];
  };

  // Fonction pour filtrer les règles selon la condition et le service
  const filterRulesByCondition = (rules: any[]) => {
    if (!rules) return [];

    console.log('🔍 [useUnifiedRules] Début filtrage:', {
      totalRules: rules.length,
      serviceType,
      ruleType,
      condition,
      rulesParService: rules.reduce((acc, r) => {
        acc[r.serviceType] = (acc[r.serviceType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });

    // 1. Filtrer par type de service
    let filteredRules = rules.filter(rule => rule.serviceType === serviceType);

    console.log(`🔧 [useUnifiedRules] Filtrage par serviceType="${serviceType}":`, {
      avant: rules.length,
      après: filteredRules.length,
      règlesExclues: rules.filter(r => r.serviceType !== serviceType).map(r => ({
        name: r.name,
        serviceType: r.serviceType
      }))
    });

    // 2. Filtrer par type de règle (contrainte vs service)
    filteredRules = filteredRules.filter(rule => {
      const isConstraint = rule.metadata?.category_frontend === 'constraint';
      return ruleType === RuleType.CONSTRAINT ? isConstraint : !isConstraint;
    });

    console.log(`✅ Après filtrage par service (${serviceType}) et type (${ruleType}):`, {
      rulesCount: filteredRules.length,
      services: filteredRules.map(r => r.serviceType),
      types: filteredRules.map(r => r.metadata?.category_frontend)
    });

    // 2. Appliquer les conditions supplémentaires si présentes
    if (condition) {
      // ✅ Filtrer par scope si spécifié
      if (condition.scope) {
        filteredRules = filteredRules.filter(rule => {
          return rule.scope === condition.scope || rule.scope === 'BOTH' || rule.scope === 'GLOBAL';
        });
        
        console.log(`🎯 Filtrage par scope="${condition.scope}":`, {
          avant: filteredRules.length,
          après: filteredRules.length,
          règlesAvecScope: filteredRules.filter(r => r.scope).length
        });
      }
      
      // Pour les contraintes d'accès (pickup/delivery), on ne filtre pas par type
      // car ces règles s'appliquent à tous les types d'accès
      if (condition.type === 'pickup' || condition.type === 'delivery') {
        // Ne pas filtrer par type, toutes les règles sont valides
        console.log('✅ Pas de filtrage par condition pour pickup/delivery - toutes les règles sont valides');
      } else {
        // Pour les autres conditions, vérifier la correspondance exacte
        filteredRules = filteredRules.filter(rule => {
          return JSON.stringify(rule.condition) === JSON.stringify(condition);
        });
        console.log('✅ Après filtrage par condition:', {
          condition,
          rulesCount: filteredRules.length,
          conditions: filteredRules.map(r => r.condition)
        });
      }
    }

    console.log('✅ Résultat final du filtrage:', {
      rulesCount: filteredRules.length,
      rules: filteredRules.map(r => ({
        name: r.name,
        service: r.serviceType,
        type: r.ruleType,
        condition: r.condition
      }))
    });

    return filteredRules;
  };

  useEffect(() => {
    // ✅ Si disabled, ne rien faire
    if (!enabled) {
      setLoading(false);
      setRules([]);
      return;
    }

    const loadRules = async () => {
      try {
        setLoading(true);

        // Charger d'abord les fallbacks
        const fallbackRules = getFallbackRules();

        // ✅ 1. Créer une clé de cache STABLE incluant le scope
        const conditionType = condition?.type || 'none';
        const conditionScope = condition?.scope || 'none';
        const cacheKey = `rules-${ruleType}-${serviceType}-${conditionType}-${conditionScope}`;

        // 🔍 DEBUG: Vérifier l'état du cache avec timestamp et stack trace
        const debugInfo = {
          timestamp: new Date().toISOString(),
          cacheKey,
          cacheSize: rulesCache.size(),
          hasCached: rulesCache.has(cacheKey),
          ruleType,
          serviceType,
          conditionType,
          componentStack: new Error().stack?.split('\n')[2] || 'unknown'
        };
        console.log('🔍 [useUnifiedRules] Cache check:', debugInfo);

        // ✅ 2. Vérifier le cache
        const cached = rulesCache.get(cacheKey);
        if (cached) {
          const age = rulesCache.getAge(cacheKey);
          console.log(`📦 [useUnifiedRules] Cache HIT: ${cacheKey} (age: ${Math.round((age || 0) / 1000)}s, items: ${cached.length})`);
          logger.debug(`📦 Cache hit: ${cacheKey} (age: ${Math.round((age || 0) / 1000)}s)`);

          setRules(cached);
          setLoading(false);
          setError(null);

          // ✅ 3. Rafraîchir en arrière-plan (stale-while-revalidate)
          refreshInBackground(cacheKey);
          return;
        }

        console.log(`🔄 [useUnifiedRules] Cache MISS: ${cacheKey}`, {
          allCacheKeys: Array.from(rulesCache['cache'].keys()),
          cacheEntries: rulesCache.size()
        });

        // ✅ 4. Cache miss, fetch depuis l'API
        logger.debug(`🔄 Cache miss: ${cacheKey}`);

        try {
          // Tenter de charger depuis l'API
          const payload = {
            ruleType: ruleType.toString(),
            serviceType: serviceType.toString(),
            condition
          };

          logger.debug(`🚀 Sending API request: ${JSON.stringify(payload)}`);

          const response = await fetch('/api/rules/unified', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data) && data.length > 0) {
              logger.info(`✅ Règles chargées depuis l'API: ${data.length}`);

              // ✅ Initialiser le cache de mapping UUID → Name
              initializeRulesNameMap(data);

              const filteredData = filterRulesByCondition(data);

              // ✅ 5. Mettre en cache
              rulesCache.set(cacheKey, filteredData);
              logger.debug(`✅ Cache set: ${cacheKey}`);

              setRules(filteredData);
              setError(null);
              return;
            }
          }
          throw new Error('Invalid API response');
        } catch (apiError) {
          logger.warn(`⚠️ Erreur API, utilisation des fallbacks: ${apiError}`);
          // En cas d'erreur API, continuer avec les fallbacks
        }

        // Utiliser les fallbacks
        logger.debug(`📦 Utilisation des fallbacks: ${fallbackRules.length}`);
        const filteredRules = filterRulesByCondition(fallbackRules);
        logger.debug(`📦 Règles filtrées: ${filteredRules.length}`);

        setRules(filteredRules);
        setError(null);
      } catch (err) {
        logger.error(`❌ Erreur critique: ${err}`);
        setError(err as Error);
        setRules([]);
      } finally {
        setLoading(false);
      }
    };

    // ✅ 6. Fonction pour rafraîchir en arrière-plan (stale-while-revalidate)
    const refreshInBackground = async (cacheKey: string) => {
      try {
        const payload = {
          ruleType: ruleType.toString(),
          serviceType: serviceType.toString(),
          condition
        };

        const response = await fetch('/api/rules/unified', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data) && data.length > 0) {
            const filteredData = filterRulesByCondition(data);

            // Mettre à jour le cache silencieusement
            rulesCache.set(cacheKey, filteredData);
            logger.debug(`🔄 Cache updated in background: ${cacheKey}`);

            // Optionnel: Mettre à jour les rules affichées
            setRules(filteredData);
          }
        }
      } catch (error) {
          logger.warn(`⚠️ Background refresh failed: ${error}`);
        // Ne pas propager l'erreur, le cache actuel reste valide
      }
    };

    loadRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleType, serviceType, condition?.type, enabled]); // ✅ Ajouter enabled aux deps

  return { rules, loading, error };
};
