/**
 * 🧪 **TESTS UNITAIRES - FormGenerator**
 * 
 * Tests unitaires pour le composant FormGenerator
 * qui est critique dans le flux de réservation.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FormGenerator } from '@/components/form-generator/FormGenerator';
import { FormField as FormFieldType } from '@/components/form-generator/types/form';

// Mock des hooks
jest.mock('@/hooks/shared/useFormPersistence', () => ({
  useFormPersistence: () => ({
    saveData: jest.fn(),
    getStoredData: () => null,
    clearData: jest.fn(),
    isDataSaved: false
  })
}));

jest.mock('@/hooks/shared/useCentralizedPricing', () => ({
  useRealTimePricing: () => ({
    calculatedPrice: 120,
    priceDetails: {
      basePrice: 100,
      surcharges: 20,
      total: 120
    }
  })
}));

// Configuration de test pour le FormGenerator
const mockFormConfig: FormFieldType[] = [
  {
    name: 'surface',
    type: 'number',
    label: 'Surface (m²)',
    required: true,
    validation: {
      min: 10,
      max: 500
    }
  },
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    required: true,
    validation: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  },
  {
    name: 'phone',
    type: 'text',
    label: 'Téléphone',
    required: true,
    validation: {
      pattern: /^(\+33|0)[1-9](\d{8})$/
    }
  },
  {
    name: 'acceptTerms',
    type: 'checkbox',
    label: 'J\'accepte les conditions générales',
    required: true
  }
];

describe('FormGenerator', () => {
  const mockOnSubmit = jest.fn();
  const mockOnFieldChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rendre le formulaire avec tous les champs', () => {
    render(
      <FormGenerator
        config={mockFormConfig}
        onSubmit={mockOnSubmit}
        onFieldChange={mockOnFieldChange}
      />
    );

    expect(screen.getByLabelText('Surface (m²)')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Téléphone')).toBeInTheDocument();
    expect(screen.getByLabelText('J\'accepte les conditions générales')).toBeInTheDocument();
  });

  test('validation des champs obligatoires', async () => {
    render(
      <FormGenerator
        config={mockFormConfig}
        onSubmit={mockOnSubmit}
        onFieldChange={mockOnFieldChange}
      />
    );

    const submitButton = screen.getByRole('button', { name: /soumettre/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Surface (m²) est requis')).toBeInTheDocument();
      expect(screen.getByText('Email est requis')).toBeInTheDocument();
      expect(screen.getByText('Téléphone est requis')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('validation du format email', async () => {
    render(
      <FormGenerator
        config={mockFormConfig}
        onSubmit={mockOnSubmit}
        onFieldChange={mockOnFieldChange}
      />
    );

    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'email-invalide' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText('Format email invalide')).toBeInTheDocument();
    });
  });

  test('validation de la surface minimum', async () => {
    render(
      <FormGenerator
        config={mockFormConfig}
        onSubmit={mockOnSubmit}
        onFieldChange={mockOnFieldChange}
      />
    );

    const surfaceInput = screen.getByLabelText('Surface (m²)');
    fireEvent.change(surfaceInput, { target: { value: '5' } });
    fireEvent.blur(surfaceInput);

    await waitFor(() => {
      expect(screen.getByText('Surface minimum 10m²')).toBeInTheDocument();
    });
  });

  test('soumission avec données valides', async () => {
    render(
      <FormGenerator
        config={mockFormConfig}
        onSubmit={mockOnSubmit}
        onFieldChange={mockOnFieldChange}
      />
    );

    // Remplir le formulaire avec des données valides
    fireEvent.change(screen.getByLabelText('Surface (m²)'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Téléphone'), { target: { value: '0123456789' } });
    fireEvent.click(screen.getByLabelText('J\'accepte les conditions générales'));

    const submitButton = screen.getByRole('button', { name: /soumettre/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        surface: 50,
        email: 'test@example.com',
        phone: '0123456789',
        acceptTerms: true
      });
    });
  });

  test('appel de onFieldChange lors de la modification des champs', () => {
    render(
      <FormGenerator
        config={mockFormConfig}
        onSubmit={mockOnSubmit}
        onFieldChange={mockOnFieldChange}
      />
    );

    const surfaceInput = screen.getByLabelText('Surface (m²)');
    fireEvent.change(surfaceInput, { target: { value: '50' } });

    expect(mockOnFieldChange).toHaveBeenCalledWith('surface', 50);
  });

  test('gestion des champs conditionnels', () => {
    const configWithConditional: FormFieldType[] = [
      {
        name: 'hasDelivery',
        type: 'checkbox',
        label: 'Livraison nécessaire'
      },
      {
        name: 'deliveryAddress',
        type: 'text',
        label: 'Adresse de livraison',
        conditional: {
          dependsOn: 'hasDelivery',
          condition: (value) => value === true
        }
      }
    ];

    render(
      <FormGenerator
        config={configWithConditional}
        onSubmit={mockOnSubmit}
        onFieldChange={mockOnFieldChange}
      />
    );

    // Le champ conditionnel ne doit pas être visible initialement
    expect(screen.queryByLabelText('Adresse de livraison')).not.toBeInTheDocument();

    // Cocher la checkbox
    fireEvent.click(screen.getByLabelText('Livraison nécessaire'));

    // Le champ conditionnel doit maintenant être visible
    expect(screen.getByLabelText('Adresse de livraison')).toBeInTheDocument();
  });

  test('gestion des erreurs de soumission', async () => {
    const mockOnSubmitWithError = jest.fn().mockRejectedValue(new Error('Erreur de soumission'));

    render(
      <FormGenerator
        config={mockFormConfig}
        onSubmit={mockOnSubmitWithError}
        onFieldChange={mockOnFieldChange}
      />
    );

    // Remplir le formulaire
    fireEvent.change(screen.getByLabelText('Surface (m²)'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Téléphone'), { target: { value: '0123456789' } });
    fireEvent.click(screen.getByLabelText('J\'accepte les conditions générales'));

    const submitButton = screen.getByRole('button', { name: /soumettre/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Erreur de soumission')).toBeInTheDocument();
    });
  });

  test('état de chargement pendant la soumission', async () => {
    const mockOnSubmitAsync = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <FormGenerator
        config={mockFormConfig}
        onSubmit={mockOnSubmitAsync}
        onFieldChange={mockOnFieldChange}
      />
    );

    // Remplir le formulaire
    fireEvent.change(screen.getByLabelText('Surface (m²)'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Téléphone'), { target: { value: '0123456789' } });
    fireEvent.click(screen.getByLabelText('J\'accepte les conditions générales'));

    const submitButton = screen.getByRole('button', { name: /soumettre/i });
    fireEvent.click(submitButton);

    // Vérifier l'état de chargement
    expect(screen.getByText('Traitement en cours...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText('Traitement en cours...')).not.toBeInTheDocument();
    });
  });
});