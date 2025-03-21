import { QuoteRequestDto } from '../../interfaces/http/dtos/QuoteRequestDto';
import { QuoteContextData } from '../../domain/valueObjects/QuoteContext';
import { ContactInfo } from '../../domain/valueObjects/ContactInfo';
import { Address } from '../../domain/valueObjects/Address';
import { ServiceType } from '../../domain/entities/Service';

export class QuoteAssembler {
    public static assembleContext(dto: QuoteRequestDto): QuoteContextData {
        return {
            ...dto,
            contact: this.createContact(dto.contact),
            ...(dto.serviceType === ServiceType.MOVING && {
                addresses: this.createAddresses(dto)
            })
        };
    }

    private static createContact(data: any): ContactInfo {
        return new ContactInfo(
            data.firstName,
            data.lastName,
            data.email,
            data.phone
        );
    }

    private static createAddresses(data: any): { pickup: Address; delivery: Address } {
        const pickupFloor = data.pickupFloor || 0;
        const deliveryFloor = data.deliveryFloor || 0;

        return {
            pickup: new Address(
                data.pickupAddress.street,
                data.pickupAddress.city,
                pickupFloor,
                data.pickupAddress.postalCode
            ),
            delivery: new Address(
                data.deliveryAddress.street,
                data.deliveryAddress.city,
                deliveryFloor,
                data.deliveryAddress.postalCode
            )
        };
    }
} 