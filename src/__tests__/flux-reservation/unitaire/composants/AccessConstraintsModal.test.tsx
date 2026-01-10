/**
 * 🧪 **TESTS UNITAIRES - AccessConstraintsModal**
 * 
 * Tests unitaires pour le composant AccessConstraintsModal
 * qui gère les contraintes et services supplémentaires par adresse.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccessConstraintsModal } from '@/components/form-generator/components/AccessConstraintsModal';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { RuleType } from '@/quotation/domain/enums/RuleType';

// Mock des dépendances
jest.mock('@/hooks/useUnifiedRules', () => ({
  useUnifiedRules: jest.fn()
}));

jest.mock('@/quotation/domain/services/AutoDetectionService', () => ({
  AutoDetectionService: {
    detectAutomaticConstraints: jest.fn(),
    detectFurnitureLift: jest.fn(),
    detectLongCarryingDistance: jest.fn(),
    validateConstraintSelection: jest.fn(),
    applyAutomaticConstraints: jest.fn(),
    getDetailedReasonsForFurnitureLift: jest.fn(),
    shouldWarnUser: jest.fn(),
    buildAddressDataFromForm: jest.fn()
  }
}));

jest.mock('@/components/form-generator/components/UnifiedRuleManagerDisplay', () => ({
  UnifiedRuleManagerDisplay: ({ onSelectionChange, selectedConstraints }: any) => (
    <div data-testid="unified-rule-manager">
      <button 
        data-testid="toggle-constraint-1"
        onClick={() => onSelectionChange('constraint-1', !selectedConstraints['constraint-1'])}
      >
        Toggle Constraint 1
      </button>
      <button 
        data-testid="toggle-constraint-2"
        onClick={() => onSelectionChange('constraint-2', !selectedConstraints['constraint-2'])}
      >
        Toggle Constraint 2
      </button>
      <button 
        data-testid="toggle-service-1"
        onClick={() => onSelectionChange('service-1', !selectedConstraints['service-1'])}
      >
        Toggle Service 1
      </button>
    </div>
  )
}));

import { useUnifiedRules } from '@/hooks/useUnifiedRules';
import { AutoDetectionService } from '@/quotation/domain/services/AutoDetectionService';

const mockUseUnifiedRules = useUnifiedRules as jest.Mock;
const mockAutoDetectionService = AutoDetectionService as jest.Mocked<typeof AutoDetectionService>;

// Données de test
const mockConstraintRules = [
  {
    id: 'constraint-1',
    name: 'Escalier difficile',
    description: 'Escalier difficile à monter',
    price: 50,
    type: 'CONSTRAINT',
    scope: 'BOTH' // ✅ Nouveau champ scope
  },
  {
    id: 'constraint-2',
    name: 'Couloirs étroits',
    description: 'Couloirs étroits',
    price: 30,
    type: 'CONSTRAINT',
    scope: 'BOTH' // ✅ Nouveau champ scope
  }
];

const mockServiceRules = [
  {
    id: 'service-1',
    name: 'Démontage de meubles',
    description: 'Démontage et remontage de meubles',
    price: 100,
    type: 'CUSTOM',
    scope: 'PICKUP' // ✅ Nouveau champ scope - démontage = pickup
  },
  {
    id: 'service-2',
    name: 'Emballage',
    description: 'Emballage et déballage',
    price: 80,
    type: 'CUSTOM',
    scope: 'PICKUP' // ✅ Nouveau champ scope - emballage = pickup
  }
];

describe('AccessConstraintsModal', () => {
  const defaultProps = {
    type: 'pickup' as const,
    buttonLabel: 'Contraintes de départ',
    modalTitle: 'Contraintes d\'accès - Départ',
    value: {},
    onChange: jest.fn(),
    showServices: true,
    floor: 2,
    elevator: 'no' as const,
    carryDistance: '0-10' as const,
    volume: 25,
    formData: {},
    serviceType: ServiceType.MOVING
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseUnifiedRules
      .mockReturnValueOnce({
        rules: mockConstraintRules,
        loading: false,
        error: null
      })
      .mockReturnValueOnce({
        rules: mockServiceRules,
        loading: false,
        error: null
      });

    mockAutoDetectionService.detectAutomaticConstraints.mockReturnValue({
      pickup: {
        furnitureLiftRequired: false,
        longCarryingDistance: false
      },
      delivery: {
        furnitureLiftRequired: false,
        longCarryingDistance: false
      },
      totalSurcharge: 0,
      appliedConstraints: []
    });
  });

  test('rendre le modal avec les contraintes et services', async () => {
    render(<AccessConstraintsModal {...defaultProps} />);

    // Ouvrir le modal
    const openButton = screen.getByText('Contraintes de départ');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByText('Contraintes d\'accès - Départ')).toBeInTheDocument();
      expect(screen.getByTestId('unified-rule-manager')).toBeInTheDocument();
    });

    // ✅ NOUVEAU: Vérifier que useUnifiedRules est appelé avec le bon scope
    expect(mockUseUnifiedRules).toHaveBeenCalledWith({
      ruleType: RuleType.CONSTRAINT,
      serviceType: ServiceType.MOVING,
      condition: {
        type: 'pickup',
        scope: 'PICKUP'
      },
      enabled: true
    });
  });

  test('catégoriser les contraintes par adresse départ/arrivée', async () => {
    const pickupProps = {
      ...defaultProps,
      type: 'pickup' as const,
      buttonLabel: 'Contraintes de départ'
    };

    const { rerender } = render(<AccessConstraintsModal {...pickupProps} />);

    // Vérifier les règles pour le départ
    expect(mockUseUnifiedRules).toHaveBeenCalledWith({
      ruleType: RuleType.CONSTRAINT,
      serviceType: ServiceType.MOVING,
      condition: { type: 'pickup' },
      enabled: false
    });

    // Changer pour l'arrivée
    const deliveryProps = {
      ...defaultProps,
      type: 'delivery' as const,
      buttonLabel: 'Contraintes d\'arrivée'
    };

    rerender(<AccessConstraintsModal {...deliveryProps} />);

    // Vérifier les règles pour l'arrivée
    expect(mockUseUnifiedRules).toHaveBeenCalledWith({
      ruleType: RuleType.CONSTRAINT,
      serviceType: ServiceType.MOVING,
      condition: { type: 'delivery' },
      enabled: false
    });
  });

  test('auto-détection des contraintes requises', async () => {
    mockAutoDetectionService.detectAutomaticConstraints.mockReturnValue({
      pickup: {
        furnitureLiftRequired: true,
        furnitureLiftReason: 'Étage 4 sans ascenseur',
        longCarryingDistance: false
      },
      delivery: {
        furnitureLiftRequired: false,
        longCarryingDistance: true,
        carryingDistanceReason: 'Distance > 30m'
      },
      totalSurcharge: 350,
      appliedConstraints: [
        {
          id: 'furniture_lift',
          location: 'pickup',
          reason: 'Étage 4 sans ascenseur',
          surcharge: 300
        },
        {
          id: 'long_carrying_distance',
          location: 'delivery',
          reason: 'Distance > 30m',
          surcharge: 50
        }
      ]
    });

    render(<AccessConstraintsModal {...defaultProps} />);

    // Ouvrir le modal
    const openButton = screen.getByText('Contraintes de départ');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByText('Contraintes d\'accès - Départ')).toBeInTheDocument();
    });

    // Vérifier que l'auto-détection a été appelée
    expect(mockAutoDetectionService.detectAutomaticConstraints).toHaveBeenCalledWith(
      expect.objectContaining({
        floor: 2,
        elevator: 'no',
        carryDistance: '0-10'
      }),
      expect.objectContaining({
        floor: 0,
        elevator: 'no'
      }),
      25
    );
  });

  test('gestion des services supplémentaires', async () => {
    render(<AccessConstraintsModal {...defaultProps} />);

    // Ouvrir le modal
    const openButton = screen.getByText('Contraintes de départ');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByTestId('unified-rule-manager')).toBeInTheDocument();
    });

    // Vérifier que les services sont chargés
    expect(mockUseUnifiedRules).toHaveBeenCalledWith({
      ruleType: RuleType.CUSTOM,
      serviceType: ServiceType.MOVING,
      condition: { type: 'pickup' },
      enabled: true
    });
  });

  test('sélection et désélection des contraintes', async () => {
    const mockOnChange = jest.fn();
    render(<AccessConstraintsModal {...defaultProps} onChange={mockOnChange} />);

    // Ouvrir le modal
    const openButton = screen.getByText('Contraintes de départ');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByTestId('unified-rule-manager')).toBeInTheDocument();
    });

    // Sélectionner une contrainte
    const toggleButton = screen.getByTestId('toggle-constraint-1');
    fireEvent.click(toggleButton);

    // Vérifier que onChange a été appelé
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        'constraint-1': true
      })
    );
  });

  test('validation des contraintes automatiques', async () => {
    mockAutoDetectionService.validateConstraintSelection.mockReturnValue({
      isValid: false,
      blockedConstraintId: 'furniture_lift_required',
      reason: 'Monte-meuble requis automatiquement'
    });

    render(<AccessConstraintsModal {...defaultProps} />);

    // Ouvrir le modal
    const openButton = screen.getByText('Contraintes de départ');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByTestId('unified-rule-manager')).toBeInTheDocument();
    });

    // Vérifier que la validation a été appelée
    expect(mockAutoDetectionService.validateConstraintSelection).toHaveBeenCalled();
  });

  test('affichage des messages d\'erreur', async () => {
    mockUseUnifiedRules
      .mockReturnValueOnce({
        rules: [],
        loading: false,
        error: 'Erreur de chargement des contraintes'
      })
      .mockReturnValueOnce({
        rules: [],
        loading: false,
        error: null
      });

    render(<AccessConstraintsModal {...defaultProps} />);

    // Ouvrir le modal
    const openButton = screen.getByText('Contraintes de départ');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByText('Erreur de chargement des contraintes')).toBeInTheDocument();
    });
  });

  test('gestion des états de chargement', async () => {
    mockUseUnifiedRules
      .mockReturnValueOnce({
        rules: [],
        loading: true,
        error: null
      })
      .mockReturnValueOnce({
        rules: [],
        loading: true,
        error: null
      });

    render(<AccessConstraintsModal {...defaultProps} />);

    // Ouvrir le modal
    const openButton = screen.getByText('Contraintes de départ');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByText('Chargement des contraintes...')).toBeInTheDocument();
    });
  });

  test('fermeture du modal', async () => {
    render(<AccessConstraintsModal {...defaultProps} />);

    // Ouvrir le modal
    const openButton = screen.getByText('Contraintes de départ');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByText('Contraintes d\'accès - Départ')).toBeInTheDocument();
    });

    // Fermer le modal
    const closeButton = screen.getByTestId('close-modal');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Contraintes d\'accès - Départ')).not.toBeInTheDocument();
    });
  });

  test('sauvegarde des sélections', async () => {
    const mockOnChange = jest.fn();
    render(<AccessConstraintsModal {...defaultProps} onChange={mockOnChange} />);

    // Ouvrir le modal
    const openButton = screen.getByText('Contraintes de départ');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByTestId('unified-rule-manager')).toBeInTheDocument();
    });

    // Sélectionner des contraintes
    fireEvent.click(screen.getByTestId('toggle-constraint-1'));
    fireEvent.click(screen.getByTestId('toggle-service-1'));

    // Sauvegarder
    const saveButton = screen.getByText('Sauvegarder');
    fireEvent.click(saveButton);

    // Vérifier que onChange a été appelé avec les bonnes données
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        'constraint-1': true,
        'service-1': true
      })
    );
  });

  test('gestion des données de formulaire', async () => {
    const formData = {
      pickupFloor: 3,
      pickupElevator: 'small',
      deliveryFloor: 1,
      deliveryElevator: 'large'
    };

    render(<AccessConstraintsModal {...defaultProps} formData={formData} />);

    // Ouvrir le modal
    const openButton = screen.getByText('Contraintes de départ');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByTestId('unified-rule-manager')).toBeInTheDocument();
    });

    // Vérifier que l'auto-détection a été appelée avec les bonnes données
    expect(mockAutoDetectionService.detectAutomaticConstraints).toHaveBeenCalledWith(
      expect.objectContaining({
        floor: 2,
        elevator: 'no'
      }),
      expect.objectContaining({
        floor: 0,
        elevator: 'no'
      }),
      25
    );
  });

  test('gestion des volumes différents', async () => {
    const propsWithVolume = {
      ...defaultProps,
      volume: 50
    };

    render(<AccessConstraintsModal {...propsWithVolume} />);

    // Ouvrir le modal
    const openButton = screen.getByText('Contraintes de départ');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByTestId('unified-rule-manager')).toBeInTheDocument();
    });

    // Vérifier que l'auto-détection a été appelée avec le bon volume
    expect(mockAutoDetectionService.detectAutomaticConstraints).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      50
    );
  });

  test('gestion des types de service différents', async () => {
    const cleaningProps = {
      ...defaultProps,
      serviceType: ServiceType.CLEANING
    };

    render(<AccessConstraintsModal {...cleaningProps} />);

    // Ouvrir le modal
    const openButton = screen.getByText('Contraintes de départ');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByTestId('unified-rule-manager')).toBeInTheDocument();
    });

    // Vérifier que les règles ont été chargées pour le bon type de service
    expect(mockUseUnifiedRules).toHaveBeenCalledWith({
      ruleType: RuleType.CONSTRAINT,
      serviceType: ServiceType.CLEANING,
      condition: { type: 'pickup' },
      enabled: false
    });
  });

  test('désactivation des services', async () => {
    const propsWithoutServices = {
      ...defaultProps,
      showServices: false
    };

    render(<AccessConstraintsModal {...propsWithoutServices} />);

    // Ouvrir le modal
    const openButton = screen.getByText('Contraintes de départ');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(screen.getByTestId('unified-rule-manager')).toBeInTheDocument();
    });

    // Vérifier que les services ne sont pas chargés
    expect(mockUseUnifiedRules).toHaveBeenCalledWith({
      ruleType: RuleType.CUSTOM,
      serviceType: ServiceType.MOVING,
      condition: { type: 'pickup' },
      enabled: false
    });
  });
});
