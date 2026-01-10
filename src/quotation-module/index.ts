/**
 * Point d'entrée principal du système de devis modulaire
 *
 * Architecture en 2 étapes :
 * 1. /api/quotation/calculate → BaseCostEngine → baseCost
 * 2. /api/quotation/multi-offers → MultiQuoteService.generateMultipleQuotesFromBaseCost()
 */

// Core
export * from './core';
export * from './core/ModuleRegistry';

// Multi-offres
export * from './multi-offers/QuoteScenario';
export * from './multi-offers/MultiQuoteService';

// Contrôleur HTTP
export * from './interfaces/http/controllers/QuoteController';

// Scénarios standards prédéfinis
export { STANDARD_SCENARIOS } from './multi-offers/QuoteScenario';
