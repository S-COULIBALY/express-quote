'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FormField, TextInput, Select, TextArea } from '@/components/Form'
import { Button } from '@/components/Button'
import { useForm } from '@/hooks/useForm'
import { useApi } from '@/hooks/useApi'
import type { BaseQuoteFormData, CleaningQuote } from '@/types/quote'
import { useNotification } from '@/contexts/NotificationContext'

interface EditQuoteFormData extends BaseQuoteFormData {
  id: string
  status: string
}

export default function EditQuote({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { showNotification } = useNotification()
  const api = useApi<CleaningQuote>()

  const { formData, setFormData, handleChange } = useForm<EditQuoteFormData>({
    id: '',
    propertyType: '',
    squareMeters: '',
    numberOfRooms: '',
    numberOfBathrooms: '',
    cleaningType: '',
    frequency: '',
    preferredDate: '',
    preferredTime: '',
    status: '',
    specialRequests: ''
  })

  useEffect(() => {
    const fetchQuote = async () => {
      const result = await api.request(`/api/cleaning/${params.id}`)
      if (result.data) {
        setFormData(result.data)
      }
    }
    fetchQuote()
  }, [params.id, api, setFormData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await api.request(`/api/cleaning/${params.id}`, {
        method: 'PUT',
        body: formData
      })
      if (result.data) {
        showNotification('success', 'Devis mis à jour avec succès')
        router.push('/dashboard/quotes')
      }
    } catch (error) {
      showNotification('error', 'Erreur lors de la mise à jour du devis')
    }
  }

  if (api.isLoading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <main className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Cleaning Quote</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField label="Property Type">
            <Select
              name="propertyType"
              value={formData.propertyType}
              onChange={handleChange}
              options={[
                { value: 'apartment', label: 'Apartment' },
                { value: 'house', label: 'House' },
                { value: 'office', label: 'Office' },
                { value: 'commercial', label: 'Commercial Space' }
              ]}
              required
            />
          </FormField>

          <FormField label="Square Meters">
            <TextInput
              name="squareMeters"
              type="number"
              value={formData.squareMeters}
              onChange={handleChange}
              required
            />
          </FormField>

          <FormField label="Number of Rooms">
            <TextInput
              name="numberOfRooms"
              type="number"
              value={formData.numberOfRooms}
              onChange={handleChange}
              required
            />
          </FormField>

          <FormField label="Number of Bathrooms">
            <TextInput
              name="numberOfBathrooms"
              type="number"
              value={formData.numberOfBathrooms}
              onChange={handleChange}
              required
            />
          </FormField>

          <FormField label="Cleaning Type">
            <Select
              name="cleaningType"
              value={formData.cleaningType}
              onChange={handleChange}
              options={[
                { value: 'standard', label: 'Standard Cleaning' },
                { value: 'deep', label: 'Deep Cleaning' },
                { value: 'move-in', label: 'Move-in/Move-out Cleaning' },
                { value: 'post-construction', label: 'Post-construction Cleaning' }
              ]}
              required
            />
          </FormField>

          <FormField label="Frequency">
            <Select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              options={[
                { value: 'one-time', label: 'One-time Service' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'bi-weekly', label: 'Bi-weekly' },
                { value: 'monthly', label: 'Monthly' }
              ]}
              required
            />
          </FormField>

          <FormField label="Preferred Date">
            <TextInput
              name="preferredDate"
              type="date"
              value={formData.preferredDate}
              onChange={handleChange}
              required
            />
          </FormField>

          <FormField label="Preferred Time">
            <Select
              name="preferredTime"
              value={formData.preferredTime}
              onChange={handleChange}
              options={[
                { value: 'morning', label: 'Morning (8:00 - 12:00)' },
                { value: 'afternoon', label: 'Afternoon (12:00 - 16:00)' },
                { value: 'evening', label: 'Evening (16:00 - 20:00)' }
              ]}
              required
            />
          </FormField>

          <FormField label="Special Requests">
            <TextArea
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleChange}
              rows={4}
            />
          </FormField>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
} 