"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  Cog6ToothIcon,
  ClockIcon,
  ChartBarIcon,
  MapPinIcon,
  CubeIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

// Types pour les règles unifiées (conforme à la structure BDD)
interface Rule {
  id: string;
  name: string;
  description?: string;
  value: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ruleType: string; // En BDD toutes sont 'BUSINESS' mais on filtre par serviceType + logique
  category: RuleCategory;
  condition?: any; // JSON object
  percentBased: boolean;
  serviceType: ServiceType;
  priority: number;
  validFrom: string;
  validTo?: string;
  tags: string[];
  configKey?: string;
  metadata?: any;
}

// Enums adaptés à l'analyse
type RuleViewType = "CONSTRAINT" | "BUSINESS" | "TEMPORAL"; // Types d'affichage basés sur l'analyse
type RuleCategory =
  | "REDUCTION"
  | "SURCHARGE"
  | "MINIMUM"
  | "MAXIMUM"
  | "FIXED"
  | "PERCENTAGE";
type ServiceType = "MOVING" | "PACKING" | "CLEANING" | "DELIVERY" | "SERVICE";

// Configuration des onglets basée sur l'analyse réelle des données
const RULE_VIEW_TYPES: {
  value: RuleViewType;
  label: string;
  icon: any;
  color: string;
  description: string;
}[] = [
  {
    value: "CONSTRAINT",
    label: "Contraintes",
    icon: Cog6ToothIcon,
    color: "bg-slate-100 text-slate-700",
    description: "Logistique et terrain",
  },
  {
    value: "BUSINESS",
    label: "Services",
    icon: ChartBarIcon,
    color: "bg-slate-100 text-slate-700",
    description: "Prestations annexes",
  },
  {
    value: "TEMPORAL",
    label: "Horaires",
    icon: ClockIcon,
    color: "bg-slate-100 text-slate-700",
    description: "Créneaux et urgences",
  },
];

const RULE_CATEGORIES = [
  "REDUCTION",
  "SURCHARGE",
  "MINIMUM",
  "MAXIMUM",
  "FIXED",
  "PERCENTAGE",
];
const SERVICE_TYPES = ["MOVING", "PACKING", "CLEANING", "DELIVERY", "SERVICE"];

// Fonction pour déterminer le type d'affichage basé sur l'analyse
const getViewTypeFromRule = (rule: Rule): RuleViewType => {
  // Services annexes (montants fixes) = BUSINESS
  if (!rule.percentBased && rule.category === "FIXED") {
    return "BUSINESS";
  }

  // Contraintes temporelles
  if (
    rule.condition?.type === "schedule" ||
    rule.condition?.time ||
    rule.condition?.day === "weekend" ||
    rule.condition?.urgency === "emergency"
  ) {
    return "TEMPORAL";
  }

  // Par défaut, les contraintes logistiques
  return "CONSTRAINT";
};

