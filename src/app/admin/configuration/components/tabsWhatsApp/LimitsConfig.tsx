"use client"

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoCircledIcon } from '@radix-ui/react-icons';

export function WhatsAppLimitsConfig() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Limites et Files d'attente</h3>
        <p className="text-sm text-gray-500">
          Configurez les limites de l'API et la gestion des files d'attente
        </p>
      </div>

      <div className="grid gap-6">
        <div>
          <h4 className="font-medium mb-4">Limites de l'API</h4>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="messagesPerSecond">Messages par seconde</Label>
              <Input
                id="messagesPerSecond"
                type="number"
                defaultValue={20}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="messagesPerDay">Messages par jour</Label>
              <Input
                id="messagesPerDay"
                type="number"
                defaultValue={1000}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="templateMessagesPerDay">Messages template par jour</Label>
              <Input
                id="templateMessagesPerDay"
                type="number"
                defaultValue={500}
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-4">Configuration de la file d'attente</h4>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="batchSize">Taille des lots</Label>
              <Input
                id="batchSize"
                type="number"
                defaultValue={10}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="processInterval">Intervalle de traitement (ms)</Label>
              <Input
                id="processInterval"
                type="number"
                defaultValue={1000}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxRetries">Nombre maximum de tentatives</Label>
              <Input
                id="maxRetries"
                type="number"
                defaultValue={3}
              />
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
          <InfoCircledIcon className="h-4 w-4" />
              État actuel de la file d'attente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>Messages en attente : 5</div>
            <div>Messages prioritaires : 2</div>
            <div>Messages en échec : 0</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 