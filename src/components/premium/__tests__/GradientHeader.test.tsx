import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { GradientHeader } from '../GradientHeader'
import { Truck } from 'lucide-react'

describe('GradientHeader', () => {
  const defaultProps = {
    title: 'Test Title',
    subtitle: 'Test Subtitle',
    Icon: Truck,
    gradient: 'bg-gradient-to-r from-blue-600 to-indigo-700'
  }

  it('renders title and subtitle correctly', () => {
    render(<GradientHeader {...defaultProps} />)
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
  })

  it('applies gradient class correctly', () => {
    render(<GradientHeader {...defaultProps} />)
    
    const gradientElement = screen.getByText('Test Title').closest('.bg-gradient-to-r')
    expect(gradientElement).toBeInTheDocument()
    expect(gradientElement).toHaveClass('from-blue-600', 'to-indigo-700')
  })

  it('renders with custom icon background', () => {
    const customIconBg = 'bg-red-100'
    render(<GradientHeader {...defaultProps} iconBg={customIconBg} />)
    
    // Vérifier que l'icône a le bon background
    const iconContainer = screen.getByText('Test Title').parentElement?.parentElement?.querySelector('.bg-red-100')
    expect(iconContainer).toBeInTheDocument()
  })

  it('renders with default icon background when not specified', () => {
    render(<GradientHeader {...defaultProps} />)
    
    // Vérifier que l'icône a le background par défaut
    const iconContainer = screen.getByText('Test Title').parentElement?.parentElement?.querySelector('.bg-white')
    expect(iconContainer).toBeInTheDocument()
  })

  it('has proper structure with card and content', () => {
    render(<GradientHeader {...defaultProps} />)
    
    // Vérifier la structure de base
    const cardElement = screen.getByText('Test Title').closest('[role="region"]') || 
                       screen.getByText('Test Title').closest('.overflow-hidden')
    expect(cardElement).toBeInTheDocument()
  })

  it('renders icon twice (main and background)', () => {
    render(<GradientHeader {...defaultProps} />)
    
    // Il devrait y avoir 2 instances de l'icône (une dans le cercle, une en arrière-plan)
    const icons = document.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThanOrEqual(2)
  })
}) 