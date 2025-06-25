"use client"

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function SessionsConfig() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Gestion des Sessions</h3>
        <p className="text-sm text-gray-500">
          Configurez les paramètres de gestion des sessions WhatsApp
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="sessionTimeout">Durée de session (heures)</Label>
          <Input
            id="sessionTimeout"
            type="number"
            defaultValue={24}
          />
          <p className="text-sm text-gray-500">
            Durée après laquelle une session est considérée comme expirée
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="cleanupInterval">Intervalle de nettoyage (minutes)</Label>
          <Input
            id="cleanupInterval"
            type="number"
            defaultValue={60}
          />
          <p className="text-sm text-gray-500">
            Fréquence de nettoyage des sessions expirées
          </p>
        </div>

        <div className="pt-4">
          <h4 className="font-medium mb-2">Sessions actives</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Dernière activité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>+33612345678</TableCell>
                <TableCell>Il y a 5 minutes</TableCell>
                <TableCell>
                  <Badge>Active</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">Terminer</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 