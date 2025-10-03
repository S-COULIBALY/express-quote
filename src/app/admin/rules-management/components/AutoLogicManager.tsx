"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import {
  CogIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline"

// ✅ REFACTORISÉ - Utilise le service centralisé
import { calculateFloorSurcharge } from "@/quotation/domain/configuration/constants"
import { DefaultValues } from "@/quotation/domain/configuration/DefaultValues"
import { AutoDetectionService, AddressData } from "@/quotation/domain/services/AutoDetectionService"

interface AutoLogicRule {
  id: string
  name: string
  description: string
  algorithm: string
  isActive: boolean
  parameters: Record<string, any>
  testScenarios: TestScenario[]
}

interface TestScenario {
  id: string
  name: string
  input: Record<string, any>
  expectedOutput: any
  lastResult?: any
  passed?: boolean
}

export function AutoLogicManager() {
  const [logicRules, setLogicRules] = useState<AutoLogicRule[]>([])
  const [selectedRule, setSelectedRule] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, any>>({})

  useEffect(() => {
    initializeAutoLogicRules()
  }, [])

  const initializeAutoLogicRules = () => {
    // ✅ REFACTORISÉ - Utilise AutoDetectionService centralisé
    const rules: AutoLogicRule[] = [
      {
        id: 'furniture_lift_detection',
        name: 'Détection Monte-Meuble Automatique',
        description: 'Détermine automatiquement si un monte-meuble est nécessaire (via AutoDetectionService)',
        algorithm: 'AutoDetectionService.detectFurnitureLift',
        isActive: true,
        parameters: {
          floorThreshold: DefaultValues.FURNITURE_LIFT_FLOOR_THRESHOLD,
          surcharge: DefaultValues.FURNITURE_LIFT_SURCHARGE
        },
        testScenarios: [
          {
            id: 'scenario_1',
            name: 'Étage élevé sans ascenseur',
            input: {
              floor: 4,
              elevator: 'no',
              constraints: ['difficult_stairs'],
              services: ['bulky_furniture']
            },
            expectedOutput: true
          },
          {
            id: 'scenario_2',
            name: 'Étage bas avec ascenseur',
            input: {
              floor: 2,
              elevator: 'large',
              constraints: [],
              services: []
            },
            expectedOutput: false
          },
          {
            id: 'scenario_3',
            name: 'Ascenseur petit avec contraintes',
            input: {
              floor: 1,
              elevator: 'small',
              constraints: ['elevator_unsuitable_size', 'narrow_corridors'],
              services: ['heavy_items']
            },
            expectedOutput: true
          }
        ]
      },
      {
        id: 'floor_surcharge_calculation',
        name: 'Calcul Surcoût Étages',
        description: 'Calcule automatiquement le surcoût lié aux étages',
        algorithm: 'calculateFloorSurcharge',
        isActive: true,
        parameters: {
          surchargeAmount: DefaultValues.WORKER_HOUR_RATE,
          threshold: DefaultValues.FURNITURE_LIFT_FLOOR_THRESHOLD,
          highFloorPercent: DefaultValues.OVERTIME_RATE_MULTIPLIER
        },
        testScenarios: [
          {
            id: 'scenario_1',
            name: 'Rez-de-chaussée',
            input: { floor: 0, elevator: 'no' },
            expectedOutput: 0
          },
          {
            id: 'scenario_2',
            name: '3ème étage sans ascenseur',
            input: { floor: 3, elevator: 'no' },
            expectedOutput: 50 // (3-1) * 25€
          },
          {
            id: 'scenario_3',
            name: '3ème étage avec ascenseur',
            input: { floor: 3, elevator: 'medium' },
            expectedOutput: 0
          }
        ]
      },
      {
        id: 'carrying_distance_analysis',
        name: 'Analyse Distance de Portage',
        description: 'Détecte et ajoute automatiquement la contrainte de portage longue (via AutoDetectionService)',
        algorithm: 'AutoDetectionService.detectLongCarryingDistance',
        isActive: true,
        parameters: {
          threshold: DefaultValues.LONG_CARRYING_DISTANCE_THRESHOLD,
          surcharge: DefaultValues.LONG_CARRYING_DISTANCE_SURCHARGE
        },
        testScenarios: [
          {
            id: 'scenario_1',
            name: 'Distance courte',
            input: {
              pickupCarryDistance: '0-10',
              deliveryCarryDistance: '10-30'
            },
            expectedOutput: {
              requiresLongCarryingConstraint: false,
              affectedAddresses: []
            }
          },
          {
            id: 'scenario_2',
            name: 'Distance longue pickup',
            input: {
              pickupCarryDistance: '30+',
              deliveryCarryDistance: '10-30'
            },
            expectedOutput: {
              requiresLongCarryingConstraint: true,
              affectedAddresses: ['pickup']
            }
          }
        ]
      }
    ]

    setLogicRules(rules)
  }

  const runSingleTest = async (ruleId: string, scenarioId: string) => {
    const rule = logicRules.find(r => r.id === ruleId)
    const scenario = rule?.testScenarios.find(s => s.id === scenarioId)

    if (!rule || !scenario) return

    try {
      let result: any

      // ✅ REFACTORISÉ - Utilise AutoDetectionService
      switch (rule.algorithm) {
        case 'AutoDetectionService.detectFurnitureLift':
        case 'detectFurnitureLift': {
          const addressData: AddressData = {
            floor: scenario.input.floor,
            elevator: scenario.input.elevator as 'no' | 'small' | 'medium' | 'large',
            constraints: scenario.input.constraints
          }
          const detectionResult = AutoDetectionService.detectFurnitureLift(addressData)
          result = detectionResult.furnitureLiftRequired
          break
        }

        case 'calculateFloorSurcharge':
          result = calculateFloorSurcharge(
            scenario.input.floor,
            scenario.input.elevator,
            scenario.input.volume
          )
          break

        case 'AutoDetectionService.detectLongCarryingDistance':
        case 'analyzeCarryingDistance': {
          const pickupData: AddressData = {
            floor: 0,
            elevator: 'no',
            carryDistance: scenario.input.pickupCarryDistance as '0-10' | '10-30' | '30+' | undefined
          }
          const deliveryData: AddressData = {
            floor: 0,
            elevator: 'no',
            carryDistance: scenario.input.deliveryCarryDistance as '0-10' | '10-30' | '30+' | undefined
          }
          const pickupResult = AutoDetectionService.detectLongCarryingDistance(pickupData)
          const deliveryResult = AutoDetectionService.detectLongCarryingDistance(deliveryData)

          result = {
            pickupDistanceInMeters: pickupData.carryDistance === '30+' ? 35 : (pickupData.carryDistance === '10-30' ? 20 : 5),
            deliveryDistanceInMeters: deliveryData.carryDistance === '30+' ? 35 : (deliveryData.carryDistance === '10-30' ? 20 : 5),
            requiresLongCarryingConstraint: pickupResult.longCarryingDistance || deliveryResult.longCarryingDistance,
            affectedAddresses: [
              ...(pickupResult.longCarryingDistance ? ['pickup' as const] : []),
              ...(deliveryResult.longCarryingDistance ? ['delivery' as const] : [])
            ]
          }
          break
        }

        default:
          throw new Error(`Algorithme non reconnu: ${rule.algorithm}`)
      }

      const passed = JSON.stringify(result) === JSON.stringify(scenario.expectedOutput)

      // Mettre à jour les résultats
      setTestResults(prev => ({
        ...prev,
        [`${ruleId}_${scenarioId}`]: { result, passed, timestamp: new Date() }
      }))

      // Mettre à jour le scénario
      setLogicRules(prev => prev.map(r => {
        if (r.id === ruleId) {
          return {
            ...r,
            testScenarios: r.testScenarios.map(s => {
              if (s.id === scenarioId) {
                return { ...s, lastResult: result, passed }
              }
              return s
            })
          }
        }
        return r
      }))

    } catch (error) {
      console.error(`Erreur test ${scenarioId}:`, error)
      toast({
        title: "❌ Erreur de test",
        description: `Échec du test ${scenario.name}`,
        variant: "destructive"
      })
    }
  }

  const runAllTests = async (ruleId: string) => {
    const rule = logicRules.find(r => r.id === ruleId)
    if (!rule) return

    for (const scenario of rule.testScenarios) {
      await runSingleTest(ruleId, scenario.id)
    }

    toast({
      title: "✅ Tests terminés",
      description: `Tests exécutés pour ${rule.name}`,
      variant: "default"
    })
  }

  const updateRuleParameter = (ruleId: string, paramKey: string, value: any) => {
    setLogicRules(prev => prev.map(rule => {
      if (rule.id === ruleId) {
        return {
          ...rule,
          parameters: { ...rule.parameters, [paramKey]: value }
        }
      }
      return rule
    }))
  }

  const selectedRuleData = logicRules.find(r => r.id === selectedRule)

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header amélioré */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <SparklesIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Logique Automatique</h3>
            </div>
            <p className="text-sm text-slate-600">
              Configurez et testez les algorithmes de détection automatique
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Total</div>
            <div className="text-2xl font-bold text-blue-600">{logicRules.length}</div>
            <div className="text-xs text-slate-500">règles actives</div>
          </div>
        </div>
      </div>

      {/* Liste des règles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Règles disponibles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-700">Règles Automatiques</h4>
            <Badge variant="outline" className="text-xs">
              {logicRules.filter(r => r.isActive).length} / {logicRules.length}
            </Badge>
          </div>
          {logicRules.map(rule => {
            const hasFailedTests = rule.testScenarios.some(s => s.passed === false)
            const allTestsPassed = rule.testScenarios.every(s => s.passed === true)

            return (
              <Card
                key={rule.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedRule === rule.id
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md'
                    : 'hover:border-slate-300 bg-white'
                }`}
                onClick={() => setSelectedRule(rule.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${
                        selectedRule === rule.id ? 'bg-blue-200' : 'bg-slate-100'
                      }`}>
                        <CogIcon className={`h-4 w-4 ${
                          selectedRule === rule.id ? 'text-blue-700' : 'text-slate-600'
                        }`} />
                      </div>
                      <span className="font-semibold text-sm text-slate-800">{rule.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasFailedTests && (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                      )}
                      {allTestsPassed && !hasFailedTests && (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      )}
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked) => {
                          setLogicRules(prev => prev.map(r =>
                            r.id === rule.id ? { ...r, isActive: checked } : r
                          ))
                        }}
                        className="scale-90"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{rule.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="text-xs bg-white border-slate-300"
                    >
                      📝 {rule.testScenarios.length} tests
                    </Badge>
                    <Badge
                      variant={rule.isActive ? "default" : "secondary"}
                      className={`text-xs ${
                        rule.isActive
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-slate-300'
                      }`}
                    >
                      {rule.isActive ? "✓ Actif" : "○ Inactif"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Configuration de la règle sélectionnée */}
        {selectedRuleData && (
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <CogIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-slate-800">{selectedRuleData.name}</span>
                </CardTitle>
                <CardDescription className="text-slate-600">{selectedRuleData.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Paramètres configurables */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h5 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <div className="h-1 w-1 bg-blue-500 rounded-full"></div>
                    Paramètres de Configuration
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedRuleData.parameters).map(([key, value]) => (
                      <div key={key} className="space-y-1.5">
                        <Label htmlFor={key} className="text-sm font-medium text-slate-700">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Label>
                        <Input
                          id={key}
                          type={typeof value === 'number' ? 'number' : 'text'}
                          value={value}
                          onChange={(e) => {
                            const newValue = typeof value === 'number'
                              ? parseFloat(e.target.value) || 0
                              : e.target.value
                            updateRuleParameter(selectedRuleData.id, key, newValue)
                          }}
                          className="bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tests */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-semibold text-green-800 flex items-center gap-2">
                      <div className="h-1 w-1 bg-green-500 rounded-full"></div>
                      Tests de Validation
                    </h5>
                    <Button
                      size="sm"
                      onClick={() => runAllTests(selectedRuleData.id)}
                      className="bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all duration-200 hover:shadow-md"
                    >
                      <SparklesIcon className="h-4 w-4 mr-1.5" />
                      Tout Tester
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {selectedRuleData.testScenarios.map(scenario => {
                      const testKey = `${selectedRuleData.id}_${scenario.id}`
                      const testResult = testResults[testKey]

                      return (
                        <div key={scenario.id} className="bg-white border border-green-200 rounded-lg p-4 shadow-sm transition-all duration-200 hover:shadow-md">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-sm text-slate-800">{scenario.name}</span>
                            <div className="flex items-center gap-2">
                              {scenario.passed !== undefined && (
                                <Badge
                                  variant={scenario.passed ? "default" : "destructive"}
                                  className={`text-xs font-semibold ${
                                    scenario.passed
                                      ? 'bg-green-500 hover:bg-green-600'
                                      : 'bg-red-500 hover:bg-red-600'
                                  }`}
                                >
                                  {scenario.passed ? "✅ Réussi" : "❌ Échoué"}
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => runSingleTest(selectedRuleData.id, scenario.id)}
                                className="border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 transition-colors"
                              >
                                Tester
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="flex items-start gap-2">
                              <span className="font-semibold text-blue-700 min-w-[60px]">Entrée:</span>
                              <code className="flex-1 bg-blue-50 px-2 py-1 rounded border border-blue-200 text-blue-900 font-mono">
                                {JSON.stringify(scenario.input)}
                              </code>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-semibold text-purple-700 min-w-[60px]">Attendu:</span>
                              <code className="flex-1 bg-purple-50 px-2 py-1 rounded border border-purple-200 text-purple-900 font-mono">
                                {JSON.stringify(scenario.expectedOutput)}
                              </code>
                            </div>
                            {scenario.lastResult !== undefined && (
                              <div className="flex items-start gap-2">
                                <span className="font-semibold text-slate-700 min-w-[60px]">Résultat:</span>
                                <code className={`flex-1 px-2 py-1 rounded border font-mono ${
                                  scenario.passed
                                    ? 'bg-green-50 border-green-300 text-green-900'
                                    : 'bg-red-50 border-red-300 text-red-900'
                                }`}>
                                  {JSON.stringify(scenario.lastResult)}
                                </code>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}