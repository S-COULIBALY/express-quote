"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import {
  TruckIcon,
  BuildingOffice2Icon as BuildingIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ShieldCheckIcon,
  SparklesIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  BanknotesIcon
} from "@heroicons/react/24/outline"

// ✅ MODULES EXTENSIBLES - Import des définitions de contraintes
import { MOVING_CONSTRAINTS_MODULE } from "./constraints-modules/MovingConstraintsModule"
import { CLEANING_CONSTRAINTS_MODULE } from "./constraints-modules/CleaningConstraintsModule"
// Futurs modules : TRANSPORT_CONSTRAINTS_MODULE, DELIVERY_CONSTRAINTS_MODULE

// ✅ TYPES EXTENSIBLES
interface ConstraintRule {
  id: string
  name: string
  description: string
  category: string
  serviceType: string
  impact: 'SURCHARGE' | 'REQUIREMENT' | 'WARNING' | 'SERVICE'
  value: number
  autoDetection: boolean
  isActive: boolean
  conditions?: Record<string, any>
}

interface ConstraintModule {
  serviceType: string
  serviceName: string
  icon: React.ComponentType<any>
  color: string
  categories: ConstraintCategory[]
  totalConstraints: number
}

interface ConstraintCategory {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  constraints: ConstraintRule[]
}

