import { DateRange } from './types';
import { PRICE_CONSTANTS } from './constants';

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isValidDateRange(range: DateRange): boolean {
  if (!range.endDate) return true;
  return range.startDate <= range.endDate;
}

export function calculateTax(amount: number): number {
  return amount * PRICE_CONSTANTS.TAX_RATE;
}

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatPrice(amount: number, currency: string = PRICE_CONSTANTS.DEFAULT_CURRENCY): string {
  return `${roundToTwoDecimals(amount)} ${currency}`;
} 