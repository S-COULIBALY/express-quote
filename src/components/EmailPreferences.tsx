'use client'

import React, { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/Button'

interface EmailPreferencesProps {
  customerEmail: string
  initialPreferences?: EmailPreferencesData
  onSave: (preferences: EmailPreferencesData) => Promise<void>
}

export interface EmailPreferencesData {
  receiveAppointmentReminders: boolean
  receivePromotions: boolean
  receiveInvoices: boolean
  receiveReceipts: boolean
  reminderDays: number[]
}

export function EmailPreferences({
  customerEmail,
  initialPreferences,
  onSave
}: EmailPreferencesProps) {
  const [preferences, setPreferences] = useState<EmailPreferencesData>(
    initialPreferences || {
      receiveAppointmentReminders: true,
      receivePromotions: false,
      receiveInvoices: true,
      receiveReceipts: true,
      reminderDays: [7, 3, 1]
    }
  )
  
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const handleToggle = (field: keyof EmailPreferencesData) => {
    setPreferences(prev => ({
      ...prev,
      [field]: !prev[field as keyof EmailPreferencesData]
    }))
  }
  
  const handleReminderToggle = (days: number) => {
    setPreferences(prev => {
      const newDays = prev.reminderDays.includes(days)
        ? prev.reminderDays.filter(d => d !== days)
        : [...prev.reminderDays, days].sort((a, b) => b - a)
      
      return {
        ...prev,
        reminderDays: newDays
      }
    })
  }
  
  const handleSubmit = async () => {
    try {
      setSaving(true)
      await onSave(preferences)
      setSuccess(true)
      
      // Réinitialiser le message de succès après 3 secondes
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences:', error)
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-blue-50 px-4 py-5 border-b border-blue-100">
        <h2 className="text-lg font-medium text-blue-900">Préférences de notifications</h2>
        <p className="mt-1 text-sm text-blue-700">
          Personnalisez les emails que vous recevez pour <span className="font-medium">{customerEmail}</span>
        </p>
      </div>
      
      <div className="px-4 py-5 space-y-4">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Rappels de rendez-vous</h3>
              <p className="text-xs text-gray-500">Recevez des rappels avant votre rendez-vous</p>
            </div>
            <Switch 
              checked={preferences.receiveAppointmentReminders}
              onCheckedChange={() => handleToggle('receiveAppointmentReminders')}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
          
          {preferences.receiveAppointmentReminders && (
            <div className="pl-6 border-l-2 border-gray-100">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Quand souhaitez-vous être rappelé ?</h4>
              <div className="space-y-3">
                {[7, 3, 1].map(days => (
                  <div key={days} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`reminder-${days}`}
                      checked={preferences.reminderDays.includes(days)}
                      onChange={() => handleReminderToggle(days)}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor={`reminder-${days}`} className="ml-2 block text-xs text-gray-700">
                      {days === 1 ? 'La veille' : `${days} jours avant`}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Reçus de paiement</h3>
              <p className="text-xs text-gray-500">Recevez les reçus après chaque paiement</p>
            </div>
            <Switch 
              checked={preferences.receiveReceipts}
              onCheckedChange={() => handleToggle('receiveReceipts')}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Factures</h3>
              <p className="text-xs text-gray-500">Recevez les factures par email</p>
            </div>
            <Switch 
              checked={preferences.receiveInvoices}
              onCheckedChange={() => handleToggle('receiveInvoices')}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Offres promotionnelles</h3>
              <p className="text-xs text-gray-500">Recevez nos offres et nouveautés</p>
            </div>
            <Switch 
              checked={preferences.receivePromotions}
              onCheckedChange={() => handleToggle('receivePromotions')}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
        </div>
        
        <div className="pt-5 border-t border-gray-200 flex justify-end">
          {success && (
            <div className="mr-4 text-sm text-emerald-600">
              Préférences enregistrées avec succès !
            </div>
          )}
          <Button 
            onClick={handleSubmit}
            isLoading={saving}
            disabled={saving}
          >
            Enregistrer mes préférences
          </Button>
        </div>
      </div>
    </div>
  )
} 