export function LogisticsConstraintsManager() {
  const [modules, setModules] = useState<ConstraintModule[]>([])
  const [activeModule, setActiveModule] = useState<string>("MOVING")
  const [loading, setLoading] = useState(false)
  const [synchronizing, setSynchronizing] = useState(false)

  useEffect(() => {
    initializeModules()
  }, [])

  const initializeModules = () => {
    // ✅ SYSTÈME MODULAIRE - Chargement des modules de contraintes
    const modulesList: ConstraintModule[] = [
      MOVING_CONSTRAINTS_MODULE,
      CLEANING_CONSTRAINTS_MODULE
      // Futurs modules seront ajoutés ici automatiquement
    ]

    setModules(modulesList)
  }

  const synchronizeAllModulesToDatabase = async () => {
    setSynchronizing(true)
    let totalSynchronized = 0

    try {
      for (const module of modules) {
        for (const category of module.categories) {
          for (const constraint of category.constraints) {
            if (constraint.isActive) {
              const ruleData = {
                name: constraint.name,
                description: constraint.description,
                serviceType: constraint.serviceType,
                category: 'LOGISTICS', // Catégorie unifiée
                value: constraint.value,
                type: constraint.impact === 'SURCHARGE' ? (constraint.value > 100 ? 'fixed' : 'percentage') : 'fixed',
                condition: JSON.stringify({
                  originalCategory: constraint.category,
                  serviceModule: module.serviceType,
                  autoDetection: constraint.autoDetection,
                  impact: constraint.impact,
                  conditions: constraint.conditions || {}
                }),
                isActive: constraint.isActive
              }

              // ✅ RÉUTILISATION - API existante
              const response = await fetch('/api/admin/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ruleData)
              })

              if (response.ok) {
                totalSynchronized++
              } else {
                console.warn(`Échec synchronisation: ${constraint.name}`)
              }
            }
          }
        }
      }

      toast({
        title: "✅ Synchronisation terminée",
        description: `${totalSynchronized} règles logistiques synchronisées en base de données`,
        variant: "default"
      })

    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error)
      toast({
        title: "❌ Erreur de synchronisation",
        description: "Impossible de synchroniser toutes les règles",
        variant: "destructive"
      })
    } finally {
      setSynchronizing(false)
    }
  }

  const updateConstraintInModule = (
    moduleType: string,
    categoryId: string,
    constraintId: string,
    updates: Partial<ConstraintRule>
  ) => {
    setModules(prev => prev.map(module => {
      if (module.serviceType === moduleType) {
        return {
          ...module,
          categories: module.categories.map(category => {
            if (category.id === categoryId) {
              return {
                ...category,
                constraints: category.constraints.map(constraint =>
                  constraint.id === constraintId ? { ...constraint, ...updates } : constraint
                )
              }
            }
            return category
          })
        }
      }
      return module
    }))
  }

  const getModuleStats = (module: ConstraintModule) => {
    const allConstraints = module.categories.flatMap(cat => cat.constraints)
    return {
      total: allConstraints.length,
      active: allConstraints.filter(c => c.isActive).length,
      autoDetection: allConstraints.filter(c => c.autoDetection).length,
      totalImpact: allConstraints.reduce((sum, c) => sum + (c.isActive ? c.value : 0), 0)
    }
  }

  const activeModuleData = modules.find(m => m.serviceType === activeModule)

  return (
    <div className="space-y-8">
      {/* Header premium avec métriques */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/5 to-pink-500/5 rounded-2xl blur-xl"></div>
        <div className="relative bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <ShieldCheckIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Gestionnaire de Contraintes Métiers
                  </h3>
                  <p className="text-slate-600">
                    Système modulaire extensible avec synchronisation BDD
                  </p>
                </div>
              </div>

              {/* Métriques rapides */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-600">{modules.length} modules actifs</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600">
                    {modules.reduce((total, module) => total + module.totalConstraints, 0)} contraintes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-600">
                    {modules.reduce((total, module) =>
                      total + module.categories.reduce((catTotal, cat) =>
                        catTotal + cat.constraints.filter(c => c.isActive).length, 0
                      ), 0
                    )} actives
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="bg-white/70 border-white/30 hover:bg-white/90 transition-all"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Prévisualiser
              </Button>
              <Button
                onClick={synchronizeAllModulesToDatabase}
                disabled={synchronizing}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white border-0 shadow-lg"
              >
                <ArrowDownTrayIcon className={`h-4 w-4 mr-2 ${synchronizing ? 'animate-spin' : ''}`} />
                {synchronizing ? "Synchronisation..." : "Synchroniser BDD"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Vue d'ensemble des modules - Design premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(module => {
          const stats = getModuleStats(module)
          const Icon = module.icon
          const isActive = activeModule === module.serviceType

          return (
            <div key={module.serviceType} className="relative group">
              <div className={`absolute inset-0 rounded-2xl blur-xl transition-all duration-300 ${
                isActive
                  ? `bg-gradient-to-r from-${module.color}-500/20 to-${module.color}-600/20 blur-2xl`
                  : 'bg-gradient-to-r from-slate-200/10 to-slate-300/10 group-hover:blur-2xl'
              }`}></div>
              <Card
                className={`relative cursor-pointer transition-all duration-300 border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 ${
                  isActive
                    ? 'bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl ring-2 ring-orange-500/50'
                    : 'bg-white/60 backdrop-blur-xl border border-white/30 hover:bg-white/80'
                }`}
                onClick={() => setActiveModule(module.serviceType)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isActive
                        ? `bg-gradient-to-br from-${module.color}-500 to-${module.color}-600 shadow-lg`
                        : `bg-gradient-to-br from-${module.color}-100 to-${module.color}-200`
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        isActive ? 'text-white' : `text-${module.color}-600`
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-slate-800">{module.serviceName}</h4>
                      <p className="text-sm text-slate-600">{stats.total} contraintes disponibles</p>
                    </div>
                    {isActive && (
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                    )}
                  </div>

                  {/* Stats grid premium */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
                      <div className="text-xs text-emerald-600 font-medium">Actives</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.autoDetection}</div>
                      <div className="text-xs text-blue-600 font-medium">Auto</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-600">{stats.total - stats.active}</div>
                      <div className="text-xs text-slate-600 font-medium">Inactives</div>
                    </div>
                  </div>

                  {/* Impact badge */}
                  {stats.totalImpact > 0 && (
                    <div className="flex items-center justify-center">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg px-3 py-1">
                        <BanknotesIcon className="h-3 w-3 mr-1" />
                        Impact: +{stats.totalImpact}€
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })}

        {/* Card pour ajouter de nouveaux modules - Design premium */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-200/10 to-slate-300/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
          <Card className="relative bg-white/40 backdrop-blur-xl border-2 border-dashed border-slate-300/50 hover:border-slate-400/70 cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
            <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center">
                <PlusIcon className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Ajouter un Module</p>
                <p className="text-xs text-slate-500">Transport, Livraison, Maintenance...</p>
              </div>
              <Badge variant="outline" className="bg-white/70 text-slate-600 border-slate-300/50">
                Extensible
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Détails du module actif - Design premium */}
      {activeModuleData && (
        <div className="relative">
          <div className={`absolute inset-0 bg-gradient-to-r from-${activeModuleData.color}-500/5 via-${activeModuleData.color}-600/5 to-${activeModuleData.color}-700/5 rounded-3xl blur-2xl`}></div>
          <Card className="relative bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 bg-gradient-to-br from-${activeModuleData.color}-500 to-${activeModuleData.color}-600 rounded-2xl flex items-center justify-center shadow-xl`}>
                    <activeModuleData.icon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-800">
                      {activeModuleData.serviceName} - Configuration Détaillée
                    </CardTitle>
                    <CardDescription className="text-slate-600 mt-1">
                      Gestion granulaire de {activeModuleData.categories.length} catégories et {activeModuleData.totalConstraints} contraintes
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`bg-gradient-to-r from-${activeModuleData.color}-500 to-${activeModuleData.color}-600 text-white border-0 shadow-lg px-3 py-1`}>
                    {activeModuleData.serviceType}
                  </Badge>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg px-3 py-1">
                    Actif
                  </Badge>
                </div>
              </div>
            </CardHeader>
          <CardContent>
            <Tabs defaultValue={activeModuleData.categories[0]?.id} className="w-full">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-200/20 via-blue-200/20 to-purple-200/20 rounded-xl blur-lg"></div>
                <TabsList className="relative bg-white/80 backdrop-blur-xl border border-white/30 rounded-xl p-1 shadow-lg grid w-full grid-cols-5">
                  {activeModuleData.categories.map(category => {
                    const CategoryIcon = category.icon
                    return (
                      <TabsTrigger
                        key={category.id}
                        value={category.id}
                        className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 font-medium px-2 py-2 text-center"
                      >
                        <CategoryIcon className="h-4 w-4 flex-shrink-0" />
                        <div className="flex flex-col sm:flex-row items-center gap-1">
                          <span className="text-xs sm:text-sm font-medium truncate">{category.name}</span>
                          <Badge className="text-[10px] sm:text-xs bg-white/20 text-current border-0 px-1 py-0 leading-none">
                            {category.constraints.length}
                          </Badge>
                        </div>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>

              {activeModuleData.categories.map(category => (
                <TabsContent key={category.id} value={category.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <category.icon className="h-5 w-5" />
                        {category.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                    <Badge variant="outline">{category.constraints.length} contraintes</Badge>
                  </div>

                  <div className="grid gap-4">
                    {category.constraints.map(constraint => (
                      <div key={constraint.id} className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-100/50 to-blue-100/50 rounded-xl blur group-hover:blur-lg transition-all"></div>
                        <div className="relative bg-white/80 backdrop-blur-xl border border-white/40 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              {/* Header avec badges */}
                              <div className="flex items-center gap-3 flex-wrap">
                                <h5 className="font-bold text-slate-800 text-lg">{constraint.name}</h5>
                                <Badge
                                  className={`border-0 shadow-sm ${
                                    constraint.impact === 'SURCHARGE'
                                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                                      : constraint.impact === 'WARNING'
                                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                      : constraint.impact === 'REQUIREMENT'
                                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                                  }`}
                                >
                                  {constraint.impact}
                                </Badge>
                                {constraint.autoDetection && (
                                  <Badge className="bg-gradient-to-r from-purple-500 to-violet-500 text-white border-0 shadow-sm">
                                    <SparklesIcon className="h-3 w-3 mr-1" />
                                    Détection Auto
                                  </Badge>
                                )}
                                {constraint.isActive && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs font-medium text-green-600">Actif</span>
                                  </div>
                                )}
                              </div>

                              {/* Description */}
                              <p className="text-slate-600 leading-relaxed">{constraint.description}</p>

                              {/* Impact financier */}
                              {constraint.value > 0 && (
                                <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200/50">
                                  <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">€</span>
                                  </div>
                                  <span className="text-amber-800 font-bold text-lg">+{constraint.value}€</span>
                                  <span className="text-amber-700 text-sm">impact tarifaire</span>
                                </div>
                              )}
                            </div>

                            {/* Toggle avec style premium */}
                            <div className="flex items-center gap-3 ml-4">
                              <div className="flex flex-col items-center gap-2">
                                <Switch
                                  checked={constraint.isActive}
                                  onCheckedChange={(checked) =>
                                    updateConstraintInModule(
                                      activeModuleData.serviceType,
                                      category.id,
                                      constraint.id,
                                      { isActive: checked }
                                    )
                                  }
                                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-500"
                                />
                                <span className="text-xs text-slate-500 font-medium">
                                  {constraint.isActive ? 'Actif' : 'Inactif'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
        </div>
      )}
    </div>
  )
}