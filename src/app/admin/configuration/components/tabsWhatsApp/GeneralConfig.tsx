"use client"

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoCircledIcon } from '@radix-ui/react-icons';

export function GeneralConfig() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">API WhatsApp Business</h3>
            <p className="text-sm text-gray-500">
              Configurez les paramètres de connexion à l'API WhatsApp Business
            </p>
          </div>
          <Button variant="outline">Tester la connexion</Button>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="accessToken">Access Token</Label>
            <Input
              id="accessToken"
              type="password"
              placeholder="Votre token d'accès WhatsApp Business API"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phoneNumberId">ID du numéro de téléphone</Label>
            <Input
              id="phoneNumberId"
              placeholder="ID du numéro WhatsApp Business"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="businessAccountId">ID du compte Business</Label>
            <Input
              id="businessAccountId"
              placeholder="ID de votre compte WhatsApp Business"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="verifyToken">Token de vérification Webhook</Label>
            <Input
              id="verifyToken"
              placeholder="Token pour la vérification des webhooks"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Sécurité des Webhooks</h4>
          
          <div className="flex items-center space-x-2">
            <Switch id="ipFiltering" />
            <Label htmlFor="ipFiltering">Activer le filtrage IP</Label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="allowedIPs">IPs autorisées</Label>
            <Input
              id="allowedIPs"
              placeholder="Liste d'IPs séparées par des virgules (ex: 192.168.1.1, 10.0.0.0/24)"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <InfoCircledIcon className="h-4 w-4" />
                URL du Webhook
              </CardTitle>
            </CardHeader>
            <CardContent>
              https://votre-domaine.com/api/whatsapp/webhook
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="outline">Annuler</Button>
          <Button>Enregistrer</Button>
        </div>
      </div>
    </div>
  );
} 