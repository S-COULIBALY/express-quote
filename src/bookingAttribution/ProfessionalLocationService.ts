/**
 * Service pour la gestion géographique des professionnels
 * Utilise l'API Google Maps existante pour les calculs de distance
 */

import { PrismaClient } from '@prisma/client';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { getDistanceFromGoogleMaps } from '@/actions/callApi';
import { PROFESSIONAL_DEFAULT_SEARCH_RADIUS_KM } from '@/config/attribution';

export interface LocationFilter {
  serviceType: ServiceType;
  serviceLatitude: number;
  serviceLongitude: number;
  maxDistanceKm?: number;
  excludedProfessionalIds?: string[];
}

export interface EligibleProfessional {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  city: string;
  address: string;
}

export class ProfessionalLocationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Trouve tous les professionnels éligibles dans un rayon donné
   */
  async findEligibleProfessionals(filter: LocationFilter): Promise<EligibleProfessional[]> {
    const {
      serviceType,
      serviceLatitude,
      serviceLongitude,
      maxDistanceKm = PROFESSIONAL_DEFAULT_SEARCH_RADIUS_KM,
      excludedProfessionalIds = []
    } = filter;

    console.log(`🔍 Recherche professionnels pour ${serviceType} dans rayon ${maxDistanceKm}km`);

    // 1. Récupérer tous les professionnels actifs avec coordonnées
    const professionals = await this.prisma.professional.findMany({
      where: {
        verified: true,
        is_available: true,
        latitude: { not: null },
        longitude: { not: null },
        address: { not: null },
        id: excludedProfessionalIds.length > 0 ? {
          notIn: excludedProfessionalIds
        } : undefined
      },
      select: {
        id: true,
        companyName: true,
        email: true,
        phone: true,
        latitude: true,
        longitude: true,
        city: true,
        address: true,
        service_types: true,
        max_distance_km: true
      }
    });

    console.log(`📍 ${professionals.length} professionnels trouvés en base`);

    // 2. Filtrer par type de service et calculer les distances
    const eligibleProfessionals: EligibleProfessional[] = [];

    for (const prof of professionals) {
      try {
        // Vérifier si le professionnel gère ce type de service
        const serviceTypes = Array.isArray(prof.service_types) ? prof.service_types : [];
        if (!serviceTypes.includes(serviceType)) {
          continue;
        }

        // Calculer la distance géodésique (approximation rapide)
        const geodesicDistance = this.calculateGeodeticDistance(
          serviceLatitude,
          serviceLongitude,
          prof.latitude!,
          prof.longitude!
        );

        // Filtrage initial par distance géodésique (plus rapide)
        const profMaxDistance = Math.min(maxDistanceKm, prof.max_distance_km || maxDistanceKm);
        if (geodesicDistance > profMaxDistance) {
          continue;
        }

        // Pour les professionnels dans le rayon géodésique, utiliser Google Maps pour la distance réelle
        let realDistance = geodesicDistance;
        
        // Note: Pour optimiser les appels API, on peut utiliser la distance géodésique
        // et n'appeler Google Maps que pour les plus proches ou en cas de doute
        if (geodesicDistance <= profMaxDistance * 0.8) { // Marge de sécurité
          try {
            const serviceAddress = await this.getAddressFromCoordinates(serviceLatitude, serviceLongitude);
            if (serviceAddress && prof.address) {
              realDistance = await getDistanceFromGoogleMaps(prof.address, serviceAddress);
            }
          } catch (error) {
            console.warn(`⚠️ Erreur calcul distance Google Maps pour ${prof.companyName}:`, error);
            // Fallback sur distance géodésique
            realDistance = geodesicDistance;
          }
        }

        // Vérification finale avec la distance réelle
        if (realDistance <= profMaxDistance) {
          eligibleProfessionals.push({
            id: prof.id,
            companyName: prof.companyName,
            email: prof.email,
            phone: prof.phone,
            latitude: prof.latitude!,
            longitude: prof.longitude!,
            distanceKm: Math.round(realDistance * 10) / 10,
            city: prof.city || 'Non spécifié',
            address: prof.address!
          });
        }

      } catch (error) {
        console.error(`❌ Erreur traitement professionnel ${prof.companyName}:`, error);
        continue;
      }
    }

    // 3. Trier par distance croissante
    const sortedProfessionals = eligibleProfessionals.sort((a, b) => a.distanceKm - b.distanceKm);
    
    console.log(`✅ ${sortedProfessionals.length} professionnels éligibles trouvés`);
    
    return sortedProfessionals;
  }

  /**
   * Calcule la distance géodésique entre deux points (approximation rapide)
   * Utilise la formule Haversine
   */
  private calculateGeodeticDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convertit des coordonnées en adresse (reverse geocoding)
   * Utilise l'API Google Geocoding
   */
  private async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return `${latitude},${longitude}`;
      }

      const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&region=fr`;
      const response = await fetch(geocodingUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }

      return `${latitude},${longitude}`;
    } catch (error) {
      console.error('❌ Erreur reverse geocoding:', error);
      return `${latitude},${longitude}`;
    }
  }

  /**
   * Vérifie si des coordonnées sont dans un rayon de 50km autour de Paris (centre: 48.8566, 2.3522)
   */
  isWithinParisRadius(latitude: number, longitude: number, maxDistanceKm: number = 50): boolean {
    const PARIS_CENTER = { latitude: 48.8566, longitude: 2.3522 };
    const distance = this.calculateGeodeticDistance(
      PARIS_CENTER.latitude,
      PARIS_CENTER.longitude,
      latitude,
      longitude
    );
    return distance <= maxDistanceKm;
  }

  /**
   * Met à jour les coordonnées d'un professionnel
   */
  async updateProfessionalCoordinates(professionalId: string, latitude: number, longitude: number): Promise<void> {
    await this.prisma.professional.update({
      where: { id: professionalId },
      data: {
        latitude,
        longitude
      }
    });
  }

  /**
   * Géocode une adresse pour obtenir les coordonnées
   * Utilise l'API Google Geocoding
   */
  async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      // Vérifier que l'API key est configurée
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('⚠️ GOOGLE_MAPS_API_KEY non configurée, géocodage impossible');
        return null;
      }

      // Appeler l'API Google Geocoding
      const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&region=fr`;
      
      const response = await fetch(geocodingUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const coordinates = {
          latitude: location.lat,
          longitude: location.lng
        };
        
        console.log(`✅ Adresse géocodée: ${address} → (${coordinates.latitude}, ${coordinates.longitude})`);
        return coordinates;
      }

      console.warn(`⚠️ Géocodage échoué pour adresse: ${address}, status: ${data.status}`);
      return null;
    } catch (error) {
      console.error('❌ Erreur géocodage:', error);
      return null;
    }
  }

  /**
   * Vérifie si un professionnel est dans la zone de service
   */
  async isProfessionalInServiceArea(
    professionalId: string, 
    serviceLatitude: number, 
    serviceLongitude: number,
    maxDistanceKm: number = 100
  ): Promise<boolean> {
    const professional = await this.prisma.professional.findUnique({
      where: { id: professionalId },
      select: {
        latitude: true,
        longitude: true,
        max_distance_km: true,
        verified: true,
        is_available: true
      }
    });

    if (!professional || !professional.verified || !professional.is_available) {
      return false;
    }

    if (!professional.latitude || !professional.longitude) {
      return false;
    }

    const distance = this.calculateGeodeticDistance(
      serviceLatitude,
      serviceLongitude,
      professional.latitude,
      professional.longitude
    );

    const effectiveMaxDistance = Math.min(maxDistanceKm, professional.max_distance_km || maxDistanceKm);
    
    return distance <= effectiveMaxDistance;
  }

  /**
   * Récupère les zones de service populaires
   */
  async getPopularServiceAreas(): Promise<Array<{ city: string; count: number }>> {
    const result = await this.prisma.professional.groupBy({
      by: ['city'],
      where: {
        verified: true,
        is_available: true,
        city: { not: null }
      },
      _count: {
        city: true
      },
      orderBy: {
        _count: {
          city: 'desc'
        }
      },
      take: 20
    });

    return result.map(item => ({
      city: item.city || 'Non spécifié',
      count: item._count?.city || 0
    }));
  }
}