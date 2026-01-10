'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  getModulesConfig,
  getModulesConfigCategories,
  updateModulesConfigValue,
  removeModulesConfigOverride,
  type ModulesConfigPath,
} from '@/actions/adminModulesConfig'
import {
  Cog6ToothIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

export default function ModulesConfigAdminPage() {
  const [configs, setConfigs] = useState<ModulesConfigPath[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [configsData, categoriesData] = await Promise.all([
        getModulesConfig(),
        getModulesConfigCategories(),
      ])
      setConfigs(configsData)
      setCategories(categoriesData)
      if (categoriesData.length > 0 && !selectedCategory) {
        setSelectedCategory(categoriesData[0])
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des configurations')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (path: string, currentValue: any) => {
    setEditing({
      ...editing,
      [path]: String(currentValue),
    })
  }

  const handleCancel = (path: string) => {
    const newEditing = { ...editing }
    delete newEditing[path]
    setEditing(newEditing)
  }

  const handleSave = async (config: ModulesConfigPath) => {
    const newValue = editing[config.path]
    if (newValue === undefined) return

    try {
      setSaving({ ...saving, [config.path]: true })

      // Convertir la valeur selon le type
      let convertedValue: any = newValue
      if (config.type === 'number') {
        convertedValue = parseFloat(newValue)
        if (isNaN(convertedValue)) {
          toast.error('Valeur numérique invalide')
          return
        }
      } else if (config.type === 'boolean') {
        convertedValue = newValue === 'true'
      }

      const result = await updateModulesConfigValue(config.path, convertedValue)

      if (result.success) {
        toast.success('Configuration mise à jour avec succès')
        handleCancel(config.path)
        await loadData() // Recharger les données
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
      console.error(error)
    } finally {
      setSaving({ ...saving, [config.path]: false })
    }
  }

  const handleRemoveOverride = async (config: ModulesConfigPath) => {
    if (!confirm(`Supprimer l'override pour ${config.path} ? La valeur par défaut sera utilisée.`)) {
      return
    }

    try {
      const result = await removeModulesConfigOverride(config.path)
      if (result.success) {
        toast.success('Override supprimé avec succès')
        await loadData()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
      console.error(error)
    }
  }

  const filteredConfigs = selectedCategory
    ? configs.filter((c) => c.category === selectedCategory)
    : configs

  const groupedConfigs = filteredConfigs.reduce((acc, config) => {
    const category = config.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(config)
    return acc
  }, {} as Record<string, ModulesConfigPath[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Chargement des configurations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuration des Modules</h1>
          <p className="mt-2 text-gray-600">
            Gérer les paramètres de tarification du système modulaire
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowPathIcon className="h-5 w-5" />
          Actualiser
        </button>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900">
                <strong>Comment ça fonctionne :</strong> Les modifications créent des <strong>overrides</strong> dans la
                base de données qui prennent effet immédiatement. Pour revenir à la valeur par défaut, supprimez
                l'override.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs par catégorie */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="capitalize flex items-center gap-2">
                  <Cog6ToothIcon className="h-5 w-5" />
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groupedConfigs[category]?.map((config) => {
                    const isEditing = editing[config.path] !== undefined
                    const isSaving = saving[config.path] === true
                    const hasOverride = config.overrideValue !== undefined

                    return (
                      <div
                        key={config.path}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono text-gray-700">{config.key}</code>
                            {hasOverride && (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                Override
                              </Badge>
                            )}
                            {config.unit && (
                              <span className="text-xs text-gray-500">({config.unit})</span>
                            )}
                          </div>
                          {config.description && (
                            <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                          )}
                          {hasOverride && (
                            <p className="text-xs text-gray-400 mt-1">
                              Par défaut : {String(config.defaultValue)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <input
                                type={config.type === 'number' ? 'number' : 'text'}
                                value={editing[config.path]}
                                onChange={(e) =>
                                  setEditing({ ...editing, [config.path]: e.target.value })
                                }
                                className="px-3 py-1 border rounded w-32 text-sm"
                                disabled={isSaving}
                              />
                              <button
                                onClick={() => handleSave(config)}
                                disabled={isSaving}
                                className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                              >
                                {isSaving ? (
                                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                ) : (
                                  <CheckCircleIcon className="h-5 w-5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleCancel(config.path)}
                                disabled={isSaving}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <XCircleIcon className="h-5 w-5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="text-right">
                                <div className="font-mono text-sm font-semibold">
                                  {String(config.value)}
                                </div>
                                {hasOverride && (
                                  <button
                                    onClick={() => handleRemoveOverride(config)}
                                    className="text-xs text-red-600 hover:text-red-700 mt-1"
                                  >
                                    Supprimer override
                                  </button>
                                )}
                              </div>
                              <button
                                onClick={() => handleEdit(config.path, config.value)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Cog6ToothIcon className="h-5 w-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
