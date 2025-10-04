"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import {
  BeakerIcon,
  PlayIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

// ✅ RÉUTILISATION - Hook existant
import { useCentralizedPricing } from "@/hooks/shared/useCentralizedPricing";

// Import des fallbacks pour les contraintes/services
import {
  movingConstraintsFallback,
  movingServicesFallback,
} from "@/data/fallbacks";
import {
  cleaningConstraintsFallback,
  cleaningServicesFallback,
} from "@/data/fallbacks";

interface TestScenario {
  id: string;
  name: string;
  description: string;
  serviceType: string;
  input: TestInput;
  expectedPrice?: number;
  tolerance: number;
  tags: string[];
  createdAt: Date;
  lastRun?: Date;
  lastResult?: TestResult;
}

interface TestInput {
  serviceType: string;
  volume?: number;
  distance?: number;
  duration?: number;
  workers?: number;
  scheduledDate?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupFloor?: number;
  deliveryFloor?: number;
  pickupElevator?: boolean;
  deliveryElevator?: boolean;
  pickupCarryDistance?: number;
  deliveryCarryDistance?: number;
  constraints?: string[];
  services?: string[];
  logisticsConstraints?: {
    pickupLogisticsConstraints?: string[];
    deliveryLogisticsConstraints?: string[];
    services?: string[];
  };
  [key: string]: any;
}

interface TestResult {
  success: boolean;
  calculatedPrice: number;
  expectedPrice?: number;
  variance: number;
  variancePercentage: number;
  executionTime: number;
  appliedRules: Array<{ name: string; impact: number }>;
  breakdown: Record<string, number>;
  recommendation: "accept" | "review" | "reject";
  timestamp: Date;
}

