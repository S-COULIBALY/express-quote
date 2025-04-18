"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PricingConfig } from "./components/PricingConfig"
import { BusinessRulesConfig } from "./components/BusinessRulesConfig"
import { LimitsConfig } from "./components/LimitsConfig"
import { ServiceParamsConfig } from "./components/ServiceParamsConfig"
import { LegalInformationConfig } from "./components/LegalInformationConfig"
import { RulesConfig } from "./components/RulesConfig"
import { toast } from "@/components/ui/use-toast" 
import {
  CurrencyDollarIcon,
  ClipboardDocumentCheckIcon,
  ScaleIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  TagIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline"

export default function ConfigurationPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fonction pour rafraîchir le cache
  const refreshCache = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch('/api/admin/refresh-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Cache rafraîchi",
          description: "Le cache des configurations a été rafraîchi avec succès.",
          variant: "default"
        })
      } else {
        toast({
          title: "Erreur",
          description: data?.message || "Une erreur est survenue lors du rafraîchissement du cache.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement du cache:", error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du rafraîchissement du cache.",
        variant: "destructive"
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Configuration</h1>
            <p className="text-muted-foreground">
              Manage your application settings and parameters
            </p>
          </div>
          
          {/* Bouton de rafraîchissement du cache */}
          <Button 
            onClick={refreshCache} 
            disabled={isRefreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Rafraîchissement...' : 'Rafraîchir le cache'}
          </Button>
        </div>

        <Tabs defaultValue="pricing" className="w-full">
          <TabsList>
            <TabsTrigger value="pricing">
              <CurrencyDollarIcon className="h-4 w-4 mr-2" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="business-rules">
              <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2" />
              Business Rules
            </TabsTrigger>
            <TabsTrigger value="rules">
              <TagIcon className="h-4 w-4 mr-2" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="limits">
              <ScaleIcon className="h-4 w-4 mr-2" />
              Limits
            </TabsTrigger>
            <TabsTrigger value="service-params">
              <Cog6ToothIcon className="h-4 w-4 mr-2" />
              Service Parameters
            </TabsTrigger>
            <TabsTrigger value="legal-information">
              <BuildingOfficeIcon className="h-4 w-4 mr-2" />
              Legal Information
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>Pricing Configuration</CardTitle>
                <CardDescription>
                  Configure base prices, fees, and discounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PricingConfig />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="business-rules">
            <Card>
              <CardHeader>
                <CardTitle>Business Rules</CardTitle>
                <CardDescription>
                  Configure business rules and conditions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BusinessRulesConfig />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="rules">
            <Card>
              <CardHeader>
                <CardTitle>Rules</CardTitle>
                <CardDescription>
                  Configure rules by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RulesConfig />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="limits">
            <Card>
              <CardHeader>
                <CardTitle>Limits Configuration</CardTitle>
                <CardDescription>
                  Configure booking and worker limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LimitsConfig />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="service-params">
            <Card>
              <CardHeader>
                <CardTitle>Service Parameters</CardTitle>
                <CardDescription>
                  Configure service types and parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServiceParamsConfig />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="legal-information">
            <Card>
              <CardHeader>
                <CardTitle>Legal Information</CardTitle>
                <CardDescription>
                  Configure company legal information and compliance details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LegalInformationConfig />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}