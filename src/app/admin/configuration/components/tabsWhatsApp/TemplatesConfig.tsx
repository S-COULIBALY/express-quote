"use client"

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoCircledIcon } from '@radix-ui/react-icons';

export function TemplatesConfig() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Templates de Messages</h3>
          <p className="text-sm text-gray-500">
            Gérez vos templates de messages WhatsApp Business
          </p>
        </div>
        <Button>Nouveau Template</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Langue</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>quote_request_confirmation</TableCell>
            <TableCell>
              <Badge variant="outline">UTILITY</Badge>
            </TableCell>
            <TableCell>FR</TableCell>
            <TableCell>
              <Badge variant="success">Approuvé</Badge>
            </TableCell>
            <TableCell className="space-x-2">
              <Button variant="outline" size="sm">Éditer</Button>
              <Button variant="outline" size="sm">Supprimer</Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>quote_ready</TableCell>
            <TableCell>
              <Badge variant="outline">UTILITY</Badge>
            </TableCell>
            <TableCell>FR</TableCell>
            <TableCell>
              <Badge variant="success">Approuvé</Badge>
            </TableCell>
            <TableCell className="space-x-2">
              <Button variant="outline" size="sm">Éditer</Button>
              <Button variant="outline" size="sm">Supprimer</Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>booking_confirmation</TableCell>
            <TableCell>
              <Badge variant="outline">UTILITY</Badge>
            </TableCell>
            <TableCell>FR</TableCell>
            <TableCell>
              <Badge variant="success">Approuvé</Badge>
            </TableCell>
            <TableCell className="space-x-2">
              <Button variant="outline" size="sm">Éditer</Button>
              <Button variant="outline" size="sm">Supprimer</Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <InfoCircledIcon className="h-4 w-4" />
            Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          Les templates doivent être approuvés par WhatsApp avant de pouvoir être utilisés.
          Le processus d'approbation peut prendre jusqu'à 24 heures.
        </CardContent>
      </Card>
    </div>
  );
} 