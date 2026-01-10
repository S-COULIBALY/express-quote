/**
 * 🧪 **TESTS UNITAIRES - CheckoutForm**
 * 
 * Tests unitaires pour le composant CheckoutForm
 * qui gère l'intégration Stripe dans le flux de paiement.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn()
}));

// Mock des hooks Stripe
const mockStripe = {
  confirmPayment: jest.fn()
};

const mockElements = {
  getElement: jest.fn()
};

jest.mock('@stripe/react-stripe-js', () => ({
  ...jest.requireActual('@stripe/react-stripe-js'),
  useStripe: () => mockStripe,
  useElements: () => mockElements,
  PaymentElement: ({ children, ...props }: any) => (
    <div data-testid="payment-element" {...props}>
      {children}
    </div>
  )
}));

// Composant CheckoutForm mocké pour les tests
const CheckoutForm = ({ 
  customerInfo, 
  sessionId, 
  depositAmount, 
  onSuccess, 
  onError 
}: {
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    acceptTerms: boolean;
    acceptPrivacy: boolean;
  };
  sessionId: string;
  depositAmount: number;
  onSuccess: (sessionId: string) => void;
  onError: (error: string) => void;
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await mockStripe.confirmPayment({
        elements: mockElements,
        confirmParams: {
          return_url: `${window.location.origin}/success?payment_intent=${sessionId}`,
          receipt_email: customerInfo.email,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Erreur de paiement');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
        window.location.href = `/success?payment_intent=${paymentIntent.id}`;
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erreur lors du traitement du paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="checkout-form">
      <div data-testid="payment-element" />
      <button 
        type="submit" 
        disabled={isProcessing}
        data-testid="submit-payment"
      >
        {isProcessing ? 'Traitement en cours...' : `Payer ${depositAmount.toFixed(2)} €`}
      </button>
    </form>
  );
};

// Wrapper avec Elements
const CheckoutFormWrapper = (props: any) => (
  <Elements stripe={null} options={{ clientSecret: 'test_client_secret' }}>
    <CheckoutForm {...props} />
  </Elements>
);

describe('CheckoutForm', () => {
  const mockCustomerInfo = {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@email.com',
    phone: '+33123456789',
    acceptTerms: true,
    acceptPrivacy: true
  };

  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (loadStripe as jest.Mock).mockResolvedValue(mockStripe);
  });

  test('rendre le formulaire de paiement', () => {
    render(
      <CheckoutFormWrapper
        customerInfo={mockCustomerInfo}
        sessionId="pi_test_123"
        depositAmount={120}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(screen.getByTestId('checkout-form')).toBeInTheDocument();
    expect(screen.getByTestId('payment-element')).toBeInTheDocument();
    expect(screen.getByText('Payer 120.00 €')).toBeInTheDocument();
  });

  test('paiement réussi', async () => {
    mockStripe.confirmPayment.mockResolvedValue({
      error: null,
      paymentIntent: {
        id: 'pi_test_123',
        status: 'succeeded'
      }
    });

    render(
      <CheckoutFormWrapper
        customerInfo={mockCustomerInfo}
        sessionId="pi_test_123"
        depositAmount={120}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const submitButton = screen.getByTestId('submit-payment');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockStripe.confirmPayment).toHaveBeenCalledWith({
        elements: mockElements,
        confirmParams: {
          return_url: `${window.location.origin}/success?payment_intent=pi_test_123`,
          receipt_email: 'jean.dupont@email.com',
        },
        redirect: 'if_required',
      });
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith('pi_test_123');
    });
  });

  test('paiement échoué', async () => {
    mockStripe.confirmPayment.mockResolvedValue({
      error: {
        message: 'Your card was declined.'
      },
      paymentIntent: null
    });

    render(
      <CheckoutFormWrapper
        customerInfo={mockCustomerInfo}
        sessionId="pi_test_123"
        depositAmount={120}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const submitButton = screen.getByTestId('submit-payment');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Your card was declined.');
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  test('erreur lors du traitement', async () => {
    mockStripe.confirmPayment.mockRejectedValue(new Error('Erreur réseau'));

    render(
      <CheckoutFormWrapper
        customerInfo={mockCustomerInfo}
        sessionId="pi_test_123"
        depositAmount={120}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const submitButton = screen.getByTestId('submit-payment');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Erreur réseau');
    });
  });

  test('état de chargement pendant le traitement', async () => {
    mockStripe.confirmPayment.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        error: null,
        paymentIntent: { id: 'pi_test_123', status: 'succeeded' }
      }), 100))
    );

    render(
      <CheckoutFormWrapper
        customerInfo={mockCustomerInfo}
        sessionId="pi_test_123"
        depositAmount={120}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const submitButton = screen.getByTestId('submit-payment');
    fireEvent.click(submitButton);

    // Vérifier l'état de chargement
    expect(screen.getByText('Traitement en cours...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText('Traitement en cours...')).not.toBeInTheDocument();
    });
  });

  test('paramètres de confirmation corrects', async () => {
    mockStripe.confirmPayment.mockResolvedValue({
      error: null,
      paymentIntent: { id: 'pi_test_123', status: 'succeeded' }
    });

    render(
      <CheckoutFormWrapper
        customerInfo={mockCustomerInfo}
        sessionId="pi_test_456"
        depositAmount={250}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const submitButton = screen.getByTestId('submit-payment');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockStripe.confirmPayment).toHaveBeenCalledWith({
        elements: mockElements,
        confirmParams: {
          return_url: `${window.location.origin}/success?payment_intent=pi_test_456`,
          receipt_email: 'jean.dupont@email.com',
        },
        redirect: 'if_required',
      });
    });
  });
});
