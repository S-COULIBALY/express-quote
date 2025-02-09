'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FormField, TextInput, Select, TextArea } from '@/components/Form'
import { Button } from '@/components/Button'
import { useForm } from '@/hooks/useForm'
import { useApi } from '@/hooks/useApi'
import { BaseQuoteFormData, CleaningQuote } from '@/types/quote'

export default function EditCleaningQuote({ 
  params 
}: { 
  params: { id: string } 
}) {
  const router = useRouter()
  const { formData, setFormData, handleChange } = useForm<BaseQuoteFormData>({
    propertyType: '',
    squareMeters: '',
    numberOfRooms: '',
    numberOfBathrooms: '',
    cleaningType: '',
    frequency: 'one-time',
    preferredDate: '',
    preferredTime: '',
    specialRequests: ''
  })

  const { isLoading, error, request } = useApi<CleaningQuote>({
    onError: (error) => {
      // TODO: Afficher une notification d'erreur
      console.error('API Error:', error)
    }
  })

  useEffect(() => {
    request(`/api/cleaning/${params.id}`).then(({ data }) => {
      if (data) {
        const { id, status, estimatedPrice, createdAt, ...formFields } = data
        setFormData(formFields)
      }
    })
  }, [params.id, setFormData, request])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { error } = await request(`/api/cleaning/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(formData)
    })

    if (!error) {
      router.push(`/cleaning/${params.id}`)
    }
  }

  if (isLoading) {
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