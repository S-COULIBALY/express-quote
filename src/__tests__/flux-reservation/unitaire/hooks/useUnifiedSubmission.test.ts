/**
 * 🧪 **TESTS UNITAIRES - useUnifiedSubmission**
 * 
 * Tests unitaires pour le hook useUnifiedSubmission
 * qui gère la soumission unifiée des formulaires.
 */

import { renderHook, act } from '@testing-library/react';
import { useUnifiedSubmission } from '@/hooks/generic/useUnifiedSubmission';

// Mock des dépendances
jest.mock('@/hooks/generic/useSubmission', () => ({
  submitQuoteRequest: jest.fn()
}));

jest.mock('@/hooks/generic/useRetry', () => ({
  retryAsync: jest.fn()
}));

jest.mock('@/hooks/generic/useErrorHandling', () => ({
  handleApiError: jest.fn()
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

import { submitQuoteRequest } from '@/hooks/generic/useSubmission';
import { retryAsync } from '@/hooks/generic/useRetry';
import { handleApiError } from '@/hooks/generic/useErrorHandling';
import { toast } from 'react-hot-toast';

const mockSubmitQuoteRequest = submitQuoteRequest as jest.Mock;
const mockRetryAsync = retryAsync as jest.Mock;
const mockHandleApiError = handleApiError as jest.Mock;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('useUnifiedSubmission', () => {
  const mockConfig = {
    submissionType: 'quoteRequest',
    prepareRequestData: jest.fn((formData) => formData),
    getSuccessRedirectUrl: jest.fn((data) => `/booking/${data.temporaryId}`),
    validateData: jest.fn(() => ({ valid: true }))
  };

  const mockFormData = {
    surface: 50,
    email: 'test@example.com',
    phone: '0123456789'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initialisation avec état par défaut', () => {
    const { result } = renderHook(() => 
      useUnifiedSubmission(mockConfig, 120, {})
    );

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.temporaryId).toBeUndefined();
  });

  test('soumission réussie', async () => {
    const mockResponse = {
      temporaryId: 'temp_123456',
      id: 'quote_123456'
    };

    mockRetryAsync.mockResolvedValue(mockResponse);
    mockConfig.prepareRequestData.mockReturnValue(mockFormData);

    const { result } = renderHook(() => 
      useUnifiedSubmission(mockConfig, 120, {})
    );

    await act(async () => {
      await result.current.submit(mockFormData);
    });

    expect(mockConfig.prepareRequestData).toHaveBeenCalledWith(mockFormData, {});
    expect(mockRetryAsync).toHaveBeenCalled();
    expect(mockToast.success).toHaveBeenCalledWith('Demande envoyée avec succès !');
    expect(result.current.temporaryId).toBe('temp_123456');
  });

  test('validation échouée', async () => {
    mockConfig.validateData.mockReturnValue({ 
      valid: false, 
      error: 'Données invalides' 
    });

    const { result } = renderHook(() => 
      useUnifiedSubmission(mockConfig, 120, {})
    );

    await act(async () => {
      await result.current.submit(mockFormData);
    });

    expect(mockToast.error).toHaveBeenCalledWith(
      'Données invalides',
      expect.objectContaining({
        duration: 4000,
        icon: '⚠️'
      })
    );
    expect(mockRetryAsync).not.toHaveBeenCalled();
  });

  test('erreur de soumission', async () => {
    const mockError = new Error('Erreur API');
    mockRetryAsync.mockRejectedValue(mockError);
    mockHandleApiError.mockReturnValue('Erreur de connexion');

    const { result } = renderHook(() => 
      useUnifiedSubmission(mockConfig, 120, {})
    );

    await act(async () => {
      await result.current.submit(mockFormData);
    });

    expect(mockHandleApiError).toHaveBeenCalledWith(mockError);
    expect(mockToast.error).toHaveBeenCalledWith('Erreur de connexion');
    expect(result.current.error).toBe('Erreur de connexion');
  });

  test('retry automatique en cas d\'échec', async () => {
    const mockError = new Error('Erreur temporaire');
    mockRetryAsync.mockRejectedValue(mockError);
    mockHandleApiError.mockReturnValue('Erreur temporaire');

    const { result } = renderHook(() => 
      useUnifiedSubmission(mockConfig, 120, {})
    );

    await act(async () => {
      await result.current.submit(mockFormData);
    });

    expect(mockRetryAsync).toHaveBeenCalledWith(
      expect.any(Function),
      { maxAttempts: 3, delay: 1000, backoff: true }
    );
  });

  test('sauvegarde du temporaryId dans sessionStorage', async () => {
    const mockResponse = {
      temporaryId: 'temp_123456',
      id: 'quote_123456'
    };

    mockRetryAsync.mockResolvedValue(mockResponse);

    // Mock sessionStorage
    const mockSessionStorage = {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn()
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage
    });

    const { result } = renderHook(() => 
      useUnifiedSubmission(mockConfig, 120, {})
    );

    await act(async () => {
      await result.current.submit(mockFormData);
    });

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'pendingQuoteRequestId',
      'temp_123456'
    );
  });

  test('redirection après succès', async () => {
    const mockResponse = {
      temporaryId: 'temp_123456',
      id: 'quote_123456'
    };

    mockRetryAsync.mockResolvedValue(mockResponse);
    mockConfig.getSuccessRedirectUrl.mockReturnValue('/booking/temp_123456');

    const { result } = renderHook(() => 
      useUnifiedSubmission(mockConfig, 120, {})
    );

    await act(async () => {
      await result.current.submit(mockFormData);
    });

    expect(mockConfig.getSuccessRedirectUrl).toHaveBeenCalledWith(
      mockResponse,
      {}
    );
  });

  test('gestion des données supplémentaires', async () => {
    const mockResponse = {
      temporaryId: 'temp_123456',
      id: 'quote_123456'
    };

    mockRetryAsync.mockResolvedValue(mockResponse);

    const extraData = { catalogId: 'catalog_123' };

    const { result } = renderHook(() => 
      useUnifiedSubmission(mockConfig, 120, extraData)
    );

    await act(async () => {
      await result.current.submit(mockFormData, { additionalData: 'test' });
    });

    expect(mockConfig.prepareRequestData).toHaveBeenCalledWith(
      mockFormData,
      { additionalData: 'test' }
    );
  });

  test('état de soumission', async () => {
    const mockResponse = {
      temporaryId: 'temp_123456',
      id: 'quote_123456'
    };

    mockRetryAsync.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
    );

    const { result } = renderHook(() => 
      useUnifiedSubmission(mockConfig, 120, {})
    );

    expect(result.current.isSubmitting).toBe(false);

    act(() => {
      result.current.submit(mockFormData);
    });

    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.isSubmitting).toBe(false);
  });
});
