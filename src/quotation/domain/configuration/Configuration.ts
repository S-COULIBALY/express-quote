import { Entity } from '../../../shared/domain/Entity';
import { ConfigurationCategory } from './ConfigurationKey';

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

  public isValid(date: Date = new Date()): boolean {
    if (!this._isActive) return false;
    if (date < this._validFrom) return false;
    if (this._validTo && date > this._validTo) return false;
    return true;
  }

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