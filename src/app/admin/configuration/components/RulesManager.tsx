"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { ServiceType, RuleCategory, Rule } from "@/types/rules"

export function RulesManager() {
  const [rules, setRules] = useState<Rule[]>([])
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | "">("")
  const [selectedCategory, setSelectedCategory] = useState<RuleCategory | "">("")
  const { toast } = useToast()

  useEffect(() => {
    loadRules()
  }, [selectedServiceType, selectedCategory])

  const loadRules = async () => {
    try {
      setLoading(true)
      let url = '/api/admin/rules'
      if (selectedServiceType && selectedCategory) {
        url = `/api/admin/rules/service-type/${selectedServiceType}/category/${selectedCategory}`
      } else if (selectedServiceType) {
        url = `/api/admin/rules/service-type/${selectedServiceType}`
      } else if (selectedCategory) {
        url = `/api/admin/rules/category/${selectedCategory}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to load rules')
      const data = await response.json()
      setRules(data)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les règles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveRule = async (rule: Rule) => {
    try {
      const response = await fetch('/api/admin/rules', {
        method: rule.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rule),
      })

      if (!response.ok) throw new Error('Failed to save rule')

      toast({
        title: "Succès",
        description: `Règle ${rule.id ? 'modifiée' : 'créée'} avec succès`,
      })

      await loadRules()
      setEditingRule(null)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la règle",
        variant: "destructive",
      })
    }
  }

  const deleteRule = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/rules/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete rule')

      toast({
        title: "Succès",
        description: "Règle supprimée avec succès",
      })

      await loadRules()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la règle",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des règles</h2>
        <Button onClick={() => setEditingRule({
          id: '',
          name: '',
          description: '',
          serviceType: ServiceType.MOVING,
          category: RuleCategory.BUSINESS_RULES,
          value: 0,
          percentBased: true,
          isActive: true
        })}>
          Ajouter une règle
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="w-1/2">
          <Label>Type de service</Label>
          <Select
            value={selectedServiceType}
            onValueChange={(value: ServiceType | "") => setSelectedServiceType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les types</SelectItem>
              {Object.values(ServiceType).map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-1/2">
          <Label>Catégorie</Label>
          <Select
            value={selectedCategory}
            onValueChange={(value: RuleCategory | "") => setSelectedCategory(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les catégories</SelectItem>
              {Object.values(RuleCategory).map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map(rule => (
            <Card key={rule.id}>
              <CardHeader>
                <CardTitle>{rule.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{rule.description}</p>
                <div className="mt-4 space-y-2">
                  <p><strong>Type:</strong> {rule.serviceType}</p>
                  <p><strong>Catégorie:</strong> {rule.category}</p>
                  <p><strong>Valeur:</strong> {rule.value}{rule.percentBased ? '%' : '€'}</p>
                  {rule.condition && (
                    <p><strong>Condition:</strong> {rule.condition.type}</p>
                  )}
                  <div className="flex items-center space-x-2">
                    <Switch checked={rule.isActive} />
                    <Label>Active</Label>
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button variant="outline" onClick={() => setEditingRule(rule)}>
                    Modifier
                  </Button>
                  <Button variant="destructive" onClick={() => deleteRule(rule.id)}>
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editingRule && (
        <Card className="fixed inset-0 m-auto max-w-2xl p-6">
          <CardHeader>
            <CardTitle>{editingRule.id ? 'Modifier la règle' : 'Nouvelle règle'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault()
              saveRule(editingRule)
            }} className="space-y-4">
              <div>
                <Label>Nom</Label>
                <Input
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({...editingRule, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={editingRule.description}
                  onChange={(e) => setEditingRule({...editingRule, description: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Type de service</Label>
                <Select
                  value={editingRule.serviceType}
                  onValueChange={(value: ServiceType) => setEditingRule({...editingRule, serviceType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ServiceType).map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Catégorie</Label>
                <Select
                  value={editingRule.category}
                  onValueChange={(value: RuleCategory) => setEditingRule({...editingRule, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(RuleCategory).map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valeur</Label>
                <Input
                  type="number"
                  value={editingRule.value}
                  onChange={(e) => setEditingRule({...editingRule, value: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingRule.percentBased}
                  onCheckedChange={(checked: boolean) => setEditingRule({...editingRule, percentBased: checked})}
                />
                <Label>Pourcentage</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingRule.isActive}
                  onCheckedChange={(checked: boolean) => setEditingRule({...editingRule, isActive: checked})}
                />
                <Label>Active</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditingRule(null)}>
                  Annuler
                </Button>
                <Button type="submit">
                  Sauvegarder
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 