"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DocumentTextIcon, ArrowPathIcon } from "@heroicons/react/24/outline"

interface EmailTypesConfigProps {
  config: any;
  saving: boolean;
  teamMapping: Record<string, string>;
  emailTypeMapping: Record<string, string>;
  onCheckboxChange: (emailType: string, team: string, checked: boolean) => void;
  onIncludeClientChange: (emailType: string, checked: boolean) => void;
  onExternalProviderChange: (emailType: string, providerId: string, checked: boolean) => void;
  onReset: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EmailTypesConfig({
  config,
  saving,
  teamMapping,
  emailTypeMapping,
  onCheckboxChange,
  onIncludeClientChange,
  onExternalProviderChange,
  onReset,
  onSubmit
}: EmailTypesConfigProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-800">
          <DocumentTextIcon className="h-5 w-5" />
          Types d'emails
        </CardTitle>
        <CardDescription>
          Configuration des destinataires pour chaque type d'email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(config.emailTypes).map(([type, settings]: [string, any]) => (
          <div key={type} className="p-4 border rounded-lg bg-cyan-50/20">
            <h3 className="text-lg font-medium text-cyan-800 mb-2">
              {emailTypeMapping[type] || type}
            </h3>
            
            <div className="mb-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id={`include-client-${type}`}
                  checked={settings.includeClient}
                  onCheckedChange={(checked) => 
                    onIncludeClientChange(type, checked === true)
                  }
                />
                <Label htmlFor={`include-client-${type}`}>
                  Envoyer au client
                </Label>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Équipes internes en copie :</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(teamMapping).map(([teamKey, teamLabel]) => (
                  <div key={teamKey} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`${type}-${teamKey}`}
                      checked={settings.internal.includes(teamKey)}
                      onCheckedChange={(checked) => 
                        onCheckboxChange(type, teamKey, checked === true)
                      }
                    />
                    <Label htmlFor={`${type}-${teamKey}`}>
                      {teamLabel}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            {config.externalProviders.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Prestataires externes en copie :</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {config.externalProviders.map((provider: any) => (
                    <div key={provider.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`${type}-external-${provider.id}`}
                        checked={settings.external.includes(provider.id)}
                        onCheckedChange={(checked) => 
                          onExternalProviderChange(type, provider.id, checked === true)
                        }
                      />
                      <Label htmlFor={`${type}-external-${provider.id}`} className="flex items-center">
                        <span className="mr-1">{provider.name}</span>
                        <span className="text-xs text-gray-500">({provider.email})</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        
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