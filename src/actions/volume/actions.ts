"use server";

import type { EstimateInput } from "./estimateVolumeV3";
import { estimateVolumeV3 } from "./estimateVolumeV3";

const VOLUME_MIN = 5;
const VOLUME_MAX = 200;
const SURFACE_MIN = 10;
const SURFACE_MAX = 500;

export type EstimateVolumeResult =
  | { ok: true; volume: number }
  | { ok: false; error: string };

/**
 * Action serveur : calcule le volume estimé à partir des données du formulaire.
 * Le calcul est exécuté uniquement côté serveur pour éviter toute manipulation client.
 */
export async function estimateVolumeAction(
  input: EstimateInput,
): Promise<EstimateVolumeResult> {
  try {
    const surface = Number(input.surface);
    if (
      Number.isNaN(surface) ||
      surface < SURFACE_MIN ||
      surface > SURFACE_MAX
    ) {
      return {
        ok: false,
        error: `Surface invalide. Indiquez une surface entre ${SURFACE_MIN} et ${SURFACE_MAX} m².`,
      };
    }

    const normalizedInput: EstimateInput = {
      ...input,
      surface,
      bedrooms: Array.isArray(input.bedrooms) ? input.bedrooms : [],
    };

    let volume = estimateVolumeV3(normalizedInput);

    volume = Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, volume));

    return { ok: true, volume };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur lors du calcul du volume.";
    return { ok: false, error: message };
  }
}
