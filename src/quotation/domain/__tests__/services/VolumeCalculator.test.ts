import { VolumeCalculator } from '../../services/VolumeCalculator';

describe('VolumeCalculator', () => {
  let calculator: VolumeCalculator;

  beforeEach(() => {
    calculator = new VolumeCalculator();
  });

  describe('calculateVolume', () => {
    it('should calculate volume for a studio', () => {
      const volume = calculator.calculateVolume('studio', 1, 1);
      expect(volume).toBe(15); // Base volume for studio
    });

    it('should calculate volume for an apartment', () => {
      const volume = calculator.calculateVolume('apartment', 3, 2);
      expect(volume).toBe(41); // Base (25) + 2 rooms (16) + 1 extra occupant (5)
    });

    it('should calculate volume for a house', () => {
      const volume = calculator.calculateVolume('house', 4, 3);
      expect(volume).toBe(64); // Base (40) + 3 rooms (24) + 2 extra occupants (10)
    });

    it('should use apartment as default for invalid property type', () => {
      const volume = calculator.calculateVolume('invalid', 2, 1);
      expect(volume).toBe(33); // Apartment base (25) + 1 room (8)
    });

    it('should handle zero rooms correctly', () => {
      const volume = calculator.calculateVolume('apartment', 0, 1);
      expect(volume).toBe(25); // Just base volume
    });

    it('should handle zero occupants correctly', () => {
      const volume = calculator.calculateVolume('apartment', 2, 0);
      expect(volume).toBe(33); // Base (25) + 1 room (8)
    });
  });
}); 