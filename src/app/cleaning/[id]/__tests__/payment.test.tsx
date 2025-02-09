import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Payment from '../payment/page'
import { QueryProvider } from '@/providers/QueryProvider'
import { NotificationProvider } from '@/contexts/NotificationContext'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn()
  })
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryProvider>
    <NotificationProvider>
      {children}
    </NotificationProvider>
  </QueryProvider>
)

describe('Payment Page', () => {
  it('renders payment form correctly', async () => {
    render(<Payment params={{ id: '1' }} />, { wrapper })

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    expect(screen.getByText('Payment Details')).toBeInTheDocument()
    expect(screen.getByLabelText('Card Number')).toBeInTheDocument()
    expect(screen.getByLabelText('Expiry Date')).toBeInTheDocument()
    expect(screen.getByLabelText('CVC')).toBeInTheDocument()
  })

  it('shows payment summary', async () => {
    render(<Payment params={{ id: '1' }} />, { wrapper })

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    expect(screen.getByText('Payment Summary')).toBeInTheDocument()
    expect(screen.getByText('Deposit Amount:')).toBeInTheDocument()
    expect(screen.getByText('Total Amount:')).toBeInTheDocument()
  })

  it('validates form fields', async () => {
    render(<Payment params={{ id: '1' }} />, { wrapper })

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    const submitButton = screen.getByText('Pay Now')
    fireEvent.click(submitButton)

    expect(screen.getByText('Card number is required')).toBeInTheDocument()
    expect(screen.getByText('Expiry date is required')).toBeInTheDocument()
    expect(screen.getByText('CVC is required')).toBeInTheDocument()
  })

  it('handles successful payment', async () => {
    const mockRouter = { push: jest.fn(), back: jest.fn() }
    jest.mock('next/navigation', () => ({
      useRouter: () => mockRouter
    }))

    render(<Payment params={{ id: '1' }} />, { wrapper })

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    // Remplir le formulaire
    fireEvent.change(screen.getByLabelText('Card Number'), {
      target: { value: '4242424242424242' }
    })
    fireEvent.change(screen.getByLabelText('Expiry Date'), {
      target: { value: '12/25' }
    })
    fireEvent.change(screen.getByLabelText('CVC'), {
      target: { value: '123' }
    })

    const submitButton = screen.getByText('Pay Now')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/cleaning/1/confirmation')
    })
  })
}) 