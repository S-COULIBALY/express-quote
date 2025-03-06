import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddressAutocomplete, PickupAddressAutocomplete, DeliveryAddressAutocomplete } from '../AddressAutocomplete'
import { useAddressAutocomplete } from '../../hooks/useAddressAutocomplete'

jest.mock('../../hooks/useAddressAutocomplete')
const mockUseAddressAutocomplete = useAddressAutocomplete as jest.Mock

const defaultHookReturn = {
  inputRef: { current: null },
  value: '',
  isValid: true,
  handleInputChange: jest.fn(),
  handleKeyDown: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseAddressAutocomplete.mockReturnValue(defaultHookReturn)
})

const defaultProps = {
  label: 'Test Address',
  id: 'test-address',
  required: false,
  onChange: jest.fn(),
  value: '',
}

describe('AddressAutocomplete', () => {
  it('renders with required props', () => {
    render(<AddressAutocomplete {...defaultProps} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows required indicator when required prop is true', () => {
    render(<AddressAutocomplete {...defaultProps} required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('shows validation warning when address is invalid', () => {
    mockUseAddressAutocomplete.mockReturnValue({
      ...defaultHookReturn,
      isValid: false,
      value: 'Invalid Address'
    })

    render(<AddressAutocomplete {...defaultProps} />)
    expect(screen.getByTitle('Adresse incomplète')).toBeInTheDocument()
    expect(screen.getByText('Veuillez sélectionner une adresse dans la liste des suggestions')).toBeInTheDocument()
  })

  it('does not show warning when address is valid', () => {
    mockUseAddressAutocomplete.mockReturnValue({
      ...defaultHookReturn,
      isValid: true,
      value: 'Valid Address'
    })

    render(<AddressAutocomplete {...defaultProps} />)
    expect(screen.queryByTitle('Adresse incomplète')).not.toBeInTheDocument()
    expect(screen.queryByText('Veuillez sélectionner une adresse dans la liste des suggestions')).not.toBeInTheDocument()
  })

  it('calls handleInputChange when input value changes', () => {
    const handleInputChange = jest.fn()
    mockUseAddressAutocomplete.mockReturnValue({
      ...defaultHookReturn,
      handleInputChange
    })

    render(<AddressAutocomplete {...defaultProps} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'New Value' } })
    expect(handleInputChange).toHaveBeenCalledWith('New Value')
  })

  it('prevents form submission on Enter key', () => {
    const mockEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true
    })

    render(<AddressAutocomplete {...defaultProps} />)
    const input = screen.getByRole('textbox')
    
    const preventDefaultSpy = jest.spyOn(mockEvent, 'preventDefault')
    
    input.dispatchEvent(mockEvent)
    
    expect(preventDefaultSpy).toHaveBeenCalled()
    
    preventDefaultSpy.mockRestore()
  })

  it('applies warning styles when address is invalid', () => {
    mockUseAddressAutocomplete.mockReturnValue({
      ...defaultHookReturn,
      isValid: false,
      value: 'Invalid Address'
    })

    render(<AddressAutocomplete {...defaultProps} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-yellow-500')
  })

  it('applies normal styles when address is valid', () => {
    mockUseAddressAutocomplete.mockReturnValue({
      ...defaultHookReturn,
      isValid: true,
      value: 'Valid Address'
    })

    render(<AddressAutocomplete {...defaultProps} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-gray-300')
  })
})

describe('PickupAddressAutocomplete', () => {
  it('renders with required props', () => {
    render(<PickupAddressAutocomplete {...defaultProps} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByLabelText('Test Address')).toBeInTheDocument()
  })

  it('passes all props to AddressAutocomplete', () => {
    const props = {
      ...defaultProps,
      required: true,
      placeholder: 'Enter pickup address'
    }

    render(<PickupAddressAutocomplete {...props} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('placeholder', 'Enter pickup address')
    expect(screen.getByText('*')).toBeInTheDocument()
  })
})

describe('DeliveryAddressAutocomplete', () => {
  it('renders with required props', () => {
    render(<DeliveryAddressAutocomplete {...defaultProps} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByLabelText('Test Address')).toBeInTheDocument()
  })

  it('passes all props to AddressAutocomplete', () => {
    const props = {
      ...defaultProps,
      required: true,
      placeholder: 'Enter delivery address'
    }

    render(<DeliveryAddressAutocomplete {...props} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('placeholder', 'Enter delivery address')
    expect(screen.getByText('*')).toBeInTheDocument()
  })
}) 