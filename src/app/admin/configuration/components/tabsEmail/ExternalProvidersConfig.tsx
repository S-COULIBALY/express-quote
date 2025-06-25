"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BuildingOfficeIcon, PlusIcon, XMarkIcon, ArrowPathIcon } from "@heroicons/react/24/outline"

interface ExternalProvidersConfigProps {
  config: any;
  saving: boolean;
  onExternalProviderAdd: () => void;
  onExternalProviderUpdate: (index: number, fieldName: string, value: string) => void;
  onExternalProviderDelete: (providerId: string) => void;
  onReset: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ExternalProvidersConfig({
  config,
  saving,
  onExternalProviderAdd,
  onExternalProviderUpdate,
  onExternalProviderDelete,
  onReset,
  onSubmit
}: ExternalProvidersConfigProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-800">
          <BuildingOfficeIcon className="h-5 w-5" />
          Prestataires externes
        </CardTitle>
        <CardDescription>
          Gestion des prestataires externes qui peuvent recevoir des devis et communications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between mb-4">
          <h3 className="text-base font-medium">Liste des prestataires externes</h3>
          <Button 
            type="button" 
            onClick={onExternalProviderAdd}
            variant="outline"
            className="flex items-center gap-1"
          >
            <PlusIcon className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
        
        {config.externalProviders.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-lg">
            <BuildingOfficeIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">Aucun prestataire externe. Ajoutez-en un pour commencer.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {config.externalProviders.map((provider: any, index: number) => (
              <div key={provider.id} className="p-4 border rounded-lg bg-slate-50/50 relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                  onClick={() => onExternalProviderDelete(provider.id)}
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`provider-name-${index}`}>Nom</Label>
                    <Input
                      id={`provider-name-${index}`}
                      value={provider.name}
                      onChange={(e) => onExternalProviderUpdate(index, 'name', e.target.value)}
                      placeholder="Nom du prestataire"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`provider-email-${index}`}>Email</Label>
                    <Input
                      id={`provider-email-${index}`}
                      value={provider.email}
                      onChange={(e) => onExternalProviderUpdate(index, 'email', e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`provider-category-${index}`}>Catégorie</Label>
                    <Select
                      value={provider.category}
                      onValueChange={(value) => onExternalProviderUpdate(index, 'category', value)}
                    >
                      <SelectTrigger id={`provider-category-${index}`}>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Général</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="storage">Stockage</SelectItem>
                        <SelectItem value="packing">Emballage</SelectItem>
                        <SelectItem value="cleaning">Nettoyage</SelectItem>
                        <SelectItem value="insurance">Assurance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="pt-4 flex justify-end">
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