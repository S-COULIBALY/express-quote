export class VolumeCalculator {
  private static readonly BASE_VOLUMES = {
    studio: 15,
    apartment: 25,
    house: 40
  };

  private static readonly ROOM_VOLUME = 8;
  private static readonly OCCUPANT_VOLUME = 5;

  calculateVolume(propertyType: string, rooms: number, occupants: number): number {
    const baseVolume = this.calculateBaseVolume(propertyType);
    const roomVolume = this.calculateRoomVolume(rooms);
    const occupantVolume = this.calculateOccupantVolume(occupants);

    return baseVolume + roomVolume + occupantVolume;
  }

  private calculateBaseVolume(propertyType: string): number {
    return VolumeCalculator.BASE_VOLUMES[propertyType as keyof typeof VolumeCalculator.BASE_VOLUMES] || 
           VolumeCalculator.BASE_VOLUMES.apartment;
  }

  private calculateRoomVolume(rooms: number): number {
    return Math.max(0, rooms - 1) * VolumeCalculator.ROOM_VOLUME;
  }

  private calculateOccupantVolume(occupants: number): number {
    return Math.max(0, occupants - 1) * VolumeCalculator.OCCUPANT_VOLUME;
  }
} 