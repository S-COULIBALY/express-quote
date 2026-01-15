/**
 * Barrel file for domain layer
 * Simplifies imports across the application
 *
 * Note: L'ancien système de règles (RuleEngine, Rule, MovingRules) a été supprimé.
 * Le nouveau système de calcul utilise quotation-module.
 */

// Configuration
export * from './configuration'
export * from './configuration/ConfigurationKey'
export * from './configuration/DefaultValues'
export * from './configuration/DefaultConfigurations'

// Entities
export * from './entities/QuoteRequest'

// Value Objects
export * from './valueObjects/Quote'
export * from './valueObjects/QuoteContext'
export * from './valueObjects/Money'

// Errors
export * from './errors/BookingErrors'
