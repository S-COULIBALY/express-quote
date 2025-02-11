import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import QuoteDetails from '../details/page'
import { QueryProvider } from '@/providers/QueryProvider'
import { NotificationProvider } from '@/contexts/NotificationContext'

// Mock de next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn()
  })
}))

// Mock des fonctions fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('QuoteDetails', () => {
  beforeEach(() => {
    // Configuration du mock fetch pour chaque test
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        status: 'pending',
        // ... autres propriétés du devis
      })
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const renderComponent = () => {
    render(
      <QueryProvider>
        <NotificationProvider>
          <QuoteDetails params={{ id: '1' }} />
        </NotificationProvider>
      </QueryProvider>
    )
  }

  it('renders loading state initially', () => {
    renderComponent()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders quote details after loading', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    expect(screen.getByText('Quote Details')).toBeInTheDocument()
    expect(screen.getByText('Service Details')).toBeInTheDocument()
    expect(screen.getByText('Appointment')).toBeInTheDocument()
    expect(screen.getByText('Payment')).toBeInTheDocument()
  })

  it('handles status change correctly', async () => {
    renderComponent()

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
    renderComponent()

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    const cancelButton = screen.getByText('Cancel Quote')
    fireEvent.click(cancelButton)

    expect(screen.getByText('Are you sure you want to cancel this quote?')).toBeInTheDocument()
  })
}) 