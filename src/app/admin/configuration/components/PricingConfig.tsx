"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ArrowPathIcon, 
  CurrencyDollarIcon, 
  TruckIcon, 
  UserGroupIcon, 
  ArchiveBoxIcon, 
  ShieldCheckIcon, 
  CalendarDaysIcon,
  ClockIcon,
  SunIcon,
  BanknotesIcon
} from "@heroicons/react/24/outline"
import { getAdminPricingConfig, saveAdminPricingConfig, AdminPricingConfig } from "@/actions/adminPricing"

export function PricingConfig() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [values, setValues] = useState<AdminPricingConfig>({
    basePrice: '',
    distancePrice: '',
    workerPrice: '',
    packingPrice: '',
    unpackingPrice: '',
    storagePrice: '',
    insurancePrice: '',
    earlyBookingDiscount: '',
    lastMinuteSurcharge: '',
    weekendSurcharge: '',
    holidaySurcharge: '',
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      // Utilisation de la Server Action pour charger les configurations
      const config = await getAdminPricingConfig();
      setValues(config);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des configurations:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la configuration des prix",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setValues(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      // Utilisation de la Server Action pour sauvegarder les configurations
      const result = await saveAdminPricingConfig(values);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: result.message,
        });
      } else {
        toast({
          title: "Erreur",
          description: result.message,
          variant: "destructive",
        });
      }
      setSaving(false)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration des prix",
        variant: "destructive",
      })
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex flex-col items-center gap-2 text-blue-600">
          <ArrowPathIcon className="h-10 w-10 animate-spin" />
          <p className="text-blue-900 font-medium">Chargement des données...</p>
        </div>
      </div>
    )
  }

  interface FormInputProps {
    id: string;
    label: string;
    value: string;
    placeholder?: string;
    step?: string;
    type?: string;
    icon?: React.ReactNode;
    color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'indigo';
    info?: string;
  }

  const FormInput = ({ 
    id, 
    label, 
    value, 
    placeholder = "0.00", 
    step = "0.01",
    type = "number",
    icon = <CurrencyDollarIcon className="h-4 w-4" />,
    color = "blue",
    info
  }: FormInputProps) => {
    const colorClasses: Record<string, string> = {
      blue: "border-blue-200 focus-within:ring-blue-500 focus-within:border-blue-500 bg-blue-50/50",
      emerald: "border-emerald-200 focus-within:ring-emerald-500 focus-within:border-emerald-500 bg-emerald-50/50",
      amber: "border-amber-200 focus-within:ring-amber-500 focus-within:border-amber-500 bg-amber-50/50",
      purple: "border-purple-200 focus-within:ring-purple-500 focus-within:border-purple-500 bg-purple-50/50",
      rose: "border-rose-200 focus-within:ring-rose-500 focus-within:border-rose-500 bg-rose-50/50",
      indigo: "border-indigo-200 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-indigo-50/50",
    };
    
    const iconColors: Record<string, string> = {
      blue: "text-blue-600",
      emerald: "text-emerald-600",
      amber: "text-amber-600",
      purple: "text-purple-600",
      rose: "text-rose-600",
      indigo: "text-indigo-600",
    };

    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="text-sm font-medium flex items-center gap-1">
          <span className={`${iconColors[color]}`}>{icon}</span>
          <span>{label}</span>
        </Label>
        <div className={`relative transition-all rounded-md ${colorClasses[color]}`}>
          <Input
            id={id}
            name={id}
            type={type}
            step={step}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className="pl-8 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className={`${iconColors[color]}`}>€</span>
          </div>
        </div>
        {info && <p className="text-xs text-gray-500 italic">{info}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-8">
        <Card className="border border-blue-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <BanknotesIcon className="h-5 w-5" />
              Prix de base
            </h4>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <FormInput 
                id="basePrice" 
                label="Prix de base" 
                value={values.basePrice} 
                color="blue"
                icon={<BanknotesIcon className="h-4 w-4" />}
                info="Prix de base pour toute réservation"
              />
              <FormInput 
                id="distancePrice" 
                label="Prix par km" 
                value={values.distancePrice} 
                color="blue"
                icon={<TruckIcon className="h-4 w-4" />}
                info="Tarif additionnel par kilomètre parcouru"
              />
              <FormInput 
                id="workerPrice" 
                label="Prix par travailleur" 
                value={values.workerPrice} 
                color="blue"
                icon={<UserGroupIcon className="h-4 w-4" />}
                info="Tarif horaire par travailleur"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-emerald-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <ArchiveBoxIcon className="h-5 w-5" />
              Services additionnels
            </h4>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <FormInput 
                id="packingPrice" 
                label="Prix d'emballage" 
                value={values.packingPrice} 
                color="emerald"
                icon={<ArchiveBoxIcon className="h-4 w-4" />}
                info="Tarif horaire pour le service d'emballage"
              />
              <FormInput 
                id="unpackingPrice" 
                label="Prix de déballage" 
                value={values.unpackingPrice} 
                color="emerald"
                icon={<ArchiveBoxIcon className="h-4 w-4" />}
                info="Tarif horaire pour le service de déballage"
              />
              <FormInput 
                id="storagePrice" 
                label="Prix de stockage" 
                value={values.storagePrice} 
                color="emerald"
                icon={<ArchiveBoxIcon className="h-4 w-4" />}
                info="Tarif journalier pour le stockage"
              />
              <FormInput 
                id="insurancePrice" 
                label="Prix de l'assurance" 
                value={values.insurancePrice} 
                color="emerald"
                icon={<ShieldCheckIcon className="h-4 w-4" />}
                info="Pourcentage du coût total pour l'assurance"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-amber-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5" />
              Réductions et majorations
            </h4>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <FormInput 
                id="earlyBookingDiscount" 
                label="Réduction réservation anticipée" 
                value={values.earlyBookingDiscount} 
                color="amber"
                icon={<CalendarDaysIcon className="h-4 w-4" />}
                info="Pourcentage de réduction pour réservation anticipée"
              />
              <FormInput 
                id="lastMinuteSurcharge" 
                label="Majoration dernière minute" 
                value={values.lastMinuteSurcharge} 
                color="amber"
                icon={<ClockIcon className="h-4 w-4" />}
                info="Pourcentage de majoration pour réservation de dernière minute"
              />
              <FormInput 
                id="weekendSurcharge" 
                label="Majoration weekend" 
                value={values.weekendSurcharge} 
                color="amber"
                icon={<CalendarDaysIcon className="h-4 w-4" />}
                info="Pourcentage de majoration pour service le weekend"
              />
              <FormInput 
                id="holidaySurcharge" 
                label="Majoration jour férié" 
                value={values.holidaySurcharge} 
                color="amber"
                icon={<SunIcon className="h-4 w-4" />}
                info="Pourcentage de majoration pour service un jour férié"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mt-8">
        <Button 
          type="submit" 
          disabled={saving}
          size="lg"
          className="gap-2 transition-all bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl px-8 rounded-lg"
        >
          {saving ? (
            <>
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Enregistrer les modifications
            </>
          )}
        </Button>
      </div>
    </form>
  )
} 