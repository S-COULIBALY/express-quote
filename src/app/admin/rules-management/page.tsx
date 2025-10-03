"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

// ✅ RÉUTILISATION - Composants existants de /admin/configuration

// Nouveaux composants pour les fonctionnalités manquantes
import { AutoLogicManager } from "./components/AutoLogicManager"
import { UnifiedTestingFramework } from "./components/UnifiedTestingFramework"
import { ConfigurationCRUDManager } from "./components/ConfigurationCRUDManager"
import { UnifiedRuleManager } from "./components/UnifiedRuleManager"

import {
  CogIcon,
  BeakerIcon,
  ArrowPathIcon,
  WrenchScrewdriverIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline"
import Link from "next/link"

export default function UnifiedRulesManagementPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("unified-rules")

  // Fonction pour rafraîchir tous les caches
  const refreshAllCaches = async () => {
    try {
      setIsRefreshing(true)

      // Rafraîchir le cache de configuration
      const configResponse = await fetch('/api/admin/refresh-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      // Rafraîchir le cache des règles pricing
      const rulesResponse = await fetch('/api/admin/pricing/rules?invalidateCache=true')

      if (configResponse.ok && rulesResponse.ok) {
        toast({
          title: "✅ Caches rafraîchis",
          description: "Tous les caches des règles ont été rafraîchis avec succès.",
          variant: "default"
        })
      } else {
        throw new Error("Erreur lors du rafraîchissement")
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error)
      toast({
        title: "❌ Erreur",
        description: "Une erreur est survenue lors du rafraîchissement des caches.",
        variant: "destructive"
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex flex-col gap-8">
          {/* Header premium avec glassmorphism */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl">
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <CogIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold text-slate-800">
                        Gestion Unifiée des Règles
                      </h1>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-600 font-medium">Production Ready</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-lg text-slate-600 max-w-2xl">
                    Plateforme centralisée pour la gestion intelligente des règles métier et configurations système
                  </p>
                </div>

                {/* Actions avec design premium */}
                <div className="flex gap-3">
                  <Link href="/admin">
                    <Button
                      variant="outline"
                      className="border-slate-300 text-slate-700 hover:bg-slate-50 px-4"
                    >
                      <ArrowLeftIcon className="h-4 w-4 mr-2" />
                      Retour Admin
                    </Button>
                  </Link>
                  <Button
                    onClick={refreshAllCaches}
                    disabled={isRefreshing}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 px-6"
                  >
                    <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Synchronisation...' : 'Actualiser'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation premium avec glassmorphism */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-200/20 via-blue-200/20 to-purple-200/20 rounded-2xl blur-xl"></div>
              <TabsList className="relative bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-2 shadow-2xl grid w-full grid-cols-4 lg:grid-cols-4 h-14">
                <TabsTrigger
                  value="unified-rules"
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
                >
                  <CogIcon className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Règles</span>
                </TabsTrigger>
                <TabsTrigger
                  value="auto-logic"
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
                >
                  <CogIcon className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Auto</span>
                </TabsTrigger>
                <TabsTrigger
                  value="testing"
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
                >
                  <BeakerIcon className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Tests</span>
                </TabsTrigger>
                <TabsTrigger
                  value="crud"
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600 data-[state=active]:to-slate-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
                >
                  <WrenchScrewdriverIcon className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Configurations</span>
                </TabsTrigger>
              </TabsList>
            </div>


            {/* Règles Unifiées - Design épuré */}
            <TabsContent value="unified-rules">
              <UnifiedRuleManager />
            </TabsContent>

            {/* Logique Automatique - Design épuré */}
            <TabsContent value="auto-logic">
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <AutoLogicManager />
              </div>
            </TabsContent>

            {/* Tests & Simulation - Design épuré */}
            <TabsContent value="testing">
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <UnifiedTestingFramework />
              </div>
            </TabsContent>


            {/* Configurations - Design épuré */}
            <TabsContent value="crud">
              <ConfigurationCRUDManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}