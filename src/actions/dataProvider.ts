'use server'

import { mockPacks, mockServices } from '@/data/mockData';
import { Pack, Service } from '@/types/booking';

// Fonction pour récupérer tous les packs disponibles
export async function getAllPacks(): Promise<Pack[]> {
  return mockPacks;
}

// Fonction pour récupérer un pack spécifique par ID
export async function getPackById(id: string): Promise<Pack | undefined> {
  return mockPacks.find(pack => pack.id === id);
}

// Fonction pour récupérer tous les services disponibles
export async function getAllServices(): Promise<Service[]> {
  return mockServices;
}

// Fonction pour récupérer un service spécifique par ID
export async function getServiceById(id: string): Promise<Service | undefined> {
  return mockServices.find(service => service.id === id);
}

// Fonction pour vérifier si un pack est disponible à une date donnée
export async function isPackAvailable(packId: string, date: Date): Promise<boolean> {
  // Cette fonction pourrait vérifier la disponibilité réelle dans une base de données
  // Pour le moment, nous simulons toujours une disponibilité
  return true;
}

// Fonction pour vérifier si un service est disponible à une date donnée
export async function isServiceAvailable(serviceId: string, date: Date): Promise<boolean> {
  // Cette fonction pourrait vérifier la disponibilité réelle dans une base de données
  // Pour le moment, nous simulons toujours une disponibilité
  return true;
} 