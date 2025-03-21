export enum CleaningFrequency {
  ONE_TIME = 'oneTime',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly'
}

export interface CleaningContext {
  cleaningType: 'standard' | 'deep' | 'movingOut' | 'postConstruction';
  squareMeters: number;
  numberOfRooms: number;
  numberOfBathrooms: number;
  frequency: CleaningFrequency;
  propertyState: string;
  hasBalcony: boolean;
  balconySize?: number;
  hasPets: boolean;
  options?: {
    windows?: boolean;
    laundry?: boolean;
    ironing?: boolean;
    dishes?: boolean;
  };
} 