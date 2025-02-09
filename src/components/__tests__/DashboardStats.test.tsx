import { render, screen } from '@testing-library/react'
import { DashboardStats } from '../DashboardStats'

const mockQuotes = [
  {
    id: '1',
    status: 'pending',
    estimatedPrice: 250,
    // ... autres propriétés requises
  },
  {
    id: '2',
    status: 'completed',
    estimatedPrice: 300,
    // ... autres propriétés requises
  }
] as any[]

describe('DashboardStats', () => {
  it('renders all stats correctly', () => {
    render(<DashboardStats quotes={mockQuotes} />)
    
    expect(screen.getByText('Total Quotes')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    
    expect(screen.getByText('Pending Quotes')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    
    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('CHF 300.00')).toBeInTheDocument()
  })
}) 