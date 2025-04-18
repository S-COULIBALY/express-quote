'use client'

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowPathIcon, 
  BuildingOfficeIcon, 
  IdentificationIcon, 
  MapPinIcon, 
  UserIcon, 
  ShieldCheckIcon, 
  ServerIcon, 
  DocumentTextIcon
} from "@heroicons/react/24/outline"
import { getLegalInformation, saveLegalInformation, LegalInformationConfig as LegalInformationConfigType } from "@/actions/adminLegal"

export function LegalInformationConfig() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [values, setValues] = useState<LegalInformationConfigType>({
    // Informations de base
    companyName: '',
    legalForm: '',
    registrationNumber: '',
    vatNumber: '',
    shareCapital: '',
    
    // Coordonnées légales
    registeredAddress: '',
    postalCode: '',
    city: '',
    country: '',
    
    // Représentants légaux
    legalRepresentative: '',
    dataProtectionOfficer: '',
    
    // Informations RGPD / Cookies
    cookiePolicyUrl: '',
    privacyPolicyUrl: '',
    dataRetentionPeriod: '',
    
    // Informations sur l'hébergeur
    hostingProvider: '',
    hostingAddress: '',
    hostingContact: '',
    
    // Mentions légales spécifiques
    additionalMentions: '',
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      // Utilisation de la Server Action pour charger les configurations
      const config = await getLegalInformation();
      setValues(config);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des informations légales:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations légales",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      const result = await saveLegalInformation(values);
      
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
        description: "Impossible de sauvegarder les informations légales",
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
          <p className="text-blue-900 font-medium">Chargement des informations légales...</p>
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
    color?: 'blue' | 'emerald' | 'indigo' | 'rose' | 'amber';
    info?: string;
    required?: boolean;
    textarea?: boolean;
  }

  const FormInput = ({ 
    id, 
    label, 
    value, 
    placeholder = "", 
    type = "text",
    icon = <BuildingOfficeIcon className="h-4 w-4" />,
    color = "blue",
    info,
    required = false,
    textarea = false
  }: FormInputProps) => {
    const colorClasses: Record<string, string> = {
      blue: "border-blue-200 focus-within:ring-blue-500 focus-within:border-blue-500 bg-blue-50/50",
      emerald: "border-emerald-200 focus-within:ring-emerald-500 focus-within:border-emerald-500 bg-emerald-50/50",
      indigo: "border-indigo-200 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-indigo-50/50",
      amber: "border-amber-200 focus-within:ring-amber-500 focus-within:border-amber-500 bg-amber-50/50",
      rose: "border-rose-200 focus-within:ring-rose-500 focus-within:border-rose-500 bg-rose-50/50",
    };
    
    const iconColors: Record<string, string> = {
      blue: "text-blue-600",
      emerald: "text-emerald-600",
      indigo: "text-indigo-600",
      amber: "text-amber-600",
      rose: "text-rose-600",
    };

    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="text-sm font-medium flex items-center gap-1">
          <span className={`${iconColors[color]}`}>{icon}</span>
          <span>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </Label>
        <div className={`relative transition-all rounded-md ${colorClasses[color]}`}>
          {textarea ? (
            <Textarea
              id={id}
              name={id}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              className="pl-8 min-h-[100px] border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          ) : (
            <Input
              id={id}
              name={id}
              type={type}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              className="pl-8 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              required={required}
            />
          )}
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className={`${iconColors[color]}`}>{icon}</span>
          </div>
        </div>
        {info && <p className="text-xs text-gray-500 italic">{info}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="w-full bg-white border-b flex flex-wrap">
          <TabsTrigger 
            value="company" 
            className="flex-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-300"
          >
            <BuildingOfficeIcon className="h-4 w-4 mr-2" />
            Entreprise
          </TabsTrigger>
          <TabsTrigger 
            value="address" 
            className="flex-1 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/20 dark:data-[state=active]:text-emerald-300"
          >
            <MapPinIcon className="h-4 w-4 mr-2" />
            Coordonnées
          </TabsTrigger>
          <TabsTrigger 
            value="representatives" 
            className="flex-1 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-indigo-900/20 dark:data-[state=active]:text-indigo-300"
          >
            <UserIcon className="h-4 w-4 mr-2" />
            Représentants
          </TabsTrigger>
          <TabsTrigger 
            value="gdpr" 
            className="flex-1 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 dark:data-[state=active]:bg-rose-900/20 dark:data-[state=active]:text-rose-300"
          >
            <ShieldCheckIcon className="h-4 w-4 mr-2" />
            RGPD
          </TabsTrigger>
          <TabsTrigger 
            value="hosting" 
            className="flex-1 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 dark:data-[state=active]:bg-amber-900/20 dark:data-[state=active]:text-amber-300"
          >
            <ServerIcon className="h-4 w-4 mr-2" />
            Hébergement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="pt-6">
          <Card className="border border-blue-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <BuildingOfficeIcon className="h-5 w-5" />
                Informations de l'entreprise
              </h4>
            </div>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormInput 
                  id="companyName" 
                  label="Nom de l'entreprise" 
                  value={values.companyName} 
                  color="blue"
                  icon={<BuildingOfficeIcon className="h-4 w-4" />}
                  info="Raison sociale complète"
                  required={true}
                />
                <FormInput 
                  id="legalForm" 
                  label="Forme juridique" 
                  value={values.legalForm} 
                  color="blue"
                  icon={<DocumentTextIcon className="h-4 w-4" />}
                  info="SAS, SARL, SA, etc."
                />
                <FormInput 
                  id="registrationNumber" 
                  label="Numéro d'immatriculation" 
                  value={values.registrationNumber} 
                  color="blue"
                  icon={<IdentificationIcon className="h-4 w-4" />}
                  info="SIREN/SIRET ou numéro RCS"
                  required={true}
                />
                <FormInput 
                  id="vatNumber" 
                  label="Numéro de TVA" 
                  value={values.vatNumber} 
                  color="blue"
                  icon={<DocumentTextIcon className="h-4 w-4" />}
                  info="Numéro de TVA intracommunautaire"
                />
                <FormInput 
                  id="shareCapital" 
                  label="Capital social" 
                  value={values.shareCapital} 
                  color="blue"
                  icon={<BuildingOfficeIcon className="h-4 w-4" />}
                  info="Montant du capital social"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address" className="pt-6">
          <Card className="border border-emerald-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <MapPinIcon className="h-5 w-5" />
                Coordonnées légales
              </h4>
            </div>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormInput 
                  id="registeredAddress" 
                  label="Adresse du siège social" 
                  value={values.registeredAddress} 
                  color="emerald"
                  icon={<MapPinIcon className="h-4 w-4" />}
                  info="Adresse complète du siège social"
                  required={true}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormInput 
                    id="postalCode" 
                    label="Code postal" 
                    value={values.postalCode} 
                    color="emerald"
                    icon={<MapPinIcon className="h-4 w-4" />}
                  />
                  <FormInput 
                    id="city" 
                    label="Ville" 
                    value={values.city} 
                    color="emerald"
                    icon={<MapPinIcon className="h-4 w-4" />}
                  />
                </div>
                <FormInput 
                  id="country" 
                  label="Pays" 
                  value={values.country} 
                  color="emerald"
                  icon={<MapPinIcon className="h-4 w-4" />}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="representatives" className="pt-6">
          <Card className="border border-indigo-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Représentants légaux
              </h4>
            </div>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormInput 
                  id="legalRepresentative" 
                  label="Représentant légal" 
                  value={values.legalRepresentative} 
                  color="indigo"
                  icon={<UserIcon className="h-4 w-4" />}
                  info="Nom complet du représentant légal"
                  required={true}
                />
                <FormInput 
                  id="dataProtectionOfficer" 
                  label="Délégué à la protection des données" 
                  value={values.dataProtectionOfficer} 
                  color="indigo"
                  icon={<ShieldCheckIcon className="h-4 w-4" />}
                  info="Nom du DPO (si applicable)"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gdpr" className="pt-6">
          <Card className="border border-rose-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-5 py-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5" />
                Informations RGPD et cookies
              </h4>
            </div>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormInput 
                  id="cookiePolicyUrl" 
                  label="URL politique de cookies" 
                  value={values.cookiePolicyUrl} 
                  color="rose"
                  icon={<DocumentTextIcon className="h-4 w-4" />}
                  info="URL de la page de politique des cookies"
                />
                <FormInput 
                  id="privacyPolicyUrl" 
                  label="URL politique de confidentialité" 
                  value={values.privacyPolicyUrl} 
                  color="rose"
                  icon={<DocumentTextIcon className="h-4 w-4" />}
                  info="URL de la page de politique de confidentialité"
                />
                <FormInput 
                  id="dataRetentionPeriod" 
                  label="Durée de conservation des données" 
                  value={values.dataRetentionPeriod} 
                  color="rose"
                  icon={<ShieldCheckIcon className="h-4 w-4" />}
                  info="Durée de conservation des données personnelles"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hosting" className="pt-6">
          <Card className="border border-amber-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <ServerIcon className="h-5 w-5" />
                Informations sur l'hébergeur
              </h4>
            </div>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormInput 
                  id="hostingProvider" 
                  label="Nom de l'hébergeur" 
                  value={values.hostingProvider} 
                  color="amber"
                  icon={<ServerIcon className="h-4 w-4" />}
                  info="Société d'hébergement web"
                  required={true}
                />
                <FormInput 
                  id="hostingAddress" 
                  label="Adresse de l'hébergeur" 
                  value={values.hostingAddress} 
                  color="amber"
                  icon={<MapPinIcon className="h-4 w-4" />}
                  info="Adresse complète de l'hébergeur"
                />
                <FormInput 
                  id="hostingContact" 
                  label="Contact de l'hébergeur" 
                  value={values.hostingContact} 
                  color="amber"
                  icon={<ServerIcon className="h-4 w-4" />}
                  info="Email ou téléphone de l'hébergeur"
                />
                <FormInput 
                  id="additionalMentions" 
                  label="Mentions légales additionnelles" 
                  value={values.additionalMentions} 
                  color="amber"
                  icon={<DocumentTextIcon className="h-4 w-4" />}
                  info="Mentions légales spécifiques supplémentaires"
                  textarea={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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