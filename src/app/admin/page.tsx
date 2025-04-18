'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PricingConfig } from './configuration/components/PricingConfig'
import { BusinessRulesConfig } from './configuration/components/BusinessRulesConfig'
import { LimitsConfig } from './configuration/components/LimitsConfig'
import { ServiceParamsConfig } from './configuration/components/ServiceParamsConfig'
import { LegalInformationConfig } from './configuration/components/LegalInformationConfig'
import { 
  CurrencyDollarIcon, 
  ClipboardDocumentCheckIcon, 
  ScaleIcon, 
  Cog8ToothIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent } from "@/components/ui/card"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <WrenchScrewdriverIcon className="h-8 w-8 text-white" />
            <h1 className="text-3xl font-bold tracking-tight text-white">Administration</h1>
          </div>
          <p className="text-blue-100">Gérez la configuration et les paramètres de votre application</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            <StatCard 
              title="Clients" 
              value="1,254" 
              icon={<UserGroupIcon className="h-5 w-5" />} 
              color="bg-blue-500" 
            />
            <StatCard 
              title="Réservations" 
              value="146" 
              icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />} 
              color="bg-purple-500" 
            />
            <StatCard 
              title="Revenu mensuel" 
              value="12,450 €" 
              icon={<CurrencyDollarIcon className="h-5 w-5" />} 
              color="bg-emerald-500" 
            />
            <StatCard 
              title="Taux de conversion" 
              value="24%" 
              icon={<ChartBarIcon className="h-5 w-5" />} 
              color="bg-amber-500" 
            />
          </div>
        </div>
        
        <Card className="shadow-xl border-0 overflow-hidden">
          <Tabs defaultValue="pricing" className="w-full">
            <TabsList className="w-full bg-white dark:bg-gray-800 p-1 rounded-t-lg flex flex-wrap border-b">
              <TabsTrigger 
                value="pricing" 
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-300 flex gap-2 items-center flex-1 min-w-[120px] rounded-md transition-all"
              >
                <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
                <span className="hidden sm:inline">Tarification</span>
              </TabsTrigger>
              <TabsTrigger 
                value="business-rules" 
                className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900/20 dark:data-[state=active]:text-purple-300 flex gap-2 items-center flex-1 min-w-[120px] rounded-md transition-all"
              >
                <ClipboardDocumentCheckIcon className="h-5 w-5 text-purple-600" />
                <span className="hidden sm:inline">Règles métier</span>
              </TabsTrigger>
              <TabsTrigger 
                value="limits" 
                className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/20 dark:data-[state=active]:text-emerald-300 flex gap-2 items-center flex-1 min-w-[120px] rounded-md transition-all"
              >
                <ScaleIcon className="h-5 w-5 text-emerald-600" />
                <span className="hidden sm:inline">Limites</span>
              </TabsTrigger>
              <TabsTrigger 
                value="service-params" 
                className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 dark:data-[state=active]:bg-amber-900/20 dark:data-[state=active]:text-amber-300 flex gap-2 items-center flex-1 min-w-[120px] rounded-md transition-all"
              >
                <Cog8ToothIcon className="h-5 w-5 text-amber-600" />
                <span className="hidden sm:inline">Paramètres</span>
              </TabsTrigger>
              <TabsTrigger 
                value="legal-information" 
                className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-indigo-900/20 dark:data-[state=active]:text-indigo-300 flex gap-2 items-center flex-1 min-w-[120px] rounded-md transition-all"
              >
                <BuildingOfficeIcon className="h-5 w-5 text-indigo-600" />
                <span className="hidden sm:inline">Mentions légales</span>
              </TabsTrigger>
            </TabsList>
            
            <CardContent className="p-6">
              <TabsContent value="pricing" className="mt-0">
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
                    <h3 className="text-xl font-medium text-blue-900 dark:text-blue-100">Configuration des tarifs</h3>
                  </div>
                  <p className="text-gray-500 text-sm ml-8">Définissez les prix et les tarifs pour vos services</p>
                </div>
                <PricingConfig />
              </TabsContent>
              
              <TabsContent value="business-rules" className="mt-0">
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <ClipboardDocumentCheckIcon className="h-6 w-6 text-purple-600" />
                    <h3 className="text-xl font-medium text-purple-900 dark:text-purple-100">Règles métier</h3>
                  </div>
                  <p className="text-gray-500 text-sm ml-8">Configurez les règles qui régissent les opérations commerciales</p>
                </div>
                <BusinessRulesConfig />
              </TabsContent>
              
              <TabsContent value="limits" className="mt-0">
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <ScaleIcon className="h-6 w-6 text-emerald-600" />
                    <h3 className="text-xl font-medium text-emerald-900 dark:text-emerald-100">Limites du système</h3>
                  </div>
                  <p className="text-gray-500 text-sm ml-8">Définissez les limites et les seuils pour les réservations et les services</p>
                </div>
                <LimitsConfig />
              </TabsContent>
              
              <TabsContent value="service-params" className="mt-0">
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <Cog8ToothIcon className="h-6 w-6 text-amber-600" />
                    <h3 className="text-xl font-medium text-amber-900 dark:text-amber-100">Paramètres de service</h3>
                  </div>
                  <p className="text-gray-500 text-sm ml-8">Configurez les options générales et les paramètres de votre service</p>
                </div>
                <ServiceParamsConfig />
              </TabsContent>
              
              <TabsContent value="legal-information" className="mt-0">
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
                    <h3 className="text-xl font-medium text-indigo-900 dark:text-indigo-100">Mentions légales</h3>
                  </div>
                  <p className="text-gray-500 text-sm ml-8">Gérez les informations légales et de conformité de l'entreprise</p>
                </div>
                <LegalInformationConfig />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
      <div className={`${color} p-3 text-white`}>
        {icon}
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  )
} 