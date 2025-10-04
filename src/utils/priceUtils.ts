/**
 * ✅ MIGRÉ: Utilise des constantes au lieu de DefaultValues
 * Ces valeurs devraient provenir de l'API côté serveur pour les calculs critiques
 * Ici, ce sont juste des valeurs d'affichage/formatage côté client
 */

type Currency = "EUR" | "USD" | "CHF";

// ✅ Constantes extraites (valeurs par défaut pour l'affichage client)
const DEFAULT_VAT_RATE = 0.2; // 20% (vient de DefaultValues.VAT_RATE)
const DEFAULT_DEPOSIT_PERCENTAGE = 0.3; // 30% (vient de DefaultValues.DEPOSIT_PERCENTAGE)

const currencyFormats: Record<Currency, Intl.NumberFormatOptions> = {
  EUR: { style: "currency", currency: "EUR" },
  USD: { style: "currency", currency: "USD" },
  CHF: { style: "currency", currency: "CHF" },
};

export const priceUtils = {
  format(amount: number, currency: Currency = "EUR"): string {
    return new Intl.NumberFormat("fr-FR", currencyFormats[currency]).format(
      amount,
    );
  },

  calculateTotal(
    amount: number,
    taxRate = DEFAULT_VAT_RATE * 100,
  ): {
    tax: number;
    total: number;
  } {
    const tax = (amount * taxRate) / 100;
    return {
      tax,
      total: amount + tax,
    };
  },

  calculateDeposit(
    amount: number,
    depositPercentage = DEFAULT_DEPOSIT_PERCENTAGE,
  ): number {
    return amount * depositPercentage;
  },

  calculateTax(amount: number, rate = DEFAULT_VAT_RATE * 100): number {
    return Math.round((amount * rate) / 100);
  },

  formatWithTax(
    amount: number,
    currency: Currency = "EUR",
    taxRate = DEFAULT_VAT_RATE * 100,
  ): {
    subtotal: string;
    tax: string;
    total: string;
  } {
    const { tax, total } = this.calculateTotal(amount, taxRate);
    return {
      subtotal: this.format(amount, currency),
      tax: this.format(tax, currency),
      total: this.format(total, currency),
    };
  },

  // Utile pour les calculs de prix au m²
  calculateAreaPrice(
    squareMeters: number,
    pricePerMeter: number,
    minimumPrice: number,
  ): number {
    const calculatedPrice = squareMeters * pricePerMeter;
    return Math.max(calculatedPrice, minimumPrice);
  },

  // Arrondir à l'intervalle le plus proche (ex: 10, 50, 100)
  roundToNearest(amount: number, interval = 10): number {
    return Math.ceil(amount / interval) * interval;
  },
};
