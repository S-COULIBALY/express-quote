"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ArrowPathIcon, 
  Cog8ToothIcon,
  GlobeEuropeAfricaIcon,
  CalendarDaysIcon,
  ClockIcon,
  TagIcon,
  CurrencyDollarIcon,
  LanguageIcon,
  BuildingOfficeIcon,
  TruckIcon,
  HomeModernIcon
} from "@heroicons/react/24/outline"
import { getServiceParamsConfig, saveServiceParamsConfig, ServiceParamsConfig as ServiceParamsConfigType } from "@/actions/adminRules"
import { ServiceType } from "@/quotation/domain/enums/ServiceType"

// Mapping pour l'affichage des types de services
const serviceTypeLabels: Record<string, string> = {
  [ServiceType.MOVING]: "Déménagement",
  [ServiceType.PACKING]: "Emballage",
  [ServiceType.CLEANING]: "Nettoyage",
  [ServiceType.DELIVERY]: "Livraison",
  [ServiceType.PACK]: "Pack",
  [ServiceType.SERVICE]: "Service",
}

export function ServiceParamsConfig() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [values, setValues] = useState<ServiceParamsConfigType>({
    // Types de service
    enabledServiceTypes: [],
    enabledPackTypes: [],
    
    // Paramètres de disponibilité
    workingHoursStart: '',
    workingHoursEnd: '',
    workingDays: [],
    
    // Paramètres de trajet
    defaultTravelSpeed: '',
    workerSetupTime: '',
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      // Utilisation de la Server Action pour charger les configurations
      const config = await getServiceParamsConfig();
      setValues(config);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres de service:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres de service",
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

  const handleSelectChange = (name: string, value: string) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCheckboxChange = (name: string, value: string, checked: boolean) => {
    setValues(prev => {
      const currentValues = prev[name as keyof ServiceParamsConfigType] as string[];
      const newValues = checked 
        ? [...currentValues, value]
        : currentValues.filter(v => v !== value);
      
      return {
        ...prev,
        [name]: newValues
      };
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      // Utilisation de la Server Action pour sauvegarder les configurations
      const result = await saveServiceParamsConfig(values);
      
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
        description: "Impossible de sauvegarder les paramètres de service",
        variant: "destructive",
      })
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex flex-col items-center gap-2 text-amber-600">
          <ArrowPathIcon className="h-10 w-10 animate-spin" />
          <p className="text-amber-900 font-medium">Chargement des paramètres...</p>
        </div>
      </div>
    )
  }

  interface FormInputProps {
    id: string;
    label: string;
    value: string;
    placeholder?: string;
    type?: string;
    icon?: React.ReactNode;
    color?: 'amber' | 'teal' | 'indigo' | 'blue' | 'purple' | 'rose';
    info?: string;
    unit?: string;
    step?: string;
  }

  const FormInput = ({ 
    id, 
    label, 
    value, 
    placeholder = "", 
    type = "text",
    icon = <Cog8ToothIcon className="h-4 w-4" />,
    color = "amber",
    info,
    unit
  }: FormInputProps) => {
    const colorClasses: Record<string, string> = {
      amber: "border-amber-200 focus-within:ring-amber-500 focus-within:border-amber-500 bg-amber-50/50",
      teal: "border-teal-200 focus-within:ring-teal-500 focus-within:border-teal-500 bg-teal-50/50",
      indigo: "border-indigo-200 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-indigo-50/50",
      blue: "border-blue-200 focus-within:ring-blue-500 focus-within:border-blue-500 bg-blue-50/50",
      purple: "border-purple-200 focus-within:ring-purple-500 focus-within:border-purple-500 bg-purple-50/50",
      rose: "border-rose-200 focus-within:ring-rose-500 focus-within:border-rose-500 bg-rose-50/50",
    };
    
    const iconColors: Record<string, string> = {
      amber: "text-amber-600",
      teal: "text-teal-600",
      indigo: "text-indigo-600",
      blue: "text-blue-600",
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
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className="pl-8 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className={`${iconColors[color]}`}>{icon}</span>
          </div>
          {unit && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500">{unit}</span>
            </div>
          )}
        </div>
        {info && <p className="text-xs text-gray-500 italic">{info}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-8">
        <Card className="border border-amber-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cog8ToothIcon className="h-5 w-5" />
              Types de services
            </h4>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <span className="text-amber-600">Types de forfaits disponibles</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {['basic', 'standard', 'premium', 'custom'].map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`packType-${type}`}
                        checked={values.enabledPackTypes.includes(type)}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('enabledPackTypes', type, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`packType-${type}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <span className="text-amber-600">Types de services disponibles</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(ServiceType).map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`serviceType-${type}`}
                        checked={values.enabledServiceTypes.includes(type)}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('enabledServiceTypes', type, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`serviceType-${type}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {serviceTypeLabels[type] || type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-indigo-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5" />
              Disponibilité
            </h4>
          </div>
          <CardContent className="p-5">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <span className="text-indigo-600">Jours de travail</span>
                </Label>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                  {[
                    { id: 'monday', label: 'Lundi' },
                    { id: 'tuesday', label: 'Mardi' },
                    { id: 'wednesday', label: 'Mercredi' },
                    { id: 'thursday', label: 'Jeudi' },
                    { id: 'friday', label: 'Vendredi' },
                    { id: 'saturday', label: 'Samedi' },
                    { id: 'sunday', label: 'Dimanche' },
                  ].map(day => (
                    <div key={day.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`day-${day.id}`}
                        checked={values.workingDays.includes(day.id)}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('workingDays', day.id, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`day-${day.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput 
                  id="workingHoursStart" 
                  label="Heure de début" 
                  value={values.workingHoursStart} 
                  type="time"
                  color="indigo"
                  icon={<ClockIcon className="h-4 w-4" />}
                  info="Heure de début de la journée de travail"
                />
                <FormInput 
                  id="workingHoursEnd" 
                  label="Heure de fin" 
                  value={values.workingHoursEnd} 
                  type="time"
                  color="indigo"
                  icon={<ClockIcon className="h-4 w-4" />}
                  info="Heure de fin de la journée de travail"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-orange-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Paramètres de trajet
            </h4>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <FormInput 
                id="defaultTravelSpeed" 
                label="Vitesse de déplacement par défaut" 
                value={values.defaultTravelSpeed} 
                color="amber"
                icon={<TruckIcon className="h-4 w-4" />}
                placeholder="30"
                info="Vitesse moyenne de déplacement en km/h"
                unit="km/h"
              />
              <FormInput 
                id="workerSetupTime" 
                label="Temps de préparation" 
                value={values.workerSetupTime} 
                color="amber"
                icon={<ClockIcon className="h-4 w-4" />}
                placeholder="15"
                info="Temps nécessaire pour la préparation en minutes"
                unit="min"
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
          className="gap-2 transition-all bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl px-8 rounded-lg"
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