# Access Constraints Documentation

## Overview

The access constraints system allows users to specify access-related constraints for both pickup and delivery locations in moving services. This system is integrated with the unified rules management system for better maintainability and consistency.

## Components

### AccessConstraintsModal

The `AccessConstraintsModal` component provides a user interface for selecting and managing access constraints. It supports:

- Pickup location constraints
- Delivery location constraints
- Real-time validation
- Integration with the unified rules system

### Usage

```typescript
import { AccessConstraintsModal } from '@/components/form-generator/components/AccessConstraintsModal';

// For pickup location
<AccessConstraintsModal
  type="pickup"
  buttonLabel="Access Constraints - Pickup"
  modalTitle="Pickup Location Access Constraints"
  value={pickupConstraints}
  onChange={handlePickupConstraintsChange}
/>

// For delivery location
<AccessConstraintsModal
  type="delivery"
  buttonLabel="Access Constraints - Delivery"
  modalTitle="Delivery Location Access Constraints"
  value={deliveryConstraints}
  onChange={handleDeliveryConstraintsChange}
/>
```

## Integration with Form Generator

The access constraints are integrated into the form generator system through the `access-constraints` field type. Example configuration in a preset:

```typescript
{
  name: "pickupLogisticsConstraints",
  type: "access-constraints",
  label: "Pickup Access Constraints",
  componentProps: {
    type: "pickup",
    buttonLabel: "Configure Pickup Access",
    modalTitle: "Pickup Location Access"
  }
}
```

## Rules System

Access constraints are managed through the unified rules system. Rules are stored in the database with the following structure:

- Rule Type: CONSTRAINT
- Service Type: MOVING
- Condition: Contains the constraint type (pickup/delivery)

### Rule Configuration

Rules can be configured through the admin interface or directly in the database. Example SQL:

```sql
INSERT INTO rules (
  id,
  name,
  description,
  value,
  category,
  ruleType,
  serviceType,
  condition
)
VALUES (
  'access_pickup',
  'Pickup Access Constraints',
  'Access constraints for pickup location',
  0,
  'CONSTRAINT',
  'CONSTRAINT',
  'MOVING',
  '{"type": "pickup"}'
);
```

## Validation

Constraints are validated through the AccessConstraintsService, which ensures:

- All required constraints are specified
- Values are within acceptable ranges
- Constraints are compatible with the service type
- Rules are currently active (within valid date range)

## Error Handling

The system includes comprehensive error handling:

- Loading state indication
- Error messages for failed rule loading
- Validation error messages
- Network error handling

## Best Practices

1. Always validate constraints on both client and server side
2. Use the unified rules system for managing constraints
3. Keep constraint definitions in the database for easy updates
4. Implement proper error handling and user feedback
5. Test constraint validation thoroughly

## Testing

The system includes comprehensive tests:

- Unit tests for the AccessConstraintsModal component
- Integration tests with the rules system
- Validation logic tests
- Error handling tests

Run tests using:

```bash
npm test src/components/form-generator/components/__tests__/AccessConstraintsModal.test.tsx
```
