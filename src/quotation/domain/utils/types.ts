export type Currency = 'EUR' | 'USD' | 'GBP';

export type ActivityType = 'moving' | 'cleaning';

export interface PriceModifier {
  type: string;
  value: number;
  description: string;
}

export interface DateRange {
  startDate: Date;
  endDate?: Date;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Dimensions {
  width: number;
  height: number;
  length: number;
}

export type FrequencyType = 'oneTime' | 'weekly' | 'biweekly' | 'monthly'; 