"use client"

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function AnalyticsConfig() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Analytiques WhatsApp</h3>
          <p className="text-sm text-gray-500">
            Suivez les performances de vos communications WhatsApp
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline">Exporter CSV</Button>
          <Button variant="outline">Exporter JSON</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Messages Envoyés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-gray-500">+12% vs. mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Taux de Lecture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-gray-500">+3% vs. mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Temps de Réponse Moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5.2m</div>
            <p className="text-xs text-gray-500">-1.5m vs. mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Taux d'Erreur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.5%</div>
            <p className="text-xs text-gray-500">-0.2% vs. mois dernier</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Performance des Templates</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template</TableHead>
              <TableHead>Envois</TableHead>
              <TableHead>Lectures</TableHead>
              <TableHead>Taux de Réponse</TableHead>
              <TableHead>Erreurs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>quote_request_confirmation</TableCell>
              <TableCell>450</TableCell>
              <TableCell>425</TableCell>
              <TableCell>35%</TableCell>
              <TableCell>0.2%</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>quote_ready</TableCell>
              <TableCell>380</TableCell>
              <TableCell>365</TableCell>
              <TableCell>42%</TableCell>
              <TableCell>0.5%</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>booking_confirmation</TableCell>
              <TableCell>290</TableCell>
              <TableCell>285</TableCell>
              <TableCell>28%</TableCell>
              <TableCell>0.3%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Configuration des Analytiques</h4>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="historySize">Taille maximale de l'historique</Label>
            <Input
              id="historySize"
              type="number"
              defaultValue={1000}
            />
            <p className="text-sm text-gray-500">
              Nombre maximum d'entrées conservées dans l'historique des messages
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="detailedAnalytics" />
            <Label htmlFor="detailedAnalytics">Activer les analytiques détaillées</Label>
          </div>
        </div>
      </div>
    </div>
  );
} 