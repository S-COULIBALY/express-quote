export interface MovingContext {
  pickupAddress: string;
  deliveryAddress: string;
  movingDate: string;
  volume?: number;
  propertyType: string;
  surface: number;
  rooms: number;
  occupants: number;
  pickupFloor: number;
  deliveryFloor: number;
  pickupElevator: boolean;
  deliveryElevator: boolean;
  pickupCarryDistance: number;
  deliveryCarryDistance: number;
  options?: {
    packaging?: boolean;
    furniture?: boolean;
    fragile?: boolean;
    storage?: boolean;
  };
} 