export function UnifiedTestingFramework() {
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [activeTab, setActiveTab] = useState("create");
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(
    new Set(),
  );
  const [newScenario, setNewScenario] = useState<Partial<TestScenario>>({
    name: "",
    description: "",
    serviceType: "MOVING",
    tolerance: 5,
    tags: [],
    input: {
      serviceType: "MOVING",
      volume: 20,
      distance: 15,
      constraints: [],
      services: [],
    },
  });
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());

  // ✅ RÉUTILISATION - Hook existant
  const { calculatePrice } = useCentralizedPricing();

  // Scénarios prédéfinis
  const predefinedScenarios: TestScenario[] = [
    {
      id: "packing_basic",
      name: "Pack Déménagement T2 Local",
      description:
        "Pack déménagement T2 local 15km, 2 ouvriers, 7h, avec ascenseur à l'arrivée",
      serviceType: "PACKING",
      input: {
        serviceType: "PACKING",
        defaultPrice: 490, // ✅ Prix de base du pack (2 workers × 7h × 35€)
        distance: 15,
        workers: 2,
        duration: 7,
        pickupFloor: 2,
        deliveryFloor: 1,
        pickupElevator: false,
        deliveryElevator: true,
        pickupCarryDistance: 10,
        deliveryCarryDistance: 5,
      },
      expectedPrice: 1200,
      tolerance: 10,
      tags: ["packing", "basic", "apartment", "local"],
      createdAt: new Date(),
    },
    {
      id: "moving_complex",
      name: "Déménagement Complexe T4 (Pack)",
      description:
        "Pack déménagement T4 avec escaliers difficiles, couloirs étroits, parking difficile, meubles encombrants et emballage pro",
      serviceType: "PACKING",
      input: {
        serviceType: "PACKING", // ✅ Pack catalogue = PACKING
        defaultPrice: 1470, // ✅ Prix de base du pack (3 workers × 14h × 35€)
        distance: 45,
        workers: 3,
        duration: 14,
        pickupFloor: 4,
        deliveryFloor: 3,
        pickupElevator: false,
        deliveryElevator: false,
        pickupCarryDistance: 35,
        deliveryCarryDistance: 40,
        logisticsConstraints: {
          pickupLogisticsConstraints: ["difficult_stairs", "narrow_corridors"],
          deliveryLogisticsConstraints: [
            "difficult_parking",
            "long_carrying_distance",
          ],
          services: ["bulky_furniture", "professional_packing_departure"],
        },
      },
      expectedPrice: 6000,
      tolerance: 15,
      tags: ["packing", "complex", "house"],
      createdAt: new Date(),
    },
    {
      id: "moving_premium",
      name: "Déménagement Sur Mesure Villa Premium",
      description:
        "Déménagement sur mesure villa 85m³ avec piano, objets d'art, meubles fragiles, emballage complet et stockage temporaire - PROMO 10%",
      serviceType: "MOVING",
      input: {
        serviceType: "MOVING",
        volume: 85,
        distance: 60,
        pickupFloor: 0,
        deliveryFloor: 0,
        pickupElevator: true,
        deliveryElevator: true,
        pickupCarryDistance: 25,
        deliveryCarryDistance: 30,
        isPromotionActive: true,
        promotionCode: "PREMIUM10",
        promotionType: "PERCENT",
        promotionValue: 10,
        logisticsConstraints: {
          pickupLogisticsConstraints: ["access_control", "fragile_floor"],
          deliveryLogisticsConstraints: [
            "pedestrian_zone",
            "administrative_permit",
          ],
          services: [
            "transport_piano",
            "artwork_packing",
            "fragile_valuable_items",
            "professional_packing_departure",
            "professional_unpacking_arrival",
            "furniture_disassembly",
            "furniture_reassembly",
            "temporary_storage_service",
            "inventory_with_photos",
          ],
        },
      },
      expectedPrice: 12000,
      tolerance: 20,
      tags: ["moving", "premium", "villa", "luxury", "promotion"],
      createdAt: new Date(),
    },
    {
      id: "packing_student",
      name: "Pack Étudiant Studio",
      description:
        "Pack déménagement studio étudiant, 2 ouvriers, 4h, courte distance, pas de contraintes - PROMO 50€",
      serviceType: "PACKING",
      input: {
        serviceType: "PACKING",
        defaultPrice: 280, // ✅ Prix de base du pack (2 workers × 4h × 35€)
        distance: 8,
        workers: 2,
        duration: 4,
        pickupFloor: 1,
        deliveryFloor: 2,
        pickupElevator: true,
        deliveryElevator: false,
        pickupCarryDistance: 5,
        deliveryCarryDistance: 8,
        isPromotionActive: true,
        promotionCode: "STUDENT50",
        promotionType: "FIXED",
        promotionValue: 50,
      },
      expectedPrice: 550,
      tolerance: 10,
      tags: ["packing", "student", "studio", "simple", "promotion", "local"],
      createdAt: new Date(),
    },
    {
      id: "moving_long_distance",
      name: "Déménagement Sur Mesure Longue Distance",
      description:
        "Déménagement sur mesure T3 45m³ sur longue distance (120km) avec emballage et services complémentaires",
      serviceType: "MOVING",
      input: {
        serviceType: "MOVING",
        volume: 45,
        distance: 120,
        pickupFloor: 3,
        deliveryFloor: 2,
        pickupElevator: true,
        deliveryElevator: false,
        pickupCarryDistance: 15,
        deliveryCarryDistance: 25,
        logisticsConstraints: {
          pickupLogisticsConstraints: [],
          deliveryLogisticsConstraints: [
            "difficult_stairs",
            "narrow_inaccessible_street",
          ],
          services: [
            "professional_packing_departure",
            "packing_supplies",
            "heavy_items",
            "furniture_disassembly",
            "furniture_reassembly",
            "post_move_cleaning",
          ],
        },
      },
      expectedPrice: 6500,
      tolerance: 15,
      tags: ["moving", "long-distance", "apartment"],
      createdAt: new Date(),
    },
    {
      id: "moving_furniture_lift",
      name: "Déménagement Sur Mesure avec Monte-meuble",
      description:
        "Déménagement sur mesure T3 40m³ au 5ème étage sans ascenseur, nécessite monte-meuble - PROMO 15%",
      serviceType: "MOVING",
      input: {
        serviceType: "MOVING",
        volume: 40,
        distance: 20,
        pickupFloor: 5,
        deliveryFloor: 4,
        pickupElevator: false,
        deliveryElevator: false,
        pickupCarryDistance: 50,
        deliveryCarryDistance: 45,
        isPromotionActive: true,
        promotionCode: "LIFT15",
        promotionType: "PERCENT",
        promotionValue: 15,
        logisticsConstraints: {
          pickupLogisticsConstraints: [
            "furniture_lift_required",
            "difficult_stairs",
            "narrow_corridors",
          ],
          deliveryLogisticsConstraints: [
            "difficult_stairs",
            "narrow_corridors",
          ],
          services: ["bulky_furniture", "heavy_items"],
        },
      },
      expectedPrice: 5300,
      tolerance: 15,
      tags: ["moving", "furniture-lift", "high-floor", "promotion"],
      createdAt: new Date(),
    },
    {
      id: "cleaning_basic",
      name: "Nettoyage Appartement 60m²",
      description: "Nettoyage standard appartement, 1 personne, 3h",
      serviceType: "CLEANING",
      input: {
        serviceType: "CLEANING",
        defaultPrice: 120,
        area: 60,
        rooms: 3,
        duration: 3,
        workers: 1,
        frequency: "one_time",
      },
      expectedPrice: 120,
      tolerance: 8,
      tags: ["cleaning", "apartment", "standard"],
      createdAt: new Date(),
    },
    {
      id: "cleaning_deep",
      name: "Nettoyage Approfondi Maison 120m²",
      description:
        "Nettoyage approfondi maison 120m², 2 personnes, 6h avec services premium",
      serviceType: "CLEANING",
      input: {
        serviceType: "CLEANING",
        defaultPrice: 280,
        area: 120,
        rooms: 5,
        duration: 6,
        workers: 2,
        frequency: "one_time",
        logisticsConstraints: {
          services: [
            "Grand nettoyage de printemps",
            "Nettoyage vitres complet",
            "Nettoyage électroménager",
          ],
        },
      },
      expectedPrice: 450,
      tolerance: 10,
      tags: ["cleaning", "house", "deep", "premium"],
      createdAt: new Date(),
    },
  ];

  const runSingleTest = async (scenario: TestScenario) => {
    if (runningTests.has(scenario.id)) return;

    setRunningTests((prev) => new Set([...prev, scenario.id]));
    const startTime = Date.now();

    try {
      // Calculer le prix via l'API
      const result = await calculatePrice(scenario.input as any); // Type cast pour compatibilité
      const executionTime = Date.now() - startTime;

      // Extraire le prix (utiliser ?? au lieu de || pour supporter 0)
      const calculatedPrice = result.totalPrice ?? result.calculatedPrice ?? 0;
      const expectedPrice = scenario.expectedPrice || 0;
      const variance = Math.abs(calculatedPrice - expectedPrice);
      const variancePercentage =
        expectedPrice > 0 ? (variance / expectedPrice) * 100 : 0;

      let recommendation: "accept" | "review" | "reject" = "accept";
      if (variancePercentage > scenario.tolerance) {
        recommendation =
          variancePercentage > scenario.tolerance * 2 ? "reject" : "review";
      }

      const testResult: TestResult = {
        success: !result.error,
        calculatedPrice,
        expectedPrice,
        variance,
        variancePercentage,
        executionTime,
        appliedRules: result.appliedRules || [],
        breakdown: result.breakdown || {},
        recommendation,
        timestamp: new Date(),
      };

      // Mettre à jour le scénario avec les résultats
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === scenario.id
            ? { ...s, lastRun: new Date(), lastResult: testResult }
            : s,
        ),
      );

      toast({
        title: testResult.success ? "✅ Test réussi" : "❌ Test échoué",
        description: `${scenario.name}: ${calculatedPrice}€ (attendu: ${expectedPrice}€)`,
        variant:
          testResult.success && recommendation === "accept"
            ? "default"
            : "destructive",
      });
    } catch (error) {
      console.error("Erreur test:", error);

      const testResult: TestResult = {
        success: false,
        calculatedPrice: 0,
        variance: 0,
        variancePercentage: 0,
        executionTime: Date.now() - startTime,
        appliedRules: [],
        breakdown: {},
        recommendation: "reject",
        timestamp: new Date(),
      };

      setScenarios((prev) =>
        prev.map((s) =>
          s.id === scenario.id
            ? { ...s, lastRun: new Date(), lastResult: testResult }
            : s,
        ),
      );

      toast({
        title: "❌ Erreur de test",
        description: `Échec du test ${scenario.name}`,
        variant: "destructive",
      });
    } finally {
      setRunningTests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(scenario.id);
        return newSet;
      });
    }
  };

  const runAllTests = async () => {
    for (const scenario of scenarios) {
      await runSingleTest(scenario);
      // Attendre un peu entre les tests pour éviter la surcharge
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const loadPredefinedScenarios = () => {
    setScenarios(predefinedScenarios);
    toast({
      title: "✅ Scénarios chargés",
      description: `${predefinedScenarios.length} scénarios prédéfinis ajoutés`,
      variant: "default",
    });
  };

  const createNewScenario = () => {
    if (!newScenario.name || !newScenario.serviceType) {
      toast({
        title: "❌ Données manquantes",
        description: "Nom et type de service requis",
        variant: "destructive",
      });
      return;
    }

    const scenario: TestScenario = {
      id: Date.now().toString(),
      name: newScenario.name!,
      description: newScenario.description || "",
      serviceType: newScenario.serviceType!,
      input: newScenario.input!,
      expectedPrice: newScenario.expectedPrice,
      tolerance: newScenario.tolerance || 5,
      tags: newScenario.tags || [],
      createdAt: new Date(),
    };

    setScenarios((prev) => [...prev, scenario]);

    // Reset du formulaire
    setNewScenario({
      name: "",
      description: "",
      serviceType: "MOVING",
      tolerance: 5,
      tags: [],
      input: {
        serviceType: "MOVING",
        volume: 20,
        distance: 15,
        constraints: [],
        services: [],
      },
    });

    toast({
      title: "✅ Scénario créé",
      description: `${scenario.name} ajouté à la suite de tests`,
      variant: "default",
    });
  };

  const getTestSummary = () => {
    const total = scenarios.length;
    const tested = scenarios.filter((s) => s.lastResult).length;
    const passed = scenarios.filter(
      (s) => s.lastResult?.success && s.lastResult?.recommendation === "accept",
    ).length;
    const failed = scenarios.filter(
      (s) =>
        s.lastResult?.success === false ||
        s.lastResult?.recommendation === "reject",
    ).length;

    return { total, tested, passed, failed };
  };

  const toggleScenarioExpansion = (scenarioId: string) => {
    setExpandedScenarios((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(scenarioId)) {
        newSet.delete(scenarioId);
      } else {
        newSet.add(scenarioId);
      }
      return newSet;
    });
  };

  // Mapping des anciens noms de variables vers des noms lisibles
  const variableToLabelMap: Record<string, string> = {
    // CONTRAINTES MOVING
    difficult_stairs: "Escaliers difficiles",
    narrow_corridors: "Couloirs étroits",
    limited_parking: "Stationnement limité",
    elevator_unsuitable_size: "Ascenseur trop petit",
    heavy_items: "Objets lourds",
    long_carrying_distance: "Distance de portage longue",
    access_restrictions: "Restrictions d'accès",
    fragile_floor: "Sol fragile",
    pedestrian_zone: "Zone piétonne",

    // SERVICES MOVING
    bulky_furniture: "Meubles volumineux",
    professional_packing_departure: "Emballage professionnel départ",
    professional_packing_arrival: "Emballage professionnel arrivée",
    furniture_disassembly: "Démontage de meubles",
    furniture_assembly: "Remontage de meubles",
    storage_service: "Service de stockage",
    cleaning_service: "Service de nettoyage",
    furniture_lift: "Monte-meuble",

    // CONTRAINTES CLEANING
    deep_cleaning: "Nettoyage en profondeur",
    high_ceilings: "Plafonds hauts",
    many_windows: "Nombreuses fenêtres",
    pet_hair: "Poils d'animaux",
    difficult_access: "Accès difficile",

    // SERVICES CLEANING
    window_cleaning: "Nettoyage des vitres",
    carpet_cleaning: "Nettoyage des tapis",
    disinfection: "Désinfection",
    ironing_service: "Service de repassage",
  };

  const getConstraintName = (constraintId: string, serviceType: string) => {
    const constraints =
      serviceType === "MOVING"
        ? movingConstraintsFallback
        : cleaningConstraintsFallback;

    // Essayer de trouver par ID d'abord
    const constraint = constraints.find((c) => c.id === constraintId);
    if (constraint) return constraint.name;

    // Sinon, vérifier si c'est une ancienne variable
    if (variableToLabelMap[constraintId]) {
      return variableToLabelMap[constraintId];
    }

    // En dernier recours, formater le nom de variable
    return constraintId
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getServiceName = (serviceId: string, serviceType: string) => {
    const services =
      serviceType === "MOVING"
        ? movingServicesFallback
        : cleaningServicesFallback;

    // Essayer de trouver par ID d'abord
    const service = services.find((s) => s.id === serviceId);
    if (service) return service.name;

    // Sinon, vérifier si c'est une ancienne variable
    if (variableToLabelMap[serviceId]) {
      return variableToLabelMap[serviceId];
    }

    // En dernier recours, formater le nom de variable
    return serviceId
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getConstraintData = (constraintId: string, serviceType: string) => {
    const constraints =
      serviceType === "MOVING"
        ? movingConstraintsFallback
        : cleaningConstraintsFallback;
    return constraints.find((c) => c.id === constraintId);
  };

  const getServiceData = (serviceId: string, serviceType: string) => {
    const services =
      serviceType === "MOVING"
        ? movingServicesFallback
        : cleaningServicesFallback;
    return services.find((s) => s.id === serviceId);
  };

  const summary = getTestSummary();

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-purple-50 min-h-screen">
      {/* Header avec statistiques */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BeakerIcon className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">
                Framework de Tests Unifié
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              Testez vos règles de pricing en temps réel avec des scénarios
              personnalisés
            </p>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="text-center bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {summary.total}
              </div>
              <div className="text-xs text-blue-700 font-medium">Total</div>
            </div>
            <div className="text-center bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {summary.passed}
              </div>
              <div className="text-xs text-green-700 font-medium">Réussis</div>
            </div>
            <div className="text-center bg-red-50 rounded-lg p-3 border border-red-200">
              <div className="text-2xl font-bold text-red-600">
                {summary.failed}
              </div>
              <div className="text-xs text-red-700 font-medium">Échoués</div>
            </div>
            <div className="text-center bg-orange-50 rounded-lg p-3 border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">
                {scenarios.length - summary.tested}
              </div>
              <div className="text-xs text-orange-700 font-medium">
                À tester
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="create">Créer un Test</TabsTrigger>
          <TabsTrigger value="scenarios">
            Scénarios ({scenarios.length})
          </TabsTrigger>
          <TabsTrigger value="results">Résultats</TabsTrigger>
        </TabsList>

        {/* Création de scénarios */}
        <TabsContent value="create" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Button onClick={loadPredefinedScenarios} variant="outline">
              <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
              Charger scénarios prédéfinis
            </Button>
          </div>

          <Card className="border-purple-200 shadow-sm bg-white">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-md">
                  <BeakerIcon className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-slate-800">Nouveau Scénario de Test</span>
              </CardTitle>
              <CardDescription className="text-slate-600">
                Créez un scénario pour tester vos règles de pricing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-slate-700"
                  >
                    Nom du scénario
                  </Label>
                  <Input
                    id="name"
                    value={newScenario.name || ""}
                    onChange={(e) =>
                      setNewScenario((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Ex: Déménagement T3 avec contraintes"
                    className="bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="serviceType"
                    className="text-sm font-medium text-slate-700"
                  >
                    Type de service
                  </Label>
                  <Select
                    value={newScenario.serviceType}
                    onValueChange={(value) => {
                      setNewScenario((prev) => {
                        // Initialiser les bons champs selon le type
                        const newInput: any = {
                          serviceType: value,
                          distance: prev.input?.distance || 15,
                          constraints: [],
                          services: [],
                        };

                        if (value === "MOVING") {
                          // MOVING = volume uniquement
                          newInput.volume = 20;
                        } else {
                          // PACKING, CLEANING, DELIVERY = workers + duration + defaultPrice
                          newInput.workers = 2;
                          newInput.duration = 7;
                          newInput.defaultPrice = 490; // 2 workers × 7h × 35€
                        }

                        return {
                          ...prev,
                          serviceType: value,
                          input: newInput,
                        };
                      });
                    }}
                  >
                    <SelectTrigger className="bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MOVING">
                        Déménagement Sur Mesure
                      </SelectItem>
                      <SelectItem value="PACKING">Pack Déménagement</SelectItem>
                      <SelectItem value="CLEANING">Nettoyage</SelectItem>
                      <SelectItem value="DELIVERY">Livraison</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-slate-700"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newScenario.description || ""}
                  onChange={(e) =>
                    setNewScenario((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Décrivez le scénario de test..."
                  className="bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500 min-h-[80px]"
                />
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h5 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <div className="h-1 w-1 bg-purple-500 rounded-full"></div>
                  Paramètres du Test
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Prix de base (requis pour CLEANING, PACKING, DELIVERY) */}
                  {["CLEANING", "PACKING", "DELIVERY"].includes(
                    newScenario.serviceType || "",
                  ) && (
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="defaultPrice"
                        className="text-sm font-medium text-slate-700 flex items-center gap-1"
                      >
                        Prix de base (€) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="defaultPrice"
                        type="number"
                        value={newScenario.input?.defaultPrice || ""}
                        onChange={(e) =>
                          setNewScenario((prev) => ({
                            ...prev,
                            input: {
                              ...prev.input!,
                              defaultPrice: parseFloat(e.target.value) || 0,
                            },
                          }))
                        }
                        className="bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                        placeholder="Ex: 120"
                        required
                      />
                    </div>
                  )}

                  {/* Volume - seulement pour MOVING (sur mesure) */}
                  {newScenario.serviceType === "MOVING" && (
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="volume"
                        className="text-sm font-medium text-slate-700 flex items-center gap-1"
                      >
                        Volume (m³) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="volume"
                        type="number"
                        value={newScenario.input?.volume || ""}
                        onChange={(e) =>
                          setNewScenario((prev) => ({
                            ...prev,
                            input: {
                              ...prev.input!,
                              volume: parseFloat(e.target.value) || 0,
                            },
                          }))
                        }
                        className="bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                        placeholder="Ex: 30"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="distance"
                      className="text-sm font-medium text-slate-700"
                    >
                      Distance (km)
                    </Label>
                    <Input
                      id="distance"
                      type="number"
                      value={newScenario.input?.distance || ""}
                      onChange={(e) =>
                        setNewScenario((prev) => ({
                          ...prev,
                          input: {
                            ...prev.input!,
                            distance: parseFloat(e.target.value) || 0,
                          },
                        }))
                      }
                      className="bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="Ex: 25"
                    />
                  </div>

                  {/* Workers et Duration - seulement pour PACKING, CLEANING, DELIVERY */}
                  {["PACKING", "CLEANING", "DELIVERY"].includes(
                    newScenario.serviceType || "",
                  ) && (
                    <>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="workers"
                          className="text-sm font-medium text-slate-700 flex items-center gap-1"
                        >
                          Ouvriers <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="workers"
                          type="number"
                          value={newScenario.input?.workers || ""}
                          onChange={(e) =>
                            setNewScenario((prev) => ({
                              ...prev,
                              input: {
                                ...prev.input!,
                                workers: parseInt(e.target.value) || 1,
                              },
                            }))
                          }
                          className="bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                          placeholder="Ex: 2"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="duration"
                          className="text-sm font-medium text-slate-700 flex items-center gap-1"
                        >
                          Durée (heures) <span className="text-red-500">*</span>{" "}
                          <span className="text-xs text-slate-500">
                            (7h par défaut)
                          </span>
                        </Label>
                        <Input
                          id="duration"
                          type="number"
                          step="0.5"
                          value={newScenario.input?.duration || ""}
                          onChange={(e) =>
                            setNewScenario((prev) => ({
                              ...prev,
                              input: {
                                ...prev.input!,
                                duration: parseFloat(e.target.value) || 7,
                              },
                            }))
                          }
                          className="bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                          placeholder="Ex: 7"
                          required
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="expectedPrice"
                      className="text-sm font-medium text-slate-700"
                    >
                      Prix attendu (€)
                    </Label>
                    <Input
                      id="expectedPrice"
                      type="number"
                      value={newScenario.expectedPrice || ""}
                      onChange={(e) =>
                        setNewScenario((prev) => ({
                          ...prev,
                          expectedPrice:
                            parseFloat(e.target.value) || undefined,
                        }))
                      }
                      className="bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="Ex: 1200"
                    />
                  </div>
                </div>

                {/* Section Logistique Départ/Arrivée */}
                {newScenario.serviceType === "MOVING" && (
                  <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <div className="h-1 w-1 bg-blue-500 rounded-full"></div>
                      Logistique Départ / Arrivée
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Départ */}
                      <div className="space-y-3">
                        <h6 className="text-sm font-semibold text-blue-700 border-b border-blue-200 pb-1">
                          📍 Point de Départ
                        </h6>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="pickupFloor"
                              className="text-sm font-medium text-slate-700"
                            >
                              Étage départ
                            </Label>
                            <Input
                              id="pickupFloor"
                              type="number"
                              value={newScenario.input?.pickupFloor ?? ""}
                              onChange={(e) =>
                                setNewScenario((prev) => ({
                                  ...prev,
                                  input: {
                                    ...prev.input!,
                                    pickupFloor: parseInt(e.target.value) || 0,
                                  },
                                }))
                              }
                              className="bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Ex: 3"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="pickupElevator"
                              className="text-sm font-medium text-slate-700"
                            >
                              Ascenseur départ
                            </Label>
                            <Select
                              value={
                                newScenario.input?.pickupElevator?.toString() ||
                                "false"
                              }
                              onValueChange={(value) =>
                                setNewScenario((prev) => ({
                                  ...prev,
                                  input: {
                                    ...prev.input!,
                                    pickupElevator: value === "true",
                                  },
                                }))
                              }
                            >
                              <SelectTrigger className="bg-white border-slate-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="false">Non</SelectItem>
                                <SelectItem value="true">Oui</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="pickupCarryDistance"
                              className="text-sm font-medium text-slate-700"
                            >
                              Distance de portage (m)
                            </Label>
                            <Input
                              id="pickupCarryDistance"
                              type="number"
                              value={
                                newScenario.input?.pickupCarryDistance ?? ""
                              }
                              onChange={(e) =>
                                setNewScenario((prev) => ({
                                  ...prev,
                                  input: {
                                    ...prev.input!,
                                    pickupCarryDistance:
                                      parseInt(e.target.value) || 0,
                                  },
                                }))
                              }
                              className="bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Ex: 20"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Arrivée */}
                      <div className="space-y-3">
                        <h6 className="text-sm font-semibold text-blue-700 border-b border-blue-200 pb-1">
                          🎯 Point d'Arrivée
                        </h6>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="deliveryFloor"
                              className="text-sm font-medium text-slate-700"
                            >
                              Étage arrivée
                            </Label>
                            <Input
                              id="deliveryFloor"
                              type="number"
                              value={newScenario.input?.deliveryFloor ?? ""}
                              onChange={(e) =>
                                setNewScenario((prev) => ({
                                  ...prev,
                                  input: {
                                    ...prev.input!,
                                    deliveryFloor:
                                      parseInt(e.target.value) || 0,
                                  },
                                }))
                              }
                              className="bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Ex: 2"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="deliveryElevator"
                              className="text-sm font-medium text-slate-700"
                            >
                              Ascenseur arrivée
                            </Label>
                            <Select
                              value={
                                newScenario.input?.deliveryElevator?.toString() ||
                                "false"
                              }
                              onValueChange={(value) =>
                                setNewScenario((prev) => ({
                                  ...prev,
                                  input: {
                                    ...prev.input!,
                                    deliveryElevator: value === "true",
                                  },
                                }))
                              }
                            >
                              <SelectTrigger className="bg-white border-slate-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="false">Non</SelectItem>
                                <SelectItem value="true">Oui</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="deliveryCarryDistance"
                              className="text-sm font-medium text-slate-700"
                            >
                              Distance de portage (m)
                            </Label>
                            <Input
                              id="deliveryCarryDistance"
                              type="number"
                              value={
                                newScenario.input?.deliveryCarryDistance ?? ""
                              }
                              onChange={(e) =>
                                setNewScenario((prev) => ({
                                  ...prev,
                                  input: {
                                    ...prev.input!,
                                    deliveryCarryDistance:
                                      parseInt(e.target.value) || 0,
                                  },
                                }))
                              }
                              className="bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Ex: 15"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section Promotion */}
                <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <h5 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <div className="h-1 w-1 bg-green-500 rounded-full"></div>
                    Promotion (optionnelle)
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="isPromotionActive"
                        className="text-sm font-medium text-slate-700"
                      >
                        Active
                      </Label>
                      <Select
                        value={
                          newScenario.input?.isPromotionActive
                            ? "true"
                            : "false"
                        }
                        onValueChange={(value) =>
                          setNewScenario((prev) => ({
                            ...prev,
                            input: {
                              ...prev.input!,
                              isPromotionActive: value === "true",
                            },
                          }))
                        }
                      >
                        <SelectTrigger className="bg-white border-slate-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">Non</SelectItem>
                          <SelectItem value="true">Oui</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="promotionCode"
                        className="text-sm font-medium text-slate-700"
                      >
                        Code promo
                      </Label>
                      <Input
                        id="promotionCode"
                        type="text"
                        value={newScenario.input?.promotionCode || ""}
                        onChange={(e) =>
                          setNewScenario((prev) => ({
                            ...prev,
                            input: {
                              ...prev.input!,
                              promotionCode: e.target.value,
                            },
                          }))
                        }
                        className="bg-white border-slate-300 focus:border-green-500 focus:ring-green-500"
                        placeholder="Ex: PROMO10"
                        disabled={!newScenario.input?.isPromotionActive}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="promotionType"
                        className="text-sm font-medium text-slate-700"
                      >
                        Type
                      </Label>
                      <Select
                        value={newScenario.input?.promotionType || "PERCENT"}
                        onValueChange={(value) =>
                          setNewScenario((prev) => ({
                            ...prev,
                            input: { ...prev.input!, promotionType: value },
                          }))
                        }
                        disabled={!newScenario.input?.isPromotionActive}
                      >
                        <SelectTrigger className="bg-white border-slate-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENT">
                            Pourcentage (%)
                          </SelectItem>
                          <SelectItem value="FIXED">
                            Montant fixe (€)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="promotionValue"
                        className="text-sm font-medium text-slate-700"
                      >
                        Valeur{" "}
                        {newScenario.input?.promotionType === "PERCENT"
                          ? "(%)"
                          : "(€)"}
                      </Label>
                      <Input
                        id="promotionValue"
                        type="number"
                        step="0.1"
                        value={newScenario.input?.promotionValue || ""}
                        onChange={(e) =>
                          setNewScenario((prev) => ({
                            ...prev,
                            input: {
                              ...prev.input!,
                              promotionValue: parseFloat(e.target.value) || 0,
                            },
                          }))
                        }
                        className="bg-white border-slate-300 focus:border-green-500 focus:ring-green-500"
                        placeholder={
                          newScenario.input?.promotionType === "PERCENT"
                            ? "Ex: 10"
                            : "Ex: 50"
                        }
                        disabled={!newScenario.input?.isPromotionActive}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Contraintes */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-orange-800 flex items-center gap-2">
                    <div className="h-1 w-1 bg-orange-500 rounded-full"></div>
                    Contraintes
                  </h5>
                  <Badge
                    variant="outline"
                    className="bg-white border-orange-300 text-orange-700"
                  >
                    {newScenario.input?.constraints?.length || 0} sélectionnées
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto bg-white rounded-lg p-3 border border-orange-200">
                  {(newScenario.serviceType === "MOVING"
                    ? movingConstraintsFallback
                    : cleaningConstraintsFallback
                  ).map((constraint) => (
                    <label
                      key={constraint.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-orange-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={
                          newScenario.input?.constraints?.includes(
                            constraint.id,
                          ) || false
                        }
                        onChange={(e) => {
                          const constraints =
                            newScenario.input?.constraints || [];
                          const newConstraints = e.target.checked
                            ? [...constraints, constraint.id]
                            : constraints.filter((id) => id !== constraint.id);
                          setNewScenario((prev) => ({
                            ...prev,
                            input: {
                              ...prev.input!,
                              constraints: newConstraints,
                            },
                          }));
                        }}
                        className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-slate-700 flex items-center gap-1">
                        <span>{constraint.icon}</span>
                        <span>{constraint.name}</span>
                        {constraint.value && (
                          <span className="text-xs text-orange-600 font-medium">
                            +{constraint.value}€
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section Services */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-blue-800 flex items-center gap-2">
                    <div className="h-1 w-1 bg-blue-500 rounded-full"></div>
                    Services Additionnels
                  </h5>
                  <Badge
                    variant="outline"
                    className="bg-white border-blue-300 text-blue-700"
                  >
                    {newScenario.input?.services?.length || 0} sélectionnés
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto bg-white rounded-lg p-3 border border-blue-200">
                  {(newScenario.serviceType === "MOVING"
                    ? movingServicesFallback
                    : cleaningServicesFallback
                  ).map((service) => (
                    <label
                      key={service.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={
                          newScenario.input?.services?.includes(service.id) ||
                          false
                        }
                        onChange={(e) => {
                          const services = newScenario.input?.services || [];
                          const newServices = e.target.checked
                            ? [...services, service.id]
                            : services.filter((id) => id !== service.id);
                          setNewScenario((prev) => ({
                            ...prev,
                            input: { ...prev.input!, services: newServices },
                          }));
                        }}
                        className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700 flex items-center gap-1">
                        <span>{service.icon}</span>
                        <span>{service.name}</span>
                        {service.value && (
                          <span className="text-xs text-blue-600 font-medium">
                            +{service.value}€
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                onClick={createNewScenario}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <BeakerIcon className="h-4 w-4 mr-2" />
                Créer le scénario
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Liste des scénarios */}
        <TabsContent value="scenarios" className="space-y-4">
          <div className="flex justify-between items-center bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
            <span className="text-sm font-medium text-slate-700">
              {scenarios.length} scénarios disponibles
            </span>
            <Button
              onClick={runAllTests}
              disabled={scenarios.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <PlayIcon className="h-4 w-4 mr-2" />
              Exécuter tous les tests
            </Button>
          </div>

          <div className="grid gap-4">
            {scenarios.map((scenario) => {
              const isRunning = runningTests.has(scenario.id);
              const result = scenario.lastResult;
              const isExpanded = expandedScenarios.has(scenario.id);

              return (
                <Card
                  key={scenario.id}
                  className="border-slate-200 shadow-sm bg-white transition-all duration-200 hover:shadow-md"
                >
                  <CardContent className="p-5">
                    <div className="space-y-4">
                      {/* Header avec titre et actions */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-slate-800">
                              {scenario.name}
                            </h4>
                            <Badge
                              variant="outline"
                              className="border-purple-300 text-purple-700 bg-purple-50"
                            >
                              {scenario.serviceType}
                            </Badge>
                            {result && (
                              <Badge
                                className={`font-semibold ${
                                  result.success &&
                                  result.recommendation === "accept"
                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                    : result.recommendation === "review"
                                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                                      : "bg-red-500 hover:bg-red-600 text-white"
                                }`}
                              >
                                {result.recommendation === "accept"
                                  ? "✅ Validé"
                                  : result.recommendation === "review"
                                    ? "⚠️ À réviser"
                                    : "❌ Rejeté"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-3">
                            {scenario.description}
                          </p>

                          {/* Résumé compact des contraintes et services */}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {scenario.input.constraints &&
                              scenario.input.constraints.length > 0 && (
                                <Badge
                                  variant="outline"
                                  className="bg-orange-50 border-orange-300 text-orange-700 text-xs"
                                >
                                  🚧 {scenario.input.constraints.length}{" "}
                                  contraintes
                                </Badge>
                              )}
                            {scenario.input.services &&
                              scenario.input.services.length > 0 && (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 border-blue-300 text-blue-700 text-xs"
                                >
                                  ⚙️ {scenario.input.services.length} services
                                </Badge>
                              )}
                            {scenario.expectedPrice && (
                              <Badge
                                variant="outline"
                                className="bg-slate-50 border-slate-300 text-slate-700 text-xs"
                              >
                                💰 Attendu: {scenario.expectedPrice}€
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => runSingleTest(scenario)}
                            disabled={isRunning}
                            variant="outline"
                            className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-colors"
                          >
                            {isRunning ? (
                              <>
                                <div className="h-4 w-4 mr-2 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                Test...
                              </>
                            ) : (
                              <>
                                <PlayIcon className="h-4 w-4 mr-1.5" />
                                Tester
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => toggleScenarioExpansion(scenario.id)}
                            variant="ghost"
                            className="text-slate-600 hover:bg-slate-100"
                          >
                            {isExpanded ? (
                              <ChevronUpIcon className="h-5 w-5" />
                            ) : (
                              <ChevronDownIcon className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Résultats compacts */}
                      {result && (
                        <div className="flex items-center gap-6 text-sm bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-600">Prix:</span>
                            <strong className="text-blue-700">
                              {result.calculatedPrice}€
                            </strong>
                          </div>
                          {result.expectedPrice && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-600">Attendu:</span>
                              <strong className="text-purple-700">
                                {result.expectedPrice}€
                              </strong>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-600">Écart:</span>
                            <strong
                              className={`${
                                !scenario.expectedPrice
                                  ? "text-slate-500"
                                  : result.variancePercentage <=
                                      scenario.tolerance
                                    ? "text-green-600"
                                    : "text-red-600"
                              }`}
                            >
                              {!scenario.expectedPrice ||
                              isNaN(result.variancePercentage)
                                ? "N/A"
                                : `${result.variancePercentage.toFixed(1)}%`}
                            </strong>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <ClockIcon className="h-3.5 w-3.5" />
                            <span>{result.executionTime}ms</span>
                          </div>
                        </div>
                      )}

                      {/* Détails expandables */}
                      {isExpanded && (
                        <div className="space-y-4 pt-4 border-t border-slate-200">
                          {/* Paramètres de test */}
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <h5 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                              <div className="h-1 w-1 bg-purple-500 rounded-full"></div>
                              Paramètres du Test
                            </h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              {scenario.input.volume !== undefined && (
                                <div>
                                  <span className="text-slate-600">
                                    Volume:
                                  </span>
                                  <strong className="ml-2 text-slate-800">
                                    {scenario.input.volume} m³
                                  </strong>
                                </div>
                              )}
                              {scenario.input.distance !== undefined && (
                                <div>
                                  <span className="text-slate-600">
                                    Distance:
                                  </span>
                                  <strong className="ml-2 text-slate-800">
                                    {scenario.input.distance} km
                                  </strong>
                                </div>
                              )}
                              {scenario.input.workers !== undefined && (
                                <div>
                                  <span className="text-slate-600">
                                    Ouvriers:
                                  </span>
                                  <strong className="ml-2 text-slate-800">
                                    {scenario.input.workers}
                                  </strong>
                                </div>
                              )}
                              {scenario.input.duration !== undefined && (
                                <div>
                                  <span className="text-slate-600">Durée:</span>
                                  <strong className="ml-2 text-slate-800">
                                    {scenario.input.duration}h
                                  </strong>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Contraintes détaillées */}
                          {scenario.input.constraints &&
                            scenario.input.constraints.length > 0 && (
                              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                                <h5 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                                  <div className="h-1 w-1 bg-orange-500 rounded-full"></div>
                                  Contraintes Sélectionnées (
                                  {scenario.input.constraints.length})
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {scenario.input.constraints.map(
                                    (constraintId) => {
                                      const constraint = getConstraintData(
                                        constraintId,
                                        scenario.serviceType,
                                      );
                                      const name = getConstraintName(
                                        constraintId,
                                        scenario.serviceType,
                                      );
                                      return (
                                        <Badge
                                          key={constraintId}
                                          variant="outline"
                                          className="bg-white border-orange-300 text-orange-800 text-xs"
                                        >
                                          {constraint?.icon && (
                                            <span className="mr-1">
                                              {constraint.icon}
                                            </span>
                                          )}
                                          {name}
                                          {constraint?.value && (
                                            <span className="ml-1 font-bold">
                                              +{constraint.value}€
                                            </span>
                                          )}
                                        </Badge>
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Services détaillés */}
                          {scenario.input.services &&
                            scenario.input.services.length > 0 && (
                              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                <h5 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                  <div className="h-1 w-1 bg-blue-500 rounded-full"></div>
                                  Services Sélectionnés (
                                  {scenario.input.services.length})
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {scenario.input.services.map((serviceId) => {
                                    const service = getServiceData(
                                      serviceId,
                                      scenario.serviceType,
                                    );
                                    const name = getServiceName(
                                      serviceId,
                                      scenario.serviceType,
                                    );
                                    return (
                                      <Badge
                                        key={serviceId}
                                        variant="outline"
                                        className="bg-white border-blue-300 text-blue-800 text-xs"
                                      >
                                        {service?.icon && (
                                          <span className="mr-1">
                                            {service.icon}
                                          </span>
                                        )}
                                        {name}
                                        {service?.value && (
                                          <span className="ml-1 font-bold">
                                            +{service.value}€
                                          </span>
                                        )}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Résultats détaillés */}
        <TabsContent value="results">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50 border-b border-slate-200">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-md">
                  <ChartBarIcon className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-slate-800">Analyse des Résultats</span>
              </CardTitle>
              <CardDescription className="text-slate-600">
                Détails des performances et recommandations
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {scenarios.filter((s) => s.lastResult).length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <ChartBarIcon className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">Aucun test exécuté</p>
                    <p className="text-sm">
                      Lancez des tests pour voir les résultats ici
                    </p>
                  </div>
                ) : (
                  scenarios
                    .filter((s) => s.lastResult)
                    .map((scenario) => (
                      <div
                        key={scenario.id}
                        className="border border-slate-200 rounded-lg p-5 bg-gradient-to-br from-white to-slate-50 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-slate-800">
                            {scenario.name}
                          </h4>
                          <Badge
                            className={`font-semibold ${
                              scenario.lastResult?.recommendation === "accept"
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : scenario.lastResult?.recommendation ===
                                    "review"
                                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                                  : "bg-red-500 hover:bg-red-600 text-white"
                            }`}
                          >
                            {scenario.lastResult?.recommendation === "accept"
                              ? "✅ Accepté"
                              : scenario.lastResult?.recommendation === "review"
                                ? "⚠️ À réviser"
                                : "❌ Rejeté"}
                          </Badge>
                        </div>

                        {scenario.lastResult && (
                          <div className="space-y-4">
                            {/* Métriques principales */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <span className="text-xs text-blue-700 font-medium block mb-1">
                                  Prix calculé
                                </span>
                                <div className="text-lg font-bold text-blue-900">
                                  {scenario.lastResult.calculatedPrice}€
                                </div>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                <span className="text-xs text-purple-700 font-medium block mb-1">
                                  Prix attendu
                                </span>
                                <div className="text-lg font-bold text-purple-900">
                                  {scenario.expectedPrice || 0}€
                                </div>
                              </div>
                              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                                <span className="text-xs text-orange-700 font-medium block mb-1">
                                  Écart
                                </span>
                                <div
                                  className={`text-lg font-bold ${
                                    !scenario.expectedPrice
                                      ? "text-slate-500"
                                      : scenario.lastResult
                                            .variancePercentage <=
                                          scenario.tolerance
                                        ? "text-green-700"
                                        : "text-red-700"
                                  }`}
                                >
                                  {!scenario.expectedPrice ||
                                  isNaN(scenario.lastResult.variancePercentage)
                                    ? "N/A"
                                    : `${scenario.lastResult.variancePercentage.toFixed(1)}%`}
                                </div>
                              </div>
                              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                <span className="text-xs text-slate-700 font-medium block mb-1">
                                  Temps d'exécution
                                </span>
                                <div className="text-lg font-bold text-slate-900">
                                  {scenario.lastResult.executionTime}ms
                                </div>
                              </div>
                            </div>

                            {/* Paramètres du test */}
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                              <h5 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <div className="h-1 w-1 bg-purple-500 rounded-full"></div>
                                Paramètres Testés
                              </h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                {scenario.input.volume !== undefined && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-600">
                                      Volume:
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {scenario.input.volume} m³
                                    </Badge>
                                  </div>
                                )}
                                {scenario.input.distance !== undefined && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-600">
                                      Distance:
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {scenario.input.distance} km
                                    </Badge>
                                  </div>
                                )}
                                {scenario.input.workers !== undefined && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-600">
                                      Ouvriers:
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {scenario.input.workers}
                                    </Badge>
                                  </div>
                                )}
                                {scenario.input.duration !== undefined && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-600">
                                      Durée:
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {scenario.input.duration}h
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Contraintes et services testés */}
                            {(scenario.input.constraints?.length > 0 ||
                              scenario.input.services?.length > 0) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Contraintes */}
                                {scenario.input.constraints &&
                                  scenario.input.constraints.length > 0 && (
                                    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                                      <h5 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                                        <div className="h-1 w-1 bg-orange-500 rounded-full"></div>
                                        Contraintes Testées (
                                        {scenario.input.constraints.length})
                                      </h5>
                                      <div className="flex flex-wrap gap-2">
                                        {scenario.input.constraints
                                          .slice(0, 6)
                                          .map((constraintId) => {
                                            const constraint =
                                              getConstraintData(
                                                constraintId,
                                                scenario.serviceType,
                                              );
                                            const name = getConstraintName(
                                              constraintId,
                                              scenario.serviceType,
                                            );
                                            return (
                                              <Badge
                                                key={constraintId}
                                                variant="outline"
                                                className="bg-white border-orange-300 text-orange-800 text-xs"
                                              >
                                                {constraint?.icon} {name}
                                              </Badge>
                                            );
                                          })}
                                        {scenario.input.constraints &&
                                          scenario.input.constraints.length >
                                            6 && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs bg-white border-orange-300 text-orange-700"
                                            >
                                              +
                                              {scenario.input.constraints
                                                .length - 6}{" "}
                                              autres
                                            </Badge>
                                          )}
                                      </div>
                                    </div>
                                  )}

                                {/* Services */}
                                {scenario.input.services &&
                                  scenario.input.services.length > 0 && (
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                      <h5 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                        <div className="h-1 w-1 bg-blue-500 rounded-full"></div>
                                        Services Testés (
                                        {scenario.input.services.length})
                                      </h5>
                                      <div className="flex flex-wrap gap-2">
                                        {scenario.input.services
                                          .slice(0, 6)
                                          .map((serviceId) => {
                                            const service = getServiceData(
                                              serviceId,
                                              scenario.serviceType,
                                            );
                                            const name = getServiceName(
                                              serviceId,
                                              scenario.serviceType,
                                            );
                                            return (
                                              <Badge
                                                key={serviceId}
                                                variant="outline"
                                                className="bg-white border-blue-300 text-blue-800 text-xs"
                                              >
                                                {service?.icon} {name}
                                              </Badge>
                                            );
                                          })}
                                        {scenario.input.services.length > 6 && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-white border-blue-300 text-blue-700"
                                          >
                                            +
                                            {scenario.input.services.length - 6}{" "}
                                            autres
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            )}

                            {/* Règles appliquées par l'API (si disponibles) */}
                            {scenario.lastResult.appliedRules &&
                              scenario.lastResult.appliedRules.length > 0 && (
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                                  <h5 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                                    <div className="h-1 w-1 bg-green-500 rounded-full"></div>
                                    Règles Appliquées par l'API (
                                    {scenario.lastResult.appliedRules.length})
                                  </h5>
                                  <div className="flex flex-wrap gap-2">
                                    {scenario.lastResult.appliedRules.map(
                                      (rule, index) => (
                                        <Badge
                                          key={index}
                                          variant="outline"
                                          className={`text-xs font-medium ${
                                            rule.impact > 0
                                              ? "border-green-400 bg-white text-green-800"
                                              : rule.impact < 0
                                                ? "border-red-400 bg-white text-red-800"
                                                : "border-slate-300 bg-white text-slate-700"
                                          }`}
                                        >
                                          {rule.name}:{" "}
                                          {rule.impact > 0 ? "+" : ""}
                                          {rule.impact}€
                                        </Badge>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Analyse */}
                            <div
                              className={`rounded-lg p-4 border ${
                                !scenario.expectedPrice
                                  ? "bg-blue-50 border-blue-300"
                                  : scenario.lastResult.recommendation ===
                                      "accept"
                                    ? "bg-green-50 border-green-300"
                                    : scenario.lastResult.recommendation ===
                                        "review"
                                      ? "bg-orange-50 border-orange-300"
                                      : "bg-red-50 border-red-300"
                              }`}
                            >
                              <h5
                                className={`font-semibold mb-2 ${
                                  !scenario.expectedPrice
                                    ? "text-blue-800"
                                    : scenario.lastResult.recommendation ===
                                        "accept"
                                      ? "text-green-800"
                                      : scenario.lastResult.recommendation ===
                                          "review"
                                        ? "text-orange-800"
                                        : "text-red-800"
                                }`}
                              >
                                {!scenario.expectedPrice &&
                                  "ℹ️ Test sans prix de référence"}
                                {scenario.expectedPrice &&
                                  scenario.lastResult.recommendation ===
                                    "accept" &&
                                  "✅ Test Validé"}
                                {scenario.expectedPrice &&
                                  scenario.lastResult.recommendation ===
                                    "review" &&
                                  "⚠️ Test à Réviser"}
                                {scenario.expectedPrice &&
                                  scenario.lastResult.recommendation ===
                                    "reject" &&
                                  "❌ Test Rejeté"}
                              </h5>
                              <p className="text-sm text-slate-700">
                                {!scenario.expectedPrice &&
                                  `Le test a été exécuté avec succès. Prix calculé: ${scenario.lastResult.calculatedPrice}€. Définissez un prix attendu pour activer la validation automatique.`}
                                {scenario.expectedPrice &&
                                  scenario.lastResult.recommendation ===
                                    "accept" &&
                                  `L'écart de ${scenario.lastResult.variancePercentage.toFixed(1)}% est acceptable (tolérance: ${scenario.tolerance}%).`}
                                {scenario.expectedPrice &&
                                  scenario.lastResult.recommendation ===
                                    "review" &&
                                  `L'écart de ${scenario.lastResult.variancePercentage.toFixed(1)}% dépasse la tolérance de ${scenario.tolerance}%. Vérifier les règles métier.`}
                                {scenario.expectedPrice &&
                                  scenario.lastResult.recommendation ===
                                    "reject" &&
                                  `L'écart de ${scenario.lastResult.variancePercentage.toFixed(1)}% est trop important (tolérance: ${scenario.tolerance}%). Corriger les règles ou le prix attendu.`}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
