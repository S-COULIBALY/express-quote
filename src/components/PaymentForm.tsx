import { FormField, TextInput } from './Form'
import { Button } from './Button'

interface PaymentFormData {
  fullName: string
  email: string
  phone: string
  cardNumber: string
  expiryDate: string
  cvv: string
}

interface PaymentFormProps {
  onSubmit: (data: PaymentFormData) => Promise<void>
  amount: number
  isLoading?: boolean
}

export function PaymentForm({ onSubmit, amount, isLoading = false }: PaymentFormProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    await onSubmit({
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      cardNumber: formData.get('cardNumber') as string,
      expiryDate: formData.get('expiryDate') as string,
      cvv: formData.get('cvv') as string,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <p className="text-lg font-semibold">Amount to Pay: ${amount.toFixed(2)}</p>
        <p className="text-sm text-gray-600">30% deposit required</p>
      </div>

      <FormField label="Full Name">
        <TextInput
          name="fullName"
          type="text"
          required
          placeholder="John Doe"
        />
      </FormField>

      <FormField label="Email">
        <TextInput
          name="email"
          type="email"
          required
          placeholder="john@example.com"
        />
      </FormField>

      <FormField label="Phone">
        <TextInput
          name="phone"
          type="tel"
          required
          placeholder="+1 234 567 8900"
        />
      </FormField>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Card Information</h3>
        
        <div className="space-y-4">
          <FormField label="Card Number">
            <TextInput
              name="cardNumber"
              type="text"
              required
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              pattern="\d*"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Expiry Date">
              <TextInput
                name="expiryDate"
                type="text"
                required
                placeholder="MM/YY"
                maxLength={5}
              />
            </FormField>
            
            <FormField label="CVV">
              <TextInput
                name="cvv"
                type="text"
                required
                placeholder="123"
                maxLength={4}
                pattern="\d*"
              />
            </FormField>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        isLoading={isLoading}
        className="w-full"
      >
        Pay Now
      </Button>
    </form>
  )
} 