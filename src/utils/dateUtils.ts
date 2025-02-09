// Formats de date disponibles
type DateFormat = 'short' | 'long' | 'file'

// Options pour le formatage des dates
const dateFormatOptions: Record<DateFormat, Intl.DateTimeFormatOptions> = {
  short: { day: '2-digit', month: '2-digit', year: 'numeric' },
  long: { day: 'numeric', month: 'long', year: 'numeric' },
  iso: { year: 'numeric', month: '2-digit', day: '2-digit' },
  time: { hour: '2-digit', minute: '2-digit' },
  datetime: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
}

export const dateUtils = {
  format(date: Date | string, format: DateFormat = 'short'): string {
    const d = new Date(date)
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date')
    }

    switch (format) {
      case 'short':
        return d.toLocaleDateString()
      case 'long':
        return d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      case 'file':
        return d.toISOString().split('T')[0]
      default:
        return d.toLocaleDateString()
    }
  },

  toISODate(date: Date): string {
    return date.toISOString().split('T')[0]
  },

  addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  },

  isWeekend(date: Date): boolean {
    const day = date.getDay()
    return day === 0 || day === 6
  },

  getAvailableTimeSlots(date: Date, duration = 60): string[] {
    const slots: string[] = []
    const start = 8 // 8:00
    const end = 18 // 18:00
    const interval = duration / 60 // en heures

    for (let hour = start; hour < end; hour += interval) {
      const hourStr = Math.floor(hour).toString().padStart(2, '0')
      const minuteStr = ((hour % 1) * 60).toString().padStart(2, '0')
      slots.push(`${hourStr}:${minuteStr}`)
    }

    return slots
  },

  isValidDate(date: Date | string): boolean {
    const d = new Date(date)
    return !isNaN(d.getTime())
  }
} 