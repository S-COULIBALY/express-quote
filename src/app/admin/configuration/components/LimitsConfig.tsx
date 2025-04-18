"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ArrowPathIcon,
  UsersIcon,
  GlobeAltIcon,
  ShieldExclamationIcon,
  CubeIcon,
  TicketIcon,
  UserGroupIcon,
  ClockIcon,
  MapIcon
} from "@heroicons/react/24/outline"
import { getLimitsConfig, saveLimitsConfig, LimitsConfig as LimitsConfigType } from "@/actions/adminRules"

export function LimitsConfig() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [values, setValues] = useState<LimitsConfigType>({
    // Limites de réservation
    maxActiveBookingsPerUser: '',
    maxBookingsPerDay: '',
    maxActivePromoCodes: '',
    
    // Limites de service
    maxWorkersPerService: '',
    maxWorkersPerPack: '',
    maxItemsPerBooking: '',
    
    // Limites de distance
    maxServiceDistance: '',
    maxPackDistance: '',
    
    // Limites générales
    minBookingHours: '',
    maxBookingDaysAhead: '',
    minWorkers: '',
    maxWorkers: '',
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      // Utilisation de la Server Action pour charger les configurations
      const config = await getLimitsConfig();
      setValues(config);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des limites:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les limites",
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
      const result = await saveLimitsConfig(values);
      
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
        description: "Impossible de sauvegarder les limites",
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
          <p className="text-blue-900 font-medium">Chargement des limites...</p>
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
    color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';
    info?: string;
    unit?: string;
  }

  const FormInput = ({ 
    id, 
    label, 
    value, 
    placeholder = "0", 
    step = "1",
    type = "number",
    icon = <UsersIcon className="h-4 w-4" />,
    color = "blue",
    info,
    unit
  }: FormInputProps) => {
    const colorClasses: Record<string, string> = {
      blue: "border-blue-200 focus-within:ring-blue-500 focus-within:border-blue-500 bg-blue-50/50",
      emerald: "border-emerald-200 focus-within:ring-emerald-500 focus-within:border-emerald-500 bg-emerald-50/50",
      amber: "border-amber-200 focus-within:ring-amber-500 focus-within:border-amber-500 bg-amber-50/50",
      purple: "border-purple-200 focus-within:ring-purple-500 focus-within:border-purple-500 bg-purple-50/50",
      rose: "border-rose-200 focus-within:ring-rose-500 focus-within:border-rose-500 bg-rose-50/50",
    };
    
    const iconColors: Record<string, string> = {
      blue: "text-blue-600",
      emerald: "text-emerald-600",
      amber: "text-amber-600",
      purple: "text-purple-600",
      rose: "text-rose-600",
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
            <span className={`${iconColors[color]} text-xs`}>{unit || '#'}</span>
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
          <div className="bg-blue-500 px-5 py-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Limites générales de réservation
            </h4>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <FormInput 
                id="minBookingHours" 
                label="Heures minimum de réservation" 
                value={values.minBookingHours} 
                icon={<ClockIcon className="h-4 w-4" />}
                info="Heures minimum avant la prestation pour réserver"
                unit="h"
              />
              <FormInput 
                id="maxBookingDaysAhead" 
                label="Jours maximum à l'avance" 
                value={values.maxBookingDaysAhead} 
                icon={<ClockIcon className="h-4 w-4" />}
                info="Nombre maximum de jours à l'avance pour réserver"
                unit="j"
              />
              <FormInput 
                id="maxActiveBookingsPerUser" 
                label="Réservations actives par utilisateur" 
                value={values.maxActiveBookingsPerUser} 
                info="Nombre maximum de réservations actives par utilisateur"
              />
              <FormInput 
                id="maxBookingsPerDay" 
                label="Réservations par jour" 
                value={values.maxBookingsPerDay} 
                icon={<ClockIcon className="h-4 w-4" />}
                info="Nombre maximum de réservations par jour"
              />
              <FormInput 
                id="maxActivePromoCodes" 
                label="Codes promo actifs" 
                value={values.maxActivePromoCodes} 
                icon={<TicketIcon className="h-4 w-4" />}
                info="Nombre maximum de codes promo actifs simultanément"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-emerald-100 shadow-sm overflow-hidden">
          <div className="bg-emerald-500 px-5 py-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5" />
              Limites de personnel
            </h4>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <FormInput 
                id="minWorkers" 
                label="Nombre minimum de travailleurs" 
                value={values.minWorkers} 
                color="emerald"
                info="Nombre minimum de travailleurs pour une prestation"
                icon={<UserGroupIcon className="h-4 w-4" />}
              />
              <FormInput 
                id="maxWorkers" 
                label="Nombre maximum de travailleurs" 
                value={values.maxWorkers} 
                color="emerald"
                info="Nombre maximum de travailleurs pour toutes prestations"
                icon={<UserGroupIcon className="h-4 w-4" />}
              />
              <FormInput 
                id="maxWorkersPerService" 
                label="Travailleurs par service" 
                value={values.maxWorkersPerService} 
                color="emerald"
                info="Nombre maximum de travailleurs par service"
                icon={<UserGroupIcon className="h-4 w-4" />}
              />
              <FormInput 
                id="maxWorkersPerPack" 
                label="Travailleurs par pack" 
                value={values.maxWorkersPerPack} 
                color="emerald"
                info="Nombre maximum de travailleurs par pack"
                icon={<UserGroupIcon className="h-4 w-4" />}
              />
              <FormInput 
                id="maxItemsPerBooking" 
                label="Articles par réservation" 
                value={values.maxItemsPerBooking} 
                color="emerald"
                icon={<CubeIcon className="h-4 w-4" />}
                info="Nombre maximum d'articles par réservation"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-amber-100 shadow-sm overflow-hidden">
          <div className="bg-amber-500 px-5 py-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <GlobeAltIcon className="h-5 w-5" />
              Limites de distance
            </h4>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <FormInput 
                id="maxServiceDistance" 
                label="Distance maximum de service" 
                value={values.maxServiceDistance} 
                color="amber"
                icon={<MapIcon className="h-4 w-4" />}
                info="Distance maximum couverte pour un service"
                unit="km"
              />
              <FormInput 
                id="maxPackDistance" 
                label="Distance maximum de pack" 
                value={values.maxPackDistance} 
                color="amber"
                icon={<MapIcon className="h-4 w-4" />}
                info="Distance maximum couverte pour un pack"
                unit="km"
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
          className="gap-2 transition-all bg-blue-500 hover:bg-blue-600 text-white shadow-lg px-8 rounded-lg"
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