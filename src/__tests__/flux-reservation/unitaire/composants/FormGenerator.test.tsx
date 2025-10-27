/**
 * 🧪 **TESTS UNITAIRES - FORMULAIRE GÉNÉRATEUR**
 * 
 * Ce fichier teste le composant FormGenerator qui est au cœur
 * du système de formulaires dynamiques.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormGenerator } from '@/components/form-generator/FormGenerator';
import { FormConfig } from '@/components/form-generator/types';
import { donneesReservationTest, donneesClientTest } from '../../fixtures/donnees-reservation';

// Mock des hooks et services
jest.mock('@/hooks/shared/useCentralizedPricing', () => ({
  useCentralizedPricing: () => ({
    calculatePrice: jest.fn(() => Promise.resolve({
      basePrice: 100,
      totalPrice: 120,
      breakdown: { base: 100, tax: 20 },
    })),
    isLoading: false,
    error: null,
  }),
}));

jest.mock('@/hooks/useCatalogPreFill', () => ({
  useCatalogPreFill: () => ({
    catalogData: {
      catalogSelection: {
        id: 'test-service',
        category: 'MENAGE',
        marketingTitle: 'Nettoyage Standard',
        marketingPrice: 120,
      },
      item: {
        id: 'test-item',
        name: 'Nettoyage 2h',
        price: 120,
        duration: 120,
        workers: 1,
      },
    },
    isLoading: false,
    error: null,
  }),
}));

// Configuration de test pour le formulaire de nettoyage
const configNettoyage: FormConfig = {
  serviceType: 'general',
  sections: [
    {
      title: '📅 Planification',
      fields: [
        {
          name: 'scheduledDate',
          type: 'date',
          label: 'Date souhaitée',
          required: true,
          validation: {
            custom: (value: any) => {
              if (!value) return 'La date est requise';
              const selectedDate = new Date(value);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return selectedDate >= today || 'La date ne peut pas être dans le passé';
            }
          }
        },
        {
          name: 'horaire',
          type: 'select',
          label: 'Horaire de RDV',
          required: true,
          options: [
            { value: 'matin-6h', label: 'Matin - 6h' },
            { value: 'matin-8h', label: 'Matin - 8h' },
            { value: 'apres-midi-13h', label: 'Après-midi - 13h' },
            { value: 'soiree-18h', label: 'Soirée - 18h' },
            { value: 'flexible', label: 'Flexible - selon disponibilité' }
          ]
        },
        {
          name: 'location',
          type: 'address-pickup',
          label: 'Adresse',
          required: true,
          columnSpan: 2
        }
      ]
    },
    {
      title: '🏠 Détails du service',
      fields: [
        {
          name: 'surface',
          type: 'number',
          label: 'Surface (m²)',
          required: true,
          validation: {
            min: { value: 10, message: 'Surface minimum 10m²' },
            max: { value: 500, message: 'Surface maximum 500m²' }
          }
        },
        {
          name: 'duration',
          type: 'number',
          label: 'Durée (heures)',
          required: true,
          validation: {
            min: { value: 1, message: 'Durée minimum 1h' },
            max: { value: 8, message: 'Durée maximum 8h' }
          }
        }
      ]
    },
    {
      title: '👤 Informations client',
      fields: [
        {
          name: 'firstName',
          type: 'text',
          label: 'Prénom',
          required: true,
          validation: {
            minLength: { value: 2, message: 'Prénom minimum 2 caractères' }
          }
        },
        {
          name: 'lastName',
          type: 'text',
          label: 'Nom',
          required: true,
          validation: {
            minLength: { value: 2, message: 'Nom minimum 2 caractères' }
          }
        },
        {
          name: 'email',
          type: 'email',
          label: 'Email',
          required: true,
          validation: {
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Email invalide'
            }
          }
        },
        {
          name: 'phone',
          type: 'tel',
          label: 'Téléphone',
          required: true,
          validation: {
            pattern: {
              value: /^(\+33|0)[1-9](\d{8})$/,
              message: 'Téléphone invalide'
            }
          }
        }
      ]
    }
  ],
  submitLabel: 'Réserver',
  cancelLabel: 'Annuler'
};

describe('FormGenerator - Tests Unitaires', () => {
  let mockOnSubmit: jest.Mock;
  let mockOnChange: jest.Mock;
  let mockOnError: jest.Mock;

  beforeEach(() => {
    mockOnSubmit = jest.fn();
    mockOnChange = jest.fn();
    mockOnError = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendu du formulaire', () => {
    test('doit rendre le formulaire avec tous les champs', () => {
      const config = {
        ...configNettoyage,
        onSubmit: mockOnSubmit,
        onChange: mockOnChange,
        onValidationError: mockOnError
      };

      render(<FormGenerator config={config} />);

      // Vérifier que tous les champs sont présents
      expect(screen.getByLabelText('Date souhaitée')).toBeInTheDocument();
      expect(screen.getByLabelText('Horaire de RDV')).toBeInTheDocument();
      expect(screen.getByLabelText('Adresse')).toBeInTheDocument();
      expect(screen.getByLabelText('Surface (m²)')).toBeInTheDocument();
      expect(screen.getByLabelText('Durée (heures)')).toBeInTheDocument();
      expect(screen.getByLabelText('Prénom')).toBeInTheDocument();
      expect(screen.getByLabelText('Nom')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Téléphone')).toBeInTheDocument();
    });

    test('doit afficher les sections avec les bons titres', () => {
      const config = {
        ...configNettoyage,
        onSubmit: mockOnSubmit,
        onChange: mockOnChange,
        onValidationError: mockOnError
      };

      render(<FormGenerator config={config} />);

      expect(screen.getByText('📅 Planification')).toBeInTheDocument();
      expect(screen.getByText('🏠 Détails du service')).toBeInTheDocument();
      expect(screen.getByText('👤 Informations client')).toBeInTheDocument();
    });

    test('doit afficher les boutons de soumission et d\'annulation', () => {
      const config = {
        ...configNettoyage,
        onSubmit: mockOnSubmit,
        onChange: mockOnChange,
        onValidationError: mockOnError
      };

      render(<FormGenerator config={config} />);

      expect(screen.getByText('Réserver')).toBeInTheDocument();
      expect(screen.getByText('Annuler')).toBeInTheDocument();
    });
  });

  describe('Validation des champs', () => {
    test('doit valider les champs obligatoires', async () => {
      const user = userEvent.setup();
      const config = {
        ...configNettoyage,
        onSubmit: mockOnSubmit,
        onChange: mockOnChange,
        onValidationError: mockOnError
      };

      render(<FormGenerator config={config} />);

      // Tenter de soumettre sans remplir les champs
      await user.click(screen.getByText('Réserver'));

      // Vérifier que les erreurs de validation apparaissent
      await waitFor(() => {
        expect(screen.getByText('La date est requise')).toBeInTheDocument();
        expect(screen.getByText('L\'adresse est requise')).toBeInTheDocument();
        expect(screen.getByText('Le prénom est requis')).toBeInTheDocument();
        expect(screen.getByText('Le nom est requis')).toBeInTheDocument();
        expect(screen.getByText('L\'email est requis')).toBeInTheDocument();
        expect(screen.getByText('Le téléphone est requis')).toBeInTheDocument();
      });
    });

    test('doit valider le format de l\'email', async () => {
      const user = userEvent.setup();
      const config = {
        ...configNettoyage,
        onSubmit: mockOnSubmit,
        onChange: mockOnChange,
        onValidationError: mockOnError
      };

      render(<FormGenerator config={config} />);

      // Remplir avec un email invalide
      await user.type(screen.getByLabelText('Email'), 'email-invalide');

      // Vérifier que l'erreur de validation apparaît
      await waitFor(() => {
        expect(screen.getByText('Email invalide')).toBeInTheDocument();
      });
    });

    test('doit valider le format du téléphone', async () => {
      const user = userEvent.setup();
      const config = {
        ...configNettoyage,
        onSubmit: mockOnSubmit,
        onChange: mockOnChange,
        onValidationError: mockOnError
      };

      render(<FormGenerator config={config} />);

      // Remplir avec un téléphone invalide
      await user.type(screen.getByLabelText('Téléphone'), '123');

      // Vérifier que l'erreur de validation apparaît
      await waitFor(() => {
        expect(screen.getByText('Téléphone invalide')).toBeInTheDocument();
      });
    });

    test('doit valider la date (pas dans le passé)', async () => {
      const user = userEvent.setup();
      const config = {
        ...configNettoyage,
        onSubmit: mockOnSubmit,
        onChange: mockOnChange,
        onValidationError: mockOnError
      };

      render(<FormGenerator config={config} />);

      // Remplir avec une date passée
      await user.type(screen.getByLabelText('Date souhaitée'), '2023-01-01');

      // Vérifier que l'erreur de validation apparaît
      await waitFor(() => {
        expect(screen.getByText('La date ne peut pas être dans le passé')).toBeInTheDocument();
      });
    });

    test('doit valider la surface (minimum et maximum)', async () => {
      const user = userEvent.setup();
      const config = {
        ...configNettoyage,
        onSubmit: mockOnSubmit,
        onChange: mockOnChange,
        onValidationError: mockOnError
      };

      render(<FormGenerator config={config} />);

      // Test surface trop petite
      await user.type(screen.getByLabelText('Surface (m²)'), '5');
      await waitFor(() => {
        expect(screen.getByText('Surface minimum 10m²')).toBeInTheDocument();
      });

      // Test surface trop grande
      await user.clear(screen.getByLabelText('Surface (m²)'));
      await user.type(screen.getByLabelText('Surface (m²)'), '600');
      await waitFor(() => {
        expect(screen.getByText('Surface maximum 500m²')).toBeInTheDocument();
      });
    });
  });

  describe('Soumission du formulaire', () => {
    test('doit soumettre le formulaire avec des données valides', async () => {
      const user = userEvent.setup();
      const config = {
        ...configNettoyage,
        onSubmit: mockOnSubmit,
        onChange: mockOnChange,
        onValidationError: mockOnError
      };

      render(<FormGenerator config={config} />);

      // Remplir tous les champs avec des données valides
      await user.type(screen.getByLabelText('Date souhaitée'), '2024-02-15');
      await user.selectOptions(screen.getByLabelText('Horaire de RDV'), 'matin-8h');
      await user.type(screen.getByLabelText('Adresse'), '123 Rue de la Paix, Paris');
      await user.type(screen.getByLabelText('Surface (m²)'), '50');
      await user.type(screen.getByLabelText('Durée (heures)'), '2');
      await user.type(screen.getByLabelText('Prénom'), 'Jean');
      await user.type(screen.getByLabelText('Nom'), 'Dupont');
      await user.type(screen.getByLabelText('Email'), 'jean.dupont@email.com');
      await user.type(screen.getByLabelText('Téléphone'), '+33123456789');

      // Soumettre le formulaire
      await user.click(screen.getByText('Réserver'));

      // Vérifier que onSubmit a été appelé avec les bonnes données
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          scheduledDate: '2024-02-15',
          horaire: 'matin-8h',
          location: '123 Rue de la Paix, Paris',
          surface: 50,
          duration: 2,
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com',
          phone: '+33123456789'
        });
      });
    });

    test('doit appeler onError en cas d\'erreur de soumission', async () => {
      const user = userEvent.setup();
      const config = {
        ...configNettoyage,
        onSubmit: jest.fn().mockRejectedValue(new Error('Erreur de soumission')),
        onChange: mockOnChange,
        onValidationError: mockOnError
      };

      render(<FormGenerator config={config} />);

      // Remplir et soumettre le formulaire
      await user.type(screen.getByLabelText('Date souhaitée'), '2024-02-15');
      await user.selectOptions(screen.getByLabelText('Horaire de RDV'), 'matin-8h');
      await user.type(screen.getByLabelText('Adresse'), '123 Rue de la Paix, Paris');
      await user.type(screen.getByLabelText('Surface (m²)'), '50');
      await user.type(screen.getByLabelText('Durée (heures)'), '2');
      await user.type(screen.getByLabelText('Prénom'), 'Jean');
      await user.type(screen.getByLabelText('Nom'), 'Dupont');
      await user.type(screen.getByLabelText('Email'), 'jean.dupont@email.com');
      await user.type(screen.getByLabelText('Téléphone'), '+33123456789');

      await user.click(screen.getByText('Réserver'));

      // Vérifier que onError a été appelé
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
      });
    });
  });

  describe('Gestion des changements', () => {
    test('doit appeler onChange lors des changements de champs', async () => {
      const user = userEvent.setup();
      const config = {
        ...configNettoyage,
        onSubmit: mockOnSubmit,
        onChange: mockOnChange,
        onValidationError: mockOnError
      };

      render(<FormGenerator config={config} />);

      // Changer la surface
      await user.type(screen.getByLabelText('Surface (m²)'), '50');

      // Vérifier que onChange a été appelé
      expect(mockOnChange).toHaveBeenCalledWith('surface', 50, expect.any(Object));
    });

    test('doit mettre à jour le prix lors des changements', async () => {
      const user = userEvent.setup();
      const config = {
        ...configNettoyage,
        onSubmit: mockOnSubmit,
        onChange: mockOnChange,
        onValidationError: mockOnError
      };

      render(<FormGenerator config={config} />);

      // Changer la surface
      await user.type(screen.getByLabelText('Surface (m²)'), '50');

      // Vérifier que le prix est mis à jour
      await waitFor(() => {
        expect(screen.getByText('Prix: 120€')).toBeInTheDocument();
      });
    });
  });

  describe('Gestion des erreurs', () => {
    test('doit afficher les erreurs de validation en temps réel', async () => {
      const user = userEvent.setup();
      const config = {
        ...configNettoyage,
        onSubmit: mockOnSubmit,
        onChange: mockOnChange,
        onValidationError: mockOnError
      };

      render(<FormGenerator config={config} />);

      // Remplir avec des données invalides
      await user.type(screen.getByLabelText('Email'), 'email-invalide');
      await user.type(screen.getByLabelText('Surface (m²)'), '5');

      // Vérifier que les erreurs apparaissent
      await waitFor(() => {
        expect(screen.getByText('Email invalide')).toBeInTheDocument();
        expect(screen.getByText('Surface minimum 10m²')).toBeInTheDocument();
      });
    });

    test('doit nettoyer les erreurs lors de la correction', async () => {
      const user = userEvent.setup();
      const config = {
        ...configNettoyage,
        onSubmit: mockOnSubmit,
        onChange: mockOnChange,
        onValidationError: mockOnError
      };

      render(<FormGenerator config={config} />);

      // Remplir avec des données invalides
      await user.type(screen.getByLabelText('Email'), 'email-invalide');
      await waitFor(() => {
        expect(screen.getByText('Email invalide')).toBeInTheDocument();
      });

      // Corriger l'email
      await user.clear(screen.getByLabelText('Email'));
      await user.type(screen.getByLabelText('Email'), 'jean.dupont@email.com');

      // Vérifier que l'erreur a disparu
      await waitFor(() => {
        expect(screen.queryByText('Email invalide')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibilité', () => {
    test('doit avoir les bons attributs d\'accessibilité', () => {
      const config = {
        ...configNettoyage,
        onSubmit: mockOnSubmit,
        onChange: mockOnChange,
        onValidationError: mockOnError
      };

      render(<FormGenerator config={config} />);

      // Vérifier les attributs aria
      expect(screen.getByLabelText('Date souhaitée')).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText('Téléphone')).toHaveAttribute('type', 'tel');
    });

    test('doit avoir les bons labels pour les champs', () => {
      const config = {
        ...configNettoyage,
        onSubmit: mockOnSubmit,
        onChange: mockOnChange,
        onValidationError: mockOnError
      };

      render(<FormGenerator config={config} />);

      // Vérifier que tous les champs ont des labels
      expect(screen.getByLabelText('Date souhaitée')).toBeInTheDocument();
      expect(screen.getByLabelText('Horaire de RDV')).toBeInTheDocument();
      expect(screen.getByLabelText('Adresse')).toBeInTheDocument();
      expect(screen.getByLabelText('Surface (m²)')).toBeInTheDocument();
      expect(screen.getByLabelText('Durée (heures)')).toBeInTheDocument();
      expect(screen.getByLabelText('Prénom')).toBeInTheDocument();
      expect(screen.getByLabelText('Nom')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Téléphone')).toBeInTheDocument();
    });
  });
});
