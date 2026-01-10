/**
 * Utilitaire pour normaliser la structure des données de devis
 * Évite les problèmes de structure imbriquée incohérente
 */

export interface NormalizedQuoteData {
    serviceType: string;
    packId?: string;
    workers?: number;
    distance?: number;
    duration?: number;
    volume?: number;
    basePrice?: number;
    totalPrice?: number;
    calculatedPrice?: number;
    __presetSnapshot?: {
        workers: number;
        distance: number;
        duration: number;
        promotionCode: string | null;
        promotionValue: number;
        promotionType: string | null;
        isPromotionActive: boolean;
    };
    [key: string]: any;
}

/**
 * Normalise la structure des données de devis pour éviter les imbrications incohérentes
 */
export function normalizeQuoteData(data: Record<string, any>): NormalizedQuoteData {
    // Extraire les données de base
    const normalized: NormalizedQuoteData = {
        serviceType: data.serviceType || data.type || 'PACKING'
    };

    // ✅ CORRECTION : Extraire les données sans créer de structure imbriquée
    const quoteData = data.quoteData || data;
    
    // Copier TOUTES les propriétés de quoteData directement (sauf quoteData pour éviter la récursion)
    Object.keys(quoteData).forEach(key => {
        if (key !== 'quoteData') {
            normalized[key] = quoteData[key];
        }
    });

    // Normaliser le __presetSnapshot
    const presetSnapshot = data.__presetSnapshot || 
                          quoteData.__presetSnapshot;

    if (presetSnapshot) {
        normalized.__presetSnapshot = {
            workers: presetSnapshot.workers || 2,
            distance: presetSnapshot.distance || 20,
            duration: presetSnapshot.duration || 1,
            promotionCode: presetSnapshot.promotionCode || null,
            promotionValue: presetSnapshot.promotionValue || 0,
            promotionType: presetSnapshot.promotionType || null,
            isPromotionActive: presetSnapshot.isPromotionActive || false
        };
    }

    return normalized;
}

/**
 * Extrait le __presetSnapshot depuis n'importe quelle structure de données
 */
export function extractPresetSnapshot(data: Record<string, any>): any {
    return data.__presetSnapshot || 
           data.quoteData?.__presetSnapshot || 
           data.quoteData?.quoteData?.__presetSnapshot;
}

/**
 * Vérifie si les données ont une structure normalisée
 */
export function isNormalized(data: Record<string, any>): boolean {
    return !data.quoteData?.quoteData && !data.quoteData?.__presetSnapshot;
}
