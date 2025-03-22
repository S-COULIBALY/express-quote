'use server'

import { getTripCostsFromToolguru } from './callApi'
import type { MovingFormData } from '@/types/quote'

type PropertyType = 'apartment' | 'house' | 'office';

// Volumes moyens par type de propriété (en m³ par m²)
const PROPERTY_VOLUME_RATES: Record<PropertyType, number> = {
  apartment: 0.25,  // Un appartement a généralement moins de meubles par m²
  house: 0.3,      // Une maison a souvent plus de meubles et d'équipements
  office: 0.2      // Un bureau a typiquement moins de volume par m²
}

// Volume moyen par pièce (en m³)
const ROOM_VOLUME = {
  livingRoom: 20,    // Salon
  bedroom: 15,       // Chambre
  kitchen: 12,       // Cuisine
  bathroom: 5,       // Salle de bain
  office: 8,        // Bureau/Pièce supplémentaire
  basement: 10      // Cave/Garage
}

// Volume moyen par occupant (en m³)
const OCCUPANT_VOLUME = 8  // Volume supplémentaire par occupant

// Taux de base selon le volume
const MOVING_RATES: Record<string, { perKm: number; perM3: number }> = {
  small: { perKm: 1.5, perM3: 40 },    // < 20m³
  medium: { perKm: 2.0, perM3: 50 },   // 20-50m³
  large: { perKm: 2.5, perM3: 60 }     // > 50m³
}

// Coûts des services additionnels
const MOVING_SERVICES = {
  packaging: { cost: 200, type: 'fixed' as const },
  furniture: { cost: 150, type: 'fixed' as const },
  fragile: { cost: 0.1, type: 'percent' as const },
  storage: { cost: 300, type: 'fixed' as const },
  heavyLifting: { cost: 100, type: 'fixed' as const },
  basement: { cost: 80, type: 'fixed' as const },
  cleaning: { cost: 150, type: 'fixed' as const }
}

// Coûts supplémentaires pour les étages
const FLOOR_COSTS = {
  withoutElevator: 50,  // par étage
  withElevator: 20      // par étage
}

// Coûts supplémentaires pour la distance de portage
const CARRY_DISTANCE_COSTS = {
  base: 0,              // 0-10m inclus
  additional: 2         // par mètre au-delà de 10m
}

// Coefficients selon le jour de la semaine
const WEEKDAY_RATES: Record<string, number> = {
  monday: 1.0,
  tuesday: 1.0,
  wednesday: 1.0,
  thursday: 1.0,
  friday: 1.1,    // +10% le vendredi
  saturday: 1.2,  // +20% le samedi
  sunday: 1.5     // +50% le dimanche
}

// Coefficients selon le mois
const MONTH_RATES: Record<string, number> = {
  january: 0.9,   // -10% en janvier (basse saison)
  february: 0.9,
  march: 1.0,
  april: 1.0,
  may: 1.2,      // +20% en mai (haute saison)
  june: 1.3,     // +30% en juin (très haute saison)
  july: 1.4,     // +40% en juillet (pic de saison)
  august: 1.4,   // +40% en août (pic de saison)
  september: 1.2, // +20% en septembre
  october: 1.0,
  november: 0.9,
  december: 0.9
}

// Fonction pour estimer le volume en fonction des caractéristiques du logement
function estimateVolume(formData: MovingFormData): number {
  const {
    propertyType,
    surface,
    rooms,
    occupants
  } = formData

  // Calcul de base selon la surface et le type de propriété
  const surfaceNum = parseFloat(surface) || 0
  const baseVolume = surfaceNum * (PROPERTY_VOLUME_RATES[propertyType as PropertyType] || PROPERTY_VOLUME_RATES.apartment)

  // Ajout du volume par pièce
  const roomsNum = parseInt(rooms) || 0
  const roomVolume = roomsNum * ROOM_VOLUME.bedroom // On considère une moyenne par pièce

  // Ajout du volume par occupant
  const occupantsNum = parseInt(occupants) || 0
  const occupantVolume = occupantsNum * OCCUPANT_VOLUME

  // Volume total estimé
  const estimatedVolume = baseVolume + roomVolume + occupantVolume

  // Si l'utilisateur a spécifié un volume, on prend le plus grand des deux
  const userVolume = parseFloat(formData.volume) || 0
  return Math.max(estimatedVolume, userVolume)
}

