"use client"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { DocumentTextIcon, ArrowPathIcon } from "@heroicons/react/24/outline"

interface TemplatesConfigProps {
  config: any;
  saving: boolean;
  onTemplateUpdate: (type: string, htmlContent: string) => void;
  onReset: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function TemplatesConfig({
  config,
  saving,
  onTemplateUpdate,
  onReset,
  onSubmit
}: TemplatesConfigProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-800">
          <DocumentTextIcon className="h-5 w-5" />
          Templates de messages
        </CardTitle>
        <CardDescription>
          Personnalisation des templates d'emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 mb-2">
          Utilisez ces variables pour personnaliser vos templates :
          <code className="mx-1 px-1 py-0.5 bg-gray-200 rounded text-xs font-mono">
            {"{clientName}"}, {"{reference}"}, {"{date}"}, {"{amount}"}
          </code>
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="templates.quoteConfirmation">
              Confirmation de devis
            </Label>
            <Textarea 
              id="templates.quoteConfirmation" 
              value={config.templates.quoteConfirmation} 
              onChange={(e) => onTemplateUpdate('quoteConfirmation', e.target.value)}
              className="font-mono text-xs h-36 mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="templates.bookingConfirmation">
              Confirmation de réservation
            </Label>
            <Textarea 
              id="templates.bookingConfirmation" 
              value={config.templates.bookingConfirmation} 
              onChange={(e) => onTemplateUpdate('bookingConfirmation', e.target.value)}
              className="font-mono text-xs h-36 mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="templates.paymentConfirmation">
              Confirmation de paiement
            </Label>
            <Textarea 
              id="templates.paymentConfirmation" 
              value={config.templates.paymentConfirmation} 
              onChange={(e) => onTemplateUpdate('paymentConfirmation', e.target.value)}
              className="font-mono text-xs h-36 mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="templates.paymentReceipt">
              Reçu de paiement
            </Label>
            <Textarea 
              id="templates.paymentReceipt" 
              value={config.templates.paymentReceipt} 
              onChange={(e) => onTemplateUpdate('paymentReceipt', e.target.value)}
              className="font-mono text-xs h-36 mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="templates.appointmentReminder">
              Rappel de rendez-vous
            </Label>
            <Textarea 
              id="templates.appointmentReminder" 
              value={config.templates.appointmentReminder} 
              onChange={(e) => onTemplateUpdate('appointmentReminder', e.target.value)}
              className="font-mono text-xs h-36 mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="templates.cancellationNotification">
              Notification d'annulation
            </Label>
            <Textarea 
              id="templates.cancellationNotification" 
              value={config.templates.cancellationNotification} 
              onChange={(e) => onTemplateUpdate('cancellationNotification', e.target.value)}
              className="font-mono text-xs h-36 mt-1"
            />
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