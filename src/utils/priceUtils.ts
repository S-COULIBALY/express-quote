type Currency = 'EUR' | 'USD' | 'CHF'

const currencyFormats: Record<Currency, Intl.NumberFormatOptions> = {
  EUR: { style: 'currency', currency: 'EUR' },
  USD: { style: 'currency', currency: 'USD' },
  CHF: { style: 'currency', currency: 'CHF' }
}

export const priceUtils = {
  format(amount: number, currency: Currency = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', currencyFormats[currency]).format(amount)
  },

  calculateTotal(amount: number, taxRate = 7.7): {
    tax: number
    total: number
  } {
    const tax = amount * taxRate / 100
    return {
      tax,
      total: amount + tax
    }
  },

  calculateDeposit(amount: number): number {
    return amount * 0.3 // 30% de dépôt
  },

  calculateTax(amount: number, rate = 7.7): number {
    return Math.round((amount * rate) / 100)
  },

  formatWithTax(amount: number, currency: Currency = 'EUR', taxRate = 7.7): {
    subtotal: string
    tax: string
    total: string
  } {
    const { tax, total } = this.calculateTotal(amount, taxRate)
    return {
      subtotal: this.format(amount, currency),
      tax: this.format(tax, currency),
      total: this.format(total, currency)
    }
  },

  // Utile pour les calculs de prix au m²
  calculateAreaPrice(
    squareMeters: number,
    pricePerMeter: number,
    minimumPrice: number
  ): number {
    const calculatedPrice = squareMeters * pricePerMeter
    return Math.max(calculatedPrice, minimumPrice)
  },

  // Arrondir à l'intervalle le plus proche (ex: 10, 50, 100)
  roundToNearest(amount: number, interval = 10): number {
    return Math.ceil(amount / interval) * interval
  }
} 