export async function calculateMovingQuote(formData: MovingFormData) {
  const { 
    pickupAddress, 
    deliveryAddress, 
    options,
    pickupFloor,
    pickupElevator,
    deliveryFloor,
    deliveryElevator,
    pickupCarryDistance,
    deliveryCarryDistance,
    movingDate
  } = formData

  // Calculer le volume estimé
  const volumeNum = estimateVolume(formData)
  console.log('Volume estimé:', volumeNum, 'm³')
  
  // Récupérer les coûts de trajet
  console.log('Calcul des coûts de trajet pour:', { pickupAddress, deliveryAddress })
  let tripCosts
  try {
    tripCosts = await getTripCostsFromToolguru(pickupAddress, deliveryAddress)
    console.log('Coûts de trajet obtenus:', tripCosts)
  } catch (error) {
    console.error('Erreur lors du calcul des coûts de trajet:', error)
    // Utiliser des estimations par défaut en cas d'erreur
    const estimatedDistance = 0 // À remplacer par une estimation basée sur le code postal
    tripCosts = {
      distance: estimatedDistance,
      tollCost: Math.round(estimatedDistance * 0.07), // ~0.07€/km pour les péages
      fuelCost: Math.round(estimatedDistance * 0.12)  // ~0.12€/km pour le carburant
    }
    console.log('Utilisation des coûts estimés:', tripCosts)
  }
  
  // Déterminer la catégorie de tarif selon le volume
  let rateCategory = 'medium'
  if (volumeNum < 20) rateCategory = 'small'
  if (volumeNum > 50) rateCategory = 'large'
  
  const rate = MOVING_RATES[rateCategory]
  console.log('Catégorie de tarif:', rateCategory, 'avec taux:', rate)

  // Appliquer les coefficients temporels
  const moveDate = new Date(movingDate)
  const weekday = moveDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const month = moveDate.toLocaleDateString('en-US', { month: 'long' }).toLowerCase()
  
  const weekdayMultiplier = WEEKDAY_RATES[weekday] || 1.0
  const monthMultiplier = MONTH_RATES[month] || 1.0

  // Calculer le coût de base avec les multiplicateurs temporels
  let baseCost = (volumeNum * rate.perM3 + tripCosts.distance * rate.perKm) * weekdayMultiplier * monthMultiplier
  console.log('Calcul du coût de base:', {
    volumeCost: volumeNum * rate.perM3,
    distanceCost: tripCosts.distance * rate.perKm,
    weekdayMultiplier,
    monthMultiplier,
    totalBaseCost: baseCost
  })

  // Ajouter les coûts d'étage
  const pickupFloorNum = parseInt(pickupFloor) || 0
  const deliveryFloorNum = parseInt(deliveryFloor) || 0
  
  const floorCost = 
    (pickupFloorNum * (pickupElevator === 'yes' ? FLOOR_COSTS.withElevator : FLOOR_COSTS.withoutElevator)) +
    (deliveryFloorNum * (deliveryElevator === 'yes' ? FLOOR_COSTS.withElevator : FLOOR_COSTS.withoutElevator))

  // Ajouter les coûts de portage
  const pickupCarryDistanceNum = parseInt(pickupCarryDistance) || 0
  const deliveryCarryDistanceNum = parseInt(deliveryCarryDistance) || 0
  
  const carryDistanceCost = 
    (Math.max(0, pickupCarryDistanceNum - 10) * CARRY_DISTANCE_COSTS.additional) +
    (Math.max(0, deliveryCarryDistanceNum - 10) * CARRY_DISTANCE_COSTS.additional)

  // Calculer les coûts des options
  const optionsCost = calculateOptionsCost(volumeNum, baseCost, options)

  // Coût total
  const totalCost = baseCost + optionsCost + floorCost + carryDistanceCost + tripCosts.tollCost + tripCosts.fuelCost

  return {
    estimatedVolume: volumeNum,
    distance: tripCosts.distance,
    tollCost: tripCosts.tollCost,
    fuelCost: tripCosts.fuelCost,
    baseCost,
    floorCost,
    carryDistanceCost,
    optionsCost,
    totalCost
  }
}

const calculateOptionsCost = (volume: number, totalBaseCost: number, options: MovingFormData['options']) => {
  let optionsCost = 0

  // Vérifier si options existe
  if (!options) return 0

  // Calcul pour chaque option activée
  if (options.packaging) {
    optionsCost += MOVING_SERVICES.packaging.cost
  }
  
  if (options.furniture) {
    optionsCost += MOVING_SERVICES.furniture.cost
  }
  
  if (options.fragile) {
    // Assurance basée sur le pourcentage du coût de base
    optionsCost += totalBaseCost * MOVING_SERVICES.fragile.cost
  }
  
  if (options.storage) {
    optionsCost += MOVING_SERVICES.storage.cost
  }

  return optionsCost
} 