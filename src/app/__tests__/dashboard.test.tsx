import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Dashboard from '../dashboard/page'
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

describe('Dashboard Page', () => {
  it('renders dashboard with all components', async () => {
    render(<Dashboard />, { wrapper })

    // Attendre que les données soient chargées
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    // Vérifier les composants principaux
    expect(screen.getByText('Cleaning Quotes')).toBeInTheDocument()
    expect(screen.getByText('New Quote')).toBeInTheDocument()
    expect(screen.getByText('Export CSV')).toBeInTheDocument()

    // Vérifier les statistiques
    expect(screen.getByText('Total Quotes')).toBeInTheDocument()
    expect(screen.getByText('Total Revenue')).toBeInTheDocument()

    // Vérifier les filtres
    expect(screen.getByPlaceholderText('Search quotes...')).toBeInTheDocument()
  })

  it('filters quotes correctly', async () => {
    render(<Dashboard />, { wrapper })

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search quotes...')
    fireEvent.change(searchInput, { target: { value: 'apartment' } })

    // Vérifier que les résultats sont filtrés
    expect(screen.getByText('apartment')).toBeInTheDocument()
  })

  it('handles pagination correctly', async () => {
    render(<Dashboard />, { wrapper })

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    // Vérifier que la page a changé
    expect(screen.getByText('2')).toHaveAttribute('aria-current', 'page')
  })
}) 