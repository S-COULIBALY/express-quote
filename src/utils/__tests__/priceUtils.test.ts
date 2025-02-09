import { priceUtils } from '../priceUtils'

describe('priceUtils', () => {
  describe('format', () => {
    it('formats price with currency symbol', () => {
      expect(priceUtils.format(1234.56)).toBe('CHF 1,234.56')
    })

    it('formats price with two decimal places', () => {
      expect(priceUtils.format(1234)).toBe('CHF 1,234.00')
    })

    it('handles zero', () => {
      expect(priceUtils.format(0)).toBe('CHF 0.00')
    })

    it('handles negative numbers', () => {
      expect(priceUtils.format(-1234.56)).toBe('-CHF 1,234.56')
    })
  })

  describe('calculateTotal', () => {
    it('calculates total with tax', () => {
      const result = priceUtils.calculateTotal(100)
      expect(result.tax).toBe(7.7)
      expect(result.total).toBe(107.7)
    })

    it('handles zero amount', () => {
      const result = priceUtils.calculateTotal(0)
      expect(result.tax).toBe(0)
      expect(result.total).toBe(0)
    })
  })

  describe('calculateDeposit', () => {
    it('calculates deposit amount', () => {
      expect(priceUtils.calculateDeposit(1000)).toBe(300)
    })

    it('handles zero amount', () => {
      expect(priceUtils.calculateDeposit(0)).toBe(0)
    })
  })
}) 