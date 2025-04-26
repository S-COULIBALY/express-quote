import { Pack } from '../../domain/entities/Pack';
import { Money } from '../../domain/valueObjects/Money';

export class PackFactory {
  createPack(data: any): Pack {
    return new Pack(
      data.id,
      data.name,
      data.type,
      data.description,
      new Money(data.price),
      data.includes || [],
      data.bookingId,
      data.customOptions || {}
    );
  }

  updatePack(pack: Pack, data: any): Pack {
    return new Pack(
      pack.getId(),
      data.name || pack.getName(),
      data.type || pack.getType(),
      data.description || pack.getDescription(),
      data.price ? new Money(data.price) : pack.getPrice(),
      data.includes || pack.getIncludedItems(),
      pack.getBookingId(),
      data.customOptions || pack.getCustomOptions()
    );
  }
} 