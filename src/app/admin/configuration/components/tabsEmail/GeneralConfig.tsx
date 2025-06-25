"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowPathIcon, EnvelopeIcon } from "@heroicons/react/24/outline"

interface GeneralConfigProps {
  config: any;
  saving: boolean;
  onConfigChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNumberChange: (name: string, value: string) => void;
  onReset: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function GeneralConfig({ 
  config, 
  saving, 
  onConfigChange, 
  onNumberChange,
  onReset,
  onSubmit 
}: GeneralConfigProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-800">
          <EnvelopeIcon className="h-5 w-5" />
          Configuration du serveur email
        </CardTitle>
        <CardDescription>
          Paramètres de connexion au serveur SMTP pour l'envoi des emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="smtpHost">Serveur SMTP (Hôte)</Label>
            <Input 
              id="smtpHost" 
              name="smtpHost" 
              value={config.smtpHost} 
              onChange={onConfigChange} 
              placeholder="smtp.example.com"
            />
          </div>
          <div>
            <Label htmlFor="smtpPort">Port SMTP</Label>
            <Input 
              id="smtpPort" 
              name="smtpPort" 
              value={config.smtpPort} 
              onChange={(e) => onNumberChange('smtpPort', e.target.value)} 
              type="number"
              placeholder="25, 465, 587, etc."
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="smtpUser">Nom d'utilisateur SMTP</Label>
            <Input 
              id="smtpUser" 
              name="smtpUser" 
              value={config.smtpUser} 
              onChange={onConfigChange} 
              placeholder="user@example.com"
            />
          </div>
          <div>
            <Label htmlFor="smtpPassword">Mot de passe SMTP</Label>
            <Input 
              id="smtpPassword" 
              name="smtpPassword" 
              value={config.smtpPassword} 
              onChange={onConfigChange} 
              type="password"
              placeholder="********"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="emailFrom">Adresse d'expédition</Label>
          <Input 
            id="emailFrom" 
            name="emailFrom" 
            value={config.emailFrom} 
            onChange={onConfigChange} 
            placeholder="noreply@example.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Cette adresse sera utilisée comme expéditeur pour tous les emails
          </p>
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