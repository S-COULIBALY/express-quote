import { Payment, PaymentStatus, PaymentMethod } from '../../entities/Payment';
import { Money } from '../../valueObjects/Money';

describe('Payment', () => {
  describe('constructor', () => {
    it('should create a valid payment', () => {
      const amount = new Money(100);
      const payment = new Payment({
        amount,
        method: PaymentMethod.CREDIT_CARD,
        reference: 'PAY-123',
        status: PaymentStatus.PENDING
      });

      expect(payment.getAmount()).toBe(amount);
      expect(payment.getMethod()).toBe(PaymentMethod.CREDIT_CARD);
      expect(payment.getReference()).toBe('PAY-123');
      expect(payment.getStatus()).toBe(PaymentStatus.PENDING);
      expect(payment.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('should create a payment with optional fields', () => {
      const amount = new Money(100);
      const payment = new Payment({
        amount,
        method: PaymentMethod.CREDIT_CARD,
        reference: 'PAY-123',
        status: PaymentStatus.PENDING,
        description: 'Test payment',
        metadata: { orderId: '123' }
      });

      expect(payment.getDescription()).toBe('Test payment');
      expect(payment.getMetadata()).toEqual({ orderId: '123' });
    });

    it('should throw error for invalid amount', () => {
      expect(() => {
        new Payment({
          amount: new Money(-100),
          method: PaymentMethod.CREDIT_CARD,
          reference: 'PAY-123',
          status: PaymentStatus.PENDING
        });
      }).toThrow('Payment amount must be positive');
    });

    it('should throw error for invalid reference', () => {
      expect(() => {
        new Payment({
          amount: new Money(100),
          method: PaymentMethod.CREDIT_CARD,
          reference: '',
          status: PaymentStatus.PENDING
        });
      }).toThrow('Payment reference is required');
    });
  });

  describe('status management', () => {
    it('should process payment', () => {
      const payment = new Payment({
        amount: new Money(100),
        method: PaymentMethod.CREDIT_CARD,
        reference: 'PAY-123',
        status: PaymentStatus.PENDING
      });

      payment.process();
      expect(payment.getStatus()).toBe(PaymentStatus.PROCESSING);
      expect(payment.getProcessedAt()).toBeInstanceOf(Date);
    });

    it('should complete payment', () => {
      const payment = new Payment({
        amount: new Money(100),
        method: PaymentMethod.CREDIT_CARD,
        reference: 'PAY-123',
        status: PaymentStatus.PROCESSING
      });

      payment.complete();
      expect(payment.getStatus()).toBe(PaymentStatus.COMPLETED);
      expect(payment.getCompletedAt()).toBeInstanceOf(Date);
    });

    it('should fail payment', () => {
      const payment = new Payment({
        amount: new Money(100),
        method: PaymentMethod.CREDIT_CARD,
        reference: 'PAY-123',
        status: PaymentStatus.PROCESSING
      });

      const error = 'Card declined';
      payment.fail(error);
      expect(payment.getStatus()).toBe(PaymentStatus.FAILED);
      expect(payment.getError()).toBe(error);
      expect(payment.getFailedAt()).toBeInstanceOf(Date);
    });

    it('should refund payment', () => {
      const payment = new Payment({
        amount: new Money(100),
        method: PaymentMethod.CREDIT_CARD,
        reference: 'PAY-123',
        status: PaymentStatus.COMPLETED
      });

      payment.refund('Customer request');
      expect(payment.getStatus()).toBe(PaymentStatus.REFUNDED);
      expect(payment.getRefundReason()).toBe('Customer request');
      expect(payment.getRefundedAt()).toBeInstanceOf(Date);
    });

    it('should throw error for invalid status transition', () => {
      const payment = new Payment({
        amount: new Money(100),
        method: PaymentMethod.CREDIT_CARD,
        reference: 'PAY-123',
        status: PaymentStatus.COMPLETED
      });

      expect(() => {
        payment.process();
      }).toThrow('Cannot process a completed payment');
    });
  });

  describe('metadata', () => {
    it('should update metadata', () => {
      const payment = new Payment({
        amount: new Money(100),
        method: PaymentMethod.CREDIT_CARD,
        reference: 'PAY-123',
        status: PaymentStatus.PENDING
      });

      payment.updateMetadata({ orderId: '123', customerId: '456' });
      expect(payment.getMetadata()).toEqual({
        orderId: '123',
        customerId: '456'
      });
    });

    it('should merge metadata', () => {
      const payment = new Payment({
        amount: new Money(100),
        method: PaymentMethod.CREDIT_CARD,
        reference: 'PAY-123',
        status: PaymentStatus.PENDING,
        metadata: { orderId: '123' }
      });

      payment.updateMetadata({ customerId: '456' });
      expect(payment.getMetadata()).toEqual({
        orderId: '123',
        customerId: '456'
      });
    });
  });
}); 