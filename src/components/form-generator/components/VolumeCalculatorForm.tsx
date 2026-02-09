"use client";

import React, { useCallback, useState } from "react";
import { estimateVolumeAction } from "@/actions/volume/actions";
import type {
  EstimateInput,
  FurnishingLevel,
} from "@/actions/volume/estimateVolumeV3";

export interface VolumeCalculatorFormState {
  surface: string;
  logement_type: "appartement" | "maison" | "studio";
  salon: "leger" | "standard" | "charge" | "tres_charge";
  chambre1: "vide" | "standard" | "chargee";
  chambre2: "aucune" | "vide" | "standard" | "chargee";
  chambre3: "aucune" | "vide" | "standard" | "chargee";
  chambre4: "aucune" | "vide" | "standard" | "chargee";
  electromenager: string[];
  annexes: string[];
  objets: string[];
}

const defaultState: VolumeCalculatorFormState = {
  surface: "",
  logement_type: "appartement",
  salon: "leger",
  chambre1: "standard",
  chambre2: "aucune",
  chambre3: "aucune",
  chambre4: "aucune",
  electromenager: [],
  annexes: [],
  objets: [],
};

function mapSalonToLevel(
  salon: VolumeCalculatorFormState["salon"],
): FurnishingLevel {
  switch (salon) {
    case "leger":
      return "LIGHT";
    case "standard":
      return "STANDARD";
    case "charge":
    case "tres_charge":
      return "FULL";
    default:
      return "STANDARD";
  }
}

function mapChambreToLevel(
  chambre: "vide" | "standard" | "chargee",
): FurnishingLevel {
  switch (chambre) {
    case "vide":
      return "LIGHT";
    case "standard":
      return "STANDARD";
    case "chargee":
      return "FULL";
    default:
      return "STANDARD";
  }
}

/** Convertit l'état du formulaire en entrée pour l'action serveur (calcul V3). */
function formStateToEstimateInput(
  state: VolumeCalculatorFormState,
): EstimateInput {
  const surface = Math.round(parseFloat(state.surface) || 0);
  const bedrooms: { level: FurnishingLevel }[] = [];
  const chambres = [
    state.chambre1,
    state.chambre2,
    state.chambre3,
    state.chambre4,
  ] as const;
  for (const c of chambres) {
    if (c !== "aucune") {
      bedrooms.push({ level: mapChambreToLevel(c) });
    }
  }

  const em = state.electromenager;
  const fridge = em.includes("frigo_us")
    ? "AMERICAN"
    : em.includes("frigo_simple")
      ? "SIMPLE"
      : "NONE";

  const piano = state.objets.includes("piano_queue")
    ? "GRAND"
    : state.objets.includes("piano_droit")
      ? "UPRIGHT"
      : "NONE";

  return {
    surface,
    livingRoomLevel: mapSalonToLevel(state.salon),
    bedrooms,
    hasEquippedKitchen: true,
    appliances: {
      fridge: fridge !== "NONE" ? fridge : undefined,
      washingMachine: em.includes("machine"),
      dishwasher: em.includes("lavevaisselle"),
      dryer: em.includes("sechelinge"),
      oven: em.includes("four"),
      freezer: em.includes("congelateur"),
    },
    specialItems: {
      piano: piano !== "NONE" ? piano : undefined,
      safe: false,
      largeSofa:
        state.objets.includes("angle") || state.objets.includes("canape3"),
      bulkyFurniture:
        state.objets.includes("dressing") || state.objets.includes("billard"),
    },
    storage: {
      cellar: state.annexes.includes("cave"),
      garage: state.annexes.includes("garage"),
      attic: state.annexes.includes("grenier"),
      shed: state.annexes.includes("abri"),
      balcony: state.annexes.includes("balcon"),
      veranda: state.annexes.includes("veranda"),
    },
    density: "STANDARD",
  };
}

const SECTION_CLASS =
  "mb-6 p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors";
const SECTION_TITLE_CLASS =
  "font-semibold text-base text-gray-800 mb-4 flex items-center gap-2";
const LABEL_CLASS = "block font-medium text-gray-700 text-sm mb-2";
const INPUT_CLASS =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]";
const SELECT_CLASS =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]";
const RADIO_GRID = "grid grid-cols-2 gap-2";
const RADIO_OPTION =
  "flex items-center justify-center py-2.5 px-3 rounded-lg border-2 border-gray-200 cursor-pointer transition-all text-sm font-medium text-center";
const RADIO_OPTION_CHECKED =
  "border-[var(--color-primary)] bg-[var(--color-primary)] text-white";
