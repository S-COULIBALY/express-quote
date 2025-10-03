import { Entity } from '../../../shared/domain/Entity';
import { ConfigurationCategory } from './ConfigurationKey';

/**
 * ============================================================================
 * ENTITÉ CONFIGURATION - Gestion centralisée des paramètres système
 * ============================================================================
 * 
 * 🎯 OBJECTIF :
 * Cette classe représente une configuration système avec gestion de version,
 * validité temporelle et traçabilité des modifications.
 * 
 * 📋 CARACTÉRISTIQUES :
 * 
 * ✅ VERSIONING : Chaque configuration a une période de validité
 * ✅ AUDIT : Traçabilité des modifications avec timestamps
 * ✅ ACTIVATION : Possibilité d'activer/désactiver les configurations
 * ✅ CATÉGORISATION : Organisation par catégories métier
 * ✅ IMMUTABILITÉ : Les objets sont immutables, création de nouvelles instances
 * 
 * 🔧 UTILISATION :
 * 
 * 1. CRÉATION :
 *    - Configuration.create() pour nouvelles configurations
 *    - Valeurs par défaut depuis DefaultValues.ts
 * 
 * 2. MODIFICATION :
 *    - update() pour changer la valeur
 *    - deactivate() pour désactiver
 *    - Création d'une nouvelle instance (immutabilité)
 * 
 * 3. VALIDATION :
 *    - isValid() pour vérifier la validité temporelle
 *    - Vérification des dates de début/fin
 * 
 * 📊 STRUCTURE :
 * 
 * - category : Type de configuration (PRICING, BUSINESS_RULES, etc.)
 * - key : Identifiant unique de la configuration
 * - value : Valeur de la configuration (any type)
 * - description : Description optionnelle
 * - isActive : Statut d'activation
 * - validFrom/validTo : Période de validité
 * - updatedAt : Timestamp de dernière modification
 * 
 * 🚀 AVANTAGES :
 * 
 * ✅ Historique : Conservation de l'historique des modifications
 * ✅ Rollback : Possibilité de revenir à une version précédente
 * ✅ A/B Testing : Comparaison de différentes configurations
 * ✅ Sécurité : Validation des périodes de validité
 * ✅ Performance : Cache des configurations valides
 */
export class Configuration extends Entity {
  private readonly _value: any;
  private readonly _description: string | null;
  private readonly _isActive: boolean;
  private readonly _validFrom: Date;
  private readonly _validTo: Date | null;
  private readonly _updatedAt: Date;
  private readonly _category: ConfigurationCategory;
  private readonly _key: string;

  constructor(
    id: string,
    category: ConfigurationCategory,
    key: string,
    value: any,
    description: string | null,
    isActive: boolean,
    validFrom: Date,
    validTo: Date | null,
    updatedAt: Date
  ) {
    super(id);
    this._category = category;
    this._key = key;
    this._value = value;
    this._description = description;
    this._isActive = isActive;
    this._validFrom = validFrom;
    this._validTo = validTo;
    this._updatedAt = updatedAt;
  }

  get category(): ConfigurationCategory {
    return this._category;
  }

  get key(): string {
    return this._key;
  }

  get value(): any {
    return this._value;
  }

  get description(): string | null {
    return this._description;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get validFrom(): Date {
    return new Date(this._validFrom);
  }

  get validTo(): Date | null {
    return this._validTo ? new Date(this._validTo) : null;
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  /**
   * VALIDATION TEMPORELLE - Vérifie si la configuration est valide à une date donnée
   * 
   * 🎯 UTILITÉ :
   * - Vérification de la période de validité
   * - Gestion des configurations expirées
   * - Support des tests avec dates spécifiques
   * 
   * ✅ CRITÈRES DE VALIDITÉ :
   * - Configuration active (isActive = true)
   * - Date >= validFrom
   * - Date <= validTo (si défini)
   * 
   * @param date Date de vérification (par défaut: maintenant)
   * @returns true si la configuration est valide à cette date
   */
  public isValid(date: Date = new Date()): boolean {
    if (!this._isActive) return false;
    if (date < this._validFrom) return false;
    if (this._validTo && date > this._validTo) return false;
    return true;
  }

  /**
   * FACTORY METHOD - Création d'une nouvelle configuration
   * 
   * 🎯 UTILITÉ :
   * - Création simplifiée avec valeurs par défaut
   * - Génération automatique des timestamps
   * - Configuration active par défaut
   * 
   * 📋 PARAMÈTRES :
   * - category : Catégorie de la configuration
   * - key : Clé unique de la configuration
   * - value : Valeur de la configuration
   * - description : Description optionnelle
   * - validFrom : Date de début (par défaut: maintenant)
   * - validTo : Date de fin (optionnelle)
   * 
   * @returns Nouvelle instance de Configuration
   */
  public static create(
    category: ConfigurationCategory,
    key: string,
    value: any,
    description?: string,
    validFrom: Date = new Date(),
    validTo?: Date
  ): Configuration {
    return new Configuration(
      '', // L'ID sera généré par la base de données
      category,
      key,
      value,
      description || null,
      true,
      validFrom,
      validTo || null,
      new Date()
    );
  }

  /**
   * MISE À JOUR - Création d'une nouvelle version de la configuration
   * 
   * 🎯 UTILITÉ :
   * - Modification de la valeur ou description
   * - Mise à jour de la date de fin
   * - Conservation de l'historique (immutabilité)
   * 
   * ⚠️ IMPORTANT :
   * - Crée une nouvelle instance (pas de modification directe)
   * - Met à jour le timestamp updatedAt
   * - Conserve l'ID et les autres propriétés
   * 
   * @param value Nouvelle valeur
   * @param description Nouvelle description (optionnelle)
   * @param validTo Nouvelle date de fin (optionnelle)
   * @returns Nouvelle instance avec les modifications
   */
  public update(value: any, description?: string, validTo?: Date): Configuration {
    return new Configuration(
      this.getId(),
      this._category,
      this._key,
      value,
      description || this._description,
      this._isActive,
      this._validFrom,
      validTo || this._validTo,
      new Date()
    );
  }

  /**
   * DÉSACTIVATION - Désactive la configuration
   * 
   * 🎯 UTILITÉ :
   * - Désactivation sans suppression
   * - Conservation de l'historique
   * - Possibilité de réactivation future
   * 
   * ⚠️ IMPORTANT :
   * - Crée une nouvelle instance inactive
   * - Met à jour le timestamp updatedAt
   * - Conserve toutes les autres propriétés
   * 
   * @returns Nouvelle instance désactivée
   */
  public deactivate(): Configuration {
    return new Configuration(
      this.getId(),
      this._category,
      this._key,
      this._value,
      this._description,
      false,
      this._validFrom,
      this._validTo,
      new Date()
    );
  }
} 