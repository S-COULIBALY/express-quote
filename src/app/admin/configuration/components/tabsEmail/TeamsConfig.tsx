"use client"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowPathIcon, UserGroupIcon } from "@heroicons/react/24/outline"

interface TeamsConfigProps {
  config: any;
  saving: boolean;
  onTeamEmailsChange: (team: string, value: string) => void;
  onReset: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function TeamsConfig({
  config,
  saving,
  onTeamEmailsChange,
  onReset,
  onSubmit
}: TeamsConfigProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-800">
          <UserGroupIcon className="h-5 w-5" />
          Équipes internes
        </CardTitle>
        <CardDescription>
          Adresses email des différentes équipes qui recevront des notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="salesTeamEmails">Équipe commerciale</Label>
            <Textarea 
              id="salesTeamEmails" 
              value={config.salesTeamEmails.join('; ')} 
              onChange={(e) => onTeamEmailsChange('salesTeamEmails', e.target.value)} 
              placeholder="commercial@example.com; directeur@example.com"
              className="min-h-[80px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Séparez plusieurs adresses par des points-virgules (;)
            </p>
          </div>
          <div>
            <Label htmlFor="accountingEmails">Comptabilité</Label>
            <Textarea 
              id="accountingEmails" 
              value={config.accountingEmails.join('; ')} 
              onChange={(e) => onTeamEmailsChange('accountingEmails', e.target.value)} 
              placeholder="comptabilite@example.com; finance@example.com"
              className="min-h-[80px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Séparez plusieurs adresses par des points-virgules (;)
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="professionalsEmails">Professionnels (déménageurs)</Label>
            <Textarea 
              id="professionalsEmails" 
              value={config.professionalsEmails.join('; ')} 
              onChange={(e) => onTeamEmailsChange('professionalsEmails', e.target.value)} 
              placeholder="demenageurs@example.com; chauffeurs@example.com"
              className="min-h-[80px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Séparez plusieurs adresses par des points-virgules (;)
            </p>
          </div>
          <div>
            <Label htmlFor="notificationsEmails">Notifications générales</Label>
            <Textarea 
              id="notificationsEmails" 
              value={config.notificationsEmails.join('; ')} 
              onChange={(e) => onTeamEmailsChange('notificationsEmails', e.target.value)} 
              placeholder="notifications@example.com; support@example.com"
              className="min-h-[80px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Séparez plusieurs adresses par des points-virgules (;)
            </p>
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