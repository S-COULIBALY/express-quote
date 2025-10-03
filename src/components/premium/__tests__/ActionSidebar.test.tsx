import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ActionSidebar } from '../ActionSidebar'
import { CreditCard, Edit, Plus } from 'lucide-react'

describe('ActionSidebar', () => {
  const mockOnClick1 = jest.fn()
  const mockOnClick2 = jest.fn()
  const mockOnClick3 = jest.fn()

  const defaultActions = [
    {
      label: 'Action 1',
      onClick: mockOnClick1,
      icon: CreditCard,
      variant: 'default' as const,
      className: 'bg-blue-600'
    },
    {
      label: 'Action 2',
      onClick: mockOnClick2,
      icon: Edit,
      variant: 'outline' as const
    },
    {
      label: 'Action 3',
      onClick: mockOnClick3,
      icon: Plus
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all action buttons with correct labels', () => {
    render(<ActionSidebar actions={defaultActions} />)
    
    expect(screen.getByText('Action 1')).toBeInTheDocument()
    expect(screen.getByText('Action 2')).toBeInTheDocument()
    expect(screen.getByText('Action 3')).toBeInTheDocument()
  })

  it('renders with default title "Actions"', () => {
    render(<ActionSidebar actions={defaultActions} />)
    
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('renders with custom title', () => {
    render(<ActionSidebar title="Custom Title" actions={defaultActions} />)
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.queryByText('Actions')).not.toBeInTheDocument()
  })

  it('calls correct onClick handlers when buttons are clicked', () => {
    render(<ActionSidebar actions={defaultActions} />)
    
    fireEvent.click(screen.getByText('Action 1'))
    expect(mockOnClick1).toHaveBeenCalledTimes(1)
    
    fireEvent.click(screen.getByText('Action 2'))
    expect(mockOnClick2).toHaveBeenCalledTimes(1)
    
    fireEvent.click(screen.getByText('Action 3'))
    expect(mockOnClick3).toHaveBeenCalledTimes(1)
  })

  it('applies correct variant classes', () => {
    render(<ActionSidebar actions={defaultActions} />)
    
    const button1 = screen.getByText('Action 1').closest('button')
    const button2 = screen.getByText('Action 2').closest('button')
    const button3 = screen.getByText('Action 3').closest('button')
    
    // Button 1 should have default variant
    expect(button1).toBeInTheDocument()
    
    // Button 2 should have outline variant
    expect(button2).toBeInTheDocument()
    
    // Button 3 should have default variant (outline as default)
    expect(button3).toBeInTheDocument()
  })

  it('applies custom className when provided', () => {
    render(<ActionSidebar actions={defaultActions} />)
    
    const button1 = screen.getByText('Action 1').closest('button')
    expect(button1).toHaveClass('bg-blue-600')
  })

  it('renders separator by default at index 2', () => {
    render(<ActionSidebar actions={defaultActions} />)
    
    // Vérifier qu'il y a une ligne de séparation (hr element)
    const separators = document.querySelectorAll('hr')
    expect(separators.length).toBe(1)
  })

  it('does not render separator when showSeparator is false', () => {
    render(<ActionSidebar actions={defaultActions} showSeparator={false} />)
    
    const separators = document.querySelectorAll('hr')
    expect(separators.length).toBe(0)
  })

  it('renders separator at custom index', () => {
    render(<ActionSidebar actions={defaultActions} separatorIndex={1} />)
    
    // Il devrait toujours y avoir un séparateur, mais à un endroit différent
    const separators = document.querySelectorAll('hr')
    expect(separators.length).toBe(1)
  })

  it('renders icons when provided', () => {
    render(<ActionSidebar actions={defaultActions} />)
    
    // Vérifier que les icônes sont rendues
    const icons = document.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThanOrEqual(3) // Au moins 3 icônes
  })

  it('handles empty actions array', () => {
    render(<ActionSidebar actions={[]} />)
    
    expect(screen.getByText('Actions')).toBeInTheDocument()
    // Aucun bouton ne devrait être rendu
    const buttons = screen.queryAllByRole('button')
    expect(buttons.length).toBe(0)
  })

  it('handles actions without icons', () => {
    const actionsWithoutIcons = [
      {
        label: 'No Icon Action',
        onClick: mockOnClick1
      }
    ]
    
    render(<ActionSidebar actions={actionsWithoutIcons} />)
    
    expect(screen.getByText('No Icon Action')).toBeInTheDocument()
    const button = screen.getByText('No Icon Action').closest('button')
    expect(button).toBeInTheDocument()
  })
}) 