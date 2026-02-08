/**
 * Logique serveur d'estimation de volume V3.
 * Utilisée uniquement côté serveur (server action) pour éviter toute manipulation client.
 * Précision cible : ±10 %, estimation en <30 secondes.
 */

export type FurnishingLevel = "LIGHT" | "STANDARD" | "FULL";
export type DensityLevel = "MINIMAL" | "STANDARD" | "DENSE" | "VERY_DENSE";

export interface EstimateInput {
  surface: number;
  livingRoomLevel?: FurnishingLevel;
  bedrooms: { level: FurnishingLevel }[];
  hasEquippedKitchen?: boolean;
  appliances?: {
    fridge?: "NONE" | "SIMPLE" | "AMERICAN";
    washingMachine?: boolean;
    dishwasher?: boolean;
    dryer?: boolean;
    oven?: boolean;
    freezer?: boolean;
  };
  specialItems?: {
    piano?: "NONE" | "UPRIGHT" | "GRAND";
    safe?: boolean;
    largeSofa?: boolean;
    bulkyFurniture?: boolean;
  };
  storage?: {
    cellar?: boolean;
    garage?: boolean;
  };
  density?: DensityLevel;
}

const VOLUME_TABLES = {
  LIVING_ROOM: {
    LIGHT: 8,
    STANDARD: 12,
    FULL: 16,
  },
  BEDROOM: {
    LIGHT: 6,
    STANDARD: 9,
    FULL: 12,
  },
  KITCHEN: 4,
  APPLIANCES: {
    FRIDGE_SIMPLE: 1,
    FRIDGE_AMERICAN: 2.5,
    WASHING_MACHINE: 0.6,
    DISHWASHER: 0.5,
    DRYER: 0.6,
    OVEN: 0.4,
    FREEZER: 1,
  },
  SPECIAL_ITEMS: {
    PIANO_UPRIGHT: 7,
    PIANO_GRAND: 14,
    SAFE: 3,
    LARGE_SOFA: 2,
    BULKY_FURNITURE: 4,
  },
  STORAGE: {
    CELLAR: 6,
    GARAGE: 10,
  },
} as const;

function getDensityCoefficient(level?: DensityLevel): number {
  switch (level) {
    case "MINIMAL":
      return 0.85;
    case "STANDARD":
      return 1.0;
    case "DENSE":
      return 1.2;
    case "VERY_DENSE":
      return 1.35;
    default:
      return 1.0;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Estime le volume de déménagement (m³) à partir des données du formulaire.
 * @throws Error si la surface est invalide (manquante ou <= 0)
 */
export function estimateVolumeV3(ctx: EstimateInput): number {
  if (!ctx.surface || ctx.surface <= 0) {
    throw new Error("Surface invalide");
  }

  // 1. Volume surface (méthode rapide)
  const surfaceVolume = ctx.surface * 0.45;

  // 2. Volume pièces
  let roomsVolume = 0;

  if (ctx.livingRoomLevel) {
    roomsVolume += VOLUME_TABLES.LIVING_ROOM[ctx.livingRoomLevel];
  }

  if (ctx.bedrooms?.length) {
    for (const bedroom of ctx.bedrooms) {
      roomsVolume += VOLUME_TABLES.BEDROOM[bedroom.level];
    }
  }

  if (ctx.hasEquippedKitchen) {
    roomsVolume += VOLUME_TABLES.KITCHEN;
  }

  // 3. Volume électroménager
  let appliancesVolume = 0;
  const appliances = ctx.appliances;

  if (appliances) {
    if (appliances.fridge === "SIMPLE") {
      appliancesVolume += VOLUME_TABLES.APPLIANCES.FRIDGE_SIMPLE;
    }
    if (appliances.fridge === "AMERICAN") {
      appliancesVolume += VOLUME_TABLES.APPLIANCES.FRIDGE_AMERICAN;
    }
    if (appliances.washingMachine) {
      appliancesVolume += VOLUME_TABLES.APPLIANCES.WASHING_MACHINE;
    }
    if (appliances.dishwasher) {
      appliancesVolume += VOLUME_TABLES.APPLIANCES.DISHWASHER;
    }
    if (appliances.dryer) {
      appliancesVolume += VOLUME_TABLES.APPLIANCES.DRYER;
    }
    if (appliances.oven) {
      appliancesVolume += VOLUME_TABLES.APPLIANCES.OVEN;
    }
    if (appliances.freezer) {
      appliancesVolume += VOLUME_TABLES.APPLIANCES.FREEZER;
    }
  }

  // 4. Objets spéciaux
  let specialItemsVolume = 0;
  const special = ctx.specialItems;

  if (special) {
    if (special.piano === "UPRIGHT") {
      specialItemsVolume += VOLUME_TABLES.SPECIAL_ITEMS.PIANO_UPRIGHT;
    }
    if (special.piano === "GRAND") {
      specialItemsVolume += VOLUME_TABLES.SPECIAL_ITEMS.PIANO_GRAND;
    }
    if (special.safe) {
      specialItemsVolume += VOLUME_TABLES.SPECIAL_ITEMS.SAFE;
    }
    if (special.largeSofa) {
      specialItemsVolume += VOLUME_TABLES.SPECIAL_ITEMS.LARGE_SOFA;
    }
    if (special.bulkyFurniture) {
      specialItemsVolume += VOLUME_TABLES.SPECIAL_ITEMS.BULKY_FURNITURE;
    }
  }

  // 5. Cave / garage
  let storageVolume = 0;
  if (ctx.storage?.cellar) {
    storageVolume += VOLUME_TABLES.STORAGE.CELLAR;
  }
  if (ctx.storage?.garage) {
    storageVolume += VOLUME_TABLES.STORAGE.GARAGE;
  }

  // 6. Volume objets total
  const objectsVolume = appliancesVolume + specialItemsVolume + storageVolume;

  // 7. Moyenne pondérée
  let base = surfaceVolume * 0.4 + roomsVolume * 0.4 + objectsVolume * 0.2;

  // 8. Coefficient comportemental
  base *= getDensityCoefficient(ctx.density);

  // 9. Foisonnement (emballage + vide camion)
  base *= 1.12;

  // 10. Bornes réalistes
  const min = ctx.surface * 0.25;
  const max = ctx.surface * 0.8;
  const finalVolume = clamp(base, min, max);

  // 11. Arrondi professionnel
  return Math.round(finalVolume * 10) / 10;
}
