type CardType = 'visa' | 'mastercard' | 'amex' | 'unknown'

export const cardUtils = {
  getCardType(number: string): CardType {
    const cleaned = number.replace(/\D/g, '')
    
    if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(cleaned)) return 'visa'
    if (/^5[1-5][0-9]{14}$/.test(cleaned)) return 'mastercard'
    if (/^3[47][0-9]{13}$/.test(cleaned)) return 'amex'
    
    return 'unknown'
  },

  formatCardNumber(number: string): string {
    const cleaned = number.replace(/\D/g, '')
    const groups = cleaned.match(/(\d{1,4})/g) || []
    return groups.join(' ').substr(0, 19)
  },

  formatExpiryDate(value: string): string {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`
    }
    return cleaned
  },

  validateCard(number: string): boolean {
    // Algorithme de Luhn
    const cleaned = number.replace(/\D/g, '')
    if (!/^\d+$/.test(cleaned)) return false
    
    let sum = 0
    let isEven = false
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i])
      
      if (isEven) {
        digit *= 2
        if (digit > 9) digit -= 9
      }
      
      sum += digit
      isEven = !isEven
    }
    
    return sum % 10 === 0
  }
} 