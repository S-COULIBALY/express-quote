import { QuoteType, QuoteStatus } from '../enums/QuoteType';
import { Money } from '../valueObjects/Money';
import { ServiceType } from '../enums/ServiceType';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface QuoteProps {
  id?: string;
  type: QuoteType;
  status: QuoteStatus;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  totalAmount: Money;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Assurance
  hasInsurance?: boolean;
  
  // Moving specific
  moveDate?: Date;
  pickupAddress?: string;
  deliveryAddress?: string;
  distance?: number;
  volume?: number;
  pickupFloor?: number;
  deliveryFloor?: number;
  pickupElevator?: boolean;
  deliveryElevator?: boolean;
  pickupCarryDistance?: number;
  deliveryCarryDistance?: number;
  propertyType?: string;
  surface?: number;
  rooms?: number;
  occupants?: number;
  
  // Pack specific
  packId?: string;
  packName?: string;
  scheduledDate?: Date;
  
  // Service specific
  serviceId?: string;
  serviceName?: string;
  description?: string;
  scheduledTime?: string;
  location?: string;
  
  // Options
  packagingOption?: boolean;
  furnitureOption?: boolean;
  fragileOption?: boolean;
  storageOption?: boolean;
  disassemblyOption?: boolean;
  unpackingOption?: boolean;
  suppliesOption?: boolean;
  fragileItemsOption?: boolean;
  
  // Costs
  baseCost?: number;
  volumeCost?: number;
  distancePrice?: number;
  optionsCost?: number;
  tollCost?: number;
  fuelCost?: number;
}

export class Quote {
  private readonly _id: string;
  private readonly _type: QuoteType;
  private readonly _status: QuoteStatus;
  private readonly _customer: QuoteProps['customer'];
  private readonly _totalAmount: Money;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;
  
  // Assurance
  private readonly _hasInsurance?: boolean;
  
  // Moving specific
  private readonly _moveDate?: Date;
  private readonly _pickupAddress?: string;
  private readonly _deliveryAddress?: string;
  private readonly _distance?: number;
  private readonly _volume?: number;
  private readonly _pickupFloor?: number;
  private readonly _deliveryFloor?: number;
  private readonly _pickupElevator?: boolean;
  private readonly _deliveryElevator?: boolean;
  private readonly _pickupCarryDistance?: number;
  private readonly _deliveryCarryDistance?: number;
  private readonly _propertyType?: string;
  private readonly _surface?: number;
  private readonly _rooms?: number;
  private readonly _occupants?: number;
  
  // Pack specific
  private readonly _packId?: string;
  private readonly _packName?: string;
  private readonly _scheduledDate?: Date;
  
  // Service specific
  private readonly _serviceId?: string;
  private readonly _serviceName?: string;
  private readonly _description?: string;
  private readonly _scheduledTime?: string;
  private readonly _location?: string;
  
  // Options
  private readonly _packagingOption?: boolean;
  private readonly _furnitureOption?: boolean;
  private readonly _fragileOption?: boolean;
  private readonly _storageOption?: boolean;
  private readonly _disassemblyOption?: boolean;
  private readonly _unpackingOption?: boolean;
  private readonly _suppliesOption?: boolean;
  private readonly _fragileItemsOption?: boolean;
  
  // Costs
  private readonly _baseCost?: number;
  private readonly _volumeCost?: number;
  private readonly _distancePrice?: number;
  private readonly _optionsCost?: number;
  private readonly _tollCost?: number;
  private readonly _fuelCost?: number;

