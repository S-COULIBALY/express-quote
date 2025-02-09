'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import { FormField, TextInput, TextArea } from '@/components/Form'

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      // TODO: Implement settings update
      await new Promise(resolve => setTimeout(resolve, 1000))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="border-b pb-6">
            <h2 className="text-lg font-medium mb-4">Email Settings</h2>
            <div className="grid grid-cols-1 gap-6">
              <FormField label="SMTP Host">
                <TextInput name="smtpHost" required />
              </FormField>
              <FormField label="SMTP Port">
                <TextInput name="smtpPort" type="number" required />
              </FormField>
              <FormField label="SMTP Username">
                <TextInput name="smtpUsername" required />
              </FormField>
              <FormField label="SMTP Password">
                <TextInput name="smtpPassword" type="password" required />
              </FormField>
            </div>
          </div>

          <div className="border-b pb-6">
            <h2 className="text-lg font-medium mb-4">Quote Settings</h2>
            <div className="grid grid-cols-1 gap-6">
              <FormField label="Default Deposit Percentage">
                <TextInput 
                  name="depositPercentage" 
                  type="number" 
                  min="0" 
                  max="100"
                  defaultValue="30"
                  required 
                />
              </FormField>
              <FormField label="Quote Terms & Conditions">
                <TextArea 
                  name="termsAndConditions"
                  rows={4}
                  required
                />
              </FormField>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isSaving}
          >
            Save Settings
          </Button>
        </form>
      </div>
    </div>
  )
} 