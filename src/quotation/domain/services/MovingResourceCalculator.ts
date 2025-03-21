export class MovingResourceCalculator {
    /**
     * Calcule le nombre de déménageurs nécessaires en fonction du volume
     * @param volume Volume en m³
     * @returns Nombre de déménageurs
     */
    public calculateRequiredMovers(volume: number): number {
        if (volume <= 20) {
            return 2; // Équipe minimale pour petits volumes
        } else if (volume <= 40) {
            return 3; // Équipe moyenne pour volumes moyens
        } else {
            return 4; // Grande équipe pour gros volumes
        }
    }

    /**
     * Calcule le nombre approximatif de cartons nécessaires en fonction du volume
     * En moyenne, on compte environ 2 cartons par m³
     * @param volume Volume en m³
     * @returns Nombre de cartons estimé
     */
    public calculateEstimatedBoxes(volume: number): number {
        return Math.ceil(volume * 2);
    }
} 