'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormField, TextInput } from '@/components/Form'
import { Button } from '@/components/Button'
import { useForm } from '@/hooks/useForm'
import { useNotification } from '@/contexts/NotificationContext'
import { dateUtils } from '@/utils/dateUtils'
import { priceUtils } from '@/utils/priceUtils'
import type { CleaningQuote } from '@/types/quote'
import { cardUtils } from '@/utils/cardUtils'

interface PaymentFormData {
  fullName: string
  email: string
  phone: string
  cardNumber: string
  expiryDate: string
  cvv: string
}

export default function CleaningPayment() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('id')
  const { showNotification } = useNotification()
  const [quote, setQuote] = useState<CleaningQuote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const { formData, handleChange } = useForm<PaymentFormData>({
    fullName: '',
    email: '',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  })

  useEffect(() => {
    if (quoteId) {
      fetch(`/api/cleaning/${quoteId}`)
        .then(res => res.json())
        .then(data => {
          setQuote(data)
          setIsLoading(false)
        })
        .catch(err => {
          console.error('Error fetching quote:', err)
          showNotification('error', 'Failed to load quote details')
          setIsLoading(false)
        })
    }
  }, [quoteId, showNotification])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      const response = await fetch('/api/cleaning/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId,
          ...formData
        })
      })

      if (response.ok) {
        showNotification('success', 'Payment processed successfully')
        router.push(`/cleaning/success?id=${quoteId}`)
      } else {
        throw new Error('Payment failed')
      }
    } catch (error) {
      showNotification('error', 'Failed to process payment')
      console.error('Payment error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = cardUtils.formatCardNumber(e.target.value)
    handleChange({ ...e, target: { ...e.target, value } })
  }

  const formatExpiryDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = cardUtils.formatExpiryDate(e.target.value)
    handleChange({ ...e, target: { ...e.target, value } })
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!quote) {
    return <div className="p-8 text-center">Quote not found</div>
  }

  const deposit = priceUtils.calculateDeposit(quote.estimatedPrice)
  const { tax, total } = priceUtils.calculateTotal(quote.estimatedPrice)

  return (
    <main className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Payment Details</h1>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Service Summary</h2>
          <dl className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <dt className="text-gray-500">Service Date</dt>
              <dd className="font-medium">
                {dateUtils.format(quote.preferredDate, 'long')}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Service Time</dt>
              <dd className="font-medium">{quote.preferredTime}</dd>
            </div>
          </dl>

          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Amount</span>
              <span>{priceUtils.format(total)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <span>Required Deposit (30%)</span>
              <span>{priceUtils.format(deposit)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <FormField label="Full Name" className="col-span-2">
              <TextInput
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </FormField>

            <FormField label="Email">
              <TextInput
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                required
              />
            </FormField>

            <FormField label="Phone">
              <TextInput
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+41 XX XXX XX XX"
                required
              />
            </FormField>

            <FormField label="Card Number" className="col-span-2">
              <TextInput
                name="cardNumber"
                value={formData.cardNumber}
                onChange={formatCardNumber}
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                required
              />
            </FormField>

            <FormField label="Expiry Date">
              <TextInput
                name="expiryDate"
                value={formData.expiryDate}
                onChange={formatExpiryDate}
                placeholder="MM/YY"
                maxLength={5}
                required
              />
            </FormField>

            <FormField label="CVV">
              <TextInput
                name="cvv"
                value={formData.cvv}
                onChange={handleChange}
                placeholder="123"
                maxLength={4}
                required
              />
            </FormField>
          </div>

          <div className="mt-8">
            <Button
              type="submit"
              className="w-full"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : `Pay Deposit (${priceUtils.format(deposit)})`}
            </Button>
            <p className="mt-2 text-sm text-gray-500 text-center">
              Your card will be charged {priceUtils.format(deposit)}. 
              The remaining balance of {priceUtils.format(total - deposit)} will be due after the service.
            </p>
          </div>
        </form>
      </div>
    </main>
  )
} 