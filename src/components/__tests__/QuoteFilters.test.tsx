import { render, screen, fireEvent } from '@testing-library/react'
import { QuoteFilters } from '../QuoteFilters'

describe('QuoteFilters', () => {
  const mockOnFilter = jest.fn()
  const mockOnReset = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders basic search and status filter', () => {
    render(<QuoteFilters onFilter={mockOnFilter} onReset={mockOnReset} />)
    
    expect(screen.getByPlaceholderText('Search quotes...')).toBeInTheDocument()
    expect(screen.getByText('All Status')).toBeInTheDocument()
  })

  it('shows advanced filters when clicking More Filters', () => {
    render(<QuoteFilters onFilter={mockOnFilter} onReset={mockOnReset} />)
    
    fireEvent.click(screen.getByText('More Filters'))
    
    expect(screen.getByText('Service Type')).toBeInTheDocument()
    expect(screen.getByText('Property Type')).toBeInTheDocument()
    expect(screen.getByText('Date Range')).toBeInTheDocument()
    expect(screen.getByText('Price Range')).toBeInTheDocument()
  })

  it('calls onFilter when changing search term', () => {
    render(<QuoteFilters onFilter={mockOnFilter} onReset={mockOnReset} />)
    
    const searchInput = screen.getByPlaceholderText('Search quotes...')
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    expect(mockOnFilter).toHaveBeenCalledWith(expect.objectContaining({
      searchTerm: 'test'
    }))
  })

  it('calls onReset when clicking Reset Filters', () => {
    render(<QuoteFilters onFilter={mockOnFilter} onReset={mockOnReset} />)
    
    fireEvent.click(screen.getByText('More Filters'))
    fireEvent.click(screen.getByText('Reset Filters'))
    
    expect(mockOnReset).toHaveBeenCalled()
  })
}) 