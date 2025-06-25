"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BellIcon, ClockIcon, ArrowPathIcon } from "@heroicons/react/24/outline"

interface RemindersConfigProps {
  config: any;
  saving: boolean;
  onReminderDayChange: (day: number, checked: boolean) => void;
  onReset: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function RemindersConfig({
  config,
  saving,
  onReminderDayChange,
  onReset,
  onSubmit
}: RemindersConfigProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-800">
          <BellIcon className="h-5 w-5" />
          Rappels automatiques
        </CardTitle>
        <CardDescription>
          Configuration des rappels de rendez-vous
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-base font-medium text-gray-800 mb-3">Jours d'envoi des rappels</h3>
          <p className="text-sm text-gray-600 mb-4">
            Sélectionnez quand envoyer des rappels avant la date du rendez-vous :
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3, 5, 7, 14].map(day => (
              <div key={day} className="flex items-center space-x-2 p-2 border rounded">
                <Checkbox 
                  id={`reminder-day-${day}`}
                  checked={config.reminderDays.includes(day)}
                  onCheckedChange={(checked) => 
                    onReminderDayChange(day, checked === true)
                  }
                />
                <Label htmlFor={`reminder-day-${day}`} className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4 text-cyan-600" />
                  {day === 1 ? 'La veille' : `${day} jours avant`}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-2 flex justify-end">
          <Button type="button" onClick={onReset} variant="outline" className="mr-2">
            Réinitialiser
          </Button>
          <Button type="submit" disabled={saving} onClick={onSubmit}>
            {saving ? (
              <>
                <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : 'Enregistrer les paramètres'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 