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
  CalendarDaysIcon, 
  ClockIcon,
  UserGroupIcon,
  TruckIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  CubeIcon
} from "@heroicons/react/24/outline"
import { getBusinessRulesConfig, saveBusinessRulesConfig, BusinessRulesConfig as BusinessRulesConfigType } from "@/actions/adminRules"

export function BusinessRulesConfig() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [values, setValues] = useState<BusinessRulesConfigType>({
    // Règles de réservation
    minAdvanceBookingHours: '',
    maxDaysInAdvance: '',
    cancellationDeadlineHours: '',
    
    // Règles de remboursement
    fullRefundHours: '',
    partialRefundPercentage: '',
    
    // Règles de planification
    minServiceDuration: '',
    maxServiceDuration: '',
    bufferBetweenBookings: '',
    
    // Règles spécifiques aux déménagements
    movingEarlyBookingDays: '',
    movingEarlyBookingDiscount: '',
    movingWeekendSurcharge: '',
    
    // Règles spécifiques aux services
    serviceEarlyBookingDays: '',
    serviceEarlyBookingDiscount: '',
    serviceWeekendSurcharge: '',
    
    // Règles spécifiques aux packs
    packEarlyBookingDays: '',
    packEarlyBookingDiscount: '',
    packWeekendSurcharge: '',
    packUrgentBookingSurcharge: '',
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      // Utilisation de la Server Action pour charger les configurations
      const config = await getBusinessRulesConfig();
      setValues(config);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des règles métier:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les règles métier",
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
      const result = await saveBusinessRulesConfig(values);
      
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
        description: "Impossible de sauvegarder les règles métier",
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
    unit?: string;
  }

  const FormInput = ({ 
    id, 
    label, 
    value, 
    placeholder = "0", 
    step = "1",
    type = "number",
    icon = <ClipboardDocumentCheckIcon className="h-4 w-4" />,
    color = "purple",
    info,
    unit
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
        <Card className="border border-purple-100 shadow-sm overflow-hidden">
          <div className="bg-purple-500 px-5 py-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5" />
              Délais et seuils temporels
            </h4>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <FormInput 
                id="minAdvanceBookingHours" 
                label="Heures de réservation anticipée" 
                value={values.minAdvanceBookingHours} 
                color="purple"
                icon={<CalendarDaysIcon className="h-4 w-4" />}
                info="Heures à l'avance pour appliquer une réduction"
                unit="h"
              />
              <FormInput 
                id="maxDaysInAdvance" 
                label="Jours de réservation anticipée" 
                value={values.maxDaysInAdvance} 
                color="purple"
                icon={<CalendarDaysIcon className="h-4 w-4" />}
                info="Jours à l'avance pour appliquer une réduction"
                unit="j"
              />
              <FormInput 
                id="cancellationDeadlineHours" 
                label="Heures avant annulation" 
                value={values.cancellationDeadlineHours}
                color="purple"
                icon={<CalendarDaysIcon className="h-4 w-4" />}
                info="Heures avant la date limite pour annuler sans frais"
                unit="h"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-indigo-100 shadow-sm overflow-hidden">
          <div className="bg-indigo-500 px-5 py-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Seuils de service
            </h4>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <FormInput 
                id="minServiceDuration" 
                label="Durée minimale de service" 
                value={values.minServiceDuration} 
                color="indigo"
                icon={<ClockIcon className="h-4 w-4" />}
                info="Durée minimale pour un service"
                unit="h"
              />
              <FormInput 
                id="maxServiceDuration" 
                label="Durée maximale de service" 
                value={values.maxServiceDuration} 
                color="indigo"
                icon={<ClockIcon className="h-4 w-4" />}
                info="Durée maximale pour un service"
                unit="h"
              />
              <FormInput 
                id="bufferBetweenBookings" 
                label="Intervalle entre réservations" 
                value={values.bufferBetweenBookings} 
                color="indigo"
                icon={<ClockIcon className="h-4 w-4" />}
                info="Intervalle minimum entre deux réservations"
                unit="h"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-rose-100 shadow-sm overflow-hidden">
          <div className="bg-rose-500 px-5 py-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5" />
              Politiques et conditions
            </h4>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <FormInput 
                id="fullRefundHours" 
                label="Heures pour remboursement total" 
                value={values.fullRefundHours} 
                color="rose"
                icon={<DocumentTextIcon className="h-4 w-4" />}
                info="Heures après la réservation pour obtenir un remboursement total"
                unit="h"
              />
              <FormInput 
                id="partialRefundPercentage" 
                label="Pourcentage de remboursement partiel" 
                value={values.partialRefundPercentage} 
                color="rose"
                icon={<ReceiptPercentIcon className="h-4 w-4" />}
                info="Pourcentage de remboursement pour annuler une réservation"
                unit="%"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-blue-100 shadow-sm overflow-hidden">
          <div className="bg-blue-500 px-5 py-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Règles de déménagement
            </h4>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <FormInput 
                id="movingEarlyBookingDays" 
                label="Jours pour réservation anticipée" 
                value={values.movingEarlyBookingDays} 
                color="blue"
                icon={<CalendarDaysIcon className="h-4 w-4" />}
                info="Jours à l'avance pour réduction sur déménagement"
                unit="j"
              />
              <FormInput 
                id="movingEarlyBookingDiscount" 
                label="Réduction réservation anticipée" 
                value={values.movingEarlyBookingDiscount} 
                color="blue"
                icon={<ReceiptPercentIcon className="h-4 w-4" />}
                info="Pourcentage de réduction pour réservation anticipée"
                unit="%"
              />
              <FormInput 
                id="movingWeekendSurcharge" 
                label="Majoration week-end" 
                value={values.movingWeekendSurcharge} 
                color="blue"
                icon={<ReceiptPercentIcon className="h-4 w-4" />}
                info="Pourcentage de majoration pour déménagement en week-end"
                unit="%"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-emerald-100 shadow-sm overflow-hidden">
          <div className="bg-emerald-500 px-5 py-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <BuildingOfficeIcon className="h-5 w-5" />
              Règles de service
            </h4>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <FormInput 
                id="serviceEarlyBookingDays" 
                label="Jours pour réservation anticipée" 
                value={values.serviceEarlyBookingDays} 
                color="emerald"
                icon={<CalendarDaysIcon className="h-4 w-4" />}
                info="Jours à l'avance pour réduction sur service"
                unit="j"
              />
              <FormInput 
                id="serviceEarlyBookingDiscount" 
                label="Réduction réservation anticipée" 
                value={values.serviceEarlyBookingDiscount} 
                color="emerald"
                icon={<ReceiptPercentIcon className="h-4 w-4" />}
                info="Pourcentage de réduction pour réservation anticipée"
                unit="%"
              />
              <FormInput 
                id="serviceWeekendSurcharge" 
                label="Majoration week-end" 
                value={values.serviceWeekendSurcharge} 
                color="emerald"
                icon={<ReceiptPercentIcon className="h-4 w-4" />}
                info="Pourcentage de majoration pour service en week-end"
                unit="%"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-amber-100 shadow-sm overflow-hidden">
          <div className="bg-amber-500 px-5 py-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <CubeIcon className="h-5 w-5" />
              Règles de pack
            </h4>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormInput 
                id="packEarlyBookingDays" 
                label="Jours pour réservation anticipée" 
                value={values.packEarlyBookingDays} 
                color="amber"
                icon={<CalendarDaysIcon className="h-4 w-4" />}
                info="Jours à l'avance pour réduction sur pack"
                unit="j"
              />
              <FormInput 
                id="packEarlyBookingDiscount" 
                label="Réduction réservation anticipée" 
                value={values.packEarlyBookingDiscount} 
                color="amber"
                icon={<ReceiptPercentIcon className="h-4 w-4" />}
                info="Pourcentage de réduction pour réservation anticipée"
                unit="%"
              />
              <FormInput 
                id="packWeekendSurcharge" 
                label="Majoration week-end" 
                value={values.packWeekendSurcharge} 
                color="amber"
                icon={<ReceiptPercentIcon className="h-4 w-4" />}
                info="Pourcentage de majoration pour pack en week-end"
                unit="%"
              />
              <FormInput 
                id="packUrgentBookingSurcharge" 
                label="Majoration réservation urgente" 
                value={values.packUrgentBookingSurcharge} 
                color="amber"
                icon={<ReceiptPercentIcon className="h-4 w-4" />}
                info="Pourcentage de majoration pour réservation urgente"
                unit="%"
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
          className="gap-2 transition-all bg-purple-500 hover:bg-purple-600 text-white shadow-lg px-8 rounded-lg"
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