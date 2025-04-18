"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ArrowPathIcon, 
  ClipboardDocumentCheckIcon,
  ReceiptPercentIcon,
  BanknotesIcon,
  ScaleIcon,
  TagIcon
} from "@heroicons/react/24/outline"

const categories = [
  { value: 'REDUCTION', label: 'Réduction', icon: ReceiptPercentIcon },
  { value: 'SURCHARGE', label: 'Majoration', icon: BanknotesIcon },
  { value: 'MINIMUM', label: 'Minimum', icon: ScaleIcon },
  { value: 'MAXIMUM', label: 'Maximum', icon: ScaleIcon },
  { value: 'FIXED', label: 'Fixe', icon: TagIcon },
  { value: 'PERCENTAGE', label: 'Pourcentage', icon: ReceiptPercentIcon },
]

export function RulesConfig() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const [rules, setRules] = useState<any[]>([])

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/rules')
      const data = await response.json()
      setRules(data)
      setLoading(false)
    } catch (error) {
      console.error("Erreur lors du chargement des règles:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les règles",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const response = await fetch('/api/admin/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rules),
      })
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: "Règles mises à jour avec succès",
        })
      } else {
        throw new Error("Erreur lors de la sauvegarde")
      }
      setSaving(false)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les règles",
        variant: "destructive",
      })
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex flex-col items-center gap-2 text-purple-600">
          <ArrowPathIcon className="h-10 w-10 animate-spin" />
          <p className="text-purple-900 font-medium">Chargement des données...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-8">
        {categories.map(({ value, label, icon: Icon }) => (
          <Card key={value} className="border border-purple-100 shadow-sm overflow-hidden">
            <div className="bg-purple-500 px-5 py-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {label}
              </h4>
            </div>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {rules
                  .filter(rule => rule.category === value)
                  .map(rule => (
                    <div key={rule.id} className="space-y-2">
                      <Label htmlFor={rule.id} className="text-sm font-medium">
                        {rule.name}
                      </Label>
                      <Input
                        id={rule.id}
                        name={rule.id}
                        type="number"
                        value={rule.value}
                        onChange={(e) => {
                          setRules(prev => prev.map(r => 
                            r.id === rule.id 
                              ? { ...r, value: parseFloat(e.target.value) }
                              : r
                          ))
                        }}
                        className="border-0 bg-purple-50/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end mt-8">
        <Button 
          type="submit" 
          disabled={saving}
          size="lg"
          className="gap-2 transition-all bg-purple-500 hover:bg-purple-600 text-white shadow-lg px-8 rounded-lg"
        >
          {saving ? (
            <>
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <ClipboardDocumentCheckIcon className="h-5 w-5" />
              Enregistrer les modifications
            </>
          )}
        </Button>
      </div>
    </form>
  )
} 