const CHIP_GRID = "grid grid-cols-2 gap-2";
const CHIP =
  "flex items-center justify-center gap-1.5 py-2 px-3 rounded-full border-2 border-gray-200 cursor-pointer transition-all text-xs sm:text-sm text-center min-h-[44px]";
const CHIP_CHECKED =
  "border-[var(--color-primary)] bg-[var(--color-light)] text-[var(--color-primary)] font-medium";

export interface VolumeCalculatorFormProps {
  initialVolume?: number | null;
  onSubmit: (volume: number) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export const VolumeCalculatorForm: React.FC<VolumeCalculatorFormProps> = ({
  initialVolume,
  onSubmit,
  isSubmitting: isSubmittingProp = false,
  error: externalError,
}) => {
  const [state, setState] = useState<VolumeCalculatorFormState>(defaultState);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const isSubmitting = isSubmittingProp || isSubmittingLocal;

  const update = useCallback(
    <K extends keyof VolumeCalculatorFormState>(
      key: K,
      value: VolumeCalculatorFormState[K],
    ) => {
      setState((s) => ({ ...s, [key]: value }));
      setLocalError(null);
    },
    [],
  );

  const toggleArray = useCallback(
    (key: "electromenager" | "annexes" | "objets", value: string) => {
      setState((s) => {
        const arr = s[key] as string[];
        const next = arr.includes(value)
          ? arr.filter((x) => x !== value)
          : [...arr, value];
        return { ...s, [key]: next };
      });
      setLocalError(null);
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const surfaceNum = parseFloat(state.surface) || 0;
      if (surfaceNum < 10 || surfaceNum > 500) {
        setLocalError(
          "Indiquez une surface entre 10 et 500 m² pour estimer le volume.",
        );
        return;
      }
      setLocalError(null);
      setIsSubmittingLocal(true);
      try {
        const input = formStateToEstimateInput(state);
        const result = await estimateVolumeAction(input);
        if (result.ok) {
          onSubmit(result.volume);
        } else {
          setLocalError(result.error);
        }
      } finally {
        setIsSubmittingLocal(false);
      }
    },
    [state, onSubmit],
  );

  const error = externalError ?? localError;

  return (
    <form onSubmit={handleSubmit} className="pb-4">
      <div className="text-center mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Estimation rapide du volume
        </h2>
        <p className="text-gray-600 text-sm">
          Répondez à quelques questions (moins de 30 secondes)
        </p>
      </div>

      {/* Surface et type */}
      <div className={SECTION_CLASS}>
        <h3 className={SECTION_TITLE_CLASS}>
          <span className="text-[var(--color-primary)]">•</span> Informations
          générales
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="calc-surface" className={LABEL_CLASS}>
              Surface (m²)
            </label>
            <input
              id="calc-surface"
              type="number"
              min={10}
              max={500}
              placeholder="Ex: 65"
              className={INPUT_CLASS}
              value={state.surface}
              onChange={(e) => update("surface", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="calc-logement" className={LABEL_CLASS}>
              Type de logement
            </label>
            <select
              id="calc-logement"
              className={SELECT_CLASS}
              value={state.logement_type}
              onChange={(e) =>
                update(
                  "logement_type",
                  e.target.value as VolumeCalculatorFormState["logement_type"],
                )
              }
            >
              <option value="appartement">Appartement</option>
              <option value="maison">Maison</option>
              <option value="studio">Studio</option>
            </select>
          </div>
        </div>
      </div>

      {/* Salon */}
      <div className={SECTION_CLASS}>
        <h3 className={SECTION_TITLE_CLASS}>
          <span className="text-[var(--color-primary)]">•</span> Niveau
          d&apos;ameublement du salon
        </h3>
        <div className={RADIO_GRID}>
          {(
            [
              { value: "leger", label: "Léger" },
              { value: "standard", label: "Standard" },
              { value: "charge", label: "Chargé" },
              { value: "tres_charge", label: "Très chargé" },
            ] as const
          ).map(({ value, label }) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name="salon"
                value={value}
                checked={state.salon === value}
                onChange={() => update("salon", value)}
                className="sr-only"
              />
              <span
                className={`${RADIO_OPTION} ${
                  state.salon === value ? RADIO_OPTION_CHECKED : ""
                }`}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Chambres */}
      <div className={SECTION_CLASS}>
        <h3 className={SECTION_TITLE_CLASS}>
          <span className="text-[var(--color-primary)]">•</span> Aménagement des
          chambres
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            [
              {
                key: "chambre1",
                label: "Chambre 1",
                options: ["vide", "standard", "chargee"] as const,
              },
              {
                key: "chambre2",
                label: "Chambre 2",
                options: ["aucune", "vide", "standard", "chargee"] as const,
              },
              {
                key: "chambre3",
                label: "Chambre 3",
                options: ["aucune", "vide", "standard", "chargee"] as const,
              },
              {
                key: "chambre4",
                label: "Chambre 4+",
                options: ["aucune", "vide", "standard", "chargee"] as const,
              },
            ] as const
          ).map(({ key, label, options }) => (
            <div key={key}>
              <label className={LABEL_CLASS}>{label}</label>
              <select
                className={SELECT_CLASS}
                value={state[key]}
                onChange={(e) =>
                  update(
                    key,
                    e.target.value as VolumeCalculatorFormState[typeof key],
                  )
                }
              >
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === "aucune"
                      ? "Aucune"
                      : opt === "vide"
                        ? "Vide / Bureau"
                        : opt === "chargee"
                          ? "Chargée"
                          : "Standard"}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Électroménager */}
      <div className={SECTION_CLASS}>
        <h3 className={SECTION_TITLE_CLASS}>
          <span className="text-[var(--color-primary)]">•</span> Électroménager
          lourd
        </h3>
        <div className={CHIP_GRID}>
          {[
            { id: "frigo_simple", label: "Frigo simple" },
            { id: "frigo_us", label: "Frigo américain" },
            { id: "machine", label: "Machine à laver" },
            { id: "sechelinge", label: "Sèche-linge" },
            { id: "lavevaisselle", label: "Lave-vaisselle" },
            { id: "four", label: "Four" },
            { id: "congelateur", label: "Congélateur" },
          ].map(({ id, label }) => (
            <label key={id} className="cursor-pointer">
              <input
                type="checkbox"
                checked={state.electromenager.includes(id)}
                onChange={() => toggleArray("electromenager", id)}
                className="sr-only"
              />
              <span
                className={`${CHIP} ${
                  state.electromenager.includes(id) ? CHIP_CHECKED : ""
                }`}
              >
                {state.electromenager.includes(id) && "✓ "}
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Espaces annexes */}
      <div className={SECTION_CLASS}>
        <h3 className={SECTION_TITLE_CLASS}>
          <span className="text-[var(--color-primary)]">•</span> Espaces annexes
        </h3>
        <div className={CHIP_GRID}>
          {[
            { id: "cave", label: "Cave" },
            { id: "garage", label: "Garage" },
            { id: "grenier", label: "Grenier" },
            { id: "abri", label: "Abri de jardin" },
            { id: "balcon", label: "Balcon/Terrasse" },
            { id: "veranda", label: "Véranda" },
          ].map(({ id, label }) => (
            <label key={id} className="cursor-pointer">
              <input
                type="checkbox"
                checked={state.annexes.includes(id)}
                onChange={() => toggleArray("annexes", id)}
                className="sr-only"
              />
              <span
                className={`${CHIP} ${
                  state.annexes.includes(id) ? CHIP_CHECKED : ""
                }`}
              >
                {state.annexes.includes(id) && "✓ "}
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Objets volumineux */}
      <div className={SECTION_CLASS}>
        <h3 className={SECTION_TITLE_CLASS}>
          <span className="text-[var(--color-primary)]">•</span> Objets
          volumineux supplémentaires
        </h3>
        <div className={CHIP_GRID}>
          {[
            { id: "canape2", label: "Canapé 2 places" },
            { id: "canape3", label: "Canapé 3 places" },
            { id: "angle", label: "Canapé d'angle" },
            { id: "piano_droit", label: "Piano droit" },
            { id: "piano_queue", label: "Piano à queue" },
            { id: "dressing", label: "Grand dressing" },
            { id: "billard", label: "Table de billard" },
            { id: "velo", label: "Vélos" },
          ].map(({ id, label }) => (
            <label key={id} className="cursor-pointer">
              <input
                type="checkbox"
                checked={state.objets.includes(id)}
                onChange={() => toggleArray("objets", id)}
                className="sr-only"
              />
              <span
                className={`${CHIP} ${
                  state.objets.includes(id) ? CHIP_CHECKED : ""
                }`}
              >
                {state.objets.includes(id) && "✓ "}
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {initialVolume != null && initialVolume > 0 && (
        <p className="text-sm text-gray-600 mb-4">
          Volume actuel dans le formulaire : <strong>{initialVolume} m³</strong>
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 rounded-xl font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? "Calcul en cours..." : "📊 Estimer le volume"}
      </button>
    </form>
  );
};