export function UnifiedRuleManager() {
  const { toast } = useToast();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingFallbacks, setGeneratingFallbacks] = useState(false);
  const [fallbacksCount, setFallbacksCount] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<RuleViewType>("CONSTRAINT");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

  // Form state pour création/édition
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    value: "",
    ruleType: "CONSTRAINT" as RuleViewType,
    category: "SURCHARGE" as RuleCategory,
    serviceType: "MOVING" as ServiceType,
    percentBased: true,
    priority: 100,
    tags: "",
    condition: "",
    configKey: "",
  });

  useEffect(() => {
    loadRules();
  }, []);

  // ✅ READ - Charger toutes les règles
  const loadRules = async () => {
    try {
      setLoading(true);
      console.log("🔍 UNIFIED RULES: Début du chargement des règles...");

      // 🔓 AUTHENTIFICATION DÉSACTIVÉE TEMPORAIREMENT
      const token = "bypass-token";

      // API endpoint existante avec support des filtres étendus
      const response = await fetch("/api/admin/rules?stats=true", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("🔍 UNIFIED RULES: Réponse API reçue:", response.status);
      const data = await response.json();

      if (data.success && data.data) {
        setRules(data.data || []);
        console.log("🔍 UNIFIED RULES: Règles chargées:", data.data?.length);

        // Afficher les statistiques par type
        if (data.statistics?.byRuleType) {
          console.log(
            "📊 Statistiques par ruleType:",
            data.statistics.byRuleType,
          );
        }
      } else {
        console.error("🔍 UNIFIED RULES: Erreur dans la réponse API:", data);
        toast({
          title: "❌ Erreur API",
          description: data.error || "Impossible de charger les règles",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("🔍 UNIFIED RULES: Erreur lors du chargement:", error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de charger les règles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔄 GENERATE FALLBACKS - Générer les fallbacks depuis la BDD
  const generateFallbacks = async () => {
    try {
      setGeneratingFallbacks(true);
      console.log("🔄 Génération des fallbacks...");

      const response = await fetch("/api/admin/generate-fallbacks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        // Afficher un message détaillé avec les statistiques
        const stats = data.stats;
        let description = data.message;

        if (stats) {
          const totalCount = stats.moving.total + stats.cleaning.total;
          setFallbacksCount(totalCount);
          description = `MOVING: ${stats.moving.constraints} contraintes + ${stats.moving.services} services = ${stats.moving.total} items\nCLEANING: ${stats.cleaning.constraints} contraintes + ${stats.cleaning.services} services = ${stats.cleaning.total} items\n\n${stats.filesGenerated} fichiers générés`;
        }

        toast({
          title: "✅ Fallbacks générés",
          description: description,
          variant: "default",
        });
      } else {
        console.error("❌ Erreur de génération:", data);
        toast({
          title: "❌ Erreur de génération",
          description: data.error || "Impossible de générer les fallbacks",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Erreur lors de la génération:", error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de générer les fallbacks",
        variant: "destructive",
      });
    } finally {
      setGeneratingFallbacks(false);
    }
  };

  // ✅ CREATE - Créer une nouvelle règle
  const createRule = async () => {
    try {
      // 🔓 AUTHENTIFICATION DÉSACTIVÉE TEMPORAIREMENT
      const token = "bypass-token";

      const ruleData = {
        ...formData,
        value: parseFloat(formData.value) || 0,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim())
          : [],
        condition: formData.condition ? JSON.parse(formData.condition) : null,
        ruleType: "BUSINESS", // Toutes les règles en BDD sont 'BUSINESS'
      };

      const response = await fetch("/api/admin/rules", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ruleData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "✅ Règle créée",
          description: `${formData.name} créée avec succès`,
        });
        setIsCreateDialogOpen(false);
        resetForm();
        loadRules();
      } else {
        throw new Error(data.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      toast({
        title: "❌ Erreur création",
        description: "Impossible de créer la règle",
        variant: "destructive",
      });
    }
  };

  // ✅ UPDATE - Mettre à jour une règle
  const updateRule = async () => {
    if (!selectedRule) return;

    try {
      // 🔓 AUTHENTIFICATION DÉSACTIVÉE TEMPORAIREMENT
      const token = "bypass-token";

      const ruleData = {
        ...formData,
        value: parseFloat(formData.value) || 0,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim())
          : [],
        condition: formData.condition ? JSON.parse(formData.condition) : null,
      };

      const response = await fetch(`/api/admin/rules/${selectedRule.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ruleData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "✅ Règle mise à jour",
          description: `${selectedRule.name} modifiée`,
        });
        setIsEditDialogOpen(false);
        resetForm();
        loadRules();
      } else {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast({
        title: "❌ Erreur mise à jour",
        description: "Impossible de mettre à jour la règle",
        variant: "destructive",
      });
    }
  };

  // ✅ DELETE - Supprimer une règle
  const deleteRule = async (rule: Rule) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${rule.name}" ?`)) {
      return;
    }

    try {
      // 🔓 AUTHENTIFICATION DÉSACTIVÉE TEMPORAIREMENT
      const token = "bypass-token";

      const response = await fetch(`/api/admin/rules/${rule.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "✅ Règle supprimée",
          description: `${rule.name} supprimée`,
        });
        loadRules();
      } else {
        throw new Error(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "❌ Erreur suppression",
        description: "Impossible de supprimer la règle",
        variant: "destructive",
      });
    }
  };

  // Fonctions utilitaires
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      value: "",
      ruleType: activeTab,
      category: "SURCHARGE",
      serviceType: "MOVING",
      percentBased: true,
      priority: 100,
      tags: "",
      condition: "",
      configKey: "",
    });
    setSelectedRule(null);
  };

  const openEditDialog = (rule: Rule) => {
    setSelectedRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      value: rule.value.toString(),
      ruleType: (rule.ruleType as RuleViewType) || "BUSINESS",
      category: rule.category,
      serviceType: rule.serviceType,
      percentBased: rule.percentBased,
      priority: rule.priority,
      tags: rule.tags?.join(", ") || "",
      condition: rule.condition ? JSON.stringify(rule.condition, null, 2) : "",
      configKey: rule.configKey || "",
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (rule: Rule) => {
    setSelectedRule(rule);
    setIsViewDialogOpen(true);
  };

  // Filtrage des règles par type d'affichage, service et recherche (basé sur l'analyse)
  const filteredRules = rules.filter((rule) => {
    const ruleViewType = getViewTypeFromRule(rule);
    const matchesType = ruleViewType === activeTab;
    const matchesService =
      selectedService === "all" || rule.serviceType === selectedService;
    const matchesSearch =
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.configKey?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesService && matchesSearch;
  });

  const getRuleViewTypeConfig = (viewType: RuleViewType) => {
    return (
      RULE_VIEW_TYPES.find((rt) => rt.value === viewType) || RULE_VIEW_TYPES[0]
    );
  };

  return (
    <div className="space-y-2">
      {/* Header ultra-compact */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-medium text-slate-800">Règles métier</h2>
          <span className="text-sm text-slate-500">{rules.length} règles</span>
        </div>

        {/* Statistiques inline */}
        <div className="flex items-center gap-3 text-sm">
          {RULE_VIEW_TYPES.map((viewType) => {
            const count = rules.filter(
              (r) => getViewTypeFromRule(r) === viewType.value,
            ).length;
            return (
              <div
                key={viewType.value}
                className="flex items-center gap-1 text-slate-600"
              >
                <span className="font-medium">{count}</span>
                <span className="text-slate-500">
                  {viewType.label.toLowerCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation par onglets simplifiée */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as RuleViewType)}
      >
        <TabsList className="bg-slate-100 rounded-lg p-0.5 grid w-full grid-cols-3 h-8">
          {RULE_VIEW_TYPES.map((viewType) => {
            const Icon = viewType.icon;
            const count = rules.filter(
              (r) => getViewTypeFromRule(r) === viewType.value,
            ).length;
            return (
              <TabsTrigger
                key={viewType.value}
                value={viewType.value}
                className="flex items-center gap-1 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 text-sm px-2"
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{viewType.label}</span>
                <span className="text-xs bg-slate-200 text-slate-600 px-1 py-0.5 rounded">
                  {count}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Contenu pour chaque type d'affichage */}
        {RULE_VIEW_TYPES.map((viewType) => (
          <TabsContent
            key={viewType.value}
            value={viewType.value}
            className="space-y-2 mt-2"
          >
            {/* Contrôles épurés */}
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              {/* Filtres et actions */}
              <div className="flex flex-col md:flex-row gap-2 items-center justify-between">
                {/* Filtres */}
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                  {/* Recherche */}
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder={`Rechercher une règle...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-8"
                    />
                  </div>

                  {/* Filtre par service */}
                  <div className="w-full sm:w-48">
                    <Select
                      value={selectedService}
                      onValueChange={setSelectedService}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        {SERVICE_TYPES.map((serviceType) => {
                          const count = rules.filter(
                            (r) =>
                              getViewTypeFromRule(r) === activeTab &&
                              r.serviceType === serviceType,
                          ).length;
                          if (count === 0) return null;
                          return (
                            <SelectItem key={serviceType} value={serviceType}>
                              {serviceType === "MOVING"
                                ? "Déménagement"
                                : serviceType === "CLEANING"
                                  ? "Ménage"
                                  : serviceType === "DELIVERY"
                                    ? "Livraison"
                                    : serviceType === "PACKING"
                                      ? "Emballage"
                                      : serviceType}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {fallbacksCount !== null && (
                    <span className="text-sm text-slate-500 mr-1">
                      {fallbacksCount} fallbacks
                    </span>
                  )}
                  <Button
                    onClick={generateFallbacks}
                    variant="outline"
                    size="sm"
                    disabled={generatingFallbacks}
                    className="border-green-300 text-green-700 hover:bg-green-50 h-8"
                  >
                    <CubeIcon
                      className={`h-4 w-4 mr-1 ${generatingFallbacks ? "animate-spin" : ""}`}
                    />
                    {generatingFallbacks ? "Génération..." : "Fallbacks"}
                  </Button>
                  <Button
                    onClick={loadRules}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    className="h-8"
                  >
                    <ArrowPathIcon
                      className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                  </Button>
                  <Button
                    onClick={() => {
                      setFormData({ ...formData, ruleType: activeTab });
                      setIsCreateDialogOpen(true);
                    }}
                    size="sm"
                    className="bg-slate-700 hover:bg-slate-800 h-8"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Créer
                  </Button>
                </div>
              </div>
            </div>

            {/* Tableau des règles compact */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%] px-3">Nom</TableHead>
                    <TableHead className="w-[12%] px-2">Catégorie</TableHead>
                    <TableHead className="w-[12%] px-2">Service</TableHead>
                    <TableHead className="w-[10%] px-2">Valeur</TableHead>
                    <TableHead className="w-[8%] px-2">Priorité</TableHead>
                    <TableHead className="w-[10%] px-2">Statut</TableHead>
                    <TableHead className="w-[18%] text-right px-3">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-600" />
                        Chargement des règles...
                      </TableCell>
                    </TableRow>
                  ) : filteredRules.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-slate-500"
                      >
                        Aucun résultat
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="px-3 py-2">
                          <div>
                            <div className="font-medium text-sm">
                              {rule.name}
                            </div>
                            {rule.description && (
                              <div className="text-xs text-slate-500 truncate max-w-xs">
                                {rule.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <Badge
                            variant="outline"
                            className="text-xs px-1 py-0.5"
                          >
                            {rule.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <Badge
                            variant="secondary"
                            className="text-xs px-1 py-0.5 text-white bg-slate-600"
                          >
                            {rule.serviceType}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <span className="font-mono text-xs">
                            {rule.value}
                            {rule.percentBased ? "%" : "€"}
                          </span>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <span className="text-xs font-medium text-slate-600">
                            {rule.priority}
                          </span>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <div
                            className={`inline-flex h-2 w-2 rounded-full ${rule.isActive ? "bg-green-500" : "bg-slate-300"}`}
                          ></div>
                        </TableCell>
                        <TableCell className="text-right px-3 py-2">
                          <div className="flex gap-0.5 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewDialog(rule)}
                              title="Voir détails"
                              className="h-7 w-7 p-0"
                            >
                              <EyeIcon className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(rule)}
                              title="Modifier"
                              className="h-7 w-7 p-0"
                            >
                              <PencilIcon className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteRule(rule)}
                              className="text-red-600 hover:text-red-700 h-7 w-7 p-0"
                              title="Supprimer"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog Création */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une règle</DialogTitle>
            <DialogDescription>
              Nouvelle règle de type{" "}
              {getRuleViewTypeConfig(activeTab).label.toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Première ligne - Informations de base */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom de la règle</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nom descriptif de la règle"
                />
              </div>
              <div>
                <Label htmlFor="configKey">
                  Clé de configuration (optionnel)
                </Label>
                <Input
                  id="configKey"
                  value={formData.configKey}
                  onChange={(e) =>
                    setFormData({ ...formData, configKey: e.target.value })
                  }
                  placeholder="CONFIG_KEY_MIGRATION"
                />
              </div>
            </div>

            {/* Deuxième ligne - Paramètres métier */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: RuleCategory) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RULE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="serviceType">Type de service</Label>
                <Select
                  value={formData.serviceType}
                  onValueChange={(value: ServiceType) =>
                    setFormData({ ...formData, serviceType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((serviceType) => (
                      <SelectItem key={serviceType} value={serviceType}>
                        {serviceType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">Valeur</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value) || 100,
                    })
                  }
                  placeholder="100"
                />
              </div>
            </div>

            {/* Troisième ligne - Options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de valeur</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="percentBased"
                      checked={formData.percentBased}
                      onChange={() =>
                        setFormData({ ...formData, percentBased: true })
                      }
                      className="mr-2"
                    />
                    Pourcentage (%)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="percentBased"
                      checked={!formData.percentBased}
                      onChange={() =>
                        setFormData({ ...formData, percentBased: false })
                      }
                      className="mr-2"
                    />
                    Montant fixe (€)
                  </label>
                </div>
              </div>
              <div>
                <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description détaillée de la règle"
                rows={2}
              />
            </div>

            {/* Condition JSON */}
            <div>
              <Label htmlFor="condition">Condition JSON (optionnel)</Label>
              <Textarea
                id="condition"
                value={formData.condition}
                onChange={(e) =>
                  setFormData({ ...formData, condition: e.target.value })
                }
                placeholder='{"type": "SIMPLE", "expression": "pickupFloor > 2 && !pickupElevator"}'
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={createRule}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Créer la règle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la règle</DialogTitle>
            <DialogDescription>
              Modifiez les paramètres de la règle sélectionnée
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Identiques aux champs de création */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nom de la règle</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-configKey">Clé de configuration</Label>
                <Input
                  id="edit-configKey"
                  value={formData.configKey}
                  onChange={(e) =>
                    setFormData({ ...formData, configKey: e.target.value })
                  }
                />
              </div>
            </div>
            {/* Reste des champs similaires à la création... */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Catégorie</Label>
                <Input
                  value={formData.category}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label>Service</Label>
                <Input
                  value={formData.serviceType}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="edit-value">Valeur</Label>
                <Input
                  id="edit-value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-priority">Priorité</Label>
                <Input
                  id="edit-priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value) || 100,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="edit-condition">Condition JSON</Label>
              <Textarea
                id="edit-condition"
                value={formData.condition}
                onChange={(e) =>
                  setFormData({ ...formData, condition: e.target.value })
                }
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={updateRule}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Visualisation */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détails de la règle</DialogTitle>
            <DialogDescription>
              Informations complètes de la règle sélectionnée
            </DialogDescription>
          </DialogHeader>
          {selectedRule && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID</Label>
                  <code className="block text-xs bg-gray-100 p-2 rounded">
                    {selectedRule.id}
                  </code>
                </div>
                <div>
                  <Label>Type de règle</Label>
                  <Badge
                    className={
                      getRuleViewTypeConfig(getViewTypeFromRule(selectedRule))
                        .color
                    }
                  >
                    {
                      getRuleViewTypeConfig(getViewTypeFromRule(selectedRule))
                        .label
                    }
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Nom</Label>
                <p className="font-medium">{selectedRule.name}</p>
              </div>
              {selectedRule.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    {selectedRule.description}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Catégorie</Label>
                  <Badge variant="outline">{selectedRule.category}</Badge>
                </div>
                <div>
                  <Label>Service</Label>
                  <Badge variant="secondary">{selectedRule.serviceType}</Badge>
                </div>
                <div>
                  <Label>Valeur</Label>
                  <span className="font-mono">
                    {selectedRule.value}
                    {selectedRule.percentBased ? "%" : "€"}
                  </span>
                </div>
                <div>
                  <Label>Priorité</Label>
                  <Badge variant="outline">{selectedRule.priority}</Badge>
                </div>
              </div>
              {selectedRule.condition && (
                <div>
                  <Label>Condition</Label>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
                    {JSON.stringify(selectedRule.condition, null, 2)}
                  </pre>
                </div>
              )}
              {selectedRule.tags && selectedRule.tags.length > 0 && (
                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-1 flex-wrap">
                    {selectedRule.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Statut</Label>
                  <Badge
                    variant={selectedRule.isActive ? "default" : "secondary"}
                  >
                    {selectedRule.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <Label>Dernière modification</Label>
                  <p className="text-sm">
                    {new Date(selectedRule.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
