import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import QuoteDetails from '../details/page'
import { QueryProvider } from '@/providers/QueryProvider'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { mockQuotes } from '@/mocks/testData'

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

describe('QuoteDetails Page', () => {
  it('renders loading state initially', () => {
    render(<QuoteDetails params={{ id: '1' }} />, { wrapper })
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders quote details after loading', async () => {
    render(<QuoteDetails params={{ id: '1' }} />, { wrapper })

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    expect(screen.getByText('Quote Details')).toBeInTheDocument()
    expect(screen.getByText('Service Details')).toBeInTheDocument()
    expect(screen.getByText('Appointment')).toBeInTheDocument()
    expect(screen.getByText('Payment')).toBeInTheDocument()
  })

  it('handles status change correctly', async () => {
    render(<QuoteDetails params={{ id: '1' }} />, { wrapper })

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    const statusSelect = screen.getByRole('combobox')
    fireEvent.change(statusSelect, { target: { value: 'paid' } })

    await waitFor(() => {
      expect(screen.getByText('paid')).toBeInTheDocument()
    })
  })

  it('shows cancel confirmation modal', async () => {
    render(<QuoteDetails params={{ id: '1' }} />, { wrapper })

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    const cancelButton = screen.getByText('Cancel Quote')
    fireEvent.click(cancelButton)

    expect(screen.getByText('Are you sure you want to cancel this quote?')).toBeInTheDocument()
  })
}) 