  constructor(props: QuoteProps) {
    this._id = props.id || crypto.randomUUID();
    this._type = props.type;
    this._status = props.status;
    this._customer = props.customer;
    this._totalAmount = props.totalAmount;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
    
    // Assurance
    this._hasInsurance = props.hasInsurance;
    
    // Moving specific
    this._moveDate = props.moveDate;
    this._pickupAddress = props.pickupAddress;
    this._deliveryAddress = props.deliveryAddress;
    this._distance = props.distance;
    this._volume = props.volume;
    this._pickupFloor = props.pickupFloor;
    this._deliveryFloor = props.deliveryFloor;
    this._pickupElevator = props.pickupElevator;
    this._deliveryElevator = props.deliveryElevator;
    this._pickupCarryDistance = props.pickupCarryDistance;
    this._deliveryCarryDistance = props.deliveryCarryDistance;
    this._propertyType = props.propertyType;
    this._surface = props.surface;
    this._rooms = props.rooms;
    this._occupants = props.occupants;
    
    // Pack specific
    this._packId = props.packId;
    this._packName = props.packName;
    this._scheduledDate = props.scheduledDate;
    
    // Service specific
    this._serviceId = props.serviceId;
    this._serviceName = props.serviceName;
    this._description = props.description;
    this._scheduledTime = props.scheduledTime;
    this._location = props.location;
    
    // Options
    this._packagingOption = props.packagingOption;
    this._furnitureOption = props.furnitureOption;
    this._fragileOption = props.fragileOption;
    this._storageOption = props.storageOption;
    this._disassemblyOption = props.disassemblyOption;
    this._unpackingOption = props.unpackingOption;
    this._suppliesOption = props.suppliesOption;
    this._fragileItemsOption = props.fragileItemsOption;
    
    // Costs
    this._baseCost = props.baseCost;
    this._volumeCost = props.volumeCost;
    this._distancePrice = props.distancePrice;
    this._optionsCost = props.optionsCost;
    this._tollCost = props.tollCost;
    this._fuelCost = props.fuelCost;
  }

  // Getters
  get id(): string { return this._id; }
  get type(): QuoteType { return this._type; }
  get status(): QuoteStatus { return this._status; }
  get customer(): QuoteProps['customer'] { return this._customer; }
  get totalAmount(): Money { return this._totalAmount; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  
  // Assurance getter
  get hasInsurance(): boolean | undefined { return this._hasInsurance; }
  
  // Moving specific getters
  get moveDate(): Date | undefined { return this._moveDate; }
  get pickupAddress(): string | undefined { return this._pickupAddress; }
  get deliveryAddress(): string | undefined { return this._deliveryAddress; }
  get distance(): number | undefined { return this._distance; }
  get volume(): number | undefined { return this._volume; }
  get pickupFloor(): number | undefined { return this._pickupFloor; }
  get deliveryFloor(): number | undefined { return this._deliveryFloor; }
  get pickupElevator(): boolean | undefined { return this._pickupElevator; }
  get deliveryElevator(): boolean | undefined { return this._deliveryElevator; }
  get pickupCarryDistance(): number | undefined { return this._pickupCarryDistance; }
  get deliveryCarryDistance(): number | undefined { return this._deliveryCarryDistance; }
  get propertyType(): string | undefined { return this._propertyType; }
  get surface(): number | undefined { return this._surface; }
  get rooms(): number | undefined { return this._rooms; }
  get occupants(): number | undefined { return this._occupants; }
  
  // Pack specific getters
  get packId(): string | undefined { return this._packId; }
  get packName(): string | undefined { return this._packName; }
  get scheduledDate(): Date | undefined { return this._scheduledDate; }
  
  // Service specific getters
  get serviceId(): string | undefined { return this._serviceId; }
  get serviceName(): string | undefined { return this._serviceName; }
  get description(): string | undefined { return this._description; }
  get scheduledTime(): string | undefined { return this._scheduledTime; }
  get location(): string | undefined { return this._location; }
  
  // Options getters
  get packagingOption(): boolean | undefined { return this._packagingOption; }
  get furnitureOption(): boolean | undefined { return this._furnitureOption; }
  get fragileOption(): boolean | undefined { return this._fragileOption; }
  get storageOption(): boolean | undefined { return this._storageOption; }
  get disassemblyOption(): boolean | undefined { return this._disassemblyOption; }
  get unpackingOption(): boolean | undefined { return this._unpackingOption; }
  get suppliesOption(): boolean | undefined { return this._suppliesOption; }
  get fragileItemsOption(): boolean | undefined { return this._fragileItemsOption; }
  
  // Costs getters
  get baseCost(): number | undefined { return this._baseCost; }
  get volumeCost(): number | undefined { return this._volumeCost; }
  get distancePrice(): number | undefined { return this._distancePrice; }
  get optionsCost(): number | undefined { return this._optionsCost; }
  get tollCost(): number | undefined { return this._tollCost; }
  get fuelCost(): number | undefined { return this._fuelCost; }
} 