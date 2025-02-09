import { dateUtils } from '../dateUtils'

describe('dateUtils', () => {
  const testDate = new Date('2024-03-20T14:30:00Z')

  describe('format', () => {
    it('formats date in short format', () => {
      expect(dateUtils.format(testDate, 'short')).toBe('20/03/2024')
    })

    it('formats date in long format', () => {
      expect(dateUtils.format(testDate, 'long')).toBe('March 20, 2024')
    })

    it('formats date in file format', () => {
      expect(dateUtils.format(testDate, 'file')).toBe('2024-03-20')
    })

    it('handles string date input', () => {
      expect(dateUtils.format('2024-03-20T14:30:00Z', 'short')).toBe('20/03/2024')
    })

    it('throws error for invalid date', () => {
      expect(() => dateUtils.format('invalid-date', 'short')).toThrow()
    })
  })

  describe('isValidDate', () => {
    it('returns true for valid dates', () => {
      expect(dateUtils.isValidDate('2024-03-20')).toBe(true)
      expect(dateUtils.isValidDate(new Date())).toBe(true)
    })

    it('returns false for invalid dates', () => {
      expect(dateUtils.isValidDate('invalid-date')).toBe(false)
      expect(dateUtils.isValidDate('2024-13-45')).toBe(false)
    })
  })
}) 